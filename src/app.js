import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Home from "./pages/home";
import Epafes from "./pages/epafes";
import Eksormiseis from "./pages/eksormiseis";
import Eksoplismos from "./pages/eksoplismos";
import Katafigio from "./pages/katafigio";
import Sxoles from "./pages/sxoles";
import Athlites from "./pages/athlites";
import Meloi from "./pages/melitousillogou";
import MeloiAllwn from "./pages/meliallwnsillogwn";
import Login from "./pages/Login";
import SchoolDetails from "./pages/SchoolDetails";
import EksormisiDetails from "./pages/EksormisiDetails";
import AdminPage from "./pages/admin"; 
import { initAuth, isAuthenticated, isAdmin } from "./utils/auth";
import UserManagement from "./components/UserManagement"; // Θα δημιουργήσουμε αυτό το component

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [checking, setChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Έλεγχος αυθεντικοποίησης
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuth(false);
          setChecking(false);
          return;
        }
        
        // Έλεγχος δεδομένων χρήστη
        const userStr = localStorage.getItem('user');
        let user = null;
        
        if (userStr) {
          user = JSON.parse(userStr);
          console.log("User data in ProtectedRoute:", user);
        }
        
        // Ενημέρωση καταστάσεων
        setIsAuth(!!user);
        setIsAdminUser(user?.role === 'admin');
        
        // Αναλυτική καταγραφή
        console.log(`Authentication: ${!!user}, Admin: ${user?.role === 'admin'}`);
      } catch (e) {
        console.error("Error in authentication check:", e);
        setIsAuth(false);
        setIsAdminUser(false);
      }
      
      setChecking(false);
    };
    
    checkAuth();
  }, []);
  
  if (checking) {
    return <div>Έλεγχος πιστοποίησης...</div>;
  }
  
  if (!isAuth) {
    console.log("Redirecting to login - not authenticated");
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdminUser) {
    console.log("Redirecting to home - not admin");
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    console.log("Checking authentication state on app load");
    
    // Αρχικοποίηση του auth
    initAuth();
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("User loaded from localStorage:", parsedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } else {
      console.log("No user found in localStorage");
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="App">
      <Routes>
        {/* Δημόσιες διαδρομές */}
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/" /> : <Login setUser={setUser} />
        } />
        
        {/* Προστατευμένες διαδρομές */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Home user={user} /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/epafes" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Epafes /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/eksormiseis" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Eksormiseis /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/eksoplismos" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Eksoplismos /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/katafigio" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Katafigio /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/sxoles" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Sxoles /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/athlites" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Athlites /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/melitousillogou" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><Meloi /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/meliallwnsillogwn" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><MeloiAllwn /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Σελίδες λεπτομερειών */}
        <Route path="/sxoles/:id" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><SchoolDetails /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/eksormiseis/:eksormisiId" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><EksormisiDetails /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/eksormisi/:id" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}><EksormisiDetails /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Σελίδα διαχειριστή, διαθέσιμη μόνο για τον admin */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <Layout user={user} onLogout={handleLogout}><AdminPage /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Ανακατεύθυνση σε αρχική σελίδα αν η διαδρομή δεν υπάρχει */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;