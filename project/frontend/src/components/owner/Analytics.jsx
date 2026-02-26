import { useState, useEffect } from "react";
import { API_BASE } from "../../config/api";
import "./Analytics.css";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [retentionData, setRetentionData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [monthly, peak, category, retention] = await Promise.all([
        fetch(`${API_BASE}/api/owner/analytics/monthly-comparison`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/owner/analytics/peak-hours`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/owner/analytics/category-performance`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/owner/analytics/customer-retention`, { headers }).then(r => r.json()),
      ]);

      if (monthly.success) setMonthlyData(monthly.data);
      if (peak.success) setPeakHours(peak.data);
      if (category.success) setCategoryData(category.data);
      if (retention.success) setRetentionData(retention.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatHour = (hour) => {
    const h = parseInt(hour);
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  };

  const getMaxValue = (data, key) => {
    return Math.max(...data.map(d => d[key]), 1);
  };

  const getCategoryColor = (index) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics data...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <button className="refresh-btn" onClick={fetchAnalyticsData}>
          🔄 Refresh Data
        </button>
      </div>
      
      {/* Monthly Sales Comparison */}
      <div className="analytics-section">
        <h2>📊 Monthly Sales Trend</h2>
        <div className="monthly-chart">
          {monthlyData.length > 0 ? (
            <div className="chart-bars">
              {monthlyData.reverse().map((month, index) => (
                <div key={index} className="month-bar-item">
                  <div className="month-label">{formatMonth(month.month)}</div>
                  <div className="month-bar-wrapper">
                    <div
                      className="month-bar-fill"
                      style={{
                        height: `${(month.totalRevenue / getMaxValue(monthlyData, 'totalRevenue')) * 100}%`
                      }}
                      title={`₹${month.totalRevenue.toFixed(2)}`}
                    ></div>
                  </div>
                  <div className="month-stats">
                    <div className="month-revenue">₹{month.totalRevenue.toFixed(0)}</div>
                    <div className="month-orders">{month.totalOrders} orders</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No monthly data available</p>
          )}
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="analytics-section">
        <h2>⏰ Peak Hours Analysis</h2>
        <p className="section-subtitle">Last 30 days - Busiest times of the day</p>
        <div className="peak-hours-chart">
          {peakHours.length > 0 ? (
            <div className="hours-grid">
              {peakHours.map((hour, index) => (
                <div key={index} className="hour-item">
                  <div className="hour-label">{formatHour(hour.hour)}</div>
                  <div className="hour-bar-wrapper">
                    <div
                      className="hour-bar-fill"
                      style={{
                        height: `${(hour.orderCount / getMaxValue(peakHours, 'orderCount')) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="hour-count">{hour.orderCount}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No peak hours data available</p>
          )}
        </div>
      </div>

      {/* Category Performance */}
      <div className="analytics-section">
        <h2>🍽️ Category Performance</h2>
        <p className="section-subtitle">Last 30 days - Sales by menu category</p>
        <div className="category-performance">
          {categoryData.length > 0 ? (
            <div className="category-grid">
              {categoryData.map((cat, index) => (
                <div key={index} className="category-card">
                  <div 
                    className="category-header"
                    style={{ background: getCategoryColor(index) }}
                  >
                    <h3>{cat.category}</h3>
                  </div>
                  <div className="category-body">
                    <div className="category-stat">
                      <span className="stat-label">Revenue</span>
                      <span className="stat-value">₹{cat.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="category-stat">
                      <span className="stat-label">Orders</span>
                      <span className="stat-value">{cat.orderCount}</span>
                    </div>
                    <div className="category-stat">
                      <span className="stat-label">Items Sold</span>
                      <span className="stat-value">{cat.itemsSold}</span>
                    </div>
                  </div>
                  <div className="category-bar">
                    <div
                      className="category-bar-fill"
                      style={{
                        width: `${(cat.totalRevenue / getMaxValue(categoryData, 'totalRevenue')) * 100}%`,
                        background: getCategoryColor(index)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No category data available</p>
          )}
        </div>
      </div>

      {/* Customer Retention */}
      <div className="analytics-section">
        <h2>👥 Customer Retention Metrics</h2>
        <p className="section-subtitle">Last 30 days - Customer behavior analysis</p>
        {retentionData ? (
          <div className="retention-container">
            <div className="retention-cards">
              <div className="retention-card new">
                <div className="retention-icon">🆕</div>
                <div className="retention-number">{retentionData.newCustomers}</div>
                <div className="retention-label">New Customers</div>
              </div>
              <div className="retention-card returning">
                <div className="retention-icon">🔄</div>
                <div className="retention-number">{retentionData.returningCustomers}</div>
                <div className="retention-label">Returning Customers</div>
              </div>
              <div className="retention-card total">
                <div className="retention-icon">👤</div>
                <div className="retention-number">{retentionData.totalCustomers}</div>
                <div className="retention-label">Total Customers</div>
              </div>
              <div className="retention-card rate">
                <div className="retention-icon">📈</div>
                <div className="retention-number">{retentionData.retentionRate}%</div>
                <div className="retention-label">Retention Rate</div>
              </div>
            </div>

            {/* Visual Pie Chart */}
            <div className="retention-visual">
              <div className="pie-chart">
                <svg viewBox="0 0 200 200" className="pie-svg">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#e1e8ed"
                    strokeWidth="40"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="40"
                    strokeDasharray={`${(retentionData.returningCustomers / retentionData.totalCustomers) * 502.4} 502.4`}
                    strokeDashoffset="0"
                    transform="rotate(-90 100 100)"
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#667eea">
                    {retentionData.retentionRate}%
                  </text>
                  <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#6c757d">
                    Retention
                  </text>
                </svg>
              </div>
              <div className="retention-legend">
                <div className="legend-item">
                  <span className="legend-color returning"></span>
                  <span>Returning: {retentionData.returningCustomers}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color new"></span>
                  <span>New: {retentionData.newCustomers}</span>
                </div>
              </div>
            </div>

            <div className="retention-insight">
              <p>
                <strong>Average Orders per Customer:</strong> {retentionData.avgOrdersPerCustomer}
              </p>
              <p className="insight-text">
                {retentionData.retentionRate >= 50 
                  ? "✅ Great retention! Your customers love coming back."
                  : retentionData.retentionRate >= 30
                  ? "⚠️ Good retention, but there's room for improvement."
                  : "📢 Focus on customer loyalty programs to improve retention."}
              </p>
            </div>
          </div>
        ) : (
          <p className="no-data">No retention data available</p>
        )}
      </div>
    </div>
  );
}
