import { useState, useEffect } from "react";
import { API_BASE } from "../../config/api";
import "./OrderManagement.css";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    completed: 0,
    revenue: 0
  });

  const getStatsLabel = () => {
    switch(dateFilter) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "week": return "Last 7 Days";
      default: return "All Time";
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats(orders); // Recalculate stats when filters change
  }, [orders, statusFilter, dateFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        calculateStats(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    // Filter orders based on current date filter
    let filteredForStats = [...ordersList];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === "today") {
      filteredForStats = ordersList.filter(o => new Date(o.created_at) >= today);
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      filteredForStats = ordersList.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= yesterday && orderDate < today;
      });
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredForStats = ordersList.filter(o => new Date(o.created_at) >= weekAgo);
    }

    setStats({
      totalOrders: filteredForStats.length,
      pending: ordersList.filter(o => o.status === 'new' || o.status === 'preparing').length,
      completed: filteredForStats.filter(o => o.status === 'completed').length,
      revenue: filteredForStats.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
    });
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === "today") {
      filtered = filtered.filter(o => new Date(o.created_at) >= today);
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= yesterday && orderDate < today;
      });
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(o => new Date(o.created_at) >= weekAgo);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.id.toString().includes(searchTerm) ||
        o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o => 
          o.id === orderId ? { ...o, status: newStatus } : o
        ));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Server error. Please try again.");
    }
  };

  const viewOrderDetails = async (order) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/admin/orders/${order.id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      new: "status-new",
      preparing: "status-preparing",
      ready: "status-ready",
      completed: "status-completed",
      cancelled: "status-cancelled"
    };
    return classes[status] || "status-default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: "New",
      preparing: "Preparing",
      ready: "Ready",
      completed: "Completed",
      cancelled: "Cancelled"
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="order-management">
      {/* Stats Cards */}
      <div className="order-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Orders {getStatsLabel()}</div>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed {getStatsLabel()}</div>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">₹{stats.revenue.toFixed(2)}</div>
            <div className="stat-label">Revenue {getStatsLabel()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="order-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="new">New</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date:</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
          </select>
        </div>

        <div className="filter-group search">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Order ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="refresh-btn" onClick={fetchOrders}>
          🔄 Refresh
        </button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📭</div>
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">#{order.id}</td>
                  <td>{order.customer_name || `Customer #${order.customer_id}`}</td>
                  <td>
                    <div className="date-cell">
                      <div>{formatDate(order.created_at)}</div>
                      <div className="time-ago">{formatTime(order.created_at)}</div>
                    </div>
                  </td>
                  <td>{order.item_count || 0} items</td>
                  <td className="price">₹{parseFloat(order.total_price || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-view"
                        onClick={() => viewOrderDetails(order)}
                      >
                        👁️ View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.id}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="order-info-grid">
                <div className="info-item">
                  <label>Customer:</label>
                  <span>{selectedOrder.customer_name || `Customer #${selectedOrder.customer_id}`}</span>
                </div>
                <div className="info-item">
                  <label>Order Date:</label>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className="info-item">
                  <label>Total Amount:</label>
                  <span className="price-large">₹{parseFloat(selectedOrder.total_price || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="order-items-section">
                <h4>Order Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₹{parseFloat(item.price).toFixed(2)}</td>
                        <td>₹{(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="status-actions">
                <h4>Update Status (Admin Override)</h4>
                <p className="status-note">⚠️ Status updates should normally be done by Kitchen staff. Use this only for corrections or cancellations.</p>
                <div className="status-buttons">
                  <button 
                    className="status-btn new"
                    onClick={() => handleStatusChange(selectedOrder.id, 'new')}
                    disabled={selectedOrder.status === 'new'}
                  >
                    New
                  </button>
                  <button 
                    className="status-btn preparing"
                    onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                    disabled={selectedOrder.status === 'preparing'}
                  >
                    Preparing
                  </button>
                  <button 
                    className="status-btn ready"
                    onClick={() => handleStatusChange(selectedOrder.id, 'ready')}
                    disabled={selectedOrder.status === 'ready'}
                  >
                    Ready
                  </button>
                  <button 
                    className="status-btn completed"
                    onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                    disabled={selectedOrder.status === 'completed'}
                  >
                    Completed
                  </button>
                  <button 
                    className="status-btn cancelled"
                    onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                    disabled={selectedOrder.status === 'cancelled'}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
