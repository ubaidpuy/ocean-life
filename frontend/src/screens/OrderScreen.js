import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { PayPalButton } from "react-paypal-button-v2";
import { Link } from "react-router-dom";
import { Row, Col, ListGroup, Image, Card, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import {
  getOrderDetails,
  payOrder,
  deliverOrder,
} from "../actions/orderActions";
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
} from "../constants/orderConstants";

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id;
  const [sdkReady, setSdkReady] = useState(false);
  const dispatch = useDispatch();

  const orderDetails = useSelector((state) => state.orderDetails);
  const { order, loading, error } = orderDetails;

  const orderPay = useSelector((state) => state.orderPay);
  const { loading: loadingPay, success: successPay } = orderPay;

  const orderDeliver = useSelector((state) => state.orderDeliver);
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // --- STYLES ---
  const styles = {
    variationContainer: {
      display: "flex",
      alignItems: "center",
      marginTop: "4px",
    },
    colorCircle: {
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      marginLeft: "8px",
      border: "1px solid #ccc",
      display: "inline-block",
    },
  };

  if (!loading && order) {
    const addDecimals = (num) => {
      return (Math.round(num * 100) / 100).toFixed(2);
    };

    order.itemsPrice = addDecimals(
      order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    );
  }

  useEffect(() => {
    if (!userInfo) return;

    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get("success");
    const sessionId = urlParams.get("session_id");

    if (stripeSuccess === "true" && sessionId) {
      const verifyStripePayment = async () => {
        try {
          const config = {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          };
          const { data } = await axios.get(
            `/api/orders/${orderId}/verify-stripe?session_id=${sessionId}`,
            config
          );
          if (data.verified) {
            dispatch(getOrderDetails(orderId));
            window.history.replaceState(
              {},
              document.title,
              `/order/${orderId}`
            );
          }
        } catch (error) {
          console.error("Error verifying Stripe payment:", error);
        }
      };
      verifyStripePayment();
    }
  }, [orderId, userInfo, dispatch]);

  useEffect(() => {
    if (!userInfo) {
      history.push("/login");
      return;
    }

    const addPayPalScript = async () => {
      const { data: clientId } = await axios.get("/api/config/paypal");
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
      script.async = true;
      script.onload = () => setSdkReady(true);
      document.body.appendChild(script);
    };

    if (!order || successPay || successDeliver || order._id !== orderId) {
      dispatch({ type: ORDER_PAY_RESET });
      dispatch({ type: ORDER_DELIVER_RESET });
      dispatch(getOrderDetails(orderId));
    } else if (!order.isPaid && order.paymentMethod === "PayPal") {
      if (!window.paypal) {
        addPayPalScript();
      } else {
        setSdkReady(true);
      }
    }
  }, [dispatch, orderId, successPay, successDeliver, order, userInfo, history]);

  const successPaymentHandler = (paymentResult) => {
    dispatch(payOrder(orderId, paymentResult));
  };

  const deliverHandler = () => {
    dispatch(deliverOrder(order));
  };

  const handleStripeCheckout = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(
        `/api/orders/${orderId}/stripe-checkout`,
        {},
        config
      );
      if (data && data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Error initiating Stripe checkout:", error);
    }
  };

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant="danger">{error}</Message>
  ) : (
    <>
      <h1>Order {order._id}</h1>
      <Row>
        <Col md={8}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Name: </strong> {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>{" "}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>Address:</strong> {order.shippingAddress.address},{" "}
                {order.shippingAddress.city} {order.shippingAddress.postalCode},{" "}
                {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <Message variant="success">
                  Delivered on {order.deliveredAt}
                </Message>
              ) : (
                <Message variant="danger">Not Delivered</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong> {order.paymentMethod}
              </p>
              {order.isPaid ? (
                <Message variant="success">Paid on {order.paidAt}</Message>
              ) : (
                <Message variant="danger">Not Paid</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant="flush">
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>

                          {/* UPDATED VARIATION LOGIC */}
                          {item.variation && (
                            <div
                              className="text-muted small"
                              style={styles.variationContainer}
                            >
                              <span style={{ fontWeight: "600" }}>
                                {item.variation.label || item.variation.name}:
                              </span>

                              {/* If label is color and value is a hex code, show circle */}
                              {(item.variation.label
                                ?.toLowerCase()
                                .includes("color") ||
                                item.variation.key
                                  ?.toLowerCase()
                                  .includes("color")) &&
                              item.variation.value?.startsWith("#") ? (
                                <div
                                  style={{
                                    ...styles.colorCircle,
                                    backgroundColor: item.variation.value,
                                  }}
                                />
                              ) : (
                                <span className="ml-1">
                                  {item.variation.value}
                                </span>
                              )}
                            </div>
                          )}

                          {item.sku && (
                            <div className="text-muted small">
                              SKU: {item.sku}
                            </div>
                          )}
                        </Col>
                        <Col md={4}>
                          {item.qty} x ${item.price} = ${item.qty * item.price}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>${order.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>${order.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>${order.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>${order.totalPrice}</Col>
                </Row>
              </ListGroup.Item>
              {!order.isPaid && (
                <ListGroup.Item>
                  {loadingPay && <Loader />}
                  {order.paymentMethod === "PayPal" ? (
                    !sdkReady ? (
                      <Loader />
                    ) : (
                      <PayPalButton
                        amount={order.totalPrice}
                        onSuccess={successPaymentHandler}
                      />
                    )
                  ) : order.paymentMethod === "Stripe" ? (
                    <div>
                      <Button
                        type="button"
                        className="btn btn-block btn-primary"
                        onClick={handleStripeCheckout}
                        disabled={loadingPay}
                      >
                        Pay with Stripe
                      </Button>
                    </div>
                  ) : null}
                </ListGroup.Item>
              )}
              {loadingDeliver && <Loader />}
              {userInfo?.isAdmin && order.isPaid && !order.isDelivered && (
                <ListGroup.Item>
                  <Button
                    type="button"
                    className="btn btn-block"
                    onClick={deliverHandler}
                  >
                    Mark As Delivered
                  </Button>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;
