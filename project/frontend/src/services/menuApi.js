import { API_BASE } from '../config/api';

// Helper to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export const menuApi = {
  async getAll(restaurantId = null) {
    const url = restaurantId
      ? `${API_BASE}/api/menu-items?restaurantId=${restaurantId}`
      : `${API_BASE}/api/menu-items`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  async getById(id) {
    const response = await fetch(`${API_BASE}/api/menu-items/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  async create(itemData) {
    console.log('🔍 Creating menu item with data:', itemData);
    const response = await fetch(`${API_BASE}/api/menu-items`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Create failed:', response.status, errorData);
      if (errorData.errors) {
        console.error('❌ Validation errors:', errorData.errors);
      }
      throw new Error(`HTTP error! status: ${response.status}${errorData.message ? ' - ' + errorData.message : ''}`);
    }
    return await response.json();
  },

  async update(id, itemData) {
    console.log('🔍 Updating menu item:', id, 'with data:', itemData);
    const response = await fetch(`${API_BASE}/api/menu-items/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Update failed:', response.status, errorData);
      if (errorData.errors) {
        console.error('❌ Validation errors:', errorData.errors);
      }
      throw new Error(`HTTP error! status: ${response.status}${errorData.message ? ' - ' + errorData.message : ''}`);
    }
    return await response.json();
  },

  // FIX THIS:
  async delete(id, restaurantId) {
    const response = await fetch(`${API_BASE}/api/menu-items/${id}`, {
      // ADD /api/
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ restaurant_id: restaurantId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  async getByCategory(category) {
    const response = await fetch(
      `${API_BASE}/api/menu-items/category/${category}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },
};
