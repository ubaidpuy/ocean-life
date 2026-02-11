import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import { login, register } from "../actions/userActions";
import Meta from "../components/Meta";
import "../components/AuthStyles.css";

// UPDATED InputField: Added onClearError prop and onClick handler to the error icon
const InputField = ({
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  onClearError, // <--- New Prop
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
          // Optional: Clear error automatically when typing starts
          if (error && onClearError) onClearError();
        }}
        onBlur={onBlur}
        autoComplete="new-password"
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
          // ADDED onClick here to clear the error
          <i className="fas fa-times-circle" onClick={onClearError}></i>
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

const AuthScreen = ({ history }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isRegister = location.pathname === "/register";

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  const userLogin = useSelector((state) => state.userLogin);
  const { loading: lLoading, error: lError, userInfo } = userLogin;

  const userRegister = useSelector((state) => state.userRegister);
  const { loading: rLoading, error: rError, success: rSuccess } = userRegister;

  const urlParams = new URLSearchParams(location.search);
  const redirect = urlParams.get("redirect") || "/";

  useEffect(() => {
    if (userInfo) {
      const hostname = window.location.hostname;
      const isStoreSubdomain =
        hostname.includes(".localhost") && hostname !== "localhost";
      if (redirect === "/create-store") history.push("/create-store");
      else if (isStoreSubdomain && redirect === "/")
        history.push("/store/dashboard");
      else history.push(redirect);
    }
    if (rSuccess) {
      history.push(
        `/login?redirect=${encodeURIComponent(redirect)}&registered=true`
      );
    }
  }, [history, userInfo, redirect, rSuccess]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Helper to clear specific login error
  const clearLoginError = (field) => {
    setLoginErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Helper to clear specific register error
  const clearRegError = (field) => {
    setRegErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleBlurLogin = (field) => {
    const newErrors = { ...loginErrors };
    if (field === "email") {
      if (!loginEmail) newErrors.email = "Email is required";
      else if (!validateEmail(loginEmail))
        newErrors.email = "Invalid email format";
      else delete newErrors.email;
    }
    if (field === "password") {
      if (!loginPassword) newErrors.password = "Password is required";
      else delete newErrors.password;
    }
    setLoginErrors(newErrors);
  };

  const handleBlurRegister = (field) => {
    const newErrors = { ...regErrors };
    if (field === "name") {
      if (!regName) newErrors.name = "Full name is required";
      else delete newErrors.name;
    }
    if (field === "email") {
      if (!regEmail) newErrors.email = "Email is required";
      else if (!validateEmail(regEmail))
        newErrors.email = "Invalid email format";
      else delete newErrors.email;
    }
    if (field === "password") {
      if (!regPassword) newErrors.password = "Password is required";
      else if (regPassword.length < 6)
        newErrors.password = "Min 6 chars required";
      else delete newErrors.password;
    }
    if (field === "confirm") {
      if (regPassword !== regConfirm)
        newErrors.confirm = "Passwords do not match";
      else delete newErrors.confirm;
    }
    setRegErrors(newErrors);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!loginEmail) errors.email = "Email is required";
    if (!loginPassword) errors.password = "Password is required";
    setLoginErrors(errors);
    if (Object.keys(errors).length === 0)
      dispatch(login(loginEmail, loginPassword));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!regName) errors.name = "Name required";
    if (!regEmail || !validateEmail(regEmail))
      errors.email = "Valid email required";
    if (!regPassword || regPassword.length < 6)
      errors.password = "Min 6 chars required";
    if (regPassword !== regConfirm) errors.confirm = "Passwords do not match";
    setRegErrors(errors);
    if (Object.keys(errors).length === 0)
      dispatch(register(regName, regEmail, regPassword));
  };

  return (
    <>
      <Meta title={isRegister ? "Sign Up" : "Sign In"} />

      <div className="auth-page-container">
        <div className={`auth-3d-wrapper ${isRegister ? "is-flipped" : ""}`}>
          {/* ================= FRONT (LOGIN) ================= */}
          <div className="auth-card-face front">
            <div className="auth-brand-side">
              <div className="brand-content">
                <div className="brand-logo-icon">
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <h1>SYED STORE</h1>
                <p>
                  Welcome back! Access your dashboard and manage your store.
                </p>
              </div>
            </div>

            <div className="auth-form-side">
              <div className="form-header">
                <h2>Sign In</h2>
                <p>Enter your credentials to access account</p>
              </div>

              {lError && <Message variant="danger">{lError}</Message>}
              {urlParams.get("registered") && (
                <Message variant="success">Account created! Login now.</Message>
              )}

              <form onSubmit={handleLoginSubmit}>
                <InputField
                  label="Email Address"
                  type="email"
                  value={loginEmail}
                  onChange={setLoginEmail}
                  onBlur={() => handleBlurLogin("email")}
                  error={loginErrors.email}
                  onClearError={() => clearLoginError("email")} // Pass clear function
                  placeholder="name@example.com"
                />
                <InputField
                  label="Password"
                  type="password"
                  isPass={true}
                  showPass={showLoginPass}
                  togglePass={() => setShowLoginPass(!showLoginPass)}
                  value={loginPassword}
                  onChange={setLoginPassword}
                  onBlur={() => handleBlurLogin("password")}
                  error={loginErrors.password}
                  onClearError={() => clearLoginError("password")} // Pass clear function
                  placeholder="Enter your password"
                />
                <div className="text-right mb-3">
                  <Link
                    to="/forgot-password"
                    style={{ color: "#8b8b93", fontSize: "0.8rem" }}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <button type="submit" className="btn-neon" disabled={lLoading}>
                  {lLoading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="toggle-text">
                Not a member?
                <Link
                  to={`/register${location.search}`}
                  className="toggle-link"
                >
                  Register Now
                </Link>
              </div>
            </div>
          </div>

          {/* ================= BACK (REGISTER) ================= */}
          <div className="auth-card-face back">
            <div className="auth-brand-side">
              <div className="brand-content">
                <div className="brand-logo-icon">
                  <i className="fas fa-rocket"></i>
                </div>
                <h1>JOIN US</h1>
                <p>
                  Start your journey with Syed Store today. It only takes a
                  minute.
                </p>
              </div>
            </div>

            <div className="auth-form-side">
              <div className="form-header">
                <h2>Create Account</h2>
                <p>Setup your free account to get started</p>
              </div>

              {rError && <Message variant="danger">{rError}</Message>}

              <form onSubmit={handleRegisterSubmit}>
                <InputField
                  label="Full Name"
                  type="text"
                  value={regName}
                  onChange={setRegName}
                  onBlur={() => handleBlurRegister("name")}
                  error={regErrors.name}
                  onClearError={() => clearRegError("name")}
                  placeholder="John Doe"
                />
                <InputField
                  label="Email Address"
                  type="email"
                  value={regEmail}
                  onChange={setRegEmail}
                  onBlur={() => handleBlurRegister("email")}
                  error={regErrors.email}
                  onClearError={() => clearRegError("email")}
                  placeholder="name@company.com"
                />
                <InputField
                  label="Password"
                  type="password"
                  isPass={true}
                  showPass={showRegPass}
                  togglePass={() => setShowRegPass(!showRegPass)}
                  value={regPassword}
                  onChange={setRegPassword}
                  onBlur={() => handleBlurRegister("password")}
                  error={regErrors.password}
                  onClearError={() => clearRegError("password")}
                  placeholder="Create strong password"
                />
                <InputField
                  label="Confirm Password"
                  type="password"
                  isPass={true}
                  showPass={showRegPass}
                  togglePass={() => setShowRegPass(!showRegPass)}
                  value={regConfirm}
                  onChange={setRegConfirm}
                  onBlur={() => handleBlurRegister("confirm")}
                  error={regErrors.confirm}
                  onClearError={() => clearRegError("confirm")}
                  placeholder="Repeat password"
                />
                <button type="submit" className="btn-neon" disabled={rLoading}>
                  {rLoading ? "Creating..." : "Sign Up"}
                </button>
              </form>

              <div className="toggle-text">
                Already have an account?
                <Link to={`/login${location.search}`} className="toggle-link">
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthScreen;
