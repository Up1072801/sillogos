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
        quantity: item.quantity || 1, // Add this line to include the quantity field
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

    // Group loans by borrower and date
    const groupedLoans = {};
    
    daneismoi.forEach(loan => {
      // Create a unique key using borrower ID and loan date
      const loanDate = loan.hmerominia_daneismou ? 
        new Date(loan.hmerominia_daneismou).toISOString().split('T')[0] : 'nodate';
      const returnDate = loan.hmerominia_epistrofis ? 
        new Date(loan.hmerominia_epistrofis).toISOString().split('T')[0] : 'nodate';
      const status = loan.katastasi_daneismou || 'Σε εκκρεμότητα';
      
      // Create a key that groups by borrower, loan date, return date, and status
      const key = `${loan.id_epafis}_${loanDate}_${returnDate}_${status}`;
      
      if (!groupedLoans[key]) {
        // Create a new grouped loan entry
        groupedLoans[key] = {
          id: `group_${key}`,
          id_epafis: loan.id_epafis,
          hmerominia_daneismou: loan.hmerominia_daneismou,
          hmerominia_epistrofis: loan.hmerominia_epistrofis,
          katastasi_daneismou: status,
          borrowerName: loan.epafes ? 
            `${loan.epafes.onoma || ''} ${loan.epafes.epitheto || ''}`.trim() : 
            "Άγνωστο",
          isGrouped: true,
          equipment_items: [{
            id: loan.id,
            id_eksoplismou: loan.id_eksoplismou,
            equipmentName: loan.eksoplismos?.onoma || "Άγνωστο",
            quantity: loan.quantity || 1,
            eksoplismos: loan.eksoplismos
          }],
          epafes: loan.epafes
        };
      } else {
        // Add this item to the existing group
        groupedLoans[key].equipment_items.push({
          id: loan.id,
          id_eksoplismou: loan.id_eksoplismou,
          equipmentName: loan.eksoplismos?.onoma || "Άγνωστο",
          quantity: loan.quantity || 1,
          eksoplismos: loan.eksoplismos
        });
      }
    });

    // Convert the grouped loans object to an array
    const formattedDaneismoi = Object.values(groupedLoans).map(loan => {
      // Create a summary of equipment for display
      const equipmentSummary = loan.equipment_items.map(item => 
        `${item.equipmentName} (${item.quantity})`
      ).join(", ");
      
      return {
        ...loan,
        equipmentName: equipmentSummary
      };
    });

    res.json(formattedDaneismoi);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των δανεισμών:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των δανεισμών" });
  }
});

// POST: Προσθήκη νέου εξοπλισμού
router.post("/", async (req, res) => {
  try {
    const { onoma, marka, xroma, megethos, hmerominia_kataskeuis, quantity } = req.body;

    // Έλεγχος αν τα απαραίτητα πεδία υπάρχουν
    if (!onoma) {
      return res.status(400).json({ error: "Το όνομα εξοπλισμού είναι υποχρεωτικό" });
    }

    // Επανέφερε την ακολουθία ID πριν την εισαγωγή
    await prisma.$executeRaw`SELECT setval('"Eksoplismos_id_eksoplismou_seq"', GREATEST(coalesce((SELECT MAX(id_eksoplismou) FROM "Eksoplismos"), 0), 1))`;
    
    const newEksoplismos = await prisma.eksoplismos.create({
      data: {
        onoma,
        marka: marka || "",
        xroma: xroma || "",
        megethos: megethos || "",
        hmerominia_kataskeuis: hmerominia_kataskeuis ? new Date(hmerominia_kataskeuis) : null,
        quantity: quantity ? parseInt(quantity) : 1
      }
    });

    // Rest of the function remains the same

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
    const { id_epafis, id_eksoplismou, hmerominia_daneismou, hmerominia_epistrofis, katastasi_daneismou, quantity } = req.body;

    // Validate dates
    if (hmerominia_daneismou && hmerominia_epistrofis) {
      const borrowDate = new Date(hmerominia_daneismou);
      const returnDate = new Date(hmerominia_epistrofis);
      
      if (returnDate < borrowDate) {
        return res.status(400).json({ 
          error: "Η ημερομηνία επιστροφής δεν μπορεί να είναι πριν την ημερομηνία δανεισμού" 
        });
      }
    }
    
    // Check if equipment exists
    const equipment = await prisma.eksoplismos.findUnique({
      where: { id_eksoplismou: parseInt(id_eksoplismou) },
    });
    
    if (!equipment) {
      return res.status(404).json({ error: "Ο εξοπλισμός δεν βρέθηκε" });
    }
    
    // REMOVED: All availability checks are removed

    // Create the loan with quantity
    const newDaneismos = await prisma.daneizetai.create({
      data: {
        id_epafis: parseInt(id_epafis),
        id_eksoplismou: parseInt(id_eksoplismou),
        hmerominia_daneismou: hmerominia_daneismou ? new Date(hmerominia_daneismou) : new Date(),
        hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : null,
        katastasi_daneismou: katastasi_daneismou || "Σε εκκρεμότητα",
        quantity: parseInt(quantity) || 1
      },
      include: {
        epafes: true,
        eksoplismos: true
      }
    });

    // Rest of the function remains unchanged...
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
    
    const { onoma, marka, xroma, megethos, hmerominia_kataskeuis, quantity } = req.body;

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
          : existingEquipment.hmerominia_kataskeuis,
        quantity: quantity !== undefined ? parseInt(quantity) : existingEquipment.quantity
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
    const { id_epafis, id_eksoplismou, hmerominia_daneismou, hmerominia_epistrofis, katastasi_daneismou, quantity } = req.body;

    // Validate dates (keep this validation)
    if (hmerominia_daneismou && hmerominia_epistrofis) {
      const borrowDate = new Date(hmerominia_daneismou);
      const returnDate = new Date(hmerominia_epistrofis);
      
      if (returnDate < borrowDate) {
        return res.status(400).json({ 
          error: "Η ημερομηνία επιστροφής δεν μπορεί να είναι πριν την ημερομηνία δανεισμού" 
        });
      }
    }

    // Find the existing loan
    const existingLoan = await prisma.daneizetai.findUnique({
      where: { id }
    });

    if (!existingLoan) {
      return res.status(404).json({ error: "Ο δανεισμός δεν βρέθηκε" });
    }

    // REMOVED: All quantity availability checks are removed

    // Update the loan
    const updatedDaneismos = await prisma.daneizetai.update({
      where: { id },
      data: {
        id_epafis: id_epafis ? parseInt(id_epafis) : existingLoan.id_epafis,
        id_eksoplismou: id_eksoplismou ? parseInt(id_eksoplismou) : existingLoan.id_eksoplismou,
        hmerominia_daneismou: hmerominia_daneismou ? new Date(hmerominia_daneismou) : existingLoan.hmerominia_daneismou,
        hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : existingLoan.hmerominia_epistrofis,
        katastasi_daneismou: katastasi_daneismou || existingLoan.katastasi_daneismou,
        quantity: quantity ? parseInt(quantity) : (existingLoan.quantity || 1)
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
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση δανεισμού", details: error.message });
  }
});

// POST: Προσθήκη δανεισμού με πολλαπλό εξοπλισμό
router.post("/daneismos-multi", async (req, res) => {
  try {
    const { id_epafis, equipment_items, hmerominia_daneismou, hmerominia_epistrofis, katastasi_daneismou } = req.body;
    
    if (!id_epafis || !equipment_items || !Array.isArray(equipment_items) || equipment_items.length === 0) {
      return res.status(400).json({ 
        error: "Απαιτείται επαφή και τουλάχιστον ένα είδος εξοπλισμού." 
      });
    }
    
    // Validate dates (keep this validation)
    if (hmerominia_daneismou && hmerominia_epistrofis) {
      const borrowDate = new Date(hmerominia_daneismou);
      const returnDate = new Date(hmerominia_epistrofis);
      
      if (returnDate < borrowDate) {
        return res.status(400).json({ 
          error: "Η ημερομηνία επιστροφής δεν μπορεί να είναι πριν την ημερομηνία δανεισμού" 
        });
      }
    }
    
    // REMOVED: All equipment availability checks
    
    // Create all loans in a transaction
    const createdLoans = await prisma.$transaction(async (prismaTransaction) => {
      const loans = [];
      
      for (const item of equipment_items) {
        const { id_eksoplismou, quantity } = item;
        
        // Verify only that the equipment exists
        const equipment = await prismaTransaction.eksoplismos.findUnique({
          where: { id_eksoplismou: parseInt(id_eksoplismou) },
        });
        
        if (!equipment) {
          throw new Error(`Ο εξοπλισμός με ID ${id_eksoplismou} δεν βρέθηκε`);
        }
        
        const newLoan = await prismaTransaction.daneizetai.create({
          data: {
            id_epafis: parseInt(id_epafis),
            id_eksoplismou: parseInt(id_eksoplismou),
            hmerominia_daneismou: hmerominia_daneismou ? new Date(hmerominia_daneismou) : new Date(),
            hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : null,
            katastasi_daneismou: katastasi_daneismou || "Σε εκκρεμότητα",
            quantity: parseInt(quantity) || 1
          },
          include: {
            epafes: true,
            eksoplismos: true
          }
        });
        
        loans.push(newLoan);
      }
      
      return loans;
    });
    
    // Format the response
    const formattedLoans = createdLoans.map(loan => {
      const borrowerName = `${loan.epafes?.onoma || ""} ${loan.epafes?.epitheto || ""}`.trim();
      
      return {
        id: loan.id,
        id_epafis: loan.id_epafis,
        id_eksoplismou: loan.id_eksoplismou,
        borrowerName,
        equipmentName: loan.eksoplismos?.onoma || "",
        hmerominia_daneismou: loan.hmerominia_daneismou,
        hmerominia_epistrofis: loan.hmerominia_epistrofis,
        katastasi_daneismou: loan.katastasi_daneismou,
        quantity: loan.quantity,
        epafes: loan.epafes,
        eksoplismos: loan.eksoplismos
      };
    });
    
    res.status(201).json({
      success: true,
      message: `Δημιουργήθηκαν ${formattedLoans.length} δανεισμοί`,
      data: formattedLoans
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη δανεισμών:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη δανεισμών", details: error.message });
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
      where: { id_eksoplismou: id },
      include: { daneizetai: true }
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: "Ο εξοπλισμός δεν βρέθηκε" });
    }

    // Έλεγχος αν υπάρχουν σχετικοί δανεισμοί
    if (existingEquipment.daneizetai && existingEquipment.daneizetai.length > 0) {
      // Υπάρχει τουλάχιστον ένας δανεισμός - διαγραφή με transaction
      await prisma.$transaction(async (prisma) => {
        // Διαγραφή όλων των δανεισμών αυτού του εξοπλισμού
        await prisma.daneizetai.deleteMany({
          where: { id_eksoplismou: id }
        });
        
        // Τώρα διαγραφή του εξοπλισμού
        await prisma.eksoplismos.delete({
          where: { id_eksoplismou: id }
        });
      });
    } else {
      // Δεν υπάρχουν δανεισμοί, απλή διαγραφή
      await prisma.eksoplismos.delete({
        where: { id_eksoplismou: id }
      });
    }

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

// PUT: Ομαδική ενημέρωση δανεισμών με κοινό δανειστή και ημερομηνίες
router.put("/daneismos-group/update", async (req, res) => {
  try {
    const { id_epafis, hmerominia_daneismou, hmerominia_epistrofis, katastasi_daneismou, equipment_ids } = req.body;
    
    if (!id_epafis || !Array.isArray(equipment_ids) || equipment_ids.length === 0) {
      return res.status(400).json({ 
        error: "Απαιτούνται: ID επαφής και τουλάχιστον ένα ID δανεισμού" 
      });
    }
    
    // Μετατροπή ημερομηνιών
    let borrowDate = null;
    let returnDate = null;
    
    if (hmerominia_daneismou) {
      borrowDate = new Date(hmerominia_daneismou);
    }
    
    if (hmerominia_epistrofis) {
      returnDate = new Date(hmerominia_epistrofis);
    }
    
    // Έλεγχος εγκυρότητας ημερομηνιών
    if (borrowDate && returnDate && returnDate < borrowDate) {
      return res.status(400).json({ 
        error: "Η ημερομηνία επιστροφής δεν μπορεί να είναι πριν την ημερομηνία δανεισμού" 
      });
    }
    
    // Ενημέρωση όλων των δανεισμών
    const updatedLoans = await prisma.$transaction(async (prismaTransaction) => {
      const updates = [];
      
      // Μετατροπή των IDs σε αριθμούς
      const loanIds = equipment_ids.map(id => {
        const numId = parseInt(id);
        return isNaN(numId) ? null : numId;
      }).filter(id => id !== null);
      
      // Ενημέρωση κάθε δανεισμού
      for (const loanId of loanIds) {
        const updatedLoan = await prismaTransaction.daneizetai.update({
          where: { id: loanId },
          data: {
            katastasi_daneismou: katastasi_daneismou,
            hmerominia_epistrofis: returnDate || undefined
          },
          include: {
            epafes: true,
            eksoplismos: true
          }
        });
        
        updates.push(updatedLoan);
      }
      
      return updates;
    });
    
    res.json({
      success: true,
      message: `Ενημερώθηκαν ${updatedLoans.length} δανεισμοί`,
      data: updatedLoans
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ομαδική ενημέρωση δανεισμών:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ομαδική ενημέρωση δανεισμών", 
      details: error.message 
    });
  }
});

module.exports = router;