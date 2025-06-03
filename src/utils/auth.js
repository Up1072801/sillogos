import api from './api';

// Αποθήκευση token στο localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Έλεγχος αν ο χρήστης είναι συνδεδεμένος
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Λήψη στοιχείων συνδεδεμένου χρήστη
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

// Έλεγχος αν ο χρήστης είναι διαχειριστής
export const isAdmin = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    
    return user && user.role === 'admin';
  } catch (e) {
    console.error("Error in isAdmin check:", e);
    return false;
  }
};

// Αρχικοποίηση του API με το token αν υπάρχει
export const initAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  }
  return false;
};