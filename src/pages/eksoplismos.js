import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import DataTable from "../components/DataTable/DataTable";
import * as yup from "yup";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from '../utils/api';
import AddDialog from "../components/DataTable/AddDialog";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';

// Στήλες για τον πίνακα εξοπλισμού
const columns = [
  { accessorKey: "onoma", header: "Όνομα" },
  { accessorKey: "marka", header: "Μάρκα" },
  { accessorKey: "xroma", header: "Χρώμα" },
  { accessorKey: "megethos", header: "Μέγεθος" },
  { 
    accessorKey: "hmerominia_kataskeuis", 
    header: "Ημερομηνία Κατασκευής", 
    enableHiding: true,
    Cell: ({ cell }) => {
      const value = cell.getValue();
      return value ? new Date(value).toLocaleDateString('el-GR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : "-";
    }
  },
];

// Στήλες για τον πίνακα δανεισμών
const daneismoiColumns = [
  { accessorKey: "borrowerName", header: "Δανειζόμενος" },
  { accessorKey: "equipmentName", header: "Όνομα Εξοπλισμού" },
  { 
    accessorKey: "hmerominia_daneismou", 
    header: "Ημ/νία Δανεισμού",
    Cell: ({ cell }) => {
      const value = cell.getValue();
      return value ? new Date(value).toLocaleDateString("el-GR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : "-";
    }
  },
  { 
    accessorKey: "hmerominia_epistrofis", 
    header: "Ημ/νία Επιστροφής", 
    Cell: ({ cell }) => {
      const value = cell.getValue();
      return value ? new Date(value).toLocaleDateString("el-GR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : "-";
    }
  },
  // Νέα στήλη για την κατάσταση του δανεισμού
  {
    accessorKey: "status",
    header: "Κατάσταση",
    Cell: ({ row }) => {
      const today = new Date();
      const returnDate = row.original.hmerominia_epistrofis ? new Date(row.original.hmerominia_epistrofis) : null;
      const status = row.original.katastasi_daneismou || "Σε εκκρεμότητα";
      
      // Επιστραμμένοι
      if (status === "Επιστράφηκε") {
        return (
          <span style={{ color: 'green', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: 'green',
              marginRight: '5px'
            }}></span>
            Επιστράφηκε
          </span>
        );
      } 
      // Εκπρόθεσμοι
      else if (returnDate && returnDate < today && status !== "Επιστράφηκε") {
        return (
          <span style={{ color: 'red', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: 'red',
              marginRight: '5px' 
            }}></span>
            Εκπρόθεσμο
          </span>
        );
      } 
      // Ενεργοί
      else {
        return (
          <span style={{ color: 'orange', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: 'orange',
              marginRight: '5px' 
            }}></span>
            Σε εκκρεμότητα
          </span>
        );
      }
    }
  }
];

// Fields για τη φόρμα προσθήκης εξοπλισμού
const equipmentFormFields = [
  { 
    accessorKey: "onoma", 
    header: "Όνομα Εξοπλισμού", 
    validation: yup.string()
      .required("Το όνομα εξοπλισμού είναι υποχρεωτικό")
      .test('letters-only', 'Επιτρέπονται μόνο γράμματα', 
        value => !value || /^[A-Za-zΑ-Ωα-ωίϊΐόάέύϋΰήώ\s]*$/.test(value))
  },
  { 
    accessorKey: "marka", 
    header: "Μάρκα", 
    validation: yup.string()
      .test('letters-only', 'Επιτρέπονται μόνο γράμματα', 
        value => !value || /^[A-Za-zΑ-Ωα-ωίϊΐόάέύϋΰήώ\s]*$/.test(value))
  },
  { 
    accessorKey: "xroma", 
    header: "Χρώμα",
    validation: yup.string()
      .test('letters-only', 'Επιτρέπονται μόνο γράμματα', 
        value => !value || /^[A-Za-zΑ-Ωα-ωίϊΐόάέύϋΰήώ\s]*$/.test(value))
  },
  { 
    accessorKey: "megethos", 
    header: "Μέγεθος" 
  },
  { 
    accessorKey: "hmerominia_kataskeuis", 
    header: "Ημ/νία Κατασκευής", 
    type: "date" 
  }
];

// Βελτιωμένη έκδοση των πεδίων φόρμας δανεισμού
const loanFormFields = [
  { 
    accessorKey: "id_epafis", 
    header: "Δανειζόμενος", 
    type: "tableSelect",
    dataKey: "contactsList",
    validation: yup.string().required("Παρακαλώ επιλέξτε δανειζόμενο"),
    singleSelect: true,
    columns: [
      { field: "fullName", header: "Ονοματεπώνυμο" },
      { field: "email", header: "Email" },
      { field: "tilefono", header: "Τηλέφωνο" }
    ]
  },
  { 
    accessorKey: "id_eksoplismou", 
    header: "Εξοπλισμός", 
    type: "tableSelect",
    dataKey: "equipmentList",
    validation: yup.string().required("Παρακαλώ επιλέξτε εξοπλισμό"),
    singleSelect: true,
    columns: [
      { field: "onoma", header: "Όνομα" },
      { field: "marka", header: "Μάρκα" },
      { field: "xroma", header: "Χρώμα" }
    ]
  },
  { 
    accessorKey: "hmerominia_daneismou", 
    header: "Ημερομηνία Δανεισμού", 
    type: "date",
    defaultValue: new Date().toISOString().split('T')[0],
    validation: yup.date().required("Παρακαλώ επιλέξτε ημερομηνία δανεισμού")
  },
  { 
    accessorKey: "hmerominia_epistrofis", 
    header: "Ημερομηνία Επιστροφής", 
    type: "date",
    validation: yup.date().nullable()
  },
  { 
    accessorKey: "katastasi_daneismou", 
    header: "Κατάσταση Δανεισμού", 
    type: "select",
    options: [
      { value: "Σε εκκρεμότητα", label: "Σε εκκρεμότητα" },
      { value: "Επιστράφηκε", label: "Επιστράφηκε" },
      { value: "Εκπρόθεσμο", label: "Εκπρόθεσμο" }
    ],
    defaultValue: "Σε εκκρεμότητα",
    validation: yup.string().required("Η κατάσταση δανεισμού είναι υποχρεωτική")
  }
];

// Προσθέστε αυτόν τον κώδικα μετά τον ορισμό του loanFormFields

// Πεδία για την επεξεργασία δανεισμού - μόνο οι ημερομηνίες
const editLoanFormFields = [
  { 
    accessorKey: "hmerominia_daneismou", 
    header: "Ημερομηνία Δανεισμού", 
    type: "date",
    validation: yup.date().required("Παρακαλώ επιλέξτε ημερομηνία δανεισμού")
  },
  { 
    accessorKey: "hmerominia_epistrofis", 
    header: "Ημερομηνία Επιστροφής", 
    type: "date",
    validation: yup.date().nullable()
  },
  { 
    accessorKey: "katastasi_daneismou", 
    header: "Κατάσταση Δανεισμού", 
    type: "select",
    options: [
      { value: "Σε εκκρεμότητα", label: "Σε εκκρεμότητα" },
      { value: "Επιστράφηκε", label: "Επιστράφηκε" },
      { value: "Εκπρόθεσμο", label: "Εκπρόθεσμο" }
    ],
    validation: yup.string().required("Η κατάσταση δανεισμού είναι υποχρεωτική")
  }
];

export default function Eksoplismos() {
  const [eksoplismosData, setEksoplismosData] = useState([]);
  const [daneismoiData, setDaneismoiData] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addEquipmentDialogOpen, setAddEquipmentDialogOpen] = useState(false);
  const [addLoanDialogOpen, setAddLoanDialogOpen] = useState(false);
  const [editLoanData, setEditLoanData] = useState(null);
  const [editLoanDialogOpen, setEditLoanDialogOpen] = useState(false);
  // Προσθήκη state για το dialog επεξεργασίας εξοπλισμού
  const [editEquipmentData, setEditEquipmentData] = useState(null);
  const [editEquipmentDialogOpen, setEditEquipmentDialogOpen] = useState(false);
  // Νέα states για τα φίλτρα δανεισμών
  const [loanStatusFilter, setLoanStatusFilter] = useState('all'); // 'all', 'active', 'returned', 'future', 'overdue'
  const [filteredLoansData, setFilteredLoansData] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]); // Νέα state για διαθέσιμο εξοπλισμό

  // Βελτιωμένη επεξεργασία δεδομένων στο useEffect
useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      
      // Φόρτωση εξοπλισμού
      const eksoplismosResponse = await api.get("/eksoplismos");
      
      // Φόρτωση δανεισμών
      const daneismoiResponse = await api.get("/eksoplismos/daneismoi");

  
      // Επεξεργασία δεδομένων εξοπλισμού και προσθήκη δανεισμών για κάθε εξοπλισμό
      const processedEquipment = eksoplismosResponse.data.map(item => {
        // Διασφάλιση ότι το πεδίο daneizetai υπάρχει πάντα
        const itemWithDaneizetai = {
          ...item,
          id: item.id_eksoplismou, // Διασφάλιση συνέπειας ID
          // Αν το daneizetai δεν υπάρχει ή είναι κενό από το API, συνδέουμε με τους δανεισμούς από το ξεχωριστό endpoint
          daneizetai: item.daneizetai || daneismoiResponse.data.filter(loan => 
            parseInt(loan.id_eksoplismou) === parseInt(item.id_eksoplismou)
          ).map(loan => ({
            id: loan.id,
            borrowerName: loan.borrowerName || `${loan.epafes?.onoma || ''} ${loan.epafes?.epitheto || ''}`.trim() || "Άγνωστο",
            hmerominia_daneismou: loan.hmerominia_daneismou,
            hmerominia_epistrofis: loan.hmerominia_epistrofis
          }))
        };
        
        // Debug log
        
        return itemWithDaneizetai;
      });
      
      setEksoplismosData(processedEquipment);
      
      // Βελτιωμένη επεξεργασία δεδομένων δανεισμών
const processedLoans = daneismoiResponse.data.map(item => {
  // Διασφάλιση ότι όλα τα απαραίτητα πεδία είναι παρόντα
  const loan = {
    ...item,
    id: item.id,
    id_epafis: item.id_epafis,
    id_eksoplismou: item.id_eksoplismou,
    // Προσεκτικός υπολογισμός borrowerName από το πεδίο epafes
    borrowerName: item.epafes 
      ? `${item.epafes.onoma || ''} ${item.epafes.epitheto || ''}`.trim() 
      : (item.borrowerName || "Άγνωστο"),
    // Προσεκτικός υπολογισμός equipmentName από το πεδίο eksoplismos
    equipmentName: item.eksoplismos
      ? item.eksoplismos.onoma
      : (item.equipmentName || "Άγνωστο")
  };
  
  // Διασφάλιση ότι τα αντικείμενα συσχέτισης διατηρούνται
  if (item.epafes) {
    loan.epafes = item.epafes;
  }
  
  if (item.eksoplismos) {
    loan.eksoplismos = item.eksoplismos;
  }
  
  return loan;
});

      setDaneismoiData(processedLoans);
      
      // Φόρτωση επαφών
      const contactsResponse = await api.get("/Repafes");
      const processedContacts = contactsResponse.data.map(contact => ({
        id: contact.id_epafis,
        id_epafis: contact.id_epafis,
        fullName: `${contact.onoma || ''} ${contact.epitheto || ''}`.trim(),
        onoma: contact.onoma,
        epitheto: contact.epitheto,
        email: contact.email,
        tilefono: contact.tilefono
      }));
      
      setContactsList(processedContacts);
      setLoading(false);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      alert("Σφάλμα κατά τη φόρτωση των δεδομένων. Παρακαλώ προσπαθήστε ξανά.");
      setLoading(false);
    }
  }
  
  fetchData();
}, []);

// Προσθήκη συνάρτησης μετά το useEffect για ενίσχυση των δεδομένων δανεισμού
const enhanceLoanData = async () => {
  if (daneismoiData.length === 0 || contactsList.length === 0 || eksoplismosData.length === 0) return;
  
  
  // Ενημέρωση των δεδομένων δανεισμού με πλήρη στοιχεία επαφών και εξοπλισμού
  const enhanced = daneismoiData.map(loan => {
    const enhancedLoan = { ...loan };
    
    // Προσθήκη πλήρους επαφής αν δεν υπάρχει
    if (!enhancedLoan.epafes && enhancedLoan.id_epafis) {
      enhancedLoan.epafes = contactsList.find(c => 
        parseInt(c.id_epafis) === parseInt(enhancedLoan.id_epafis)
      );
    }
    
    // Προσθήκη πλήρους εξοπλισμού αν δεν υπάρχει
    if (!enhancedLoan.eksoplismos && enhancedLoan.id_eksoplismou) {
      enhancedLoan.eksoplismos = eksoplismosData.find(e => 
        parseInt(e.id_eksoplismou) === parseInt(enhancedLoan.id_eksoplismou)
      );
    }
    
    return enhancedLoan;
  });
  
  
  // Έλεγχος αν υπάρχει πραγματική αλλαγή για αποφυγή άσκοπων ενημερώσεων
  const beforeCount = daneismoiData.filter(d => d.epafes && d.eksoplismos).length;
  const afterCount = enhanced.filter(d => d.epafes && d.eksoplismos).length;
  
  if (afterCount > beforeCount) {
    setDaneismoiData(enhanced);
  } else {
  }
};

// Αντικαταστήστε το υπάρχον useEffect που καλεί το enhanceLoanData με αυτό:
const dataEnhancedRef = React.useRef(false);

useEffect(() => {
  if (daneismoiData.length > 0 && contactsList.length > 0 && eksoplismosData.length > 0 && !dataEnhancedRef.current) {
    dataEnhancedRef.current = true;  // Σημειώνουμε ότι τα δεδομένα έχουν ήδη ενισχυθεί
    enhanceLoanData();
  }
}, [daneismoiData, contactsList, eksoplismosData]);

// Συνάρτηση φιλτραρίσματος δανεισμών με βάση την κατάσταση
const filterLoansByStatus = (loans, filter) => {
  if (!filter || filter === 'all') return loans;
  
  const today = new Date();
  
  return loans.filter(loan => {
    const returnDate = loan.hmerominia_epistrofis ? new Date(loan.hmerominia_epistrofis) : null;
    
    switch (filter) {
      case 'active':
        // Ενεργοί: Έχουν ημερομηνία επιστροφής που δεν έχει περάσει και δεν έχουν επιστραφεί
        return (loan.katastasi_daneismou === "Σε εκκρεμότητα" && 
                (!returnDate || returnDate >= today));
      
      case 'overdue':
        // Εκπρόθεσμοι: Έχει περάσει η ημερομηνία επιστροφής και δεν έχουν επιστραφεί
        return (returnDate && returnDate < today && 
                loan.katastasi_daneismou !== "Επιστράφηκε");
      
      case 'returned':
        // Επιστραμμένοι: Έχουν κατάσταση "Επιστράφηκε"
        return loan.katastasi_daneismou === "Επιστράφηκε";
      
      default:
        return true;
    }
  });
};

// Αντικαταστήστε την υπάρχουσα συνάρτηση processLoanData (γύρω στη γραμμή 385)
const processLoanData = (loan) => {
  const today = new Date();
  
  // Αρχικοποίηση μεταβλητών
  const borrowDate = loan.hmerominia_daneismou ? new Date(loan.hmerominia_daneismou) : null;
  const returnDate = loan.hmerominia_epistrofis ? new Date(loan.hmerominia_epistrofis) : null;
  let status = loan.katastasi_daneismou || 'unknown';
  let expectedReturnDate = null;
  
  // Αν έχει κατάσταση "Επιστράφηκε", διατηρούμε αυτή την κατάσταση
  if (status === "Επιστράφηκε") {
    // Διατηρούμε την κατάσταση ως "Επιστράφηκε"
  }
  // Αυτόματο "Εκπρόθεσμο" αν έχει περάσει η ημερομηνία επιστροφής και δεν έχει επιστραφεί
  else if (returnDate && returnDate < today) {
    status = "Εκπρόθεσμο";
    // Ενημέρωση του backend
    updateLoanStatusToOverdue(loan.id);
  }
  // Αλλιώς είναι "Σε εκκρεμότητα" (ενεργός)
  else {
    status = "Σε εκκρεμότητα";
  }
  
  return {
    ...loan,
    status
  };
};

// Νέα συνάρτηση για ενημέρωση του backend για εκπρόθεσμους δανεισμούς
const updateLoanStatusToOverdue = async (loanId) => {
  try {
    await api.put(`/eksoplismos/daneismos/${loanId}/status`, {
      katastasi_daneismou: "Εκπρόθεσμο"
    });
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση κατάστασης δανεισμού:", error);
  }
};

// Προσθήκη useEffect για επεξεργασία και φιλτράρισμα δανεισμών (μετά τα υπάρχοντα useEffect)
useEffect(() => {
  if (daneismoiData.length > 0) {
    // Επεξεργασία για προσθήκη κατάστασης και αναμενόμενης επιστροφής
    const processedLoans = daneismoiData.map(processLoanData);
    
    // Εφαρμογή φίλτρου
    const filtered = filterLoansByStatus(processedLoans, loanStatusFilter);
    
    setFilteredLoansData(filtered);
  } else {
    setFilteredLoansData([]);
  }
}, [daneismoiData, loanStatusFilter]);

  // Χειρισμός προσθήκης νέου εξοπλισμού
  const handleAddEquipment = async (newEquipment) => {
    try {
      const response = await api.post("/eksoplismos", newEquipment);
      setEksoplismosData(prevData => [...prevData, {
        ...response.data,
        id: response.data.id_eksoplismou
      }]);
      setAddEquipmentDialogOpen(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη εξοπλισμού:", error);
      alert("Σφάλμα κατά την προσθήκη εξοπλισμού.");
    }
  };

  // Βελτιωμένη έκδοση του handleAddLoan
const handleAddLoan = async (newLoan) => {
  try {
    // Διασφάλιση ότι έχουμε έγκυρα IDs (είτε από array είτε από μεμονωμένες τιμές)
    const id_epafis = Array.isArray(newLoan.id_epafis) 
      ? newLoan.id_epafis[0] 
      : newLoan.id_epafis;
    
    const id_eksoplismou = Array.isArray(newLoan.id_eksoplismou) 
      ? newLoan.id_eksoplismou[0] 
      : newLoan.id_eksoplismou;
    
    if (!id_epafis || !id_eksoplismou) {
      throw new Error("Λείπουν απαιτούμενα πεδία: Δανειζόμενος ή Εξοπλισμός");
    }
    
    
    // Αναζήτηση πλήρων δεδομένων επαφών και εξοπλισμού για καλύτερη ενημέρωση UI
    const borrower = contactsList.find(c => parseInt(c.id_epafis) === parseInt(id_epafis));
    const equipment = eksoplismosData.find(e => parseInt(e.id_eksoplismou) === parseInt(id_eksoplismou));
    
    if (!borrower) {
      console.warn(`Δεν βρέθηκε επαφή με ID: ${id_epafis}`);
    }
    
    if (!equipment) {
      console.warn(`Δεν βρέθηκε εξοπλισμός με ID: ${id_eksoplismou}`);
    }
    
    // Δημιουργία αντικειμένου με τα δεδομένα που θα αποσταλούν
    const formattedLoan = {
      id_epafis: parseInt(id_epafis),
      id_eksoplismou: parseInt(id_eksoplismou),
      hmerominia_daneismou: newLoan.hmerominia_daneismou || new Date().toISOString().split('T')[0],
      hmerominia_epistrofis: newLoan.hmerominia_epistrofis || null // Διασφάλιση ότι είναι null όταν δεν υπάρχει
    };
    
    
    const response = await api.post("/eksoplismos/daneismos", formattedLoan);
    
    // Δημιουργία πλήρους αντικειμένου με όλα τα απαραίτητα δεδομένα
    const newDaneismosEntry = {
      ...response.data,
      id: response.data.id,
      id_epafis: parseInt(id_epafis),
      id_eksoplismou: parseInt(id_eksoplismou),
      borrowerName: borrower?.fullName || `${borrower?.onoma || ''} ${borrower?.epitheto || ''}`.trim() || "Άγνωστο",
      equipmentName: equipment?.onoma || "Άγνωστο",
      hmerominia_daneismou: response.data.hmerominia_daneismou,
      hmerominia_epistrofis: response.data.hmerominia_epistrofis,
      katastasi_daneismou: response.data.katastasi_daneismou || "Σε εκκρεμότητα",
      // Δημιουργία πλήρους αντικειμένου epafes αν δεν υπάρχει στην απάντηση
      epafes: response.data.epafes || borrower || {
        id_epafis: parseInt(id_epafis),
        onoma: borrower?.onoma || "",
        epitheto: borrower?.epitheto || "",
        email: borrower?.email || "",
        tilefono: borrower?.tilefono || ""
      },
      // Δημιουργία πλήρους αντικειμένου eksoplismos αν δεν υπάρχει στην απάντηση
      eksoplismos: response.data.eksoplismos || equipment || {
        id_eksoplismou: parseInt(id_eksoplismou),
        onoma: equipment?.onoma || ""
      }
    };
    
    // Επεξεργασία των δεδομένων για να προστεθεί η κατάσταση
    const processedNewLoan = processLoanData(newDaneismosEntry);
    
    // Ενημέρωση της κατάστασης δανεισμών με τον νέο δανεισμό
    const updatedDaneismoiData = [...daneismoiData, processedNewLoan];
    setDaneismoiData(updatedDaneismoiData);
    
    // Ενημέρωση του πίνακα εξοπλισμού με τον νέο δανεισμό
    const updatedEksoplismosData = eksoplismosData.map(item => 
      parseInt(item.id_eksoplismou) === parseInt(id_eksoplismou)
        ? {
            ...item,
            daneizetai: [
              ...(item.daneizetai || []),
              {
                id: newDaneismosEntry.id,
                id_epafis: parseInt(id_epafis),
                id_eksoplismou: parseInt(id_eksoplismou),
                hmerominia_daneismou: newDaneismosEntry.hmerominia_daneismou,
                hmerominia_epistrofis: newDaneismosEntry.hmerominia_epistrofis,
                katastasi_daneismou: newDaneismosEntry.katastasi_daneismou,
                borrowerName: newDaneismosEntry.borrowerName,
                status: processedNewLoan.status
              }
            ]
          }
        : item
    );
    setEksoplismosData(updatedEksoplismosData);
    
    // Άμεση ενημέρωση των φιλτραρισμένων δεδομένων
    const processedLoans = updatedDaneismoiData.map(processLoanData);
    const filtered = filterLoansByStatus(processedLoans, loanStatusFilter);
    setFilteredLoansData(filtered);
    
    // Κλείσιμο του dialog
    setAddLoanDialogOpen(false);
    
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη δανεισμού:", error);
    alert(`Σφάλμα κατά την προσθήκη δανεισμού: ${error.message}`);
  }
};

  // Βελτιωμένη έκδοση του handleEditLoan
const handleEditLoan = async (editedLoan) => {
  try {
    if (!editLoanData || !editLoanData.id) {
      throw new Error("Δεν υπάρχουν δεδομένα για επεξεργασία");
    }

    // Χρησιμοποιούμε μόνο τα υπάρχοντα IDs από το editLoanData
    const id_epafis = editLoanData.id_epafis;
    const id_eksoplismou = editLoanData.id_eksoplismou;
    
    if (!id_epafis || !id_eksoplismou) {
      throw new Error("Λείπουν απαιτούμενα πεδία: Δανειζόμενος ή Εξοπλισμός");
    }
    
    const formattedLoan = {
      id_epafis: parseInt(id_epafis),
      id_eksoplismou: parseInt(id_eksoplismou),
      hmerominia_daneismou: editedLoan.hmerominia_daneismou || null,
      hmerominia_epistrofis: editedLoan.hmerominia_epistrofis || null,
      katastasi_daneismou: editedLoan.katastasi_daneismou // Προσθήκη της κατάστασης στα δεδομένα που αποστέλλονται
    };
    
    
    const response = await api.put(`/eksoplismos/daneismos/${editLoanData.id}`, formattedLoan);
    
    // Βρίσκουμε τις πλήρεις λεπτομέρειες για την επαφή και τον εξοπλισμό (διατήρηση υπαρχόντων)
    const borrower = contactsList.find(c => parseInt(c.id_epafis) === parseInt(id_epafis));
    const equipment = eksoplismosData.find(e => parseInt(e.id_eksoplismou) === parseInt(id_eksoplismou));
    
    // Ενημέρωση του πίνακα δανεισμών
    const updatedDaneismoiData = daneismoiData.map(item => 
      item.id === editLoanData.id 
        ? {
            ...item,
            hmerominia_daneismou: response.data.hmerominia_daneismou || editedLoan.hmerominia_daneismou,
            hmerominia_epistrofis: response.data.hmerominia_epistrofis || editedLoan.hmerominia_epistrofis,
            katastasi_daneismou: response.data.katastasi_daneismou || editedLoan.katastasi_daneismou
          } 
        : item
    );
    setDaneismoiData(updatedDaneismoiData);
    
    // Ενημέρωση των δανεισμών στον πίνακα εξοπλισμού
    const updatedEksoplismosData = eksoplismosData.map(item => {
      if (parseInt(item.id_eksoplismou) === parseInt(id_eksoplismou)) {
        return {
          ...item,
          daneizetai: (item.daneizetai || []).map(d => 
            d.id === editLoanData.id 
              ? {
                  ...d,
                  hmerominia_daneismou: response.data.hmerominia_daneismou || editedLoan.hmerominia_daneismou,
                  hmerominia_epistrofis: response.data.hmerominia_epistrofis || editedLoan.hmerominia_epistrofis,
                  katastasi_daneismou: response.data.katastasi_daneismou || editedLoan.katastasi_daneismou
                } 
              : d
          )
        };
      }
      return item;
    });
    setEksoplismosData(updatedEksoplismosData);
    
    // Άμεση ενημέρωση των φιλτραρισμένων δεδομένων
    const processedLoans = updatedDaneismoiData.map(processLoanData);
    const filtered = filterLoansByStatus(processedLoans, loanStatusFilter);
    setFilteredLoansData(filtered);
    
    setEditLoanDialogOpen(false);
    setEditLoanData(null);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία δανεισμού:", error);
    alert("Σφάλμα κατά την επεξεργασία δανεισμού: " + error.message);
  }
};

  // Αντικαταστήστε την υπάρχουσα συνάρτηση handleEditLoanClick
const handleEditLoanClick = (loan) => {
  
  // Διασφάλιση των σωστων μορφών ημερομηνιών
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? "" : date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e);
      return "";
    }
  };
  
  // Βεβαιωνόμαστε ότι τα IDs είναι στη σωστή μορφή για το tableSelect
  const id_epafis = loan.id_epafis?.toString() || "";
  const id_eksoplismou = loan.id_eksoplismou?.toString() || "";
  
  // Προετοιμασία των δεδομένων για το dialog
  const loanData = {
    id: loan.id,
    id_epafis: id_epafis,
    id_eksoplismou: id_eksoplismou,
    hmerominia_daneismou: formatDate(loan.hmerominia_daneismou),
    hmerominia_epistrofis: formatDate(loan.hmerominia_epistrofis),
    katastasi_daneismou: loan.katastasi_daneismou || "Σε εκκρεμότητα" // Προσθήκη της κατάστασης δανεισμού
  };
  
  
  setEditLoanData(loanData);
  setEditLoanDialogOpen(true);
};

  // Βελτιωμένος χειριστής επεξεργασίας εξοπλισμού
const handleEditEquipmentClick = (equipment) => {
  
  // Μορφοποίηση ημερομηνίας (διασφαλίζει σωστή μορφή για το input)
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? "" : date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e);
      return "";
    }
  };
  
  // Βεβαιωνόμαστε ότι έχουμε πάντα ένα ID
  const equipmentId = equipment.id_eksoplismou || equipment.id;
  
  if (!equipmentId) {
    console.error("Δεν βρέθηκε ID εξοπλισμού:", equipment);
    alert("Σφάλμα: Δεν βρέθηκε αναγνωριστικό για τον εξοπλισμό.");
    return;
  }
  
  setEditEquipmentData({
    id: equipmentId,
    id_eksoplismou: equipmentId, // Αποθηκεύουμε το ID και στα δύο πεδία για συμβατότητα
    onoma: equipment.onoma || "",
    marka: equipment.marka || "",
    xroma: equipment.xroma || "",
    megethos: equipment.megethos || "",
    hmerominia_kataskeuis: formatDate(equipment.hmerominia_kataskeuis)
  });
  
  setEditEquipmentDialogOpen(true);
};

// Χειριστής αποθήκευσης επεξεργασίας εξοπλισμού - διορθωμένη έκδοση
const handleEditEquipment = async (editedEquipment) => {
  try {
    // Βεβαιωνόμαστε ότι έχουμε ένα έγκυρο ID για το URL
    const equipmentId = editedEquipment.id_eksoplismou || editedEquipment.id || editEquipmentData?.id_eksoplismou || editEquipmentData?.id;
    
    if (!equipmentId) {
      throw new Error("Δεν βρέθηκε ID εξοπλισμού για επεξεργασία");
    }

    
    // Δημιουργία αντικειμένου με τα δεδομένα που θα αποσταλούν
    const dataToSend = {
      ...editedEquipment,
      id_eksoplismou: equipmentId, // Βεβαιωνόμαστε ότι το ID περιλαμβάνεται στα δεδομένα
      id: equipmentId
    };
    
    const response = await api.put(
      `/eksoplismos/${equipmentId}`,
      dataToSend
    );
    
    setEksoplismosData(prevData => 
      prevData.map(item => 
        (item.id === equipmentId || item.id_eksoplismou === equipmentId) 
          ? {
              ...response.data,
              id: response.data.id_eksoplismou || response.data.id,  // Διασφάλιση συμβατότητας ID
              id_eksoplismou: response.data.id_eksoplismou || response.data.id // Διπλό ID για συνέπεια
            } 
          : item
      )
    );
    
    setEditEquipmentDialogOpen(false);
    setEditEquipmentData(null);
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση του εξοπλισμού:", error);
    alert(`Σφάλμα κατά την ενημέρωση του εξοπλισμού: ${error.message}`);
  }
};

  // Χειρισμός διαγραφής εξοπλισμού
  const handleDeleteEquipment = async (id) => {
    try {
      // 1. Βρες τον εξοπλισμό και έλεγξε αν έχει δανεισμούς
      const equipment = eksoplismosData.find(e => 
        parseInt(e.id) === parseInt(id) || parseInt(e.id_eksoplismou) === parseInt(id)
      );
      
      if (equipment && equipment.daneizetai && equipment.daneizetai.length > 0) {
        // Έχει δανεισμούς - ζήτα επιβεβαίωση
        const activeLoans = equipment.daneizetai.filter(loan => 
          loan.katastasi_daneismou !== "Επιστράφηκε"
        );
        
        if (activeLoans.length > 0) {
          const confirm = window.confirm(
            `ΠΡΟΣΟΧΗ: Ο εξοπλισμός "${equipment.onoma}" έχει ${activeLoans.length} ενεργούς δανεισμούς. ` + 
            `Η διαγραφή θα αφαιρέσει επίσης όλους τους δανεισμούς. Θέλετε να συνεχίσετε;`
          );
          if (!confirm) return;
        } else if (equipment.daneizetai.length > 0) {
          const confirm = window.confirm(
            `Ο εξοπλισμός "${equipment.onoma}" έχει ${equipment.daneizetai.length} καταγεγραμμένους δανεισμούς. ` + 
            `Θέλετε να διαγράψετε τον εξοπλισμό και το ιστορικό δανεισμών του;`
          );
          if (!confirm) return;
        }
      }

      // 2. Διαγραφή του εξοπλισμού στο backend
      await api.delete(`/eksoplismos/${id}`);
      
      // 3. Βρες τα IDs των δανεισμών που σχετίζονται με αυτόν τον εξοπλισμό
      const equipmentId = parseInt(id);
      const relatedLoans = daneismoiData.filter(loan => 
        parseInt(loan.id_eksoplismou) === equipmentId
      );
      
      // 4. Ενημέρωση του state εξοπλισμού
      setEksoplismosData(prevData => 
        prevData.filter(item => 
          parseInt(item.id) !== equipmentId && parseInt(item.id_eksoplismou) !== equipmentId
        )
      );
      
      // 5. Ενημέρωση των states δανεισμών
      setDaneismoiData(prevData => 
        prevData.filter(loan => parseInt(loan.id_eksoplismou) !== equipmentId)
      );
      
      // Επίσης ενημέρωση των φιλτραρισμένων δεδομένων
      setFilteredLoansData(prevData => 
        prevData.filter(loan => parseInt(loan.id_eksoplismou) !== equipmentId)
      );
      
      
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή εξοπλισμού:", error);
      alert("Σφάλμα κατά τη διαγραφή εξοπλισμού: " + error.message);
    }
  };

  // Χειρισμός διαγραφής δανεισμού
  const handleDeleteLoan = async (id) => {
    try {
      await api.delete(`/eksoplismos/daneismos/${id}`);
      
      // Αφαίρεση από τον πίνακα δανεισμών
      const updatedDaneismoiData = daneismoiData.filter(item => item.id !== id);
      setDaneismoiData(updatedDaneismoiData);
      
      // Αφαίρεση από τον πίνακα εξοπλισμού
      const updatedEksoplismosData = eksoplismosData.map(equipment => {
        if ((equipment.daneizetai || []).some(d => d.id === id)) {
          return {
            ...equipment,
            daneizetai: equipment.daneizetai.filter(d => d.id !== id)
          };
        }
        return equipment;
      });
      setEksoplismosData(updatedEksoplismosData);
      
      // Άμεση ενημέρωση των φιλτραρισμένων δεδομένων
      const processedLoans = updatedDaneismoiData.map(processLoanData);
      const filtered = filterLoansByStatus(processedLoans, loanStatusFilter);
      setFilteredLoansData(filtered);
      
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή δανεισμού:", error);
      alert("Σφάλμα κατά τη διαγραφή δανεισμού.");
    }
  };

  // Διόρθωση του loanDetailPanelConfig για πιο άμεση προσπέλαση των στοιχείων

// Change date format in loan detail panel
const loanDetailPanelConfig = {
  mainDetails: [
    { 
      accessor: "hmerominia_daneismou", 
      header: "Ημερομηνία Δανεισμού", 
      format: (value) => value ? new Date(value).toLocaleDateString('el-GR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : '-' 
    },
    { 
      accessor: "hmerominia_epistrofis", 
      header: "Ημερομηνία Επιστροφής", 
      format: (value) => value ? new Date(value).toLocaleDateString('el-GR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : '-' 
    }
  ],
  tables: [
    {
      title: "Στοιχεία Δανειζόμενου",
      getData: (row) => {
        
        // Απλουστευμένη λογική με log για debugging
        if (row.epafes) {
          return [{
            fullName: `${row.epafes.onoma || ''} ${row.epafes.epitheto || ''}`.trim(),
            email: row.epafes.email || '-',
            tilefono: row.epafes.tilefono ? row.epafes.tilefono.toString() : '-'
          }];
        }
        
        if (row.id_epafis) {
          const contact = contactsList.find(c => parseInt(c.id_epafis) === parseInt(row.id_epafis));
          
          if (contact) return [{
            fullName: contact.fullName,
            email: contact.email || '-',
            tilefono: contact.tilefono || '-'
          }];
        }
        
        // Fallback
        return [{ fullName: row.borrowerName || "Άγνωστο", email: '-', tilefono: '-' }];
      },
      columns: [
        { accessor: "fullName", header: "Ονοματεπώνυμο" },
        { accessor: "email", header: "Email" },
        { accessor: "tilefono", header: "Τηλέφωνο" }
      ]
    },
    {
      title: "Στοιχεία Εξοπλισμού",
      getData: (row) => {
        // Παρόμοια απλουστευμένη λογική για εξοπλισμό
        
        if (row.eksoplismos) {
          return [{
            onoma: row.eksoplismos.onoma || '-',
            marka: row.eksoplismos.marka || '-',
            xroma: row.eksoplismos.xroma || '-',
            megethos: row.eksoplismos.megethos || '-',
            hmerominia_kataskeuis: row.eksoplismos.hmerominia_kataskeuis
          }];
        }
        
        if (row.id_eksoplismou) {
          const equipment = eksoplismosData.find(e => parseInt(e.id_eksoplismou) === parseInt(row.id_eksoplismou));
          if (equipment) return [{
            onoma: equipment.onoma || '-',
            marka: equipment.marka || '-',
            xroma: equipment.xroma || '-',
            megethos: equipment.megethos || '-',
            hmerominia_kataskeuis: equipment.hmerominia_kataskeuis
          }];
        }
        
        return [{ onoma: row.equipmentName || "Άγνωστο", marka: '-', xroma: '-', megethos: '-' }];
      },
      columns: [
        { accessor: "onoma", header: "Όνομα" },
        { accessor: "marka", header: "Μάρκα" },
        { accessor: "xroma", header: "Χρώμα" },
        { accessor: "megethos", header: "Μέγεθος" },
        { 
          accessor: "hmerominia_kataskeuis", 
          header: "Ημ/νία Κατασκευής",
          Cell: ({ value }) => value ? new Date(value).toLocaleDateString("el-GR") : "-" 
        }
      ]
    }
  ]
};

  // Πλήρης αναδιάρθρωση του equipmentDetailPanelConfig
// Change date format in equipment detail panel
const equipmentDetailPanelConfig = {
  mainDetails: [
    { accessor: "onoma", header: "Όνομα" },
    { accessor: "marka", header: "Μάρκα" },
    { accessor: "xroma", header: "Χρώμα" },
    { accessor: "megethos", header: "Μέγεθος" },
    { 
      accessor: "hmerominia_kataskeuis", 
      header: "Ημερομηνία Κατασκευής",
      format: (value) => value ? new Date(value).toLocaleDateString('el-GR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : '-' 
    }
  ],
  tables: [
    {
      title: "Ιστορικό Δανεισμών",
      accessor: "daneizetai", // Αλλαγή του accessor για να ταιριάζει με τα δεδομένα από το backend
      columns: [
        { accessor: "borrowerName", header: "Δανειζόμενος" },
        { 
          accessor: "hmerominia_daneismou", 
          header: "Ημ/νία Δανεισμού",
          Cell: ({ value }) => value ? new Date(value).toLocaleDateString("el-GR", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : "-"
        },
        { 
          accessor: "hmerominia_epistrofis", 
          header: "Ημ/ία Επιστροφής",
          Cell: ({ value }) => value ? new Date(value).toLocaleDateString("el-GR", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : "-"
        }
      ]
    }
  ]
};

// Ενημέρωση των επιλογών φίλτρων - αφαίρεση της επιλογής "Μελλοντικοί"
const loanStatusOptions = [
  { value: 'all', label: 'Όλοι οι δανεισμοί' },
  { value: 'active', label: 'Ενεργοί' },
  { value: 'returned', label: 'Επιστράμμένοι' },
  { value: 'overdue', label: 'Εκπρόθεσμοι' }
];

  // Χειριστής ανοίγματος διαλόγου προσθήκης δανεισμού
const handleOpenAddLoanDialog = () => {
  // Επαναϋπολογισμός διαθέσιμων εξοπλισμών τη στιγμή του ανοίγματος
  // για να έχουμε τα πιο πρόσφατα δεδομένα
  updateAvailableEquipment();
  setAddLoanDialogOpen(true);
};

// Νέα συνάρτηση για ενημέρωση διαθέσιμου εξοπλισμού
const updateAvailableEquipment = () => {
  // Εκτελείται όποτε χρειάζεται να ενημερωθεί η λίστα διαθέσιμου εξοπλισμού
  const today = new Date();
  const availableEquipment = eksoplismosData.filter(equipment => {
    // Έλεγχος αν ο εξοπλισμός είναι διαθέσιμος
    return !(equipment.daneizetai || []).some(loan => {
      // Έλεγχος με βάση την κατάσταση δανεισμού
      if (loan.katastasi_daneismou === "Επιστράφηκε") {
        return false; // Διαθέσιμος αν έχει επιστραφεί
      }
      
      // Έλεγχος για ενεργούς ή εκπρόθεσμους δανεισμούς
      const returnDate = loan.hmerominia_epistrofis ? new Date(loan.hmerominia_epistrofis) : null;
      
      // Ο εξοπλισμός δεν είναι διαθέσιμος αν:
      // - Δεν έχει ημερομηνία επιστροφής ΚΑΙ είναι "Σε εκκρεμότητα" ή "Εκπρόθεσμο"
      // - Ή έχει ημερομηνία επιστροφής που είναι στο μέλλον
      return (!returnDate && 
              (loan.katastasi_daneismou === "Σε εκκρεμότητα" || 
               loan.katastasi_daneismou === "Εκπρόθεσμο")) || 
             (returnDate && returnDate >= today);
    });
  });
  
  setAvailableEquipment(availableEquipment);
};

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <div className="container">
        <div className="header-container">
          <h2 className="header" role="heading" aria-level="2">
            Εξοπλισμός <span className="record-count">({eksoplismosData.length})</span>
          </h2>
        </div>
        <div className="table-container">
          <DataTable
            data={eksoplismosData}
            columns={columns}
            detailPanelConfig={equipmentDetailPanelConfig} // Χρήση του νέου config
            getRowId={(row) => row.id}
            initialState={{
              columnVisibility: {
                id: false,
                imerominiakataskeuis: false,
              },
            }}
            state={{ isLoading: loading }}
            enableExpand={true} // Αλλάξτε σε true για να επιτρέπεται το expand
            enableAddNew={true}
            onAddNew={() => setAddEquipmentDialogOpen(true)}
            handleDelete={handleDeleteEquipment}
            handleEditClick={handleEditEquipmentClick} // Προσθήκη handler επεξεργασίας
            enableRowActions={true} // Ενεργοποίηση ενεργειών γραμμής
          />
        </div>

        <div className="header-container">
          <h2 className="header" role="heading" aria-level="2">
            Δανεισμοί <span className="record-count">({daneismoiData.length})</span>
          </h2>
        </div>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>Φίλτρο:</span>
          <button 
            onClick={() => setLoanStatusFilter('all')} 
            style={{ 
              padding: '6px 12px', 
              backgroundColor: loanStatusFilter === 'all' ? '#1976d2' : '#e0e0e0',
              color: loanStatusFilter === 'all' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Όλοι ({daneismoiData.length})
          </button>
          <button 
            onClick={() => setLoanStatusFilter('active')} 
            style={{ 
              padding: '6px 12px', 
              backgroundColor: loanStatusFilter === 'active' ? '#1976d2' : '#e0e0e0',
              color: loanStatusFilter === 'active' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ενεργοί ({daneismoiData.filter(loan => 
      (loan.katastasi_daneismou === "Σε εκκρεμότητα" && 
       (!loan.hmerominia_epistrofis || new Date(loan.hmerominia_epistrofis) >= new Date()))
    ).length})
          </button>
          <button 
            onClick={() => setLoanStatusFilter('returned')} 
            style={{ 
              padding: '6px 12px', 
              backgroundColor: loanStatusFilter === 'returned' ? '#1976d2' : '#e0e0e0',
              color: loanStatusFilter === 'returned' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Επιστραμμένοι ({daneismoiData.filter(loan => loan.katastasi_daneismou === "Επιστράφηκε").length})
          </button>
          <button 
            onClick={() => setLoanStatusFilter('overdue')} 
            style={{ 
              padding: '6px 12px', 
              backgroundColor: loanStatusFilter === 'overdue' ? '#1976d2' : '#e0e0e0',
              color: loanStatusFilter === 'overdue' ? 'white' : 'black',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center'
            }}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: 'red', 
              marginRight: '5px' 
            }}></span>
            Εκπρόθεσμοι ({daneismoiData.filter(loan => 
      loan.hmerominia_epistrofis && 
      new Date(loan.hmerominia_epistrofis) < new Date() && 
      loan.katastasi_daneismou !== "Επιστράφηκε"
    ).length})
          </button>
        </div>
        <div className="table-container">
          <DataTable
            data={filteredLoansData} // Αλλαγή από daneismoiData σε filteredLoansData
            columns={daneismoiColumns}
            detailPanelConfig={loanDetailPanelConfig}
            getRowId={(row) => row.id}
            initialState={{
              columnVisibility: {
                id: false,
              },
              sorting: [
                { id: 'status', desc: false } // Sort by status with active items (Σε εκκρεμότητα) at the bottom
              ]
            }}
            state={{ isLoading: loading }}
            enableExpand={true}
            enableRowActions={true}  // Προσθήκη επεξεργασίας
            enableAddNew={true}
            onAddNew={handleOpenAddLoanDialog}
            handleEditClick={handleEditLoanClick}  // Προσθήκη handler επεξεργασίας
            handleDelete={handleDeleteLoan}
          />
        </div>

        {/* Dialogs */}
        <AddDialog
          open={addEquipmentDialogOpen}
          onClose={() => setAddEquipmentDialogOpen(false)}
          handleAddSave={handleAddEquipment}
          fields={equipmentFormFields}
          title="Προσθήκη Νέου Εξοπλισμού"
        />

        <AddDialog
          open={addLoanDialogOpen}
          onClose={() => setAddLoanDialogOpen(false)}
          handleAddSave={handleAddLoan}
          title="Προσθήκη Νέου Δανεισμού"
          fields={loanFormFields}
          resourceData={{
            contactsList: contactsList.map(contact => ({
              ...contact,
              fullName: `${contact.onoma || ''} ${contact.epitheto || ''}`.trim()
            })),
            equipmentList: eksoplismosData.map(equipment => ({
              ...equipment,
              // Βελτιωμένος έλεγχος διαθεσιμότητας εξοπλισμού
              isAvailable: !(equipment.daneizetai || []).some(loan => {
                // Έλεγχος με βάση την κατάσταση δανεισμού
                if (loan.katastasi_daneismou === "Επιστράφηκε") {
                  return false; // Διαθέσιμος αν έχει επιστραφεί
                }
                
                // Έλεγχος για ενεργούς ή εκπρόθεσμους δανεισμούς
                const today = new Date();
                const returnDate = loan.hmerominia_epistrofis ? new Date(loan.hmerominia_epistrofis) : null;
                
                // Ο εξοπλισμός δεν είναι διαθέσιμος αν:
                // - Δεν έχει ημερομηνία επιστροφής ΚΑΙ είναι "Σε εκκρεμότητα" ή "Εκπρόθεσμο"
                // - Ή έχει ημερομηνία επιστροφής που είναι στο μέλλον
                return (!returnDate && 
                        (loan.katastasi_daneismou === "Σε εκκρεμότητα" || 
                         loan.katastasi_daneismou === "Εκπρόθεσμο")) || 
                       (returnDate && returnDate >= today);
              })
            })).filter(equipment => equipment.isAvailable) // Φιλτράρισμα διαθέσιμου εξοπλισμού
          }}
        />

        <AddDialog
          open={editLoanDialogOpen}
          onClose={() => {
            setEditLoanDialogOpen(false);
            setEditLoanData(null);
          }}
          handleAddSave={handleEditLoan}
          initialValues={editLoanData}
          title="Επεξεργασία Δανεισμού"
          fields={editLoanFormFields} // Χρησιμοποιείτε τα περιορισμένα πεδία εδώ
          resourceData={{}}
        />

        <AddDialog
          open={editEquipmentDialogOpen}
          onClose={() => {
            setEditEquipmentDialogOpen(false);
            setEditEquipmentData(null);
          }}
          handleAddSave={handleEditEquipment}
          fields={equipmentFormFields}
          title="Επεξεργασία Εξοπλισμού"
          initialValues={editEquipmentData}
        />
      </div>
    </LocalizationProvider>
  );
}