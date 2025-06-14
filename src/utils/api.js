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

// Προσθήκη interceptor για εύκολη αποσφαλμάτωση
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Εμφάνιση μόνο των πρώτων χαρακτήρων του token για λόγους ασφάλειας
    const tokenPreview = token.substring(0, 10) + '...';
  } else {
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