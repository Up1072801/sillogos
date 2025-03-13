export const fakeSxoles = [
  {
    id: '1',
    onoma: "Σχολή Ορειβασίας Αρχαρίων",
    klados: "Ορειβασία",
    epipedo: "Αρχάριοι",
    timi: 200,
    etos: 2023,
    seira: 1,
    simmetoxes: 15,
    details: [
      { topothesia: "Όλυμπος", imerominia_enarksis: "2023-05-01", imerominia_liksis: "2023-05-10" },
      { topothesia: "Παρνασσός", imerominia_enarksis: "2023-06-01", imerominia_liksis: "2023-06-10" }
    ],
    participants: [
      { id: '1', name: "Γιάννης Παπαδόπουλος", email: "giannis@example.com", phone: "2101234567", payments: [{ amount: 100, date: "2023-05-01" }] },
      { id: '2', name: "Μαρία Κωνσταντίνου", email: "maria@example.com", phone: "2107654321", payments: [{ amount: 100, date: "2023-05-02" }] }
    ]
  },
  {
    id: '2',
    onoma: "Σχολή Αναρρίχησης Μέσου Επιπέδου",
    klados: "Αναρρίχηση",
    epipedo: "Μέσο",
    timi: 300,
    etos: 2023,
    seira: 2,
    simmetoxes: 10,
    details: [
      { topothesia: "Μετέωρα", imerominia_enarksis: "2023-07-01", imerominia_liksis: "2023-07-10" },
      { topothesia: "Βαράσοβα", imerominia_enarksis: "2023-08-01", imerominia_liksis: "2023-08-10" }
    ],
    participants: [
      { id: '3', name: "Κώστας Δημητρίου", email: "kostas@example.com", phone: "2103210987", amount: "150" , date: "2023-07-01" } ,
      { id: '4', name: "Ελένη Γεωργίου", email: "eleni@example.com", phone: "2106543210", amount: "150" , date: "2023-07-02" } 
    ]
  }
];

export const fakeEkpaideutes = [
  {
    firstName: "Γιάννης",
    lastName: "Παπαδόπουλος",
    email: "giannis@example.com",
    phone: "2101234567",
    epipedo: "Αρχάριοι",
    klados: "Ορειβασία"
  },
  {
    firstName: "Μαρία",
    lastName: "Κωνσταντίνου",
    email: "maria@example.com",
    phone: "2107654321",
    epipedo: "Μέσο",
    klados: "Αναρρίχηση"
  }
];