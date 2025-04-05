// routes/vathmoi-diskolias.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const levels = await prisma.vathmos_diskolias.findMany({
      orderBy: {
        epipedo: "asc",
      },
    });
    res.json(levels);
  } catch (error) {
    console.error("Error retrieving difficulty levels:", error);
    res.status(500).json({ error: "Error retrieving difficulty levels" });
  }
});

module.exports = router;