const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Λειτουργία για αυτόματο ορισμό της idiotita
const calculateIdiotita = async (epafiId) => {
  const epafi = await prisma.epafes.findUnique({
    where: { id_epafis: epafiId },
    include: {
      melos: {
        include: {
          esoteriko_melos: {
            include: {
              sindromitis: true,
              athlitis: true,
            },
          },
          eksoteriko_melos: true,
        },
      },
      ekpaideutis: true,
    },
  });

  const roles = [];

  if (epafi.melos) {
    if (epafi.melos.esoteriko_melos) {
      if (epafi.melos.esoteriko_melos.sindromitis) {
        roles.push("Συνδρομητής");
      } 
      
      if (epafi.melos.esoteriko_melos.athlitis) {
        roles.push("Αθλητής");
      }
      
      if (roles.length === 0) {
        roles.push("Εσωτερικό Μέλος");
      }
    } else if (epafi.melos.eksoteriko_melos) {
      roles.push("Εξωτερικό Μέλος");
    }
  }
  
  if (epafi.ekpaideutis) {
    roles.push("Εκπαιδευτής");
  }

  return roles.length > 0 ? roles.join(", ") : "Χωρίς Ιδιότητα";
};

// GET: Ανάκτηση όλων των επαφών με αυτόματο ορισμό της ιδιότητας
router.get("/", async (_req, res) => {
  try {
    const epafes = await prisma.epafes.findMany({
      include: {
        melos: {
          include: {
            esoteriko_melos: {
              include: {
                sindromitis: true,
                athlitis: true,
              },
            },
            eksoteriko_melos: true,
          },
        },
        ekpaideutis: true,
      },
    });

    const serializedEpafes = epafes.map((epafi) => {
      // Διατήρηση της υπάρχουσας τιμής αν δεν είναι null
      let idiotita = epafi.idiotita; 

      if (!idiotita) { // Υπολογισμός μόνο αν η idiotita είναι null
        // Αρχικοποίηση πίνακα για συλλογή ρόλων
        const roles = [];

        if (epafi.melos) {
          if (epafi.melos.esoteriko_melos) {
            if (epafi.melos.esoteriko_melos.sindromitis) {
              roles.push("Συνδρομητής");
            }
            
            if (epafi.melos.esoteriko_melos.athlitis) {
              roles.push("Αθλητής");
            }
            
            // Αν δεν έχει ούτε συνδρομητής ούτε αθλητής, τότε απλό εσωτερικό μέλος
            if (roles.length === 0) {
              roles.push("Εσωτερικό Μέλος");
            }
          } else if (epafi.melos.eksoteriko_melos) {
            roles.push("Εξωτερικό Μέλος");
          }
        }
        
        if (epafi.ekpaideutis) {
          roles.push("Εκπαιδευτής");
        }
        
        // Αν δεν έχει κανένα ρόλο
        if (roles.length === 0) {
          idiotita = "Χωρίς Ιδιότητα";
        } else {
          // Συνδυασμός όλων των ρόλων σε ένα string
          idiotita = roles.join(", ");
        }
      }

      return {
        ...epafi,
        tilefono: epafi.tilefono ? epafi.tilefono.toString() : null,
        idiotita,
      };
    });

    res.json(serializedEpafes);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των επαφών:", error);
    res.status(500).json({
      error: "Σφάλμα κατά την ανάκτηση των επαφών",
      details: error.message,
    });
  }
});

// Ενημερωμένο τμήμα του router.post για τη δημιουργία επαφής με εκπαιδευτή

router.post("/", async (req, res) => {
  try {
    const { onoma, epitheto, email, tilefono, idiotita, ekpaideutis } = req.body;
    
    // Μετατροπή τηλεφώνου σε BigInt αν υπάρχει
    const data = {
      onoma,
      epitheto,
      email,
      tilefono: tilefono ? BigInt(tilefono) : null,
      idiotita
    };

    // Αν έχουμε στοιχεία εκπαιδευτή, χρησιμοποιούμε το create
    if (ekpaideutis && ekpaideutis.create) {
      data.ekpaideutis = {
        create: ekpaideutis.create
      };
    }

    // Δημιουργία επαφής με τον εκπαιδευτή
    const newEpafi = await prisma.epafes.create({ data });

    // Υπολογισμός idiotita αν είναι null
    if (!newEpafi.idiotita) {
      const idiotita = await calculateIdiotita(newEpafi.id_epafis);
      await prisma.epafes.update({
        where: { id_epafis: newEpafi.id_epafis },
        data: { idiotita },
      });
      newEpafi.idiotita = idiotita;
    }

    const serializedEpafi = {
      ...newEpafi,
      tilefono: newEpafi.tilefono ? newEpafi.tilefono.toString() : null,
    };
    
    res.status(201).json(serializedEpafi);
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία της επαφής:", error);
    res.status(500).json({
      error: "Σφάλμα κατά τη δημιουργία της επαφής",
      details: error.message,
    });
  }
});

// PUT: Ενημέρωση με έλεγχο ID
router.put("/:id", async (req, res) => {
  try {
    const id_epafis = parseInt(req.params.id);
    if (isNaN(id_epafis)) {
      return res.status(400).json({ error: "Το id_epafis πρέπει να είναι αριθμός" });
    }

    const { onoma, epitheto, email, tilefono, idiotita } = req.body;

    const updatedEpafi = await prisma.epafes.update({
      where: { id_epafis },
      data: {
        onoma,
        epitheto,
        email,
        tilefono: tilefono ? BigInt(tilefono) : null,
        idiotita,
      },
    });

    // Μετατροπή του BigInt σε string πριν την επιστροφή
    const serializedEpafi = {
      ...updatedEpafi,
      tilefono: updatedEpafi.tilefono ? updatedEpafi.tilefono.toString() : null,
    };

    res.json(serializedEpafi);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση της επαφής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση της επαφής", details: error.message });
  }
});
// DELETE: Διαγραφή επαφής και όλων των σχετικών εγγραφών
router.delete("/:id", async (req, res) => {
  try {
    const id_epafis = parseInt(req.params.id);
    if (isNaN(id_epafis)) {
      return res.status(400).json({ error: "Το id_epafis πρέπει να είναι αριθμός" });
    }

    // Έλεγχος ύπαρξης της επαφής πριν τη διαγραφή
    const existingEpafi = await prisma.epafes.findUnique({
      where: { id_epafis },
    });

    if (!existingEpafi) {
      return res.status(404).json({ error: "Η επαφή δεν βρέθηκε" });
    }

    // Διαγραφή σχετικών εγγραφών από τους εξαρτώμενους πίνακες
    // 1. Διαγραφή από τον πίνακα daneizetai
    await prisma.daneizetai.deleteMany({
      where: { id_epafis },
    });

    // 2. Διαγραφή από τον πίνακα eksoflei
    await prisma.eksoflei.deleteMany({
      where: { id_epafis },
    });

    // 3. Διαγραφή από τον πίνακα kratisi_katafigiou
    await prisma.kratisi_katafigiou.deleteMany({
      where: { id_epafis },
    });

    // 4. Διαγραφή από τον πίνακα melos και τις σχετικές εγγραφές
    const melos = await prisma.melos.findUnique({
      where: { id_melous: id_epafis },
    });

    if (melos) {
      // Διαγραφή από τον πίνακα exei
      await prisma.exei.deleteMany({
        where: {
          sindromitis: {
            id_sindromiti: melos.id_melous,
          },
        },
      });

      // Διαγραφή από τον πίνακα plironei
      await prisma.plironei.deleteMany({
        where: {
          simmetoxi: {
            id_melous: melos.id_melous,
          },
        },
      });

      // Διαγραφή από τον πίνακα simmetoxi
      await prisma.simmetoxi.deleteMany({
        where: { id_melous: melos.id_melous },
      });

      // Διαγραφή από τον πίνακα katavalei
      await prisma.katavalei.deleteMany({
        where: { id_melous: melos.id_melous },
      });

      // Διαγραφή από τον πίνακα parakolouthisi
      const parakolouthiseis = await prisma.parakolouthisi.findMany({
        where: { id_melous: melos.id_melous },
      });

      for (const parakolouthisi of parakolouthiseis) {
        // Διαγραφή από τον πίνακα katavalei που σχετίζεται με την parakolouthisi
        await prisma.katavalei.deleteMany({
          where: { id_parakolouthisis: parakolouthisi.id_parakolouthisis },
        });
      }

      await prisma.parakolouthisi.deleteMany({
        where: { id_melous: melos.id_melous },
      });

      // Διαγραφή από τον πίνακα esoteriko_melos
      await prisma.esoteriko_melos.deleteMany({
        where: { id_es_melous: melos.id_melous },
      });

      // Διαγραφή από τον πίνακα eksoteriko_melos
      await prisma.eksoteriko_melos.deleteMany({
        where: { id_ekso_melous: melos.id_melous },
      });

      // Διαγραφή από τον πίνακα sindromitis
      await prisma.sindromitis.deleteMany({
        where: { id_sindromiti: melos.id_melous },
      });

      // Διαγραφή από τον πίνακα athlitis
      await prisma.athlitis.deleteMany({
        where: { id_athliti: melos.id_melous },
      });

      // Διαγραφή από τον πίνακα ekpaideutis
      await prisma.ekpaideutis.deleteMany({
        where: { id_ekpaideuti: melos.id_melous },
      });

      // Τέλος, διαγραφή από τον πίνακα melos
      await prisma.melos.delete({
        where: { id_melous: melos.id_melous },
      });
    }

    // Διαγραφή της επαφής
    await prisma.epafes.delete({
      where: { id_epafis },
    });

    res.json({ message: "Η επαφή και όλες οι σχετικές εγγραφές διαγράφηκαν με επιτυχία" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της επαφής:", error);
    res.status(500).json({
      error: "Σφάλμα κατά τη διαγραφή της επαφής",
      details: error.message,
    });
  }
});

// Νέο endpoint: GET ekpaideutes-me-sxoles - Εκπαιδευτές με τις σχολές τους
router.get("/ekpaideutes-me-sxoles", async (req, res) => {
  try {
    const ekpaideutes = await prisma.epafes.findMany({
      where: {
        ekpaideutis: {
          isNot: null
        }
      },
      include: {
        ekpaideutis: {
          include: {
            ekpaideuei: {
              include: {
                sxoli: true
              }
            }
          }
        }
      }
    });

    const formattedData = ekpaideutes.map(epafi => ({
      id_epafis: epafi.id_epafis,
      id_ekpaideuti: epafi.ekpaideutis?.id_ekpaideuti,
      onoma: epafi.onoma || "",
      epitheto: epafi.epitheto || "",
      email: epafi.email || "",
      tilefono: epafi.tilefono ? epafi.tilefono.toString() : "",
      epipedo: epafi.ekpaideutis?.epipedo || "",
      klados: epafi.ekpaideutis?.klados || "",
      fullName: `${epafi.onoma || ""} ${epafi.epitheto || ""}`.trim(),
      sxoles: epafi.ekpaideutis?.ekpaideuei.map(relation => ({
        id_sxolis: relation.sxoli.id_sxolis,
        klados: relation.sxoli.klados || "",
        epipedo: relation.sxoli.epipedo || "",
        etos: relation.sxoli.etos || "",
        onoma: `${relation.sxoli.klados || ""} ${relation.sxoli.epipedo || ""} ${relation.sxoli.etos || ""}`.trim()
      })) || []
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Σφάλμα στην ανάκτηση εκπαιδευτών με σχολές:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση δεδομένων" });
  }
});

module.exports = router;