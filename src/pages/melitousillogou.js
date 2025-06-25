import React, { useState, useEffect, useMemo, useCallback } from "react";
import DataTable from "../components/DataTable/DataTable";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import api from '../utils/api';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import * as yup from "yup";
import * as XLSX from 'xlsx';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import TransformIcon from '@mui/icons-material/Transform';
import AddIcon from '@mui/icons-material/Add';
import SelectionDialog from '../components/SelectionDialog';
import SearchIcon from '@mui/icons-material/Search';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Radio, 
  InputAdornment ,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { Formik } from 'formik';
import { DatePicker } from '@mui/x-date-pickers';

const fields = [
  { 
    accessorKey: "epitheto", 
    header: "Επώνυμο", 
    Cell: ({ row }) => row.original.melos?.epafes?.epitheto || '',
    filterFn: (row, id, filterValue) => {
      const epitheto = (row.original.melos?.epafes?.epitheto || '').toLowerCase();
      return epitheto.includes(filterValue.toLowerCase());
    },
    sortingFn: (rowA, rowB) => {
      const a = (rowA.original.melos?.epafes?.epitheto || '').toLowerCase();
      const b = (rowB.original.melos?.epafes?.epitheto || '').toLowerCase();
      return a.localeCompare(b, "el");
    }
  },
  { 
    accessorKey: "onoma", 
    header: "Όνομα", 
    Cell: ({ row }) => row.original.melos?.epafes?.onoma || '',
    filterFn: (row, id, filterValue) => {
      const onoma = (row.original.melos?.epafes?.onoma || '').toLowerCase();
      return onoma.includes(filterValue.toLowerCase());
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
      // Now show subscription status even if they are an athlete
      let status;
      
      // If they're a subscriber, show their subscription status
      if (row.original.sindromitis) {
        status = row.original.sindromitis.katastasi_sindromis || 'Ενεργή';
      }
      // If they don't have a subscription status but are an athlete, show "Αθλητής"
      else if (row.original.athlitis) {
        status = "Αθλητής";
      }
      // Otherwise default
      else {
        status = '-';
      }
      
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
    // If they're a subscriber, show subscription status regardless if they're also an athlete
    if (row.original.sindromitis?.katastasi_sindromis) {
      const status = row.original.sindromitis.katastasi_sindromis;
      return <div style={getStatusStyle(status)}>{status}</div>;
    } 
    // Only if they're just an athlete (not a subscriber), show "Αθλητής"
    else if (row.original.athlitis) {
      return <div style={getStatusStyle("Αθλητής")}>Αθλητής</div>;
    }
    else {
      return <div style={getStatusStyle('-')}>-</div>;
    }
  }
},
    {
      accessor: "eidosSindromis",
      header: "Είδος Συνδρομής",
      shouldRender: (row) => Boolean(row.sindromitis) 
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
      shouldRender: (row) => Boolean(row.sindromitis) 
    },
    // Εμφάνιση ημερομηνίας πληρωμής μόνο για μη αθλητές
    {
      accessor: "hmerominia_pliromis",
      header: "Ημ. Πληρωμής",
      format: (value) => formatDate(value),
     shouldRender: (row) => Boolean(row.sindromitis) 
    },
    // Εμφάνιση ημερομηνίας λήξης μόνο για μη αθλητές
    {
      accessor: "subscriptionEndDate",
      header: "Ημερομηνία Λήξης",
     shouldRender: (row) => Boolean(row.sindromitis)
    },
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
    },

  ],
  customSections: [
    {
      title: "Σχόλια",
      order: 3, // This will place it after "Υπεύθυνος Δραστηριοτήτων"
      render: (row) => (
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>Σχόλια</Typography>
          <Box 
            sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: '4px', 
              backgroundColor: '#f5f5f5',
              minHeight: '60px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {row.melos?.sxolia || "Δεν υπάρχουν σχόλια"}
          </Box>
        </Box>
      )
    }
  ]
};

// Add this component to melitousillogou.js
import { Button, Box, Typography, TextField, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';


const InlineCommentsEditor = ({ comments, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState(comments || "");
  
  const handleSave = () => {
    onSave(commentText);
    setIsEditing(false);
  };
  
  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="h3">Σχόλια</Typography>
        {!isEditing ? (
          <IconButton 
            size="small" 
            onClick={() => setIsEditing(true)} 
            sx={{ ml: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton 
            size="small" 
            color="primary"
            onClick={handleSave} 
            sx={{ ml: 1 }}
          >
            <SaveIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      {isEditing ? (
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={10}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          variant="outlined"
          placeholder="Εισάγετε σχόλια..."
          autoFocus
          sx={{ backgroundColor: '#f9f9f9' }}
        />
      ) : (
        <Box 
          sx={{ 
            p: 2, 
            border: '1px solid #e0e0e0', 
            borderRadius: '4px', 
            backgroundColor: '#f5f5f5',
            minHeight: '60px',
            whiteSpace: 'pre-wrap'
          }}
        >
          {commentText || "Δεν υπάρχουν σχόλια"}
        </Box>
      )}
    </Box>
  );
};

// Move this function inside the component
const handleSaveComments = async (memberId, newComments) => {
  try {
    // Make API call to update comments
    await api.put(`/melitousillogou/${memberId}`, {
      melos: {
        sxolia: newComments
      }
    });
    
    // Now setData is accessible
    setData(prevData => prevData.map(member => 
      member.id_es_melous === memberId 
        ? { ...member, melos: { ...member.melos, sxolia: newComments } }
        : member
    ));
  } catch (error) {
  }
};

// Βελτιωμένος υπολογισμός ημερομηνίας λήξης που ελέγχει για null τιμές
// Βελτιωμένος υπολογισμός ημερομηνίας λήξης που ελέγχει για null τιμές
const calculateSubscriptionEndDate = (registrationDateStr, paymentDateStr) => {
  try {
    // If we have payment date, use it as the primary date
    if (paymentDateStr) {
      const paymentDate = new Date(paymentDateStr);
      if (isNaN(paymentDate.getTime())) return "Άγνωστη";
      
      const paymentYear = paymentDate.getFullYear();
      
      // If we also have a registration date and it's in the same year as payment
      if (registrationDateStr) {
        const registrationDate = new Date(registrationDateStr);
        if (!isNaN(registrationDate.getTime())) {
          const registrationYear = registrationDate.getFullYear();
          
          if (registrationYear === paymentYear) {
            const septFirst = new Date(paymentYear, 8, 1); // Σεπτέμβριος = μήνας 8 (0-11)
            
            if (registrationDate >= septFirst) {
              // If registration was after September 1st, expires at beginning of year after next
              return `1/1/${paymentYear + 2}`;
            }
          }
        }
      }
      
      // Otherwise expires at beginning of next year
      return `1/1/${paymentYear + 1}`;
    } 
    // If we only have registration date, use it to determine expiration
    else if (registrationDateStr) {
      const registrationDate = new Date(registrationDateStr);
      if (isNaN(registrationDate.getTime())) return "Άγνωστη";
      
      const registrationYear = registrationDate.getFullYear();
      const septFirst = new Date(registrationYear, 8, 1);
      
      // Apply the same rules but using registration date as payment date
      if (registrationDate >= septFirst) {
        return `1/1/${registrationYear + 2}`;
      } else {
        return `1/1/${registrationYear + 1}`;
      }
    }
    
    // If neither date is provided
    return "Άγνωστη";
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
// Συνάρτηση που καθορίζει την κατάσταση συνδρομής με βάση την ημερομηνία λήξης
// Συνάρτηση που καθορίζει την κατάσταση συνδρομής με βάση την ημερομηνία λήξης
const determineSubscriptionStatus = (registrationDate, paymentDate, currentStatus) => {
  // Αν η τρέχουσα κατάσταση είναι "Διαγραμμένη", τη διατηρούμε
  if (currentStatus === "Διαγραμμένη") {
    return "Διαγραμμένη";
  }
  
  try {
    // Calculate end date even if we only have one date
    let endDateStr = null;
    
    if (paymentDate) {
      // If we have payment date, use it with registration date (if available)
      endDateStr = calculateSubscriptionEndDate(registrationDate, paymentDate);
    } else if (registrationDate) {
      // If we only have registration date, use it alone
      // Treat registration date as if it was also the payment date
      endDateStr = calculateSubscriptionEndDate(registrationDate, registrationDate);
    }
    
    // Αν η ημερομηνία λήξης είναι "Άγνωστη" ή null, επιστρέφουμε "Ληγμένη"
    if (!endDateStr || endDateStr === "Άγνωστη") return "Ληγμένη";
    
    // Μετατροπή της ημερομηνίας λήξης σε αντικείμενο Date
    const parts = endDateStr.split('/');
    if (parts.length !== 3) return "Ληγμένη";
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Οι μήνες στην JavaScript είναι 0-11
    const year = parseInt(parts[2]);
    const endDate = new Date(year, month, day);
    
    // Σύγκριση με την τρέχουσα ημερομηνία
    const today = new Date();
    
    // Σύγκριση μόνο ημερομηνιών, αγνοώντας την ώρα
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Debug logging
    console.log("Status calculation:", {
      today: todayDateOnly.toISOString(),
      endDate: endDateOnly.toISOString(),
      comparison: todayDateOnly > endDateOnly ? "Expired" : "Active"
    });
    
    // If end date is after today, it's active
    return todayDateOnly > endDateOnly ? "Ληγμένη" : "Ενεργή";
  } catch (error) {
    console.error("Σφάλμα κατά τον υπολογισμό της κατάστασης συνδρομής:", error);
    return "Ληγμένη"; // Default to expired on error
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
  const [openConvertDialog, setOpenConvertDialog] = useState(false);
const [athleteToConvert, setAthleteToConvert] = useState(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [subscriptionStatuses, setSubscriptionStatuses] = useState([]);
  // Add these new state variables
const [openAthleteSelectionDialog, setOpenAthleteSelectionDialog] = useState(false);
const [eligibleAthletes, setEligibleAthletes] = useState([]);
const [selectedAthleteId, setSelectedAthleteId] = useState(null);
const [openSingleConvertDialog, setOpenSingleConvertDialog] = useState(false);

// Add this effect to update eligible athletes when data changes
useEffect(() => {
  const athletes = data.filter(member => member.athlitis && !member.sindromitis)
    .map(athlete => ({
      id: athlete.id_es_melous || athlete.id,
      // Check for all possible locations of name data
      name: `${athlete.epitheto || athlete.melos?.epafes?.epitheto || ""} ${athlete.onoma || athlete.melos?.epafes?.onoma || ""}`.trim(),
      athleteNumber: athlete.athlitis?.arithmos_deltiou || "-"
    }));
  setEligibleAthletes(athletes);
}, [data]);

// Function to update the eligible athletes list after any changes
const refreshEligibleAthletes = useCallback(() => {
  // Filter only athletes who are not subscribers
const athletes = data.filter(member => member.athlitis && !member.sindromitis)
  .map(athlete => ({
    id: athlete.id_es_melous || athlete.id,
    // Check for all possible locations of name data
    name: `${athlete.epitheto || athlete.melos?.epafes?.epitheto || ""} ${athlete.onoma || athlete.melos?.epafes?.onoma || ""}`.trim(),
    athleteNumber: String(athlete.athlitis?.arithmos_deltiou || "-")
  }));
  setEligibleAthletes(athletes);
}, [data]);

// Call this in a useEffect
useEffect(() => {
  refreshEligibleAthletes();
}, [data, refreshEligibleAthletes]);




  // Νέα state για τις προτιμήσεις του πίνακα
  // Αφαιρούμε τη χειροκίνητη διαχείριση των προτιμήφεσεων καθώς τώρα γίνεται στο DataTable component
  // const [tablePreferences, setTablePreferences] = useState(() => {...});
  // useEffect(() => {...}, [tablePreferences]);
  // const handleTablePreferenceChange = (type, value) => {...};

  const tableInitialState = useMemo(() => ({
  columnOrder: [
    "epitheto", // Last name first
    "onoma",    // First name second
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
  sorting: [{ id: "epitheto", desc: false }] // Sort by last name alphabetically
}), []);

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
            // Look for dates in all possible locations
            const birthDate = member.hmerominia_gennhshs || 
                          member.esoteriko_melos?.hmerominia_gennhshs || null;
            
            // Try both top-level and nested paths for registration and payment dates
            const registrationDate = member.hmerominia_egrafis || 
                                 member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis || null;
            const paymentDate = member.hmerominia_pliromis || 
                            member.sindromitis?.exei?.[0]?.hmerominia_pliromis || null;
            
            // Log the dates for debugging
            console.log(`Member ${member.id_es_melous} dates:`, {
              name: `${member.melos?.epafes?.onoma} ${member.melos?.epafes?.epitheto}`,
              registrationDate, 
              paymentDate
            });
            
            return {
              ...member,
              id: member.id_es_melous,
              // Remove the fullName field
              epitheto: member.melos?.epafes?.epitheto || "",
              onoma: member.melos?.epafes?.onoma || "",
              email: member.melos?.epafes?.email || "",
              tilefono: member.melos?.epafes?.tilefono || "",
              odos: member.odos || "",
              tk: member.tk || "",
              arithmos_mitroou: member.arithmos_mitroou || "",
              eidosSindromis: member.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "",
              status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || "",
              
              // Always use the consolidated dates from above
              hmerominia_gennhshs: birthDate,
              hmerominia_egrafis: registrationDate,
              hmerominia_pliromis: paymentDate,
              
              // Update nested structure to maintain consistency
              sindromitis: member.sindromitis ? {
                ...member.sindromitis,
                exei: member.sindromitis.exei?.map(item => ({
                  ...item,
                  hmerominia_pliromis: paymentDate || item.hmerominia_pliromis,
                  sindromi: {
                    ...item.sindromi,
                    hmerominia_enarksis: registrationDate || item.sindromi?.hmerominia_enarksis
                  }
                }))
              } : null,
              
              subscriptionEndDate: calculateSubscriptionEndDate(registrationDate, paymentDate),
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

// Update the handleMakeSubscriberClick function
const handleMakeSubscriberClick = (athlete) => {
  setAthleteToConvert(athlete);
  setOpenConvertDialog(true);
};

// Update handleAthleteSelectionConfirm function
const handleAthleteSelectionConfirm = (selectedIds) => {
  if (!selectedIds || selectedIds.length === 0) {
    return;
  }
  
  // Get the first selected athlete (we only convert one at a time)
  const athleteId = selectedIds[0];
  const athlete = data.find(m => m.id_es_melous === athleteId || m.id === athleteId);
  
  if (athlete) {
    handleMakeSubscriberClick(athlete);
  }
};

// Update the handleMakeSubscriber function for better error handling
const handleMakeSubscriber = async (formData) => {
  try {
    if (!athleteToConvert) {
      alert("Δεν επιλέχθηκε αθλητής");
      return;
    }
    
    console.log("Converting athlete to subscriber:", athleteToConvert);
    const athleteId = athleteToConvert.id_es_melous || athleteToConvert.id;
    
    // Format dates for the API
    const formattedStartDate = formData.hmerominia_enarksis ? toISODate(formData.hmerominia_enarksis) : null;
    const formattedPaymentDate = formData.hmerominia_pliromis ? toISODate(formData.hmerominia_pliromis) : null;
    
    // Prepare request data
    const requestData = {
      sindromitis: {
        exei: {
          hmerominia_pliromis: formattedPaymentDate,
          sindromi: {
            hmerominia_enarksis: formattedStartDate,
            eidos_sindromis: formData.eidosSindromis,
          },
        },
      },
    };
    
    console.log("Sending request data:", JSON.stringify(requestData, null, 2));
    
    // Make API call
   const response = await api.put(`/melitousillogou/${athleteId}`, requestData);
    console.log("Conversion response:", response.data);
    
    // Close dialog and update state
    setOpenConvertDialog(false);
    setAthleteToConvert(null);
    
    // Update the local data to reflect the change
    const membersRes = await api.get("/melitousillogou");
    
    // Process the response data to ensure consistent structure
    const processedData = membersRes.data.map((member) => {
      // Look for dates in all possible locations
      const birthDate = member.hmerominia_gennhshs || 
                    member.esoteriko_melos?.hmerominia_gennhshs || null;
      
      // Try both top-level and nested paths for registration and payment dates
      const registrationDate = member.hmerominia_egrafis || 
                           member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis || null;
      const paymentDate = member.hmerominia_pliromis || 
                      member.sindromitis?.exei?.[0]?.hmerominia_pliromis || null;
      
      return {
        ...member,
        id: member.id_es_melous,
        epitheto: member.melos?.epafes?.epitheto || "",
        onoma: member.melos?.epafes?.onoma || "",
        email: member.melos?.epafes?.email || "",
        tilefono: member.melos?.epafes?.tilefono || "",
        odos: member.odos || "",
        tk: member.tk || "",
        arithmos_mitroou: member.arithmos_mitroou || "",
        eidosSindromis: member.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "",
        status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || "",
        
        // Always use the consolidated dates from above
        hmerominia_gennhshs: birthDate,
        hmerominia_egrafis: registrationDate,
        hmerominia_pliromis: paymentDate,
        
        subscriptionEndDate: calculateSubscriptionEndDate(registrationDate, paymentDate),
      };
    });
    
    setData(processedData);
    
    // Since data was updated, eligibleAthletes will be updated via useEffect
    
    alert("Ο αθλητής έγινε συνδρομητής με επιτυχία");
  } catch (error) {
    console.error("Σφάλμα κατά τη μετατροπή του αθλητή σε συνδρομητή:", error);
    console.error("Error details:", error.response?.data);
    alert(`Σφάλμα: ${error.response?.data?.details || error.message}`);
  }
};




const handleAddSave = async (newRow) => {
  try {
    // Διασφάλιση έγκυρου ID βαθμού δυσκολίας
    let difficultyId = 1; // Προεπιλογή
    
    if (newRow.epipedo) {
      difficultyId = parseInt(newRow.epipedo);
    }

    // Χρήση της συνάρτησης toISODate για ασφαλή μετατροπή ημερομηνιών
    // Let the formattedStartDate and formattedPaymentDate be null if not provided
    const formattedBirthDate = toISODate(newRow.hmerominia_gennhshs);
    const formattedStartDate = newRow.hmerominia_enarksis ? toISODate(newRow.hmerominia_enarksis) : null;
    const formattedPaymentDate = newRow.hmerominia_pliromis ? toISODate(newRow.hmerominia_pliromis) : null;

    // Calculate end date only if both dates exist
    const endDateStr = formattedStartDate && formattedPaymentDate ? 
      calculateSubscriptionEndDate(formattedStartDate, formattedPaymentDate) : 
      null;
      
    // Determine status - we'll use "Ληγμένη" if no dates are provided
    let calculatedStatus;
    if (newRow.katastasi_sindromis === "Διαγραμμένη") {
      calculatedStatus = "Διαγραμμένη";
    } else if (!formattedStartDate || !formattedPaymentDate) {
      calculatedStatus = "Ληγμένη";
    } else if (endDateStr && endDateStr !== "Άγνωστη") {
      const endDate = parseDateFromString(endDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      calculatedStatus = today > endDate ? "Ληγμένη" : "Ενεργή";
    } else {
      calculatedStatus = "Ληγμένη"; // Changed from "Ενεργή" to "Ληγμένη"
    }

    // Προσαρμοσμένα δεδομένα για το backend
    const requestData = {
      epafes: {
        onoma: newRow.onoma || "",
        epitheto: newRow.epitheto || "",
        email: newRow.email || "",
        tilefono: newRow.tilefono || "",
      },
      melos: {
        tipo_melous: "esoteriko",
        sxolia: newRow.sxolia || "",
        vathmos_diskolias: {
          id_vathmou_diskolias: difficultyId
        }
      },
      esoteriko_melos: {
        hmerominia_gennhshs: formattedBirthDate,
        patronimo: newRow.patronimo || "",
        odos: newRow.odos || "",
        tk: newRow.tk ? parseInt(newRow.tk) : null,
        arithmos_mitroou: newRow.arithmos_mitroou ? parseInt(newRow.arithmos_mitroou) : null,
      },
      sindromitis: {
        katastasi_sindromis: calculatedStatus,
        exei: {
          // These can be null - the backend will handle it
          hmerominia_pliromis: formattedPaymentDate,
          sindromi: {
            hmerominia_enarksis: formattedStartDate,
            // This is the key part - always include eidos_sindromis
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
      // Calculate the end date using the dates from response data for consistency
      const responseRegDate = response.data.hmerominia_egrafis || 
                             response.data.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis;
      const responsePayDate = response.data.hmerominia_pliromis || 
                            response.data.sindromitis?.exei?.[0]?.hmerominia_pliromis;
      
      // Calculate end date with server-returned dates
      const calculatedEndDate = responseRegDate && responsePayDate ?
        calculateSubscriptionEndDate(responseRegDate, responsePayDate) : null;
        
      // Determine status using utility function for consistency
      const finalStatus = formattedStartDate || formattedPaymentDate ?
        determineSubscriptionStatus(responseRegDate, responsePayDate, calculatedStatus) : calculatedStatus;
      
      const newMember = {
        ...response.data,
        id: response.data.id_es_melous,
        epitheto: response.data.melos?.epafes?.epitheto || "",
        onoma: response.data.melos?.epafes?.onoma || "",
        email: response.data.melos?.epafes?.email || "",
        tilefono: response.data.melos?.epafes?.tilefono || "",
        odos: response.data.odos || "",
        tk: response.data.tk || "",
        arithmos_mitroou: response.data.arithmos_mitroou || "",
        eidosSindromis: response.data.eidosSindromis || "",
        status: finalStatus,
        // Add date fields at both top level and nested structure
        hmerominia_egrafis: responseRegDate,
        hmerominia_pliromis: responsePayDate,
        // Nested structure for components that expect it
        sindromitis: {
          katastasi_sindromis: finalStatus,
          exei: [{
            hmerominia_pliromis: responsePayDate,
            sindromi: {
              hmerominia_enarksis: responseRegDate,
              eidos_sindromis: {
                titlos: newRow.eidosSindromis
              }
            }
          }]
        },
        // Use the calculated end date
        subscriptionEndDate: calculatedEndDate,
      };
      
  
      
      setData(prevData => [...prevData, newMember]);
    }
  } catch (error) {
    console.error("Σφάλμα προσθήκης:", error);
    if (error.response && error.response.data) {
      console.error("Λεπτομέρειες σφάλματος:", error.response.data);
      alert(`Σφάλμα: ${error.response.data.details || error.response.data.error || "Άγνωστο σφάλμα"}`);
    }
  }
};
  // Add this new component to your file
const handleEditClick = (row) => {
  // Check if the member is an athlete and/or subscriber
  const isAthlete = Boolean(row.athlitis);
  const isSubscriber = Boolean(row.sindromitis);
  
  // Extract the values needed for editing
  const editData = {
    id_es_melous: row.id_es_melous || row.id,
        isAthlete: isAthlete,     // Add this line
    isSubscriber: isSubscriber, // Add this line
    onoma: row.melos?.epafes?.onoma || "",
    epitheto: row.melos?.epafes?.epitheto || "",
    email: row.melos?.epafes?.email || "",
    tilefono: row.melos?.epafes?.tilefono || "",
    epipedo: row.melos?.vathmos_diskolias?.id_vathmou_diskolias || "",
    patronimo: row.patronimo || "",
    odos: row.odos || "",
    tk: row.tk || "",
    arithmos_mitroou: row.arithmos_mitroou || "",
    sxolia: row.melos?.sxolia || "", 
    
    // Store both athlete and subscriber status
    ...(isSubscriber ? {
      eidosSindromis: row.eidosSindromis || "",
      katastasi_sindromis: row.sindromitis?.katastasi_sindromis || "",
      hmerominia_enarksis: safeFormatDate(row.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis),
      hmerominia_pliromis: safeFormatDate(row.sindromitis?.exei?.[0]?.hmerominia_pliromis),
    } : {}),
    
    hmerominia_gennhshs: safeFormatDate(row.hmerominia_gennhshs || row.esoteriko_melos?.hmerominia_gennhshs),
    
    // Additional fields for form compatibility
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

    const isAthlete = editValues.isAthlete;
    const isSubscriber = editValues.isSubscriber;
    
    // Έλεγχος ημερομηνιών - only if they're a subscriber
    if (isSubscriber && updatedRow.hmerominia_enarksis && updatedRow.hmerominia_pliromis) {
      if (!validateDates(updatedRow.hmerominia_enarksis, updatedRow.hmerominia_pliromis)) {
        alert("Η ημερομηνία έναρξης δεν μπορεί να είναι μεταγενέστερη της ημερομηνίας πληρωμής");
        return;
      }
    }

    // Μετατροπή ημερομηνιών
    let formData = { ...updatedRow };
    if (isSubscriber) {
      if (formData.hmerominia_enarksis) {
        const startDate = new Date(formData.hmerominia_enarksis);
        if (!isNaN(startDate.getTime())) {
          formData.hmerominia_egrafis = startDate.toISOString().split('T')[0];
        }
      }
    }

    const formattedBirthDate = toISODate(formData.hmerominia_gennhshs);
    const formattedStartDate = isSubscriber ? toISODate(formData.hmerominia_enarksis) : undefined;
    const formattedPaymentDate = isSubscriber ? toISODate(formData.hmerominia_pliromis) : undefined;
    
    // Calculate subscription end date
    const endDateStr = isSubscriber && formattedStartDate && formattedPaymentDate ? 
      calculateSubscriptionEndDate(formattedStartDate, formattedPaymentDate) : 
      null;
    
    // Automatically determine the status based on end date
    // Only respect "Διαγραμμένη" status from user input
    const userSelectedStatus = updatedRow.katastasi_sindromis;
    let calculatedStatus;
    
    if (userSelectedStatus === "Διαγραμμένη") {
      // If user specifically marked as deleted, respect that choice
      calculatedStatus = "Διαγραμμένη";
    } else if (endDateStr && endDateStr !== "Άγνωστη") {
      // Otherwise, calculate based on end date
      const endDate = parseDateFromString(endDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Compare only dates
      calculatedStatus = today > endDate ? "Ληγμένη" : "Ενεργή";
    } else {
      // Default to active if we can't calculate
      calculatedStatus = "Ενεργή";
    }
    
    // Υπολογισμός κατάστασης - only for subscribers
    const newStatus = isSubscriber ? calculatedStatus : undefined;
    
    // API Request
    const requestData = {
      // Personal info
      hmerominia_gennhshs: formattedBirthDate,
      patronimo: updatedRow.patronimo || "",
      arithmos_mitroou: updatedRow.arithmos_mitroou || "",
      odos: updatedRow.odos || "",
      tk: updatedRow.tk || "",
      
      // Contact info
      onoma: updatedRow.onoma,
      epitheto: updatedRow.epitheto,
      email: updatedRow.email || "",
      tilefono: updatedRow.tilefono || "",
      
      // Other fields
      epipedo: updatedRow.epipedo,
      sxolia: updatedRow.sxolia || "",
      
      // Subscription fields - include when they're a subscriber, regardless of athlete status
      katastasi_sindromis: isSubscriber ? updatedRow.katastasi_sindromis : undefined, // Change from !isAthlete to isSubscriber
      hmerominia_enarksis: formattedStartDate, 
      hmerominia_egrafis: formattedStartDate,   
      hmerominia_pliromis: formattedPaymentDate,
      eidosSindromis: isSubscriber ? updatedRow.eidoSindromis : undefined // Change from !isAthlete to isSubscriber
    };
      
      const response = await api.put(`/melitousillogou/${id}`, requestData);
      
      // Update local state with consistent date structure
      setData(prevData => 
        prevData.map(item => {
          if (item.id === id || item.id_es_melous === id) {
            console.log("Updating member data:", {
              regDate: formattedStartDate,
              payDate: formattedPaymentDate
            });
            
            // First create a base object without the dates
            const baseObj = {
              ...item,
              ...response.data,
            };
            
            // Then explicitly set the dates AFTER spreading response.data
            return {
              ...baseObj,
              // Explicitly set these dates at top level to ensure they're never overwritten
        hmerominia_egrafis: formattedStartDate, 
        hmerominia_enarksis: formattedStartDate,
        hmerominia_pliromis: formattedPaymentDate,
              // Make sure we preserve the comments field
              melos: {
                ...(baseObj.melos || {}),
                sxolia: updatedRow.sxolia || baseObj.melos?.sxolia || item.melos?.sxolia || "",
                // Preserve other melos fields
                epafes: baseObj.melos?.epafes || item.melos?.epafes,
                vathmos_diskolias: baseObj.melos?.vathmos_diskolias || item.melos?.vathmos_diskolias
              },
              // Update nested structure
   sindromitis: {
          ...(baseObj.sindromitis || {}),
          katastasi_sindromis: newStatus,
                exei: [{
                  hmerominia_pliromis: formattedPaymentDate,
                  sindromi: {
                    hmerominia_enarksis: formattedStartDate,
                    eidos_sindromis: {
                      titlos: updatedRow.eidosSindromis
                    }
                  }
                }]
              },
              // Recalculate subscription end date
              subscriptionEndDate: calculateSubscriptionEndDate(formattedStartDate, formattedPaymentDate)
            };
          }
          return item;
        })
      );
      
      setOpenEditDialog(false);
    } catch (error) {
      console.error("Σφάλμα ενημέρωσης:", error);
      if (error.response?.data) {
        alert(`Σφάλμα: ${JSON.stringify(error.response.data)}`);
      } else {
        alert("Σφάλμα κατά την ενημέρωση του μέλους.");
      }
    }
  };

// Add this helper function to parse Greek-formatted dates "DD/MM/YYYY"
const parseDateFromString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
  }
  
  // Fallback to standard date parsing
  return new Date(dateStr);
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
        // Add default value - find subscription type with ID 1 or use first available
        defaultValue: subscriptionTypes.find(type => type.id_eidous_sindromis === 1)?.titlos || 
                      (subscriptionTypes.length > 0 ? subscriptionTypes[0].titlos : ""),
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
// Στον πίνακα addFields - ενημέρωση των πεδίων ημερομηνίας
{ 
  accessorKey: "hmerominia_enarksis", 
  header: "Ημερομηνία Έναρξης Συνδρομής", 
  type: "date",
  maxDateField: "hmerominia_pliromis",
  validation: yup.date().nullable()
},
{ 
  accessorKey: "hmerominia_pliromis", 
  header: "Ημερομηνία Πληρωμής", 
  type: "date",
  // Προσθήκη ελάχιστης ημερομηνίας (δεν επιτρέπει επιλογή πριν την ημερομηνία έναρξης)
  minDateField: "hmerominia_enarksis",
  validation: yup.date().nullable()
    .test('payment-after-start', 'Η ημερομηνία πληρωμής πρέπει να είναι μετά ή ίδια με την ημερομηνία έναρξης', function(value) {
      const startDate = this.parent.hmerominia_enarksis;
      // If either date is missing, validation passes
      if (!value || !startDate) return true;
      
      // Parse dates to ensure proper comparison
      const paymentDate = new Date(value);
      const registrationDate = new Date(startDate);
      
      // Check if dates are valid
      if (isNaN(paymentDate.getTime()) || isNaN(registrationDate.getTime())) return true;
      
      // Payment date should be same day or after registration date
      return paymentDate >= registrationDate;
    })
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
},
{ 
  accessorKey: "sxolia", 
  header: "Σχόλια", 
  type: "textarea",
  validation: yup.string()
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
        epitheto: response.data.melos?.epafes?.epitheto || "",
        onoma: response.data.melos?.epafes?.onoma || "",
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

// Add this function in Meloi component
const handleMakeAthlete = async (memberId) => {
  try {
    // First check if they're already an athlete
    const memberDetails = await api.get(`/melitousillogou/${memberId}`);
    
    if (memberDetails.data.athlitis) {
      alert("Το μέλος είναι ήδη αθλητής");
      return;
    }
    
    // Confirm that the user wants to make this member an athlete
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να κάνετε αυτό το μέλος αθλητη;")) {
      return;
    }
    
    // Create the athlete record
    await api.post("/athlites/athlete", {
      existingMemberId: memberId,
      athlitis: {},
      athlimata: []
    });
    
    alert("Το μέλος έγινε αθλητής με επιτυχία");
    
    // Update the local data to reflect the change
    const updatedData = await api.get("/melitousillogou");
    setData(updatedData.data);
    
  } catch (error) {
    console.error("Σφάλμα κατά τη μετατροπή του μέλους σε αθλητή:", error);
    alert(`Σφάλμα: ${error.response?.data?.details || error.message}`);
  }
};

  // Add new state for the combined dialog
const [openCombinedConvertDialog, setOpenCombinedConvertDialog] = useState(false);

// Add component for combined dialog
// Add component for combined dialog
const AthleteToSubscriberDialog = () => {
  // Local state for the form
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [subscriptionType, setSubscriptionType] = useState(
    subscriptionTypes.length > 0 ? subscriptionTypes[0].titlos : ''
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState('Ενεργή');
  const [startDate, setStartDate] = useState(null);
  const [paymentDate, setPaymentDate] = useState(null);
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  
  // Filter athletes based on search text
const filteredAthletes = eligibleAthletes.filter(athlete => 
  athlete.name.toLowerCase().includes(filterText.toLowerCase()) || 
  String(athlete.athleteNumber).toLowerCase().includes(filterText.toLowerCase())
);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      // Validate form
      if (!selectedAthleteId) {
        setFormError("Παρακαλώ επιλέξτε αθλητή");
        return;
      }
      
      if (!subscriptionType) {
        setFormError("Το είδος συνδρομής είναι υποχρεωτικό");
        return;
      }
      
      // Format dates for API
      const formattedStartDate = startDate ? toISODate(startDate) : null;
      const formattedPaymentDate = paymentDate ? toISODate(paymentDate) : null;
      
      // Validate dates if both provided
      if (startDate && paymentDate) {
        if (new Date(startDate) > new Date(paymentDate)) {
          setFormError("Η ημερομηνία έναρξης δεν μπορεί να είναι μετά την ημερομηνία πληρωμής");
          return;
        }
      }
      
      // Prepare request data
      const requestData = {
        sindromitis: {
          exei: {
            hmerominia_pliromis: formattedPaymentDate,
            sindromi: {
              hmerominia_enarksis: formattedStartDate,
              eidos_sindromis: subscriptionType,
            },
          },
        },
      };
      
      setLoading(true);
      console.log("Converting athlete to subscriber:", selectedAthleteId);
      console.log("Request data:", requestData);
      
      // Make API call
      const response = await api.put(`/melitousillogou/${selectedAthleteId}`, requestData);
      console.log("Conversion response:", response.data);
      
      // Update the local data
      const membersRes = await api.get("/melitousillogou");
    
    // Process the response data to ensure consistent structure
    const processedData = membersRes.data.map((member) => {
      // Look for dates in all possible locations
      const birthDate = member.hmerominia_gennhshs || 
                member.esoteriko_melos?.hmerominia_gennhshs || null;
  
      // Try both top-level and nested paths for registration and payment dates
      const registrationDate = member.hmerominia_egrafis || 
                       member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis || null;
      const paymentDate = member.hmerominia_pliromis || 
                  member.sindromitis?.exei?.[0]?.hmerominia_pliromis || null;
      
      return {
        ...member,
        id: member.id_es_melous,
        epitheto: member.melos?.epafes?.epitheto || "",
        onoma: member.melos?.epafes?.onoma || "",
        email: member.melos?.epafes?.email || "",
        tilefono: member.melos?.epafes?.tilefono || "",
        odos: member.odos || "",
        tk: member.tk || "",
        arithmos_mitroou: member.arithmos_mitroou || "",
        eidosSindromis: member.sindromitis?.exei?.[0]?.sindromi?.eidos_sindromis?.titlos || "",
        status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || "",
        
        // Always use the consolidated dates from above
        hmerominia_gennhshs: birthDate,
        hmerominia_egrafis: registrationDate,
        hmerominia_pliromis: paymentDate,
        
        subscriptionEndDate: calculateSubscriptionEndDate(registrationDate, paymentDate),
      };
    });
    
    setData(processedData);
      
      // Close dialog
      setOpenCombinedConvertDialog(false);
      
      // Show success message
    } catch (error) {
      console.error("Σφάλμα κατά τη μετατροπή:", error);
      setFormError(error.response?.data?.details || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={openCombinedConvertDialog}
      onClose={() => setOpenCombinedConvertDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Μετατροπή Αθλητή σε Συνδρομητή
      </DialogTitle>
      <DialogContent>
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          noValidate 
          sx={{ mt: 1 }}
        >
          {/* Embedded athlete selection table */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Επιλογή Αθλητή
            </Typography>
            
            {/* Search field */}
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Αναζήτηση αθλητή..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Athletes table */}
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{ 
                maxHeight: '200px', 
                mb: 2
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontWeight: 'bold', width: '70%' }}>Ονοματεπώνυμο</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Αρ. Δελτίου</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAthletes.length > 0 ? (
                    filteredAthletes.map((athlete) => (
                      <TableRow 
                        key={athlete.id}
                        hover
                        selected={selectedAthleteId === athlete.id}
                        onClick={() => setSelectedAthleteId(athlete.id)}
                      >
                        <TableCell padding="checkbox">
                          <Radio
                            checked={selectedAthleteId === athlete.id}
                            onChange={() => setSelectedAthleteId(athlete.id)}
                          />
                        </TableCell>
                        <TableCell>{athlete.name}</TableCell>
                        <TableCell>{athlete.athleteNumber}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        Δεν υπάρχουν διαθέσιμοι αθλητές προς μετατροπή
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Form fields for subscription details */}
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Στοιχεία Συνδρομής
          </Typography>

          {/* Subscription type */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="subscription-type-label">Είδος Συνδρομής</InputLabel>
            <Select
              labelId="subscription-type-label"
              id="subscription-type"
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              label="Είδος Συνδρομής"
              required
            >
              {subscriptionTypes.map((type) => (
                <MenuItem key={type.id_eidous_sindromis} value={type.titlos}>
                  {type.titlos}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Subscription status */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="subscription-status-label">Κατάσταση Συνδρομής</InputLabel>
            <Select
              labelId="subscription-status-label"
              id="subscription-status"
              value={subscriptionStatus}
              onChange={(e) => setSubscriptionStatus(e.target.value)}
              label="Κατάσταση Συνδρομής"
              required
            >
              {subscriptionStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Registration date */}
          <FormControl fullWidth margin="normal">
            <DatePicker
              label="Ημερομηνία Έναρξης Συνδρομής"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              renderInput={(params) => <TextField {...params} />}
              maxDate={paymentDate}
            />
          </FormControl>

          {/* Payment date */}
          <FormControl fullWidth margin="normal">
            <DatePicker
              label="Ημερομηνία Πληρωμής"
              value={paymentDate}
              onChange={(date) => setPaymentDate(date)}
              renderInput={(params) => <TextField {...params} />}
              minDate={startDate}
            />
          </FormControl>

          {formError && (
            <Box sx={{ mt: 2, color: 'error.main' }}>
              <Typography color="error">{formError}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setOpenCombinedConvertDialog(false)}
          color="secondary"
          disabled={loading}
        >
          Άκυρο
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !selectedAthleteId}
        >
          {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Move the AthleteToSubscriberDialog component usage here
return (
  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Μέλη Συλλόγου ({data.length})
      </Typography>

    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
  {SHOW_EXCEL_IMPORT && (
    <Button 
      variant="outlined"
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
  enableAddNew={true}  // Enable the add button
  enableTopAddButton={true}  // Show the add button at the top
  onAddNew={() => setOpenAddDialog(true)}  // Use the same dialog handler
  handleEditClick={handleEditClick}
  handleDelete={handleDelete}
  additionalButtons={
    <Button 
      variant="contained" 
      color="primary"
      startIcon={<TransformIcon />}
      onClick={() => {
        refreshEligibleAthletes();
        if (eligibleAthletes.length === 0) {
          alert("Δεν υπάρχουν αθλητές που δεν είναι ήδη συνδρομητές.");
          return;
        }
        setOpenCombinedConvertDialog(true);
      }}
    >
      Μετατροπη Αθλητη σε Συνδρομητη
    </Button>
  }
/>
      
      {/* Add dialog */}
      <AddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        handleAddSave={handleAddSave}
        fields={addFields}
        title="Προσθήκη Νέου Μέλους"
      />
      
      {/* Edit dialog */}
<EditDialog
  open={openEditDialog}
  onClose={() => setOpenEditDialog(false)}
  handleEditSave={handleEditSave}
  editValues={editValues}  // Changed from initialValues to editValues
  fields={addFields}
  title="Επεξεργασία Μέλους"
/>
      
      {/* Render the athlete to subscriber dialog */}
      {openCombinedConvertDialog && <AthleteToSubscriberDialog />}
    </Box>
  </LocalizationProvider>
);
}

