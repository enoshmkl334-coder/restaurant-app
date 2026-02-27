import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_BASE, ENDPOINTS } from "../config/api";
import "../styles/login-register.css";

export default function SelectRestaurant() {
  const { user, updateUser } = useUser();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If user already has a restaurant, redirect to home
    if (user?.restaurantId) {
      navigate("/");
      return;
    }

    // Fetch available restaurants
    async function fetchRestaurants() {
      try {
        const res = await fetch(`${API_BASE}${ENDPOINTS.RESTAURANTS}`);
        const data = await res.json();
        if (data && data.success !== false && Array.isArray(data.restaurants)) {
          setRestaurants(data.restaurants);
        } else {
          setMessage("Failed to load restaurants");
        }
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
        setMessage("Error loading restaurants");
      }
    }

    fetchRestaurants();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRestaurant) {
      setMessage("Please select a restaurant");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/user/select-restaurant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          restaurantId: parseInt(selectedRestaurant)
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user context with restaurant info
        const selectedRestaurantData = restaurants.find(
          r => r.id === parseInt(selectedRestaurant)
        );
        
        updateUser({
          ...user,
          restaurantId: parseInt(selectedRestaurant),
          restaurantName: selectedRestaurantData?.restaurant || null
        });

        setMessage("Restaurant selected successfully!");
        
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setMessage(data.message || "Failed to select restaurant");
      }
    } catch (err) {
      console.error("Error selecting restaurant:", err);
      setMessage("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-background">
      <div className="login-register-container">
        <h1>Welcome!</h1>
        <h2>Please Select Your Restaurant</h2>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Choose which restaurant you'd like to order from
        </p>

        <form className="login-register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="restaurant">Select Restaurant</label>
            <select
              id="restaurant"
              className="login-register-input"
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              required
            >
              <option value="">-- Choose a restaurant --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.restaurant}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={`login-register-btn ${isLoading ? "login-loading" : ""}`}
            disabled={isLoading || !selectedRestaurant}
          >
            {isLoading ? "Saving..." : "Continue"}
          </button>
        </form>

        {message && (
          <div
            className={`login-register-message ${
              message.includes("success")
                ? "login-message-success"
                : "login-message-error"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
