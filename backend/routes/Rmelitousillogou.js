const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Middleware για ενημέρωση καταστάσεων συνδρομών
router.use(async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const cutoffDate = new Date(`${currentYear}-06-01`);
    
    // Find members with active subscriptions that need to be expired
    const membersToExpire = await prisma.esoteriko_melos.findMany({
      where: {
        sindromitis: {
          katastasi_sindromis: "Ενεργή",
          exei: {
            some: {
              sindromi: {
                hmerominia_enarksis: {
                  lt: new Date(`${currentYear}-01-01`)
                }
              }
            }
          },
          NOT: {
            exei: {
              some: {
                sindromi: {
                  hmerominia_enarksis: {
                    gte: new Date(`${currentYear-1}-06-01`),
                    lt: new Date(`${currentYear}-01-01`)
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

    // Update their subscription status
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
    const { epafes, ...memberData } = req.body;
    
    if (epafes?.tilefono) {
      epafes.tilefono = BigInt(epafes.tilefono);
    }

    const newMember = await prisma.esoteriko_melos.create({
      data: {
        ...memberData,
        melos: {
          create: {
            tipo_melous: "esoteriko",
            hmerominia_egrafis: new Date(),
            epafes: {
              create: epafes
            },
            vathmos_diskolias: {
              connect: { id_vathmou_diskolias: 1 }
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

// PUT: Update member
router.put("/:id", async (req, res) => {
  try {
    const { epafes, vathmos_diskolias, katastasi_sindromis, eidosSindromis, ...memberData } = req.body;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (epafes?.tilefono) {
      epafes.tilefono = BigInt(epafes.tilefono);
    }

    // Check if status is being changed to active
    const currentMember = await prisma.esoteriko_melos.findUnique({
      where: { id_es_melous: id },
      include: {
        melos: true,
        sindromitis: {
          include: {
            exei: true
          }
        }
      }
    });

    const isStatusChangedToActive = 
      katastasi_sindromis === "Ενεργή" && 
      currentMember.sindromitis?.katastasi_sindromis !== "Ενεργή";

    // Remove hmerominia_pliromis from memberData as it's not a direct field
    const { hmerominia_pliromis, ...cleanMemberData } = memberData;

    const updateData = {
      ...cleanMemberData,
      melos: {
        update: {
          epafes: epafes ? { update: epafes } : undefined,
          vathmos_diskolias: vathmos_diskolias ? {
            upsert: {
              where: { id_vathmou_diskolias: currentMember.melos?.id_vathmou_diskolias || 1 },
              update: { epipedo: vathmos_diskolias.epipedo },
              create: { epipedo: vathmos_diskolias.epipedo },
            }
          } : undefined,
        },
      },
      sindromitis: currentMember.sindromitis ? {
        update: {
          katastasi_sindromis: katastasi_sindromis,
          exei: isStatusChangedToActive ? {
            updateMany: {
              where: { id_sindromiti: id },
              data: { hmerominia_pliromis: new Date() }
            }
          } : undefined
        }
      } : undefined
    };

    const updatedMember = await prisma.esoteriko_melos.update({
      where: { id_es_melous: id },
      data: updateData,
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