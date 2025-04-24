import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

import DataTable from "../components/DataTable/DataTable";
import CustomCalendar from "../components/CustomCalendar";
import AddDialog from "../components/DataTable/AddDialog";
import * as yup from "yup";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import { differenceInDays } from 'date-fns';
import { Box, Typography, Paper } from '@mui/material';

// Στυλ για τη βελτίωση της εμφάνισης της σελίδας
const styles = {
  container: {
    padding: '20px',
    maxWidth: '100%', // Αλλαγή από fixed width σε 100%
    margin: '0 auto',
    overflow: 'hidden' // Προσθήκη overflow control
  },
  tableContainer: {
    marginBottom: '30px',
    width: '100%', // Διασφάλιση πλήρους πλάτους
    overflowX: 'auto', // Επιτρέπει το οριζόντιο scrolling αν χρειάζεται
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  calendarContainer: {
    marginTop: '30px',
    width: '100%',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto' // Επιτρέπει το scrolling στο ημερολόγιο αν χρειάζεται
  },
  header: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333'
  }
};

// Στήλες για τον πίνακα κρατήσεων - Προσαρμογή μεγεθών
const columns = [
  { accessorKey: "id", header: "ID", enableHiding: true, size: 60 },
  { accessorKey: "contactName", header: "Ονοματεπώνυμο", minSize: 180, size: 200 },
  { 
    accessorKey: "arrival", 
    header: "Ημ. Άφιξης",
    size: 120,
    Cell: ({ cell }) => {
      const value = cell.getValue();
      if (!value) return "-";
      return new Date(value).toLocaleDateString("el-GR");
    }
  },
  { 
    accessorKey: "departure", 
    header: "Ημ. Αναχώρησης",
    size: 120,
    Cell: ({ cell }) => {
      const value = cell.getValue();
      if (!value) return "-";
      return new Date(value).toLocaleDateString("el-GR");
    }
  },
  { accessorKey: "days", header: "Ημέρες", size: 80 },
  { accessorKey: "people", header: "Άτομα", size: 80 },
  { 
    accessorKey: "totalPrice", 
    header: "Συν. Τιμή",
    size: 100,
    Cell: ({ cell }) => {
      const value = cell.getValue();
      if (value === undefined || value === null) return "-";
      return `${value}€`;
    }
  },
  { 
    accessorKey: "balance", 
    header: "Υπόλοιπο",
    size: 100,
    Cell: ({ cell }) => {
      const value = cell.getValue();
      if (value === undefined || value === null) return "-";
      return `${value}€`;
    }
  }
];

export default function Katafigio() {
  const [bookings, setBookings] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addBookingDialogOpen, setAddBookingDialogOpen] = useState(false);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [editBookingData, setEditBookingData] = useState(null);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);

  // Φόρτωση δεδομένων από το backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Φορτώνουμε κρατήσεις, καταφύγια και επαφές
        const [bookingsRes, sheltersRes, contactsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/katafigio"),
          axios.get("http://localhost:5000/api/katafigio/katafygia"),
          axios.get("http://localhost:5000/api/Repafes")
        ]);
        
        // Διαμόρφωση των επαφών για χρήση σε φόρμες
        const formattedContacts = contactsRes.data.map(contact => ({
          id: contact.id_epafis,
          id_epafis: contact.id_epafis,
          fullName: `${contact.onoma || ''} ${contact.epitheto || ''}`.trim(),
          email: contact.email,
          tilefono: contact.tilefono
        }));
        
        setBookings(bookingsRes.data);
        setShelters(sheltersRes.data);
        setContacts(formattedContacts);
        setLoading(false);
        
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Διαμόρφωση του πίνακα λεπτομερειών για τις κρατήσεις
  const bookingDetailPanelConfig = {
    mainDetails: [
      { accessor: "contactName", header: "Ονοματεπώνυμο" },
      { accessor: "contactEmail", header: "Email" },
      { accessor: "contactPhone", header: "Τηλέφωνο" },
      { accessor: "shelterName", header: "Καταφύγιο" },
      { 
        accessor: "arrival", 
        header: "Ημερομηνία Άφιξης",
        format: value => value ? new Date(value).toLocaleDateString("el-GR") : "-"
      },
      { 
        accessor: "departure", 
        header: "Ημερομηνία Αναχώρησης",
        format: value => value ? new Date(value).toLocaleDateString("el-GR") : "-"
      },
      { accessor: "days", header: "Ημέρες Παραμονής" },
      { accessor: "members", header: "Μέλη Συλλόγου" },
      { accessor: "nonMembers", header: "Μη Μέλη" },
      { accessor: "people", header: "Συνολικά Άτομα" },
      { accessor: "externalSpace", header: "Εξωτερικός Χώρος" },
      { 
        accessor: "totalPrice", 
        header: "Συνολική Τιμή",
        format: value => value !== undefined ? `${value}€` : "-"
      },
      { 
        accessor: "balance", 
        header: "Υπόλοιπο",
        format: value => value !== undefined ? `${value}€` : "-"
      },
      { 
        accessor: "bookingDate", 
        header: "Ημερομηνία Κράτησης",
        format: value => value ? new Date(value).toLocaleDateString("el-GR") : "-"
      }
    ],
    tables: [
      {
        title: "Πληρωμές",
        accessor: "payments",
        getData: (row) => {
          return row.payments || [];
        },
        columns: [
          { accessor: "id", header: "ID", enableHiding: true },
          { 
            accessor: "amount", 
            header: "Ποσό",
            Cell: ({ value }) => `${value}€`
          },
          { 
            accessor: "date", 
            header: "Ημερομηνία",
            Cell: ({ value }) => value ? new Date(value).toLocaleDateString("el-GR") : "-"
          }
        ],
        onAddNew: (bookingId) => handleAddPayment(bookingId)
      }
    ]
  };

  // Πεδία φόρμας για τις κρατήσεις
  const bookingFormFields = [
    { 
      accessorKey: "id_epafis", 
      header: "Άτομο Επικοινωνίας", 
      type: "select", // Αλλαγή από tableSelect σε select
      options: contacts.map(contact => ({ 
        value: contact.id_epafis.toString(), 
        label: `${contact.fullName} (${contact.email || contact.tilefono || 'Χωρίς στοιχεία'})` 
      })),
      validation: yup.string().required("Παρακαλώ επιλέξτε άτομο επικοινωνίας")
    },
    { 
      accessorKey: "id_katafigiou", 
      header: "Καταφύγιο", 
      type: "select", // Αλλαγή από tableSelect σε select
      options: shelters.map(shelter => ({ 
        value: shelter.id_katafigiou.toString(), 
        label: `${shelter.onoma} (${shelter.xoritikotita} άτομα, ${shelter.timi_melous}€/${shelter.timi_mi_melous}€)` 
      })),
      validation: yup.string().required("Παρακαλώ επιλέξτε καταφύγιο")
    },
    { 
      accessorKey: "hmerominia_afiksis", 
      header: "Ημερομηνία Άφιξης", 
      type: "date",
      validation: yup.date().required("Παρακαλώ επιλέξτε ημερομηνία άφιξης")
    },
    { 
      accessorKey: "hmerominia_epistrofis", 
      header: "Ημερομηνία Αναχώρησης", 
      type: "date",
      validation: yup.date().required("Παρακαλώ επιλέξτε ημερομηνία αναχώρησης")
    },
    { 
      accessorKey: "arithmos_melwn", 
      header: "Αριθμός Μελών", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός").required("Παρακαλώ συμπληρώστε αριθμό μελών")
    },
    { 
      accessorKey: "arithmos_mi_melwn", 
      header: "Αριθμός Μη Μελών", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός").required("Παρακαλώ συμπληρώστε αριθμό μη μελών")
    },
    { 
      accessorKey: "eksoterikos_xoros", 
      header: "Εξωτερικός Χώρος", 
      type: "select",
      options: [
        { value: "Ναι", label: "Ναι" },
        { value: "Όχι", label: "Όχι" }
      ],
      defaultValue: "Όχι"
    },
    { 
      accessorKey: "initialPayment", 
      header: "Αρχική Πληρωμή", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός")
    }
  ];

  // Create a separate fields array for the edit dialog
  const editBookingFormFields = [...bookingFormFields]; // Copy all fields including initialPayment

  // Πεδία φόρμας για τις πληρωμές
  const paymentFormFields = [
    { 
      accessorKey: "poso", 
      header: "Ποσό Πληρωμής", 
      type: "number",
      validation: yup.number().min(1, "Το ποσό πρέπει να είναι μεγαλύτερο του 0").required("Παρακαλώ εισάγετε ποσό")
    }
  ];

  // Χειριστής προσθήκης νέας κράτησης
  const handleAddBooking = async (newBooking) => {
    try {
      // Διαμόρφωση δεδομένων για το API
      const formattedBooking = {
        id_epafis: parseInt(newBooking.id_epafis),
        id_katafigiou: parseInt(newBooking.id_katafigiou),
        hmerominia_afiksis: newBooking.hmerominia_afiksis,
        hmerominia_epistrofis: newBooking.hmerominia_epistrofis,
        arithmos_melwn: parseInt(newBooking.arithmos_melwn || 0),
        arithmos_mi_melwn: parseInt(newBooking.arithmos_mi_melwn || 0),
        eksoterikos_xoros: newBooking.eksoterikos_xoros || "Όχι",
        initialPayment: newBooking.initialPayment ? parseInt(newBooking.initialPayment) : 0
      };
      
      // Αποστολή στο API
      const response = await axios.post("http://localhost:5000/api/katafigio", formattedBooking);
      
      // Προσθήκη στα τοπικά δεδομένα
      setBookings(prevBookings => [...prevBookings, response.data]);
      
      // Κλείσιμο του dialog
      setAddBookingDialogOpen(false);
      
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη κράτησης:", error);
      alert(`Σφάλμα κατά την προσθήκη κράτησης: ${error.message}`);
    }
  };

  // Update the edit booking handler to handle initialPayment separately as a new payment
  const handleEditBooking = async (editedBooking) => {
    try {
      if (!editBookingData || !editBookingData.id) {
        throw new Error("Δεν υπάρχουν δεδομένα για επεξεργασία");
      }
      
      // Διαχωρίζουμε το initialPayment από τα δεδομένα της κράτησης
      const { initialPayment, ...bookingData } = editedBooking;
      
      // Διαμόρφωση δεδομένων κράτησης για το API
      const formattedBooking = {
        id_epafis: parseInt(bookingData.id_epafis),
        id_katafigiou: parseInt(bookingData.id_katafigiou),
        hmerominia_afiksis: bookingData.hmerominia_afiksis,
        hmerominia_epistrofis: bookingData.hmerominia_epistrofis,
        arithmos_melwn: parseInt(bookingData.arithmos_melwn || 0),
        arithmos_mi_melwn: parseInt(bookingData.arithmos_mi_melwn || 0),
        eksoterikos_xoros: bookingData.eksoterikos_xoros || "Όχι"
      };
      
      // Αποστολή ενημέρωσης κράτησης στο API
      const response = await axios.put(`http://localhost:5000/api/katafigio/${editBookingData.id}`, formattedBooking);
      
      // Αν παρέχεται initialPayment, προσθέτουμε νέα πληρωμή
      let updatedBooking = response.data;
      if (initialPayment && parseInt(initialPayment) > 0) {
        const paymentData = {
          id_epafis: parseInt(bookingData.id_epafis),
          poso: parseInt(initialPayment)
        };
        
        // Προσθέτουμε την πληρωμή χρησιμοποιώντας το endpoint πληρωμών
        const paymentResponse = await axios.post(
          `http://localhost:5000/api/katafigio/${editBookingData.id}/payment`, 
          paymentData
        );
        
        // Χρησιμοποιούμε τα ενημερωμένα δεδομένα από την απάντηση της πληρωμής
        updatedBooking = paymentResponse.data;
      }
      
      // Ενημέρωση των τοπικών δεδομένων
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === editBookingData.id ? updatedBooking : booking
        )
      );
      
      // Κλείσιμο του dialog
      setEditBookingDialogOpen(false);
      setEditBookingData(null);
      
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία κράτησης:", error);
      alert(`Σφάλμα κατά την επεξεργασία κράτησης: ${error.message}`);
    }
  };

  // Χειριστής διαγραφής κράτησης - αφαίρεση του διπλού ελέγχου επιβεβαίωσης
const handleDeleteBooking = async (id) => {
  try {
    // Αφαιρούμε τον έλεγχο επιβεβαίωσης από εδώ καθώς γίνεται ήδη από το DataTable
    // if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την κράτηση;")) {
    //   return;
    // }
    
    await axios.delete(`http://localhost:5000/api/katafigio/${id}`);
    
    // Αφαίρεση από τα τοπικά δεδομένα
    setBookings(prevBookings => prevBookings.filter(booking => booking.id !== id));
    
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή κράτησης:", error);
    alert("Σφάλμα κατά τη διαγραφή κράτησης.");
  }
};

  // Χειριστής για το άνοιγμα του dialog προσθήκης πληρωμής
  const handleAddPayment = (bookingId) => {
    setCurrentBookingId(bookingId);
    setAddPaymentDialogOpen(true);
  };

  // Χειριστής για την προσθήκη πληρωμής
const handleSubmitPayment = async (paymentData) => {
  try {
    if (!currentBookingId) {
      throw new Error("Δεν υπάρχει επιλεγμένη κράτηση");
    }
    
    // Βρίσκουμε την τρέχουσα κράτηση
    const currentBooking = bookings.find(b => b.id === currentBookingId);
    
    if (!currentBooking || !currentBooking.id_epafis) {
      throw new Error("Δεν βρέθηκε η επαφή για την κράτηση");
    }
    
    // Διαμόρφωση δεδομένων για το API
    const formattedPayment = {
      id_epafis: currentBooking.id_epafis,
      poso: parseInt(paymentData.poso)
    };
    
    // Αποστολή στο API
    const response = await axios.post(`http://localhost:5000/api/katafigio/${currentBookingId}/payment`, formattedPayment);
    
    // Ενημέρωση των τοπικών δεδομένων
    setBookings(prevBookings => 
      prevBookings.map(booking => {
        if (booking.id === currentBookingId) {
          // Δημιουργία νέας πληρωμής από την απάντηση
          const newPayment = {
            // Use a proper ID extraction from the response
            id: response.data.id || 
                (response.data.payment ? response.data.payment.id : null) ||
                (response.data.payments && response.data.payments.length > 0 ? 
                  response.data.payments[response.data.payments.length - 1].id : 
                  Date.now()), // Use timestamp instead of Math.random() as last resort
            amount: parseInt(paymentData.poso),
            date: new Date().toISOString()
          };
          
          // Έλεγχος και ενημέρωση του πίνακα πληρωμών
          const updatedPayments = [...(booking.payments || []), newPayment];
          
          // Ενημέρωση του υπολοίπου
          const updatedBalance = response.data.balance !== undefined ? response.data.balance : 
                               (booking.totalPrice || 0) - updatedPayments.reduce((sum, p) => sum + p.amount, 0);
          
          // Επιστροφή της ενημερωμένης κράτησης
          return {
            ...booking,
            payments: updatedPayments,
            balance: updatedBalance
          };
        }
        return booking;
      })
    );
    
    // Κλείσιμο του dialog
    setAddPaymentDialogOpen(false);
    setCurrentBookingId(null);
    
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη πληρωμής:", error);
    alert(`Σφάλμα κατά την προσθήκη πληρωμής: ${error.message}`);
  }
};

  // Προσαρμογή του χειριστή για το άνοιγμα του dialog επεξεργασίας κράτησης

const handleEditBookingClick = (booking) => {
  // Μορφοποίηση ημερομηνιών για το dialog
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
  
  // Έλεγχος για τα απαραίτητα δεδομένα
  if (!booking || !booking.id) {
    console.error("Άκυρα δεδομένα κράτησης:", booking);
    alert("Σφάλμα: Η κράτηση δεν περιέχει έγκυρα δεδομένα.");
    return;
  }
  
  // Προετοιμασία των δεδομένων για το dialog - με σωστούς τύπους δεδομένων και ελέγχους για null
  const bookingData = {
    id: booking.id,
    id_epafis: booking.id_epafis ? booking.id_epafis.toString() : "", 
    id_katafigiou: booking.id_katafigiou ? booking.id_katafigiou.toString() : "",
    hmerominia_afiksis: formatDate(booking.arrival),
    hmerominia_epistrofis: formatDate(booking.departure),
    arithmos_melwn: booking.members || 0,
    arithmos_mi_melwn: booking.nonMembers || 0,
    eksoterikos_xoros: booking.externalSpace === "Αίθουσα 1" ? "Ναι" : booking.externalSpace || "Όχι"
  };
  
  setEditBookingData(bookingData);
  setEditBookingDialogOpen(true);
};

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={styles.container}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={styles.header}>
            Διαχείριση Κρατήσεων Καταφυγίου <span style={{color: '#666', fontSize: '0.9rem'}}>({bookings.length})</span>
          </Typography>
        </Box>
        
        <Paper sx={styles.tableContainer}>
          <DataTable
            data={bookings}
            columns={columns}
            detailPanelConfig={bookingDetailPanelConfig}
            getRowId={(row) => row.id}
            initialState={{
              columnVisibility: { id: false },
              sorting: [{ id: 'arrival', desc: false }]
            }}
            state={{ isLoading: loading }}
            enableExpand={true}
            enableRowActions={true}
            enableAddNew={true}
            onAddNew={() => setAddBookingDialogOpen(true)}
            handleEditClick={handleEditBookingClick}
            handleDelete={handleDeleteBooking}
            maxHeight="600px" // Προσθήκη μέγιστου ύψους με scroll
            density="compact" // Πιο συμπαγής εμφάνιση
          />
        </Paper>
        
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h5" sx={styles.header}>
            Ημερολόγιο Διαθεσιμότητας
          </Typography>
        </Box>
        
        <Paper sx={styles.calendarContainer}>
          <CustomCalendar bookings={bookings} shelters={shelters} />
        </Paper>
        
        {/* Τα dialogs παραμένουν ως έχουν */}
        <AddDialog
          open={addBookingDialogOpen}
          onClose={() => setAddBookingDialogOpen(false)}
          handleAddSave={handleAddBooking}  // Changed from onSubmit to handleAddSave
          title="Προσθήκη Νέας Κράτησης"
          fields={bookingFormFields}
          resourceData={{
            contactsList: contacts,
            sheltersList: shelters
          }}
        />
        
        <AddDialog
          open={editBookingDialogOpen}
          onClose={() => {
            setEditBookingDialogOpen(false);
            setEditBookingData(null);
          }}
          handleAddSave={handleEditBooking}  // Changed from onSubmit to handleAddSave
          initialValues={editBookingData}
          title="Επεξεργασία Κράτησης"
          fields={editBookingFormFields}
          resourceData={{
            contactsList: contacts,
            sheltersList: shelters
          }}
        />
        
        <AddDialog
          open={addPaymentDialogOpen}
          onClose={() => {
            setAddPaymentDialogOpen(false);
            setCurrentBookingId(null);
          }}
          handleAddSave={handleSubmitPayment}  // Changed from onSubmit to handleAddSave
          title="Προσθήκη Πληρωμής"
          fields={paymentFormFields}
        />
      </Box>
    </LocalizationProvider>
  );
}