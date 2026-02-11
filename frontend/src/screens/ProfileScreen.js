import React, { useState, useEffect } from "react";
import { Table, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import { getUserDetails, updateUserProfile } from "../actions/userActions";
import { listMyOrders } from "../actions/orderActions";
import { USER_UPDATE_PROFILE_RESET } from "../constants/userConstants";

const ProfileScreen = ({ location, history }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();

  const userDetails = useSelector((state) => state.userDetails);
  const { loading, error, user } = userDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { success } = userUpdateProfile;

  const orderListMy = useSelector((state) => state.orderListMy);
  const { loading: loadingOrders, error: errorOrders, orders } = orderListMy;

  // --- STYLES ---
  const styles = {
    fullPageWrapper: {
      backgroundColor: "#121212",
      minHeight: "100vh",
      paddingTop: "40px",
      paddingBottom: "80px",
      color: "#e0e0e0",
      fontFamily: "'Inter', sans-serif",
      width: "100vw",
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
    },
    innerContainer: {
      maxWidth: "1600px",
      margin: "0 auto",
      padding: "0 40px",
    },
    card: {
      backgroundColor: "#1e1e2e",
      borderRadius: "20px",
      padding: "30px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      border: "1px solid #2d2d3d",
      marginBottom: "30px",
      height: "100%",
    },
    sectionTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "25px",
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid #2d2d3d",
      paddingBottom: "15px",
    },
    label: {
      color: "#a0a0b0",
      fontSize: "0.85rem",
      fontWeight: "600",
      textTransform: "uppercase",
      marginBottom: "8px",
      letterSpacing: "0.5px",
    },
    inputGroupText: {
      backgroundColor: "#252535",
      border: "1px solid #333",
      borderRight: "none",
      color: "#a0a0b0",
    },
    input: {
      backgroundColor: "#161620",
      border: "1px solid #333",
      borderLeft: "none",
      color: "#fff",
      height: "45px",
    },
    button: {
      backgroundColor: "#007bff",
      border: "none",
      padding: "12px",
      borderRadius: "8px",
      fontWeight: "bold",
      width: "100%",
      marginTop: "10px",
      boxShadow: "0 4px 15px rgba(0, 123, 255, 0.4)",
      transition: "all 0.3s ease",
    },
    tableHeader: {
      backgroundColor: "#252535",
      color: "#fff",
      border: "none",
    },
    tableRow: {
      color: "#c0c0d0",
      verticalAlign: "middle",
    },
    statusBadge: (status) => ({
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: "bold",
      backgroundColor: status
        ? "rgba(40, 167, 69, 0.2)"
        : "rgba(220, 53, 69, 0.2)",
      color: status ? "#28a745" : "#dc3545",
      border: status ? "1px solid #28a745" : "1px solid #dc3545",
      display: "inline-block",
      minWidth: "80px",
      textAlign: "center",
    }),
    detailsBtn: {
      backgroundColor: "transparent",
      border: "1px solid #444",
      color: "#fff",
      padding: "5px 15px",
      borderRadius: "20px",
      fontSize: "0.85rem",
      transition: "all 0.2s",
    },
  };

  useEffect(() => {
    if (!userInfo) {
      history.push("/login");
    } else {
      if (!user || !user.name || success) {
        dispatch({ type: USER_UPDATE_PROFILE_RESET });
        dispatch(getUserDetails("profile"));
        dispatch(listMyOrders());
      } else {
        setName(user.name);
        setEmail(user.email);
      }
    }
  }, [dispatch, history, userInfo, user, success]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
    } else {
      dispatch(updateUserProfile({ id: user._id, name, email, password }));
    }
  };

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.innerContainer}>
        <Row>
          {/* --- LEFT COLUMN: PROFILE FORM --- */}
          <Col md={4} className="mb-4">
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-user-circle mr-3 text-primary"></i>
                User Profile
              </div>

              {message && <Message variant="danger">{message}</Message>}
              {error && <Message variant="danger">{error}</Message>}
              {success && (
                <Message variant="success">
                  Profile Updated Successfully
                </Message>
              )}
              {loading && <Loader />}

              <Form onSubmit={submitHandler}>
                <Form.Group controlId="name">
                  <Form.Label style={styles.label}>Full Name</Form.Label>
                  <InputGroup>
                    <InputGroup.Prepend>
                      <InputGroup.Text style={styles.inputGroupText}>
                        <i className="fas fa-user"></i>
                      </InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                      style={styles.input}
                      type="name"
                      placeholder="Enter name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="email">
                  <Form.Label style={styles.label}>Email Address</Form.Label>
                  <InputGroup>
                    <InputGroup.Prepend>
                      <InputGroup.Text style={styles.inputGroupText}>
                        <i className="fas fa-envelope"></i>
                      </InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                      style={styles.input}
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>

                <div className="my-4 border-top border-secondary pt-3">
                  <small className="text-muted d-block mb-3">
                    Leave blank to keep current password
                  </small>

                  <Form.Group controlId="password">
                    <Form.Label style={styles.label}>New Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Prepend>
                        <InputGroup.Text style={styles.inputGroupText}>
                          <i className="fas fa-lock"></i>
                        </InputGroup.Text>
                      </InputGroup.Prepend>
                      <Form.Control
                        style={styles.input}
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group controlId="confirmPassword">
                    <Form.Label style={styles.label}>
                      Confirm Password
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Prepend>
                        <InputGroup.Text style={styles.inputGroupText}>
                          <i className="fas fa-lock"></i>
                        </InputGroup.Text>
                      </InputGroup.Prepend>
                      <Form.Control
                        style={styles.input}
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </div>

                <Button
                  type="submit"
                  style={styles.button}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  Update Profile
                </Button>
              </Form>
            </div>
          </Col>

          {/* --- RIGHT COLUMN: ORDER HISTORY --- */}
          <Col md={8}>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <i className="fas fa-list-alt mr-3 text-success"></i>
                Order History
              </div>

              {loadingOrders ? (
                <Loader />
              ) : errorOrders ? (
                <Message variant="danger">{errorOrders}</Message>
              ) : orders && orders.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="fas fa-shopping-basket mb-3"
                    style={{ fontSize: "3rem", color: "#444" }}
                  ></i>
                  <h4 className="text-muted">No orders found</h4>
                  <LinkContainer to="/">
                    <Button variant="outline-primary" className="mt-2">
                      Start Shopping
                    </Button>
                  </LinkContainer>
                </div>
              ) : (
                <Table hover responsive className="table-borderless mb-0">
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th className="py-3">ORDER ID</th>
                      <th className="py-3">DATE</th>
                      <th className="py-3">TOTAL</th>
                      <th className="py-3 text-center">PAID</th>
                      <th className="py-3 text-center">DELIVERED</th>
                      <th className="py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        style={{ borderBottom: "1px solid #2d2d3d" }}
                      >
                        <td className="py-3" style={{ color: "#fff" }}>
                          #{order._id.substring(0, 8)}...
                        </td>
                        <td className="py-3" style={styles.tableRow}>
                          {order.createdAt.substring(0, 10)}
                        </td>
                        <td
                          className="py-3"
                          style={{ ...styles.tableRow, fontWeight: "bold" }}
                        >
                          ${order.totalPrice}
                        </td>
                        <td className="py-3 text-center">
                          <span style={styles.statusBadge(order.isPaid)}>
                            {order.isPaid
                              ? order.paidAt.substring(0, 10)
                              : "Unpaid"}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span style={styles.statusBadge(order.isDelivered)}>
                            {order.isDelivered
                              ? order.deliveredAt.substring(0, 10)
                              : "Processing"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <LinkContainer to={`/order/${order._id}`}>
                            <Button
                              size="sm"
                              style={styles.detailsBtn}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "#fff";
                                e.currentTarget.style.color = "#000";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                                e.currentTarget.style.color = "#fff";
                              }}
                            >
                              Details{" "}
                              <i className="fas fa-chevron-right ml-1"></i>
                            </Button>
                          </LinkContainer>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProfileScreen;
