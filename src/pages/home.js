import "./App.css";
import { Link } from "react-router-dom";

function Home({ user }) {
  if (!user) {
    return <p>Δεν έχετε συνδεθεί.</p>;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Σύστημα Ηλεκτρονικής Γραμματείας Ε.Ο.Σ Πατρών</h1>
      </header>

      <div className="categories">
        <Link to="/eksormiseis" className="category category-1">
          <div>
            <h2 className="category-title">Εξορμήσεις</h2>
            <p>Προβολή Εξορμήσεων</p>
            <p>Δημιουργία Εξόρμησης</p>
          </div>
        </Link>

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

        <Link to="/katafigio" className="category category-3">
          <div>
            <h2 className="category-title">Καταφύγιο</h2>
            <p>Προβολή Κρατήσεων</p>
            <p>Δημιουργία Κρατήσεων</p>
          </div>
        </Link>

        <Link to="/sxoles" className="category category-4">
          <div>
            <h2 className="category-title">Σχολές και εκπαιδευτές</h2>
            <p>Προβολή Σχολών και εκπαιδευτών</p>
            <p>Δημιουργία Εξόρμησης</p>
          </div>
        </Link>

        <Link to="/eksoplismos" className="category category-5">
          <div>
            <h2 className="category-title">Εξοπλισμός και δανεισμοί</h2>
            <p>Προβολή δανεισμών και εξοπλισμού</p>
            <p>Δημιουργία δανεισμού</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Home;