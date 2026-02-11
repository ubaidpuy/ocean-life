import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Image, Button } from "react-bootstrap";
import Message from "../components/Message";
import QuantitySelector from "../components/QuantitySelector";
import { addToCart, removeFromCart } from "../actions/cartActions";

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id;
  const searchParams = new URLSearchParams(location.search);
  const qty = searchParams.get("qty") ? Number(searchParams.get("qty")) : 1;
  const variationIdFromUrl = searchParams.get("variationId") || null;

  const variationMetaFromUrl = {
    key: searchParams.get("vKey") || "",
    name: searchParams.get("vName") || "",
    value: searchParams.get("vValue") || "",
    label: searchParams.get("vLabel") || "",
  };

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

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
      padding: "25px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      border: "1px solid #2d2d3d",
      marginBottom: "20px",
    },
    header: {
      fontSize: "1.8rem",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "30px",
      paddingBottom: "15px",
      borderBottom: "1px solid #2d2d3d",
    },
    cartItem: {
      borderBottom: "1px solid #2d2d3d",
      padding: "20px 0",
      transition: "background-color 0.2s",
    },
    itemName: {
      fontSize: "1.1rem",
      fontWeight: "600",
      color: "#fff",
      textDecoration: "none",
      display: "block",
      marginBottom: "8px",
    },
    variationText: {
      color: "#a0a0b0",
      fontSize: "0.85rem",
      marginBottom: "6px",
      display: "flex",
      alignItems: "center",
    },
    colorCircle: {
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      marginLeft: "8px",
      border: "1px solid #555",
      display: "inline-block",
    },
    price: {
      fontSize: "1.2rem",
      fontWeight: "700",
      color: "#fff",
    },
    subtotalLabel: {
      color: "#a0a0b0",
      fontSize: "1rem",
      fontWeight: "500",
    },
    subtotalValue: {
      color: "#fff",
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    emptyMessage: {
      backgroundColor: "#1e1e2e",
      border: "1px solid #2d2d3d",
      borderRadius: "10px",
      padding: "40px",
      textAlign: "center",
      color: "#a0a0b0",
    },
  };

  useEffect(() => {
    if (productId) {
      const variationInfo = variationIdFromUrl
        ? {
            variationId: variationIdFromUrl,
            variationMeta: variationMetaFromUrl,
          }
        : null;
      dispatch(addToCart(productId, qty, variationInfo));
    }
  }, [dispatch, productId, qty, variationIdFromUrl]);

  const removeFromCartHandler = (id, variationId) => {
    dispatch(removeFromCart(id, variationId));
  };

  const checkoutHandler = () => {
    history.push("/login?redirect=shipping");
  };

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.innerContainer}>
        <h1 style={styles.header}>
          <i className="fas fa-shopping-cart mr-3 text-primary"></i>
          Shopping Cart
        </h1>

        <Row>
          <Col md={8}>
            {cartItems.length === 0 ? (
              <div style={styles.emptyMessage}>
                <i
                  className="fas fa-shopping-basket mb-3"
                  style={{ fontSize: "3rem", opacity: 0.5 }}
                ></i>
                <h3>Your cart is empty</h3>
                <Link to="/" className="btn btn-primary mt-3">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div style={styles.card}>
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.product}-${
                      item.variationId || "default"
                    }-${index}`}
                    style={styles.cartItem}
                  >
                    <Row className="w-100 align-items-center m-0">
                      <Col xs={3} md={2}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          fluid
                          rounded
                          style={{
                            border: "1px solid #333",
                            backgroundColor: "#000",
                          }}
                        />
                      </Col>

                      <Col xs={9} md={4}>
                        <Link
                          to={`/product/${item.product}`}
                          style={styles.itemName}
                        >
                          {item.name}
                        </Link>

                        {item.variation && (
                          <div className="mt-1">
                            {(Array.isArray(item.variation)
                              ? item.variation
                              : [item.variation]
                            ).map((v, i) => {
                              // Smarter check: must be named 'color' AND have a '#' hex value
                              const isColor =
                                (v.name?.toLowerCase().includes("color") ||
                                  v.key?.toLowerCase().includes("color")) &&
                                v.value?.startsWith("#");

                              return (
                                <div key={i} style={styles.variationText}>
                                  <span
                                    style={{
                                      fontWeight: "600",
                                      color: "#a0a0b0",
                                    }}
                                  >
                                    {v.label || v.name}:
                                  </span>
                                  {isColor ? (
                                    <div
                                      style={{
                                        ...styles.colorCircle,
                                        backgroundColor: v.value,
                                      }}
                                      title={v.value}
                                    />
                                  ) : (
                                    <span
                                      className="text-white ml-2"
                                      style={{ fontStyle: "normal" }}
                                    >
                                      {v.value}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="d-md-none mt-2 font-weight-bold text-white">
                          ${item.price}
                        </div>
                      </Col>

                      <Col md={2} className="d-none d-md-block text-center">
                        <div style={styles.price}>${item.price}</div>
                      </Col>

                      <Col xs={8} md={3} className="mt-3 mt-md-0">
                        <div
                          style={{
                            backgroundColor: "#161620",
                            borderRadius: "6px",
                            padding: "4px",
                            border: "1px solid #333",
                          }}
                        >
                          <QuantitySelector
                            qty={item.qty}
                            onQtyChange={(newQty) =>
                              dispatch(
                                addToCart(item.product, newQty, {
                                  variationId: item.variationId,
                                  variationMeta: item.variation,
                                })
                              )
                            }
                            maxStock={item.countInStock}
                          />
                        </div>
                      </Col>

                      <Col xs={4} md={1} className="text-right mt-3 mt-md-0">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          style={{
                            border: "1px solid #d9534f",
                            borderRadius: "50%",
                            width: "35px",
                            height: "35px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onClick={() =>
                            removeFromCartHandler(
                              item.product,
                              item.variationId
                            )
                          }
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </Col>

          <Col md={4}>
            <div style={styles.card}>
              <div className="border-bottom border-secondary pb-3 mb-3">
                <div style={styles.subtotalLabel}>
                  Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)}{" "}
                  items)
                </div>
                <div style={styles.subtotalValue} className="mt-2">
                  $
                  {cartItems
                    .reduce((acc, item) => acc + item.qty * item.price, 0)
                    .toFixed(2)}
                </div>
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between text-muted small mb-2">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="d-flex justify-content-between text-muted small">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <Button
                className="btn-block btn-lg btn-primary shadow-sm"
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
                style={{
                  fontWeight: "bold",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                Proceed To Checkout
              </Button>
              <div className="text-center mt-3">
                <Link to="/" className="text-muted small text-decoration-none">
                  <i className="fas fa-arrow-left mr-1"></i> Continue Shopping
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CartScreen;
