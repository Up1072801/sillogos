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

  // Ενημερώστε το useEffect για τη φόρτωση δεδομένων
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Φόρτωση εξοπλισμού
        const eksoplismosResponse = await axios.get("http://localhost:5000/api/eksoplismos");
        setEksoplismosData(eksoplismosResponse.data.map(item => ({
          ...item,
          id: item.id_eksoplismou
        })));

        // Φόρτωση δανεισμών
        const daneismoiResponse = await axios.get("http://localhost:5000/api/eksoplismos/daneismoi");
        
        console.log("Δεδομένα δανεισμών:", daneismoiResponse.data); // Για έλεγχο
        
        // Διασφάλιση των σωστών ιδιοτήτων για κάθε δανεισμό
        setDaneismoiData(daneismoiResponse.data.map(item => ({
          ...item,
          id: item.id,
          id_epafis: item.id_epafis,
          id_eksoplismou: item.id_eksoplismou,
          borrowerName: item.Name || "Άγνωστο",
          equipmentName: item.nameeksoplismou || "Άγνωστο",
          hmerominia_daneismou: item.hmerominia_daneismou,
          hmerominia_epistrofis: item.hmerominia_epistrofis
        })));

        // Φόρτωση επαφών για το dropdown επιλογής δανειζόμενου
        const contactsResponse = await axios.get("http://localhost:5000/api/Repafes");
        setContactsList(contactsResponse.data.map(contact => ({
          id: contact.id_epafis,
          fullName: `${contact.onoma || ''} ${contact.epitheto || ''}`.trim(),
          email: contact.email,
          tilefono: contact.tilefono
        })));

        setLoading(false);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
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

  // Τροποποίηση του κώδικα χειρισμού προσθήκης δανεισμού
  const handleAddLoan = async (newLoan) => {
    try {
      console.log("Δεδομένα φόρμας:", newLoan); // Έλεγχος δεδομένων φόρμας
      
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

      console.log("Αποστολή δεδομένων:", formattedLoan); // Έλεγχος μορφοποιημένων δεδομένων
      
      const response = await axios.post("http://localhost:5000/api/eksoplismos/daneismos", formattedLoan);
      
      // Ενημέρωση του πίνακα με τα νέα δεδομένα
      const borrower = contactsList.find(c => c.id === parseInt(newLoan.id_epafis));
      const equipment = eksoplismosData.find(e => e.id === parseInt(newLoan.id_eksoplismou));
      
      setDaneismoiData(prevData => [...prevData, {
        ...response.data,
        id: response.data.id,
        id_epafis: parseInt(newLoan.id_epafis),
        id_eksoplismou: parseInt(newLoan.id_eksoplismou),
        borrowerName: borrower?.fullName || "Άγνωστο",
        equipmentName: equipment?.onoma || "Άγνωστο",
        hmerominia_daneismou: response.data.hmerominia_daneismou || new Date().toISOString(),
        hmerominia_epistrofis: response.data.hmerominia_epistrofis
      }]);
      setAddLoanDialogOpen(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη δανεισμού:", error);
      alert(`Σφάλμα κατά την προσθήκη δανεισμού: ${error.message}`);
    }
  };

  // Χειρισμός επεξεργασίας δανεισμού
  const handleEditLoan = async (editedLoan) => {
    try {
      const formattedLoan = {
        id_epafis: parseInt(editedLoan.id_epafis),
        id_eksoplismou: parseInt(editedLoan.id_eksoplismou),
        hmerominia_daneismou: editedLoan.hmerominia_daneismou || new Date().toISOString().split('T')[0],
        hmerominia_epistrofis: editedLoan.hmerominia_epistrofis || null
      };

      await axios.put(`http://localhost:5000/api/eksoplismos/daneismos/${editLoanData.id}`, formattedLoan);
      
      // Ενημέρωση του πίνακα
      setDaneismoiData(prevData => 
        prevData.map(item => 
          item.id === editLoanData.id 
            ? {
                ...item,
                ...formattedLoan,
                borrowerName: contactsList.find(c => c.id === parseInt(editedLoan.id_epafis))?.fullName || "Άγνωστο",
                equipmentName: eksoplismosData.find(e => e.id === parseInt(editedLoan.id_eksoplismou))?.onoma || "Άγνωστο"
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

  // Βελτιωμένη διαμόρφωση του loanDetailPanelConfig για σωστή εμφάνιση στοιχείων
  const loanDetailPanelConfig = {
    mainDetails: [],
    tables: [
      {
        title: "Στοιχεία Δανειζόμενου",
        accessor: "borrowerDetails",
        getData: (row) => {
          // Χρησιμοποιούμε τα δεδομένα του epafes αντικειμένου
          if (row.epafes) {
            return [{
              fullName: row.Name || `${row.epafes.onoma || ''} ${row.epafes.epitheto || ''}`.trim(),
              email: row.epafes.email || '-',
              tilefono: row.epafes.tilefono || '-'
            }];
          }
          return [];
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
          // Χρησιμοποιούμε τα δεδομένα του eksoplismos αντικειμένου
          if (row.eksoplismos) {
            return [{
              onoma: row.eksoplismos.onoma || '-',
              marka: row.eksoplismos.marka || '-',
              xroma: row.eksoplismos.xroma || '-',
              megethos: row.eksoplismos.megethos || '-',
              hmerominia_kataskeuis: row.eksoplismos.hmerominia_kataskeuis
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

  // Δημιουργία detailPanelConfig για τον εξοπλισμό
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
        accessor: "loanHistory",
        getData: (row) => {
          // Βρίσκουμε όλους τους δανεισμούς αυτού του εξοπλισμού
          return daneismoiData.filter(d => d.id_eksoplismou === row.id);
        },
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
      </div>
    </LocalizationProvider>
  );
}