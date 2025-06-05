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
            vathmos_diskolias: true
          }
        },
        // Add this to include participants
        simmetoxi: {
          include: {
            melos: {
              include: {
                epafes: true
              }
            }
          }
        },
        // Fix: Use ypefthynos instead of esoteriko_melos
        ypefthinoi: {
          include: {
            ypefthynos: {
              include: {
                melos: {
                  include: {
                    epafes: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        hmerominia_anaxorisis: 'asc'
      }
    });

    const serializedEksormiseis = eksormiseis.map(eksormisi => {
      // Calculate unique participants from simmetoxi
      const uniqueParticipantIds = new Set();
      eksormisi.simmetoxi?.forEach(sim => {
        if (sim.id_melous) {
          uniqueParticipantIds.add(sim.id_melous);
        }
      });
      const participantsCount = uniqueParticipantIds.size;

      return {
        id: eksormisi.id_eksormisis,
        id_eksormisis: eksormisi.id_eksormisis,
        titlos: eksormisi.titlos || "",
        proorismos: eksormisi.proorismos || "",
        timi: parseInt(eksormisi.timi || 0),
        hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: eksormisi.hmerominia_afiksis,
        participantsCount: participantsCount,
        // Include simmetoxi data for frontend processing
        simmetoxi: eksormisi.simmetoxi || [],
        drastiriotites: (eksormisi.drastiriotita || []).map(dr => ({
          id_drastiriotitas: dr.id_drastiriotitas,
          titlos: dr.titlos,
          ores_poreias: dr.ores_poreias,
          diafora_ipsous: dr.diafora_ipsous,
          megisto_ipsometro: dr.megisto_ipsometro,
          hmerominia: dr.hmerominia,
          vathmos_diskolias: dr.vathmos_diskolias || { epipedo: 1 }
        }))
      };
    });

    res.json(serializedEksormiseis);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των εξορμήσεων:", error);
    res.status(500).json({ error: "Εσωτερικό σφάλμα διακομιστή" });
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

    // Get responsible person separately if needed
    let ypefthynos = null;
    if (eksormisi.id_ypefthynou) {
      const responsiblePerson = await prisma.esoteriko_melos.findUnique({
        where: { id_es_melous: eksormisi.id_ypefthynou },
        include: {
          melos: {
            include: {
              epafes: true
            }
          }
        }
      });

      if (responsiblePerson) {
        ypefthynos = {
          id_es_melous: responsiblePerson.id_es_melous,
          fullName: `${responsiblePerson.melos?.epafes?.epitheto || ''} ${responsiblePerson.melos?.epafes?.onoma || ''}`.trim(),
          email: responsiblePerson.melos?.epafes?.email || '',
          tilefono: responsiblePerson.melos?.epafes?.tilefono ? responsiblePerson.melos.epafes.tilefono.toString() : ''
        };
      }
    }

    // Use optional chaining to avoid null reference errors
    const serializedEksormisi = {
      id: eksormisi.id_eksormisis,
      id_eksormisis: eksormisi.id_eksormisis,
      titlos: eksormisi.titlos || "",
      proorismos: eksormisi.proorismos || "",
      timi: eksormisi.timi || 0,
      hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis,
      hmerominia_afiksis: eksormisi.hmerominia_afiksis,
      drastiriotites: (eksormisi.drastiriotita || []).map((drastiriotita) => ({
        id: drastiriotita.id_drastiriotitas,
        id_drastiriotitas: drastiriotita.id_drastiriotitas,
        titlos: drastiriotita.titlos || "",
        ores_poreias: drastiriotita.ores_poreias,
        diafora_ipsous: drastiriotita.diafora_ipsous,
        megisto_ipsometro: drastiriotita.megisto_ipsometro,
        hmerominia: drastiriotita.hmerominia,
        id_vathmou_diskolias: drastiriotita.id_vathmou_diskolias,
        vathmos_diskolias: drastiriotita.vathmos_diskolias
          ? {
              id_vathmou_diskolias: drastiriotita.vathmos_diskolias.id_vathmou_diskolias,
              epipedo: drastiriotita.vathmos_diskolias.epipedo
            }
          : null
      })),
      ypefthynos: ypefthynos
    };

    res.json(serializedEksormisi);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση της εξόρμησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση της εξόρμησης", details: error.message });
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
            epipedo: drastiriotita.vathmos_diskolias.epipedo
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
    
    const participants = await prisma.simmetoxi.findMany({
      where: {
        id_eksormisis: id
      },
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true
          }
        },
        plironei: true,
        simmetoxi_drastiriotites: {
          include: {
            drastiriotita: {
              include: {
                vathmos_diskolias: true
              }
            }
          }
        }
      }
    });

    const formattedParticipants = [];

    participants.forEach(participant => {
      const totalPaid = (participant.plironei || []).reduce((sum, payment) => sum + (payment.poso_pliromis || 0), 0);
      const ypoloipo = (participant.timi || 0) - totalPaid;
      
      // ΔΙΟΡΘΩΣΗ: Βεβαιωνόμαστε ότι το activities array έχει τη σωστή δομή
      const participantActivities = (participant.simmetoxi_drastiriotites || []).map(sd => ({
        id_drastiriotitas: sd.id_drastiriotitas,
        id: sd.id_drastiriotitas,
        titlos: sd.drastiriotita?.titlos || 'Άγνωστη δραστηριότητα',
        hmerominia: sd.drastiriotita?.hmerominia,
        vathmos_diskolias: sd.drastiriotita?.vathmos_diskolias
      }));

      formattedParticipants.push({
        id_simmetoxis: participant.id_simmetoxis,
        id_melous: participant.id_melous,
        timi: participant.timi,
        katastasi: participant.katastasi,
        ypoloipo: ypoloipo,
        hmerominia_dilosis: participant.hmerominia_dilosis,
        memberName: `${participant.melos?.epafes?.epitheto || ''} ${participant.melos?.epafes?.onoma || ''}`.trim(),
        email: participant.melos?.epafes?.email || '-',
        vathmosDiskolias: participant.melos?.vathmos_diskolias?.epipedo || 'Άγνωστο',
        
        melos: {
          id_melous: participant.melos?.id_melous,
          epafes: participant.melos?.epafes ? {
            onoma: participant.melos.epafes.onoma,
            epitheto: participant.melos.epafes.epitheto,
            email: participant.melos.epafes.email,
            tilefono: participant.melos.epafes.tilefono ? participant.melos.epafes.tilefono.toString() : null
          } : null,
          vathmos_diskolias: participant.melos?.vathmos_diskolias
        },
        
        // ΚΥΡΙΟ ΠΕΔΙΟ - activities array για το frontend
        activities: participantActivities,
        
        // Πληρωμές με σωστή δομή
        plironei: (participant.plironei || []).map(p => ({
          id: p.id,
          id_plironei: p.id,
          poso_pliromis: p.poso_pliromis || 0,
          hmerominia_pliromis: p.hmerominia_pliromis
        })),

        // Διατηρείται για συμβατότητα
        simmetoxi_drastiriotites: participantActivities.map(activity => ({
          id_drastiriotitas: activity.id_drastiriotitas,
          drastiriotita: {
            id_drastiriotitas: activity.id_drastiriotitas,
            titlos: activity.titlos,
            hmerominia: activity.hmerominia,
            vathmos_diskolias: activity.vathmos_diskolias
          }
        })),

        // Για backwards compatibility
        id_drastiriotitas: participantActivities.length > 0 ? participantActivities[0].id_drastiriotitas : null,
        drastiriotita: participantActivities.length > 0 ? {
          id_drastiriotitas: participantActivities[0].id_drastiriotitas,
          titlos: participantActivities[0].titlos,
          hmerominia: participantActivities[0].hmerominia,
          vathmos_diskolias: participantActivities[0].vathmos_diskolias
        } : null
      });
    });

    res.json(formattedParticipants);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση συμμετεχόντων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση συμμετεχόντων" });
  }
});

// POST: Δημιουργία νέας εξόρμησης
router.post("/", async (req, res) => {
  try {
    const { titlos, proorismos, timi, hmerominia_anaxorisis, hmerominia_afiksis } = req.body;

    if (!titlos || !proorismos || !hmerominia_anaxorisis || !hmerominia_afiksis) {
      return res.status(400).json({ error: "Λείπουν υποχρεωτικά πεδία" });
    }

    // Reset the sequence to the max existing ID
    await prisma.$executeRaw`SELECT setval('"Eksormisi_id_eksormisis_seq"', GREATEST(coalesce((SELECT MAX(id_eksormisis) FROM "Eksormisi"), 0), 1))`;

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

    if (!titlos) {
      return res.status(400).json({ error: "Ο τίτλος της δραστηριότητας είναι υποχρεωτικός" });
    }

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
            epipedo: newDrastiriotita.vathmos_diskolias.epipedo
          }
        : null
    });
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία της δραστηριότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη δημιουργία της δραστηριότητας" });
  }
});

// POST: Προσθήκη συμμετέχοντα σε εξόρμηση με πολλές δραστηριότητες
router.post("/:id/simmetoxi", async (req, res) => {
  try {
    const id_eksormisis = parseInt(req.params.id);
    if (isNaN(id_eksormisis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }

    const { id_melous, id_drastiriotitas_array, timi, katastasi } = req.body;

    if (!id_melous) {
      return res.status(400).json({ error: "Απαιτείται ID μέλους" });
    }

    // Έλεγχος αν το μέλος υπάρχει
    const melos = await prisma.melos.findUnique({
      where: { id_melous: parseInt(id_melous) },
      include: { epafes: true }
    });

    if (!melos) {
      return res.status(404).json({ error: "Το μέλος δεν βρέθηκε" });
    }

    // Έλεγχος αν υπάρχει ήδη συμμετοχή του μέλους στην εξόρμηση
    const existingSimmetoxi = await prisma.simmetoxi.findFirst({
      where: {
        id_melous: parseInt(id_melous),
        id_eksormisis: id_eksormisis
      }
    });

    if (existingSimmetoxi) {
      return res.status(400).json({ 
        error: "Το μέλος συμμετέχει ήδη σε αυτή την εξόρμηση",
        existing_simmetoxi_id: existingSimmetoxi.id_simmetoxis
      });
    }

    // Δημιουργία νέας συμμετοχής
    const newSimmetoxi = await prisma.simmetoxi.create({
      data: {
        id_melous: parseInt(id_melous),
        id_eksormisis: id_eksormisis,
        timi: timi ? parseInt(timi) : null,
        katastasi: katastasi || "Ενεργή",
        hmerominia_dilosis: new Date(),
        ypoloipo: timi ? parseInt(timi) : null
      }
    });

    // Σύνδεση με δραστηριότητες
    const activityIds = Array.isArray(id_drastiriotitas_array) 
      ? id_drastiriotitas_array 
      : [id_drastiriotitas_array || req.body.id_drastiriotitas];

    if (activityIds.length > 0 && activityIds[0]) {
      // Remove duplicates first
      const uniqueActivityIds = [...new Set(activityIds)].filter(id => id);
      
      await Promise.all(
        uniqueActivityIds.map(async (activityId) => {
          // Use newSimmetoxi.id_simmetoxis instead of id_simmetoxis
          const exists = await prisma.simmetoxi_drastiriotita.findUnique({
            where: {
              id_simmetoxis_id_drastiriotitas: {
                id_simmetoxis: newSimmetoxi.id_simmetoxis,  // CHANGE THIS LINE
                id_drastiriotitas: parseInt(activityId)
              }
            }
          });
          
          if (!exists) {
            await prisma.simmetoxi_drastiriotita.create({
              data: {
                id_simmetoxis: newSimmetoxi.id_simmetoxis,  // CHANGE THIS LINE
                id_drastiriotitas: parseInt(activityId)
              }
            });
          }
        })
      );
    }

    const fullName = `${melos.epafes?.onoma || ''} ${melos.epafes?.epitheto || ''}`.trim() || "Άγνωστο";

    res.status(201).json({
      id_simmetoxis: newSimmetoxi.id_simmetoxis,
      id_melous: newSimmetoxi.id_melous,
      id_eksormisis: newSimmetoxi.id_eksormisis,
      timi: newSimmetoxi.timi,
      katastasi: newSimmetoxi.katastasi,
      memberName: fullName,
      connected_activities: activityIds.filter(id => id).length
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη συμμετέχοντα:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη συμμετέχοντα" });
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

    const updatedEksormisi = await prisma.eksormisi.update({
      where: { id_eksormisis: id },
      data: {
        titlos,
        proorismos,
        timi: timi ? parseInt(timi) : null,
        hmerominia_anaxorisis: new Date(hmerominia_anaxorisis),
        hmerominia_afiksis: new Date(hmerominia_afiksis)
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

    const updatedDrastiriotita = await prisma.drastiriotita.update({
      where: { id_drastiriotitas: id },
      data: {
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

    res.json({
      id: updatedDrastiriotita.id_drastiriotitas,
      id_drastiriotitas: updatedDrastiriotita.id_drastiriotitas,
      titlos: updatedDrastiriotita.titlos,
      id_vathmou_diskolias: updatedDrastiriotita.id_vathmou_diskolias,
      ores_poreias: updatedDrastiriotita.ores_poreias,
      diafora_ipsous: updatedDrastiriotita.diafora_ipsous,
      megisto_ipsometro: updatedDrastiriotita.megisto_ipsometro,
      hmerominia: updatedDrastiriotita.hmerominia,
      vathmos_diskolias: updatedDrastiriotita.vathmos_diskolias
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση της δραστηριότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση της δραστηριότητας" });
  }
});

// PUT: Ενημέρωση δραστηριοτήτων συμμετοχής
router.put("/simmetoxi/:id/update-activities", async (req, res) => {
  try {
    const id_simmetoxis = parseInt(req.params.id);
    const { id_drastiriotitas_array, timi, katastasi } = req.body;
    
    if (isNaN(id_simmetoxis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID συμμετοχής" });
    }
    
    const simmetoxi = await prisma.simmetoxi.findUnique({
      where: { id_simmetoxis: id_simmetoxis },
      include: {
        plironei: true,
        melos: { include: { epafes: true } },
        simmetoxi_drastiriotites: {
          include: { drastiriotita: true }
        }
      }
    });
    
    if (!simmetoxi) {
      return res.status(404).json({ error: "Η συμμετοχή δεν βρέθηκε" });
    }
    
    await prisma.$transaction(async (prisma) => {
      await prisma.simmetoxi.update({
        where: { id_simmetoxis: id_simmetoxis },
        data: {
          timi: timi !== undefined ? parseFloat(timi) : simmetoxi.timi,
          katastasi: katastasi !== undefined ? katastasi : simmetoxi.katastasi
        }
      });

      await prisma.simmetoxi_drastiriotita.deleteMany({
        where: { id_simmetoxis: id_simmetoxis }
      });

      const activityIds = Array.isArray(id_drastiriotitas_array) 
        ? id_drastiriotitas_array 
        : [id_drastiriotitas_array];

      if (activityIds.length > 0 && activityIds[0]) {
        // Remove duplicates first
        const uniqueActivityIds = [...new Set(activityIds)].filter(id => id);
        
        await Promise.all(
          uniqueActivityIds.map(async (activityId) => {
            // Use createMany with skipDuplicates option or check if exists first
            const exists = await prisma.simmetoxi_drastiriotita.findUnique({
              where: {
                id_simmetoxis_id_drastiriotitas: {
                  id_simmetoxis: id_simmetoxis,
                  id_drastiriotitas: parseInt(activityId)
                }
              }
            });
            
            if (!exists) {
              await prisma.simmetoxi_drastiriotita.create({
                data: {
                  id_simmetoxis: id_simmetoxis,
                  id_drastiriotitas: parseInt(activityId)
                }
              });
            }
          })
        );
      }
    });

    const updatedSimmetoxi = await prisma.simmetoxi.findUnique({
      where: { id_simmetoxis: id_simmetoxis },
      include: {
        melos: { include: { epafes: true } },
        plironei: true,
        simmetoxi_drastiriotites: {
          include: { drastiriotita: true }
        }
      }
    });
    
    res.json({
      id_simmetoxis: updatedSimmetoxi.id_simmetoxis,
      id_melous: updatedSimmetoxi.id_melous,
      id_eksormisis: updatedSimmetoxi.id_eksormisis,
      timi: updatedSimmetoxi.timi,
      katastasi: updatedSimmetoxi.katastasi,
      ypoloipo: updatedSimmetoxi.ypoloipo,
      memberName: `${updatedSimmetoxi.melos?.epafes?.epitheto || ''} ${updatedSimmetoxi.melos?.epafes?.onoma || ''}`.trim(),
      plironei: updatedSimmetoxi.plironei,
      activities: updatedSimmetoxi.simmetoxi_drastiriotites.map(sd => ({
        id_drastiriotitas: sd.id_drastiriotitas,
        titlos: sd.drastiriotita?.titlos
      }))
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση συμμετοχής:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ενημέρωση συμμετοχής", 
      details: error.message 
    });
  }
});

// POST: Προσθήκη πληρωμής
router.post("/simmetoxi/:id/payment", async (req, res) => {
  try {
    const id_simmetoxis = parseInt(req.params.id);
    const { poso, hmerominia_pliromis } = req.body;

    if (isNaN(id_simmetoxis)) {
      return res.status(400).json({ error: "Μη έγκυρο ID συμμετοχής" });
    }

    const simmetoxi = await prisma.simmetoxi.findUnique({
      where: { id_simmetoxis: id_simmetoxis }
    });

    if (!simmetoxi) {
      return res.status(404).json({ error: "Η συμμετοχή δεν βρέθηκε" });
    }

    const newPayment = await prisma.plironei.create({
      data: {
        id_melous: simmetoxi.id_melous,
        id_simmetoxis: id_simmetoxis,
        poso_pliromis: parseFloat(poso),
        hmerominia_pliromis: hmerominia_pliromis ? new Date(hmerominia_pliromis) : new Date()
      }
    });

    res.status(201).json({
      id: newPayment.id,
      id_melous: newPayment.id_melous,
      id_simmetoxis: newPayment.id_simmetoxis,
      poso_pliromis: newPayment.poso_pliromis,
      hmerominia_pliromis: newPayment.hmerominia_pliromis
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη πληρωμής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη πληρωμής" });
  }
});

// DELETE: Διαγραφή εξόρμησης
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID εξόρμησης" });
    }

    await prisma.eksormisi.delete({
      where: { id_eksormisis: id }
    });

    res.json({ message: "Η εξόρμηση διαγράφηκε επιτυχώς" });
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

    await prisma.drastiriotita.delete({
      where: { id_drastiriotitas: id }
    });

    res.json({ message: "Η δραστηριότητα διαγράφηκε επιτυχώς" });
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

    await prisma.simmetoxi.delete({
      where: { id_simmetoxis: id }
    });

    res.json({ message: "Η συμμετοχή διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της συμμετοχής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της συμμετοχής" });
  }
});

// DELETE: Διαγραφή πληρωμής
router.delete("/simmetoxi/:simmetoxiId/payment/:paymentId", async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    const simmetoxiId = parseInt(req.params.simmetoxiId);

    if (isNaN(paymentId) || isNaN(simmetoxiId)) {
      return res.status(400).json({ error: "Μη έγκυρα IDs" });
    }

    await prisma.plironei.delete({
      where: { 
        id: paymentId,
        id_simmetoxis: simmetoxiId 
      }
    });

    res.json({ message: "Η πληρωμή διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της πληρωμής:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της πληρωμής" });
  }
});

// GET: Ανάκτηση συμμετεχόντων συγκεκριμένης δραστηριότητας
router.get("/drastiriotita/:id/simmetexontes", async (req, res) => {
  try {
    const id_drastiriotitas = parseInt(req.params.id);
    if (isNaN(id_drastiriotitas)) {
      return res.status(400).json({ error: "Μη έγκυρο ID δραστηριότητας" });
    }

    // Βρίσκουμε τις συμμετοχές για τη συγκεκριμένη δραστηριότητα
    const participants = await prisma.simmetoxi_drastiriotita.findMany({
      where: {
        id_drastiriotitas: id_drastiriotitas
      },
      include: {
        simmetoxi: {
          include: {
            melos: {
              include: {
                epafes: true,
                vathmos_diskolias: true
              }
            },
            plironei: true
          }
        },
        drastiriotita: {
          include: {
            vathmos_diskolias: true
          }
        }
      }
    });

    const formattedParticipants = participants.map(sd => {
      const simmetoxi = sd.simmetoxi;
      const totalPaid = (simmetoxi.plironei || []).reduce((sum, payment) => sum + (payment.poso_pliromis || 0), 0);
      const ypoloipo = (simmetoxi.timi || 0) - totalPaid;

      return {
        id_simmetoxis: simmetoxi.id_simmetoxis,
        id_melous: simmetoxi.id_melous,
        id_drastiriotitas: sd.id_drastiriotitas,
        timi: simmetoxi.timi,
        katastasi: simmetoxi.katastasi,
        ypoloipo: ypoloipo,
        hmerominia_dilosis: simmetoxi.hmerominia_dilosis,
        memberName: `${simmetoxi.melos?.epafes?.epitheto || ''} ${simmetoxi.melos?.epafes?.onoma || ''}`.trim(),
        email: simmetoxi.melos?.epafes?.email || '-',
        vathmosDiskolias: simmetoxi.melos?.vathmos_diskolias?.epipedo || 'Άγνωστο',
        melos: simmetoxi.melos,
        plironei: simmetoxi.plironei
      };
    });

    res.json(formattedParticipants);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση συμμετεχόντων δραστηριότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση συμμετεχόντων δραστηριότητας" });
  }
});

// PUT: Update the responsible person for an expedition
router.put("/:id/ypefthynos", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { id_ypefthynou } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expedition ID" });
    }
    
    if (!id_ypefthynou || isNaN(parseInt(id_ypefthynou))) {
      return res.status(400).json({ error: "Invalid responsible person ID" });
    }
    
    // Check if member exists and is internal
    const member = await prisma.esoteriko_melos.findUnique({
      where: { id_es_melous: parseInt(id_ypefthynou) },
      include: { melos: { include: { epafes: true } } }
    });
    
    if (!member) {
      return res.status(404).json({ error: "Internal member not found" });
    }
    
    // Update expedition with new responsible person
    const updatedEksormisi = await prisma.eksormisi.update({
      where: { id_eksormisis: id },
      data: { id_ypefthynou: parseInt(id_ypefthynou) },
      include: {
        ypefthynos: { 
          include: { 
            melos: { include: { epafes: true } } 
          } 
        }
      }
    });
    
    res.json({
      message: "Ο υπεύθυνος ενημερώθηκε επιτυχώς",
      ypefthynos: updatedEksormisi.ypefthynos ? {
        id_es_melous: updatedEksormisi.ypefthynos.id_es_melous,
        fullName: `${updatedEksormisi.ypefthynos.melos?.epafes?.epitheto || ''} ${updatedEksormisi.ypefthynos.melos?.epafes?.onoma || ''}`.trim(),
        email: updatedEksormisi.ypefthynos.melos?.epafes?.email,
        tilefono: updatedEksormisi.ypefthynos.melos?.epafes?.tilefono?.toString()
      } : null
    });
  } catch (error) {
    console.error("Error updating responsible person:", error);
    res.status(500).json({ 
      error: "Error updating responsible person", 
      details: error.message 
    });
  }
});

// DELETE: Remove responsible person from expedition
router.delete("/:id/ypefthynos", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expedition ID" });
    }
    
    // Update expedition to remove responsible person
    await prisma.eksormisi.update({
      where: { id_eksormisis: id },
      data: { id_ypefthynou: null }
    });
    
    res.json({ message: "Ο υπεύθυνος αφαιρέθηκε επιτυχώς" });
  } catch (error) {
    console.error("Error removing responsible person:", error);
    res.status(500).json({ 
      error: "Error removing responsible person", 
      details: error.message 
    });
  }
});

// GET: Get all responsible persons for an expedition
router.get("/:id/ypefthynoi", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expedition ID" });
    }
    
    // Find the expedition's responsible persons
    const responsiblePersons = await prisma.ypefthynoi_eksormisis.findMany({
      where: { id_eksormisis: id },
      include: {
        ypefthynos: {
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
    
 const formattedResponsiblePersons = responsiblePersons.map(rp => {
  // Extract name parts first for more reliable access
  const onoma = rp.ypefthynos?.melos?.epafes?.onoma || '';
  const epitheto = rp.ypefthynos?.melos?.epafes?.epitheto || '';
  
  // Calculate fullName only after extracting the parts
  const fullName = `${epitheto} ${onoma}`.trim();
  
  return {
    id_es_melous: rp.id_ypefthynou,
    onoma,
    epitheto,
    firstName: onoma,
    lastName: epitheto,
    fullName: fullName || "Άγνωστο όνομα",  // Only use fallback if truly empty
    email: rp.ypefthynos?.melos?.epafes?.email || '',
    tilefono: rp.ypefthynos?.melos?.epafes?.tilefono ? rp.ypefthynos.melos.epafes.tilefono.toString() : '',
    ypefthynos: rp.ypefthynos
  };
});
    
    res.json(formattedResponsiblePersons);
  } catch (error) {
    console.error("Error retrieving responsible persons:", error);
    res.status(500).json({ 
      error: "Error retrieving responsible persons", 
      details: error.message 
    });
  }
});

// POST: Add responsible persons to an expedition (multiple)
router.post("/:id/ypefthynoi", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { id_ypefthynon } = req.body; // Array of IDs
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expedition ID" });
    }
    
    if (!Array.isArray(id_ypefthynon) || id_ypefthynon.length === 0) {
      return res.status(400).json({ error: "Invalid responsible person IDs" });
    }

    // First remove all existing responsible persons for this expedition
    await prisma.ypefthynoi_eksormisis.deleteMany({
      where: {
        id_eksormisis: id
      }
    });
    
    // Create new entries in ypefthynoi_eksormisis
    await Promise.all(id_ypefthynon.map(async (id_ypefthynou) => {
      await prisma.ypefthynoi_eksormisis.create({
        data: {
          id_eksormisis: id,
          id_ypefthynou: parseInt(id_ypefthynou)
        }
      });
    }));
    
    // Now fetch the complete data for all added responsible persons
    const responsiblePersons = await prisma.ypefthynoi_eksormisis.findMany({
      where: { id_eksormisis: id },
      include: {
        ypefthynos: {
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
    
    const formattedResponsiblePersons = responsiblePersons.map(rp => {
      // Extract name parts first for more reliable access
      const onoma = rp.ypefthynos?.melos?.epafes?.onoma || '';
      const epitheto = rp.ypefthynos?.melos?.epafes?.epitheto || '';
      
      // Calculate fullName only after extracting the parts
      const fullName = `${epitheto} ${onoma}`.trim();
      
      return {
        id_es_melous: rp.id_ypefthynou,
        onoma,
        epitheto,
        firstName: onoma,
        lastName: epitheto,
        fullName: fullName || "Άγνωστο όνομα",
        email: rp.ypefthynos?.melos?.epafes?.email || '',
        tilefono: rp.ypefthynos?.melos?.epafes?.tilefono ? rp.ypefthynos.melos.epafes.tilefono.toString() : '',
      };
    });
    
    res.json({
      message: "Οι υπεύθυνοι προστέθηκαν επιτυχώς",
      responsiblePersons: formattedResponsiblePersons
    });
  } catch (error) {
    console.error("Error adding responsible persons:", error);
    res.status(500).json({ 
      error: "Error adding responsible persons", 
      details: error.message 
    });
  }
});

// DELETE: Remove a specific responsible person from an expedition
router.delete("/:id/ypefthynoi/:id_ypefthynou", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const id_ypefthynou = parseInt(req.params.id_ypefthynou);
    
    if (isNaN(id) || isNaN(id_ypefthynou)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }
    
    await prisma.ypefthynoi_eksormisis.delete({
      where: {
        id_eksormisis_id_ypefthynou: {
          id_eksormisis: id,
          id_ypefthynou: id_ypefthynou
        }
      }
    });
    
    res.json({ message: "Ο υπεύθυνος αφαιρέθηκε επιτυχώς" });
  } catch (error) {
    console.error("Error removing responsible person:", error);
    res.status(500).json({ 
      error: "Error removing responsible person", 
      details: error.message 
    });
  }
});

module.exports = router;