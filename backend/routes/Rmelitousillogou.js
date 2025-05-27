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
    
    // Βρες μέλη με ενεργές συνδρομές που πρέπει να λήξουν
    const membersToExpire = await prisma.esoteriko_melos.findMany({
      where: {
        sindromitis: {
          katastasi_sindromis: "Ενεργή",
          AND: [
            {
              exei: {
                some: {
                  sindromi: {
                    hmerominia_enarksis: {
                      lt: new Date(`${currentYear}-01-01`) // Ξεκίνησαν πριν την αρχή του τρέχοντος έτους
                    }
                  }
                }
              }
            },
            {
              exei: {
                some: {
                  hmerominia_pliromis: {
                    lt: new Date(`${currentYear}-01-01`) // Δεν έχουν πληρώσει για το τρέχον έτος
                  }
                }
              }
            }
          ],
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
                sxoli: true
              }
            },
            simmetoxi: {
              include: {
                // Replace the direct drastiriotita inclusion with the junction table
                simmetoxi_drastiriotites: {
                  include: {
                    drastiriotita: {
                      include: {
                        vathmos_diskolias: true,
                        eksormisi: true
                      }
                    }
                  }
                },
                eksormisi: true,
                plironei: true
              }
            }
          }
        },
        // Update this to match the new schema relation name
        ypefthinos_se: {
          include: {
            eksormisi: true
          }
        },
        athlitis: true,
        sindromitis: {
          include: {
            exei: {
              take: 1,
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
      },
      orderBy: {
        id_es_melous: "asc"
      }
    });

    const formattedData = members.map((member) => {
      const latestPayment = member.sindromitis?.exei?.[0]?.hmerominia_pliromis || null;
      const registrationDate = member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis || null;

      // Μορφοποίηση δραστηριοτήτων με σωστή ημερομηνία
      if (member.melos?.simmetoxi) {
        member.melos.simmetoxi = member.melos.simmetoxi.map(sim => ({
          ...sim,
          // Access drastiriotita through simmetoxi_drastiriotites
          simmetoxi_drastiriotites: (sim.simmetoxi_drastiriotites || []).map(rel => ({
            ...rel,
            drastiriotita: rel.drastiriotita ? {
              ...rel.drastiriotita,
              hmerominia: rel.drastiriotita.hmerominia
                ? new Date(rel.drastiriotita.hmerominia).toLocaleDateString("el-GR")
                : null
            } : null
          }))
        }));
      }

      const formattedMember = {
        ...member,
        melos: member.melos ? {
          ...member.melos,
          epafes: member.melos.epafes ? {
            ...member.melos.epafes,
            tilefono: member.melos.epafes.tilefono?.toString()
          } : null,
          simmetoxi: member.melos.simmetoxi || []
        } : null,
        eidosSindromis: member.athlitis
          ? "Αθλητής"
          : member.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "-",
        hmerominia_egrafis: registrationDate,
        hmerominia_pliromis: latestPayment,
        // Προσθέτουμε με σαφήνεια την ημερομηνία γέννησης από το σωστό πεδίο
        hmerominia_gennhshs: member.hmerominia_gennhshs
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
    const { id } = req.params;
    
    // Αποσυμπίεση των δεδομένων του request (στο σωστό format)
    const { 
      hmerominia_gennhshs, patronimo, arithmos_mitroou, odos, tk,
      onoma, epitheto, email, tilefono, epipedo,
      katastasi_sindromis, hmerominia_enarksis, hmerominia_pliromis, eidosSindromis
    } = req.body;
    
    // Εκτύπωση των ληφθέντων δεδομένων για debug
    console.log("Λαμβάνονται δεδομένα ενημέρωσης:", JSON.stringify(req.body, null, 2));
    
    // Έλεγχος για τα IDs
    const numId = parseInt(id);
    if (isNaN(numId)) {
      return res.status(400).json({ error: "Μη έγκυρο ID" });
    }
    
    // Εύρεση του τρέχοντος μέλους
    const currentMember = await prisma.esoteriko_melos.findUnique({
      where: { id_es_melous: numId },
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
                sindromi: true
              }
            }
          }
        }
      }
    });
    
    if (!currentMember) {
      return res.status(404).json({ error: "Το μέλος δεν βρέθηκε" });
    }
    
    // Δομή δεδομένων για το update
    const updateData = { 
      patronimo: patronimo || currentMember.patronimo,
      odos: odos || currentMember.odos
    };
    
    // Προσθήκη των αριθμητικών πεδίων αν υπάρχουν
    if (arithmos_mitroou !== undefined) {
      updateData.arithmos_mitroou = parseInt(arithmos_mitroou);
    }
    
    if (tk !== undefined) {
      updateData.tk = parseInt(tk);
    }
    
    // Μετατροπή ημερομηνίας γέννησης σε Date object
    if (hmerominia_gennhshs) {
      try {
        updateData.hmerominia_gennhshs = new Date(hmerominia_gennhshs);
        if (isNaN(updateData.hmerominia_gennhshs.getTime())) {
          delete updateData.hmerominia_gennhshs;
        }
      } catch (e) {
        console.error("Σφάλμα μετατροπής ημερομηνίας γέννησης:", e);
        delete updateData.hmerominia_gennhshs;
      }
    }
    
    // Προσθήκη update για τις επαφές, αν έχουν δοθεί αντίστοιχα πεδία
    if (onoma || epitheto || email || tilefono) {
      updateData.melos = {
        update: {
          epafes: {
            update: {
              onoma: onoma || undefined,
              epitheto: epitheto || undefined,
              email: email || undefined,
              tilefono: tilefono ? BigInt(tilefono) : undefined
            }
          }
        }
      };
    }
    
    // Προσθήκη βαθμού δυσκολίας αν έχει δοθεί
    if (epipedo) {
      if (!updateData.melos) updateData.melos = { update: {} };
      updateData.melos.update.vathmos_diskolias = {
        connect: { id_vathmou_diskolias: parseInt(epipedo) }
      };
    }
    
    // ΣΗΜΑΝΤΙΚΟ: Ενημέρωση συνδρομής
    const sindromitis_id = currentMember.sindromitis?.id_sindromiti;
    const sindromis_id = currentMember.sindromitis?.exei?.[0]?.sindromi?.id_sindromis;
    
    if (sindromitis_id && sindromis_id && (katastasi_sindromis || hmerominia_pliromis || hmerominia_enarksis || eidosSindromis)) {
      // Προετοιμασία των δεδομένων ενημέρωσης συνδρομής
      const sindromitisUpdateData = {
        katastasi_sindromis: katastasi_sindromis
      };
      
      // Προετοιμασία των δεδομένων ενημέρωσης της σχέσης exei
      const exeiUpdateData = {
        hmerominia_pliromis: hmerominia_pliromis ? new Date(hmerominia_pliromis) : undefined
      };
      
      // Προετοιμασία των δεδομένων ενημέρωσης της συνδρομής
      const sindromiUpdateData = {
        hmerominia_enarksis: hmerominia_enarksis ? new Date(hmerominia_enarksis) : undefined
      };
      
      // Εάν υπάρχει είδος συνδρομής, βρίσκουμε το ID του
      if (eidosSindromis) {
        const eidosSindromisRecord = await prisma.eidos_sindromis.findFirst({
          where: { titlos: eidosSindromis }
        });
        
        if (!eidosSindromisRecord) {
          return res.status(400).json({ error: `Δεν βρέθηκε είδος συνδρομής με τίτλο: ${eidosSindromis}` });
        }
        
        // Προσθήκη του συσχετιζόμενου ID στα δεδομένα ενημέρωσης της συνδρομής
        sindromiUpdateData.id_eidous_sindromis = eidosSindromisRecord.id_eidous_sindromis;
      }
      
      // Συναρμολόγηση του πλήρους αντικειμένου ενημέρωσης
      updateData.sindromitis = {
        update: {
          ...sindromitisUpdateData,
          exei: {
            update: {
              where: {
                id_sindromiti_id_sindromis: {
                  id_sindromiti: sindromitis_id,
                  id_sindromis: sindromis_id
                }
              },
              data: {
                ...exeiUpdateData,
                sindromi: {
                  update: sindromiUpdateData
                }
              }
            }
          }
        }
      };
    }
    
    // Εκτέλεση του update
    const updatedMember = await prisma.esoteriko_melos.update({
      where: { id_es_melous: numId },
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

    // Προετοιμασία της απάντησης
    const response = {
      ...updatedMember,
      hmerominia_gennhshs: updatedMember.hmerominia_gennhshs?.toISOString().split('T')[0],
      melos: {
        ...updatedMember.melos,
        epafes: {
          ...updatedMember.melos?.epafes,
          tilefono: updatedMember.melos?.epafes?.tilefono?.toString()
        }
      },
      sindromitis: {
        ...updatedMember.sindromitis,
        exei: updatedMember.sindromitis?.exei?.map(item => ({
          ...item,
          hmerominia_pliromis: item.hmerominia_pliromis?.toISOString().split('T')[0],
          sindromi: {
            ...item.sindromi,
            hmerominia_enarksis: item.sindromi?.hmerominia_enarksis?.toISOString().split('T')[0],
            eidos_sindromis: item.sindromi?.eidos_sindromis?.titlos || eidosSindromis
          }
        }))
      },
      eidosSindromis: updatedMember.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || eidosSindromis
    };
    
    return res.json(response);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση μέλους:", error);
    return res.status(500).json({
      error: "Σφάλμα κατά την ενημέρωση του μέλους",
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
        athlitis: true,
        sindromitis: true,
      },
    });

    if (!memberExists) {
      return res.status(404).json({ error: "Member not found" });
    }

    await prisma.$transaction(async (prisma) => {
      const epafisId = memberExists.melos?.epafes?.id_epafis;

      // 1. Διαγραφή όλων των συσχετίσεων με αθλήματα (asxoleitai)
      if (memberExists.athlitis) {
        await prisma.asxoleitai.deleteMany({
          where: { id_athliti: id },
        });
        
        // Διαγραφή των συμμετοχών σε αγώνες (agonizetai)
        await prisma.agonizetai.deleteMany({
          where: { id_athliti: id },
        });
      }

      // 2. Διαγραφή όλων των δανεισμών (daneizetai)
      if (epafisId) {
        await prisma.daneizetai.deleteMany({
          where: { id_epafis: epafisId },
        });
      }

      // 3. Διαγραφή συμμετοχών σε δραστηριότητες
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

      // 4. Διαγραφή παρακολούθησης σχολών
      await prisma.katavalei.deleteMany({
        where: { id_parakolouthisis: { in: await prisma.parakolouthisi.findMany({
          where: { id_melous: id },
          select: { id_parakolouthisis: true },
        }).then((results) => results.map((r) => r.id_parakolouthisis)) } },
      });

      await prisma.parakolouthisi.deleteMany({
        where: { id_melous: id },
      });

      // 5. Διαγραφή της συνδρομής
      await prisma.exei.deleteMany({
        where: { id_sindromiti: id },
      });

      // 6. Διαγραφή εξοφλήσεων
      if (epafisId) {
        await prisma.eksoflei.deleteMany({
          where: { id_epafis: epafisId },
        });
        
        // Διαγραφή κρατήσεων καταφυγίου
        await prisma.kratisi_katafigiou.deleteMany({
          where: { id_epafis: epafisId },
        });
      }

      // 7. Διαγραφή εξορμήσεων όπου το μέλος είναι υπεύθυνος
      await prisma.eksormisi.updateMany({
        where: { id_ypefthynou: id },
        data: { id_ypefthynou: null }
      });

      // 8. Διαγραφή εγγραφών αθλητή/συνδρομητή
      if (memberExists.athlitis) {
        await prisma.athlitis.delete({ where: { id_athliti: id } });
      }
      
      if (memberExists.sindromitis) {
        await prisma.sindromitis.delete({ where: { id_sindromiti: id } });
      }

      // 9. Διαγραφή εσωτερικού μέλους
      await prisma.esoteriko_melos.delete({ where: { id_es_melous: id } });

      // 10. Διαγραφή μέλους
      if (memberExists.melos) {
        await prisma.melos.delete({ where: { id_melous: id } });
      }

      // 11. Διαγραφή επαφής (τελευταία)
      if (epafisId) {
        await prisma.epafes.delete({ where: { id_epafis: epafisId } });
      }
    });

    res.json({ message: "Member and all related records deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Member not found" });
    }
    
    // Επιστρέφουμε λεπτομερέστερες πληροφορίες σφάλματος
    res.status(500).json({
      error: "Error deleting member",
      details: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

// Add this new route to get all members (both internal and external)
router.get("/all", async (_req, res) => {
  try {
    // Get all internal members
    const internalMembers = await prisma.esoteriko_melos.findMany({
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true,
          }
        },
        sindromitis: {
          include: {
            exei: {
              include: {
                sindromi: true
              }
            }
          }
        },
        athlitis: true
      }
    });

    // Get all external members
    const externalMembers = await prisma.eksoteriko_melos.findMany({
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true,
          }
        }
      }
    });

    // Format internal members
    const formattedInternalMembers = internalMembers.map(member => ({
      id_es_melous: member.id_es_melous,
      melos: member.melos,
      sindromitis: member.sindromitis,
      athlitis: member.athlitis,
      // Additional fields needed for UI
      tipo_melous: "esoteriko"
    }));

    // Format external members
    const formattedExternalMembers = externalMembers.map(member => ({
      id_ekso_melous: member.id_ekso_melous,
      melos: {
        ...member.melos,
        tipo_melous: "eksoteriko"
      },
      // Additional fields needed for UI
      onoma_sillogou: member.onoma_sillogou,
      tipo_melous: "eksoteriko"
    }));

    // Combine both types of members
    const allMembers = [...formattedInternalMembers, ...formattedExternalMembers];
    res.json(allMembers);
  } catch (error) {
    console.error("Error fetching all members:", error);
    res.status(500).json({ error: "Error fetching all members" });
  }
});

// GET: Retrieve all internal members for selection
router.get("/internal", async (req, res) => {
  try {
    const internalMembers = await prisma.esoteriko_melos.findMany({
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true
          }
        },
        sindromitis: true,
        athlitis: true
      }
    });

    const formattedMembers = internalMembers.map(member => {
      const fullName = `${member.melos?.epafes?.epitheto || ''} ${member.melos?.epafes?.onoma || ''}`.trim();
      
      return {
        id: member.id_es_melous,
        id_es_melous: member.id_es_melous,
        fullName: fullName,
        email: member.melos?.epafes?.email || '',
        tilefono: member.melos?.epafes?.tilefono ? member.melos.epafes.tilefono.toString() : '',
        epipedo: member.melos?.vathmos_diskolias?.epipedo,
        sindromitis: member.sindromitis 
          ? { katastasi_sindromis: member.sindromitis.katastasi_sindromis }
          : null,
        athlitis: member.athlitis ? true : false
      };
    });

    res.json(formattedMembers);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση εσωτερικών μελών:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση εσωτερικών μελών" });
  }
});

module.exports = router;