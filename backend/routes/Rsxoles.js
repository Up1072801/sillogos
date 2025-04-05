const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των σχολών
router.get("/", async (_req, res) => {
  try {
    const sxoles = await prisma.sxoli.findMany({
      include: {
        ekpaideuei: {
          include: {
            ekpaideutis: true, // Συμπερίληψη δεδομένων εκπαιδευτών
          },
        },
      },
    });

    const serializedSxoles = sxoles.map((sxoli) => ({
      id: sxoli.id_sxolis,
      onoma: sxoli.onoma,
      klados: sxoli.klados,
      epipedo: sxoli.epipedo,
      timi: sxoli.timi,
      etos: sxoli.etos,
      seira: sxoli.seira,
      simmetoxes: sxoli.simmetoxes || 0,
      details: {
        topothesia: sxoli.topothesia,
        imerominia_enarksis: sxoli.hmerominia_enarksis,
        imerominia_liksis: sxoli.hmerominia_liksis,
      },
      ekpaideutes: sxoli.ekpaideuei.map((entry) => ({
        firstName: entry.ekpaideutis.onoma,
        lastName: entry.ekpaideutis.epitheto,
        email: entry.ekpaideutis.email,
        phone: entry.ekpaideutis.tilefono,
      })),
    }));

    res.json(serializedSxoles);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των σχολών:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των σχολών" });
  }
});

// GET: Ανάκτηση λεπτομερειών σχολής
router.get("/:id", async (req, res) => {
  try {
    const sxoli = await prisma.sxoli.findUnique({
      where: { id_sxolis: parseInt(req.params.id) },
      include: {
        ekpaideuei: {
          include: {
            ekpaideutis: true, // Συμπερίληψη δεδομένων εκπαιδευτών
          },
        },
      },
    });

    if (!sxoli) {
      return res.status(404).json({ error: "Η σχολή δεν βρέθηκε" });
    }

    const serializedSxoli = {
      id: sxoli.id_sxolis,
      onoma: sxoli.onoma,
      klados: sxoli.klados,
      epipedo: sxoli.epipedo,
      timi: sxoli.timi,
      etos: sxoli.etos,
      seira: sxoli.seira,
      topothesia: sxoli.topothesia,
      imerominia_enarksis: sxoli.hmerominia_enarksis,
      imerominia_liksis: sxoli.hmerominia_liksis,
      ekpaideutes: sxoli.ekpaideuei.map((entry) => ({
        firstName: entry.ekpaideutis.onoma,
        lastName: entry.ekpaideutis.epitheto,
        email: entry.ekpaideutis.email,
        phone: entry.ekpaideutis.tilefono,
      })),
    };

    res.json(serializedSxoli);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση της σχολής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση της σχολής" });
  }
});

module.exports = router;