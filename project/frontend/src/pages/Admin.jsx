// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import MenuManagement from "../components/admin/MenuManagement";
import UserManagement from "../components/admin/UserManagement";
import OrderManagement from "../components/admin/OrderManagement";
import SalesReports from "../components/admin/SalesReports";
import "../styles/admin.css";

const Admin = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("menu");
  const [isLoaded, setIsLoaded] = useState(false);

  // Redirect if not admin/owner
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Animation effect on mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className={`admin-container ${isLoaded ? "loaded" : ""}`}>
      <header className="admin-header animate-slide-down">
        <h1 className="animate-fade-in">📊 Admin Dashboard</h1>
        <div className="user-info animate-fade-in-delay">
          <span className="user-avatar">👤</span>
          <span className="user-name">{user.username}</span>
          <span
            className={`badge ${
              user.role === "admin" ? "bg-admin" : "bg-owner"
            }`}
          >
            {user.role}
          </span>
          {user.restaurantName && (
            <span className="restaurant-name animate-pulse">
              🏷️ {user.restaurantName}
            </span>
          )}
        </div>
      </header>

      <div className="admin-content">
        {/* Sidebar Navigation */}
        <div className="admin-sidebar animate-slide-left">
          <div className="sidebar-header">
            <h3>Navigation</h3>
          </div>
          <button
            className={`sidebar-btn ${
              activeTab === "menu" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("menu")}
          >
            <span className="btn-icon">🍽️</span>
            <span className="btn-text">Menu Management</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeTab === "orders" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("orders")}
          >
            <span className="btn-icon">📦</span>
            <span className="btn-text">Orders</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeTab === "users" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("users")}
          >
            <span className="btn-icon">👥</span>
            <span className="btn-text">Users</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeTab === "reports" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("reports")}
          >
            <span className="btn-icon">📊</span>
            <span className="btn-text">Reports</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="admin-main animate-fade-in-up">
          <div className="content-wrapper">
            {activeTab === "menu" && <MenuManagement />}
            {activeTab === "orders" && <OrderManagement />}
            {activeTab === "users" && <UserManagement />}
            {activeTab === "reports" && <SalesReports />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
