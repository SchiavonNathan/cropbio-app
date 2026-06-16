import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const TOKEN_KEY = '@app-cavazin:token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15_000, // 15 seconds — prevents requests from hanging indefinitely
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from sessionStorage on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — force logout
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
