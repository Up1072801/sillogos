const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const types = await prisma.eidos_sindromis.findMany();
    res.json(types);
  } catch (error) {
    console.error("Error retrieving subscription types:", error);
    res.status(500).json({ error: "Error retrieving subscription types" });
  }
});

module.exports = router;