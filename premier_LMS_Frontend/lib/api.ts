import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || '';
      if (
        message.includes('Session expired') ||
        message.includes('logged in from another device')
      ) {
        Cookies.remove('accessToken');
        Cookies.remove('user');
        localStorage.removeItem('premier_user');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?reason=session_expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
