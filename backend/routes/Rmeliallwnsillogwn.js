const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Μετατροπή του BigInt σε string για να μπορεί να σειριοποιηθεί σε JSON
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// GET: Ανάκτηση όλων των μελών άλλων συλλόγων με τις δραστηριότητες και τις σχολές τους
router.get("/", async (_req, res) => {
  try {
    const members = await prisma.eksoteriko_melos.findMany({
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true,
            // Συμπερίληψη των δραστηριοτήτων του μέλους
            simmetoxi: {
              include: {
                drastiriotita: {
                  include: {
                    vathmos_diskolias: true,
                    eksormisi: true
                  }
                }
              }
            },
            // Συμπερίληψη των σχολών του μέλους
            parakolouthisi: {
              include: {
                sxoli: true
              }
            }
          }
        }
      },
      orderBy: {
        id_ekso_melous: "asc",
      },
    });

    const serializedMembers = members.map((member) => ({
      id: member.id_ekso_melous,
      firstName: member.melos?.epafes?.onoma || "",
      lastName: member.melos?.epafes?.epitheto || "",
      phone: member.melos?.epafes?.tilefono ? member.melos.epafes.tilefono.toString() : "",
      email: member.melos?.epafes?.email || "",
      arithmosmitroou: member.arithmos_mitroou,
      onomasillogou: member.onoma_sillogou || "",
      vathmos_diskolias: member.melos?.vathmos_diskolias?.epipedo || 1,
      // Προσθήκη των σχετικών δραστηριοτήτων και σχολών στο response
      melos: {
        simmetoxi: member.melos?.simmetoxi?.map(s => ({
          ...s,
          drastiriotita: s.drastiriotita ? {
            ...s.drastiriotita,
            hmerominia: s.drastiriotita?.hmerominia?.toISOString(),
          } : null
        })) || [],
        parakolouthisi: member.melos?.parakolouthisi || []
      }
    }));

    res.json(serializedMembers);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των μελών άλλων συλλόγων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των μελών άλλων συλλόγων" });
  }
});

// GET: Ανάκτηση ενός συγκεκριμένου μέλους άλλου συλλόγου
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const member = await prisma.eksoteriko_melos.findUnique({
      where: { id_ekso_melous: id },
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true,
            simmetoxi: {
              include: {
                drastiriotita: {
                  include: {
                    vathmos_diskolias: true,
                    eksormisi: true
                  }
                }
              }
            },
            parakolouthisi: {
              include: {
                sxoli: true
              }
            }
          }
        }
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const serializedMember = {
      id: member.id_ekso_melous,
      firstName: member.melos?.epafes?.onoma || "",
      lastName: member.melos?.epafes?.epitheto || "",
      phone: member.melos?.epafes?.tilefono ? member.melos.epafes.tilefono.toString() : "",
      email: member.melos?.epafes?.email || "",
      arithmosmitroou: member.arithmos_mitroou,
      onomasillogou: member.onoma_sillogou || "",
      vathmos_diskolias: member.melos?.vathmos_diskolias?.epipedo || 1,
      melos: {
        simmetoxi: member.melos?.simmetoxi?.map(s => ({
          ...s,
          drastiriotita: s.drastiriotita ? {
            ...s.drastiriotita,
            hmerominia: s.drastiriotita?.hmerominia?.toISOString(),
          } : null
        })) || [],
        parakolouthisi: member.melos?.parakolouthisi || []
      }
    };

    res.json(serializedMember);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση του μέλους:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση του μέλους" });
  }
});

// POST: Προσθήκη νέου μέλους άλλου συλλόγου
router.post("/", async (req, res) => {
  try {
    const { epafes, melos, eksoteriko_melos } = req.body;
    
    // Χρήση transaction για να διασφαλίσουμε την ατομικότητα των λειτουργιών
    const result = await prisma.$transaction(async (prismaTransaction) => {
      if (epafes?.tilefono) {
        epafes.tilefono = BigInt(epafes.tilefono);
      }

      // 1. Δημιουργία της επαφής
      const newEpafi = await prismaTransaction.epafes.create({
        data: epafes
      });

      // 2. Δημιουργία του μέλους
      const newMelos = await prismaTransaction.melos.create({
        data: {
          tipo_melous: "eksoteriko",
          epafes: {
            connect: { id_epafis: newEpafi.id_epafis }
          },
          vathmos_diskolias: {
            connect: { 
              id_vathmou_diskolias: melos.vathmos_diskolias.id_vathmou_diskolias 
            }
          }
        }
      });

      // 3. Δημιουργία του εξωτερικού μέλους
      const newEksoterikoMelos = await prismaTransaction.eksoteriko_melos.create({
        data: {
          ...eksoteriko_melos,
          id_ekso_melous: newMelos.id_melous
        }
      });

      // 4. Ανάκτηση του πλήρους νέου μέλους για την απάντηση
      const completeMember = await prismaTransaction.eksoteriko_melos.findUnique({
        where: { id_ekso_melous: newEksoterikoMelos.id_ekso_melous },
        include: {
          melos: {
            include: {
              epafes: true,
              vathmos_diskolias: true,
              simmetoxi: {
                include: {
                  drastiriotita: {
                    include: {
                      vathmos_diskolias: true,
                      eksormisi: true
                    }
                  }
                }
              },
              parakolouthisi: {
                include: {
                  sxoli: true
                }
              }
            }
          }
        },
      });

      // Επιστρέφουμε τη διαμορφωμένη απάντηση
      return {
        id: completeMember.id_ekso_melous,
        firstName: completeMember.melos?.epafes?.onoma || "",
        lastName: completeMember.melos?.epafes?.epitheto || "",
        phone: completeMember.melos?.epafes?.tilefono ? completeMember.melos.epafes.tilefono.toString() : "",
        email: completeMember.melos?.epafes?.email || "",
        arithmosmitroou: completeMember.arithmos_mitroou,
        onomasillogou: completeMember.onoma_sillogou || "",
        vathmos_diskolias: completeMember.melos?.vathmos_diskolias?.epipedo || 1,
        melos: {
          simmetoxi: completeMember.melos?.simmetoxi || [],
          parakolouthisi: completeMember.melos?.parakolouthisi || []
        }
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding external member:", error);
    res.status(400).json({ error: "Error adding external member", details: error.message });
  }
});

// PUT: Ενημέρωση μέλους άλλου συλλόγου
router.put("/:id", async (req, res) => {
  try {
    const { epafes, vathmos_diskolias, ...memberData } = req.body;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (epafes?.tilefono) {
      epafes.tilefono = BigInt(epafes.tilefono);
    }

    // Έλεγχος ότι το μέλος υπάρχει
    const currentMember = await prisma.eksoteriko_melos.findUnique({
      where: { id_ekso_melous: id },
      include: {
        melos: true
      }
    });

    if (!currentMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Ενημέρωση του μέλους με όλα τα συσχετιζόμενα δεδομένα
    const updateData = {
      onoma_sillogou: memberData.onomasillogou,
      arithmos_mitroou: parseInt(memberData.arithmosmitroou),
      melos: {
        update: {
          epafes: epafes ? { 
            update: {
              onoma: epafes.onoma,
              epitheto: epafes.epitheto,
              email: epafes.email,
              tilefono: epafes.tilefono
            } 
          } : undefined,
          vathmos_diskolias: vathmos_diskolias ? {
            connect: { 
              id_vathmou_diskolias: vathmos_diskolias.id_vathmou_diskolias 
            }
          } : undefined,
        }
      }
    };

    const updatedMember = await prisma.eksoteriko_melos.update({
      where: { id_ekso_melous: id },
      data: updateData,
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true,
            simmetoxi: {
              include: {
                drastiriotita: {
                  include: {
                    vathmos_diskolias: true,
                    eksormisi: true
                  }
                }
              }
            },
            parakolouthisi: {
              include: {
                sxoli: true
              }
            }
          }
        },
      },
    });

    const responseMember = {
      id: updatedMember.id_ekso_melous,
      firstName: updatedMember.melos?.epafes?.onoma || "",
      lastName: updatedMember.melos?.epafes?.epitheto || "",
      phone: updatedMember.melos?.epafes?.tilefono ? updatedMember.melos.epafes.tilefono.toString() : "",
      email: updatedMember.melos?.epafes?.email || "",
      arithmosmitroou: updatedMember.arithmos_mitroou,
      onomasillogou: updatedMember.onoma_sillogou || "",
      vathmos_diskolias: updatedMember.melos?.vathmos_diskolias?.epipedo || 1,
      melos: {
        simmetoxi: updatedMember.melos?.simmetoxi?.map(s => ({
          ...s,
          drastiriotita: s.drastiriotita ? {
            ...s.drastiriotita,
            hmerominia: s.drastiriotita?.hmerominia?.toISOString(),
          } : null
        })) || [],
        parakolouthisi: updatedMember.melos?.parakolouthisi || []
      }
    };

    res.json(responseMember);
  } catch (error) {
    console.error("Error updating external member:", error);
    res.status(400).json({ 
      error: "Error updating external member", 
      details: error.message 
    });
  }
});

// DELETE: Διαγραφή μέλους άλλου συλλόγου
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const memberExists = await prisma.eksoteriko_melos.findUnique({
      where: { id_ekso_melous: id },
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

    // Εκτελούμε τη διαγραφή σε μία συναλλαγή για ατομικότητα
    await prisma.$transaction(async (prisma) => {
      // Βρίσκουμε και διαγράφουμε συμμετοχές
      const simmetoxiIds = await prisma.simmetoxi.findMany({
        where: { id_melous: id },
        select: { id_simmetoxis: true },
      });
      
      // Διαγραφή πληρωμών που σχετίζονται με συμμετοχές
      for (const sim of simmetoxiIds) {
        await prisma.plironei.deleteMany({
          where: { id_simmetoxis: sim.id_simmetoxis },
        });
      }

      // Διαγραφή των συμμετοχών
      await prisma.simmetoxi.deleteMany({
        where: { id_melous: id },
      });

      // Διαγραφή των καταβολών που σχετίζονται με παρακολουθήσεις
      const parakolouthisiIds = await prisma.parakolouthisi.findMany({
        where: { id_melous: id },
        select: { id_parakolouthisis: true },
      });

      for (const para of parakolouthisiIds) {
        await prisma.katavalei.deleteMany({
          where: { id_parakolouthisis: para.id_parakolouthisis },
        });
      }

      // Διαγραφή των παρακολουθήσεων
      await prisma.parakolouthisi.deleteMany({
        where: { id_melous: id },
      });

      // Διαγραφή του εξωτερικού μέλους
      await prisma.eksoteriko_melos.delete({ where: { id_ekso_melous: id } });

      // Διαγραφή της σχέσης μέλους
      await prisma.melos.delete({ where: { id_melous: id } });

      // Διαγραφή της επαφής
      if (memberExists.melos?.epafes) {
        await prisma.epafes.delete({
          where: { id_epafis: memberExists.melos.epafes.id_epafis },
        });
      }
    });

    res.json({ message: "External member and all related records deleted successfully" });
  } catch (error) {
    console.error("Error deleting external member:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Member not found" });
    }

    res.status(500).json({
      error: "Error deleting external member",
      details: error.message,
    });
  }
});

// POST: Προσθήκη συμμετοχής σε δραστηριότητα για μέλος άλλου συλλόγου
router.post("/:id/simmetoxi", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const { id_drastiriotitas, timi, katastasi } = req.body;
    
    const memberExists = await prisma.eksoteriko_melos.findUnique({
      where: { id_ekso_melous: id }
    });

    if (!memberExists) {
      return res.status(404).json({ error: "Member not found" });
    }

    const newSimmetoxi = await prisma.simmetoxi.create({
      data: {
        id_melous: id,
        id_drastiriotitas: id_drastiriotitas,
        timi: timi || null,
        katastasi: katastasi || "Ενεργή",
        hmerominia_dilosis: new Date(),
        ypoloipo: timi || 0,
      },
      include: {
        drastiriotita: true,
        melos: true
      }
    });

    res.status(201).json(newSimmetoxi);
  } catch (error) {
    console.error("Error adding participation:", error);
    res.status(400).json({ error: "Error adding participation", details: error.message });
  }
});

// POST: Προσθήκη παρακολούθησης σχολής για μέλος άλλου συλλόγου
router.post("/:id/parakolouthisi", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const { id_sxolis, timi, katastasi } = req.body;
    
    const memberExists = await prisma.eksoteriko_melos.findUnique({
      where: { id_ekso_melous: id }
    });

    if (!memberExists) {
      return res.status(404).json({ error: "Member not found" });
    }

    const newParakolouthisi = await prisma.parakolouthisi.create({
      data: {
        id_melous: id,
        id_sxolis: id_sxolis,
        timi: timi || null,
        katastasi: katastasi || "Ενεργή",
        hmerominia_dilosis: new Date(),
        ypoloipo: timi || 0,
      },
      include: {
        sxoli: true,
        melos: true
      }
    });

    res.status(201).json(newParakolouthisi);
  } catch (error) {
    console.error("Error adding school attendance:", error);
    res.status(400).json({ error: "Error adding school attendance", details: error.message });
  }
});

module.exports = router;