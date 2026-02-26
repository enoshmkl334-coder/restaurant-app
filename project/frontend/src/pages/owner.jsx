import React, { useState, useEffect } from "react";
import "../styles/owner.css";

function Owner() {
  const [revenueData, setRevenueData] = useState({
    today: 0,
    weekly: [],
    monthly: [],
  });

  // ADD THIS STATE
  const [todayStats, setTodayStats] = useState({
    totalOrders: 0,
    uniqueCustomers: 0,
    avgOrderValue: 0,
  });
  // Add this line here:
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add this with your other state variables
  const [customerFavorites, setCustomerFavorites] = useState([]);

  // Fetch all data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch ALL FOUR APIs in parallel
      const [
        revenueResponse,
        statsResponse,
        popularResponse,
        customersResponse,
      ] = await Promise.all([
        fetch("/api/owner/revenue"),
        fetch("/api/owner/today-stats"),
        fetch("/api/owner/popular-items"),
        fetch("/api/owner/customer-favorites"), // NEW: Add this
      ]);

      const revenueData = await revenueResponse.json();
      const statsData = await statsResponse.json();
      const popularData = await popularResponse.json();
      const customersData = await customersResponse.json(); // NEW: Get customers data

      if (revenueData.success) {
        setRevenueData(revenueData.revenue);
      }

      if (statsData.success) {
        setTodayStats(statsData.stats);
      }

      if (popularData.success) {
        setPopularItems(popularData.popularItems);
      }

      // NEW: Set customer favorites data
      if (customersData.success) {
        setCustomerFavorites(customersData.customers);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  // Format date for customer last order
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

  return (
    <div className="owner-container">
      <h1>Owner Dashboard</h1>

      {loading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : (
        <>
          {/* REVENUE CARDS - Row 1 */}
          <div className="dashboard-section">
            <h2>Revenue Overview</h2>
            <div className="revenue-cards">
              {/* Card 1: Today's Revenue */}
              <div className="revenue-card">
                <div className="card-icon">💰</div>
                <h3>Today's Revenue</h3>
                <div className="revenue-amount">
                  ₹{parseFloat(revenueData.today).toFixed(2)}
                </div>
                <p className="revenue-subtitle">Total sales today</p>
              </div>

              {/* Card 2: Weekly Revenue */}
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

              {/* Card 3: Monthly Revenue */}
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

          {/* TODAY'S STATS CARDS - Row 2 */}
          <div className="dashboard-section">
            <h2>Today's Snapshot</h2>
            <div className="stats-cards">
              {/* Card 1: Total Orders */}
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <h3>Total Orders</h3>
                <div className="stat-number">{todayStats.totalOrders}</div>
                <p className="stat-subtitle">Orders placed today</p>
              </div>

              {/* Card 2: Unique Customers */}
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>Unique Customers</h3>
                <div className="stat-number">{todayStats.uniqueCustomers}</div>
                <p className="stat-subtitle">Different customers today</p>
              </div>

              {/* Card 3: Average Order Value */}
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

          {/* WEEKLY REVENUE CHART - Row 3 */}
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

          {/* POPULAR ITEMS CHART - Row 4 */}
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

          {/* CUSTOMER FAVORITES - Row 5 */}
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

          {/* QUICK ACTIONS - Row 6 */}
          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="coming-soon">
              <div className="coming-soon-card">
                <h3>📋 Today's Orders</h3>
                <p>View and manage today's orders</p>
                <button className="btn-disabled" disabled>
                  Coming Soon
                </button>
              </div>
              <div className="coming-soon-card">
                <h3>📈 Advanced Analytics</h3>
                <p>Detailed reports and trends</p>
                <button className="btn-disabled" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Owner;
