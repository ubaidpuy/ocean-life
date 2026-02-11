import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Alert,
  ListGroup,
  Badge,
  Table,
  Toast,
} from "react-bootstrap";
import Message from "../components/Message";
import Loader from "../components/Loader";
import Meta from "../components/Meta";
import axios from "../utils/axiosConfig";

const StoreDashboardScreen = ({ history, location }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [connectStatus, setConnectStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [stockAlertProducts, setStockAlertProducts] = useState([]);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

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
      padding: "25px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      border: "1px solid #2d2d3d",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
    sectionTitle: {
      fontSize: "1.2rem",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "20px",
      borderBottom: "1px solid #2d2d3d",
      paddingBottom: "15px",
      display: "flex",
      alignItems: "center",
    },
    statCard: {
      backgroundColor: "#1e1e2e",
      borderRadius: "15px",
      padding: "25px",
      border: "1px solid #2d2d3d",
      textAlign: "center",
      height: "100%",
      transition: "transform 0.2s",
    },
    label: {
      color: "#a0a0b0",
      fontSize: "0.85rem",
      fontWeight: "600",
      marginBottom: "5px",
    },
    valueBig: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#fff",
      marginBottom: "0",
    },
    listItem: {
      backgroundColor: "transparent",
      borderBottom: "1px solid #2d2d3d",
      color: "#e0e0e0",
      padding: "12px 0",
    },
    darkAlert: {
      backgroundColor: "#2c2c3e",
      border: "1px solid #444",
      color: "#e0e0e0",
      borderRadius: "10px",
    },
  };

  useEffect(() => {
    if (!userInfo) {
      history.push("/login?redirect=/store/dashboard");
      return;
    }

    // Check if user is admin
    if (!userInfo.isAdmin) {
      // User might be a new store owner with stale session data (not yet admin in Redux/LocalStorage)
      // Attempt to refresh profile to see if they are now an admin
      const refreshProfile = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const { data } = await axios.get("/api/users/profile", config);
          
          if (data.isAdmin) {
            // Update Redux and LocalStorage
            dispatch({
              type: "USER_LOGIN_SUCCESS", // Import if needed or use string
              payload: { ...data, token: userInfo.token },
            });
            localStorage.setItem("userInfo", JSON.stringify({ ...data, token: userInfo.token }));
            // Reload page to ensure everything syncs (simple way)
            window.location.reload();
          } else {
            // Still not admin, redirect
            history.push("/");
          }
        } catch (error) {
           console.error("Error refreshing profile:", error);
           history.push("/");
        }
      };
      refreshProfile();
      return;
    }

    // Load subscription and connect status
    loadStatus();

    // Set up polling every 20 seconds
    const intervalId = setInterval(() => {
      loadStatus(true); // Silent reload
    }, 20000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, [userInfo, history]);

  const loadStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Fetch dashboard data
      try {
        const dashboardResponse = await axios.get(
          "/api/stores/dashboard",
          config
        );
        setDashboardData(dashboardResponse.data);

        // Check for out of stock products
        if (
          dashboardResponse.data.products?.outOfStockList &&
          dashboardResponse.data.products.outOfStockList.length > 0
        ) {
          setStockAlertProducts(dashboardResponse.data.products.outOfStockList);
          setShowStockAlert(true);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }

      // Fetch subscription status
      try {
        const subResponse = await axios.get(
          "/api/subscriptions/status",
          config
        );
        setSubscriptionStatus(subResponse.data);
      } catch (err) {
        console.error("Error fetching subscription status:", err);
      }

      // Fetch connect status
      try {
        const connectResponse = await axios.get("/api/connect/status", config);
        setConnectStatus(connectResponse.data);
      } catch (err) {
        console.error("Error fetching connect status:", err);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Error loading dashboard data"
      );
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.fullPageWrapper}>
        <Loader />
      </div>
    );
  }

  const needsSubscription =
    !subscriptionStatus || subscriptionStatus.subscriptionStatus !== "active";
  const needsConnect =
    !connectStatus || connectStatus.stripeAccountStatus !== "active";

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.innerContainer}>
        <Meta title="Store Dashboard" />

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white font-weight-bold m-0">
            <i className="fas fa-chart-line mr-3 text-primary"></i>
            Store Dashboard
          </h2>
          <span className="text-muted">
            Welcome back, {userInfo.name.split(" ")[0]}
          </span>
        </div>

        {error && <Message variant="danger">{error}</Message>}

        {/* --- STOCK ALERT TOAST --- */}
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
          }}
        >
          <Toast
            onClose={() => setShowStockAlert(false)}
            show={showStockAlert}
            delay={5000}
            autohide
            style={{
              backgroundColor: "#ff4757", // Alarming red
              color: "#fff",
              minWidth: "300px",
            }}
          >
            <Toast.Header
              style={{
                backgroundColor: "#2f3542",
                color: "#ff4757",
                fontWeight: "bold",
              }}
            >
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong className="mr-auto">Stock Alert</strong>
              <small>Just now</small>
            </Toast.Header>
            <Toast.Body style={{ fontSize: "1.1rem", fontWeight: "500" }}>
              <p className="mb-2">The following products are out of stock:</p>
              <ul className="pl-3 mb-0" style={{ listStyleType: "circle" }}>
                {stockAlertProducts.map((p) => (
                  <li key={p._id}>{p.name}</li>
                ))}
              </ul>
            </Toast.Body>
          </Toast>
        </div>

        {/* --- ALERTS SECTION --- */}
        {(needsSubscription ||
          needsConnect ||
          location.search.includes("setup=complete")) && (
          <Row className="mb-4">
            <Col md={12}>
              {/* Subscription Alert */}
              {needsSubscription && (
                <Alert variant="warning" style={{ borderRadius: "10px" }}>
                  <Alert.Heading className="font-weight-bold">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Subscription Required
                  </Alert.Heading>
                  <p className="mb-0">
                    You need an active subscription to access all store features
                    and receive payments.
                  </p>
                  <hr />
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="warning"
                      className="font-weight-bold"
                      onClick={() => history.push("/subscription")}
                    >
                      <i className="fas fa-credit-card mr-2"></i>
                      Subscribe Now
                    </Button>
                  </div>
                </Alert>
              )}

              {/* Connect Alert */}
              {needsConnect && (
                <Alert variant="info" style={{ borderRadius: "10px" }}>
                  <Alert.Heading className="font-weight-bold">
                    <i className="fas fa-wallet mr-2"></i>
                    Payment Account Setup Required
                  </Alert.Heading>
                  <p className="mb-0">
                    Set up your payment account to receive payments from
                    customers. This is required for your store to process
                    orders.
                  </p>
                  <hr />
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="info"
                      className="font-weight-bold text-white"
                      onClick={() => history.push("/connect/setup")}
                    >
                      <i className="fas fa-wallet mr-2"></i>
                      Set Up Payment Account
                    </Button>
                  </div>
                </Alert>
              )}

              {/* Success Message */}
              {location.search.includes("setup=complete") && (
                <Alert variant="success" style={{ borderRadius: "10px" }}>
                  <i className="fas fa-check-circle mr-2"></i>
                  Store setup completed successfully! You can now start adding
                  products and receiving orders.
                </Alert>
              )}
            </Col>
          </Row>
        )}

        {/* --- STATUS CARDS --- */}
        <Row className="mb-4 align-items-stretch">
          {/* Subscription Status Card */}
          <Col md={6} className="mb-4 mb-md-0">
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-credit-card mr-2 text-warning"></i>
                Subscription Status
              </div>
              <div className="flex-grow-1">
                {subscriptionStatus ? (
                  <ListGroup variant="flush">
                    <ListGroup.Item
                      style={styles.listItem}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>Current Status</span>
                      <Badge
                        variant={
                          subscriptionStatus.subscriptionStatus === "active"
                            ? "success"
                            : subscriptionStatus.subscriptionStatus ===
                              "canceled"
                            ? "danger"
                            : "warning"
                        }
                        style={{ fontSize: "0.9rem", padding: "8px 12px" }}
                      >
                        {subscriptionStatus.subscriptionStatus
                          ? subscriptionStatus.subscriptionStatus
                              .charAt(0)
                              .toUpperCase() +
                            subscriptionStatus.subscriptionStatus.slice(1)
                          : "Not Subscribed"}
                      </Badge>
                    </ListGroup.Item>

                    {subscriptionStatus.subscriptionDetails && (
                      <>
                        <ListGroup.Item style={styles.listItem}>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Renewal Date</span>
                            <span>
                              {new Date(
                                subscriptionStatus.subscriptionDetails.currentPeriodEnd
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </ListGroup.Item>
                        {subscriptionStatus.subscriptionDetails
                          .cancelAtPeriodEnd && (
                          <ListGroup.Item style={styles.listItem}>
                            <Badge variant="warning">
                              Will cancel at period end
                            </Badge>
                          </ListGroup.Item>
                        )}
                      </>
                    )}
                  </ListGroup>
                ) : (
                  <p className="text-muted mb-0">No subscription found</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-top border-secondary">
                {needsSubscription ? (
                  <Button
                    variant="primary"
                    block
                    onClick={() => history.push("/subscription")}
                  >
                    Subscribe Now
                  </Button>
                ) : (
                  <Button
                    variant="outline-light"
                    block
                    onClick={() => history.push("/subscription")}
                  >
                    Manage Subscription
                  </Button>
                )}
              </div>
            </div>
          </Col>

          {/* Connect Account Status Card */}
          <Col md={6}>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-university mr-2 text-info"></i>
                Payout Account
              </div>
              <div className="flex-grow-1">
                {connectStatus ? (
                  <ListGroup variant="flush">
                    <ListGroup.Item
                      style={styles.listItem}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>Account Status</span>
                      <Badge
                        variant={
                          connectStatus.stripeAccountStatus === "active"
                            ? "success"
                            : connectStatus.stripeAccountStatus === "pending"
                            ? "warning"
                            : "danger"
                        }
                        style={{ fontSize: "0.9rem", padding: "8px 12px" }}
                      >
                        {connectStatus.stripeAccountStatus
                          ? connectStatus.stripeAccountStatus
                              .charAt(0)
                              .toUpperCase() +
                            connectStatus.stripeAccountStatus.slice(1)
                          : "Not Set Up"}
                      </Badge>
                    </ListGroup.Item>
                    {connectStatus.accountDetails && (
                      <>
                        <ListGroup.Item style={styles.listItem}>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Charges Enabled</span>
                            {connectStatus.accountDetails.chargesEnabled ? (
                              <span className="text-success">
                                <i className="fas fa-check-circle mr-1"></i> Yes
                              </span>
                            ) : (
                              <span className="text-danger">No</span>
                            )}
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item style={styles.listItem}>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Payouts Enabled</span>
                            {connectStatus.accountDetails.payoutsEnabled ? (
                              <span className="text-success">
                                <i className="fas fa-check-circle mr-1"></i> Yes
                              </span>
                            ) : (
                              <span className="text-danger">No</span>
                            )}
                          </div>
                        </ListGroup.Item>
                      </>
                    )}
                  </ListGroup>
                ) : (
                  <p className="text-muted mb-0">No payment account found</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-top border-secondary">
                {needsConnect ? (
                  <Button
                    variant="primary"
                    block
                    onClick={() => history.push("/connect/setup")}
                  >
                    Set Up Account
                  </Button>
                ) : (
                  <Button
                    variant="outline-light"
                    block
                    onClick={() => history.push("/connect/setup")}
                  >
                    Manage Payout Settings
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* --- STATS GRID --- */}
        {dashboardData && (
          <>
            <Row className="mb-4">
              <Col md={3} className="mb-3 mb-md-0">
                <div style={styles.statCard}>
                  <div
                    className="text-primary mb-2"
                    style={{ fontSize: "2rem" }}
                  >
                    <i className="fas fa-shopping-cart"></i>
                  </div>
                  <h3 style={styles.valueBig}>
                    {dashboardData.orders?.total || 0}
                  </h3>
                  <p style={styles.label}>TOTAL ORDERS</p>
                  <small className="text-muted">
                    {dashboardData.orders?.paid || 0} Paid &bull;{" "}
                    {dashboardData.orders?.pending || 0} Pending
                  </small>
                </div>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <div style={styles.statCard}>
                  <div
                    className="text-success mb-2"
                    style={{ fontSize: "2rem" }}
                  >
                    <i className="fas fa-dollar-sign"></i>
                  </div>
                  <h3 style={styles.valueBig}>
                    ${dashboardData.revenue?.total || "0.00"}
                  </h3>
                  <p style={styles.label}>TOTAL REVENUE</p>
                  <small className="text-muted">From paid orders</small>
                </div>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <div style={styles.statCard}>
                  <div className="text-info mb-2" style={{ fontSize: "2rem" }}>
                    <i className="fas fa-box-open"></i>
                  </div>
                  <h3 style={styles.valueBig}>
                    {dashboardData.products?.total || 0}
                  </h3>
                  <p style={styles.label}>TOTAL PRODUCTS</p>
                  <small className="text-muted">
                    {dashboardData.products?.inStock || 0} In Stock
                  </small>
                </div>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <div style={styles.statCard}>
                  <div
                    className="text-warning mb-2"
                    style={{ fontSize: "2rem" }}
                  >
                    <i className="fas fa-users"></i>
                  </div>
                  <h3 style={styles.valueBig}>
                    {dashboardData.users?.total || 0}
                  </h3>
                  <p style={styles.label}>TOTAL USERS</p>
                  <small className="text-muted">
                    {dashboardData.users?.customers || 0} Customers
                  </small>
                </div>
              </Col>
            </Row>

            <Row className="align-items-start">
              {/* --- RECENT ORDERS --- */}
              <Col lg={8} className="mb-4">
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-clock mr-2 text-white"></i>
                    Recent Orders
                  </div>

                  {dashboardData.orders?.recent &&
                  dashboardData.orders.recent.length > 0 ? (
                    <>
                      <Table
                        responsive
                        hover
                        variant="dark"
                        className="mb-0"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <thead style={{ backgroundColor: "#161620" }}>
                          <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.orders.recent.map((order) => (
                            <tr key={order._id}>
                              <td>
                                <span className="text-muted">#</span>
                                {order._id.substring(0, 6)}
                              </td>
                              <td>{order.user?.name || "Guest"}</td>
                              <td>${order.totalPrice?.toFixed(2) || "0.00"}</td>
                              <td>
                                {order.isPaid ? (
                                  <Badge variant="success">Paid</Badge>
                                ) : (
                                  <Badge variant="warning">Pending</Badge>
                                )}
                              </td>
                              <td>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="text-right">
                                <Link
                                  to={`/order/${order._id}`}
                                  className="btn btn-sm btn-outline-light"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div className="text-center mt-3 pt-3 border-top border-secondary">
                        <Link
                          to="/admin/orderlist"
                          className="btn btn-link text-white"
                        >
                          View All Orders <i className="fas fa-arrow-right"></i>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      No recent orders found.
                    </div>
                  )}
                </div>
              </Col>

              {/* --- STORE INFO & QUICK ACTIONS --- */}
              <Col lg={4}>
                {/* Store Info */}
                {dashboardData.store && (
                  <div style={styles.card} className="mb-4">
                    <div style={styles.sectionTitle}>
                      <i className="fas fa-store mr-2 text-success"></i>
                      Store Info
                    </div>
                    <ListGroup variant="flush">
                      <ListGroup.Item style={styles.listItem}>
                        <div className="d-flex justify-content-between">
                          <strong className="text-muted">Name</strong>
                          <span>{dashboardData.store.name}</span>
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item style={styles.listItem}>
                        <div className="d-flex justify-content-between">
                          <strong className="text-muted">Domain</strong>
                          <span>{dashboardData.store.subdomain}</span>
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item style={styles.listItem}>
                        <div className="d-flex justify-content-between">
                          <strong className="text-muted">Status</strong>
                          <Badge
                            variant={
                              dashboardData.store.isActive
                                ? "success"
                                : "danger"
                            }
                          >
                            {dashboardData.store.isActive
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item style={styles.listItem}>
                        <div className="d-flex justify-content-between">
                          <strong className="text-muted">Payment</strong>
                          <Badge
                            variant={
                              dashboardData.store.paymentStatus === "paid"
                                ? "success"
                                : "warning"
                            }
                          >
                            {dashboardData.store.paymentStatus || "Pending"}
                          </Badge>
                        </div>
                      </ListGroup.Item>
                    </ListGroup>
                  </div>
                )}

                {/* Quick Actions */}
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-bolt mr-2 text-danger"></i>
                    Quick Actions
                  </div>
                  <Row>
                    <Col xs={12} className="mb-3">
                      <Link to="/admin/productlist">
                        <Button variant="outline-primary" block size="lg">
                          <i className="fas fa-box mr-2"></i> Products
                        </Button>
                      </Link>
                    </Col>
                    <Col xs={12} className="mb-3">
                      <Link to="/admin/orderlist">
                        <Button variant="outline-success" block size="lg">
                          <i className="fas fa-shopping-cart mr-2"></i> Orders
                        </Button>
                      </Link>
                    </Col>
                    <Col xs={12}>
                      <Link to="/profile">
                        <Button variant="outline-info" block size="lg">
                          <i className="fas fa-user-cog mr-2"></i> Profile
                        </Button>
                      </Link>
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

export default StoreDashboardScreen;
