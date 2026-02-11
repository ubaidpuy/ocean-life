import React from "react";
import { Pagination } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

const Paginate = ({ pages, page, isAdmin = false, keyword = "" }) => {
  if (pages <= 1) return null;

  return (
    <>
      {/* 
        Injecting custom styles for the Dark Mode Pagination 
        overriding Bootstrap defaults 
      */}
      <style type="text/css">
        {`
          .fancy-pagination .page-item .page-link {
            background-color: #1e1e2e;
            border: 1px solid #2d2d3d;
            color: #a0a0b0;
            border-radius: 10px; /* Rounded squares */
            margin: 0 5px;
            transition: all 0.3s ease;
            min-width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
          }

          .fancy-pagination .page-item .page-link:hover {
            background-color: #2d2d3d;
            color: #fff;
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            border-color: #555;
            z-index: 2;
          }

          .fancy-pagination .page-item.active .page-link {
            background-color: #007bff; /* Primary Blue */
            border-color: #007bff;
            color: #fff;
            box-shadow: 0 0 20px rgba(0, 123, 255, 0.4); /* Glow effect */
            transform: scale(1.1);
            z-index: 3;
          }

          .fancy-pagination .page-item.active .page-link:hover {
             background-color: #0056b3;
             border-color: #0056b3;
          }

          /* Remove default bootstrap focus outlines */
          .fancy-pagination .page-link:focus {
            box-shadow: none;
          }

          /* Override Bootstrap's forced border-radius on first/last items */
          .fancy-pagination .page-item:first-child .page-link,
          .fancy-pagination .page-item:last-child .page-link {
            border-radius: 10px;
          }
        `}
      </style>

      <div className="d-flex justify-content-center mt-5 mb-4">
        <Pagination className="fancy-pagination">
          {[...Array(pages).keys()].map((x) => (
            <LinkContainer
              key={x + 1}
              to={
                !isAdmin
                  ? keyword
                    ? `/search/${keyword}/page/${x + 1}`
                    : `/page/${x + 1}`
                  : `/admin/productlist/${x + 1}`
              }
            >
              <Pagination.Item active={x + 1 === page}>{x + 1}</Pagination.Item>
            </LinkContainer>
          ))}
        </Pagination>
      </div>
    </>
  );
};

export default Paginate;
