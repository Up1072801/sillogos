import { Routes, Route, Navigate, useNavigate } from "react-router-dom"; // Εισαγωγή του useNavigate
import { useState, useEffect } from "react";
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
import Login from "./pages/Login";
import SchoolDetails from "./pages/SchoolDetails";
import EksormisiDetails from "./pages/EksormisiDetails";
import DrastiriotitaDetails from "./pages/DrastiriotitaDetails";

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Χρήση του useNavigate

  // Ανάκτηση του χρήστη από το local storage όταν φορτώνεται η εφαρμογή
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user"); // Καθαρισμός του local storage κατά την αποσύνδεση
    navigate("/login"); // Ανακατεύθυνση στη σελίδα σύνδεσης
  };

  return (
    <Routes>
      {/* Αν δεν υπάρχει συνδεδεμένος χρήστης, εμφάνιση της οθόνης σύνδεσης */}
      {!user ? (
        <Route path="*" element={<Login setUser={setUser} />} />
      ) : (
        <>
          {/* Κοινές σελίδες για όλους τους χρήστες */}
          <Route
            path="/"
            element={<Layout user={user} onLogout={handleLogout}><Home user={user} /></Layout>}
          />
          <Route
            path="/epafes"
            element={<Layout user={user} onLogout={handleLogout}><Epafes /></Layout>}
          />
          <Route
            path="/eksormiseis"
            element={<Layout user={user} onLogout={handleLogout}><Eksormiseis /></Layout>}
          />
          <Route
            path="/eksoplismos"
            element={<Layout user={user} onLogout={handleLogout}><Eksoplismos /></Layout>}
          />
          <Route
            path="/katafigio"
            element={<Layout user={user} onLogout={handleLogout}><Katafigio /></Layout>}
          />
          <Route
            path="/sxoles"
            element={<Layout user={user} onLogout={handleLogout}><Sxoles /></Layout>}
          />
          <Route
            path="/athlites"
            element={<Layout user={user} onLogout={handleLogout}><Athlites /></Layout>}
          />
          <Route
            path="/melitousillogou"
            element={<Layout user={user} onLogout={handleLogout}><Meloi /></Layout>}
          />
          <Route
            path="/meliallwnsillogwn"
            element={<Layout user={user} onLogout={handleLogout}><MeloiAllwn /></Layout>}
          />

          {/* Σελίδες λεπτομερειών */}
          <Route
            path="/sxoles/:id"
            element={<Layout user={user} onLogout={handleLogout}><SchoolDetails /></Layout>}
          />
          <Route
            path="/eksormiseis/:eksormisiId"
            element={<Layout user={user} onLogout={handleLogout}><EksormisiDetails /></Layout>}
          />
          <Route
            path="/eksormiseis/:eksormisiId/:drastiriotitaId"
            element={<Layout user={user} onLogout={handleLogout}><DrastiriotitaDetails /></Layout>}
          />

          {/* Σελίδα διαχειριστή, διαθέσιμη μόνο για τον admin */}
          {user && user.role === "admin" && (
            <Route
              path="/admin"
              element={<Layout user={user} onLogout={handleLogout}><AdminPage /></Layout>}
            />
          )}

          {/* Ανακατεύθυνση σε αρχική σελίδα αν η διαδρομή δεν υπάρχει */}
          <Route path="*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
}

function AdminPage() {
  return <h1 style={{ textAlign: "center", marginTop: "100px" }}>Σελίδα Διαχειριστή</h1>;
}

export default App;