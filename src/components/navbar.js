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
  MenuItem,
  Chip,
  Tooltip
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
  AccountCircle,
  Refresh as RefreshIcon
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

// Token Expiry Countdown component
const TokenExpiryCountdown = ({ refreshTrigger }) => {
  const [timeRemaining, setTimeRemaining] = useState("");
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return "Σύνδεση";
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // μετατροπή σε ms
        const now = Date.now();
        
        if (expiry < now) {
          return "Έληξε";
        }
        
        // Υπολογισμός χρόνου που απομένει
        const diff = expiry - now;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        // Μορφοποίηση με leading zeros αν χρειάζεται
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      } catch (err) {
        return "Σφάλμα";
      }
    };
    
    // Αρχικός υπολογισμός
    setTimeRemaining(calculateTimeRemaining());
    
    // Ενημέρωση κάθε δευτερόλεπτο
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [refreshTrigger]); // Add refreshTrigger as dependency
  
  return timeRemaining;
};

export default function Navbar({ user, onLogout, tokenStatus, refreshing, refreshToken, getTokenStatusColor, getTokenStatusText }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [membersOpen, setMembersOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  // Add a refresh trigger state that changes when token is refreshed
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
              <ListItemText primary="Αθλητές και αγώνες" />
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

  // Create a wrapper for the refreshToken function
  const handleRefreshToken = async () => {
    try {
      // Δεν έχουμε πρόσβαση στο setRefreshing, θα πρέπει να το λάβουμε ως prop
      // Καλούμε τη συνάρτηση ανανέωσης
      await refreshToken();
      
      // Ενημέρωση του trigger για να ενημερωθεί το countdown
      setRefreshTrigger(prev => prev + 1);
      
      // Εμφάνιση μηνύματος επιτυχίας
    } catch (error) {
      console.error("Σφάλμα κατά την ανανέωση:", error);
    } finally {
      // Δεν χρειάζεται να θέσουμε το refreshing σε false εδώ
      // Αυτό θα γίνει στο Layout component
    }
  };
  
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
          
          {/* Token status indicator */}
          {user && tokenStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Tooltip title={getTokenStatusText()}>
                <Chip 
                  size="small" 
                  color={getTokenStatusColor()} 
                  label={<TokenExpiryCountdown refreshTrigger={refreshTrigger} />}
                  variant="outlined"
                  sx={{ 
                    mr: 1,
                    color: 'white', // Κάνουμε το κείμενο άσπρο
                    borderColor: 'white', // Κάνουμε το περίγραμμα άσπρο
                    '& .MuiChip-label': {
                      color: 'white' // Επιπλέον ορισμός για το κείμενο
                    }
                  }}
                />
              </Tooltip>
              <Tooltip title="Ανανέωση σύνδεσης">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={handleRefreshToken}
                  sx={{ 
                    opacity: refreshing ? 0.5 : 1,
                    color: 'white !important',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <RefreshIcon 
                    fontSize="small" 
                    sx={{ 
                      color: 'white',
                      animation: refreshing ? 'spin 1s linear infinite' : 'none' 
                    }} 
                  />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* User menu */}
          <IconButton
            color="inherit"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleUserMenuOpen}
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