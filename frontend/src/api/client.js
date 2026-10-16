import axios from 'axios';

// Uses relative path so frontend acts as unified gateway for any IP, domain, or device
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Pre-configured Axios instance for all API requests.
 * - Base URL is read from `VITE_API_URL` env variable (falls back to `http://localhost:5000`).
 * - Automatically attaches the JWT bearer token from `localStorage` on every request.
 * - On a 401 response, clears all stored tokens so the user is treated as logged out.
 *
 * @type {import('axios').AxiosInstance}
 */
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor — injects the stored JWT token as a Bearer header.
 */
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ev_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — clears token storage when the server returns 401 Unauthorized.
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ev_token');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default client;
