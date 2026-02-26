import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import Analytics from "../components/owner/Analytics";
import "../styles/owner.css";

const Owner = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Dashboard data states
  const [revenueData, setRevenueData] = useState({
    today: 0,
    weekly: [],
    monthly: [],
  });
  const [todayStats, setTodayStats] = useState({
    totalOrders: 0,
    uniqueCustomers: 0,
    avgOrderValue: 0,
  });
  const [popularItems, setPopularItems] = useState([]);
  const [customerFavorites, setCustomerFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not owner
  useEffect(() => {
    if (!user || user.role !== "owner") {
      navigate("/login");
    }
  }, [user, navigate]);

  // Animation effect on mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [
        revenueResponse,
        statsResponse,
        popularResponse,
        customersResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/api/owner/revenue`, { headers }),
        fetch(`${API_BASE}/api/owner/today-stats`, { headers }),
        fetch(`${API_BASE}/api/owner/popular-items`, { headers }),
        fetch(`${API_BASE}/api/owner/customer-favorites`, { headers }),
      ]);

      const revenueData = await revenueResponse.json();
      const statsData = await statsResponse.json();
      const popularData = await popularResponse.json();
      const customersData = await customersResponse.json();

      if (revenueData.success) {
        setRevenueData(revenueData.revenue);
      }

      if (statsData.success) {
        setTodayStats(statsData.stats);
      }

      if (popularData.success) {
        setPopularItems(popularData.popularItems);
      }

      if (customersData.success) {
        setCustomerFavorites(customersData.customers);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatCustomerDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className={`admin-container ${isLoaded ? "loaded" : ""}`}>
      <header className="admin-header animate-slide-down">
        <h1 className="animate-fade-in">📊 Owner Dashboard</h1>
        <div className="user-info animate-fade-in-delay">
          <span className="user-avatar">👤</span>
          <span className="user-name">{user.username}</span>
          <span className="badge bg-owner">{user.role}</span>
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
              activeTab === "dashboard" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="btn-icon">📊</span>
            <span className="btn-text">Dashboard</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeTab === "analytics" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            <span className="btn-icon">📈</span>
            <span className="btn-text">Analytics</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeTab === "reports" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("reports")}
          >
            <span className="btn-icon">📋</span>
            <span className="btn-text">Reports</span>
          </button>
          <button
            className={`sidebar-btn ${
              activeTab === "customers" ? "active animate-bounce-in" : ""
            }`}
            onClick={() => setActiveTab("customers")}
          >
            <span className="btn-icon">👥</span>
            <span className="btn-text">Customers</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="admin-main animate-fade-in-up">
          <div className="content-wrapper">
            {activeTab === "dashboard" && (
              <div className="owner-dashboard-content">
                <div className="dashboard-header-actions">
                  <button className="refresh-btn" onClick={fetchDashboardData}>
                    🔄 Refresh Data
                  </button>
                </div>
                {loading ? (
                  <div className="loading">Loading dashboard data...</div>
                ) : (
                  <>
                    {/* REVENUE CARDS */}
                    <div className="dashboard-section">
                      <h2>Revenue Overview</h2>
                      <div className="revenue-cards">
                        <div className="revenue-card">
                          <div className="card-icon">💰</div>
                          <h3>Today's Revenue</h3>
                          <div className="revenue-amount">
                            ₹{parseFloat(revenueData.today).toFixed(2)}
                          </div>
                          <p className="revenue-subtitle">Total sales today</p>
                        </div>

                        <div className="revenue-card">
                          <div className="card-icon">📅</div>
                          <h3>This Week</h3>
                          <div className="revenue-amount">
                            ₹
                            {revenueData.weekly
                              .reduce(
                                (sum, day) => sum + parseFloat(day.daily_revenue),
                                0
                              )
                              .toFixed(2)}
                          </div>
                          <p className="revenue-subtitle">Last 7 days</p>
                        </div>

                        <div className="revenue-card">
                          <div className="card-icon">📊</div>
                          <h3>This Month</h3>
                          <div className="revenue-amount">
                            ₹
                            {revenueData.monthly
                              .reduce(
                                (sum, day) => sum + parseFloat(day.daily_revenue),
                                0
                              )
                              .toFixed(2)}
                          </div>
                          <p className="revenue-subtitle">Last 30 days</p>
                        </div>
                      </div>
                    </div>

                    {/* TODAY'S STATS */}
                    <div className="dashboard-section">
                      <h2>Today's Snapshot</h2>
                      <div className="stats-cards">
                        <div className="stat-card">
                          <div className="stat-icon">📦</div>
                          <h3>Total Orders</h3>
                          <div className="stat-number">{todayStats.totalOrders}</div>
                          <p className="stat-subtitle">Orders placed today</p>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">👥</div>
                          <h3>Unique Customers</h3>
                          <div className="stat-number">{todayStats.uniqueCustomers}</div>
                          <p className="stat-subtitle">Different customers today</p>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">💰</div>
                          <h3>Avg Order Value</h3>
                          <div className="stat-number">
                            ₹{parseFloat(todayStats.avgOrderValue).toFixed(2)}
                          </div>
                          <p className="stat-subtitle">Average per order</p>
                        </div>
                      </div>
                    </div>

                    {/* WEEKLY REVENUE CHART */}
                    <div className="dashboard-section">
                      <h2>Weekly Revenue Trend</h2>
                      <div className="chart-container">
                        {revenueData.weekly.length > 0 ? (
                          <div className="revenue-bars">
                            {revenueData.weekly.map((day, index) => (
                              <div key={index} className="bar-item">
                                <div className="bar-label">{formatDate(day.date)}</div>
                                <div className="bar-wrapper">
                                  <div
                                    className="bar-fill"
                                    style={{
                                      height: `${
                                        (parseFloat(day.daily_revenue) /
                                          Math.max(
                                            ...revenueData.weekly.map((d) =>
                                              parseFloat(d.daily_revenue)
                                            )
                                          )) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="bar-amount">
                                  ₹{parseFloat(day.daily_revenue).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-data">No revenue data for this week yet.</p>
                        )}
                      </div>
                    </div>

                    {/* POPULAR ITEMS */}
                    <div className="dashboard-section">
                      <h2>Popular Items (Last 30 Days)</h2>
                      <div className="popular-items-container">
                        {popularItems.length > 0 ? (
                          <div className="popular-items-list">
                            {popularItems.map((item, index) => (
                              <div key={index} className="popular-item-card">
                                <div className="popular-item-rank">#{index + 1}</div>
                                <div className="popular-item-content">
                                  <h3>{item.name}</h3>
                                  <p className="popular-item-desc">{item.description}</p>
                                  <div className="popular-item-stats">
                                    <span className="stat-badge">
                                      📦 {item.total_quantity} sold
                                    </span>
                                    <span className="stat-badge">
                                      💰 ₹{parseFloat(item.total_revenue).toFixed(2)}
                                    </span>
                                    <span className="stat-badge">
                                      🛒 {item.order_count} orders
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-data">No popular items data yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <Analytics />
            )}

            {activeTab === "reports" && (
              <div className="coming-soon animate-scale-in">
                <div className="coming-soon-icon">📋</div>
                <h2>Detailed Reports</h2>
                <p>Export and download reports coming soon...</p>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            )}

            {activeTab === "customers" && (
              <div className="owner-dashboard-content">
                {loading ? (
                  <div className="loading">Loading customer data...</div>
                ) : (
                  <div className="dashboard-section">
                    <h2>Top Customers & Favorites</h2>
                    <div className="customers-container">
                      {customerFavorites.length > 0 ? (
                        <div className="customers-grid">
                          {customerFavorites.map((customer, index) => (
                            <div key={index} className="customer-card">
                              <div className="customer-header">
                                <div className="customer-rank">#{index + 1}</div>
                                <div className="customer-info">
                                  <h3>{customer.username}</h3>
                                  <span
                                    className={`loyalty-badge ${customer.loyaltyLevel.toLowerCase()}`}
                                  >
                                    {customer.loyaltyLevel}
                                  </span>
                                </div>
                              </div>

                              <div className="customer-stats">
                                <div className="customer-stat">
                                  <span className="stat-label">Orders</span>
                                  <span className="stat-value">
                                    {customer.totalOrders}
                                  </span>
                                </div>
                                <div className="customer-stat">
                                  <span className="stat-label">Total Spent</span>
                                  <span className="stat-value">
                                    ₹{customer.totalSpent.toFixed(2)}
                                  </span>
                                </div>
                                <div className="customer-stat">
                                  <span className="stat-label">Avg Order</span>
                                  <span className="stat-value">
                                    ₹{customer.avgOrderValue.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <div className="customer-favorites">
                                <div className="favorites-label">Favorite Items:</div>
                                <div className="favorites-items">
                                  {customer.favoriteItems}
                                </div>
                              </div>

                              <div className="customer-footer">
                                <span className="last-order">
                                  Last order:{" "}
                                  {formatCustomerDate(customer.lastOrderDate)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">No customer data available yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Owner;
