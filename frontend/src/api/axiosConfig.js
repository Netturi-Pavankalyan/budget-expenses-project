import axios from 'axios';

// Uses VITE_API_URL from .env / .env.local when present, otherwise falls
// back to the deployed backend. Set VITE_API_URL=http://localhost:8000
// in frontend/.env.local to point the app at a locally-running backend.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://budget-expenses-project-5s9g.onrender.com',
});

// Automatically attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is missing/expired/invalid, clear it and bounce to login
// instead of leaving pages silently stuck with stale/empty data.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default API;