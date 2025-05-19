import React, { useState, useEffect } from "react";
import api from '../utils/api';
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Container, Divider, Grid,
  IconButton, Button, TableContainer, Table, 
  TableHead, TableRow, TableCell, TableBody, 
  CircularProgress, Alert, Chip, TextField, Breadcrumbs, Link, Dialog, DialogTitle, DialogContent
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
import SelectionDialog from "../components/SelectionDialog";

// Utility function to safely format difficulty level - μετακινήθηκε στην αρχή του component
const formatDifficultyLevel = (data) => {
  // If data is null/undefined
  if (data === null || data === undefined) return "Άγνωστο";

  // If data is a string/number, just return formatted string
  if (typeof data !== 'object') return `Βαθμός ${data}`;

  // If data is an object with epipedo property
  if (data.epipedo) return `Βαθμός ${data.epipedo}`;

  // If data is an object with id_vathmou_diskolias property
  if (data.id_vathmou_diskolias) return `Βαθμός ${data.id_vathmou_diskolias}`;

  // If we couldn't extract meaningful data
  return "Άγνωστο";
};

// Updated formatDateGR function to better handle all date formats
const formatDateGR = (dateInput) => {
  if (!dateInput) return "-";
  try {
    // If it's already a Date object, use it directly
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "-";
    
    // Use Greek locale specifically for formatting
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e, dateInput);
    return "-";
  }
};

// Add this helper function near the top with your other formatting functions
const formatFullName = (epafes) => {
  if (!epafes) return "Άγνωστο όνομα";
  return `${epafes.epitheto || ''} ${epafes.onoma || ''}`.trim() || "Άγνωστο όνομα";
};

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

  // Add these states
  const [memberSelectionDialogOpen, setMemberSelectionDialogOpen] = useState(false);
  const [activitySelectionDialogOpen, setActivitySelectionDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedActivityIds, setSelectedActivityIds] = useState([]);
  const [newParticipantData, setNewParticipantData] = useState({
    timi: eksormisi?.timi || 0,
    katastasi: "Ενεργή"
  });

  // Προσθήκη νέων state variables στην αρχή του component
  const [addActivityParticipantDialog, setAddActivityParticipantDialog] = useState(false);
  const [selectedActivityForParticipant, setSelectedActivityForParticipant] = useState(null);

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
      const eksormisiResponse = await api.get(`/eksormiseis/${id}`);
      setEksormisi(eksormisiResponse.data);
      
      // Fetch drastiriotites
      try {
        const drastiriotitesResponse = await api.get(`/eksormiseis/${id}/drastiriotites`);
        if (Array.isArray(drastiriotitesResponse.data)) {
          // Φόρτωσε συμμετέχοντες για κάθε δραστηριότητα
          const drastiriotitesWithParticipants = await Promise.all(
            drastiriotitesResponse.data.map(async (item) => {
              let vathmos_diskolias = null;
              if (item.vathmos_diskolias) {
                vathmos_diskolias = item.vathmos_diskolias;
              } else if (item.id_vathmou_diskolias) {
                vathmos_diskolias = {
                  id_vathmou_diskolias: item.id_vathmou_diskolias,
                  epipedo: item.id_vathmou_diskolias
                };
              }
              // Φέρε συμμετέχοντες για κάθε δραστηριότητα
              let simmetexontes = [];
              try {
                const resp = await api.get(`/eksormiseis/drastiriotita/${item.id_drastiriotitas || item.id}/simmetexontes`);
                if (Array.isArray(resp.data)) {
                  simmetexontes = resp.data.map(s => ({
                    ...s,
                    memberName: formatFullName(s.melos?.epafes),
                    email: s.melos?.epafes?.email || "-",
                    katastasi: s.katastasi || "Ενεργή",
                    timi: s.timi || 0
                  }));
                }
              } catch (e) {
                simmetexontes = [];
              }
              return {
                id_drastiriotitas: item.id_drastiriotitas || item.id,
                id: item.id_drastiriotitas || item.id,
                titlos: item.titlos || "Χωρίς Τίτλο",
                hmerominia: item.hmerominia || null,
                ores_poreias: item.ores_poreias || null,
                diafora_ipsous: item.diafora_ipsous || null,
                megisto_ipsometro: item.megisto_ipsometro || null,
                id_vathmou_diskolias: item.id_vathmou_diskolias || null,
                vathmos_diskolias: vathmos_diskolias,
                simmetexontes // <-- προσθήκη συμμετεχόντων
              };
            })
          );
          setDrastiriotites(drastiriotitesWithParticipants);
        } else {
          setDrastiriotites([]);
        }
      } catch (err) {
        setDrastiriotites([]);
      }
      
      // Fetch participants
      try {
        const participantsResponse = await api.get(`/eksormiseis/${id}/simmetexontes`);
        
        if (Array.isArray(participantsResponse.data)) {
          const formattedParticipants = participantsResponse.data.map(item => {
            console.log("plironei για συμμετοχή", item.id_simmetoxis, item.plironei);
        
            // Calculate payment info
            // Use the price as it is, even if the member participates in multiple activities
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
              memberName: formatFullName(item.melos?.epafes),
              drastiriotitaTitlos,
              ypoloipo,
              plironei: Array.isArray(item.katavalei) ? item.katavalei.map(p => ({
                id: p.id,
                poso_pliromis: p.poso,
                hmerominia_pliromis: p.hmerominia_katavolhs
              })) : (Array.isArray(item.plironei) ? item.plironei : []) // Ensure plironei is always an array
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
        const difficultyResponse = await api.get("/vathmoi-diskolias");
        setDifficultyLevels(difficultyResponse.data);
      } catch (err) {
        // Silently handle error
      }
      
      // Fetch available members
      try {
        const membersResponse = await api.get("/melitousillogou");
        
        // Create a Set of the IDs of members who are already participants
        const existingMemberIds = new Set(
          participants.map(p => parseInt(p.id_melous))
        );
        
        const filteredMembers = membersResponse.data
          .filter(member => {
            const memberId = parseInt(member.id_es_melous || member.id);
            // Only include members that aren't already participants
            return !existingMemberIds.has(memberId);
          })
          .map(member => ({
            ...member,
            id: member.id_es_melous || member.id,
            fullName: `${member.melos?.epafes?.epitheto || ''} ${member.melos?.epafes?.onoma || ''}`.trim(),
            // Make sure we include the subscription status
            status: member.sindromitis?.katastasi_sindromis || (member.athlitis ? "Αθλητής" : "-")
          }));
        
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
      
      await api.put(`/eksormiseis/${id}`, formattedData);
      
      // Update local state directly instead of refreshing
      setEksormisi(prevEksormisi => ({
        ...prevEksormisi,
        titlos: updatedEksormisi.titlos,
        proorismos: updatedEksormisi.proorismos,
        timi: parseInt(updatedEksormisi.timi),
        hmerominia_anaxorisis: updatedEksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: updatedEksormisi.hmerominia_afiksis
      }));
      
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
    required: true,
    validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") 
  },
  { 
    accessorKey: "hmerominia", 
    header: "Ημερομηνία", 
    type: "date",
    required: true,
    defaultValue: new Date().toISOString().split('T')[0],
    validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") 
  },
  { 
    accessorKey: "ores_poreias", 
    header: "Ώρες Πορείας", 
    type: "number",
    required: true,
    defaultValue: 0,
    validation: yup.number().required("Το πεδίο είναι υποχρεωτικό")
  },
  { 
    accessorKey: "diafora_ipsous", 
    header: "Διαφορά Ύψους (μ)", 
    type: "number",
    required: true, 
    defaultValue: 0,
    validation: yup.number().required("Το πεδίο είναι υποχρεωτικό")
  },
  { 
    accessorKey: "megisto_ipsometro", 
    header: "Μέγιστο Υψόμετρο (μ)", 
    type: "number",
    required: true,
    defaultValue: 0,
    validation: yup.number().required("Το πεδίο είναι υποχρεωτικό")
  },
  { 
    accessorKey: "id_vathmou_diskolias", 
    header: "Βαθμός Δυσκολίας", 
    type: "select",
    required: true,
    options: difficultyLevels.map(level => ({ 
      value: level.id_vathmou_diskolias, 
      label: `Βαθμός ${level.epipedo}` 
    })),
    defaultValue: difficultyLevels.length > 0 ? difficultyLevels[0].id_vathmou_diskolias : "",
    validation: yup.number().required("Το πεδίο είναι υποχρεωτικό")
  }
];
  
  // Handle adding drastiriotita
const handleAddDrastiriotita = async (newDrastiriotita) => {
  try {
    // Ensure hmerominia is a valid date string before sending to API
    let hmeroDate = null;
    try {
      if (newDrastiriotita.hmerominia) {
        hmeroDate = new Date(newDrastiriotita.hmerominia);
        // Check if valid date
        if (isNaN(hmeroDate.getTime())) {
          throw new Error("Invalid date");
        }
      }
    } catch (err) {
      alert("Η ημερομηνία δεν είναι έγκυρη. Παρακαλώ εισάγετε μια έγκυρη ημερομηνία.");
      return;
    }
    
    const formattedData = {
      titlos: newDrastiriotita.titlos,
      hmerominia: hmeroDate ? hmeroDate.toISOString() : null, // Ensure ISO format for backend
      ores_poreias: newDrastiriotita.ores_poreias ? parseInt(newDrastiriotita.ores_poreias) : null,
      diafora_ipsous: newDrastiriotita.diafora_ipsous ? parseInt(newDrastiriotita.diafora_ipsous) : null,
      megisto_ipsometro: newDrastiriotita.megisto_ipsometro ? parseInt(newDrastiriotita.megisto_ipsometro) : null,
      id_vathmou_diskolias: parseInt(newDrastiriotita.id_vathmou_diskolias)
    };
    
    const response = await api.post(`/eksormiseis/${id}/drastiriotita`, formattedData);
    
    // Find the difficulty level object
    const vathmos_diskolias = difficultyLevels.find(
      level => level.id_vathmou_diskolias === parseInt(newDrastiriotita.id_vathmou_diskolias)
    );
    
    // Update local state by adding the new drastiriotita
    const newDrastiriotitaObject = {
      id_drastiriotitas: response.data.id_drastiriotitas || response.data.id,
      id: response.data.id_drastiriotitas || response.data.id,
      titlos: newDrastiriotita.titlos,
      hmerominia: hmeroDate,
      ores_poreias: newDrastiriotita.ores_poreias ? parseInt(newDrastiriotita.ores_poreias) : null,
      diafora_ipsous: newDrastiriotita.diafora_ipsous ? parseInt(newDrastiriotita.diafora_ipsous) : null,
      megisto_ipsometro: newDrastiriotita.megisto_ipsometro ? parseInt(newDrastiriotita.megisto_ipsometro) : null,
      id_vathmou_diskolias: parseInt(newDrastiriotita.id_vathmou_diskolias),
      vathmos_diskolias: vathmos_diskolias,
      simmetexontes: [] // Start with empty participants array
    };
    
    setDrastiriotites(prev => [...prev, newDrastiriotitaObject]);
    setAddDrastiriotitaDialog(false);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη δραστηριότητας:", error);
    alert("Σφάλμα: " + error.message);
  }
};
  
  // Handle editing drastiriotita
  const handleEditDrastiriotitaClick = (drastiriotita) => {
    setCurrentDrastiriotita({
      id: drastiriotita.id_drastiriτοitas || drastiriotita.id,
      titlos: drastiriotita.titlos,
      hmerominia: drastiriotita.hmerominia ? new Date(drastiriotita.hmerominia).toISOString().split('T')[0] : "",
      ores_poreias: drastiriotita.ores_poreias,
      diafora_ipsous: drastiriotita.diafora_ipsous,
      megisto_ipsometro: drastiriotita.megisto_ipsometro,
      id_vathmou_diskolias: drastiriotita.id_vathmou_diskolias
    });
    setEditDrastiriotitaDialog(true);
  };
  
  // Handle saving edited drastiriotita with proper date validation
const handleEditDrastiriotitaSave = async (updatedDrastiriotita) => {
  try {
    // Ensure hmerominia is a valid date string
    let hmeroDate = null;
    try {
      if (updatedDrastiriotita.hmerominia) {
        hmeroDate = new Date(updatedDrastiriotita.hmerominia);
        // Check if valid date
        if (isNaN(hmeroDate.getTime())) {
          throw new Error("Invalid date");
        }
      }
    } catch (err) {
      alert("Η ημερομηνία δεν είναι έγκυρη. Παρακαλώ εισάγετε μια έγκυρη ημερομηνία.");
      return;
    }
    
    const formattedData = {
      titlos: updatedDrastiriotita.titlos,
      hmerominia: hmeroDate ? hmeroDate.toISOString() : null, // Ensure ISO format for backend
      ores_poreias: updatedDrastiriotita.ores_poreias ? parseInt(updatedDrastiriotita.ores_poreias) : null,
      diafora_ipsous: updatedDrastiriotita.diafora_ipsous ? parseInt(updatedDrastiriotita.diafora_ipsous) : null,
      megisto_ipsometro: updatedDrastiriotita.megisto_ipsometro ? parseInt(updatedDrastiriotita.megisto_ipsometro) : null,
      id_vathmou_diskolias: parseInt(updatedDrastiriotita.id_vathmou_diskolias)
    };
    
    await api.put(`/eksormiseis/drastiriotita/${updatedDrastiriotita.id}`, formattedData);
    
    // Find the difficulty level object
    const vathmos_diskolias = difficultyLevels.find(
      level => level.id_vathmou_diskolias === parseInt(updatedDrastiriotita.id_vathmou_diskolias)
    );
    
    // Update local state
    setDrastiriotites(prevDrastiriotites => 
      prevDrastiriotites.map(item => {
        if (item.id_drastiriτοitas === updatedDrastiriotita.id || item.id === updatedDrastiriotita.id) {
          return {
            ...item,
            titlos: updatedDrastiriotita.titlos,
            hmerominia: hmeroDate,
            ores_poreias: updatedDrastiriotita.ores_poreias ? parseInt(updatedDrastiriotita.ores_poreias) : null,
            diafora_ipsous: updatedDrastiriotita.diafora_ipsous ? parseInt(updatedDrastiriotita.diafora_ipsous) : null,
            megisto_ipsometro: updatedDrastiriotita.megisto_ipsometro ? parseInt(updatedDrastiriotita.megisto_ipsometro) : null,
            id_vathmou_diskolias: parseInt(updatedDrastiriotita.id_vathmou_diskolias),
            vathmos_diskolias: vathmos_diskolias
          };
        }
        return item;
      })
    );
    
    setEditDrastiriotitaDialog(false);
    setCurrentDrastiriotita(null);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία δραστηριότητας:", error);
    alert("Σφάλμα: " + error.message);
  }
};
  
  // Simplified activity deletion handler - updated to properly sync with participants
const handleDeleteDrastiriotita = async (drastiriotita) => {
  let drastiriotitaId;
  
  // Extract the ID from the provided parameter
  if (typeof drastiriotita === 'number' || typeof drastiriotita === 'string') {
    drastiriotitaId = drastiriotita;
  } else if (drastiriotita && typeof drastiriotita === 'object') {
    drastiriotitaId = drastiriotita.id_drastiriτοitas || drastiriotita.id;
  } else {
    alert("Σφάλμα: Δεν προσδιορίστηκε η δραστηριότητα προς διαγραφή");
    return;
  }
  
  if (!drastiriotitaId) {
    alert("Σφάλμα: Δεν βρέθηκε αναγνωριστικό για τη δραστηριότητα");
    return;
  }
  
  try {
    await api.delete(`/eksormiseis/drastiriotita/${drastiriotitaId}`);
    
    // Get participants from this activity to possibly add them back to available members
    const activityParticipants = participants.filter(p => 
      p.id_drastiriotitas == drastiriotitaId
    );
    
    // Update local state by removing the deleted drastiriotita
    setDrastiriotites(prevDrastiriotites => 
      prevDrastiriotites.filter(item => 
        item.id_drastiriτοitas !== drastiriotitaId && item.id !== drastiriotitaId
      )
    );
    
    // Update the participant lists
    updateParticipantActivityLists(drastiriotitaId);
    
    // Rest of your function...
    
    // Remove participants who no longer have any activities
    setParticipants(prev => 
      prev.filter(p => {
        // If this participant was directly linked to the deleted activity,
        // check if they're part of any other activities
        if (p.id_drastiriotitas == drastiriotitaId) {
          return p.simmetoxes && p.simmetoxes.some(s => 
            s.drastiriotita?.id_drastiriτοitas != drastiriotitaId &&
            s.drastiriotita?.id != drastiriotitaId
          );
        }
        return true;
      })
    );
    
  } catch (error) {
    alert("Σφάλμα: " + error.message);
  }
};
  
  // Fields for participant forms
const participantFormFields = [
  { 
    accessorKey: "id_melous", 
    header: "Μέλος",
    required: true,
    type: "tableSelect",               
    dataKey: "membersList",           
    singleSelect: true,                
    pageSize: 5,                       
    columns: [                         
      { field: "fullName", header: "Ονοματεπώνυμο" },
      { field: "status", header: "Κατάσταση Συνδρομής" }
    ],
    searchFields: ["fullName"], 
    noDataMessage: "Δεν βρέθηκαν μέλη",
    validation: yup.mixed().required("Παρακαλώ επιλέξετε μέλος")
  },
  { 
    accessorKey: "id_drastiriotitas", 
    header: "Δραστηριότητες", 
    required: true,
    type: "tableSelect",
    dataKey: "drastiriotitesList",
    multiSelect: true,
    pageSize: 5,
    columns: [
      { field: "titlos", header: "Τίτλος" },
      { field: "hmerominia", header: "Ημερομηνία" },
      { 
        field: "vathmos_diskolias", 
        header: "Βαθμός Δυσκολίας",
        Cell: ({ row }) => {
          // Ασφαλής απόδοση του βαθμού δυσκολίας ως κείμενο
          const value = row.original.vathmos_diskolias;
          if (!value) return "-";
          // Αν είναι ήδη string, το επιστρέφουμε ως έχει
          if (typeof value === "string") return value;
          // Αν είναι αντικείμενο, προσπαθούμε να εξάγουμε χρήσιμες πληροφορίες
          if (typeof value === "object") {
            if (value.epipedo) return `Βαθμός ${value.epipedo}`;
            if (value.id_vathmou_diskolias) return `Βαθμός ${value.id_vathmou_diskolias}`;
          }
          // Fallback
          return String(value);
        }
      }
    ],
    validation: yup.array().min(1, "Επιλέξτε τουλάχιστον μία δραστηριότητα").required("Το πεδίο είναι υποχρεωτικό")
  },
  { 
    accessorKey: "timi", 
    header: "Τιμή", 
    required: true,
    type: "number",
    defaultValue: eksormisi?.timi || 0,
    validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός").required("Η τιμή είναι υποχρεωτική")
  },
  { 
    accessorKey: "katastasi", 
    header: "Κατάσταση", 
    required: true,
    type: "select",
    options: [
      { value: "Ενεργή", label: "Ενεργή" },
      { value: "Εκκρεμής", label: "Εκκρεμής" },
      { value: "Ολοκληρωμένη", label: "Ολοκληρωμένη" },
      { value: "Ακυρωμένη", label: "Ακυρωμένη" }
    ],
    defaultValue: "Ενεργή",
    validation: yup.string().required("Το πεδίο είναι υποχρεωτικό")
  }
];

  // Fields for payment form
  const paymentFormFields = [
    { 
      accessorKey: "poso_pliromis", 
      header: "Ποσό Πληρωμής", 
      required: true,
      type: "number",
      validation: yup.number()
        .min(0.01, "Το ποσό πρέπει να είναι μεγαλύτερο από 0")
        .required("Το ποσό είναι υποχρεωτικό")
    },
    {
      accessorKey: "hmerominia_pliromis",
      header: "Ημερομηνία Πληρωμής",
      required: true,
      type: "date",
      defaultValue: new Date().toISOString().split('T')[0]
    }
  ];
  
  // Handle adding participant - now with multiple activities
const handleAddParticipant = async (formData) => {
  try {
    // Check if user has selected a member
    if (!formData.id_melous) {
      alert("Πρέπει να επιλέξετε μέλος");
      return;
    }

    // Convert the id_drastiriotitas from tableSelect to an array if it's not already
    const activityIds = Array.isArray(formData.id_drastiriotitas) 
      ? formData.id_drastiriotitas 
      : [formData.id_drastiriotitas];

    // Check if user has selected at least one activity
    if (activityIds.length === 0) {
      alert("Πρέπει να επιλέξετε τουλάχιστον μία δραστηριότητα");
      return;
    }

    const successResults = [];
    const fixedPrice = parseFloat(formData.timi); // Get the price once for all activities
    const newParticipants = [];
    
    // Find the selected member's details - ensure we get the complete object
    const memberId = typeof formData.id_melous === 'object' ? formData.id_melous.id : parseInt(formData.id_melous);
    const selectedMember = availableMembers.find(m => (m.id_es_melous || m.id) === memberId);
    
    if (!selectedMember) {
      alert("Σφάλμα: Δεν βρέθηκαν στοιχεία για το επιλεγμένο μέλος");
      return;
    }
    
    // Prepare member data that will be used for all activities
    const memberName = `${selectedMember?.melos?.epafes?.epitheto || ''} ${selectedMember?.melos?.epafes?.onoma || ''}`.trim();
    const memberEmail = selectedMember?.melos?.epafes?.email || '-';
    const memberPhone = selectedMember?.melos?.epafes?.tilefono || '-';
    
    // Get detailed activity data for each selected activity
    const activitiesData = activityIds.map(actId => 
      drastiriotites.find(d => (d.id_drastiriτοitas == actId || d.id == actId))
    ).filter(Boolean);
    
    for (const activityId of activityIds) {
      const formattedData = {
        id_melous: memberId,
        id_drastiriotitas: parseInt(activityId),
        timi: fixedPrice,
        katastasi: formData.katastasi || "Ενεργή"
      };
      
      try {
        const response = await api.post(`/eksormiseis/${id}/simmetoxi`, formattedData);
        successResults.push(response.data);
        
        // Find the activity details
        const activityDetails = drastiriotites.find(d => 
          (d.id_drastiriτοitas == activityId || d.id == activityId)
        );
        
        // Add to our local new participants array with complete data
        const newParticipant = {
          id: response.data.id_simmetoxis,
          id_simmetoxis: response.data.id_simmetoxis,
          id_drastiriotitas: parseInt(activityId),
          id_melous: memberId,
          memberName: memberName,
          email: memberEmail,
          tilefono: memberPhone,
          timi: fixedPrice,
          katastasi: formData.katastasi || "Ενεργή",
          ypoloipo: fixedPrice,
          plironei: [],
          // Add activity data for the detail panel
          simmetoxes: [
            {
              drastiriotita: activityDetails || {
                titlos: `Δραστηριότητα #${activityId}`,
                id_drastiriotitas: activityId
              }
            }
          ],
          // Include full melos data
          melos: selectedMember.melos || {
            epafes: {
              onoma: selectedMember?.melos?.epafes?.onoma || '',
              epitheto: selectedMember?.melos?.epafes?.epitheto || '',
              email: memberEmail,
              tilefono: memberPhone
            }
          }
        };
        
        newParticipants.push(newParticipant);
        
        // Update the drastiriotites array to include this participant
        if (activityDetails) {
          const participantData = {
            id_simmetoxis: response.data.id_simmetoxis,
            id_melous: memberId,
            memberName: memberName,
            email: memberEmail,
            tilefono: memberPhone, // Make sure this is set directly
            timi: fixedPrice,
            katastasi: formData.katastasi || "Ενεργή"
          };

          // Then add a console log to debug
          console.log("Adding participant to activity with phone:", memberPhone, participantData);
          
          setDrastiriotites(prev => 
            prev.map(d => {
              if (d.id_drastiriτοτας == activityId || d.id == activityId) {
                return {
                  ...d,
                  simmetexontes: [...(d.simmetexontes || []), participantData]
                };
              }
              return d;
            })
          );
        }
      } catch (err) {
        console.error(`Error adding participation for activity ${activityId}:`, err);
      }
    }
    
    if (successResults.length > 0) {
      // Update the participants state with new participants
      setParticipants(prev => [...prev, ...newParticipants]);
      
      // Remove the member from available members
      setAvailableMembers(prev => 
        prev.filter(m => (m.id_es_melous || m.id) !== memberId)
      );
      
      setAddParticipantDialog(false);
    } else {
      alert("Δεν ήταν δυνατή η προσθήκη συμμετοχών.");
    }
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη συμμετέχοντα:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Updated handleEditParticipantClick function
const handleEditParticipantClick = (participant) => {
  // Find all activities this participant is enrolled in
  const participantId = participant.id_melous;
  const participantActivities = [];
  
  // If this participant has a simmetoxes array, extract activity IDs from it
  if (participant.simmetoxes && Array.isArray(participant.simmetoxes)) {
    participant.simmetoxes.forEach(simmetoxi => {
      if (simmetoxi.drastiriotita) {
        const activityId = simmetoxi.drastiriotita.id_drastiriτοitas || simmetoxi.drastiriotita.id;
        if (activityId) {
          participantActivities.push(activityId);
        }
      }
    });
  }
  
  // Also include the current activity if available
  if (participant.id_drastiriotitas) {
    participantActivities.push(participant.id_drastiriotitas);
  }
  
  // Set current participant with activities included
  setCurrentParticipant({
    id_simmetoxis: participant.id_simmetoxis || participant.id,
    id_melous: participantId,
    timi: participant.timi,
    katastasi: participant.katastasi || "Ενεργή",
    activities: [...new Set(participantActivities)] // Use Set to remove duplicates
  });
  
  setEditParticipantDialog(true);
};
  
  // Modified participant editing approach to fix API errors
const handleEditParticipantSave = async (updatedParticipant) => {
  try {
    // Basic participant data update
    const formattedData = {
      timi: parseFloat(updatedParticipant.timi),
      katastasi: updatedParticipant.katastasi
    };
    
    // Find the original participant with all their details
    const originalParticipant = participants.find(p => 
      p.id_simmetoxis === updatedParticipant.id_simmetoxis || 
      p.id === updatedParticipant.id_simmetoxis
    );
    
    if (!originalParticipant) {
      alert("Σφάλμα: Δεν βρέθηκαν τα αρχικά στοιχεία του συμμετέχοντα.");
      return;
    }
    
    // IMPORTANT: Save the payment history and member details
    const existingPayments = originalParticipant.plironei || [];
    const memberName = originalParticipant.memberName;
    const memberEmail = originalParticipant.email || originalParticipant.melos?.epafes?.email || "-";
    const memberPhone = originalParticipant.tilefono || originalParticipant.melos?.epafes?.tilefono || "-";
    
    // Update basic participant information
    await api.put(`/eksormiseis/simmetoxi/${updatedParticipant.id_simmetoxis}`, formattedData);
    
    // Gather current activity IDs and selected activity IDs
    const currentActivityIds = [];
    
    // From simmetoxes array
    if (originalParticipant.simmetoxes && Array.isArray(originalParticipant.simmetoxes)) {
      originalParticipant.simmetoxes.forEach(s => {
        if (s.drastiriotita) {
          const actId = s.drastiriotita.id_drastiriτοitas || s.drastiriotita.id;
          if (actId) currentActivityIds.push(String(actId));
        }
      });
    }
    
    // From direct participation
    if (originalParticipant.id_drastiriotitas) {
      currentActivityIds.push(String(originalParticipant.id_drastiriotitas));
    }
    
    // Get selected activities from form
    const selectedActivityIds = Array.isArray(updatedParticipant.activities) ? 
      updatedParticipant.activities.map(id => String(id)) : [];
    
    console.log("Current activities:", currentActivityIds);
    console.log("Selected activities:", selectedActivityIds);
    
    // Find activities to add and remove
    const activitiesToAdd = selectedActivityIds.filter(id => !currentActivityIds.includes(id));
    const activitiesToRemove = currentActivityIds.filter(id => !selectedActivityIds.includes(id));
    
    console.log("Activities to add:", activitiesToAdd);
    console.log("Activities to remove:", activitiesToRemove);
    
    // Track added participations
    const addedParticipations = [];
    
    // MODIFIED APPROACH: Instead of querying the API for participations,
    // use the locally stored simmetoxes array to find participation IDs
    for (const activityId of activitiesToRemove) {
      try {
        // Find the participation ID from local data
        const simmetoxiToRemove = originalParticipant.simmetoxes?.find(s => 
          s.drastiriotita && 
          (String(s.drastiriotita.id_drastiriτοitas) === String(activityId) || 
           String(s.drastiriotita.id) === String(activityId))
        );
        
        if (simmetoxiToRemove && simmetoxiToRemove.id_simmetoxis) {
          // Delete the participation
          await api.delete(`/eksormiseis/simmetoxi/${simmetoxiToRemove.id_simmetoxis}`);
          
          // Update local state
          setDrastiriotites(prev => prev.map(d => {
            if (String(d.id_drastiriτοτας) === String(activityId) || String(d.id) === String(activityId)) {
              return {
                ...d,
                simmetexontes: (d.simmetexontes || []).filter(s => 
                  s.id_melous !== updatedParticipant.id_melous
                )
              };
            }
            return d;
          }));
        } else {
          console.log(`Could not find participation ID for activity ${activityId}`);
        }
      } catch (err) {
        console.error(`Error removing participation for activity ${activityId}:`, err);
      }
    }
    
    // Add new participations
    for (const activityId of activitiesToAdd) {
      try {
        const formattedAddData = {
          id_melous: updatedParticipant.id_melous,
          id_drastiriotitas: parseInt(activityId),
          timi: parseFloat(updatedParticipant.timi),
          katastasi: updatedParticipant.katastasi
        };
        
        // FIX: Add the expedition ID to the URL
        const response = await api.post(`/eksormiseis/${id}/simmetoxi`, formattedAddData);
        
        // Find activity details
        const activityDetails = drastiriotites.find(d => 
          String(d.id_drastiriτοτας) === String(activityId) || String(d.id) === String(activityId)
        );
        
        if (activityDetails && response.data) {
          // Add to tracking array
          addedParticipations.push({
            id_simmetoxis: response.data.id_simmetoxis,
            drastiriotita: activityDetails
          });
          
          // Update activity's participants list
          setDrastiriotites(prev => prev.map(d => {
            if (String(d.id_drastiriτοτας) === String(activityId) || String(d.id) === String(activityId)) {
              return {
                ...d,
                simmetexontes: [
                  ...(d.simmetexontes || []),
                  {
                    id_simmetoxis: response.data.id_simmetoxis,
                    id_melous: updatedParticipant.id_melous,
                    memberName: memberName,
                    email: memberEmail,
                    tilefono: memberPhone,
                    timi: parseFloat(updatedParticipant.timi),
                    katastasi: updatedParticipant.katastasi
                  }
                ]
              };
            }
            return d;
          }));
        }
      } catch (err) {
        console.error(`Error adding participant to activity ${activityId}:`, err);
      }
    }
    
    // Update participant's simmetoxes array
    setParticipants(prevParticipants => {
      return prevParticipants.map(p => {
        if (p.id_simmetoxis === updatedParticipant.id_simmetoxis || p.id === updatedParticipant.id_simmetoxis) {
          // Filter out removed activities
          let updatedSimmetoxes = p.simmetoxes
            ? p.simmetoxes.filter(s => {
                if (!s.drastiriotita) return false;
                const actId = s.drastiriotita.id_drastiriτοitas || s.drastiriotita.id;
                return !activitiesToRemove.includes(String(actId));
              })
            : [];
          
          // Add new activities
          updatedSimmetoxes = [...updatedSimmetoxes, ...addedParticipations];
          
          return {
            ...p,
            timi: parseFloat(updatedParticipant.timi),
            katastasi: updatedParticipant.katastasi,
            simmetoxes: updatedSimmetoxes,
            plironei: existingPayments // Preserve payments
          };
        }
        return p;
      });
    });
    
    setEditParticipantDialog(false);
    setCurrentParticipant(null);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία συμμετέχοντα:", error);
    alert("Σφάλμα: " + error.message);
  }
};
  
   // Enhanced participant removal handler for better state synchronization
const handleRemoveParticipant = async (participant) => {
  // Check for valid participant
  if (!participant) {
    alert("Σφάλμα: Δεν βρέθηκε συμμετέχων για διαγραφή");
    return;
  }
  
  // Extract IDs
  let participantId;
  let fullParticipantData;
  let activityId;
  
  if (typeof participant === 'object') {
    participantId = participant.id_simmetoxis || participant.id;
    fullParticipantData = participant;
    activityId = participant.id_drastiriotitas;
    
    if (participant.original) {
      participantId = participantId || participant.original.id_simmetoxis || participant.original.id;
      fullParticipantData = participant.original;
      activityId = activityId || participant.original.id_drastiriotitas;
    }
  } else {
    participantId = participant;
    fullParticipantData = participants.find(p => p.id_simmetoxis == participantId || p.id == participantId);
    if (fullParticipantData) {
      activityId = fullParticipantData.id_drastiriotitas;
    }
  }
  
  if (participantId === undefined || participantId === null) {
    alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID συμμετοχής");
    return;
  }

  if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτόν τον συμμετέχοντα;")) {
    return;
  }
  
  try {
    await api.delete(`/eksormiseis/simmetoxi/${participantId}`);
    
    // First, get the member ID for later use
    const memberId = fullParticipantData?.id_melous;
    
    // Remove from participants array
    setParticipants(prev => 
      prev.filter(p => p.id_simmetoxis != participantId && p.id != participantId)
    );
    
    // Update the activity's participants list in drastiriotites array
    // This ensures the participants are removed from the activity details panel immediately
    setDrastiriotites(prev => 
      prev.map(d => {
        // Check all activities, not just the one directly linked
        return {
          ...d,
          simmetexontes: (d.simmetexontes || []).filter(s => 
            s.id_simmetoxis != participantId && s.id != participantId
          )
        };
      })
    );
    
    // Add the member back to available members if needed
    if (memberId) {
      // Check if this member has any remaining participations
      const memberHasOtherParticipations = participants.some(p => 
        (p.id_simmetoxis != participantId && p.id != participantId) && 
        p.id_melous == memberId
      );
      
      // If this was their only participation, add them back to available members
      if (!memberHasOtherParticipations) {
        try {
          const response = await api.get(`/melitousillogou/${memberId}`);
          if (response.data) {
            const memberData = {
              ...response.data,
              id: response.data.id_es_melous || response.data.id,
              fullName: `${response.data.melos?.epafes?.epitheto || ''} ${response.data.melos?.epafes?.onoma || ''}`.trim(),
              status: response.data.athlitis ? "Αθλητής" : response.data.sindromitis?.katastasi_sindromis || '-'
            };
            
            setAvailableMembers(prev => [...prev, memberData]);
          }
        } catch (err) {
          console.error("Error fetching removed member data:", err);
        }
      }
    }
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση συμμετέχοντα:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // ========== PAYMENT MANAGEMENT HANDLERS ==========
  
  // Handle opening payment dialog
// Στο handleOpenPaymentDialog, πρόσθεσε περισσότερα διαγνωστικά
const handleOpenPaymentDialog = (participant) => {
  console.log("handleOpenPaymentDialog called with participant:", participant);
  
  // Βεβαιώσου ότι έχεις πρόσβαση σε όλα τα δεδομένα
  let simmetoxiId = null;
  
  // Έλεγχος για API response structure
  if (participant.id_simmetoxis) {
    simmetoxiId = participant.id_simmetoxis;
  } 
  // Έλεγχος για MUI DataGrid row model
  else if (participant.id) {
    simmetoxiId = participant.id;
  }
  // Έλεγχος για συμμετοχές στο detail panel
  else if (participant.simmetoxes && participant.simmetoxes.length > 0) {
    simmetoxiId = participant.simmetoxes[0].id_simmetoxis;
  }
  // Έλεγχος για το row.original του dataTable
  else if (participant.original) {
    simmetoxiId = participant.original.id_simmetoxis || participant.original.id;
  }
  
  console.log("Εξαγόμενο simmetoxiId:", simmetoxiId);
  
  if (!simmetoxiId) {
    console.error("ΠΡΟΣΟΧΗ: Δεν βρέθηκε έγκυρο ID συμμετοχής", participant);
    alert("Σφάλμα: Δεν βρέθηκε ID συμμετοχής.");
    return;
  }

  setPaymentParticipant({
    ...participant,
    id_simmetoxi: simmetoxiId,
    memberName: participant.memberName || 
      `${participant.melos?.epafes?.epitheto || ''} ${participant.melos?.epafes?.onoma || ''}`.trim() || 
      "Άγνωστο όνομα"
  });
  setPaymentDialog(true);
};

  // Βελτιωμένη συνάρτηση handleAddPayment με local state update
const handleAddPayment = async (payment) => {
  try {
    if (!paymentParticipant) {
      console.error("paymentParticipant είναι null ή undefined");
      return;
    }
    
    // Βελτιωμένη λογική για εύρεση του ID συμμετοχής
    const simmetoxiId = paymentParticipant.id_simmetoxis || 
                       paymentParticipant.id ||
                       (paymentParticipant.simmetoxes && paymentParticipant.simmetoxes.length > 0 ? 
                        paymentParticipant.simmetoxes[0].id_simmetoxis : null);
    
    // Έλεγχος αν βρέθηκε έγκυρο ID
    if (!simmetoxiId) {
      alert("Σφάλμα: Δεν βρέθηκε ID συμμετοχής για καταχώρηση πληρωμής.");
      return;
    }
    
    const formattedData = {
      poso: parseFloat(payment.poso_pliromis),
      hmerominia_pliromis: payment.hmerominia_pliromis || new Date().toISOString()
    };
    
    const response = await api.post(
      `/eksormiseis/simmetoxi/${simmetoxiId}/payment`, 
      formattedData
    );
    
    // Create new payment object for local state update
    const newPayment = {
      id: response.data.id,
      id_plironei: response.data.id,
      poso_pliromis: parseFloat(payment.poso_pliromis),
      hmerominia_pliromis: payment.hmerominia_pliromis || new Date().toISOString()
    };
    
    // Update participants state
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_simmetoxis == simmetoxiId || p.id == simmetoxiId) {
          // Add the new payment to the payments array
          const updatedPayments = [...(p.plironei || []), newPayment];
          
          // Calculate new balance
          const totalPaid = updatedPayments.reduce(
            (sum, pay) => sum + (pay.poso_pliromis || 0), 0
          );
          const ypoloipo = p.timi - totalPaid;
          
          return {
            ...p,
            plironei: updatedPayments,
            ypoloipo: ypoloipo
          };
        }
        return p;
      })
    );
    
    setPaymentDialog(false);
    setPaymentParticipant(null);
  } catch (error) {
    console.error("Σφάλμα κατά την καταχώρηση πληρωμής:", error);
    alert("Σφάλμα: " + error.message);
  }
};
  
  // Handle removing payment
const handleRemovePayment = async (paymentId, simmetoxiId) => {
  if (!paymentId || !simmetoxiId) {
    console.error("Μη έγκυρες παράμετροι για διαγραφή πληρωμής:", { paymentId, simmetoxiId });
    alert("Σφάλμα: Ελλιπή στοιχεία πληρωμής προς διαγραφή");
    return;
  }

  console.log("Διαγραφή πληρωμής με paymentId:", paymentId, "και simmetoxiId:", simmetoxiId);
  
  if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτή την πληρωμή;")) {
    return;
  }
  
  try {
    await api.delete(`/eksormiseis/simmetoxi/${simmetoxiId}/payment/${paymentId}`);
    
    // Update participants state by removing the payment
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_simmetoxis == simmetoxiId || p.id == simmetoxiId) {
          // Remove the payment from the payments array
          const updatedPayments = (p.plironei || []).filter(
            payment => payment.id != paymentId && payment.id_plironei != paymentId
          );
          
          // Recalculate balance
          const totalPaid = updatedPayments.reduce(
            (sum, pay) => sum + (pay.poso_pliromis || 0), 0
          );
          const ypoloipo = p.timi - totalPaid;
          
          return {
            ...p,
            plironei: updatedPayments,
            ypoloipo: ypoloipo
          };
        }
        return p;
      })
    );
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση πληρωμής:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Διορθωμένες στήλες για τον πίνακα δραστηριοτήτων
const drastiriotitesColumns = [
  { accessorKey: "id_drastiriτοitas", header: "ID", enableHiding: true },
  { 
    accessorKey: "titlos", 
    header: "Τίτλος",
    Cell: ({ row }) => {
      const id = row.original.id_drastiriτοitas || row.original.id;
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
      return formatDateGR(date);
    }
  },
  { accessorKey: "ores_poreias", header: "Ώρες Πορείας" },
  {
    accessorKey: "vathmos_diskolias", 
    header: "Βαθμός Δυσκολίας",
    Cell: ({ row }) => {
      const vathmos = row.original.vathmos_diskolias;
      const formattedLevel = formatDifficultyLevel(vathmos);
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HikingIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
          {formattedLevel}
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
                        `${row.original.melos?.epafes?.epitheto || ''} ${row.original.melos?.epafes?.onoma || ''}`.trim() ||
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
    accessorKey: "ypoloipo", 
    header: "Υπόλοιπο",
    Cell: ({ row }) => {
      // For each member, use the first activity's price as the total price
      // This ensures we're not summing up prices across activities
      const timi = row.original.timi || 0;
      const totalPaid = (row.original.plironei || []).reduce(
        (sum, payment) => sum + (payment.poso_pliromis || 0), 0
      );
      const ypoloipo = timi - totalPaid;

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
    { accessor: "timi", header: "Τιμή", format: (value) => `${value || 0}€` },
    { accessor: "katastasi", header: "Κατάσταση" },
    { accessor: "ypoloipo", header: "Υπόλοιπο", format: (value) => `${value || 0}€` }
  ],
  tables: [
    {
      title: "Δραστηριότητες",
      getData: (row) => {
        try {
          // Always ensure we return a valid array
          if (!row) return [];
          
          let activities = [];
          
          // Handle various data structures with proper null checks
          if (row.simmetoxes && Array.isArray(row.simmetoxes)) {
            activities = row.simmetoxes
              .map(s => s?.drastiriotita)
              .filter(Boolean); // Remove null/undefined items
          } else if (row.drastiriotita) {
            if (Array.isArray(row.drastiriotita)) {
              activities = row.drastiriotita.filter(Boolean);
            } else {
              activities = [row.drastiriotita].filter(Boolean);
            }
          } else if (row.katanemimeno_se && Array.isArray(row.katanemimeno_se)) {
            activities = row.katanemimeno_se
              .map(k => k?.drastiriotita)
              .filter(Boolean);
          }
          
          // IMPORTANT: Enrich each activity with proper difficulty level data
          return activities.map(activity => {
            if (!activity) return null;
            
            // Process vathmos_diskolias to ensure it's properly formatted
            let vathmos_diskolias = activity.vathmos_diskolias;
            
            // If we only have the ID, create a proper object
            if (!vathmos_diskolias && activity.id_vathmou_diskolias) {
              vathmos_diskolias = {
                id_vathmou_diskolias: activity.id_vathmou_diskolias,
                epipedo: activity.id_vathmou_diskolias // Use ID as epipedo if no specific value
              };
            }
            
            // Use the difficultyLevels array to get the correct epipedo if available
            if (activity.id_vathmou_diskolias && difficultyLevels && difficultyLevels.length > 0) {
              const difficultyLevel = difficultyLevels.find(
                level => level.id_vathmou_diskolias === parseInt(activity.id_vathmou_diskolias)
              );
              
              if (difficultyLevel) {
                vathmos_diskolias = {
                  id_vathmou_diskolias: activity.id_vathmou_diskolias,
                  epipedo: difficultyLevel.epipedo
                };
              }
            }
            
            // Return enriched activity
            return {
              ...activity,
              vathmos_diskolias: vathmos_diskolias
            };
          }).filter(Boolean); // Remove any null items
        } catch (error) {
          console.error("Error in getData for activities:", error);
          return [];
        }
      },
      columns: [
        { 
          accessorKey: "titlos", 
          header: "Τίτλος",
          Cell: ({ row }) => {
            if (!row?.original) return "-";
            
            const id = row.original.id_drastiriτοτας || row.original.id;
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
                {row.original.titlos || "Άγνωστο"}
              </Box>
            );
          }
        },
        { 
          accessorKey: "hmerominia", 
          header: "Ημερομηνία",
          Cell: ({ row }) => {
            if (!row?.original?.hmerominia) return "-";
            try {
              return new Date(row.original.hmerominia).toLocaleDateString("el-GR");
            } catch (e) {
              return "-";
            }
          }
        },
        {
          accessorKey: "vathmos_diskolias", 
          header: "Βαθμός Δυσκολίας",
          Cell: ({ row }) => {
            if (!row?.original) return "Άγνωστο";
            
            // Use the shared formatDifficultyLevel function instead of custom logic
            return formatDifficultyLevel(row.original.vathmos_diskolias);
          }
        }
      ],
      getRowId: (row) => {
        if (!row) return `random-${Math.random().toString(36).substring(2)}`;
        return row.id_drastiriτοτας || row.id || `random-${Math.random().toString(36).substring(2)}`;
      },
      emptyMessage: "Δεν συμμετέχει σε καμία δραστηριότητα"
    },
    {
      title: "Ιστορικό Πληρωμών",
      getData: (row) => {
        try {
          if (!row) return [];
          if (!row.plironei) return [];
          if (!Array.isArray(row.plironei)) return [];
          return [...row.plironei];
        } catch (error) {
          console.error("Error in getData for payments:", error);
          return [];
        }
      },
      columns: [
        { 
          accessorKey: "poso_pliromis", 
          header: "Ποσό",
          Cell: ({ row }) => {
            if (!row?.original) return "0€";
            return `${row.original.poso_pliromis || 0}€`;
          }
        },
        { 
          accessorKey: "hmerominia_pliromis", 
          header: "Ημερομηνία",
          Cell: ({ row }) => {
            if (!row?.original?.hmerominia_pliromis) return "-";
            return formatDateGR(row.original.hmerominia_pliromis);
          }
        }
      ],
      onDelete: (payment, participant) => {
        if (!payment || !participant) return;
        const paymentId = payment.id || payment.id_plironei;
        const participantId = participant.id_simmetoxis;
        
        if (!paymentId || !participantId) {
          console.error("Missing ID for payment or participant");
          return;
        }
        
        handleRemovePayment(paymentId, participantId);
      },
      onAddNew: (rowOrId, meta) => {
        if (!rowOrId) return;
        
        console.log("Payment onAddNew called with:", rowOrId, meta);
        
        let simmetoxiId;
        let participantObject;
        
        // Case 1: We might have the parent row as meta parameter
        if (meta && typeof meta === 'object' && (meta.id_simmetoxis || meta.id)) {
          simmetoxiId = meta.id_simmetoxis || meta.id;
          participantObject = meta;
        }
        // Case 2: We might have just received a numeric ID
        else if (typeof rowOrId === 'number' || typeof rowOrId === 'string') {
          simmetoxiId = rowOrId;
          // Find the complete participant data from the participants array
          participantObject = participants.find(p => 
            p.id_simmetoxis == simmetoxiId || p.id == simmetoxiId
          );
        }
        // Case 3: We received an object with ID
        else if (rowOrId && typeof rowOrId === 'object') {
          simmetoxiId = rowOrId.id_simmetoxis || rowOrId.id;
          participantObject = rowOrId;
        }
        
        if (!simmetoxiId) {
          console.error("No valid ID found for participant", rowOrId);
          alert("Σφάλμα: Δεν βρέθηκε ID συμμετοχής.");
          return;
        }
        
        // If we found the ID but not the full object, create a minimal one
        if (!participantObject) {
          participantObject = {
            id_simmetoxis: simmetoxiId,
            memberName: "Συμμετέχων #" + simmetoxiId
          };
        }
        
        // Make sure ID is included in the object we're passing
        handleOpenPaymentDialog({
          ...participantObject,
          id_simmetoxis: simmetoxiId
        });
      },
      getRowId: (row) => {
        if (!row) return `payment-${Math.random().toString(36).substring(2)}`;
        return row.id || row.id_plironei || `payment-${Math.random().toString(36).substring(2)}`;
      },
      emptyMessage: "Δεν υπάρχουν καταχωρημένες πληρωμές"
    }
  ]
};

  // Custom form for participant addition with tables for member selection and activity selection
const ParticipantSelectionForm = ({ onSubmit, onCancel }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [price, setPrice] = useState(eksormisi.timi || 0);
  const [status, setStatus] = useState("Ενεργή");
  
  // Define columns for the member selection table
  const memberColumns = [
    {
      accessorKey: "fullName", 
      header: "Ονοματεπώνυμο",
      Cell: ({ row }) => {
        return row.original.fullName || "-";
      }
    },
    {
      accessorKey: "status", 
      header: "Κατάσταση Συνδρομής",
      Cell: ({ row }) => row.original.athlitis ? "Αθλητής" : row.original.sindromitis?.katastasi_sindromis || '-'
    }
  ];
  
  // Define columns for the activity selection table
  const activityColumns = [
    {
      accessorKey: "titlos",
      header: "Τίτλος"
    },
    {
      accessorKey: "hmerominia",
      header: "Ημερομηνία",
      Cell: ({ row }) => row.original.hmerominia ? new Date(row.original.hmerominia).toLocaleDateString('el-GR') : "-"
    },
    {
      accessorKey: "vathmos_diskolias",
      header: "Βαθμός Δυσκολίας",
      Cell: ({ row }) => {
        const vathmos = row.original.vathmos_diskolias;
        if (!vathmos) return "Άγνωστο";
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {`Βαθμός ${vathmos.epipedo || ""}`}
          </Box>
        );
      }
    }
  ];
  
  const handleSubmit = () => {
    if (!selectedMember) {
      alert("Πρέπει να επιλέξετε μέλος");
      return;
    }
    
    if (selectedActivities.length === 0) {
      alert("Πρέπει να επιλέξετε τουλάχιστον μία δραστηριότητα");
      return;
    }
    
    onSubmit({
      id_melous: selectedMember.id_es_melous || selectedMember.id,
      selectedActivities,
      timi: price,
      katastasi: status
    });
  };
  
  return (
    <Box sx={{ width: "100%" }}>
      {/* Member Selection */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
        Επιλογή Μέλους
      </Typography>
      <Box sx={{ mb: 3, border: '1px solid #ddd', borderRadius: 1 }}>
        <DataTable
          data={availableMembers}
          columns={memberColumns}
          getRowId={(row) => row.id_es_melous || row.id}
          enableRowSelection
          onRowSelectionModelChange={(ids) => {
            if (ids.length > 0) {
              setSelectedMember(availableMembers.find(m => 
                (m.id_es_melous || m.id) === ids[0]
              ));
            } else {
              setSelectedMember(null);
            }
          }}
          state={{
            rowSelection: selectedMember ? {
              [(selectedMember.id_es_melous || selectedMember.id)]: true
            } : {}
          }}
          enablePagination={true}
          density="compact"
          enableToolbarInternalActions={false}
          enableColumnActions={false}
        />
      </Box>
      
      {/* Activities Selection */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
        Επιλογή Δραστηριοτήτων
      </Typography>
      <Box sx={{ mb: 3, border: '1px solid #ddd', borderRadius: 1 }}>
        <DataTable
          data={drastiriotites}
          columns={activityColumns}
          getRowId={(row) => row.id_drastiriτοitas || row.id}
          enableRowSelection
          enableMultiRowSelection
          onRowSelectionModelChange={(ids) => {
            setSelectedActivities(ids);
          }}
          state={{
            rowSelection: selectedActivities.reduce((acc, id) => {
              acc[id] = true;
              return acc;
            }, {})
          }}
          enablePagination={true}
          density="compact"
          enableToolbarInternalActions={false}
          enableColumnActions={false}
        />
      </Box>
      
      {/* Price and Status */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Τιμή"
            type="number"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            InputProps={{
              startAdornment: <AttachMoneyIcon position="start" />
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Κατάσταση"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Ενεργή">Ενεργή</option>
            <option value="Εκκρεμής">Εκκρεμής</option>
            <option value="Ολοκληρωμένη">Ολοκληρωμένη</option>
            <option value="Ακυρωμένη">Ακυρωμένη</option>
          </TextField>
        </Grid>
      </Grid>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onCancel}>
          Ακύρωση
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Αποθήκευση
        </Button>
      </Box>
    </Box>
  );
};

  // Add this function to open the member selection dialog
const handleAddParticipantClick = () => {
  setAddParticipantDialog(true);
};

  // Χειριστής προσθήκης συμμετέχοντα σε συγκεκριμένη δραστηριότητα
const handleAddActivityParticipant = async (formData) => {
  try {
    if (!selectedActivityForParticipant) {
      alert("Δεν έχει επιλεγεί δραστηριότητα.");
      return;
    }
    
    const activityId = selectedActivityForParticipant.id_drastiriτοτας || selectedActivityForParticipant.id;
    
    // Better handling of member ID
    let memberId;
    if (typeof formData.id_melous === 'object') {
      // First try to get the melos.id_melous if available
      if (formData.id_melous.melos && formData.id_melous.melos.id_melous) {
        memberId = formData.id_melous.melos.id_melous;
      } else {
        // Fall back to the selected ID
        memberId = formData.id_melous.id;
      }
    } else {
      memberId = parseInt(formData.id_melous);
    }
    
    const formattedData = {
      id_melous: memberId,
      id_drastiriotitas: parseInt(activityId),
      timi: parseFloat(formData.timi),
      katastasi: formData.katastasi || "Ενεργή"
    };
    
    const response = await api.post(`/eksormiseis/${id}/simmetoxi`, formattedData);
    
    // Find the selected member's details
    const selectedMember = availableMembers.find(m => (m.id_es_melous || m.id) === memberId);
    
    // Create new participant object
    const newParticipant = {
      id: response.data.id_simmetoxis,
      id_simmetoxis: response.data.id_simmetoxis,
      id_drastiriotitas: parseInt(activityId),
      id_melous: memberId,
      memberName: `${selectedMember?.melos?.epafes?.epitheto || ''} ${selectedMember?.melos?.epafes?.onoma || ''}`.trim(),
      email: selectedMember?.melos?.epafes?.email || '-',
      tilefono: selectedMember?.melos?.epafes?.tilefono || '-',
      timi: parseFloat(formattedData.timi),
      katastasi: formData.katastasi || "Ενεργή",
      ypoloipo: parseFloat(formattedData.timi), // Initially, the full amount is pending
      plironei: [] // No payments yet
    };
    
    // Update participants array
    setParticipants(prev => [...prev, newParticipant]);
    
    // Update the drastiriotites array to include this participant
    setDrastiriotites(prev => 
      prev.map(d => {
        if (d.id_drastiriτοτας == activityId || d.id == activityId) {
          return {
            ...d,
            simmetexontes: [...(d.simmetexontes || []), {
              id_simmetoxis: response.data.id_simmetoxis,
              id_melous: memberId,
              memberName: `${selectedMember?.melos?.epafes?.epitheto || ''} ${selectedMember?.melos?.epafes?.onoma || ''}`.trim(),
              email: selectedMember?.melos?.epafes?.email || '-',
              tilefono: selectedMember?.melos?.epafes?.tilefono || '-',
              timi: parseFloat(formattedData.timi),
              katastasi: formData.katastasi || "Ενεργή"
            }]
          };
        }
        return d;
      })
    );
    
    // Remove the member from available members if they're not in any other activity
    setAvailableMembers(prev => 
      prev.filter(m => (m.id_es_melous || m.id) !== memberId)
    );
    
    setAddActivityParticipantDialog(false);
    setSelectedActivityForParticipant(null);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη συμμετέχοντα στη δραστηριότητα:", error);
    // Show more detailed error message if available
    if (error.response?.data?.error) {
      alert("Σφάλμα: " + error.response.data.error);
    } else {
      alert("Σφάλμα: " + error.message);
    }
  }
};

  // ΠΡΟΣΘΗΚΗ: Μετακίνηση του drastiriotitaDetailPanel μέσα στο component
  // πριν το return statement
  const drastiriotitaDetailPanel = {
  mainDetails: [
    { accessor: "titlos", header: "Τίτλος" },
    { 
      accessor: "hmerominia", 
      header: "Ημερομηνία", 
      format: (value) => formatDateGR(value)
    },
    { accessor: "ores_poreias", header: "Ώρες Πορείας", format: (value) => value || "-" },
    { accessor: "diafora_ipsous", header: "Διαφορά Ύψους (μ)", format: (value) => value || "-" },
    { accessor: "megisto_ipsometro", header: "Μέγιστο Υψόμετρο (μ)", format: (value) => value || "-" },
    { 
      accessor: "vathmos_diskolias", 
      header: "Βαθμός Δυσκολίας", 
      format: (value) => formatDifficultyLevel(value)
    }
  ],
  tables: [
    {
      title: "Συμμετέχοντες",
      getData: (row) => {
        // Επιστρέφει τους συμμετέχοντες που έχουν φορτωθεί στο αντικείμενο
        if (!Array.isArray(row?.simmetexontes)) return [];
        
        return row.simmetexontes.map(s => ({
          ...s,
          // Correctly handle phone number from both direct property and nested object
          tilefono: s.tilefono || s.melos?.epafes?.tilefono || "-"
        }));
      },
      loadData: async (row) => {
        if (!row) return [];
        
        try {
          const id = row.id_drastiriτοitas || row.id;
          if (!id) return [];
          
          const response = await api.get(`/eksormiseis/drastiriotita/${id}/simmetexontes`);
          
          if (Array.isArray(response.data)) {
            return response.data.map(item => ({
              id: item.id_simmetoxis,
              id_simmetoxis: item.id_simmetoxis,
              id_melous: item.id_melous,
              memberName: formatFullName(item.melos?.epafes),
              timi: item.timi || 0,
              katastasi: item.katastasi || "Ενεργή",
              email: item.melos?.epafes?.email || "-",
              tilefono: item.melos?.epafes?.tilefono || "-"
            }));
          }
          return [];
        } catch (error) {
          console.error("Σφάλμα φόρτωσης συμμετεχόντων:", error);
          return [];
        }
      },
      columns: [
        { accessorKey: "memberName", header: "Ονοματεπώνυμο" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "tilefono", header: "Τηλέφωνο" }
      ],
      getRowId: (row) => row?.id_simmetoxis || row?.id || `participant-${Math.random().toString(36).substring(2)}`,
      emptyMessage: "Δεν υπάρχουν συμμετέχοντες σε αυτή τη δραστηριότητα"
    }
  ]
};

  // Helper function to update participant detail panels when activities change
const updateParticipantActivityLists = (deletedActivityId) => {
  setParticipants(prevParticipants => 
    prevParticipants.map(p => {
      // Update the simmetoxes array to remove the deleted activity
      if (p.simmetoxes && Array.isArray(p.simmetoxes)) {
        const updatedSimmetoxes = p.simmetoxes.filter(s => 
          s.drastiriotita?.id_drastiriτοτας != deletedActivityId && 
          s.drastiriotita?.id != deletedActivityId
        );
        
        return {
          ...p,
          simmetoxes: updatedSimmetoxes,
          // Add a flag if they have no more activities
          hasNoActivities: updatedSimmetoxes.length === 0
        };
      }
      return p;
    })
  );
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
                        {eksormisi.hmerominia_anaxorisis ? formatDateGR(eksormisi.hmerominia_anaxorisis) : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Ημερομηνία Άφιξης</Typography>
                      <Typography variant="body1">
                        {eksormisi.hmerominia_afiksis ? formatDateGR(eksormisi.hmerominia_afiksis) : '-'}
                      </Typography>
                    </Grid>

                    {/* Close the grid container for the base details */}
                  </Grid>

                  {/* Then start the info section */}
                  <Box sx={{ mt: 3 }}>
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
              getRowId={(row) => row.id_drastiriτοτας || row.id}
              initialState={{ 
                columnVisibility: { id_drastiriτοτας: false },
                sorting: [{ id: "hmerominia", desc: false }] // Default sort by date
              }}
              handleRowClick={(row) => navigate(`/drastiriotita/${row.id_drastiriτοτας || row.id}`)}
              handleEditClick={handleEditDrastiriotitaClick}
              handleDelete={(row) => handleDeleteDrastiriotita(row.original || row)}
              enableRowActions={true}
              tableName="drastiriotites"
              density="compact"
              enableAddNew={false}
              enableExpand={true}
              detailPanelConfig={drastiriotitaDetailPanel}
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
                onClick={handleAddParticipantClick}
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
                initialState={{ 
                  columnVisibility: { id_simmetoxis: false },
                  sorting: [{ id: "memberName", desc: false }] // Default sort by name
                }}
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
          resourceData={{
            membersList: availableMembers.map(member => ({
              id: member.id_es_melous || member.id,
              onoma: member.melos?.epafes?.onoma || "",
              epitheto: member.melos?.epafes?.epitheto || "",
              fullName: `${member.melos?.epafes?.epitheto || ''} ${member.melos?.epafes?.onoma || ''}`.trim(),
              // Include subscription status similar to melitousillogou.js
              status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || '-'
            })),
            drastiriotitesList: drastiriotites.map(dr => {
              // Enhanced difficulty level extraction
              let vathmosDisplay = "-";
              if (dr.vathmos_diskolias?.epipedo) {
                vathmosDisplay = `Βαθμός ${dr.vathmos_diskolias.epipedo}`;
              } else if (dr.id_vathmou_diskolias) {
                // Fallback to ID if epipedo is not available
                vathmosDisplay = `Βαθμός ${dr.id_vathmou_diskolias}`;
              }
              
              return {
                id: dr.id_drastiriτοτας || dr.id,
                titlos: dr.titlos || "Άγνωστη δραστηριότητα",
                hmerominia: dr.hmerominia ? new Date(dr.hmerominia).toLocaleDateString('el-GR') : "-",
                vathmos_diskolias: vathmosDisplay // εγγυημένο string
              };
            })
          }}
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
              { accessorKey: "id_melous", header: "ID μέλους", type: "hidden" },
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
              },
              {
                accessorKey: "activities",
                header: "Δραστηριότητες",
                type: "tableSelect",
                dataKey: "drastiriotitesList",
                multiSelect: true,
                pageSize: 5,
                columns: [
                  { field: "titlos", header: "Τίτλος" },
                  { field: "hmerominia", header: "Ημερομηνία" },
                  { field: "vathmos_diskolias", header: "Βαθμός Δυσκολίας" }
                ]
              }
            ]}
            resourceData={{
              drastiriotitesList: drastiriotites.map(dr => {
                let vathmosDisplay = "-";
                if (dr.vathmos_diskolias?.epipedo) {
                  vathmosDisplay = `Βαθμός ${dr.vathmos_diskolias.epipedo}`;
                } else if (dr.id_vathmou_diskolias) {
                  vathmosDisplay = `Βαθμός ${dr.id_vathmou_diskolias}`;
                }
                
                return {
                  id: dr.id_drastiriτοτας || dr.id,
                  titlos: dr.titlos || "Άγνωστη δραστηριότητα",
                  hmerominia: dr.hmerominia ? formatDateGR(dr.hmerominia) : "-",
                  vathmos_diskolias: vathmosDisplay
                };
              })
            }}
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

        {/* Dialog προσθήκης συμμετέχοντα σε δραστηριότητα */}
        {selectedActivityForParticipant && (
          <AddDialog
            open={addActivityParticipantDialog}
            onClose={() => {
              setAddActivityParticipantDialog(false);
              setSelectedActivityForParticipant(null);
            }}
            handleAddSave={handleAddActivityParticipant}
            title={`Προσθήκη Συμμετέχοντα στη δραστηριότητα: ${selectedActivityForParticipant.titlos || ''}`}
            fields={[
              { 
                accessorKey: "id_melous", 
                header: "Μέλος",
                required: true,
                type: "tableSelect",               
                dataKey: "membersList",           
                singleSelect: true,                
                pageSize: 5,                       
                columns: [                         
                  { field: "fullName", header: "Ονοματεπώνυμο" },
                  { field: "status", header: "Κατάσταση Συνδρομής" }
                ],
                searchFields: ["fullName"], 
                noDataMessage: "Δεν βρέθηκαν μέλη",
                validation: yup.mixed().required("Παρακαλώ επιλέξετε μέλος")
              },
              { 
                accessorKey: "timi", 
                header: "Τιμή", 
                required: true,
                type: "number",
                defaultValue: eksormisi?.timi || 0,
                validation: yup.number().min(0, "Δεν μπορεί να είναι αρνητικός αριθμός").required("Η τιμή είναι υποχρεωτική")
              },
              { 
                accessorKey: "katastasi", 
                header: "Κατάσταση", 
                required: true,
                type: "select",
                options: [
                  { value: "Ενεργή", label: "Ενεργή" },
                  { value: "Εκκρεμής", label: "Εκκρεμής" },
                  { value: "Ολοκληρωμένη", label: "Ολοκληρωμένη" },
                  { value: "Ακυρωμένη", label: "Ακυρωμένη" }
                ],
                defaultValue: "Ενεργή",
                validation: yup.string().required("Το πεδίο είναι υποχρεωτικό")
              }
            ]}
            resourceData={{
              membersList: availableMembers.map(member => ({
                id: member.id_es_melous || member.id,
                onoma: member.melos?.epafes?.onoma || "",
                epitheto: member.melos?.epafes?.epitheto || "",
                fullName: `${member.melos?.epafes?.epitheto || ''} ${member.melos?.epafes?.onoma || ''}`.trim(),
                status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || '-'
              }))
            }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
}
