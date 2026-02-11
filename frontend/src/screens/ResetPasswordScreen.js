import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
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
  isPass,
  showPass,
  togglePass,
}) => (
  <div className="form-group-dark">
    <label className="form-label-dark">{label}</label>
    <div className="input-container-dark">
      <input
        type={isPass && !showPass ? "password" : "text"}
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
        {isPass ? (
          <i
            className={showPass ? "fas fa-eye-slash" : "fas fa-eye"}
            onClick={togglePass}
          ></i>
        ) : error ? (
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

const ResetPasswordScreen = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passError, setPassError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [success, setSuccess] = useState(false);

  const history = useHistory();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get("token");

  useEffect(() => {
    if (!token) {
      setGlobalError("Invalid or missing reset token.");
    }
  }, [token]);

  const validate = () => {
    let isValid = true;

    if (password.length < 6) {
      setPassError("Password must be at least 6 characters");
      isValid = false;
    } else {
      setPassError(null);
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      isValid = false;
    } else {
      setConfirmError(null);
    }

    return isValid;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) return;

    setLoading(true);
    setGlobalError(null);

    try {
      await axiosInstance.post("/api/users/reset-password", {
        token,
        password,
      });
      setSuccess(true);
      setTimeout(() => history.push("/login?passwordReset=true"), 3000);
    } catch (err) {
      setGlobalError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Error resetting password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Meta title="New Password | Syed Store" />

      <div className="auth-page-container">
        <div className="auth-3d-wrapper">
          <div className="auth-card-face front">
            <div className="auth-brand-side">
              <div className="brand-content">
                <div className="brand-logo-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h1>SECURE ACCOUNT</h1>
                <p>
                  Create a new strong password to protect your account and data.
                </p>
              </div>
            </div>

            <div className="auth-form-side">
              {success ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div
                    className="brand-logo-icon"
                    style={{ fontSize: "3rem", marginBottom: "1rem" }}
                  >
                    <i
                      className="fas fa-check-circle"
                      style={{ color: "var(--success-color)" }}
                    ></i>
                  </div>
                  <h2 style={{ color: "white", marginBottom: "1rem" }}>
                    All Set!
                  </h2>
                  <p style={{ color: "var(--text-muted)" }}>
                    Your password has been updated successfully.
                  </p>
                  <p
                    style={{
                      color: "var(--primary-color)",
                      marginTop: "1rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    <i className="fas fa-spinner fa-spin"></i> Redirecting to
                    Login...
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-header">
                    <h2>Reset Password</h2>
                    <p>Enter your new credentials below</p>
                  </div>

                  {globalError && (
                    <Message variant="danger">{globalError}</Message>
                  )}

                  <form onSubmit={submitHandler}>
                    <InputField
                      label="New Password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={setPassword}
                      onBlur={() => {
                        if (password.length > 0 && password.length < 6)
                          setPassError("Too short");
                        else setPassError(null);
                      }}
                      error={passError}
                      onClearError={() => setPassError(null)} // Pass clear logic
                      isPass={true}
                      showPass={showPass}
                      togglePass={() => setShowPass(!showPass)}
                    />

                    <InputField
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      onBlur={() => {
                        if (confirmPassword && password !== confirmPassword)
                          setConfirmError("No match");
                        else setConfirmError(null);
                      }}
                      error={confirmError}
                      onClearError={() => setConfirmError(null)} // Pass clear logic
                      isPass={true}
                      showPass={showConfirmPass}
                      togglePass={() => setShowConfirmPass(!showConfirmPass)}
                    />

                    <button
                      type="submit"
                      className="btn-neon"
                      disabled={loading || !token}
                      style={{ marginTop: "1rem" }}
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordScreen;
