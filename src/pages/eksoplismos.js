import "./App.css";
import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";
import * as yup from "yup";
import { Add, Edit, Delete } from "@mui/icons-material";
import axios from "axios";
import AddDialog from "../components/DataTable/AddDialog";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';

// Στήλες για τον πίνακα εξοπλισμού
const columns = [
  { accessorKey: "id", header: "ID", enableHiding: true },
  { accessorKey: "onoma", header: "Όνομα" },
  { accessorKey: "marka", header: "Μάρκα" },
  { accessorKey: "xroma", header: "Χρώμα" },
  { accessorKey: "megethos", header: "Μέγεθος" },
  { accessorKey: "imerominiakataskeuis", header: "Ημερομηνία Κατασκευής", enableHiding: true },
];

// Στήλες για τον πίνακα δανεισμών
const daneismoiColumns = [
  { accessorKey: "id", header: "ID", enableHiding: true },
  { accessorKey: "borrowerName", header: "Δανειζόμενος" },
  { accessorKey: "equipmentName", header: "Όνομα Εξοπλισμού" },
  { 
    accessorKey: "hmerominia_daneismou", 
    header: "Ημερομηνία Δανεισμού",
    Cell: ({ cell }) => {
      const value = cell.getValue();
      return value ? new Date(value).toLocaleDateString("el-GR") : "-";
    }
  },
  { 
    accessorKey: "hmerominia_epistrofis", 
    header: "Ημερομηνία Επιστροφής", 
    Cell: ({ cell }) => {
      const value = cell.getValue();
      return value ? new Date(value).toLocaleDateString("el-GR") : "-";
    }
  },
];

// Fields για τη φόρμα προσθήκης εξοπλισμού
const equipmentFormFields = [
  { 
    accessorKey: "onoma", 
    header: "Όνομα Εξοπλισμού", 
    validation: yup.string().required("Το όνομα είναι υποχρεωτικό") 
  },
  { 
    accessorKey: "marka", 
    header: "Μάρκα", 
    validation: yup.string().required("Η μάρκα είναι υποχρεωτική") 
  },
  { 
    accessorKey: "xroma", 
    header: "Χρώμα" 
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

// Fields για τη φόρμα προσθήκης δανεισμού
const loanFormFields = [
  { 
    accessorKey: "id_epafis", 
    header: "Δανειζόμενος", 
    type: "tableSelect",
    dataKey: "contactsList",
    validation: yup.string().required("Παρακαλώ επιλέξτε δανειζόμενο"),
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
    columns: [
      { field: "onoma", header: "Όνομα" },
      { field: "marka", header: "Μάρκα" },
      { field: "xroma", header: "Χρώμα" }
    ]
  },
  { 
    accessorKey: "hmerominia_daneismou", 
    header: "Ημ/νία Δανεισμού", 
    type: "date",
    defaultValue: new Date().toISOString().split('T')[0],
    validation: yup.date().required("Η ημ/νία δανεισμού είναι υποχρεωτική")
  },
  { 
    accessorKey: "hmerominia_epistrofis", 
    header: "Ημ/νία Επιστροφής", 
    type: "date"
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

  // Βελτιωμένη επεξεργασία δεδομένων στο useEffect
useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      
      // Φόρτωση εξοπλισμού
      const eksoplismosResponse = await axios.get("http://localhost:5000/api/eksoplismos");
      console.log("Δεδομένα εξοπλισμού από API:", eksoplismosResponse.data);
      
      // Φόρτωση δανεισμών
      const daneismoiResponse = await axios.get("http://localhost:5000/api/eksoplismos/daneismoi");
      console.log("Δεδομένα δανεισμών από API:", daneismoiResponse.data);
      
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
        console.log(`Εξοπλισμός ${item.onoma} (ID:${item.id_eksoplismou}): ${itemWithDaneizetai.daneizetai?.length || 0} δανεισμοί`);
        
        return itemWithDaneizetai;
      });
      
      setEksoplismosData(processedEquipment);
      
      // Κανονική επεξεργασία δανεισμών για τον πίνακα δανεισμών
      const processedLoans = daneismoiResponse.data.map(item => ({
        ...item,
        id: item.id,
        borrowerName: item.borrowerName || `${item.epafes?.onoma || ''} ${item.epafes?.epitheto || ''}`.trim() || "Άγνωστο",
        equipmentName: item.equipmentName || item.eksoplismos?.onoma || "Άγνωστο"
      }));
      
      setDaneismoiData(processedLoans);
      
      // Φόρτωση επαφών
      const contactsResponse = await axios.get("http://localhost:5000/api/Repafes");
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

  // Χειρισμός προσθήκης νέου εξοπλισμού
  const handleAddEquipment = async (newEquipment) => {
    try {
      const response = await axios.post("http://localhost:5000/api/eksoplismos", newEquipment);
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
    // Βεβαιωθείτε ότι όλα τα απαιτούμενα πεδία υπάρχουν
    if (!newLoan.id_epafis || !newLoan.id_eksoplismou) {
      throw new Error("Λείπουν απαιτούμενα πεδία");
    }
    
    const formattedLoan = {
      id_epafis: parseInt(newLoan.id_epafis),
      id_eksoplismou: parseInt(newLoan.id_eksoplismou),
      hmerominia_daneismou: newLoan.hmerominia_daneismou || new Date().toISOString().split('T')[0],
      hmerominia_epistrofis: newLoan.hmerominia_epistrofis || null
    };
    
    console.log("Αποστολή δεδομένων για προσθήκη δανεισμού:", formattedLoan);
    
    const response = await axios.post("http://localhost:5000/api/eksoplismos/daneismos", formattedLoan);
    
    // Βρίσκουμε τις πλήρεις λεπτομέρειες για την επαφή και τον εξοπλισμό
    const borrower = contactsList.find(c => parseInt(c.id) === parseInt(newLoan.id_epafis));
    const equipment = eksoplismosData.find(e => parseInt(e.id) === parseInt(newLoan.id_eksoplismou));
    
    // Δημιουργία πλήρους αντικειμένου με όλα τα απαραίτητα δεδομένα
    const newDaneismosEntry = {
      ...response.data,
      id: response.data.id,
      id_epafis: parseInt(newLoan.id_epafis),
      id_eksoplismou: parseInt(newLoan.id_eksoplismou),
      borrowerName: borrower?.fullName || "Άγνωστο",
      equipmentName: equipment?.onoma || "Άγνωστο",
      hmerominia_daneismou: response.data.hmerominia_daneismou,
      hmerominia_epistrofis: response.data.hmerominia_epistrofis,
      // Δημιουργία πλήρους αντικειμένου epafes αν δεν υπάρχει στην απάντηση
      epafes: response.data.epafes || borrower || {
        id_epafis: parseInt(newLoan.id_epafis),
        onoma: borrower?.onoma || "",
        epitheto: borrower?.epitheto || "",
        email: borrower?.email || "",
        tilefono: borrower?.tilefono || ""
      },
      // Δημιουργία πλήρους αντικειμένου eksoplismos αν δεν υπάρχει στην απάντηση
      eksoplismos: response.data.eksoplismos || equipment || {
        id_eksoplismou: parseInt(newLoan.id_eksoplismou),
        onoma: equipment?.onoma || ""
      }
    };
    
    console.log("Νέος δανεισμός που προστέθηκε:", newDaneismosEntry);
    setDaneismoiData(prevData => [...prevData, newDaneismosEntry]);
    setAddLoanDialogOpen(false);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη δανεισμού:", error);
    alert(`Σφάλμα κατά την προσθήκη δανεισμού: ${error.message}`);
  }
};

  // Βελτιωμένη έκδοση του handleEditLoan
const handleEditLoan = async (editedLoan) => {
  try {
    const formattedLoan = {
      id_epafis: parseInt(editedLoan.id_epafis),
      id_eksoplismou: parseInt(editedLoan.id_eksoplismou),
      hmerominia_daneismou: editedLoan.hmerominia_daneismou || null,
      hmerominia_epistrofis: editedLoan.hmerominia_epistrofis || null
    };
    
    console.log("Αποστολή δεδομένων για επεξεργασία:", formattedLoan);
    
    const response = await axios.put(`http://localhost:5000/api/eksoplismos/daneismos/${editLoanData.id}`, formattedLoan);
    
    // Βρίσκουμε τις πλήρεις λεπτομέρειες για την επαφή και τον εξοπλισμό
    const borrower = contactsList.find(c => parseInt(c.id) === parseInt(editedLoan.id_epafis));
    const equipment = eksoplismosData.find(e => parseInt(e.id) === parseInt(editedLoan.id_eksoplismou));
    
    // Ενημέρωση του πίνακα με διατήρηση των στοιχείων επαφής
    setDaneismoiData(prevData => 
      prevData.map(item => 
        item.id === editLoanData.id 
          ? {
              ...item, // Διατήρηση των υπαρχόντων δεδομένων (σημαντικό!)
              // Ενημέρωση μόνο των στοιχείων που αλλάζουν
              id_epafis: parseInt(editedLoan.id_epafis),
              id_eksoplismou: parseInt(editedLoan.id_eksoplismou),
              borrowerName: borrower?.fullName || "Άγνωστο",
              equipmentName: equipment?.onoma || "Άγνωστο",
              hmerominia_daneismou: response.data.hmerominia_daneismou || editedLoan.hmerominia_daneismou,
              hmerominia_epistrofis: response.data.hmerominia_epistrofis || editedLoan.hmerominia_epistrofis,
              // Προσεκτική ενημέρωση των αντικειμένων
              epafes: response.data.epafes || borrower || item.epafes,
              eksoplismos: response.data.eksoplismos || equipment || item.eksoplismos
            } 
          : item
      )
    );
    
    setEditLoanDialogOpen(false);
    setEditLoanData(null);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία δανεισμού:", error);
    alert("Σφάλμα κατά την επεξεργασία δανεισμού: " + error.message);
  }
};

  // Άνοιγμα διαλόγου επεξεργασίας
  const handleEditLoanClick = (loan) => {
    setEditLoanData({
      id: loan.id,
      id_epafis: loan.id_epafis.toString(),
      id_eksoplismou: loan.id_eksoplismou.toString(),
      hmerominia_daneismou: loan.hmerominia_daneismou ? new Date(loan.hmerominia_daneismou).toISOString().split('T')[0] : "",
      hmerominia_epistrofis: loan.hmerominia_epistrofis ? new Date(loan.hmerominia_epistrofis).toISOString().split('T')[0] : ""
    });
    setEditLoanDialogOpen(true);
  };

  // Βελτιωμένος χειριστής επεξεργασίας εξοπλισμού
const handleEditEquipmentClick = (equipment) => {
  console.log("Επεξεργασία εξοπλισμού:", equipment);
  
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

    console.log("Αποστολή ενημερωμένου εξοπλισμού:", editedEquipment, "με ID:", equipmentId);
    
    // Δημιουργία αντικειμένου με τα δεδομένα που θα αποσταλούν
    const dataToSend = {
      ...editedEquipment,
      id_eksoplismou: equipmentId, // Βεβαιωνόμαστε ότι το ID περιλαμβάνεται στα δεδομένα
      id: equipmentId
    };
    
    const response = await axios.put(
      `http://localhost:5000/api/eksoplismos/${equipmentId}`,
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
      await axios.delete(`http://localhost:5000/api/eksoplismos/${id}`);
      setEksoplismosData(prevData => prevData.filter(item => item.id !== id));
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή εξοπλισμού:", error);
      alert("Σφάλμα κατά τη διαγραφή εξοπλισμού.");
    }
  };

  // Χειρισμός διαγραφής δανεισμού
  const handleDeleteLoan = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/eksoplismos/daneismos/${id}`);
      setDaneismoiData(prevData => prevData.filter(item => item.id !== id));
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή δανεισμού:", error);
      alert("Σφάλμα κατά τη διαγραφή δανεισμού.");
    }
  };

  // Βελτιωμένο loanDetailPanelConfig με περισσότερους τρόπους εύρεσης στοιχείων δανειζόμενου
const loanDetailPanelConfig = {
  mainDetails: [
    { 
      accessor: "hmerominia_daneismou", 
      header: "Ημερομηνία Δανεισμού", 
      format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-' 
    },
    { 
      accessor: "hmerominia_epistrofis", 
      header: "Ημερομηνία Επιστροφής", 
      format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-' 
    }
  ],
  tables: [
    {
      title: "Στοιχεία Δανειζόμενου",
      accessor: "borrowerDetails",
      getData: (row) => {
        console.log("Στοιχεία δανειζόμενου για:", row);
        
        // Τρόπος 1: Χρήση του αντικειμένου epafes (αν υπάρχει)
        if (row.epafes) {
          return [{
            fullName: `${row.epafes.onoma || ''} ${row.epafes.epitheto || ''}`.trim() || row.borrowerName || "Άγνωστο",
            email: row.epafes.email || '-',
            tilefono: row.epafes.tilefono ? row.epafes.tilefono.toString() : '-'
          }];
        }
        
        // Τρόπος 2: Αναζήτηση με βάση το id_epafis (αν υπάρχει)
        if (row.id_epafis) {
          // Μετατροπή σε string για σύγκριση
          const epafisId = row.id_epafis.toString();
          // Εύρεση επαφής με id που ταιριάζει με id_epafis
          const contact = contactsList.find(c => 
            c.id.toString() === epafisId || c.id_epafis.toString() === epafisId
          );
          
          if (contact) {
            return [{
              fullName: contact.fullName || `${contact.onoma || ''} ${contact.epitheto || ''}`.trim() || "Άγνωστο",
              email: contact.email || '-',
              tilefono: contact.tilefono || '-'
            }];
          }
        }
        
        // Τρόπος 3: Αναζήτηση με βάση το borrowerName (αν υπάρχει)
        if (row.borrowerName && row.borrowerName !== "Άγνωστο") {
          // Εύρεση επαφής με όνομα που ταιριάζει με borrowerName
          const contact = contactsList.find(c => 
            c.fullName === row.borrowerName || 
            `${c.onoma || ''} ${c.epitheto || ''}`.trim() === row.borrowerName
          );
          
          if (contact) {
            return [{
              fullName: contact.fullName || `${contact.onoma || ''} ${contact.epitheto || ''}`.trim() || row.borrowerName,
              email: contact.email || '-',
              tilefono: contact.tilefono || '-'
            }];
          }
          
          // Αν δεν βρέθηκε επαφή, επιστροφή μόνο του borrowerName
          return [{
            fullName: row.borrowerName,
            email: '-',
            tilefono: '-'
          }];
        }
        
        // Τρόπος 4: Επιστροφή κενών στοιχείων αν τίποτα άλλο δεν λειτουργεί
        return [{
          fullName: "Άγνωστο",
          email: '-',
          tilefono: '-'
        }];
      },
      columns: [
        { accessor: "fullName", header: "Ονοματεπώνυμο" },
        { accessor: "email", header: "Email" },
        { accessor: "tilefono", header: "Τηλέφωνο" }
      ]
    },
    {
      title: "Στοιχεία Εξοπλισμού",
      accessor: "equipmentDetails",
      getData: (row) => {
        if (!row.eksoplismos && !row.id_eksoplismou) {
          return [];
        }
        
        // Αν έχουμε ήδη πλήρεις πληροφορίες από το backend
        if (row.eksoplismos) {
          return [{
            onoma: row.eksoplismos.onoma || '-',
            marka: row.eksoplismos.marka || '-',
            xroma: row.eksoplismos.xroma || '-',
            megethos: row.eksoplismos.megethos || '-',
            hmerominia_kataskeuis: row.eksoplismos.hmerominia_kataskeuis
          }];
        }
        
        // Εναλλακτικά, αναζητούμε τον εξοπλισμό στη λίστα εξοπλισμών
        const equipment = eksoplismosData.find(e => parseInt(e.id) === parseInt(row.id_eksoplismou));
        if (equipment) {
          return [{
            onoma: equipment.onoma || '-',
            marka: equipment.marka || '-',
            xroma: equipment.xroma || '-',
            megethos: equipment.megethos || '-',
            hmerominia_kataskeuis: equipment.hmerominia_kataskeuis
          }];
        }
        
        return [];
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
const equipmentDetailPanelConfig = {
  mainDetails: [
    { accessor: "onoma", header: "Όνομα" },
    { accessor: "marka", header: "Μάρκα" },
    { accessor: "xroma", header: "Χρώμα" },
    { accessor: "megethos", header: "Μέγεθος" },
    { 
      accessor: "hmerominia_kataskeuis", 
      header: "Ημερομηνία Κατασκευής",
      format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-' 
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
          header: "Ημερομηνία Δανεισμού",
          Cell: ({ value }) => value ? new Date(value).toLocaleDateString("el-GR") : "-"
        },
        { 
          accessor: "hmerominia_epistrofis", 
          header: "Ημερομηνία Επιστροφής",
          Cell: ({ value }) => value ? new Date(value).toLocaleDateString("el-GR") : "-"
        }
      ]
    }
  ]
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
        <div className="table-container">
          <DataTable
            data={daneismoiData}
            columns={daneismoiColumns}
            detailPanelConfig={loanDetailPanelConfig}
            getRowId={(row) => row.id}
            initialState={{
              columnVisibility: {
                id: false,
              },
            }}
            state={{ isLoading: loading }}
            enableExpand={true}
            enableRowActions={true}  // Προσθήκη επεξεργασίας
            enableAddNew={true}
            onAddNew={() => setAddLoanDialogOpen(true)}
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
          fields={loanFormFields}
          title="Προσθήκη Νέου Δανεισμού"
          resourceData={{
            contactsList: contactsList,
            equipmentList: eksoplismosData
          }}
        />

        <AddDialog
          open={editLoanDialogOpen}
          onClose={() => {
            setEditLoanDialogOpen(false);
            setEditLoanData(null);
          }}
          handleAddSave={handleEditLoan}
          fields={loanFormFields}
          title="Επεξεργασία Δανεισμού"
          initialValues={editLoanData}
          resourceData={{
            contactsList: contactsList,
            equipmentList: eksoplismosData
          }}
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