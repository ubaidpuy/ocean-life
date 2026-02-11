import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Button, Alert, Spinner, ListGroup } from 'react-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import Meta from '../components/Meta'
import axios from '../utils/axiosConfig'

const ConnectSetupScreen = ({ history, location }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [connectStatus, setConnectStatus] = useState(null)

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    // User should be logged in (token persists in localStorage across subdomain redirects)
    // After store creation payment, user is redirected here and should remain authenticated
    
    // Get userInfo from Redux or localStorage
    let currentUserInfo = userInfo
    
    // Check for token in URL (passed from cross-domain redirect)
    const urlParams = new URLSearchParams(location.search)
    const tokenFromUrl = urlParams.get('token')
    
    if (tokenFromUrl && !currentUserInfo) {
      // Trying to authenticate via URL token
      // We need to fetch user profile to get full user object
      // We'll do this in a separate async operation, but for now we can't block render
      // So we'll trigger a fetch
      const fetchUser = async () => {
         try {
             const config = {
                 headers: {
                     Authorization: `Bearer ${tokenFromUrl}`,
                 },
             }
             const { data } = await axios.get('/api/users/profile', config)
             
             // Update Redux and LocalStorage
             const userWithToken = { ...data, token: tokenFromUrl }
             dispatch({
                 type: 'USER_LOGIN_SUCCESS',
                 payload: userWithToken
             })
             localStorage.setItem('userInfo', JSON.stringify(userWithToken))
             
             // Clean URL
             const newUrl = window.location.href.replace(`&token=${tokenFromUrl}`, '').replace(`?token=${tokenFromUrl}`, '')
             window.history.replaceState({}, document.title, newUrl)
             
             // Reload to apply state
             window.location.reload()
         } catch (err) {
             console.error('Error fetching user from token:', err)
             // If failed, redirect to login
             history.push('/login')
         }
      }
      fetchUser()
      return // Wait for fetch/reload
    }

    if (!currentUserInfo) {
      // Redux might not have initialized yet after redirect, check localStorage
      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        try {
          currentUserInfo = JSON.parse(storedUserInfo)
        } catch (error) {
          console.error('Error parsing userInfo from localStorage:', error)
        }
      }
    }
    
    if (!currentUserInfo || !currentUserInfo.token) {
      // No userInfo found, redirect to login
      const urlParams = new URLSearchParams(location.search)
      const next = urlParams.get('next') || 'subscription'
      const newStore = urlParams.get('newStore')
      const redirectPath = `/connect/setup${newStore ? `?next=${next}&newStore=true` : `?next=${next}`}`
      history.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    // Refresh profile to ensure we have latest admin status
    // OR if we just logged in via token from URL
    if (!currentUserInfo.isAdmin) {
        const refreshProfile = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${currentUserInfo.token}`,
                    },
                }
                const { data } = await axios.get('/api/users/profile', config)
                
                // Update local var and storage
                const updatedUser = { ...data, token: currentUserInfo.token }
                localStorage.setItem('userInfo', JSON.stringify(updatedUser))
                
                // If this fixed admin status, we can proceed
                // Dispatch/reload might be cleaner but for now just update storage
                 if (data.isAdmin) {
                     // Update Redux
                     dispatch({
                         type: 'USER_LOGIN_SUCCESS',
                         payload: updatedUser
                     })
                     // Continue to check status with updated info
                     checkConnectStatusWithUserInfo(updatedUser)
                 } else {
                     // Proceed with old info if still not admin
                     checkConnectStatusWithUserInfo(currentUserInfo)
                 }
            } catch (err) {
                console.error('Error refreshing profile:', err)
                checkConnectStatusWithUserInfo(currentUserInfo)
            }
        }
        refreshProfile()
    } else {
        // User is authenticated (either from Redux or localStorage), check connect status
        // Use currentUserInfo which might be from localStorage if Redux hasn't loaded yet
        checkConnectStatusWithUserInfo(currentUserInfo)
    }
  }, [userInfo, history, location])

  // Handle return from Stripe onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const success = urlParams.get('success')
    const next = urlParams.get('next')

    if (success === 'true') {
      // Refresh connect status and redirect
      const handleRedirect = async () => {
        const status = await checkConnectStatus()
        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Re-check status after webhook processes
        const updatedStatus = await checkConnectStatus()
        
        // If account is active and there's a next step, redirect
        if (updatedStatus?.stripeAccountStatus === 'active' && next) {
          if (next === 'subscription') {
            // After Connect setup, redirect to subscription
            history.push('/subscription?newStore=true')
          } else if (next === 'create-store') {
            history.push('/create-store')
          } else {
            history.push('/store/dashboard')
          }
        } else if (updatedStatus?.stripeAccountStatus === 'active') {
          // Account active but no next step, check if new store
          const urlParams = new URLSearchParams(location.search)
          const newStore = urlParams.get('newStore')
          if (newStore === 'true') {
            history.push('/subscription?newStore=true')
          } else {
            history.push('/store/dashboard')
          }
        }
      }
      
      handleRedirect()
    }
  }, [location, history])

  const checkConnectStatus = async () => {
    // Use userInfo from Redux (preferred) or fallback to localStorage
    const userInfoToUse = userInfo || (() => {
      const stored = localStorage.getItem('userInfo')
      return stored ? JSON.parse(stored) : null
    })()
    
    if (!userInfoToUse || !userInfoToUse.token) {
      setError('Authentication required')
      return null
    }
    
    return checkConnectStatusWithUserInfo(userInfoToUse)
  }

  const checkConnectStatusWithUserInfo = async (userInfoToUse) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfoToUse.token}`,
        },
      }

      const { data } = await axios.get('/api/connect/status', config)
      setConnectStatus(data)
      return data
    } catch (error) {
      console.error('Error checking connect status:', error)
      if (error.response?.status === 404 || error.response?.status === 400) {
        // No Connect account yet, that's okay
        setConnectStatus(null)
        return null
      }
      setError(error.response?.data?.message || 'Error checking connect status')
      return null
    }
  }

  const handleCreateAccount = async () => {
    try {
      setCreating(true)
      setError(null)

      // Get userInfo from Redux or localStorage
      const userInfoToUse = userInfo || (() => {
        const stored = localStorage.getItem('userInfo')
        return stored ? JSON.parse(stored) : null
      })()
      
      if (!userInfoToUse || !userInfoToUse.token) {
        setError('Authentication required')
        setCreating(false)
        return
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfoToUse.token}`,
        },
      }

      const { data } = await axios.post('/api/connect/create-account', {}, config)

      if (data && data.accountId) {
        // Account created, now create onboarding link
        await handleCreateOnboardingLink()
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error creating account. Please try again.'
      )
      setCreating(false)
    }
  }

  const handleCreateOnboardingLink = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get userInfo from Redux or localStorage
      const userInfoToUse = userInfo || (() => {
        const stored = localStorage.getItem('userInfo')
        return stored ? JSON.parse(stored) : null
      })()
      
      if (!userInfoToUse || !userInfoToUse.token) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfoToUse.token}`,
        },
      }

      // Get next step from URL to pass in return URL
      const urlParams = new URLSearchParams(location.search)
      const next = urlParams.get('next') || 'dashboard'

      // Create onboarding link with next parameter
      const requestBody = next ? { next } : {}
      const { data } = await axios.post(
        '/api/connect/create-onboarding-link',
        requestBody,
        config
      )

      if (data && data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        throw new Error('Failed to create onboarding link')
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error creating onboarding link. Please try again.'
      )
      setLoading(false)
      setCreating(false)
    }
  }

  // Check if userInfo exists (from Redux or localStorage)
  const currentUserInfo = userInfo || (() => {
    const stored = localStorage.getItem('userInfo')
    return stored ? JSON.parse(stored) : null
  })()

  if (!currentUserInfo) {
    return <Loader />
  }

  // Get next step from URL
  const urlParams = new URLSearchParams(location.search)
  const next = urlParams.get('next')

  // If account is already active, redirect to next step
  if (connectStatus?.stripeAccountStatus === 'active') {
    // Determine where to redirect
    if (next === 'create-store') {
      return (
        <FormContainer>
          <Meta title='Payment Account Active' />
          <Card>
            <Card.Body className='text-center'>
              <div className='mb-4'>
                <i className='fas fa-check-circle text-success' style={{ fontSize: '4rem' }}></i>
              </div>
              <h2>Payment Account Active</h2>
              <p className='text-muted mb-4'>
                Your payment account is set up. Now you can create your store.
              </p>
              <Button variant='primary' onClick={() => history.push('/create-store')}>
                Create Your Store
              </Button>
            </Card.Body>
          </Card>
        </FormContainer>
      )
    } else {
      return (
        <FormContainer>
          <Meta title='Payment Account Active' />
          <Card>
            <Card.Body className='text-center'>
              <div className='mb-4'>
                <i className='fas fa-check-circle text-success' style={{ fontSize: '4rem' }}></i>
              </div>
              <h2>Payment Account Active</h2>
              <p className='text-muted mb-4'>
                Your payment account is set up and ready to receive payments from customers.
              </p>
              <Button variant='primary' onClick={() => history.push('/store/dashboard')}>
                Go to Dashboard
              </Button>
            </Card.Body>
          </Card>
        </FormContainer>
      )
    }
  }

  return (
    <FormContainer>
      <Meta title='Set Up Payment Account' />
      <Card>
        <Card.Header>
          <h3 className='mb-0'>
            <i className='fas fa-wallet mr-2'></i>
            Set Up Payment Account
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Message variant='danger'>{error}</Message>}

          <Alert variant='info' className='mb-4'>
            <h5>
              <i className='fas fa-info-circle mr-2'></i>
              Why Set Up Payment Account First?
            </h5>
            <p className='mb-0'>
              Before creating your store, you need to set up your banking details. This allows us to
              process your store creation fee, set up your subscription payments, and enable you to receive payments from customers once your store is live.
            </p>
          </Alert>

          {connectStatus?.stripeAccountId ? (
            <div>
              <Alert variant='warning' className='mb-4'>
                <strong>Account Created:</strong> Your account has been created but needs to be
                completed. Click below to finish the setup process.
              </Alert>

              <div className='d-grid'>
                <Button
                  variant='primary'
                  size='lg'
                  onClick={handleCreateOnboardingLink}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as='span'
                        animation='border'
                        size='sm'
                        role='status'
                        aria-hidden='true'
                        className='mr-2'
                      />
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className='fas fa-arrow-right mr-2'></i>
                      Complete Account Setup
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <ListGroup className='mb-4'>
                <ListGroup.Item>
                  <i className='fas fa-check text-success mr-2'></i>
                  Secure payment processing
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className='fas fa-check text-success mr-2'></i>
                  Direct deposits to your bank account
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className='fas fa-check text-success mr-2'></i>
                  Automatic payouts
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className='fas fa-check text-success mr-2'></i>
                  Platform handles all payment security
                </ListGroup.Item>
              </ListGroup>

              <div className='d-grid'>
                <Button
                  variant='primary'
                  size='lg'
                  onClick={handleCreateAccount}
                  disabled={creating || loading}
                >
                  {creating || loading ? (
                    <>
                      <Spinner
                        as='span'
                        animation='border'
                        size='sm'
                        role='status'
                        aria-hidden='true'
                        className='mr-2'
                      />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <i className='fas fa-wallet mr-2'></i>
                      Create Payment Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className='mt-4 text-center'>
            <small className='text-muted'>
              <i className='fas fa-shield-alt mr-1'></i>
              Powered by Stripe Connect - Secure and trusted
            </small>
          </div>
        </Card.Body>
      </Card>
    </FormContainer>
  )
}

export default ConnectSetupScreen

