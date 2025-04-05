const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των μελών άλλων συλλόγων
router.get("/", async (_req, res) => {
  try {
    const members = await prisma.eksoteriko_melos.findMany({
      include: {
        epafes: true, // Συμπερίληψη δεδομένων επαφών
      },
    });

    const serializedMembers = members.map((member) => ({
      id: member.id_ekso_melous,
      firstName: member.epafes?.onoma || "",
      lastName: member.epafes?.epitheto || "",
      phone: member.epafes?.tilefono ? member.epafes.tilefono.toString() : "",
      email: member.epafes?.email || "",
      arithmosmitroou: member.arithmos_mitroou,
      onomasillogou: member.onoma_sillogou || "",
    }));

    res.json(serializedMembers);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των μελών άλλων συλλόγων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των μελών άλλων συλλόγων" });
  }
});

module.exports = router;