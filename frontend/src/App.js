import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomeScreen from "./screens/HomeScreen";
import ProductScreen from "./screens/ProductScreen";
import CartScreen from "./screens/CartScreen";
import AuthScreen from "./screens/AuthScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ShippingScreen from "./screens/ShippingScreen";
import PaymentScreen from "./screens/PaymentScreen";
import PlaceOrderScreen from "./screens/PlaceOrderScreen";
import OrderScreen from "./screens/OrderScreen";
import UserListScreen from "./screens/UserListScreen";
import UserEditScreen from "./screens/UserEditScreen";
import ProductListScreen from "./screens/ProductListScreen";
import ProductEditScreen from "./screens/ProductEditScreen";
import OrderListScreen from "./screens/OrderListScreen";
import CreateStoreScreen from "./screens/CreateStoreScreen";
import StoreDashboardScreen from "./screens/StoreDashboardScreen";
import SubscriptionScreen from "./screens/SubscriptionScreen";
import ConnectSetupScreen from "./screens/ConnectSetupScreen";
import LandingScreen from "./screens/LandingScreen";
import VerifyEmailScreen from "./screens/VerifyEmailScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import CategoryListScreen from "./screens/CategoryListScreen";
import CategoryEditScreen from "./screens/CategoryEditScreen";

// Component to conditionally render LandingScreen or HomeScreen based on subdomain
const RootRoute = ({ match }) => {
  const hostname = window.location.hostname;
  const isStoreSubdomain =
    (hostname.includes(".localhost") &&
      hostname !== "localhost" &&
      hostname !== "127.0.0.1") ||
    (hostname.includes(".myapp.local") &&
      !hostname.startsWith("www.") &&
      !hostname.startsWith("app.") &&
      !hostname.startsWith("admin."));

  // If on store subdomain, show products (HomeScreen)
  // Otherwise, show landing page (LandingScreen)
  return isStoreSubdomain ? <HomeScreen match={match} /> : <LandingScreen />;
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Header />
        <main className="py-3">
          <Container>
            <Route path="/order/:id" component={OrderScreen} />
            <Route path="/shipping" component={ShippingScreen} />
            <Route path="/payment" component={PaymentScreen} />
            <Route path="/placeorder" component={PlaceOrderScreen} />
            <Route path="/login" component={AuthScreen} />
            <Route path="/register" component={AuthScreen} />
            <Route path="/verify-email" component={VerifyEmailScreen} />
            <Route path="/forgot-password" component={ForgotPasswordScreen} />
            <Route path="/reset-password" component={ResetPasswordScreen} />
            <Route path="/profile" component={ProfileScreen} />
            <Route path="/product/:id" component={ProductScreen} />
            <Route path="/cart/:id?" component={CartScreen} />
            <Route path="/admin/userlist" component={UserListScreen} />
            <Route path="/admin/user/:id/edit" component={UserEditScreen} />
            <Route
              path="/admin/productlist"
              component={ProductListScreen}
              exact
            />
            <Route
              path="/admin/productlist/:pageNumber"
              component={ProductListScreen}
              exact
            />
            <Route
              path="/admin/product/:id/edit"
              component={ProductEditScreen}
            />
            <Route path="/admin/orderlist" component={OrderListScreen} />
            <Route path="/admin/categorylist" component={CategoryListScreen} />
            <Route
              path="/admin/category/create"
              component={CategoryEditScreen}
            />
            <Route
              path="/admin/category/:id/edit"
              component={CategoryEditScreen}
            />
            <Route path="/create-store" component={CreateStoreScreen} />
            <Route path="/store/dashboard" component={StoreDashboardScreen} />
            <Route path="/subscription" component={SubscriptionScreen} />
            <Route
              path="/subscription/success"
              component={SubscriptionScreen}
            />
            <Route path="/subscription/cancel" component={SubscriptionScreen} />
            <Route path="/connect/setup" component={ConnectSetupScreen} />
            <Route
              path="/connect/onboarding/success"
              component={ConnectSetupScreen}
            />
            <Route
              path="/connect/onboarding/refresh"
              component={ConnectSetupScreen}
            />
            <Route path="/search/:keyword" component={HomeScreen} exact />
            <Route path="/page/:pageNumber" component={HomeScreen} exact />
            <Route
              path="/search/:keyword/page/:pageNumber"
              component={HomeScreen}
              exact
            />
            <Route path="/shop" component={HomeScreen} exact />
            <Route path="/" component={RootRoute} exact />
          </Container>
        </main>
        <Footer />
      </Router>
    </ThemeProvider>
  );
};

export default App;
