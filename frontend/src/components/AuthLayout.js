import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const AuthLayout = ({ activeTab, title, subtitle, iconClass, children }) => {
  return (
    <Container className='auth-page'>
      <Row className='justify-content-center'>
        <Col xs={12} lg={10}>
          <div className='auth-shell'>
            {/* Left side: form + tabs */}
            <div className='auth-shell-left'>
              <Card className='auth-shell-card'>
                <Card.Body className='auth-shell-card-body'>
                  <div className='auth-tabs'>
                    <Link
                      to='/login'
                      className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                    >
                      Sign In
                    </Link>
                    <Link
                      to='/register'
                      className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                    >
                      Sign Up
                    </Link>
                    <Link
                      to='/forgot-password'
                      className={`auth-tab ${activeTab === 'recovery' ? 'active' : ''}`}
                    >
                      Password recovery
                    </Link>
                  </div>

                  <div className='auth-header'>
                    <h1 className='auth-title'>
                      {iconClass && <i className={iconClass}></i>}
                      {title}
                    </h1>
                    {subtitle && <p className='auth-subtitle'>{subtitle}</p>}
                  </div>

                  {children}
                </Card.Body>
              </Card>
            </div>

            {/* Right side: illustration / marketing panel */}
            <div className='auth-shell-right'>
              <div className='auth-hero-card'>
                <div className='auth-hero-logo'>OL</div>
                <h2 className='auth-hero-title'>
                  Welcome to your Ocean Life store dashboard
                </h2>
                <p className='auth-hero-text'>
                  Manage products, orders, and customers from one beautiful
                  multi-vendor platform. Connect your Stripe account and start
                  selling in minutes.
                </p>
                <ul className='auth-hero-list'>
                  <li>Secure authentication</li>
                  <li>Multi-tenant store subdomains</li>
                  <li>Stripe-powered payments</li>
                </ul>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default AuthLayout




