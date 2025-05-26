const { PrismaClient } = require('@prisma/client');
const faker = require('@faker-js/faker');
const prisma = new PrismaClient();
require('dotenv').config({ path: './.env' });
async function main() {
  console.log('Starting seed process...');

  // 1. Δημιουργία Βαθμών Δυσκολίας
  await prisma.vathmos_diskolias.createMany({
    data: [
      { id_vathmou_diskolias: 1, epipedo: 1 },
      { id_vathmou_diskolias: 2, epipedo: 2 },
      { id_vathmou_diskolias: 3, epipedo: 3 },
      { id_vathmou_diskolias: 4, epipedo: 4 },
      { id_vathmou_diskolias: 5, epipedo: 5 },
      { id_vathmou_diskolias: 6, epipedo: 6 },
      { id_vathmou_diskolias: 7, epipedo: 7 },
      { id_vathmou_diskolias: 8, epipedo: 8 },
    ],
  });



  // 3. Δημιουργία Καταφυγίων
await prisma.katafigio.create({
  data: {
    id_katafigiou: 1,
    onoma: "Καταφύγιο Όλυμπος",
    xoritikotita: 20,
    timi_melous: 20,
    timi_mi_melous: 40,
    timi_eksoxwrou_melos: 30,      // παράδειγμα τιμή
    timi_eksoxwroy_mimelos: 50    // παράδειγμα τιμή
  }
});


  // 4. Δημιουργία Εξοπλισμού
  await prisma.eksoplismos.createMany({
    data: [
      {
        id_eksoplismou: 1,
        onoma: "Αναρριχητικό σχοινί",
        xroma: "Μπλε",
        hmerominia_kataskeuis: new Date("2022-01-15"),
        megethos: "50m",
        marka: "Petzl"
      },
      {
        id_eksoplismou: 2,
        onoma: "Σακίδιο",
        xroma: "Κόκκινο",
        hmerominia_kataskeuis: new Date("2023-03-20"),
        megethos: "30L",
        marka: "Deuter"
      },
      {
        id_eksoplismou: 3,
        onoma: "Παγοθραυστικό",
        xroma: "Ασημί",
        hmerominia_kataskeuis: new Date("2024-07-10"),
        megethos: "70cm",
        marka: "Black Diamond"
      },
      {
        id_eksoplismou: 4,
        onoma: "Μάσκα Καταδύσεων",
        xroma: "Μαύρο",
        hmerominia_kataskeuis: new Date("2023-11-01"),
        megethos: "Standard",
        marka: "Cressi"
      },
      {
        id_eksoplismou: 5,
        onoma: "Ποδήλατο",
        xroma: "Πράσινο",
        hmerominia_kataskeuis: new Date("2022-09-15"),
        megethos: "Medium",
        marka: "Giant"
      },
      {
        id_eksoplismou: 6,
        onoma: "Σαπούνι",
        xroma: "Διαφανές",
        hmerominia_kataskeuis: new Date("2023-02-10"),
        megethos: "100g",
        marka: "Nivea"
      }
    ]
  });

  // 5. Δημιουργία Αθλημάτων
  await prisma.athlima.createMany({
    data: [
      {
        id_athlimatos: 1,
        onoma: "Ορειβασία"
      },
      {
        id_athlimatos: 2,
        onoma: "Αναρρίχηση"
      },
      {
        id_athlimatos: 3,
        onoma: "Σκι"
      }
    ]
  });

  // 6. Δημιουργία Ειδών Συνδρομής
  await prisma.eidos_sindromis.createMany({
    data: [
      { id_eidous_sindromis: 1, titlos: 'Ετήσια Συνδρομή', timi: 25 },
      { id_eidous_sindromis: 2, titlos: 'Φοιτητική Συνδρομή', timi: 15 },
      { id_eidous_sindromis: 3, titlos: 'Ευπαθής Ομάδες Συνδρομή', timi: 15 },
    ]
  });

  // 7. Δημιουργία Σχολών
  await prisma.sxoli.createMany({
    data: [
      {
        id_sxolis: 1,
        timi: 300,
        epipedo: "Αρχάριος",
        klados: "Ορειβασία",
        etos: 2024,  // Year of the school
        seira: 1,    // First school in "Ορειβασία Αρχάριος" for 2024
        topothesies: [
          { topothesia: "Όλυμπος", start: new Date("2024-06-10"), end: new Date("2024-06-15") },
          { topothesia: "Παρνησσός", start: new Date("2024-07-20"), end: new Date("2024-07-25") }
        ]
      },
      {
        id_sxolis: 2,
        timi: 400,
        epipedo: "Μέσος",
        klados: "Αναρρίχηση",
        etos: 2025,  // Year of the school
        seira: 1,    // First school in "Αναρρίχηση Μέσος" for 2025
        topothesies: [
          { topothesia: "Πίνδος", start: new Date("2025-08-01"), end: new Date("2025-08-05") },
          { topothesia: "Ζαγοροχώρια", start: new Date("2025-09-10"), end: new Date("2025-09-15") }
        ]
      },
      {
        id_sxolis: 3,
        timi: 500,
        epipedo: "Προχωρημένος",
        klados: "Σκι",
        etos: 2025,  // Year of the school
        seira: 1,    // First school in "Σκι Προχωρημένος" for 2025
        topothesies: [
          { topothesia: "Καλάβρυτα", start: new Date("2025-10-01"), end: new Date("2025-10-05") },
          { topothesia: "Βόρεια Πίνδος", start: new Date("2025-11-10"), end: new Date("2025-11-15") }
        ]
      }
    ]
  });

  // 8. Δημιουργία Επαφών 
  await prisma.epafes.createMany({     
    data: [
      { onoma: "Θαλασσινή", epitheto: "Σπανουδάκης", email: "1@example.com", tilefono: 6932110806n, idiotita: null },
      { onoma: "Κρινιώ", epitheto: "Καλιάμπος", email: "2@example.com", tilefono: 6935599000n, idiotita: null },
      { onoma: "Αγησίλαος", epitheto: "Μπίλλας", email: "3@example.com", tilefono: 6945255740n, idiotita: null },
      { onoma: "Χριστόφορος", epitheto: "Λουπασάκης", email: "4@example.com", tilefono: 6988218424n, idiotita: null },
      { onoma: "Ναταλίνα", epitheto: "Δουκίδου", email: "5@example.com", tilefono: 6993633798n, idiotita: null },
      { onoma: "Αχιλλεία", epitheto: "Γερόπουλος", email: "6@example.com", tilefono: 6939012114n, idiotita: null },
      { onoma: "Γραμματική", epitheto: "Γουργουλής", email: "7@example.com", tilefono: 6912468829n, idiotita: null },
      { onoma: "Ράλλης", epitheto: "Τρεντσίου", email: "8@example.com", tilefono: 6937188098n, idiotita: null },
      { onoma: "Ασπασία", epitheto: "Παπαθωμά", email: "9@example.com", tilefono: 6967672202n, idiotita: null },
      { onoma: "Μακάριος", epitheto: "Λεντζίου", email: "10@example.com", tilefono: 6908532091n, idiotita: null },
      { onoma: "Λυδία", epitheto: "Παππάς", email: "11@example.com", tilefono: 6973793298n, idiotita: null },
      { onoma: "Φίλιππος", epitheto: "Ρέντας", email: "12@example.com", tilefono: 6964654323n, idiotita: null },
      { onoma: "Ανάργυρη", epitheto: "Αντωνάκη", email: "13@example.com", tilefono: 6923509708n, idiotita: null },
      { onoma: "Κλήμης", epitheto: "Προύβα", email: "14@example.com", tilefono: 6998652554n, idiotita: null },
      { onoma: "Πολυχρονία", epitheto: "Κουτσούρας", email: "15@example.com", tilefono: 6929367736n, idiotita: null },
      { onoma: "Θεοδότη", epitheto: "Καταραχιάς", email: "16@example.com", tilefono: 6937254292n, idiotita: null },
      { onoma: "Ροδόκλεια", epitheto: "Μαντζώρος", email: "17@example.com", tilefono: 6994432929n, idiotita: null },
      { onoma: "Βαλάντης", epitheto: "Χαντζή", email: "18@example.com", tilefono: 6914457804n, idiotita: null },
      { onoma: "Γαρυφαλλιά", epitheto: "Δαρσακλή", email: "19@example.com", tilefono: 6949452746n, idiotita: null },
      { onoma: "Ποθητή", epitheto: "Παπαευαγγελίου", email: "20@example.com", tilefono: 6947892070n, idiotita: null },
      { onoma: "Ευδοξία", epitheto: "Μπαλτζής", email: "21@example.com", tilefono: 6972195869n, idiotita: null },
      { onoma: "Σωτήριος", epitheto: "Νικητόπουλος", email: "22@example.com", tilefono: 6923836986n, idiotita: null },
      { onoma: "Βάιος", epitheto: "Τσαμοπούλου", email: "23@example.com", tilefono: 6968862231n, idiotita: null },
      { onoma: "Φρύνη", epitheto: "Φούσκας", email: "24@example.com", tilefono: 6967572078n, idiotita: null },
      { onoma: "Αλέξανδρος", epitheto: "Κατσιγιάννης", email: "25@example.com", tilefono: 6929133040n, idiotita: null },
      { onoma: "Ηράκλεια", epitheto: "Μοσχοβάκη", email: "26@example.com", tilefono: 6913849614n, idiotita: null },
      { onoma: "Σελήνη", epitheto: "Χουρζαμάνη", email: "27@example.com", tilefono: 6989034479n, idiotita: null },
      { onoma: "Αθηνά", epitheto: "Τσώνης", email: "28@example.com", tilefono: 6912849805n, idiotita: null },
      { onoma: "Χρυσοβαλάντου", epitheto: "Κουζουλά", email: "29@example.com", tilefono: 6918373514n, idiotita: null },
      { onoma: "Ιωάννης", epitheto: "Βαλασίδης", email: "30@example.com", tilefono: 6976818556n, idiotita: null },
      { onoma: "Ασημίνα", epitheto: "Λουπασάκης", email: "31@example.com", tilefono: 6961507464n, idiotita: null },
      { onoma: "Φοίβος", epitheto: "Κουλαουσάρη", email: "32@example.com", tilefono: 6955383512n, idiotita: null },
      { onoma: "Σταυρούλα", epitheto: "Χατζηγρηγοράκης", email: "33@example.com", tilefono: 6946816222n, idiotita: null },
      { onoma: "Διαλεκτή", epitheto: "Χατζηγεωργίου", email: "34@example.com", tilefono: 6927231312n, idiotita: null },
      { onoma: "Νικολίτσα", epitheto: "Τζιόβα", email: "35@example.com", tilefono: 6936110077n, idiotita: null },
      { onoma: "Ιάκωβος", epitheto: "Σκρέκας", email: "36@example.com", tilefono: 6943223277n, idiotita: null },
      { onoma: "Ιουλιανή", epitheto: "Ασλανίδου", email: "37@example.com", tilefono: 6942425292n, idiotita: null },
      { onoma: "Ιωσήφ", epitheto: "Περράκης", email: "38@example.com", tilefono: 6951396138n, idiotita: null },
      { onoma: "Αστέρω", epitheto: "Σωτηροπούλου", email: "39@example.com", tilefono: 6909446925n, idiotita: null },
      { onoma: "Παρασκευή", epitheto: "Αντωνόπουλος", email: "40@example.com", tilefono: 6925120035n, idiotita: null },
      { onoma: "Δανάη", epitheto: "Ξανθοπούλου", email: "41@example.com", tilefono: 6908970082n, idiotita: null },
      { onoma: "Γκίκας", epitheto: "Τσιαμίτας", email: "42@example.com", tilefono: 6947169269n, idiotita: null },
      { onoma: "Μαυροειδής", epitheto: "Σκόρδος", email: "43@example.com", tilefono: 6984533437n, idiotita: null },
      { onoma: "Γερασιμούλα", epitheto: "Κουκλατζής", email: "44@example.com", tilefono: 6935043339n, idiotita: null },
      { onoma: "Αλκμήνη", epitheto: "Δουβρόπουλος", email: "45@example.com", tilefono: 6982608873n, idiotita: null },
      { onoma: "Ταξιαρχία", epitheto: "Χορτάτου", email: "46@example.com", tilefono: 6943714755n, idiotita: "Χορηγός" },
      { onoma: "Ίρις", epitheto: "Γεωργαρά", email: "47@example.com", tilefono: 6988106028n, idiotita: "Γονέας" },
      { onoma: "Ευτέρπη", epitheto: "Τσικνιάς", email: "48@example.com", tilefono: 6965002470n, idiotita: "Ομιλητής" },
      { onoma: "Πωλίνα", epitheto: "Δρακουλή", email: "49@example.com", tilefono: 6930006969n, idiotita: "Γονέας" },
      { onoma: "Χρυσαφένια", epitheto: "Καλογιάννη", email: "50@example.com", tilefono: 6989152638n, idiotita: "Ομιλητής" }
    ]
  });

  await prisma.melos.createMany({
    data: [
      // Εσωτερικά μέλη (id 1–30)
      { id_melous: 1, tipo_melous: "esoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 2, tipo_melous: "esoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 3, tipo_melous: "esoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 4, tipo_melous: "esoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 5, tipo_melous: "esoteriko", id_vathmou_diskolias: 5 },
      { id_melous: 6, tipo_melous: "esoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 7, tipo_melous: "esoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 8, tipo_melous: "esoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 9, tipo_melous: "esoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 10, tipo_melous: "esoteriko", id_vathmou_diskolias: 5 },
      { id_melous: 11, tipo_melous: "esoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 12, tipo_melous: "esoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 13, tipo_melous: "esoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 14, tipo_melous: "esoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 15, tipo_melous: "esoteriko", id_vathmou_diskolias: 5 },
      { id_melous: 16, tipo_melous: "esoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 17, tipo_melous: "esoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 18, tipo_melous: "esoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 19, tipo_melous: "esoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 20, tipo_melous: "esoteriko", id_vathmou_diskolias: 5 },
      { id_melous: 21, tipo_melous: "esoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 22, tipo_melous: "esoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 23, tipo_melous: "esoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 24, tipo_melous: "esoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 25, tipo_melous: "esoteriko", id_vathmou_diskolias: 5 },
      { id_melous: 26, tipo_melous: "esoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 27, tipo_melous: "esoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 28, tipo_melous: "esoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 29, tipo_melous: "esoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 30, tipo_melous: "esoteriko", id_vathmou_diskolias: 5 },
  
      // Εξωτερικά μέλη (id 31–40)
      { id_melous: 31, tipo_melous: "eksoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 32, tipo_melous: "eksoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 33, tipo_melous: "eksoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 34, tipo_melous: "eksoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 35, tipo_melous: "eksoteriko", id_vathmou_diskolias: 5 },
      { id_melous: 36, tipo_melous: "eksoteriko", id_vathmou_diskolias: 1 },
      { id_melous: 37, tipo_melous: "eksoteriko", id_vathmou_diskolias: 2 },
      { id_melous: 38, tipo_melous: "eksoteriko", id_vathmou_diskolias: 3 },
      { id_melous: 39, tipo_melous: "eksoteriko", id_vathmou_diskolias: 4 },
      { id_melous: 40, tipo_melous: "eksoteriko", id_vathmou_diskolias: 5 }
    ]
  });
  
  
  // 9. Δημιουργία Εσωτερικών Μελών
  await prisma.esoteriko_melos.createMany({
    data: [
      { id_es_melous: 1, hmerominia_gennhshs: new Date("1990-09-14"), patronimo: "Γεώργιος", odos: "Οδός 1", tk: 26355, arithmos_mitroou: 1001 },
      { id_es_melous: 2, hmerominia_gennhshs: new Date("1990-06-17"), patronimo: "Γεώργιος", odos: "Οδός 2", tk: 26929, arithmos_mitroou: 1002 },
      { id_es_melous: 3, hmerominia_gennhshs: new Date("1993-06-18"), patronimo: "Γεώργιος", odos: "Οδός 3", tk: 26640, arithmos_mitroou: 1003 },
      { id_es_melous: 4, hmerominia_gennhshs: new Date("1998-07-12"), patronimo: "Γεώργιος", odos: "Οδός 4", tk: 26743, arithmos_mitroou: 1004 },
      { id_es_melous: 5, hmerominia_gennhshs: new Date("1990-09-17"), patronimo: "Γεώργιος", odos: "Οδός 5", tk: 26145, arithmos_mitroou: 1005 },
      { id_es_melous: 6, hmerominia_gennhshs: new Date("1997-02-14"), patronimo: "Γεώργιος", odos: "Οδός 6", tk: 26501, arithmos_mitroou: 1006 },
      { id_es_melous: 7, hmerominia_gennhshs: new Date("1993-06-17"), patronimo: "Γεώργιος", odos: "Οδός 7", tk: 26639, arithmos_mitroou: 1007 },
      { id_es_melous: 8, hmerominia_gennhshs: new Date("1990-08-18"), patronimo: "Γεώργιος", odos: "Οδός 8", tk: 26445, arithmos_mitroou: 1008 },
      { id_es_melous: 9, hmerominia_gennhshs: new Date("1995-05-18"), patronimo: "Γεώργιος", odos: "Οδός 9", tk: 26132, arithmos_mitroou: 1009 },
      { id_es_melous: 10, hmerominia_gennhshs: new Date("1994-03-16"), patronimo: "Γεώργιος", odos: "Οδός 10", tk: 26448, arithmos_mitroou: 1010 },
      { id_es_melous: 11, hmerominia_gennhshs: new Date("1998-07-15"), patronimo: "Γεώργιος", odos: "Οδός 11", tk: 26431, arithmos_mitroou: 1011 },
      { id_es_melous: 12, hmerominia_gennhshs: new Date("1994-06-11"), patronimo: "Γεώργιος", odos: "Οδός 12", tk: 26484, arithmos_mitroou: 1012 },
      { id_es_melous: 13, hmerominia_gennhshs: new Date("1992-08-17"), patronimo: "Γεώργιος", odos: "Οδός 13", tk: 26185, arithmos_mitroou: 1013 },
      { id_es_melous: 14, hmerominia_gennhshs: new Date("1997-07-10"), patronimo: "Γεώργιος", odos: "Οδός 14", tk: 26859, arithmos_mitroou: 1014 },
      { id_es_melous: 15, hmerominia_gennhshs: new Date("1997-04-18"), patronimo: "Γεώργιος", odos: "Οδός 15", tk: 26720, arithmos_mitroou: 1015 },
      { id_es_melous: 16, hmerominia_gennhshs: new Date("1993-01-18"), patronimo: "Γεώργιος", odos: "Οδός 16", tk: 26112, arithmos_mitroou: 1016 },
      { id_es_melous: 17, hmerominia_gennhshs: new Date("1992-06-13"), patronimo: "Γεώργιος", odos: "Οδός 17", tk: 26691, arithmos_mitroou: 1017 },
      { id_es_melous: 18, hmerominia_gennhshs: new Date("1995-08-19"), patronimo: "Γεώργιος", odos: "Οδός 18", tk: 26775, arithmos_mitroou: 1018 },
      { id_es_melous: 19, hmerominia_gennhshs: new Date("1998-03-10"), patronimo: "Γεώργιος", odos: "Οδός 19", tk: 26772, arithmos_mitroou: 1019 },
      { id_es_melous: 20, hmerominia_gennhshs: new Date("1990-05-13"), patronimo: "Γεώργιος", odos: "Οδός 20", tk: 26393, arithmos_mitroou: 1020 },
      { id_es_melous: 21, hmerominia_gennhshs: new Date("1996-05-13"), patronimo: "Γεώργιος", odos: "Οδός 21", tk: 26149, arithmos_mitroou: 1021 },
      { id_es_melous: 22, hmerominia_gennhshs: new Date("1993-02-15"), patronimo: "Γεώργιος", odos: "Οδός 22", tk: 26708, arithmos_mitroou: 1022 },
      { id_es_melous: 23, hmerominia_gennhshs: new Date("1990-06-17"), patronimo: "Γεώργιος", odos: "Οδός 23", tk: 26207, arithmos_mitroou: 1023 },
      { id_es_melous: 24, hmerominia_gennhshs: new Date("1995-03-16"), patronimo: "Γεώργιος", odos: "Οδός 24", tk: 26516, arithmos_mitroou: 1024 },
      { id_es_melous: 25, hmerominia_gennhshs: new Date("1997-02-15"), patronimo: "Γεώργιος", odos: "Οδός 25", tk: 26952, arithmos_mitroou: 1025 },
      { id_es_melous: 26, hmerominia_gennhshs: new Date("1994-09-18"), patronimo: "Γεώργιος", odos: "Οδός 26", tk: 26128, arithmos_mitroou: 1026 },
      { id_es_melous: 27, hmerominia_gennhshs: new Date("1998-04-15"), patronimo: "Γεώργιος", odos: "Οδός 27", tk: 26900, arithmos_mitroou: 1027 },
      { id_es_melous: 28, hmerominia_gennhshs: new Date("1997-01-13"), patronimo: "Γεώργιος", odos: "Οδός 28", tk: 26613, arithmos_mitroou: 1028 },
      { id_es_melous: 29, hmerominia_gennhshs: new Date("1992-08-17"), patronimo: "Γεώργιος", odos: "Οδός 29", tk: 26192, arithmos_mitroou: 1029 },
      { id_es_melous: 30, hmerominia_gennhshs: new Date("1998-03-11"), patronimo: "Γεώργιος", odos: "Οδός 30", tk: 26347, arithmos_mitroou: 1030 }
    ]
  });

  // 10. Δημιουργία Συνδρομητών
  await prisma.sindromitis.createMany({
    data: [
      { id_sindromiti: 1, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 2, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 3, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 4, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 5, katastasi_sindromis: "Ληγμένη" },
      { id_sindromiti: 6, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 7, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 8, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 9, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 10, katastasi_sindromis: "Διαγραμμένη" },
      { id_sindromiti: 11, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 12, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 13, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 14, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 15, katastasi_sindromis: "Ληγμένη" },
      { id_sindromiti: 16, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 17, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 18, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 19, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 20, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 21, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 22, katastasi_sindromis: "Διαγραμμένη" },
      { id_sindromiti: 23, katastasi_sindromis: "Ενεργή" },
      { id_sindromiti: 24, katastasi_sindromis: "Ληγμένη" },
      { id_sindromiti: 25, katastasi_sindromis: "Ενεργή" }
    ]
  });

// 11. Δημιουργία Αθλητών
await prisma.athlitis.createMany({
  data: [
    { id_athliti: 26, arithmos_deltiou: 5001, hmerominia_enarksis_deltiou: new Date("2022-01-01"), hmerominia_liksis_deltiou: new Date("2025-01-01") },
    { id_athliti: 27, arithmos_deltiou: 5002, hmerominia_enarksis_deltiou: new Date("2022-01-01"), hmerominia_liksis_deltiou: new Date("2025-01-01") },
    { id_athliti: 28, arithmos_deltiou: 5003, hmerominia_enarksis_deltiou: new Date("2022-01-01"), hmerominia_liksis_deltiou: new Date("2025-01-01") },
    { id_athliti: 29, arithmos_deltiou: 5004, hmerominia_enarksis_deltiou: new Date("2022-01-01"), hmerominia_liksis_deltiou: new Date("2025-01-01") },
    { id_athliti: 30, arithmos_deltiou: 5005, hmerominia_enarksis_deltiou: new Date("2022-01-01"), hmerominia_liksis_deltiou: new Date("2025-01-01") }
  ]
});

// 12. Δημιουργία Σχέσεων Αθλητών-Αθλημάτων
await prisma.asxoleitai.createMany({
  data: [
    { id_athliti: 26, id_athlimatos: 1 },
    { id_athliti: 27, id_athlimatos: 2 },
    { id_athliti: 28, id_athlimatos: 1 },
    { id_athliti: 29, id_athlimatos: 1 },
    { id_athliti: 30, id_athlimatos: 2 }
  ]
});

  // 13. Δημιουργία Εξωτερικών Μελών
  await prisma.eksoteriko_melos.createMany({
    data: [
      { id_ekso_melous: 31, onoma_sillogou: "Σύλλογος 31", arithmos_mitroou: 2031 },
      { id_ekso_melous: 32, onoma_sillogou: "Σύλλογος 32", arithmos_mitroou: 2032 },
      { id_ekso_melous: 33, onoma_sillogou: "Σύλλογος 33", arithmos_mitroou: 2033 },
      { id_ekso_melous: 34, onoma_sillogou: "Σύλλογος 34", arithmos_mitroou: 2034 },
      { id_ekso_melous: 35, onoma_sillogou: "Σύλλογος 35", arithmos_mitroou: 2035 },
      { id_ekso_melous: 36, onoma_sillogou: "Σύλλογος 36", arithmos_mitroou: 2036 },
      { id_ekso_melous: 37, onoma_sillogou: "Σύλλογος 37", arithmos_mitroou: 2037 },
      { id_ekso_melous: 38, onoma_sillogou: "Σύλλογος 38", arithmos_mitroou: 2038 },
      { id_ekso_melous: 39, onoma_sillogou: "Σύλλογος 39", arithmos_mitroou: 2039 },
      { id_ekso_melous: 40, onoma_sillogou: "Σύλλογος 40", arithmos_mitroou: 2040 }
    ]
  });


// 15. Δημιουργία Εκπαιδευτών
await prisma.ekpaideutis.createMany({
  data: [
    { id_ekpaideuti: 41, epipedo: "Προχωρημένο", klados: "Ορειβασία" },
    { id_ekpaideuti: 42, epipedo: "Βασικό", klados: "Ορειβασία" },
    { id_ekpaideuti: 43, epipedo: "Μεσαίο", klados: "Αναρρίχηση" },
    { id_ekpaideuti: 44, epipedo: "Μεσαίο", klados: "Σκι" },
    { id_ekpaideuti: 45, epipedo: "Προχωρημένο", klados: "Αναρρίχηση" }
  ]
});

// First create the eksormisi entries WITHOUT the id_ypefthynou field
await prisma.eksormisi.createMany({
  data: [
    {
      id_eksormisis: 1,
      proorismos: "Ζαγοροχώρια",
      timi: 150,
      hmerominia_anaxorisis: new Date("2023-11-01"),
      hmerominia_afiksis: new Date("2023-11-05"),
      titlos: "Παραδοσιακά Χωριά",
    },
    {
      id_eksormisis: 2,
      proorismos: "Πίνδος",
      timi: 200,
      hmerominia_anaxorisis: new Date("2025-12-01"),
      hmerominia_afiksis: new Date("2025-12-05"),
      titlos: "Ορειβασία στην Πίνδο",
    },
    {
      id_eksormisis: 3,
      proorismos: "Όλυμπος",
      timi: 250,
      hmerominia_anaxorisis: new Date("2025-05-01"),
      hmerominia_afiksis: new Date("2025-05-07"),
      titlos: "Αναρρίχηση στον Όλυμπο",
    }
  ]
});

// Then create the relationships in the junction table
await prisma.ypefthynoi_eksormisis.createMany({
  data: [
    {
      id_eksormisis: 1,
      id_ypefthynou: 1
    },
    {
      id_eksormisis: 2,
      id_ypefthynou: 2
    },
    {
      id_eksormisis: 3,
      id_ypefthynou: 3
    }
  ]
});

  // 16. Δημιουργία Δραστηριοτήτων
await prisma.drastiriotita.createMany({
  data: [
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 2, 
      ores_poreias: 3, 
      titlos: "Διαδρομή με GPS", 
      diafora_ipsous: 110, 
      hmerominia: new Date("2023-11-01"), 
      megisto_ipsometro: 815 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 3, 
      ores_poreias: 4, 
      titlos: "Αναρρίχηση", 
      diafora_ipsous: 120, 
      hmerominia: new Date("2023-11-01"), 
      megisto_ipsometro: 830 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 4, 
      ores_poreias: 5, 
      titlos: "Χαλαρή Πορεία", 
      diafora_ipsous: 130, 
      hmerominia: new Date("2023-11-02"), 
      megisto_ipsometro: 845 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 5, 
      ores_poreias: 6, 
      titlos: "Νυχτερινή Διαδρομή", 
      diafora_ipsous: 140, 
      hmerominia: new Date("2023-11-02"), 
      megisto_ipsometro: 860 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 6, 
      ores_poreias: 7, 
      titlos: "Σπήλαια και Φαράγγια", 
      diafora_ipsous: 150, 
      hmerominia: new Date("2023-11-03"), 
      megisto_ipsometro: 875 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 7, 
      ores_poreias: 2, 
      titlos: "Πορεία Αντοχής", 
      diafora_ipsous: 160, 
      hmerominia: new Date("2023-11-03"), 
      megisto_ipsometro: 890 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 8, 
      ores_poreias: 3, 
      titlos: "Οικολογική Ενημέρωση", 
      diafora_ipsous: 170, 
      hmerominia: new Date("2023-11-04"), 
      megisto_ipsometro: 905 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 1, 
      ores_poreias: 4, 
      titlos: "Ανάβαση", 
      diafora_ipsous: 180, 
      hmerominia: new Date("2023-11-04"), 
      megisto_ipsometro: 920 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 2, 
      ores_poreias: 5, 
      titlos: "Καταρρίχηση", 
      diafora_ipsous: 190, 
      hmerominia: new Date("2023-11-05"), 
      megisto_ipsometro: 935 
    },
    { 
      id_eksormisis: 1, 
      id_vathmou_diskolias: 3, 
      ores_poreias: 6, 
      titlos: "Ορεινή Πεζοπορία", 
      diafora_ipsous: 200, 
      hmerominia: new Date("2023-11-05"), 
      megisto_ipsometro: 950 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 4, 
      ores_poreias: 7, 
      titlos: "Διαδρομή με GPS", 
      diafora_ipsous: 210, 
      hmerominia: new Date("2025-12-01"), 
      megisto_ipsometro: 965 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 5, 
      ores_poreias: 2, 
      titlos: "Αναρρίχηση", 
      diafora_ipsous: 220, 
      hmerominia: new Date("2025-12-01"), 
      megisto_ipsometro: 980 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 6, 
      ores_poreias: 3, 
      titlos: "Χαλαρή Πορεία", 
      diafora_ipsous: 230, 
      hmerominia: new Date("2025-12-02"), 
      megisto_ipsometro: 995 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 7, 
      ores_poreias: 4, 
      titlos: "Νυχτερινή Διαδρομή", 
      diafora_ipsous: 240, 
      hmerominia: new Date("2025-12-02"), 
      megisto_ipsometro: 1010 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 8, 
      ores_poreias: 5, 
      titlos: "Σπήλαια και Φαράγγια", 
      diafora_ipsous: 250, 
      hmerominia: new Date("2025-12-03"), 
      megisto_ipsometro: 1025 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 1, 
      ores_poreias: 6, 
      titlos: "Πορεία Αντοχής", 
      diafora_ipsous: 260, 
      hmerominia: new Date("2025-12-03"), 
      megisto_ipsometro: 1040 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 2, 
      ores_poreias: 7, 
      titlos: "Οικολογική Ενημέρωση", 
      diafora_ipsous: 270, 
      hmerominia: new Date("2025-12-04"), 
      megisto_ipsometro: 1055 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 3, 
      ores_poreias: 2, 
      titlos: "Ανάβαση", 
      diafora_ipsous: 280, 
      hmerominia: new Date("2025-12-04"), 
      megisto_ipsometro: 1070 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 4, 
      ores_poreias: 3, 
      titlos: "Καταρρίχηση", 
      diafora_ipsous: 290, 
      hmerominia: new Date("2025-12-05"), 
      megisto_ipsometro: 1085 
    },
    { 
      id_eksormisis: 2, 
      id_vathmou_diskolias: 5, 
      ores_poreias: 4, 
      titlos: "Ορεινή Πεζοπορία", 
      diafora_ipsous: 300, 
      hmerominia: new Date("2025-12-05"), 
      megisto_ipsometro: 1100 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 6, 
      ores_poreias: 5, 
      titlos: "Διαδρομή με GPS", 
      diafora_ipsous: 310, 
      hmerominia: new Date("2025-05-01"), 
      megisto_ipsometro: 1115 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 7, 
      ores_poreias: 6, 
      titlos: "Αναρρίχηση", 
      diafora_ipsous: 320, 
      hmerominia: new Date("2025-05-01"), 
      megisto_ipsometro: 1130 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 8, 
      ores_poreias: 7, 
      titlos: "Χαλαρή Πορεία", 
      diafora_ipsous: 330, 
      hmerominia: new Date("2025-05-02"), 
      megisto_ipsometro: 1145 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 1, 
      ores_poreias: 2, 
      titlos: "Νυχτερινή Διαδρομή", 
      diafora_ipsous: 340, 
      hmerominia: new Date("2025-05-02"), 
      megisto_ipsometro: 1160 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 2, 
      ores_poreias: 3, 
      titlos: "Σπήλαια και Φαράγγια", 
      diafora_ipsous: 350, 
      hmerominia: new Date("2025-05-03"), 
      megisto_ipsometro: 1175 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 3, 
      ores_poreias: 4, 
      titlos: "Πορεία Αντοχής", 
      diafora_ipsous: 360, 
      hmerominia: new Date("2025-05-03"), 
      megisto_ipsometro: 1190 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 4, 
      ores_poreias: 5, 
      titlos: "Οικολογική Ενημέρωση", 
      diafora_ipsous: 370, 
      hmerominia: new Date("2025-05-04"), 
      megisto_ipsometro: 1205 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 5, 
      ores_poreias: 6, 
      titlos: "Ανάβαση", 
      diafora_ipsous: 380, 
      hmerominia: new Date("2025-05-04"), 
      megisto_ipsometro: 1220 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 6, 
      ores_poreias: 7, 
      titlos: "Καταρρίχηση", 
      diafora_ipsous: 390, 
      hmerominia: new Date("2025-05-05"), 
      megisto_ipsometro: 1235 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 7, 
      ores_poreias: 2, 
      titlos: "Ορεινή Πεζοπορία", 
      diafora_ipsous: 400, 
      hmerominia: new Date("2025-05-05"), 
      megisto_ipsometro: 1250 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 8, 
      ores_poreias: 3, 
      titlos: "Διαδρομή με GPS", 
      diafora_ipsous: 410, 
      hmerominia: new Date("2025-05-06"), 
      megisto_ipsometro: 1265 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 1, 
      ores_poreias: 4, 
      titlos: "Αναρρίχηση", 
      diafora_ipsous: 420, 
      hmerominia: new Date("2025-05-06"), 
      megisto_ipsometro: 1280 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 2, 
      ores_poreias: 5, 
      titlos: "Χαλαρή Πορεία", 
      diafora_ipsous: 430, 
      hmerominia: new Date("2025-05-07"), 
      megisto_ipsometro: 1295 
    },
    { 
      id_eksormisis: 3, 
      id_vathmou_diskolias: 3, 
      ores_poreias: 6, 
      titlos: "Νυχτερινή Διαδρομή", 
      diafora_ipsous: 440, 
      hmerominia: new Date("2025-05-07"), 
      megisto_ipsometro: 1310 
    }
  ]
});

  // 1. Δημιουργία Συνδρομών
  await prisma.sindromi.createMany({
    data: [
      { id_sindromis: 1, hmerominia_enarksis: new Date("2023-06-04"), id_eidous_sindromis: 3 },
      { id_sindromis: 2, hmerominia_enarksis: new Date("2023-03-10"), id_eidous_sindromis: 1 },
      { id_sindromis: 3, hmerominia_enarksis: new Date("2023-10-29"), id_eidous_sindromis: 2 },
      { id_sindromis: 4, hmerominia_enarksis: new Date("2023-08-26"), id_eidous_sindromis: 3 },
      { id_sindromis: 5, hmerominia_enarksis: new Date("2023-05-11"), id_eidous_sindromis: 2 },
      { id_sindromis: 6, hmerominia_enarksis: new Date("2023-12-07"), id_eidous_sindromis: 2 },
      { id_sindromis: 7, hmerominia_enarksis: new Date("2023-10-10"), id_eidous_sindromis: 3 },
      { id_sindromis: 8, hmerominia_enarksis: new Date("2023-03-21"), id_eidous_sindromis: 1 },
      { id_sindromis: 9, hmerominia_enarksis: new Date("2023-04-03"), id_eidous_sindromis: 2 },
      { id_sindromis: 10, hmerominia_enarksis: new Date("2023-02-15"), id_eidous_sindromis: 1 },
      { id_sindromis: 11, hmerominia_enarksis: new Date("2023-12-15"), id_eidous_sindromis: 2 },
      { id_sindromis: 12, hmerominia_enarksis: new Date("2023-05-13"), id_eidous_sindromis: 2 },
      { id_sindromis: 13, hmerominia_enarksis: new Date("2023-04-07"), id_eidous_sindromis: 3 },
      { id_sindromis: 14, hmerominia_enarksis: new Date("2023-08-24"), id_eidous_sindromis: 1 },
      { id_sindromis: 15, hmerominia_enarksis: new Date("2023-04-15"), id_eidous_sindromis: 3 },
      { id_sindromis: 16, hmerominia_enarksis: new Date("2023-07-06"), id_eidous_sindromis: 3 },
      { id_sindromis: 17, hmerominia_enarksis: new Date("2023-07-29"), id_eidous_sindromis: 1 },
      { id_sindromis: 18, hmerominia_enarksis: new Date("2023-02-18"), id_eidous_sindromis: 1 },
      { id_sindromis: 19, hmerominia_enarksis: new Date("2023-10-11"), id_eidous_sindromis: 2 },
      { id_sindromis: 20, hmerominia_enarksis: new Date("2023-04-17"), id_eidous_sindromis: 1 },
      { id_sindromis: 21, hmerominia_enarksis: new Date("2023-02-22"), id_eidous_sindromis: 1 },
      { id_sindromis: 22, hmerominia_enarksis: new Date("2023-05-26"), id_eidous_sindromis: 3 },
      { id_sindromis: 23, hmerominia_enarksis: new Date("2023-09-13"), id_eidous_sindromis: 3 },
      { id_sindromis: 24, hmerominia_enarksis: new Date("2023-12-09"), id_eidous_sindromis: 3 },
      { id_sindromis: 25, hmerominia_enarksis: new Date("2023-07-23"), id_eidous_sindromis: 3 }
    ]
  });

  // 2. Κρατήσεις Καταφυγίου
  await prisma.kratisi_katafigiou.createMany({
    data: [
      { id_epafis: 1, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-12T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-15T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 10, arithmos_mi_melwn: 6, atoma: 16, imeres: 3, sinoliki_timh: 1320, eksoterikos_xoros: "Αίθουσα 2", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-02T15:18:05.218Z") },
      { id_epafis: 2, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-24T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-28T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 0, arithmos_mi_melwn: 10, atoma: 10, imeres: 4, sinoliki_timh: 1600, eksoterikos_xoros: "Αίθουσα 1", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-14T15:18:05.218Z") },
      { id_epafis: 3, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-18T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-22T15:18:05.218Z"), ypoloipo: 913, arithmos_melwn: 10, arithmos_mi_melwn: 3, atoma: 13, imeres: 4, sinoliki_timh: 1280, eksoterikos_xoros: "Αίθουσα 1", hmerominia_akirosis: new Date("2025-03-16T15:18:05.218Z"), poso_epistrofis: 1280, hmerominia_kratisis: new Date("2025-03-08T15:18:05.218Z") },
      { id_epafis: 4, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-15T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-20T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 6, arithmos_mi_melwn: 10, atoma: 16, imeres: 5, sinoliki_timh: 2600, eksoterikos_xoros: "Αίθουσα 1", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-05T15:18:05.218Z") },
      { id_epafis: 5, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-18T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-22T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 8, arithmos_mi_melwn: 9, atoma: 17, imeres: 4, sinoliki_timh: 2080, eksoterikos_xoros: "Αίθουσα 2", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-08T15:18:05.218Z") },
      { id_epafis: 6, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-03T15:18:05.218Z"), ypoloipo: 355, arithmos_melwn: 1, arithmos_mi_melwn: 2, atoma: 3, imeres: 5, sinoliki_timh: 500, eksoterikos_xoros: "Αίθουσα 3", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 7, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-02T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 10, arithmos_mi_melwn: 6, atoma: 16, imeres: 4, sinoliki_timh: 1760, eksoterikos_xoros: "Αίθουσα 1", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 8, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-02T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 6, arithmos_mi_melwn: 8, atoma: 14, imeres: 4, sinoliki_timh: 1760, eksoterikos_xoros: "Αίθουσα 2", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 9, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-01T15:18:05.218Z"), ypoloipo: 889, arithmos_melwn: 4, arithmos_mi_melwn: 10, atoma: 14, imeres: 3, sinoliki_timh: 1440, eksoterikos_xoros: "Αίθουσα 2", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 10, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-05-30T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 10, arithmos_mi_melwn: 3, atoma: 13, imeres: 1, sinoliki_timh: 320, eksoterikos_xoros: "Αίθουσα 1", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") }
    ]
  });

  // 3. Δανεισμοί Εξοπλισμού
await prisma.daneizetai.createMany({
  data: [
    { id_epafis: 7, id_eksoplismou: 1, hmerominia_daneismou: new Date("2024-01-22"), hmerominia_epistrofis: new Date("2024-01-30"), katastasi_daneismou: "Επιστράφηκε" },
    { id_epafis: 8, id_eksoplismou: 1, hmerominia_daneismou: new Date("2024-02-01"), hmerominia_epistrofis: new Date("2024-02-05"), katastasi_daneismou: "Επιστράφηκε" },
    { id_epafis: 9, id_eksoplismou: 2, hmerominia_daneismou: new Date("2024-02-12"), hmerominia_epistrofis: new Date("2024-02-20"), katastasi_daneismou: "Επιστράφηκε" },
    { id_epafis: 10, id_eksoplismou: 3, hmerominia_daneismou: new Date("2024-04-01"), hmerominia_epistrofis: new Date("2024-04-07"), katastasi_daneismou: "Επιστράφηκε" },
    { id_epafis: 11, id_eksoplismou: 3, hmerominia_daneismou: new Date("2024-04-10"), hmerominia_epistrofis: new Date("2024-04-15"), katastasi_daneismou: "Επιστράφηκε" },
    { id_epafis: 12, id_eksoplismou: 4, hmerominia_daneismou: new Date("2024-02-01"), hmerominia_epistrofis: new Date("2024-02-05"), katastasi_daneismou: "Επιστράφηκε" },
    { id_epafis: 13, id_eksoplismou: 5, hmerominia_daneismou: new Date("2024-03-20"), hmerominia_epistrofis: new Date("2024-03-30"), katastasi_daneismou: "Επιστράφηκε" },
    { id_epafis: 14, id_eksoplismou: 5, hmerominia_daneismou: new Date("2024-04-01"), hmerominia_epistrofis: null, katastasi_daneismou: "Σε εκκρεμότητα" },
    { id_epafis: 15, id_eksoplismou: 6, hmerominia_daneismou: new Date("2024-03-20"), hmerominia_epistrofis: new Date("2024-03-25"), katastasi_daneismou: "Επιστράφηκε" }
  ]
});


  // 4. Εξοφλήσεις
  await prisma.eksoflei.createMany({
    data: [
      { id_epafis: 1, id_kratisis: 1, poso: 1320, hmerominia_eksoflisis: new Date("2025-03-09T15:18:05.218Z") },
      { id_epafis: 2, id_kratisis: 2, poso: 684, hmerominia_eksoflisis: new Date("2025-03-22T15:18:05.218Z") },
      { id_epafis: 2, id_kratisis: 2, poso: 916, hmerominia_eksoflisis: new Date("2025-03-21T15:18:05.218Z") },
      { id_epafis: 3, id_kratisis: 3, poso: 367, hmerominia_eksoflisis: new Date("2025-03-16T15:18:05.218Z") },
      { id_epafis: 4, id_kratisis: 4, poso: 2600, hmerominia_eksoflisis: new Date("2025-03-11T15:18:05.218Z") },
      { id_epafis: 5, id_kratisis: 5, poso: 989, hmerominia_eksoflisis: new Date("2025-03-16T15:18:05.218Z") },
      { id_epafis: 5, id_kratisis: 5, poso: 1091, hmerominia_eksoflisis: new Date("2025-03-14T15:18:05.218Z") },
      { id_epafis: 6, id_kratisis: 6, poso: 145, hmerominia_eksoflisis: new Date("2025-05-27T15:18:05.218Z") },
      { id_epafis: 7, id_kratisis: 7, poso: 1760, hmerominia_eksoflisis: new Date("2025-05-24T15:18:05.218Z") },
      { id_epafis: 8, id_kratisis: 8, poso: 753, hmerominia_eksoflisis: new Date("2025-05-28T15:18:05.218Z") },
      { id_epafis: 8, id_kratisis: 8, poso: 1007, hmerominia_eksoflisis: new Date("2025-05-27T15:18:05.218Z") },
      { id_epafis: 9, id_kratisis: 9, poso: 551, hmerominia_eksoflisis: new Date("2025-05-27T15:18:05.218Z") },
      { id_epafis: 10, id_kratisis: 10, poso: 320, hmerominia_eksoflisis: new Date("2025-05-25T15:18:05.218Z") }
    ]
  });

// 16. Σχέσεις Εκπαίδευσης
await prisma.ekpaideuei.createMany({
  data: [
    { id_ekpaideuti: 41, id_sxolis: 1 },
    { id_ekpaideuti: 42, id_sxolis: 2 },
    { id_ekpaideuti: 43, id_sxolis: 3 },
    { id_ekpaideuti: 44, id_sxolis: 1 },
    { id_ekpaideuti: 45, id_sxolis: 2 }
  ]
});
  // 6. Συμμετοχές
  await prisma.simmetoxi.createMany({
  data: [
    { id_melous: 1, id_eksormisis: 1, timi: 150, katastasi: "Ενεργή", ypoloipo: 50, hmerominia_dilosis: new Date("2023-10-15") },
    { id_melous: 2, id_eksormisis: 1, timi: 150, katastasi: "Ενεργή", ypoloipo: 150, hmerominia_dilosis: new Date("2023-10-16") },
    { id_melous: 3, id_eksormisis: 2, timi: 200, katastasi: "Ενεργή", ypoloipo: 200, hmerominia_dilosis: new Date("2025-11-01") },
    { id_melous: 4, id_eksormisis: 2, timi: 200, katastasi: "Ενεργή", ypoloipo: 100, hmerominia_dilosis: new Date("2025-11-02") },
    { id_melous: 5, id_eksormisis: 3, timi: 250, katastasi: "Ενεργή", ypoloipo: 250, hmerominia_dilosis: new Date("2025-04-01") },
    { id_melous: 6, id_eksormisis: 1, timi: 150, katastasi: "Ενεργή", ypoloipo: 50, hmerominia_dilosis: new Date("2023-10-20") },
    { id_melous: 7, id_eksormisis: 1, timi: 150, katastasi: "Ενεργή", ypoloipo: 0, hmerominia_dilosis: new Date("2023-10-21") },
    { id_melous: 8, id_eksormisis: 2, timi: 200, katastasi: "Ενεργή", ypoloipo: 80, hmerominia_dilosis: new Date("2025-11-03") },
    { id_melous: 9, id_eksormisis: 3, timi: 250, katastasi: "Ενεργή", ypoloipo: 0, hmerominia_dilosis: new Date("2025-04-02") },
    { id_melous: 10, id_eksormisis: 1, timi: 150, katastasi: "Ενεργή", ypoloipo: 150, hmerominia_dilosis: new Date("2023-10-24") }
  ]
});

await prisma.simmetoxi_drastiriotita.createMany({
  data: [
    // Συμμετοχή 1 (μέλος 1 στην εξόρμηση 1) - συμμετέχει σε 2 δραστηριότητες
    { id_simmetoxis: 1, id_drastiriotitas: 1 },
    { id_simmetoxis: 1, id_drastiriotitas: 2 },
    
    // Συμμετοχή 2 (μέλος 2 στην εξόρμηση 1) - συμμετέχει σε 1 δραστηριότητα
    { id_simmetoxis: 2, id_drastiriotitas: 3 },
    
    // Συμμετοχή 3 (μέλος 3 στην εξόρμηση 2) - συμμετέχει σε 3 δραστηριότητες
    { id_simmetoxis: 3, id_drastiriotitas: 11 },
    { id_simmetoxis: 3, id_drastiriotitas: 12 },
    { id_simmetoxis: 3, id_drastiriotitas: 13 },
    
    // Συμμετοχή 4 (μέλος 4 στην εξόρμηση 2) - συμμετέχει σε 2 δραστηριότητες
    { id_simmetoxis: 4, id_drastiriotitas: 14 },
    { id_simmetoxis: 4, id_drastiriotitas: 15 },
    
    // Συμμετοχή 5 (μέλος 5 στην εξόρμηση 3) - συμμετέχει σε 4 δραστηριότητες
    { id_simmetoxis: 5, id_drastiriotitas: 21 },
    { id_simmetoxis: 5, id_drastiriotitas: 22 },
    { id_simmetoxis: 5, id_drastiriotitas: 23 },
    { id_simmetoxis: 5, id_drastiriotitas: 24 },
    
    // Συμμετοχή 6 (μέλος 6 στην εξόρμηση 1) - συμμετέχει σε 3 δραστηριότητες
    { id_simmetoxis: 6, id_drastiriotitas: 4 },
    { id_simmetoxis: 6, id_drastiriotitas: 5 },
    { id_simmetoxis: 6, id_drastiriotitas: 6 },
    
    // Συμμετοχή 7 (μέλος 7 στην εξόρμηση 1) - συμμετέχει σε όλες τις δραστηριότητες
    { id_simmetoxis: 7, id_drastiriotitas: 1 },
    { id_simmetoxis: 7, id_drastiriotitas: 2 },
    { id_simmetoxis: 7, id_drastiriotitas: 3 },
    { id_simmetoxis: 7, id_drastiriotitas: 4 },
    { id_simmetoxis: 7, id_drastiriotitas: 5 },
    { id_simmetoxis: 7, id_drastiriotitas: 6 },
    { id_simmetoxis: 7, id_drastiriotitas: 7 },
    { id_simmetoxis: 7, id_drastiriotitas: 8 },
    { id_simmetoxis: 7, id_drastiriotitas: 9 },
    { id_simmetoxis: 7, id_drastiriotitas: 10 },
    
    // Συμμετοχή 8 (μέλος 8 στην εξόρμηση 2) - συμμετέχει σε 1 δραστηριότητα
    { id_simmetoxis: 8, id_drastiriotitas: 16 },
    
    // Συμμετοχή 9 (μέλος 9 στην εξόρμηση 3) - συμμετέχει σε 2 δραστηριότητες
    { id_simmetoxis: 9, id_drastiriotitas: 25 },
    { id_simmetoxis: 9, id_drastiriotitas: 26 },
    
    // Συμμετοχή 10 (μέλος 10 στην εξόρμηση 1) - συμμετέχει σε 1 δραστηριότητα
    { id_simmetoxis: 10, id_drastiriotitas: 7 }
  ]
});

  // 7. Πληρωμές
await prisma.plironei.createMany({
  data: [
    { id_melous: 1, id_simmetoxis: 1, hmerominia_pliromis: new Date("2023-10-30"), poso_pliromis: 100 },
    { id_melous: 2, id_simmetoxis: 2, hmerominia_pliromis: new Date("2023-10-31"), poso_pliromis: 0 },
    { id_melous: 3, id_simmetoxis: 3, hmerominia_pliromis: new Date("2025-11-15"), poso_pliromis: 0 },
    { id_melous: 4, id_simmetoxis: 4, hmerominia_pliromis: new Date("2025-11-16"), poso_pliromis: 100 },
    { id_melous: 5, id_simmetoxis: 5, hmerominia_pliromis: new Date("2025-04-15"), poso_pliromis: 0 },
    { id_melous: 6, id_simmetoxis: 6, hmerominia_pliromis: new Date("2023-11-01"), poso_pliromis: 100 },
    { id_melous: 7, id_simmetoxis: 7, hmerominia_pliromis: new Date("2023-11-02"), poso_pliromis: 150 },
    { id_melous: 8, id_simmetoxis: 8, hmerominia_pliromis: new Date("2025-11-17"), poso_pliromis: 120 },
    { id_melous: 9, id_simmetoxis: 9, hmerominia_pliromis: new Date("2025-04-16"), poso_pliromis: 250 },
    { id_melous: 10, id_simmetoxis: 10, hmerominia_pliromis: new Date("2023-11-03"), poso_pliromis: 0 }
  ]
});

  // 8. Σχέσεις Συνδρομών
  await prisma.exei.createMany({
    data: [
      { id_sindromiti: 1, id_sindromis: 1, hmerominia_pliromis: new Date("2023-06-04") },
      { id_sindromiti: 2, id_sindromis: 2, hmerominia_pliromis: new Date("2023-03-10") },
      { id_sindromiti: 3, id_sindromis: 3, hmerominia_pliromis: new Date("2023-10-29") },
      { id_sindromiti: 4, id_sindromis: 4, hmerominia_pliromis: new Date("2023-08-26") },
      { id_sindromiti: 5, id_sindromis: 5, hmerominia_pliromis: new Date("2023-05-11") },
      { id_sindromiti: 6, id_sindromis: 6, hmerominia_pliromis: new Date("2023-12-07") },
      { id_sindromiti: 7, id_sindromis: 7, hmerominia_pliromis: new Date("2023-10-10") },
      { id_sindromiti: 8, id_sindromis: 8, hmerominia_pliromis: new Date("2023-03-21") },
      { id_sindromiti: 9, id_sindromis: 9, hmerominia_pliromis: new Date("2023-04-03") },
      { id_sindromiti: 10, id_sindromis: 10, hmerominia_pliromis: new Date("2023-02-15") },
      { id_sindromiti: 11, id_sindromis: 11, hmerominia_pliromis: new Date("2023-12-15") },
      { id_sindromiti: 12, id_sindromis: 12, hmerominia_pliromis: new Date("2023-05-13") },
      { id_sindromiti: 13, id_sindromis: 13, hmerominia_pliromis: new Date("2023-04-07") },
      { id_sindromiti: 14, id_sindromis: 14, hmerominia_pliromis: new Date("2023-08-24") },
      { id_sindromiti: 15, id_sindromis: 15, hmerominia_pliromis: new Date("2023-04-15") },
      { id_sindromiti: 16, id_sindromis: 16, hmerominia_pliromis: new Date("2023-07-06") },
      { id_sindromiti: 17, id_sindromis: 17, hmerominia_pliromis: new Date("2023-07-29") },
      { id_sindromiti: 18, id_sindromis: 18, hmerominia_pliromis: new Date("2023-02-18") },
      { id_sindromiti: 19, id_sindromis: 19, hmerominia_pliromis: new Date("2023-10-11") },
      { id_sindromiti: 20, id_sindromis: 20, hmerominia_pliromis: new Date("2023-04-17") },
      { id_sindromiti: 21, id_sindromis: 21, hmerominia_pliromis: new Date("2023-02-22") },
      { id_sindromiti: 22, id_sindromis: 22, hmerominia_pliromis: new Date("2023-05-26") },
      { id_sindromiti: 23, id_sindromis: 23, hmerominia_pliromis: new Date("2023-09-13") },
      { id_sindromiti: 24, id_sindromis: 24, hmerominia_pliromis: new Date("2023-12-09") },
      { id_sindromiti: 25, id_sindromis: 25, hmerominia_pliromis: new Date("2023-07-23") }
    ]
  });

  await prisma.agones.createMany({
    data: [
      { id_athlimatos: 1, onoma: "Αγώνας 1 (Ορειβασία)", perigrafi: "Περιγραφή αγώνα 1", hmerominia: new Date("2023-01-01") },
      { id_athlimatos: 2, onoma: "Αγώνας 2 (Αναρρίχηση)", perigrafi: "Περιγραφή αγώνα 2", hmerominia: new Date("2023-01-31") },
      { id_athlimatos: 2, onoma: "Αγώνας 3 (Αναρρίχηση)", perigrafi: "Περιγραφή αγώνα 3", hmerominia: new Date("2023-03-02") },
      { id_athlimatos: 3, onoma: "Αγώνας 4 (Σκι)", perigrafi: "Περιγραφή αγώνα 4", hmerominia: new Date("2023-04-01") },
      { id_athlimatos: 2, onoma: "Αγώνας 5 (Αναρρίχηση)", perigrafi: "Περιγραφή αγώνα 5", hmerominia: new Date("2023-05-01") },
      { id_athlimatos: 1, onoma: "Αγώνας 6 (Ορειβασία)", perigrafi: "Περιγραφή αγώνα 6", hmerominia: new Date("2023-05-31") },
      { id_athlimatos: 1, onoma: "Αγώνας 7 (Ορειβασία)", perigrafi: "Περιγραφή αγώνα 7", hmerominia: new Date("2023-06-30") },
      { id_athlimatos: 2, onoma: "Αγώνας 8 (Αναρρίχηση)", perigrafi: "Περιγραφή αγώνα 8", hmerominia: new Date("2023-07-30") },
      { id_athlimatos: 1, onoma: "Αγώνας 9 (Ορειβασία)", perigrafi: "Περιγραφή αγώνα 9", hmerominia: new Date("2023-08-29") },
      { id_athlimatos: 2, onoma: "Αγώνας 10 (Αναρρίχηση)", perigrafi: "Περιγραφή αγώνα 10", hmerominia: new Date("2023-09-28") },
    ]
  });

  // Create Agonizetai (participations)
  await prisma.agonizetai.createMany({
    data: [
      { id_athliti: 27, id_agona: 1 },
      { id_athliti: 30, id_agona: 1 },
      { id_athliti: 26, id_agona: 1 },
      { id_athliti: 26, id_agona: 2 },
      { id_athliti: 29, id_agona: 2 },
      { id_athliti: 30, id_agona: 2 },
      { id_athliti: 27, id_agona: 3 },
      { id_athliti: 28, id_agona: 3 },
      { id_athliti: 29, id_agona: 3 },
      { id_athliti: 27, id_agona: 4 },
      { id_athliti: 26, id_agona: 4 },
      { id_athliti: 27, id_agona: 5 },
      { id_athliti: 28, id_agona: 5 },
      { id_athliti: 29, id_agona: 6 },
      { id_athliti: 30, id_agona: 6 },
      { id_athliti: 30, id_agona: 7 },
      { id_athliti: 26, id_agona: 7 },
      { id_athliti: 27, id_agona: 7 },
      { id_athliti: 28, id_agona: 8 },
      { id_athliti: 29, id_agona: 8 },
      { id_athliti: 30, id_agona: 8 },
      { id_athliti: 27, id_agona: 9 },
      { id_athliti: 26, id_agona: 9 },
      { id_athliti: 27, id_agona: 10 },
      { id_athliti: 28, id_agona: 10 },
      { id_athliti: 29, id_agona: 10 },
    ]
  });

  // Create Parakolouthiseis (follow-ups)
  await prisma.parakolouthisi.createMany({
    data: [
      { id_melous: 18, id_sxolis: 1, poso_epistrofis: 300, timi: 300, ypoloipo: 0, katastasi: "Ακυρωμένη", hmerominia_dilosis: new Date("2024-03-04"), hmerominia_akrirosis: new Date("2024-03-14") },
      { id_melous: 9, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-17"), hmerominia_akrirosis: null },
      { id_melous: 6, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-01"), hmerominia_akrirosis: null },
      { id_melous: 39, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-09"), hmerominia_akrirosis: null },
      { id_melous: 15, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-17"), hmerominia_akrirosis: null },
      { id_melous: 5, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-07"), hmerominia_akrirosis: null },
      { id_melous: 30, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 111, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-12"), hmerominia_akrirosis: null },
      { id_melous: 7, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 56, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-10"), hmerominia_akrirosis: null },
      { id_melous: 13, id_sxolis: 1, poso_epistrofis: 300, timi: 300, ypoloipo: 0, katastasi: "Ακυρωμένη", hmerominia_dilosis: new Date("2024-03-20"), hmerominia_akrirosis: new Date("2024-03-30") },
      { id_melous: 20, id_sxolis: 1, poso_epistrofis: null, timi: 300, ypoloipo: 121, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-20"), hmerominia_akrirosis: null },
      { id_melous: 7, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 229, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-09"), hmerominia_akrirosis: null },
      { id_melous: 17, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-01"), hmerominia_akrirosis: null },
      { id_melous: 23, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-18"), hmerominia_akrirosis: null },
      { id_melous: 13, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-04"), hmerominia_akrirosis: null },
      { id_melous: 24, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-10"), hmerominia_akrirosis: null },
      { id_melous: 5, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-17"), hmerominia_akrirosis: null },
      { id_melous: 3, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-10"), hmerominia_akrirosis: null },
      { id_melous: 1, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-16"), hmerominia_akrirosis: null },
      { id_melous: 29, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-05"), hmerominia_akrirosis: null },
      { id_melous: 14, id_sxolis: 2, poso_epistrofis: null, timi: 400, ypoloipo: 178, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-17"), hmerominia_akrirosis: null },
      { id_melous: 6, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-10"), hmerominia_akrirosis: null },
      { id_melous: 22, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-09"), hmerominia_akrirosis: null },
      { id_melous: 17, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-06"), hmerominia_akrirosis: null },
      { id_melous: 18, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 237, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-01"), hmerominia_akrirosis: null },
      { id_melous: 29, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 293, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-19"), hmerominia_akrirosis: null },
      { id_melous: 39, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-16"), hmerominia_akrirosis: null },
      { id_melous: 27, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 314, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-01"), hmerominia_akrirosis: null },
      { id_melous: 23, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 145, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-03"), hmerominia_akrirosis: null },
      { id_melous: 20, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-01"), hmerominia_akrirosis: null },
      { id_melous: 19, id_sxolis: 3, poso_epistrofis: null, timi: 500, ypoloipo: 0, katastasi: "Ενεργή", hmerominia_dilosis: new Date("2024-03-09"), hmerominia_akrirosis: null }
    ]
  });

  // Create Katavaleis (payments)
  await prisma.katavalei.createMany({
    data: [
      { id_melous: 18, id_parakolouthisis: 1, poso: 300, hmerominia_katavolhs: new Date("2024-03-08") },
      { id_melous: 39, id_parakolouthisis: 2, poso: 300, hmerominia_katavolhs: new Date("2024-03-19") },
      { id_melous: 6, id_parakolouthisis: 3, poso: 300, hmerominia_katavolhs: new Date("2024-03-09") },
      { id_melous: 36, id_parakolouthisis: 4, poso: 300, hmerominia_katavolhs: new Date("2024-03-18") },
      { id_melous: 15, id_parakolouthisis: 5, poso: 183, hmerominia_katavolhs: new Date("2024-03-27") },
      { id_melous: 15, id_parakolouthisis: 5, poso: 117, hmerominia_katavolhs: new Date("2024-03-21") },
      { id_melous: 32, id_parakolouthisis: 6, poso: 300, hmerominia_katavolhs: new Date("2024-03-11") },
      { id_melous: 30, id_parakolouthisis: 7, poso: 189, hmerominia_katavolhs: new Date("2024-03-20") },
      { id_melous: 7, id_parakolouthisis: 8, poso: 244, hmerominia_katavolhs: new Date("2024-03-16") },
      { id_melous: 31, id_parakolouthisis: 9, poso: 300, hmerominia_katavolhs: new Date("2024-03-30") },
      { id_melous: 20, id_parakolouthisis: 10, poso: 179, hmerominia_katavolhs: new Date("2024-03-21") },
      { id_melous: 7, id_parakolouthisis: 11, poso: 171, hmerominia_katavolhs: new Date("2024-03-19") },
      { id_melous: 17, id_parakolouthisis: 12, poso: 187, hmerominia_katavolhs: new Date("2024-03-09") },
      { id_melous: 17, id_parakolouthisis: 12, poso: 213, hmerominia_katavolhs: new Date("2024-03-07") },
      { id_melous: 23, id_parakolouthisis: 13, poso: 400, hmerominia_katavolhs: new Date("2024-03-21") },
      { id_melous: 35, id_parakolouthisis: 14, poso: 400, hmerominia_katavolhs: new Date("2024-03-12") },
      { id_melous: 24, id_parakolouthisis: 15, poso: 100, hmerominia_katavolhs: new Date("2024-03-18") },
      { id_melous: 24, id_parakolouthisis: 15, poso: 300, hmerominia_katavolhs: new Date("2024-03-18") },
      { id_melous: 39, id_parakolouthisis: 16, poso: 400, hmerominia_katavolhs: new Date("2024-03-24") },
      { id_melous: 3, id_parakolouthisis: 17, poso: 274, hmerominia_katavolhs: new Date("2024-03-16") },
      { id_melous: 3, id_parakolouthisis: 17, poso: 126, hmerominia_katavolhs: new Date("2024-03-13") },
      { id_melous: 31, id_parakolouthisis: 18, poso: 236, hmerominia_katavolhs: new Date("2024-03-17") },
      { id_melous: 31, id_parakolouthisis: 18, poso: 164, hmerominia_katavolhs: new Date("2024-03-17") },
      { id_melous: 29, id_parakolouthisis: 19, poso: 400, hmerominia_katavolhs: new Date("2024-03-06") },
      { id_melous: 14, id_parakolouthisis: 20, poso: 222, hmerominia_katavolhs: new Date("2024-03-23") },
      { id_melous: 6, id_parakolouthisis: 21, poso: 500, hmerominia_katavolhs: new Date("2024-03-13") },
      { id_melous: 22, id_parakolouthisis: 22, poso: 500, hmerominia_katavolhs: new Date("2024-03-16") },
      { id_melous: 17, id_parakolouthisis: 23, poso: 500, hmerominia_katavolhs: new Date("2024-03-07") },
      { id_melous: 18, id_parakolouthisis: 24, poso: 263, hmerominia_katavolhs: new Date("2024-03-02") },
      { id_melous: 29, id_parakolouthisis: 25, poso: 207, hmerominia_katavolhs: new Date("2024-03-28") },
      { id_melous: 38, id_parakolouthisis: 26, poso: 500, hmerominia_katavolhs: new Date("2024-03-20") },
      { id_melous: 27, id_parakolouthisis: 27, poso: 186, hmerominia_katavolhs: new Date("2024-03-09") },
      { id_melous: 23, id_parakolouthisis: 28, poso: 355, hmerominia_katavolhs: new Date("2024-03-12") },
      { id_melous: 20, id_parakolouthisis: 29, poso: 500, hmerominia_katavolhs: new Date("2024-03-11") },
      { id_melous: 19, id_parakolouthisis: 30, poso: 319, hmerominia_katavolhs: new Date("2024-03-11") },
      { id_melous: 19, id_parakolouthisis: 30, poso: 181, hmerominia_katavolhs: new Date("2024-03-14") }
    ]
  });
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });