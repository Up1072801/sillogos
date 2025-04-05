const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
  return this.toString();
};

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

    // Convert BigInt to String for serialization
    const formattedData = members.map((member) => {
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
    const { epafes, ...memberData } = req.body;
    
    // Convert phone number to BigInt if it exists
    if (epafes?.tilefono) {
      epafes.tilefono = BigInt(epafes.tilefono);
    }

    const newMember = await prisma.esoteriko_melos.create({
      data: {
        ...memberData,
        melos: {
          create: {
            tipo_melous: "esoteriko",
            epafes: {
              create: epafes
            },
            vathmos_diskolias: {
              connect: { id_vathmou_diskolias: 1 } // Default difficulty level
            }
          }
        }
      },
      include: {
        melos: {
          include: {
            epafes: true
          }
        }
      }
    });

    // Convert BigInt to String in response
    const responseMember = {
      ...newMember,
      melos: newMember.melos ? {
        ...newMember.melos,
        epafes: newMember.melos.epafes ? {
          ...newMember.melos.epafes,
          tilefono: newMember.melos.epafes.tilefono?.toString()
        } : null
      } : null
    };

    res.status(201).json(responseMember);
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(400).json({ error: "Error adding member", details: error.message });
  }
});
// PUT: Update member// PUT: Update member
router.put("/:id", async (req, res) => {
  try {
    const { epafes, vathmos_diskolias, ...memberData } = req.body;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Convert phone number to BigInt if it exists
    if (epafes?.tilefono) {
      epafes.tilefono = BigInt(epafes.tilefono);
    }

    // Get current member to check relationships
    const currentMember = await prisma.esoteriko_melos.findUnique({
      where: { id_es_melous: id },
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true
          }
        }
      }
    });

    const updatedMember = await prisma.esoteriko_melos.update({
      where: { id_es_melous: id },
      data: {
        ...memberData,
        melos: {
          update: {
            epafes: epafes ? { update: epafes } : undefined,
            vathmos_diskolias: vathmos_diskolias ? {
              upsert: {
                where: { id_vathmou_diskolias: currentMember.melos?.vathmos_diskolias?.id_vathmou_diskolias || 1 },
                update: { epipedo: vathmos_diskolias.epipedo },
                create: { epipedo: vathmos_diskolias.epipedo },
              }
            } : undefined,
          },
        },
      },
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true,
          },
        },
      },
    });

    // Convert BigInt to String in response
    const responseMember = {
      ...updatedMember,
      melos: updatedMember.melos ? {
        ...updatedMember.melos,
        epafes: updatedMember.melos.epafes ? {
          ...updatedMember.melos.epafes,
          tilefono: updatedMember.melos.epafes.tilefono?.toString()
        } : null,
        vathmos_diskolias: updatedMember.melos.vathmos_diskolias || null
      } : null
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

    // Ενισχυμένος έλεγχος ύπαρξης μέλους
    const memberExists = await prisma.esoteriko_melos.findUnique({
      where: { id_es_melous: id },
      include: {
        melos: {
          include: {
            epafes: true, // Συμπερίληψη της επαφής για διαγραφή
          },
        },
      },
    });

    if (!memberExists) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Διαγραφή σχετικών εγγραφών
    await prisma.$transaction(async (prisma) => {
      // Βρες τα id_simmetoxis που σχετίζονται με το μέλος
      const simmetoxiIds = await prisma.simmetoxi.findMany({
        where: { id_melous: id },
        select: { id_simmetoxis: true },
      });

      // Εξαγωγή των ID σε έναν πίνακα
      const simmetoxiIdList = simmetoxiIds.map((s) => s.id_simmetoxis);

      // Διαγραφή από τον πίνακα plironei
      await prisma.plironei.deleteMany({
        where: {
          id_simmetoxis: { in: simmetoxiIdList },
        },
      });

      // Διαγραφή από τον πίνακα simmetoxi
      await prisma.simmetoxi.deleteMany({
        where: { id_melous: id },
      });

      // Διαγραφή από τον πίνακα katavalei πριν τον πίνακα parakolouthisi
      await prisma.katavalei.deleteMany({
        where: { id_parakolouthisis: { in: await prisma.parakolouthisi.findMany({
          where: { id_melous: id },
          select: { id_parakolouthisis: true },
        }).then((results) => results.map((r) => r.id_parakolouthisis)) } },
      });

      // Διαγραφή από τον πίνακα parakolouthisi
      await prisma.parakolouthisi.deleteMany({
        where: { id_melous: id },
      });

      // Διαγραφή από τον πίνακα exei πριν τον πίνακα epafes
      await prisma.exei.deleteMany({
        where: { id_sindromiti: id },
      });

      // Διαγραφή από τον πίνακα eksoflei πριν τον πίνακα epafes
      if (memberExists.melos?.epafes) {
        await prisma.eksoflei.deleteMany({
          where: { id_epafis: memberExists.melos.epafes.id_epafis },
        });
      }

      // Διαγραφή από τον πίνακα epafes
      if (memberExists.melos?.epafes) {
        await prisma.epafes.delete({
          where: { id_epafis: memberExists.melos.epafes.id_epafis },
        });
      }

      // Διαγραφή από άλλους σχετικούς πίνακες
      await prisma.athlitis.deleteMany({ where: { id_athliti: id } });
      await prisma.sindromitis.deleteMany({ where: { id_sindromiti: id } });

      // Έλεγχος ύπαρξης εγγραφής πριν τη διαγραφή
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