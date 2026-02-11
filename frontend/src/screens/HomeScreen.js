import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col } from "react-bootstrap";
import Product from "../components/Product";
import Message from "../components/Message";
import Loader from "../components/Loader";
import Paginate from "../components/Paginate";
import ProductCarousel from "../components/ProductCarousel";
import Meta from "../components/Meta";
import { listProducts } from "../actions/productActions";

const HomeScreen = ({ match }) => {
  // Use React Router hooks for modern approach, fallback to match prop for compatibility
  const params = useParams();
  const keyword = match?.params?.keyword || params?.keyword || "";

  // Extract pageNumber from URL params or match prop
  const pageNumber = match?.params?.pageNumber || params?.pageNumber || 1;

  const dispatch = useDispatch();

  const productList = useSelector((state) => state.productList);
  const { loading, error, products, page, pages } = productList;

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
    header: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "25px",
      marginTop: "10px",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    sectionDivider: {
      borderBottom: "1px solid #2d2d3d",
      marginBottom: "30px",
    },
    backBtn: {
      color: "#fff",
      borderColor: "#444",
      backgroundColor: "#1e1e2e",
    },
  };

  useEffect(() => {
    // Only pass keyword if it's not empty
    const searchKeyword = keyword && keyword.trim() !== "" ? keyword : "";
    dispatch(listProducts(searchKeyword, pageNumber));
  }, [dispatch, keyword, pageNumber]);

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.innerContainer}>
        <Meta />

        {!keyword ? (
          <div className="mb-5">
            <ProductCarousel />
          </div>
        ) : (
          <Link to="/" className="btn btn-outline-secondary mb-4">
            <i className="fas fa-arrow-left mr-2"></i> Go Back
          </Link>
        )}

        <h1 style={styles.header}>Latest Products</h1>
        <div style={styles.sectionDivider}></div>

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : products && products.length > 0 ? (
          <>
            <Row className="product-row">
              {products.map((product) => (
                <Col
                  key={product._id}
                  sm={12}
                  md={6}
                  lg={4}
                  xl={3}
                  className="product-col mb-4"
                >
                  <Product product={product} />
                </Col>
              ))}
            </Row>
            <div className="mt-4 d-flex justify-content-center">
              <Paginate
                pages={pages}
                page={page}
                keyword={keyword ? keyword : ""}
              />
            </div>
          </>
        ) : (
          <div
            className="text-center p-5"
            style={{
              backgroundColor: "#1e1e2e",
              borderRadius: "15px",
              border: "1px solid #2d2d3d",
            }}
          >
            <i
              className="fas fa-box-open mb-3"
              style={{ fontSize: "3rem", color: "#444" }}
            ></i>
            <h4 className="text-muted">No products found</h4>
            <p className="text-muted">
              Try adjusting your search or add products to your store.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;