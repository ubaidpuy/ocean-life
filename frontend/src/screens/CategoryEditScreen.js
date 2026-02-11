import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Message from "../components/Message";
import Loader from "../components/Loader";
import FormContainer from "../components/FormContainer";
import { createCategory, updateCategory } from "../actions/categoryActions";
import { CATEGORY_CREATE_RESET, CATEGORY_UPDATE_RESET } from "../constants/categoryConstants";
import axios from "axios";

const CategoryEditScreen = ({ match, history }) => {
  const categoryId = match.params.id;

  const [name, setName] = useState("");
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [errorCategory, setErrorCategory] = useState("");

  const dispatch = useDispatch();

  const categoryCreate = useSelector((state) => state.categoryCreate);
  const { loading: loadingCreate, error: errorCreate, success: successCreate } = categoryCreate;

  const categoryUpdate = useSelector((state) => state.categoryUpdate);
  const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = categoryUpdate;

  useEffect(() => {
    if (successCreate) {
      dispatch({ type: CATEGORY_CREATE_RESET });
      history.push("/admin/categorylist");
    } else if (successUpdate) {
      dispatch({ type: CATEGORY_UPDATE_RESET });
      history.push("/admin/categorylist");
    } else {
      if (categoryId) {
        // Fetch category details if editing
        const fetchCategory = async () => {
          setLoadingCategory(true);
          try {
            const { data } = await axios.get(`/api/categories`);
            const cat = data.find(c => c._id === categoryId);
            if (cat) {
              setName(cat.name);
            }
            setLoadingCategory(false);
          } catch (err) {
            setErrorCategory(err.response && err.response.data.message ? err.response.data.message : err.message);
            setLoadingCategory(false);
          }
        };
        fetchCategory();
      }
    }
  }, [dispatch, history, categoryId, successCreate, successUpdate]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (categoryId) {
      dispatch(updateCategory({ _id: categoryId, name }));
    } else {
      dispatch(createCategory(name));
    }
  };

  return (
    <>
      <Link to="/admin/categorylist" className="btn btn-light my-3">
        Go Back
      </Link>
      <FormContainer>
        <h1>{categoryId ? "Edit Category" : "Create Category"}</h1>
        {(loadingCreate || loadingUpdate || loadingCategory) && <Loader />}
        {(errorCreate || errorUpdate || errorCategory) && (
          <Message variant="danger">{errorCreate || errorUpdate || errorCategory}</Message>
        )}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="name"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <Button type="submit" variant="primary" className="mt-3">
            {categoryId ? "Update" : "Create"}
          </Button>
        </Form>
      </FormContainer>
    </>
  );
};

export default CategoryEditScreen;
