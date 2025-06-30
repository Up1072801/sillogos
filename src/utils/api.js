import axios from 'axios';

// Δυναμική επιλογή baseURL ανάλογα με το περιβάλλον
// Τοπικά: http://localhost:5000/
// Σε Docker: σχετικό URL που θα επιλυθεί μέσω Nginx
let baseURL = process.env.REACT_APP_API_URL;

// Αν δεν έχει οριστεί το REACT_APP_API_URL 
if (!baseURL) {
  // Έλεγχος αν τρέχει σε περιβάλλον παραγωγής (Docker) ή ανάπτυξης (τοπικά)
  baseURL = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:10000/';
}


// Δημιουργία interceptor για αυτόματη διαχείριση σφαλμάτων δικτύου
const api = axios.create({
  baseURL: baseURL,
});

// Προσθήκη interceptor για εύκολη αποσφαλμάτωση και διαχείριση API prefix
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // IMPROVED PREFIX HANDLING: Consistently checks if the URL needs API prefix in production
  if (process.env.NODE_ENV === 'production') {
    // Check if this is already prefixed
    if (!config.url.startsWith('/api/')) {
      // Skip prefixing only for auth endpoints and static assets
      if (!config.url.includes('.') && !config.url.startsWith('/auth/')) {
        // Preserve any query params by splitting the URL
        const urlParts = config.url.split('?');
        const baseEndpoint = urlParts[0];
        const queryParams = urlParts.length > 1 ? `?${urlParts[1]}` : '';
        
        // Make sure we have a leading slash
        const normalizedEndpoint = baseEndpoint.startsWith('/') ? baseEndpoint : `/${baseEndpoint}`;
        
        // Apply the /api prefix to the base endpoint
        config.url = `/api${normalizedEndpoint}${queryParams}`;
        
        console.log(`[API] Prefixed URL: ${config.url}`);
      }
    }
  }
  
  return config;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Interceptor για απάντηση σε σφάλματα αυθεντικοποίησης
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Έλεγχος για unauthorized (401) ή forbidden (403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Αν δεν είμαστε στη σελίδα login, ανακατευθύνουμε τον χρήστη εκεί
      if (window.location.pathname !== '/login') {
        
        // Καθαρισμός των αποθηκευμένων τιμών
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Ανακατεύθυνση στο login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;