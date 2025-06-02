import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import api from '../utils/api';
import { Box, Typography } from "@mui/material";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import * as yup from "yup";

const fields = [
  { 
    accessorKey: "fullName", 
    header: "Ονοματεπώνυμο", 
    Cell: ({ row }) => `${row.original.melos?.epafes?.epitheto || ''} ${row.original.melos?.epafes?.onoma || ''}`,
    filterFn: (row, id, filterValue) => {
      const name = `${row.original.melos?.epafes?.epitheto || ''} ${row.original.melos?.epafes?.onoma || ''}`.toLowerCase();
      return name.includes(filterValue.toLowerCase());
    }
  },
  { accessorKey: "patronimo", header: "Πατρώνυμο", validation: yup.string().required("Υποχρεωτικό") },
  { accessorKey: "arithmos_mitroou", header: "Αριθμός Μητρώου" },
  { accessorKey: "odos", header: "Οδός", validation: yup.string().required("Υποχρεωτικό") },
  { accessorKey: "tk", header: "ΤΚ", validation: yup.number().required("Υποχρεωτικό") },
  { 
    accessorKey: "melos.epafes.email", 
    header: "Email", 
    validation: yup.string().email("Μη έγκυρο email").required("Υποχρεωτικό") 
  },
  { 
    accessorKey: "melos.epafes.tilefono", 
    header: "Τηλέφωνο", 
    validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία").required("Υποχρεωτικό") 
  },
  { 
    accessorKey: "status", 
    header: "Κατάσταση", 
    Cell: ({ row }) => {
      const status = row.original.athlitis ? "Αθλητής" : row.original.sindromitis?.katastasi_sindromis || '-';
      return <div style={getStatusStyle(status)}>{status}</div>;
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
          accessor: "simmetoxi_drastiriotites[0].drastiriotita.eksormisi.titlos",
          header: "Τίτλος Εξόρμησης",
          Cell: ({ row }) => {
            // Find the first drastiriotita relationship
            const rel = row.original.simmetoxi_drastiriotites?.[0];
            const eksormisiId = rel?.drastiriotita?.eksormisi?.id_eksormisis;
            const titlos = rel?.drastiriotita?.eksormisi?.titlos || "-";
            
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
          accessor: "simmetoxi_drastiriotites[0].drastiriotita.titlos", 
          header: "Τίτλος Δραστηριότητας",
          Cell: ({ row }) => row.original.simmetoxi_drastiriotites?.[0]?.drastiriotita?.titlos || "-"
        },
        { 
          accessor: "simmetoxi_drastiriotites[0].drastiriotita.vathmos_diskolias.epipedo", 
          header: "ΒΔ",
          Cell: ({ row }) => row.original.simmetoxi_drastiriotites?.[0]?.drastiriotita?.vathmos_diskolias?.epipedo || "-"
        },
        {
          accessor: "simmetoxi_drastiriotites[0].drastiriotita.hmerominia",
          header: "Ημερομηνία",
          Cell: ({ row }) => formatDate(row.original.simmetoxi_drastiriotites?.[0]?.drastiriotita?.hmerominia) || "-"
        }
      ],
      getData: (row) => (row.melos?.simmetoxi || []).filter(item => item.katastasi === "Ενεργή"),
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
                href={`/school/${sxoliId}`}
                style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}
                onClick={e => { e.stopPropagation(); }}
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
const calculateSubscriptionEndDate = (registrationDateStr, paymentDateStr) => {
  if (!paymentDateStr) return "Άγνωστη";
  
  try {
    const registrationDate = registrationDateStr ? new Date(registrationDateStr) : null;
    const paymentDate = new Date(paymentDateStr);
    
    if (isNaN(paymentDate.getTime())) return "Άγνωστη";
    
    // Χρησιμοποιούμε το έτος της ημερομηνίας πληρωμής ως βάση
    const paymentYear = paymentDate.getFullYear();
    
    // Εξετάζουμε αν η εγγραφή έγινε το ίδιο έτος με την πληρωμή και μετά την 1η Ιουνίου
    if (registrationDate && !isNaN(registrationDate.getTime())) {
      const registrationYear = registrationDate.getFullYear();
      
      if (registrationYear === paymentYear) {
        const juneFirst = new Date(paymentYear, 5, 1); // Ιούνιος = μήνας 5 (0-11)
        
        if (registrationDate >= juneFirst) {
          // Αν η εγγραφή έγινε μετά την 1η Ιουνίου του έτους πληρωμής, 
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
  if (!dateStr) return "-";
  
  try {
    // Αν είναι ISO string με 'T' και 'Z', το κόβουμε μέχρι το 'T'
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    // Έλεγχος αν το dateStr είναι ήδη Date object
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(date.getTime())) return "-"; // Έλεγχος για invalid date
    
    // Μορφοποίηση σε ημέρα/μήνας/έτος (DD/MM/YYYY)
    return date.toLocaleDateString("el-GR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e, dateStr);
    return "-";
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
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(date.getTime())) return null; // Έλεγχος για invalid date
    
    // Επιστροφή πλήρους ISO string (με ώρα)
    return date.toISOString();
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

// Συνάρτηση που καθορίζει την κατάσταση συνδρομής με βάση τις ημερομηνίες
const determineSubscriptionStatus = (registrationDate, paymentDate, currentStatus) => {
  // Αν δεν έχει οριστεί μια από τις δύο ημερομηνίες, διατηρούμε την τρέχουσα κατάσταση
  if (!registrationDate || !paymentDate) return currentStatus;
  
  const regDate = new Date(registrationDate);
  const payDate = new Date(paymentDate);
  
  // Έλεγχος για μη έγκυρες ημερομηνίες
  if (isNaN(regDate.getTime()) || isNaN(payDate.getTime())) return currentStatus;
  
  const currentYear = new Date().getFullYear();
  const startOfCurrentYear = new Date(`${currentYear}-01-01`);
  const startOfLastJune = new Date(`${currentYear-1}-06-01`);

  // Λογική αντίστοιχη με αυτή του middleware στο backend
  if (
    // Η εγγραφή έγινε πριν την αρχή του τρέχοντος έτους
    regDate < startOfCurrentYear && 
    // Η πληρωμή έγινε πριν την αρχή του τρέχοντος έτους
    payDate < startOfCurrentYear &&
    // Δεν είναι ειδική περίπτωση (εγγραφή μετά 1 Ιουνίου του προηγούμενου έτους)
    !(regDate >= startOfLastJune && regDate < startOfCurrentYear)
  ) {
    return "Ληγμένη";
  } 
  
  return "Ενεργή";
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
      "subscriptionEndDate": false
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
              email: member.melos?.epafes?.email || "-",
              tilefono: member.melos?.epafes?.tilefono || "-",
              odos: member.odos || "-",
              tk: member.tk || "-",
              arithmos_mitroou: member.arithmos_mitroou || "-",
              eidosSindromis: member.eidosSindromis || "-",
              status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || "-",
              
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
          email: response.data.melos?.epafes?.email || "-",
          tilefono: response.data.melos?.epafes?.tilefono || "-",
          odos: response.data.odos || "-",
          tk: response.data.tk || "-",
          arithmos_mitroou: response.data.arithmos_mitroou || "-",
          eidosSindromis: newRow.eidosSindromis || "-",
          status: calculatedStatus, // Χρησιμοποιούμε την υπολογισμένη κατάσταση
          // ΕΔΩ: Βάλε το ISO string για να δουλεύει το safeFormatDate
          hmerominia_gennhshs: formattedBirthDate,
          hmerominia_egrafis: formattedStartDate,
          hmerominia_pliromis: formattedPaymentDate,
          // Ενημέρωση κλήσης της συνάρτησης με δύο παραμέτρους
          subscriptionEndDate: calculateSubscriptionEndDate(formattedStartDate, formattedPaymentDate),
        };
        
        // Προσθήκη στα υπάρχοντα δεδομένα
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
      const newStatus = !isAthlete ? determineSubscriptionStatus(
        formattedStartDate, 
        formattedPaymentDate, 
        subscriptionStatus || "Ενεργή"
      ) : undefined;
      
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
    if (difficultyLevels.length === 0 || subscriptionTypes.length === 0) {
      return [];
    }

    return [
      { 
        accessorKey: "onoma", 
        header: "Όνομα", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "epitheto", 
        header: "Επώνυμο", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "patronimo", 
        header: "Πατρώνυμο", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "email", 
        header: "Email", 
        validation: yup.string().email("Μη έγκυρο email").required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "tilefono", 
        header: "Τηλέφωνο", 
        validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία").required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "hmerominia_gennhshs", 
        header: "Ημερομηνία Γέννησης", 
        type: "date",
        validation: yup.date().required("Υποχρεωτικό")
      },
      { 
        accessorKey: "odos", 
        header: "Οδός", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "tk", 
        header: "ΤΚ", 
        validation: yup.number().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "arithmos_mitroou", 
        header: "Αριθμός Μητρώου", 
        validation: yup.number().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "eidosSindromis", 
        header: "Είδος Συνδρομής",
        type: "select",
        options: subscriptionTypes.map(type => ({ value: type.titlos, label: type.titlos })),
        validation: yup.string().required("Υποχρεωτικό")
      },
      { 
        accessorKey: "katastasi_sindromis", 
        header: "Κατάσταση Συνδρομής",
        type: "select",
        options: subscriptionStatuses,
        defaultValue: "Ενεργή",
        validation: yup.string().required("Υποχρεωτικό")
      },
      { 
        accessorKey: "hmerominia_enarksis", 
        header: "Ημερομηνία Έναρξης Συνδρομής", 
        type: "date",
        defaultValue: new Date().toISOString().split('T')[0],
        validation: yup.date()
          .required("Υποχρεωτικό")
          .test('not-after-payment', 'Η ημερομηνία έναρξης δεν μπορεί να είναι μεταγενέστερη της ημερομηνίας πληρωμής', 
            function(value) {
              const { hmerominia_pliromis } = this.parent;
              return validateDates(value, hmerominia_pliromis);
            })
      },
      { 
        accessorKey: "hmerominia_pliromis", 
        header: "Ημερομηνία Πληρωμής", 
        type: "date",
        defaultValue: new Date().toISOString().split('T')[0],
        validation: yup.date().required("Υποχρεωτικό")
      },
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
    ];
  }, [difficultyLevels, subscriptionTypes, subscriptionStatuses]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Μέλη Συλλόγου ({data.length})
        </Typography>
        <DataTable
          data={data}
          columns={fields}
          detailPanelConfig={detailPanelConfig}
          getRowId={(row) => row.id_es_melous}
          tableName="melitousillogou"
          initialState={tableInitialState} // <-- Χρήση του useMemo αντικειμένου
          state={{ isLoading: loading }}
          onAddNew={() => setOpenAddDialog(true)}
          handleEditClick={handleEditClick}
          handleDelete={handleDelete}
        />
        <AddDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          handleAddSave={handleAddSave}
          fields={addFields}
        />
        <EditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          editValues={editValues}
          handleEditSave={handleEditSave}
          fields={[
            { 
              accessorKey: "onoma", 
              header: "Όνομα", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "epitheto", 
              header: "Επώνυμο", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "patronimo", 
              header: "Πατρώνυμο", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "email", 
              header: "Email", 
              validation: yup.string().email("Μη έγκυρο email").required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "tilefono", 
              header: "Τηλέφωνο", 
              validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία").required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "hmerominia_gennhshs", 
              header: "Ημερομηνία Γέννησης", 
              type: "date",
              validation: yup.date().required("Υποχρεωτικό")
            },
            { 
              accessorKey: "odos", 
              header: "Οδός", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "tk", 
              header: "ΤΚ", 
              validation: yup.number().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "arithmos_mitroou", 
              header: "Αριθμός Μητρώου", 
              validation: yup.number()
            },
            // Πεδία συνδρομής - εμφανίζονται μόνο αν δεν είναι αθλητής
            ...(!editValues.isAthlete ? [
              { 
                accessorKey: "eidosSindromis", 
                header: "Είδος Συνδρομής",
                type: "select",
                options: subscriptionTypes.map(type => ({ value: type.titlos, label: type.titlos })),
                validation: yup.string().required("Υποχρεωτικό")
              },
              { 
                accessorKey: "katastasi_sindromis", 
                header: "Κατάσταση Συνδρομής",
                type: "select",
                options: subscriptionStatuses,
                validation: yup.string().required("Υποχρεωτικό")
              },
              { 
                accessorKey: "hmerominia_enarksis", 
                header: "Ημερομηνία Έναρξης Συνδρομής", 
                type: "date",
                validation: yup.date()
                  .test('not-after-payment', 'Η ημερομηνία έναρξης δεν μπορεί να είναι μεταγενέστερη της ημερομηνίας πληρωμής', 
                    function(value) {
                      const { hmerominia_pliromis } = this.parent;
                      return validateDates(value, hmerominia_pliromis);
                    })
              },
              { 
                accessorKey: "hmerominia_pliromis", 
                header: "Ημερομηνία Πληρωμής", 
                type: "date",
                validation: yup.date()
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