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


router.use(async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time portion
    
    // Handle ALL subscriptions, not just active ones
    const allSubscribers = await prisma.sindromitis.findMany({
      where: {
        // Don't filter by status - we want to check all subscriptions
        katastasi_sindromis: {
          not: "Διαγραμμένη" // Only exclude manually deleted ones
        }
      },
      include: {
        exei: {
          include: {
            sindromi: true
          }
        }
      }
    });
    
    // IDs to expire (status → Ληγμένη)
    const expiredIds = [];
    // IDs to activate (status → Ενεργή) 
    const activeIds = [];
    
    for (const subscriber of allSubscribers) {
      // Skip if manually marked as deleted
      if (subscriber.katastasi_sindromis === "Διαγραμμένη") {
        continue;
      }
      
      // Get registration and payment dates
      const registrationDate = subscriber.exei[0]?.sindromi?.hmerominia_enarksis;
      const paymentDate = subscriber.exei[0]?.hmerominia_pliromis;
      
      if (!registrationDate && !paymentDate) {
        // No dates at all, consider expired
        expiredIds.push(subscriber.id_sindromiti);
        continue;
      }
      
      // If we only have one date, use it
      const finalRegDate = registrationDate || paymentDate;
      const finalPayDate = paymentDate || registrationDate;
      
      try {
        // Calculate end date using the function with the dates we have
        const endDate = calculateSubscriptionEndDate(finalRegDate, finalPayDate);
        
        if (!endDate) {
          expiredIds.push(subscriber.id_sindromiti);
          continue;
        }
        
        // Compare only the date portions to avoid time issues
        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(0, 0, 0, 0);
        
        if (today > endDateOnly) {
          // End date has passed - should be expired
          if (subscriber.katastasi_sindromis !== "Ληγμένη") {
            expiredIds.push(subscriber.id_sindromiti);
          }
        } else {
          // End date hasn't passed - should be active
          if (subscriber.katastasi_sindromis !== "Ενεργή") {
            activeIds.push(subscriber.id_sindromiti);
          }
        }
      } catch (err) {
        console.error(`Error processing subscription ${subscriber.id_sindromiti}:`, err);
      }
    }
    
    // Update expired subscriptions
    if (expiredIds.length > 0) {
      await prisma.sindromitis.updateMany({
        where: { id_sindromiti: { in: expiredIds } },
        data: { katastasi_sindromis: "Ληγμένη" }
      });
    }
    
    // Update active subscriptions
    if (activeIds.length > 0) {
      await prisma.sindromitis.updateMany({
        where: { id_sindromiti: { in: activeIds } },
        data: { katastasi_sindromis: "Ενεργή" }
      });
    }
    
    next();
  } catch (error) {
    console.error("Error updating subscription statuses:", error);
    next();
  }
});

// Add the same end date calculation function you have in the client
// Update the function around line 114
function calculateSubscriptionEndDate(registrationDate, paymentDate) {
  // If no payment date but we have registration date, use registration date as payment date
  if (!paymentDate && registrationDate) {
    paymentDate = registrationDate;
  }
  
  // If still no payment date after substitution, return null
  if (!paymentDate) return null;
  
  // Rest of function remains the same
  const paymentYear = paymentDate.getFullYear();
  
  // Check if registration was in the same year as payment and after September 1st
  if (registrationDate) {
    const registrationYear = registrationDate.getFullYear();
    
    if (registrationYear === paymentYear) {
      const septFirst = new Date(paymentYear, 8, 1); // September = month 8 (0-11)
      
      if (registrationDate >= septFirst) {
        // If registration was after September 1st of payment year,
        // subscription ends at the beginning of the year after next
        return new Date(paymentYear + 2, 0, 1); // January 1st, paymentYear+2
      }
    }
  }
  
  // Otherwise, subscription ends at the beginning of next year
  return new Date(paymentYear + 1, 0, 1); // January 1st, paymentYear+1
}

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
      // Extract the dates and ensure they are formatted consistently as strings
      const latestPayment = member.sindromitis?.exei?.[0]?.hmerominia_pliromis 
        ? member.sindromitis.exei[0].hmerominia_pliromis.toISOString().split('T')[0] 
        : null;
      
      const registrationDate = member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis 
        ? member.sindromitis.exei[0].sindromi.hmerominia_enarksis.toISOString().split('T')[0] 
        : null;

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
          simmetoxi: member.melos.simmetoxi || [],
          sxolia: member.melos.sxolia // Ensure comments are explicitly included

        } : null,
        eidosSindromis: member.athlitis
          ? "Αθλητής"
          : member.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "-",
        hmerominia_egrafis: registrationDate,
        hmerominia_pliromis: latestPayment,
        // Format birth date the same way
        hmerominia_gennhshs: member.hmerominia_gennhshs 
          ? new Date(member.hmerominia_gennhshs).toISOString().split('T')[0]
          : null
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
      // Χειρισμός τηλεφώνου
      if (epafes?.tilefono && epafes.tilefono.toString().trim() !== "") {
        epafes.tilefono = BigInt(epafes.tilefono);
      } else {
        epafes.tilefono = null;
      }

      // 1. Δημιουργία της επαφής με κενά πεδία
      const newEpafi = await prismaTransaction.epafes.create({
        data: {
          onoma: epafes?.onoma || "",
          epitheto: epafes?.epitheto || "",
          email: epafes?.email || "",
          tilefono: epafes?.tilefono,
        }
      });

      // Έλεγχος για έγκυρο ID βαθμού δυσκολίας
      const vathmosId = melos?.vathmos_diskolias?.id_vathmou_diskolias || 1; // Προεπιλογή στο 1

      const newMelos = await prismaTransaction.melos.create({
        data: {
          tipo_melous: melos?.tipo_melous || "esoteriko",
          sxolia: melos?.sxolia || "", // Add the comments field
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

      // 3. Δημιουργία του εσωτερικού μέλους με κενά πεδία
      const newEsoterikoMelos = await prismaTransaction.esoteriko_melos.create({
        data: {
          id_es_melous: newMelos.id_melous,
          hmerominia_gennhshs: esoteriko_melos?.hmerominia_gennhshs || null,
          patronimo: esoteriko_melos?.patronimo || "",
          odos: esoteriko_melos?.odos || "",
          tk: esoteriko_melos?.tk ? parseInt(esoteriko_melos.tk) : null,
          arithmos_mitroou: esoteriko_melos?.arithmos_mitroou ? parseInt(esoteriko_melos.arithmos_mitroou) : null,
        }
      });

      // Υπόλοιπος κώδικας για συνδρομή μόνο αν υπάρχουν δεδομένα συνδρομής
      if (sindromitis && sindromitis.exei && sindromitis.exei.sindromi) {
        // Check if user explicitly selected "Διαγραμμένη" status
        const manuallyDeleted = sindromitis.katastasi_sindromis === "Διαγραμμένη";
        let subscriptionStatus = "Ληγμένη"; // Default to expired
        
        // Modified condition to allow only registration date
        const hasRegistrationDate = sindromitis.exei.sindromi.hmerominia_enarksis;
        const hasPaymentDate = sindromitis.exei.hmerominia_pliromis;
        
        // Calculate end date if we have at least registration date
        if (hasRegistrationDate) {
          const registrationDate = new Date(sindromitis.exei.sindromi.hmerominia_enarksis);
          
          if (!isNaN(registrationDate.getTime())) {
            // If we have payment date, use both. If not, use registration date for both parameters
            const paymentDate = hasPaymentDate ? new Date(sindromitis.exei.hmerominia_pliromis) : registrationDate;
            
            if (!isNaN(paymentDate.getTime())) {
              const endDate = calculateSubscriptionEndDate(registrationDate, paymentDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // If end date is valid and in the future, status is active
              if (endDate && endDate >= today) {
                subscriptionStatus = "Ενεργή";
              }
            }
          }
        }
        
        // If manually deleted, respect that choice
        if (manuallyDeleted) {
          subscriptionStatus = "Διαγραμμένη";
        }
        
        // Always create the subscriber record
        const newSindromitis = await prismaTransaction.sindromitis.create({
          data: {
            id_sindromiti: newEsoterikoMelos.id_es_melous,
            katastasi_sindromis: subscriptionStatus
          }
        });

        // Always create the subscription records, even without dates
        // 5. Αναζήτηση του είδους συνδρομής
        const eidosSindromisRecord = await prismaTransaction.eidos_sindromis.findFirst({
          where: {
            titlos: sindromitis.exei.sindromi.eidos_sindromis
          }
        });

        if (eidosSindromisRecord) {
          // 6. Δημιουργία της συνδρομής
          const maxIdResult = await prismaTransaction.sindromi.aggregate({
            _max: {
              id_sindromis: true,
            },
          });
          const newId = (maxIdResult._max.id_sindromis || 0) + 1;

          // Create sindromi with optional dates
          const newSindromi = await prismaTransaction.sindromi.create({
            data: {
              id_sindromis: newId,
              // Allow null dates
              hmerominia_enarksis: sindromitis.exei.sindromi.hmerominia_enarksis 
                ? new Date(sindromitis.exei.sindromi.hmerominia_enarksis) 
                : null,
              id_eidous_sindromis: eidosSindromisRecord.id_eidous_sindromis
            }
          });

          // 7. Δημιουργία της σχέσης "exei" with optional payment date
          await prismaTransaction.exei.create({
            data: {
              id_sindromiti: newSindromitis.id_sindromiti,
              id_sindromis: newSindromi.id_sindromis,
              // Allow null date
              hmerominia_pliromis: sindromitis.exei.hmerominia_pliromis
                ? new Date(sindromitis.exei.hmerominia_pliromis)
                : null
            }
          });
        }
      }

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
        // Add these explicit formatted dates to the response
        hmerominia_egrafis: completeMember.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis 
          ? completeMember.sindromitis.exei[0].sindromi.hmerominia_enarksis.toISOString().split('T')[0] 
          : null,
        hmerominia_pliromis: completeMember.sindromitis?.exei?.[0]?.hmerominia_pliromis 
          ? completeMember.sindromitis.exei[0].hmerominia_pliromis.toISOString().split('T')[0] 
          : null
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
    
    // Αποσυμπίεση των δεδομένων του request
    const { 
      hmerominia_gennhshs, patronimo, arithmos_mitroou, odos, tk,
      onoma, epitheto, email, tilefono, epipedo, sxolia,
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
    if (onoma || epitheto || email || tilefono || req.body.melos?.sxolia) {
      updateData.melos = {
        update: {
          epafes: {
            update: {
              onoma: onoma || undefined,
              epitheto: epitheto || undefined,
              email: email || undefined,
              tilefono: tilefono ? BigInt(tilefono) : undefined
            }
          },
          // Add this line to update the comments
          sxolia: req.body.melos?.sxolia || undefined
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

    // Check if we're adding a new subscription record (conversion from athlete to subscriber)
    if (req.body.sindromitis && !sindromitis_id) {
      console.log("Converting athlete to subscriber");
      
      // Create new sindromitis record
      const newSindromitis = await prisma.sindromitis.create({
        data: {
          id_sindromiti: numId,
          katastasi_sindromis: req.body.sindromitis.katastasi_sindromis || "Ενεργή"
        }
      });
      
      // Process subscription type and dates
      if (req.body.sindromitis.exei) {
        // Find the subscription type record
        const eidosSindromisRecord = await prisma.eidos_sindromis.findFirst({
          where: { 
            titlos: req.body.sindromitis.exei.sindromi.eidos_sindromis 
          }
        });
        
        if (eidosSindromisRecord) {
          // Create sindromi record
          const maxIdResult = await prisma.sindromi.aggregate({
            _max: { id_sindromis: true }
          });
          const newSindromisId = (maxIdResult._max.id_sindromis || 0) + 1;
          
          const newSindromi = await prisma.sindromi.create({
            data: {
              id_sindromis: newSindromisId,
              hmerominia_enarksis: req.body.sindromitis.exei.sindromi.hmerominia_enarksis 
                ? new Date(req.body.sindromitis.exei.sindromi.hmerominia_enarksis) 
                : null,
              id_eidous_sindromis: eidosSindromisRecord.id_eidous_sindromis
            }
          });
          
          // Create exei relationship
          await prisma.exei.create({
            data: {
              id_sindromiti: numId,
              id_sindromis: newSindromi.id_sindromis,
              hmerominia_pliromis: req.body.sindromitis.exei.hmerominia_pliromis
                ? new Date(req.body.sindromitis.exei.hmerominia_pliromis)
                : null
            }
          });
        }
      }
    }
    // Now continue with existing sindromitis updates if it already exists
// Now continue with existing sindromitis updates if it already exists
else if (sindromitis_id) {
  // Update subscription status if provided
  if (katastasi_sindromis) {
    await prisma.sindromitis.update({
      where: { id_sindromiti: sindromitis_id },
      data: { katastasi_sindromis }
    });
  }
  
  // Update subscription data (dates and type) if we have any of that information
  if (hmerominia_enarksis || hmerominia_pliromis || eidosSindromis) {
    // Get the current subscription relation
    const currentExei = await prisma.exei.findFirst({
      where: { id_sindromiti: sindromitis_id },
      include: { sindromi: true }
    });
    
    if (currentExei) {
      // Update payment date directly in the exei record
      if (hmerominia_pliromis) {
        await prisma.exei.update({
          where: { 
            id_sindromiti_id_sindromis: {
              id_sindromiti: sindromitis_id,
              id_sindromis: currentExei.id_sindromis
            }
          },
          data: { 
            hmerominia_pliromis: new Date(hmerominia_pliromis) 
          }
        });
      }
      
      // Update start date in the sindromi record
      if (hmerominia_enarksis) {
        await prisma.sindromi.update({
          where: { id_sindromis: currentExei.id_sindromis },
          data: { hmerominia_enarksis: new Date(hmerominia_enarksis) }
        });
      }
      
      // Update subscription type if needed
      if (eidosSindromis) {
        const eidosSindromisRecord = await prisma.eidos_sindromis.findFirst({
          where: { titlos: eidosSindromis }
        });
        
        if (eidosSindromisRecord) {
          await prisma.sindromi.update({
            where: { id_sindromis: currentExei.id_sindromis },
            data: { id_eidous_sindromis: eidosSindromisRecord.id_eidous_sindromis }
          });
        }
      }
    }
  }
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
      // Add these explicit top-level properties to match the GET response structure
      hmerominia_egrafis: updatedMember.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis?.toISOString().split('T')[0] || null,
      hmerominia_pliromis: updatedMember.sindromitis?.exei?.[0]?.hmerominia_pliromis?.toISOString().split('T')[0] || null,
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
      await prisma.ypefthynoi_eksormisis.deleteMany({
        where: {
          id_ypefthynou: id
        }
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

// GET: Retrieve all members (internal and external) for selection
router.get("/all", async (req, res) => {
  try {
    // Get internal members
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

    // Get external members
    const externalMembers = await prisma.eksoteriko_melos.findMany({
      include: {
        melos: {
          include: {
            epafes: true,
            vathmos_diskolias: true
          }
        }
      }
    });

    // Format internal members
    const formattedInternalMembers = internalMembers.map(member => ({
      id_melous: member.id_es_melous,
      id_es_melous: member.id_es_melous,
      melos: member.melos,
      sindromitis: member.sindromitis,
      athlitis: member.athlitis,
      // Additional fields needed for UI
      tipo_melous: "esoteriko"
    }));

    // Format external members
    const formattedExternalMembers = externalMembers.map(member => ({
      id_melous: member.id_ekso_melous,
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

module.exports = router;