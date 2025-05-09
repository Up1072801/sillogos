import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Container, Divider, Grid,
  IconButton, Button, TableContainer, Table, 
  TableHead, TableRow, TableCell, TableBody, 
  CircularProgress, Alert, Chip, TextField, Breadcrumbs, Link
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import HikingIcon from '@mui/icons-material/Hiking';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home';

import DataTable from "../components/DataTable/DataTable";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import Layout from "../components/Layout";
import * as yup from "yup";

export default function EksormisiDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [eksormisi, setEksormisi] = useState(null);
  const [drastiriotites, setDrastiriotites] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  
  // Dialog states
  const [editEksormisiDialog, setEditEksormisiDialog] = useState(false);
  const [editedEksormisi, setEditedEksormisi] = useState(null);
  const [addDrastiriotitaDialog, setAddDrastiriotitaDialog] = useState(false);
  const [editDrastiriotitaDialog, setEditDrastiriotitaDialog] = useState(false);
  const [currentDrastiriotita, setCurrentDrastiriotita] = useState(null);
  const [addParticipantDialog, setAddParticipantDialog] = useState(false);
  const [editParticipantDialog, setEditParticipantDialog] = useState(false);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentParticipant, setPaymentParticipant] = useState(null);

  // Refresh data function
  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  // Fetch data on component mount and when refresh is triggered
  useEffect(() => {
    fetchData();
  }, [id, refreshTrigger]);

  // Main data fetching function
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        setError("Δεν δόθηκε ID εξόρμησης");
        setLoading(false);
        return;
      }
      
      // Fetch eksormisi details
      const eksormisiResponse = await axios.get(`http://localhost:5000/api/eksormiseis/${id}`);
      setEksormisi(eksormisiResponse.data);
      
      // Fetch drastiriotites
      try {
        const drastiriotitesResponse = await axios.get(`http://localhost:5000/api/eksormiseis/${id}/drastiriotites`);
        
        // Ελέγχουμε αν τα δεδομένα είναι πίνακας
        if (Array.isArray(drastiriotitesResponse.data)) {
          // Προσθέτουμε έλεγχο για κάθε στοιχείο και εξασφαλίζουμε ότι έχει όλα τα απαραίτητα πεδία
          const formattedDrastiriotites = drastiriotitesResponse.data.map(item => ({
            id_drastiriotitas: item.id_drastiriotitas || item.id,
            id: item.id_drastiriotitas || item.id, // Διπλή εκχώρηση για συμβατότητα
            titlos: item.titlos || "Χωρίς Τίτλο",
            hmerominia: item.hmerominia || null,
            ores_poreias: item.ores_poreias || null,
            diafora_ipsous: item.diafora_ipsous || null,
            megisto_ipsometro: item.megisto_ipsometro || null,
            id_vathmou_diskolias: item.id_vathmou_diskolias || null,
            vathmos_diskolias: item.vathmos_diskolias || null
          }));
          
          setDrastiriotites(formattedDrastiriotites);
        } else {
          console.error("Μη αναμενόμενο format δεδομένων:", drastiriotitesResponse.data);
          setDrastiriotites([]);
        }
      } catch (err) {
        console.error("Σφάλμα φόρτωσης δραστηριοτήτων:", err);
        setDrastiriotites([]);
      }
      
      // Fetch participants
      try {
        const participantsResponse = await axios.get(`http://localhost:5000/api/eksormiseis/${id}/simmetexontes`);
        
        if (Array.isArray(participantsResponse.data)) {
          const formattedParticipants = participantsResponse.data.map(item => {
            console.log("plironei για συμμετοχή", item.id_simmetoxis, item.plironei);
        
            // Calculate payment info
            const timi = item.timi || 0;
            const totalPaid = (item.plironei || []).reduce(
              (sum, payment) => sum + (payment.poso_pliromis || 0), 0
            );
            const ypoloipo = timi - totalPaid;
        
            // Safely extract drastiriotita title - use the ID to get title from drastiriotites array
            let drastiriotitaTitlos = "Άγνωστη δραστηριότητα";
            if (item.id_drastiriotitas) {
              const found = drastiriotites.find(
                d => String(d.id_drastiriotitas) === String(item.id_drastiriotitas)
              );
              if (found?.titlos) drastiriotitaTitlos = found.titlos;
            } else if (item.drastiriotita?.titlos) {
              drastiriotitaTitlos = item.drastiriotita.titlos;
            }
        
            return {
              ...item,
              id: item.id_simmetoxis,
              memberName: `${item.melos?.epafes?.onoma || ''} ${item.melos?.epafes?.epitheto || ''}`.trim() || "Άγνωστο όνομα",
              drastiriotitaTitlos,
              ypoloipo,
              plironei: Array.isArray(item.plironei) ? item.plironei : [] // Ensure plironei is always an array
            };
          });
      
          setParticipants(formattedParticipants);
        } else {
          setParticipants([]);
        }
      } catch (err) {
        setParticipants([]);
      }
      
      // Fetch difficulty levels
      try {
        const difficultyResponse = await axios.get("http://localhost:5000/api/vathmoi-diskolias");
        setDifficultyLevels(difficultyResponse.data);
      } catch (err) {
        // Silently handle error
      }
      
      // Fetch available members
      try {
        const membersResponse = await axios.get("http://localhost:5000/api/melitousillogou");
        // Φιλτράρισμα για να αφαιρέσουμε μέλη που ήδη συμμετέχουν σε κάποια δραστηριότητα
        const existingMemberIds = new Set(participants.map(p => p.id_melous));
        
        const filteredMembers = membersResponse.data.filter(member => {
          const memberId = member.id_es_melous || member.id;
          return !existingMemberIds.has(memberId);
        });
        
        setAvailableMembers(filteredMembers);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης μελών:", err);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων της εξόρμησης");
      setLoading(false);
    }
  };

  // ========== EKSORMISI MANAGEMENT HANDLERS ==========
  
  // Handle editing eksormisi
  const handleEditEksormisiClick = () => {
    setEditedEksormisi({
      id: eksormisi.id_eksormisis,
      titlos: eksormisi.titlos || "",
      proorismos: eksormisi.proorismos || "",
      timi: eksormisi.timi || 0,
      hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis ? new Date(eksormisi.hmerominia_anaxorisis).toISOString().split('T')[0] : "",
      hmerominia_afiksis: eksormisi.hmerominia_afiksis ? new Date(eksormisi.hmerominia_afiksis).toISOString().split('T')[0] : ""
    });
    setEditEksormisiDialog(true);
  };
  
  // Handle saving edited eksormisi
  const handleEditEksormisiSave = async (updatedEksormisi) => {
    try {
      const formattedData = {
        titlos: updatedEksormisi.titlos,
        proorismos: updatedEksormisi.proorismos,
        timi: parseInt(updatedEksormisi.timi),
        hmerominia_anaxorisis: updatedEksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: updatedEksormisi.hmerominia_afiksis
      };
      
      await axios.put(`http://localhost:5000/api/eksormiseis/${id}`, formattedData);
      refreshData();
      setEditEksormisiDialog(false);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία εξόρμησης:", error);
      alert("Σφάλμα: " + error.message);
    }
  };

  // ========== DRASTIRIOTITA MANAGEMENT HANDLERS ==========
  
  // Fields for drastiriotita forms
  const drastiriotitaFormFields = [
    { 
      accessorKey: "titlos", 
      header: "Τίτλος", 
      validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") 
    },
    { 
      accessorKey: "hmerominia", 
      header: "Ημερομηνία", 
      type: "date",
      validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") 
    },
    { 
      accessorKey: "ores_poreias", 
      header: "Ώρες Πορείας", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός")
    },
    { 
      accessorKey: "diafora_ipsous", 
      header: "Διαφορά Ύψους (μ)", 
      type: "number",
      validation: yup.number()
    },
    { 
      accessorKey: "megisto_ipsometro", 
      header: "Μέγιστο Υψόμετρο (μ)", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός")
    },
    { 
      accessorKey: "id_vathmou_diskolias", 
      header: "Βαθμός Δυσκολίας", 
      type: "select",
      options: difficultyLevels.map(level => ({ 
        value: level.id_vathmou_diskolias, 
        label: `Βαθμός ${level.epipedo}` 
      })),
      defaultValue: difficultyLevels.length > 0 ? difficultyLevels[0].id_vathmou_diskolias : ""
    }
  ];
  
  // Handle adding drastiriotita
  const handleAddDrastiriotita = async (newDrastiriotita) => {
    try {
      const formattedData = {
        titlos: newDrastiriotita.titlos,
        hmerominia: newDrastiriotita.hmerominia,
        ores_poreias: newDrastiriotita.ores_poreias ? parseInt(newDrastiriotita.ores_poreias) : null,
        diafora_ipsous: newDrastiriotita.diafora_ipsous ? parseInt(newDrastiriotita.diafora_ipsous) : null,
        megisto_ipsometro: newDrastiriotita.megisto_ipsometro ? parseInt(newDrastiriotita.megisto_ipsometro) : null,
        id_vathmou_diskolias: parseInt(newDrastiriotita.id_vathmou_diskolias)
      };
      
      await axios.post(`http://localhost:5000/api/eksormiseis/${id}/drastiriotita`, formattedData);
      
      refreshData();
      setAddDrastiriotitaDialog(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη δραστηριότητας:", error);
      alert("Σφάλμα: " + error.message);
    }
  };
  
  // Handle editing drastiriotita
  const handleEditDrastiriotitaClick = (drastiriotita) => {
    setCurrentDrastiriotita({
      id: drastiriotita.id_drastiriotitas || drastiriotita.id,
      titlos: drastiriotita.titlos,
      hmerominia: drastiriotita.hmerominia ? new Date(drastiriotita.hmerominia).toISOString().split('T')[0] : "",
      ores_poreias: drastiriotita.ores_poreias,
      diafora_ipsous: drastiriotita.diafora_ipsous,
      megisto_ipsometro: drastiriotita.megisto_ipsometro,
      id_vathmou_diskolias: drastiriotita.id_vathmou_diskolias
    });
    setEditDrastiriotitaDialog(true);
  };
  
  // Handle saving edited drastiriotita
  const handleEditDrastiriotitaSave = async (updatedDrastiriotita) => {
    try {
      const formattedData = {
        titlos: updatedDrastiriotita.titlos,
        hmerominia: updatedDrastiriotita.hmerominia,
        ores_poreias: updatedDrastiriotita.ores_poreias ? parseInt(updatedDrastiriotita.ores_poreias) : null,
        diafora_ipsous: updatedDrastiriotita.diafora_ipsous ? parseInt(updatedDrastiriotita.diafora_ipsous) : null,
        megisto_ipsometro: updatedDrastiriotita.megisto_ipsometro ? parseInt(updatedDrastiriotita.megisto_ipsometro) : null,
        id_vathmou_diskolias: parseInt(updatedDrastiriotita.id_vathmou_diskolias)
      };
      
      await axios.put(`http://localhost:5000/api/eksormiseis/drastiriotita/${updatedDrastiriotita.id}`, formattedData);
      
      refreshData();
      setEditDrastiriotitaDialog(false);
      setCurrentDrastiriotita(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία δραστηριότητας:", error);
      alert("Σφάλμα: " + error.message);
    }
  };
  
  // Βελτιωμένος handler διαγραφής δραστηριότητας
const handleDeleteDrastiriotita = async (drastiriotita) => {
  let drastiriotitaId;
  
  // Έλεγχος αν το drastiriotita είναι απλά ένα ID (αριθμός ή string)
  if (typeof drastiriotita === 'number' || typeof drastiriotita === 'string') {
    drastiriotitaId = drastiriotita;
  } 
  // Έλεγχος αν η παράμετρος είναι αντικείμενο
  else if (drastiriotita && typeof drastiriotita === 'object') {
    drastiriotitaId = drastiriotita.id_drastiriotitas || drastiriotita.id;
  } else {
    alert("Σφάλμα: Δεν προσδιορίστηκε η δραστηριότητα προς διαγραφή");
    return;
  }
  
  if (!drastiriotitaId) {
    alert("Σφάλμα: Δεν βρέθηκε αναγνωριστικό για τη δραστηριότητα");
    return;
  }
  
  try {
    await axios.delete(`http://localhost:5000/api/eksormiseis/drastiriotita/${drastiriotitaId}`);
    refreshData();
  } catch (error) {
    alert("Σφάλμα: " + error.message);
  }
};

  // ========== PARTICIPANT MANAGEMENT HANDLERS ==========
  
  // Fields for participant forms
  const participantFormFields = [
    { 
      accessorKey: "id_melous", 
      header: "Μέλος", 
      type: "select",
      options: availableMembers.map(member => ({ 
        value: member.id_es_melous || member.id, 
        label: `${member.melos?.epafes?.onoma || ''} ${member.melos?.epafes?.epitheto || ''}`.trim() || "Άγνωστο μέλος"
      })),
      validation: yup.string().required("Παρακαλώ επιλέξτε μέλος")
    },
    { 
      accessorKey: "id_drastiriotitas", 
      header: "Δραστηριότητα", 
      type: "select",
      options: drastiriotites.map(dr => ({ 
        value: dr.id_drastiriotitas || dr.id, 
        label: dr.titlos || "Άγνωστη δραστηριότητα"
      })),
      validation: yup.string().required("Παρακαλώ επιλέξτε δραστηριότητα")
    },
    { 
      accessorKey: "timi", 
      header: "Τιμή", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός").required("Η τιμή είναι υποχρεωτική")
    },
    { 
      accessorKey: "katastasi", 
      header: "Κατάσταση", 
      type: "select",
      options: [
        { value: "Ενεργή", label: "Ενεργή" },
        { value: "Ακυρωμένη", label: "Ακυρωμένη" }
      ],
      defaultValue: "Ενεργή"
    }
  ];
  
  // Fields for payment form
  const paymentFormFields = [
    { 
      accessorKey: "poso_pliromis", 
      header: "Ποσό Πληρωμής", 
      type: "number",
      validation: yup.number()
        .min(0.01, "Το ποσό πρέπει να είναι μεγαλύτερο από 0")
        .required("Το ποσό είναι υποχρεωτικό")
    },
    {
      accessorKey: "hmerominia_pliromis",
      header: "Ημερομηνία Πληρωμής",
      type: "date",
      defaultValue: new Date().toISOString().split('T')[0]
    }
  ];
  
  // Handle adding participant
  const handleAddParticipant = async (newParticipant) => {
    try {
      const formattedData = {
        id_melous: parseInt(newParticipant.id_melous),
        id_drastiriotitas: parseInt(newParticipant.id_drastiriotitas),
        timi: parseFloat(newParticipant.timi),
        katastasi: newParticipant.katastasi || "Ενεργή"
      };
      
      await axios.post(`http://localhost:5000/api/eksormiseis/${id}/simmetoxi`, formattedData);
      
      refreshData();
      setAddParticipantDialog(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη συμμετέχοντα:", error);
      alert("Σφάλμα: " + error.message);
    }
  };
  
  // Handle editing participant
  const handleEditParticipantClick = (participant) => {
    setCurrentParticipant({
      id_simmetoxis: participant.id_simmetoxis || participant.id,
      timi: participant.timi,
      katastasi: participant.katastasi || "Ενεργή"
    });
    setEditParticipantDialog(true);
  };
  
  // Handle saving edited participant
  const handleEditParticipantSave = async (updatedParticipant) => {
    try {
      const formattedData = {
        timi: parseFloat(updatedParticipant.timi),
        katastasi: updatedParticipant.katastasi
      };
      
      await axios.put(`http://localhost:5000/api/eksormiseis/simmetoxi/${updatedParticipant.id_simmetoxis}`, formattedData);
      
      refreshData();
      setEditParticipantDialog(false);
      setCurrentParticipant(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία συμμετέχοντα:", error);
      alert("Σφάλμα: " + error.message);
    }
  };
  
  // Handle removing participant
  const handleRemoveParticipant = async (participant) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτόν τον συμμετέχοντα;")) {
      return;
    }
    
    try {
      const participantId = participant.id_simmetoxis || participant.id;
      await axios.delete(`http://localhost:5000/api/eksormiseis/simmetoxi/${participantId}`);
      
      refreshData();
    } catch (error) {
      console.error("Σφάλμα κατά την αφαίρεση συμμετέχοντα:", error);
      alert("Σφάλμα: " + error.message);
    }
  };

  // ========== PAYMENT MANAGEMENT HANDLERS ==========
  
  // Handle opening payment dialog
  const handleOpenPaymentDialog = (participant) => {
    // Εδώ βεβαιώσου ότι περνάς το σωστό αντικείμενο με id_simmetoxis
    setPaymentParticipant({
      ...participant,
      id_simmetoxis: participant.id_simmetoxis || participant.id // fallback αν χρειαστεί
    });
    setPaymentDialog(true);
  };
  
  // Handle adding payment
  const handleAddPayment = async (payment) => {
    try {
      if (!paymentParticipant) return;
      
      const formattedData = {
        poso_pliromis: parseFloat(payment.poso_pliromis),
        hmerominia_pliromis: payment.hmerominia_pliromis || new Date().toISOString()
      };
      
      await axios.post(
        `http://localhost:5000/api/eksormiseis/simmetoxi/${paymentParticipant.id_simmetoxis}/payment`, 
        formattedData
      );
      
      refreshData();
      setPaymentDialog(false);
      setPaymentParticipant(null);
    } catch (error) {
      console.error("Σφάλμα κατά την καταχώρηση πληρωμής:", error);
      alert("Σφάλμα: " + error.message);
    }
  };
  
  // Handle removing payment
  const handleRemovePayment = async (paymentId, simmetoxiId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτή την πληρωμή;")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/eksormiseis/simmetoxi/${simmetoxiId}/payment/${paymentId}`);
      refreshData();
    } catch (error) {
      console.error("Σφάλμα κατά την αφαίρεση πληρωμής:", error);
      alert("Σφάλμα: " + error.message);
    }
  };

  // Διορθωμένα columns για τον πίνακα δραστηριοτήτων
const drastiriotitesColumns = [
  { accessorKey: "id_drastiriotitas", header: "ID", enableHiding: true },
  { 
    accessorKey: "titlos", 
    header: "Τίτλος",
    Cell: ({ row }) => {
      const id = row.original.id_drastiriotitas || row.original.id;
      const title = row.original.titlos || "Χωρίς Τίτλο";
      
      return (
        <Box 
          sx={{ 
            cursor: "pointer", 
            color: "primary.main", 
            fontWeight: "medium",
            "&:hover": { textDecoration: "underline" } 
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/drastiriotita/${id}`);
          }}
        >
          {title}
        </Box>
      );
    }
  },
  { 
    accessorKey: "hmerominia", 
    header: "Ημερομηνία",
    Cell: ({ row }) => {
      const date = row.original.hmerominia;
      if (!date) return "-";
      
      try {
        return new Date(date).toLocaleDateString('el-GR');
      } catch (error) {
        console.error("Σφάλμα μετατροπής ημερομηνίας:", error);
        return "-";
      }
    }
  },
  { accessorKey: "ores_poreias", header: "Ώρες Πορείας" },
  { accessorKey: "diafora_ipsous", header: "Διαφορά Ύψους (μ)" },
  { accessorKey: "megisto_ipsometro", header: "Μέγιστο Υψόμετρο (μ)" },
  { 
    accessorKey: "vathmos_diskolias", 
    header: "Βαθμός Δυσκολίας",
    Cell: ({ row }) => {
      // Βελτιωμένος έλεγχος για το vathmos_diskolias
      const vathmos = row.original.vathmos_diskolias;
      
      if (!vathmos) {
        // Αν δεν υπάρχει το αντικείμενο vathmos_diskolias
        if (row.original.id_vathmou_diskolias) {
          // Εάν υπάρχει ένα id_vathmou_diskolias μπορούμε να το χρησιμοποιήσουμε
          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HikingIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
              {`Βαθμός ${row.original.id_vathmou_diskolias}`}
            </Box>
          );
        }
        return "Άγνωστο";
      }
      
      // Αναζήτηση του επιπέδου με διάφορους τρόπους
      let vathmosValue;
      
      if (typeof vathmos.epipedo !== 'undefined' && vathmos.epipedo !== null) {
        vathmosValue = vathmos.epipedo;
      } else if (typeof vathmos.id_vathmou_diskolias !== 'undefined' && vathmos.id_vathmou_diskolias !== null) {
        vathmosValue = vathmos.id_vathmou_diskolias;
      } else {
        // Αναζήτηση σε οποιοδήποτε πεδίο που θα μπορούσε να περιέχει το επίπεδο
        for (const key in vathmos) {
          if (vathmos[key] && typeof vathmos[key] !== 'object') {
            vathmosValue = vathmos[key];
            break;
          }
        }
      }
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HikingIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
          {vathmosValue !== undefined && vathmosValue !== null ? `Βαθμός ${vathmosValue}` : "Άγνωστο"}
        </Box>
      );
    }
  }
];

  // Ορίστε τις στήλες του πίνακα συμμετεχόντων με σαφείς accessors
const participantsColumns = [
  { accessorKey: "id_simmetoxis", header: "ID", enableHiding: true },
  { 
    accessorKey: "memberName", 
    header: "Ονοματεπώνυμο",
    Cell: ({ row }) => {
      const memberName = row.original.memberName || 
                        `${row.original.melos?.epafes?.onoma || ''} ${row.original.melos?.epafes?.epitheto || ''}`.trim() ||
                        "Άγνωστο όνομα";
      return memberName;
    }
  },
  { 
    accessorKey: "melos.epafes.email", 
    header: "Email",
    Cell: ({ row }) => row.original.melos?.epafes?.email || "-"
  },
  { 
    accessorKey: "melos.epafes.tilefono", 
    header: "Τηλέφωνο",
    Cell: ({ row }) => row.original.melos?.epafes?.tilefono || "-"
  },
  { 
    // Use a direct accessor to the pre-processed field instead of the nested path
    accessorKey: "drastiriotitaTitlos", 
    header: "Δραστηριότητα",
    Cell: ({ row }) => (
      <Typography variant="body2">
        {row.original.drastiriotitaTitlos || "-"}
      </Typography>
    )
  },
  { 
    accessorKey: "ypoloipo", 
    header: "Υπόλοιπο",
    Cell: ({ row }) => {
      // Use the pre-calculated ypoloipo from the formatted data if available
      // Otherwise recalculate it
      const ypoloipo = typeof row.original.ypoloipo === 'number' ? 
        row.original.ypoloipo : 
        (row.original.timi || 0) - ((row.original.plironei || []).reduce(
          (sum, payment) => sum + (payment.poso_pliromis || 0), 0
        ));

      return (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center', 
          color: ypoloipo > 0 ? 'error.main' : 'success.main',
          fontWeight: 'medium'
        }}>
          <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
          {ypoloipo}€
        </Box>
      );
    }
  },
  { 
    accessorKey: "katastasi", 
    header: "Κατάσταση",
    Cell: ({ row }) => (
      <Chip 
        label={row.original.katastasi || "Ενεργή"} 
        color={row.original.katastasi === "Ακυρωμένη" ? "error" : "success"}
        size="small"
        variant="outlined"
      />
    )
  },
  { 
    id: "payment",
    header: "Πληρωμή",
    Cell: ({ row }) => (
      <IconButton 
        size="small"
        color="primary" 
        onClick={() => handleOpenPaymentDialog(row.original)}
        disabled={row.original.katastasi === "Ακυρωμένη"}
        title="Καταχώρηση Πληρωμής"
      >
        <PaymentIcon fontSize="small" />
      </IconButton>
    )
  }
];

  // Detail panel configuration for participants
  const participantDetailPanel = {
  mainDetails: [
    { accessor: "memberName", header: "Ονοματεπώνυμο" },
    { accessor: "melos.epafes.email", header: "Email" },
    { accessor: "melos.epafes.tilefono", header: "Τηλέφωνο" },
    { accessor: "drastiriotitaTitlos", header: "Δραστηριότητα" }, 
    { accessor: "timi", header: "Τιμή", format: (value) => `${value || 0}€` },
    { accessor: "katastasi", header: "Κατάσταση" },
    { accessor: "ypoloipo", header: "Υπόλοιπο", format: (value) => `${value || 0}€` }
  ],
  tables: [
    {
      title: "Ιστορικό Πληρωμών",
      getData: (row) => {
        if (!row.plironei || !Array.isArray(row.plironei)) {
          return [];
        }
        return row.plironei;
      },
      columns: [
        { 
          accessorKey: "poso_pliromis", 
          header: "Ποσό",
          Cell: ({ row }) => `${row.original.poso_pliromis || 0}€`
        },
        { 
          accessorKey: "hmerominia_pliromis", 
          header: "Ημερομηνία",
          Cell: ({ row }) => row.original.hmerominia_pliromis ? 
            new Date(row.original.hmerominia_pliromis).toLocaleDateString("el-GR") : "-"
        }
      ],
      onDelete: (payment, participant) => 
        handleRemovePayment(payment.id || payment.id_plironei, participant.id_simmetoxis),
      onAddNew: (participant) => handleOpenPaymentDialog(participant),
      getRowId: (row) => row.id || row.id_plironei || Math.random().toString(36).substring(2),
      emptyMessage: "Δεν υπάρχουν καταχωρημένες πληρωμές"
    }
  ]
};

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Render not found state
  if (!eksormisi) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Η εξόρμηση δεν βρέθηκε.</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ my: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/eksormiseis')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              {eksormisi.titlos}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={handleEditEksormisiClick}
            >
              Επεξεργασία
            </Button>
          </Box>

          {/* Eksormisi Details Card */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary">Στοιχεία Εξόρμησης</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Τίτλος</Typography>
                      <Typography variant="body1">{eksormisi.titlos || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Προορισμός</Typography>
                      <Typography variant="body1">{eksormisi.proorismos || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Ημερομηνία Αναχώρησης</Typography>
                      <Typography variant="body1">
                        {eksormisi.hmerominia_anaxorisis ? new Date(eksormisi.hmerominia_anaxorisis).toLocaleDateString('el-GR') : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Ημερομηνία Άφιξης</Typography>
                      <Typography variant="body1">
                        {eksormisi.hmerominia_afiksis ? new Date(eksormisi.hmerominia_afiksis).toLocaleDateString('el-GR') : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Τιμή</Typography>
                      <Typography variant="body1">{eksormisi.timi ? `${eksormisi.timi}€` : '-'}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary">Πληροφορίες Εξόρμησης</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    Η εξόρμηση περιλαμβάνει {drastiriotites.length} δραστηριότητες και έχει συνολικά {participants.length} συμμετέχοντες.
                  </Typography>
                  
                  <Box sx={{ my: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Ημέρες Διάρκειας</Typography>
                    <Typography variant="body1">
                      {eksormisi.hmerominia_anaxorisis && eksormisi.hmerominia_afiksis ? 
                        Math.ceil((new Date(eksormisi.hmerominia_afiksis) - new Date(eksormisi.hmerominia_anaxorisis)) / (1000 * 60 * 60 * 24)) + 1 
                        : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Drastiriotites Table */}
          <Paper sx={{ p: 3, mb: 4, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <HikingIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Δραστηριότητες ({drastiriotites.length})
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<AddIcon />} 
                onClick={() => setAddDrastiriotitaDialog(true)}
              >
                Προσθήκη δραστηριότητας
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <DataTable 
              data={drastiriotites}
              columns={drastiriotitesColumns}
              getRowId={(row) => row.id_drastiriotitas || row.id}
              initialState={{ columnVisibility: { id_drastiriotitas: false } }}
              handleRowClick={(row) => navigate(`/drastiriotita/${row.id_drastiriotitas || row.id}`)}
              handleEditClick={handleEditDrastiriotitaClick}
              handleDelete={(row) => handleDeleteDrastiriotita(row.original || row)}
              enableRowActions={true}
              tableName="drastiriotites"
              density="compact"
              enableAddNew={false}
            />
          </Paper>
          
          {/* Participants Table */}
          <Paper sx={{ p: 3, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Συμμετέχοντες & Πληρωμές ({participants.length})
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<AddIcon />} 
                onClick={() => setAddParticipantDialog(true)}
              >
                Προσθήκη συμμετέχοντα
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {participants && participants.length > 0 ? (
              <DataTable
                data={participants}
                columns={participantsColumns}
                detailPanelConfig={participantDetailPanel}
                getRowId={(row) => row.id_simmetoxis || row.id}
                initialState={{ columnVisibility: { id_simmetoxis: false } }}
                enableExpand={true}
                enableRowActions={true}
                handleEditClick={handleEditParticipantClick}
                handleDelete={(participant) => handleRemoveParticipant(participant.original || participant)}
                enableAddNew={false}
                tableName="simmetexontes"
                density="compact"
                state={{ showSkeletons: loading }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 4 }}>
                Δεν υπάρχουν συμμετέχοντες
              </Typography>
            )}
          </Paper>
        </Box>
        
        {/* Dialogs */}
        {editedEksormisi && (
          <EditDialog 
            open={editEksormisiDialog}
            onClose={() => setEditEksormisiDialog(false)}
            handleEditSave={handleEditEksormisiSave}
            editValues={editedEksormisi}
            title="Επεξεργασία Στοιχείων Εξόρμησης"
            fields={[
              { accessorKey: "titlos", header: "Τίτλος", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
              { accessorKey: "proorismos", header: "Προορισμός", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
              { accessorKey: "timi", header: "Τιμή", type: "number", validation: yup.number().min(0, "Η τιμή δεν μπορεί να είναι αρνητική") },
              { accessorKey: "hmerominia_anaxorisis", header: "Ημερομηνία Αναχώρησης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") },
              { accessorKey: "hmerominia_afiksis", header: "Ημερομηνία Άφιξης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") }
            ]}
          />
        )}
        
        <AddDialog
          open={addDrastiriotitaDialog}
          onClose={() => setAddDrastiriotitaDialog(false)}
          handleAddSave={handleAddDrastiriotita}
          title="Προσθήκη Δραστηριότητας"
          fields={drastiriotitaFormFields}
        />
        
        {currentDrastiriotita && (
          <EditDialog
            open={editDrastiriotitaDialog}
            onClose={() => {
              setEditDrastiriotitaDialog(false);
              setCurrentDrastiriotita(null);
            }}
            handleEditSave={handleEditDrastiriotitaSave}
            editValues={currentDrastiriotita}
            title="Επεξεργασία Δραστηριότητας"
            fields={[
              { accessorKey: "id", header: "ID", type: "hidden" },
              ...drastiriotitaFormFields
            ]}
          />
        )}
        
        <AddDialog
          open={addParticipantDialog}
          onClose={() => setAddParticipantDialog(false)}
          handleAddSave={handleAddParticipant}
          title="Προσθήκη Συμμετέχοντα"
          fields={participantFormFields}
        />
        
        {currentParticipant && (
          <EditDialog
            open={editParticipantDialog}
            onClose={() => {
              setEditParticipantDialog(false);
              setCurrentParticipant(null);
            }}
            handleEditSave={handleEditParticipantSave}
            editValues={currentParticipant}
            title="Επεξεργασία Συμμετέχοντα"
            fields={[
              { accessorKey: "id_simmetoxis", header: "ID", type: "hidden" },
              { accessorKey: "timi", header: "Τιμή", type: "number", validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός").required("Η τιμή είναι υποχρεωτική") },
              { 
                accessorKey: "katastasi", 
                header: "Κατάσταση", 
                type: "select",
                options: [
                  { value: "Ενεργή", label: "Ενεργή" },
                  { value: "Εκκρεμής", label: "Εκκρεμής" },
                  { value: "Ολοκληρωμένη", label: "Ολοκληρωμένη" },
                  { value: "Ακυρωμένη", label: "Ακυρωμένη" }
                ]
              }
            ]}
          />
        )}
        
        {paymentParticipant && (
          <AddDialog
            open={paymentDialog}
            onClose={() => {
              setPaymentDialog(false);
              setPaymentParticipant(null);
            }}
            handleAddSave={handleAddPayment}
            title={`Καταχώρηση Πληρωμής για ${paymentParticipant.memberName || ''}`}
            additionalInfo={`Υπόλοιπο: ${paymentParticipant.ypoloipo || 0}€`}
            fields={paymentFormFields}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
}