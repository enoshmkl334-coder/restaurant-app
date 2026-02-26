// src/components/admin/MenuItemList.jsx
import React from "react";

const MenuItemList = ({ items, onEdit, onDelete }) => {
  const getCategoryLabel = (category) => {
    const labels = {
      appetizers: "Appetizers",
      mains: "Main Course",
      desserts: "Desserts",
      beverages: "Beverages",
    };
    return labels[category] || category;
  };

  if (items.length === 0) {
    return (
      <div className="no-items">
        <p>No menu items yet. Add your first item!</p>
      </div>
    );
  }

  return (
    <div className="menu-table-container">
      <table className="menu-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Description</th>
            <th>Price/Varieties</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <img
                  src={item.image || item.image_url || "/image/placeholder.jpg"}
                  alt={item.name}
                  style={{
                    width: 100,
                    height: 70,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                  onError={(e) => {
                    e.target.src = "/image/placeholder.jpg";
                  }}
                />
              </td>
              <td>
                <strong>{item.name}</strong>
              </td>
              <td>
                <span className="badge bg-info">
                  {getCategoryLabel(item.category)}
                </span>
              </td>
              <td>
                <p className="description-truncate">{item.description}</p>
              </td>
              <td>
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Rs. {item.price}</strong>
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div className="varieties-list">
                      {item.options.map((opt, idx) => (
                        <div key={idx} className="variety-badge">
                          {opt.label}: <strong>Rs. {opt.price}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="edit-btn" onClick={() => onEdit(item)}>
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => onDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MenuItemList;
