const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const epafesRoutes = require("./routes/Repafes");
const melitousillogouRoutes = require("./routes/Rmelitousillogou");
const athlitesRoutes = require("./routes/Rathlites");
const meliallwnsillogwnRoutes = require("./routes/Rmeliallwnsillogwn");
const eksoplismosRoutes = require("./routes/Reksoplismos");
const katafigioRoutes = require("./routes/Rkatafigio");
const sxolesRoutes = require("./routes/Rsxoles");
const eksormiseisRoutes = require("./routes/Reksormiseis");
const vathmoiDiskoliasRouter = require('./routes/vathmoi-diskolias');
const eidiSindromisRouter = require('./routes/eidi-sindromis');
const adminRouter = require('./routes/radmin');

const app = express();

// Ρυθμίσεις CORS
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? ["http://localhost:80", "http://frontend"] 
    : "http://localhost:3000",
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Σερβίρισμα του React frontend από το build directory που το nginx προσπαθεί να σερβίρει
// Αυτό επιτρέπει στο Node.js να σερβίρει το frontend αν το Render στέλνει τα requests εδώ
app.use(express.static('/usr/share/nginx/html'));

// API endpoints
// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Χωρίς το /api/ prefix εδώ, το προσθέτει το nginx
app.use("/Repafes", epafesRoutes);
app.use("/melitousillogou", melitousillogouRoutes);
app.use("/athlites", athlitesRoutes);
app.use("/meliallwnsillogwn", meliallwnsillogwnRoutes);
app.use("/eksoplismos", eksoplismosRoutes);
app.use("/katafigio", katafigioRoutes);
app.use("/sxoles", sxolesRoutes);
app.use("/eksormiseis", eksormiseisRoutes);
app.use('/vathmoi-diskolias', vathmoiDiskoliasRouter);
app.use('/eidi-sindromis', eidiSindromisRouter);
app.use(adminRouter);

// Ρίζα διαδρομής - πλέον απαντά μόνο αν δεν ταιριάξει με στατικό αρχείο
app.get("/", (_req, res) => {
  // Προτιμούμε να σερβίρουμε το React αν υπάρχει
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join('/usr/share/nginx/html', 'index.html'));
  } else {
    res.send("Ο server λειτουργεί! Χρησιμοποίησε τα διαθέσιμα API endpoints.");
  }
});

// Σερβίρισμα του React app για όλα τα άλλα routes - πρέπει να είναι τελευταίο
app.get('*', (req, res) => {
  // Εξαίρεση για τα API endpoints που δεν υπάρχουν
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/Repafes') || 
      req.path.startsWith('/melitousillogou') ||
      req.path.startsWith('/athlites') ||
      req.path.startsWith('/meliallwnsillogwn') ||
      req.path.startsWith('/eksoplismos') ||
      req.path.startsWith('/katafigio') ||
      req.path.startsWith('/sxoles') ||
      req.path.startsWith('/eksormiseis') ||
      req.path.startsWith('/vathmoi-diskolias') ||
      req.path.startsWith('/eidi-sindromis') ||
      req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Σερβίρισμα του React app
  res.sendFile(path.join('/usr/share/nginx/html', 'index.html'));
});

// Make sure server listens on all interfaces
const PORT = (process.env.PORT && process.env.PORT !== "80") ? process.env.PORT : 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});