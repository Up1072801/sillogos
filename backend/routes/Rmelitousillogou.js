const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Βοηθητική συνάρτηση για έλεγχο αν η ημερομηνία είναι μετά την 1η Ιουνίου
function isAfterJuneFirst(date) {
  const juneFirst = new Date(date.getFullYear(), 5, 1); // JavaScript μήνες: 0-11
  return date >= juneFirst;
}

// Middleware για ενημέρωση καταστάσεων συνδρομών
router.use(async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    
    // Βρες μέλη με ενεργές συνδρομές που πρέπει να λήξουν
    // 1. Όσες ξεκίνησαν πριν την αρχή του τρέχοντος έτους
    // 2. ΚΑΙ δεν ξεκίνησαν μετά την 1η Ιουνίου του προηγούμενου έτους
    // (δηλαδή δεν πληρούν τον κανόνα του 1.5 έτους)
    const membersToExpire = await prisma.esoteriko_melos.findMany({
      where: {
        sindromitis: {
          katastasi_sindromis: "Ενεργή",
          exei: {
            some: {
              sindromi: {
                hmerominia_enarksis: {
                  lt: new Date(`${currentYear}-01-01`) // Ξεκίνησαν πριν την αρχή του τρέχοντος έτους
                }
              }
            }
          },
          NOT: {
            exei: {
              some: {
                sindromi: {
                  hmerominia_enarksis: {
                    gte: new Date(`${currentYear-1}-06-01`), // Ξεκίνησαν μετά την 1η Ιουνίου του προηγούμενου έτους
                    lt: new Date(`${currentYear}-01-01`)     // και πριν την αρχή του τρέχοντος έτους
                  }
                }
              }
            }
          }
        }
      },
      select: {
        id_es_melous: true
      }
    });

    // Ενημέρωση της κατάστασης συνδρομής σε "Ληγμένη"
    await prisma.sindromitis.updateMany({
      where: {
        id_sindromiti: {
          in: membersToExpire.map(m => m.id_es_melous)
        }
      },
      data: {
        katastasi_sindromis: "Ληγμένη"
      }
    });
    
    next();
  } catch (error) {
    console.error("Error updating subscription statuses:", error);
    next();
  }
});

// GET: Retrieve all club members
router.get("/", async (_req, res) => {
  try {
    const members = await prisma.esoteriko_melos.findMany({
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true,
            parakolouthisi: {
              include: {
                sxoli: true,
              },
            },
            simmetoxi: {
              include: {
                drastiriotita: {
                  include: {
                    vathmos_diskolias: true,
                    eksormisi: true,
                  },
                },
              },
            },
          },
        },
        athlitis: true,
        sindromitis: {
          include: {
            exei: {
              take: 1, // Παίρνει μόνο την πρώτη εγγραφή αντί να κάνει orderBy
              include: {
                sindromi: {
                  include: {
                    eidos_sindromis: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id_es_melous: "asc",
      },
    });

    const formattedData = members.map((member) => {
      const latestPayment = member.sindromitis?.exei?.[0]?.hmerominia_pliromis || null;
      const registrationDate = member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis || null;

      const formattedMember = {
        ...member,
        melos: member.melos ? {
          ...member.melos,
          epafes: member.melos.epafes ? {
            ...member.melos.epafes,
            tilefono: member.melos.epafes.tilefono?.toString()
          } : null
        } : null,
        eidosSindromis: member.athlitis
          ? "Αθλητής"
          : member.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "-",
        hmerominia_egrafis: registrationDate,
        hmerominia_pliromis: latestPayment,
      };
      return formattedMember;
    });

    res.json(formattedData);
  } catch (error) {
    console.error("Error retrieving members:", error);
    res.status(500).json({
      error: "Error retrieving members",
      details: error.message,
    });
  }
});

// POST: Add new member
router.post("/", async (req, res) => {
  try {
    const { epafes, melos, esoteriko_melos, sindromitis } = req.body;
    
    // Χρήση transaction για να διασφαλίσουμε την ατομικότητα των λειτουργιών
    const result = await prisma.$transaction(async (prismaTransaction) => {
      if (epafes?.tilefono) {
        epafes.tilefono = BigInt(epafes.tilefono);
      }

      // 1. Δημιουργία της επαφής
      const newEpafi = await prismaTransaction.epafes.create({
        data: epafes
      });

      // Στο backend, αρχείο Rmelitousillogou.js
      // Στο σημείο δημιουργίας του μέλους:

      // Έλεγχος για έγκυρο ID βαθμού δυσκολίας
      const vathmosId = melos.vathmos_diskolias?.id_vathmou_diskolias || 1; // Προεπιλογή στο 1

      const newMelos = await prismaTransaction.melos.create({
        data: {
          tipo_melous: melos.tipo_melous || "esoteriko",
          epafes: {
            connect: { id_epafis: newEpafi.id_epafis }
          },
          vathmos_diskolias: {
            connect: { 
              id_vathmou_diskolias: vathmosId
            }
          }
        }
      });

      // 3. Δημιουργία του εσωτερικού μέλους
      const newEsoterikoMelos = await prismaTransaction.esoteriko_melos.create({
        data: {
          ...esoteriko_melos,
          id_es_melous: newMelos.id_melous
        }
      });

      // Προσθέστε αυτό πριν τη δημιουργία του sindromitis
      const startDate = new Date(sindromitis.exei.sindromi.hmerominia_enarksis);
      const isExtendedSubscription = isAfterJuneFirst(startDate);
      const subscriptionStatus = sindromitis.katastasi_sindromis || "Ενεργή"; // Πάντα ξεκινάει ως ενεργή
      
      // 4. Δημιουργία του συνδρομητή
      const newSindromitis = await prismaTransaction.sindromitis.create({
        data: {
          id_sindromiti: newEsoterikoMelos.id_es_melous,
          katastasi_sindromis: subscriptionStatus
          // Αφαιρέστε το πεδίο sxolia που δημιουργεί το σφάλμα
        }
      });

      // 5. Αναζήτηση του είδους συνδρομής
      const eidosSindromisRecord = await prismaTransaction.eidos_sindromis.findFirst({
        where: {
          titlos: sindromitis.exei.sindromi.eidos_sindromis
        }
      });

      if (!eidosSindromisRecord) {
        throw new Error(`Δεν βρέθηκε είδος συνδρομής με τίτλο: ${sindromitis.exei.sindromi.eidos_sindromis}`);
      }

// 6. Δημιουργία της συνδρομής - χρήση χειροκίνητης αρίθμησης
// Πρώτα βρίσκουμε το μέγιστο id_sindromis στη βάση
const maxIdResult = await prismaTransaction.sindromi.aggregate({
  _max: {
    id_sindromis: true,
  },
});
const newId = (maxIdResult._max.id_sindromis || 0) + 1;

// Δημιουργία με συγκεκριμένο ID
const newSindromi = await prismaTransaction.sindromi.create({
  data: {
    id_sindromis: newId,
    hmerominia_enarksis: new Date(sindromitis.exei.sindromi.hmerominia_enarksis),
    id_eidous_sindromis: eidosSindromisRecord.id_eidous_sindromis
  }
});
      // 7. Δημιουργία της σχέσης "exei"
      await prismaTransaction.exei.create({
        data: {
          id_sindromiti: newSindromitis.id_sindromiti,
          id_sindromis: newSindromi.id_sindromis,
          hmerominia_pliromis: new Date(sindromitis.exei.hmerominia_pliromis)
        }
      });

      // 8. Ανάκτηση του πλήρους νέου μέλους για την απάντηση
      const completeMember = await prismaTransaction.esoteriko_melos.findUnique({
        where: { id_es_melous: newEsoterikoMelos.id_es_melous },
        include: {
          melos: {
            include: {
              epafes: true,
              vathmos_diskolias: true,
            },
          },
          sindromitis: {
            include: {
              exei: {
                include: {
                  sindromi: {
                    include: {
                      eidos_sindromis: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Επιστρέφουμε τη διαμορφωμένη απάντηση
      return {
        ...completeMember,
        melos: completeMember.melos ? {
          ...completeMember.melos,
          epafes: completeMember.melos.epafes ? {
            ...completeMember.melos.epafes,
            tilefono: completeMember.melos.epafes.tilefono?.toString()
          } : null
        } : null,
        eidosSindromis: completeMember.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "-",
        hmerominia_egrafis: completeMember.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis,
        hmerominia_pliromis: completeMember.sindromitis?.exei?.[0]?.hmerominia_pliromis
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(400).json({ error: "Error adding member", details: error.message });
  }
});
// PUT: Update member
router.put("/:id", async (req, res) => {
  try {
    const { epafes, vathmos_diskolias, sindromitis, eidosSindromis, hmerominia_enarksis, hmerominia_pliromis, ...memberData } = req.body;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Ελέγξτε και μετατρέψτε το tilefono
    if (epafes?.tilefono) {
      epafes.tilefono = BigInt(epafes.tilefono);
    }

    // Διασφάλιση ότι το arithmos_mitroou είναι αριθμός
    if (memberData.arithmos_mitroou !== undefined) {
      memberData.arithmos_mitroou = parseInt(memberData.arithmos_mitroou);
      if (isNaN(memberData.arithmos_mitroou)) {
        delete memberData.arithmos_mitroou;
      }
    }

    // Διασφάλιση ότι το tk είναι αριθμός
    if (memberData.tk !== undefined) {
      memberData.tk = parseInt(memberData.tk);
      if (isNaN(memberData.tk)) {
        delete memberData.tk;
      }
    }

    // Έλεγχος του τρέχοντος μέλους
    const currentMember = await prisma.esoteriko_melos.findUnique({
      where: { id_es_melous: id },
      include: {
        melos: true,
        sindromitis: {
          include: {
            exei: {
              include: {
                sindromi: true
              }
            }
          }
        }
      }
    });

    if (!currentMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Δεδομένα ενημέρωσης
    const updateData = {
      ...memberData,
      melos: {
        update: {
          epafes: epafes ? { update: epafes } : undefined,
          vathmos_diskolias: vathmos_diskolias ? {
            connect: { id_vathmou_diskolias: parseInt(vathmos_diskolias.id_vathmou_diskolias) }
          } : undefined
        }
      }
    };

    // Προσθήκη ενημέρωσης συνδρομιτή αν υπάρχει
    if (sindromitis || eidosSindromis || hmerominia_enarksis || hmerominia_pliromis) {
      // Αν υπάρχει sindromitis
      if (currentMember.sindromitis) {
        updateData.sindromitis = {
          update: {
            katastasi_sindromis: sindromitis?.katastasi_sindromis
          }
        };

        // Αν υπάρχει exei σχέση
        const exeiRelation = currentMember.sindromitis.exei?.[0];
        if (exeiRelation) {
          // Ενημέρωση της υπάρχουσας σχέσης exei
          updateData.sindromitis.update.exei = {
            update: {
              data: {
                hmerominia_pliromis: hmerominia_pliromis ? new Date(hmerominia_pliromis) : undefined
              },
              where: { 
                id_sindromiti_id_sindromis: {
                  id_sindromiti: id,
                  id_sindromis: exeiRelation.id_sindromis
                }
              }
            }
          };

          // Ενημέρωση της συνδρομής εάν ζητείται
          if (hmerominia_enarksis || eidosSindromis) {
            const sindromisUpdate = {};
            
            if (hmerominia_enarksis) {
              sindromisUpdate.hmerominia_enarksis = new Date(hmerominia_enarksis);
            }
            
            if (eidosSindromis) {
              // Βρείτε το ID του είδους συνδρομής με βάση το όνομα
              const subscriptionType = await prisma.eidos_sindromis.findFirst({
                where: { titlos: eidosSindromis }
              });
              
              if (subscriptionType) {
                sindromisUpdate.id_eidous_sindromis = subscriptionType.id_eidous_sindromis;
              }
            }
            
            // Προσθέστε την ενημέρωση της συνδρομής
            await prisma.sindromi.update({
              where: { id_sindromis: exeiRelation.id_sindromis },
              data: sindromisUpdate
            });
          }
        }
      }
    }

    // Εκτέλεση της ενημέρωσης
    const updatedMember = await prisma.esoteriko_melos.update({
      where: { id_es_melous: id },
      data: updateData,
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true
          }
        },
        sindromitis: {
          include: {
            exei: {
              include: {
                sindromi: {
                  include: {
                    eidos_sindromis: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const responseMember = {
      ...updatedMember,
      melos: updatedMember.melos ? {
        ...updatedMember.melos,
        epafes: updatedMember.melos.epafes ? {
          ...updatedMember.melos.epafes,
          tilefono: updatedMember.melos.epafes.tilefono?.toString()
        } : null,
        vathmos_diskolias: updatedMember.melos.vathmos_diskolias || null
      } : null,
      eidosSindromis: updatedMember.athlitis
        ? "Αθλητής"
        : updatedMember.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "-",
      hmerominia_pliromis: updatedMember.sindromitis?.exei?.[0]?.hmerominia_pliromis || null
    };

    res.json(responseMember);
  } catch (error) {
    console.error("Error updating member:", error);
    res.status(400).json({ 
      error: "Error updating member", 
      details: error.message 
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const memberExists = await prisma.esoteriko_melos.findUnique({
      where: { id_es_melous: id },
      include: {
        melos: {
          include: {
            epafes: true,
          },
        },
      },
    });

    if (!memberExists) {
      return res.status(404).json({ error: "Member not found" });
    }

    await prisma.$transaction(async (prisma) => {
      const simmetoxiIds = await prisma.simmetoxi.findMany({
        where: { id_melous: id },
        select: { id_simmetoxis: true },
      });

      const simmetoxiIdList = simmetoxiIds.map((s) => s.id_simmetoxis);

      await prisma.plironei.deleteMany({
        where: {
          id_simmetoxis: { in: simmetoxiIdList },
        },
      });

      await prisma.simmetoxi.deleteMany({
        where: { id_melous: id },
      });

      await prisma.katavalei.deleteMany({
        where: { id_parakolouthisis: { in: await prisma.parakolouthisi.findMany({
          where: { id_melous: id },
          select: { id_parakolouthisis: true },
        }).then((results) => results.map((r) => r.id_parakolouthisis)) } },
      });

      await prisma.parakolouthisi.deleteMany({
        where: { id_melous: id },
      });

      await prisma.exei.deleteMany({
        where: { id_sindromiti: id },
      });

      if (memberExists.melos?.epafes) {
        await prisma.eksoflei.deleteMany({
          where: { id_epafis: memberExists.melos.epafes.id_epafis },
        });
      }

      if (memberExists.melos?.epafes) {
        await prisma.epafes.delete({
          where: { id_epafis: memberExists.melos.epafes.id_epafis },
        });
      }

      await prisma.athlitis.deleteMany({ where: { id_athliti: id } });
      await prisma.sindromitis.deleteMany({ where: { id_sindromiti: id } });

      const melosExists = await prisma.melos.findUnique({
        where: { id_melous: id },
      });

      if (melosExists) {
        await prisma.melos.delete({ where: { id_melous: id } });
      }

      const esoterikoMelosExists = await prisma.esoteriko_melos.findUnique({
        where: { id_es_melous: id },
      });

      if (esoterikoMelosExists) {
        await prisma.esoteriko_melos.delete({ where: { id_es_melous: id } });
      }
    });

    res.json({ message: "Member and all related records deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Member not found" });
    }

    res.status(500).json({
      error: "Error deleting member",
      details: error.message,
    });
  }
});

module.exports = router;