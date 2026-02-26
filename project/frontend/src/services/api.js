// Centralized API utility for authenticated requests
import { API_BASE } from '../config/api';
import { 
  isRateLimitError, 
  handleRateLimitError 
} from '../utils/rateLimitHandler';

// Helper to get auth headers
export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Generic fetch wrapper with auth and rate limit handling
export async function fetchWithAuth(url, options = {}) {
  const endpoint = url.split('?')[0]; // Get base endpoint for rate limit tracking
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  // Handle 429 - rate limit exceeded
  if (response.status === 429) {
    const error = await response.json().catch(() => ({ 
      message: "Too many requests. Please try again later." 
    }));
    
    const rateLimitInfo = handleRateLimitError(error, endpoint);
    
    const rateLimitError = new Error(rateLimitInfo.message);
    rateLimitError.status = 429;
    rateLimitError.retryAfter = rateLimitInfo.retryAfter;
    rateLimitError.isRateLimit = true;
    throw rateLimitError;
  }

  // Handle 401 - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Order API
export const orderApi = {
  async create(orderData) {
    return fetchWithAuth("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  async getAll() {
    return fetchWithAuth("/api/orders");
  },

  async getOrderItems(orderId) {
    return fetchWithAuth(`/api/orders/${orderId}/items`);
  },
};

// Owner Dashboard API
export const ownerApi = {
  async getRevenue() {
    return fetchWithAuth("/api/owner/revenue");
  },

  async getTodayStats() {
    return fetchWithAuth("/api/owner/today-stats");
  },

  async getPopularItems() {
    return fetchWithAuth("/api/owner/popular-items");
  },

  async getCustomerFavorites() {
    return fetchWithAuth("/api/owner/customer-favorites");
  },
};

// Image upload API
export const uploadApi = {
  async uploadImage(imageBase64, filename) {
    return fetchWithAuth("/api/upload-image", {
      method: "POST",
      body: JSON.stringify({ imageBase64, filename }),
    });
  },
};
