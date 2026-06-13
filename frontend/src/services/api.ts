import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // Backend NestJS default port
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@app-cavazin:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
