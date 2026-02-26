import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login-register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Check if both fields are filled
  const isFormValid =
    username.trim() !== "" && password.trim() !== "" && restaurantId !== "";

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const res = await fetch("/api/restaurants");
        const data = await res.json();
        if (data && data.success !== false && Array.isArray(data.restaurants)) {
          setRestaurants(data.restaurants);
        } else {
          console.warn("No restaurants returned");
        }
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
      }
    }

    fetchRestaurants();
  }, []);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setMessage("Please fill in both username and password");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          restaurantId: restaurantId ? Number(restaurantId) : null,
        }),
      });

      const data = await response.json();

      setMessage(data.message);
      if (data.success) {
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (err) {
      setMessage("Server error. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="login-page-background">
      <div className="login-register-container">
        <h1>Create Account</h1>
        <h2>Choose your restaurant</h2>

        <form className="login-register-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="login-register-input"
              placeholder="Enter your username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="login-password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="login-register-input"
                placeholder="Enter your password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="login-toggle-password"
                onClick={handleTogglePassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="restaurant">Restaurant</label>
            <select
              id="restaurant"
              className="login-register-input"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              required
            >
              <option value="">Select a restaurant</option>
              {restaurants.length === 0 && (
                <option value="">No restaurants available</option>
              )}
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.restaurant}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={`login-register-btn ${
              !isFormValid ? "login-btn-disabled" : ""
            }`}
            disabled={!isFormValid}
          >
            Create Account
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
