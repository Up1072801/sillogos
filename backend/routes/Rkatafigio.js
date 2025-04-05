const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// GET: Ανάκτηση όλων των κρατήσεων καταφυγίου
router.get("/", async (_req, res) => {
  try {
    const bookings = await prisma.kratisi_katafigiou.findMany({
      include: {
        katafigio: true, // Συμπερίληψη δεδομένων από τον πίνακα katafigio
        epafes: true, // Συμπερίληψη δεδομένων από τον πίνακα epafes (αν υπάρχει)
      },
    });

    const serializedBookings = bookings.map((booking) => ({
      id: booking.id_kratisis,
      arrival: booking.hmerominia_afiksis,
      departure: booking.hmerominia_epistrofis,
      people: booking.atoma,
      members: booking.arithmos_melwn,
      nonMembers: booking.arithmos_mi_melwn,
      totalPrice: booking.sinoliki_timh,
      externalSpace: booking.eksoterikos_xoros,
      bookingDate: booking.hmerominia_kratisis,
      cancellationDate: booking.hmerominia_akirosis,
      refundAmount: booking.poso_epistrofis,
      contactName: `${booking.epafes?.onoma || ""} ${booking.epafes?.epitheto || ""}`,
      shelterName: booking.katafigio?.onoma || "",
      capacity: booking.katafigio?.xoritikotita || 0,
    }));

    res.json(serializedBookings);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των κρατήσεων καταφυγίου:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των κρατήσεων καταφυγίου" });
  }
});

// POST: Δημιουργία νέας κράτησης
router.post("/", async (req, res) => {
  try {
    const newBooking = await prisma.kratisi_katafigiou.create({
      data: req.body,
    });
    res.json(newBooking);
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία κράτησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη δημιουργία κράτησης" });
  }
});

// DELETE: Διαγραφή κράτησης
router.delete("/:id", async (req, res) => {
  try {
    await prisma.kratisi_katafigiou.delete({
      where: { id_kratisis: parseInt(req.params.id) },
    });
    res.json({ message: "Η κράτηση διαγράφηκε με επιτυχία" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή κράτησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή κράτησης" });
  }
});

// PUT: Ενημέρωση κράτησης
router.put("/:id", async (req, res) => {
  try {
    const updatedBooking = await prisma.kratisi_katafigiou.update({
      where: { id_kratisis: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(updatedBooking);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση κράτησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση κράτησης" });
  }
});

module.exports = router;