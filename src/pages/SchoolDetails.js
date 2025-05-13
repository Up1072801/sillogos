import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Container, Divider, Grid,
  IconButton, Button, TableContainer, Table, 
  TableHead, TableRow, TableCell, TableBody, 
  CircularProgress, Alert, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions
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

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [currentLocations, setCurrentLocations] = useState([]);

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
        console.log("Available members raw data:", membersResponse.data);
        
        // Make sure we're getting valid member objects
        const validMembers = membersResponse.data.filter(member => 
          member && member.id_melous !== undefined && 
          member.melos && member.melos.epafes
        );
        
        // Filter out members who are already participants
        const filteredMembers = validMembers.filter(member => 
          !participants.some(p => p.id_melous === member.id_melous)
        );
        
        console.log("Filtered available members:", filteredMembers);
        setAvailableMembers(filteredMembers);
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
  
  // Handle saving edited school with local state update
const handleEditSchoolSave = async (updatedSchool) => {
  try {
    const formattedSchool = {
      klados: updatedSchool.klados,
      epipedo: updatedSchool.epipedo,
      timi: updatedSchool.timi ? parseInt(updatedSchool.timi) : null,
      etos: updatedSchool.etos ? parseInt(updatedSchool.etos) : null,
      seira: updatedSchool.seira ? parseInt(updatedSchool.seira) : null
    };
    
    const response = await axios.put(`http://localhost:5000/api/sxoles/${id}`, formattedSchool);
    
    // Άμεση ενημέρωση του state σχολής
    setSchool(prevSchool => ({
      ...prevSchool,
      ...formattedSchool
    }));
    
    setEditSchoolDialog(false);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία σχολής:", error);
    alert("Σφάλμα κατά την επεξεργασία: " + error.message);
  }
};

  // ========== LOCATION MANAGEMENT HANDLERS ==========

  // Handle editing locations (opens dialog with all locations)
  const handleEditLocations = () => {
    const locations = parseLocations().map(loc => ({
      id: loc.id,
      topothesia: loc.topothesia || "",
      start: loc.start || "",
      end: loc.end || ""
    }));
    
    setCurrentLocations(locations);
    setLocationDialogOpen(true);
  };

  // Handle saving locations with local state update
const handleSaveLocations = async (locations) => {
  try {
    // Μορφοποίηση τοποθεσιών για το API (χωρίς τα ID που ήταν μόνο για το frontend)
    const formattedLocations = locations.map(loc => ({
      topothesia: loc.topothesia,
      start: loc.start,
      end: loc.end
    }));
    
    // Δημιουργούμε το αντικείμενο ενημέρωσης διατηρώντας τις υπάρχουσες τιμές
    const updateData = {
      klados: school.klados,
      epipedo: school.epipedo,
      timi: school.timi,
      etos: school.etos,
      seira: school.seira,
      // Αποθήκευση των τοποθεσιών
      topothesies: formattedLocations
    };
    
    // Αποστολή στο API
    await axios.put(`http://localhost:5000/api/sxoles/${id}`, updateData);
    
    // Άμεση ενημέρωση του state
    setSchool(prevSchool => ({
      ...prevSchool,
      topothesies: formattedLocations
    }));
    
    // Κλείσιμο του διαλόγου
    setLocationDialogOpen(false);
  } catch (error) {
    console.error("Σφάλμα κατά την αποθήκευση τοποθεσιών:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // ========== TEACHER MANAGEMENT HANDLERS ==========
  
  // Handle adding teacher
  const handleAddTeacher = async () => {
    setAddTeacherDialog(true);
  };
  
  // Handle adding teacher with local state update
const handleSaveTeacher = async (selection) => {
  try {
    if (!selection || !selection.id_ekpaideuti || selection.id_ekpaideuti.length === 0) {
      alert("Παρακαλώ επιλέξτε τουλάχιστον έναν εκπαιδευτή");
      return;
    }
    
    // Το id_ekpaideuti τώρα είναι πίνακας
    const selectedTeachers = Array.isArray(selection.id_ekpaideuti) ? 
      selection.id_ekpaideuti : [selection.id_ekpaideuti];
    
    console.log("Προσθήκη εκπαιδευτών:", selectedTeachers);
    
    // Συλλογή των πλήρων δεδομένων των επιλεγμένων εκπαιδευτών
    const teachersToAdd = [];
    
    // Προσθέτουμε κάθε επιλεγμένο εκπαιδευτή
    for (const teacherId of selectedTeachers) {
      const response = await axios.post(`http://localhost:5000/api/sxoles/${id}/ekpaideutis`, {
        id_ekpaideuti: teacherId
      });
      
      // Βρίσκουμε τα πλήρη δεδομένα του εκπαιδευτή από τη λίστα διαθέσιμων
      const teacherDetails = availableTeachers.find(t => 
        (t.id_ekpaideuti === teacherId || t.id === teacherId)
      );
      
      if (teacherDetails) {
        teachersToAdd.push({
          id_ekpaideuti: teacherId,
          onoma: teacherDetails.onoma,
          epitheto: teacherDetails.epitheto,
          email: teacherDetails.email,
          tilefono: teacherDetails.tilefono
        });
      }
    }
    
    // Άμεση ενημέρωση του state
    setSchool(prevSchool => ({
      ...prevSchool,
      ekpaideutes: [...(prevSchool.ekpaideutes || []), ...teachersToAdd]
    }));
    
    // Ενημέρωση των διαθέσιμων εκπαιδευτών
    setAvailableTeachers(prevTeachers => 
      prevTeachers.filter(teacher => !selectedTeachers.includes(teacher.id_ekpaideuti))
    );
    
    setAddTeacherDialog(false);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εκπαιδευτή:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Handle deleting teacher with local state update
const handleDeleteTeacher = async (teacherId) => {
  if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε τον εκπαιδευτή;")) {
    return;
  }
  
  try {
    await axios.delete(`http://localhost:5000/api/sxoles/${id}/ekpaideutis/${teacherId}`);
    
    // Εύρεση του εκπαιδευτή που αφαιρέθηκε
    const removedTeacher = school.ekpaideutes.find(t => 
      (t.id_ekpaideuti === teacherId || t.id === teacherId)
    );
    
    // Άμεση ενημέρωση του state σχολής
    setSchool(prevSchool => ({
      ...prevSchool,
      ekpaideutes: prevSchool.ekpaideutes.filter(t => 
        (t.id_ekpaideuti !== teacherId && t.id !== teacherId)
      )
    }));
    
    // Επιστροφή του εκπαιδευτή στη λίστα διαθέσιμων
    if (removedTeacher) {
      setAvailableTeachers(prevTeachers => [...prevTeachers, removedTeacher]);
    }
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση εκπαιδευτή:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // ========== PARTICIPANT MANAGEMENT HANDLERS ==========
  
  // Simplified participant form fields with multiple selection
const participantFormFields = [
  {
    accessorKey: "id_melous",
    header: "Μέλη",
    type: "tableSelect",
    dataKey: "membersList",
    singleSelect: false, // Allow multiple selection
    pageSize: 5,
    columns: [
      { field: "fullName", header: "Ονοματεπώνυμο" },
      { field: "email", header: "Email" },
      { field: "tilefono", header: "Τηλέφωνο" }
    ],
    searchFields: ["fullName", "email", "tilefono"],
    noDataMessage: "Δεν βρέθηκαν διαθέσιμα μέλη",
    validation: yup.array().min(1, "Επιλέξτε τουλάχιστον ένα μέλος")
  }
  // No price and status fields - they'll use defaults
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
  
  // Handle adding participant with local state update
const handleAddParticipant = async (formData) => {
  try {
    // Convert single selection to array if needed
    const memberIds = Array.isArray(formData.id_melous) ? formData.id_melous : [formData.id_melous];
    
    console.log("Adding members:", memberIds);
    
    const addedParticipants = [];
    
    // Add each selected member
    for (const memberId of memberIds) {
      // Use simple API call without extra parameters
      const response = await axios.post(`http://localhost:5000/api/sxoles/${id}/parakolouthisi`, {
        id_melous: parseInt(memberId)
      });
      
      console.log("Added participant:", response.data);
      addedParticipants.push(response.data);
    }
    
    // Update UI with newly added participants
    setParticipants(prevParticipants => [
      ...prevParticipants,
      ...addedParticipants.map(newParticipant => {
        // Find corresponding member data
        const memberDetails = availableMembers.find(m => m.id_melous === newParticipant.id_melous);
        
        return {
          ...newParticipant,
          melos: memberDetails?.melos || {},
          katavalei: [],
          memberName: memberDetails ? 
            `${memberDetails.melos?.epafes?.onoma || ''} ${memberDetails.melos?.epafes?.epitheto || ''}`.trim() : 
            "Άγνωστο μέλος",
          ypoloipo: newParticipant.timi || 0
        };
      })
    ]);
    
    // Remove added members from available list
    setAvailableMembers(prev => 
      prev.filter(member => !memberIds.includes(member.id_melous))
    );
    
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
  
  // Handle editing participant with local state update
const handleEditParticipant = async (updatedParticipant) => {
  try {
    console.log("Editing participant:", updatedParticipant);
    
    // Fix: Use the correct API endpoint that includes the school ID
    await axios.put(`http://localhost:5000/api/sxoles/${id}/parakolouthisi/${updatedParticipant.id_parakolouthisis}`, {
      timi: parseFloat(updatedParticipant.timi),
      katastasi: updatedParticipant.katastasi
    });
    
    // Rest of the function remains the same...
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_parakolouthisis === updatedParticipant.id_parakolouthisis) {
          const totalPaid = (p.katavalei || []).reduce((sum, payment) => sum + (payment.poso || 0), 0);
          const newBalance = Math.max(0, parseFloat(updatedParticipant.timi) - totalPaid);
          
          return {
            ...p,
            timi: parseFloat(updatedParticipant.timi),
            katastasi: updatedParticipant.katastasi,
            ypoloipo: newBalance
          };
        }
        return p;
      })
    );
    
    setEditParticipantDialog(false);
    setCurrentParticipant(null);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία συμμετέχοντα:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Handle removing participant with local state update
const handleRemoveParticipant = async (participantId) => {
  if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτόν τον συμμετέχοντα;")) {
    return;
  }
  
  try {
    await axios.delete(`http://localhost:5000/api/sxoles/${id}/parakolouthisi/${participantId}`);
    
    // Εύρεση του συμμετέχοντα που διαγράφηκε για να τον επιστρέψουμε στα διαθέσιμα μέλη
    const removedParticipant = participants.find(p => p.id_parakolouthisis === participantId);
    
    // Άμεση ενημέρωση της λίστας συμμετεχόντων
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p.id_parakolouthisis !== participantId)
    );
    
    // Επιστροφή του μέλους στη λίστα διαθέσιμων μελών εάν υπάρχουν πλήρη δεδομένα
    if (removedParticipant && removedParticipant.melos) {
      setAvailableMembers(prevMembers => [
        ...prevMembers,
        {
          id_melous: removedParticipant.id_melous,
          melos: removedParticipant.melos
        }
      ]);
    }
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση συμμετέχοντα:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // ========== PAYMENT MANAGEMENT HANDLERS ==========
  
  // Handle opening payment dialog
const handleOpenPaymentDialog = (participant) => {
  console.log("handleOpenPaymentDialog called with:", participant);
  
  try {
    if (!participant) {
      throw new Error("Δεν δόθηκε συμμετέχοντας για προσθήκη πληρωμής");
    }
    
    if (!participant.id_parakolouthisis) {
      const fullParticipant = participants.find(p => 
        (participant.id && p.id_parakolouthisis === participant.id) ||
        (participant.id_melous && p.id_melous === participant.id_melous)
      );
      
      if (fullParticipant) {
        participant = fullParticipant;
      } else {
        throw new Error("Ο συμμετέχοντας δεν έχει έγκυρο ID παρακολούθησης");
      }
    }
    
    // Υπολογισμός πλήρων πληροφοριών πληρωμής (είτε από το participant είτε από τον πίνακα participants)
    const participantData = participants.find(p => p.id_parakolouthisis === participant.id_parakolouthisis) || participant;
    const payments = participantData.katavalei || [];
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
    const totalCost = participantData.timi || school.timi || 0;
    const remainingBalance = Math.max(0, totalCost - totalPaid);
    
    // Δημιουργία ενισχυμένου αντικειμένου με όλες τις πληροφορίες
    const enhancedParticipant = {
      ...participantData,
      id_parakolouthisis: participantData.id_parakolouthisis, // Διασφάλιση ότι υπάρχει
      memberName: participantData.memberName || 
        `${participantData.melos?.epafes?.onoma || ''} ${participantData.melos?.epafes?.epitheto || ''}`.trim() || 
        "Άγνωστο μέλος",
      totalPaid,
      totalCost,
      ypoloipo: remainingBalance
    };
    
    console.log("Προετοιμασία πληρωμής με:", enhancedParticipant);
    setPaymentParticipant(enhancedParticipant);
    setPaymentDialog(true);
  } catch (error) {
    console.error("Σφάλμα κατά το άνοιγμα διαλόγου πληρωμής:", error);
    alert("Σφάλμα: " + error.message);
  }
};
  
  // Handle adding payment with local state update
const handleAddPayment = async (payment) => {
  try {
    if (!paymentParticipant || !paymentParticipant.id_parakolouthisis) {
      alert("Σφάλμα: Δεν υπάρχουν πλήρη δεδομένα συμμετέχοντα");
      return;
    }
    
    // Έλεγχος για έγκυρο ποσό
    const paymentAmount = parseFloat(payment.poso);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Παρακαλώ εισάγετε ένα έγκυρο ποσό πληρωμής");
      return;
    }
    
    // Προετοιμασία δεδομένων πληρωμής
    const paymentData = { 
      poso: paymentAmount,
      hmerominia_katavolhs: payment.hmerominia_katavolhs || new Date().toISOString()
    };
    
    console.log("Αποστολή πληρωμής:", {
      participantId: paymentParticipant.id_parakolouthisis,
      paymentData
    });
    
    // Αποστολή στο API
    const response = await axios.post(
      `http://localhost:5000/api/sxoles/${id}/parakolouthisi/${paymentParticipant.id_parakolouthisis}/payment`, 
      paymentData
    );
    
    // Άμεση ενημέρωση του state αντί για πλήρες refresh
    const newPayment = response.data;
    
    setParticipants(prevParticipants => 
      prevParticipants.map(participant => {
        if (participant.id_parakolouthisis === paymentParticipant.id_parakolouthisis) {
          // Προσθήκη της νέας πληρωμής στη λίστα πληρωμών
          const updatedPayments = [...(participant.katavalei || []), newPayment];
          
          // Υπολογισμός νέου υπολοίπου
          const totalPaid = updatedPayments.reduce((sum, p) => sum + (p.poso || 0), 0);
          const newBalance = Math.max(0, (participant.timi || 0) - totalPaid);
          
          return {
            ...participant,
            katavalei: updatedPayments,
            ypoloipo: newBalance
          };
        }
        return participant;
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
const handleRemovePayment = async (paymentId, participantId) => {
  try {
    // Βεβαιωθείτε ότι έχουμε αριθμητικά IDs
    const numericPaymentId = Number(paymentId);
    const numericParticipantId = Number(participantId);
    
    if (isNaN(numericPaymentId) || numericPaymentId <= 0) {
      throw new Error(`Μη έγκυρο ID πληρωμής (${paymentId})`);
    }
    
    if (isNaN(numericParticipantId) || numericParticipantId <= 0) {
      throw new Error(`Μη έγκυρο ID συμμετέχοντα (${participantId})`);
    }
    
    console.log(`Αποστολή αιτήματος διαγραφής πληρωμής: /api/sxoles/${id}/parakolouthisi/${numericParticipantId}/payment/${numericPaymentId}`);
    
    // Κλήση του API για διαγραφή
    await axios.delete(`http://localhost:5000/api/sxoles/${id}/parakolouthisi/${numericParticipantId}/payment/${numericPaymentId}`);
    
    // Αντί για refreshData();
    setParticipants(prevParticipants => 
      prevParticipants.map(p => 
        p.id_parakolouthisis === participantId ? 
          {...p, katavalei: [...p.katavalei.filter(pay => pay.id !== paymentId)]} : p
      )
    );
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση πληρωμής:", error);
    
    if (error.response?.status === 404) {
      alert("Η πληρωμή δεν βρέθηκε ή έχει ήδη διαγραφεί.");
      refreshData();
    } else {
      alert(`Σφάλμα: ${error.message}`);
    }
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
        // Υπολογισμός υπολοίπου με σταθερό τρόπο
        const payments = row.original.katavalei || [];
        const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
        const totalCost = row.original.timi || school.timi || 0;
        const remainingBalance = Math.max(0, totalCost - totalPaid);
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center', 
            color: remainingBalance > 0 ? 'error.main' : 'success.main',
            fontWeight: 'medium'
          }}>
            <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
            {remainingBalance}€
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
        getData: (row) => {
          // Διασφάλιση ότι όλα τα πληρωμές έχουν τα σωστά IDs
          return (row.katavalei || []).map(payment => ({
            ...payment,
            id: payment.id,
            id_katavalei: payment.id
          }));
        },
        onDelete: (payment, participant) => {
          if (!payment || !participant) return;
          
          if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την πληρωμή;")) {
            return;
          }
          
          const paymentId = payment.id || payment.id_katavalei;
          const participantId = participant.id_parakolouthisis;
          
          if (!paymentId || !participantId) {
            console.error("Missing ID for payment or participant:", { payment, participant });
            return;
          }
          
          handleRemovePayment(paymentId, participantId);
        },
        onAddNew: (parentRow) => {
          if (!parentRow) {
            alert("Δεν βρέθηκε συμμετέχων για προσθήκη πληρωμής.");
            return;
          }
          handleOpenPaymentDialog(parentRow);
        },
        columns: [
          { 
            accessorKey: "poso", 
            header: "Ποσό",
            Cell: ({ row }) => {
              if (!row?.original) return "0€";
              return `${row.original.poso || 0}€`;
            }
          },
          { 
            accessorKey: "hmerominia_katavolhs", 
            header: "Ημερομηνία",
            Cell: ({ row }) => {
              if (!row?.original?.hmerominia_katavolhs) return "-";
              try {
                return new Date(row.original.hmerominia_katavolhs).toLocaleDateString("el-GR");
              } catch (e) {
                return "-";
              }
            }
          }
        ],
        getRowId: (row) => row?.id || row?.id_katavalei || `payment-${Math.random().toString(36).substring(2)}`,
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" color="primary">Τοποθεσίες</Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      startIcon={<EditIcon />}
                      onClick={() => handleEditLocations()}
                      size="small"
                    >
                      Επεξεργασία
                    </Button>
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
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topothesies.map((loc) => (
                            <TableRow key={loc.id}>
                              <TableCell>{loc.topothesia}</TableCell>
                              <TableCell>{loc.start ? new Date(loc.start).toLocaleDateString('el-GR') : '-'}</TableCell>
                              <TableCell>{loc.end ? new Date(loc.end).toLocaleDateString('el-GR') : '-'}</TableCell>
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
              detailPanelConfig={{
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
                    accessor: "katavalei",
                    getData: (row) => (row.katavalei || []).map(payment => ({
                      ...payment,
                      id: payment.id,
                      id_katavalei: payment.id
                    })),
                    columns: [
                      { 
                        accessor: "poso", 
                        header: "Ποσό",
                        Cell: ({ row }) => {
                          if (!row?.original) return "0€";
                          return `${row.original.poso || 0}€`;
                        }
                      },
                      { 
                        accessor: "hmerominia_katavolhs", 
                        header: "Ημερομηνία",
                        Cell: ({ row }) => {
                          if (!row?.original?.hmerominia_katavolhs) return "-";
                          try {
                            return new Date(row.original.hmerominia_katavolhs).toLocaleDateString("el-GR");
                          } catch (e) {
                            return "-";
                          }
                        }
                      }
                    ],
                    onDelete: (payment, participant) => {
                      if (!payment || !participant) return;
                      
                      if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την πληρωμή;")) {
                        return;
                      }
                      
                      const paymentId = payment.id || payment.id_katavalei;
                      const participantId = participant.id_parakolouthisis;
                      
                      if (!paymentId || !participantId) {
                        console.error("Missing ID for payment or participant:", { payment, participant });
                        return;
                      }
                      
                      handleRemovePayment(paymentId, participantId);
                    },
                    onAddNew: (parentRow) => {
                      if (!parentRow) {
                        alert("Δεν βρέθηκε συμμετέχων για προσθήκη πληρωμής.");
                        return;
                      }
                      handleOpenPaymentDialog(parentRow);
                    },
                    getRowId: (row) => row?.id || row?.id_katavalei || `payment-${Math.random().toString(36).substring(2)}`,
                    emptyMessage: "Δεν υπάρχουν καταχωρημένες πληρωμές"
                  }
                ]
              }}
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
        
        <AddDialog
          open={addParticipantDialog}
          onClose={() => setAddParticipantDialog(false)}
          handleAddSave={handleAddParticipant}
          title="Προσθήκη Συμμετέχοντα"
          fields={participantFormFields}
          resourceData={{
            membersList: availableMembers.map(member => ({
              id: member.id_melous || member.id,
              fullName: `${member.melos?.epafes?.onoma || ""} ${member.melos?.epafes?.epitheto || ""}`.trim(),
              email: member.melos?.epafes?.email || "",
              tilefono: member.melos?.epafes?.tilefono || ""
            }))
          }}
          initialValues={{ id_melous: [] }}
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
            additionalInfo={
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Σύνολο κόστους: {paymentParticipant.totalCost || 0}€</Typography>
                <Typography variant="subtitle2" color="text.secondary">Καταβληθέν ποσό: {paymentParticipant.totalPaid || 0}€</Typography>
                <Typography variant="subtitle1" color={paymentParticipant.ypoloipo > 0 ? "error" : "success"} fontWeight="bold">
                  Υπόλοιπο: {paymentParticipant.ypoloipo || 0}€
                </Typography>
              </Box>
            }
            fields={paymentFormFields}
          />
        )}
        
        <AddDialog
          open={addTeacherDialog}
          onClose={() => setAddTeacherDialog(false)}
          handleAddSave={handleSaveTeacher}
          title="Προσθήκη Εκπαιδευτών"
          fields={[
            { 
              accessorKey: "id_ekpaideuti", 
              header: "Εκπαιδευτές", 
              type: "tableSelect",
              dataKey: "teachersList", // Αυτό το κλειδί θα χρησιμοποιηθεί στο resourceData
              singleSelect: false, // Επιτρέπει πολλαπλή επιλογή
              pageSize: 5, // 5 εκπαιδευτές ανά σελίδα
              columns: [
                { field: "fullName", header: "Ονοματεπώνυμο" },
                { field: "email", header: "Email" },
                { field: "phone", header: "Τηλέφωνο" },
                { field: "epipedo", header: "Επίπεδο" },
                { field: "klados", header: "Κλάδος" }
              ],
              searchFields: ["fullName", "email", "phone", "epipedo", "klados"], // Πεδία για αναζήτηση
              noDataMessage: "Δεν βρέθηκαν διαθέσιμοι εκπαιδευτές"
            }
          ]}
          resourceData={{
            teachersList: availableTeachers
              .filter(teacher => !school.ekpaideutes?.some(t => 
                (t.id_ekpaideuti || t.id) === (teacher.id_ekpaideuti || teacher.id)))
              .map(teacher => ({
                id: teacher.id_ekpaideuti || teacher.id,
                fullName: `${teacher.onoma || ""} ${teacher.epitheto || ""}`.trim(),
                email: teacher.email || "",
                phone: teacher.tilefono || teacher.phone || "",
                epipedo: teacher.epipedo || "",
                klados: teacher.klados || ""
              }))
          }}
          initialValues={{
            id_ekpaideuti: [] // Αρχικοποίηση με κενό πίνακα για τις πολλαπλές επιλογές
          }}
        />
      </Container>

      {/* Διάλογος για διαχείριση τοποθεσιών */}
      <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Διαχείριση Τοποθεσιών</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            {/* Λίστα τοποθεσιών */}
            {currentLocations.length > 0 ? (
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Τοποθεσία</TableCell>
                      <TableCell>Ημ/νία Έναρξης</TableCell>
                      <TableCell>Ημ/νία Λήξης</TableCell>
                      <TableCell>Ενέργειες</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentLocations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={loc.topothesia}
                            onChange={(e) => {
                              const updated = currentLocations.map(item => 
                                item.id === loc.id ? { ...item, topothesia: e.target.value } : item
                              );
                              setCurrentLocations(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={loc.start}
                            onChange={(e) => {
                              const updated = currentLocations.map(item => 
                                item.id === loc.id ? { ...item, start: e.target.value } : item
                              );
                              setCurrentLocations(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={loc.end}
                            onChange={(e) => {
                              const updated = currentLocations.map(item => 
                                item.id === loc.id ? { ...item, end: e.target.value } : item
                              );
                              setCurrentLocations(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => {
                            const updated = currentLocations.filter(item => item.id !== loc.id);
                            setCurrentLocations(updated);
                          }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Δεν έχουν προστεθεί τοποθεσίες.
              </Typography>
            )}
            
            {/* Φόρμα προσθήκης */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
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
                    onClick={() => {
                      if (!newLocation.topothesia || !newLocation.start || !newLocation.end) {
                        alert("Συμπληρώστε όλα τα πεδία");
                        return;
                      }
                      const newLoc = { ...newLocation, id: Date.now() };
                      setCurrentLocations([...currentLocations, newLoc]);
                      setNewLocation({ topothesia: "", start: "", end: "" });
                    }}
                  >
                    Προσθήκη
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>Άκυρο</Button>
          <Button onClick={() => handleSaveLocations(currentLocations)} variant="contained" color="primary">
            Αποθήκευση
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}