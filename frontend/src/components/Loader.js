import React from "react";

const Loader = () => {
  return (
    <>
      <style type="text/css">
        {`
        .loader-container {
          position: relative;
          width: 100%;
          height: 4px; /* Slim line */
          background-color: rgba(255, 255, 255, 0.05); /* Subtle track */
          overflow: hidden;
          border-radius: 2px;
          margin: 20px 0;
        }

        .loader-bar {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          background: linear-gradient(90deg, #ff0000, #ff4b4b); /* YouTube Red Gradient */
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.7); /* The "Glow" */
          animation: indeterminate 1.5s infinite ease-in-out;
          width: 50%;
        }

        /* 
           If you prefer Blue (to match your store theme), 
           change background to: linear-gradient(90deg, #007bff, #00d2ff);
           and box-shadow to: 0 0 10px rgba(0, 123, 255, 0.7);
        */

        @keyframes indeterminate {
          0% {
            left: -50%;
            width: 30%;
          }
          50% {
            width: 60%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
        `}
      </style>

      <div className="loader-container">
        <div className="loader-bar"></div>
      </div>
    </>
  );
};

export default Loader;
