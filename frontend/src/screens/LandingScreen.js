import React from 'react'
import { Link, useHistory } from 'react-router-dom'
import { Container, Row, Col, Button, Card } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import Meta from '../components/Meta'

const LandingScreen = () => {
  const history = useHistory()
  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  // Check if we're on a store subdomain - if so, this component shouldn't be rendered
  const hostname = window.location.hostname
  const isStoreSubdomain = 
    (hostname.includes('.localhost') && hostname !== 'localhost' && hostname !== '127.0.0.1') ||
    (hostname.includes('.myapp.local') && !hostname.startsWith('www.') && !hostname.startsWith('app.') && !hostname.startsWith('admin.'))

  // If user is logged in and on main platform, redirect admins to their dashboard
  // Non-admin users can stay on the landing page
  React.useEffect(() => {
    if (!isStoreSubdomain && userInfo && userInfo.isAdmin) {
      history.push('/store/dashboard')
    }
  }, [userInfo, history, isStoreSubdomain])

  return (
    <>
      <Meta title='Store Builder - Create Your Online Store' />
      
      {/* Hero Section */}
      <section className='landing-hero'>
        <Container>
          <Row className='align-items-center min-vh-100'>
            <Col lg={6}>
              <div className='hero-content'>
                <h1 className='hero-title'>
                  <i className='fas fa-store text-primary mr-3'></i>
                  Build Your Online Store
                  <span className='text-primary'> in Minutes</span>
                </h1>
                <p className='hero-subtitle'>
                  Create a professional online store with our powerful store builder platform. 
                  Start selling your products today with easy setup, secure payments, and beautiful designs.
                </p>
                <div className='hero-buttons mt-4'>
                  {!userInfo ? (
                    <>
                      <Link to='/register?redirect=/create-store'>
                        <Button variant='primary' size='lg' className='mr-3 mb-2'>
                          <i className='fas fa-rocket mr-2'></i>
                          Get Started Free
                        </Button>
                      </Link>
                      <Link to='/login'>
                        <Button variant='outline-primary' size='lg' className='mb-2'>
                          <i className='fas fa-sign-in-alt mr-2'></i>
                          Sign In
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link to='/create-store'>
                      <Button variant='primary' size='lg'>
                        <i className='fas fa-store mr-2'></i>
                        Create Your Store
                      </Button>
                    </Link>
                  )}
                </div>
                <div className='hero-stats mt-5'>
                  <Row>
                    <Col xs={4} className='text-center'>
                      <div className='stat-number'>1000+</div>
                      <div className='stat-label'>Stores Created</div>
                    </Col>
                    <Col xs={4} className='text-center'>
                      <div className='stat-number'>$50K+</div>
                      <div className='stat-label'>Revenue Generated</div>
                    </Col>
                    <Col xs={4} className='text-center'>
                      <div className='stat-number'>24/7</div>
                      <div className='stat-label'>Support</div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
            <Col lg={6} className='d-none d-lg-block'>
              <div className='hero-image'>
                <div className='store-preview'>
                  <i className='fas fa-store fa-10x text-primary opacity-25'></i>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className='landing-features py-5'>
        <Container>
          <Row className='text-center mb-5'>
            <Col>
              <h2 className='section-title'>Why Choose Our Store Builder?</h2>
              <p className='section-subtitle text-muted'>
                Everything you need to start and grow your online business
              </p>
            </Col>
          </Row>
          <Row>
            <Col md={4} className='mb-4'>
              <Card className='feature-card h-100 text-center'>
                <Card.Body>
                  <div className='feature-icon mb-3'>
                    <i className='fas fa-bolt fa-3x text-primary'></i>
                  </div>
                  <h4>Lightning Fast Setup</h4>
                  <p className='text-muted'>
                    Get your store up and running in minutes. No technical skills required.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className='mb-4'>
              <Card className='feature-card h-100 text-center'>
                <Card.Body>
                  <div className='feature-icon mb-3'>
                    <i className='fas fa-shield-alt fa-3x text-success'></i>
                  </div>
                  <h4>Secure Payments</h4>
                  <p className='text-muted'>
                    Accept payments securely with Stripe. Your customers' data is always protected.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className='mb-4'>
              <Card className='feature-card h-100 text-center'>
                <Card.Body>
                  <div className='feature-icon mb-3'>
                    <i className='fas fa-mobile-alt fa-3x text-info'></i>
                  </div>
                  <h4>Mobile Responsive</h4>
                  <p className='text-muted'>
                    Your store looks great on all devices. Mobile, tablet, and desktop ready.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className='mb-4'>
              <Card className='feature-card h-100 text-center'>
                <Card.Body>
                  <div className='feature-icon mb-3'>
                    <i className='fas fa-chart-line fa-3x text-warning'></i>
                  </div>
                  <h4>Analytics Dashboard</h4>
                  <p className='text-muted'>
                    Track your sales, orders, and customers with our comprehensive dashboard.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className='mb-4'>
              <Card className='feature-card h-100 text-center'>
                <Card.Body>
                  <div className='feature-icon mb-3'>
                    <i className='fas fa-palette fa-3x text-danger'></i>
                  </div>
                  <h4>Customizable Design</h4>
                  <p className='text-muted'>
                    Customize your store's look and feel to match your brand identity.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className='mb-4'>
              <Card className='feature-card h-100 text-center'>
                <Card.Body>
                  <div className='feature-icon mb-3'>
                    <i className='fas fa-headset fa-3x text-secondary'></i>
                  </div>
                  <h4>24/7 Support</h4>
                  <p className='text-muted'>
                    Get help whenever you need it. Our support team is always here for you.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className='landing-cta py-5 bg-primary text-white'>
        <Container>
          <Row className='text-center'>
            <Col>
              <h2 className='mb-3'>Ready to Start Your Online Store?</h2>
              <p className='lead mb-4'>
                Join thousands of entrepreneurs who are already selling online with our platform.
              </p>
              {!userInfo ? (
                <Link to='/register?redirect=/create-store'>
                  <Button variant='light' size='lg'>
                    <i className='fas fa-rocket mr-2'></i>
                    Create Your Store Now
                  </Button>
                </Link>
              ) : (
                <Link to='/create-store'>
                  <Button variant='light' size='lg'>
                    <i className='fas fa-store mr-2'></i>
                    Create Your Store
                  </Button>
                </Link>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </>
  )
}

export default LandingScreen

