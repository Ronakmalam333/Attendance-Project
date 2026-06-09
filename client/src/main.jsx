import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { Schedule } from "./context/Schedule.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Schedule>
      <App />
    </Schedule>
  </StrictMode>,
);
