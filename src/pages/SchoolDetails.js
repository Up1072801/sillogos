import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Container, Divider, Grid,
  IconButton, Button, TableContainer, Table, 
  TableHead, TableRow, TableCell, TableBody, 
  CircularProgress, Alert, Chip, TextField
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import DataTable from "../components/DataTable/DataTable";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import * as yup from "yup";
import "./App.css";

export default function SchoolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [school, setSchool] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Dialog states
  const [editSchoolDialog, setEditSchoolDialog] = useState(false);
  const [editedSchool, setEditedSchool] = useState(null);
  const [addParticipantDialog, setAddParticipantDialog] = useState(false);
  const [editParticipantDialog, setEditParticipantDialog] = useState(false);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentParticipant, setPaymentParticipant] = useState(null);
  
  // Locations management - όπως στο sxoles.js
  const [newLocation, setNewLocation] = useState({ topothesia: "", start: "", end: "" });
  const [editLocationDialog, setEditLocationDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Teacher management
  const [addTeacherDialog, setAddTeacherDialog] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);

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
        setError("Δεν δόθηκε ID σχολής");
        setLoading(false);
        return;
      }
      
      // Fetch school details
      const response = await axios.get(`http://localhost:5000/api/sxoles/${id}`);
      setSchool(response.data);
      console.log("School data:", response.data);
      
      // Fetch participants
      try {
        const participantsResponse = await axios.get(`http://localhost:5000/api/sxoles/${id}/parakolouthisi`);
        // Επεξεργασία δεδομένων συμμετεχόντων πριν την αποθήκευση
        const processedParticipants = participantsResponse.data.map(participant => {
          // Δημιουργία ονοματεπώνυμου από τα δεδομένα της επαφής
          const firstName = participant.melos?.epafes?.onoma || '';
          const lastName = participant.melos?.epafes?.epitheto || '';
          return {
            ...participant,
            memberName: `${firstName} ${lastName}`.trim() || "Άγνωστο όνομα",
            // Βεβαιωνόμαστε ότι το υπόλοιπο είναι διαθέσιμο
            ypoloipo: participant.ypoloipo || participant.timi - (participant.katavalei?.reduce((sum, payment) => sum + (payment.poso || 0), 0) || 0)
          };
        });
        
        setParticipants(processedParticipants);
        console.log("Processed Participants:", processedParticipants);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης συμμετεχόντων:", err);
      }
      
      // Fetch available members for adding participants
      try {
        const membersResponse = await axios.get("http://localhost:5000/api/melitousillogou");
        setAvailableMembers(membersResponse.data
          .filter(member => member && member.id_melous !== undefined)
          .filter(member => !participants.some(p => p.id_melous === member.id_melous))
        );
      } catch (err) {
        console.error("Σφάλμα φόρτωσης μελών:", err);
      }
      
      // Fetch available teachers - διορθωμένο endpoint
      try {
        const teachersResponse = await axios.get("http://localhost:5000/api/Repafes/ekpaideutes-me-sxoles");
        setAvailableTeachers(teachersResponse.data);
      } catch (err) {
        console.error("Σφάλμα φόρτωσης εκπαιδευτών:", err);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων της σχολής");
      setLoading(false);
    }
  };

  // Parse locations from school data
  const parseLocations = () => {
    let locations = [];
    if (school?.topothesies) {
      try {
        const parsed = typeof school.topothesies === 'string' ? JSON.parse(school.topothesies) : school.topothesies;
        locations = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error("Σφάλμα ανάλυσης τοποθεσιών:", e);
        if (typeof school.topothesies === 'string') {
          locations = [{ topothesia: school.topothesies }];
        }
      }
    } else if (school?.topothesia) {
      try {
        const parsed = typeof school.topothesia === 'string' ? JSON.parse(school.topothesia) : school.topothesia;
        locations = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        locations = [{ topothesia: school.topothesia }];
      }
    }
    return locations.map((loc, index) => ({ id: index, ...loc }));
  };

  // ========== SCHOOL MANAGEMENT HANDLERS ==========
  
  // Handle editing school
  const handleEditSchoolClick = () => {
    setEditedSchool({
      klados: school.klados || "",
      epipedo: school.epipedo || "",
      timi: school.timi || 0,
      etos: school.etos || "",
      seira: school.seira || ""
    });
    setEditSchoolDialog(true);
  };
  
  // Handle saving edited school
  const handleEditSchoolSave = async (updatedSchool) => {
    try {
      const formattedSchool = {
        klados: updatedSchool.klados,
        epipedo: updatedSchool.epipedo,
        timi: updatedSchool.timi ? parseInt(updatedSchool.timi) : null,
        etos: updatedSchool.etos ? parseInt(updatedSchool.etos) : null,
        seira: updatedSchool.seira ? parseInt(updatedSchool.seira) : null
      };
      
      await axios.put(`http://localhost:5000/api/sxoles/${id}`, formattedSchool);
      refreshData();
      setEditSchoolDialog(false);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία σχολής:", error);
      alert("Σφάλμα κατά την επεξεργασία: " + error.message);
    }
  };

  // ========== LOCATION MANAGEMENT HANDLERS ==========
  
  // Handle adding location - όπως στο sxoles.js
  const handleAddLocation = () => {
    if (!newLocation.topothesia.trim()) {
      alert("Παρακαλώ συμπληρώστε την τοποθεσία");
      return;
    }
    
    try {
      const locations = parseLocations();
      const updatedLocations = [
        ...locations,
        { 
          id: locations.length,
          topothesia: newLocation.topothesia,
          start: newLocation.start,
          end: newLocation.end
        }
      ];
      
      handleSaveLocations(updatedLocations);
      setNewLocation({ topothesia: "", start: "", end: "" });
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη τοποθεσίας:", error);
    }
  };
  
  // Handle editing location
  const handleEditLocation = (location) => {
    setCurrentLocation(location);
    setEditLocationDialog(true);
  };
  
  // Handle saving edited location
  const handleEditLocationSave = async (locationData) => {
    try {
      const locations = parseLocations();
      const updatedLocations = locations.map(loc => 
        loc.id === currentLocation.id ? { ...loc, ...locationData } : loc
      );
      
      handleSaveLocations(updatedLocations);
      setEditLocationDialog(false);
      setCurrentLocation(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία τοποθεσίας:", error);
    }
  };
  
  // Handle deleting location
  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε την τοποθεσία;")) {
      return;
    }
    
    try {
      const locations = parseLocations();
      const updatedLocations = locations.filter(loc => loc.id !== locationId);
      handleSaveLocations(updatedLocations);
    } catch (error) {
      console.error("Σφάλμα κατά την διαγραφή τοποθεσίας:", error);
    }
  };
  
  // Function to save all locations to API
  const handleSaveLocations = async (locations) => {
    try {
      const formattedLocations = locations.map(({ id, ...rest }) => rest);
      
      // Δημιουργούμε το αντικείμενο ενημέρωσης διατηρώντας τις υπάρχουσες τιμές
      const updateData = {
        klados: school.klados,
        epipedo: school.epipedo,
        timi: school.timi,
        etos: school.etos,
        seira: school.seira,
        topothesia: JSON.stringify(formattedLocations)
      };
      
      await axios.put(`http://localhost:5000/api/sxoles/${id}`, updateData);
      refreshData();
    } catch (error) {
      console.error("Σφάλμα κατά την αποθήκευση τοποθεσιών:", error);
    }
  };

  // ========== TEACHER MANAGEMENT HANDLERS ==========
  
  // Handle adding teacher
  const handleAddTeacher = async () => {
    setAddTeacherDialog(true);
  };
  
  // Handle saving teacher
  const handleSaveTeacher = async (teacherId) => {
    try {
      await axios.post(`http://localhost:5000/api/sxoles/${id}/ekpaideutis`, {
        id_ekpaideuti: teacherId.id_ekpaideuti
      });
      
      refreshData();
      setAddTeacherDialog(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη εκπαιδευτή:", error);
      alert("Σφάλμα: " + error.message);
    }
  };
  
  // Handle deleting teacher
  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε τον εκπαιδευτή;")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/sxoles/${id}/ekpaideutis/${teacherId}`);
      refreshData();
    } catch (error) {
      console.error("Σφάλμα κατά την αφαίρεση εκπαιδευτή:", error);
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
      accessorKey: "hmerominia_katavolhs",
      header: "Ημερομηνία Καταβολής",
      type: "date",
      defaultValue: new Date().toISOString().split('T')[0]
    }
  ];
  
  // Location form fields
  const locationFormFields = [
    { 
      accessorKey: "topothesia", 
      header: "Τοποθεσία", 
      validation: yup.string().required("Η τοποθεσία είναι υποχρεωτική")
    },
    {
      accessorKey: "start",
      header: "Ημερομηνία Έναρξης",
      type: "date"
    },
    {
      accessorKey: "end",
      header: "Ημερομηνία Λήξης",
      type: "date"
    }
  ];
  
  // Handle adding participant
  const handleAddParticipant = async (newParticipant) => {
    try {
      await axios.post(`http://localhost:5000/api/sxoles/${id}/parakolouthisi`, {
        id_melous: parseInt(newParticipant.id_melous),
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
      id_parakolouthisis: participant.id_parakolouthisis,
      timi: participant.timi,
      katastasi: participant.katastasi || "Ενεργή"
    });
    setEditParticipantDialog(true);
  };
  
  // Handle saving edited participant
  const handleEditParticipant = async (updatedParticipant) => {
    try {
      await axios.put(`http://localhost:5000/api/sxoles/${id}/parakolouthisi/${updatedParticipant.id_parakolouthisis}`, {
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
  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτόν τον συμμετέχοντα;")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/sxoles/${id}/parakolouthisi/${participantId}`);
      refreshData();
    } catch (error) {
      console.error("Σφάλμα κατά την αφαίρεση συμμετέχοντα:", error);
      alert("Σφάλμα: " + error.message);
    }
  };

  // ========== PAYMENT MANAGEMENT HANDLERS ==========
  
  // Handle opening payment dialog
  const handleOpenPaymentDialog = (participant) => {
    // Υπολογισμός υπολοίπου αν δεν υπάρχει ήδη
    const calculatedParticipant = {
      ...participant,
      ypoloipo: participant.ypoloipo !== undefined ? 
        participant.ypoloipo : 
        participant.timi - (participant.katavalei?.reduce((sum, payment) => sum + (payment.poso || 0), 0) || 0)
    };
    
    setPaymentParticipant(calculatedParticipant);
    setPaymentDialog(true);
  };
  
  // Handle adding payment
  const handleAddPayment = async (payment) => {
    try {
      if (!paymentParticipant) return;
      
      await axios.post(
        `http://localhost:5000/api/sxoles/${id}/parakolouthisi/${paymentParticipant.id_parakolouthisis}/payment`, 
        { 
          poso: parseFloat(payment.poso),
          hmerominia_katavolhs: payment.hmerominia_katavolhs || new Date().toISOString()
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
  const handleRemovePayment = async (paymentId, participantId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτή την πληρωμή;")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5000/api/sxoles/${id}/parakolouthisi/${participantId}/payment/${paymentId}`);
      refreshData();
    } catch (error) {
      console.error("Σφάλμα κατά την αφαίρεση πληρωμής:", error);
      alert("Σφάλμα: " + error.message);
    }
  };

  // Column definitions for participants table - διορθωμένο για να μην έχει duplicate keys
  const participantsColumns = [
    { accessorKey: "id_parakolouthisis", header: "ID", enableHiding: true },
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
        // Υπολογισμός υπολοίπου όπως γίνεται στο Rsxoles.js
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

  // Detail panel configuration for participants - αφαιρέθηκαν τα πεδία τιμή και τύπος μέλους
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
        accessor: "hmerominia_dilosis", 
        header: "Ημερομηνία Δήλωσης",
        format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-'
      }
    ],
    tables: [
      {
        title: "Ιστορικό Πληρωμών",
        getData: (row) => row.katavalei || [],
        columns: [
          { 
            accessorKey: "poso", 
            header: "Ποσό",
            Cell: ({ value }) => `${value || 0}€`
          },
          { 
            accessorKey: "hmerominia_katavolhs", 
            header: "Ημερομηνία",
            Cell: ({ value }) => value ? new Date(value).toLocaleDateString("el-GR") : "-"
          }
        ],
        onAddNew: (parentRow) => {
          handleOpenPaymentDialog(parentRow);
        },
        onDelete: (row, parentRow) => {
          handleRemovePayment(row.id, parentRow.id_parakolouthisis);
        },
        // Προσθέτουμε μοναδικό ID για κάθε γραμμή ώστε να αποφύγουμε διπλότυπα keys
        getRowId: (row) => row.id || `payment_${Math.random().toString(36).substr(2, 9)}`
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
  if (!school) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Η σχολή δεν βρέθηκε.</Alert>
      </Box>
    );
  }

  const topothesies = parseLocations();
  const schoolName = `${school.klados || ''} ${school.epipedo || ''} ${school.etos ? `(${school.etos})` : ''}`.trim();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/sxoles')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              {schoolName}
            </Typography>
          </Box>

          {/* Combined School Info, Locations and Teachers in one card */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              {/* School Details - Left Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" color="primary">Στοιχεία Σχολής</Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      startIcon={<EditIcon />}
                      onClick={handleEditSchoolClick}
                      size="small"
                    >
                      Επεξεργασία
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Κλάδος</Typography>
                      <Typography variant="body1">{school.klados || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Επίπεδο</Typography>
                      <Typography variant="body1">{school.epipedo || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Τιμή</Typography>
                      <Typography variant="body1">{school.timi ? `${school.timi}€` : '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Έτος</Typography>
                      <Typography variant="body1">{school.etos || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Σειρά</Typography>
                      <Typography variant="body1">{school.seira || '-'}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* Teachers - Right Column */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" color="primary">Εκπαιδευτές</Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={handleAddTeacher}
                      size="small"
                    >
                      Προσθήκη
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {school.ekpaideutes && school.ekpaideutes.length > 0 ? (
                    <TableContainer sx={{ maxHeight: 240 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Ονοματεπώνυμο</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Τηλέφωνο</TableCell>
                            <TableCell align="right">Ενέργειες</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {school.ekpaideutes.map((teacher) => (
                            <TableRow key={teacher.id_ekpaideuti || teacher.id}>
                              <TableCell>
                                {`${teacher.firstName || teacher.onoma || ""} ${teacher.lastName || teacher.epitheto || ""}`}
                              </TableCell>
                              <TableCell>{teacher.email}</TableCell>
                              <TableCell>{teacher.phone || teacher.tilefono}</TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleDeleteTeacher(teacher.id_ekpaideuti || teacher.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" align="center" sx={{ py: 2 }}>
                      Δεν έχουν ανατεθεί εκπαιδευτές
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              {/* Locations - Bottom */}
              <Grid item xs={12}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary">Τοποθεσίες</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {topothesies && topothesies.length > 0 ? (
                    <TableContainer sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Τοποθεσία</TableCell>
                            <TableCell>Έναρξη</TableCell>
                            <TableCell>Λήξη</TableCell>
                            <TableCell align="right">Ενέργειες</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topothesies.map((loc) => (
                            <TableRow key={loc.id}>
                              <TableCell>{loc.topothesia}</TableCell>
                              <TableCell>{loc.start ? new Date(loc.start).toLocaleDateString('el-GR') : '-'}</TableCell>
                              <TableCell>{loc.end ? new Date(loc.end).toLocaleDateString('el-GR') : '-'}</TableCell>
                              <TableCell align="right">
                                <IconButton size="small" onClick={() => handleEditLocation(loc)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteLocation(loc.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" align="center" sx={{ py: 2, mb: 2 }}>
                      Δεν έχουν καταχωρηθεί τοποθεσίες
                    </Typography>
                  )}
                  
                  {/* Προσθήκη τοποθεσίας (όπως στο sxoles.js) */}
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Τοποθεσία"
                          value={newLocation.topothesia}
                          onChange={(e) => setNewLocation({...newLocation, topothesia: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          type="date"
                          size="small"
                          label="Ημ/νία Έναρξης"
                          InputLabelProps={{ shrink: true }}
                          value={newLocation.start}
                          onChange={(e) => setNewLocation({...newLocation, start: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          type="date"
                          size="small"
                          label="Ημ/νία Λήξης"
                          InputLabelProps={{ shrink: true }}
                          value={newLocation.end}
                          onChange={(e) => setNewLocation({...newLocation, end: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button 
                          fullWidth 
                          variant="contained"
                          color="primary"
                          onClick={handleAddLocation}
                        >
                          Προσθήκη
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
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
              getRowId={(row) => row.id_parakolouthisis}
              initialState={{
                columnVisibility: { id_parakolouthisis: false }
              }}
              enableExpand={true}
              enableRowActions={true}
              handleEditClick={handleEditParticipantClick}
              handleDelete={(participant) => handleRemoveParticipant(participant.id_parakolouthisis)}
              enableAddNew={false}
              tableName="parakolouthiseis"
              density="compact"
            />
          </Paper>
        </Box>
        
        {/* Dialogs */}
        {editedSchool && (
          <EditDialog 
            open={editSchoolDialog}
            onClose={() => setEditSchoolDialog(false)}
            handleEditSave={handleEditSchoolSave}
            editValues={editedSchool}
            title="Επεξεργασία Στοιχείων Σχολής"
            fields={[
              { accessorKey: "klados", header: "Κλάδος", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
              { accessorKey: "epipedo", header: "Επίπεδο", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
              { accessorKey: "timi", header: "Τιμή", type: "number", validation: yup.number().min(0, "Η τιμή δεν μπορεί να είναι αρνητική") },
              { accessorKey: "etos", header: "Έτος", type: "number", validation: yup.number().integer("Πρέπει να είναι ακέραιος").min(1900, "Μη έγκυρο έτος") },
              { accessorKey: "seira", header: "Σειρά", type: "number", validation: yup.number().integer("Πρέπει να είναι ακέραιος").min(1, "Μη έγκυρος αριθμός σειράς") }
            ]}
          />
        )}
        
        {currentLocation && (
          <EditDialog
            open={editLocationDialog}
            onClose={() => {
              setEditLocationDialog(false);
              setCurrentLocation(null);
            }}
            handleEditSave={handleEditLocationSave}
            editValues={{
              topothesia: currentLocation.topothesia,
              start: currentLocation.start || "",
              end: currentLocation.end || ""
            }}
            title="Επεξεργασία Τοποθεσίας"
            fields={locationFormFields}
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
            handleEditSave={handleEditParticipant}
            editValues={currentParticipant}
            title="Επεξεργασία Συμμετέχοντα"
            fields={[
              { accessorKey: "id_parakolouthisis", header: "ID", type: "hidden" },
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
            title={`Καταχώρηση Πληρωμής για ${paymentParticipant?.memberName || ''}`}
            additionalInfo={`Υπόλοιπο: ${paymentParticipant?.ypoloipo || 0}€`}
            fields={paymentFormFields}
          />
        )}
        
        <AddDialog
          open={addTeacherDialog}
          onClose={() => setAddTeacherDialog(false)}
          handleAddSave={handleSaveTeacher}
          title="Προσθήκη Εκπαιδευτή"
          fields={[
            { 
              accessorKey: "id_ekpaideuti", 
              header: "Εκπαιδευτής", 
              type: "select",
              options: availableTeachers
                .filter(teacher => !school.ekpaideutes?.some(t => (t.id_ekpaideuti || t.id) === (teacher.id_ekpaideuti || teacher.id)))
                .map(teacher => ({ 
                  value: teacher.id_ekpaideuti || teacher.id, 
                  label: `${teacher.onoma || ""} ${teacher.epitheto || ""}`.trim()
                })),
              validation: yup.string().required("Παρακαλώ επιλέξτε εκπαιδευτή")
            }
          ]}
        />
      </Container>
    </LocalizationProvider>
  );
}