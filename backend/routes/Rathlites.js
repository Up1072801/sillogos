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
        id_athlimatos: sport.id_athlimatos, // Προσθήκη για συνέπεια
        athlima: sport.onoma || "",
        participants: uniqueAthletes.size,
        totalCompetitions: totalAthleteParticipations,
        agones: sport.agones.map((agonas) => ({
          id: agonas.id_agona,
          id_agona: agonas.id_agona, // Προσθήκη για συνέπεια
          id_athlimatos: agonas.id_athlimatos,
          onoma: agonas.onoma,
          perigrafi: agonas.perigrafi,
          hmerominia: agonas.hmerominia ? new Date(agonas.hmerominia).toISOString().split('T')[0] : "",
          summetexontesCount: agonas.agonizetai.length,
          summetexontes: agonas.agonizetai.map((agonizetai) => {
            const athlitis = agonizetai.athlitis;
            const firstName = athlitis.esoteriko_melos?.melos?.epafes?.onoma || "";
            const lastName = athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "";
            const fullName = `${firstName} ${lastName}`.trim();
            return {
              id: athlitis.id_athliti,
              id_athliti: athlitis.id_athliti,
              firstName,
              lastName,
              fullName,
              arithmosdeltiou: athlitis.arithmos_deltiou || "",
            };
          })
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

    // Έλεγχος ότι έχουμε τουλάχιστον τα βασικά στοιχεία
    if (!vathmos_diskolias?.id_vathmou_diskolias) {
      return res.status(400).json({ 
        error: "Ο βαθμός δυσκολίας είναι υποχρεωτικός" 
      });
    }

    // Έλεγχος ότι ο βαθμός δυσκολίας υπάρχει
    const difficultyExists = await prisma.vathmos_diskolias.findUnique({
      where: { id_vathmou_diskolias: vathmos_diskolias.id_vathmou_diskolias }
    });

    if (!difficultyExists) {
      return res.status(400).json({ 
        error: "Μη έγκυρος βαθμός δυσκολίας" 
      });
    }

    const result = await prisma.$transaction(async (prismaTransaction) => {
      // 1. Δημιουργία επαφής
      const newEpafi = await prismaTransaction.epafes.create({
        data: {
          onoma: epafes?.onoma || "",
          epitheto: epafes?.epitheto || "",
          email: epafes?.email || "",
          tilefono: epafes?.tilefono ? BigInt(epafes.tilefono) : null,
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

      // 3. Δημιουργία εσωτερικού μέλους με σωστή σύνδεση
      const newEsoterikoMelos = await prismaTransaction.esoteriko_melos.create({
        data: {
          id_es_melous: newMelos.id_melous,
          hmerominia_gennhshs: esoteriko_melos?.hmerominia_gennhshs || null,
          patronimo: esoteriko_melos?.patronimo || "",
          odos: esoteriko_melos?.odos || "",
          tk: esoteriko_melos?.tk || null,
          arithmos_mitroou: esoteriko_melos?.arithmos_mitroou || null,
          // Η σύνδεση με το melos γίνεται αυτόματα μέσω του id_es_melous
          // που είναι το ίδιο με το id_melous
        }
      });

      // 4. Δημιουργία αθλητή
      const newAthlitis = await prismaTransaction.athlitis.create({
        data: {
          id_athliti: newEsoterikoMelos.id_es_melous,
          arithmos_deltiou: athlitis?.arithmos_deltiou || null,
          hmerominia_enarksis_deltiou: athlitis?.hmerominia_enarksis_deltiou || null,
          hmerominia_liksis_deltiou: athlitis?.hmerominia_liksis_deltiou || null,
        }
      });

      // 5. Συσχέτιση με αθλήματα (μόνο αν υπάρχουν)
      if (athlimata && Array.isArray(athlimata) && athlimata.length > 0) {
        for (const athleteId of athlimata) {
          // Έλεγχος ότι το άθλημα υπάρχει
          const sportExists = await prismaTransaction.athlima.findUnique({
            where: { id_athlimatos: parseInt(athleteId) }
          });
          
          if (sportExists) {
            await prismaTransaction.asxoleitai.create({
              data: {
                id_athliti: newAthlitis.id_athliti,
                id_athlimatos: parseInt(athleteId)
              }
            });
          }
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
                  vathmos_diskolias: true
                }
              }
            }
          },
          asxoleitai: {
            include: {
              athlima: true
            }
          }
        }
      });

      return completeAthlete;
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
    const { id_athlimatos, onoma, perigrafi, hmerominia, athleteIds } = req.body;
    
    // Έλεγχος εγκυρότητας id_athlimatos
    const sportId = parseInt(id_athlimatos);
    if (isNaN(sportId)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αθλήματος" });
    }

    const result = await prisma.$transaction(async (prismaTransaction) => {
      // 1. Δημιουργία αγώνα
      const newAgona = await prismaTransaction.agones.create({
        data: {
          id_athlimatos: sportId,
          onoma,
          perigrafi,
          hmerominia: hmerominia ? new Date(hmerominia) : null
        }
      });

      // 2. Συσχέτιση με αθλητές
      if (Array.isArray(athleteIds) && athleteIds.length > 0) {
        for (const athleteId of athleteIds) {
          const parsedAthleteId = parseInt(athleteId);
          if (isNaN(parsedAthleteId)) {
            console.warn(`Αγνοήθηκε μη έγκυρο ID αθλητή: ${athleteId}`);
            continue;
          }
          
          await prismaTransaction.agonizetai.create({
            data: {
              id_agona: newAgona.id_agona,
              id_athliti: parsedAthleteId
            }
          });
        }
      }

      // Επιστροφή του πλήρους αγώνα με συμμετέχοντες
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

      return {
        id: completeAgona.id_agona,
        id_agona: completeAgona.id_agona,
        id_athlimatos: completeAgona.id_athlimatos,
        onoma: completeAgona.onoma,
        perigrafi: completeAgona.perigrafi,
        hmerominia: completeAgona.hmerominia ? new Date(completeAgona.hmerominia).toISOString().split('T')[0] : null,
        athlima: completeAgona.athlima.onoma,
        summetexontesCount: completeAgona.agonizetai.length,
        summetexontes: completeAgona.agonizetai.map((agonizetai) => {
          const athlitis = agonizetai.athlitis;
          const firstName = athlitis.esoteriko_melos?.melos?.epafes?.onoma || "";
          const lastName = athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "";
          const fullName = `${firstName} ${lastName}`.trim();
          return {
            id: athlitis.id_athliti,
            id_athliti: athlitis.id_athliti,
            firstName,
            lastName,
            fullName,
            arithmosdeltiou: athlitis.arithmos_deltiou || "",
          };
        })
      };
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

// Προσθέστε ή τροποποιήστε το endpoint για αθλητές ανά άθλημα

router.get("/by-sport/:sportId", async (req, res) => {
  try {
    const sportId = parseInt(req.params.sportId);
    
    if (isNaN(sportId)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αθλήματος" });
    }
    
    // Βρίσκουμε όλους τους αθλητές που ασχολούνται με το συγκεκριμένο άθλημα
    const athletes = await prisma.asxoleitai.findMany({
      where: {
        id_athlimatos: sportId
      },
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
        },
        athlima: true
      }
    });
    
    // Διαμορφώνουμε τα δεδομένα για το frontend με συνεπή IDs
    const formattedAthletes = athletes.map(asxoleitai => ({
      id: asxoleitai.athlitis.id_athliti,
      id_athliti: asxoleitai.athlitis.id_athliti, // Προσθήκη για συνέπεια
      firstName: asxoleitai.athlitis.esoteriko_melos?.melos?.epafes?.onoma || "",
      lastName: asxoleitai.athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "",
      arithmosdeltiou: asxoleitai.athlitis.arithmos_deltiou || "",
      fullName: `${asxoleitai.athlitis.esoteriko_melos?.melos?.epafes?.onoma || ""} ${asxoleitai.athlitis.esoteriko_melos?.melos?.epafes?.epitheto || ""}`.trim(),
      name: `${asxoleitai.athlitis.esoteriko_melos?.melos?.epafes?.onoma || ""} ${asxoleitai.athlitis.esoteriko_melos?.melos?.epafes?.epitheto || ""}`.trim(),
      athleteNumber: asxoleitai.athlitis.arithmos_deltiou || ""
    }));
    
    res.json(formattedAthletes);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση αθλητών ανά άθλημα:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση αθλητών" });
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
  const id_agona = parseInt(req.params.id_agona);
  const id_athliti = parseInt(req.params.id_athliti);

  try {
    // Χρήση deleteMany αντί για findUnique + delete για να αποφύγουμε το πρόβλημα με το composite key
    const result = await prisma.agonizetai.deleteMany({
      where: {
        id_agona: id_agona,
        id_athliti: id_athliti
      }
    });
    
    if (result.count === 0) {
      return res.status(200).json({ 
        message: "Ο αθλητής δεν υπήρχε στον αγώνα ή έχει ήδη αφαιρεθεί",
        deletedCount: 0
      });
    }
    
    res.status(200).json({
      message: "Ο αθλητής αφαιρέθηκε επιτυχώς από τον αγώνα",
      deletedCount: result.count
    });
  } catch (error) {
    console.error("Σφάλμα διαγραφής συμμετοχής:", error);
    res.status(500).json({ error: "Σφάλμα διαγραφής συμμετοχής", details: error.message });
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

// PUT: Ενημέρωση αγώνα
router.put("/agona/:id_agona", async (req, res) => {
  try {
    const id_agona = parseInt(req.params.id_agona);
    const { id_athlimatos, onoma, perigrafi, hmerominia } = req.body;
    
    if (isNaN(id_agona)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αγώνα" });
    }
    
    // Ενημέρωση του αγώνα
    const updatedAgona = await prisma.agones.update({
      where: { id_agona },
      data: {
        id_athlimatos: id_athlimatos ? parseInt(id_athlimatos) : undefined,
        onoma: onoma || undefined,
        perigrafi: perigrafi || undefined,
        hmerominia: hmerominia ? new Date(hmerominia) : undefined
      },
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
    
    res.json(updatedAgona);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση του αγώνα:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ενημέρωση του αγώνα", 
      details: error.message 
    });
  }
});

// DELETE: Διαγραφή όλων των αθλητών από έναν αγώνα
router.delete("/agona/:id_agona/athletes", async (req, res) => {
  try {
    const id_agona = parseInt(req.params.id_agona);
    
    if (isNaN(id_agona)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αγώνα" });
    }
    
    await prisma.agonizetai.deleteMany({
      where: { id_agona }
    });
    
    res.status(200).json({ message: "Όλοι οι αθλητές αφαιρέθηκαν επιτυχώς από τον αγώνα" });
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση των αθλητών από τον αγώνα:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την αφαίρεση των αθλητών από τον αγώνα", 
      details: error.message 
    });
  }
});

// Προσθέστε στο Rathlites.js για διαχείριση αθλητών ανά αγώνα
router.post("/agona/:id/athletes", async (req, res) => {
  try {
    const agonaId = parseInt(req.params.id);
    const { athleteIds } = req.body;
    
    if (isNaN(agonaId)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αγώνα" });
    }
    
    // Έλεγχος ύπαρξης του αγώνα
    const agonasExists = await prisma.agones.findUnique({
      where: { id_agona: agonaId }
    });
    
    if (!agonasExists) {
      return res.status(404).json({ error: "Δεν βρέθηκε ο αγώνας" });
    }

    // Διαγραφή υπαρχόντων συσχετίσεων
    await prisma.agonizetai.deleteMany({
      where: { id_agona: agonaId }
    });
    
    // Δημιουργία νέων συσχετίσεων
    if (Array.isArray(athleteIds) && athleteIds.length > 0) {
      // Φιλτράρισμα μόνο έγκυρων IDs αθλητών
      const validIds = athleteIds
        .map(id => typeof id === 'number' ? id : parseInt(id))
        .filter(id => !isNaN(id));
        
      const createPromises = validIds.map(athleteId => 
        prisma.agonizetai.create({
          data: {
            id_agona: agonaId,
            id_athliti: athleteId
          }
        })
      );
      
      await Promise.all(createPromises);
    }
    
    // Ανάκτηση του ενημερωμένου αγώνα
    const updatedCompetition = await prisma.agones.findUnique({
      where: { id_agona: agonaId },
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
    
    // Επιστροφή διαμορφωμένης απάντησης
    const formattedResponse = {
      id: updatedCompetition.id_agona,
      id_agona: updatedCompetition.id_agona,
      id_athlimatos: updatedCompetition.id_athlimatos,
      onoma: updatedCompetition.onoma,
      perigrafi: updatedCompetition.perigrafi,
      hmerominia: updatedCompetition.hmerominia ? new Date(updatedCompetition.hmerominia).toISOString().split('T')[0] : null,
      summetexontesCount: updatedCompetition.agonizetai.length,
      summetexontes: updatedCompetition.agonizetai.map((agonizetai) => {
        const athlitis = agonizetai.athlitis;
        const firstName = athlitis.esoteriko_melos?.melos?.epafes?.onoma || "";
        const lastName = athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return {
          id: athlitis.id_athliti,
          id_athliti: athlitis.id_athλiti,
          firstName,
          lastName,
          fullName,
          arithmosdeltiou: athlitis.arithmos_deltiou || "",
        };
      }),
      success: true,
      message: "Οι αθλητές ενημερώθηκαν επιτυχώς"
    };
    
    res.json(formattedResponse);
  } catch (error) {
    console.error("Σφάλμα ενημέρωσης αθλητών αγώνα:", error);
    res.status(500).json({ error: "Σφάλμα ενημέρωσης αθλητών αγώνα", details: error.message });
  }
});

// PUT: Ενημέρωση υπάρχοντος αθλητή
router.put("/athlete/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Μη έγκυρο ID αθλητή" });
    }

    const { 
      epafes, 
      vathmos_diskolias, 
      esoteriko_melos, 
      athlitis, 
      athlimata 
    } = req.body;

    // Έλεγχος ότι ο αθλητής υπάρχει
    const existingAthlete = await prisma.athlitis.findUnique({
      where: { id_athliti: id },
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

    if (!existingAthlete) {
      return res.status(404).json({ error: "Ο αθλητής δεν βρέθηκε" });
    }

    const epafisId = existingAthlete.esoteriko_melos?.melos?.epafes?.id_epafis;

    if (!epafisId) {
      return res.status(404).json({ error: "Δεν βρέθηκαν δεδομένα επαφής για τον αθλητή" });
    }

    const result = await prisma.$transaction(async (prismaTransaction) => {
      // 1. Ενημέρωση επαφής
      if (epafes) {
        await prismaTransaction.epafes.update({
          where: { id_epafis: epafisId },
          data: {
            ...epafes,
            tilefono: epafes.tilefono ? BigInt(epafes.tilefono) : null,
          }
        });
      }

      // 2. Ενημέρωση βαθμού δυσκολίας
      if (vathmos_diskolias) {
        await prismaTransaction.melos.update({
          where: { id_melous: epafisId },
          data: {
            id_vathmou_diskolias: vathmos_diskolias.id_vathmou_diskolias,
          }
        });
      }

      // 3. Ενημέρωση εσωτερικού μέλους
      if (esoteriko_melos) {
        await prismaTransaction.esoteriko_melos.update({
          where: { id_es_melous: id },
          data: {
            ...esoteriko_melos
          }
        });
      }

      // 4. Ενημέρωση αθλητή
      if (athlitis) {
        await prismaTransaction.athlitis.update({
          where: { id_athliti: id },
          data: {
            ...athlitis
          }
        });
      }

      // 5. Ενημέρωση συσχετίσεων με αθλήματα
      if (athlimata && athlimata.length > 0) {
        // Διαγραφή υπαρχουσών συσχετίσεων
        await prismaTransaction.asxoleitai.deleteMany({
          where: { id_athliti: id }
        });
        
        // Δημιουργία νέων συσχετίσεων
        for (const athleteItem of athlimata) {
          // Handle both formats: direct ID or object with id_athlimatos
          const athleteId = typeof athleteItem === 'object' && athleteItem.id_athlimatos 
            ? athleteItem.id_athlimatos 
            : parseInt(athleteItem);
            
          await prismaTransaction.asxoleitai.create({
            data: {
              id_athliti: id,
              id_athlimatos: athleteId
            }
          });
        }
      }

      // 6. Ανάκτηση του πλήρους ενημερωμένου αθλητή
      const completeAthlete = await prismaTransaction.athlitis.findUnique({
        where: { id_athliti: id },
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

    res.status(200).json(result);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση αθλητή:", error);
    res.status(400).json({ 
      error: "Σφάλμα κατά την ενημέρωση αθλητή", 
      details: error.message 
    });
  }
});

module.exports = router;