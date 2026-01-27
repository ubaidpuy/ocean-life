import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Form, Button, Row, Col, Card } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { register } from '../actions/userActions'
import Meta from '../components/Meta'

const RegisterScreen = ({ location, history }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()

  const userRegister = useSelector((state) => state.userRegister)
  const { loading, error, userInfo } = userRegister

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) {
      history.push(redirect)
    }
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
    } else {
      dispatch(register(name, email, password))
    }
  }

  return (
    <FormContainer>
      <Meta title='Sign Up | Syed Store' />
      <div className='auth-container'>
        <Card className='auth-card'>
          <Card.Body className='auth-card-body'>
            <div className='auth-header'>
              <h1 className='auth-title'>
                <i className='fas fa-user-plus'></i> Sign Up
              </h1>
              <p className='auth-subtitle'>Create a new account to get started.</p>
            </div>

            {message && <Message variant='danger'>{message}</Message>}
            {error && <Message variant='danger'>{error}</Message>}
            {loading && <Loader />}

            <Form onSubmit={submitHandler} className='auth-form'>
              <Form.Group controlId='name' className='form-group-modern'>
                <Form.Label>
                  <i className='fas fa-user'></i> Full Name
                </Form.Label>
                <Form.Control
                  type='text'
                  placeholder='Enter your full name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='form-control-modern'
                  required
                />
              </Form.Group>

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

              <Form.Group controlId='confirmPassword' className='form-group-modern'>
                <Form.Label>
                  <i className='fas fa-lock'></i> Confirm Password
                </Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className='fas fa-user-plus'></i> Create Account
                  </>
                )}
              </Button>
            </Form>

            <div className='auth-footer'>
              <p>
                Already have an account?{' '}
                <Link 
                  to={redirect ? `/login?redirect=${redirect}` : '/login'}
                  className='auth-link'
                >
                  Sign In
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </FormContainer>
  )
}

export default RegisterScreen
