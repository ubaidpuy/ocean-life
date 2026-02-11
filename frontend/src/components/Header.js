import React from "react";
import { Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import SearchBox from "./SearchBox";
import { logout } from "../actions/userActions";

const Header = () => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const logoutHandler = () => {
    dispatch(logout());
  };

  // Helper to determine context (Main App vs Store Subdomain)
  const hostname = window.location.hostname;
  const isStoreSubdomain =
    hostname.includes(".localhost") &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1";

  return (
    <header>
      <style>
        {`
          /* --- NAVBAR STYLES --- */
          .custom-navbar {
            background-color: #121212;
            border-bottom: 1px solid #2d2d3d;
            padding: 0.8rem 1.5rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
          }

          /* --- BRAND --- */
          .brand-icon {
            font-size: 1.8rem;
            color: #fff;
            transition: transform 0.3s ease;
          }
          .brand-icon:hover {
            transform: scale(1.1);
            color: #007bff;
            text-shadow: 0 0 15px rgba(0, 123, 255, 0.6);
          }

          /* --- CENTER SEARCH BAR --- */
          .search-wrapper {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 20px;
          }
          
          /* Ensuring the search box itself has a max-width */
          .search-wrapper form {
            width: 100%;
            max-width: 500px;
            display: flex;
          }

          /* --- MODERN ACTION BUTTONS --- */
          .nav-action-btn {
            background: #1e1e2e;
            color: #e0e0e0 !important;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 8px 16px !important;
            margin-left: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            text-decoration: none;
            height: 42px; /* Fixed height for alignment */
          }

          .nav-action-btn i {
            margin-right: 8px;
            font-size: 1.1rem;
            color: #a0a0b0;
            transition: color 0.3s;
          }

          .nav-action-btn:hover {
            background: #252535;
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 123, 255, 0.3); /* The Glow */
            border-color: #555;
            color: #fff !important;
          }

          .nav-action-btn:hover i {
            color: #007bff; /* Icon lights up blue */
          }

          /* --- PROFILE DROPDOWN (Button Style) --- */
          .profile-dropdown .dropdown-toggle {
            background: #1e1e2e;
            color: #fff !important;
            border: 1px solid #333;
            border-radius: 30px; /* Pill shape for user */
            padding: 6px 16px !important;
            margin-left: 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            height: 42px;
          }

          .profile-dropdown .dropdown-toggle:hover {
            background: #252535;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          /* Dropdown Menu Customization */
          .profile-dropdown .dropdown-menu {
            background-color: #1e1e2e;
            border: 1px solid #333;
            box-shadow: 0 10px 20px rgba(0,0,0,0.5);
            margin-top: 10px;
          }
          .profile-dropdown .dropdown-item {
            color: #c0c0c0;
            padding: 10px 20px;
          }
          .profile-dropdown .dropdown-item:hover {
            background-color: #2d2d3d;
            color: #fff;
          }

          /* Mobile Toggler */
          .navbar-toggler {
            border: none;
            padding: 0;
            color: #fff;
          }
          
          .navbar-toggler:focus {
            box-shadow: none;
          }

          @media (max-width: 991px) {
            .search-wrapper {
              margin: 15px 0;
              justify-content: flex-start;
            }
            .nav-action-btn {
              margin-left: 0;
              margin-bottom: 10px;
              width: 100%;
            }
          }
        `}
      </style>

      <Navbar className="custom-navbar" variant="dark" expand="lg" fixed="top">
        <Container fluid>
          {/* LEFT: Logo Icon */}
          <LinkContainer to="/">
            <Navbar.Brand>
              <i className="fas fa-cube brand-icon" title="Home"></i>
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="basic-navbar-nav">
            <i className="fas fa-bars" style={{ fontSize: "1.5rem" }}></i>
          </Navbar.Toggle>

          <Navbar.Collapse id="basic-navbar-nav">
            {/* CENTER: Search Bar */}
            <div className="search-wrapper">
              <Route
                render={({ history }) => <SearchBox history={history} />}
              />
            </div>

            {/* RIGHT: Actions & Profile */}
            <Nav className="ml-auto align-items-center">
              {/* 1. Dashboard / Create Store Button */}
              {/* 1. Dashboard (Store Subdomain) OR Create Store (Main Domain) */}
              {isStoreSubdomain ? (
                userInfo && (
                  <LinkContainer to="/store/dashboard">
                    <Nav.Link className="nav-action-btn">
                      <i className="fas fa-tachometer-alt"></i>
                      <span>Dashboard</span>
                    </Nav.Link>
                  </LinkContainer>
                )
              ) : (
                <LinkContainer
                  to={
                    userInfo ? "/create-store" : "/login?redirect=/create-store"
                  }
                >
                  <Nav.Link className="nav-action-btn">
                    <i className="fas fa-store"></i>
                    <span>{userInfo ? "My Store" : "Create Store"}</span>
                  </Nav.Link>
                </LinkContainer>
              )}

              {/* 2. Cart Button (Only on Store Subdomain & NOT Admin) */}
              {isStoreSubdomain && (!userInfo || !userInfo.isAdmin) && (
                <LinkContainer to="/cart">
                  <Nav.Link className="nav-action-btn">
                    <i className="fas fa-shopping-cart"></i>
                    <span>Cart</span>
                  </Nav.Link>
                </LinkContainer>
              )}

              {/* 3. User Profile / Sign In */}
              {userInfo ? (
                <NavDropdown
                  title={
                    <div className="d-flex align-items-center">
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(45deg, #007bff, #00d2ff)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "8px",
                          fontSize: "0.8rem",
                        }}
                      >
                        {userInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{userInfo.name.split(" ")[0]}</span>
                    </div>
                  }
                  id="username"
                  className="profile-dropdown"
                  alignRight
                >
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>
                      <i className="fas fa-id-card mr-2"></i> Profile
                    </NavDropdown.Item>
                  </LinkContainer>

                  {/* Admin Links inside Dropdown for cleaner look */}
                  {userInfo.isAdmin && (
                    <>
                      <NavDropdown.Divider style={{ borderColor: "#333" }} />
                      <LinkContainer to="/admin/userlist">
                        <NavDropdown.Item>
                          <i className="fas fa-users mr-2"></i> Users
                        </NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/productlist">
                        <NavDropdown.Item>
                          <i className="fas fa-box mr-2"></i> Products
                        </NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/categorylist">
                        <NavDropdown.Item>
                          <i className="fas fa-tags mr-2"></i> Categories
                        </NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/orderlist">
                        <NavDropdown.Item>
                          <i className="fas fa-clipboard-list mr-2"></i> Orders
                        </NavDropdown.Item>
                      </LinkContainer>
                    </>
                  )}

                  <NavDropdown.Divider style={{ borderColor: "#333" }} />
                  <NavDropdown.Item onClick={logoutHandler}>
                    <i className="fas fa-sign-out-alt mr-2 text-danger"></i>{" "}
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link
                    className="nav-action-btn"
                    style={{ background: "#007bff", border: "none" }}
                  >
                    <i className="fas fa-user" style={{ color: "#fff" }}></i>
                    <span style={{ color: "#fff" }}>Sign In</span>
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Spacer to push content down because navbar is fixed */}
      <div style={{ height: "80px" }}></div>
    </header>
  );
};

export default Header;
