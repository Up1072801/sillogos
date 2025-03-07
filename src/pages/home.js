import "./App.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="container">
      <header className="header">
        <h1>Σύστημα Ηλεκτρονικής Γραμματείας Ε.Ο.Σ Πατρών</h1>
      </header> 

      <div className="categories">
        <div className="category category-1">
          <Link to="/eksormiseis" className="category-title">Εξορμήσεις</Link>
          <p>Προβολή Εξορμήσεων</p>
          <p>Δημιουργία Εξόρμησης</p>
        </div>

        <div className="category category-2">
          <h2 className="category-title">Πρόσωπα</h2>
          <div>
            <Link to="/melitousillogou">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή μελών του συλλόγου
              </p>
            </Link>
            <Link to="/athlites">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή αθλητών
              </p>
            </Link>
            <Link to="/meliallwnsillogwn">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή μελών άλλων συλλόγων
              </p>
            </Link>
            <Link to="/epafes">
              <p style={{ cursor: "pointer", textDecoration: "underline" }}>
                Προβολή Επαφών
              </p>
            </Link>
            <p>Δημιουργία Επαφών</p>
          </div>
        </div>

        <div className="category category-3">
          <Link to="/katafigio" className="category-title">Καταφύγιο</Link>
          <p>Προβολή Κρατήσεων</p>
          <p>Δημιουργία Κρατήσεων</p>
        </div>

        <div className="category category-4">
          <Link to="/sxoles" className="category-title">Σχολές και εκπαιδευτές</Link>
          <p>Προβολή Σχολών και εκπαιδευτών</p>
          <p>Δημιουργία Εξόρμησης</p>
        </div>

        <div className="category category-5">
          <Link to="/eksoplismos" className="category-title">Εξοπλισμός και δανεισμοί</Link>
          <p>Προβολή δανεισμών και εξοπλισμού</p>
          <p>Δημιουργία δανεισμού</p>
        </div>
      </div>
    </div>
  );
}

export default Home;