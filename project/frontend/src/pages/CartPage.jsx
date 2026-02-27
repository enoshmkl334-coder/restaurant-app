import React from "react";
import { useCart } from "../contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, ENDPOINTS } from "../config/api";
import "./../styles/cart.css"; // We'll create this

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } =
    useCart();

  const navigate = useNavigate();

  const handleOrderNow = async () => {
    try {
      // Get user from localStorage instead of prompt
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        alert("Please login first to place an order");
        navigate("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user.id;

      // Remove the prompt line:
      // const userId = prompt("Enter your user ID (for testing):") || 1;

      if (!userId) {
        alert("User ID not found. Please login again.");
        navigate("/login");
        return;
      }

      // Normalize items to ensure numeric price and quantity fields
      const normalizedItems = cartItems.map((it) => ({
        ...it,
        price: typeof it.price === "string" ? Number(it.price) : it.price,
        quantity:
          typeof it.quantity === "string" ? Number(it.quantity) : it.quantity,
      }));

      const orderData = {
        userId: parseInt(userId),
        items: normalizedItems,
        totalAmount: Number(totalPrice),
      };

      console.log("Sending order:", orderData);

      // ✅ FIX: Add Authorization header with token
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠️ Please login to place an order");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE}${ENDPOINTS.ORDERS}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ✅ Added token
        },
        body: JSON.stringify(orderData),
      });

      // Handle non-JSON or error responses more gracefully
      if (!response.ok) {
        let bodyText = "";
        try {
          const jsonErr = await response.json();
          bodyText =
            jsonErr && jsonErr.message
              ? jsonErr.message
              : JSON.stringify(jsonErr);
        } catch (e) {
          try {
            bodyText = await response.text();
          } catch (e2) {
            bodyText = `Status ${response.status}`;
          }
        }
        throw new Error(
          `Server responded with ${response.status}: ${bodyText}`
        );
      }

      let result = null;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error("Failed to parse server response. Please try again.");
      }

      if (result.success) {
        alert(`✅ Order placed successfully! Order ID: ${result.orderId}`);
        clearCart();
        navigate("/");
      } else {
        alert(
          "❌ Failed to place order: " + (result.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("⚠️ Error placing order. Please try again.");
    }
  };
  if (cartItems.length === 0) {
    return (
      <div className="cart-container empty-cart">
        <h2>Your Cart is Empty</h2>
        <p>Add some delicious items from our menu!</p>
        <Link to="/" className="btn btn-primary">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2 className="cart-title">Your Order</h2>

      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={`${item.id}-${item.variant}`} className="cart-item-card">
            <div className="cart-item-info">
              <h5>{item.name}</h5>
              <p className="cart-item-variant">{item.variant}</p>
              <p className="cart-item-price">
                Rs. {item.price} × {item.quantity}
              </p>
            </div>

            <div className="cart-item-controls">
              <div className="quantity-controls">
                <button
                  onClick={() =>
                    updateQuantity(item.id, item.variant, item.quantity - 1)
                  }
                  className="btn btn-outline-secondary btn-sm"
                >
                  −
                </button>
                <span className="quantity-display">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.id, item.variant, item.quantity + 1)
                  }
                  className="btn btn-outline-secondary btn-sm"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.id, item.variant)}
                className="btn btn-outline-danger btn-sm"
              >
                Remove
              </button>
            </div>

            <div className="cart-item-total">
              Rs. {item.price * item.quantity}
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>Rs. {totalPrice}</span>
        </div>
        <div className="summary-row">
          <span>Tax (13%):</span>
          <span>Rs. {(totalPrice * 0.13).toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>Rs. {(totalPrice * 1.13).toFixed(2)}</span>
        </div>

        <div className="cart-actions">
          <button onClick={clearCart} className="btn btn-outline-secondary">
            Clear Cart
          </button>
          <button
            onClick={handleOrderNow}
            className="btn btn-success btn-order"
          >
            Order Now!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
