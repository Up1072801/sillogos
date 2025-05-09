const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const epafesRoutes = require("./routes/Repafes");
const melitousillogouRoutes = require("./routes/Rmelitousillogou");
const athlitesRoutes = require("./routes/Rathlites");
const meliallwnsillogwnRoutes = require("./routes/Rmeliallwnsillogwn");
const eksoplismosRoutes = require("./routes/Reksoplismos");
const katafigioRoutes = require("./routes/Rkatafigio");
const sxolesRoutes = require("./routes/Rsxoles"); // Νέο route για σχολές
const eksormiseisRoutes = require("./routes/Reksormiseis");
const vathmoiDiskoliasRouter = require('./routes/vathmoi-diskolias');
const eidiSindromisRouter = require('./routes/eidi-sindromis');
const adminRouter = require('./routes/radmin');

const app = express();

// Ρυθμίσεις CORS
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware για ανάλυση JSON
app.use(bodyParser.json());

// Ρίζα διαδρομής
app.get("/", (_req, res) => {
  res.send("Ο server λειτουργεί! Χρησιμοποίησε τα διαθέσιμα API endpoints.");
});

// Routes
app.use("/api/Repafes", epafesRoutes);
app.use("/api/melitousillogou", melitousillogouRoutes);
app.use("/api/athlites", athlitesRoutes);
app.use("/api/meliallwnsillogwn", meliallwnsillogwnRoutes);
app.use("/api/eksoplismos", eksoplismosRoutes);
app.use("/api/katafigio", katafigioRoutes);
app.use("/api/sxoles", sxolesRoutes); // Route για σχολές
app.use("/api/eksormiseis", eksormiseisRoutes);
app.use('/api/vathmoi-diskolias', vathmoiDiskoliasRouter);
app.use('/api/eidi-sindromis', eidiSindromisRouter);
app.use(adminRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});