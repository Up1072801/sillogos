const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των εξορμήσεων
router.get("/", async (_req, res) => {
  try {
    const eksormiseis = await prisma.eksormisi.findMany({
      include: {
        drastiriotita: true, // Χρήση του σωστού ονόματος της σχέσης
      },
    });

    const serializedEksormiseis = eksormiseis.map((eksormisi) => ({
      id: eksormisi.id_eksormisis,
      onoma: eksormisi.titlos, // Χρήση του σωστού πεδίου για το όνομα
      topothesia: eksormisi.proorismos,
      imerominia_enarksis: eksormisi.hmerominia_anaxorisis,
      imerominia_liksis: eksormisi.hmerominia_afiksis,
      kostos: eksormisi.timi,
      drastiriotites: eksormisi.drastiriotita.map((drastiriotita) => ({
        id: drastiriotita.id_drastiriotitas,
        onoma: drastiriotita.titlos,
        ores_poreias: drastiriotita.ores_poreias,
        diafora_ipsous: drastiriotita.diafora_ipsous,
        megisto_ipsometro: drastiriotita.megisto_ipsometro,
        hmerominia: drastiriotita.hmerominia,
      })),
    }));

    res.json(serializedEksormiseis);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των εξορμήσεων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των εξορμήσεων" });
  }
});

// GET: Ανάκτηση λεπτομερειών εξόρμησης
router.get("/:id", async (req, res) => {
    try {
      const eksormisi = await prisma.eksormisi.findUnique({
        where: { id_eksormisis: parseInt(req.params.id) },
        include: {
          drastiriotita: true, // Συμπερίληψη δραστηριοτήτων
        },
      });
  
      if (!eksormisi) {
        return res.status(404).json({ error: "Η εξόρμηση δεν βρέθηκε" });
      }
  
      const serializedEksormisi = {
        id: eksormisi.id_eksormisis,
        onoma: eksormisi.titlos,
        topothesia: eksormisi.proorismos,
        imerominia_enarksis: eksormisi.hmerominia_anaxorisis,
        imerominia_liksis: eksormisi.hmerominia_afiksis,
        kostos: eksormisi.timi,
        drastiriotites: eksormisi.drastiriotita.map((drastiriotita) => ({
          id: drastiriotita.id_drastiriotitas, // Το ID της δραστηριότητας
          onoma: drastiriotita.titlos,
          ores_poreias: drastiriotita.ores_poreias,
          diafora_ipsous: drastiriotita.diafora_ipsous,
          megisto_ipsometro: drastiriotita.megisto_ipsometro,
          hmerominia: drastiriotita.hmerominia,
        })),
      };
  
      res.json(serializedEksormisi);
    } catch (error) {
      console.error("Σφάλμα κατά την ανάκτηση της εξόρμησης:", error);
      res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση της εξόρμησης" });
    }
  });

module.exports = router;