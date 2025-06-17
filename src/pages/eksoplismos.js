import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import DataTable from "../components/DataTable/DataTable";
import * as yup from "yup";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from '../utils/api';
import AddDialog from "../components/DataTable/AddDialog";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions 
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import MultiLoanForm from '../components/MultiLoanForm';

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
  { 
    accessorKey: "quantity", 
    header: "Ποσότητα",
    Cell: ({ cell }) => {
      const value = cell.getValue();
      return value || 1; // Προεπιλεγμένη τιμή 1 αν δεν έχει οριστεί
    }
  },
 
];

// Στήλες για τον πίνακα δανεισμών
const daneismoiColumns = [
  { accessorKey: "borrowerName", header: "Δανειζόμενος" },
  { 
    accessorKey: "equipmentName", 
    header: "Όνομα Εξοπλισμού",
    Cell: ({ row }) => {
      const data = row.original;
      
      // If it's a grouped loan, show all items with quantities on a single line
      if (data.isGrouped && data.equipment_items) {
        return (
          <span>
            {data.equipment_items.map((item, index) => (
              <React.Fragment key={index}>
                {item.equipmentName || item.eksoplismos?.onoma || "Άγνωστο"}
                <strong>({item.quantity || 1})</strong>
                {index < data.equipment_items.length - 1 ? ', ' : ''}
              </React.Fragment>
            ))}
          </span>
        );
      }
      
      // For single items
      return (
        <span>
          {data.equipmentName} 
          {data.quantity > 1 ? <strong>({data.quantity})</strong> : ''}
        </span>
      );
    }
  },
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
    accessorKey: "quantity", 
    header: "Συνολική Ποσότητα", 
    type: "number",
    defaultValue: 1,
    validation: yup.number()
      .min(1, "Η ποσότητα πρέπει να είναι τουλάχιστον 1")
      .required("Η ποσότητα είναι υποχρεωτική")
  },
{ 
  accessorKey: "hmerominia_kataskeuis", 
  header: "Ημερομηνία Κατασκευής", 
  enableHiding: true,  // Βεβαιωθείτε ότι υπάρχει αυτή η γραμμή
  Cell: ({ cell }) => {
    const value = cell.getValue();
    return value ? new Date(value).toLocaleDateString('el-GR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : "-";
  }
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
    accessorKey: "quantity", 
    header: "Ποσότητα", 
    type: "number",
    defaultValue: 1,
    validation: yup.number()
      .min(1, "Η ποσότητα πρέπει να είναι τουλάχιστον 1")
      .required("Η ποσότητα είναι υποχρεωτική")
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

// Add this function to your Eksoplismos component
const handleAddMultiLoan = async (responseData) => {
  try {
    // Process the response that contains multiple loans
    const { data: newLoans } = responseData;
    
    // Group loans by borrower and loan date
    const groupedLoans = {};
    
    // Group loans by borrower ID and loan date
    newLoans.forEach(loan => {
      const loanDate = loan.hmerominia_daneismou ? 
        new Date(loan.hmerominia_daneismou).toISOString().split('T')[0] : 'nodate';
      const returnDate = loan.hmerominia_epistrofis ? 
        new Date(loan.hmerominia_epistrofis).toISOString().split('T')[0] : 'nodate';
      const status = loan.katastasi_daneismou || 'Σε εκκρεμότητα';
      
      const key = `${loan.id_epafis}_${loanDate}_${returnDate}_${status}`;
      
      if (!groupedLoans[key]) {
        // Create a new grouped loan entry
        groupedLoans[key] = {
          id: `group_${key}`,
          id_epafis: loan.id_epafis,
          hmerominia_daneismou: loan.hmerominia_daneismou,
          hmerominia_epistrofis: loan.hmerominia_epistrofis,
          katastasi_daneismou: loan.katastasi_daneismou,
          borrowerName: loan.borrowerName || `${loan.epafes?.onoma || ""} ${loan.epafes?.epitheto || ""}`.trim(),
          isGrouped: true,
          equipment_items: [{
            id: loan.id,
            id_eksoplismou: loan.id_eksoplismou,
            equipmentName: loan.equipmentName || loan.eksoplismos?.onoma || "Άγνωστο",
            quantity: loan.quantity || 1,
            eksoplismos: loan.eksoplismos
          }],
          epafes: loan.epafes
        };
      } else {
        // Add this item to the existing group
        groupedLoans[key].equipment_items.push({
          id: loan.id,
          id_eksoplismou: loan.id_eksoplismou,
          equipmentName: loan.equipmentName || loan.eksoplismos?.onoma || "Άγνωστο",
          quantity: loan.quantity || 1,
          eksoplismos: loan.eksoplismos
        });
      }
    });
    
    // Convert the grouped object to array
    const groupedLoansArray = Object.values(groupedLoans);
    
    // Add equipment summary for display
    groupedLoansArray.forEach(loan => {
      loan.equipmentName = loan.equipment_items.map(item => 
        `${item.equipmentName} (${item.quantity})`
      ).join(", ");
    });
    
    // Update daneismoiData state
    setDaneismoiData(prevData => [...prevData, ...groupedLoansArray]);
    
    // Update equipment data to reflect the new loans
    setEksoplismosData(prevData => {
      return prevData.map(equipment => {
        const equipmentLoans = newLoans.filter(
          loan => parseInt(loan.id_eksoplismou) === parseInt(equipment.id_eksoplismou)
        );
        
        if (equipmentLoans.length > 0) {
          return {
            ...equipment,
            daneizetai: [
              ...(equipment.daneizetai || []),
              ...equipmentLoans.map(loan => ({
                id: loan.id,
                id_epafis: loan.id_epafis,
                id_eksoplismou: loan.id_eksoplismou,
                hmerominia_daneismou: loan.hmerominia_daneismou,
                hmerominia_epistrofis: loan.hmerominia_epistrofis,
                katastasi_daneismou: loan.katastasi_daneismou,
                borrowerName: loan.borrowerName || `${loan.epafes?.onoma || ""} ${loan.epafes?.epitheto || ""}`.trim(),
                quantity: loan.quantity || 1
              }))
            ]
          };
        }
        return equipment;
      });
    });
    
    // Update filtered loans data
    const updatedDaneismoiData = [...daneismoiData, ...groupedLoansArray];
    const filtered = filterLoansByStatus(updatedDaneismoiData, loanStatusFilter);
    setFilteredLoansData(filtered);
    
    // Close the dialog
    setAddLoanDialogOpen(false);
  } catch (error) {
    console.error("Error adding multiple loans:", error);
    alert("Σφάλμα κατά την προσθήκη πολλαπλών δανεισμών");
  }
};
// Προσθήκη συνάρτησης μετά το useEffect για ενίσχυση των δεδομένων δανεισμού
const enhanceLoanData = async () => {
  if (daneismoiData.length === 0 || contactsList.length === 0 || eksoplismosData.length === 0) return;
  
  // Enhance each loan with complete contact and equipment info
  const enhanced = daneismoiData.map(loan => {
    const enhancedLoan = { ...loan };
    
    // Add complete contact info if missing
    if (!enhancedLoan.epafes && enhancedLoan.id_epafis) {
      enhancedLoan.epafes = contactsList.find(c => 
        parseInt(c.id_epafis) === parseInt(enhancedLoan.id_epafis)
      );
    }
    
    // For grouped items, add complete equipment info to each item
    if (enhancedLoan.isGrouped && enhancedLoan.equipment_items) {
      enhancedLoan.equipment_items = enhancedLoan.equipment_items.map(item => {
        if (!item.eksoplismos && item.id_eksoplismou) {
          const equipment = eksoplismosData.find(e => 
            parseInt(e.id_eksoplismou) === parseInt(item.id_eksoplismou)
          );
          return { ...item, eksoplismos: equipment };
        }
        return item;
      });
    }
    // For single items, add complete equipment info
    else if (!enhancedLoan.eksoplismos && enhancedLoan.id_eksoplismou) {
      enhancedLoan.eksoplismos = eksoplismosData.find(e => 
        parseInt(e.id_eksoplismou) === parseInt(enhancedLoan.id_eksoplismou)
      );
    }
    
    return enhancedLoan;
  });
  
  // Check if there's a real change to avoid unnecessary updates
  const beforeCount = daneismoiData.filter(d => 
    d.epafes && (d.eksoplismos || (d.equipment_items && d.equipment_items.length > 0))
  ).length;
  
  const afterCount = enhanced.filter(d => 
    d.epafes && (d.eksoplismos || (d.equipment_items && d.equipment_items.length > 0))
  ).length;
  
  if (afterCount > beforeCount) {
    setDaneismoiData(enhanced);
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
  
  // Αν έχει κατάσταση "Επιστράφηκε", διατηρούμε αυτή την κατάσταση
  if (status === "Επιστράφηκε") {
    // Διατηρούμε την κατάσταση ως "Επιστράφηκε"
  }
  // Αυτόματο "Εκπρόθεσμο" αν έχει περάσει η ημερομηνία επιστροφής και δεν έχει επιστραφεί
  else if (returnDate && returnDate < today) {
    status = "Εκπρόθεσμο";
    // Ενημέρωση του backend μόνο αν δεν είναι ομαδοποιημένος δανεισμός
    if (!loan.equipment_items) {
      updateLoanStatusToOverdue(loan.id);
    }
  }
  // Αλλιώς είναι "Σε εκκρεμότητα" (ενεργός)
  else {
    status = "Σε εκκρεμότητα";
  }
  
  return {
    ...loan,
    status,
    isGrouped: Array.isArray(loan.equipment_items) && loan.equipment_items.length > 0
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
      hmerominia_daneismou: newLoan.hmerominia_daneismou,
      hmerominia_epistrofis: newLoan.hmerominia_epistrofis || null,
      katastasi_daneismou: newLoan.katastasi_daneismou || "Σε εκκρεμότητα",
      quantity: parseInt(newLoan.quantity) || 1 // Προσθήκη ποσότητας
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
// Βελτιωμένη έκδοση του handleEditLoan
const handleEditLoan = async (editedLoan) => {
  try {
    if (!editLoanData || !editLoanData.id) {
      throw new Error("Δεν υπάρχουν δεδομένα για επεξεργασία");
    }
    
    // Έλεγχος αν είναι ομαδοποιημένος δανεισμός
    const isGroupLoan = 
      editLoanData.id.toString().startsWith('group_') || 
      editLoanData.isGrouped || 
      (editLoanData.equipment_items && editLoanData.equipment_items.length > 1);
      
    if (isGroupLoan) {
      // Συλλογή όλων των IDs των δανεισμών στην ομάδα
      const loanIds = editLoanData.equipment_items.map(item => item.id);
      
      // Κλήση του νέου endpoint για ομαδική ενημέρωση
      const response = await api.put('/eksoplismos/daneismos-group/update', {
        id_epafis: editLoanData.id_epafis,
        hmerominia_daneismou: editedLoan.hmerominia_daneismou,
        hmerominia_epistrofis: editedLoan.hmerominia_epistrofis,
        katastasi_daneismou: editedLoan.katastasi_daneismou,
        equipment_ids: loanIds
      });
      
      // Ενημέρωση των τοπικών δεδομένων
      const updatedLoans = response.data.data;
      setDaneismoiData(prevDaneismoiData => {
        return prevDaneismoiData.map(loan => {
          if (loan.id === editLoanData.id) {
            return {
              ...loan,
              hmerominia_daneismou: editedLoan.hmerominia_daneismou,
              hmerominia_epistrofis: editedLoan.hmerominia_epistrofis,
              katastasi_daneismou: editedLoan.katastasi_daneismou,
              equipment_items: loan.equipment_items.map(item => ({
                ...item,
                katastasi_daneismou: editedLoan.katastasi_daneismou
              }))
            };
          }
          return loan;
        });
      });
    } else {
      // Υπάρχων κώδικας για μη ομαδοποιημένους δανεισμούς
      const response = await api.put(`/eksoplismos/daneismos/${editLoanData.id}`, {
        id_epafis: editLoanData.id_epafis,
        id_eksoplismou: editLoanData.id_eksoplismou,
        hmerominia_daneismou: editedLoan.hmerominia_daneismou,
        hmerominia_epistrofis: editedLoan.hmerominia_epistrofis,
        katastasi_daneismou: editedLoan.katastasi_daneismou,
        quantity: editedLoan.quantity
      });
      
      // Υπάρχων κώδικας ενημέρωσης τοπικών δεδομένων για μεμονωμένο δανεισμό
      setDaneismoiData(prevData => 
        prevData.map(item => item.id === editLoanData.id ? response.data : item)
      );
    }
    
    // Κλείσιμο του dialog
    setEditLoanDialogOpen(false);
    setEditLoanData(null);
    
    // Ανανέωση των φιλτραρισμένων δανεισμών
    const processedLoans = daneismoiData.map(processLoanData);
    const filtered = filterLoansByStatus(processedLoans, loanStatusFilter);
    setFilteredLoansData(filtered);
    
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία δανεισμού:", error);
    alert(`Σφάλμα κατά την επεξεργασία δανεισμού: ${error.message}`);
  }
};
  // Βοηθητική συνάρτηση για μορφοποίηση ημερομηνίας (ώστε να είναι διαθέσιμη παντού)
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

  // Τροποποιημένη συνάρτηση handleEditLoanClick που υποστηρίζει ομαδοποιημένα δάνεια
 // Τροποποιημένη συνάρτηση handleEditLoanClick που υποστηρίζει ομαδοποιημένα δάνεια
const handleEditLoanClick = (loan) => {
  // Προετοιμασία δεδομένων ανάλογα με το αν είναι ομαδοποιημένο δάνειο
  const isGrouped = loan.id.toString().startsWith('group_') || loan.isGrouped || 
                   (loan.equipment_items && loan.equipment_items.length > 1);
  
  // Για ομαδοποιημένους δανεισμούς
  if (isGrouped) {
    setEditLoanData({
      ...loan,
      id: loan.id,
      id_epafis: loan.id_epafis,
      isGrouped: true,
      hmerominia_daneismou: loan.hmerominia_daneismou,
      hmerominia_epistrofis: loan.hmerominia_epistrofis,
      katastasi_daneismou: loan.katastasi_daneismou
    });
  } else {
    // Για μεμονωμένους δανεισμούς
    setEditLoanData({
      id: loan.id,
      id_epafis: loan.id_epafis,
      id_eksoplismou: loan.id_eksoplismou,
      hmerominia_daneismou: loan.hmerominia_daneismou,
      hmerominia_epistrofis: loan.hmerominia_epistrofis,
      katastasi_daneismou: loan.katastasi_daneismou,
      quantity: loan.quantity
    });
  }
  
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
    id_eksoplismou: equipmentId, 
    onoma: equipment.onoma || "",
    marka: equipment.marka || "",
    xroma: equipment.xroma || "",
    megethos: equipment.megethos || "",
    hmerominia_kataskeuis: formatDate(equipment.hmerominia_kataskeuis),
    quantity: equipment.quantity || 1 // Add this line
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
  // Χειρισμός διαγραφής δανεισμού
const handleDeleteLoan = async (id) => {
  try {
    const loanToDelete = daneismoiData.find(loan => loan.id === id);
    
    // Check if this is a grouped loan (the ID starts with "group_" or has equipment_items array)
    if (loanToDelete && (id.toString().startsWith('group_') || loanToDelete.isGrouped || 
        (loanToDelete.equipment_items && loanToDelete.equipment_items.length > 0))) {
      
      // Display confirmation for deleting multiple items
     
      
      
      // Delete all loan items in the group
      const deletePromises = loanToDelete.equipment_items.map(item => 
        api.delete(`/eksoplismos/daneismos/${item.id}`)
      );
      
      await Promise.all(deletePromises);
      
      // Update states
      // 1. Remove from daneismoiData
      const updatedDaneismoiData = daneismoiData.filter(item => item.id !== id);
      setDaneismoiData(updatedDaneismoiData);
      
      // 2. Remove from equipment's daneizetai arrays
      const updatedEksoplismosData = eksoplismosData.map(equipment => {
        // Check if this equipment has any of the deleted loan items
        const hasDeletedLoan = loanToDelete.equipment_items.some(
          item => parseInt(item.id_eksoplismou) === parseInt(equipment.id_eksoplismou)
        );
        
        if (hasDeletedLoan) {
          // Filter out all the deleted loan IDs
          const deletedLoanIds = loanToDelete.equipment_items.map(item => item.id);
          return {
            ...equipment,
            daneizetai: (equipment.daneizetai || []).filter(
              d => !deletedLoanIds.includes(d.id)
            )
          };
        }
        return equipment;
      });
      setEksoplismosData(updatedEksoplismosData);
      
      // 3. Update filtered loans
      const processedLoans = updatedDaneismoiData.map(processLoanData);
      const filtered = filterLoansByStatus(processedLoans, loanStatusFilter);
      setFilteredLoansData(filtered);
      
    } else {
      // Regular non-grouped loan deletion (existing code)
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
    }
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
    },
    {
      accessor: "katastasi_daneismou",
      header: "Κατάσταση",
      format: (value) => value || "Σε εκκρεμότητα"
    }
  ],
  tables: [
    {
      title: "Στοιχεία Δανειζόμενου",
      getData: (row) => {
        const contact = row.epafes || {};
        return [
          {
            fullName: `${contact.onoma || ''} ${contact.epitheto || ''}`.trim() || 'Άγνωστο',
            email: contact.email || '-',
            tilefono: contact.tilefono ? contact.tilefono.toString() : '-'
          }
        ];
      },
      columns: [
        { accessor: "fullName", header: "Ονοματεπώνυμο" },
        { accessor: "email", header: "Email" },
        { accessor: "tilefono", header: "Τηλέφωνο" }
      ]
    },
    {
      title: "Εξοπλισμός",
      getData: (row) => {
        // Handle grouped items
        if (row.isGrouped && row.equipment_items && row.equipment_items.length > 0) {
          return row.equipment_items.map(item => ({
            onoma: item.equipmentName || item.eksoplismos?.onoma || "-",
            marka: item.eksoplismos?.marka || "-",
            xroma: item.eksoplismos?.xroma || "-",
            megethos: item.eksoplismos?.megethos || "-",
            quantity: item.quantity || 1
          }));
        }
        
        // Handle single item
        if (row.eksoplismos) {
          return [{
            onoma: row.eksoplismos.onoma || "-",
            marka: row.eksoplismos.marka || "-",
            xroma: row.eksoplismos.xroma || "-",
            megethos: row.eksoplismos.megethos || "-",
            quantity: row.quantity || 1
          }];
        }
        
        return [{ 
          onoma: row.equipmentName || "Άγνωστο", 
          quantity: row.quantity || 1 
        }];
      },
      columns: [
        { accessor: "onoma", header: "Όνομα" },
        { accessor: "marka", header: "Μάρκα" },
        { accessor: "xroma", header: "Χρώμα" },
        { accessor: "megethos", header: "Μέγεθος" },
        { accessor: "quantity", header: "Ποσότητα" }
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

// Replace the existing updateAvailableEquipment function// Replace your existing updateAvailableEquipment function with this one

const updateAvailableEquipment = () => {
  if (!Array.isArray(eksoplismosData)) {
    return [];
  }
  
  // Return array of equipment items that have available quantity
  return eksoplismosData.filter(equipment => {
    if (!equipment) return false;
    
    // Calculate currently borrowed quantity
    const borrowedItems = (equipment.daneizetai || []).filter(loan => 
      loan.katastasi_daneismou !== "Επιστράφηκε" && 
      (!loan.hmerominia_epistrofis || new Date(loan.hmerominia_epistrofis) >= new Date())
    );
    
    const totalQuantity = equipment.quantity || 1;
    const borrowedQuantity = borrowedItems.reduce((total, loan) => total + (loan.quantity || 1), 0);
    const availableQuantity = totalQuantity - borrowedQuantity;
    
    return availableQuantity > 0;
  });
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
      hmerominia_kataskeuis: false, // Añade esta línea para ocultar la columna inicialmente
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

        <Dialog
          open={addLoanDialogOpen}
          onClose={() => setAddLoanDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Προσθήκη Νέου Δανεισμού</DialogTitle>
          <DialogContent>
            <MultiLoanForm
              contactsList={contactsList.map(contact => ({
                ...contact,
                fullName: `${contact.onoma || ''} ${contact.epitheto || ''}`.trim()
              }))}
              availableEquipment={eksoplismosData.map(equipment => ({
                ...equipment,
                isAvailable: updateAvailableEquipment().some(
                  avail => parseInt(avail.id_eksoplismou) === parseInt(equipment.id_eksoplismou)
                )
              }))}
              onSuccess={handleAddMultiLoan}
              onCancel={() => setAddLoanDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

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