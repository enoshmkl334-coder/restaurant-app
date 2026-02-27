import { useState, useEffect } from "react";
import { API_BASE } from "../../config/api";
import "./SalesReports.css";

export default function SalesReports() {
  const [reportType, setReportType] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set default dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${API_BASE}/api/admin/reports/sales?type=${reportType}&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setReportData(data.report);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;

    let csv = "Order ID,Date,Customer,Items,Total,Status\n";
    
    reportData.orders.forEach(order => {
      csv += `${order.id},${order.created_at},${order.customer_name || 'Guest'},${order.item_count},${order.total_price},${order.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  const printReport = () => {
    window.print();
  };

  const quickReport = (type) => {
    const today = new Date();
    let start, end;

    switch(type) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        start = weekAgo.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        start = monthAgo.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
    }

    setStartDate(start);
    setEndDate(end);
    setReportType('custom');
  };

  return (
    <div className="sales-reports">
      <div className="reports-header">
        <h2>📊 Sales Reports</h2>
        <p>Generate and download sales reports for accounting and analysis</p>
      </div>

      {/* Quick Report Buttons */}
      <div className="quick-reports">
        <h3>Quick Reports</h3>
        <div className="quick-buttons">
          <button className="quick-btn" onClick={() => quickReport('today')}>
            📅 Today's Report
          </button>
          <button className="quick-btn" onClick={() => quickReport('yesterday')}>
            📅 Yesterday's Report
          </button>
          <button className="quick-btn" onClick={() => quickReport('week')}>
            📅 Last 7 Days
          </button>
          <button className="quick-btn" onClick={() => quickReport('month')}>
            📅 Last 30 Days
          </button>
        </div>
      </div>

      {/* Custom Report Generator */}
      <div className="custom-report">
        <h3>Custom Report</h3>
        <div className="report-form">
          <div className="form-row">
            <div className="form-group">
              <label>Report Type:</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="daily">Daily Summary</option>
                <option value="detailed">Detailed Orders</option>
                <option value="items">Items Breakdown</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button className="generate-btn" onClick={generateReport} disabled={loading}>
              {loading ? "Generating..." : "📊 Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="report-display">
          <div className="report-actions no-print">
            <button className="action-btn download" onClick={downloadCSV}>
              📥 Download CSV
            </button>
            <button className="action-btn print" onClick={printReport}>
              🖨️ Print Report
            </button>
          </div>

          <div className="report-content printable">
            <div className="report-header-print">
              <h2>Sales Report</h2>
              <p>Period: {startDate} to {endDate}</p>
              <p>Generated: {new Date().toLocaleString()}</p>
            </div>

            {/* Summary Cards */}
            <div className="report-summary">
              <div className="summary-card">
                <div className="summary-label">Total Orders</div>
                <div className="summary-value">{reportData.summary.totalOrders}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Revenue</div>
                <div className="summary-value">₹{reportData.summary.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Average Order</div>
                <div className="summary-value">₹{reportData.summary.avgOrder.toFixed(2)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Completed Orders</div>
                <div className="summary-value">{reportData.summary.completedOrders}</div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="report-table-container">
              <h3>Order Details</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>{order.customer_name || 'Guest'}</td>
                      <td>{order.item_count} items</td>
                      <td>₹{parseFloat(order.total_price).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Items */}
            {reportData.topItems && reportData.topItems.length > 0 && (
              <div className="top-items-section">
                <h3>Top Selling Items</h3>
                <div className="top-items-grid">
                  {reportData.topItems.map((item, index) => (
                    <div key={index} className="top-item-card">
                      <div className="item-rank">#{index + 1}</div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-stats">
                          <span>{item.quantity} sold</span>
                          <span>₹{parseFloat(item.revenue).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!reportData && !loading && (
        <div className="no-report">
          <div className="no-report-icon">📋</div>
          <p>Select a date range and click "Generate Report" to view sales data</p>
        </div>
      )}
    </div>
  );
}
