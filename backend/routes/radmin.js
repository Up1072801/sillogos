const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// =============================================================================
// ΑΘΛΗΜΑΤΑ (athlima) ENDPOINTS
// =============================================================================

// GET: Λήψη όλων των αθλημάτων
router.get("/athlites/sports-list", async (req, res) => {
  try {
    const sports = await prisma.athlima.findMany({
      orderBy: {
        id_athlimatos: "asc"
      }
    });

    res.json(sports.map(sport => ({
      id_athlimatos: sport.id_athlimatos,
      onoma: sport.onoma || ""
    })));
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση αθλημάτων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση αθλημάτων" });
  }
});

// POST: Προσθήκη νέου αθλήματος
router.post("/athlites/sport", async (req, res) => {
  try {
    const { onoma } = req.body;

    if (!onoma) {
      return res.status(400).json({ error: "Το όνομα αθλήματος είναι υποχρεωτικό" });
    }

    // Έλεγχος αν υπάρχει ήδη άθλημα με το ίδιο όνομα
    const existingSport = await prisma.athlima.findFirst({
      where: { onoma }
    });

    if (existingSport) {
      return res.status(400).json({ error: "Υπάρχει ήδη άθλημα με αυτό το όνομα" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"Athlima_id_athlimatos_seq"', GREATEST(coalesce((SELECT MAX(id_athlimatos) FROM "Athlima"), 0), 1))`;

    // Δημιουργία νέου αθλήματος
    const newSport = await prisma.athlima.create({
      data: { onoma }
    });

    res.status(201).json({
      id_athlimatos: newSport.id_athlimatos,
      onoma: newSport.onoma
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη αθλήματος:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη αθλήματος" });
  }
});

// PUT: Ενημέρωση αθλήματος
router.put("/athlites/sport/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { onoma } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    if (!onoma) {
      return res.status(400).json({ error: "Το όνομα αθλήματος είναι υποχρεωτικό" });
    }

    // Έλεγχος αν υπάρχει το άθλημα
    const existingSport = await prisma.athlima.findUnique({
      where: { id_athlimatos: id }
    });

    if (!existingSport) {
      return res.status(404).json({ error: "Το άθλημα δεν βρέθηκε" });
    }

    // Έλεγχος αν υπάρχει άλλο άθλημα με το ίδιο όνομα
    const duplicateSport = await prisma.athlima.findFirst({
      where: { 
        onoma,
        id_athlimatos: { not: id }
      }
    });

    if (duplicateSport) {
      return res.status(400).json({ error: "Υπάρχει ήδη άλλο άθλημα με αυτό το όνομα" });
    }

    // Ενημέρωση του αθλήματος
    const updatedSport = await prisma.athlima.update({
      where: { id_athlimatos: id },
      data: { onoma }
    });

    res.json({
      id_athlimatos: updatedSport.id_athlimatos,
      onoma: updatedSport.onoma
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση αθλήματος:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση αθλήματος" });
  }
});

// DELETE: Διαγραφή αθλήματος
router.delete("/athlites/sport/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    // Έλεγχος αν υπάρχει το άθλημα
    const existingSport = await prisma.athlima.findUnique({
      where: { id_athlimatos: id }
    });

    if (!existingSport) {
      return res.status(404).json({ error: "Το άθλημα δεν βρέθηκε" });
    }

    // Έλεγχος αν το άθλημα χρησιμοποιείται
    const usedBySports = await prisma.asxoleitai.findFirst({
      where: { id_athlimatos: id }
    });

    if (usedBySports) {
      return res.status(400).json({ 
        error: "Δεν μπορεί να διαγραφεί το άθλημα γιατί χρησιμοποιείται από αθλητές" 
      });
    }

    // Διαγραφή του αθλήματος
    await prisma.athlima.delete({
      where: { id_athlimatos: id }
    });

    res.json({ message: "Το άθλημα διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή αθλήματος:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή αθλήματος" });
  }
});

// =============================================================================
// ΒΑΘΜΟΙ ΔΥΣΚΟΛΙΑΣ (vathmos_diskolias) ENDPOINTS
// =============================================================================

// Το endpoint GET για βαθμούς δυσκολίας υπάρχει ήδη στο vathmoi-diskolias.js

// POST: Προσθήκη νέου βαθμού δυσκολίας
router.post("/vathmoi-diskolias", async (req, res) => {
  try {
    const { epipedo } = req.body;

    if (epipedo === undefined || epipedo === null) {
      return res.status(400).json({ error: "Το επίπεδο είναι υποχρεωτικό" });
    }

    // Έλεγχος αν υπάρχει ήδη βαθμός με το ίδιο επίπεδο
    const existingLevel = await prisma.vathmos_diskolias.findFirst({
      where: { epipedo: parseInt(epipedo) }
    });

    if (existingLevel) {
      return res.status(400).json({ error: "Υπάρχει ήδη βαθμός με αυτό το επίπεδο" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"VathmosDiskolias_id_vathmou_diskolias_seq"', GREATEST(coalesce((SELECT MAX(id_vathmou_diskolias) FROM "VathmosDiskolias"), 0), 1))`;

    // Δημιουργία νέου βαθμού δυσκολίας
    const newLevel = await prisma.vathmos_diskolias.create({
      data: { epipedo: parseInt(epipedo) }
    });

    res.status(201).json({
      id_vathmou_diskolias: newLevel.id_vathmou_diskolias,
      epipedo: newLevel.epipedo
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη βαθμού δυσκολίας:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη βαθμού δυσκολίας" });
  }
});

// PUT: Ενημέρωση βαθμού δυσκολίας
router.put("/vathmoi-diskolias/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { epipedo } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    if (epipedo === undefined || epipedo === null) {
      return res.status(400).json({ error: "Το επίπεδο είναι υποχρεωτικό" });
    }

    // Έλεγχος αν υπάρχει ο βαθμός δυσκολίας
    const existingLevel = await prisma.vathmos_diskolias.findUnique({
      where: { id_vathmou_diskolias: id }
    });

    if (!existingLevel) {
      return res.status(404).json({ error: "Ο βαθμός δυσκολίας δεν βρέθηκε" });
    }

    // Έλεγχος αν υπάρχει άλλος βαθμός με το ίδιο επίπεδο
    const duplicateLevel = await prisma.vathmos_diskolias.findFirst({
      where: { 
        epipedo: parseInt(epipedo),
        id_vathmou_diskolias: { not: id }
      }
    });

    if (duplicateLevel) {
      return res.status(400).json({ error: "Υπάρχει ήδη άλλος βαθμός με αυτό το επίπεδο" });
    }

    // Ενημέρωση του βαθμού δυσκολίας
    const updatedLevel = await prisma.vathmos_diskolias.update({
      where: { id_vathmou_diskolias: id },
      data: { epipedo: parseInt(epipedo) }
    });

    res.json({
      id_vathmou_diskolias: updatedLevel.id_vathmou_diskolias,
      epipedo: updatedLevel.epipedo
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση βαθμού δυσκολίας:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση βαθμού δυσκολίας" });
  }
});

// DELETE: Διαγραφή βαθμού δυσκολίας
router.delete("/vathmoi-diskolias/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    // Έλεγχος αν υπάρχει ο βαθμός δυσκολίας
    const existingLevel = await prisma.vathmos_diskolias.findUnique({
      where: { id_vathmou_diskolias: id }
    });

    if (!existingLevel) {
      return res.status(404).json({ error: "Ο βαθμός δυσκολίας δεν βρέθηκε" });
    }

    // Έλεγχος αν ο βαθμός χρησιμοποιείται σε μέλη
    const usedByMembers = await prisma.melos.findFirst({
      where: { id_vathmou_diskolias: id }
    });

    if (usedByMembers) {
      return res.status(400).json({ 
        error: "Δεν μπορεί να διαγραφεί ο βαθμός γιατί χρησιμοποιείται από μέλη" 
      });
    }

    // Έλεγχος αν ο βαθμός χρησιμοποιείται σε δραστηριότητες
    const usedByActivities = await prisma.drastiriotita.findFirst({
      where: { id_vathmou_diskolias: id }
    });

    if (usedByActivities) {
      return res.status(400).json({ 
        error: "Δεν μπορεί να διαγραφεί ο βαθμός γιατί χρησιμοποιείται από δραστηριότητες" 
      });
    }

    // Διαγραφή του βαθμού δυσκολίας
    await prisma.vathmos_diskolias.delete({
      where: { id_vathmou_diskolias: id }
    });

    res.json({ message: "Ο βαθμός δυσκολίας διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή βαθμού δυσκολίας:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή βαθμού δυσκολίας" });
  }
});

// =============================================================================
// ΕΙΔΗ ΣΥΝΔΡΟΜΗΣ (eidos_sindromis) ENDPOINTS
// =============================================================================

// GET: Λήψη όλων των ειδών συνδρομής
router.get("/eidi-sindromis", async (req, res) => {
  try {
    const subscriptionTypes = await prisma.eidos_sindromis.findMany({
      orderBy: {
        id_eidous_sindromis: "asc"
      }
    });

    res.json(subscriptionTypes.map(type => ({
      id_eidous: type.id_eidous_sindromis,
      typos: type.titlos || "",
      kostos: type.timi || 0,
      diarkeia_se_mines: 12 // Default διάρκεια, θα μπορούσε να προστεθεί στο μοντέλο
    })));
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση ειδών συνδρομής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση ειδών συνδρομής" });
  }
});

// POST: Προσθήκη νέου είδους συνδρομής
router.post("/eidi-sindromis", async (req, res) => {
  try {
    const { typos, kostos, diarkeia_se_mines } = req.body;

    if (!typos) {
      return res.status(400).json({ error: "Ο τύπος συνδρομής είναι υποχρεωτικός" });
    }

    // Έλεγχος αν υπάρχει ήδη είδος με τον ίδιο τύπο
    const existingType = await prisma.eidos_sindromis.findFirst({
      where: { titlos: typos }
    });

    if (existingType) {
      return res.status(400).json({ error: "Υπάρχει ήδη είδος συνδρομής με αυτό τον τύπο" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"EidosSindromis_id_eidous_sindromis_seq"', GREATEST(coalesce((SELECT MAX(id_eidous_sindromis) FROM "EidosSindromis"), 0), 1))`;

    // Δημιουργία νέου είδους συνδρομής
    const newSubscriptionType = await prisma.eidos_sindromis.create({
      data: { 
        titlos: typos,
        timi: parseInt(kostos) || 0
      }
    });

    res.status(201).json({
      id_eidous: newSubscriptionType.id_eidous_sindromis,
      typos: newSubscriptionType.titlos,
      kostos: newSubscriptionType.timi || 0,
      diarkeia_se_mines: diarkeia_se_mines || 12
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη είδους συνδρομής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη είδους συνδρομής" });
  }
});

// PUT: Ενημέρωση είδους συνδρομής
router.put("/eidi-sindromis/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { typos, kostos, diarkeia_se_mines } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    if (!typos) {
      return res.status(400).json({ error: "Ο τύπος συνδρομής είναι υποχρεωτικός" });
    }

    // Έλεγχος αν υπάρχει το είδος συνδρομής
    const existingType = await prisma.eidos_sindromis.findUnique({
      where: { id_eidous_sindromis: id }
    });

    if (!existingType) {
      return res.status(404).json({ error: "Το είδος συνδρομής δεν βρέθηκε" });
    }

    // Έλεγχος αν υπάρχει άλλο είδος με τον ίδιο τύπο
    const duplicateType = await prisma.eidos_sindromis.findFirst({
      where: { 
        titlos: typos,
        id_eidous_sindromis: { not: id }
      }
    });

    if (duplicateType) {
      return res.status(400).json({ error: "Υπάρχει ήδη άλλο είδος συνδρομής με αυτό τον τύπο" });
    }

    // Ενημέρωση του είδους συνδρομής
    const updatedType = await prisma.eidos_sindromis.update({
      where: { id_eidous_sindromis: id },
      data: { 
        titlos: typos,
        timi: parseInt(kostos) || 0
      }
    });

    res.json({
      id_eidous: updatedType.id_eidous_sindromis,
      typos: updatedType.titlos,
      kostos: updatedType.timi || 0,
      diarkeia_se_mines: diarkeia_se_mines || 12
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση είδους συνδρομής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση είδους συνδρομής" });
  }
});

// DELETE: Διαγραφή είδους συνδρομής
router.delete("/eidi-sindromis/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    // Έλεγχος αν υπάρχει το είδος συνδρομής
    const existingType = await prisma.eidos_sindromis.findUnique({
      where: { id_eidous_sindromis: id }
    });

    if (!existingType) {
      return res.status(404).json({ error: "Το είδος συνδρομής δεν βρέθηκε" });
    }

    // Έλεγχος αν το είδος χρησιμοποιείται σε συνδρομές
    const usedBySubscriptions = await prisma.sindromi.findFirst({
      where: { id_eidous_sindromis: id }
    });

    if (usedBySubscriptions) {
      return res.status(400).json({ 
        error: "Δεν μπορεί να διαγραφεί το είδος συνδρομής γιατί χρησιμοποιείται" 
      });
    }

    // Διαγραφή του είδους συνδρομής
    await prisma.eidos_sindromis.delete({
      where: { id_eidous_sindromis: id }
    });

    res.json({ message: "Το είδος συνδρομής διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή είδους συνδρομής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή είδους συνδρομής" });
  }
});

// =============================================================================
// ΚΑΤΑΦΥΓΙΑ (katafigio) ENDPOINTS
// =============================================================================

// GET: Λήψη όλων των καταφυγίων
router.get("/katafigio/katafygia", async (req, res) => {
  try {
    const refuges = await prisma.katafigio.findMany({
      orderBy: {
        id_katafigiou: "asc"
      }
    });

    res.json(refuges.map(refuge => ({
      id_katafigiou: refuge.id_katafigiou,
      onoma: refuge.onoma || "",
      xoritikotita: refuge.xoritikotita || 0,
      timi_melous: refuge.timi_melous || 0,
      timi_mi_melous: refuge.timi_mi_melous || 0
    })));
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση καταφυγίων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση καταφυγίων" });
  }
});

// POST: Προσθήκη νέου καταφυγίου
router.post("/katafigio/katafygia", async (req, res) => {
  try {
    const { onoma, xoritikotita, timi_melous, timi_mi_melous, timi_eksoxwrou_melos, timi_eksoxwroy_mimelos } = req.body;

    if (!onoma) {
      return res.status(400).json({ error: "Το όνομα καταφυγίου είναι υποχρεωτικό" });
    }

    // Έλεγχος αν υπάρχει ήδη καταφύγιο με το ίδιο όνομα
    const existingRefuge = await prisma.katafigio.findFirst({
      where: { onoma }
    });

    if (existingRefuge) {
      return res.status(400).json({ error: "Υπάρχει ήδη καταφύγιο με αυτό το όνομα" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"Katafigio_id_katafigiou_seq"', GREATEST(coalesce((SELECT MAX(id_katafigiou) FROM "Katafigio"), 0), 1))`;

    // Δημιουργία νέου καταφυγίου
    const newRefuge = await prisma.katafigio.create({
      data: { 
        onoma,
        xoritikotita: parseInt(xoritikotita) || 0,
        timi_melous: parseInt(timi_melous) || 0,
        timi_mi_melous: parseInt(timi_mi_melous) || 0,
        timi_eksoxwrou_melos: parseInt(timi_eksoxwrou_melos) || 0,
        timi_eksoxwroy_mimelos: parseInt(timi_eksoxwroy_mimelos) || 0
      }
    });

    res.status(201).json({
      id_katafigiou: newRefuge.id_katafigiou,
      onoma: newRefuge.onoma,
      xoritikotita: newRefuge.xoritikotita,
      timi_melous: newRefuge.timi_melous,
      timi_mi_melous: newRefuge.timi_mi_melous,
      timi_eksoxwrou_melos: newRefuge.timi_eksoxwrou_melos,
      timi_eksoxwroy_mimelos: newRefuge.timi_eksoxwroy_mimelos
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη καταφυγίου:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη καταφυγίου" });
  }
});

// PUT: Ενημέρωση καταφυγίου
router.put("/katafigio/katafygia/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { onoma, xoritikotita, timi_melous, timi_mi_melous, timi_eksoxwrou_melos, timi_eksoxwroy_mimelos } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    if (!onoma) {
      return res.status(400).json({ error: "Το όνομα καταφυγίου είναι υποχρεωτικό" });
    }

    // Έλεγχος αν υπάρχει το καταφύγιο
    const existingRefuge = await prisma.katafigio.findUnique({
      where: { id_katafigiou: id }
    });

    if (!existingRefuge) {
      return res.status(404).json({ error: "Το καταφύγιο δεν βρέθηκε" });
    }

    // Έλεγχος αν υπάρχει άλλο καταφύγιο με το ίδιο όνομα
    const duplicateRefuge = await prisma.katafigio.findFirst({
      where: { 
        onoma,
        id_katafigiou: { not: id }
      }
    });

    if (duplicateRefuge) {
      return res.status(400).json({ error: "Υπάρχει ήδη άλλο καταφύριο με αυτό το όνομα" });
    }

    // Ενημέρωση του καταφυγίου
    const updatedRefuge = await prisma.katafigio.update({
      where: { id_katafigiou: id },
      data: { 
        onoma,
        xoritikotita: parseInt(xoritikotita) || 0,
        timi_melous: parseInt(timi_melous) || 0,
        timi_mi_melous: parseInt(timi_mi_melous) || 0,
        timi_eksoxwrou_melos: parseInt(timi_eksoxwrou_melos) || 0,
        timi_eksoxwroy_mimelos: parseInt(timi_eksoxwroy_mimelos) || 0
      }
    });

    res.json({
      id_katafigiou: updatedRefuge.id_katafigiou,
      onoma: updatedRefuge.onoma,
      xoritikotita: updatedRefuge.xoritikotita,
      timi_melous: updatedRefuge.timi_melous,
      timi_mi_melous: updatedRefuge.timi_mi_melous,
      timi_eksoxwrou_melos: updatedRefuge.timi_eksoxwrou_melos,
      timi_eksoxwroy_mimelos: updatedRefuge.timi_eksoxwroy_mimelos
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση καταφυγίου:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση καταφυγίου" });
  }
});

// DELETE: Διαγραφή καταφυγίου
router.delete("/katafigio/katafygia/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    // Έλεγχος αν υπάρχει το καταφύγιο
    const existingRefuge = await prisma.katafigio.findUnique({
      where: { id_katafigiou: id }
    });

    if (!existingRefuge) {
      return res.status(404).json({ error: "Το καταφύγιο δεν βρέθηκε" });
    }

    // Έλεγχος αν το καταφύγιο έχει κρατήσεις
    const hasBookings = await prisma.kratisi_katafigiou.findFirst({
      where: { id_katafigiou: id }
    });

    if (hasBookings) {
      return res.status(400).json({ 
        error: "Δεν μπορεί να διαγραφεί το καταφύγιο γιατί έχει κρατήσεις" 
      });
    }

    // Διαγραφή του καταφυγίου
    await prisma.katafigio.delete({
      where: { id_katafigiou: id }
    });

    res.json({ message: "Το καταφύγιο διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή καταφυγίου:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή καταφυγίου" });
  }
});

module.exports = router;