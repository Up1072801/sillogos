import React from "react";
import { Box, Toolbar, Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import Navbar from "./navbar";

const drawerWidth = 240;

const Layout = ({ children }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: `${drawerWidth}px`, // Προσθήκη του πλάτους του Drawer
          width: `calc(100% - ${drawerWidth}px)`, // Προσαρμογή του πλάτους
          overflowX: "hidden", // Αποφυγή οριζόντιας κύλισης
        }}
      >
        <Toolbar />
        <Breadcrumbs aria-label="breadcrumb" sx={{ marginBottom: 2 }}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/">
            Αρχική
          </Link>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join("/")}`;

            return last ? (
              <Typography color="text.primary" key={to}>
                {value}
              </Typography>
            ) : (
              <Link underline="hover" color="inherit" component={RouterLink} to={to} key={to}>
                {value}
              </Link>
            );
          })}
        </Breadcrumbs>
        <Box sx={{ width: "100%", maxWidth: "1200px" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;