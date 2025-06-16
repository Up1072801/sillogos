import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import api from '../utils/api';
import { Box, Typography, Button } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import * as yup from "yup";
import * as XLSX from 'xlsx';

const fields = [
  { 
    accessorKey: "fullName", 
    header: "Ονοματεπώνυμο", 
    Cell: ({ row }) => `${row.original.melos?.epafes?.epitheto || ''} ${row.original.melos?.epafes?.onoma || ''}`,
    filterFn: (row, id, filterValue) => {
      const fullName = `${row.original.melos?.epafes?.epitheto || ''} ${row.original.melos?.epafes?.onoma || ''}`;
      return fullName.toLowerCase().includes(filterValue.toLowerCase());
    }
  },
  { accessorKey: "patronimo", header: "Πατρώνυμο", validation: yup.string() }, // Αφαίρεση .required()
  { accessorKey: "arithmos_mitroou", header: "Αριθμός Μητρώου" },
  { accessorKey: "odos", header: "Οδός", validation: yup.string() }, // Αφαίρεση .required()
  { accessorKey: "tk", header: "ΤΚ", validation: yup.number().nullable().transform((value, originalValue) => {
      if (originalValue === '' || originalValue === null) return null;
      return value;
    }).typeError("Πρέπει να είναι αριθμός") }, // Αφαίρεση .required()
{ 
  accessorKey: "melos.epafes.email", 
  header: "Email", 
  validation: yup.string().nullable().test('email-format', 'Μη έγκυρο email', function(value) {
    if (!value || value === '') return true;
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return emailRegex.test(value);
  })
},
  { 
    accessorKey: "melos.epafes.tilefono", 
    header: "Τηλέφωνο", 
    validation: yup.string().nullable().test('valid-phone', 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία και να περιέχει μόνο αριθμούς και το σύμβολο +', function(value) {
      if (!value || value === '') return true;
      const digitsOnly = value.replace(/[^0-9]/g, '');
      return /^[0-9+]+$/.test(value) && digitsOnly.length >= 10;
    })
  },
  { 
    accessorKey: "status", 
    header: "Κατάσταση", 
    Cell: ({ row }) => {
      const status = row.original.athlitis ? "Αθλητής" : row.original.status;
      return (
        <span style={getStatusStyle(status)}>
          {status}
        </span>
      );
    } 
  },
  { 
    accessorKey: "melos.vathmos_diskolias.epipedo", 
    header: "Βαθμός Δυσκολίας", 
    Cell: ({ row }) => row.original.melos?.vathmos_diskolias?.epipedo || '-' 
  },
  { 
    accessorKey: "eidosSindromis", 
    header: "Είδος Συνδρομής", 
    Cell: ({ row }) => row.original.eidosSindromis || '-' 
  },
  { 
    accessorKey: "subscriptionEndDate", 
    header: "Λήξη Συνδρομής",
    Cell: ({ row }) => formatDate(row.original.subscriptionEndDate) || "-"
  },
  { 
    accessorKey: "hmerominia_gennhshs", 
    header: "Ημ. Γέννησης",
    Cell: ({ row }) => formatDate(row.original.hmerominia_gennhshs)
  },
  {
    accessorKey: "hmerominia_egrafis",
    header: "Ημ. Εγγραφής",
    Cell: ({ row }) => formatDate(row.original.hmerominia_egrafis)
  },
  {
    accessorKey: "hmerominia_pliromis",
    header: "Ημ. Πληρωμής",
    Cell: ({ row }) => formatDate(row.original.hmerominia_pliromis)
  }
];

const detailPanelConfig = {
  mainDetails: [
    { accessor: "melos.epafes.onoma", header: "Όνομα" },
    { accessor: "melos.epafes.epitheto", header: "Επώνυμο" },
    { accessor: "patronimo", header: "Πατρώνυμο" },
    { accessor: "odos", header: "Οδός" },
    { accessor: "tk", header: "ΤΚ" },
    { accessor: "arithmos_mitroou", header: "Αρ. Μητρώου" },
    { 
      accessor: "hmerominia_gennhshs", 
      header: "Ημ. Γέννησης",
      format: (value) => formatDate(value)
    },
    { accessor: "melos.epafes.email", header: "Email" },
    { accessor: "melos.epafes.tilefono", header: "Τηλέφωνο" },
    { 
      accessor: "status", 
      header: "Κατάσταση",
      Cell: ({ row }) => {
        const status = row.original.athlitis ? "Αθλητής" : row.original.sindromitis?.katastasi_sindromis || '-';
        return <div style={getStatusStyle(status)}>{status}</div>;
      }
    },
    // Εμφάνιση είδους συνδρομής μόνο για μη αθλητές
    {
      accessor: "eidosSindromis",
      header: "Είδος Συνδρομής",
      shouldRender: (row) => !row.athlitis
    },
    { 
      accessor: "melos.vathmos_diskolias.epipedo", 
      header: "Βαθμός Δυσκολίας" 
    },
    // Εμφάνιση ημερομηνίας εγγραφής μόνο για μη αθλητές
    {
      accessor: "hmerominia_egrafis",
      header: "Ημ. Εγγραφής",
      format: (value) => formatDate(value),
      shouldRender: (row) => !row.athlitis
    },
    // Εμφάνιση ημερομηνίας πληρωμής μόνο για μη αθλητές
    {
      accessor: "hmerominia_pliromis",
      header: "Ημ. Πληρωμής",
      format: (value) => formatDate(value),
      shouldRender: (row) => !row.athlitis
    },
    // Εμφάνιση ημερομηνίας λήξης μόνο για μη αθλητές
    {
      accessor: "subscriptionEndDate",
      header: "Ημερομηνία Λήξης",
      shouldRender: (row) => !row.athlitis
    }
  ],
  tables: [
    {
      title: "Δραστηριότητες",
      accessor: "melos.simmetoxi",
      columns: [
        {
          accessor: "eksormisi.titlos",
          header: "Τίτλος Εξόρμησης",
          Cell: ({ row }) => {
            const eksormisiId = row.original.eksormisi?.id_eksormisis;
            const titlos = row.original.eksormisi?.titlos || "-";
            
            return eksormisiId ? (
              <a
                href={`/eksormisi/${eksormisiId}`}
                style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}
                onClick={e => { e.stopPropagation(); }}
              >
                {titlos}
              </a>
            ) : titlos;
          }
        },
        { 
          accessor: "drastiriotita.titlos", 
          header: "Τίτλος Δραστηριότητας",
          Cell: ({ row }) => row.original.drastiriotita?.titlos || "-"
        },
        { 
          accessor: "drastiriotita.vathmos_diskolias.epipedo", 
          header: "ΒΔ",
          Cell: ({ row }) => row.original.drastiriotita?.vathmos_diskolias?.epipedo || "-"
        },
        {
          accessor: "drastiriotita.hmerominia",
          header: "Ημερομηνία",
          Cell: ({ row }) => {
            const dateValue = row.original.drastiriotita?.hmerominia;
            if (!dateValue) return "-";
            
            try {
              // Check if the value is already a formatted string (contains /)
              if (typeof dateValue === 'string' && dateValue.includes('/')) {
                // Parse the Greek formatted date (D/M/YYYY or DD/MM/YYYY)
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  // Ensure day and month are always two digits
                  const day = String(parseInt(parts[0])).padStart(2, '0');
                  const month = String(parseInt(parts[1])).padStart(2, '0');
                  const year = parts[2];
                  
                  return `${day}/${month}/${year}`;
                }
                return dateValue; // Return as-is if we can't parse it
              }
              
              // If it's not already formatted, treat it as a raw date
              const date = new Date(dateValue);
              if (isNaN(date.getTime())) return "-";
              
              // Explicitly format as DD/MM/YYYY
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              
              return `${day}/${month}/${year}`;
            } catch (e) {
              console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e, dateValue);
              return "-";
            }
          }
        }
      ],
      getData: (row) => {
        // Get all active participations
        const simmetoxes = (row.melos?.simmetoxi || []).filter(item => item.katastasi === "Ενεργή");
        
        // Flatten the structure to create one row per activity
        const activities = [];
        
        simmetoxes.forEach(simmetoxi => {
          if (simmetoxi.simmetoxi_drastiriotites && simmetoxi.simmetoxi_drastiriotites.length > 0) {
            // Create a row for each activity in this participation
            simmetoxi.simmetoxi_drastiriotites.forEach(rel => {
              if (rel.drastiriotita) {
                activities.push({
                  id_simmetoxis: simmetoxi.id_simmetoxis,
                  eksormisi: simmetoxi.eksormisi,
                  drastiriotita: rel.drastiriotita
                });
              }
            });
          } else if (simmetoxi.drastiriotita) {
            // Backward compatibility for old data structure
            activities.push({
              id_simmetoxis: simmetoxi.id_simmetoxis,
              eksormisi: simmetoxi.eksormisi,
              drastiriotita: simmetoxi.drastiriotita
            });
          }
        });
        
        return activities;
      },
      noRowHover: true,
      noRowClick: true
    },
    {
      title: "Σχολές",
      accessor: "melos.parakolouthisi",
      columns: [
        {
          accessor: "sxoli.onoma_sxolis",
          header: "Σχολή",
          Cell: ({ row }) => {
            const sxoli = row.original.sxoli;
            if (!sxoli) return "-";
            const sxoliId = sxoli.id_sxolis;
            // Ενώνουμε τίτλο, κλάδο, επίπεδο, έτος
            const onomaSxolis = [
              sxoli.titlos,
              sxoli.klados,
              sxoli.epipedo,
              sxoli.etos
            ].filter(Boolean).join("   ");
            return sxoliId ? (
              <a
                href={`/sxoles/${sxoliId}`}
                style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/sxoles/${sxoliId}`; // Updated from /school/ to /sxoles/
                }}
              >
                {onomaSxolis}
              </a>
            ) : onomaSxolis || "-";
          }
        }
      ],
      getData: (row) => (row.melos?.parakolouthisi || []).filter(item => item.katastasi === "Ενεργή"),
      noRowHover: true,
      noRowClick: true
    },
    // Προσθήκη νέου πίνακα για τις εξορμήσεις όπου το μέλος είναι υπεύθυνος
    {
      title: "Υπεύθυνος Δραστηριοτήτων",
      accessor: "ypefthinos_se",
      columns: [
        {
          accessor: "eksormisi.titlos",
          header: "Τίτλος Εξόρμησης",
          Cell: ({ row }) => {
            const eksormisiId = row.original.eksormisi?.id_eksormisis;
            const titlos = row.original.eksormisi?.titlos || "-";
            return eksormisiId ? (
              <a
                href={`/eksormisi/${eksormisiId}`}
                style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}
                onClick={e => { e.stopPropagation(); }}
              >
                {titlos}
              </a>
            ) : titlos;
          }
        },
        { 
          accessor: "eksormisi.proorismos", 
          header: "Προορισμός" 
        },
        {
          accessor: "eksormisi.hmerominia_anaxorisis",
          header: "Ημερομηνία Αναχώρησης",
          Cell: ({ row }) => formatDate(row.original.eksormisi?.hmerominia_anaxorisis)
        },
        {
          accessor: "eksormisi.hmerominia_afiksis",
          header: "Ημερομηνία Άφιξης",
          Cell: ({ row }) => formatDate(row.original.eksormisi?.hmerominia_afiksis)
        }
      ],
      getData: (row) => row.ypefthinos_se || [],
      noRowHover: true,
      noRowClick: true
    }
  ],
};

// Βελτιωμένος υπολογισμός ημερομηνίας λήξης που ελέγχει για null τιμές
// Βελτιωμένος υπολογισμός ημερομηνίας λήξης που ελέγχει για null τιμές
const calculateSubscriptionEndDate = (registrationDateStr, paymentDateStr) => {
  if (!paymentDateStr) return "Άγνωστη";
  
  try {
    const registrationDate = registrationDateStr ? new Date(registrationDateStr) : null;
    const paymentDate = new Date(paymentDateStr);
    
    if (isNaN(paymentDate.getTime())) return "Άγνωστη";
    
    // Χρησιμοποιούμε το έτος της ημερομηνίας πληρωμής ως βάση
    const paymentYear = paymentDate.getFullYear();
    
    // Εξετάζουμε αν η εγγραφή έγινε το ίδιο έτος με την πληρωμή και μετά την 1η Σεπτεμβρίου
    if (registrationDate && !isNaN(registrationDate.getTime())) {
      const registrationYear = registrationDate.getFullYear();
      
      if (registrationYear === paymentYear) {
        const septFirst = new Date(paymentYear, 8, 1); // Σεπτέμβριος = μήνας 8 (0-11)
        
        if (registrationDate >= septFirst) {
          // Αν η εγγραφή έγινε μετά την 1η Σεπτεμβρίου του έτους πληρωμής, 
          // λήγει στην αρχή του μεθεπόμενου έτους
          return `1/1/${paymentYear + 2}`;
        }
      }
    }
    
    // Σε όλες τις άλλες περιπτώσεις, λήγει στην αρχή του επόμενου έτους μετά την πληρωμή
    return `1/1/${paymentYear + 1}`;
  } catch (e) {
    console.error("Σφάλμα υπολογισμού ημερομηνίας λήξης:", e);
    return "Άγνωστη";
  }
};

// Βελτιωμένη συνάρτηση μορφοποίησης ημερομηνιών - πάντα επιστρέφει DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  
  try {
    // If it's ISO string with 'T' and 'Z', trim to date portion
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    // Check if dateStr is already Date object
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    
    // Check for invalid date or Unix epoch (which often indicates a null value was converted)
    if (isNaN(date.getTime()) || date.getFullYear() === 1970) return "";
    
    // Format to day/month/year (DD/MM/YYYY)
    return date.toLocaleDateString("el-GR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e, dateStr);
    return "";
  }
};

// Updated toISODate function that returns a full ISO datetime string
const toISODate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // Χειρισμός για ημερομηνίες σε μορφή "DD/MM/YYYY"
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Μετατροπή σε Date
    let date;
    if (dateStr instanceof Date) {
      date = new Date(dateStr);
    } else {
      // For string date, use the local timezone interpretation
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month-1, day, 12, 0, 0);
    }
    
    if (isNaN(date.getTime())) return null; // Έλεγχος για invalid date
    
    // Return date-only portion of ISO string with time at noon UTC
    return date.toISOString().split('T')[0] + 'T12:00:00.000Z';
  } catch (e) {
    return null;
  }
};

// Ασφαλής μορφοποίηση ημερομηνίας για τη φόρμα (επιστρέφει YYYY-MM-DD)
const safeFormatDate = (dateStr) => {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : "";
  } catch (e) {
    console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e, dateStr);
    return "";
  }
};

// Πρόσθεστε αυτή τη συνάρτηση για έλεγχο των ημερομηνιών
const validateDates = (registrationDate, paymentDate) => {
  if (!registrationDate || !paymentDate) return true;
  
  // Μετατροπή σε Date objects εάν είναι strings
  const regDate = registrationDate instanceof Date ? registrationDate : new Date(registrationDate);
  const payDate = paymentDate instanceof Date ? paymentDate : new Date(paymentDate);
  
  // Έλεγχος αν είναι έγκυρες ημερομηνίες
  if (isNaN(regDate.getTime()) || isNaN(payDate.getTime())) return true;
  
  // Η ημερομηνία εγγραφής πρέπει να είναι πριν ή ίση με την ημερομηνία πληρωμής
  return regDate <= payDate;
};

// Συνάρτηση που καθορίζει την κατάσταση συνδρομής με βάση την ημερομηνία λήξης
const determineSubscriptionStatus = (registrationDate, paymentDate, currentStatus) => {
  // Αν η τρέχουσα κατάσταση είναι "Διαγραμμένη", τη διατηρούμε
  if (currentStatus === "Διαγραμμένη") {
    return "Διαγραμμένη";
  }
  
  // Αν δεν έχει οριστεί μια από τις δύο ημερομηνίες, διατηρούμε την τρέχουσα κατάσταση
  if (!registrationDate || !paymentDate) return currentStatus;
  
  try {
    // Υπολογισμός της ημερομηνίας λήξης με βάση τις ημερομηνίες εγγραφής και πληρωμής
    const endDateStr = calculateSubscriptionEndDate(registrationDate, paymentDate);
    
    // Αν η ημερομηνία λήξης είναι "Άγνωστη", διατηρούμε την τρέχουσα κατάσταση
    if (endDateStr === "Άγνωστη") return currentStatus;
    
    // Μετατροπή της ημερομηνίας λήξης σε αντικείμενο Date
    // Η ημερομηνία λήξης έχει μορφή "DD/MM/YYYY"
    const parts = endDateStr.split('/');
    if (parts.length !== 3) return currentStatus;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Οι μήνες στην JavaScript είναι 0-11
    const year = parseInt(parts[2]);
    const endDate = new Date(year, month, day);
    
    // Σύγκριση με την τρέχουσα ημερομηνία
    const today = new Date();
    
    // Σύγκριση μόνο ημερομηνιών, αγνοώντας την ώρα
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Αν η τρέχουσα ημερομηνία είναι ίση ή μετά την ημερομηνία λήξης, η συνδρομή έχει λήξει
    if (todayDateOnly >= endDateOnly) {
      return "Ληγμένη";
    }
    
    // Αλλιώς η συνδρομή είναι ενεργή
    return "Ενεργή";
  } catch (error) {
    console.error("Σφάλμα κατά τον υπολογισμό της κατάστασης συνδρομής:", error);
    return currentStatus;
  }
};

// Ενημέρωση της συνάρτησης getStatusStyle
const getStatusStyle = (status) => {
  if (!status) return {};
  
  switch(status) {
    case "Ενεργή":
      return { 
        backgroundColor: "#e6f7e6", 
        color: "#2e7d32", 
        fontWeight: "bold",
        padding: "4px 8px",
        borderRadius: "4px",
        display: "inline-block"
      };
    case "Ληγμένη":
      return { 
        backgroundColor: "#fff8e1", 
        color: "#f57c00", 
        fontWeight: "bold",
        padding: "4px 8px",
        borderRadius: "4px",
        display: "inline-block"
      };
    case "Διαγραμμένη":
      return { 
        backgroundColor: "#ffebee", 
        color: "#c62828", 
        fontWeight: "bold",
        padding: "4px 8px",
        borderRadius: "4px",
        display: "inline-block"
      };
    case "Αθλητής":
      return { 
        backgroundColor: "#f5f5f5", 
        color: "#616161", 
        fontWeight: "bold",
        padding: "4px 8px",
        borderRadius: "4px",
        display: "inline-block"
      };
    default:
      return {};
  }
};

export default function Meloi() {
  // Add this feature flag at the beginning of your component
  const SHOW_EXCEL_IMPORT = false; // Set to true when you want to enable it again
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [subscriptionStatuses, setSubscriptionStatuses] = useState([]);
  
  // Νέα state για τις προτιμήσεις του πίνακα
  // Αφαιρούμε τη χειροκίνητη διαχείριση των προτιμήσεων καθώς τώρα γίνεται στο DataTable component
  // const [tablePreferences, setTablePreferences] = useState(() => {...});
  // useEffect(() => {...}, [tablePreferences]);
  // const handleTablePreferenceChange = (type, value) => {...};

  const tableInitialState = useMemo(() => ({
    columnOrder: [
      "fullName",
      "patronimo",
      "melos.epafes.email",
      "melos.epafes.tilefono",
      "status",
      "eidosSindromis",
      "melos.vathmos_diskolias.epipedo",
      "arithmos_mitroou",
      "mrt-actions",
    ],
    columnVisibility: {
      // Κρύψιμο των ζητούμενων στηλών
      "patronimo": false,
      "eidosSindromis": false,
      "melos.vathmos_diskolias.epipedo": false,
      "odos": false,
      "tk": false,
      "subscriptionEndDate": false,
      // Επιπλέον στήλες που θέλουμε να κρύψουμε
      "arithmos_mitroou": false,
      "hmerominia_gennhshs": false,
      "hmerominia_egrafis": false,
      "hmerominia_pliromis": false
    },
    sorting: [{ id: "fullName", desc: false }] // Προσθήκη αλφαβητικής ταξινόμησης
  }), []); // Το άδειο array εξαρτήσεων εξασφαλίζει ότι δημιουργείται μόνο μία φορά

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, difficultyRes, typesRes] = await Promise.all([
          api.get("/melitousillogou"),
          api.get("/vathmoi-diskolias"),
          api.get("/eidi-sindromis")
        ]);

        setDifficultyLevels(difficultyRes.data);
        setSubscriptionTypes(typesRes.data);
        setSubscriptionStatuses([
          { value: "Ενεργή", label: "Ενεργή" },
          { value: "Ληγμένη", label: "Ληγμένη" },
          { value: "Διαγραμμένη", label: "Διαγραμμένη" }
        ]);

        setData(
          membersRes.data.map((member) => {
            // Εύρεση της ημερομηνίας γέννησης (προσθέτουμε έλεγχο null/undefined)
            const birthDate = member.hmerominia_gennhshs || 
                           member.esoteriko_melos?.hmerominia_gennhshs || null;
            
            const registrationDate = member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis || null;
            const paymentDate = member.sindromitis?.exei?.[0]?.hmerominia_pliromis || null;
            
            return {
              ...member,
              id: member.id_es_melous,
              fullName: `${member.melos?.epafes?.epitheto || ""} ${member.melos?.epafes?.onoma || ""}`.trim(),
              email: member.melos?.epafes?.email || "",
              tilefono: member.melos?.epafes?.tilefono || "",
              odos: member.odos || "",
              tk: member.tk || "",
              arithmos_mitroou: member.arithmos_mitroou || "",
              eidosSindromis: member.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "",
              status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || "",
              
              // Διατηρούμε τις αρχικές ημερομηνίες για εσωτερική χρήση
              _hmerominia_gennhshs: birthDate,
              _hmerominia_egrafis: registrationDate,
              _hmerominia_pliromis: paymentDate,
              
              // Και τις αποθηκεύουμε και σε κανονική μορφή για το UI
              hmerominia_gennhshs: birthDate,
              hmerominia_egrafis: registrationDate,
              hmerominia_pliromis: paymentDate,
              // Ενημέρωση κλήσης της συνάρτησης με δύο παραμέτρους
              subscriptionEndDate: calculateSubscriptionEndDate(registrationDate, paymentDate),
              
              // Διατηρώ τη λίστα των δραστηριοτήτων όπου το μέλος είναι υπεύθυνος
              ypefthynos_eksormisis: member.ypefthynos_eksormisis || []
            };
          })
        );
        setLoading(false);
      } catch (error) {
        console.error("Σφάλμα φόρτωσης:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddSave = async (newRow) => {
    try {
      const today = new Date().toISOString();

      // Διασφάλιση έγκυρου ID βαθμού δυσκολίας (σημαντικό!)
      let difficultyId = 1; // Προεπιλογή
      
      if (newRow.epipedo) {
        // Απευθείας μετατροπή σε αριθμό (χωρίς τη χρήση του find)
        difficultyId = parseInt(newRow.epipedo);
      }

      // Χρήση της συνάρτησης toISODate για ασφαλή μετατροπή ημερομηνιών
      const formattedBirthDate = toISODate(newRow.hmerominia_gennhshs);
      const formattedStartDate = toISODate(newRow.hmerominia_enarksis);
      const formattedPaymentDate = toISODate(newRow.hmerominia_pliromis);

      // Υπολογισμός της κατάστασης με βάση τις ημερομηνίες
      const initialStatus = newRow.katastasi_sindromis || "Ενεργή";
      const calculatedStatus = determineSubscriptionStatus(
        formattedStartDate, 
        formattedPaymentDate, 
        initialStatus
      );

      // Προσαρμοσμένα δεδομένα για το backend
      const requestData = {
        epafes: {
          onoma: newRow.onoma,
          epitheto: newRow.epitheto,
          email: newRow.email || "",
          tilefono: newRow.tilefono || "",
        },
        melos: {
          tipo_melous: "esoteriko",
          vathmos_diskolias: {
            id_vathmou_diskolias: difficultyId // Απευθείας χρήση του ID
          }
        },
        esoteriko_melos: {
          hmerominia_gennhshs: formattedBirthDate || today,
          patronimo: newRow.patronimo || "",
          odos: newRow.odos || "",
          tk: newRow.tk ? parseInt(newRow.tk) : 0,
          arithmos_mitroou: newRow.arithmos_mitroou ? parseInt(newRow.arithmos_mitroou) : 0,
        },
        sindromitis: {
          katastasi_sindromis: calculatedStatus, // Χρησιμοποιούμε την υπολογισμένη κατάσταση
          exei: {
            hmerominia_pliromis: formattedPaymentDate || today,
            sindromi: {
              hmerominia_enarksis: formattedStartDate || today,
              eidos_sindromis: newRow.eidosSindromis,
            },
          },
        },
      };

      
      
      
      const response = await api.post("/melitousillogou", requestData);
      
      // Κλείσιμο του dialog
      setOpenAddDialog(false);
      
      // Αντί για επαναφόρτωση της σελίδας, προσθέτουμε το νέο μέλος στον πίνακα
      if (response.data) {
        const newMember = {
          ...response.data,
          id: response.data.id_es_melous,
          fullName: `${response.data.melos?.epafes?.epitheto || ""} ${response.data.melos?.epafes?.onoma || ""}`.trim(),
          email: response.data.melos?.epafes?.email || "",
          tilefono: response.data.melos?.epafes?.tilefono || "",
          odos: response.data.odos || "",  // Use empty string instead of "-"
          tk: response.data.tk || "",      // Use empty string instead of "-"
          arithmos_mitroou: response.data.arithmos_mitroou || "",  // Use empty string instead of "-"
          eidosSindromis: response.data.eidosSindromis || "",  // Use empty string instead of "-"
          status: calculatedStatus, // Use the calculated status
          // Use the formatted dates we already have
          hmerominia_egrafis: formattedStartDate,
          hmerominia_pliromis: formattedPaymentDate,
          // Calculate subscription end date with our formatted dates
          subscriptionEndDate: formattedPaymentDate ? 
            calculateSubscriptionEndDate(formattedStartDate, formattedPaymentDate) : 
            null,
        };
        
        setData(prevData => [...prevData, newMember]);
      }
      
      // ΑΦΑΙΡΕΣΗ αυτής της γραμμής:
      // window.location.reload();
    } catch (error) {
      console.error("Σφάλμα προσθήκης:", error);
      if (error.response && error.response.data) {
        console.error("Λεπτομέρειες σφάλματος:", error.response.data);
        alert(`Σφάλμα: ${error.response.data.details || error.response.data.error || "Άγνωστο σφάλμα"}`);
      }
    }
  };

  const handleEditClick = (row) => {
    // Έλεγχος αν το μέλος είναι αθλητής
    const isAthlete = Boolean(row.athlitis);
    
    // Εξαγωγή των τιμών που χρειαζόμαστε για την επεξεργασία
    const editData = {
      id_es_melous: row.id_es_melous || row.id,
      onoma: row.melos?.epafes?.onoma || "",
      epitheto: row.melos?.epafes?.epitheto || "",
      email: row.melos?.epafes?.email || "",
      tilefono: row.melos?.epafes?.tilefono || "",
      epipedo: row.melos?.vathmos_diskolias?.id_vathmou_diskolias || "",
      patronimo: row.patronimo || "",
      odos: row.odos || "",
      tk: row.tk || "",
      arithmos_mitroou: row.arithmos_mitroou || "",
      // Αποθηκεύουμε την πληροφορία αν είναι αθλητής
      isAthlete: isAthlete,
      
      // Μόνο αν δεν είναι αθλητής, προσθέτουμε τα πεδία συνδρομής
      ...(isAthlete ? {} : {
        eidosSindromis: row.eidosSindromis || "",
        katastasi_sindromis: row.sindromitis?.katastasi_sindromis || "",
        hmerominia_enarksis: safeFormatDate(row.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis),
        hmerominia_pliromis: safeFormatDate(row.sindromitis?.exei?.[0]?.hmerominia_pliromis),
      }),
      
      hmerominia_gennhshs: safeFormatDate(row.hmerominia_gennhshs || row.esoteriko_melos?.hmerominia_gennhshs),
      
      // Επιπλέον πεδία για συμβατότητα με τη φόρμα επεξεργασίας
      "melos.epafes.onoma": row.melos?.epafes?.onoma || "",
      "melos.epafes.epitheto": row.melos?.epafes?.epitheto || "",
      "melos.epafes.email": row.melos?.epafes?.email || "",
      "melos.epafes.tilefono": row.melos?.epafes?.tilefono || "",
      "melos.vathmos_diskolias.epipedo": row.melos?.vathmos_diskolias?.epipedo || ""
    };
    
    setEditValues(editData);
    setOpenEditDialog(true);
  };

  const handleEditSave = async (updatedRow) => {
    try {
      const id = editValues.id_es_melous || editValues.id;
      
      if (!id) {
        console.error("No ID provided for update");
        alert("Σφάλμα: Δεν βρέθηκε το ID μέλους");
        return;
      }

      // Αν είναι αθλητής, αφαιρούμε τα πεδία συνδρομής
      const isAthlete = editValues.isAthlete;
      
      // Έλεγχος ότι η ημερομηνία εγγραφής δεν είναι μεταγενέστερη της πληρωμής
      if (!isAthlete && updatedRow.hmerominia_enarksis && updatedRow.hmerominia_pliromis) {
        if (!validateDates(updatedRow.hmerominia_enarksis, updatedRow.hmerominia_pliromis)) {
          alert("Η ημερομηνία έναρξης δεν μπορεί να είναι μεταγενέστερη της ημερομηνίας πληρωμής");
          return;
        }
      }

      // Μετατροπή ημερομηνιών σε ISO format
      const formattedBirthDate = toISODate(updatedRow.hmerominia_gennhshs);
      
      // Προετοιμασία για τα πεδία συνδρομής (μόνο για μη αθλητες)
      const formattedStartDate = !isAthlete ? toISODate(updatedRow.hmerominia_enarksis) : undefined;
      const formattedPaymentDate = !isAthlete ? toISODate(updatedRow.hmerominia_pliromis) : undefined;
      const subscriptionStatus = !isAthlete ? updatedRow.katastasi_sindromis : undefined;
      
      // Προσδιορισμός της κατάστασης συνδρομής μόνο για μη αθλητές
      const newStatus = !isAthlete ? 
  (updatedRow.katastasi_sindromis === "Διαγραμμένη" ? "Διαγραμμένη" : 
  determineSubscriptionStatus(
    formattedStartDate, 
    formattedPaymentDate, 
    updatedRow.katastasi_sindromis || "Ενεργή"
  )) : undefined;
      
      // Ενημέρωση της κατάστασης στα δεδομένα που θα αποσταλούν
      const requestData = {
        // Βασικά στοιχεία μέλους
        onoma: updatedRow.onoma,
        epitheto: updatedRow.epitheto,
        email: updatedRow.email,
        tilefono: updatedRow.tilefono,
        epipedo: updatedRow.epipedo,
        
        // Στοιχεία εσωτερικού μέλους
        hmerominia_gennhshs: formattedBirthDate,
        patronimo: updatedRow.patronimo,
        arithmos_mitroou: updatedRow.arithmos_mitroou,
        odos: updatedRow.odos,
        tk: updatedRow.tk,
        
        // Στοιχεία συνδρομής - μόνο για μη αθλητές
        ...(isAthlete ? {} : {
          katastasi_sindromis: newStatus,
          hmerominia_enarksis: formattedStartDate,
          hmerominia_pliromis: formattedPaymentDate,
          eidosSindromis: updatedRow.eidosSindromis
        })
      };
      
      const response = await api.put(`/melitousillogou/${id}`, requestData);
      
      // Ενημέρωση των τοπικών δεδομένων
      setData(prevData => 
        prevData.map(item => 
          item.id === id ? {
            ...item,
            ...response.data,
            // Ενημέρωση και των επιπλέον πεδίων
            fullName: `${updatedRow.epitheto || ""} ${updatedRow.onoma || ""}`.trim(),
            // Προσθέστε αυτή τη γραμμή για να ενημερώσετε το status για το UI
            status: !isAthlete ? newStatus : "Αθλητής",
            melos: {
              ...item.melos,
              epafes: {
                ...item.melos?.epafes,
                onoma: updatedRow.onoma,
                epitheto: updatedRow.epitheto,
                email: updatedRow.email,
                tilefono: updatedRow.tilefono,
              },
              vathmos_diskolias: updatedRow.epipedo ? {
                id_vathmou_diskolias: parseInt(updatedRow.epipedo),
                epipedo: difficultyLevels.find(level => level.id_vathmou_diskolias === parseInt(updatedRow.epipedo))?.epipedo || item.melos?.vathmos_diskolias?.epipedo
              } : item.melos?.vathmos_diskolias,
            },
            eidosSindromis: updatedRow.eidosSindromis,
            sindromitis: {
              ...item.sindromitis,
              katastasi_sindromis: newStatus, // Χρησιμοποιούμε τη νέα υπολογισμένη κατάσταση
              exei: [{
                ...item.sindromitis?.exei?.[0],
                hmerominia_pliromis: formattedPaymentDate,
                sindromi: {
                  ...item.sindromitis?.exei?.[0]?.sindromi,
                  hmerominia_enarksis: formattedStartDate,
                  eidos_sindromis: updatedRow.eidosSindromis
                }
              }]
            },
            hmerominia_gennhshs: formattedBirthDate,
            hmerominia_egrafis: formattedStartDate,
            hmerominia_pliromis: formattedPaymentDate,
            // Ενημερωμένος υπολογισμός ημερομηνίας λήξης
            subscriptionEndDate: calculateSubscriptionEndDate(formattedStartDate, formattedPaymentDate)
          } : item
        )
      );

      setOpenEditDialog(false);
    } catch (error) {
      console.error("Σφάλμα ενημέρωσης:", error);
      // Εμφάνιση λεπτομερών πληροφοριών σφάλματος
        if (error.response?.data) {
        alert(`Σφάλμα: ${JSON.stringify(error.response.data)}`);
      } else {
        alert("Σφάλμα κατά την ενημέρωση του μέλους.");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!id || isNaN(id)) {
        console.error("Invalid ID");
        return;
      }

      await api.delete(`/melitousillogou/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  // Δημιουργία των fields για το AddDialog με useMemo για να αποφύγουμε άπειρους επανασχεδιασμούς
  const addFields = useMemo(() => {
    return [
{ 
  accessorKey: "onoma", 
  header: "Όνομα", 
  validation: yup.string()
    .required("Το όνομα είναι υποχρεωτικό")
    .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο όνομα', 
      value => !value || !/[0-9]/.test(value))
},
{ 
  accessorKey: "epitheto", 
  header: "Επώνυμο", 
  validation: yup.string()
    .required("Το επώνυμο είναι υποχρεωτικό")
    .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο επώνυμο', 
      value => !value || !/[0-9]/.test(value))
},
{ 
  accessorKey: "patronimo", 
  header: "Πατρώνυμο", 
  validation: yup.string()
    .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο πατρώνυμο', 
      value => !value || !/[0-9]/.test(value))
},
      { 
        accessorKey: "email", 
        header: "Email", 
        validation: yup.string().nullable().test('email-format', 'Μη έγκυρο email', function(value) {
          if (!value || value === '') return true;
          const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
          return emailRegex.test(value);
        }) // Αφαίρεση .required()
      },
      { 
        accessorKey: "tilefono", 
        header: "Τηλέφωνο", 
        validation: yup.string().nullable().test('valid-phone', 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία και να περιέχει μόνο αριθμούς και το σύμβολο +', function(value) {
          if (!value || value === '') return true;
          const digitsOnly = value.replace(/[^0-9]/g, '');
          return /^[0-9+]+$/.test(value) && digitsOnly.length >= 10;
        })
      },
      { 
        accessorKey: "hmerominia_gennhshs", 
        header: "Ημερομηνία Γέννησης", 
        type: "date",
        validation: yup.date().nullable() // Αφαίρεση .required()
      },
      { 
        accessorKey: "odos", 
        header: "Οδός", 
        validation: yup.string() // Αφαίρεση .required()
      },
      { 
        accessorKey: "tk", 
        header: "ΤΚ", 
        validation: yup.number().nullable().transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null) return null;
          return value;
        }).typeError("Πρέπει να είναι αριθμός") // Αφαίρεση .required()
      },
      { 
        accessorKey: "arithmos_mitroou", 
        header: "Αριθμός Μητρώου", 
        validation: yup.number().nullable().transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null) return null;
          return value;
        }).typeError("Πρέπει να είναι αριθμός") // Αφαίρεση .required()
      },
      { 
        accessorKey: "eidosSindromis", 
        header: "Είδος Συνδρομής",
        type: "select",
        options: subscriptionTypes.map(type => ({ value: type.titlos, label: type.titlos })),
        validation: yup.string() // Αφαίρεση .required()
      },
      { 
        accessorKey: "katastasi_sindromis", 
        header: "Κατάσταση Συνδρομής",
        type: "select",
        options: subscriptionStatuses,
        defaultValue: "Ενεργή",
        validation: yup.string() // Αφαίρεση .required()
      },
      { 
        accessorKey: "hmerominia_enarksis", 
        header: "Ημερομηνία Έναρξης Συνδρομής", 
        type: "date",
        validation: yup.date().nullable()
      },
      { 
        accessorKey: "hmerominia_pliromis", 
        header: "Ημερομηνία Πληρωμής", 
        type: "date",
        validation: yup.date().nullable()
      },
 { 
  accessorKey: "epipedo", 
  header: "Βαθμός Δυσκολίας", 
  type: "select",
  options: difficultyLevels.map(level => ({ 
    value: level.id_vathmou_diskolias, 
    label: `Βαθμός ${level.epipedo}` 
  })),
  defaultValue: difficultyLevels.find(level => level.id_vathmou_diskolias === 1)?.id_vathmou_diskolias || difficultyLevels[0]?.id_vathmou_diskolias || 1,
  validation: yup.number().min(1, "Ο βαθμός πρέπει να είναι τουλάχιστον 1")
}
    ];
  }, [difficultyLevels, subscriptionTypes, subscriptionStatuses]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const data = await readExcel(file);
      await importMembers(data);
      setLoading(false);
    } catch (error) {
      console.error("Σφάλμα κατά την εισαγωγή από Excel:", error);
      alert("Σφάλμα κατά την εισαγωγή από Excel: " + error.message);
      setLoading(false);
    }
    
    // Καθαρισμός του input file
    event.target.value = null;
  };

const readExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Skip header row (assuming first row is headers)
        const dataRows = jsonData.slice(1);
        
        const processedData = dataRows
          .filter(row => row && row.length >= 4) // Need at least member number and name
          .map(row => {
            try {
              // Extract data from specific columns based on the Excel structure
              // Column 1 (index 0) is registration date, column 6 (index 5) is payment date
              const registrationDate = row[0] ? parseDate(row[0]) : null;
              const memberNumber = row[1] ? row[1].toString() : "";
              const lastName = row[2] ? row[2].toString().trim() : "";
              const firstName = row[3] ? row[3].toString().trim() : "";
              const subscriptionFee = row[4] ? parseInt(row[4]) : null;
              const paymentDate = row[5] ? parseDate(row[5]) : null;
              const phoneNumber = row[6] ? row[6].toString().replace(/\D/g, '') : "";
              
              // Safely convert dates to ISO strings with validation
              const regDateIso = registrationDate && isValidDate(registrationDate) ? 
                registrationDate.toISOString().split('T')[0] + 'T12:00:00.000Z' : null;
              
              const payDateIso = paymentDate && isValidDate(paymentDate) ? 
                paymentDate.toISOString().split('T')[0] + 'T12:00:00.000Z' : null;
              
              return {
                arithmos_mitroou: memberNumber || null, // Use null for empty fields
                epitheto: lastName || "", 
                onoma: firstName || "",
                tilefono: phoneNumber || "", // Empty string instead of default
                hmerominia_pliromis: payDateIso, // These can be null
                hmerominia_egrafis: regDateIso, // These can be null
                timi: subscriptionFee
              };
            } catch (rowError) {
              console.error("Error processing row:", row, rowError);
              return null;
            }
          })
          .filter(item => item !== null && (item.epitheto || item.onoma));
        
        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

  // Helper function to check if a Date object is valid
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

  // Helper function to parse dates in various formats
const parseDate = (dateValue) => {
  // Return null for empty or undefined values
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return isValidDate(dateValue) ? dateValue : null;
    } 
    
    // If it's a string
    if (typeof dateValue === 'string') {
      // Try DD/MM/YYYY format
      if (dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
          const year = parseInt(parts[2]);
          
          // Set time to 12:00 noon to avoid timezone issues
          const date = new Date(year, month, day, 12, 0, 0);
          return isValidDate(date) ? date : null;
        }
      }
      
      // Try standard date parsing but set to noon
      const date = new Date(dateValue);
      if (isValidDate(date)) {
        // Set the time to noon
        date.setHours(12, 0, 0, 0);
        return date;
      }
      return null;
    }
    
    // If it's a number (Excel stores dates as numbers)
    if (typeof dateValue === 'number') {
      // Convert Excel date number to JavaScript date
      const excelBaseDate = new Date(1900, 0, 1);
      const date = new Date(excelBaseDate);
      date.setDate(excelBaseDate.getDate() + dateValue - 2);
      // Set the time to noon
      date.setHours(12, 0, 0, 0);
      return isValidDate(date) ? date : null;
    }
  } catch (e) {
    console.error("Error parsing date:", dateValue, e);
  }
  
  return null;
};

 const importMembers = async (membersData) => {
  if (!membersData || membersData.length === 0) {
    alert("Δεν βρέθηκαν έγκυρα δεδομένα για εισαγωγή!");
    return;
  }
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  // Get subscription types to match subscription fee
  let subscriptionTypes = [];
  let difficultyLevelsData = [];
  
  try {
    // Fetch both subscription types and difficulty levels
    const [subscriptionRes, difficultyRes] = await Promise.all([
      api.get("/eidi-sindromis"),
      api.get("/vathmoi-diskolias")
    ]);
    
    subscriptionTypes = subscriptionRes.data;
    difficultyLevelsData = difficultyRes.data;
    
    // Make sure we have at least one difficulty level
    if (!difficultyLevelsData || difficultyLevelsData.length === 0) {
      throw new Error("Δεν βρέθηκαν επίπεδα δυσκολίας στο σύστημα");
    }
  } catch (error) {
    console.error("Could not fetch required data:", error);
    alert("Σφάλμα: Δεν ήταν δυνατή η ανάκτηση των απαραίτητων δεδομένων");
    return;
  }
  
  // Find a valid difficulty ID - use the first available one
  const validDifficultyId = difficultyLevelsData[0].id_vathmou_diskolias;
  
  // Process each member
  for (const member of membersData) {
    try {
      // Handle phone
    const validPhone = member.tilefono && member.tilefono.length > 0 ? member.tilefono : "";
    
    // Find subscription type that matches the fee (if provided)
    let subscriptionType = null;
    if (member.timi && subscriptionTypes.length > 0) {
      subscriptionType = subscriptionTypes.find(type => type.timi === member.timi);
    }
    
    const requestData = {
      epafes: {
        onoma: member.onoma || "",
        epitheto: member.epitheto || "",
        email: null, // Use null for empty fields
        tilefono: validPhone, // Now this will be "" if empty
      },
      melos: {
        tipo_melous: "esoteriko",
        vathmos_diskolias: {
          id_vathmou_diskolias: validDifficultyId
        }
      },
      esoteriko_melos: {
        hmerominia_gennhshs: null,
        patronimo: "",
        odos: "",
        tk: null,
        arithmos_mitroou: member.arithmos_mitroou ? parseInt(member.arithmos_mitroou) : null,
      }
    };

    // Only add sindromitis if we have payment date OR registration date OR subscription fee
    if (member.hmerominia_pliromis || member.hmerominia_egrafis || member.timi) {
      requestData.sindromitis = {
        katastasi_sindromis: "Ενεργή",
        exei: {
          hmerominia_pliromis: member.hmerominia_pliromis || null,
          sindromi: {
            hmerominia_enarksis: member.hmerominia_egrafis || null,
            eidos_sindromis: subscriptionType ? subscriptionType.titlos : (subscriptionTypes[0]?.titlos || null),
          },
        },
      };
    }
    
    // Call the API to create the member
    const response = await api.post("/melitousillogou", requestData);
    
    // Add the new member to the data state
    if (response.data) {
      const newMember = {
        ...response.data,
        id: response.data.id_es_melous,
        fullName: `${response.data.melos?.epafes?.epitheto || ""} ${response.data.melos?.epafes?.onoma || ""}`.trim(),
        email: response.data.melos?.epafes?.email || null,
        tilefono: response.data.melos?.epafes?.tilefono || "",
        status: "Ενεργή",
        // Keep the original dates from the import
        hmerominia_egrafis: member.hmerominia_egrafis,
        hmerominia_pliromis: member.hmerominia_pliromis,
        // Only calculate subscription end date if there's a payment date
        subscriptionEndDate: member.hmerominia_pliromis ? 
          calculateSubscriptionEndDate(member.hmerominia_egrafis, member.hmerominia_pliromis) : 
          null,
      };
      
      setData(prevData => [...prevData, newMember]);
      results.success++;
    }
      
    } catch (error) {
      console.error("Error importing member:", member, error);
      results.failed++;
      results.errors.push({
        member: `${member.epitheto} ${member.onoma}`,
        error: error.response?.data?.error || error.message
      });
    }
  }
  
  // Show results to the user
  const successMessage = results.success > 0 ? `${results.success} μέλη εισήχθησαν επιτυχώς.` : '';
  const failureMessage = results.failed > 0 ? `${results.failed} μέλη απέτυχαν.` : '';
  
  alert(`Ολοκλήρωση εισαγωγής: ${successMessage} ${failureMessage}`);
  
  if (results.errors.length > 0) {
    console.error("Import errors:", results.errors);
  }
  
  return results;
};

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Μέλη Συλλόγου ({data.length})
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          {/* Only render the button if SHOW_EXCEL_IMPORT is true */}
          {SHOW_EXCEL_IMPORT && (
            <Button 
              variant="contained" 
              component="label" 
              startIcon={<CloudUploadIcon />}
            >
              Εισαγωγή από Excel
              <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
            </Button>
          )}
        </Box>
        
        <DataTable
          data={data}
          columns={fields}
          detailPanelConfig={detailPanelConfig}
          getRowId={(row) => row.id_es_melous}
          tableName="melitousillogou"
          initialState={tableInitialState}
          state={{ isLoading: loading }}
          enableAddNew={true}
          enableTopAddButton={true}  // Add this line
          onAddNew={() => {
            console.log('Κουμπί πατήθηκε!');
            setOpenAddDialog(true);
            console.log('openAddDialog τέθηκε σε:', true);
          }}
          handleEditClick={handleEditClick}
          handleDelete={handleDelete}
        />
        
        <AddDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          handleAddSave={handleAddSave}
          fields={addFields}
        />
        
        {/* Υπόλοιπος κώδικας παραμένει ως έχει */}
        <EditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          editValues={editValues}
          handleEditSave={handleEditSave}
          fields={[
    { 
      accessorKey: "onoma", 
      header: "Όνομα", 
      validation: yup.string()
        .required("Το όνομα είναι υποχρεωτικό")
        .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο όνομα', 
          value => !value || !/[0-9]/.test(value))
    },
    { 
      accessorKey: "epitheto", 
      header: "Επώνυμο", 
      validation: yup.string()
        .required("Το επώνυμο είναι υποχρεωτικό")
        .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο επώνυμο', 
          value => !value || !/[0-9]/.test(value))
    },
    { 
      accessorKey: "patronimo", 
      header: "Πατρώνυμο", 
      validation: yup.string()
        .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο πατρώνυμο', 
          value => !value || !/[0-9]/.test(value))
    },
    { 
      accessorKey: "email", 
      header: "Email", 
      validation: yup.string().nullable().test('email-format', 'Μη έγκυρο email', function(value) {
        if (!value || value === '') return true;
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        return emailRegex.test(value);
      })
    },
    { 
      accessorKey: "tilefono", 
      header: "Τηλέφωνο", 
      validation: yup.string().nullable().test('valid-phone', 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία και να περιέχει μόνο αριθμούς και το σύμβολο +', function(value) {
        if (!value || value === '') return true;
        const digitsOnly = value.replace(/[^0-9]/g, '');
        return /^[0-9+]+$/.test(value) && digitsOnly.length >= 10;
      })
    },
    { 
      accessorKey: "hmerominia_gennhshs", 
      header: "Ημερομηνία Γέννησης", 
      type: "date",
      validation: yup.date().nullable() // Αφαίρεση .required()
    },
    { 
      accessorKey: "odos", 
      header: "Οδός", 
      validation: yup.string() // Αφαίρεση .required()
    },
    { 
      accessorKey: "tk", 
      header: "ΤΚ", 
      validation: yup.number().nullable().transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null) return null;
        return value;
      }).typeError("Πρέπει να είναι αριθμός") // Αφαίρεση .required()
    },
    { 
      accessorKey: "arithmos_mitroou", 
      header: "Αριθμός Μητρώου", 
      validation: yup.number().nullable().transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null) return null;
        return value;
      }).typeError("Πρέπει να είναι αριθμός") // Αφαίρεση .required()
    },
    // Πεδία συνδρομής - εμφανίζονται μόνο αν δεν είναι αθλητής
    ...(!editValues.isAthlete ? [
      { 
        accessorKey: "eidosSindromis", 
        header: "Είδος Συνδρομής",
        type: "select",
        options: subscriptionTypes.map(type => ({ value: type.titlos, label: type.titlos })),
        validation: yup.string() // Αφαίρεση .required()
      },
      { 
        accessorKey: "katastasi_sindromis", 
        header: "Κατάσταση Συνδρομής",
        type: "select",
        options: subscriptionStatuses,
        validation: yup.string() // Αφαίρεση .required()
      },
      { 
        accessorKey: "hmerominia_enarksis", 
        header: "Ημερομηνία Έναρξης Συνδρομής", 
        type: "date",
        validation: yup.date().nullable()
      },
      { 
        accessorKey: "hmerominia_pliromis", 
        header: "Ημερομηνία Πληρωμής", 
        type: "date",
        validation: yup.date().nullable()
      }
    ] : []),
     { 
  accessorKey: "epipedo", 
  header: "Βαθμός Δυσκολίας", 
  type: "select",
  options: difficultyLevels.map(level => ({ 
    value: level.id_vathmou_diskolias, 
    label: `Βαθμός ${level.epipedo}` 
  })),
  validation: yup.number().min(1, "Ο βαθμός πρέπει να είναι τουλάχιστον 1") 
}
          ]}
        />
      </Box>
    </LocalizationProvider>
  );
}

