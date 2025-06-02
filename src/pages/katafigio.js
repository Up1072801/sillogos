import React, { useState, useEffect } from "react";
import api from '../utils/api';
import "./App.css";

import DataTable from "../components/DataTable/DataTable";
import CustomCalendar from "../components/CustomCalendar";
import AddDialog from "../components/DataTable/AddDialog";
import * as yup from "yup";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import { differenceInDays } from 'date-fns';
import { Box, Typography, Paper, Button } from '@mui/material';

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
  const [dateFilter, setDateFilter] = useState(null); // για να αποθηκεύουμε το επιλεγμένο διάστημα
  const [filteredBookings, setFilteredBookings] = useState([]); // για τις φιλτραρισμένες κρατήσεις
  const [isFiltering, setIsFiltering] = useState(false); // για να δείχνουμε αν το φίλτρο είναι ενεργό
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Τρέχων μήνας (1-12)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Τρέχον έτος
  // Προσθέστε νέο state για το επιλεγμένο καταφύγιο
  const [selectedShelter, setSelectedShelter] = useState(""); // "all" σημαίνει όλα τα καταφύγια
  const [availableYears] = useState(() => 
    Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i)
  );
  const calendarRef = React.useRef();
  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState(null);

  // Φόρτωση δεδομένων από το backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Φορτώνουμε κρατήσεις, καταφύγια και επαφές
        const [bookingsRes, sheltersRes, contactsRes] = await Promise.all([
          api.get("/katafigio"),
          api.get("/katafigio/katafygia"),
          api.get("/Repafes")
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

  // Set initial shelter when data loads
  useEffect(() => {
    if (shelters.length > 0 && !selectedShelter) {
      setSelectedShelter(shelters[0].id_katafigiou.toString());
    }
  }, [shelters]);

  // Make filteredBookings depend on selectedShelter
  useEffect(() => {
    if (selectedShelter && bookings.length > 0) {
      const filtered = bookings.filter(booking => 
        String(booking.id_katafigiou) === selectedShelter
      );
      setFilteredBookings(filtered);
      setIsFiltering(true);
    } else if (bookings.length > 0) {
      setFilteredBookings(bookings);
    }
  }, [bookings, selectedShelter]);

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
          // Removed ID column as requested
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
        onAddNew: (bookingId) => handleAddPayment(bookingId),
        onEdit: (payment) => handleEditPayment(payment),
        onDelete: (payment) => handleDeletePayment(payment)
      }
    ]
  };

  // Πεδία φόρμας για τις κρατήσεις
  const bookingFormFields = [
    { 
      accessorKey: "id_epafis", 
      header: "Επαφή",
      type: "tableSelect",               // Αλλαγή από "select" σε "tableSelect"
      dataKey: "contactsList",           // Πρέπει να αντιστοιχεί στο κλειδί στο resourceData
      singleSelect: true,                // Ενεργοποίηση μονής επιλογής
      pageSize: 5,                       // 5 επαφές ανά σελίδα
      columns: [                         // Ορισμός στηλών που θα εμφανίζονται
        { field: "fullName", header: "Ονοματεπώνυμο" },
        { field: "email", header: "Email" },
        { field: "tilefono", header: "Τηλέφωνο" }
      ],
      searchFields: ["fullName", "email", "tilefono"], // Πεδία για αναζήτηση
      noDataMessage: "Δεν βρέθηκαν επαφές",
      validation: yup.mixed().required("Παρακαλώ επιλέξτε επαφή")
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
      accessorKey: "eksoterikos_xoros", 
      header: "Εξωτερικός Χώρος", 
      type: "select",
      options: [
        { value: "Όχι", label: "Όχι" },
        { value: "Ναι", label: "Ναι" }
      ],
      defaultValue: "Όχι"
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
      accessorKey: "initialPayment", 
      header: "Αρχική Πληρωμή", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός")
    }
  ];

// Δημιουργία περιορισμένης λίστας επεξεργάσιμων πεδίων για κρατήσεις
const editBookingFormFields = [
  // Μόνο τα παρακάτω πεδία θα είναι διαθέσιμα για επεξεργασία
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
    accessorKey: "eksoterikos_xoros", 
    header: "Εξωτερικός Χώρος", 
    type: "select",
    options: [
      { value: "Όχι", label: "Όχι" },
      { value: "Ναι", label: "Ναι" }
    ],
    defaultValue: "Όχι"
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
  }
];

  // Πεδία φόρμας για τις πληρωμές
  const paymentFormFields = [
    { 
      accessorKey: "poso", 
      header: "Ποσό Πληρωμής", 
      type: "number",
      validation: yup.number().min(1, "Το ποσό πρέπει να είναι μεγαλύτερο του 0").required("Παρακαλώ εισάγετε ποσό")
    },
    {
      accessorKey: "hmerominia", 
      header: "Ημερομηνία Πληρωμής", 
      type: "date",
      defaultValue: new Date().toISOString().split('T')[0]
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
      const response = await api.post("/katafigio", formattedBooking);
      
      // Προσθήκη στα τοπικά δεδομένα
      setBookings(prevBookings => [...prevBookings, response.data]);
      
      // Κλείσιμο του dialog
      setAddBookingDialogOpen(false);
      
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη κράτησης:", error);
      alert(`Σφάλμα κατά την προσθήκη κράτησης: ${error.message}`);
    }
  };

// Αντικαταστήστε τη συνάρτηση handleEditBooking με την παρακάτω

const handleEditBooking = async (editedBooking) => {
  try {
    if (!editBookingData || !editBookingData.id) {
      throw new Error("Δεν υπάρχουν δεδομένα για επεξεργασία");
    }
    
    // Διαμόρφωση δεδομένων κράτησης για το API
    // Διατηρούμε τα αρχικά δεδομένα για τα μη επεξεργάσιμα πεδία
    const formattedBooking = {
      // Διατηρούμε τις αρχικές τιμές από το editBookingData
      id_epafis: parseInt(editBookingData.id_epafis),
      id_katafigiou: parseInt(editBookingData.id_katafigiou),
      
      // Επιτρέπουμε την επεξεργασία αυτών των πεδίων
      hmerominia_afiksis: editedBooking.hmerominia_afiksis,
      hmerominia_epistrofis: editedBooking.hmerominia_epistrofis,
      arithmos_melwn: parseInt(editedBooking.arithmos_melwn || 0),
      arithmos_mi_melwn: parseInt(editedBooking.arithmos_mi_melwn || 0),
      eksoterikos_xoros: editedBooking.eksoterikos_xoros || "Όχι"
    };
    
    // Αποστολή ενημέρωσης κράτησης στο API
    const response = await api.put(`/katafigio/${editBookingData.id}`, formattedBooking);
    
    // ΔΕΝ επεξεργαζόμαστε πλέον την αρχική πληρωμή στην επεξεργασία κράτησης
    let updatedBooking = response.data;
    
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
    
    await api.delete(`/katafigio/${id}`);
    
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
      poso: parseInt(paymentData.poso),
      hmerominia: paymentData.hmerominia || new Date().toISOString().split('T')[0]
    };
    
    // Αποστολή στο API
    const response = await api.post(`/katafigio/${currentBookingId}/payment`, formattedPayment);
    
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
            date: paymentData.hmerominia || new Date().toISOString()
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

// Προσθέστε αυτή τη συνάρτηση μετά το handleSubmitPayment
const handleEditPayment = (payment) => {
  try {
    // Εύρεση της κράτησης στην οποία ανήκει η πληρωμή
    const bookingWithPayment = bookings.find(
      booking => booking.payments?.some(p => p.id === payment.id)
    );

    if (!bookingWithPayment) {
      throw new Error("Δεν βρέθηκε η κράτηση που περιέχει την πληρωμή");
    }

    // Προετοιμασία των δεδομένων της πληρωμής για επεξεργασία
    setEditPaymentData({
      id: payment.id,
      poso: payment.amount,
      hmerominia: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    
    setCurrentBookingId(bookingWithPayment.id);
    setEditPaymentDialogOpen(true);
  } catch (error) {
    console.error("Σφάλμα κατά την προετοιμασία επεξεργασίας πληρωμής:", error);
    alert(`Σφάλμα: ${error.message}`);
  }
};

const handleSaveEditedPayment = async (editedPayment) => {
  try {
    // Διασφάλιση ότι έχουμε τα απαραίτητα δεδομένα
    if (!editPaymentData || !currentBookingId) {
      throw new Error("Λείπουν απαραίτητα δεδομένα για την επεξεργασία");
    }

    const formattedPayment = {
      poso: parseInt(editedPayment.poso),
      hmerominia: editedPayment.hmerominia
    };

    // Κλήση στο API για επεξεργασία πληρωμής
    const response = await api.put(
      `/katafigio/${currentBookingId}/payment/${editPaymentData.id}`, 
      formattedPayment
    );

    // Ενημέρωση τοπικών δεδομένων
    setBookings(prevBookings => 
      prevBookings.map(booking => {
        if (booking.id === currentBookingId) {
          const updatedPayments = booking.payments.map(p => 
            p.id === editPaymentData.id 
              ? { ...p, amount: parseInt(editedPayment.poso), date: editedPayment.hmerominia }
              : p
          );
          
          // Ενημέρωση υπολοίπου
          const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
          const updatedBalance = booking.totalPrice - totalPaid;
          
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
    setEditPaymentDialogOpen(false);
    setEditPaymentData(null);
    setCurrentBookingId(null);

  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία πληρωμής:", error);
    alert(`Σφάλμα: ${error.message}`);
  }
};

const handleDeletePayment = async (payment) => {
  try {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την πληρωμή;")) {
      return;
    }

    // Εύρεση της κράτησης στην οποία ανήκει η πληρωμή
    const bookingWithPayment = bookings.find(
      booking => booking.payments?.some(p => p.id === payment.id)
    );

    if (!bookingWithPayment) {
      throw new Error("Δεν βρέθηκε η κράτηση που περιέχει την πληρωμή");
    }

    // Κλήση του API για διαγραφή της πληρωμής
    await api.delete(`/katafigio/${bookingWithPayment.id}/payment/${payment.id}`);

    // Ενημέρωση των τοπικών δεδομένων
    setBookings(prevBookings => 
      prevBookings.map(booking => {
        if (booking.id === bookingWithPayment.id) {
          // Αφαίρεση της πληρωμής
          const updatedPayments = booking.payments.filter(p => p.id !== payment.id);
          // Ενημέρωση υπολοίπου
          const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
          const updatedBalance = booking.totalPrice - totalPaid;
          
          return {
            ...booking,
            payments: updatedPayments,
            balance: updatedBalance
          };
        }
        return booking;
      })
    );
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή πληρωμής:", error);
    alert(`Σφάλμα: ${error.message}`);
  }
};

 // Ενημερώστε τη συνάρτηση handleCalendarDateChange για να λαμβάνει υπόψη το επιλεγμένο καταφύγιο
const handleCalendarDateChange = (startDate, endDate) => {
  // Αρχικοποίηση του φιλτραρίσματος με όλες τις κρατήσεις
  let filtered = [...bookings];
  
  // Φιλτράρισμα με βάση το καταφύγιο, αν έχει επιλεγεί συγκεκριμένο
  if (selectedShelter !== "all") {
    filtered = filtered.filter(booking => 
      String(booking.id_katafigiou) === selectedShelter
    );
  }
  
  // Αν δεν έχουμε ημερομηνίες, επιστρέφουμε μόνο το φίλτρο καταφυγίου
  if (!startDate || !endDate) {
    setFilteredBookings(filtered);
    setIsFiltering(selectedShelter !== "all");
    return;
  }
  
  // Μετατροπή των ημερομηνιών σε αντικείμενα Date για σωστή σύγκριση
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  // Φιλτράρισμα κρατήσεων βασισμένο στο αν επικαλύπτονται με το επιλεγμένο διάστημα
  filtered = filtered.filter(booking => {
    if (!booking.arrival || !booking.departure) return false;
    
    const arrivalDate = new Date(booking.arrival);
    const departureDate = new Date(booking.departure);
    
    // Ελέγχουμε αν η κράτηση επικαλύπτεται με το επιλεγμένο διάστημα
    return (
      (arrivalDate >= start && arrivalDate <= end) || // Άφιξη μέσα στο διάστημα
      (departureDate >= start && departureDate <= end) || // Αναχώρηση μέσα στο διάστημα
      (arrivalDate <= start && departureDate >= end) // Κράτηση καλύπτει όλο το διάστημα
    );
  });
  
  setFilteredBookings(filtered);
  setDateFilter({ start, end });
  setIsFiltering(true);
};

// Προσθέστε τη συνάρτηση χειρισμού αλλαγής καταφυγίου
const handleShelterChange = (shelterId) => {
  setSelectedShelter(shelterId);
  
  // Καθαρισμός του φίλτρου ημερομηνίας κατά την αλλαγή καταφυγίου
  setDateFilter(null);
  
  // Φιλτράρισμα κρατήσεων για το επιλεγμένο καταφύγιο
  if (bookings.length > 0) {
    const filtered = bookings.filter(booking => 
      String(booking.id_katafigiou) === shelterId
    );
    setFilteredBookings(filtered);
    setIsFiltering(true);
  }
};

// Συνάρτηση για καθαρισμό του φίλτρου
// Συνάρτηση για καθαρισμό του φίλτρου ημερομηνιών
const clearDateFilter = () => {
  // Διατήρηση του φίλτρου καταφυγίου αν υπάρχει
  if (selectedShelter !== "all") {
    const filtered = bookings.filter(booking => 
      String(booking.id_katafigiou) === selectedShelter
    );
    setFilteredBookings(filtered);
    setIsFiltering(true);
  } else {
    setFilteredBookings(bookings);
    setIsFiltering(false);
  }
  setDateFilter(null);
};

// Προσθέστε αυτήν τη συνάρτηση μετά το clearDateFilter αλλά πριν το useEffect
const applyDateFilter = () => {
  // Δημιουργία της πρώτης και τελευταίας ημέρας του επιλεγμένου μήνα και έτους
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0); // Τελευταία ημέρα του μήνα
  
  // Εφαρμογή του φίλτρου με τη χρήση της υπάρχουσας συνάρτησης
  handleCalendarDateChange(startDate, endDate);
  
  // Ενημέρωση του ημερολογίου αν έχει το συγκεκριμένο ref
  if (calendarRef.current && typeof calendarRef.current.updateCalendarView === 'function') {
    calendarRef.current.updateCalendarView(selectedMonth, selectedYear);
  }
};

// Προσθέστε αυτό το useEffect για να ενημέρωνετε το filteredBookings όταν αλλάζουν τα bookings
useEffect(() => {
  // Only update filtered bookings when bookings or selectedShelter changes
  // Don't call handleCalendarDateChange again from here
  if (selectedShelter) {
    let filtered = bookings.filter(booking => 
      String(booking.id_katafigiou) === selectedShelter
    );
    
    // If there's also a date filter, apply it directly
    if (dateFilter) {
      filtered = filtered.filter(booking => {
        if (!booking.arrival || !booking.departure) return false;
        
        const arrivalDate = new Date(booking.arrival);
        const departureDate = new Date(booking.departure);
        
        return (
          (arrivalDate >= dateFilter.start && arrivalDate <= dateFilter.end) ||
          (departureDate >= dateFilter.start && departureDate <= dateFilter.end) ||
          (arrivalDate <= dateFilter.start && departureDate >= dateFilter.end)
        );
      });
    }
    
    setFilteredBookings(filtered);
    setIsFiltering(true);
  } else {
    setFilteredBookings(bookings);
    setIsFiltering(false);
  }
}, [bookings, selectedShelter, dateFilter]);

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
    eksoterikos_xoros: booking.externalSpace === "Αίθουσα 1" ? "Ναι" : booking.externalSpace || "Όχι",
    // Προσθήκη της συνολικής τιμής για εύκολη αναφορά
    totalPrice: booking.totalPrice
  };
  
  
  setEditBookingData(bookingData);
  setEditBookingDialogOpen(true);
};

// Αντικαταστήστε τη συνάρτηση calculateBookingCost με αυτή:
const calculateBookingCost = (formValues, resourceData) => {
  try {
    // For debugging

    // Αντίγραφο των formValues για ασφαλή τροποποίηση
    let values = { ...formValues };
    
    // Ειδική περίπτωση για τις περιορισμένες επεξεργάσιμες φόρμες
    if (!values.id_katafigiou && resourceData?.currentBookingData) {
      
      // Προσθήκη του id_katafigiou από το currentBookingData
      values.id_katafigiou = resourceData.currentBookingData.id_katafigiou;
    }

    // Έλεγχος ξανά μετά τη συμπλήρωση
    if (!values.id_katafigiou || !values.hmerominia_afiksis || !values.hmerominia_epistrofis) {
     
      return null;
    }
    
    // Μετατροπή του id_katafigiou σε string για ασφαλή σύγκριση
    const shelterId = String(values.id_katafigiou);
    
    // Εύρεση του επιλεγμένου καταφυγίου
    const sheltersList = resourceData?.sheltersList || [];
   
    
    const selectedShelter = sheltersList.find(s => 
      String(s.id_katafigiou) === shelterId
    );
    
    if (!selectedShelter) {
      return null;
    }
    
  
    
    const arrival = new Date(values.hmerominia_afiksis);
    const departure = new Date(values.hmerominia_epistrofis);
    
    if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
      return null;
    }
    
    // Διόρθωση: Υπολογίζουμε τις διανυκτερεύσεις χωρίς να προσθέτουμε +1
    // Για παράδειγμα: 28/5 έως 29/5 = 1 διανυκτέρευση
    const nights = Math.max(1, differenceInDays(departure, arrival));
    const members = parseInt(values.arithmos_melwn) || 0;
    const nonMembers = parseInt(values.arithmos_mi_melwn) || 0;
    
    // Επιλογή τιμής ανάλογα με τον τύπο χώρου (εσωτερικό ή εξωτερικό)
    let memberPrice, nonMemberPrice;
    
    if (values.eksoterikos_xoros === "Ναι") {
      // Τιμές για εξωτερικό χώρο - βεβαιωνόμαστε ότι χρησιμοποιούμε τα σωστά πεδία
      memberPrice = members * (parseInt(selectedShelter.timi_eksoxwrou_melos) || 0) * nights;
      nonMemberPrice = nonMembers * (parseInt(selectedShelter.timi_eksoxwroy_mimelos) || 0) * nights;
    
    } else {
      // Τιμές για εσωτερικό χώρο (καταφύγιο)
      memberPrice = members * (parseInt(selectedShelter.timi_melous) || 0) * nights;
      nonMemberPrice = nonMembers * (parseInt(selectedShelter.timi_mi_melous) || 0) * nights;

    }
    
    const totalPrice = memberPrice + nonMemberPrice;
    
    
    return {
      days: nights, // Κρατάμε το όνομα "days" για συμβατότητα, αλλά είναι διανυκτερεύσεις
      memberPrice,
      nonMemberPrice,
      totalPrice
    };
  } catch (error) {
    console.error("Σφάλμα στον υπολογισμό κόστους:", error);
    return null;
  }
};

  // Αλλάξτε το JSX ξεκινώντας μετά το Box με την κλάση sx={{ mb: 3 }} που περιέχει τον τίτλο
return (
  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
    <Box sx={styles.container}>
      {/* Add prominent shelter selector at the top */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ ...styles.header, mb: 3 }}>
          Επιλογή Καταφυγίου
        </Typography>
        
        <select 
          value={selectedShelter}
          onChange={(e) => handleShelterChange(e.target.value)}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: '2px solid #2196f3', 
            minWidth: '300px',
            fontSize: '1.1rem',
            textAlign: 'center',
            marginBottom: '20px'
          }}
        >
          {shelters.map((shelter) => (
            <option key={shelter.id_katafigiou} value={shelter.id_katafigiou.toString()}>
              {shelter.onoma}
            </option>
          ))}
        </select>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={styles.header}>
          Διαχείριση Κρατήσεων Καταφυγίου 
          <span style={{color: '#666', fontSize: '0.9rem'}}>
            ({filteredBookings.length}/{bookings.filter(b => String(b.id_katafigiou) === selectedShelter).length})
          </span>
        </Typography>
        
        {/* Date filter options - remove shelter selection from here */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Μήνας:</Typography>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("el-GR", { month: "long" })}
                </option>
              ))}
            </select>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Έτος:</Typography>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </Box>
          
          <Button 
            variant="contained" 
            color="primary"
            size="small"
            onClick={applyDateFilter}
            sx={{ mr: 2 }}
          >
            Προβολή Κρατήσεων
          </Button>
          
          {isFiltering && (
            <Button 
              size="small" 
              variant="outlined" 
              onClick={clearDateFilter}
            >
              Καθαρισμός Φίλτρου
            </Button>
          )}
        </Box>
        
        {/* Ένδειξη ενεργού φίλτρου */}
        {isFiltering && (
          <Typography variant="body2" color="primary" sx={{ my: 1 }}>
            Φιλτράρισμα: {dateFilter?.start.toLocaleDateString('el-GR')} - {dateFilter?.end.toLocaleDateString('el-GR')}
          </Typography>
        )}
      </Box>
      
      <Paper sx={styles.tableContainer}>
        <DataTable
          data={filteredBookings} // Χρησιμοποιούμε τις φιλτραρισμένες κρατήσεις αντί για όλες
          columns={columns}
          detailPanelConfig={bookingDetailPanelConfig}
          getRowId={(row) => row.id}
          initialState={{
            columnVisibility: { id: false },
            sorting: [{ id: 'arrival', desc: false }] // Sort by arrival date (asc)
          }}
          state={{ isLoading: loading }}
          enableExpand={true}
          enableRowActions={true}
          enableAddNew={true}
          onAddNew={() => setAddBookingDialogOpen(true)}
          handleEditClick={handleEditBookingClick}
          handleDelete={handleDeleteBooking}
          maxHeight="600px"
          density="compact"
        />
      </Paper>
      
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" sx={styles.header}>
          Ημερολόγιο Διαθεσιμότητας
        </Typography>
      </Box>
      
      <Paper sx={styles.calendarContainer}>
        <CustomCalendar 
          ref={calendarRef}
          bookings={selectedShelter === "all" ? bookings : bookings.filter(b => String(b.id_katafigiou) === selectedShelter)} 
          shelters={shelters} 
          onDateRangeChange={handleCalendarDateChange}
          selectedShelterId={selectedShelter !== "all" ? selectedShelter : null}
        />
      </Paper>
      
      {/* Τα υπόλοιπα dialogs παραμένουν ως έχουν */}
      <AddDialog
        open={addBookingDialogOpen}
        onClose={() => setAddBookingDialogOpen(false)}
        handleAddSave={handleAddBooking}
        title="Προσθήκη Νέας Κράτησης"
        fields={bookingFormFields}
        defaultValues={selectedShelter !== "all" ? { id_katafigiou: selectedShelter } : undefined}
        resourceData={{
          contactsList: contacts, // Το κλειδί "contactsList" πρέπει να αντιστοιχεί στο dataKey του πεδίου
          sheltersList: shelters,
          enableCostCalculation: true,         // Ενεργοποίηση υπολογισμού κόστους
          calculateCost: calculateBookingCost  // Πέρασμα συνάρτησης υπολογισμού
        }}
      />
      
      <AddDialog
        open={editBookingDialogOpen}
        onClose={() => {
          setEditBookingDialogOpen(false);
          setEditBookingData(null);
        }}
        handleAddSave={handleEditBooking}
        initialValues={editBookingData}
        title="Επεξεργασία Κράτησης"
        fields={editBookingFormFields} // Χρησιμοποιούμε τα περιορισμένα πεδία
        resourceData={{
          contactsList: contacts,
          sheltersList: shelters,
          enableCostCalculation: true,
          calculateCost: calculateBookingCost,
          showCostCalculation: true,
          // Κρίσιμη αλλαγή: Περνάμε το πλήρες αντικείμενο αντί μόνο το ID
          currentBookingData: editBookingData
        }}
        additionalInfo={
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" fontWeight="bold">
              Πληροφορίες Κόστους:
            </Typography>
            <Typography variant="body2">
              • Μέλη πληρώνουν {shelters.find(s => s.id_katafigiou.toString() === editBookingData?.id_katafigiou?.toString())?.timi_melous || '?'}€ ανά διανυκτέρευση (εσωτερικός χώρος)
            </Typography>
            <Typography variant="body2">
              • Μη μέλη πληρώνουν {shelters.find(s => s.id_katafigiou.toString() === editBookingData?.id_katafigiou?.toString())?.timi_mi_melous || '?'}€ ανά διανυκτέρευση (εσωτερικός χώρος)
            </Typography>
            <Typography variant="body2">
              • Μέλη πληρώνουν {shelters.find(s => s.id_katafigiou.toString() === editBookingData?.id_katafigiou?.toString())?.timi_eksoxwrou_melos || '?'}€ ανά διανυκτέρευση (εξωτερικός χώρος)
            </Typography>
            <Typography variant="body2">
              • Μη μέλη πληρώνουν {shelters.find(s => s.id_katafigiou.toString() === editBookingData?.id_katafigiou?.toString())?.timi_eksoxwroy_mimelos || '?'}€ ανά διανυκτέρευση (εξωτερικός χώρος)
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Αλλαγές στις ημερομηνίες, στο είδος χώρου ή στον αριθμό ατόμων θα επηρεάσουν το συνολικό κόστος.
            </Typography>
          </Box>
        }
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
      <AddDialog
        open={editPaymentDialogOpen}
        onClose={() => {
          setEditPaymentDialogOpen(false);
          setEditPaymentData(null);
          setCurrentBookingId(null);
        }}
        handleAddSave={handleSaveEditedPayment}
        initialValues={editPaymentData}
        title="Επεξεργασία Πληρωμής"
        fields={paymentFormFields}
      />
    </Box>
  </LocalizationProvider>
);
}