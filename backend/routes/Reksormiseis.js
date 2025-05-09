const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των εξορμήσεων
router.get("/", async (req, res) => {
  try {
    const eksormiseis = await prisma.eksormisi.findMany({
      include: {
        drastiriotita: {
          include: {
            vathmos_diskolias: true,
            simmetoxi: true
          }
        }
      }
    });

    const serializedEksormiseis = eksormiseis.map(eksormisi => {
      // Υπολογισμός συνολικού αριθμού συμμετεχόντων
      const participantsCount = eksormisi.drastiriotita?.reduce((total, dr) => 
        total + (dr.simmetoxi?.length || 0), 0) || 0;

      return {
        id: eksormisi.id_eksormisis,
        id_eksormisis: eksormisi.id_eksormisis,
        titlos: eksormisi.titlos || "",
        proorismos: eksormisi.proorismos || "",
        timi: parseInt(eksormisi.timi || 0),
        hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: eksormisi.hmerominia_afiksis,
        participantsCount: participantsCount,
        drastiriotites: eksormisi.drastiriotita?.map(dr => ({
          id: dr.id_drastiriotitas,
          id_drastiriotitas: dr.id_drastiriotitas,
          titlos: dr.titlos || "",
          hmerominia: dr.hmerominia,
          vathmos_diskolias: dr.vathmos_diskolias
            ? {
                id_vathmou_diskolias: dr.vathmos_diskolias.id_vathmou_diskolias,
                epipedo: dr.vathmos_diskolias.epipedo
              }
            : null
        })) || []
      };
    });

    console.log("API sending data:", serializedEksormiseis);
    res.json(serializedEksormiseis);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των εξορμήσεων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των εξορμήσεων" });
  }
});

// GET: Ανάκτηση λεπτομερειών εξόρμησης
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }
    
    const eksormisi = await prisma.eksormisi.findUnique({
      where: { id_eksormisis: id },
      include: {
        drastiriotita: {
          include: {
            vathmos_diskolias: true
          }
        }
      },
    });

    if (!eksormisi) {
      return res.status(404).json({ error: "Η εξόρμηση δεν βρέθηκε" });
    }

    const serializedEksormisi = {
      id: eksormisi.id_eksormisis,
      id_eksormisis: eksormisi.id_eksormisis,
      titlos: eksormisi.titlos,
      proorismos: eksormisi.proorismos,
      timi: eksormisi.timi,
      hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis,
      hmerominia_afiksis: eksormisi.hmerominia_afiksis,
      drastiriotites: eksormisi.drastiriotita.map((drastiriotita) => ({
        id: drastiriotita.id_drastiriotitas,
        id_drastiriotitas: drastiriotita.id_drastiriotitas,
        titlos: drastiriotita.titlos,
        ores_poreias: drastiriotita.ores_poreias,
        diafora_ipsous: drastiriotita.diafora_ipsous,
        megisto_ipsometro: drastiriotita.megisto_ipsometro,
        hmerominia: drastiriotita.hmerominia,
        id_vathmou_diskolias: drastiriotita.id_vathmou_diskolias,
        vathmos_diskolias: drastiriotita.vathmos_diskolias
          ? {
              id_vathmou_diskolias: drastiriotita.vathmos_diskolias.id_vathmou_diskolias,
              onoma: drastiriotita.vathmos_diskolias.onoma,
              perigrafi: drastiriotita.vathmos_diskolias.perigrafi
            }
          : null
      })),
    };

    res.json(serializedEksormisi);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση της εξόρμησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση της εξόρμησης" });
  }
});

// GET: Ανάκτηση δραστηριοτήτων εξόρμησης
router.get("/:id/drastiriotites", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }
    
    const drastiriotites = await prisma.drastiriotita.findMany({
      where: { id_eksormisis: id },
      include: {
        vathmos_diskolias: true
      }
    });

    const serializedDrastiriotites = drastiriotites.map(drastiriotita => ({
      id: drastiriotita.id_drastiriotitas,
      id_drastiriotitas: drastiriotita.id_drastiriotitas,
      id_eksormisis: drastiriotita.id_eksormisis,
      titlos: drastiriotita.titlos,
      ores_poreias: drastiriotita.ores_poreias,
      diafora_ipsous: drastiriotita.diafora_ipsous,
      megisto_ipsometro: drastiriotita.megisto_ipsometro,
      hmerominia: drastiriotita.hmerominia,
      id_vathmou_diskolias: drastiriotita.id_vathmou_diskolias,
      vathmos_diskolias: drastiriotita.vathmos_diskolias
        ? {
            id_vathmou_diskolias: drastiriotita.vathmos_diskolias.id_vathmou_diskolias,
            onoma: drastiriotita.vathmos_diskolias.onoma,
            perigrafi: drastiriotita.vathmos_diskolias.perigrafi
          }
        : null
    }));

    res.json(serializedDrastiriotites);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των δραστηριοτήτων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των δραστηριοτήτων" });
  }
});

// GET: Ανάκτηση λεπτομερειών δραστηριότητας
router.get("/drastiriotita/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID δραστηριότητας" });
    }
    
    const drastiriotita = await prisma.drastiriotita.findUnique({
      where: { id_drastiriotitas: id },
      include: {
        vathmos_diskolias: true,
        eksormisi: true
      }
    });

    if (!drastiriotita) {
      return res.status(404).json({ error: "Η δραστηριότητα δεν βρέθηκε" });
    }

    const serializedDrastiriotita = {
      id: drastiriotita.id_drastiriotitas,
      id_drastiriotitas: drastiriotita.id_drastiriotitas,
      id_eksormisis: drastiriotita.id_eksormisis,
      titlos: drastiriotita.titlos,
      ores_poreias: drastiriotita.ores_poreias,
      diafora_ipsous: drastiriotita.diafora_ipsous,
      megisto_ipsometro: drastiriotita.megisto_ipsometro,
      hmerominia: drastiriotita.hmerominia,
      id_vathmou_diskolias: drastiriotita.id_vathmou_diskolias,
      vathmos_diskolias: drastiriotita.vathmos_diskolias
        ? {
            id_vathmou_diskolias: drastiriotita.vathmos_diskolias.id_vathmou_diskolias,
            onoma: drastiriotita.vathmos_diskolias.onoma,
            perigrafi: drastiriotita.vathmos_diskolias.perigrafi
          }
        : null,
      eksormisi: drastiriotita.eksormisi
        ? {
            id: drastiriotita.eksormisi.id_eksormisis,
            id_eksormisis: drastiriotita.eksormisi.id_eksormisis,
            titlos: drastiriotita.eksormisi.titlos,
            proorismos: drastiriotita.eksormisi.proorismos,
            timi: drastiriotita.eksormisi.timi,
            hmerominia_anaxorisis: drastiriotita.eksormisi.hmerominia_anaxorisis,
            hmerominia_afiksis: drastiriotita.eksormisi.hmerominia_afiksis
          }
        : null
    };

    res.json(serializedDrastiriotita);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση της δραστηριότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση της δραστηριότητας" });
  }
});

// GET: Ανάκτηση συμμετεχόντων εξόρμησης
router.get("/:id/simmetexontes", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }
    
    const drastiriotites = await prisma.drastiriotita.findMany({
      where: { id_eksormisis: id },
      select: { id_drastiriotitas: true }
    });

    const drastiriotitesIds = drastiriotites.map(d => d.id_drastiriotitas);

    const simmetexontes = await prisma.simmetoxi.findMany({
      where: { id_drastiriotitas: { in: drastiriotitesIds } },
      include: {
        melos: {
          include: {
            epafes: true
          }
        },
        plironei: true,
        drastiriotita: true
      }
    });

    const groupedSimmetexontes = [];
    const processedMembers = new Set();

    for (const simmetoxi of simmetexontes) {
      const memberId = simmetoxi.id_melous;
      
      if (!processedMembers.has(memberId)) {
        processedMembers.add(memberId);
        
        // Βρίσκουμε όλες τις συμμετοχές του μέλους σε δραστηριότητες αυτής της εξόρμησης
        const memberSimmetoxes = simmetexontes.filter(s => s.id_melous === memberId);
        
        // Υπολογίζουμε το συνολικό ποσό πληρωμών
        const totalPaid = memberSimmetoxes.reduce((sum, s) => 
          sum + s.plironei.reduce((pSum, p) => pSum + (p.poso_pliromis || 0), 0), 0);
        
        // Υπολογίζουμε το συνολικό κόστος συμμετοχής
        const totalCost = memberSimmetoxes.reduce((sum, s) => sum + (s.timi || 0), 0);
        
        // Υπολογίζουμε το υπόλοιπο
        const ypoloipo = totalCost - totalPaid;

        // Δημιουργούμε ένα αντικείμενο για το μέλος με όλες τις συμμετοχές του
        groupedSimmetexontes.push({
          id_simmetoxis: memberSimmetoxes[0].id_simmetoxis, // Χρησιμοποιούμε το ID της πρώτης συμμετοχής
          id_melous: memberId,
          timi: totalCost,
          ypoloipo: ypoloipo,
          katastasi: memberSimmetoxes[0].katastasi || "Ενεργή", // Χρησιμοποιούμε την κατάσταση της πρώτης συμμετοχής
          hmerominia_dilosis: memberSimmetoxes[0].hmerominia_dilosis,
          memberName: `${simmetoxi.melos.epafes?.onoma || ''} ${simmetoxi.melos.epafes?.epitheto || ''}`.trim() || "Άγνωστο",
          melos: simmetoxi.melos,
          simmetoxes: memberSimmetoxes.map(s => ({
            id_simmetoxis: s.id_simmetoxis,
            id_drastiriotitas: s.id_drastiriotitas,
            timi: s.timi,
            katastasi: s.katastasi,
            hmerominia_dilosis: s.hmerominia_dilosis,
            drastiriotita: s.drastiriotita
              ? {
                  id_drastiriotitas: s.drastiriotita.id_drastiriotitas,
                  titlos: s.drastiriotita.titlos
                }
              : null
          })),
          katavalei: memberSimmetoxes.flatMap(s => s.plironei.map(p => ({
            id: p.id,
            id_melous: p.id_melous,
            id_simmetoxis: p.id_simmetoxis,
            poso: p.poso_pliromis,
            hmerominia_katavolhs: p.hmerominia_pliromis
          })))
        });
      }
    }

    res.json(groupedSimmetexontes);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των συμμετεχόντων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των συμμετεχόντων" });
  }
});

// GET: Ανάκτηση συμμετεχόντων δραστηριότητας
router.get("/drastiriotita/:id/simmetexontes", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID δραστηριότητας" });
    }
    
    const simmetexontes = await prisma.simmetoxi.findMany({
      where: { id_drastiriotitas: id },
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true // Σιγουρέψου ότι υπάρχει αυτή η γραμμή
          }
        },
        plironei: true
      }
    });

    const serializedSimmetexontes = simmetexontes.map(simmetoxi => {
      // Υπολογισμός συνολικού ποσού πληρωμών
      const totalPaid = simmetoxi.plironei.reduce((sum, p) => sum + (p.poso_pliromis || 0), 0);
      
      // Υπολογισμός υπολοίπου
      const ypoloipo = (simmetoxi.timi || 0) - totalPaid;

      return {
        id_simmetoxis: simmetoxi.id_simmetoxis,
        id_melous: simmetoxi.id_melous,
        id_drastiriotitas: simmetoxi.id_drastiriotitas,
        timi: simmetoxi.timi,
        ypoloipo: ypoloipo,
        katastasi: simmetoxi.katastasi || "Ενεργή",
        hmerominia_dilosis: simmetoxi.hmerominia_dilosis,
        hmerominia_akirosis: simmetoxi.hmerominia_akirosis,
        memberName: `${simmetoxi.melos.epafes?.onoma || ''} ${simmetoxi.melos.epafes?.epitheto || ''}`.trim() || "Άγνωστο",
        melos: {
          id_melous: simmetoxi.melos.id_melous,
          tipo_melous: simmetoxi.melos.tipo_melous,
          id_vathmou_diskolias: simmetoxi.melos.id_vathmou_diskolias,
          vathmos_diskolias: simmetoxi.melos.vathmos_diskolias ? {
            id_vathmou_diskolias: simmetoxi.melos.vathmos_diskolias.id_vathmou_diskolias,
            onoma: simmetoxi.melos.vathmos_diskolias.onoma,
            perigrafi: simmetoxi.melos.vathmos_diskolias.perigrafi
          } : null,
          epafes: simmetoxi.melos.epafes ? {
            id_epafis: simmetoxi.melos.epafes.id_epafis,
            onoma: simmetoxi.melos.epafes.onoma,
            epitheto: simmetoxi.melos.epafes.epitheto,
            email: simmetoxi.melos.epafes.email,
            tilefono: simmetoxi.melos.epafes.tilefono ? simmetoxi.melos.epafes.tilefono.toString() : null
          } : null
        },
        katavalei: simmetoxi.plironei.map(p => ({
          id: p.id,
          id_melous: p.id_melous,
          id_simmetoxis: p.id_simmetoxis,
          poso: p.poso_pliromis,
          hmerominia_katavolhs: p.hmerominia_pliromis
        }))
      };
    });

    res.json(serializedSimmetexontes);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των συμμετεχόντων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των συμμετεχόντων" });
  }
});

// GET: Ανάκτηση συμμετεχόντων δραστηριότητας
router.get("/eksormiseis/:id/simmetexontes", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }

    const simmetexontes = await prisma.simmetoxi.findMany({
      where: { drastiriotita: { id_eksormisis: id } },
      include: {
        melos: {
          include: {
            epafes: true
          }
        },
        drastiriotita: true,
        plironei: true // ΠΡΟΣΘΕΣΕ ΑΥΤΟ ΓΙΑ ΝΑ ΕΠΙΣΤΡΕΦΕΙ ΤΙΣ ΠΛΗΡΩΜΕΣ
      }
    });

    res.json(simmetexontes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST: Δημιουργία νέας εξόρμησης
router.post("/", async (req, res) => {
  try {
    const { titlos, proorismos, timi, hmerominia_anaxorisis, hmerominia_afiksis } = req.body;

    // Έλεγχος υποχρεωτικών πεδίων
    if (!titlos || !proorismos || !hmerominia_anaxorisis || !hmerominia_afiksis) {
      return res.status(400).json({ error: "Λείπουν υποχρεωτικά πεδία" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"Eksormisi_id_eksormisis_seq"', coalesce((SELECT MAX(id_eksormisis) FROM "Eksormisi"), 0))`;

    const newEksormisi = await prisma.eksormisi.create({
      data: {
        titlos,
        proorismos,
        timi: timi ? parseInt(timi) : null,
        hmerominia_anaxorisis: new Date(hmerominia_anaxorisis),
        hmerominia_afiksis: new Date(hmerominia_afiksis)
      }
    });

    res.status(201).json({
      id: newEksormisi.id_eksormisis,
      id_eksormisis: newEksormisi.id_eksormisis,
      titlos: newEksormisi.titlos,
      proorismos: newEksormisi.proorismos,
      timi: newEksormisi.timi,
      hmerominia_anaxorisis: newEksormisi.hmerominia_anaxorisis,
      hmerominia_afiksis: newEksormisi.hmerominia_afiksis
    });
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία της εξόρμησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη δημιουργία της εξόρμησης" });
  }
});

// POST: Δημιουργία νέας δραστηριότητας
router.post("/:id/drastiriotita", async (req, res) => {
  try {
    const id_eksormisis = parseInt(req.params.id);
    if (isNaN(id_eksormisis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }

    const { 
      titlos, 
      id_vathmou_diskolias, 
      ores_poreias, 
      diafora_ipsous, 
      megisto_ipsometro, 
      hmerominia 
    } = req.body;

    // Έλεγχος υποχρεωτικών πεδίων
    if (!titlos) {
      return res.status(400).json({ error: "Ο τίτλος της δραστηριότητας είναι υποχρεωτικός" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"Drastiriotita_id_drastiriotitas_seq"', coalesce((SELECT MAX(id_drastiriotitas) FROM "Drastiriotita"), 0))`;

    const newDrastiriotita = await prisma.drastiriotita.create({
      data: {
        id_eksormisis,
        titlos,
        id_vathmou_diskolias: id_vathmou_diskolias ? parseInt(id_vathmou_diskolias) : null,
        ores_poreias: ores_poreias ? parseInt(ores_poreias) : null,
        diafora_ipsous: diafora_ipsous ? parseInt(diafora_ipsous) : null,
        megisto_ipsometro: megisto_ipsometro ? parseInt(megisto_ipsometro) : null,
        hmerominia: hmerominia ? new Date(hmerominia) : null
      },
      include: {
        vathmos_diskolias: true
      }
    });

    res.status(201).json({
      id: newDrastiriotita.id_drastiriotitas,
      id_drastiriotitas: newDrastiriotita.id_drastiriotitas,
      id_eksormisis: newDrastiriotita.id_eksormisis,
      titlos: newDrastiriotita.titlos,
      id_vathmou_diskolias: newDrastiriotita.id_vathmou_diskolias,
      ores_poreias: newDrastiriotita.ores_poreias,
      diafora_ipsous: newDrastiriotita.diafora_ipsous,
      megisto_ipsometro: newDrastiriotita.megisto_ipsometro,
      hmerominia: newDrastiriotita.hmerominia,
      vathmos_diskolias: newDrastiriotita.vathmos_diskolias
        ? {
            id_vathmou_diskolias: newDrastiriotita.vathmos_diskolias.id_vathmou_diskolias,
            onoma: newDrastiriotita.vathmos_diskolias.onoma,
            perigrafi: newDrastiriotita.vathmos_diskolias.perigrafi
          }
        : null
    });
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία της δραστηριότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη δημιουργία της δραστηριότητας" });
  }
});

// POST: Προσθήκη συμμετέχοντα σε δραστηριότητα
router.post("/:id/simmetoxi", async (req, res) => {
  try {
    const id_eksormisis = parseInt(req.params.id);
    if (isNaN(id_eksormisis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }

    const { id_melous, id_drastiriotitas, timi, katastasi } = req.body;

    if (!id_melous || !id_drastiriotitas) {
      return res.status(400).json({ error: "Απαιτείται ID μέλους και ID δραστηριότητας" });
    }

    // Έλεγχος αν το μέλος υπάρχει
    const melos = await prisma.melos.findUnique({
      where: { id_melous: parseInt(id_melous) },
      include: { epafes: true }
    });

    if (!melos) {
      return res.status(404).json({ error: "Το μέλος δεν βρέθηκε" });
    }

    // Έλεγχος αν η δραστηριότητα υπάρχει και ανήκει στην εξόρμηση
    const drastiriotita = await prisma.drastiriotita.findFirst({
      where: { 
        id_drastiriotitas: parseInt(id_drastiriotitas),
        id_eksormisis: id_eksormisis
      }
    });

    if (!drastiriotita) {
      return res.status(404).json({ error: "Η δραστηριότητα δεν βρέθηκε ή δεν ανήκει στην επιλεγμένη εξόρμηση" });
    }

    // Έλεγχος αν υπάρχει ήδη συμμετοχή
    const existingSimmetoxi = await prisma.simmetoxi.findFirst({
      where: {
        id_melous: parseInt(id_melous),
        id_drastiriotitas: parseInt(id_drastiriotitas)
      }
    });

    if (existingSimmetoxi) {
      return res.status(400).json({ error: "Το μέλος συμμετέχει ήδη στη δραστηριότητα" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"Simmetoxi_id_simmetoxis_seq"', coalesce((SELECT MAX(id_simmetoxis) FROM "Simmetoxi"), 0))`;

    // Δημιουργία συμμετοχής
    const newSimmetoxi = await prisma.simmetoxi.create({
      data: {
        id_melous: parseInt(id_melous),
        id_drastiriotitas: parseInt(id_drastiriotitas),
        timi: timi ? parseInt(timi) : null,
        katastasi: katastasi || "Ενεργή",
        hmerominia_dilosis: new Date(),
        ypoloipo: timi ? parseInt(timi) : null
      }
    });

    const fullName = `${melos.epafes?.onoma || ''} ${melos.epafes?.epitheto || ''}`.trim() || "Άγνωστο";

    res.status(201).json({
      id_simmetoxis: newSimmetoxi.id_simmetoxis,
      id_melous: newSimmetoxi.id_melous,
      id_drastiriotitas: newSimmetoxi.id_drastiriotitas,
      timi: newSimmetoxi.timi,
      katastasi: newSimmetoxi.katastasi,
      hmerominia_dilosis: newSimmetoxi.hmerominia_dilosis,
      ypoloipo: newSimmetoxi.ypoloipo,
      memberName: fullName
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη συμμετέχοντα:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη συμμετέχοντα" });
  }
});

// POST: Προσθήκη πληρωμής
router.post("/simmetoxi/:id/payment", async (req, res) => {
  try {
    const id_simmetoxis = parseInt(req.params.id);
    if (isNaN(id_simmetoxis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID συμμετοχής" });
    }

    const { poso, hmerominia_pliromis } = req.body;

    if (!poso) {
      return res.status(400).json({ error: "Το ποσό είναι υποχρεωτικό" });
    }

    // Έλεγχος αν η συμμετοχή υπάρχει
    const simmetoxi = await prisma.simmetoxi.findUnique({
      where: { id_simmetoxis }
    });

    if (!simmetoxi) {
      return res.status(404).json({ error: "Η συμμετοχή δεν βρέθηκε" });
    }

    // Επαναφορά της ακολουθίας ID
    await prisma.$executeRaw`SELECT setval('"Plironei_id_seq"', coalesce((SELECT MAX(id) FROM "Plironei"), 0))`;

    // Δημιουργία πληρωμής
    const newPayment = await prisma.plironei.create({
      data: {
        id_melous: simmetoxi.id_melous,
        id_simmetoxis,
        poso_pliromis: parseInt(poso),
        hmerominia_pliromis: hmerominia_pliromis ? new Date(hmerominia_pliromis) : new Date()
      }
    });

    // Ενημέρωση του υπολοίπου
    const payments = await prisma.plironei.findMany({
      where: { id_simmetoxis }
    });
    
    const totalPaid = payments.reduce((sum, p) => sum + (p.poso_pliromis || 0), 0);
    const newBalance = (simmetoxi.timi || 0) - totalPaid;
    
    await prisma.simmetoxi.update({
      where: { id_simmetoxis },
      data: { ypoloipo: newBalance < 0 ? 0 : newBalance }
    });

    res.status(201).json({
      id: newPayment.id,
      id_melous: newPayment.id_melous,
      id_simmetoxis: newPayment.id_simmetoxis,
      poso: newPayment.poso_pliromis,
      hmerominia_katavolhs: newPayment.hmerominia_pliromis,
      newBalance: newBalance < 0 ? 0 : newBalance
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη πληρωμής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη πληρωμής" });
  }
});

// PUT: Ενημέρωση εξόρμησης
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }

    const { titlos, proorismos, timi, hmerominia_anaxorisis, hmerominia_afiksis } = req.body;

    // Έλεγχος αν η εξόρμηση υπάρχει
    const eksormisi = await prisma.eksormisi.findUnique({
      where: { id_eksormisis: id }
    });

    if (!eksormisi) {
      return res.status(404).json({ error: "Η εξόρμηση δεν βρέθηκε" });
    }

    const updatedEksormisi = await prisma.eksormisi.update({
      where: { id_eksormisis: id },
      data: {
        titlos: titlos || eksormisi.titlos,
        proorismos: proorismos || eksormisi.proorismos,
        timi: timi !== undefined ? parseInt(timi) : eksormisi.timi,
        hmerominia_anaxorisis: hmerominia_anaxorisis ? new Date(hmerominia_anaxorisis) : eksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: hmerominia_afiksis ? new Date(hmerominia_afiksis) : eksormisi.hmerominia_afiksis
      }
    });

    res.json({
      id: updatedEksormisi.id_eksormisis,
      id_eksormisis: updatedEksormisi.id_eksormisis,
      titlos: updatedEksormisi.titlos,
      proorismos: updatedEksormisi.proorismos,
      timi: updatedEksormisi.timi,
      hmerominia_anaxorisis: updatedEksormisi.hmerominia_anaxorisis,
      hmerominia_afiksis: updatedEksormisi.hmerominia_afiksis
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση της εξόρμησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση της εξόρμησης" });
  }
});

// PUT: Ενημέρωση δραστηριότητας
router.put("/drastiriotita/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID δραστηριότητας" });
    }

    const { 
      titlos, 
      id_vathmou_diskolias, 
      ores_poreias, 
      diafora_ipsous, 
      megisto_ipsometro, 
      hmerominia 
    } = req.body;

    // Έλεγχος αν η δραστηριότητα υπάρχει
    const drastiriotita = await prisma.drastiriotita.findUnique({
      where: { id_drastiriotitas: id },
      include: { vathmos_diskolias: true }
    });

    if (!drastiriotita) {
      return res.status(404).json({ error: "Η δραστηριότητα δεν βρέθηκε" });
    }

    const updatedDrastiriotita = await prisma.drastiriotita.update({
      where: { id_drastiriotitas: id },
      data: {
        titlos: titlos || drastiriotita.titlos,
        id_vathmou_diskolias: id_vathmou_diskolias !== undefined ? parseInt(id_vathmou_diskolias) : drastiriotita.id_vathmou_diskolias,
        ores_poreias: ores_poreias !== undefined ? parseInt(ores_poreias) : drastiriotita.ores_poreias,
        diafora_ipsous: diafora_ipsous !== undefined ? parseInt(diafora_ipsous) : drastiriotita.diafora_ipsous,
        megisto_ipsometro: megisto_ipsometro !== undefined ? parseInt(megisto_ipsometro) : drastiriotita.megisto_ipsometro,
        hmerominia: hmerominia ? new Date(hmerominia) : drastiriotita.hmerominia
      },
      include: {
        vathmos_diskolias: true
      }
    });

    res.json({
      id: updatedDrastiriotita.id_drastiriotitas,
      id_drastiriotitas: updatedDrastiriotita.id_drastiriotitas,
      id_eksormisis: updatedDrastiriotita.id_eksormisis,
      titlos: updatedDrastiriotita.titlos,
      id_vathmou_diskolias: updatedDrastiriotita.id_vathmou_diskolias,
      ores_poreias: updatedDrastiriotita.ores_poreias,
      diafora_ipsous: updatedDrastiriotita.diafora_ipsous,
      megisto_ipsometro: updatedDrastiriotita.megisto_ipsometro,
      hmerominia: updatedDrastiriotita.hmerominia,
      vathmos_diskolias: updatedDrastiriotita.vathmos_diskolias
        ? {
            id_vathmou_diskolias: updatedDrastiriotita.vathmos_diskolias.id_vathmou_diskolias,
            onoma: updatedDrastiriotita.vathmos_diskolias.onoma,
            perigrafi: updatedDrastiriotita.vathmos_diskolias.perigrafi
          }
        : null
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση της δραστηριότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση της δραστηριότητας" });
  }
});

// PUT: Ενημέρωση συμμετοχής
router.put("/simmetoxi/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID συμμετοχής" });
    }

    const { timi, katastasi } = req.body;

    // Έλεγχος αν η συμμετοχή υπάρχει
    const simmetoxi = await prisma.simmetoxi.findUnique({
      where: { id_simmetoxis: id },
      include: {
        plironei: true,
        melos: {
          include: { epafes: true }
        }
      }
    });

    if (!simmetoxi) {
      return res.status(404).json({ error: "Η συμμετοχή δεν βρέθηκε" });
    }

    // Υπολογισμός νέου υπολοίπου
    const totalPaid = simmetoxi.plironei.reduce((sum, p) => sum + (p.poso_pliromis || 0), 0);
    const newTimi = timi !== undefined ? parseInt(timi) : simmetoxi.timi;
    const newBalance = (newTimi || 0) - totalPaid;

    const updatedSimmetoxi = await prisma.simmetoxi.update({
      where: { id_simmetoxis: id },
      data: {
        timi: newTimi,
        katastasi: katastasi || simmetoxi.katastasi,
        ypoloipo: newBalance < 0 ? 0 : newBalance,
        hmerominia_akirosis: katastasi === "Ακυρωμένη" && simmetoxi.katastasi !== "Ακυρωμένη" ? new Date() : undefined
      },
      include: {
        melos: { include: { epafes: true } }
      }
    });

    const fullName = `${simmetoxi.melos.epafes?.onoma || ''} ${simmetoxi.melos.epafes?.epitheto || ''}`.trim() || "Άγνωστο";

    res.json({
      id_simmetoxis: updatedSimmetoxi.id_simmetoxis,
      id_melous: updatedSimmetoxi.id_melous,
      id_drastiriotitas: updatedSimmetoxi.id_drastiriotitas,
      timi: updatedSimmetoxi.timi,
      katastasi: updatedSimmetoxi.katastasi,
      ypoloipo: updatedSimmetoxi.ypoloipo,
      hmerominia_dilosis: updatedSimmetoxi.hmerominia_dilosis,
      hmerominia_akirosis: updatedSimmetoxi.hmerominia_akirosis,
      memberName: fullName
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση της συμμετοχής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση της συμμετοχής" });
  }
});

// DELETE: Διαγραφή εξόρμησης
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }

    // Έλεγχος αν η εξόρμηση υπάρχει
    const eksormisi = await prisma.eksormisi.findUnique({
      where: { id_eksormisis: id },
      include: { drastiriotita: true }
    });

    if (!eksormisi) {
      return res.status(404).json({ error: "Η εξόρμηση δεν βρέθηκε" });
    }

    // Συλλογή όλων των IDs των δραστηριοτήτων
    const drastiriotitaIds = eksormisi.drastiriotita.map(d => d.id_drastiriotitas);

    // Διαγραφή με transaction για να διασφαλιστεί η ακεραιότητα των δεδομένων
    await prisma.$transaction(async (prisma) => {
      // Βρίσκουμε όλες τις συμμετοχές που σχετίζονται με τις δραστηριότητες
      const simmetoxes = await prisma.simmetoxi.findMany({
        where: { id_drastiriotitas: { in: drastiriotitaIds } }
      });

      const simmetoxiIds = simmetoxes.map(s => s.id_simmetoxis);

      // Διαγραφή όλων των πληρωμών
      await prisma.plironei.deleteMany({
        where: { id_simmetoxis: { in: simmetoxiIds } }
      });

      // Διαγραφή όλων των συμμετοχών
      await prisma.simmetoxi.deleteMany({
        where: { id_drastiriotitas: { in: drastiriotitaIds } }
      });

      // Διαγραφή όλων των δραστηριοτήτων
      await prisma.drastiriotita.deleteMany({
        where: { id_eksormisis: id }
      });

      // Διαγραφή της εξόρμησης
      await prisma.eksormisi.delete({
        where: { id_eksormisis: id }
      });
    });

    res.json({ message: "Η εξόρμηση και όλες οι σχετικές εγγραφές διαγράφηκαν" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της εξόρμησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της εξόρμησης" });
  }
});

// DELETE: Διαγραφή δραστηριότητας
router.delete("/drastiriotita/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID δραστηριότητας" });
    }

    // Έλεγχος αν η δραστηριότητα υπάρχει
    const drastiriotita = await prisma.drastiriotita.findUnique({
      where: { id_drastiriotitas: id }
    });

    if (!drastiriotita) {
      return res.status(404).json({ error: "Η δραστηριότητα δεν βρέθηκε" });
    }

    // Διαγραφή με transaction για να διασφαλιστεί η ακεραιότητα των δεδομένων
    await prisma.$transaction(async (prisma) => {
      // Βρίσκουμε όλες τις συμμετοχές
      const simmetoxes = await prisma.simmetoxi.findMany({
        where: { id_drastiriotitas: id }
      });

      const simmetoxiIds = simmetoxes.map(s => s.id_simmetoxis);

      // Διαγραφή όλων των πληρωμών
      await prisma.plironei.deleteMany({
        where: { id_simmetoxis: { in: simmetoxiIds } }
      });

      // Διαγραφή όλων των συμμετοχών
      await prisma.simmetoxi.deleteMany({
        where: { id_drastiriotitas: id }
      });

      // Διαγραφή της δραστηριότητας
      await prisma.drastiriotita.delete({
        where: { id_drastiriotitas: id }
      });
    });

    res.json({ message: "Η δραστηριότητα και όλες οι σχετικές εγγραφές διαγράφηκαν" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της δραστηριότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της δραστηριότητας" });
  }
});

// DELETE: Διαγραφή συμμετοχής
router.delete("/simmetoxi/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID συμμετοχής" });
    }

    // Έλεγχος αν η συμμετοχή υπάρχει
    const simmetoxi = await prisma.simmetoxi.findUnique({
      where: { id_simmetoxis: id }
    });

    if (!simmetoxi) {
      return res.status(404).json({ error: "Η συμμετοχή δεν βρέθηκε" });
    }

    // Διαγραφή με transaction για να διασφαλιστεί η ακεραιότητα των δεδομένων
    await prisma.$transaction(async (prisma) => {
      // Διαγραφή όλων των πληρωμών
      await prisma.plironei.deleteMany({
        where: { id_simmetoxis: id }
      });

      // Διαγραφή της συμμετοχής
      await prisma.simmetoxi.delete({
        where: { id_simmetoxis: id }
      });
    });

    res.json({ message: "Η συμμετοχή και όλες οι πληρωμές διαγράφηκαν" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της συμμετοχής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της συμμετοχής" });
  }
});

// DELETE: Διαγραφή πληρωμής
router.delete("/simmetoxi/:simmetoxiId/payment/:paymentId", async (req, res) => {
  try {
    const id_simmetoxis = parseInt(req.params.simmetoxiId);
    const id_payment = parseInt(req.params.paymentId);

    if (isNaN(id_simmetoxis) || isNaN(id_payment)) {
      return res.status(400).json({ error: "Μη έγκυρα IDs" });
    }

    // Έλεγχος αν η πληρωμή υπάρχει
    const payment = await prisma.plironei.findFirst({
      where: { 
        id: id_payment,
        id_simmetoxis: id_simmetoxis
      }
    });

    if (!payment) {
      return res.status(404).json({ error: "Η πληρωμή δεν βρέθηκε" });
    }

    // Διαγραφή πληρωμής
    await prisma.plironei.delete({
      where: { id: id_payment }
    });

    // Ενημέρωση υπολοίπου
    const simmetoxi = await prisma.simmetoxi.findUnique({
      where: { id_simmetoxis },
      include: { plironei: true }
    });

    const totalPaid = simmetoxi.plironei.reduce((sum, p) => sum + (p.poso_pliromis || 0), 0);
    const newBalance = (simmetoxi.timi || 0) - totalPaid;

    await prisma.simmetoxi.update({
      where: { id_simmetoxis },
      data: { ypoloipo: newBalance < 0 ? 0 : newBalance }
    });

    res.json({ 
      message: "Η πληρωμή διαγράφηκε", 
      newBalance: newBalance < 0 ? 0 : newBalance 
    });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της πληρωμής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της πληρωμής" });
  }
});

module.exports = router;