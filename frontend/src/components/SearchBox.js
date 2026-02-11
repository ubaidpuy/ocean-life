import React, { useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { useHistory } from "react-router-dom";

const SearchBox = () => {
  const [keyword, setKeyword] = useState("");
  const history = useHistory();

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      history.push(`/search/${keyword}`);
    } else {
      history.push("/");
    }
  };

  return (
    <Form onSubmit={submitHandler}>
      <InputGroup
        className="overflow-hidden"
        style={{
          borderRadius: "12px",
          // Glass effect: White with low opacity
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(5px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          maxWidth: "400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Form.Control
          type="text"
          name="q"
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search..."
          className="border-0 shadow-none text-white"
          style={{
            background: "transparent",
            color: "white",
            boxShadow: "none",
          }}
        />
        <div className="input-group-append" style={{ marginRight: "10px" }}>
          <button
            type="submit"
            className="btn border-0 bg-transparent text-white p-0 d-flex align-items-center"
            style={{ boxShadow: "none" }}
          >
            {/* Standard SVG Icon - No extra library needed */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
          </button>
        </div>
      </InputGroup>

      {/* Force placeholder color to be light gray */}
      <style>{`
        ::placeholder { color: rgba(255,255,255, 0.7) !important; }
      `}</style>
    </Form>
  );
};

export default SearchBox;
