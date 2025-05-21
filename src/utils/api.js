import axios from 'axios';

// Δυναμική επιλογή baseURL ανάλογα με το περιβάλλον
// Τοπικά: http://localhost:5000/
// Σε Docker: σχετικό URL που θα επιλυθεί μέσω Nginx
let baseURL = process.env.REACT_APP_API_URL;

// Αν δεν έχει οριστεί το REACT_APP_API_URL 
if (!baseURL) {
  // Έλεγχος αν τρέχει σε περιβάλλον παραγωγής (Docker) ή ανάπτυξης (τοπικά)
  baseURL = process.env.NODE_ENV === 'production' ? '/api/' : 'http://localhost:10000/';
}

console.log('API Base URL:', baseURL);

// Δημιουργία interceptor για αυτόματη διαχείριση σφαλμάτων δικτύου
const api = axios.create({
  baseURL: baseURL,
});

// Προσθήκη interceptor για εύκολη αποσφαλμάτωση
api.interceptors.request.use(config => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

export default api;