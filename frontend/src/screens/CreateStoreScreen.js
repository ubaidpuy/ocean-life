import React, { useState, useEffect } from 'react'
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import Meta from '../components/Meta'
import axios from '../utils/axiosConfig'

const CreateStoreScreen = () => {
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  const history = useHistory()
  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  // Check authentication only (no Connect account required before store creation)
  useEffect(() => {
    if (!userInfo) {
      history.push('/login?redirect=/create-store')
      return
    }
    // No need to check Connect account - that happens AFTER store creation
  }, [userInfo, history])

  // Handle payment verification on return from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const stripeSuccess = urlParams.get('success')
    const stripeCancel = urlParams.get('cancel')
    const sessionId = urlParams.get('session_id')
    const urlName = urlParams.get('name')
    const urlSubdomain = urlParams.get('subdomain')

    if (stripeSuccess === 'true' && sessionId && urlName && urlSubdomain) {
      // Payment was successful, verify and create store
      const verifyPayment = async () => {
        try {
          setLoadingPayment(true)
          
          // Get token from localStorage (userInfo might not be loaded yet after Stripe redirect)
          const storedUserInfo = localStorage.getItem('userInfo')
          if (!storedUserInfo) {
            setMessage('Authentication error. Please login again.')
            setLoadingPayment(false)
            setTimeout(() => {
              history.push('/login?redirect=/create-store')
            }, 2000)
            return
          }
          
          const parsedUserInfo = JSON.parse(storedUserInfo)
          const config = {
            headers: {
              Authorization: `Bearer ${parsedUserInfo.token}`,
            },
          }

          const { data } = await axios.get(
            `/api/stores/verify-payment?session_id=${sessionId}&name=${encodeURIComponent(urlName)}&subdomain=${encodeURIComponent(urlSubdomain)}`,
            config
          )

          if (data.verified && data.store) {
            // Store created successfully, redirect to store subdomain for Stripe Connect setup
            // User is already logged in (token in localStorage), so they'll remain authenticated after redirect
            
            // Check localStorage directly (Redux might not have initialized yet after Stripe redirect)
            const storedUserInfo = localStorage.getItem('userInfo')
            if (!storedUserInfo) {
              setMessage('Authentication error. Please login again.')
              setLoadingPayment(false)
              setTimeout(() => {
                history.push('/login?redirect=/create-store')
              }, 2000)
              return
            }
            
            // Construct store subdomain URL
            const protocol = window.location.protocol
            const hostname = window.location.hostname
            const port = window.location.port ? `:${window.location.port}` : ''
            
            let storeUrl = ''
            // Handle localhost subdomains (e.g., fraz.localhost:3000)
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              storeUrl = `${protocol}//${data.store.subdomain}.localhost${port}`
            } else if (hostname.includes('.localhost')) {
              // Already on a subdomain, extract base domain
              storeUrl = `${protocol}//${data.store.subdomain}.localhost${port}`
            } else if (hostname.includes('.myapp.local')) {
              // Handle myapp.local domain structure
              const parts = hostname.split('.')
              const baseDomain = parts.slice(-2).join('.')
              storeUrl = `${protocol}//${data.store.subdomain}.${baseDomain}${port}`
            } else {
              // Default: assume localhost subdomain
              storeUrl = `${protocol}//${data.store.subdomain}.localhost${port}`
            }
            
            // Redirect to Stripe Connect Setup on store subdomain
            // Pass token to maintain session across subdomains
            const token = userInfo.token || parsedUserInfo.token;
            const redirectUrl = `${storeUrl}/connect/setup?next=subscription&newStore=true&token=${token}`
            console.log('Redirecting to:', redirectUrl) // Debug log
            window.location.href = redirectUrl
          }
        } catch (error) {
          console.error('Error verifying payment:', error)
          setMessage(error.response?.data?.message || 'Error verifying payment. Please contact support.')
        } finally {
          setLoadingPayment(false)
        }
      }
      verifyPayment()
    }

    if (stripeCancel === 'true') {
      // User cancelled payment, restore form values
      if (urlName) setName(decodeURIComponent(urlName))
      if (urlSubdomain) setSubdomain(decodeURIComponent(urlSubdomain))
      setMessage('Payment was cancelled. Please try again.')
      // Clean up URL
      window.history.replaceState({}, document.title, '/create-store')
    }
  }, [userInfo])

  // Removed checkConnectAccount - Connect setup happens AFTER store creation

  const submitHandler = async (e) => {
    e.preventDefault()
    setMessage(null)
    
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
      setMessage('Subdomain can only contain lowercase letters, numbers, and hyphens')
      return
    }

    if (subdomain.length < 3) {
      setMessage('Subdomain must be at least 3 characters long')
      return
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address')
      return
    }

    if (!userInfo || !userInfo.token) {
      setMessage('Please log in to create a store')
      history.push('/login?redirect=/create-store')
      return
    }

    try {
      setLoadingPayment(true)
      // Create Stripe checkout session (with auth token)
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }
      const { data } = await axios.post(
        '/api/stores/payment-checkout',
        {
          name,
          subdomain: subdomain.toLowerCase(),
          email: email || userInfo.email,
        },
        config
      )

      if (data && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error('Failed to create payment session')
      }
    } catch (error) {
      console.error('Error creating payment session:', error)
      setMessage(error.response?.data?.message || 'Error initiating payment. Please try again.')
      setLoadingPayment(false)
    }
  }

  // Show loading if checking auth
  if (!userInfo) {
    return <Loader />
  }

  return (
    <FormContainer>
      <Meta title='Create Your Store' />
      <h1>Create Your Store</h1>
      <p className='text-muted mb-4'>
        Welcome, {userInfo.name}! To get started, first pay the one-time store creation fee of $29.99. After payment and store creation, you'll set up your Stripe Connect account to receive customer payments, then activate your monthly subscription.
      </p>
      
      {message && <Message variant={message.includes('Error') ? 'danger' : 'info'}>{message}</Message>}
      {loadingPayment && <Loader />}
      
      <Card>
        <Card.Body>
          <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
              <Form.Label>Store Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter store name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loadingPayment}
              />
            </Form.Group>

            <Form.Group controlId='subdomain'>
              <Form.Label>Subdomain</Form.Label>
              <Form.Control
                type='text'
                placeholder='my-store'
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                required
                disabled={loadingPayment}
              />
              <Form.Text className='text-muted'>
                Your store will be accessible at:{' '}
                {subdomain
                  ? (() => {
                      const hostname = window.location.hostname
                      if (hostname.includes('.myapp.local')) {
                        const parts = hostname.split('.')
                        const baseDomain = parts.slice(-2).join('.')
                        return `${subdomain}.${baseDomain}`
                      }
                      return `${subdomain}.${hostname}`
                    })()
                  : 'your-subdomain.myapp.local'}
              </Form.Text>
            </Form.Group>

            <Form.Group controlId='email'>
              <Form.Label>Email Address (Optional)</Form.Label>
              <Form.Control
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingPayment}
              />
              <Form.Text className='text-muted'>
                We'll send your payment receipt to this email
              </Form.Text>
            </Form.Group>

            <Alert variant='info' className='mt-3'>
              <strong>Next Steps:</strong> After payment and store creation, you'll set up your Stripe Connect account to receive customer payments, then activate your monthly subscription.
            </Alert>

            <div className='mt-4 p-3 bg-light rounded'>
              <Row>
                <Col>
                  <strong>Store Creation Fee:</strong>
                </Col>
                <Col className='text-right'>
                  <strong>$29.99</strong>
                </Col>
              </Row>
            </div>

            <Button 
              type='submit' 
              variant='primary' 
              className='btn-block mt-3'
              disabled={loadingPayment}
            >
              {loadingPayment ? (
                <>
                  <span className='spinner-border spinner-border-sm mr-2' role='status' aria-hidden='true'></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className='fas fa-credit-card mr-2'></i>
                  Continue to Payment
                </>
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </FormContainer>
  )
}

export default CreateStoreScreen
