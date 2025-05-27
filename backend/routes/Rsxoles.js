const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των σχολών
router.get("/", async (_req, res) => {
  try {
    const sxoles = await prisma.sxoli.findMany({
      include: {
        ekpaideuei: {
          include: {
            ekpaideutis: {
              include: {
                epafes: true
              }
            }
          }
        },
        parakolouthiseis: {
          include: {
            melos: {
              include: {
                epafes: true
              }
            }
          }
        }
      }
    });

    const serializedSxoles = sxoles.map((sxoli) => ({
      id: sxoli.id_sxolis,
      id_sxolis: sxoli.id_sxolis, 
      onoma: `${sxoli.klados || ""} ${sxoli.epipedo || ""} ${sxoli.etos || ""}`.trim(),
      klados: sxoli.klados || "",
      epipedo: sxoli.epipedo || "",
      timi: sxoli.timi || 0,
      etos: sxoli.etos || "",
      seira: sxoli.seira || "",
      topothesies: typeof sxoli.topothesies === "string" 
        ? JSON.parse(sxoli.topothesies) 
        : sxoli.topothesies || sxoli.topothesia || [],
      simmetoxes: sxoli.parakolouthiseis.length,
      details: {
        topothesia: sxoli.topothesies ? JSON.stringify(sxoli.topothesies) : "",
        imerominia_enarksis: sxoli.hmerominia_enarksis || null,
        imerominia_liksis: sxoli.hmerominia_liksis || null
      },
      ekpaideutes: sxoli.ekpaideuei.map((entry) => ({
        id: entry.ekpaideutis.id_ekpaideuti,
        firstName: entry.ekpaideutis.epafes?.onoma || "",
        lastName: entry.ekpaideutis.epafes?.epitheto || "",
        email: entry.ekpaideutis.epafes?.email || "",
        phone: entry.ekpaideutis.epafes?.tilefono ? entry.ekpaideutis.epafes.tilefono.toString() : "",
        epipedo: entry.ekpaideutis.epipedo || "", // Προσθήκη επιπέδου
        klados: entry.ekpaideutis.klados || ""    // Προσθήκη κλάδου
      }))
    }));

    res.json(serializedSxoles);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση σχολών:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση σχολών" });
  }
});

// GET: Λεπτομέρειες συγκεκριμένης σχολής
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    const sxoli = await prisma.sxoli.findUnique({
      where: { id_sxolis: id },
      include: {
        ekpaideuei: {
          include: {
            ekpaideutis: {
              include: {
                epafes: true
              }
            }
          }
        },
        parakolouthiseis: {
          include: {
            melos: {
              include: {
                epafes: true,
                esoteriko_melos: true,
                eksoteriko_melos: true
              }
            },
            katavalei: true
          }
        }
      }
    });

    if (!sxoli) {
      return res.status(404).json({ error: "Δεν βρέθηκε η σχολή" });
    }

    // Διαμορφώνουμε τα δεδομένα για το frontend
    const serializedSxoli = {
      id: sxoli.id_sxolis,
      id_sxolis: sxoli.id_sxolis, // Προσθήκη για συμβατότητα
      onoma: `${sxoli.klados || ""} ${sxoli.epipedo || ""} ${sxoli.etos || ""}`.trim(),
      klados: sxoli.klados || "",
      epipedo: sxoli.epipedo || "",
      timi: sxoli.timi || 0,
      etos: sxoli.etos || "",
      seira: sxoli.seira || "",
      // ΔΙΟΡΘΩΣΗ: Αλλαγή του πεδίου topothesies για συνέπεια με τα άλλα endpoints
      // Με fallback για διατήρηση συμβατότητας με παλιά δεδομένα
      topothesies: typeof sxoli.topothesies === "string" 
        ? JSON.parse(sxoli.topothesies) 
        : sxoli.topothesies || sxoli.topothesia || [],
      simmetexontes: sxoli.parakolouthiseis.map(p => ({
        id: p.id_parakolouthisis,
        id_melous: p.id_melous,
        firstName: p.melos?.epafes?.onoma || "",
        lastName: p.melos?.epafes?.epitheto || "",
        email: p.melos?.epafes?.email || "",
        phone: p.melos?.epafes?.tilefono ? p.melos.epafes.tilefono.toString() : "",
        tipo_melous: p.melos?.tipo_melous || "",
        arithmos_mitroou: p.melos?.esoteriko_melos?.arithmos_mitroou || p.melos?.eksoteriko_melos?.arithmos_mitroou || "",
        timi: p.timi || 0,
        katastasi: p.katastasi || "",
        ypoloipo: p.ypoloipo || 0,
        hmerominia_dilosis: p.hmerominia_dilosis || null,
        hmerominia_akirosis: p.hmerominia_akrirosis || null,
        // ΔΙΟΡΘΩΣΗ: Αλλαγή από 'pliromes' σε 'katavalei' για συνέπεια με το frontend
        katavalei: p.katavalei.map(k => ({
          id: k.id,
          id_katavalei: k.id,
          poso: k.poso || 0,
          hmerominia_katavolhs: k.hmerominia_katavolhs || null  // Διόρθωση του ονόματος πεδίου
        }))
      })),
      ekpaideutes: sxoli.ekpaideuei.map((entry) => ({
        id: entry.ekpaideutis.id_ekpaideuti,
        firstName: entry.ekpaideutis.epafes?.onoma || "",
        lastName: entry.ekpaideutis.epafes?.epitheto || "",
        email: entry.ekpaideutis.epafes?.email || "",
        phone: entry.ekpaideutis.epafes?.tilefono ? entry.ekpaideutis.epafes.tilefono.toString() : "",
        epipedo: entry.ekpaideutis.epipedo || "", // Προσθήκη επιπέδου
        klados: entry.ekpaideutis.klados || ""    // Προσθήκη κλάδου
      }))
    };

    res.json(serializedSxoli);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση λεπτομερειών σχολής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση λεπτομερειών σχολής" });
  }
});

// Τροποποίηση του POST endpoint - γραμμή ~154
router.post("/", async (req, res) => {
  try {
    const { 
      klados, epipedo, timi, etos, seira, 
      topothesies, 
      ekpaideutes 
    } = req.body;

    // Επανέφερε την ακολουθία ID πριν την εισαγωγή για να αποφευχθεί το σφάλμα μοναδικότητας
    await prisma.$executeRaw`SELECT setval('"Sxoli_id_sxolis_seq"', coalesce((SELECT MAX(id_sxolis) FROM "Sxoli"), 0))`;
    
    // Δημιουργούμε τη σχολή
    const newSxoli = await prisma.sxoli.create({
      data: {
        klados,
        epipedo,
        timi: timi ? parseInt(timi) : null,
        etos: etos ? parseInt(etos) : null,
        seira: seira ? parseInt(seira) : null,
        topothesies // Αποθήκευση του αντικειμένου απευθείας στο πεδίο
      }
    });

    // Προσθήκη εκπαιδευτών αν υπάρχουν - υπόλοιπος κώδικας παραμένει ως έχει
    if (ekpaideutes && ekpaideutes.length > 0) {
      for (const ekpaideutisId of ekpaideutes) {
        await prisma.ekpaideuei.create({
          data: {
            id_ekpaideuti: parseInt(ekpaideutisId),
            id_sxolis: newSxoli.id_sxolis
          }
        });
      }
    }

    res.status(201).json({
      id: newSxoli.id_sxolis,
      onoma: `${newSxoli.klados || ""} ${newSxoli.epipedo || ""} ${newSxoli.etos || ""}`.trim(),
      klados: newSxoli.klados || "",
      epipedo: newSxoli.epipedo || "",
      timi: newSxoli.timi || 0,
      etos: newSxoli.etos || "",
      seira: newSxoli.seira || ""
    });
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία σχολής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη δημιουργία σχολής" });
  }
});

// Διόρθωση για τη συνάρτηση update της σχολής

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    const { klados, epipedo, timi, etos, seira, topothesies } = req.body;

    // Ενημέρωση της σχολής με το JSON ως αντικείμενο
    const updatedSxoli = await prisma.sxoli.update({
      where: { id_sxolis: id },
      data: {
        klados,
        epipedo,
        timi: timi ? parseInt(timi) : null,
        etos: etos ? parseInt(etos) : null,
        seira: seira ? parseInt(seira) : null,
        // Διαχείριση του πεδίου topothesies ως JSON
        topothesies: topothesies // Το Prisma θα μετατρέψει αυτόματα το αντικείμενο σε JSON
      }
    });

    res.json({
      id_sxolis: updatedSxoli.id_sxolis, 
      onoma: `${updatedSxoli.klados || ""} ${updatedSxoli.epipedo || ""} ${updatedSxoli.etos || ""}`.trim(),
      klados: updatedSxoli.klados || "",
      epipedo: updatedSxoli.epipedo || "",
      timi: updatedSxoli.timi || 0,
      etos: updatedSxoli.etos || "",
      seira: updatedSxoli.seira || ""
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση σχολής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση σχολής" });
  }
});

// DELETE: Διαγραφή σχολής
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }

    // Check if school has related participants (parakolouthisi)
    const participantsCount = await prisma.parakolouthisi.count({
      where: { id_sxolis: id }
    });

  
    // Use transaction to maintain data integrity
    await prisma.$transaction(async (prisma) => {
      // 1. First delete all teacher-school relations (ekpaideuei)
      await prisma.ekpaideuei.deleteMany({
        where: { id_sxolis: id }
      });
      
      // 2. Delete the school itself
      await prisma.sxoli.delete({
        where: { id_sxolis: id }
      });
    });

    res.json({ success: true, message: "Η σχολή διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της σχολής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της σχολής" });
  }
});

// POST: Προσθήκη συμμετέχοντα σε σχολή
router.post("/:id/parakolouthisi", async (req, res) => {
  try {
    const id_sxolis = parseInt(req.params.id);
    if (isNaN(id_sxolis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID σχολής" });
    }

    const { id_melous, timi, katastasi } = req.body;
    if (!id_melous) {
      return res.status(400).json({ error: "Το ID μέλους είναι υποχρεωτικό" });
    }

    // Δημιουργία νέας παρακολούθησης
    const newParakolouthisi = await prisma.parakolouthisi.create({
      data: {
        id_melous: parseInt(id_melous),
        id_sxolis: id_sxolis,
        timi: timi ? parseInt(timi) : null,
        katastasi: katastasi || "Ενεργή",
        ypoloipo: timi ? parseInt(timi) : 0,
        hmerominia_dilosis: new Date(),
        hmerominia_akrirosis: null
      },
      include: {
        melos: {
          include: {
            epafes: true
          }
        }
      }
    });

    res.status(201).json({
      id: newParakolouthisi.id_parakolouthisis,
      id_melous: newParakolouthisi.id_melous,
      firstName: newParakolouthisi.melos?.epafes?.onoma || "",
      lastName: newParakolouthisi.melos?.epafes?.epitheto || "",
      timi: newParakolouthisi.timi || 0,
      katastasi: newParakolouthisi.katastasi || "",
      ypoloipo: newParakolouthisi.ypoloipo || 0,
      hmerominia_dilosis: newParakolouthisi.hmerominia_dilosis
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη παρακολούθησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη παρακολούθησης" });
  }
});

// POST: Προσθήκη πληρωμής για παρακολούθηση
router.post("/:id/parakolouthisi/:paraId/payment", async (req, res) => {
  try {
    const id_parakolouthisis = parseInt(req.params.paraId);
    if (isNaN(id_parakolouthisis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID παρακολούθησης" });
    }

    const { poso } = req.body;
    if (!poso) {
      return res.status(400).json({ error: "Το ποσό είναι υποχρεωτικό" });
    }

    // Βρίσκουμε την παρακολούθηση
    const parakolouthisi = await prisma.parakolouthisi.findUnique({
      where: { id_parakolouthisis }
    });

    if (!parakolouthisi) {
      return res.status(404).json({ error: "Δεν βρέθηκε η παρακολούθηση" });
    }

    // Δημιουργία νέας καταβολής
    const newPayment = await prisma.katavalei.create({
      data: {
        id_melous: parakolouthisi.id_melous,
        id_parakolouthisis: id_parakolouthisis,
        poso: parseInt(poso),
        hmerominia_katavolhs: new Date()
      }
    });

    // Ενημέρωση του υπολοίπου στην παρακολούθηση
    const allPayments = await prisma.katavalei.findMany({
      where: { id_parakolouthisis: id_parakolouthisis }
    });

    const totalPaid = allPayments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
    const newBalance = (parakolouthisi.timi || 0) - totalPaid;

    const updatedParakolouthisi = await prisma.parakolouthisi.update({
      where: { id_parakolouthisis },
      data: { 
        ypoloipo: newBalance >= 0 ? newBalance : 0 
      },
      include: {
        melos: {
          include: {
            epafes: true
          }
        },
        katavalei: true
      }
    });

    res.status(201).json({
      id: newPayment.id,
      poso: newPayment.poso,
      hmerominia: newPayment.hmerominia_katavolhs,
      parakolouthisi: {
        id: updatedParakolouthisi.id_parakolouthisis,
        ypoloipo: updatedParakolouthisi.ypoloipo,
        firstName: updatedParakolouthisi.melos?.epafes?.onoma || "",
        lastName: updatedParakolouthisi.melos?.epafes?.epitheto || ""
      }
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη πληρωμής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη πληρωμής" });
  }
});

// DELETE: Διαγραφή πληρωμής για παρακολούθηση
router.delete("/:id/parakolouthisi/:paraId/payment/:paymentId", async (req, res) => {
  try {
    const id_parakolouthisis = parseInt(req.params.paraId);
    const id_payment = parseInt(req.params.paymentId);
    
    if (isNaN(id_parakolouthisis) || isNaN(id_payment)) {
      return res.status(400).json({ error: "Μη έγκυρα IDs" });
    }
    
    // Έλεγχος αν η πληρωμή υπάρχει
    const payment = await prisma.katavalei.findFirst({
      where: { 
        id: id_payment,
        id_parakolouthisis: id_parakolouthisis
      }
    });

    if (!payment) {
      return res.status(404).json({ error: "Η πληρωμή δεν βρέθηκε" });
    }

    // Διαγραφή πληρωμής
    await prisma.katavalei.delete({
      where: { id: id_payment }
    });

    res.json({ 
      message: "Η πληρωμή διαγράφηκε"
    });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της πληρωμής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της πληρωμής" });
  }
});

// DELETE: Αφαίρεση συμμετέχοντα από σχολή
router.delete("/:id/parakolouthisi/:paraId", async (req, res) => {
  try {
    const id_parakolouthisis = parseInt(req.params.paraId);
    if (isNaN(id_parakolouthisis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID παρακολούθησης" });
    }

    // Έλεγχος αν έχουν γίνει πληρωμές
    const payments = await prisma.katavalei.findMany({
      where: { id_parakolouthisis }
    });

    // Διαγραφή πληρωμών
    if (payments.length > 0) {
      await prisma.katavalei.deleteMany({
        where: { id_parakolouthisis }
      });
    }

    // Διαγραφή παρακολούθησης
    await prisma.parakolouthisi.delete({
      where: { id_parakolouthisis }
    });

    res.json({ success: true, message: "Η παρακολούθηση διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή παρακολούθησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή παρακολούθησης" });
  }
});

// POST: Προσθήκη εκπαιδευτή σε σχολή
router.post("/:id/ekpaideutis", async (req, res) => {
  try {
    const id_sxolis = parseInt(req.params.id);
    const { id_ekpaideuti } = req.body;
    
    if (!id_ekpaideuti) {
      return res.status(400).json({ error: "Το ID εκπαιδευτή είναι υποχρεωτικό" });
    }
    
    // Έλεγχος αν η συσχέτιση υπάρχει ήδη
    const existing = await prisma.ekpaideuei.findUnique({
      where: {
        id_ekpaideuti_id_sxolis: {
          id_ekpaideuti: parseInt(id_ekpaideuti),
          id_sxolis
        }
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: "Ο εκπαιδευτής διδάσκει ήδη σε αυτή τη σχολή" });
    }
    
    // Δημιουργία της συσχέτισης
    const newRelation = await prisma.ekpaideuei.create({
      data: {
        id_ekpaideuti: parseInt(id_ekpaideuti),
        id_sxolis
      },
      include: {
        ekpaideutis: {
          include: {
            epafes: true
          }
        }
      }
    });
    
    res.status(201).json({
      id: newRelation.ekpaideutis.id_ekpaideuti,
      firstName: newRelation.ekpaideutis.epafes?.onoma || "",
      lastName: newRelation.ekpaideutis.epafes?.epitheto || "",
      email: newRelation.ekpaideutis.epafes?.email || "",
      phone: newRelation.ekpaideutis.epafes?.tilefono ? newRelation.ekpaideutis.epafes.tilefono.toString() : "",
      epipedo: newRelation.ekpaideutis.epipedo || "",
      klados: newRelation.ekpaideutis.klados || ""
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εκπαιδευτή σε σχολή:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη εκπαιδευτή σε σχολή" });
  }
});

// Στο backend/routes/Rsxoles.js - Endpoint για προσθήκη εκπαιδευτή σε σχολή
router.post("/:id_sxolis/ekpaideutis", async (req, res) => {
  try {
    const id_sxolis = parseInt(req.params.id_sxolis);
    const { id_ekpaideuti } = req.body; // Εδώ περιμένουμε το id_ekpaideuti
    
    if (isNaN(id_sxolis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID σχολής" });
    }
    
    if (!id_ekpaideuti && id_ekpaideuti !== 0) {
      return res.status(400).json({ error: "Το ID εκπαιδευτή είναι υποχρεωτικό" });
    }
    
    // ... υπόλοιπος κώδικας ...
  } catch (error) {
    // ... χειρισμός σφάλματος ...
  }
});

// DELETE: Αφαίρεση εκπαιδευτή από σχολή
router.delete("/:id/ekpaideutis/:teacherId", async (req, res) => {
  try {
    const id_sxolis = parseInt(req.params.id);
    const id_ekpaideuti = parseInt(req.params.teacherId);
    
    if (isNaN(id_sxolis) || isNaN(id_ekpaideuti)) {
      return res.status(400).json({ error: "Μη έγκυρα IDs" });
    }
    
    // Έλεγχος αν η συσχέτιση υπάρχει
    const existingRelation = await prisma.ekpaideuei.findFirst({
      where: {
        id_sxolis: id_sxolis,
        id_ekpaideuti: id_ekpaideuti
      }
    });

    if (!existingRelation) {
      return res.status(404).json({ 
        error: "Δεν βρέθηκε η συσχέτιση εκπαιδευτή με τη σχολή" 
      });
    }

    // Διαγραφή της συσχέτισης
    await prisma.ekpaideuei.deleteMany({
      where: {
        id_sxolis: id_sxolis,
        id_ekpaideuti: id_ekpaideuti
      }
    });

    res.json({ 
      success: true, 
      message: "Ο εκπαιδευτής αφαιρέθηκε με επιτυχία από τη σχολή" 
    });
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση εκπαιδευτή από σχολή:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την αφαίρεση εκπαιδευτή από σχολή" 
    });
  }
});

// GET: Λήψη όλων των συμμετεχόντων μιας σχολής
router.get("/:id/parakolouthisi", async (req, res) => {
  try {
    const id_sxolis = parseInt(req.params.id);
    if (isNaN(id_sxolis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID σχολής" });
    }

    const parakolouthiseis = await prisma.parakolouthisi.findMany({
      where: { id_sxolis },
      include: {
        melos: {
          include: {
            epafes: true,
            esoteriko_melos: true,
            eksoteriko_melos: true
          }
        },
        katavalei: true
      },
      orderBy: { hmerominia_dilosis: 'desc' }
    });

    // Μορφοποίηση για το frontend
    const formattedParakolouthiseis = parakolouthiseis.map(p => ({
      id_parakolouthisis: p.id_parakolouthisis,
      id_melous: p.id_melous,
      id_sxolis: p.id_sxolis,
      timi: p.timi,
      katastasi: p.katastasi || "Ενεργή",
      ypoloipo: p.ypoloipo || 0,
      hmerominia_dilosis: p.hmerominia_dilosis,
      hmerominia_akrirosis: p.hmerominia_akrirosis,
      melos: p.melos ? {
        epafes: p.melos.epafes ? {
          onoma: p.melos.epafes.onoma || "",
          epitheto: p.melos.epafes.epitheto || "",
          email: p.melos.epafes.email || "",
          tilefono: p.melos.epafes.tilefono ? p.melos.epafes.tilefono.toString() : "",
        } : null,
        tipo_melous: p.melos.tipo_melous || "",
        esoteriko_melos: p.melos.esoteriko_melos,
        eksoteriko_melos: p.melos.eksoteriko_melos
      } : null,
      katavalei: (p.katavalei || []).map(k => ({
        id: k.id,  // Ensure ID is included
        id_katavalei: k.id,  // Add this for consistency
        poso: k.poso || 0,
        hmerominia_katavolhs: k.hmerominia_katavolhs
      }))
    }));

    res.json(formattedParakolouthiseis);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση παρακολουθήσεων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση παρακολουθήσεων" });
  }
});

// Διαγραφή εκπαιδευτή
router.delete("/ekpaideutis/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Epafes (θα διαγράψει και τον Ekpaideutis λόγω CASCADE)
    await prisma.epafes.delete({
      where: { id_epafis: id }
    });

    res.json({ success: true, message: "Ο εκπαιδευτής διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή εκπαιδευτή:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή εκπαιδευτή" });
  }
});

// Ενημέρωση εκπαιδευτή
router.put("/ekpaideutis/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { onoma, epitheto, email, tilefono, epipedo, klados } = req.body;

    // Epafes
    const updatedEpafes = await prisma.epafes.update({
      where: { id_epafis: id },
      data: { 
        onoma,
        epitheto,
        email,
        tilefono: tilefono ? BigInt(tilefono) : null 
      }
    });

    // Ekpaideutis
    const updatedEkpaideutis = await prisma.ekpaideutis.update({
      where: { id_ekpaideuti: id },
      data: {
        epipedo,
        klados
      }
    });

    res.json({
      ...updatedEpafes,
      epipedo: updatedEkpaideutis.epipedo,
      klados: updatedEkpaideutis.klados
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση εκπαιδευτή:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση εκπαιδευτή" });
  }
});

// PUT: Ενημέρωση συμμετέχοντα σε σχολή
router.put("/:id/parakolouthisi/:paraId", async (req, res) => {
  try {
    const id_parakolouthisis = parseInt(req.params.paraId);
    if (isNaN(id_parakolouthisis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID παρακολούθησης" });
    }

    const { timi, katastasi } = req.body;
    
    // Έλεγχος αν υπάρχει η παρακολούθηση
    const parakolouthisi = await prisma.parakolouthisi.findUnique({
      where: { id_parakolouthisis },
      include: { katavalei: true }
    });
    
    if (!parakolouthisi) {
      return res.status(404).json({ error: "Δεν βρέθηκε η παρακολούθηση" });
    }

    // Υπολογισμός νέου υπολοίπου
    const totalPaid = (parakolouthisi.katavalei || []).reduce(
      (sum, payment) => sum + (payment.poso || 0), 
      0
    );
    
    const newTimi = timi !== undefined ? parseInt(timi) : parakolouthisi.timi;
    const newBalance = Math.max(0, newTimi - totalPaid);

    // Ενημέρωση συμμετέχοντα
    const updatedParakolouthisi = await prisma.parakolouthisi.update({
      where: { id_parakolouthisis },
      data: {
        timi: newTimi,
        katastasi: katastasi || parakolouthisi.katastasi,
        ypoloipo: newBalance
      }
    });

    res.json({
      id_parakolouthisis: updatedParakolouthisi.id_parakolouthisis,
      timi: updatedParakolouthisi.timi,
      katastasi: updatedParakolouthisi.katastasi,
      ypoloipo: updatedParakolouthisi.ypoloipo
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση παρακολούθησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση παρακολούθησης" });
  }
});

// GET: Λήψη διαθέσιμων μελών για σχολές (εσωτερικά και εξωτερικά)
router.get("/:id/available-members", async (req, res) => {
  try {
    const id_sxolis = parseInt(req.params.id);
    if (isNaN(id_sxolis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID σχολής" });
    }

    // Βρίσκουμε τα IDs των μελών που είναι ήδη συμμετέχοντες στη σχολή
    const existingParticipants = await prisma.parakolouthisi.findMany({
      where: { id_sxolis },
      select: { id_melous: true }
    });
    
    const existingMemberIds = new Set(existingParticipants.map(p => p.id_melous));

    // Βρίσκουμε όλα τα μέλη (και εσωτερικά και εξωτερικά)
    const allMembers = await prisma.melos.findMany({
      include: {
        epafes: true,
        esoteriko_melos: {
          include: {
            sindromitis: true
          }
        },
        eksoteriko_melos: true
      }
    });

    // Φιλτράρουμε για να πάρουμε μόνο τα διαθέσιμα μέλη
    const availableMembers = allMembers.filter(member => !existingMemberIds.has(member.id_melous));

    // Μορφοποιούμε τα δεδομένα για το frontend
    const formattedMembers = availableMembers.map(member => ({
      id_melous: member.id_melous,
      tipo_melous: member.tipo_melous,
      onoma: member.epafes?.onoma || "",
      epitheto: member.epafes?.epitheto || "",
      email: member.epafes?.email || "",
      tilefono: member.epafes?.tilefono?.toString() || "",
      esoteriko_melos: member.esoteriko_melos,
      eksoteriko_melos: member.eksoteriko_melos,
      member_type: member.eksoteriko_melos ? "Εξωτερικό" : "Εσωτερικό"
    }));

    res.json(formattedMembers);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση διαθέσιμων μελών:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση διαθέσιμων μελών" });
  }
});

module.exports = router;