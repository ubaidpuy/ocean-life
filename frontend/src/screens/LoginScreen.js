import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Form, Button, Row, Col, Card } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { login } from '../actions/userActions'
import Meta from '../components/Meta'

const LoginScreen = ({ location, history }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { loading, error, userInfo } = userLogin

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) {
      history.push(redirect)
    }
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(login(email, password))
  }

  return (
    <FormContainer>
      <Meta title='Sign In | Syed Store' />
      <div className='auth-container'>
        <Card className='auth-card'>
          <Card.Body className='auth-card-body'>
            <div className='auth-header'>
              <h1 className='auth-title'>
                <i className='fas fa-sign-in-alt'></i> Sign In
              </h1>
              <p className='auth-subtitle'>Welcome back! Please login to your account.</p>
            </div>

            {error && <Message variant='danger'>{error}</Message>}
            {loading && <Loader />}

            <Form onSubmit={submitHandler} className='auth-form'>
              <Form.Group controlId='email' className='form-group-modern'>
                <Form.Label>
                  <i className='fas fa-envelope'></i> Email Address
                </Form.Label>
                <Form.Control
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='form-control-modern'
                  required
                />
              </Form.Group>

              <Form.Group controlId='password' className='form-group-modern'>
                <Form.Label>
                  <i className='fas fa-lock'></i> Password
                </Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='form-control-modern'
                  required
                />
              </Form.Group>

              <Button 
                type='submit' 
                variant='primary' 
                className='auth-button'
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className='spinner-border spinner-border-sm mr-2' role='status' aria-hidden='true'></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className='fas fa-sign-in-alt'></i> Sign In
                  </>
                )}
              </Button>
            </Form>

            <div className='auth-footer'>
              <p>
                New Customer?{' '}
                <Link 
                  to={redirect ? `/register?redirect=${redirect}` : '/register'}
                  className='auth-link'
                >
                  Create an account
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </FormContainer>
  )
}

export default LoginScreen
