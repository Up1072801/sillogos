const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// Μετατροπή BigInt για σωστή σειριοποίηση JSON
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Συνάρτηση υπολογισμού ημερών μεταξύ δύο ημερομηνιών
function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Συνάρτηση υπολογισμού συνολικής τιμής
function calculateTotalPrice(days, memberCount, nonMemberCount, memberPrice, nonMemberPrice) {
  return (memberCount * memberPrice + nonMemberCount * nonMemberPrice) * days;
}

// GET: Ανάκτηση όλων των καταφυγίων
router.get("/katafygia", async (_req, res) => {
  try {
    const katafygia = await prisma.katafigio.findMany();
    res.json(katafygia);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των καταφυγίων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των καταφυγίων" });
  }
});

// GET: Ανάκτηση κρατήσεων καταφυγίων με πλήρη στοιχεία
router.get("/", async (_req, res) => {
  try {
    const bookings = await prisma.kratisi_katafigiou.findMany({
      include: {
        katafigio: true,
        epafes: true,
        eksoflei: true
      }
    });
    
    // Διαμόρφωση των δεδομένων για το frontend
    const formattedBookings = bookings.map(booking => {
      // Υπολογισμός ημερών
      const days = calculateDays(booking.hmerominia_afiksis, booking.hmerominia_epistrofis);
      
      // Υπολογισμός συνολικού αριθμού ατόμων
      const totalPeople = (booking.arithmos_melwn || 0) + (booking.arithmos_mi_melwn || 0);
      
      // Υπολογισμός συνολικής τιμής αν δεν είναι ήδη αποθηκευμένη
      const totalPrice = booking.sinoliki_timh || calculateTotalPrice(
        days,
        booking.arithmos_melwn || 0,
        booking.arithmos_mi_melwn || 0,
        booking.katafigio?.timi_melous || 0,
        booking.katafigio?.timi_mi_melous || 0
      );
      
      // Υπολογισμός συνολικού ποσού πληρωμών
      const totalPaid = booking.eksoflei.reduce((sum, payment) => sum + (payment.poso || 0), 0);
      
      // Υπολογισμός υπολοίπου
      const balance = booking.ypoloipo !== null ? booking.ypoloipo : (totalPrice - totalPaid);
      
      return {
        id: booking.id_kratisis,
        contactName: booking.epafes 
          ? `${booking.epafes.onoma || ''} ${booking.epafes.epitheto || ''}`.trim() 
          : "Άγνωστο",
        contactEmail: booking.epafes?.email || '',
        contactPhone: booking.epafes?.tilefono?.toString() || '',
        id_epafis: booking.id_epafis,
        shelterName: booking.katafigio?.onoma || "Άγνωστο",
        id_katafigiou: booking.id_katafigiou,
        arrival: booking.hmerominia_afiksis,
        departure: booking.hmerominia_epistrofis,
        days,
        members: booking.arithmos_melwn || 0,
        nonMembers: booking.arithmos_mi_melwn || 0,
        people: totalPeople,
        capacity: booking.katafigio?.xoritikotita || 0,
        externalSpace: booking.eksoterikos_xoros,
        totalPrice, // Συνολική τιμή
        totalPaid, // Συνολικό ποσό που έχει πληρωθεί
        balance, // Υπόλοιπο προς πληρωμή
        bookingDate: booking.hmerominia_kratisis,
        cancellationDate: booking.hmerominia_akirosis,
        refundAmount: booking.poso_epistrofis || 0,
        payments: booking.eksoflei.map(payment => ({
          id: payment.id,
          amount: payment.poso,
          date: payment.hmerominia_eksoflisis
        }))
      };
    });
    
    res.json(formattedBookings);
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση των κρατήσεων:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ανάκτηση των κρατήσεων" });
  }
});

// GET: Έλεγχος διαθεσιμότητας καταφυγίου για συγκεκριμένη περίοδο
router.get("/availability/:id_katafigiou", async (req, res) => {
  try {
    const { id_katafigiou } = req.params;
    const { startDate, endDate } = req.query;
    
    const katafigio = await prisma.katafigio.findUnique({
      where: { id_katafigiou: parseInt(id_katafigiou) }
    });
    
    if (!katafigio) {
      return res.status(404).json({ error: "Το καταφύγιο δεν βρέθηκε" });
    }
    
    // Βρίσκουμε όλες τις κρατήσεις για το καταφύγιο στη συγκεκριμένη περίοδο
    const overlappingBookings = await prisma.kratisi_katafigiou.findMany({
      where: {
        id_katafigiou: parseInt(id_katafigiou),
        hmerominia_akirosis: null, // Μόνο μη ακυρωμένες κρατήσεις
        OR: [
          {
            // Άφιξη μεταξύ των ζητούμενων ημερομηνιών
            hmerominia_afiksis: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          {
            // Αναχώρηση μεταξύ των ζητούμενων ημερομηνιών
            hmerominia_epistrofis: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          {
            // Κάλυψη ολόκληρης της περιόδου
            AND: [
              {
                hmerominia_afiksis: {
                  lte: new Date(startDate)
                }
              },
              {
                hmerominia_epistrofis: {
                  gte: new Date(endDate)
                }
              }
            ]
          }
        ]
      }
    });
    
    // Υπολογίζουμε τον αριθμό των ατόμων ανά ημέρα
    const capacity = katafigio.xoritikotita;
    const dailyOccupancy = {};
    
    // Αρχικοποίηση με 0 άτομα για κάθε ημέρα στην περίοδο
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dailyOccupancy[date.toISOString().split('T')[0]] = 0;
    }
    
    // Υπολογισμός ατόμων για κάθε ημέρα
    overlappingBookings.forEach(booking => {
      const bookingStart = new Date(booking.hmerominia_afiksis);
      const bookingEnd = new Date(booking.hmerominia_epistrofis);
      const peopleCount = booking.atoma || 0;
      
      for (let date = new Date(Math.max(bookingStart, start)); 
           date <= new Date(Math.min(bookingEnd, end)); 
           date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        dailyOccupancy[dateStr] += peopleCount;
      }
    });
    
    // Έλεγχος διαθεσιμότητας
    const availability = {};
    for (const date in dailyOccupancy) {
      availability[date] = {
        occupied: dailyOccupancy[date],
        available: capacity - dailyOccupancy[date],
        isFull: dailyOccupancy[date] >= capacity
      };
    }
    
    res.json({
      id_katafigiou: katafigio.id_katafigiou,
      name: katafigio.onoma,
      capacity,
      availability
    });
    
  } catch (error) {
    console.error("Σφάλμα κατά τον έλεγχο διαθεσιμότητας:", error);
    res.status(500).json({ error: "Σφάλμα κατά τον έλεγχο διαθεσιμότητας" });
  }
});

// POST: Δημιουργία νέας κράτησης
router.post("/", async (req, res) => {
  try {
    const {
      id_epafis,
      id_katafigiou,
      hmerominia_afiksis,
      hmerominia_epistrofis,
      arithmos_melwn,
      arithmos_mi_melwn,
      eksoterikos_xoros,
      initialPayment
    } = req.body;
    
    // Έλεγχος υποχρεωτικών πεδίων
    if (!id_epafis || !id_katafigiou || !hmerominia_afiksis || !hmerominia_epistrofis) {
      return res.status(400).json({ error: "Λείπουν υποχρεωτικά πεδία" });
    }
    
    // Ανάκτηση καταφυγίου για υπολογισμό της τιμής
    const katafigio = await prisma.katafigio.findUnique({
      where: { id_katafigiou: parseInt(id_katafigiou) }
    });
    
    if (!katafigio) {
      return res.status(404).json({ error: "Το καταφύγιο δεν βρέθηκε" });
    }
    
    // Υπολογισμός ημερών
    const days = calculateDays(hmerominia_afiksis, hmerominia_epistrofis);
    
    // Υπολογισμός συνολικής τιμής
    const totalPrice = calculateTotalPrice(
      days,
      parseInt(arithmos_melwn || 0),
      parseInt(arithmos_mi_melwn || 0),
      katafigio.timi_melous,
      katafigio.timi_mi_melous
    );
    
    // Υπολογισμός συνολικού αριθμού ατόμων
    const totalPeople = parseInt(arithmos_melwn || 0) + parseInt(arithmos_mi_melwn || 0);
    
    // Δημιουργία κράτησης με transaction για να περιλαμβάνει και την αρχική πληρωμή αν υπάρχει
    const result = await prisma.$transaction(async (prisma) => {
      // Δημιουργία κράτησης
      const newBooking = await prisma.kratisi_katafigiou.create({
        data: {
          id_epafis: parseInt(id_epafis),
          id_katafigiou: parseInt(id_katafigiou),
          hmerominia_afiksis: new Date(hmerominia_afiksis),
          hmerominia_epistrofis: new Date(hmerominia_epistrofis),
          arithmos_melwn: parseInt(arithmos_melwn || 0),
          arithmos_mi_melwn: parseInt(arithmos_mi_melwn || 0),
          atoma: totalPeople,
          imeres: days,
          sinoliki_timh: totalPrice,
          eksoterikos_xoros,
          hmerominia_kratisis: new Date(),
          ypoloipo: totalPrice // Αρχικά, το υπόλοιπο είναι ίσο με τη συνολική τιμή
        }
      });
      
      // Εάν υπάρχει αρχική πληρωμή, καταχωρούμε την πληρωμή
      let payment = null;
      if (initialPayment && initialPayment > 0) {
        payment = await prisma.eksoflei.create({
          data: {
            id_epafis: parseInt(id_epafis),
            id_kratisis: newBooking.id_kratisis,
            poso: parseInt(initialPayment),
            hmerominia_eksoflisis: new Date()
          }
        });
        
        // Ενημέρωση του υπολοίπου της κράτησης
        await prisma.kratisi_katafigiou.update({
          where: { id_kratisis: newBooking.id_kratisis },
          data: { ypoloipo: totalPrice - parseInt(initialPayment) }
        });
      }
      
      return { newBooking, payment };
    });
    
    // Ανάκτηση της πλήρους κράτησης με όλα τα σχετικά δεδομένα
    const completeBooking = await prisma.kratisi_katafigiou.findUnique({
      where: { id_kratisis: result.newBooking.id_kratisis },
      include: {
        katafigio: true,
        epafes: true,
        eksoflei: true
      }
    });
    
    // Μορφοποίηση της απάντησης
    const response = {
      id: completeBooking.id_kratisis,
      contactName: completeBooking.epafes 
        ? `${completeBooking.epafes.onoma || ''} ${completeBooking.epafes.epitheto || ''}`.trim() 
        : "Άγνωστο",
      contactEmail: completeBooking.epafes?.email || '',
      contactPhone: completeBooking.epafes?.tilefono?.toString() || '',
      id_epafis: completeBooking.id_epafis,
      shelterName: completeBooking.katafigio?.onoma || "Άγνωστο",
      id_katafigiou: completeBooking.id_katafigiou,
      arrival: completeBooking.hmerominia_afiksis,
      departure: completeBooking.hmerominia_epistrofis,
      days,
      members: completeBooking.arithmos_melwn || 0,
      nonMembers: completeBooking.arithmos_mi_melwn || 0,
      people: totalPeople,
      capacity: completeBooking.katafigio?.xoritikotita || 0,
      externalSpace: completeBooking.eksoterikos_xoros,
      totalPrice,
      totalPaid: result.payment?.poso || 0,
      balance: totalPrice - (result.payment?.poso || 0),
      bookingDate: completeBooking.hmerominia_kratisis,
      payments: completeBooking.eksoflei.map(payment => ({
        id: payment.id,
        amount: payment.poso,
        date: payment.hmerominia_eksoflisis
      }))
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία κράτησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη δημιουργία κράτησης", details: error.message });
  }
});

// PUT: Ενημέρωση υπάρχουσας κράτησης
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_epafis,
      id_katafigiou,
      hmerominia_afiksis,
      hmerominia_epistrofis,
      arithmos_melwn,
      arithmos_mi_melwn,
      eksoterikos_xoros
    } = req.body;
    
    // Έλεγχος αν η κράτηση υπάρχει
    const existingBooking = await prisma.kratisi_katafigiou.findUnique({
      where: { id_kratisis: parseInt(id) },
      include: { katafigio: true }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ error: "Η κράτηση δεν βρέθηκε" });
    }
    
    // Ανάκτηση καταφυγίου για υπολογισμό της τιμής
    const katafigio = await prisma.katafigio.findUnique({
      where: { id_katafigiou: id_katafigiou ? parseInt(id_katafigiou) : existingBooking.id_katafigiou }
    });
    
    if (!katafigio) {
      return res.status(404).json({ error: "Το καταφύγιο δεν βρέθηκε" });
    }
    
    // Υπολογισμός ημερών
    const days = calculateDays(
      hmerominia_afiksis || existingBooking.hmerominia_afiksis, 
      hmerominia_epistrofis || existingBooking.hmerominia_epistrofis
    );
    
    // Υπολογισμός συνολικής τιμής
    const totalPrice = calculateTotalPrice(
      days,
      parseInt(arithmos_melwn === undefined ? existingBooking.arithmos_melwn : arithmos_melwn),
      parseInt(arithmos_mi_melwn === undefined ? existingBooking.arithmos_mi_melwn : arithmos_mi_melwn),
      katafigio.timi_melous,
      katafigio.timi_mi_melous
    );
    
    // Υπολογισμός συνολικού αριθμού ατόμων
    const totalPeople = 
      parseInt(arithmos_melwn === undefined ? existingBooking.arithmos_melwn : arithmos_melwn) + 
      parseInt(arithmos_mi_melwn === undefined ? existingBooking.arithmos_mi_melwn : arithmos_mi_melwn);
    
    // Ανάκτηση πληρωμών
    const payments = await prisma.eksoflei.findMany({
      where: { id_kratisis: parseInt(id) }
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
    
    // Υπολογισμός νέου υπολοίπου
    const balance = totalPrice - totalPaid;
    
    // Ενημέρωση κράτησης
    const updatedBooking = await prisma.kratisi_katafigiou.update({
      where: { id_kratisis: parseInt(id) },
      data: {
        id_epafis: id_epafis ? parseInt(id_epafis) : undefined,
        id_katafigiou: id_katafigiou ? parseInt(id_katafigiou) : undefined,
        hmerominia_afiksis: hmerominia_afiksis ? new Date(hmerominia_afiksis) : undefined,
        hmerominia_epistrofis: hmerominia_epistrofis ? new Date(hmerominia_epistrofis) : undefined,
        arithmos_melwn: arithmos_melwn ? parseInt(arithmos_melwn) : undefined,
        arithmos_mi_melwn: arithmos_mi_melwn ? parseInt(arithmos_mi_melwn) : undefined,
        atoma: totalPeople,
        imeres: days,
        sinoliki_timh: totalPrice,
        eksoterikos_xoros,
        ypoloipo: balance
      },
      include: {
        katafigio: true,
        epafes: true,
        eksoflei: true
      }
    });
    
    // Μορφοποίηση της απάντησης
    const response = {
      id: updatedBooking.id_kratisis,
      contactName: updatedBooking.epafes 
        ? `${updatedBooking.epafes.onoma || ''} ${updatedBooking.epafes.epitheto || ''}`.trim() 
        : "Άγνωστο",
      contactEmail: updatedBooking.epafes?.email || '',
      contactPhone: updatedBooking.epafes?.tilefono?.toString() || '',
      id_epafis: updatedBooking.id_epafis,
      shelterName: updatedBooking.katafigio?.onoma || "Άγνωστο",
      id_katafigiou: updatedBooking.id_katafigiou,
      arrival: updatedBooking.hmerominia_afiksis,
      departure: updatedBooking.hmerominia_epistrofis,
      days,
      members: updatedBooking.arithmos_melwn || 0,
      nonMembers: updatedBooking.arithmos_mi_melwn || 0,
      people: totalPeople,
      capacity: updatedBooking.katafigio?.xoritikotita || 0,
      externalSpace: updatedBooking.eksoterikos_xoros,
      totalPrice,
      totalPaid,
      balance,
      bookingDate: updatedBooking.hmerominia_kratisis,
      cancellationDate: updatedBooking.hmerominia_akirosis,
      refundAmount: updatedBooking.poso_epistrofis || 0,
      payments: updatedBooking.eksoflei.map(payment => ({
        id: payment.id,
        amount: payment.poso,
        date: payment.hmerominia_eksoflisis
      }))
    };
    
    res.json(response);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση της κράτησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ενημέρωση της κράτησης", details: error.message });
  }
});

// POST: Προσθήκη πληρωμής για κράτηση
router.post("/:id/payment", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_epafis, poso } = req.body;
    
    if (!id_epafis || !poso || poso <= 0) {
      return res.status(400).json({ error: "Λείπουν υποχρεωτικά πεδία ή το ποσό δεν είναι έγκυρο" });
    }
    
    // Έλεγχος αν η κράτηση υπάρχει
    const existingBooking = await prisma.kratisi_katafigiou.findUnique({
      where: { id_kratisis: parseInt(id) }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ error: "Η κράτηση δεν βρέθηκε" });
    }
    
    // Προσθήκη πληρωμής και ενημέρωση υπολοίπου κράτησης
    const result = await prisma.$transaction(async (prisma) => {
      // Δημιουργία νέας πληρωμής
      const newPayment = await prisma.eksoflei.create({
        data: {
          id_epafis: parseInt(id_epafis),
          id_kratisis: parseInt(id),
          poso: parseInt(poso),
          hmerominia_eksoflisis: new Date()
        }
      });
      
      // Υπολογισμός συνολικού ποσού πληρωμών
      const payments = await prisma.eksoflei.findMany({
        where: { id_kratisis: parseInt(id) }
      });
      
      const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
      
      // Ενημέρωση υπολοίπου κράτησης
      const updatedBooking = await prisma.kratisi_katafigiou.update({
        where: { id_kratisis: parseInt(id) },
        data: {
          ypoloipo: existingBooking.sinoliki_timh - totalPaid
        },
        include: {
          katafigio: true,
          epafes: true,
          eksoflei: true
        }
      });
      
      return { newPayment, updatedBooking, totalPaid };
    });
    
    res.status(201).json({
      payment: {
        id: result.newPayment.id,
        amount: result.newPayment.poso,
        date: result.newPayment.hmerominia_eksoflisis
      },
      booking: {
        id: result.updatedBooking.id_kratisis,
        totalPaid: result.totalPaid,
        balance: result.updatedBooking.ypoloipo
      }
    });
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη πληρωμής:", error);
    res.status(500).json({ error: "Σφάλμα κατά την προσθήκη πληρωμής", details: error.message });
  }
});

// PUT: Ενημέρωση πληρωμής
router.put("/:id/payment/:paymentId", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const paymentId = parseInt(req.params.paymentId);
    const { poso, hmerominia } = req.body;
    
    if (isNaN(bookingId) || isNaN(paymentId) || !poso || poso <= 0) {
      return res.status(400).json({ 
        error: "Μη έγκυρα δεδομένα. Απαιτούνται έγκυρα IDs και ποσό πληρωμής." 
      });
    }
    
    // Έλεγχος αν η κράτηση υπάρχει
    const existingBooking = await prisma.kratisi_katafigiou.findUnique({
      where: { id_kratisis: bookingId }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ error: "Η κράτηση δεν βρέθηκε" });
    }
    
    // Έλεγχος αν η πληρωμή υπάρχει και ανήκει στην κράτηση
    const existingPayment = await prisma.eksoflei.findFirst({
      where: { 
        AND: [
          { id: paymentId },
          { id_kratisis: bookingId }
        ]
      }
    });
    
    if (!existingPayment) {
      return res.status(404).json({ error: "Η πληρωμή δεν βρέθηκε ή δεν ανήκει στην κράτηση" });
    }
    
    // Ενημέρωση πληρωμής
    const updatedPayment = await prisma.eksoflei.update({
      where: { id: paymentId },
      data: {
        poso: parseInt(poso),
        hmerominia_eksoflisis: hmerominia ? new Date(hmerominia) : existingPayment.hmerominia_eksoflisis
      }
    });
    
    // Ανανέωση πληρωμών της κράτησης
    const payments = await prisma.eksoflei.findMany({
      where: { id_kratisis: bookingId }
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
    
    // Ενημέρωση υπολοίπου
    const updatedBooking = await prisma.kratisi_katafigiou.update({
      where: { id_kratisis: bookingId },
      data: {
        ypoloipo: existingBooking.sinoliki_timh - totalPaid
      },
      include: {
        eksoflei: true,
        katafigio: true,
        epafes: true
      }
    });
    
    res.json({
      payment: {
        id: updatedPayment.id,
        amount: updatedPayment.poso,
        date: updatedPayment.hmerominia_eksoflisis
      },
      booking: {
        id: updatedBooking.id_kratisis,
        totalPaid,
        balance: updatedBooking.ypoloipo,
        payments: updatedBooking.eksoflei.map(payment => ({
          id: payment.id,
          amount: payment.poso,
          date: payment.hmerominia_eksoflisis
        }))
      }
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση πληρωμής:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά την ενημέρωση πληρωμής", 
      details: error.message 
    });
  }
});

// DELETE: Διαγραφή πληρωμής
router.delete("/:id/payment/:paymentId", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const paymentId = parseInt(req.params.paymentId);
    
    if (isNaN(bookingId) || isNaN(paymentId)) {
      return res.status(400).json({ 
        error: "Μη έγκυρα IDs κράτησης ή πληρωμής" 
      });
    }
    
    // Έλεγχος αν η κράτηση υπάρχει
    const existingBooking = await prisma.kratisi_katafigiou.findUnique({
      where: { id_kratisis: bookingId }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ error: "Η κράτηση δεν βρέθηκε" });
    }
    
    // Έλεγχος αν η πληρωμή υπάρχει και ανήκει στην κράτηση
    const existingPayment = await prisma.eksoflei.findFirst({
      where: { 
        AND: [
          { id: paymentId },
          { id_kratisis: bookingId }
        ]
      }
    });
    
    if (!existingPayment) {
      return res.status(404).json({ error: "Η πληρωμή δεν βρέθηκε ή δεν ανήκει στην κράτηση" });
    }
    
    // Διαγραφή πληρωμής
    await prisma.eksoflei.delete({
      where: { id: paymentId }
    });
    
    // Ανανέωση πληρωμών της κράτησης
    const payments = await prisma.eksoflei.findMany({
      where: { id_kratisis: bookingId }
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
    
    // Ενημέρωση υπολοίπου
    const updatedBooking = await prisma.kratisi_katafigiou.update({
      where: { id_kratisis: bookingId },
      data: {
        ypoloipo: existingBooking.sinoliki_timh - totalPaid
      },
      include: {
        eksoflei: true
      }
    });
    
    res.json({
      deleted: true,
      paymentId: paymentId,
      booking: {
        id: updatedBooking.id_kratisis,
        totalPaid,
        balance: updatedBooking.ypoloipo,
        payments: updatedBooking.eksoflei.map(payment => ({
          id: payment.id,
          amount: payment.poso,
          date: payment.hmerominia_eksoflisis
        }))
      }
    });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή πληρωμής:", error);
    res.status(500).json({ 
      error: "Σφάλμα κατά τη διαγραφή πληρωμής", 
      details: error.message 
    });
  }
});

// PUT: Ακύρωση κράτησης
router.put("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { poso_epistrofis } = req.body;
    
    // Έλεγχος αν η κράτηση υπάρχει
    const existingBooking = await prisma.kratisi_katafigiou.findUnique({
      where: { id_kratisis: parseInt(id) }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ error: "Η κράτηση δεν βρέθηκε" });
    }
    
    // Ενημέρωση κράτησης ως ακυρωμένη
    const cancelledBooking = await prisma.kratisi_katafigiou.update({
      where: { id_kratisis: parseInt(id) },
      data: {
        hmerominia_akirosis: new Date(),
        poso_epistrofis: poso_epistrofis ? parseInt(poso_epistrofis) : 0
      }
    });
    
    res.json({
      id: cancelledBooking.id_kratisis,
      cancellationDate: cancelledBooking.hmerominia_akirosis,
      refundAmount: cancelledBooking.poso_epistrofis || 0
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ακύρωση της κράτησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά την ακύρωση της κράτησης", details: error.message });
  }
});

// DELETE: Διαγραφή κράτησης (μόνο για διαχειριστές)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Έλεγχος αν η κράτηση υπάρχει
    const existingBooking = await prisma.kratisi_katafigiou.findUnique({
      where: { id_kratisis: parseInt(id) }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ error: "Η κράτηση δεν βρέθηκε" });
    }
    
    // Διαγραφή σχετικών πληρωμών και της κράτησης
    await prisma.$transaction(async (prisma) => {
      // Πρώτα διαγράφουμε τις πληρωμές
      await prisma.eksoflei.deleteMany({
        where: { id_kratisis: parseInt(id) }
      });
      
      // Μετά διαγράφουμε την κράτηση
      await prisma.kratisi_katafigiou.delete({
        where: { id_kratisis: parseInt(id) }
      });
    });
    
    res.json({ message: "Η κράτηση και όλες οι σχετικές πληρωμές διαγράφηκαν με επιτυχία" });
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της κράτησης:", error);
    res.status(500).json({ error: "Σφάλμα κατά τη διαγραφή της κράτησης", details: error.message });
  }
});

module.exports = router;