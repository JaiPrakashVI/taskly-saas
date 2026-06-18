import axios from 'axios';

// Resolve backend url, default to local port 5000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token dynamically to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskly_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to intercept failures, such as session expirations
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns 401 Unauthorized, clean up local credentials and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('taskly_token');
      localStorage.removeItem('taskly_user');
      
      // If we are not already on the login or register page, redirect to login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
