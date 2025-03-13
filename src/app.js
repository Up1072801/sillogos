import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/home";
import Epafes from "./pages/epafes";
import Eksormiseis from "./pages/eksormiseis";
import EksormisiDetails from "./pages/EksormisiDetails";
import DrastiriotitaDetails from "./pages/DrastiriotitaDetails"; // Εισαγωγή της νέας σελίδας
import Eksoplismos from "./pages/eksoplismos";
import Katafigio from "./pages/katafigio";
import Sxoles from "./pages/sxoles";
import Athlites from "./pages/athlites";
import Meloi from "./pages/melitousillogou";
import MeloiAllwn from "./pages/meliallwnsillogwn";
import SchoolDetails from "./pages/SchoolDetails"; // Εισαγωγή της νέας σελίδας

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/epafes" element={<Layout><Epafes /></Layout>} />
      <Route path="/eksormiseis" element={<Layout><Eksormiseis /></Layout>} />
      <Route path="/eksormiseis/:eksormisiName" element={<Layout><EksormisiDetails /></Layout>} />
      <Route path="/eksormiseis/:eksormisiName/:drastiriotitaName" element={<Layout><DrastiriotitaDetails /></Layout>} /> {/* Προσθήκη της νέας διαδρομής */}
      <Route path="/eksoplismos" element={<Layout><Eksoplismos /></Layout>} />
      <Route path="/katafigio" element={<Layout><Katafigio /></Layout>} />
      <Route path="/sxoles" element={<Layout><Sxoles /></Layout>} />
      <Route path="/athlites" element={<Layout><Athlites /></Layout>} />
      <Route path="/melitousillogou" element={<Layout><Meloi /></Layout>} />
      <Route path="/meliallwnsillogwn" element={<Layout><MeloiAllwn /></Layout>} />
      <Route path="/sxoles/:id" element={<Layout><SchoolDetails /></Layout>} /> {/* Προσθήκη της νέας διαδρομής */}
    </Routes>
  );
}

export default App;