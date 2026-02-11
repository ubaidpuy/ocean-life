import React, { useState } from "react";
import { Link } from "react-router-dom";
import Message from "../components/Message";
import Meta from "../components/Meta";
import axiosInstance from "../utils/axiosConfig";
import "../components/AuthStyles.css";

// Updated InputField with onClearError support
const InputField = ({
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  onClearError, // <--- Prop
  placeholder,
}) => (
  <div className="form-group-dark">
    <label className="form-label-dark">{label}</label>
    <div className="input-container-dark">
      <input
        type={type}
        className={`form-control-dark ${
          error
            ? "is-invalid"
            : value && !error && value.length > 0
            ? "is-valid"
            : ""
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (error && onClearError) onClearError();
        }}
        onBlur={onBlur}
        autoComplete="email"
      />
      <div
        className={`status-icon ${
          error
            ? "invalid"
            : value && !error && value.length > 0
            ? "valid"
            : "neutral"
        }`}
      >
        {error ? (
          <i className="fas fa-times-circle" onClick={onClearError}></i> // Added onClick
        ) : value && !error && value.length > 0 ? (
          <i className="fas fa-check-circle"></i>
        ) : null}
      </div>
    </div>
    {error && (
      <div className="error-msg-anim">
        <i className="fas fa-exclamation-triangle"></i> {error}
      </div>
    )}
  </div>
);

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("danger");
  const [emailError, setEmailError] = useState(null);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleBlur = () => {
    if (!email) {
      setEmailError("Email is required");
    } else if (!validateEmail(email)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError(null);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data } = await axiosInstance.post("/api/users/forgot-password", {
        email,
      });
      setVariant("success");
      setMessage(data.message || "Email sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      setVariant("danger");
      setMessage(
        err.response && err.response.data.message
          ? err.response.data.message
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Meta title="Recovery | Syed Store" />

      <div className="auth-page-container">
        <div className="auth-3d-wrapper">
          <div className="auth-card-face front">
            <div className="auth-brand-side">
              <div className="brand-content">
                <div className="brand-logo-icon">
                  <i className="fas fa-unlock-alt"></i>
                </div>
                <h1>RECOVERY</h1>
                <p>
                  Forgot your credentials? Don't worry, we'll help you get back
                  on track.
                </p>
              </div>
            </div>

            <div className="auth-form-side">
              <div className="form-header">
                <h2>Forgot Password?</h2>
                <p>Enter your email to receive a reset link</p>
              </div>

              {message && <Message variant={variant}>{message}</Message>}

              <form onSubmit={submitHandler}>
                <InputField
                  label="Registered Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={handleBlur}
                  error={emailError}
                  onClearError={() => setEmailError(null)} // Pass clear logic
                  placeholder="name@example.com"
                />

                <button
                  type="submit"
                  className="btn-neon"
                  disabled={loading}
                  style={{ marginTop: "1rem" }}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="toggle-text">
                Remember your password?
                <Link to="/login" className="toggle-link">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordScreen;
