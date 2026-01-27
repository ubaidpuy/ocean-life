import React, { useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { Carousel, Image } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Loader from './Loader'
import Message from './Message'
import { listTopProducts } from '../actions/productActions'
import { ThemeContext } from '../contexts/ThemeContext'

const ProductCarousel = () => {
  const dispatch = useDispatch()
  const { theme } = useContext(ThemeContext)

  const productTopRated = useSelector((state) => state.productTopRated)
  const { loading, error, products } = productTopRated

  useEffect(() => {
    dispatch(listTopProducts())
  }, [dispatch])

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <Carousel 
      pause='hover' 
      className={`product-carousel product-carousel-${theme}`}
      fade
      interval={4000}
    >
      {products.map((product) => (
        <Carousel.Item key={product._id}>
          <div className='carousel-item-wrapper'>
            <Link to={`/product/${product._id}`} className='carousel-link'>
              <div className='carousel-image-container'>
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  className='carousel-image'
                  fluid 
                />
              </div>
              <Carousel.Caption className='carousel-caption-modern'>
                <div className='carousel-content'>
                  <h2 className='carousel-title'>{product.name}</h2>
                  <div className='carousel-price'>
                    <span className='price-symbol'>$</span>
                    <span className='price-amount'>{product.price}</span>
                  </div>
                  {product.rating > 0 && (
                    <div className='carousel-rating'>
                      <i className='fas fa-star'></i>
                      <span>{product.rating.toFixed(1)}</span>
                      {product.numReviews > 0 && (
                        <span className='rating-count'>({product.numReviews})</span>
                      )}
                    </div>
                  )}
                </div>
              </Carousel.Caption>
            </Link>
          </div>
        </Carousel.Item>
      ))}
    </Carousel>
  )
}

export default ProductCarousel
