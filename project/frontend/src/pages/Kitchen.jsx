import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_BASE } from "../config/api";
import "../styles/kitchen.css";

const Kitchen = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("active"); // active, all
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check authentication and role
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login");
    }
  }, [user, userLoading, navigate]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/kitchen/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      setOrders(data.orders || []);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/kitchen/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update order status");
    }
  };

  // Auto-refresh every 5 seconds (faster for real-time updates)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (filter === "active") {
      return ["new", "pending", "preparing", "ready"].includes(order.status);
    }
    return true;
  });

  // Get time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "new":
      case "pending":
        return "status-new";
      case "preparing":
        return "status-preparing";
      case "ready":
        return "status-ready";
      case "completed":
        return "status-completed";
      default:
        return "";
    }
  };

  // Get next action
  const getNextAction = (status) => {
    switch (status) {
      case "new":
      case "pending":
        return { label: "Start Cooking", nextStatus: "preparing" };
      case "preparing":
        return { label: "Mark Ready", nextStatus: "ready" };
      case "ready":
        return { label: "Complete", nextStatus: "completed" };
      default:
        return null;
    }
  };

  if (userLoading || loading) {
    return (
      <div className="kitchen-page">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <h1>🍳 Kitchen Orders</h1>
        <div className="header-actions">
          <div className="last-updated">
            {lastUpdated && (
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
            {refreshing && <span className="refreshing-dot">●</span>}
          </div>
          <button className="refresh-btn" onClick={fetchOrders} disabled={refreshing}>
            🔄 {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="logout-btn" onClick={() => navigate("/")}>
            ← Back
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === "active" ? "active" : ""}
          onClick={() => setFilter("active")}
        >
          Active Orders ({orders.filter(o => ["new", "pending", "preparing", "ready"].includes(o.status)).length})
        </button>
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All Orders ({orders.length})
        </button>
      </div>

      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>✅ No active orders</p>
            <p className="subtitle">New orders will appear here automatically</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const nextAction = getNextAction(order.status);

            return (
              <div key={order.id} className={`order-card ${getStatusColor(order.status)}`}>
                <div className="order-header">
                  <div className="order-number">#{order.id}</div>
                  <div className="order-time">{getTimeAgo(order.created_at)}</div>
                </div>

                <div className="order-customer">
                  <span className="customer-icon">👤</span>
                  {order.customer_name || "Guest"}
                </div>

                <div className="order-items">
                  <div className="item-row">
                    <span className="item-name">{order.items}</span>
                  </div>
                </div>

                <div className="order-footer">
                  <div className={`status-badge ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </div>
                  {nextAction && (
                    <button
                      className="action-btn"
                      onClick={() => updateOrderStatus(order.id, nextAction.nextStatus)}
                    >
                      {nextAction.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Kitchen;
