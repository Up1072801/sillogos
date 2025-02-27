import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Epafes from "./pages/epafes";
import Eksormiseis from "./pages/eksormiseis";
import Eksoplismos from "./pages/eksoplismos";
import Katafigio from "./pages/katafigio";
import Sxoles from "./pages/sxoles";
import Athlites from "./pages/athlites";
import Meloi from "./pages/melitousillogou";
import MeloiAllwn from "./pages/meliallwnsillogwn";
import { Box } from "@mui/material";

const drawerWidth = 240;

function App() {
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar open={open} handleDrawerOpen={handleDrawerOpen} handleDrawerClose={handleDrawerClose} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: "margin 0.3s ease-out",
          marginLeft: open ? `${drawerWidth}px` : "0px",
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/epafes" element={<Epafes />} />
          <Route path="/eksormiseis" element={<Eksormiseis />} />
          <Route path="/eksoplismos" element={<Eksoplismos />} />
          <Route path="/katafigio" element={<Katafigio />} />
          <Route path="/sxoles" element={<Sxoles />} />
          <Route path="/athlites" element={<Athlites />} />
          <Route path="/melitousillogou" element={<Meloi />} />
          <Route path="/meliallwnsillogwn" element={<MeloiAllwn />} />

        </Routes>
      </Box>
    </Box>
  );
}

export default App;
