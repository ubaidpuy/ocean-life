import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, ListGroup, Image, Form, Button, Card } from 'react-bootstrap'
import Message from '../components/Message'
import QuantitySelector from '../components/QuantitySelector'
import { addToCart, removeFromCart } from '../actions/cartActions'

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id

  const qty = location.search ? Number(location.search.split('=')[1]) : 1

  const dispatch = useDispatch()

  const cart = useSelector((state) => state.cart)
  const { cartItems } = cart

  useEffect(() => {
    if (productId) {
      dispatch(addToCart(productId, qty))
    }
  }, [dispatch, productId, qty])

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id))
  }

  const checkoutHandler = () => {
    history.push('/login?redirect=shipping')
  }

  return (
    <>
      <h1 className='cart-page-title'>Shopping Cart</h1>
      <Row>
        <Col md={8}>
          {cartItems.length === 0 ? (
            <Message>
              Your cart is empty <Link to='/'>Go Back</Link>
            </Message>
          ) : (
          <ListGroup variant='flush' className='cart-list-group'>
            {cartItems.map((item) => (
              <ListGroup.Item key={item.product} className='cart-item'>
                <Row className='align-items-center'>
                  <Col xs={12} sm={4} md={3} className='cart-item-image-col'>
                    <Image src={item.image} alt={item.name} fluid rounded className='cart-item-image' />
                  </Col>
                  <Col xs={12} sm={8} md={3} className='cart-item-name-col'>
                    <Link to={`/product/${item.product}`} className='cart-item-name'>{item.name}</Link>
                    <div className='cart-item-price-mobile d-md-none'>${item.price}</div>
                  </Col>
                  <Col xs={6} md={2} className='cart-item-price-col d-none d-md-block'>
                    <div className='cart-item-price'>${item.price}</div>
                  </Col>
                  <Col xs={6} md={3} className='cart-item-qty-col'>
                    <div className='cart-item-qty-wrapper'>
                      <QuantitySelector
                        qty={item.qty}
                        onQtyChange={(newQty) =>
                          dispatch(addToCart(item.product, newQty))
                        }
                        maxStock={item.countInStock}
                      />
                    </div>
                  </Col>
                  <Col xs={12} md={1} className='cart-item-delete-col'>
                    <Button
                      type='button'
                      variant='light'
                      className='cart-delete-btn'
                      onClick={() => removeFromCartHandler(item.product)}
                      aria-label='Remove item'
                    >
                      <i className='fas fa-trash'></i>
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>
      <Col md={4}>
        <Card>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>
                Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)})
                items
              </h2>
              $
              {cartItems
                .reduce((acc, item) => acc + item.qty * item.price, 0)
                .toFixed(2)}
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                type='button'
                className='btn-block'
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
              >
                Proceed To Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
      </Row>
    </>
  )
}

export default CartScreen
