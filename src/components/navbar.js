import * as React from "react";
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
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  DirectionsWalk as HikeIcon,
  Inventory as EquipmentIcon,
  Cabin as CabinIcon,
  School as SchoolIcon,
  Person as MemberIcon,
  PersonAdd as AddMemberIcon,
  GroupAdd as GroupMemberIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";

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

export default function Navbar({ open, handleDrawerOpen, handleDrawerClose }) {
  const theme = useTheme();
  const [membersOpen, setMembersOpen] = React.useState(false);

  const handleMembersClick = () => {
    setMembersOpen(!membersOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" onClick={handleDrawerOpen} edge="start" sx={{ mr: 2, ...(open && { display: "none" }) }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Ορειβατικός Σύλλογος
          </Typography>
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
          variant="temporary"
          anchor="left"
          open={open}
          onClose={handleDrawerClose}
       >


        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "8px 16px" }}>
        <IconButton onClick={handleDrawerClose}>
        {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
        </Box>

        <Divider sx={{ margin: 1, width: "100%", height: "2px", // Αλλαγή χρώματος sidebar (π.χ. μπλε)
 }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/" onClick={handleDrawerClose}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Αρχική"  />
            </ListItemButton>
          </ListItem>

          <ListItemButton onClick={handleMembersClick}>
            <ListItemIcon>
              <MemberIcon />
            </ListItemIcon>
            <ListItemText primary="Μέλη" />
            {membersOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={membersOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: 4 }} component={Link} to="/melitousillogou" onClick={handleDrawerClose}>

                <ListItemText primary="Μέλη του συλλόγου" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={Link} to="/athlites" onClick={handleDrawerClose}>

                <ListItemText primary="Αθλητές" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={Link} to="/meliallwnsillogwn" onClick={handleDrawerClose}>

                <ListItemText primary="Μέλοι άλλων συλλόγων" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={Link} to="/epafes" onClick={handleDrawerClose}>

                <ListItemText primary="Επαφές" />
              </ListItemButton>
              
            </List>
          </Collapse>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/eksormiseis" onClick={handleDrawerClose}>
              <ListItemIcon>
                <HikeIcon />
              </ListItemIcon>
              <ListItemText primary="Εξορμήσεις" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/eksoplismos" onClick={handleDrawerClose}>
              <ListItemIcon>
                <EquipmentIcon />
              </ListItemIcon>
              <ListItemText primary="Εξοπλισμός" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/katafigio" onClick={handleDrawerClose}>
              <ListItemIcon>
                <CabinIcon />
              </ListItemIcon>
              <ListItemText primary="Καταφύγιο" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/sxoles" onClick={handleDrawerClose}>
              <ListItemIcon>
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText primary="Σχολές" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}
