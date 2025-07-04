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
const { router: authRoutes, authenticateToken } = require('./routes/auth');

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

// Fix for double API prefix issue
app.use((req, res, next) => {
  // Check if the URL has a double api prefix
  if (req.path.startsWith('/api/api/')) {
    // Rewrite the URL to use just one /api/ prefix
    req.url = req.url.replace('/api/api/', '/api/');
    console.log(`[Server] Fixed double API prefix: ${req.url}`);
  }
  next();
});

// API endpoints
// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Διαδρομές για το authentication με /api prefix
app.use('/api/auth', authRoutes); 
app.use("/auth", authRoutes); // Keep this for backward compatibility

// API Endpoints - ONLY register routes with /api/ prefix
app.use("/api/Repafes", epafesRoutes);
app.use("/api/melitousillogou", melitousillogouRoutes);
app.use("/api/athlites", athlitesRoutes);
app.use("/api/meliallwnsillogwn", meliallwnsillogwnRoutes);
app.use("/api/eksoplismos", eksoplismosRoutes);
app.use("/api/katafigio", katafigioRoutes);
app.use("/api/sxoles", sxolesRoutes);
app.use("/api/eksormiseis", eksormiseisRoutes);
app.use('/api/vathmoi-diskolias', vathmoiDiskoliasRouter);
app.use('/api/eidi-sindromis', eidiSindromisRouter);
app.use('/api', adminRouter);

// REMOVED: All non-prefixed API routes that were causing conflicts with frontend routes

// Ρίζα διαδρομής - πλέον απαντά μόνο αν δεν ταιριάξει με στατικό αρχείο
app.get("/", (_req, res) => {
  // Προτιμούμε να σερβίρουμε το React αν υπάρχει
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join('/usr/share/nginx/html', 'index.html'));
  } else {
    res.send("Ο server λειτουργεί! Χρησιμοποίησε τα διαθέσιμα API endpoints.");
  }
});

// Catch-all route - Σερβίρισμα του React app για όλα τα άλλα routes
app.get('*', (req, res) => {
  // Only check for API endpoints that don't exist
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For ALL other routes (including frontend routes like '/melitousillogou', '/athlites'),
  // serve the React app to let client-side routing handle it
  res.sendFile(path.join('/usr/share/nginx/html', 'index.html'));
});

// Make sure server listens on all interfaces
const PORT = (process.env.PORT && process.env.PORT !== "80") ? process.env.PORT : 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
