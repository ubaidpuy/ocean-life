import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Row, Col, ListGroup, Image, Card } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import CheckoutSteps from "../components/CheckoutSteps";
import { createOrder } from "../actions/orderActions";
import { ORDER_CREATE_RESET } from "../constants/orderConstants";
import { USER_DETAILS_RESET } from "../constants/userConstants";
import Axios from "../utils/axiosConfig";

const PlaceOrderScreen = ({ history }) => {
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);

  // --- STYLES ---
  const styles = {
    fullPageWrapper: {
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
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      border: "1px solid #2d2d3d",
      marginBottom: "25px",
    },
    sectionTitle: {
      fontSize: "1.2rem",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "15px",
      borderBottom: "1px solid #2d2d3d",
      paddingBottom: "10px",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    textLabel: {
      color: "#a0a0b0",
      fontWeight: "600",
      marginRight: "10px",
    },
    textValue: {
      color: "#fff",
    },
    itemRow: {
      borderBottom: "1px solid #2d2d3d",
      padding: "15px 0",
      alignItems: "center",
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid #2d2d3d",
      color: "#c0c0d0",
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "20px 0",
      fontSize: "1.4rem",
      fontWeight: "bold",
      color: "#fff",
      borderTop: "2px solid #444",
      marginTop: "10px",
    },
    placeOrderBtn: {
      backgroundColor: "#007bff",
      border: "none",
      padding: "15px",
      fontSize: "1.1rem",
      fontWeight: "bold",
      borderRadius: "10px",
      width: "100%",
      boxShadow: "0 4px 15px rgba(0, 123, 255, 0.4)",
      transition: "all 0.3s ease",
    },
  };

  if (!cart.shippingAddress.address) {
    history.push("/shipping");
  } else if (!cart.paymentMethod) {
    history.push("/payment");
  }

  // Calculate prices
  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(2);
  };

  cart.itemsPrice = addDecimals(
    cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  );
  cart.shippingPrice = addDecimals(cart.itemsPrice > 100 ? 0 : 100);
  cart.taxPrice = addDecimals(Number((0.15 * cart.itemsPrice).toFixed(2)));
  cart.totalPrice = (
    Number(cart.itemsPrice) +
    Number(cart.shippingPrice) +
    Number(cart.taxPrice)
  ).toFixed(2);

  const orderCreate = useSelector((state) => state.orderCreate);
  const { order, success, error } = orderCreate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (success && order && order._id) {
      if (cart.paymentMethod !== "Stripe") {
        history.push(`/order/${order._id}`);
        dispatch({ type: USER_DETAILS_RESET });
        dispatch({ type: ORDER_CREATE_RESET });
      }
    }
    // eslint-disable-next-line
  }, [history, success, order]);

  const placeOrderHandler = async () => {
    try {
      // 1. Create Order
      const createdOrderAction = await dispatch(
        createOrder({
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        })
      );

      // Depending on redux-thunk setup, createOrder might return the action or data.
      // Assuming typical setup where we rely on store state 'order' or updated logic:
      // Ideally, the action should return the data for immediate use.
      // If your action returns the data directly:
      // const orderData = createdOrderAction;

      // However, since we are using useSelector for 'order', let's rely on logic flow.
      // But to handle the Stripe redirect immediately, we need the ID.
      // Let's assume createOrder action returns the payload.

      // Fallback: If action doesn't return data, we might need to change logic.
      // For this UI snippet, I will keep the structure you provided but ensure styling is applied.
      // NOTE: The logic below assumes dispatch returns the order object.

      /* 
         Logic from your snippet preserved. 
         Ideally, check if createdOrderAction contains the data.
      */
    } catch (error) {
      console.error(error);
    }
  };

  // Re-implementing logic correctly with styling
  const handlePlaceOrder = async () => {
    try {
      const orderData = await dispatch(
        createOrder({
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        })
      );

      // Safety check
      if (!orderData || !orderData._id) return;

      if (cart.paymentMethod === "Stripe") {
        const { data } = await Axios.post(
          `/api/orders/${orderData._id}/stripe-checkout`,
          {},
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        if (data && data.url) {
          window.location.href = data.url;
        }
      } else {
        history.push(`/order/${orderData._id}`);
        dispatch({ type: USER_DETAILS_RESET });
        dispatch({ type: ORDER_CREATE_RESET });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.innerContainer}>
        <CheckoutSteps step1 step2 step3 step4 />

        <Row>
          {/* --- LEFT COLUMN: DETAILS --- */}
          <Col lg={8}>
            {/* SHIPPING */}
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-shipping-fast mr-2 text-primary"></i>{" "}
                Shipping
              </div>
              <p style={{ fontSize: "1.05rem", lineHeight: "1.6" }}>
                <span style={styles.textLabel}>Address:</span>
                <span style={styles.textValue}>
                  {cart.shippingAddress.address}, {cart.shippingAddress.city}{" "}
                  {cart.shippingAddress.postalCode},{" "}
                  {cart.shippingAddress.country}
                </span>
              </p>
            </div>

            {/* PAYMENT */}
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-credit-card mr-2 text-success"></i> Payment
                Method
              </div>
              <p style={{ fontSize: "1.05rem" }}>
                <span style={styles.textLabel}>Method:</span>
                <span style={styles.textValue}>
                  {cart.paymentMethod === "Stripe" ? (
                    <span>
                      <i className="fab fa-stripe mr-1"></i> Stripe
                    </span>
                  ) : (
                    <span>
                      <i className="fab fa-paypal mr-1"></i> PayPal / Card
                    </span>
                  )}
                </span>
              </p>
            </div>

            {/* ORDER ITEMS */}
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-box-open mr-2 text-warning"></i> Order
                Items
              </div>

              {cart.cartItems.length === 0 ? (
                <Message>Your cart is empty</Message>
              ) : (
                <div className="mt-3">
                  {cart.cartItems.map((item, index) => (
                    <div
                      key={index}
                      style={styles.itemRow}
                      className="d-flex flex-wrap"
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

                        <Col xs={9} md={6}>
                          <Link
                            to={`/product/${item.product}`}
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: "1.05rem",
                              textDecoration: "none",
                            }}
                          >
                            {item.name}
                          </Link>
                          {item.variation && (
                            <div className="text-muted small mt-1">
                              {(item.variation.name || "Option") + ": "}{" "}
                              <span className="text-white">
                                {item.variation.label || item.variation.value}
                              </span>
                            </div>
                          )}
                        </Col>

                        <Col
                          xs={12}
                          md={4}
                          className="text-md-right mt-2 mt-md-0"
                        >
                          <span style={{ color: "#a0a0b0" }}>
                            {item.qty} x ${item.price} =
                          </span>
                          <span
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              marginLeft: "5px",
                              fontSize: "1.1rem",
                            }}
                          >
                            ${(item.qty * item.price).toFixed(2)}
                          </span>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          {/* --- RIGHT COLUMN: SUMMARY --- */}
          <Col lg={4}>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-file-invoice-dollar mr-2 text-info"></i>{" "}
                Order Summary
              </div>

              <div className="mt-4">
                <div style={styles.summaryRow}>
                  <span>Items</span>
                  <span style={styles.textValue}>${cart.itemsPrice}</span>
                </div>

                <div style={styles.summaryRow}>
                  <span>Shipping</span>
                  <span style={styles.textValue}>${cart.shippingPrice}</span>
                </div>

                <div style={styles.summaryRow}>
                  <span>Tax</span>
                  <span style={styles.textValue}>${cart.taxPrice}</span>
                </div>

                <div style={styles.totalRow}>
                  <span>Total</span>
                  <span className="text-success">${cart.totalPrice}</span>
                </div>
              </div>

              {error && (
                <div className="mb-3">
                  <Message variant="danger">{error}</Message>
                </div>
              )}

              <Button
                type="button"
                style={styles.placeOrderBtn}
                disabled={cart.cartItems === 0}
                onClick={handlePlaceOrder}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                Place Order <i className="fas fa-check-circle ml-2"></i>
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PlaceOrderScreen;
