// Centralized API configuration
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost";

// API endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  GOOGLE_AUTH: '/api/auth/google',
  
  // Menu Items
  MENU_ITEMS: '/api/menu-items',
  MENU_ITEM_BY_ID: (id) => `/api/menu-items/${id}`,
  MENU_ITEMS_BY_CATEGORY: (category) => `/api/menu-items/category/${category}`,
  
  // Orders
  ORDERS: '/api/orders',
  ORDER_ITEMS: (id) => `/api/orders/${id}/items`,
  
  // Owner Dashboard
  OWNER_REVENUE: '/api/owner/revenue',
  OWNER_TODAY_STATS: '/api/owner/today-stats',
  OWNER_POPULAR_ITEMS: '/api/owner/popular-items',
  OWNER_CUSTOMER_FAVORITES: '/api/owner/customer-favorites',
  
  // Restaurants
  RESTAURANTS: '/api/restaurants',
  
  // Upload
  UPLOAD_IMAGE: '/api/upload-image'
};
