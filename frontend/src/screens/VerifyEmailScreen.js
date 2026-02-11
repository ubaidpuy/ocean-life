import React, { useState, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Card, Button } from 'react-bootstrap'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import Meta from '../components/Meta'
import axiosInstance from '../utils/axiosConfig'

const VerifyEmailScreen = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const history = useHistory()
  const location = useLocation()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get token from URL query parameters
        const urlParams = new URLSearchParams(location.search)
        const token = urlParams.get('token')

        if (!token) {
          setError('Verification token is missing. Please check your email link.')
          setLoading(false)
          return
        }

        // Call backend API to verify email
        const { data } = await axiosInstance.get(`/api/users/verify-email?token=${token}`)

        if (data && data.isEmailVerified) {
          setSuccess(true)
          // Redirect to login after 3 seconds
          setTimeout(() => {
            history.push('/login?verified=true')
          }, 3000)
        } else {
          setError('Email verification failed. Please try again.')
        }
      } catch (err) {
        console.error('Email verification error:', err)
        setError(
          err.response?.data?.message ||
          err.message ||
          'Email verification failed. The link may have expired. Please request a new verification email.'
        )
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [location.search, history])

  return (
    <FormContainer>
      <Meta title='Verify Email | Ocean Life' />
      <div className='auth-container'>
        <Card className='auth-card'>
          <Card.Body className='auth-card-body'>
            <div className='auth-header'>
              <h1 className='auth-title'>
                <i className='fas fa-envelope-check'></i> Verify Email
              </h1>
            </div>

            {loading && (
              <div className='text-center my-4'>
                <Loader />
                <p className='mt-3'>Verifying your email address...</p>
              </div>
            )}

            {error && (
              <Message variant='danger'>
                {error}
                <div className='mt-3'>
                  <Button
                    variant='outline-primary'
                    onClick={() => history.push('/login')}
                  >
                    Go to Login
                  </Button>
                </div>
              </Message>
            )}

            {success && !loading && (
              <div className='text-center'>
                <div className='mb-4'>
                  <i
                    className='fas fa-check-circle'
                    style={{ fontSize: '4rem', color: '#28a745' }}
                  ></i>
                </div>
                <h3 style={{ color: '#28a745' }}>Email Verified Successfully!</h3>
                <p className='mt-3'>
                  Your email address has been verified. You can now log in to your account.
                </p>
                <p className='text-muted'>
                  Redirecting to login page in 3 seconds...
                </p>
                <Button
                  variant='primary'
                  className='mt-3'
                  onClick={() => history.push('/login?verified=true')}
                >
                  Go to Login Now
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </FormContainer>
  )
}

export default VerifyEmailScreen

