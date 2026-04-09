import axios from 'axios';
import { useUserStore } from '../store/userStore';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 15000,
  withCredentials: true,
});

// Request Interceptor: Attach JWT token if present
api.interceptors.request.use((config) => {
  const token = useUserStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and force re-login if token expired
      console.warn("Unauthorized: Clearing token");
      useUserStore.getState().logout();
      
      // Optionally redirect to login, but only on the client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
