import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Carousel, Image } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Loader from "./Loader";
import Message from "./Message";
import { listTopProducts } from "../actions/productActions";

const ProductCarousel = () => {
  const dispatch = useDispatch();

  const productTopRated = useSelector((state) => state.productTopRated);
  const { loading, error, products } = productTopRated;

  useEffect(() => {
    dispatch(listTopProducts());
  }, [dispatch]);

  const customStyles = `
    .hero-carousel {
      background: #121212;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      margin-bottom: 2rem;
    }

    .carousel-item-wrapper {
      position: relative;
      height: 500px;
      width: 100%;
      display: flex;
      align-items: center;
      background-color: #000;
      overflow: hidden;
    }

    /* Background Blur */
    .carousel-bg-blur {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
      filter: blur(30px) brightness(0.5);
      z-index: 0;
      transform: scale(1.1);
    }

    /* Main Product Image */
    .carousel-image {
      position: relative;
      z-index: 1;
      height: 85%; /* Slightly smaller to breathe */
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 15px 25px rgba(0,0,0,0.6));
      
      /* KEY CHANGE 1: Push image to the right so text doesn't cover it */
      margin-left: auto;
      margin-right: 10%; 
      transition: transform 0.5s ease;
    }

    /* Detail Card Positioning */
    .carousel-caption {
      text-align: left;
      
      /* KEY CHANGE 2: Moved from 5% to 12% to clear the arrow */
      left: 12%; 
      
      right: auto;
      bottom: auto;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      max-width: 450px;
      padding: 0;
    }

    /* The Glass Card Design */
    .glass-card {
      background: rgba(20, 20, 30, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      animation: fadeInUp 0.8s ease-out;
    }

    .carousel-title {
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      font-size: 2.2rem;
      color: #fff;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      line-height: 1.1;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    .carousel-price {
      font-size: 1.6rem;
      color: #007bff;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .carousel-rating {
      color: #ffc107;
      font-size: 0.9rem;
      margin-bottom: 15px;
    }

    .btn-glass {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 10px 25px;
      font-weight: 600;
      border-radius: 50px;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 1px;
      transition: all 0.3s ease;
      display: inline-block;
      text-decoration: none;
    }

    .btn-glass:hover {
      background: #007bff;
      border-color: #007bff;
      box-shadow: 0 0 15px rgba(0, 123, 255, 0.5);
      color: #fff;
      text-decoration: none;
    }

    /* Custom Arrow Positioning to ensure they don't overlap content */
    .carousel-control-prev {
      width: 8%;
      background: linear-gradient(90deg, rgba(0,0,0,0.5) 0%, transparent 100%);
    }
    .carousel-control-next {
      width: 8%;
      background: linear-gradient(-90deg, rgba(0,0,0,0.5) 0%, transparent 100%);
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translate3d(0, 30px, 0); }
      to { opacity: 1; transform: translate3d(0, 0, 0); }
    }

    /* Mobile Responsive adjustments */
    @media (max-width: 992px) {
      .carousel-image { margin-right: 0; margin: 0 auto; height: 60%; }
      .carousel-item-wrapper { 
        flex-direction: column; 
        justify-content: flex-end; 
        padding-bottom: 20px;
      }
      .carousel-caption { 
        position: relative; 
        left: 0; 
        top: 0; 
        transform: none; 
        width: 100%; 
        max-width: 90%; 
        margin: 0 auto;
        margin-top: -50px; /* Pull it up over the image slightly */
      }
      .glass-card { padding: 20px; background: rgba(20,20,30,0.85); }
    }
  `;

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant="danger">{error}</Message>
  ) : (
    <>
      <style>{customStyles}</style>
      <Carousel
        pause="hover"
        className="hero-carousel"
        fade
        interval={5000}
        controls={true}
        indicators={true}
      >
        {products.map((product) => (
          <Carousel.Item key={product._id}>
            <div className="carousel-item-wrapper">
              {/* Blurred Background */}
              <div
                className="carousel-bg-blur"
                style={{ backgroundImage: `url(${product.image})` }}
              ></div>

              {/* Product Image - Shifted Right */}
              <Image
                src={product.image}
                alt={product.name}
                className="carousel-image"
              />

              {/* Detail Card - Shifted Left away from arrow */}
              <Carousel.Caption>
                <div className="glass-card">
                  <h2 className="carousel-title">{product.name}</h2>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="carousel-price">${product.price}</div>
                    {product.rating > 0 && (
                      <div className="carousel-rating">
                        <i className="fas fa-star mr-1"></i>
                        {product.rating}
                      </div>
                    )}
                  </div>
                  <Link to={`/product/${product._id}`} className="btn-glass">
                    View Details
                  </Link>
                </div>
              </Carousel.Caption>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </>
  );
};

export default ProductCarousel;
