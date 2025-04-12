const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλου του εξοπλισμού
router.get("/", async (_req, res) => {
  try {
    const eksoplismos = await prisma.eksoplismos.findMany();
    
    const serializedEksoplismos = eksoplismos.map(item => ({
      id_eksoplismou: item.id_eksoplismou,
      onoma: item.onoma || "",
      marka: item.marka || "",
      xroma: item.xroma || "",
      megethos: item.megethos || "",
      imerominiakataskeuis: item.hmerominia_kataskeuis
    }));

    res.json(serializedEksoplismos);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση του εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση του εξοπλισμού" });
  }
});

// GET: Ανάκτηση όλων των δανεισμών με λεπτομέρειες
router.get("/daneismoi", async (_req, res) => {
  try {
    const daneismoi = await prisma.daneizetai.findMany({
      include: {
        epafes: true, // Συμπερίληψη δεδομένων επαφών
        eksoplismos: true // Συμπερίληψη δεδομένων εξοπλισμού
      }
    });

    console.log("Δανεισμοί από τη βάση:", daneismoi.length);
    
    // Σωστή μορφοποίηση των δεδομένων για την απάντηση
    const formattedDaneismoi = daneismoi.map(daneismos => {
      // Δημιουργία ονόματος δανειζόμενου
      const borrowerName = `${daneismos.epafes?.onoma || ""} ${daneismos.epafes?.epitheto || ""}`.trim();
      
      return {
        id: daneismos.id,
        id_epafis: daneismos.id_epafis,
        id_eksoplismou: daneismos.id_eksoplismou,
        Name: borrowerName,
        nameeksoplismou: daneismos.eksoplismos?.onoma || "",
        hmerominia_daneismou: daneismos.hmerominia_daneismou,
        hmerominia_epistrofis: daneismos.hmerominia_epistrofis,
        
        // Στοιχεία επαφής για το expand panel
        epafes: {
          id: daneismos.epafes?.id_epafis,
          fullName: borrowerName,
          onoma: daneismos.epafes?.onoma,
          epitheto: daneismos.epafes?.epitheto,
          email: daneismos.epafes?.email,
          tilefono: daneismos.epafes?.tilefono ? daneismos.epafes.tilefono.toString() : null
        },
        
        // Στοιχεία εξοπλισμού για το expand panel
        eksoplismos: {
          id: daneismos.eksoplismos?.id_eksoplismou,
          onoma: daneismos.eksoplismos?.onoma,
          marka: daneismos.eksoplismos?.marka,
          xroma: daneismos.eksoplismos?.xroma,
          megethos: daneismos.eksoplismos?.megethos,
          hmerominia_kataskeuis: daneismos.eksoplismos?.hmerominia_kataskeuis
        }
      };
    });

    console.log("Απάντηση API:", formattedDaneismoi.length);
    
    res.json(formattedDaneismoi);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των δανεισμών:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των δανεισμών" });
  }
});

// POST: Προσθήκη νέου εξοπλισμού
router.post("/", async (req, res) => {
  try {
    const { onoma, marka, xroma, megethos, hmerominia_kataskeuis } = req.body;

    // Επανέφερε την ακολουθία ID πριν την εισαγωγή
    await prisma.$executeRaw`SELECT setval('"Eksoplismos_id_eksoplismou_seq"', coalesce((SELECT MAX(id_eksoplismou) FROM "Eksoplismos"), 0))`;
    
    const newEksoplismos = await prisma.eksoplismos.create({
      data: {
        onoma,
        marka,
        xroma,
        megethos,
        hmerominia_kataskeuis: hmerominia_kataskeuis ? new Date(hmerominia_kataskeuis) : null
      }
    });

    res.status(201).json(newEksoplismos);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη εξοπλισμού", details: error.message });
  }
});

// POST: Προσθήκη νέου δανεισμού
router.post("/daneismos", async (req, res) => {
  try {
    const { id_epafis, id_eksoplismou, hmerominia_daneismou, hmerominia_epistrofis } = req.body;

    console.log("Δεδομένα αιτήματος:", req.body);

    // Επαναφορά της ακολουθίας ID πριν την εισαγωγή
    await prisma.$executeRaw`SELECT setval('"Daneizetai_id_seq"', coalesce((SELECT MAX(id) FROM "Daneizetai"), 0))`;

    const epafisId = parseInt(id_epafis);
    const eksoplismosId = parseInt(id_eksoplismou);

    // Έλεγχος αν υπάρχουν ήδη εκκρεμείς δανεισμοί
    const existingDaneizetai = await prisma.daneizetai.findMany({
      where: {
        id_eksoplismou: eksoplismosId,
        hmerominia_epistrofis: null
      }
    });

    if (existingDaneizetai.length > 0) {
      return res.status(400).json({
        error: "Ο εξοπλισμός είναι ήδη δανεισμένος και δεν έχει επιστραφεί"
      });
    }

    // Δημιουργία του δανεισμού
    const newDaneismos = await prisma.daneizetai.create({
      data: {
        id_epafis: epafisId,
        id_eksoplismou: eksoplismosId,
        hmerominia_daneismou: hmerominia_daneismou ? new Date(hmerominia_daneismou) : new Date(),
        hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : null
      },
      include: {
        epafes: true,
        eksoplismos: true
      }
    });

    console.log("Δημιουργήθηκε νέος δανεισμός:", newDaneismos);

    // Μορφοποίηση της απάντησης
    const borrowerName = `${newDaneismos.epafes?.onoma || ""} ${newDaneismos.epafes?.epitheto || ""}`.trim();
    
    res.status(201).json({
      id: newDaneismos.id,
      id_epafis: newDaneismos.id_epafis,
      id_eksoplismou: newDaneismos.id_eksoplismou,
      Name: borrowerName,
      nameeksoplismou: newDaneismos.eksoplismos?.onoma || "",
      hmerominia_daneismou: newDaneismos.hmerominia_daneismou,
      hmerominia_epistrofis: newDaneismos.hmerominia_epistrofis,
      epafes: {
        id: newDaneismos.epafes?.id_epafis,
        fullName: borrowerName,
        onoma: newDaneismos.epafes?.onoma,
        epitheto: newDaneismos.epafes?.epitheto,
        email: newDaneismos.epafes?.email,
        tilefono: newDaneismos.epafes?.tilefono ? newDaneismos.epafes.tilefono.toString() : null
      },
      eksoplismos: {
        id: newDaneismos.eksoplismos?.id_eksoplismou,
        onoma: newDaneismos.eksoplismos?.onoma,
        marka: newDaneismos.eksoplismos?.marka,
        xroma: newDaneismos.eksoplismos?.xroma,
        megethos: newDaneismos.eksoplismos?.megethos,
        hmerominia_kataskeuis: newDaneismos.eksoplismos?.hmerominia_kataskeuis
      }
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη δανεισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη δανεισμού", details: error.message });
  }
});

// PUT: Ενημέρωση υπάρχοντος εξοπλισμού
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { onoma, marka, xroma, megethos, hmerominia_kataskeuis } = req.body;

    const updatedEksoplismos = await prisma.eksoplismos.update({
      where: { id_eksoplismou: id },
      data: {
        onoma,
        marka,
        xroma,
        megethos,
        hmerominia_kataskeuis: hmerominia_kataskeuis ? new Date(hmerominia_kataskeuis) : null
      }
    });

    res.json(updatedEksoplismos);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση εξοπλισμού" });
  }
});

// PUT: Ενημέρωση υπάρχοντος δανεισμού
router.put("/daneismos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { id_epafis, id_eksoplismou, hmerominia_daneismou, hmerominia_epistrofis } = req.body;

    const updatedDaneismos = await prisma.daneizetai.update({
      where: { id },
      data: {
        id_epafis: parseInt(id_epafis),
        id_eksoplismou: parseInt(id_eksoplismou),
        hmerominia_daneismou: hmerominia_daneismou ? new Date(hmerominia_daneismou) : null,
        hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : null
      },
      include: {
        epafes: true,
        eksoplismos: true
      }
    });

    res.json(updatedDaneismos);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση δανεισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση δανεισμού" });
  }
});

// DELETE: Διαγραφή εξοπλισμού
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Έλεγχος αν υπάρχουν σχετικοί δανεισμοί
    const existingLoans = await prisma.daneizetai.findFirst({
      where: { id_eksoplismou: id }
    });

    if (existingLoans) {
      return res.status(400).json({ 
        error: "Δεν μπορεί να διαγραφεί ο εξοπλισμός επειδή υπάρχουν σχετικοί δανεισμοί" 
      });
    }

    await prisma.eksoplismos.delete({
      where: { id_eksoplismou: id }
    });

    res.json({ success: true, message: "Ο εξοπλισμός διαγράφηκε με επιτυχία" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή εξοπλισμού" });
  }
});

// DELETE: Διαγραφή δανεισμού
router.delete("/daneismos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.daneizetai.delete({
      where: { id }
    });

    res.json({ success: true, message: "Ο δανεισμός διαγράφηκε με επιτυχία" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή δανεισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή δανεισμού" });
  }
});

module.exports = router;