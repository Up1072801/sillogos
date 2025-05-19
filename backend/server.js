const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
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

// Middleware για ανάλυση JSON
app.use(bodyParser.json());

// Ρίζα διαδρομής
app.get("/", (_req, res) => {
  res.send("Ο server λειτουργεί! Χρησιμοποίησε τα διαθέσιμα API endpoints.");
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes - αφαιρέστε το /api/ από αυτά αφού το nginx ήδη προσθέτει το prefix
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

// Make sure server listens on all interfaces
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});