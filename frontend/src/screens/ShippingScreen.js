import React, { useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import FormContainer from "../components/FormContainer";
import CheckoutSteps from "../components/CheckoutSteps";
import { saveShippingAddress } from "../actions/cartActions";

const ShippingScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  const [address, setAddress] = useState(shippingAddress.address || "");
  const [city, setCity] = useState(shippingAddress.city || "");
  const [postalCode, setPostalCode] = useState(
    shippingAddress.postalCode || ""
  );
  const [country, setCountry] = useState(shippingAddress.country || "");

  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(saveShippingAddress({ address, city, postalCode, country }));
    history.push("/payment");
  };

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
    card: {
      backgroundColor: "#1e1e2e",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      border: "1px solid #2d2d3d",
      marginTop: "20px",
    },
    header: {
      textAlign: "center",
      marginBottom: "30px",
      color: "#fff",
      fontWeight: "700",
      letterSpacing: "1px",
      textTransform: "uppercase",
      fontSize: "1.8rem",
    },
    label: {
      color: "#a0a0b0",
      fontSize: "0.85rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px",
      display: "block",
    },
    inputGroupText: {
      backgroundColor: "#252535",
      border: "1px solid #333",
      borderRight: "none",
      color: "#a0a0b0",
      borderTopLeftRadius: "10px",
      borderBottomLeftRadius: "10px",
    },
    input: {
      backgroundColor: "#161620",
      border: "1px solid #333",
      borderLeft: "none",
      color: "#fff",
      height: "50px",
      borderTopRightRadius: "10px",
      borderBottomRightRadius: "10px",
      fontSize: "1rem",
    },
    button: {
      backgroundColor: "#007bff",
      border: "none",
      padding: "15px",
      borderRadius: "10px",
      fontSize: "1.1rem",
      fontWeight: "bold",
      width: "100%",
      marginTop: "20px",
      boxShadow: "0 4px 15px rgba(0, 123, 255, 0.4)",
      transition: "all 0.3s ease",
    },
  };

  return (
    <div style={styles.fullPageWrapper}>
      <FormContainer>
        <CheckoutSteps step1 step2 />

        <div style={styles.card}>
          <h1 style={styles.header}>
            <i className="fas fa-shipping-fast mr-3 text-primary"></i>
            Shipping Details
          </h1>

          <Form onSubmit={submitHandler}>
            {/* Address Input */}
            <Form.Group controlId="address" className="mb-4">
              <Form.Label style={styles.label}>Address</Form.Label>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text style={styles.inputGroupText}>
                    <i className="fas fa-map-marker-alt"></i>
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  placeholder="123 Main St, Apt 4B"
                  value={address}
                  required
                  onChange={(e) => setAddress(e.target.value)}
                  style={styles.input}
                />
              </InputGroup>
            </Form.Group>

            {/* City Input */}
            <Form.Group controlId="city" className="mb-4">
              <Form.Label style={styles.label}>City</Form.Label>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text style={styles.inputGroupText}>
                    <i className="fas fa-city"></i>
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  placeholder="New York"
                  value={city}
                  required
                  onChange={(e) => setCity(e.target.value)}
                  style={styles.input}
                />
              </InputGroup>
            </Form.Group>

            {/* Postal Code Input */}
            <Form.Group controlId="postalCode" className="mb-4">
              <Form.Label style={styles.label}>Postal Code</Form.Label>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text style={styles.inputGroupText}>
                    <i className="fas fa-envelope"></i>
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  placeholder="10001"
                  value={postalCode}
                  required
                  onChange={(e) => setPostalCode(e.target.value)}
                  style={styles.input}
                />
              </InputGroup>
            </Form.Group>

            {/* Country Input */}
            <Form.Group controlId="country" className="mb-4">
              <Form.Label style={styles.label}>Country</Form.Label>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text style={styles.inputGroupText}>
                    <i className="fas fa-globe-americas"></i>
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  placeholder="United States"
                  value={country}
                  required
                  onChange={(e) => setCountry(e.target.value)}
                  style={styles.input}
                />
              </InputGroup>
            </Form.Group>

            <Button
              type="submit"
              style={styles.button}
              className="btn-block"
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              Continue to Payment <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </Form>
        </div>
      </FormContainer>
    </div>
  );
};

export default ShippingScreen;
