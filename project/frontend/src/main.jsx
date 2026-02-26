import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { CartProvider } from "./contexts/CartContext";
import { UserProvider } from "./contexts/UserContext"; // ADD THIS
import { GoogleOAuthProvider } from "@react-oauth/google"; // google auth provider

// Vite exposes env vars via import.meta.env and requires a VITE_ prefix
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <UserProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
