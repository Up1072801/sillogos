import React, { useEffect, useState } from "react";
import { Box, Toolbar, Breadcrumbs, Link, Typography, Button, Chip, Tooltip } from "@mui/material";
import { useLocation, Link as RouterLink, useParams } from "react-router-dom";
import RefreshIcon from '@mui/icons-material/Refresh';
import Navbar from "./navbar";
import "../pages/App.css";
import api from "../utils/api";

// Αντιστοίχιση διαδρομών με ελληνικά ονόματα μενού
const routeNameMap = {
  "": "Αρχική",
  "melitousillogou": "Μέλη του συλλόγου",
  "athlites": "Αθλητές",
  "meliallwnsillogwn": "Μέλη άλλων συλλόγων",
  "epafes": "Επαφές",
  "eksormiseis": "Εξορμήσεις",
  "eksoplismos": "Εξοπλισμός",
  "katafigio": "Καταφύγιο",
  "sxoles": "Σχολές",
  "admin": "Διαχειριστής",
  "eksormisi": "Εξορμήσεις", // Changed to be more descriptive
  "drastiriotita": "Δραστηριότητα"
};

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const [tokenStatus, setTokenStatus] = useState("active");
  const [refreshing, setRefreshing] = useState(false);
  const [expeditionData, setExpeditionData] = useState({});
  const [schoolData, setSchoolData] = useState({}); // New state for school data

  // Load expedition details for breadcrumbs when needed
  useEffect(() => {
    const fetchExpeditionData = async () => {
      // Check if we're on an expedition details page (URL like /eksormisi/123)
      if (pathnames.length >= 2 && pathnames[0] === 'eksormisi' && !isNaN(pathnames[1])) {
        try {
          const id = pathnames[1];
          const response = await api.get(`/eksormiseis/${id}`);
          setExpeditionData(prev => ({ 
            ...prev, 
            [id]: response.data 
          }));
        } catch (error) {
          console.error("Error fetching expedition data for breadcrumbs:", error);
        }
      }
    };
    
    fetchExpeditionData();
  }, [location.pathname]);

  // New useEffect to fetch school data when needed
  useEffect(() => {
    const fetchSchoolData = async () => {
      // Check if we're on a school details page (URL like /sxoles/123)
      if (pathnames.length >= 2 && pathnames[0] === 'sxoles' && !isNaN(pathnames[1])) {
        try {
          const id = pathnames[1];
          const response = await api.get(`/sxoles/${id}`);
          setSchoolData(prev => ({ 
            ...prev, 
            [id]: response.data 
          }));
        } catch (error) {
          console.error("Error fetching school data for breadcrumbs:", error);
        }
      }
    };
    
    fetchSchoolData();
  }, [location.pathname]);

  // Έλεγχος κατάστασης token κάθε 30 δευτερόλεπτα
  useEffect(() => {
    const checkTokenStatus = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setTokenStatus("missing");
        return;
      }
      
      try {
        // Απλός έλεγχος για τη λήξη του token (προαιρετικό αν το token έχει expiry)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // μετατροπή σε ms
        const now = Date.now();
        
        if (expiry < now) {
          setTokenStatus("expired");
          // Προσθέστε αυτή τη γραμμή για αυτόματη αποσύνδεση
          onLogout(); // Αυτόματη αποσύνδεση όταν το token λήξει
        } else if (expiry - now < 300000) { // Λιγότερο από 5 λεπτά
          setTokenStatus("expiring");
        } else {
          setTokenStatus("active");
        }
      } catch (err) {
        setTokenStatus("invalid");
        console.error("Error checking token:", err);
      }
    };

    checkTokenStatus();
    const interval = setInterval(checkTokenStatus, 30000); // Έλεγχος κάθε 30 δευτερόλεπτα
    
    return () => clearInterval(interval);
  }, []);

  // Εκκαθάριση τυχόν προβληματικών effects κατά την αλλαγή σελίδας
  useEffect(() => {
    return () => {
      // Force cleanup of any pending state updates
      let id = window.setTimeout(() => {}, 0);
      while (id--) {
        window.clearTimeout(id);
      }
    };
  }, [location.pathname]);

  // Ανανέωση του token
  const refreshToken = async () => {
    try {
      setRefreshing(true);
      // Διόρθωση του endpoint path - προσθήκη του /api prefix
      const response = await api.post('/auth/refresh-token');
      
      if (response.data && response.data.token) {
        // Αποθήκευση νέου token
        localStorage.setItem('token', response.data.token);
        // Ενημέρωση token στον api client
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setTokenStatus("active");
        
        // Διαγραφή και επανατοποθέτηση για να διασφαλίσουμε την ανανέωση
        const tokenCopy = response.data.token;
        localStorage.removeItem('token');
        setTimeout(() => {
          localStorage.setItem('token', tokenCopy);
        }, 50);
        
        
        // Επιστροφή του token για χρήση από άλλες λειτουργίες
        return response.data.token;
      } else {
        console.error("Η απάντηση δεν περιέχει νέο token:", response.data);
        setTokenStatus("error");
        return null;
      }
    } catch (error) {
      console.error("Σφάλμα κατά την ανανέωση του token:", error);
      
      // Λεπτομερής καταγραφή του σφάλματος για αποσφαλμάτωση
      if (error.response) {
        console.error("Απάντηση από server:", error.response.data);
        console.error("Κωδικός HTTP:", error.response.status);
      } else if (error.request) {
        console.error("Δεν υπήρξε απάντηση από τον server:", error.request);
      } else {
        console.error("Σφάλμα κατά την προετοιμασία του αιτήματος:", error.message);
      }
      
      // Έλεγχος αν η απάντηση περιέχει οδηγία για αποσύνδεση
      if (error.response && error.response.data && error.response.data.action === "logout") {
        // Καλούμε τη συνάρτηση αποσύνδεσης
        onLogout();
        return null;
      }
      
      setTokenStatus("error");
      return null;
    } finally {
      setRefreshing(false); // Ensure refreshing is set to false here
    }
  };

  const getTokenStatusColor = () => {
    switch(tokenStatus) {
      case "active": return "success";
      case "expiring": return "warning";
      case "expired": case "missing": case "invalid": case "error": return "error";
      default: return "default";
    }
  };

  const getTokenStatusText = () => {
    switch(tokenStatus) {
      case "active": return "Ενεργή σύνδεση";
      case "expiring": return "Η σύνδεση λήγει σύντομα";
      case "expired": return "Η σύνδεση έληξε";
      case "missing": return "Δεν υπάρχει σύνδεση";
      case "invalid": return "Μη έγκυρη σύνδεση";
      case "error": return "Σφάλμα σύνδεσης";
      default: return "Άγνωστη κατάσταση";
    }
  };

  return (
    <Box sx={{ display: "flex" }} role="main">
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        tokenStatus={tokenStatus}
        refreshing={refreshing}
        refreshToken={refreshToken}
        getTokenStatusColor={getTokenStatusColor}
        getTokenStatusText={getTokenStatusText}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          overflowX: "hidden",
        }}
      >
        <Toolbar /> {/* Χώρος για το Navbar */}
        
        {/* Μετακινήθηκε στο Navbar component για καλύτερη εμφάνιση */}

        <Box sx={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Εμφάνιση breadcrumbs μόνο αν δεν είμαστε στην αρχική σελίδα */}
          {location.pathname !== "/" && (
            <Breadcrumbs 
              aria-label="breadcrumb" 
              sx={{ 
                marginBottom: 2,
                display: "flex",
                justifyContent: "center",
                width: "100%"
              }}
            >
              <Link underline="hover" color="inherit" component={RouterLink} to="/">
                {routeNameMap[""]}
              </Link>
              {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                
                // Special handling for expedition details
                let name = routeNameMap[value] || decodeURIComponent(value);
                let linkTo = to;
                
                // Fix the link for "Εξόρμηση" to point to the expeditions list
                if (value === 'eksormisi') {
                  linkTo = '/eksormiseis'; // Always link to the expeditions list
                }
                
                // Show destination for expedition IDs
                if (pathnames[0] === 'eksormisi' && index === 1 && !isNaN(value)) {
                  const expedition = expeditionData[value];
                  if (expedition) {
                    name = expedition.proorismos || expedition.titlos || `Εξόρμηση #${value}`;
                  } else {
                    name = `Εξόρμηση #${value}`;
                  }
                }

                // Show formatted name for school IDs
                if (pathnames[0] === 'sxoles' && index === 1 && !isNaN(value)) {
                  const school = schoolData[value];
                  if (school) {
                    name = `${school.klados || ''} ${school.epipedo || ''}${school.etos ? `(${school.etos})` : ''}`.trim() || `Σχολή #${value}`;
                  } else {
                    name = `Σχολή #${value}`;
                  }
                }

                return last ? (
                  <Typography key={to} sx={{ color: "text.primary" }}>
                    {name}
                  </Typography>
                ) : (
                  <Link underline="hover" color="inherit" component={RouterLink} to={linkTo} key={to}>
                    {name}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;