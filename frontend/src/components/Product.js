import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'
import Rating from './Rating'

const Product = ({ product }) => {
  return (
    <div className='product-card-wrapper'>
      <Card className='my-3 p-0 rounded h-100'>
        <Link to={`/product/${product._id}`}>
          <Card.Img src={product.image} variant='top' className='card-img-top' />
        </Link>

        <Card.Body className='d-flex flex-column'>
          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
            <Card.Title as='div' className='card-title'>
              <strong>{product.name}</strong>
            </Card.Title>
          </Link>

          <Card.Text as='div' className='card-text'>
            <Rating
              value={product.rating}
              text={`${product.numReviews} reviews`}
            />
          </Card.Text>

          <Card.Text as='h3' className='mt-auto'>${product.price}</Card.Text>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Product
