import axios from "../utils/axiosConfig";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import { listProductDetails, updateProduct } from "../actions/productActions";
import { listCategories } from "../actions/categoryActions";
import { PRODUCT_UPDATE_RESET } from "../constants/productConstants";

const ProductEditScreen = ({ match, history, location }) => {
  const productId = match.params.id;

  // --- STATE ---
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  // Variation States
  const [variationType, setVariationType] = useState("color"); // Defaulting to color to avoid 'null' errors
  const [variants, setVariants] = useState([]);

  const [tempVariant, setTempVariant] = useState({
    name: "Color", // Default label
    value: "#000000", // Default value
    price: 0,
    countInStock: 0,
  });

  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const productUpdate = useSelector((state) => state.productUpdate);
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate;

  const categoryList = useSelector((state) => state.categoryList);
  const { categories } = categoryList;

  const isNewProduct = location && location.state && location.state.isNew;

  // --- EFFECTS ---
  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET });
      history.push("/admin/productlist");
    } else {
      if (!product.name || product._id !== productId) {
        dispatch(listProductDetails(productId));
        dispatch(listCategories());
      } else {
        setName(product.name);
        setPrice(product.price);
        setImage(product.image);
        setBrand(product.brand);
        // Ensure category is a valid ObjectId (or at least check if it looks like one)
        // This prevents legacy string names from breaking the form submission
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(product.category);
        setCategory(isObjectId ? product.category : "");
        setCountInStock(product.countInStock);
        setDescription(product.description);
        if (product.variations) {
          const variantsWithId = product.variations.map((v) => ({
            ...v,
            id: v._id || v.id, // Ensure id exists
          }));
          setVariants(variantsWithId);
        }
      }
    }
  }, [dispatch, history, productId, product, successUpdate]);

  // --- HANDLERS ---

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setVariationType(type);

    let defaultName = "";
    let defaultValue = "";

    if (type === "color") {
      defaultName = "Color";
      defaultValue = "#000000";
    } else if (type === "size") {
      defaultName = "Size";
      defaultValue = "M";
    } else {
      defaultName = "Material";
      defaultValue = "";
    }

    setTempVariant({ ...tempVariant, name: defaultName, value: defaultValue });
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const { data } = await axios.post("/api/upload", formData, config);
      setImage(data);
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const handleVariantChange = (id, field, value) => {
    const updatedVariants = variants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    setVariants(updatedVariants);
  };

  const handleAddVariant = () => {
    if (!tempVariant.value || !tempVariant.name)
      return alert("Please enter both Name and Value");

    const newVariant = {
      ...tempVariant,
      type: variationType,
      id: Date.now(),
    };

    setVariants([...variants, newVariant]);
    // Reset inputs
    setTempVariant({ ...tempVariant, value: "", price: 0, countInStock: 0 });
  };

  const removeVariant = (id) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const submitHandler = (e) => {
    e.preventDefault();

    // Clean the variants array before sending to ensure data types are correct
    const cleanVariations = variants.map((v) => ({
      ...v,
      price: Number(v.price),
      countInStock: Number(v.countInStock),
      // Ensure the 'name' (e.g., Color) and 'type' (e.g., color) are attached
      // so the backend can extract the top-level info from the first item.
      name: v.name,
      type: variationType, // Explicitly attach the current state type
    }));

    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        image,
        brand,
        category,
        description,
        countInStock,
        variations: cleanVariations, // Send the cleaned array
      })
    );
  };

  // --- STYLES FOR FULL WIDTH LAYOUT ---
  const styles = {
    // This is the magic wrapper that breaks out of the parent container
    fullPageWrapper: {
      width: "100vw",
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      backgroundColor: "#121212",
      minHeight: "100vh", // Full height
      paddingTop: "40px",
      paddingBottom: "80px",
      color: "#e0e0e0",
      fontFamily: "'Inter', sans-serif",
    },
    // This constrains the content inside so it's not too wide on massive screens
    innerContainer: {
      maxWidth: "1600px",
      margin: "0 auto",
      padding: "0 40px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      paddingBottom: "20px",
      borderBottom: "1px solid #2d2d3d",
    },
    card: {
      backgroundColor: "#1e1e2e",
      borderRadius: "15px",
      padding: "30px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      border: "1px solid #2d2d3d",
      marginBottom: "30px",
    },
    label: {
      color: "#a0a0b0",
      fontSize: "0.75rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      marginBottom: "8px",
    },
    input: {
      backgroundColor: "#161620",
      border: "1px solid #333",
      color: "#fff",
      borderRadius: "6px",
      padding: "12px",
      fontSize: "0.95rem",
      height: "auto",
      width: "100%",
    },
    sectionTitle: {
      fontSize: "1.2rem",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "25px",
      display: "flex",
      alignItems: "center",
    },
    variantItem: {
      backgroundColor: "#252535",
      border: "1px solid #3a3a4a",
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "10px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
  };

  return (
    <div style={styles.fullPageWrapper}>
      <div style={styles.innerContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <Link
              to="/admin/productlist"
              className="btn btn-outline-secondary btn-sm mb-3"
            >
              <i className="fas fa-arrow-left"></i> Go Back
            </Link>
            <h2 className="text-white font-weight-bold m-0">
              {isNewProduct ? "Create Product" : "Edit Product"}
            </h2>
          </div>
          <Button
            onClick={submitHandler}
            className="btn btn-primary btn-lg px-5 shadow-sm"
            style={{ fontWeight: "600", borderRadius: "8px" }}
          >
            Save Changes
          </Button>
        </div>

        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Row>
              {/* --- LEFT COLUMN (MAIN CONTENT) --- */}
              <Col lg={8}>
                {/* Product Info */}
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-info-circle mr-2 text-primary"></i>{" "}
                    Product Details
                  </div>
                  <Form.Group controlId="name">
                    <Form.Label style={styles.label}>Product Name</Form.Label>
                    <Form.Control
                      style={styles.input}
                      type="text"
                      placeholder="e.g. Premium Leather Jacket"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="description" className="mt-4">
                    <Form.Label style={styles.label}>Description</Form.Label>
                    <Form.Control
                      style={{ ...styles.input, minHeight: "150px" }}
                      as="textarea"
                      placeholder="Write a detailed description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Form.Group>
                </div>

                {/* --- VARIANTS SETUP CARD --- */}
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-layer-group mr-2 text-warning"></i>{" "}
                    Variants Setup
                  </div>

                  <Row>
                    {/* INPUT SIDE */}
                    <Col md={5} className="border-right pr-4">
                      <Form.Group>
                        <Form.Label style={styles.label}>
                          1. Choose Type
                        </Form.Label>
                        <Form.Control
                          as="select"
                          style={styles.input}
                          value={variationType}
                          onChange={handleTypeChange}
                        >
                          <option value="color">Color</option>
                          <option value="size">Size</option>
                          <option value="other">Other</option>
                        </Form.Control>
                      </Form.Group>

                      <div className="animate__animated animate__fadeIn">
                        {/* Option Name (Auto-filled) */}
                        <Form.Group>
                          <Form.Label style={styles.label}>
                            2. Option Label
                          </Form.Label>
                          <Form.Control
                            type="text"
                            style={styles.input}
                            value={tempVariant.name}
                            onChange={(e) =>
                              setTempVariant({
                                ...tempVariant,
                                name: e.target.value,
                              })
                            }
                          />
                        </Form.Group>

                        {/* Option Value */}
                        <Form.Group>
                          <Form.Label style={styles.label}>
                            3. Option Value
                          </Form.Label>
                          {variationType === "color" ? (
                            <div className="d-flex align-items-center bg-dark rounded p-2 border border-secondary">
                              <Form.Control
                                type="color"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  padding: "0",
                                  border: "none",
                                  marginRight: "15px",
                                  cursor: "pointer",
                                }}
                                value={tempVariant.value}
                                onChange={(e) =>
                                  setTempVariant({
                                    ...tempVariant,
                                    value: e.target.value,
                                  })
                                }
                              />
                              <Form.Control
                                type="text"
                                style={{
                                  ...styles.input,
                                  border: "none",
                                  backgroundColor: "transparent",
                                  padding: 0,
                                }}
                                value={tempVariant.value}
                                onChange={(e) =>
                                  setTempVariant({
                                    ...tempVariant,
                                    value: e.target.value,
                                  })
                                }
                                placeholder="#HEXCODE"
                              />
                            </div>
                          ) : (
                            <Form.Control
                              type="text"
                              style={styles.input}
                              value={tempVariant.value}
                              onChange={(e) =>
                                setTempVariant({
                                  ...tempVariant,
                                  value: e.target.value,
                                })
                              }
                              placeholder="e.g. XL, Cotton, Set of 2"
                            />
                          )}
                        </Form.Group>

                        {/* Price & Stock */}
                        <Row>
                          <Col xs={6}>
                            <Form.Group>
                              <Form.Label style={styles.label}>
                                Price ($)
                              </Form.Label>
                              <Form.Control
                                type="number"
                                style={styles.input}
                                value={tempVariant.price}
                                onChange={(e) =>
                                  setTempVariant({
                                    ...tempVariant,
                                    price: e.target.value,
                                  })
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col xs={6}>
                            <Form.Group>
                              <Form.Label style={styles.label}>
                                Stock
                              </Form.Label>
                              <Form.Control
                                type="number"
                                style={styles.input}
                                value={tempVariant.countInStock}
                                onChange={(e) =>
                                  setTempVariant({
                                    ...tempVariant,
                                    countInStock: e.target.value,
                                  })
                                }
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Button
                          block
                          variant="info"
                          className="mt-3 py-2 font-weight-bold"
                          onClick={handleAddVariant}
                        >
                          <i className="fas fa-plus mr-2"></i> Add Variant
                        </Button>
                      </div>
                    </Col>

                    {/* LIST SIDE */}
                    <Col md={7} className="pl-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <Form.Label
                          style={{
                            ...styles.label,
                            marginBottom: 0,
                            fontSize: "0.9rem",
                          }}
                        >
                          Active Variants ({variants.length})
                        </Form.Label>
                        {variants.length > 0 && (
                          <span className="text-muted small">
                            Auto-saving on submit
                          </span>
                        )}
                      </div>

                      {variants.length === 0 ? (
                        <div
                          className="d-flex flex-column align-items-center justify-content-center p-5 text-muted"
                          style={{
                            backgroundColor: "#161620",
                            borderRadius: "8px",
                            border: "1px dashed #444",
                            height: "95%",
                          }}
                        >
                          <i
                            className="fas fa-layer-group mb-3"
                            style={{ fontSize: "30px", opacity: 0.5 }}
                          ></i>
                          <p className="mb-0 text-center">
                            No variants created.
                            <br />
                            Use the form on the left to add one.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            maxHeight: "400px",
                            overflowY: "auto",
                            paddingRight: "5px",
                          }}
                        >
                          {variants.map((v) => (
                            <div
                              key={v.id}
                              style={styles.variantItem}
                              className="animate__animated animate__fadeInRight"
                            >
                              {/* Left: Info */}
                              <div className="d-flex align-items-center">
                                {/* Visual Indicator */}
                                {v.type === "color" ? (
                                  <div
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      borderRadius: "50%",
                                      backgroundColor: v.value,
                                      border: "2px solid #fff",
                                      marginRight: "15px",
                                      boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                                    }}
                                  ></div>
                                ) : (
                                  <div
                                    style={{
                                      minWidth: "40px",
                                      height: "40px",
                                      borderRadius: "8px",
                                      backgroundColor: "#3f3f5f",
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginRight: "15px",
                                      fontWeight: "bold",
                                      fontSize: "0.9rem",
                                      padding: "0 8px",
                                    }}
                                  >
                                    {v.value.substring(0, 3).toUpperCase()}
                                  </div>
                                )}

                                {/* Text Details */}
                                <div>
                                  <div
                                    className="text-white"
                                    style={{
                                      fontSize: "1rem",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    <span className="text-info mr-2">
                                      {v.name}:
                                    </span>
                                    {v.value}
                                  </div>
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    Price: ${v.price} &bull; Stock:
                                    <Form.Control
                                      type="number"
                                      size="sm"
                                      value={v.countInStock}
                                      onChange={(e) =>
                                        handleVariantChange(
                                          v.id,
                                          "countInStock",
                                          Number(e.target.value)
                                        )
                                      }
                                      style={{
                                        width: "70px",
                                        display: "inline-block",
                                        marginLeft: "5px",
                                        backgroundColor: "#2c2c3e",
                                        border: "1px solid #444",
                                        color: "#fff",
                                        padding: "2px 5px",
                                        height: "auto",
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Right: Delete */}
                              <Button
                                size="sm"
                                variant="outline-danger"
                                style={{
                                  border: "none",
                                  width: "30px",
                                  height: "30px",
                                  padding: 0,
                                  borderRadius: "50%",
                                }}
                                onClick={() => removeVariant(v.id)}
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Col>
                  </Row>
                </div>
              </Col>

              {/* --- RIGHT COLUMN (SIDEBAR) --- */}
              <Col lg={4}>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-building mr-2 text-success"></i>{" "}
                    Organization
                  </div>
                  <Form.Group controlId="brand">
                    <Form.Label style={styles.label}>Brand</Form.Label>
                    <Form.Control
                      style={styles.input}
                      type="text"
                      placeholder="e.g. Nike"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="category" className="mt-3">
                    <Form.Label style={styles.label}>Category</Form.Label>
                    <Form.Control
                      as="select"
                      style={styles.input}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories &&
                        categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                    </Form.Control>
                  </Form.Group>
                </div>

                <div style={styles.card}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-tag mr-2 text-danger"></i> Pricing &
                    Media
                  </div>
                  <Row>
                    <Col xs={6}>
                      <Form.Group controlId="price">
                        <Form.Label style={styles.label}>
                          Base Price ($)
                        </Form.Label>
                        <Form.Control
                          style={styles.input}
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group controlId="countInStock">
                        <Form.Label style={styles.label}>Base Stock</Form.Label>
                        <Form.Control
                          style={styles.input}
                          type="number"
                          value={countInStock}
                          onChange={(e) => setCountInStock(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group controlId="image" className="mt-3">
                    <Form.Label style={styles.label}>Main Image</Form.Label>
                    <InputGroup>
                      <Form.Control
                        style={styles.input}
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Image URL"
                      />
                      <InputGroup.Append>
                        <label
                          className="btn btn-secondary m-0 d-flex align-items-center border-0"
                          htmlFor="image-file"
                          style={{ backgroundColor: "#3f3f5f" }}
                        >
                          <i className="fas fa-upload"></i>
                        </label>
                      </InputGroup.Append>
                    </InputGroup>
                    <Form.File
                      id="image-file"
                      custom
                      onChange={uploadFileHandler}
                      style={{ display: "none" }}
                    />
                    {uploading && <Loader />}
                    {image && (
                      <div className="mt-3 p-2 bg-dark rounded border border-secondary text-center">
                        <img
                          src={image}
                          alt="Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    )}
                  </Form.Group>
                </div>
              </Col>
            </Row>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ProductEditScreen;
