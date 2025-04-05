const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config({ path: './.env' });

async function deleteAllData() {
  try {
    // Διαγραφή δεδομένων από child tables
    await prisma.katavalei.deleteMany();
    await prisma.plironei.deleteMany();
    await prisma.simmetoxi.deleteMany();
    await prisma.exei.deleteMany();
    await prisma.eksoflei.deleteMany();
    await prisma.daneizetai.deleteMany();

    // Διαγραφή δεδομένων από intermediate tables
    await prisma.agonizetai.deleteMany();
    await prisma.asxoleitai.deleteMany();
    await prisma.ekpaideuei.deleteMany();

    // Διαγραφή δεδομένων από main tables
    await prisma.kratisi_katafigiou.deleteMany();
    await prisma.parakolouthisi.deleteMany();
    await prisma.sindromi.deleteMany();
    await prisma.agones.deleteMany();
    await prisma.drastiriotita.deleteMany();
    await prisma.sxoli.deleteMany();
    await prisma.eidos_sindromis.deleteMany();
    await prisma.athlima.deleteMany();
    await prisma.eksoplismos.deleteMany();
    await prisma.katafigio.deleteMany();
    await prisma.eksormisi.deleteMany();

    // Διαγραφή δεδομένων από τον πίνακα melos πριν τον πίνακα vathmos_diskolias
    await prisma.melos.deleteMany();

    // Διαγραφή δεδομένων από τον πίνακα vathmos_diskolias
    await prisma.vathmos_diskolias.deleteMany();

    // Διαγραφή δεδομένων από parent tables
    await prisma.athlitis.deleteMany();
    await prisma.sindromitis.deleteMany();
    await prisma.esoteriko_melos.deleteMany();
    await prisma.eksoteriko_melos.deleteMany();
    await prisma.ekpaideutis.deleteMany();
    await prisma.epafes.deleteMany();

    console.log('Όλα τα δεδομένα διαγράφηκαν επιτυχώς!');

    // Επανεκκίνηση αριθμητών (sequences) για πίνακες με autoincrement
    const sequences = [
      "Epafes_id_epafis_seq",
      "Eksoplismos_id_eksoplismou_seq",
      "Sxoli_id_sxolis_seq",
      "EidosSindromis_id_eidous_sindromis_seq",
      "Drastiriotita_id_drastiriotitas_seq",
      "Kratisi_Katafigiou_id_kratisis_seq",
      "Parakolouthisi_id_parakolouthisis_seq",
      "Katavalei_id_seq",
      "Eksormisi_id_eksormisis_seq",
      "VathmosDiskolias_id_vathmou_diskolias_seq",
      "Agones_id_agona_seq",
      "Simmetoxi_id_simmetoxis_seq",
      "Plironei_id_seq",
      "Melos_id_melous_seq",
      "Athlitis_id_athliti_seq",
      "Sindromitis_id_sindromiti_seq",
      "EsoterikoMelos_id_es_melous_seq",
      "EksoterikoMelos_id_ekso_melous_seq",
      "Ekpaideutis_id_ekpaideuti_seq"
    ];

    for (const sequence of sequences) {
      try {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${sequence}" RESTART WITH 1`);
      } catch (error) {
        console.warn(`Η ακολουθία "${sequence}" δεν υπάρχει:`, error.message);
      }
    }

    console.log('Όλοι οι αριθμητές (sequences) επανεκκινήθηκαν επιτυχώς!');
  } catch (error) {
    console.error('Σφάλμα κατά τη διαγραφή δεδομένων:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllData();