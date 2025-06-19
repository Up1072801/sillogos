import React, { useState, useEffect } from "react";
import api from '../utils/api';
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Container, Divider, Grid,
  IconButton, Button, TableContainer, Table, 
  TableHead, TableRow, TableCell, TableBody, 
  CircularProgress, Alert, Chip, TextField, Breadcrumbs, Link, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions // Add these two components
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
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
  const [openDeleteResponsibleDialog, setOpenDeleteResponsibleDialog] = useState(false);
const [personToDelete, setPersonToDelete] = useState(null);
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
  // Add after the other state variable declarations
  const [paymentToDelete, setPaymentToDelete] = useState(null);
const [openDeletePaymentDialog, setOpenDeletePaymentDialog] = useState(false);
  const [internalMembers, setInternalMembers] = useState([]);
  const [responsiblePersonDialog, setResponsiblePersonDialog] = useState(false);
  // Add these states
  // Add with your other state declarations
  const [deletingResponsibleId, setDeletingResponsibleId] = useState(null);
const [processingIds, setProcessingIds] = useState(new Set());

const [ypefthynoi, setYpefthynoi] = useState([]);
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
    fetchInternalMembers();
    fetchResponsiblePersons();
}, [id, refreshTrigger]); // Removed participants.length

const fetchResponsiblePersons = async () => {
  try {
    const response = await api.get(`/eksormiseis/${id}/ypefthynoi`);
    
    
    if (Array.isArray(response.data)) {
      const formattedPersons = response.data.map(person => {
        const lastName = person.ypefthynos?.melos?.epafes?.epitheto || 
                         person.epitheto || 
                         '';
        const firstName = person.ypefthynos?.melos?.epafes?.onoma || 
                          person.onoma || 
                          '';
        
        
        return {
          ...person,
          // ΔΙΟΡΘΩΣΗ: Σωστή σειρά για ελληνικά ονόματα - πρώτα επώνυμο, μετά όνομα
          fullName: `${lastName} ${firstName}`.trim() || "Άγνωστο όνομα",
          // Make sure we have these fields for display
          email: person.ypefthynos?.melos?.epafes?.email || 
                 person.email || 
                 '-',
          tilefono: person.ypefthynos?.melos?.epafes?.tilefono || 
                    person.tilefono || 
                    '-'
        };
      });
      
      setYpefthynoi(formattedPersons);
    } else {
      setYpefthynoi([]);
    }
  } catch (error) {
    console.error("Σφάλμα κατά τη φόρτωση υπευθύνων:", error);
    setYpefthynoi([]);
  }
};

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
        // Get all members (both internal and external)
        const membersResponse = await api.get("/melitousillogou/all");
        
        // Create a Set of member IDs that already participate - use a more comprehensive approach
        const existingMemberIds = new Set();
        participants.forEach(p => {
          // Add all possible ID fields for a participant's member ID
          const ids = [
            p.id_melous,
            p.id, 
            p.melos?.id_melous,
            p.melos?.id
          ].filter(Boolean).map(String);
          
          ids.forEach(id => existingMemberIds.add(id));
        });


        const filteredMembers = membersResponse.data
          .filter(member => {
            // Extract all possible ID fields for a member
            const ids = [
              member.id_es_melous,
              member.id_ekso_melous,
              member.id,
              member.melos?.id_melous,
              member.melos?.id
            ].filter(Boolean).map(String);
            
            // Check if any of these IDs is in the existingMemberIds set
            const isParticipating = ids.some(id => existingMemberIds.has(id));
            
            // Only include members that aren't already participants
            return !isParticipating;
          })
          .map(member => ({
            ...member,
            id: member.id_es_melous || member.id_ekso_melous || member.id,
          }));
        
        setAvailableMembers(filteredMembers);
      } catch (err) {
        console.error("Error loading members:", err);
        setAvailableMembers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων της εξόρμησης");
      setLoading(false);
    }
  };

  // Add this function before the return statement
const handleRemoveResponsiblePersonClick = (personId) => {
  setPersonToDelete(personId);
  setOpenDeleteResponsibleDialog(true);
};

// Add this function to handle the actual deletion after confirmation
const confirmRemoveResponsiblePerson = async (personId) => {
  if (!personId) return;
  
  try {
    setDeletingResponsibleId(personId);
    await api.delete(`/eksormiseis/${id}/ypefthynoi/${personId}`);
    
    // Update local state
    setYpefthynoi(prev => prev.filter(y => 
      y.id_ypefthynou !== personId && 
      y.id_es_melous !== personId &&
      y.id !== personId
    ));
  } catch (error) {
    console.error("Error removing responsible person:", error);
    alert("Σφάλμα κατά την αφαίρεση υπευθύνου: " + error.message);
  } finally {
    setDeletingResponsibleId(null);
  }
};

// Update the handleRemoveResponsiblePerson function
const handleRemoveResponsiblePerson = async (id_ypefthynou) => {
  try {

    
    // Add this ID to the processing set AND set the deleting state
    setProcessingIds(prev => new Set(prev).add(id_ypefthynou));
    setDeletingResponsibleId(id_ypefthynou);
    
    // Log current responsible person count
    
    try {
      // Try to delete from the API
      await api.delete(`/eksormiseis/${id}/ypefthynoi/${id_ypefthynou}`);
    } catch (error) {
      // If the error is P2025 (record not found), we can consider it a success
      // as the record is already gone from the database
      if (error.response?.data?.details?.includes('P2025')) {
      } else {
        // For other errors, throw to be caught by the outer catch
        throw error;
      }
    }
    
    // Always update the UI state regardless of API response
    // This ensures the UI is consistent even if the backend has issues
    setYpefthynoi(prevYpefthynoi => 
      prevYpefthynoi.filter(y => 
        y.id_ypefthynou !== id_ypefthynou && 
        y.id_es_melous !== id_ypefthynou && 
        y.id !== id_ypefthynou
      )
    );
    
    // Log updated responsible person count 
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση υπευθύνου:", error);
    alert("Σφάλμα: " + error.message);
  } finally {
    // Clear both tracking mechanisms
    setDeletingResponsibleId(null);
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id_ypefthynou);
      return newSet;
    });
  }
};
// Ενημερωμένη έκδοση της handleAddResponsiblePersons που διατηρεί τους υπάρχοντες υπευθύνους
// Ενημερωμένη έκδοση της handleAddResponsiblePersons που διατηρεί τους υπάρχοντες υπευθύνους
const handleAddResponsiblePersons = async (selectedIds) => {
  try {
    // Δημιουργία λίστας με τα IDs των υπαρχόντων υπευθύνων
    const existingIds = ypefthynoi.map(y => 
      y.id_ypefthynou || y.id_es_melous || y.id
    ).filter(Boolean);
    
    // Συνδυασμός υπαρχόντων και νέων IDs (αποφυγή διπλοτύπων)
    const allIds = [...new Set([...existingIds, ...selectedIds])];
    
    // Αποστολή όλων των IDs στο backend
    const response = await api.post(`/eksormiseis/${id}/ypefthynoi`, {
      id_ypefthynon: allIds
    });
    
    if (response.data.responsiblePersons) {
      // Update the state directly with the returned data
      setYpefthynoi(response.data.responsiblePersons);
    } else {
      // Fallback to re-fetching if somehow the data isn't returned
      fetchResponsiblePersons();
    }
    
    setResponsiblePersonDialog(false);
  } catch (error) {
    console.error("Error adding responsible persons:", error);
    alert("Σφάλμα κατά την προσθήκη υπευθύνων: " + error.message);
  }
};

// Αντικατάστησε την υπάρχουσα fetchInternalMembers με αυτή την ενημερωμένη έκδοση
// Πλήρης αντικατάσταση της συνάρτησης fetchInternalMembers
const fetchInternalMembers = async () => {
  try {
    // Fetch all internal members
    const response = await api.get("/melitousillogou/internal");
    
    if (Array.isArray(response.data)) {
      // Process each member to ensure names are correctly populated
      const processedMembers = response.data.map(member => {
        // Try to extract name parts from all possible locations
        const onoma = member.onoma || 
                    member.firstName || 
                    member.melos?.epafes?.onoma || 
                    member.epafes?.onoma || '';
                    
        const epitheto = member.epitheto || 
                       member.lastName || 
                       member.melos?.epafes?.epitheto || 
                       member.epafes?.epitheto || '';
        
        // Construct a proper fullName that overrides any "Άγνωστο όνομα" values
        const properFullName = `${epitheto} ${onoma}`.trim();
        
        // Return a member with a guaranteed name if possible
        return {
          ...member,
          onoma,
          epitheto,
          firstName: onoma,
          lastName: epitheto,
          fullName: properFullName || (member.fullName !== "Άγνωστο όνομα" ? member.fullName : "")
        };
      });
      
      setInternalMembers(processedMembers);
    } else {
      console.error("Expected array but received:", response.data);
      setInternalMembers([]);
    }
  } catch (error) {
    console.error("Error loading internal members:", error);
    setInternalMembers([]);
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
    validation: yup.number()
      .typeError("Το πεδίο πρέπει να είναι αριθμός")
      .required("Το πεδίο είναι υποχρεωτικό")
  },
  { 
    accessorKey: "diafora_ipsous", 
    header: "Διαφορά Ύψους (μ)", 
    type: "number",
    required: true, 
    defaultValue: 0,
    validation: yup.number()
      .typeError("Το πεδίο πρέπει να είναι αριθμός")
      .required("Το πεδίο είναι υποχρεωτικό")
  },
  { 
    accessorKey: "megisto_ipsometro", 
    header: "Μέγιστο Υψόμετρο (μ)", 
    type: "number",
    required: true,
    defaultValue: 0,
    validation: yup.number()
      .typeError("Το πεδίο πρέπει να είναι αριθμός")
      .required("Το πεδίο είναι υποχρεωτικό")
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
        if (item.id_drastiriotitas === updatedDrastiriotita.id || item.id === updatedDrastiriotita.id) {
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
    await api.delete(`/eksormiseis/drastiriotita/${drastiriotitaId}`);
    
    // Update local state by removing the deleted drastiriotita
    setDrastiriotites(prevDrastiriotites => 
      prevDrastiriotites.filter(item => 
        item.id_drastiriotitas !== drastiriotitaId && item.id !== drastiriotitaId
      )
    );
    
    // Update participants state to remove the deleted activity from their lists
    setParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        // Remove the activity from simmetoxes array
        const updatedSimmetoxes = (participant.simmetoxes || []).filter(s => 
          s.drastiriotita?.id_drastiriotitas != drastiriotitaId &&
          s.drastiriotita?.id != drastiriotitaId
        );
        
        // Remove the activity from activities array
        const updatedActivities = (participant.activities || []).filter(a => 
          (a.id_drastiriotitas != drastiriotitaId && a.id != drastiriotitaId)
        );
        
        // Remove from simmetoxi_drastiriotites (if present)
        const updatedSimmetoxiDrastiriotites = (participant.simmetoxi_drastiriotites || [])
          .filter(sd => sd.id_drastiriotitas != drastiriotitaId);
        
        return {
          ...participant,
          simmetoxes: updatedSimmetoxes,
          activities: updatedActivities,
          simmetoxi_drastiriotites: updatedSimmetoxiDrastiriotites,
          // Flag participants who now have no activities
          hasNoActivities: updatedActivities.length === 0 && updatedSimmetoxes.length === 0
        };
      })
    );
    
    // Optionally remove participants who no longer have any activities
    setParticipants(prev => 
      prev.filter(p => {
        // If this participant was directly linked to the deleted activity,
        // check if they're part of any other activities
        const hasActivities = 
          (p.activities && p.activities.length > 0) || 
          (p.simmetoxes && p.simmetoxes.length > 0);
        
        return hasActivities || p.id_drastiriotitas != drastiriotitaId;
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
      { field: "status", header: "Κατάσταση Συνδρομής" },
      { field: "vathmos", header: "Βαθμός Δυσκολίας" } // This column exists
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

    // Find the selected member from availableMembers
    let memberIdToFind;
    if (typeof formData.id_melous === 'object' && formData.id_melous !== null) {
      // Handle case where formData.id_melous is an object (which happens with tableSelect)
      if (formData.id_melous.melos && formData.id_melous.melos.id_melous) {
        memberIdToFind = formData.id_melous.melos.id_melous;
      } else {
        // Fall back to the selected ID
        memberIdToFind = formData.id_melous.id;
      }
    } else {
      memberIdToFind = formData.id_melous;
    }

    const selectedMember = availableMembers.find(m => 
      String(m.id_es_melous || m.id_ekso_melous || m.id) === String(memberIdToFind)
    );

    if (!selectedMember) {
      alert("Το επιλεγμένο μέλος δεν βρέθηκε");
      return;
    }

    // Get member name and contact info
    const memberName = `${selectedMember?.melos?.epafes?.epitheto || ''} ${selectedMember?.melos?.epafes?.onoma || ''}`.trim();
    const memberEmail = selectedMember?.melos?.epafes?.email || '-';
    const memberPhone = selectedMember?.melos?.epafes?.tilefono || '-';

    // Convert the id_drastiriotitas from tableSelect to an array if it's not already
    const activityIds = Array.isArray(formData.id_drastiriotitas) 
      ? formData.id_drastiriotitas 
      : [formData.id_drastiriotitas];

    // Check if user has selected at least one activity
    if (activityIds.length === 0) {
      alert("Πρέπει να επιλέξετε τουλάχιστον μία δραστηριότητα");
      return;
    }

    const fixedPrice = parseFloat(formData.timi); // Get the price once for all activities
    
    // Send all activities in a single request instead of looping
    const formattedData = {
      id_melous: selectedMember.id_es_melous || selectedMember.id_ekso_melous || selectedMember.id,
      id_drastiriotitas_array: activityIds.map(id => parseInt(id)),
      timi: fixedPrice,
      katastasi: formData.katastasi || "Ενεργή"
    };
    
    // Show loading indicator or disable UI elements here if needed
    
    const response = await api.post(`/eksormiseis/${id}/simmetoxi`, formattedData);
    
    if (!response.data) {
      alert("Δεν ήταν δυνατή η προσθήκη του συμμετέχοντα");
      return;
    }
    
    const participantId = response.data.id_simmetoxis;
    
    // Create a new participant object with all activities
    const newParticipant = {
      id: participantId,
      id_simmetoxis: participantId,
      id_melous: selectedMember.id_es_melous || selectedMember.id_ekso_melous || selectedMember.id,
      memberName,
      email: memberEmail,
      tilefono: memberPhone,
      timi: fixedPrice,
      katastasi: formData.katastasi || "Ενεργή",
      ypoloipo: fixedPrice,
      plironei: [],
      activities: activityIds.map(actId => {
        const actDetails = drastiriotites.find(d => 
          (d.id_drastiriotitas == actId || d.id == actId)
        );
        return {
          id_drastiriotitas: actId,
          titlos: actDetails?.titlos || `Δραστηριότητα #${actId}`,
          hmerominia: actDetails?.hmerominia
        };
      }),
      simmetoxes: activityIds.map(actId => {
        const actDetails = drastiriotites.find(d => 
          (d.id_drastiriotitas == actId || d.id == actId)
        );
        return {
          drastiriotita: actDetails || {
            titlos: `Δραστηριότητα #${actId}`,
            id_drastiriotitas: actId
          }
        };
      }),
      melos: selectedMember.melos || {
        epafes: {
          onoma: selectedMember?.melos?.epafes?.onoma || '',
          epitheto: selectedMember?.melos?.epafes?.epitheto || '',
          email: memberEmail,
          tilefono: memberPhone
        }
      }
    };
    
    // Update the participants state
    setParticipants(prev => [...prev, newParticipant]);
    
    // Now update the drastiriotites state to show the participant in each selected activity
    setDrastiriotites(prevDrastiriotites => 
      prevDrastiriotites.map(drastiriotita => {
        const drastiriotitaId = drastiriotita.id_drastiriotitas || drastiriotita.id;
        
        // Check if this is one of the activities the participant was added to
        if (activityIds.includes(String(drastiriotitaId))) {
          // Add the participant to this activity's simmetexontes array
          return {
            ...drastiriotita,
            simmetexontes: [
              ...(drastiriotita.simmetexontes || []),
              {
                id_simmetoxis: participantId,
                id_melous: selectedMember.id_es_melous || selectedMember.id_ekso_melous || selectedMember.id,
                memberName,
                email: memberEmail,
                tilefono: memberPhone,
                timi: fixedPrice,
                katastasi: formData.katastasi || "Ενεργή"
              }
            ]
          };
        }
        return drastiriotita;
      })
    );
    
    // Remove the member from available members
    setAvailableMembers(prev => 
      prev.filter(m => {
        const availableMemberId = String(m.id_es_melous || m.id_ekso_melous || m.id);
        const selectedMemberId = String(selectedMember.id_es_melous || selectedMember.id_ekso_melous || selectedMember.id);
        return availableMemberId !== selectedMemberId;
      })
    );
    
    setAddParticipantDialog(false);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη συμμετέχοντα:", error);
    alert("Σφάλμα: " + (error.response?.data?.error || error.message));
  }
};

  // Updated handleEditParticipantClick function
const handleEditParticipantClick = (participant) => {
  // Find all activities this participant is enrolled in
  const participantId = participant.id_melous;
  const participantActivities = [];
  
  // Use a single source of truth for activities if possible
  if (participant.activities && Array.isArray(participant.activities)) {
    // Use only this source if available
    participant.activities.forEach(activity => {
      const actId = String(activity.id_drastiriotitas || activity.id);
      if (!participantActivities.includes(actId)) {
        participantActivities.push(actId);
      }
    });
  } else {
    // Otherwise fall back to other sources
    if (participant.simmetoxi_drastiriotites && Array.isArray(participant.simmetoxi_drastiriotites)) {
      participant.simmetoxi_drastiriotites.forEach(sd => {
        const actId = String(sd.id_drastiriotitas || (sd.drastiriotita?.id_drastiriotitas));
        if (actId && !participantActivities.includes(actId)) {
          participantActivities.push(actId);
        }
      });
    }
    
    if (participant.simmetoxes && Array.isArray(participant.simmetoxes)) {
      participant.simmetoxes.forEach(simmetoxi => {
        if (simmetoxi.drastiriotita?.id_drastiriτοitas) {
          const actId = String(simmetoxi.drastiriotita.id_drastiriotitas);
          if (!participantActivities.includes(actId)) {
            participantActivities.push(actId);
          }
        }
      });
    }
    
    // Include direct activity if available
    if (participant.id_drastiriotitas) {
      const actId = String(participant.id_drastiriotitas);
      if (!participantActivities.includes(actId)) {
        participantActivities.push(actId);
      }
    }
  }
  
  // Set current participant with activities included - make sure all IDs are strings
  setCurrentParticipant({
    id_simmetoxis: participant.id_simmetoxis || participant.id,
    id_melous: participantId,
    timi: participant.timi,
    katastasi: participant.katastasi || "Ενεργή",
    activities: participantActivities // Already uniqued
  });
  
  setEditParticipantDialog(true);
};

// Add this function after handleEditParticipantClick

const handleEditParticipantSave = async (updatedParticipant) => {
  try {
    // Extract IDs from the updatedParticipant object
    const simmetoxiId = updatedParticipant.id_simmetoxis;
    const memberId = updatedParticipant.id_melous;
    
    if (!simmetoxiId) {
      alert("Σφάλμα: Λείπει το ID συμμετοχής");
      return;
    }
    
    // Format data for API - Combine all updates in one request
    const formattedData = {
      timi: parseFloat(updatedParticipant.timi),
      katastasi: updatedParticipant.katastasi || "Ενεργή",
      id_drastiriotitas_array: updatedParticipant.activities // Send all activity IDs
    };
    
    // Use the correct endpoint that exists in the backend
    await api.put(`/eksormiseis/simmetoxi/${simmetoxiId}/update-activities`, formattedData);
    
    // Update the UI state
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_simmetoxis == simmetoxiId || p.id == simmetoxiId) {
          // Update price, status and activities
          return {
            ...p,
            timi: parseFloat(updatedParticipant.timi),
            katastasi: updatedParticipant.katastasi,
            // Update activity relationships (simmetoxes)
            simmetoxes: updatedParticipant.activities.map(actId => {
              const activity = drastiriotites.find(d => 
                d.id_drastiriotitas == actId || d.id == actId
              );
              return {
                drastiriotita: activity || { 
                  id_drastiriotitas: actId,
                  titlos: `Δραστηριότητα #${actId}`
                }
              };
            }),
            // Update the direct activities array too for consistency
            activities: updatedParticipant.activities.map(actId => {
              const activity = drastiriotites.find(d => 
                d.id_drastiriotitas == actId || d.id == actId
              );
              return activity || { 
                id_drastiriotitas: actId,
                titlos: `Δραστηριότητα #${actId}`
              };
            })
          };
        }
        return p;
      })
    );
    
    // Update activities' participants lists
    setDrastiriotites(prev => 
      prev.map(d => {
        const actId = String(d.id_drastiriotitas || d.id);
        const isSelected = updatedParticipant.activities.includes(actId);
        
        // If this activity is selected
        if (isSelected) {
          // Check if the participant is already in this activity
          const participantExists = (d.simmetexontes || []).some(
            s => s.id_simmetoxis == simmetoxiId || s.id == simmetoxiId
          );
          
          // If not, add them
          if (!participantExists) {
            // Find the participant details
            const participant = participants.find(p => 
              p.id_simmetoxis == simmetoxiId || p.id == simmetoxiId
            );
            
            return {
              ...d,
              simmetexontes: [...(d.simmetexontes || []), {
                id_simmetoxis: simmetoxiId,
                id_melous: memberId,
                memberName: participant?.memberName || "Άγνωστο όνομα",
                email: participant?.melos?.epafes?.email || "-",
                tilefono: participant?.melos?.epafes?.tilefono || "-",
                timi: parseFloat(updatedParticipant.timi),
                katastasi: updatedParticipant.katastasi || "Ενεργή"
              }]
            };
          }
        } else {
          // If not selected, remove participant from this activity
          return {
            ...d,
            simmetexontes: (d.simmetexontes || []).filter(s => 
              s.id_simmetoxis != simmetoxiId && s.id != simmetoxiId
            )
          };
        }
        
        return d;
      })
    );
    
    // Close the dialog
    setEditParticipantDialog(false);
    setCurrentParticipant(null);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία συμμετέχοντα:", error);
    alert("Σφάλμα: " + (error.response?.data?.error || error.message));
  }
};

  // Simplified participant removal handler for better state synchronization
// Simplified participant removal handler - remove redundant confirmation
const handleRemoveParticipant = async (participant) => {
  // Check for valid participant
  if (!participant) {
    alert("Σφάλμα: Δεν βρέθηκε συμμετέχων για διαγραφή");
    return;
  }
  
  // Extract IDs
  let participantId;
  let fullParticipantData;
  
  if (typeof participant === 'object') {
    participantId = participant.id_simmetoxis || participant.id;
    fullParticipantData = participant;
    
    if (participant.original) {
      participantId = participantId || participant.original.id_simmetoxis || participant.original.id;
      fullParticipantData = participant.original;
    }
  } else {
    participantId = participant;
    fullParticipantData = participants.find(p => p.id_simmetoxis == participantId || p.id == participantId);
  }
  
  if (participantId === undefined || participantId === null) {
    alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID συμμετοχής");
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
    
    // Update all drastiriotites to remove this participant from their simmetexontes arrays
    setDrastiriotites(prev => 
      prev.map(drastiriotita => ({
        ...drastiriotita,
        simmetexontes: (drastiriotita.simmetexontes || [])
          .filter(s => s.id_simmetoxis != participantId && s.id != participantId)
      }))
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
          const memberResponse = await api.get(`/melitousillogou/${memberId}`);
          if (memberResponse.data) {
            setAvailableMembers(prev => [...prev, memberResponse.data]);
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
  
  // First function to open the dialog and prepare for deletion
const handleRemovePaymentClick = (paymentId, simmetoxiId) => {
  if (!paymentId || !simmetoxiId) {
    console.error("Μη έγκυρες παράμετροι για διαγραφή πληρωμής:", { paymentId, simmetoxiId });
    alert("Σφάλμα: Ελλιπή στοιχεία πληρωμής προς διαγραφή");
    return;
  }
  
  setPaymentToDelete({ paymentId, simmetoxiId });
  setOpenDeletePaymentDialog(true);
};

// Second function to actually perform the deletion after confirmation
const confirmRemovePayment = async () => {
  if (!paymentToDelete) return;
  
  const { paymentId, simmetoxiId } = paymentToDelete;
  
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
    
    setOpenDeletePaymentDialog(false);
    setPaymentToDelete(null);
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση πληρωμής:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Διορθωμένες στήλες για τον πίνακα δραστηριοτήτων
const drastiriotitesColumns = [
  { 
    accessorKey: "titlos", 
    header: "Τίτλος",
    Cell: ({ row }) => {
      const title = row.original.titlos || "Χωρίς Τίτλο";
      
      return (
        <Box 
          sx={{ 
            color: "text.primary", 
            fontWeight: "medium"
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
  { accessorKey: "id_simmetoxis", header: "ID", enableHiding: true, size: 60 },
  { 
    accessorKey: "memberName", 
    header: "Ονοματεπώνυμο",
    size: 200, // Give more space to name column
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
    size: 180, // Keep reasonable space for email
    Cell: ({ row }) => row.original.melos?.epafes?.email || "-"
  },
  { 
    accessorKey: "melos.epafes.tilefono", 
    header: "Τηλέφωνο",
    size: 120, // Smaller but sufficient for phone numbers
    Cell: ({ row }) => row.original.melos?.epafes?.tilefono || "-"
  },
  { 
    accessorKey: "ypoloipo", 
    header: "Υπόλοιπο",
    size: 100, // Significantly reduced as requested
    Cell: ({ row }) => {
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
    size: 100, // Significantly reduced as requested
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
    size: 80, // Very small since it's just an icon button
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
          
          // First check the activities array provided by the backend
          if (row.activities && Array.isArray(row.activities)) {
            activities = [...row.activities];
          }
          // Then check simmetoxi_drastiriotites (the direct relation from database)
          else if (row.simmetoxi_drastiriotites && Array.isArray(row.simmetoxi_drastiriotites)) {
            activities = row.simmetoxi_drastiriotites.map(sd => sd.drastiriotita).filter(Boolean);
          }
          // Fall back to previous data structures for compatibility
          else if (row.simmetoxes && Array.isArray(row.simmetoxes)) {
            activities = row.simmetoxes
              .map(s => s?.drastiriotita)
              .filter(Boolean);
          } else if (row.drastiriotita) {
            if (Array.isArray(row.drastiriotita)) {
              activities = [...row.drastiriotita];
            } else {
              activities = [row.drastiriotita];
            }
          }
          
          return activities;
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
  
  return (
    <Box 
      sx={{ 
        color: "text.primary", 
        fontWeight: "medium"
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
        }
        // Removed difficulty level column
      ],
      getRowId: (row) => {
        if (!row) return `random-${Math.random().toString(36).substring(2)}`;
        return row.id_drastiriotitas || row.id || `random-${Math.random().toString(36).substring(2)}`;
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
          console.error("Missing ID for payment or participant:", { payment, participant });
          return;
        }
        
        handleRemovePaymentClick(paymentId, participantId);
      },
      onAddNew: (rowOrId, meta) => {
        if (!rowOrId) return;
        
        
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
          id_simmetoxi: simmetoxiId
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
  
  // Updated columns for the member selection table
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
      header: "Κατάσταση",
      Cell: ({ row }) => {
        if (row.original.athlitis) return "Αθλητής";
        if (row.original.melos?.tipo_melous === "eksoteriko") return "Εξωτερικό Μέλος";
        return row.original.sindromitis?.katastasi_sindromis || '-';
      }
    },
    {
      accessorKey: "vathmos", 
      header: "Βαθμός Δυσκολίας",
      Cell: ({ row }) => {
        const vathmos = row.original.melos?.vathmos_diskolias?.epipedo;
        return vathmos ? `Βαθμός ${vathmos}` : "-";
      }
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
            } : {},
            sorting: [{ id: "fullName", desc: false }]
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
      <Box sx={{ mb:  3, border: '1px solid #ddd', borderRadius: 1 }}>
        <DataTable
          data={drastiriotites}
          columns={activityColumns}
          getRowId={(row) => row.id_drastiriotitas || row.id}
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
    
    const activityId = selectedActivityForParticipant.id_drastiriotitas || selectedActivityForParticipant.id;
    
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
    
    // Find the selected member's details
    const selectedMember = availableMembers.find(m => (m.id_es_melous || m.id) === memberId);
    
    if (!selectedMember) {
      alert("Το επιλεγμένο μέλος δεν βρέθηκε");
      return;
    }
    
    const response = await api.post(`/eksormiseis/${id}/simmetoxi`, formattedData);
    
    if (!response.data || !response.data.id_simmetoxis) {
      alert("Δεν ήταν δυνατή η προσθήκη του συμμετέχοντα");
      return;
    }
    
    const participantId = response.data.id_simmetoxis;
    
    // Create new participant object
    const newParticipant = {
      id: participantId,
      id_simmetoxis: participantId,
      id_drastiriotitas: parseInt(activityId),
      id_melous: memberId,
      memberName: `${selectedMember?.melos?.epafes?.epitheto || ''} ${selectedMember?.melos?.epafes?.onoma || ''}`.trim(),
      email: selectedMember?.melos?.epafes?.email || '-',
      tilefono: selectedMember?.melos?.epafes?.tilefono || '-',
      timi: parseFloat(formattedData.timi),
      katastasi: formData.katastasi || "Ενεργή",
      ypoloipo: parseFloat(formattedData.timi), // Initially, the full amount is pending
      plironei: [], // No payments yet
      activities: [{ 
        id_drastiriotitas: activityId,
        titlos: selectedActivityForParticipant.titlos || `Δραστηριότητα #${activityId}`,
        hmerominia: selectedActivityForParticipant.hmerominia
      }],
      simmetoxes: [{
        drastiriotita: {
          titlos: selectedActivityForParticipant.titlos || `Δραστηριότητα #${activityId}`,
          id_drastiriotitas: activityId
        }
      }],
      melos: selectedMember.melos || {
        epafes: {
          onoma: selectedMember?.melos?.epafes?.onoma || '',
          epitheto: selectedMember?.melos?.epafes?.epitheto || '',
          email: selectedMember?.melos?.epafes?.email || '-',
          tilefono: selectedMember?.melos?.epafes?.tilefono || '-'
        }
      }
    };
    
    // Update participants array
    setParticipants(prev => [...prev, newParticipant]);
    
    // Update the drastiriotites array to include this participant
    setDrastiriotites(prev => 
      prev.map(drastiriotita => {
        if (drastiriotita.id_drastiriotitas == activityId || drastiriotita.id == activityId) {
          return {
            ...drastiriotita,
            simmetexontes: [...(drastiriotita.simmetexontes || []), {
              id_simmetoxis: participantId,
              id_melous: memberId,
              memberName: `${selectedMember?.melos?.epafes?.epitheto || ''} ${selectedMember?.melos?.epafes?.onoma || ''}`.trim(),
              email: selectedMember?.melos?.epafes?.email || '-',
              tilefono: selectedMember?.melos?.epafes?.tilefono || '-',
              timi: parseFloat(formattedData.timi),
              katastasi: formData.katastasi || "Ενεργή"
            }]
          };
        }
        return drastiriotita;
      })
    );
    
    // Remove the member from available members
    setAvailableMembers(prev => 
      prev.filter(m => {
        const availableMemberId = String(m.id_es_melous || m.id_ekso_melous || m.id);
        const selectedMemberId = String(selectedMember.id_es_melous || selectedMember.id_ekso_melous || selectedMember.id);
        return availableMemberId !== selectedMemberId;
      })
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
          const id = row.id_drastiriotitas || row.id;
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
          s.drastiriotita?.id_drastiriotitas != deletedActivityId && 
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
      <Box sx={{ 
  p: 3,
  width: '100%',
  // Remove the maxWidth constraint that's shrinking your content
}}>
        <Box sx={{ 
    my: 4,
    // Remove the maxWidth constraint or increase it significantly
    // maxWidth: '2000px' would be better than 1400px if you need a constraint 
  }}>
          {/* Header/Title with back button */}
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

          {/* Two-column layout for main content */}
          <Grid container spacing={3}>
            {/* Left column - Main details */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ mb: 3 }}>
                  {/* First section - Στοιχεία Εξόρμησης */}
                  <Grid container spacing={3}>
                    {/* Left column - Details and Information */}
                    <Grid item xs={12} md={7}>
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
                            <Typography variant="subtitle2" color="text.secondary">Ημερομηνία Άφιξης</Typography>
                            <Typography variant="body1">
                              {eksormisi.hmerominia_afiksis ? formatDateGR(eksormisi.hmerominia_afiksis) : '-'}
                            </Typography>
                          </Grid>
                           <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">Ημερομηνία Αναχώρησης</Typography>
                            <Typography variant="body1">
                              {eksormisi.hmerominia_anaxorisis ? formatDateGR(eksormisi.hmerominia_anaxorisis) : '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Πληροφορίες Εξόρμησης */}
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
                              Math.ceil(( new Date(eksormisi.hmerominia_anaxorisis) - new Date(eksormisi.hmerominia_afiksis) ) / (1000 * 60 * 60 * 24)) + 1 
                              : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Right column - Responsible Person */}
                    <Grid item xs={12} md={5}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" color="primary">Υπεύθυνοι Εξόρμησης</Typography>
                          </Box>
                          <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<AddIcon />} 
                            onClick={() => setResponsiblePersonDialog(true)}
                            size="small"
                          >
                            Προσθήκη
                          </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        
                        {ypefthynoi.length > 0 ? (
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
                                {ypefthynoi.map((ypefthynos) => (
                                  <TableRow key={ypefthynos.id_es_melous}>
                                    <TableCell>
                                      {
                                        ypefthynos.fullName && ypefthynos.fullName !== "Άγνωστο όνομα"
                                          ? ypefthynos.fullName
                                          : (
                                            (ypefthynos.epitheto || ypefthynos.melos?.epafes?.epitheto || '') +
                                            ' ' +
                                            (ypefthynos.onoma || ypefthynos.melos?.epafes?.onoma || '')
                                          ).trim() || '-'
                                      }
                                    </TableCell>
                                    <TableCell>{ypefthynos.email || '-'}</TableCell>
                                    <TableCell>{ypefthynos.tilefono || '-'}</TableCell>
                                    <TableCell align="right">
                              <IconButton 
  size="small" 
  color="error" 
  onClick={() => handleRemoveResponsiblePersonClick(ypefthynos.id_es_melous)}
  disabled={deletingResponsibleId === ypefthynos.id_es_melous}
>
  {deletingResponsibleId === ypefthynos.id_es_melous ? 
    <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
</IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary" align="center">
                            Δεν έχουν οριστεί υπεύθυνοι για την εξόρμηση
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
              
              {/* Activities section below */}
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
                  initialState={{ 
                    columnVisibility: { id_drastiriotitas: false },
                    sorting: [{ id: "hmerominia", desc: false }] // Default sort by date
                  }}
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
              
              {/* Participants section below */}
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
            </Grid>
            
            {/* Right column - removed the responsible person section from here */}
              {/* Any additional content for the right side if needed */}
          </Grid>
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
                            { accessorKey: "hmerominia_afiksis", header: "Ημερομηνία Άφιξης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") },

              { accessorKey: "hmerominia_anaxorisis", header: "Ημερομηνία Αναχώρησης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") }
            ]}
          />
        )}
        
{/* Responsible Person Deletion Confirmation Dialog */}
<Dialog
  open={openDeleteResponsibleDialog}
  onClose={() => setOpenDeleteResponsibleDialog(false)}
>
  <DialogTitle>Διαγραφή Υπεύθυνου</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Είστε σίγουροι ότι θέλετε να αφαιρέσετε τον υπεύθυνο;
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDeleteResponsibleDialog(false)}>Άκυρο</Button>
    <Button 
      onClick={() => {
        confirmRemoveResponsiblePerson(personToDelete);
        setOpenDeleteResponsibleDialog(false);
      }}
      color="error" 
      autoFocus
    >
      Διαγραφή
    </Button>
  </DialogActions>
</Dialog>


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
              id: member.id_es_melous || member.id_ekso_melous || member.id,
              onoma: member.melos?.epafes?.onoma || "",
              epitheto: member.melos?.epafes?.epitheto || "",
              fullName: `${member.melos?.epafes?.epitheto || ''} ${member.melos?.epafes?.onoma || ''}`.trim(),
              // Update status to correctly identify external members
              status: member.athlitis ? "Αθλητής" : 
       (member.melos?.tipo_melous === "eksoteriko" ? "Εξωτερικό Μέλος" : 
       member.sindromitis?.katastasi_sindromis || '-'),
           vathmos: member.melos?.vathmos_diskolias?.epipedo ? 
             `Βαθμός ${member.melos.vathmos_diskolias.epipedo}` : "-"
            })),
            drastiriotitesList: drastiriotites.map(dr => {
              // Enhanced difficulty level extraction
              let vathmosDisplay = "-";
              if (dr.vathmou_diskolias?.epipedo) {
                vathmosDisplay = `Βαθμός ${dr.vathmou_diskolias.epipedo}`;
              } else if (dr.id_vathmou_diskolias) {
                vathmosDisplay = `Βαθμος ${dr.id_vathmou_diskolias}`;
              }
              
              // Convert ID to string to ensure consistent format with currentParticipant.activities
              return {
                id: String(dr.id_drastiriotitas || dr.id), // Convert ID to string explicitly
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
    handleEditSave={(updatedValues) => {
      // Add the IDs from currentParticipant before saving
      handleEditParticipantSave({
        ...updatedValues,
        id_simmetoxis: currentParticipant.id_simmetoxis,
        id_melous: currentParticipant.id_melous
      });
    }}
    editValues={currentParticipant}
    title="Επεξεργασία Συμμετέχοντα"
    fields={[
      // Removed the hidden ID fields
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
        ],
        validation: yup.array()
          .min(1, "Πρέπει να επιλεχθεί τουλάχιστον μία δραστηριότητα")
          .required("Πρέπει να επιλεχθεί τουλάχιστον μία δραστηριότητα")
      }
    ]}
    customValidation={(formData) => {
      // Any custom validation logic remains unchanged
      return true;
    }}
    resourceData={{
      drastiriotitesList: drastiriotites.map(dr => {
        // Determine display format for difficulty level
        let vathmosDisplay = "-";
        if (dr.vathmos_diskolias?.epipedo) {
          vathmosDisplay = `Βαθμός ${dr.vathmos_diskolias.epipedo}`;
        } else if (dr.vathmou_diskolias?.epipedo) {
          vathmosDisplay = `Βαθμός ${dr.vathmou_diskolias.epipedo}`;
        } else if (dr.id_vathmou_diskolias) {
          vathmosDisplay = `Βαθμός ${dr.id_vathmou_diskolias}`;
        }
        
        // Convert ID to string to ensure consistent format with currentParticipant.activities
        return {
          id: String(dr.id_drastiriotitas || dr.id), // Convert ID to string explicitly
          titlos: dr.titlos || "Άγνωστη δραστηριότητα",
          hmerominia: dr.hmerominia ? formatDateGR(dr.hmerominia) : "-",
          vathmos_diskolias: vathmosDisplay
        };
      })
    }}
  />
)}
{/* Replace the SelectionDialog with AddDialog similar to participant selection */}
<AddDialog
  open={responsiblePersonDialog}
  onClose={() => setResponsiblePersonDialog(false)}
  handleAddSave={(formData) => {
    // Convert tableSelect result to array of IDs for handleAddResponsiblePersons
    const selectedIds = Array.isArray(formData.id_ypefthynon) 
      ? formData.id_ypefthynon 
      : [formData.id_ypefthynon];
    handleAddResponsiblePersons(selectedIds);
  }}
  title="Επιλογή Υπεύθυνων Εξόρμησης"
  fields={[
    { 
      accessorKey: "id_ypefthynon", 
      header: "Μέλη",
      required: true,
      type: "tableSelect",               
      dataKey: "internalMembersList",           
      multiSelect: true,                
      pageSize: 5,                       
      columns: [                         
        { field: "fullName", header: "Ονοματεπώνυμο" },
        { field: "email", header: "Email" },
        { field: "tilefono", header: "Τηλέφωνο" }
      ],
      searchFields: ["fullName"], 
      noDataMessage: "Δεν βρέθηκαν μέλη",
      validation: yup.array().min(1, "Επιλέξτε τουλάχιστον ένα μέλος").required("Παρακαλώ επιλέξτε μέλη")
    }
  ]}
  resourceData={{
    internalMembersList: internalMembers
      .filter(member => {
        const memberId = member.id_es_melous || member.id;
        return !ypefthynoi.some(y => 
          y.id_ypefthynou === memberId || 
          y.id_es_melous === memberId || 
          y.id === memberId
        );
      })
      .map(member => {
        const onoma = member.onoma || 
                    member.firstName || 
                    member.melos?.epafes?.onoma || 
                    member.epafes?.onoma || '';
                    
        const epitheto = member.epitheto || 
                        member.lastName || 
                        member.melos?.epafes?.epitheto || 
                        member.epafes?.epitheto || '';
        
        const fullName = `${epitheto} ${onoma}`.trim() || member.fullName || "Άγνωστο όνομα";
        
        const email = member.email || 
                    member.melos?.epafes?.email || 
                    member.epafes?.email || '-';
        
        const tilefono = member.tilefono || 
                        member.melos?.epafes?.tilefono || 
                        member.epafes?.tilefono || '-';
        
        return {
          id: member.id_es_melous || member.id,
          fullName,
          email,
          tilefono
        };
      })
  }}
/>

{/* Payment Dialog */}
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

{/* Payment Deletion Confirmation Dialog */}
<Dialog
  open={openDeletePaymentDialog}
  onClose={() => setOpenDeletePaymentDialog(false)}
>
  <DialogTitle>Διαγραφή Πληρωμής</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την πληρωμή;
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDeletePaymentDialog(false)}>Άκυρο</Button>
    <Button 
      onClick={confirmRemovePayment}
      color="error" 
      autoFocus
    >
      Διαγραφή
    </Button>
  </DialogActions>
</Dialog>

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
                  { field: "status", header: "Κατάσταση Συνδρομής" },
                  { field: "vathmos", header: "Βαθμός Δυσκολίας" }
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
                  { value: "Ακυρωμένη", label: "Ακυρωμένη" }
                ],
                defaultValue: "Ενεργή",
                validation: yup.string().required("Το πεδίο είναι υποχρεωτικό")
              }
            ]}
            resourceData={{
              membersList: availableMembers.map(member => ({
                id: member.id_es_melous || member.id_ekso_melous || member.id,
                onoma: member.melos?.epafes?.onoma || "",
                epitheto: member.melos?.epafes?.epitheto || "",
                fullName: `${member.melos?.epafes?.epitheto || ''} ${member.melos?.epafes?.onoma || ''}`.trim(),
                // Update status to correctly identify external members
                status: member.athlitis ? "Αθλητής" : 
                       (member.melos?.tipo_melous === "eksoteriko" ? "Εξωτερικό Μέλος" : 
                       member.sindromitis?.katastasi_sindromis || '-'),
                // Add vathmos (difficulty level) information
                vathmos: member.melos?.vathmos_diskolias?.epipedo ? 
                         `Βαθμός ${member.melos.vathmos_diskolias.epipedo}` : "-"
              }))
            }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
}