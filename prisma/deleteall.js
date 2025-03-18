const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllData() {
  try {
    // Διαγραφή δεδομένων από όλους τους πίνακες
    await prisma.katavalei.deleteMany();
    await prisma.parakolouthisi.deleteMany();
    await prisma.agonizetai.deleteMany();
    await prisma.agones.deleteMany();
    await prisma.asxoleitai.deleteMany();
    await prisma.exei.deleteMany();
    await prisma.plironei.deleteMany();
    await prisma.simmetoxi.deleteMany();
    await prisma.ekpaideuei.deleteMany();
    await prisma.eksoflei.deleteMany();
    await prisma.daneizetai.deleteMany();
    await prisma.kratisi_Katafigiou.deleteMany();
    await prisma.sindromi.deleteMany();
    await prisma.drastiriotita.deleteMany();
    await prisma.sxoli.deleteMany();
    await prisma.eidosSindromis.deleteMany();
    await prisma.athlima.deleteMany();
    await prisma.eksoplismos.deleteMany();
    await prisma.katafigio.deleteMany();
    await prisma.eksormisi.deleteMany();
    await prisma.vathmosDiskolias.deleteMany();
    await prisma.ekpaideutis.deleteMany();
    await prisma.eksoterikoMelos.deleteMany();
    await prisma.athlitis.deleteMany();
    await prisma.sindromitis.deleteMany();
    await prisma.esoterikoMelos.deleteMany();
    await prisma.epafes.deleteMany();

    console.log('Όλα τα δεδομένα διαγράφηκαν επιτυχώς!');
  } catch (error) {
    console.error('Σφάλμα κατά τη διαγραφή δεδομένων:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllData();