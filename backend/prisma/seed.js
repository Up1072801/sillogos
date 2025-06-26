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

// Updated eksoplismos creation with quantity field
await prisma.eksoplismos.createMany({
  data: [
    {
      id_eksoplismou: 1,
      onoma: "Αναρριχητικό σχοινί",
      xroma: "Μπλε",
      hmerominia_kataskeuis: new Date("2022-01-15"),
      megethos: "50m",
      marka: "Petzl",
      quantity: 5 // Added quantity: Organization has 5 climbing ropes
    },
    {
      id_eksoplismou: 2,
      onoma: "Σακίδιο",
      xroma: "Κόκκινο",
      hmerominia_kataskeuis: new Date("2023-03-20"),
      megethos: "30L",
      marka: "Deuter",
      quantity: 10 // Added quantity: Organization has 10 backpacks
    },
    {
      id_eksoplismou: 3,
      onoma: "Παγοθραυστικό",
      xroma: "Ασημί",
      hmerominia_kataskeuis: new Date("2024-07-10"),
      megethos: "70cm",
      marka: "Black Diamond",
      quantity: 3 // Added quantity: Organization has 3 ice axes
    },
    {
      id_eksoplismou: 4,
      onoma: "Μάσκα Καταδύσεων",
      xroma: "Μαύρο",
      hmerominia_kataskeuis: new Date("2023-11-01"),
      megethos: "Standard",
      marka: "Cressi",
      quantity: 8 // Added quantity: Organization has 8 diving masks
    },
    {
      id_eksoplismou: 5,
      onoma: "Ποδήλατο",
      xroma: "Πράσινο",
      hmerominia_kataskeuis: new Date("2022-09-15"),
      megethos: "Medium",
      marka: "Giant",
      quantity: 4 // Added quantity: Organization has 4 bicycles
    },
    {
      id_eksoplismou: 6,
      onoma: "Σαπούνι",
      xroma: "Διαφανές",
      hmerominia_kataskeuis: new Date("2023-02-10"),
      megethos: "100g",
      marka: "Nivea",
      quantity: 20 // Added quantity: Organization has 20 soap bars
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
      },
       {
      id_sxolis: 4,
      timi: 250,
      epipedo: "Αρχάριος",
      klados: "Αναρρίχηση",
      etos: 2022,
      seira: 1,
      topothesies: [
        { topothesia: "Μετέωρα", start: new Date("2022-04-10"), end: new Date("2022-04-15") }
      ]
    },
    {
      id_sxolis: 5,
      timi: 350,
      epipedo: "Μέσος",
      klados: "Ορειβασία",
      etos: 2023,
      seira: 1,
      topothesies: [
        { topothesia: "Ταΰγετος", start: new Date("2023-03-01"), end: new Date("2023-03-06") }
      ]
    },
    {
      id_sxolis: 6,
      timi: 420,
      epipedo: "Προχωρημένος",
      klados: "Σκι",
      etos: 2024,
      seira: 1,
      topothesies: [
        { topothesia: "Βασιλίτσα", start: new Date("2024-12-10"), end: new Date("2024-12-15") }
      ]
    },
    {
      id_sxolis: 7,
      timi: 270,
      epipedo: "Αρχάριος",
      klados: "Σκι",
      etos: 2023,
      seira: 2,
      topothesies: [
        { topothesia: "Παρνασσός", start: new Date("2023-01-10"), end: new Date("2023-01-15") }
      ]
    },
    {
      id_sxolis: 8,
      timi: 390,
      epipedo: "Μέσος",
      klados: "Ορειβασία",
      etos: 2023,
      seira: 2,
      topothesies: [
        { topothesia: "Γκιώνα", start: new Date("2023-06-01"), end: new Date("2023-06-05") }
      ]
    },
    {
      id_sxolis: 9,
      timi: 460,
      epipedo: "Προχωρημένος",
      klados: "Αναρρίχηση",
      etos: 2024,
      seira: 2,
      topothesies: [
        { topothesia: "Βαράσοβα", start: new Date("2024-09-05"), end: new Date("2024-09-10") }
      ]
    },
    {
      id_sxolis: 10,
      timi: 310,
      epipedo: "Αρχάριος",
      klados: "Ορειβασία",
      etos: 2022,
      seira: 2,
      topothesies: [
        { topothesia: "Ερύμανθος", start: new Date("2022-07-15"), end: new Date("2022-07-20") }
      ]
    },
    {
      id_sxolis: 11,
      timi: 330,
      epipedo: "Μέσος",
      klados: "Αναρρίχηση",
      etos: 2024,
      seira: 1,
      topothesies: [
        { topothesia: "Λεωνίδιο", start: new Date("2024-05-20"), end: new Date("2024-05-25") }
      ]
    },

    {
      id_sxolis: 12,
      timi: 370,
      epipedo: "Αρχάριος",
      klados: "Σκι",
      etos: 2025,
      seira: 2,
      topothesies: [
        { topothesia: "Φαλακρό", start: new Date("2025-07-01"), end: new Date("2025-07-06") }
      ]
    },
    {
      id_sxolis: 13,
      timi: 480,
      epipedo: "Μέσος",
      klados: "Αναρρίχηση",
      etos: 2025,
      seira: 2,
      topothesies: [
        { topothesia: "Βαρδούσια", start: new Date("2025-08-15"), end: new Date("2025-08-20") }
      ]
    },
    {
      id_sxolis: 14,
      timi: 520,
      epipedo: "Προχωρημένος",
      klados: "Ορειβασία",
      etos: 2026,
      seira: 1,
      topothesies: [
        { topothesia: "Τύμφη", start: new Date("2026-01-10"), end: new Date("2026-01-15") }
      ]
    },
    {
      id_sxolis: 15,
      timi: 350,
      epipedo: "Αρχάριος",
      klados: "Αναρρίχηση",
      etos: 2026,
      seira: 1,
      topothesies: [
        { topothesia: "Περιστέρι", start: new Date("2026-02-01"), end: new Date("2026-02-06") }
      ]
    }
  ]
});

  // 8. Δημιουργία Επαφών 
 await prisma.epafes.createMany({     
    data: [
      { onoma: "Μαρία", epitheto: "Παπαδοπούλου", email: "mpapadopoulou@example.com", tilefono: 6932110806n, idiotita: null },
      { onoma: "Γιάννης", epitheto: "Ιωαννίδης", email: "giannis.ioannidis@example.com", tilefono: 6935599000n, idiotita: null },
      { onoma: "Ελένη", epitheto: "Κωνσταντίνου", email: "eleni.konstantinou@example.com", tilefono: 6945255740n, idiotita: null },
      { onoma: "Δημήτρης", epitheto: "Παπαδόπουλος", email: "dimitris.papadopoulos@example.com", tilefono: 6988218424n, idiotita: null },
      { onoma: "Ανθή", epitheto: "Αντωνίου", email: "anthi.antoniou@example.com", tilefono: 6993633798n, idiotita: null },
      { onoma: "Νίκος", epitheto: "Γεωργίου", email: "nikos.georgiou@example.com", tilefono: 6939012114n, idiotita: null },
      { onoma: "Σοφία", epitheto: "Δημητρίου", email: "sofia.dimitriou@example.com", tilefono: 6912468829n, idiotita: null },
      { onoma: "Αντώνης", epitheto: "Νικολάου", email: "antonis.nikolaou@example.com", tilefono: 6937188098n, idiotita: null },
      { onoma: "Κατερίνα", epitheto: "Παππά", email: "katerina.pappa@example.com", tilefono: 6967672202n, idiotita: null },
      { onoma: "Παναγιώτης", epitheto: "Μιχαηλίδης", email: "panagiotis.michailidis@example.com", tilefono: 6908532091n, idiotita: null },
      { onoma: "Αγγελική", epitheto: "Οικονόμου", email: "aggeliki.oikonomou@example.com", tilefono: 6973793298n, idiotita: null },
      { onoma: "Σπύρος", epitheto: "Αθανασίου", email: "spyros.athanasiou@example.com", tilefono: 6964654323n, idiotita: null },
      { onoma: "Αθηνά", epitheto: "Πετρόπουλος", email: "athina.petropoulou@example.com", tilefono: 6923509708n, idiotita: null },
      { onoma: "Χρήστος", epitheto: "Στεφανίδης", email: "christos.stefanidis@example.com", tilefono: 6998652554n, idiotita: null },
      { onoma: "Ειρήνη", epitheto: "Βασιλείου", email: "eirini.vasileiou@example.com", tilefono: 6929367736n, idiotita: null },
      { onoma: "Θεόδωρος", epitheto: "Καραμανλής", email: "theodoros.karamanlis@example.com", tilefono: 6937254292n, idiotita: null },
      { onoma: "Άννα", epitheto: "Αλεξάνδρου", email: "anna.alexandrou@example.com", tilefono: 6994432929n, idiotita: null },
      { onoma: "Μιχάλης", epitheto: "Σωτηρίου", email: "michalis.sotiriou@example.com", tilefono: 6914457804n, idiotita: null },
      { onoma: "Δέσποινα", epitheto: "Τριανταφύλλου", email: "despoina.triantafyllou@example.com", tilefono: 6949452746n, idiotita: null },
      { onoma: "Αλέξης", epitheto: "Λάζαρος", email: "alexis.lazaros@example.com", tilefono: 6947892070n, idiotita: null },
      { onoma: "Ευαγγελία", epitheto: "Μακρή", email: "evaggelia.makri@example.com", tilefono: 6972195869n, idiotita: null },
      { onoma: "Σταύρος", epitheto: "Κυριακίδης", email: "stavros.kyriakidis@example.com", tilefono: 6923836986n, idiotita: null },
      { onoma: "Βασιλική", epitheto: "Σαμαρά", email: "vasiliki.samara@example.com", tilefono: 6968862231n, idiotita: null },
      { onoma: "Αριστείδης", epitheto: "Παυλίδης", email: "aristeidis.pavlidis@example.com", tilefono: 6967572078n, idiotita: null },
      { onoma: "Ελευθερία", epitheto: "Ζαχαρίου", email: "eleutheria.zachariou@example.com", tilefono: 6929133040n, idiotita: null },
      { onoma: "Λευτέρης", epitheto: "Παναγιωτόπουλος", email: "lefteris.panagiotopoulos@example.com", tilefono: 6913849614n, idiotita: null },
      { onoma: "Ολυμπία", epitheto: "Ρούσσου", email: "olympia.roussou@example.com", tilefono: 6989034479n, idiotita: null },
      { onoma: "Γιώργος", epitheto: "Δημόπουλος", email: "giorgos.dimopoulos@example.com", tilefono: 6912849805n, idiotita: null },
      { onoma: "Αναστασία", epitheto: "Φωτοπούλου", email: "anastasia.fotopoulou@example.com", tilefono: 6918373514n, idiotita: null },
      { onoma: "Αναστάσιος", epitheto: "Τσόχας", email: "anastasios.tsochas@example.com", tilefono: 6976818556n, idiotita: null },
      { onoma: "Ελισάβετ", epitheto: "Καραμπέτη", email: "elisavet.karampeti@example.com", tilefono: 6961507464n, idiotita: null },
      { onoma: "Πέτρος", epitheto: "Μαυρίδης", email: "petros.mavridis@example.com", tilefono: 6955383512n, idiotita: null },
      { onoma: "Αργυρώ", epitheto: "Λαμπρόπουλος", email: "argyro.lampropoulou@example.com", tilefono: 6946816222n, idiotita: null },
      { onoma: "Ηλίας", epitheto: "Καζαντζίδης", email: "ilias.kazantzidis@example.com", tilefono: 6927231312n, idiotita: null },
      { onoma: "Κωνσταντίνα", epitheto: "Γεωργιάδου", email: "konstantina.georgiadou@example.com", tilefono: 6936110077n, idiotita: null },
      { onoma: "Αλέκος", epitheto: "Μοσχόπουλος", email: "alekos.moschopoulos@example.com", tilefono: 6943223277n, idiotita: null },
      { onoma: "Ευθυμία", epitheto: "Παυλίδου", email: "efthymia.pavlidou@example.com", tilefono: 6942425292n, idiotita: null },
      { onoma: "Σωκράτης", epitheto: "Κολιόπουλος", email: "sokratis.koliopoulos@example.com", tilefono: 6951396138n, idiotita: null },
      { onoma: "Χριστίνα", epitheto: "Σιδέρη", email: "christina.sideri@example.com", tilefono: 6909446925n, idiotita: null },
      { onoma: "Αριστέα", epitheto: "Γαλάνης", email: "aristea.galanis@example.com", tilefono: 6925120035n, idiotita: null },
      { onoma: "Ανδρέας", epitheto: "Πολίτης", email: "andreas.politis@example.com", tilefono: 6908970082n, idiotita: null },
      { onoma: "Ευαγγελία", epitheto: "Αυγερινός", email: "evaggelia.averinos@example.com", tilefono: 6947169269n, idiotita: null },
      { onoma: "Μαργαρίτα", epitheto: "Σπυρόπουλος", email: "margarita.spyropoulou@example.com", tilefono: 6984533437n, idiotita: null },
      { onoma: "Παύλος", epitheto: "Καραθανάσης", email: "pavlos.karathanasis@example.com", tilefono: 6935043339n, idiotita: null },
      { onoma: "Φωτεινή", epitheto: "Καραβιδόπουλος", email: "foteini.karavidopoulou@example.com", tilefono: 6982608873n, idiotita: null },
      { onoma: "Αναστάσης", epitheto: "Χατζηκώστας", email: "anastasis.chatzikostas@example.com", tilefono: 6943714755n, idiotita: "Χορηγός" },
      { onoma: "Ειρήνη", epitheto: "Γεωργοπούλου", email: "eirini.georgopoulou@example.com", tilefono: 6988106028n, idiotita: "Γονέας" },
      { onoma: "Διονύσης", epitheto: "Τσιτσάνης", email: "dionysis.tsitsanis@example.com", tilefono: 6965002470n, idiotita: "Ομιλητής" },
      { onoma: "Ζωή", epitheto: "Δρακοπούλου", email: "zoe.drakopoulou@example.com", tilefono: 6930006969n, idiotita: "Γονέας" },
      { onoma: "Χαράλαμπος", epitheto: "Παπαδάκης", email: "charalambos.papadakis@example.com", tilefono: 6989152638n, idiotita: "Ομιλητής" }
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
    { id_es_melous: 1, hmerominia_gennhshs: new Date("1990-09-14"), patronimo: "Δημήτριος", odos: "Κορίνθου", tk: 26355, arithmos_mitroou: 1001 },
    { id_es_melous: 2, hmerominia_gennhshs: new Date("1990-06-17"), patronimo: "Αναστάσιος", odos: "Μαιζώνος", tk: 26929, arithmos_mitroou: 1002 },
    { id_es_melous: 3, hmerominia_gennhshs: new Date("1993-06-18"), patronimo: "Ιωάννης", odos: "Αγίου Ανδρέου", tk: 26640, arithmos_mitroou: 1003 },
    { id_es_melous: 4, hmerominia_gennhshs: new Date("1998-07-12"), patronimo: "Κωνσταντίνος", odos: "Νόρμαν", tk: 26743, arithmos_mitroou: 1004 },
    { id_es_melous: 5, hmerominia_gennhshs: new Date("1990-09-17"), patronimo: "Νικόλαος", odos: "Ερμού", tk: 26145, arithmos_mitroou: 1005 },
    { id_es_melous: 6, hmerominia_gennhshs: new Date("1997-02-14"), patronimo: "Χρήστος", odos: "Αμερικής", tk: 26501, arithmos_mitroou: 1006 },
    { id_es_melous: 7, hmerominia_gennhshs: new Date("1993-06-17"), patronimo: "Παναγιώτης", odos: "Κανακάρη", tk: 26639, arithmos_mitroou: 1007 },
    { id_es_melous: 8, hmerominia_gennhshs: new Date("1990-08-18"), patronimo: "Δημήτριος", odos: "Ρήγα Φεραίου", tk: 26445, arithmos_mitroou: 1008 },
    { id_es_melous: 9, hmerominia_gennhshs: new Date("1995-05-18"), patronimo: "Ανδρέας", odos: "Ιωάννη Βλάχου", tk: 26132, arithmos_mitroou: 1009 },
    { id_es_melous: 10, hmerominia_gennhshs: new Date("1994-03-16"), patronimo: "Ιωάννης", odos: "Καλαβρύτων", tk: 26448, arithmos_mitroou: 1010 },
    { id_es_melous: 11, hmerominia_gennhshs: new Date("1998-07-15"), patronimo: "Γεράσιμος", odos: "Ακρωτηρίου", tk: 26431, arithmos_mitroou: 1011 },
    { id_es_melous: 12, hmerominia_gennhshs: new Date("1994-06-11"), patronimo: "Αθανάσιος", odos: "Καναδά", tk: 26484, arithmos_mitroou: 1012 },
    { id_es_melous: 13, hmerominia_gennhshs: new Date("1992-08-17"), patronimo: "Αλέξανδρος", odos: "Αλεξάνδρου Υψηλάντου", tk: 26185, arithmos_mitroou: 1013 },
    { id_es_melous: 14, hmerominia_gennhshs: new Date("1997-07-10"), patronimo: "Νεκτάριος", odos: "Πανεπιστημίου", tk: 26859, arithmos_mitroou: 1014 },
    { id_es_melous: 15, hmerominia_gennhshs: new Date("1997-04-18"), patronimo: "Λεωνίδας", odos: "Ελευθερίου Βενιζέλου", tk: 26720, arithmos_mitroou: 1015 },
    { id_es_melous: 16, hmerominia_gennhshs: new Date("1993-01-18"), patronimo: "Αναστάσιος", odos: "Ακτής Δυμαίων", tk: 26112, arithmos_mitroou: 1016 },
    { id_es_melous: 17, hmerominia_gennhshs: new Date("1992-06-13"), patronimo: "Πέτρος", odos: "Αθανασίου Διάκου", tk: 26691, arithmos_mitroou: 1017 },
    { id_es_melous: 18, hmerominia_gennhshs: new Date("1995-08-19"), patronimo: "Σπυρίδων", odos: "Ζαΐμη", tk: 26775, arithmos_mitroou: 1018 },
    { id_es_melous: 19, hmerominia_gennhshs: new Date("1998-03-10"), patronimo: "Χρήστος", odos: "Καραϊσκάκη", tk: 26772, arithmos_mitroou: 1019 },
    { id_es_melous: 20, hmerominia_gennhshs: new Date("1990-05-13"), patronimo: "Στέφανος", odos: "Κιλκίς", tk: 26393, arithmos_mitroou: 1020 },
    { id_es_melous: 21, hmerominia_gennhshs: new Date("1996-05-13"), patronimo: "Νικόλαος", odos: "Αρεθούσης", tk: 26149, arithmos_mitroou: 1021 },
    { id_es_melous: 22, hmerominia_gennhshs: new Date("1993-02-15"), patronimo: "Ιωάννης", odos: "Σατωβριάνδου", tk: 26708, arithmos_mitroou: 1022 },
    { id_es_melous: 23, hmerominia_gennhshs: new Date("1990-06-17"), patronimo: "Αλέξανδρος", odos: "Αλεξάνδρας", tk: 26207, arithmos_mitroou: 1023 },
    { id_es_melous: 24, hmerominia_gennhshs: new Date("1995-03-16"), patronimo: "Παναγιώτης", odos: "Οθωνος Αμαλίας", tk: 26516, arithmos_mitroou: 1024 },
    { id_es_melous: 25, hmerominia_gennhshs: new Date("1997-02-15"), patronimo: "Λεωνίδας", odos: "Πατρέως", tk: 26952, arithmos_mitroou: 1025 },
    { id_es_melous: 26, hmerominia_gennhshs: new Date("1994-09-18"), patronimo: "Κωνσταντίνος", odos: "Ελλησπόντου", tk: 26128, arithmos_mitroou: 1026 },
    { id_es_melous: 27, hmerominia_gennhshs: new Date("1998-04-15"), patronimo: "Αναστάσιος", odos: "Παντανάσσης", tk: 26900, arithmos_mitroou: 1027 },
    { id_es_melous: 28, hmerominia_gennhshs: new Date("1997-01-13"), patronimo: "Χρήστος", odos: "Νόρμαν", tk: 26613, arithmos_mitroou: 1028 },
    { id_es_melous: 29, hmerominia_gennhshs: new Date("1992-08-17"), patronimo: "Σπυρίδων", odos: "Βορείου Ηπείρου", tk: 26192, arithmos_mitroou: 1029 },
    { id_es_melous: 30, hmerominia_gennhshs: new Date("1998-03-11"), patronimo: "Δημήτριος", odos: "Φιλοποίμενος", tk: 26347, arithmos_mitroou: 1030 }
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

await prisma.eksormisi.createMany({
  data: [
    // Αρχικές εγγραφές (διορθωμένες)
    {
      id_eksormisis: 1,
      proorismos: "Ζαγοροχώρια",
      timi: 150,
      hmerominia_afiksis: new Date("2023-11-01"),
      hmerominia_anaxorisis: new Date("2023-11-05"),
      titlos: "Παραδοσιακά Χωριά",
    },
    {
      id_eksormisis: 2,
      proorismos: "Πίνδος",
      timi: 200,
      hmerominia_afiksis: new Date("2025-12-01"),
      hmerominia_anaxorisis: new Date("2025-12-05"),
      titlos: "Ορειβασία στην Πίνδο",
    },
    {
      id_eksormisis: 3,
      proorismos: "Όλυμπος",
      timi: 250,
      hmerominia_afiksis: new Date("2025-05-01"),
      hmerominia_anaxorisis: new Date("2025-05-07"),
      titlos: "Αναρρίχηση στον Όλυμπο",
    },

    // Νέες μελλοντικές (σωστά διορθωμένες)
    {
      id_eksormisis: 4,
      proorismos: "Καλάβρυτα",
      timi: 130,
      hmerominia_afiksis: new Date("2025-07-10"),
      hmerominia_anaxorisis: new Date("2025-07-12"),
      titlos: "Καλοκαιρινή Απόδραση στα Καλάβρυτα",
    },
    {
      id_eksormisis: 5,
      proorismos: "Λίμνη Πλαστήρα",
      timi: 180,
      hmerominia_afiksis: new Date("2025-08-05"),
      hmerominia_anaxorisis: new Date("2025-08-09"),
      titlos: "Πεζοπορία και Φύση",
    },
    {
      id_eksormisis: 6,
      proorismos: "Ταΰγετος",
      timi: 210,
      hmerominia_afiksis: new Date("2025-08-20"),
      hmerominia_anaxorisis: new Date("2025-08-23"),
      titlos: "Ορεινή Εξερεύνηση στον Ταΰγετο",
    },
    {
      id_eksormisis: 7,
      proorismos: "Πήλιο",
      timi: 160,
      hmerominia_afiksis: new Date("2025-07-30"),
      hmerominia_anaxorisis: new Date("2025-08-02"),
      titlos: "Παραθαλάσσιες Διαδρομές",
    },
    {
      id_eksormisis: 8,
      proorismos: "Μετέωρα",
      timi: 190,
      hmerominia_afiksis: new Date("2025-09-05"),
      hmerominia_anaxorisis: new Date("2025-09-07"),
      titlos: "Μοναστήρια και Πεζοπορία",
    },
    {
      id_eksormisis: 9,
      proorismos: "Βίκος",
      timi: 220,
      hmerominia_afiksis: new Date("2025-09-10"),
      hmerominia_anaxorisis: new Date("2025-09-14"),
      titlos: "Φαράγγι και Καταρράκτες",
    },
    {
      id_eksormisis: 10,
      proorismos: "Ορεινή Ναυπακτία",
      timi: 175,
      hmerominia_afiksis: new Date("2025-08-15"),
      hmerominia_anaxorisis: new Date("2025-08-18"),
      titlos: "Καλοκαιρινή Εξερεύνηση",
    },

    // Νέες παλιές (σωστά διορθωμένες)
    {
      id_eksormisis: 11,
      proorismos: "Ερύμανθος",
      timi: 140,
      hmerominia_afiksis: new Date("2024-10-20"),
      hmerominia_anaxorisis: new Date("2024-10-22"),
      titlos: "Ορεινή Δραστηριότητα Ερύμανθου",
    },
    {
      id_eksormisis: 12,
      proorismos: "Χελμός",
      timi: 160,
      hmerominia_afiksis: new Date("2025-03-12"),
      hmerominia_anaxorisis: new Date("2025-03-15"),
      titlos: "Σκι και Πεζοπορία στον Χελμό",
    },
    {
      id_eksormisis: 13,
      proorismos: "Βαρδούσια",
      timi: 200,
      hmerominia_afiksis: new Date("2025-04-10"),
      hmerominia_anaxorisis: new Date("2025-04-14"),
      titlos: "Ορειβασία στα Βαρδούσια",
    },
    {
      id_eksormisis: 14,
      proorismos: "Παρανεστί",
      timi: 170,
      hmerominia_afiksis: new Date("2025-05-20"),
      hmerominia_anaxorisis: new Date("2025-05-23"),
      titlos: "Δραστηριότητες στον Νέστο",
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
    ,
    {
      id_eksormisis: 4,
      id_ypefthynou: 4
    },
    {
      id_eksormisis: 5,
      id_ypefthynou: 5
    },
    {
      id_eksormisis: 6,
      id_ypefthynou: 6
    },
    {
      id_eksormisis: 7,
      id_ypefthynou: 7
    },
    {
      id_eksormisis: 8,
      id_ypefthynou: 8
    }
  ]
});

  // 16. Δημιουργία Δραστηριοτήτων

await prisma.drastiriotita.createMany({
  data: [
    {
      "id_eksormisis": 1,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 3,
      "titlos": "Πεζοπορία",
      "diafora_ipsous": 110,
      "hmerominia": new Date("2023-11-01"),
      "megisto_ipsometro": 815
    },
    {
      "id_eksormisis": 1,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 4,
      "titlos": "Αναρρίχηση",
      "diafora_ipsous": 120,
      "hmerominia": new Date("2023-11-02"),
      "megisto_ipsometro": 830
    },
    {
      "id_eksormisis": 1,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 5,
      "titlos": "Χαλαρή Πορεία",
      "diafora_ipsous": 130,
      "hmerominia": new Date("2023-11-03"),
      "megisto_ipsometro": 845
    },
    {
      "id_eksormisis": 1,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 6,
      "titlos": "Ορεινή Πεζοπορία",
      "diafora_ipsous": 140,
      "hmerominia": new Date("2023-11-04"),
      "megisto_ipsometro": 860
    },
    {
      "id_eksormisis": 1,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 7,
      "titlos": "Καταρρίχηση",
      "diafora_ipsous": 150,
      "hmerominia": new Date("2023-11-05"),
      "megisto_ipsometro": 875
    },
    {
      "id_eksormisis": 2,
      "id_vathmou_diskolias": 7,
      "ores_poreias": 2,
      "titlos": "Διαδρομή GPS",
      "diafora_ipsous": 160,
      "hmerominia": new Date("2025-12-01"),
      "megisto_ipsometro": 890
    },
    {
      "id_eksormisis": 2,
      "id_vathmou_diskolias": 8,
      "ores_poreias": 3,
      "titlos": "Οικολογική Ενημέρωση",
      "diafora_ipsous": 170,
      "hmerominia": new Date("2025-12-02"),
      "megisto_ipsometro": 905
    },
    {
      "id_eksormisis": 2,
      "id_vathmou_diskolias": 1,
      "ores_poreias": 4,
      "titlos": "Σπήλαιο",
      "diafora_ipsous": 180,
      "hmerominia": new Date("2025-12-03"),
      "megisto_ipsometro": 920
    },
    {
      "id_eksormisis": 2,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 5,
      "titlos": "Πορεία Αντοχής",
      "diafora_ipsous": 190,
      "hmerominia": new Date("2025-12-04"),
      "megisto_ipsometro": 935
    },
    {
      "id_eksormisis": 2,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 6,
      "titlos": "Πεζοπορία",
      "diafora_ipsous": 200,
      "hmerominia": new Date("2025-12-05"),
      "megisto_ipsometro": 950
    },
    {
      "id_eksormisis": 3,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 7,
      "titlos": "Αναρρίχηση",
      "diafora_ipsous": 210,
      "hmerominia": new Date("2025-05-01"),
      "megisto_ipsometro": 965
    },
    {
      "id_eksormisis": 3,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 2,
      "titlos": "Χαλαρή Πορεία",
      "diafora_ipsous": 220,
      "hmerominia": new Date("2025-05-02"),
      "megisto_ipsometro": 980
    },
    {
      "id_eksormisis": 3,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 3,
      "titlos": "Ορεινή Πεζοπορία",
      "diafora_ipsous": 230,
      "hmerominia": new Date("2025-05-03"),
      "megisto_ipsometro": 995
    },
    {
      "id_eksormisis": 3,
      "id_vathmou_diskolias": 7,
      "ores_poreias": 4,
      "titlos": "Καταρρίχηση",
      "diafora_ipsous": 240,
      "hmerominia": new Date("2025-05-04"),
      "megisto_ipsometro": 1010
    },
    {
      "id_eksormisis": 3,
      "id_vathmou_diskolias": 8,
      "ores_poreias": 5,
      "titlos": "Διαδρομή GPS",
      "diafora_ipsous": 250,
      "hmerominia": new Date("2025-05-05"),
      "megisto_ipsometro": 1025
    },
    {
      "id_eksormisis": 3,
      "id_vathmou_diskolias": 1,
      "ores_poreias": 6,
      "titlos": "Οικολογική Ενημέρωση",
      "diafora_ipsous": 260,
      "hmerominia": new Date("2025-05-06"),
      "megisto_ipsometro": 1040
    },
    {
      "id_eksormisis": 3,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 7,
      "titlos": "Σπήλαιο",
      "diafora_ipsous": 270,
      "hmerominia": new Date("2025-05-07"),
      "megisto_ipsometro": 1055
    },
    {
      "id_eksormisis": 4,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 2,
      "titlos": "Πορεία Αντοχής",
      "diafora_ipsous": 280,
      "hmerominia": new Date("2025-07-10"),
      "megisto_ipsometro": 1070
    },
    {
      "id_eksormisis": 4,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 3,
      "titlos": "Πεζοπορία",
      "diafora_ipsous": 290,
      "hmerominia": new Date("2025-07-11"),
      "megisto_ipsometro": 1085
    },
    {
      "id_eksormisis": 4,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 4,
      "titlos": "Αναρρίχηση",
      "diafora_ipsous": 300,
      "hmerominia": new Date("2025-07-12"),
      "megisto_ipsometro": 1100
    },
    {
      "id_eksormisis": 5,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 5,
      "titlos": "Χαλαρή Πορεία",
      "diafora_ipsous": 310,
      "hmerominia": new Date("2025-08-05"),
      "megisto_ipsometro": 1115
    },
    {
      "id_eksormisis": 5,
      "id_vathmou_diskolias": 7,
      "ores_poreias": 6,
      "titlos": "Ορεινή Πεζοπορία",
      "diafora_ipsous": 320,
      "hmerominia": new Date("2025-08-06"),
      "megisto_ipsometro": 1130
    },
    {
      "id_eksormisis": 5,
      "id_vathmou_diskolias": 8,
      "ores_poreias": 7,
      "titlos": "Καταρρίχηση",
      "diafora_ipsous": 330,
      "hmerominia": new Date("2025-08-07"),
      "megisto_ipsometro": 1145
    },
    {
      "id_eksormisis": 5,
      "id_vathmou_diskolias": 1,
      "ores_poreias": 2,
      "titlos": "Διαδρομή GPS",
      "diafora_ipsous": 340,
      "hmerominia": new Date("2025-08-08"),
      "megisto_ipsometro": 1160
    },
    {
      "id_eksormisis": 5,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 3,
      "titlos": "Οικολογική Ενημέρωση",
      "diafora_ipsous": 350,
      "hmerominia": new Date("2025-08-09"),
      "megisto_ipsometro": 1175
    },
    {
      "id_eksormisis": 6,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 4,
      "titlos": "Σπήλαιο",
      "diafora_ipsous": 360,
      "hmerominia": new Date("2025-08-20"),
      "megisto_ipsometro": 1190
    },
    {
      "id_eksormisis": 6,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 5,
      "titlos": "Πορεία Αντοχής",
      "diafora_ipsous": 370,
      "hmerominia": new Date("2025-08-21"),
      "megisto_ipsometro": 1205
    },
    {
      "id_eksormisis": 6,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 6,
      "titlos": "Πεζοπορία",
      "diafora_ipsous": 380,
      "hmerominia": new Date("2025-08-22"),
      "megisto_ipsometro": 1220
    },
    {
      "id_eksormisis": 6,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 7,
      "titlos": "Αναρρίχηση",
      "diafora_ipsous": 390,
      "hmerominia": new Date("2025-08-23"),
      "megisto_ipsometro": 1235
    },
    {
      "id_eksormisis": 7,
      "id_vathmou_diskolias": 7,
      "ores_poreias": 2,
      "titlos": "Χαλαρή Πορεία",
      "diafora_ipsous": 400,
      "hmerominia": new Date("2025-07-30"),
      "megisto_ipsometro": 1250
    },
    {
      "id_eksormisis": 7,
      "id_vathmou_diskolias": 8,
      "ores_poreias": 3,
      "titlos": "Ορεινή Πεζοπορία",
      "diafora_ipsous": 410,
      "hmerominia": new Date("2025-07-31"),
      "megisto_ipsometro": 1265
    },
    {
      "id_eksormisis": 7,
      "id_vathmou_diskolias": 1,
      "ores_poreias": 4,
      "titlos": "Καταρρίχηση",
      "diafora_ipsous": 420,
      "hmerominia": new Date("2025-08-01"),
      "megisto_ipsometro": 1280
    },
    {
      "id_eksormisis": 7,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 5,
      "titlos": "Διαδρομή GPS",
      "diafora_ipsous": 430,
      "hmerominia": new Date("2025-08-02"),
      "megisto_ipsometro": 1295
    },
    {
      "id_eksormisis": 8,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 6,
      "titlos": "Οικολογική Ενημέρωση",
      "diafora_ipsous": 440,
      "hmerominia": new Date("2025-09-05"),
      "megisto_ipsometro": 1310
    },
    {
      "id_eksormisis": 8,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 7,
      "titlos": "Σπήλαιο",
      "diafora_ipsous": 450,
      "hmerominia": new Date("2025-09-06"),
      "megisto_ipsometro": 1325
    },
    {
      "id_eksormisis": 8,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 2,
      "titlos": "Πορεία Αντοχής",
      "diafora_ipsous": 460,
      "hmerominia": new Date("2025-09-07"),
      "megisto_ipsometro": 1340
    },
    {
      "id_eksormisis": 9,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 3,
      "titlos": "Πεζοπορία",
      "diafora_ipsous": 470,
      "hmerominia": new Date("2025-09-10"),
      "megisto_ipsometro": 1355
    },
    {
      "id_eksormisis": 9,
      "id_vathmou_diskolias": 7,
      "ores_poreias": 4,
      "titlos": "Αναρρίχηση",
      "diafora_ipsous": 480,
      "hmerominia": new Date("2025-09-11"),
      "megisto_ipsometro": 1370
    },
    {
      "id_eksormisis": 9,
      "id_vathmou_diskolias": 8,
      "ores_poreias": 5,
      "titlos": "Χαλαρή Πορεία",
      "diafora_ipsous": 490,
      "hmerominia": new Date("2025-09-12"),
      "megisto_ipsometro": 1385
    },
    {
      "id_eksormisis": 9,
      "id_vathmou_diskolias": 1,
      "ores_poreias": 6,
      "titlos": "Ορεινή Πεζοπορία",
      "diafora_ipsous": 500,
      "hmerominia": new Date("2025-09-13"),
      "megisto_ipsometro": 1400
    },
    {
      "id_eksormisis": 9,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 7,
      "titlos": "Καταρρίχηση",
      "diafora_ipsous": 510,
      "hmerominia": new Date("2025-09-14"),
      "megisto_ipsometro": 1415
    },
    {
      "id_eksormisis": 10,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 2,
      "titlos": "Διαδρομή GPS",
      "diafora_ipsous": 520,
      "hmerominia": new Date("2025-08-15"),
      "megisto_ipsometro": 1430
    },
    {
      "id_eksormisis": 10,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 3,
      "titlos": "Οικολογική Ενημέρωση",
      "diafora_ipsous": 530,
      "hmerominia": new Date("2025-08-16"),
      "megisto_ipsometro": 1445
    },
    {
      "id_eksormisis": 10,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 4,
      "titlos": "Σπήλαιο",
      "diafora_ipsous": 540,
      "hmerominia": new Date("2025-08-17"),
      "megisto_ipsometro": 1460
    },
    {
      "id_eksormisis": 10,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 5,
      "titlos": "Πορεία Αντοχής",
      "diafora_ipsous": 550,
      "hmerominia": new Date("2025-08-18"),
      "megisto_ipsometro": 1475
    },
    {
      "id_eksormisis": 11,
      "id_vathmou_diskolias": 7,
      "ores_poreias": 6,
      "titlos": "Πεζοπορία",
      "diafora_ipsous": 560,
      "hmerominia": new Date("2024-10-20"),
      "megisto_ipsometro": 1490
    },
    {
      "id_eksormisis": 11,
      "id_vathmou_diskolias": 8,
      "ores_poreias": 7,
      "titlos": "Αναρρίχηση",
      "diafora_ipsous": 570,
      "hmerominia": new Date("2024-10-21"),
      "megisto_ipsometro": 1505
    },
    {
      "id_eksormisis": 11,
      "id_vathmou_diskolias": 1,
      "ores_poreias": 2,
      "titlos": "Χαλαρή Πορεία",
      "diafora_ipsous": 580,
      "hmerominia": new Date("2024-10-22"),
      "megisto_ipsometro": 1520
    },
    {
      "id_eksormisis": 12,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 3,
      "titlos": "Ορεινή Πεζοπορία",
      "diafora_ipsous": 590,
      "hmerominia": new Date("2025-03-12"),
      "megisto_ipsometro": 1535
    },
    {
      "id_eksormisis": 12,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 4,
      "titlos": "Καταρρίχηση",
      "diafora_ipsous": 600,
      "hmerominia": new Date("2025-03-13"),
      "megisto_ipsometro": 1550
    },
    {
      "id_eksormisis": 12,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 5,
      "titlos": "Διαδρομή GPS",
      "diafora_ipsous": 610,
      "hmerominia": new Date("2025-03-14"),
      "megisto_ipsometro": 1565
    },
    {
      "id_eksormisis": 12,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 6,
      "titlos": "Οικολογική Ενημέρωση",
      "diafora_ipsous": 620,
      "hmerominia": new Date("2025-03-15"),
      "megisto_ipsometro": 1580
    },
    {
      "id_eksormisis": 13,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 7,
      "titlos": "Σπήλαιο",
      "diafora_ipsous": 630,
      "hmerominia": new Date("2025-04-10"),
      "megisto_ipsometro": 1595
    },
    {
      "id_eksormisis": 13,
      "id_vathmou_diskolias": 7,
      "ores_poreias": 2,
      "titlos": "Πορεία Αντοχής",
      "diafora_ipsous": 640,
      "hmerominia": new Date("2025-04-11"),
      "megisto_ipsometro": 1610
    },
    {
      "id_eksormisis": 13,
      "id_vathmou_diskolias": 8,
      "ores_poreias": 3,
      "titlos": "Πεζοπορία",
      "diafora_ipsous": 650,
      "hmerominia": new Date("2025-04-12"),
      "megisto_ipsometro": 1625
    },
    {
      "id_eksormisis": 13,
      "id_vathmou_diskolias": 1,
      "ores_poreias": 4,
      "titlos": "Αναρρίχηση",
      "diafora_ipsous": 660,
      "hmerominia": new Date("2025-04-13"),
      "megisto_ipsometro": 1640
    },
    {
      "id_eksormisis": 13,
      "id_vathmou_diskolias": 2,
      "ores_poreias": 5,
      "titlos": "Χαλαρή Πορεία",
      "diafora_ipsous": 670,
      "hmerominia": new Date("2025-04-14"),
      "megisto_ipsometro": 1655
    },
    {
      "id_eksormisis": 14,
      "id_vathmou_diskolias": 3,
      "ores_poreias": 6,
      "titlos": "Ορεινή Πεζοπορία",
      "diafora_ipsous": 680,
      "hmerominia": new Date("2025-05-20"),
      "megisto_ipsometro": 1670
    },
    {
      "id_eksormisis": 14,
      "id_vathmou_diskolias": 4,
      "ores_poreias": 7,
      "titlos": "Καταρρίχηση",
      "diafora_ipsous": 690,
      "hmerominia": new Date("2025-05-21"),
      "megisto_ipsometro": 1685
    },
    {
      "id_eksormisis": 14,
      "id_vathmou_diskolias": 5,
      "ores_poreias": 2,
      "titlos": "Διαδρομή GPS",
      "diafora_ipsous": 700,
      "hmerominia": new Date("2025-05-22"),
      "megisto_ipsometro": 1700
    },
    {
      "id_eksormisis": 14,
      "id_vathmou_diskolias": 6,
      "ores_poreias": 3,
      "titlos": "Οικολογική Ενημέρωση",
      "diafora_ipsous": 710,
      "hmerominia": new Date("2025-05-23"),
      "megisto_ipsometro": 1715
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
      { id_epafis: 1, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-12T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-15T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 10, arithmos_mi_melwn: 6, atoma: 16, imeres: 3, sinoliki_timh: 1320, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-02T15:18:05.218Z") },
      { id_epafis: 2, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-24T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-28T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 0, arithmos_mi_melwn: 10, atoma: 10, imeres: 4, sinoliki_timh: 1600, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-14T15:18:05.218Z") },
      { id_epafis: 3, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-18T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-22T15:18:05.218Z"), ypoloipo: 913, arithmos_melwn: 10, arithmos_mi_melwn: 3, atoma: 13, imeres: 4, sinoliki_timh: 1280, eksoterikos_xoros: "Ναι", hmerominia_akirosis: new Date("2025-03-16T15:18:05.218Z"), poso_epistrofis: 1280, hmerominia_kratisis: new Date("2025-03-08T15:18:05.218Z") },
      { id_epafis: 4, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-15T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-20T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 6, arithmos_mi_melwn: 10, atoma: 16, imeres: 5, sinoliki_timh: 2600, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-05T15:18:05.218Z") },
      { id_epafis: 5, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-18T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-03-22T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 8, arithmos_mi_melwn: 9, atoma: 17, imeres: 4, sinoliki_timh: 2080, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-08T15:18:05.218Z") },
      { id_epafis: 6, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-03T15:18:05.218Z"), ypoloipo: 355, arithmos_melwn: 1, arithmos_mi_melwn: 2, atoma: 3, imeres: 5, sinoliki_timh: 500, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 7, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-02T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 10, arithmos_mi_melwn: 6, atoma: 16, imeres: 4, sinoliki_timh: 1760, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 8, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-02T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 6, arithmos_mi_melwn: 8, atoma: 14, imeres: 4, sinoliki_timh: 1760, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 9, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-06-01T15:18:05.218Z"), ypoloipo: 889, arithmos_melwn: 4, arithmos_mi_melwn: 10, atoma: 14, imeres: 3, sinoliki_timh: 1440, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
      { id_epafis: 10, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-05-29T15:18:05.218Z"), hmerominia_epistrofis: new Date("2025-05-30T15:18:05.218Z"), ypoloipo: 0, arithmos_melwn: 10, arithmos_mi_melwn: 3, atoma: 13, imeres: 1, sinoliki_timh: 320, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-05-19T15:18:05.218Z") },
          { id_epafis: 11, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-07-01T14:00:00.000Z"), hmerominia_epistrofis: new Date("2025-07-03T14:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 5, arithmos_mi_melwn: 2, atoma: 7, imeres: 2, sinoliki_timh: 560, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-06-20T10:00:00.000Z") },
    { id_epafis: 12, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-07-15T12:00:00.000Z"), hmerominia_epistrofis: new Date("2025-07-20T12:00:00.000Z"), ypoloipo: 200, arithmos_melwn: 4, arithmos_mi_melwn: 4, atoma: 8, imeres: 5, sinoliki_timh: 800, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-06-25T08:00:00.000Z") },
    { id_epafis: 13, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-08-10T16:00:00.000Z"), hmerominia_epistrofis: new Date("2025-08-12T16:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 3, arithmos_mi_melwn: 0, atoma: 3, imeres: 2, sinoliki_timh: 240, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-07-01T14:00:00.000Z") },
    { id_epafis: 14, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-09-05T09:00:00.000Z"), hmerominia_epistrofis: new Date("2025-09-10T09:00:00.000Z"), ypoloipo: 100, arithmos_melwn: 6, arithmos_mi_melwn: 3, atoma: 9, imeres: 5, sinoliki_timh: 900, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-08-20T09:00:00.000Z") },
    { id_epafis: 15, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-07-08T10:00:00.000Z"), hmerominia_epistrofis: new Date("2025-07-11T10:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 8, arithmos_mi_melwn: 2, atoma: 10, imeres: 3, sinoliki_timh: 900, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-06-26T10:00:00.000Z") },
    { id_epafis: 16, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-08-20T12:00:00.000Z"), hmerominia_epistrofis: new Date("2025-08-22T12:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 4, arithmos_mi_melwn: 4, atoma: 8, imeres: 2, sinoliki_timh: 640, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-07-10T12:00:00.000Z") },
    { id_epafis: 17, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-07-25T10:00:00.000Z"), hmerominia_epistrofis: new Date("2025-07-27T10:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 2, arithmos_mi_melwn: 6, atoma: 8, imeres: 2, sinoliki_timh: 560, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-06-30T10:00:00.000Z") },
    { id_epafis: 18, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-07-18T13:00:00.000Z"), hmerominia_epistrofis: new Date("2025-07-19T13:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 6, arithmos_mi_melwn: 1, atoma: 7, imeres: 1, sinoliki_timh: 280, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-06-26T13:00:00.000Z") },
    { id_epafis: 19, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-08-01T14:00:00.000Z"), hmerominia_epistrofis: new Date("2025-08-06T14:00:00.000Z"), ypoloipo: 320, arithmos_melwn: 5, arithmos_mi_melwn: 5, atoma: 10, imeres: 5, sinoliki_timh: 1000, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-07-01T14:00:00.000Z") },
    { id_epafis: 20, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-09-01T10:00:00.000Z"), hmerominia_epistrofis: new Date("2025-09-03T10:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 7, arithmos_mi_melwn: 0, atoma: 7, imeres: 2, sinoliki_timh: 560, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-08-15T10:00:00.000Z") },
    { id_epafis: 21, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-01T12:00:00.000Z"), hmerominia_epistrofis: new Date("2025-03-03T12:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 4, arithmos_mi_melwn: 2, atoma: 6, imeres: 2, sinoliki_timh: 480, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-02-20T12:00:00.000Z") },
    { id_epafis: 22, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-02-10T15:00:00.000Z"), hmerominia_epistrofis: new Date("2025-02-14T15:00:00.000Z"), ypoloipo: 100, arithmos_melwn: 3, arithmos_mi_melwn: 4, atoma: 7, imeres: 4, sinoliki_timh: 700, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-02-01T15:00:00.000Z") },
    { id_epafis: 23, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-01-20T10:00:00.000Z"), hmerominia_epistrofis: new Date("2025-01-23T10:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 2, arithmos_mi_melwn: 3, atoma: 5, imeres: 3, sinoliki_timh: 450, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-01-10T10:00:00.000Z") },
    { id_epafis: 24, id_katafigiou: 1, hmerominia_afiksis: new Date("2024-12-05T09:00:00.000Z"), hmerominia_epistrofis: new Date("2024-12-07T09:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 6, arithmos_mi_melwn: 1, atoma: 7, imeres: 2, sinoliki_timh: 560, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2024-11-25T09:00:00.000Z") },
    { id_epafis: 25, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-04-01T14:00:00.000Z"), hmerominia_epistrofis: new Date("2025-04-06T14:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 8, arithmos_mi_melwn: 4, atoma: 12, imeres: 5, sinoliki_timh: 1200, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-15T14:00:00.000Z") },
    { id_epafis: 26, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-02-28T08:00:00.000Z"), hmerominia_epistrofis: new Date("2025-03-02T08:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 5, arithmos_mi_melwn: 0, atoma: 5, imeres: 2, sinoliki_timh: 400, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-02-18T08:00:00.000Z") },
    { id_epafis: 27, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-01-15T11:00:00.000Z"), hmerominia_epistrofis: new Date("2025-01-17T11:00:00.000Z"), ypoloipo: 50, arithmos_melwn: 4, arithmos_mi_melwn: 1, atoma: 5, imeres: 2, sinoliki_timh: 400, eksoterikos_xoros: "Όχι", hmerominia_akirosis: new Date("2025-01-13T11:00:00.000Z"), poso_epistrofis: 400, hmerominia_kratisis: new Date("2025-01-01T11:00:00.000Z") },
    { id_epafis: 28, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-04-18T13:00:00.000Z"), hmerominia_epistrofis: new Date("2025-04-20T13:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 7, arithmos_mi_melwn: 2, atoma: 9, imeres: 2, sinoliki_timh: 720, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-04-05T13:00:00.000Z") },
    { id_epafis: 29, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-03-11T10:00:00.000Z"), hmerominia_epistrofis: new Date("2025-03-13T10:00:00.000Z"), ypoloipo: 0, arithmos_melwn: 6, arithmos_mi_melwn: 2, atoma: 8, imeres: 2, sinoliki_timh: 640, eksoterikos_xoros: "Όχι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-03-01T10:00:00.000Z") },
    { id_epafis: 30, id_katafigiou: 1, hmerominia_afiksis: new Date("2025-04-25T15:00:00.000Z"), hmerominia_epistrofis: new Date("2025-04-28T15:00:00.000Z"), ypoloipo: 150, arithmos_melwn: 4, arithmos_mi_melwn: 3, atoma: 7, imeres: 3, sinoliki_timh: 600, eksoterikos_xoros: "Ναι", hmerominia_akirosis: null, poso_epistrofis: 0, hmerominia_kratisis: new Date("2025-04-10T15:00:00.000Z") }
    ]
  });

 // Updated daneizetai creation with quantity field
await prisma.daneizetai.createMany({
  data: [
    { 
      id_epafis: 7, 
      id_eksoplismou: 1, 
      hmerominia_daneismou: new Date("2024-01-22"), 
      hmerominia_epistrofis: new Date("2024-01-30"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 1 // Borrowed 1 climbing rope
    },
    { 
      id_epafis: 8, 
      id_eksoplismou: 1, 
      hmerominia_daneismou: new Date("2024-02-01"), 
      hmerominia_epistrofis: new Date("2024-02-05"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 2 // Borrowed 2 climbing ropes 
    },
    { 
      id_epafis: 9, 
      id_eksoplismou: 2, 
      hmerominia_daneismou: new Date("2024-02-12"), 
      hmerominia_epistrofis: new Date("2024-02-20"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 3 // Borrowed 3 backpacks
    },
    { 
      id_epafis: 10, 
      id_eksoplismou: 3, 
      hmerominia_daneismou: new Date("2024-04-01"), 
      hmerominia_epistrofis: new Date("2024-04-07"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 1 // Borrowed 1 ice axe
    },
    { 
      id_epafis: 11, 
      id_eksoplismou: 3, 
      hmerominia_daneismou: new Date("2024-04-10"), 
      hmerominia_epistrofis: new Date("2024-04-15"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 1 // Borrowed 1 ice axe
    },
    { 
      id_epafis: 12, 
      id_eksoplismou: 4, 
      hmerominia_daneismou: new Date("2024-02-01"), 
      hmerominia_epistrofis: new Date("2024-02-05"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 2 // Borrowed 2 diving masks
    },
    { 
      id_epafis: 13, 
      id_eksoplismou: 5, 
      hmerominia_daneismou: new Date("2024-03-20"), 
      hmerominia_epistrofis: new Date("2024-03-30"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 1 // Borrowed 1 bicycle
    },
    { 
      id_epafis: 14, 
      id_eksoplismou: 5, 
      hmerominia_daneismou: new Date("2024-04-01"), 
      hmerominia_epistrofis: null, 
      katastasi_daneismou: "Σε εκκρεμότητα",
      quantity: 1 // Currently borrowing 1 bicycle
    },
    { 
      id_epafis: 15, 
      id_eksoplismou: 6, 
      hmerominia_daneismou: new Date("2024-03-20"), 
      hmerominia_epistrofis: new Date("2024-03-25"), 
      katastasi_daneismou: "Επιστράφηκε",
      quantity: 5 // Borrowed 5 soap bars
    }
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
      { id_sindromiti: 1, id_sindromis: 1, hmerominia_pliromis: new Date("2025-06-04") },
      { id_sindromiti: 2, id_sindromis: 2, hmerominia_pliromis: new Date("2025-06-10") },
      { id_sindromiti: 3, id_sindromis: 3, hmerominia_pliromis: new Date("2024-10-29") },
      { id_sindromiti: 4, id_sindromis: 4, hmerominia_pliromis: new Date("2024-08-26") },
      { id_sindromiti: 5, id_sindromis: 5, hmerominia_pliromis: new Date("2024-05-11") },
      { id_sindromiti: 6, id_sindromis: 6, hmerominia_pliromis: new Date("2025-06-07") },
      { id_sindromiti: 7, id_sindromis: 7, hmerominia_pliromis: new Date("2025-06-10") },
      { id_sindromiti: 8, id_sindromis: 8, hmerominia_pliromis: new Date("2022-06-21") },
      { id_sindromiti: 9, id_sindromis: 9, hmerominia_pliromis: new Date("2023-04-03") },
      { id_sindromiti: 10, id_sindromis: 10, hmerominia_pliromis: new Date("2024-02-15") },
      { id_sindromiti: 11, id_sindromis: 11, hmerominia_pliromis: new Date("2025-03-15") },
      { id_sindromiti: 12, id_sindromis: 12, hmerominia_pliromis: new Date("2024-05-13") },
      { id_sindromiti: 13, id_sindromis: 13, hmerominia_pliromis: new Date("2025-04-07") },
      { id_sindromiti: 14, id_sindromis: 14, hmerominia_pliromis: new Date("2024-08-24") },
      { id_sindromiti: 15, id_sindromis: 15, hmerominia_pliromis: new Date("2024-04-15") },
      { id_sindromiti: 16, id_sindromis: 16, hmerominia_pliromis: new Date("2025-04-06") },
      { id_sindromiti: 17, id_sindromis: 17, hmerominia_pliromis: new Date("2025-05-29") },
      { id_sindromiti: 18, id_sindromis: 18, hmerominia_pliromis: new Date("2025-06-18") },
      { id_sindromiti: 19, id_sindromis: 19, hmerominia_pliromis: new Date("2025-04-11") },
      { id_sindromiti: 20, id_sindromis: 20, hmerominia_pliromis: new Date("2025-04-17") },
      { id_sindromiti: 21, id_sindromis: 21, hmerominia_pliromis: new Date("2025-02-22") },
      { id_sindromiti: 22, id_sindromis: 22, hmerominia_pliromis: new Date("2025-05-26") },
      { id_sindromiti: 23, id_sindromis: 23, hmerominia_pliromis: new Date("2025-04-13") },
      { id_sindromiti: 24, id_sindromis: 24, hmerominia_pliromis: new Date("2025-01-09") },
      { id_sindromiti: 25, id_sindromis: 25, hmerominia_pliromis: new Date("2025-01-23") }
    ]
  });

 await prisma.agones.createMany({
  data: [
    { id_athlimatos: 1, onoma: "Ορειβατικός Αγώνας Βουνού", perigrafi: "Ορειβατικός αγώνας σε ορεινό μονοπάτι", hmerominia: new Date("2023-01-01") },
    { id_athlimatos: 2, onoma: "Αναρρίχηση Βράχου", perigrafi: "Αναρρίχηση σε φυσικό βράχο μεσαίας δυσκολίας", hmerominia: new Date("2023-01-31") },
    { id_athlimatos: 2, onoma: "Τεχνική Αναρρίχηση", perigrafi: "Διαγωνισμός τεχνικής αναρρίχησης με σχοινιά", hmerominia: new Date("2023-03-02") },
    { id_athlimatos: 3, onoma: "Αγώνας Κατάβασης Σκι", perigrafi: "Αγώνας κατάβασης σε χιονισμένη πίστα", hmerominia: new Date("2023-04-01") },
    { id_athlimatos: 2, onoma: "Αναρρίχηση με Χρονόμετρο", perigrafi: "Αναρριχητικός αγώνας με χρονικό όριο", hmerominia: new Date("2023-05-01") },
    { id_athlimatos: 1, onoma: "Ορεινή Ανάβαση Αντοχής", perigrafi: "Ορειβασία με διαδρομή μεγάλης απόστασης", hmerominia: new Date("2023-05-31") },
    { id_athlimatos: 1, onoma: "Ανάβαση Κορυφής", perigrafi: "Αγώνας ανάβασης σε υψηλή κορυφή", hmerominia: new Date("2023-06-30") },
    { id_athlimatos: 2, onoma: "Bouldering Challenge", perigrafi: "Αγώνας bouldering με τεχνικές προκλήσεις", hmerominia: new Date("2023-07-30") },
    { id_athlimatos: 1, onoma: "Αγώνας Ορεινής Πεζοπορίας", perigrafi: "Πεζοπορικός αγώνας αντοχής", hmerominia: new Date("2023-08-29") },
    { id_athlimatos: 2, onoma: "Αναρρίχηση σε Τεχνητή Πίστα", perigrafi: "Διαγωνισμός αναρρίχησης σε τεχνηλή πίστα", hmerominia: new Date("2023-09-28") }
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