const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των εξοπλισμών
router.get("/", async (_req, res) => {
  try {
    const eksoplismos = await prisma.eksoplismos.findMany();
    res.json(eksoplismos);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση του εξοπλισμού:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση του εξοπλισμού" });
  }
});

// GET: Ανάκτηση όλων των δανεισμών εξοπλισμού
router.get("/daneismoi", async (_req, res) => {
    try {
      const daneismoi = await prisma.daneizetai.findMany({
        include: {
          epafes: true, // Συμπερίληψη δεδομένων επαφών
          eksoplismos: true, // Συμπερίληψη δεδομένων εξοπλισμού
        },
      });
  
      const serializedDaneismoi = daneismoi.map((daneismos) => ({
        id: daneismos.id,
        nameeksoplismou: daneismos.eksoplismos?.onoma || "",
        Name: `${daneismos.epafes?.onoma || ""} ${daneismos.epafes?.epitheto || ""}`,
        imerominiadaneismou: daneismos.hmerominia_daneismou,
        imerominiaepistrofis: daneismos.hmerominia_epistrofis,
      }));
  
      res.json(serializedDaneismoi);
    } catch (error) {
      console.error("Σφάλμα κατά την ανάκτηση των δανεισμών:", error);
      res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των δανεισμών" });
    }
  });

module.exports = router;