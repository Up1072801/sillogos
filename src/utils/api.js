import axios from 'axios';

// Create axios instance with appropriate base URL
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://sillogos.onrender.com' 
    : '',
  withCredentials: true
});

// Add request interceptor to consistently format API URLs
api.interceptors.request.use(config => {
  // In production, ensure all requests use the /api/ prefix
  if (process.env.NODE_ENV === 'production') {
    // Don't add /api/ if it's already there
    if (!config.url.startsWith('/api/')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
  }
  return config;
});

export default api;