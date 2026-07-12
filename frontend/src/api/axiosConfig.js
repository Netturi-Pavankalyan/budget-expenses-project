import axios from 'axios';

const API = axios.create({
  baseURL: 'https://budget-expenses-project-5s9g.onrender.com',
});

// Automatically attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;