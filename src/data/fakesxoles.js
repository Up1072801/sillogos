export const fakeSxoles = [
  {
    id: 'sxoli-1',
    onoma: "Σχολή Ορειβασίας Αρχαρίων",
    klados: "Ορειβασία",
    epipedo: "Αρχάριοι",
    timi: 250,
    etos: 2023,
    seira: 1,
    simmetoxes: 12,
    epoxi: "Άνοιξη",
    xronologia: 2023,
    kostos: 200,
    synoloEggrafon: 15,
    ekpaideutis: "Γιάννης Παπαδόπουλος",
    emailEkpaideuti: "giannis@example.com",
    phoneEkpaideuti: "2101234567",
    details: [
      { id: 'detail-1', topothesia: "Όλυμπος", imerominia_enarksis: "2023-05-01", imerominia_liksis: "2023-05-10" },
      { id: 'detail-2', topothesia: "Παρνασσός", imerominia_enarksis: "2023-06-01", imerominia_liksis: "2023-06-10" }
    ],
    participants: [
      { id: 'participant-1', name: "Γιάννης Παπαδόπουλος", email: "giannis@example.com", phone: "2101234567", payments: [{ id: 'payment-1', amount: 125, date: "2023-05-01" }] },
      { id: 'participant-2', name: "Μαρία Κωνσταντίνου", email: "maria@example.com", phone: "2107654321", payments: [{ id: 'payment-2', amount: 125, date: "2023-05-02" }] }
    ]
  },
  {
    id: 'sxoli-2',
    onoma: "Σχολή Αναρρίχησης Μέσου Επιπέδου",
    klados: "Αναρρίχηση",
    epipedo: "Μέσο",
    timi: 300,
    etos: 2023,
    seira: 2,
    simmetoxes: 10,
    epoxi: "Καλοκαίρι",
    xronologia: 2023,
    kostos: 250,
    synoloEggrafon: 12,
    ekpaideutis: "Μαρία Κωνσταντίνου",
    emailEkpaideuti: "maria@example.com",
    phoneEkpaideuti: "2107654321",
    details: [
      { id: 'detail-3', topothesia: "Μετέωρα", imerominia_enarksis: "2023-07-01", imerominia_liksis: "2023-07-10" },
      { id: 'detail-4', topothesia: "Βαράσοβα", imerominia_enarksis: "2023-08-01", imerominia_liksis: "2023-08-10" }
    ],
    participants: [
      { id: 'participant-3', name: "Κώστας Δημητρίου", email: "kostas@example.com", phone: "2103210987", payments: [{ id: 'payment-3', amount: 150, date: "2023-07-01" }] },
      { id: 'participant-4', name: "Ελένη Γεωργίου", email: "eleni@example.com", phone: "2106543210", payments: [{ id: 'payment-4', amount: 150, date: "2023-07-02" }] }
    ]
  }
];

export const fakeEkpaideutes = [
  {
    id: 'ekpaideutis-1',
    firstName: "Γιάννης",
    lastName: "Παπαδόπουλος",
    email: "giannis@example.com",
    phone: "2101234567",
    epipedo: "Αρχάριοι",
    klados: "Ορειβασία"
  },
  {
    id: 'ekpaideutis-2',
    firstName: "Μαρία",
    lastName: "Κωνσταντίνου",
    email: "maria@example.com",
    phone: "2107654321",
    epipedo: "Μέσο",
    klados: "Αναρρίχηση"
  },
  {
    id: 'ekpaideutis-3',
    firstName: "Κώστας",
    lastName: "Δημητρίου",
    email: "kostas@example.com",
    phone: "2103210987",
    epipedo: "Προχωρημένο",
    klados: "Ορειβασία"
  },
  {
    id: 'ekpaideutis-4',
    firstName: "Ελένη",
    lastName: "Γεωργίου",
    email: "eleni@example.com",
    phone: "2106543210",
    epipedo: "Μέσο",
    klados: "Αναρρίχηση"
  }
];