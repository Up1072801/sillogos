const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
    for (let i = 0; i < 100; i++) {
      // Δημιουργία επαφής
      const epafes = await prisma.epafes.create({
        data: {
          onoma: faker.person.firstName(),
          epitheto: faker.person.lastName(),
          patronimo: faker.person.middleName(),
          email: faker.internet.email(),
          idiotita: faker.word.noun(),
          tilefono: BigInt(faker.number.int({ min: 1000000000, max: 9999999999 })),        },
      });
  
      // Τυχαία επιλογή αν η επαφή θα είναι Εσωτερικό ή Εξωτερικό Μέλος
      const isEsoterikoMelos = faker.datatype.boolean();
  
      if (isEsoterikoMelos) {
        // Δημιουργία Εσωτερικού Μέλους
        const esoterikoMelos = await prisma.esoterikoMelos.create({
          data: {
            id_epafis: epafes.id_epafis,
            hmerominia_gennhshs: faker.date.past(),
            patronimo: faker.person.middleName(),
            odos: faker.location.streetAddress(),
            tk: faker.number.int({ min: 10000, max: 99999 }),
            arithmos_mitroou: faker.number.int({ min: 100000, max: 999999 }),
          },
        });
  
        // Τυχαία επιλογή αν το Εσωτερικό Μέλος θα είναι Αθλητής ή Συνδρομητής
        const isAthlitis = faker.datatype.boolean();
  
        if (isAthlitis) {
          await prisma.athlitis.create({
            data: {
              id_es_melous: esoterikoMelos.id_es_melous,
              arithmos_deltiou: faker.number.int({ min: 1000, max: 9999 }),
              hmerominia_enarksis_deltiou: faker.date.past(),
              hmerominia_liksis_deltiou: faker.date.future(),
            },
          });
        } else {
          await prisma.sindromitis.create({
            data: {
              id_es_melous: esoterikoMelos.id_es_melous,
            },
          });
        }
      } else {
        // Δημιουργία Εξωτερικού Μέλους
        await prisma.eksoterikoMelos.create({
          data: {
            id_epafis: epafes.id_epafis,
            onoma_sillogou: faker.company.name(),
            arithmos_mitroou: faker.number.int({ min: 100000, max: 999999 }),
          },
        });
    }
  
      // Δημιουργία 1 εγγραφής στον πίνακα Ekpaideutis για κάθε Epafes
      await prisma.ekpaideutis.create({
        data: {
          id_epafis: epafes.id_epafis,
          epipedo: faker.word.noun(),
          klados: faker.word.noun(),
        },
      });
    }

  // Δημιουργία 5 εγγραφών στον πίνακα VathmosDiskolias
  for (let i = 0; i < 5; i++) {
    await prisma.vathmosDiskolias.create({
      data: {
        epipedo: faker.number.int({ min: 1, max: 10 }),
      },
    });
  }

  // Δημιουργία 7 εγγραφών στον πίνακα Eksormisi
  for (let i = 0; i < 7; i++) {
    await prisma.eksormisi.create({
      data: {
        proorismos: faker.location.city(),
        timi: faker.number.int({ min: 100, max: 1000 }),
        imerominia_anaxorisis: faker.date.past(),
        imerominia_afiksis: faker.date.future(),
        titlos: faker.lorem.sentence(),
      },
    });
  }

  // Δημιουργία 4 εγγραφών στον πίνακα Katafigio
  for (let i = 0; i < 4; i++) {
    await prisma.katafigio.create({
      data: {
        onoma: faker.company.name(),
        xoritikotita: faker.number.int({ min: 10, max: 100 }),
        timi_melous: faker.number.int({ min: 50, max: 200 }),
        timi_mi_melous: faker.number.int({ min: 100, max: 300 }),
      },
    });
  }

  // Δημιουργία 6 εγγραφών στον πίνακα Eksoplismos
  for (let i = 0; i < 6; i++) {
    await prisma.eksoplismos.create({
      data: {
        onoma: faker.commerce.productName(),
        xroma: faker.color.human(),
        imerominia_kataskeuis: faker.date.past(),
        megethos: faker.word.noun(),
        marka: faker.company.name(),
      },
    });
  }

  // Δημιουργία 8 εγγραφών στον πίνακα Athlima
  for (let i = 0; i < 8; i++) {
    await prisma.athlima.create({
      data: {
        onoma: faker.word.noun(),
      },
    });
  }

  // Δημιουργία 5 εγγραφών στον πίνακα EidosSindromis
  for (let i = 0; i < 5; i++) {
    await prisma.eidosSindromis.create({
      data: {
        titlos: faker.lorem.sentence(),
        timi: faker.number.int({ min: 50, max: 500 }),
      },
    });
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Sxoli
  for (let i = 0; i < 10; i++) {
    await prisma.sxoli.create({
      data: {
        timi: faker.number.int({ min: 100, max: 1000 }),
        epipedo: faker.word.noun(),
        klados: faker.word.noun(),
        etos: faker.number.int({ min: 2000, max: 2023 }),
        seira: faker.number.int({ min: 1, max: 10 }),
        hmerominia_enarksis: faker.date.past(),
        hmerominia_liksis: faker.date.future(),
        topothesia: faker.location.city(),
      },
    });
  }

  // Δημιουργία 5 εγγραφών στον πίνακα Drastiriotita
  for (let i = 0; i < 20; i++) {
    await prisma.drastiriotita.create({
      data: {
        id_eksormisis: faker.number.int({ min: 1, max: 7 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Eksormisi
        id_vathmou_diskolias: faker.number.int({ min: 1, max: 5 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα VathmosDiskolias
        ores_poreias: faker.number.int({ min: 1, max: 24 }),
        titlos: faker.lorem.sentence(),
        diafora_ipsous: faker.number.int({ min: 100, max: 1000 }),
        imerominia: faker.date.future(),
        megisto_ipsometro: faker.number.int({ min: 1000, max: 5000 }),
      },
    });
  }

  // Δημιουργία 5 εγγραφών στον πίνακα Sindromi
  for (let i = 0; i < 5; i++) {
    await prisma.sindromi.create({
      data: {
        hmerominia_enarksis: faker.date.past(),
        id_eidous_sindromis: faker.number.int({ min: 1, max: 5 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα EidosSindromis
      },
    });
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Kratisi_Katafigiou
  for (let i = 0; i < 10; i++) {
    await prisma.kratisi_Katafigiou.create({
      data: {
        id_epafis: faker.number.int({ min: 1, max: 10 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Epafes
        id_katafigiou: faker.number.int({ min: 1, max: 4 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Katafigio
        hmerominia_afiksis: faker.date.past(),
        hmerominia_epistrofis: faker.date.future(),
        ypoloipo: faker.number.int({ min: 0, max: 100 }),
        arithmos_melwn: faker.number.int({ min: 1, max: 10 }),
        arithmos_mi_melwn: faker.number.int({ min: 1, max: 10 }),
        atoma: faker.number.int({ min: 1, max: 10 }),
        imeres: faker.number.int({ min: 1, max: 30 }),
        sinoliki_timh: faker.number.int({ min: 100, max: 1000 }),
        eksoterikos_xoros: faker.location.city(),
        hmerominia_akirosis: faker.date.future(),
        poso_epistrofis: faker.number.int({ min: 0, max: 100 }),
        hmerominia_kratisis: faker.date.past(),
      },
    });
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Daneizetai
  for (let i = 0; i < 10; i++) {
    await prisma.daneizetai.create({
      data: {
        id_epafis: faker.number.int({ min: 1, max: 10 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Epafes
        id_eksoplismou: faker.number.int({ min: 1, max: 6 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Eksoplismos
        imerominia_daneismou: faker.date.past(),
        imerominia_epistrofis: faker.date.future(),
      },
    });
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Eksoflei
  for (let i = 0; i < 10; i++) {
    await prisma.eksoflei.create({
      data: {
        id_epafis: faker.number.int({ min: 1, max: 10 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Epafes
        id_kratisis: faker.number.int({ min: 1, max: 10 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Kratisi_Katafigiou
        poso: faker.number.int({ min: 100, max: 1000 }),
        hmerominia_eksoflisis: faker.date.future(),
      },
    });
  }

// Δημιουργία 10 εγγραφών στον πίνακα Ekpaideuei
for (let i = 0; i < 10; i++) {
    const id_ekpaideuti = faker.number.int({ min: 1, max: 20 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Ekpaideutis
    const id_sxolis = faker.number.int({ min: 1, max: 10 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Sxoli
  
    // Έλεγχος αν ο συνδυασμός υπάρχει ήδη
    const existingEntry = await prisma.ekpaideuei.findUnique({
      where: {
        id_ekpaideuti_id_sxolis: {
          id_ekpaideuti,
          id_sxolis,
        },
      },
    });
  
    // Δημιουργία μόνο αν δεν υπάρχει ήδη
    if (!existingEntry) {
      await prisma.ekpaideuei.create({
        data: {
          id_ekpaideuti,
          id_sxolis,
        },
      });
    }
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Simmetoxi
  for (let i = 0; i < 10; i++) {
    await prisma.simmetoxi.create({
      data: {
        id_melous: faker.number.int({ min: 1, max: 50 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα EsoterikoMelos
        id_drastiriotitas: faker.number.int({ min: 1, max: 5 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Drastiriotita
        poso_epistrofis: faker.number.int({ min: 0, max: 100 }),
        timi: faker.number.int({ min: 100, max: 1000 }),
        katastasi: faker.word.noun(),
        ypoloipo: faker.number.int({ min: 0, max: 100 }),
        hmerominia_dilosis: faker.date.past(),
        hmerominia_akirosis: faker.date.future(),
      },
    });
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Plironei
  for (let i = 0; i < 10; i++) {
    await prisma.plironei.create({
      data: {
        id_melous: faker.number.int({ min: 1, max: 50 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα EsoterikoMelos
        id_simmetoxis: faker.number.int({ min: 1, max: 10 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Simmetoxi
        imerominia_pliromis: faker.date.past(),
        poso_pliromis: faker.number.int({ min: 100, max: 1000 }),
      },
    });
  }

// Δημιουργία 10 εγγραφών στον πίνακα Exei
for (let i = 0; i < 10; i++) {
    const id_sindromiti = faker.number.int({ min: 1, max: 10 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Sindromitis
    const id_sindromis = faker.number.int({ min: 1, max: 5 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Sindromi
  
    // Έλεγχος αν ο συνδυασμός υπάρχει ήδη
    const existingEntry = await prisma.exei.findUnique({
      where: {
        id_sindromiti_id_sindromis: {
          id_sindromiti,
          id_sindromis,
        },
      },
    });
  
    // Δημιουργία μόνο αν δεν υπάρχει ήδη
    if (!existingEntry) {
      await prisma.exei.create({
        data: {
          id_sindromiti,
          id_sindromis,
          imerominia_pliromis: faker.date.past(),
        },
      });
    }
  }

// Δημιουργία 10 εγγραφών στον πίνακα Asxoleitai
for (let i = 0; i < 10; i++) {
    const id_athliti = faker.number.int({ min: 1, max: 15 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Athlitis
    const id_athlimatos = faker.number.int({ min: 1, max: 8 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Athlima
  
    // Έλεγχος αν ο συνδυασμός υπάρχει ήδη
    const existingEntry = await prisma.asxoleitai.findUnique({
      where: {
        id_athliti_id_athlimatos: {
          id_athliti,
          id_athlimatos,
        },
      },
    });
  
    // Δημιουργία μόνο αν δεν υπάρχει ήδη
    if (!existingEntry) {
      await prisma.asxoleitai.create({
        data: {
          id_athliti,
          id_athlimatos,
        },
      });
    }
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Agones
  for (let i = 0; i < 10; i++) {
    await prisma.agones.create({
      data: {
        id_athlimatos: faker.number.int({ min: 1, max: 8 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Athlima
        perigrafi: faker.lorem.sentence(),
        hmerominia: faker.date.future(),
        onoma: faker.word.noun(),
      },
    });
  }

// Δημιουργία 10 εγγραφών στον πίνακα Agonizetai
for (let i = 0; i < 10; i++) {
    const id_athliti = faker.number.int({ min: 1, max: 15 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Athlitis
    const id_agona = faker.number.int({ min: 1, max: 10 }); // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Agones
  
    // Έλεγχος αν ο συνδυασμός υπάρχει ήδη
    const existingEntry = await prisma.agonizetai.findUnique({
      where: {
        id_athliti_id_agona: {
          id_athliti,
          id_agona,
        },
      },
    });
  
    // Δημιουργία μόνο αν δεν υπάρχει ήδη
    if (!existingEntry) {
      await prisma.agonizetai.create({
        data: {
          id_athliti,
          id_agona,
        },
      });
    }
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Parakolouthisi
  for (let i = 0; i < 10; i++) {
    await prisma.parakolouthisi.create({
      data: {
        id_melous: faker.number.int({ min: 1, max: 50 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα EsoterikoMelos
        id_sxolis: faker.number.int({ min: 1, max: 10 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Sxoli
        poso_epistrofis: faker.number.int({ min: 0, max: 100 }),
        timi: faker.number.int({ min: 100, max: 1000 }),
        ypoloipo: faker.number.int({ min: 0, max: 100 }),
        katastasi: faker.word.noun(),
        hmerominia_dilosis: faker.date.past(),
        hmerominia_akrirosis: faker.date.future(),
      },
    });
  }

  // Δημιουργία 10 εγγραφών στον πίνακα Katavalei
  for (let i = 0; i < 10; i++) {
    await prisma.katavalei.create({
      data: {
        id_melous: faker.number.int({ min: 1, max: 50 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα EsoterikoMelos
        id_parakolouthisis: faker.number.int({ min: 1, max: 10 }), // Προσοχή: πρέπει να υπάρχουν ήδη εγγραφές στον πίνακα Parakolouthisi
        poso: faker.number.int({ min: 100, max: 1000 }),
        hmerominia_katavolhs: faker.date.past(),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });