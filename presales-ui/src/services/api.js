import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add user ID header
api.interceptors.request.use(
  (config) => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.email) {
          // Use email as the user identifier
          config.headers['user-id'] = user.email;
          console.log('✓ Added user-id header:', user.email);
        }
      }
    } catch (error) {
      console.error('✗ Error parsing user from sessionStorage:', error);
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
      
      // If 401 or 403, clear session and redirect to login
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('✗ Authentication failed - clearing session');
        sessionStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } else if (error.request) {
      error.message = 'No response from server. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  googleAuth: (token) => {
    console.log('Google auth request');
    return api.post('/auth/google', { token });
  },
};

// User Management Services
export const userService = {
  getAll: () => {
    console.log('Getting all users');
    return api.get('/users/');
  },
  add: (userData) => {
    console.log('Adding user:', userData);
    return api.post('/users/', userData);
  },
  updateRole: (userId, role) => {
    console.log('Updating user role:', userId, role);
    return api.put('/users/role', { user_id: userId, role });
  },
  delete: (userId) => {
    console.log('Deleting user:', userId);
    return api.delete(`/users/${userId}`);
  },
};

// Opportunity Services
export const opportunityService = {
  getAll: () => {
    console.log('Getting all opportunities');
    return api.get('/opportunities/');
  },
  getById: (id) => {
    console.log('Getting opportunity:', id);
    return api.get(`/opportunities/${id}`);
  },
  create: (data) => {
    console.log('Creating opportunity with data:', data);
    return api.post('/opportunities/', data);
  },
  update: (id, data) => {
    console.log('Updating opportunity', id, 'with data:', data);
    return api.put(`/opportunities/${id}`, data);
  },
  delete: (id) => {
    console.log('Deleting opportunity:', id);
    return api.delete(`/opportunities/${id}`);
  },
};

export default api;