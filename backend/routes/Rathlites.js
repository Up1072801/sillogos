const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των αθλητών
router.get("/athletes", async (_req, res) => {
    try {
      const athletes = await prisma.athlitis.findMany({
        include: {
          esoteriko_melos: true,
          asxoleitai: {
            include: {
              athlima: true, // Συμπερίληψη του ονόματος του αθλήματος
            },
          },
          agonizetai: true,
        },
      });
  
      const serializedAthletes = athletes.map((athlete) => ({
        id: athlete.id_athliti,
        firstName: athlete.esoteriko_melos?.onoma || "",
        lastName: athlete.esoteriko_melos?.epitheto || "",
        phone: athlete.esoteriko_melos?.tilefono || "",
        email: athlete.esoteriko_melos?.email || "",
        vathmos: athlete.esoteriko_melos?.vathmos || "",
        arithmosdeltiou: athlete.arithmos_deltiou,
        hmerominiaenarksis: athlete.hmerominia_enarksis_deltiou,
        hmerominialiksis: athlete.hmerominia_liksis_deltiou,
        athlima: athlete.asxoleitai.map((a) => a.athlima.onoma).join(", "),
        totalParticipation: athlete.agonizetai.length, // Αριθμός συμμετοχών σε αγώνες
      }));
  
      res.json(serializedAthletes);
    } catch (error) {
      console.error("Σφάλμα κατά την ανάκτηση των αθλητών:", error);
      res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των αθλητών" });
    }
  });

// GET: Ανάκτηση όλων των αθλημάτων και αριθμού συμμετοχών
router.get("/sports", async (_req, res) => {
  try {
    const sports = await prisma.athlima.findMany({
      include: {
        agones: {
          include: {
            agonizetai: true, // Συμπερίληψη συμμετοχών στους αγώνες
          },
        },
      },
    });

    const serializedSports = sports.map((sport) => {
      const totalParticipants = sport.agones.reduce(
        (sum, agonas) => sum + agonas.agonizetai.length,
        0
      );
      return {
        athlima: sport.onoma,
        participants: totalParticipants,
      };
    });

    res.json(serializedSports);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των αθλημάτων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των αθλημάτων" });
  }
});

module.exports = router;