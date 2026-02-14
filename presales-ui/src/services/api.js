import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://presales-backend-455538062800.us-central1.run.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('flux_token');
      
      if (token) {
        // Add Authorization header with Bearer token
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errorMessage = error.response.data?.detail 
        || error.response.data?.message 
        || `Server error: ${error.response.status}`;
      
      error.message = errorMessage;
      
      // Handle authentication errors (401 = unauthorized, token expired/invalid)
      if (error.response.status === 401) {
        console.log('🔒 Token expired or invalid - logging out');
        
        // Clear all session data
        localStorage.removeItem('flux_token');
        localStorage.removeItem('flux_user'); // Changed from sessionStorage to localStorage
        localStorage.removeItem('lastActivity');
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
      
      // Handle authorization errors (403 = forbidden)
      if (error.response.status === 403) {
        error.message = 'You do not have permission to perform this action.';
      }
    } else if (error.request) {
      error.message = 'Unable to connect to server. Please check your connection.';
    } else {
      error.message = 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  /**
   * Authenticate with Google OAuth
   * @param {string} token - Google OAuth token
   * @returns {Promise} - Response with user data and JWT token
   */
  googleAuth: async (token) => {
    const response = await axios.post(`${API_BASE_URL}/auth/google`, { token });
    
    // Store JWT token and user data
    if (response.data.token) {
      console.log('🔑 Storing JWT token');
      localStorage.setItem('flux_token', response.data.token);
    }
    
    if (response.data.user) {
      console.log('👤 Storing user data');
      localStorage.setItem('flux_user', JSON.stringify(response.data.user)); // Changed from sessionStorage to localStorage
    }
    
    return response;
  },
  
  /**
   * Verify if current JWT token is valid
   * @returns {Promise} - Response with user data if valid
   */
  verifyToken: async () => {
    return await api.get('/auth/verify');
  },
  
  /**
   * Logout - clear all tokens and session data
   */
  logout: () => {
    console.log('👋 Clearing all session data');
    localStorage.removeItem('flux_token');
    localStorage.removeItem('flux_user'); // Changed from sessionStorage to localStorage
    localStorage.removeItem('lastActivity');
    
    // Broadcast logout to other tabs
    localStorage.setItem('logout-event', Date.now().toString());
  }
};

// User Management Services
export const userService = {
  getAll: () => api.get('/users/'),
  add: (userData) => api.post('/users/', userData),
  updateRole: (userId, role) => api.put('/users/role', { user_id: userId, role }),
  delete: (userId) => api.delete(`/users/${userId}`),
};

// Opportunity Services
export const opportunityService = {
  getAll: () => api.get('/opportunities/'),
  getById: (id) => api.get(`/opportunities/${id}`),
  create: (data) => api.post('/opportunities/', data),
  update: (id, data) => api.put(`/opportunities/${id}`, data),
  delete: (id) => api.delete(`/opportunities/${id}`),
};

export default api;