const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Μετατροπή του BigInt σε string για το JSON response
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// GET: Ανάκτηση όλων των αθλητών με λεπτομέρειες
router.get("/athletes", async (_req, res) => {
  try {
    const athletes = await prisma.athlitis.findMany({
      include: {
        esoteriko_melos: {
          include: {
            melos: {
              include: {
                epafes: true,
                vathmos_diskolias: true,
              },
            },
          }
        },
        asxoleitai: {
          include: {
            athlima: true,
          },
        },
        agonizetai: {
          include: {
            agones: {
              include: {
                athlima: true,
              }
            },
          },
        },
      },
      orderBy: {
        id_athliti: "asc",
      },
    });

    const formattedAthletes = athletes.map((athlete) => ({
      id: athlete.id_athliti,
      firstName: athlete.esoteriko_melos?.melos?.epafes?.onoma || "",
      lastName: athlete.esoteriko_melos?.melos?.epafes?.epitheto || "",
      phone: athlete.esoteriko_melos?.melos?.epafes?.tilefono ? 
        athlete.esoteriko_melos.melos.epafes.tilefono.toString() : "",
      email: athlete.esoteriko_melos?.melos?.epafes?.email || "",
      patronimo: athlete.esoteriko_melos?.patronimo || "",
      odos: athlete.esoteriko_melos?.odos || "",
      tk: athlete.esoteriko_melos?.tk || "",
      arithmos_mitroou: athlete.esoteriko_melos?.arithmos_mitroou || "",
      vathmos_diskolias: athlete.esoteriko_melos?.melos?.vathmos_diskolias?.epipedo || "",
      arithmosdeltiou: athlete.arithmos_deltiou || "",
      hmerominiaenarksis: athlete.hmerominia_enarksis_deltiou ? 
        new Date(athlete.hmerominia_enarksis_deltiou).toISOString().split('T')[0] : "",
      hmerominialiksis: athlete.hmerominia_liksis_deltiou ? 
        new Date(athlete.hmerominia_liksis_deltiou).toISOString().split('T')[0] : "",
      athlima: athlete.asxoleitai.map((a) => a.athlima.onoma).join(", "),
      athlimata: athlete.asxoleitai.map((a) => ({
        id: a.id_athlimatos,
        onoma: a.athlima.onoma,
      })),
      agones: athlete.agonizetai.map((a) => ({
        id: a.agones.id_agona,
        onoma: a.agones.onoma,
        perigrafi: a.agones.perigrafi,
        hmerominia: a.agones.hmerominia ? new Date(a.agones.hmerominia).toISOString().split('T')[0] : "",
        athlima: a.agones.athlima?.onoma || "",
      })),
      totalParticipation: athlete.agonizetai.length,
    }));

    res.json(formattedAthletes);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των αθλητών:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ανάκτηση των αθλητών", 
      details: error.message 
    });
  }
});

// GET: Ανάκτηση όλων των αθλημάτων με αγώνες και συμμετέχοντες
router.get("/sports", async (_req, res) => {
  try {
    const sports = await prisma.athlima.findMany({
      include: {
        agones: {
          include: {
            agonizetai: {
              include: {
                athlitis: {
                  include: {
                    esoteriko_melos: {
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
              }
            }
          }
        },
        asxoleitai: {
          include: {
            athlitis: true
          }
        }
      },
      orderBy: {
        onoma: "asc"
      }
    });

    const formattedSports = sports.map((sport) => {
      // Μετράμε το σύνολο των μοναδικών αθλητών για κάθε άθλημα
      const uniqueAthletes = new Set(sport.asxoleitai.map(a => a.id_athliti));
      
      // Υπολογισμός συνολικών συμμετοχών αθλητών σε αγώνες του αθλήματος
      let totalAthleteParticipations = 0;
      sport.agones.forEach(agonas => {
        totalAthleteParticipations += agonas.agonizetai.length;
      });
      
      return {
        id: sport.id_athlimatos,
        athlima: sport.onoma || "",
        participants: uniqueAthletes.size,
        totalCompetitions: totalAthleteParticipations,
        agones: sport.agones.map((agonas) => ({
          id: agonas.id_agona,
          id_athlimatos: agonas.id_athlimatos,
          onoma: agonas.onoma,
          perigrafi: agonas.perigrafi,
          hmerominia: agonas.hmerominia ? new Date(agonas.hmerominia).toISOString().split('T')[0] : "",
          summetexontesCount: agonas.agonizetai.length,
          summetexontes: agonas.agonizetai.map((agonizetai) => ({
            id: agonizetai.athlitis.id_athliti,
            firstName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.onoma || "",
            lastName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "",
            arithmosdeltiou: agonizetai.athlitis.arithmos_deltiou || "",
          }))
        }))
      };
    });

    res.json(formattedSports);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των αθλημάτων:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ανάκτηση των αθλημάτων", 
      details: error.message 
    });
  }
});

// POST: Προσθήκη νέου αθλητή
router.post("/athlete", async (req, res) => {
  try {
    const { 
      epafes, 
      vathmos_diskolias, 
      esoteriko_melos, 
      athlitis, 
      athlimata 
    } = req.body;

    const result = await prisma.$transaction(async (prismaTransaction) => {
      // 1. Δημιουργία επαφής
      const newEpafi = await prismaTransaction.epafes.create({
        data: {
          ...epafes,
          tilefono: epafes.tilefono ? BigInt(epafes.tilefono) : null,
        }
      });

      // 2. Δημιουργία μέλους
      const newMelos = await prismaTransaction.melos.create({
        data: {
          id_melous: newEpafi.id_epafis,
          tipo_melous: "esoteriko",
          id_vathmou_diskolias: vathmos_diskolias.id_vathmou_diskolias,
        }
      });

      // 3. Δημιουργία εσωτερικού μέλους
      const newEsoterikoMelos = await prismaTransaction.esoteriko_melos.create({
        data: {
          id_es_melous: newMelos.id_melous,
          ...esoteriko_melos
        }
      });

      // 4. Δημιουργία αθλητή
      const newAthlitis = await prismaTransaction.athlitis.create({
        data: {
          id_athliti: newEsoterikoMelos.id_es_melous,
          ...athlitis
        }
      });

      // 5. Συσχέτιση με αθλήματα
      if (athlimata && athlimata.length > 0) {
        for (const athlima of athlimata) {
          await prismaTransaction.asxoleitai.create({
            data: {
              id_athliti: newAthlitis.id_athliti,
              id_athlimatos: athlima.id_athlimatos
            }
          });
        }
      }

      // 6. Ανάκτηση του πλήρους νέου αθλητή
      const completeAthlete = await prismaTransaction.athlitis.findUnique({
        where: { id_athliti: newAthlitis.id_athliti },
        include: {
          esoteriko_melos: {
            include: {
              melos: {
                include: {
                  epafes: true,
                  vathmos_diskolias: true,
                }
              }
            }
          },
          asxoleitai: {
            include: {
              athlima: true
            }
          },
          agonizetai: {
            include: {
              agones: true
            }
          }
        }
      });

      return {
        ...completeAthlete,
        esoteriko_melos: {
          ...completeAthlete.esoteriko_melos,
          melos: {
            ...completeAthlete.esoteriko_melos.melos,
            epafes: {
              ...completeAthlete.esoteriko_melos.melos.epafes,
              tilefono: completeAthlete.esoteriko_melos.melos.epafes.tilefono?.toString()
            }
          }
        }
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη αθλητή:", error);
    res.status(400).json({ 
      error: "Σφάλμα κατά την προσθήκη αθλητή", 
      details: error.message 
    });
  }
});

// POST: Προσθήκη νέου αγώνα
router.post("/agona", async (req, res) => {
  try {
    const { id_athlimatos, onoma, perigrafi, hmerominia, agonizetai } = req.body;

    const result = await prisma.$transaction(async (prismaTransaction) => {
      // 1. Δημιουργία αγώνα
      const newAgona = await prismaTransaction.agones.create({
        data: {
          id_athlimatos: parseInt(id_athlimatos),
          onoma,
          perigrafi,
          hmerominia: hmerominia ? new Date(hmerominia) : null
        }
      });

      // 2. Συσχέτιση με αθλητές
      if (agonizetai && agonizetai.length > 0) {
        for (const athleteId of agonizetai) {
          await prismaTransaction.agonizetai.create({
            data: {
              id_agona: newAgona.id_agona,
              id_athliti: parseInt(athleteId)
            }
          });
        }
      }

      // 3. Ανάκτηση του πλήρους νέου αγώνα
      const completeAgona = await prismaTransaction.agones.findUnique({
        where: { id_agona: newAgona.id_agona },
        include: {
          athlima: true,
          agonizetai: {
            include: {
              athlitis: {
                include: {
                  esoteriko_melos: {
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
            }
          }
        }
      });

      return completeAgona;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη αγώνα:", error);
    res.status(400).json({ 
      error: "Σφάλμα κατά την προσθήκη αγώνα", 
      details: error.message 
    });
  }
});

// GET: Λίστα αθλητών για συγκεκριμένο άθλημα
router.get("/athletes-by-sport/:id_athlimatos", async (req, res) => {
  try {
    const id_athlimatos = parseInt(req.params.id_athlimatos);
    if (isNaN(id_athlimatos)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αθλήματος" });
    }

    const athletes = await prisma.athlitis.findMany({
      where: {
        asxoleitai: {
          some: {
            id_athlimatos: id_athlimatos
          }
        }
      },
      include: {
        esoteriko_melos: {
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

    const formattedAthletes = athletes.map(athlete => ({
      id: athlete.id_athliti,
      name: `${athlete.esoteriko_melos?.melos?.epafes?.onoma || ''} ${athlete.esoteriko_melos?.melos?.epafes?.epitheto || ''}`,
      athleteNumber: athlete.arithmos_deltiou
    }));

    res.json(formattedAthletes);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των αθλητών του αθλήματος:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ανάκτηση των αθλητών του αθλήματος", 
      details: error.message 
    });
  }
});

// GET: Λίστα όλων των αθλημάτων (απλοποιημένη έκδοση)
router.get("/sports-list", async (_req, res) => {
  try {
    const sports = await prisma.athlima.findMany({
      orderBy: {
        onoma: "asc"
      }
    });

    res.json(sports);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση της λίστας αθλημάτων:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ανάκτηση της λίστας αθλημάτων", 
      details: error.message 
    });
  }
});

// DELETE: Διαγραφή αθλητή
router.delete("/athlete/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αθλητή" });
    }

    await prisma.$transaction(async (prisma) => {
      // Διαγραφή όλων των συσχετίσεων του αθλητή
      await prisma.agonizetai.deleteMany({
        where: { id_athliti: id }
      });
      
      await prisma.asxoleitai.deleteMany({
        where: { id_athliti: id }
      });

      // Βρίσκουμε το ID της επαφής
      const athlete = await prisma.athlitis.findUnique({
        where: { id_athliti: id },
        include: {
          esoteriko_melos: {
            include: {
              melos: true
            }
          }
        }
      });

      if (athlete) {
        const contactId = athlete.esoteriko_melos?.melos?.id_melous;

        // Διαγραφή του αθλητή
        await prisma.athlitis.delete({
          where: { id_athliti: id }
        });

        // Διαγραφή του εσωτερικού μέλους
        await prisma.esoteriko_melos.delete({
          where: { id_es_melous: id }
        });

        // Διαγραφή του μέλους
        if (contactId) {
          await prisma.melos.delete({
            where: { id_melous: contactId }
          });

          // Διαγραφή της επαφής
          await prisma.epafes.delete({
            where: { id_epafis: contactId }
          });
        }
      }
    });

    res.json({ message: "Ο αθλητής διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή του αθλητή:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά τη διαγραφή του αθλητή", 
      details: error.message 
    });
  }
});

// POST: Προσθήκη αθλητών σε αγώνα
router.post("/agona/:id_agona/athletes", async (req, res) => {
  try {
    const id_agona = parseInt(req.params.id_agona);
    const { athleteIds } = req.body;
    
    if (isNaN(id_agona)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αγώνα" });
    }
    
    if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
      return res.status(400).json({ error: "Δεν παρέχθηκαν έγκυρα IDs αθλητών" });
    }
    
    // Προσθήκη των αθλητών στον αγώνα
    await prisma.$transaction(async (prisma) => {
      for (const athleteId of athleteIds) {
        // Έλεγχος αν η συσχέτιση υπάρχει ήδη
        const existing = await prisma.agonizetai.findFirst({
          where: { 
            id_agona: id_agona,
            id_athliti: parseInt(athleteId)
          }
        });
        
        if (!existing) {
          await prisma.agonizetai.create({
            data: {
              id_agona,
              id_athliti: parseInt(athleteId)
            }
          });
        }
      }
    });
    
    // Ανάκτηση του ενημερωμένου αγώνα
    const updatedCompetition = await prisma.agones.findUnique({
      where: { id_agona },
      include: {
        athlima: true,
        agonizetai: {
          include: {
            athlitis: {
              include: {
                esoteriko_melos: {
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
          }
        }
      }
    });
    
    res.status(200).json(updatedCompetition);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη αθλητών στον αγώνα:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την προσθήκη αθλητών στον αγώνα", 
      details: error.message 
    });
  }
});

// DELETE: Αφαίρεση αθλητή από αγώνα
router.delete("/agona/:id_agona/athlete/:id_athliti", async (req, res) => {
  try {
    const id_agona = parseInt(req.params.id_agona);
    const id_athliti = parseInt(req.params.id_athliti);
    
    if (isNaN(id_agona) || isNaN(id_athliti)) {
      return res.status(400).json({ error: "Μη έγκυρα IDs" });
    }
    
    // Διόρθωση: Χρήση deleteMany αντί για delete με compound key
    await prisma.agonizetai.deleteMany({
      where: { 
        id_agona: id_agona,
        id_athliti: id_athliti 
      }
    });
    
    res.status(200).json({ message: "Ο αθλητής αφαιρέθηκε επιτυχώς από τον αγώνα" });
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση του αθλητή από τον αγώνα:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την αφαίρεση του αθλητή από τον αγώνα", 
      details: error.message 
    });
  }
});

// DELETE: Διαγραφή αγώνα
router.delete("/agona/:id_agona", async (req, res) => {
  try {
    const id_agona = parseInt(req.params.id_agona);
    
    if (isNaN(id_agona)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αγώνα" });
    }
    
    await prisma.$transaction(async (prismaTransaction) => {
      // Διαγραφή όλων των συσχετίσεων με αθλητές
      await prismaTransaction.agonizetai.deleteMany({
        where: { id_agona }
      });
      
      // Διαγραφή του αγώνα
      await prismaTransaction.agones.delete({
        where: { id_agona }
      });
    });
    
    res.status(200).json({ message: "Ο αγώνας διαγράφηκε επιτυχώς" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή του αγώνα:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά τη διαγραφή του αγώνα", 
      details: error.message 
    });
  }
});

module.exports = router;