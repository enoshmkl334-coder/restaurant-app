import { useState, useEffect } from "react";
import "./UserManagement.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0
  });
  
  // Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters whenever search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, statusFilter, restaurantFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        calculateStats(data.users);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList) => {
    const total = userList.length;
    const active = userList.filter(u => u.isActive === 1).length;
    const inactive = total - active;
    
    // Calculate new users this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = userList.filter(u => {
      const createdDate = new Date(u.created_at || u.lastLogin);
      return createdDate >= firstDayOfMonth;
    }).length;
    
    setStats({ total, active, inactive, newThisMonth });
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.google_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.permission === roleFilter);
    }
    
    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active" ? 1 : 0;
      filtered = filtered.filter(user => user.isActive === isActive);
    }
    
    // Restaurant filter
    if (restaurantFilter !== "all") {
      filtered = filtered.filter(user => 
        user.restaurant_id === parseInt(restaurantFilter)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users/role", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: newRole })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, permission: newRole } : u
        ));
        alert("Role updated successfully!");
      } else {
        alert(data.message || "Failed to update role");
      }
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Server error. Please try again.");
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users/status", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, isActive: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isActive: newStatus } : u
        ));
        calculateStats(users.map(u => 
          u.id === userId ? { ...u, isActive: newStatus } : u
        ));
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Server error. Please try again.");
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleBulkRoleChange = async (newRole) => {
    if (selectedUsers.length === 0) {
      alert("Please select users first");
      return;
    }
    
    if (!confirm(`Change role to "${newRole}" for ${selectedUsers.length} users?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users/bulk-role", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userIds: selectedUsers, role: newRole })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchUsers(); // Refresh list
        setSelectedUsers([]);
        setShowBulkActions(false);
        alert(`Updated ${selectedUsers.length} users successfully!`);
      } else {
        alert(data.message || "Failed to update users");
      }
    } catch (err) {
      console.error("Error bulk updating:", err);
      alert("Server error. Please try again.");
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  if (loading) {
    return <div className="user-management-loading">Loading users...</div>;
  }

  if (error) {
    return <div className="user-management-error">{error}</div>;
  }

  return (
    <div className="user-management">
      <h2>👥 User Management</h2>
      
      {/* Statistics */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.newThisMonth}</div>
          <div className="stat-label">New This Month</div>
        </div>
      </div>

      {/* Filters */}
      <div className="user-filters">
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="guest">Guest</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="kitchen">Kitchen</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        
        <select
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Restaurants</option>
          <option value="1">Restaurant 1</option>
          <option value="2">Restaurant 2</option>
        </select>
        
        <button 
          className="refresh-btn"
          onClick={fetchUsers}
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.length} users selected</span>
          <button onClick={() => setShowBulkActions(!showBulkActions)}>
            Bulk Actions ▼
          </button>
          {showBulkActions && (
            <div className="bulk-actions-menu">
              <button onClick={() => handleBulkRoleChange('guest')}>
                Set as Guest
              </button>
              <button onClick={() => handleBulkRoleChange('owner')}>
                Set as Owner
              </button>
              <button onClick={() => setSelectedUsers([])}>
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Table */}
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Restaurant</th>
              <th>Status</th>
              <th>Type</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-users">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} onClick={() => handleUserClick(user)} className="user-row">
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.google_email || '-'}</td>
                  <td>
                    <select
                      value={user.permission || 'guest'}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleRoleChange(user.id, e.target.value);
                      }}
                      className="role-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="guest">Guest</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="kitchen">Kitchen</option>
                    </select>
                  </td>
                  <td>{user.restaurant || '-'}</td>
                  <td>
                    <span className={`status-badge ${user.isActive === 1 ? 'active' : 'inactive'}`}>
                      {user.isActive === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.google_id ? '🔵 Google' : '📧 Email'}
                  </td>
                  <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`toggle-btn ${user.isActive === 1 ? 'deactivate' : 'activate'}`}
                      onClick={() => handleStatusToggle(user.id, user.isActive)}
                    >
                      {user.isActive === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}

// User Details Modal Component
function UserDetailsModal({ user, onClose, onUpdate }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="user-detail-section">
            <h4>Basic Information</h4>
            <div className="detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{user.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{user.username}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user.google_email || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Role:</span>
              <span className="detail-value badge-role">{user.permission || 'guest'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Restaurant:</span>
              <span className="detail-value">{user.restaurant || 'Not assigned'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`detail-value ${user.isActive === 1 ? 'text-success' : 'text-danger'}`}>
                {user.isActive === 1 ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="user-detail-section">
            <h4>Account Information</h4>
            <div className="detail-row">
              <span className="detail-label">Account Type:</span>
              <span className="detail-value">
                {user.google_id ? '🔵 Google OAuth' : '📧 Email/Password'}
              </span>
            </div>
            {user.google_id && (
              <div className="detail-row">
                <span className="detail-label">Google ID:</span>
                <span className="detail-value">{user.google_id}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Last Login:</span>
              <span className="detail-value">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">
                {user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </div>

          <div className="user-detail-section">
            <h4>Activity</h4>
            <p className="coming-soon-text">Order history and activity log coming soon...</p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
