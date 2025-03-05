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
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
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

export default function Navbar() {
  const theme = useTheme();
  const [membersOpen, setMembersOpen] = React.useState(false);

  const handleMembersClick = () => {
    setMembersOpen(!membersOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={true}>
        <Toolbar>
          <Typography variant="h6" noWrap component={RouterLink} to="/" sx={{ color: 'inherit', textDecoration: 'none' }}>
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
        variant="persistent"
        anchor="left"
        open={true}
      >
        <Toolbar />
        <Divider sx={{ margin: 1, width: "100%", height: "2px" }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/">
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Αρχική" />
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
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/melitousillogou">
                <ListItemText primary="Μέλη του συλλόγου" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/athlites">
                <ListItemText primary="Αθλητές" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/meliallwnsillogwn">
                <ListItemText primary="Μέλοι άλλων συλλόγων" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} component={RouterLink} to="/epafes">
                <ListItemText primary="Επαφές" />
              </ListItemButton>
            </List>
          </Collapse>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/eksormiseis">
              <ListItemIcon>
                <HikeIcon />
              </ListItemIcon>
              <ListItemText primary="Εξορμήσεις" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/eksoplismos">
              <ListItemIcon>
                <EquipmentIcon />
              </ListItemIcon>
              <ListItemText primary="Εξοπλισμός" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/katafigio">
              <ListItemIcon>
                <CabinIcon />
              </ListItemIcon>
              <ListItemText primary="Καταφύγιο" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/sxoles">
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