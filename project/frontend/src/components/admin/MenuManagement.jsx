// src/components/admin/MenuManagement.jsx
import React, { useState, useEffect } from "react";
import { menuApi } from "../../services/menuApi";
import { API_BASE } from "../../config/api";
import MenuItemForm from "./MenuItemForm";
import MenuItemList from "./MenuItemList";
import { useUser } from "../../contexts/UserContext";

const MenuManagement = () => {
  const { user, loading: userLoading } = useUser();
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load menu items from API
  useEffect(() => {
    // CRITICAL: Wait for user context to finish loading before fetching menu
    if (userLoading) {
      console.log("⏳ Waiting for user context to load...");
      return; // Don't fetch until user data is restored
    }
    fetchMenuItems();
  }, [userLoading]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📥 Fetching menu items from API...");
      const items = await menuApi.getAll(user?.restaurantId);
      console.log("✅ Received items:", items.length);
      setMenuItems(items);
    } catch (error) {
      console.error("❌ Error fetching menu items:", error);
      setError("Failed to load menu items. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: compress a Base64 data URL if needed to be under maxBytes
  const compressDataUrl = (dataUrl, maxBytes = 3 * 1024 * 1024, opts = {}) => {
    const minQuality = opts.minQuality ?? 0.25;
    const stepQuality = opts.stepQuality ?? 0.1;
    const stepDim = opts.stepDim ?? 0.85;
    const minDim = opts.minDim ?? 100;
    const forceToJpeg = opts.forceToJpeg ?? true;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const bytesForDataUrl = (d) =>
          Math.ceil(((d.length - d.indexOf(",") - 1) * 3) / 4);

        if (bytesForDataUrl(dataUrl) <= maxBytes) return resolve(dataUrl);

        const attemptCompress = () => {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // try decreasing quality
          for (let q = 0.9; q >= minQuality; q -= stepQuality) {
            try {
              const attempt = canvas.toDataURL("image/jpeg", q);
              if (bytesForDataUrl(attempt) <= maxBytes) return resolve(attempt);
            } catch (e) {
              // ignore and continue
            }
          }

          // Reduce dimensions and retry
          width = Math.round(width * stepDim);
          height = Math.round(height * stepDim);

          if (width < minDim || height < minDim) {
            return reject(
              new Error(
                "Unable to compress image below target size without severe quality loss",
              ),
            );
          }

          // Loop again
          setTimeout(attemptCompress, 0);
        };

        attemptCompress();
      };
      img.onerror = () =>
        reject(new Error("Failed to read image for compression"));
      img.src = dataUrl;
    });
  };

  // Upload helper: compress if necessary, then upload Base64 to backend /api/upload-image and returns url
  const uploadImageToServer = async (dataUrl) => {
    const serverLimitBytes = 4 * 1024 * 1024; // server binary limit
    const clientTarget = 3 * 1024 * 1024; // aim lower than server limit

    // Get auth token
    const token = localStorage.getItem("token");
    const authHeaders = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Estimate current size (approx)
    const approxBytes = Math.ceil(
      ((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4,
    );

    let payload = dataUrl;

    if (approxBytes > clientTarget) {
      console.log(
        "⚠️ Image larger than target, attempting client-side compression...",
      );
      try {
        payload = await compressDataUrl(dataUrl, clientTarget);
        console.log("🔧 Image compressed to target size");
      } catch (err) {
        console.warn("Compression to target failed:", err);
        // Try a more aggressive compression before giving up
        try {
          payload = await compressDataUrl(dataUrl, 1.2 * 1024 * 1024, {
            minQuality: 0.15,
            stepQuality: 0.05,
            stepDim: 0.8,
          });
          console.log("🔧 Aggressive compression succeeded");
        } catch (err2) {
          throw new Error(
            "Image is too large to upload and could not be compressed adequately. Please choose a smaller image.",
          );
        }
      }
    }

    const res = await fetch(`${API_BASE}/api/upload-image`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ imageBase64: payload }),
    });

    if (!res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch (e) {}

      if (res.status === 413) {
        // Server refused despite compression — try a final aggressive compress+retry
        console.warn("Server returned 413; trying an aggressive retry...");
        try {
          const aggressive = await compressDataUrl(dataUrl, 1.0 * 1024 * 1024, {
            minQuality: 0.12,
            stepQuality: 0.05,
            stepDim: 0.75,
          });
          const retry = await fetch(`${API_BASE}/api/upload-image`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ imageBase64: aggressive }),
          });

          if (!retry.ok) {
            let rbody = null;
            try {
              rbody = await retry.json();
            } catch (e) {}
            if (retry.status === 413) {
              throw new Error(
                "Image rejected by server: file too large (server limit is 4MB). Try a smaller image or use a sample image.",
              );
            }
            throw new Error(
              (rbody && rbody.message) || `Upload failed: ${retry.status}`,
            );
          }

          const json = await retry.json();
          return json.url;
        } catch (err) {
          throw err;
        }
      }

      throw new Error((body && body.message) || `Upload failed: ${res.status}`);
    }

    const json = await res.json();
    return json.url;
  };

  const handleAddItem = async (newItem) => {
    try {
      console.log("📤 Adding new item:", newItem);
      console.log("📤 Varieties from form:", newItem.options); // Add this!

      // Map category names to singular values (match Menu.jsx expectations)
      const categoryMap = {
        appetizers: "appetizer",
        mains: "main",
        desserts: "dessert",
        beverages: "beverage",
      };

      // Use FIRST variety's price as the main price
      const firstVarietyPrice =
        newItem.options && newItem.options.length > 0
          ? newItem.options[0].price
          : newItem.price;

      // If image is a Base64 data URL, upload it to the server first
      let imageUrl = newItem.image || null;
      if (imageUrl && imageUrl.startsWith("data:image")) {
        try {
          imageUrl = await uploadImageToServer(imageUrl);
          console.log("📤 Uploaded image to:", imageUrl);
        } catch (err) {
          console.error("❌ Image upload failed:", err);
          alert("❌ Image upload failed: " + err.message);
          return;
        }
      }

      const itemForApi = {
        name: newItem.name,
        description: newItem.description,
        price: firstVarietyPrice, // Use variety price, not form price
        category: categoryMap[newItem.category] || newItem.category,
        image_url: imageUrl,
        available: 1,
        discount: 0,
        options: newItem.options || [], // send as array; backend will stringify
        restaurant_id: user?.restaurantId,
      };

      console.log("📦 Sending to API:", itemForApi);

      const response = await menuApi.create(itemForApi);
      console.log("✅ Item created:", response);

      // Refresh the list
      await fetchMenuItems();
      // Notify other parts of the app (e.g., Menu page) that items changed
      window.dispatchEvent(new Event("menu-updated"));
      setShowForm(false);
      alert("✅ Item added successfully!");
    } catch (error) {
      console.error("❌ Error adding item:", error);
      
      // Show more helpful error message
      let errorMessage = "Failed to add item";
      if (error.message.includes("Validation failed")) {
        errorMessage = "Please check your input:\n- Name must be 2-100 characters\n- Description must be at least 5 characters\n- All variety prices must be valid numbers";
      } else {
        errorMessage = error.message;
      }
      
      alert("❌ " + errorMessage);
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      console.log("📝 Updating item ID:", updatedItem.id, "Data:", updatedItem);

      // Map category names
      const categoryMap = {
        appetizers: "appetizer",
        mains: "main",
        desserts: "dessert",
        beverages: "beverage",
      };

      // If image is Base64, upload first
      let imageUrl = updatedItem.image || null;
      if (imageUrl && imageUrl.startsWith("data:image")) {
        try {
          imageUrl = await uploadImageToServer(imageUrl);
          console.log("📤 Uploaded image to:", imageUrl);
        } catch (err) {
          console.error("❌ Image upload failed:", err);
          alert("❌ Image upload failed: " + err.message);
          return;
        }
      }

      const itemForApi = {
        name: updatedItem.name,
        description: updatedItem.description,
        price: updatedItem.price,
        category: categoryMap[updatedItem.category] || updatedItem.category,
        image_url: imageUrl,
        available: 1,
        discount: 0,
        options: updatedItem.options || [],
        restaurant_id: user?.restaurantId,
      };

      console.log("📦 Sending update to API:", itemForApi);

      await menuApi.update(updatedItem.id, itemForApi);

      // Refresh the list
      await fetchMenuItems();
      // Notify other parts of the app
      window.dispatchEvent(new Event("menu-updated"));
      setEditingItem(null);
      setShowForm(false);
      alert("✅ Item updated successfully!");
    } catch (error) {
      console.error("❌ Error updating item:", error);
      
      // Show more helpful error message
      let errorMessage = "Failed to update item";
      if (error.message.includes("Validation failed")) {
        errorMessage = "Please check your input:\n- Name must be 2-100 characters\n- Description must be at least 5 characters\n- All variety prices must be valid numbers";
      } else {
        errorMessage = error.message;
      }
      
      alert("❌ " + errorMessage);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting item ID:", id);
      await menuApi.delete(id, user?.restaurantId);

      // Refresh the list
      await fetchMenuItems();
      // Notify other parts of the app
      window.dispatchEvent(new Event("menu-updated"));
      alert("✅ Item deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting item:", error);
      alert("❌ Failed to delete item: " + error.message);
    }
  };

  const handleEditItem = (item) => {
    console.log("✏️ Editing item:", item);
    setEditingItem(item);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading menu items from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3">
        <h4>Error Loading Menu</h4>
        <p>{error}</p>
        <button className="btn btn-warning" onClick={fetchMenuItems}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="menu-management">
      <div className="menu-header">
        <div>
          <h2>🍽️ Menu Items Management</h2>
          <p className="text-muted">
            Connected to Database • Total Items: {menuItems.length}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={fetchMenuItems}
            title="Refresh from database"
          >
            🔄 Refresh
          </button>
          <button
            className="add-btn"
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
          >
            <span>+</span> Add New Item
          </button>
        </div>
      </div>

      <MenuItemList
        items={menuItems}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      {showForm && (
        <MenuItemForm
          item={editingItem}
          onSave={editingItem ? handleUpdateItem : handleAddItem}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default MenuManagement;
