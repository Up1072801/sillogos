import React, { useState, useEffect } from "react";
import api from '../utils/api';
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Container, Divider, Grid,
  IconButton, Button, TableContainer, Table, 
  TableHead, TableRow, TableCell, TableBody, 
  CircularProgress, Alert, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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

import LocationEditor from "../components/LocationEditor"; // Import the new LocationEditor component

export default function SchoolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [school, setSchool] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  // Dialog states
  const [paymentToDelete, setPaymentToDelete] = useState(null);
const [deletePaymentDialog, setDeletePaymentDialog] = useState(false);
  const [editSchoolDialog, setEditSchoolDialog] = useState(false);
  const [editedSchool, setEditedSchool] = useState(null);
  const [addParticipantDialog, setAddParticipantDialog] = useState(false);
  const [editParticipantDialog, setEditParticipantDialog] = useState(false);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentParticipant, setPaymentParticipant] = useState(null);
  // Add these state variables with your other state declarations
const [deleteTeacherDialog, setDeleteTeacherDialog] = useState(false);
const [teacherToDelete, setTeacherToDelete] = useState(null);
  // Locations management - όπως στο sxoles.js
  const [newLocation, setNewLocation] = useState({ topothesia: "", start: "", end: "" });
  const [editLocationDialog, setEditLocationDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Teacher management
  const [addTeacherDialog, setAddTeacherDialog] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [currentLocations, setCurrentLocations] = useState([]);
const [paymentToEdit, setPaymentToEdit] = useState(null);
const [editPaymentDialog, setEditPaymentDialog] = useState(false);
  // Refresh data function
  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  // Fetch data on component mount and when refresh is triggered
  useEffect(() => {
    fetchData();
  }, [id, refreshTrigger]);

  // Main data fetching function
  // Ενημερωμένη συνάρτηση fetch για τα διαθέσιμα μέλη
const fetchData = async () => {
  try {
    setLoading(true);
    
    if (!id) {
      setError("Δεν δόθηκε ID σχολής");
      setLoading(false);
      return;
    }
    
    // Fetch school details
    const response = await api.get(`/sxoles/${id}`);
    setSchool(response.data);
    
    // Fetch participants
    try {
      const participantsResponse = await api.get(`/sxoles/${id}/parakolouthisi`);
      // Επεξεργασία δεδομένων συμμετεχόντων πριν την αποθήκευση
      const processedParticipants = participantsResponse.data.map(participant => {
        // Δημιουργία ονοματεπώνυμου από τα δεδομένα της επαφής
        const firstName = participant.melos?.epafes?.onoma || '';
        const lastName = participant.melos?.epafes?.epitheto || '';
        
        // Υπολογισμός υπολοίπου με σταθερό τρόπο
        const payments = participant.katavalei || [];
        const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
        const totalCost = participant.timi || school.timi || 0;
        const remainingBalance = Math.max(0, totalCost - totalPaid);
        
        return {
          ...participant,
          memberName: `${lastName} ${firstName}`.trim() || "Άγνωστο όνομα",
          // Βεβαιωνόμαστε ότι το υπόλοιπο είναι διαθέσιμο
          ypoloipo: remainingBalance
        };
      });
      
      setParticipants(processedParticipants);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης συμμετεχόντων:", err);
    }
    
    // Fetch available members - ΔΙΟΡΘΩΣΗ εδώ
    try {
      // Φόρτωση διαθέσιμων μελών - διορθωμένος κώδικας
try {
  // Πρώτα φέρνουμε τα participants για να έχουμε τα σωστά IDs
  const participantsResponse = await api.get(`/sxoles/${id}/parakolouthisi`);
  const existingParticipants = participantsResponse.data || [];
  
  // Φέρνουμε όλα τα μέλη (εσωτερικά και εξωτερικά) - ΑΛΛΑΓΗ ΕΔΩ
  const membersResponse = await api.get("/melitousillogou/all");
  
  // Δημιουργία Set με τα IDs των μελών που είναι ήδη συμμετέχοντες (String μορφή)
  const existingMemberIds = new Set(
    existingParticipants.map(p => String(p.id_melous))
  );
  
  
  // Φιλτράρουμε για να πάρουμε μόνο τα μέλη που ΔΕΝ είναι ήδη συμμετέχοντες
  const filteredMembers = membersResponse.data.filter(member => {
    // Αν το μέλος δεν έχει ID, το παραλείπουμε
    if (!member.id_melous && !member.id_es_melous && !member.id_ekso_melous && !member.id) {
      return false;
    }
    
    // Χρησιμοποιούμε οποιοδήποτε ID είναι διαθέσιμο (μετατροπή σε String)
    const memberId = String(member.id_melous || member.id_es_melous || member.id_ekso_melous || member.id);
    
    // Το κρατάμε αν ΔΕΝ υπάρχει ήδη στους συμμετέχοντες
    return !existingMemberIds.has(memberId);
  });
  
  
  setAvailableMembers(filteredMembers);
  
  // Επίσης ενημερώνουμε τους συμμετέχοντες εδώ
  setParticipants(participantsResponse.data.map(participant => {
    // Δημιουργία ονοματεπώνυμου από τα δεδομένα της επαφής
    const firstName = participant.melos?.epafes?.onoma || '';
    const lastName = participant.melos?.epafes?.epitheto || '';
    
    // Υπολογισμός υπολοίπου με σταθερό τρόπο
    const payments = participant.katavalei || [];
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
    const totalCost = participant.timi || (school?.timi) || 0;
    const remainingBalance = Math.max(0, totalCost - totalPaid);
    
    return {
      ...participant,
      memberName: `${lastName} ${firstName}`.trim() || "Άγνωστο όνομα",
      // Βεβαιωνόμαστε ότι το υπόλοιπο είναι διαθέσιμο
      ypoloipo: remainingBalance
    };
  }));
} catch (err) {
  console.error("Σφάλμα φόρτωσης μελών:", err);
}
    } catch (err) {
      console.error("Σφάλμα φόρτωσης μελών:", err);
    }
    
    // Fetch available teachers - ΠΡΟΣΘΗΚΗ ΑΥΤΟΥ ΤΟΥ ΚΩΔΙΚΑ
    try {
      // Αλλάζουμε το endpoint από /ekpaideutis σε /Repafes/ekpaideutes-me-sxoles
      const teachersResponse = await api.get("/Repafes/ekpaideutes-me-sxoles"); // ΣΩΣΤΟ endpoint όπως στο sxoles.js
      
      // Φιλτράρουμε για να πάρουμε μόνο τους εκπαιδευτές που ΔΕΝ διδάσκουν ήδη στη σχολή
      const currentTeacherIds = response.data.ekpaideutes ? 
        response.data.ekpaideutes.map(t => t.id_ekpaideuti || t.id) : [];
      
      const availableTeachersList = teachersResponse.data.filter(teacher => 
        !currentTeacherIds.includes(teacher.id_ekpaideuti || teacher.id)
      );
      
      setAvailableTeachers(availableTeachersList);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης εκπαιδευτών:", err);
    }
    
    setLoading(false);
  } catch (error) {
    console.error("Σφάλμα κατά τη φόρτωσης των δεδομένων:", error);
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
  
  // Handle editing payment with local state update
const handleEditPayment = async (updatedPayment) => {
  try {
    if (!paymentToEdit) {
      alert("Σφάλμα: Δεν βρέθηκε πληρωμή για επεξεργασία.");
      return;
    }

    const { paymentId, participantId } = paymentToEdit;
    
    if (!paymentId || !participantId) {
      alert("Σφάλμα: Δεν βρέθηκαν έγκυρα IDs πληρωμής ή συμμετέχοντα.");
      return;
    }

    // Prepare payment data
    const formattedPayment = {
      poso: parseInt(updatedPayment.poso),
      hmerominia_katavolhs: updatedPayment.hmerominia_katavolhs || new Date().toISOString().split('T')[0]
    };

    // Send to API
    const response = await api.put(
      `/sxoles/${id}/parakolouthisi/${participantId}/payment/${paymentId}`, 
      formattedPayment
    );

    // Update local state
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_parakolouthisis === participantId) {
          const updatedPayments = p.katavalei.map(pay => {
            if (pay.id === paymentId || pay.id_katavalei === paymentId) {
              return {
                ...pay,
                poso: formattedPayment.poso,
                hmerominia_katavolhs: formattedPayment.hmerominia_katavolhs
              };
            }
            return pay;
          });
          
          const totalPaid = updatedPayments.reduce((sum, pay) => sum + (pay.poso || 0), 0);
          const ypoloipo = Math.max(0, (p.timi || 0) - totalPaid);
          
          return {
            ...p,
            katavalei: updatedPayments,
            ypoloipo: ypoloipo
          };
        }
        return p;
      })
    );

    // Close the dialog
    setEditPaymentDialog(false);
    setPaymentToEdit(null);
  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία πληρωμής:", error);
    alert(`Σφάλμα: ${error.message}`);
  }
};

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
    
    const response = await api.put(`/sxoles/${id}`, formattedSchool);
    
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
    // Format locations for API
    const formattedLocations = locations.map(loc => ({
      topothesia: loc.topothesia,
      start: loc.start, // Keep ISO format for API
      end: loc.end // Keep ISO format for API
    }));
    
    const updateData = {
      klados: school.klados,
      epipedo: school.epipedo,
      timi: school.timi,
      etos: school.etos,
      seira: school.seira,
      topothesies: formattedLocations
    };
    
    // Send to API
    await api.put(`/sxoles/${id}`, updateData);
    
    // Update local state with formatted display data
    setSchool(prevSchool => ({
      ...prevSchool,
      topothesies: formattedLocations
    }));
    
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
    
    const selectedTeachers = Array.isArray(selection.id_ekpaideuti) ? 
      selection.id_ekpaideuti : [selection.id_ekpaideuti];
    
    const teachersToAdd = [];
    const failedTeachers = [];
    
    // Process each teacher selection in a loop
    for (const teacherId of selectedTeachers) {
      try {
        // First, find the teacher details from available teachers BEFORE the API call
        const teacherDetails = availableTeachers.find(t => 
          String(t.id_ekpaideuti) === String(teacherId) || String(t.id) === String(teacherId)
        );
        
        if (!teacherDetails) {
          console.error(`Teacher with ID ${teacherId} not found in available teachers`);
          failedTeachers.push(teacherId);
          continue;
        }
        
        // Build a complete teacher object
        const completeTeacher = {
          id_ekpaideuti: teacherId,
          id: teacherId,
          onoma: teacherDetails.onoma || teacherDetails.firstName || "",
          epitheto: teacherDetails.epitheto || teacherDetails.lastName || "",
          firstName: teacherDetails.onoma || teacherDetails.firstName || "",
          lastName: teacherDetails.epitheto || teacherDetails.lastName || "",
          email: teacherDetails.email || "",
          tilefono: teacherDetails.tilefono || teacherDetails.phone || "",
          phone: teacherDetails.tilefono || teacherDetails.phone || "",
          epipedo: teacherDetails.epipedo || "",
          klados: teacherDetails.klados || ""
        };
        
        // Make the API call to associate the teacher with the school
        await api.post(`/sxoles/${id}/ekpaideutis`, {
          id_ekpaideuti: teacherId
        });
        
        // If successful, add to our local list
        teachersToAdd.push(completeTeacher);
      } catch (error) {
        console.error(`Error adding teacher with ID ${teacherId}:`, error);
        failedTeachers.push(teacherId);
      }
    }
    
    // Ενημέρωση UI και ειδοποίηση χρήστη
    if (teachersToAdd.length > 0) {
      // Update school state first with new teachers
      setSchool(prevSchool => ({
        ...prevSchool,
        ekpaideutes: [
          ...(prevSchool.ekpaideutes || []), 
          ...teachersToAdd
        ]
      }));
      
      // Then remove those teachers from the available list
      setAvailableTeachers(prevTeachers => 
        prevTeachers.filter(teacher => {
          const teacherId = teacher.id_ekpaideuti || teacher.id;
          return !teachersToAdd.some(added => 
            String(added.id_ekpaideuti) === String(teacherId) || String(added.id) === String(teacherId)
          );
        })
      );
      
      // Removed success alerts from here
    } else if (failedTeachers.length > 0) {
      // Only show alert if there were failures
      alert("Δεν ήταν δυνατή η προσθήκη των εκπαιδευτών. Παρακαλώ δοκιμάστε ξανά.");
    }
    
    setAddTeacherDialog(false);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εκπαιδευτή:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Handle deleting teacher with local state update
const handleDeleteTeacher = async (teacherId) => {
  const teacherIdStr = String(teacherId);
  
  // First, find the complete teacher object BEFORE removal
  const removedTeacher = school.ekpaideutes.find(t => 
    String(t.id_ekpaideuti) === teacherIdStr || String(t.id) === teacherIdStr
  );
  
  if (!removedTeacher) {
    console.error(`Teacher with ID ${teacherId} not found in school's teachers`);
    return;
  }

  setTeacherToDelete({
    id: teacherId,
    name: `${removedTeacher.onoma || removedTeacher.firstName || ""} ${removedTeacher.epitheto || removedTeacher.lastName || ""}`.trim()
  });
  setDeleteTeacherDialog(true);
};

// Add this new function to handle the actual deletion after confirmation
const handleConfirmTeacherDelete = async () => {
  try {
    if (!teacherToDelete) return;
    
    const teacherId = teacherToDelete.id;
    const teacherIdStr = String(teacherId);
    
    // Find the teacher object again
    const removedTeacher = school.ekpaideutes.find(t => 
      String(t.id_ekpaideuti) === teacherIdStr || String(t.id) === teacherIdStr
    );
    
    // Build a complete teacher object for the available teachers list
    const teacherToAdd = {
      id_ekpaideuti: teacherId,
      id: teacherId,
      onoma: removedTeacher.onoma || removedTeacher.firstName || "",
      epitheto: removedTeacher.epitheto || removedTeacher.lastName || "",
      firstName: removedTeacher.onoma || removedTeacher.firstName || "",
      lastName: removedTeacher.epitheto || removedTeacher.lastName || "",
      email: removedTeacher.email || "",
      tilefono: removedTeacher.tilefono || removedTeacher.phone || "",
      phone: removedTeacher.tilefono || removedTeacher.phone || "",
      epipedo: removedTeacher.epipedo || "",
      klados: removedTeacher.klados || ""
    };
    
    // Make API call to remove teacher
    await api.delete(`/sxoles/${id}/ekpaideutis/${teacherId}`);
    
    // Update local state - FIRST remove from school's teachers
    setSchool(prevSchool => ({
      ...prevSchool,
      ekpaideutes: prevSchool.ekpaideutes.filter(t => {
        // Κρατάμε αυτούς που ΚΑΝΕΝΑ από τα IDs τους δεν ταιριάζει με αυτό που αφαιρούμε
        return String(t.id_ekpaideuti) !== teacherIdStr && String(t.id) !== teacherIdStr;
      })
    }));
    
    // THEN add to available teachers if not already there
    setAvailableTeachers(prevTeachers => {
      const alreadyExists = prevTeachers.some(t => 
        String(t.id_ekpaideuti) === teacherIdStr || String(t.id) === teacherIdStr
      );
      
      if (alreadyExists) {
        return prevTeachers;
      } else {
        return [...prevTeachers, teacherToAdd];
      }
    });
    
    setDeleteTeacherDialog(false);
    setTeacherToDelete(null);
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση εκπαιδευτή:", error);
    alert("Σφάλμα: " + error.message);
    setDeleteTeacherDialog(false);
    setTeacherToDelete(null);
  }
};

  // ========== PARTICIPANT MANAGEMENT HANDLERS ==========
  
  // Ενημερωμένο participantFormFields για καλύτερη εμφάνιση
// ...existing code...
  // Ενημερωμένο participantFormFields για καλύτερη εμφάνιση
const participantFormFields = [
  { 
    accessorKey: "id_melous", 
    header: "Μέλη",
    type: "tableSelect",
    dataKey: "membersList",
    singleSelect: false, // Αλλαγή σε false για πολλαπλή επιλογή
    pageSize: 10,
    columns: [
      { field: "fullName", header: "Ονοματεπώνυμο" },
      { field: "status", header: "Κατάσταση" },
    ],
    searchFields: ["fullName", "email", "tilefono"],
    initialSort: [{ id: "fullName", desc: false }], // Ταξινόμηση κατά επώνυμο
    noDataMessage: "Δεν βρέθηκαν διαθέσιμα μέλη",
    validation: yup.mixed().required("Παρακαλώ επιλέξτε τουλάχιστον ένα μέλος")
  },
  { 
    accessorKey: "timi", 
    header: "Τιμή", 
    type: "number",
    defaultValue: school?.timi || 0,
    validation: yup.number().min(0, "Η τιμή δεν μπορεί να είναι αρνητική").required("Η τιμή είναι υποχρεωτική") 
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
  
  // Handle adding participant with local state update
const handleAddParticipant = async (formData) => {
  try {
    // Αποδοχή είτε μονό ID είτε πίνακα IDs
    const memberIds = Array.isArray(formData.id_melous) ? formData.id_melous : [formData.id_melous];
    
    if (memberIds.length === 0) {
      alert("Παρακαλώ επιλέξτε τουλάχιστον ένα μέλος");
      return;
    }
    
    
    const addedParticipants = [];
    
    // Για κάθε επιλεγμένο μέλος
    for (const memberId of memberIds) {
      try {
        const response = await api.post(`/sxoles/${id}/parakolouthisi`, {
          id_melous: parseInt(memberId),
          timi: formData.timi,
          katastasi: formData.katastasi || "Ενεργή"
        });
        
        
        // Βρίσκουμε τα πλήρη στοιχεία του μέλους
        const memberDetails = availableMembers.find(m => 
          String(m.id_melous) === String(memberId) ||
          String(m.id_es_melous) === String(memberId) ||
          String(m.id_ekso_melous) === String(memberId) ||
          String(m.id) === String(memberId)
        );
        
        // Δημιουργούμε το αντικείμενο συμμετέχοντα
        const newParticipant = {
          ...response.data,
          id_parakolouthisis: response.data.id || response.data.id_parakolouthisis,
          melos: memberDetails?.melos || {},
          katavalei: [],
          memberName: memberDetails ? 
            `${memberDetails.melos?.epafes?.epitheto || memberDetails.epitheto || ''} ${memberDetails.melos?.epafes?.onoma || memberDetails.onoma || ''}`.trim() : 
            "Άγνωστο μέλος",
          ypoloipo: formData.timi || school.timi || 0,
          hmerominia_dilosis: response.data.hmerominia_dilosis || new Date().toISOString()
        };
        
        addedParticipants.push(newParticipant);
      } catch (error) {
        console.error(`Σφάλμα προσθήκης μέλους με ID ${memberId}:`, error);
      }
    }
    
    // Ενημέρωση της λίστας συμμετεχόντων
    if (addedParticipants.length > 0) {
      setParticipants(prevParticipants => [...prevParticipants, ...addedParticipants]);
      
      // Αφαιρούμε τα μέλη που προστέθηκαν από τη λίστα διαθέσιμων (διορθωμένο)
      setAvailableMembers(prev => 
        prev.filter(member => {
          const memberIdStr = String(member.id_melous || member.id_es_melous || member.id_ekso_melous || member.id);
          return !memberIds.some(id => String(id) === memberIdStr);
        })
      );
    } else {
      alert("Δεν προστέθηκαν συμμετέχοντες");
    }
    
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
      katastasi: participant.katastasi || "Ενεργή",
      hmerominia_dilosis: formatDateForInput(participant.hmerominia_dilosis)
    });
    setEditParticipantDialog(true);
  };
  
  // Handle editing participant with local state update
const handleEditParticipant = async (updatedParticipant) => {
  try {
    if (!updatedParticipant || !updatedParticipant.id_parakolouthisis) {
      alert("Λείπει το ID συμμετέχοντα!");
      return;
    }
    
    
    // Μετατροπή των δεδομένων σε σωστή μορφή
    const participantData = {
      timi: parseFloat(updatedParticipant.timi),
      katastasi: updatedParticipant.katastasi || "Ενεργή"
    };
    
    // Κλήση στο API - διορθωμένο URL
    const response = await api.put(
      `/sxoles/${id}/parakolouthisi/${updatedParticipant.id_parakolouthisis}`,
      participantData
    );
    
    
    // Ενημέρωση του τοπικού state
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_parakolouthisis === updatedParticipant.id_parakolouthisis) {
          // Υπολογισμός νέου υπολοίπου
          const payments = (p.katavalei || []);
          const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
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
    alert("Σφάλμα: " + (error.response?.data?.error || error.message));
  }
};

  // Handle removing participant with local state update
const handleRemoveParticipant = async (participantOrId) => {
  try {
    // Εξαγωγή ID συμμετέχοντα είτε από αντικείμενο είτε απευθείας
    const participantId = typeof participantOrId === 'object' && participantOrId !== null
      ? participantOrId.id_parakolouthisis
      : participantOrId;
    
    if (!participantId && participantId !== 0) {
      throw new Error("Δεν ήταν δυνατή η εύρεση ID συμμετέχοντα");
    }
    
    await api.delete(`/sxoles/${id}/parakolouthisi/${participantId}`);
    
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p.id_parakolouthisis !== participantId)
    );
    
    // Success alert removed
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση συμμετέχοντα:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // ========== PAYMENT MANAGEMENT HANDLERS ==========
  
  // Handle opening payment dialog - ΔΙΟΡΘΩΜΕΝΗ ΕΚΔΟΣΗ (όπως στο EksormisiDetails.js)
const handleOpenPaymentDialog = (participantOrId) => {
  
  // Αν είναι ID και όχι αντικείμενο, βρίσκουμε τον συμμετέχοντα
  let participant;
  let participantId;
  
  if (typeof participantOrId === 'object' && participantOrId !== null) {
    participant = participantOrId;
    participantId = participantOrId.id_parakolouthisis || participantOrId.id;
  } else {
    // Αναζήτηση με βάση το ID
    participantId = participantOrId;
    participant = participants.find(p => 
      p.id_parakolouthisis == participantId || p.id == participantId
    );
  }
  
  if (!participant) {
    console.error("Could not find participant:", participantOrId);
    alert("Σφάλμα: Δεν βρέθηκε ο συμμετέχων.");
    return;
  }
  
  // Διασφάλιση ότι έχουμε το σωστό id_parakolouthisis
  if (!participant.id_parakolouthisis && participantId) {
    participant = { ...participant, id_parakolouthisis: participantId };
  }
  
  
  // Υπολογισμός συνολικού κόστους και πληρωμών
  const totalCost = participant.timi || 0;
  const payments = participant.katavalei || [];
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
  const ypoloipo = Math.max(0, totalCost - totalPaid);
  
  // Προετοιμασία αντικειμένου για το dialog
  const paymentInfo = {
    ...participant,
    totalCost,
    totalPaid,
    ypoloipo,
    memberName: participant.memberName || 
      `${participant.melos?.epafes?.epitheto || ''} ${participant.melos?.epafes?.onoma || ''}`.trim() || 
      "Άγνωστο όνομα"
  };
  
  setPaymentParticipant(paymentInfo);
  setPaymentDialog(true);
}
  
  // Handle adding payment with local state update
const handleAddPayment = async (payment) => {
  try {
    if (!paymentParticipant) {
      alert("Σφάλμα: Δεν βρέθηκε συμμετέχων για καταχώρηση πληρωμής.");
      return;
    }

    // Προσπάθεια εντοπισμού του ID με διάφορους τρόπους
    const participantId = paymentParticipant.id_parakolouthisis || paymentParticipant.id;
    
    if (!participantId) {
      alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID συμμετέχοντα για καταχώρηση πληρωμής.");
      return;
    }

    
    const memberId = paymentParticipant.id_melous;
    
    // Προετοιμασία δεδομένων πληρωμής
    const formattedPayment = {
      id_melous: memberId,
      id_parakolouthisis: participantId,
      poso: parseInt(payment.poso),
      hmerominia_katavolhs: payment.hmerominia_katavolhs || new Date().toISOString().split('T')[0]
    };


    // Αποστολή στο API
    const response = await api.post(`/sxoles/${id}/parakolouthisi/${participantId}/payment`, formattedPayment);
    

    // Ενημέρωση τοπικών δεδομένων
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_parakolouthisis === participantId) {
          const newPayment = {
            id: response.data.id || response.data.id_katavalei,
            id_katavalei: response.data.id || response.data.id_katavalei,
            poso: formattedPayment.poso,
            hmerominia_katavolhs: formattedPayment.hmerominia_katavolhs
          };
          
          const updatedPayments = [...(p.katavalei || []), newPayment];
          const totalPaid = updatedPayments.reduce((sum, pay) => sum + (pay.poso || 0), 0);
          const ypoloipo = Math.max(0, (p.timi || 0) - totalPaid);
          
          return {
            ...p,
            katavalei: updatedPayments,
            ypoloipo: ypoloipo
          };
        }
        return p;
      })
    );

    // Κλείσιμο του dialog
    setPaymentDialog(false);
    setPaymentParticipant(null);
    
    
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη πληρωμής:", error);
    alert(`Σφάλμα: ${error.message}`);
  }
};

  // Handle removing payment
const handleRemovePayment = async (paymentId, participantId) => {
  try {
    
    if (!paymentId || !participantId) {
      throw new Error("Μη έγκυρα IDs για πληρωμή ή συμμετέχοντα");
    }
    
    // Βεβαίωση ότι έχουμε αριθμητικά IDs
    const numericPaymentId = parseInt(paymentId);
    const numericParticipantId = parseInt(participantId);
    
    if (isNaN(numericPaymentId) || isNaN(numericParticipantId)) {
      throw new Error("Μη έγκυρα IDs για πληρωμή ή συμμετέχοντα");
    }
    
    
    // Κλήση του API για διαγραφή
    await api.delete(`/sxoles/${id}/parakolouthisi/${numericParticipantId}/payment/${numericPaymentId}`);
    
    // Ενημέρωση τοπικών δεδομένων
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.id_parakolouthisis === participantId || p.id === participantId) {
          const updatedPayments = p.katavalei.filter(pay => 
            pay.id !== paymentId && pay.id_katavalei !== paymentId
          );
          const totalPaid = updatedPayments.reduce((sum, pay) => sum + (pay.poso || 0), 0);
          const ypoloipo = Math.max(0, (p.timi || 0) - totalPaid);
          
          return {
            ...p,
            katavalei: updatedPayments,
            ypoloipo: ypoloipo
          };
        }
        return p;
      })
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
    { accessorKey: "id_parakolouthisis", header: "ID", enableHiding: true, size: 60 },
    { 
      accessorKey: "memberName", 
      header: "Ονοματεπώνυμο",
      size: 200, // Add explicit width
      Cell: ({ row }) => {
        const firstName = row.original.melos?.epafes?.onoma || '';
        const lastName = row.original.melos?.epafes?.epitheto || '';
        return `${lastName} ${firstName}`.trim() || row.original.memberName || "Άγνωστο όνομα";
      }
    },
    { 
      accessorKey: "melos.epafes.email", 
      header: "Email",
      size: 160, // Add explicit width
      Cell: ({ row }) => row.original.melos?.epafes?.email || "-"
    },
    { 
      accessorKey: "melos.epafes.tilefono", 
      header: "Τηλέφωνο",
      size: 120, // Add explicit width
      Cell: ({ row }) => row.original.melos?.epafes?.tilefono || "-"
    },
    { 
      accessorKey: "ypoloipo", 
      header: "Υπόλοιπο",
      size: 120, // Add explicit width
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
      size: 120, // Add explicit width
 Cell: ({ row }) => {
  const status = row.original.katastasi;
  console.log("Status for participant:", row.original.id_parakolouthisis, "=", status); // Debug
  return (
    <Chip 
      label={status === "Ακυρωμένη" ? "Ακυρωμένη" : "Ενεργή"}
      color={status === "Ακυρωμένη" ? "error" : "success"}
      size="small"
      variant="outlined"
    />
  );
}
    },
    {
      id: 'payment',
      header: 'Πληρωμή',
      size: 80, // Add explicit width
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

  // Detail panel configuration for participants - ΔΙΟΡΘΩΜΕΝΟ
// Update the participantDetailPanel to include a custom section for the payment button
// Update the participantDetailPanel to properly place payment elements above the table
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
      accessor: "timi", 
      header: "Τιμή", 
      value: (row) => `${row.timi || 0}€`
    },
    { 
      accessor: "hmerominia_dilosis", 
      header: "Ημερομηνία Δήλωσης",
      format: (value) => formatDate(value)
    }
  ],
  tables: [
    {
      title: "Ιστορικό Πληρωμών",
      beforeTable: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Ιστορικό Πληρωμών</Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleOpenPaymentDialog(row)}
          >
            Προσθήκη 
          </Button>
        </Box>
      ),
      getData: (row) => {
        return (row.katavalei || []).map(payment => ({
          id: payment.id || payment.id_katavalei,
          id_katavalei: payment.id || payment.id_katavalei,
          poso: payment.poso,
          hmerominia_katavolhs: payment.hmerominia_katavolhs,
          participantId: row.id_parakolouthisis
        }));
      },
onEdit: (payment) => {
  const paymentId = payment.id || payment.id_katavalei;
  const participantId = payment.participantId; // Get from payment record instead
  
  if (!paymentId || !participantId) {
    console.error("Missing ID for payment or participant:", { payment });
    return;
  }
  
  setPaymentToEdit({
    paymentId,
    participantId,
    poso: payment.poso,
    hmerominia_katavolhs: formatDateForInput(payment.hmerominia_katavolhs)
  });
  setEditPaymentDialog(true);
},
      onDelete: (payment, participant) => {
        const paymentId = payment.id || payment.id_katavalei;
        const participantId = participant.id_parakolouthisis;
        
        if (!paymentId || !participantId) {
          console.error("Missing ID for payment or participant:", { payment, participant });
          return;
        }
        
        // Store the payment and participant IDs and open the dialog
        setPaymentToDelete({ paymentId, participantId });
        setDeletePaymentDialog(true);
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
          Cell: ({ row }) => formatDate(row.original?.hmerominia_katavolhs)
        }
      ],
      getRowId: (row) => row?.id || row?.id_katavalei || `payment-${Math.random().toString(36).substring(2)}`,
      emptyMessage: "Δεν υπάρχουν καταχωρημένες πληρωμές",
      enableEdit: true // Enable the edit button in DataTable
    }
  ]
};

  // Αντικατάσταση της συνάρτησης formatDate για μορφή ημερομηνίας ΗΗ/ΜΜ/ΕΕΕΕ
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '-';
  }
};

// Format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

// Calculate payment balance consistently
const calculateBalance = (participant) => {
  const payments = participant.katavalei || [];
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.poso || 0), 0);
  const totalCost = participant.timi || 0;
  return Math.max(0, totalCost - totalPaid);
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
                <Box sx={{ mb: 3 }}>
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
                              <TableCell>{formatDate(loc.start)}</TableCell>
                              <TableCell>{formatDate(loc.end)}</TableCell>
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
        </Box>
      </Container>
      
      {/* Συμμετέχοντες & Πληρωμές - χωρίς Container, σαν το καταφύγιο */}
      <Box sx={{ mb: 4 }}>
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
            handleDelete={handleRemoveParticipant}
            deleteConfig={{
              getPayload: (row) => row.original || row
            }}
            onRowExpand={(row) => {
              
            }}
     
            tableName="parakolouthiseis"
            density="compact"
          />
        </Paper>
      </Box>
      
      {/* Διάλογοι */}
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
        title="Προσθήκη Συμμετεχόντων"
        fields={participantFormFields}
        resourceData={{
          membersList: availableMembers.map(member => {
            // Προσδιορισμός τύπου μέλους και κατάστασης
            let memberType = "Άγνωστο";
            let status = "-";
            
            if (member.tipo_melous === "eksoteriko" || member.melos?.tipo_melous === "eksoteriko") {
              memberType = "Εξωτερικό Μέλος";
              status = "Εξωτερικό Μέλος";
            } else if (member.tipo_melous === "esoteriko" || member.melos?.tipo_melous === "esoteriko") {
              // Εσωτερικό μέλος - ελέγχουμε αν είναι αθλητής ή συνδρομητής
              if (member.athlitis) {
                memberType = "Εσωτερικό Μέλος - Αθλητής";
                status = "Αθλητής";
              } else if (member.sindromitis) {
                memberType = "Εσωτερικό Μέλος - Συνδρομητής";
                status = member.sindromitis.katastasi_sindromis || "Ενεργή";
              } else {
                memberType = "Εσωτερικό Μέλος";
                status = "Εσωτερικό Μέλος";
              }
            }
            
            return {
              id: member.id_melous || member.id_es_melous || member.id_ekso_melous || member.id,
              fullName: `${member.melos?.epafes?.epitheto || ""} ${member.melos?.epafes?.onoma || ""}`.trim() || "Άγνωστο όνομα",
              email: member.melos?.epafes?.email || "",
              tilefono: member.melos?.epafes?.tilefono || "",
              memberType: memberType,
              status: status
            };
          })
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
          handleEditSave={(updatedValues) => {
            // Προσθέτουμε το id_parakolouthisis πίσω στο αντικείμενο
            handleEditParticipant({
              ...updatedValues,
              id_parakolouthisis: currentParticipant.id_parakolouthisis
            });
          }}
          editValues={{
            // Αφαιρούμε το id_parakolouthisis από τα editValues
            timi: currentParticipant.timi,
            katastasi: currentParticipant.katastasi || "Ενεργή",
          }}
          title="Επεξεργασία Συμμετέχοντα"
          fields={[
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
      
      {/* Διάλογος για διαχείριση τοποθεσιών */}
      <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Διαχείριση Τοποθεσιών</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            {/* Use the consistent LocationEditor component */}
            <LocationEditor 
              value={currentLocations} 
              onChange={setCurrentLocations} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>Άκυρο</Button>
          <Button onClick={() => handleSaveLocations(currentLocations)} variant="contained" color="primary">
            Αποθήκευση
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teacher deletion confirmation dialog */}
      <Dialog 
        open={deleteTeacherDialog} 
        onClose={() => setDeleteTeacherDialog(false)}
      >
        <DialogTitle>Επιβεβαίωση Διαγραφής</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {teacherToDelete ? 
              `Είστε σίγουροι ότι θέλετε να αφαιρέσετε τον εκπαιδευτή "${teacherToDelete.name}" από αυτή τη σχολή;` : 
              "Είστε σίγουροι ότι θέλετε να αφαιρέσετε τον εκπαιδευτή από αυτή τη σχολή;"
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTeacherDialog(false)} color="primary">
            Ακύρωση
          </Button>
          <Button onClick={handleConfirmTeacherDelete} color="error" autoFocus>
            Διαγραφή
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment deletion confirmation dialog - new */}
      <Dialog 
        open={deletePaymentDialog} 
        onClose={() => setDeletePaymentDialog(false)}
      >
        <DialogTitle>Επιβεβαίωση Διαγραφής Πληρωμής</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την πληρωμή;
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePaymentDialog(false)} color="primary">
            Ακύρωση
          </Button>
          <Button 
            onClick={async () => {
              if (!paymentToDelete) return;
              
              const { paymentId, participantId } = paymentToDelete;
              
              // Κλήση της handleRemovePayment με τα σωστά IDs
              await handleRemovePayment(paymentId, participantId);
              
              setDeletePaymentDialog(false);
              setPaymentToDelete(null);
            }} 
            color="error" 
            autoFocus
          >
            Διαγραφή
          </Button>
        </DialogActions>
      </Dialog>

      {paymentToEdit && (
        <EditDialog
          open={editPaymentDialog}
          onClose={() => {
            setEditPaymentDialog(false);
            setPaymentToEdit(null);
          }}
          handleEditSave={handleEditPayment}
          editValues={{
            poso: paymentToEdit.poso,
            hmerominia_katavolhs: paymentToEdit.hmerominia_katavolhs
          }}
          title="Επεξεργασία Πληρωμής"
          fields={[
            { 
              accessorKey: "poso", 
              header: "Ποσό", 
              type: "number", 
              validation: yup.number()
                .min(0.01, "Το ποσό πρέπει να είναι μεγαλύτερο από 0")
                .required("Το ποσό είναι υποχρεωτικό") 
            },
            { 
              accessorKey: "hmerominia_katavolhs", 
              header: "Ημερομηνία", 
              type: "date",
              validation: yup.date().nullable()
            }
          ]}
        />
      )}
    </LocalizationProvider>
  );
}