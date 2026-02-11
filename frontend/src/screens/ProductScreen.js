import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Image, Button, Form } from "react-bootstrap";
import Rating from "../components/Rating";
import Message from "../components/Message";
import Loader from "../components/Loader";
import Meta from "../components/Meta";
import QuantitySelector from "../components/QuantitySelector";
import {
  listProductDetails,
  createProductReview,
} from "../actions/productActions";
import { PRODUCT_CREATE_REVIEW_RESET } from "../constants/productConstants";

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // We keep selectedVariation as the source of truth for the cart
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [mainImage, setMainImage] = useState("");

  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const productReviewCreate = useSelector((state) => state.productReviewCreate);
  const {
    success: successProductReview,
    loading: loadingProductReview,
    error: errorProductReview,
  } = productReviewCreate;

  // --- STYLES ---
  const styles = {
    fullPageWrapper: {
      width: "100vw",
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      backgroundColor: "#121212",
      minHeight: "100vh",
      paddingTop: "40px",
      paddingBottom: "80px",
      color: "#e0e0e0",
      fontFamily: "'Inter', sans-serif",
    },
    innerContainer: {
      maxWidth: "1600px",
      margin: "0 auto",
      padding: "0 40px",
    },
    card: {
      backgroundColor: "#1e1e2e",
      borderRadius: "15px",
      padding: "30px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      border: "1px solid #2d2d3d",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
    imageCardInner: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: "400px",
    },
    actionCardInner: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
    },
    sectionTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "20px",
      borderBottom: "1px solid #2d2d3d",
      paddingBottom: "15px",
    },
    label: {
      color: "#a0a0b0",
      fontSize: "0.85rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      marginBottom: "8px",
      display: "block",
    },
    priceTag: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#fff",
    },
    input: {
      backgroundColor: "#161620",
      border: "1px solid #333",
      color: "#fff",
      borderRadius: "6px",
      padding: "12px",
      fontSize: "0.95rem",
      width: "100%",
    },
    reviewItem: {
      backgroundColor: "#161620",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "15px",
      border: "1px solid #333",
    },
  };

  useEffect(() => {
    if (successProductReview) {
      setRating(0);
      setComment("");
    }
    if (!product._id || product._id !== match.params.id) {
      dispatch(listProductDetails(match.params.id));
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }
  }, [dispatch, match, successProductReview, product._id]);

  // --- LOGIC: Group Variations by Label ---
  const groupedVariations = useMemo(() => {
    if (!product.variations || !Array.isArray(product.variations)) return {};

    return product.variations.reduce((acc, variation) => {
      // Default to "Options" if no label exists
      const label = variation.label || "Options";
      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(variation);
      return acc;
    }, {});
  }, [product.variations]);

  // --- LOGIC: Set Initial Selection ---
  useEffect(() => {
    if (
      product.variations &&
      product.variations.length > 0 &&
      !selectedVariation
    ) {
      // Select the first available variation by default
      setSelectedVariation(product.variations[0]);
    }
  }, [product.variations, selectedVariation]);

  // --- LOGIC: Update Image on Selection ---
  useEffect(() => {
    if (
      selectedVariation &&
      Array.isArray(selectedVariation.images) &&
      selectedVariation.images.length > 0
    ) {
      setMainImage(selectedVariation.images[0]);
    } else if (product.image) {
      setMainImage(product.image);
    }
  }, [selectedVariation, product.image]);

  // --- LOGIC: Reset Qty if stock changes ---
  useEffect(() => {
    if (
      selectedVariation &&
      selectedVariation.countInStock &&
      qty > selectedVariation.countInStock
    ) {
      setQty(selectedVariation.countInStock);
    }
  }, [selectedVariation, qty]);

  const addToCartHandler = () => {
    const params = new URLSearchParams();
    params.set("qty", Number(qty));
    if (selectedVariation && selectedVariation._id) {
      params.set("variationId", selectedVariation._id);

      // Pass variation details for Cart UI
      if (product.variationKey) params.set("vKey", product.variationKey);
      if (product.variationName) params.set("vName", product.variationName);
      if (selectedVariation.value)
        params.set("vValue", selectedVariation.value);
      if (selectedVariation.label)
        params.set("vLabel", selectedVariation.label);
    }
    history.push(`/cart/${match.params.id}?${params.toString()}`);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(createProductReview(match.params.id, { rating, comment }));
  };

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.innerContainer}>
        <Link className="btn btn-outline-secondary btn-sm mb-4" to="/">
          <i className="fas fa-arrow-left"></i> Go Back
        </Link>

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <>
            <Meta title={product.name} />
            <Row className="align-items-stretch mb-4">
              {/* --- LEFT COLUMN: IMAGES --- */}
              <Col lg={6} className="mb-3 d-flex flex-column">
                <div style={styles.card}>
                  <div style={styles.imageCardInner}>
                    <Image
                      src={mainImage || product.image}
                      alt={product.name}
                      fluid
                      style={{
                        maxHeight: "450px",
                        maxWidth: "100%",
                        objectFit: "contain",
                        borderRadius: "10px",
                      }}
                    />
                    {selectedVariation &&
                      Array.isArray(selectedVariation.images) &&
                      selectedVariation.images.length > 1 && (
                        <div className="mt-4 d-flex flex-wrap justify-content-center">
                          {selectedVariation.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="mx-2"
                              style={{
                                cursor: "pointer",
                                border:
                                  mainImage === img
                                    ? "2px solid #007bff"
                                    : "2px solid #2d2d3d",
                                borderRadius: "8px",
                                padding: "2px",
                                backgroundColor: "#1e1e2e",
                              }}
                              onClick={() => setMainImage(img)}
                            >
                              <Image
                                src={img}
                                alt={`${product.name} ${idx + 1}`}
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </Col>

              {/* --- MIDDLE COLUMN: PRODUCT INFO & VARIATIONS --- */}
              <Col lg={3} className="mb-3 d-flex flex-column">
                <div style={styles.card}>
                  <div>
                    <h3 className="text-white font-weight-bold mb-2 text-uppercase">
                      {product.name}
                    </h3>
                    <div className="mb-4">
                      <Rating
                        value={product.rating}
                        text={`${product.numReviews} reviews`}
                      />
                    </div>

                    <div className="mb-4">
                      <span style={styles.label}>Description</span>
                      <p
                        style={{
                          color: "#c0c0d0",
                          lineHeight: "1.6",
                          fontSize: "0.95rem",
                        }}
                      >
                        {product.description}
                      </p>
                    </div>

                    {/* --- VARIATIONS GROUPED BY LABEL --- */}
                    <div className="mt-auto">
                      {Object.keys(groupedVariations).map((label) => (
                        <div key={label} className="mb-4">
                          <span style={styles.label}>{label}</span>
                          <div className="d-flex flex-wrap align-items-center">
                            {groupedVariations[label].map((v) => {
                              const isSelected =
                                selectedVariation &&
                                selectedVariation._id === v._id;
                              const isColor = label
                                .toLowerCase()
                                .includes("color");

                              if (isColor) {
                                return (
                                  <div
                                    key={v._id}
                                    onClick={() => setSelectedVariation(v)}
                                    title={`${v.value} - $${v.price}`}
                                    style={{
                                      backgroundColor: v.value,
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                      cursor: "pointer",
                                      marginRight: "10px",
                                      marginBottom: "5px",
                                      // Active state styles
                                      boxShadow: isSelected
                                        ? "0 0 0 2px #1e1e2e, 0 0 0 4px #007bff" // Blue ring for selection
                                        : "0 2px 4px rgba(0,0,0,0.5)",
                                      border: "1px solid #444",
                                      transform: isSelected
                                        ? "scale(1.15)"
                                        : "scale(1)",
                                      transition: "all 0.2s",
                                    }}
                                  />
                                );
                              } else {
                                return (
                                  <Button
                                    key={v._id}
                                    onClick={() => setSelectedVariation(v)}
                                    variant="outline-secondary"
                                    size="sm"
                                    className="mr-2 mb-2"
                                    style={{
                                      minWidth: "60px",
                                      backgroundColor: isSelected
                                        ? "#007bff"
                                        : "transparent",
                                      color: isSelected ? "#fff" : "#a0a0b0",
                                      borderColor: isSelected
                                        ? "#007bff"
                                        : "#444",
                                      fontWeight: isSelected
                                        ? "bold"
                                        : "normal",
                                    }}
                                  >
                                    {v.value}
                                  </Button>
                                );
                              }
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Show current selection details */}
                      {selectedVariation && (
                        <div
                          className="mt-3 p-2 rounded"
                          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        >
                          <small className="text-muted d-block">
                            Selected Configuration:
                          </small>
                          <div className="d-flex justify-content-between align-items-center">
                            <strong className="text-white">
                              {selectedVariation.label}:{" "}
                              {selectedVariation.value}
                            </strong>
                            {/* Optional: Show price diff if needed here, but usually price is on the right card */}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Col>

              {/* --- RIGHT COLUMN: ACTIONS --- */}
              <Col lg={3} className="mb-3 d-flex flex-column">
                <div style={styles.card}>
                  <div style={styles.actionCardInner}>
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span style={styles.label} className="mb-0">
                          Price
                        </span>
                        <span style={styles.priceTag}>
                          $
                          {selectedVariation
                            ? selectedVariation.price
                            : product.price}
                        </span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
                        <span style={styles.label} className="mb-0">
                          Status
                        </span>
                        <span
                          className={`font-weight-bold ${
                            selectedVariation &&
                            selectedVariation.countInStock > 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {selectedVariation &&
                          selectedVariation.countInStock > 0
                            ? "In Stock"
                            : "Out Of Stock"}
                        </span>
                      </div>

                      {selectedVariation &&
                        selectedVariation.countInStock > 0 && (
                          <div className="mb-4">
                            <span style={styles.label}>Quantity</span>
                            <div
                              style={{
                                backgroundColor: "#161620",
                                borderRadius: "6px",
                                border: "1px solid #333",
                                padding: "5px",
                              }}
                            >
                              <QuantitySelector
                                qty={qty}
                                onQtyChange={setQty}
                                maxStock={selectedVariation.countInStock}
                              />
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="mt-4">
                      {userInfo && userInfo.isAdmin ? (
                        <Button
                          className="btn-block btn-secondary btn-lg shadow-sm"
                          disabled
                          style={{
                            borderRadius: "8px",
                            fontWeight: "bold",
                            padding: "15px",
                            cursor: "not-allowed",
                          }}
                        >
                          Admin View Only
                        </Button>
                      ) : (
                        <Button
                          onClick={addToCartHandler}
                          className="btn-block btn-primary btn-lg shadow-sm"
                          type="button"
                          disabled={
                            !selectedVariation ||
                            selectedVariation.countInStock === 0
                          }
                          style={{
                            borderRadius: "8px",
                            fontWeight: "bold",
                            padding: "15px",
                          }}
                        >
                          Add To Cart{" "}
                          <i className="fas fa-shopping-cart ml-2"></i>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* --- REVIEWS --- */}
            <Row>
              <Col md={12}>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-star mr-2 text-warning"></i> Customer
                    Reviews
                  </div>
                  <Row>
                    <Col md={6}>
                      {product.reviews.length === 0 && (
                        <div className="p-4 text-center text-muted bg-dark rounded border border-secondary mb-3">
                          No reviews yet. Be the first to review!
                        </div>
                      )}
                      {product.reviews.map((review) => (
                        <div key={review._id} style={styles.reviewItem}>
                          <div className="d-flex justify-content-between">
                            <strong>{review.name}</strong>
                            <span className="text-muted small">
                              {review.createdAt.substring(0, 10)}
                            </span>
                          </div>
                          <div className="my-2">
                            <Rating value={review.rating} />
                          </div>
                          <p className="mb-0" style={{ color: "#d0d0d0" }}>
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </Col>
                    <Col md={6}>
                      {/* Review Form (Same as previous) */}
                      <div
                        className="p-3"
                        style={{
                          backgroundColor: "#161620",
                          borderRadius: "8px",
                          border: "1px solid #333",
                        }}
                      >
                        <h5 className="text-white mb-3">
                          Write a Customer Review
                        </h5>
                        {successProductReview && (
                          <Message variant="success">
                            Review submitted successfully
                          </Message>
                        )}
                        {loadingProductReview && <Loader />}
                        {errorProductReview && (
                          <Message variant="danger">
                            {errorProductReview}
                          </Message>
                        )}
                        {userInfo ? (
                          <Form onSubmit={submitHandler}>
                            <Form.Group controlId="rating">
                              <Form.Label style={styles.label}>
                                Rating
                              </Form.Label>
                              <Form.Control
                                as="select"
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                                style={styles.input}
                              >
                                <option value="">Select...</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Fair</option>
                                <option value="3">3 - Good</option>
                                <option value="4">4 - Very Good</option>
                                <option value="5">5 - Excellent</option>
                              </Form.Control>
                            </Form.Group>
                            <Form.Group controlId="comment">
                              <Form.Label style={styles.label}>
                                Comment
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                rows="3"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                style={styles.input}
                                placeholder="Share your thoughts..."
                              ></Form.Control>
                            </Form.Group>
                            <Button
                              disabled={loadingProductReview}
                              type="submit"
                              variant="primary"
                              className="mt-2 btn-block"
                            >
                              Submit Review
                            </Button>
                          </Form>
                        ) : (
                          <Message>
                            Please <Link to="/login">sign in</Link> to write a
                            review
                          </Message>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductScreen;
