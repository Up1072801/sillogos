const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Διόρθωση στη διαδρομή GET για τον εξοπλισμό
router.get("/", async (_req, res) => {
  try {
    const eksoplismos = await prisma.eksoplismos.findMany({
      include: {
        // Συμπερίληψη των δανεισμών για κάθε εξοπλισμό με τις λεπτομέρειες των επαφών
        daneizetai: {
          include: {
            epafes: true
          }
        }
      }
    });
    
    console.log(`Βρέθηκαν ${eksoplismos.length} εξοπλισμοί`);
    
    const serializedEksoplismos = eksoplismos.map(item => {
      const serializedItem = {
        id_eksoplismou: item.id_eksoplismou,
        id: item.id_eksoplismou, // Προσθήκη για συνέπεια στο frontend
        onoma: item.onoma || "",
        marka: item.marka || "",
        xroma: item.xroma || "",
        megethos: item.megethos || "",
        imerominiakataskeuis: item.hmerominia_kataskeuis,
        hmerominia_kataskeuis: item.hmerominia_kataskeuis,
        // Επεξεργασία των δανεισμών για κάθε εξοπλισμό
        daneizetai: (item.daneizetai || []).map(d => ({
          id: d.id,
          id_epafis: d.id_epafis,
          id_eksoplismou: d.id_eksoplismou,
          hmerominia_daneismou: d.hmerominia_daneismou,
          hmerominia_epistrofis: d.hmerominia_epistrofis,
          borrowerName: d.epafes ? `${d.epafes.onoma || ''} ${d.epafes.epitheto || ''}`.trim() : "Άγνωστο"
        }))
      };

      // Προσθήκη log για debugging
      console.log(`Εξοπλισμός ${item.id_eksoplismou} (${item.onoma}) έχει ${serializedItem.daneizetai.length} δανεισμούς`);
      
      return serializedItem;
    });

    res.json(serializedEksoplismos);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση του εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση του εξοπλισμού" });
  }
});

// Διόρθωση στη διαδρομή GET /daneismoi

router.get("/daneismoi", async (_req, res) => {
  try {
    const daneismoi = await prisma.daneizetai.findMany({
      include: {
        epafes: true,
        eksoplismos: true
      }
    });

    // Διαμόρφωση απάντησης με πλήρη δεδομένα
    const formattedDaneismoi = daneismoi.map(daneismos => ({
      id: daneismos.id,
      id_epafis: daneismos.id_epafis,
      id_eksoplismou: daneismos.id_eksoplismou,
      hmerominia_daneismou: daneismos.hmerominia_daneismou,
      hmerominia_epistrofis: daneismos.hmerominia_epistrofis,
      katastasi_daneismou: daneismos.katastasi_daneismou || "Σε εκκρεμότητα",
      borrowerName: daneismos.epafes ? 
        `${daneismos.epafes.onoma || ''} ${daneismos.epafes.epitheto || ''}`.trim() : 
        "Άγνωστο",
      equipmentName: daneismos.eksoplismos?.onoma || "Άγνωστο",
      epafes: daneismos.epafes,
      eksoplismos: daneismos.eksoplismos
    }));

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

    // Έλεγχος αν τα απαραίτητα πεδία υπάρχουν
    if (!onoma) {
      return res.status(400).json({ error: "Το όνομα εξοπλισμού είναι υποχρεωτικό" });
    }

    // Επανέφερε την ακολουθία ID πριν την εισαγωγή
    await prisma.$executeRaw`SELECT setval('"Eksoplismos_id_eksoplismou_seq"', coalesce((SELECT MAX(id_eksoplismou) FROM "Eksoplismos"), 0))`;
    
    const newEksoplismos = await prisma.eksoplismos.create({
      data: {
        onoma,
        marka: marka || "",
        xroma: xroma || "",
        megethos: megethos || "",
        hmerominia_kataskeuis: hmerominia_kataskeuis ? new Date(hmerominia_kataskeuis) : null
      }
    });

    // Επιστροφή με όλες τις πιθανές μορφές ID για συνέπεια
    res.status(201).json({
      ...newEksoplismos,
      id: newEksoplismos.id_eksoplismou
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη εξοπλισμού", details: error.message });
  }
});

// POST: Προσθήκη νέου δανεισμού
router.post("/daneismos", async (req, res) => {
  try {
    const { id_epafis, id_eksoplismou, hmerominia_daneismou, hmerominia_epistrofis, katastasi_daneismou } = req.body;

    // ΔΙΟΡΘΩΣΗ: Χρήση των id_epafis και id_eksoplismou απευθείας από το req.body
    const newDaneismos = await prisma.daneizetai.create({
      data: {
        id_epafis: parseInt(id_epafis),
        id_eksoplismou: parseInt(id_eksoplismou),
        hmerominia_daneismou: hmerominia_daneismou ? new Date(hmerominia_daneismou) : new Date(),
        hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : null,
        katastasi_daneismou: katastasi_daneismou || "Σε εκκρεμότητα"
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
        id_epafis: newDaneismos.epafes?.id_epafis, // Προσθήκη για συνέπεια
        fullName: borrowerName,
        onoma: newDaneismos.epafes?.onoma,
        epitheto: newDaneismos.epafes?.epitheto,
        email: newDaneismos.epafes?.email,
        tilefono: newDaneismos.epafes?.tilefono ? newDaneismos.epafes.tilefono.toString() : null
      },
      eksoplismos: {
        id: newDaneismos.eksoplismos?.id_eksoplismou,
        id_eksoplismou: newDaneismos.eksoplismos?.id_eksoplismou, // Προσθήκη για συνέπεια
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

// Αλλάξτε το PUT endpoint για την ενημέρωση εξοπλισμού ώστε να επιστρέφει και τους δανεισμούς
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξοπλισμού" });
    }
    
    const { onoma, marka, xroma, megethos, hmerominia_kataskeuis } = req.body;

    // Έλεγχος αν ο εξοπλισμός υπάρχει
    const existingEquipment = await prisma.eksoplismos.findUnique({
      where: { id_eksoplismou: id }
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: "Ο εξοπλισμός δεν βρέθηκε" });
    }

    const updatedEksoplismos = await prisma.eksoplismos.update({
      where: { id_eksoplismou: id },
      data: {
        onoma: onoma || existingEquipment.onoma,
        marka: marka || existingEquipment.marka,
        xroma: xroma || existingEquipment.xroma,
        megethos: megethos || existingEquipment.megethos,
        hmerominia_kataskeuis: hmerominia_kataskeuis 
          ? new Date(hmerominia_kataskeuis) 
          : existingEquipment.hmerominia_kataskeuis
      },
      // Προσθήκη του include για τους δανεισμούς
      include: {
        daneizetai: {
          include: {
            epafes: true
          }
        }
      }
    });

    // Μορφοποίηση των δανεισμών όπως στο GET /
    const serializedDaneizetai = (updatedEksoplismos.daneizetai || []).map(d => ({
      id: d.id,
      id_epafis: d.id_epafis,
      id_eksoplismou: d.id_eksoplismou,
      hmerominia_daneismou: d.hmerominia_daneismou,
      hmerominia_epistrofis: d.hmerominia_epistrofis,
      borrowerName: d.epafes ? `${d.epafes.onoma || ''} ${d.epafes.epitheto || ''}`.trim() : "Άγνωστο"
    }));

    res.json({
      ...updatedEksoplismos,
      id: updatedEksoplismos.id_eksoplismou, // Προσθήκη για συνέπεια
      daneizetai: serializedDaneizetai // Επιστροφή των δανεισμών με τη σωστή μορφή
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση εξοπλισμού" });
  }
});

// PUT: Ενημέρωση υπάρχοντος δανεισμού
router.put("/daneismos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { id_epafis, id_eksoplismou, hmerominia_daneismou, hmerominia_epistrofis, katastasi_daneismou } = req.body;

    // Βρίσκουμε τον υπάρχοντα δανεισμό για να διατηρήσουμε τις τιμές που δεν αλλάζουν
    const existingLoan = await prisma.daneizetai.findUnique({
      where: { id }
    });

    if (!existingLoan) {
      return res.status(404).json({ error: "Ο δανεισμός δεν βρέθηκε" });
    }

    // ΔΙΟΡΘΩΣΗ: Χρήση των τιμών από το req.body αντί για αόριστες μεταβλητές
    const updatedDaneismos = await prisma.daneizetai.update({
      where: { id },
      data: {
        id_epafis: id_epafis ? parseInt(id_epafis) : existingLoan.id_epafis,
        id_eksoplismou: id_eksoplismou ? parseInt(id_eksoplismou) : existingLoan.id_eksoplismou,
        hmerominia_daneismou: hmerominia_daneismou ? new Date(hmerominia_daneismou) : existingLoan.hmerominia_daneismou,
        hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : existingLoan.hmerominia_epistrofis,
        katastasi_daneismou: katastasi_daneismou || existingLoan.katastasi_daneismou
      },
      include: {
        epafes: true,
        eksoplismos: true
      }
    });

    const borrowerName = updatedDaneismos.epafes
      ? `${updatedDaneismos.epafes.onoma || ''} ${updatedDaneismos.epafes.epitheto || ''}`.trim()
      : "Άγνωστο";

    res.json({
      id: updatedDaneismos.id,
      id_epafis: updatedDaneismos.id_epafis,
      id_eksoplismou: updatedDaneismos.id_eksoplismou,
      Name: borrowerName,
      nameeksoplismou: updatedDaneismos.eksoplismos?.onoma || "",
      hmerominia_daneismou: updatedDaneismos.hmerominia_daneismou,
      hmerominia_epistrofis: updatedDaneismos.hmerominia_epistrofis,
      katastasi_daneismou: updatedDaneismos.katastasi_daneismou,
      epafes: {
        id: updatedDaneismos.epafes?.id_epafis,
        id_epafis: updatedDaneismos.epafes?.id_epafis,
        fullName: borrowerName,
        onoma: updatedDaneismos.epafes?.onoma,
        epitheto: updatedDaneismos.epafes?.epitheto,
        email: updatedDaneismos.epafes?.email,
        tilefono: updatedDaneismos.epafes?.tilefono ? updatedDaneismos.epafes.tilefono.toString() : null
      },
      eksoplismos: {
        id: updatedDaneismos.eksoplismos?.id_eksoplismou,
        id_eksoplismou: updatedDaneismos.eksoplismos?.id_eksoplismou,
        onoma: updatedDaneismos.eksoplismos?.onoma,
        marka: updatedDaneismos.eksoplismos?.marka,
        xroma: updatedDaneismos.eksoplismos?.xroma,
        megethos: updatedDaneismos.eksoplismos?.megethos,
        hmerominia_kataskeuis: updatedDaneismos.eksoplismos?.hmerominia_kataskeuis
      }
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση δανεισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση δανεισμού" });
  }
});

// Ενημέρωση μόνο της κατάστασης δανεισμού
router.put("/daneismos/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { katastasi_daneismou } = req.body;
    
    if (!katastasi_daneismou) {
      return res.status(400).json({ error: "Η κατάσταση δανεισμού είναι υποχρεωτική" });
    }

    const updatedDaneismos = await prisma.daneizetai.update({
      where: { id },
      data: { katastasi_daneismou }
    });

    res.json({
      success: true,
      message: "Η κατάσταση δανεισμού ενημερώθηκε επιτυχώς",
      data: updatedDaneismos
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση κατάστασης δανεισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση κατάστασης δανεισμού" });
  }
});

// DELETE: Διαγραφή εξοπλισμού
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξοπλισμού" });
    }

    // Έλεγχος αν ο εξοπλισμός υπάρχει
    const existingEquipment = await prisma.eksoplismos.findUnique({
      where: { id_eksoplismou: id }
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: "Ο εξοπλισμός δεν βρέθηκε" });
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
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID δανεισμού" });
    }
    
    // Έλεγχος αν ο δανεισμός υπάρχει
    const existingLoan = await prisma.daneizetai.findUnique({
      where: { id }
    });

    if (!existingLoan) {
      return res.status(404).json({ error: "Ο δανεισμός δεν βρέθηκε" });
    }

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