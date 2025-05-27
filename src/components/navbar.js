import React, { useState, useEffect } from "react";
import { styled, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Box,
  Drawer,
  CssBaseline,
  AppBar as MuiAppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  ExpandLess,
  ExpandMore,
  Home as HomeIcon,
  DirectionsWalk as HikeIcon,
  Inventory as EquipmentIcon,
  Cabin as CabinIcon,
  School as SchoolIcon,
  Person as MemberIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  LockReset as LockResetIcon,
  AccountCircle
} from "@mui/icons-material";
import { useCallback } from "react";

const drawerWidth = 240;

// Δημιουργούμε ένα custom hook για να παρακολουθούμε το zoom level
const useZoomLevel = () => {
  const [zoomLevel, setZoomLevel] = useState(
    Math.round((window.outerWidth / window.innerWidth) * 100)
  );

  useEffect(() => {
    const handleResize = () => {
      const newZoomLevel = Math.round((window.outerWidth / window.innerWidth) * 100);
      setZoomLevel(newZoomLevel);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return zoomLevel;
};

const AppBar = styled(MuiAppBar, { 
  shouldForwardProp: (prop) => prop !== "open" && prop !== "isSmallScreen"
})(
  ({ theme, open, isSmallScreen }) => ({
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && !isSmallScreen && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  })
);

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open, isSmallScreen }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    ...(open && !isSmallScreen && {
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  })
);

export default function Navbar({ user, onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [membersOpen, setMembersOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Συνδυάζουμε media query με zoom level για καλύτερο έλεγχο
  const zoomLevel = useZoomLevel();
  const isSmallScreen = useMediaQuery('(max-width:1200px)');
  const shouldCollapseDrawer = isSmallScreen || zoomLevel > 125;
  
  // Χρησιμοποιούμε το zoom level + το media query μαζί για καλύτερη απόφαση
  useEffect(() => {
    setDrawerOpen(!shouldCollapseDrawer);
  }, [shouldCollapseDrawer]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMembersClick = useCallback(() => {
    setMembersOpen((prev) => !prev);
  }, []);

  const handleDrawerClose = () => {
    if (shouldCollapseDrawer) {
      setDrawerOpen(false);
    }
  };
  
  // Διαχείριση μενού χρήστη
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  const drawerContent = (
    <>
      <Toolbar />
      <Divider sx={{ margin: 1, width: "100%", height: "2px" }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/" role="menuitem" onClick={handleDrawerClose}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Αρχική" />
          </ListItemButton>
        </ListItem>

        <ListItemButton onClick={handleMembersClick} role="menuitem">
          <ListItemIcon>
            <MemberIcon />
          </ListItemIcon>
          <ListItemText primary="Μέλη" />
          {membersOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={membersOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/melitousillogou" role="menuitem" onClick={handleDrawerClose}>
              <ListItemText primary="Μέλη του συλλόγου" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/athlites" role="menuitem" onClick={handleDrawerClose}>
              <ListItemText primary="Αθλητές" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/meliallwnsillogwn" role="menuitem" onClick={handleDrawerClose}>
              <ListItemText primary="Μέλη άλλων συλλόγων" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/epafes" role="menuitem" onClick={handleDrawerClose}>
              <ListItemText primary="Επαφές" />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/eksormiseis" role="menuitem" onClick={handleDrawerClose}>
            <ListItemIcon>
              <HikeIcon />
            </ListItemIcon>
            <ListItemText primary="Εξορμήσεις" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/eksoplismos" role="menuitem" onClick={handleDrawerClose}>
            <ListItemIcon>
              <EquipmentIcon />
            </ListItemIcon>
            <ListItemText primary="Εξοπλισμός" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/katafigio" role="menuitem" onClick={handleDrawerClose}>
            <ListItemIcon>
              <CabinIcon />
            </ListItemIcon>
            <ListItemText primary="Καταφύγιο" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/sxoles" role="menuitem" onClick={handleDrawerClose}>
            <ListItemIcon>
              <SchoolIcon />
            </ListItemIcon>
            <ListItemText primary="Σχολές" />
          </ListItemButton>
        </ListItem>

        {user?.role === "admin" && (
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin" role="menuitem" onClick={handleDrawerClose}>
              <ListItemIcon>
                <MemberIcon />
              </ListItemIcon>
              <ListItemText primary="Διαχειριστής" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        open={drawerOpen} 
        isSmallScreen={shouldCollapseDrawer}
        role="banner"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: drawerOpen && !shouldCollapseDrawer ? `calc(100% - ${drawerWidth}px)` : '100%'
        }}
      >
        <Toolbar>
          {shouldCollapseDrawer && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography 
            variant="h6" 
            noWrap 
            component={RouterLink} 
            to="/" 
            sx={{ 
              color: "inherit", 
              textDecoration: "none",
              flexGrow: 0
            }}
          >
            Ορειβατικός Σύλλογος
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          
          {/* User menu */}
          <IconButton
            color="inherit"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleUserMenuOpen}
            sx={{ mr: 1 }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
          >
            <Typography sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
              {user?.username || 'Χρήστης'}
            </Typography>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Αποσύνδεση
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {shouldCollapseDrawer ? (
        // Για μικρές οθόνες ή μεγάλο zoom: χρησιμοποιούμε temporary drawer
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Καλύτερη απόδοση σε mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          role="navigation"
        >
          {drawerContent}
        </Drawer>
      ) : (
        // Για μεγάλες οθόνες με κανονικό zoom: persistent drawer
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          role="navigation"
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
}