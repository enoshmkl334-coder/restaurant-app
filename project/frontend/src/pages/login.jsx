import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login-register.css";
import { useUser } from "../contexts/UserContext";
import { GoogleLogin } from "@react-oauth/google"; // added for google sign-in
import { API_BASE, ENDPOINTS } from "../config/api";

export default function Login() {
  const { login } = useUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setMessage("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}${ENDPOINTS.LOGIN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Login successful, data:", data);

        const userData = {
          id: data.userId,
          role: data.role,
          username: username.trim(),
          restaurantId: data.restaurantId || null,
          restaurantName: data.restaurantName || null,
          token: data.token, // Store the token
        };

        // Store in UserContext
        login(userData);

        console.log("📦 User logged in:", userData);

        setMessage(
          `${data.message} | Role: ${data.role || "guest"}${
            data.restaurantName ? " | Restaurant: " + data.restaurantName : ""
          }`,
        );

        setTimeout(() => {
          const role = data.role ? data.role.trim().toLowerCase() : "guest";

          if (role === "admin") {
            navigate("/admin"); // redirect admins to admin page
          } else if (role === "owner") {
            navigate("/owner");
          } else {
            navigate("/"); // guest or other roles
          }
        }, 1500);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Server error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // google response handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}${ENDPOINTS.GOOGLE_AUTH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (data.success) {
        const userData = {
          id: data.userId,
          role: data.role,
          username: data.username || "",
          restaurantId: data.restaurantId || null,
          restaurantName: data.restaurantName || null,
          token: data.token, // Store the token
        };
        login(userData);
        
        // Check if user needs to select a restaurant
        if (!data.restaurantId) {
          setMessage("Please select your restaurant");
          setTimeout(() => {
            navigate("/select-restaurant");
          }, 1000);
          return;
        }
        
        setMessage(`${data.message}`);
        setTimeout(() => {
          const role = data.role ? data.role.trim().toLowerCase() : "guest";
          if (role === "admin") {
            navigate("/admin");
          } else if (role === "owner") {
            navigate("/owner");
          } else {
            navigate("/");
          }
        }, 1500);
      } else {
        setMessage(data.message || "Google login failed");
      }
    } catch (err) {
      console.error("Google login error", err);
      setMessage("Network error during Google login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setMessage("Google sign-in was cancelled or failed");
  };

  return (
    <div className="login-page-background">
      <div className="login-register-container">
        <h1>Welcome</h1>
        <h2>Login to Himalayan Feast and Flavours</h2>

        <form className="login-register-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Username/Email</label>
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
                autoComplete="current-password"
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

          <button
            type="submit"
            className={`login-register-btn ${isLoading ? "login-loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-register-text">
          Don't have an account?{" "}
          <Link to="/register" className="login-register-link">
            Create an account
          </Link>
        </p>

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

        {/* google button */}
        <div className="mt-3 text-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
          />
        </div>
      </div>
    </div>
  );
}
