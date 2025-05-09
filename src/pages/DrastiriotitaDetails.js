import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Container, Divider, Grid,
  IconButton, Button, CircularProgress, Alert, Chip, List, ListItem, ListItemText, Breadcrumbs, Link
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HikingIcon from '@mui/icons-material/Hiking';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LandscapeIcon from '@mui/icons-material/Landscape';
import TimerIcon from '@mui/icons-material/Timer';
import TerrainIcon from '@mui/icons-material/Terrain';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home';
import * as yup from "yup";

import DataTable from "../components/DataTable/DataTable";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import Layout from "../components/Layout";

export default function DrastiriotitaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [drastiriotita, setDrastiriotita] = useState(null);
  const [eksormisi, setEksormisi] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Dialog states
  const [editDrastiriotitaDialog, setEditDrastiriotitaDialog] = useState(false);
  const [currentDrastiriotita, setCurrentDrastiriotita] = useState(null);
  const [addParticipantDialog, setAddParticipantDialog] = useState(false);
  const [editParticipantDialog, setEditParticipantDialog] = useState(false);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentParticipant, setPaymentParticipant] = useState(null);
  
  // Refresh data function
  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  // Fetch data on component mount or when refresh is triggered
  useEffect(() => {
    fetchData();
  }, [id, refreshTrigger]);

  // Fetch all needed data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        setError("Δεν δόθηκε ID δραστηριότητας");
        setLoading(false);
        return;
      }
      
      // Fetch drastiriotita details
      const drastiriotitaResponse = await axios.get(`http://localhost:5000/api/eksormiseis/drastiriotita/${id}`);
      setDrastiriotita(drastiriotitaResponse.data);
      console.log("Drastiriotita data:", drastiriotitaResponse.data);
      
      // Set eksormisi from the drastiriotita response
      setEksormisi(drastiriotitaResponse.data.eksormisi);
      
      // Fetch participants
      try {
        const participantsResponse = await axios.get(`http://localhost:5000/api/eksormiseis/drastiriotita/${id}/simmetexontes`);
        
        // Επεξεργασία συμμετεχόντων για σωστή διαμόρφωση πληρωμών και δραστηριοτήτων
        const processedParticipants = Array.isArray(participantsResponse.data) 
          ? participantsResponse.data.map(item => {
              // Υπολογισμός πληρωμών και υπολοίπου
              const timi = item.timi || 0;
              const totalPaid = (item.plironei || []).reduce(
                (sum, payment) => sum + (payment.poso_pliromis || 0), 0
              );
              const ypoloipo = timi - totalPaid;

              return {
                ...item,
                id: item.id_simmetoxis, // Διασφάλιση συνέπειας ID
                memberName: `${item.melos?.epafes?.onoma || ''} ${item.melos?.epafes?.epitheto || ''}`.trim() || "Άγνωστο όνομα",
                ypoloipo: ypoloipo,
                plironei: Array.isArray(item.plironei) ? item.plironei : [] // Διασφάλιση ότι το plironei είναι πάντα πίνακας
              };
            })
          : [];
        
        setParticipants(processedParticipants);
        
        // 2. Αποθήκευση των IDs των συμμετεχόντων για αργότερα
        const participantsIds = processedParticipants.map(p => p.id_melous);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης συμμετεχόντων:", err);
        setParticipants([]);
        // Σε περίπτωση σφάλματος, θέτουμε κενό πίνακα IDs
        const participantsIds = [];
      }
      
      // Fetch difficulty levels
      try {
        const difficultyResponse = await axios.get("http://localhost:5000/api/vathmoi-diskolias");
        setDifficultyLevels(difficultyResponse.data);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης βαθμών δυσκολίας:", err);
      }
      
      // Fetch available members
      try {
        const membersResponse = await axios.get("http://localhost:5000/api/melitousillogou");
        
        // Filter out members who are already participants
        // Χρησιμοποιούμε τα participantsIds που ορίσαμε παραπάνω
        const availableMembers = membersResponse.data.filter(
          member => !participantsIds.includes(member.id_melous)
        );
        
        setAvailableMembers(availableMembers);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης μελών:", err);
        setAvailableMembers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων της δραστηριότητας");
      setLoading(false);
    }
  };

  // ========== DRASTIRIOTITA MANAGEMENT HANDLERS ==========
  
  // Fields for drastiriotita form
  const drastiriotitaFields = [
    { 
      accessorKey: "titlos", 
      header: "Τίτλος", 
      validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") 
    },
    { 
      accessorKey: "id_vathmou_diskolias", 
      header: "Βαθμός Δυσκολίας", 
      type: "select",
      options: difficultyLevels.map(level => ({
        value: level.id_vathmou_diskolias,
        label: level.onoma
      })),
      validation: yup.number().required("Ο βαθμός δυσκολίας είναι υποχρεωτικός")
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
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός")
    },
    { 
      accessorKey: "megisto_ipsometro", 
      header: "Μέγιστο Υψόμετρο (μ)", 
      type: "number",
      validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός")
    },
    { 
      accessorKey: "hmerominia", 
      header: "Ημερομηνία", 
      type: "date",
      validation: yup.date()
    }
  ];

  // Handle clicking edit drastiriotita
  const handleEditDrastiriotitaClick = () => {
    if (!drastiriotita) return;

    setCurrentDrastiriotita({
      id: drastiriotita.id_drastiriotitas,
      titlos: drastiriotita.titlos || "",
      id_vathmou_diskolias: drastiriotita.id_vathmou_diskolias || "",
      ores_poreias: drastiriotita.ores_poreias || "",
      diafora_ipsous: drastiriotita.diafora_ipsous || "",
      megisto_ipsometro: drastiriotita.megisto_ipsometro || "",
      hmerominia: drastiriotita.hmerominia ? new Date(drastiriotita.hmerominia).toISOString().split('T')[0] : "",
    });
    setEditDrastiriotitaDialog(true);
  };
  
  // Handle saving edited drastiriotita
  const handleEditDrastiriotitaSave = async (updatedDrastiriotita) => {
    try {
      const formattedData = {
        titlos: updatedDrastiriotita.titlos,
        id_vathmou_diskolias: parseInt(updatedDrastiriotita.id_vathmou_diskolias),
        ores_poreias: updatedDrastiriotita.ores_poreias ? parseInt(updatedDrastiriotita.ores_poreias) : null,
        diafora_ipsous: updatedDrastiriotita.diafora_ipsous ? parseInt(updatedDrastiriotita.diafora_ipsous) : null,
        megisto_ipsometro: updatedDrastiriotita.megisto_ipsometro ? parseInt(updatedDrastiriotita.megisto_ipsometro) : null,
        hmerominia: updatedDrastiriotita.hmerominia
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
  
  // Handle deleting drastiriotita
  const handleDeleteDrastiriotita = async () => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη δραστηριότητα;")) {
      return;
    }
    
    try {
      const drastiriotitaId = drastiriotita.id_drastiriotitas || drastiriotita.id;
      await axios.delete(`http://localhost:5000/api/eksormiseis/drastiriotita/${drastiriotitaId}`);
      
      // Navigate back to eksormisi page
      if (eksormisi?.id_eksormisis) {
        navigate(`/eksormisi/${eksormisi.id_eksormisis}`);
      } else {
        navigate('/eksormiseis');
      }
    } catch (error) {
      console.error("Σφάλμα κατά την διαγραφή δραστηριότητας:", error);
      alert("Σφάλμα: " + error.message);
    }
  };

  // ========== PARTICIPANT MANAGEMENT HANDLERS ==========
  
  // Fields for participant form
  const participantFormFields = [
    { 
      accessorKey: "id_melous", 
      header: "Μέλος", 
      type: "select",
      options: availableMembers.map(member => ({ 
        value: member.id_melous !== undefined ? member.id_melous.toString() : "", 
        label: `${member.melos?.epafes?.onoma || ''} ${member.melos?.epafes?.epitheto || ''}`.trim() || "Άγνωστο μέλος"
      })),
      validation: yup.string().required("Παρακαλώ επιλέξτε μέλος")
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
      accessorKey: "poso", 
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
      // Call API to add participant to this drastiriotita
      await axios.post(`http://localhost:5000/api/eksormiseis/${eksormisi.id_eksormisis}/simmetoxi`, {
        id_melous: parseInt(newParticipant.id_melous),
        id_drastiriotitas: parseInt(id),
        timi: parseFloat(newParticipant.timi),
        katastasi: newParticipant.katastasi || "Ενεργή"
      });
      
      refreshData();
      setAddParticipantDialog(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη συμμετέχοντα:", error);
      alert("Σφάλμα: " + error.message);
    }
  };
  
  // Handle clicking edit participant
  const handleEditParticipantClick = (participant) => {
    setCurrentParticipant({
      id_simmetoxis: participant.id_simmetoxis,
      timi: participant.timi,
      katastasi: participant.katastasi || "Ενεργή"
    });
    setEditParticipantDialog(true);
  };
  
  // Handle saving edited participant
  const handleEditParticipantSave = async (updatedParticipant) => {
    try {
      await axios.put(`http://localhost:5000/api/eksormiseis/simmetoxi/${updatedParticipant.id_simmetoxis}`, {
        timi: parseFloat(updatedParticipant.timi),
        katastasi: updatedParticipant.katastasi
      });
      
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
    setPaymentParticipant(participant);
    setPaymentDialog(true);
  };
  
  // Ενημερώστε τη συνάρτηση handleAddPayment:
const handleAddPayment = async (payment) => {
  try {
    if (!paymentParticipant) return;
    
    await axios.post(
      `http://localhost:5000/api/eksormiseis/simmetoxi/${paymentParticipant.id_simmetoxis}/payment`, 
      { 
        poso_pliromis: parseFloat(payment.poso),
        hmerominia_pliromis: payment.hmerominia_pliromis || new Date().toISOString()
      }
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

  // Columns for participants table
  const participantsColumns = [
    { accessorKey: "id_simmetoxis", header: "ID", enableHiding: true },
    { 
      accessorKey: "memberName", 
      header: "Ονοματεπώνυμο",
      Cell: ({ row }) => {
        const firstName = row.original.melos?.epafes?.onoma || '';
        const lastName = row.original.melos?.epafes?.epitheto || '';
        return `${firstName} ${lastName}`.trim() || row.original.memberName || "Άγνωστο όνομα";
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
      accessorKey: "ypoloipo", 
      header: "Υπόλοιπο",
      Cell: ({ row }) => {
        // Calculation of balance if it's not provided
        const value = row.original.ypoloipo !== undefined ? 
          row.original.ypoloipo : 
          row.original.timi - (row.original.katavalei?.reduce((sum, payment) => sum + (payment.poso || 0), 0) || 0);
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center', 
            color: Number(value) > 0 ? 'error.main' : 'success.main',
            fontWeight: 'medium'
          }}>
            <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
            {value}€
          </Box>
        );
      }
    },
    { 
      accessorKey: "katastasi", 
      header: "Κατάσταση",
      Cell: ({ value }) => (
        <Chip 
          label={value || "Ενεργή"} 
          color={value === "Ακυρωμένη" ? "error" : "success"}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      id: 'payment',
      header: 'Πληρωμή',
      Cell: ({ row }) => (
        <IconButton 
          color="primary" 
          onClick={() => handleOpenPaymentDialog(row.original)}
          disabled={row.original.katastasi === "Ακυρωμένη"}
          title="Καταχώρηση Πληρωμής"
        >
          <PaymentIcon />
        </IconButton>
      )
    }
  ];

  // Detail panel configuration for participants
  const participantDetailPanel = {
    mainDetails: [
      { 
        accessor: "melos.epafes.onoma", 
        header: "Όνομα",
        value: (row) => row.melos?.epafes?.onoma || "-"
      },
      { 
        accessor: "melos.epafes.epitheto", 
        header: "Επώνυμο", 
        value: (row) => row.melos?.epafes?.epitheto || "-"
      },
      { 
        accessor: "melos.epafes.email", 
        header: "Email", 
        value: (row) => row.melos?.epafes?.email || "-"
      },
      { 
        accessor: "melos.epafes.tilefono", 
        header: "Τηλέφωνο", 
        value: (row) => row.melos?.epafes?.tilefono || "-"
      },
      { 
        accessor: "melos.tipo_melous", 
        header: "Τύπος Μέλους", 
        value: (row) => row.melos?.tipo_melous || "-"
      },
      { 
        accessor: "melos.vathmos_diskolias.epipedo", // Αλλαγή από onoma σε epipedo
        header: "Βαθμός Δυσκολίας Μέλους", 
        value: (row) => {
          const epipedo = row.melos?.vathmos_diskolias?.epipedo;
          return epipedo ? `Βαθμός ${epipedo}` : "-";
        }
      },
      { 
        accessor: "hmerominia_dilosis", 
        header: "Ημερομηνία Δήλωσης",
        format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-'
      }
    ],
    tables: [
      {
        title: "Ιστορικό Πληρωμών",
        getData: (row) => {
          // Διασφάλιση ότι επιστρέφεται πάντα πίνακας, ακόμα κι αν είναι άδειος
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
        onAddNew: (participant) => handleOpenPaymentDialog(participant),
        onDelete: (payment, participant) => 
          handleRemovePayment(payment.id || payment.id_plironei, participant.id_simmetoxis),
        getRowId: (row) => row.id || row.id_plironei || Math.random().toString(36).substring(2, 9),
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
  if (!drastiriotita) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Η δραστηριότητα δεν βρέθηκε.</Alert>
      </Box>
    );
  }

  const backUrl = eksormisi ? `/eksormisi/${eksormisi.id_eksormisis}` : '/eksormiseis';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Container maxWidth="lg">
        {/* Υπόλοιπο περιεχόμενο */}
        <Box sx={{ my: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate(backUrl)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              {drastiriotita.titlos}
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={handleEditDrastiriotitaClick}
                sx={{ mr: 2 }}
              >
                Επεξεργασία
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleDeleteDrastiriotita}
              >
                Διαγραφή
              </Button>
            </Box>
          </Box>

          {/* Drastiriotita Details */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Basic Information - Left Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HikingIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary">Στοιχεία Δραστηριότητας</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Τίτλος</Typography>
                      <Typography variant="body1">{drastiriotita.titlos || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Βαθμός Δυσκολίας</Typography>
                      {drastiriotita.vathmos_diskolias ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <HikingIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {`Βαθμός ${drastiriotita.vathmos_diskolias.epipedo || drastiriotita.id_vathmou_diskolias || '-'}`}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body1">-</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Ημερομηνία</Typography>
                      <Typography variant="body1">
                        {drastiriotita.hmerominia ? new Date(drastiriotita.hmerominia).toLocaleDateString('el-GR') : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Ώρες Πορείας</Typography>
                      <Typography variant="body1">{drastiriotita.ores_poreias || '-'}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* Technical Information - Right Column */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TerrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary">Τεχνικά Στοιχεία</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Διαφορά Ύψους (μ)</Typography>
                      <Typography variant="body1">{drastiriotita.diafora_ipsous || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Μέγιστο Υψόμετρο (μ)</Typography>
                      <Typography variant="body1">{drastiriotita.megisto_ipsometro || '-'}</Typography>
                    </Grid>
                  </Grid>
                  
                  {/* Eksormisi information */}
                  {eksormisi && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">Μέρος της Εξόρμησης</Typography>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mt: 1, 
                          p: 1.5, 
                          bgcolor: 'background.default', 
                          borderRadius: 1,
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/eksormisi/${eksormisi.id_eksormisis}`)}
                      >
                        <EventIcon sx={{ mr: 1, color: 'info.main' }} fontSize="small" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">{eksormisi.titlos}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {eksormisi.proorismos} • 
                            {eksormisi.hmerominia_anaxorisis ? 
                              ` ${new Date(eksormisi.hmerominia_anaxorisis).toLocaleDateString('el-GR')}` : 
                              ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Participants & Payments */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Συμμετέχοντες & Πληρωμές</Typography>
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
            
            <DataTable
              data={participants}
              columns={participantsColumns}
              detailPanelConfig={participantDetailPanel}
              getRowId={(row) => row.id_simmetoxis}
              initialState={{
                columnVisibility: { id_simmetoxis: false }
              }}
              enableExpand={true}
              enableRowActions={true}
              handleEditClick={handleEditParticipantClick}
              handleDelete={handleRemoveParticipant}
              enableAddNew={false}
              tableName="simmetexontes"
              density="compact"
            />
          </Paper>
        </Box>
        
        {/* Dialogs */}
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
            fields={drastiriotitaFields}
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
            title={`Καταχώρηση Πληρωμής για ${paymentParticipant.memberName || paymentParticipant.melos?.epafes?.onoma + ' ' + paymentParticipant.melos?.epafes?.epitheto || ''}`}
            additionalInfo={`Υπόλοιπο: ${paymentParticipant.ypoloipo || 0}€`}
            fields={paymentFormFields}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
}