import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Button, Alert, Spinner } from 'react-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import Meta from '../components/Meta'
import axios from '../utils/axiosConfig'

const SubscriptionScreen = ({ history, location }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (!userInfo) {
      history.push('/login?redirect=/subscription')
      return
    }

    // Check subscription status
    checkSubscriptionStatus()
  }, [userInfo, history])

  const checkSubscriptionStatus = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }

      const { data } = await axios.get('/api/subscriptions/status', config)
      setSubscriptionStatus(data)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubscribe = async () => {
    try {
      setLoading(true)
      setError(null)

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }

      const { data } = await axios.post(
        '/api/subscriptions/create-checkout-session',
        {},
        config
      )

      if (data && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          'Error creating subscription. Please try again.'
      )
      setLoading(false)
    }
  }

  // Handle return from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const success = urlParams.get('success')
    const sessionId = urlParams.get('session_id')
    const newStore = urlParams.get('newStore')
    const storeCreated = urlParams.get('storeCreated')

    if (success === 'true' && sessionId) {
      // Subscription successful, refresh status
      setTimeout(() => {
        checkSubscriptionStatus()
        // After subscription, redirect to dashboard (store and connect already set up)
        if (storeCreated === 'true') {
          history.push('/store/dashboard?setup=complete')
        } else {
          history.push('/store/dashboard')
        }
      }, 2000)
    }
  }, [location, history])

  if (!userInfo) {
    return <Loader />
  }

  // If already has active subscription, show success message
  if (subscriptionStatus?.subscriptionStatus === 'active') {
    return (
      <FormContainer>
        <Meta title='Subscription Active' />
        <Card>
          <Card.Body className='text-center'>
            <div className='mb-4'>
              <i className='fas fa-check-circle text-success' style={{ fontSize: '4rem' }}></i>
            </div>
            <h2>Subscription Active</h2>
            <p className='text-muted mb-4'>
              Your subscription is active. You can now set up your payment account to receive
              payments from customers.
            </p>
            <Button
              variant='primary'
              onClick={() => history.push('/connect/setup')}
              className='mr-2'
            >
              Set Up Payment Account
            </Button>
            <Button variant='outline-secondary' onClick={() => history.push('/store/dashboard')}>
              Go to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </FormContainer>
    )
  }

  return (
    <FormContainer>
      <Meta title='Subscribe to Platform' />
      <Card>
        <Card.Header>
          <h3 className='mb-0'>
            <i className='fas fa-credit-card mr-2'></i>
            Subscribe to Platform
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Message variant='danger'>{error}</Message>}

          <Alert variant='info' className='mb-4'>
            <h5>
              <i className='fas fa-info-circle mr-2'></i>
              Why Subscribe?
            </h5>
            <ul className='mb-0'>
              <li>Access to your store dashboard</li>
              <li>Receive payments from customers</li>
              <li>Manage products and orders</li>
              <li>Full platform features</li>
            </ul>
          </Alert>

          <div className='text-center mb-4'>
            <h2 className='text-primary'>$29.99/month</h2>
            <p className='text-muted'>Billed monthly, cancel anytime</p>
          </div>

          {subscriptionStatus?.subscriptionStatus && (
            <Alert
              variant={
                subscriptionStatus.subscriptionStatus === 'canceled' ? 'warning' : 'info'
              }
              className='mb-4'
            >
              <strong>Current Status:</strong>{' '}
              {subscriptionStatus.subscriptionStatus.charAt(0).toUpperCase() +
                subscriptionStatus.subscriptionStatus.slice(1)}
            </Alert>
          )}

          <div className='d-grid'>
            <Button
              variant='primary'
              size='lg'
              onClick={handleSubscribe}
              disabled={loading || subscriptionStatus?.subscriptionStatus === 'active'}
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
                  Processing...
                </>
              ) : (
                <>
                  <i className='fas fa-credit-card mr-2'></i>
                  Subscribe Now
                </>
              )}
            </Button>
          </div>

          <div className='mt-4 text-center'>
            <small className='text-muted'>
              <i className='fas fa-lock mr-1'></i>
              Secure payment powered by Stripe
            </small>
          </div>
        </Card.Body>
      </Card>
    </FormContainer>
  )
}

export default SubscriptionScreen

