import React from "react";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import Rating from "./Rating";

const Product = ({ product }) => {
  return (
    <>
      <style type="text/css">
        {`
          /* Wrapper for grid alignment */
          .product-card-wrapper {
            height: 100%;
            padding-bottom: 20px;
          }

          .product-card {
            background-color: #1e1e2e;
            border: 1px solid #2d2d3d;
            border-radius: 12px;
            /* overflow: hidden;  <-- Removed from here to handle sub-elements better */
            transition: all 0.3s ease-in-out;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }

          .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.5);
            border-color: #555;
          }

          /* 
             IMAGE WRAPPER
             Added overflow: hidden here.
             This ensures the "View Details" button gets clipped 
             when it slides down, so it doesn't cover the text below.
          */
          .product-img-wrapper {
            height: 220px;
            width: 100%;
            background-color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            padding: 20px;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            overflow: hidden; /* THE FIX: Clips the button when hidden */
          }

          .product-img-wrapper img {
            max-height: 100%;
            max-width: 100%;
            object-fit: contain;
            transition: transform 0.5s ease;
          }

          .product-card:hover .product-img-wrapper img {
            transform: scale(1.08);
          }

          /* 
             OVERLAY BUTTON 
             Slides up from the bottom of the image wrapper 
          */
          .product-action-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: rgba(30, 30, 46, 0.9);
            padding: 10px 0;
            transform: translateY(100%); /* Pushes it down out of view */
            transition: transform 0.3s ease-in-out;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10;
          }

          .product-card:hover .product-action-overlay {
            transform: translateY(0); /* Slides it up into view */
          }

          .view-details-link {
            color: #fff;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            text-decoration: none;
          }

          .view-details-link:hover {
            color: #007bff;
            text-decoration: none;
          }

          /* CONTENT BODY */
          .product-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex: 1; /* Fills remaining height */
            background-color: #1e1e2e;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
            z-index: 5; /* Ensures text sits above any potential overflow */
          }

          .product-title {
            font-size: 1rem;
            color: #fff;
            font-weight: 700;
            margin-bottom: 10px;
            text-decoration: none;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            height: 40px; 
            line-height: 1.25;
          }

          .product-title:hover {
            color: #007bff;
          }

          .product-rating {
            margin-bottom: 15px;
            min-height: 20px;
          }

          /* FOOTER */
          .product-footer {
            margin-top: auto; 
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid #2d2d3d;
            padding-top: 15px;
          }

          .product-price {
            font-size: 1.25rem;
            font-weight: 700;
            color: #fff;
          }
          
          .currency-symbol {
            color: #007bff;
            font-size: 0.8rem;
            vertical-align: top;
            margin-right: 2px;
          }

          .add-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background-color: #2d2d3d;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .product-card:hover .add-btn {
            background-color: #007bff;
          }

          /* OUT OF STOCK RIBBON */
          .out-of-stock-ribbon {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: #ff4d4d;
            color: white;
            padding: 5px 10px;
            font-size: 0.8rem;
            font-weight: bold;
            border-radius: 4px;
            z-index: 20;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        `}
      </style>

      <div className="product-card-wrapper">
        <Card className="product-card">
          {/* Image Section */}
          <div className="product-img-wrapper">
            <Link
              to={`/product/${product._id}`}
              style={{ display: "contents" }}
            >
              <img src={product.image} alt={product.name} />
            </Link>

            {/* Overlay hidden by overflow:hidden on wrapper */}
            <div className="product-action-overlay">
              <Link
                to={`/product/${product._id}`}
                className="view-details-link"
              >
                View Details
              </Link>
            </div>

            {/* Out of Stock Ribbon */}
            {product.countInStock === 0 && (
              <div className="out-of-stock-ribbon">Out of Stock</div>
            )}
          </div>

          {/* Content Section */}
          <Card.Body className="product-body">
            <Link
              to={`/product/${product._id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="product-title">{product.name}</div>
            </Link>

            <div className="product-rating">
              <Rating
                value={product.rating}
                text={`${product.numReviews} reviews`}
              />
            </div>

            <div className="product-footer">
              <div className="product-price">
                <span className="currency-symbol">$</span>
                {product.price}
              </div>

              <Link to={`/product/${product._id}`}>
                <div className="add-btn">
                  <i className="fas fa-plus"></i>
                </div>
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default Product;
