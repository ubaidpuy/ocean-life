import React, { useState } from "react";
import { Form, Button, Col, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import FormContainer from "../components/FormContainer";
import CheckoutSteps from "../components/CheckoutSteps";
import { savePaymentMethod } from "../actions/cartActions";

const PaymentScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  if (!shippingAddress.address) {
    history.push("/shipping");
  }

  const [paymentMethod, setPaymentMethod] = useState("PayPal");

  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    history.push("/placeorder");
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
      marginBottom: "40px",
      color: "#fff",
      fontWeight: "700",
      letterSpacing: "1px",
      textTransform: "uppercase",
      fontSize: "1.8rem",
    },
    optionCard: (isSelected) => ({
      backgroundColor: isSelected ? "rgba(0, 123, 255, 0.1)" : "#252535",
      border: isSelected ? "2px solid #007bff" : "1px solid #333",
      borderRadius: "15px",
      padding: "20px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
      boxShadow: isSelected ? "0 0 20px rgba(0, 123, 255, 0.3)" : "none",
    }),
    iconWrapper: {
      fontSize: "2rem",
      marginRight: "20px",
      width: "50px",
      textAlign: "center",
    },
    optionText: {
      flex: 1,
      fontSize: "1.2rem",
      fontWeight: "600",
      color: "#fff",
    },
    radioButton: (isSelected) => ({
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      border: isSelected ? "6px solid #007bff" : "2px solid #666",
      backgroundColor: isSelected ? "#fff" : "transparent",
      transition: "all 0.2s",
    }),
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
        <CheckoutSteps step1 step2 step3 />

        <div style={styles.card}>
          <h1 style={styles.header}>
            <i className="fas fa-wallet mr-3 text-success"></i>
            Payment Method
          </h1>

          <Form onSubmit={submitHandler}>
            {/* PayPal Option */}
            <div
              style={styles.optionCard(paymentMethod === "PayPal")}
              onClick={() => setPaymentMethod("PayPal")}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...styles.iconWrapper, color: "#00457C" }}>
                  <i className="fab fa-paypal"></i>
                </div>
                <div>
                  <div style={styles.optionText}>PayPal or Credit Card</div>
                  <small className="text-muted">
                    Pay securely with your PayPal account
                  </small>
                </div>
              </div>
              <div style={styles.radioButton(paymentMethod === "PayPal")}></div>
            </div>

            {/* Stripe Option */}
            <div
              style={styles.optionCard(paymentMethod === "Stripe")}
              onClick={() => setPaymentMethod("Stripe")}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...styles.iconWrapper, color: "#6772e5" }}>
                  <i className="fab fa-stripe"></i>
                </div>
                <div>
                  <div style={styles.optionText}>Stripe</div>
                  <small className="text-muted">
                    Pay with Visa, Mastercard, or Amex
                  </small>
                </div>
              </div>
              <div style={styles.radioButton(paymentMethod === "Stripe")}></div>
            </div>

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
              Continue <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </Form>
        </div>
      </FormContainer>
    </div>
  );
};

export default PaymentScreen;
