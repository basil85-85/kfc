import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kfc_token');
  if (token && config.headers) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Network / Server Unreachable Error (no HTTP response received)
    if (!error.response) {
      error.formattedMessage = "Can't reach the server, check your connection.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.message || data?.error || 'An unexpected error occurred.';
    error.formattedMessage = message;
    error.fieldErrors = data?.errors || null;

    // 2. Handle 401 Unauthorized / Token Expiration
    if (status === 401) {
      localStorage.removeItem('kfc_token');
      localStorage.removeItem('kfc_user');

      // Dispatch session expired event so main app or AuthContext can trigger toast & redirect cleanly
      window.dispatchEvent(new CustomEvent('kfc_session_expired', { detail: { message } }));
    }

    return Promise.reject(error);
  }
);

export default api;
