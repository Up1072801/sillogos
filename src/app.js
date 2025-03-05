import { Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/epafes" element={<Layout><Epafes /></Layout>} />
      <Route path="/eksormiseis" element={<Layout><Eksormiseis /></Layout>} />
      <Route path="/eksoplismos" element={<Layout><Eksoplismos /></Layout>} />
      <Route path="/katafigio" element={<Layout><Katafigio /></Layout>} />
      <Route path="/sxoles" element={<Layout><Sxoles /></Layout>} />
      <Route path="/athlites" element={<Layout><Athlites /></Layout>} />
      <Route path="/melitousillogou" element={<Layout><Meloi /></Layout>} />
      <Route path="/meliallwnsillogwn" element={<Layout><MeloiAllwn /></Layout>} />
    </Routes>
  );
}

export default App;