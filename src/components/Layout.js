import React, { useEffect } from "react";
import { Box, Toolbar, Breadcrumbs, Link, Typography } from "@mui/material";
import { useLocation, Link as RouterLink } from "react-router-dom";
import Navbar from "./navbar";
import "../pages/App.css";

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Εκκαθάριση τυχόν προβληματικών effects κατά την αλλαγή σελίδας
  useEffect(() => {
    return () => {
      // Force cleanup of any pending state updates
      let id = window.setTimeout(() => {}, 0);  // Αλλαγή από const σε let
      while (id--) {
        window.clearTimeout(id);
      }
    };
  }, [location.pathname]);

  return (
    <Box sx={{ display: "flex" }} role="main">
      <Navbar user={user} onLogout={onLogout} />
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
        <Box sx={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Εμφάνιση breadcrumbs μόνο αν δεν είμαστε στην αρχική σελίδα */}
          {location.pathname !== "/" && (
            <Breadcrumbs aria-label="breadcrumb" sx={{ marginBottom: 2 }}>
              <Link underline="hover" color="inherit" component={RouterLink} to="/">
                Αρχική
              </Link>
              {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join("/")}`;

                return last ? (
                  <Typography key={to} sx={{ color: "text.primary" }}>
                    {decodeURIComponent(value)}
                  </Typography>
                ) : (
                  <Link underline="hover" color="inherit" component={RouterLink} to={to} key={to}>
                    {decodeURIComponent(value)}
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