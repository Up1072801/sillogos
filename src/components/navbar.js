import React from "react";
import { styled, useTheme } from "@mui/material/styles";
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
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
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
} from "@mui/icons-material";
import { useCallback } from "react";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  })
);

export default function Navbar({ user, onLogout }) {
  const theme = useTheme();
  const [membersOpen, setMembersOpen] = React.useState(false);

  const handleMembersClick = useCallback(() => {
    setMembersOpen((prev) => !prev);
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={true} role="banner">
        <Toolbar>
          <Typography variant="h6" noWrap component={RouterLink} to="/" sx={{ color: "inherit", textDecoration: "none" }}>
            Ορειβατικός Σύλλογος
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body1" sx={{ marginRight: 2 }}>
            Συνδεδεμένος ως: {user.username}
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
            Αποσύνδεση
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={true}
        role="navigation"
      >
        <Toolbar />
        <Divider sx={{ margin: 1, width: "100%", height: "2px" }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/" role="menuitem">
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
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/melitousillogou" role="menuitem">
                <ListItemText primary="Μέλη του συλλόγου" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/athlites" role="menuitem">
                <ListItemText primary="Αθλητές" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/meliallwnsillogwn" role="menuitem">
                <ListItemText primary="Μέλη άλλων συλλόγων" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/epafes" role="menuitem">
                <ListItemText primary="Επαφές" />
              </ListItemButton>
            </List>
          </Collapse>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/eksormiseis" role="menuitem">
              <ListItemIcon>
                <HikeIcon />
              </ListItemIcon>
              <ListItemText primary="Εξορμήσεις" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/eksoplismos" role="menuitem">
              <ListItemIcon>
                <EquipmentIcon />
              </ListItemIcon>
              <ListItemText primary="Εξοπλισμός" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/katafigio" role="menuitem">
              <ListItemIcon>
                <CabinIcon />
              </ListItemIcon>
              <ListItemText primary="Καταφύγιο" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/sxoles" role="menuitem">
              <ListItemIcon>
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText primary="Σχολές" />
            </ListItemButton>
          </ListItem>

          {user.role === "admin" && (
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/admin" role="menuitem">
                <ListItemIcon>
                  <MemberIcon />
                </ListItemIcon>
                <ListItemText primary="Διαχειριστής" />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Drawer>
    </Box>
  );
}