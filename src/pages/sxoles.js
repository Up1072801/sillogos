import React, { useState, useEffect } from "react";
import api from '../utils/api';
import { Box,   TablePagination,
  InputAdornment,
  Radio , Search, Typography, Paper, TextField, IconButton, Button, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Checkbox, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";
import AddDialog from "../components/DataTable/AddDialog";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// Add this import to the top of the file
import LocationEditor from '../components/LocationEditor';
import EditDialog from "../components/DataTable/EditDialog";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import * as yup from "yup";
import DeleteIcon from '@mui/icons-material/Delete';
import "./App.css";
import AddIcon from '@mui/icons-material/Add';
import TransformIcon from '@mui/icons-material/Transform';
import SelectionDialog from '../components/SelectionDialog';

export default function Sxoles() {
  const [sxolesData, setSxolesData] = useState([]);
  const [ekpaideutesData, setEkpaideutesData] = useState([]);
  const [meliData, setMeliData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addSxoliDialogOpen, setAddSxoliDialogOpen] = useState(false);
  const [editSxoliDialogOpen, setEditSxoliDialogOpen] = useState(false);
  const [editSxoliData, setEditSxoliData] = useState(null);
  const [addEkpaideutiDialogOpen, setAddEkpaideutiDialogOpen] = useState(false);
  const [editEkpaideutiDialogOpen, setEditEkpaideutiDialogOpen] = useState(false);
  // Add these new states with your other state variables
const [openMemberConversionDialog, setOpenMemberConversionDialog] = useState(false);
const [availableMembers, setAvailableMembers] = useState([]);
const [selectedMemberId, setSelectedMemberId] = useState("");
const [instructorFields, setInstructorFields] = useState({
  epipedo: "",
  klados: ""
});
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
  // Add these with your other state variables
const [teacherDeleteDialog, setTeacherDeleteDialog] = useState(false);
const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [editEkpaideutiData, setEditEkpaideutiData] = useState(null);
  const [currentSxoliId, setCurrentSxoliId] = useState(null);
  const [currentEkpaideutisId, setCurrentEkpaideutisId] = useState(null);
  const [refreshDataTrigger, setRefreshDataTrigger] = useState(0);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [currentLocations, setCurrentLocations] = useState([]);
  const [editingSchoolForLocation, setEditingSchoolForLocation] = useState(null);
  const [teacherSelectionDialogOpen, setTeacherSelectionDialogOpen] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [currentSchoolForTeachers, setCurrentSchoolForTeachers] = useState(null);
  const [memberSelectionDialogOpen, setMemberSelectionDialogOpen] = useState(false);
const [searchText, setSearchText] = useState("");
const [instructorDetailsDialogOpen, setInstructorDetailsDialogOpen] = useState(false);

// Προσθέστε αυτά στις υπόλοιπες καταστάσεις (states) στην αρχή του component
const [locationDeleteDialog, setLocationDeleteDialog] = useState(false);

const [locationToDelete, setLocationToDelete] = useState(null);
  // Add new state for year filter
  const [yearFilter, setYearFilter] = useState("");
  const [availableYears, setAvailableYears] = useState([]);

  // Γενική συνάρτηση βοηθός για ασφαλή εξαγωγή και μετατροπή IDs
const safeParseId = (id) => {
  if (id === null || id === undefined) return null;
  
  // Αν είναι ήδη αριθμός, επέστρεψέ τον
  if (typeof id === 'number') return id;
  
  // Αν είναι string, προσπάθησε να το μετατρέψεις
  if (typeof id === 'string') {
    const parsedId = parseInt(id, 10);
    return isNaN(parsedId) ? null : parsedId;
  }
  
  // Για άλλους τύπους, επέστρεψε null
  return null;
};

  // Τροποποίηση της συνάρτησης extractId στη γραμμή ~37
const extractId = (obj) => {
  // Διαχείριση κενών τιμών
  if (obj === null || obj === undefined) {
    return null;
  }
  
  // Αν είναι ήδη primitive (αριθμός/string) προσπαθούμε να το επιστρέψουμε άμεσα
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Λεπτομερής καταγραφή για διάγνωση
  
  // Έλεγχος για απευθείας ID properties
  const idProps = ['id_sxolis', 'id', 'id_ekpaideuti', 'id_epafis'];
  for (const prop of idProps) {
    if (obj[prop] !== undefined) {
      return obj[prop];
    }
  }
  
  // Έλεγχος σε εμφωλευμένα αντικείμενα
  if (obj.original) {
    for (const prop of idProps) {
      if (obj.original[prop] !== undefined) {
        return obj.original[prop];
      }
    }
  }
  
  if (obj.row) {
    for (const prop of idProps) {
      if (obj.row[prop] !== undefined) {
        return obj.row[prop];
      }
    }
  }
  
  return null;
};

  // Στήλες για τον πίνακα σχολών
  const sxolesColumns = [
    { accessorKey: "id_sxolis", header: "ID", enableHiding: true },
    { 
      accessorKey: "onoma", 
      header: "Όνομα",
      Cell: ({ row }) => (
        <Link 
          to={`/sxoles/${row.original.id_sxolis}`} 
          style={{ 
            color: '#1976d2',  // Χρώμα συνδέσμου
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {row.original.onoma}
        </Link>
      )
    },
    { 
      accessorKey: "klados", 
      header: "Κλάδος", 
      size: 120
    },
    { 
      accessorKey: "timi", 
      header: "Τιμή", 
      size: 80,
      Cell: ({ cell }) => cell.getValue() ? `${cell.getValue()}€` : '-'
    },
    { 
      accessorKey: "simmetoxes", 
      header: "Συμμετέχοντες", 
      size: 120
    }
  ];

  // Στήλες για τον πίνακα εκπαιδευτών
  const ekpaideutesColumns = [
    { accessorKey: "id_ekpaideuti", header: "ID", enableHiding: true },
    { 
      accessorKey: "fullName", 
      header: "Ονοματεπώνυμο",
      Cell: ({ row }) => `${row.original.onoma || ""} ${row.original.epitheto || ""}`
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "tilefono", header: "Τηλέφωνο" },
    { accessorKey: "epipedo", header: "Επίπεδο" },
    { accessorKey: "klados", header: "Κλάδος" }
  ];

  // Διαμόρφωση του panel λεπτομερειών για σχολές
  const sxoliDetailPanelConfig = {
    mainDetails: [
      { accessorKey: "klados", header: "Κλάδος" },
      { accessorKey: "epipedo", header: "Επίπεδο" },
      { accessorKey: "etos", header: "Έτος" },
      { accessorKey: "seira", header: "Σειρά" }, 
      { accessorKey: "timi", header: "Τιμή" }
    ],
    tables: [
      {
        title: "Εκπαιδευτές",
        getData: (row) => Array.isArray(row.ekpaideutes) ? row.ekpaideutes : [],
        columns: [
          { 
            accessorKey: "fullName", 
            header: "Ονοματεπώνυμο",
            Cell: ({ row }) => {
              const firstName = row.original.firstName || "";
              const lastName = row.original.lastName || "";
              return `${firstName} ${lastName}`.trim();
            }
          },
          { accessorKey: "phone", header: "Τηλέφωνο" },
          { accessorKey: "email", header: "Email" },
          { accessorKey: "epipedo", header: "Επίπεδο" }
        ],
        onDelete: (rowData, parentRow) => {
          // Βεβαιώσου ότι και το rowData.id υπάρχει
          if (!rowData || (!rowData.id && !rowData.id_ekpaideuti && !rowData.id_epafis && rowData.id !== 0)) {
            console.error("Missing rowData or rowData.id:", rowData);
            alert("Σφάλμα: Δεν βρέθηκε το ID του εκπαιδευτή");
            return;
          }
          
          if (!parentRow || (!parentRow.id_sxolis && !parentRow.id && parentRow.id !== 0)) {
            console.error("Missing parentRow or parentRow ID:", parentRow);
            alert("Σφάλμα: Δεν βρέθηκε το ID της σχολής");
            return;
          }
          
          // Εξαγωγή ID με πιο ξεκάθαρο τρόπο
          const teacherId = rowData.id || rowData.id_ekpaideuti || rowData.id_epafis;
          const schoolId = parentRow.id_sxolis || parentRow.id;
          
          
          // Κλήση της συνάρτησης με τα αντίστοιχα IDs
          handleRemoveTeacherFromSchool(teacherId, schoolId);
        },
        onAddNew: (parentRow) => {
          
          // Ασφαλής εξαγωγή schoolId
          if (!parentRow) {
            console.error("Missing parentRow in onAddNew for teachers");
            alert("Σφάλμα: Επιλέξτε πρώτα μια σχολή.");
            return;
          }
          
          // Διαβεβαίωση ότι περνάμε το σωστό αντικείμενο
          handleAddTeacherToSchool(parentRow);
        }
      },
      {
        title: "Τοποθεσίες",
        getData: (row) => {
          
          // Έλεγχος για όλες τις πιθανές πηγές δεδομένων τοποθεσιών
          let topothesiaData = null;
          
          // Έλεγχος απευθείας στο root
          if (row.topothesies) {
            topothesiaData = row.topothesies;
          } 
          // Έλεγχος στο details.topothesia
          else if (row.details && row.details.topothesia) {
            topothesiaData = row.details.topothesia;
          }
          // Έλεγχος στο topothesia (εναλλακτικό όνομα)
          else if (row.topothesia) {
            topothesiaData = row.topothesia;
          }
          
          if (!topothesiaData) return [];
          
          try {
            // Μετατροπή από string σε JSON αν είναι string
            const parsedData = typeof topothesiaData === 'string' ? 
              JSON.parse(topothesiaData) : topothesiaData;
            
            if (Array.isArray(parsedData)) {
              return parsedData.map((t, index) => ({
                id: index,
                topothesia: t.topothesia || "",
                start: t.start || t.hmerominia_enarksis || "", 
                end: t.end || t.hmerominia_liksis || ""
              }));
            }
            
            // Αν δεν είναι array, δημιουργούμε ένα στοιχείο
            return [{ 
              id: 0, 
              topothesia: typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData), 
              start: "", 
              end: "" 
            }];
          } catch (e) {
            console.error("Σφάλμα ανάλυσης δεδομένων τοποθεσιών:", e);
            return [{ 
              id: 0, 
              topothesia: String(topothesiaData), 
              start: "", 
              end: "" 
            }];
          }
        },
        columns: [
          { accessorKey: "topothesia", header: "Τοποθεσία" },
          { 
            accessorKey: "start", 
            header: "Έναρξη",
            Cell: ({ value }) => {
              if (!value) return '-';
              return formatDateToDDMMYYYY(value);
            }
          },
          { 
            accessorKey: "end", 
            header: "Λήξη",
            Cell: ({ value }) => {
              if (!value) return '-';
              return formatDateToDDMMYYYY(value);
            }
          }
        ],
        onAddNew: (parentRow) => {
          
          // Ασφαλής εξαγωγή schoolId
          if (!parentRow) {
            console.error("Missing parentRow in onAddNew for locations");
            alert("Σφάλμα: Επιλέξτε πρώτα μια σχολή.");
            return;
          }
          
          // Διαβεβαίωση ότι περνάμε το σωστό αντικείμενο
          handleAddTopothesia(parentRow);
        },
        addNewButtonLabel: "ΕΠΕΞΕΡΓΑΣΙΑ"
      },
    ]
  };
  const ekpaideutisDetailPanelConfig = {
    mainDetails: [
      { accessorKey: "onoma", header: "Όνομα" },
      { accessorKey: "epitheto", header: "Επώνυμο" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "tilefono", header: "Τηλέφωνο" },
      { accessorKey: "epipedo", header: "Επίπεδο" },
      { accessorKey: "klados", header: "Κλάδος" }
    ],
    tables: [
      {
        title: "Σχολές",
        getData: (row) => {
          // Διασφάλιση ότι επιστρέφουμε πάντα έναν πίνακα
          if (Array.isArray(row.sxoles)) {
            return row.sxoles.map(sxoli => ({
              ...sxoli,
              id: sxoli.id_sxolis // Διασφάλιση ότι κάθε σχολή έχει ID για το DataTable
            }));
          }
          return [];
        },
        columns: [
          { accessorKey: "onoma", header: "Όνομα" },
          { accessorKey: "klados", header: "Κλάδος" },
          { accessorKey: "epipedo", header: "Επίπεδο" },
          { accessorKey: "etos", header: "Έτος" }
        ]
      }
    ]
  };

  // Πεδία φόρμας για σχολή
  const sxoliFormFields = [
    { 
      accessorKey: "klados", 
      header: "Κλάδος",
      validation: yup.string().required("Το πεδίο Κλάδος είναι υποχρεωτικό")
    },
    { 
      accessorKey: "epipedo", 
      header: "Επίπεδο", 
      validation: yup.string().required("Το πεδίο Επίπεδο είναι υποχρεωτικό")
    },
    { 
      accessorKey: "timi", 
      header: "Τιμή", 
      type: "number",
      validation: yup.number().min(0, "Η τιμή δεν μπορεί να είναι αρνητική")
    },
    { 
      accessorKey: "etos", 
      header: "Έτος", 
      type: "number",
      validation: yup.number().typeError("Το έτος πρέπει να είναι αριθμός")
    },
    { 
      accessorKey: "seira", 
      header: "Σειρά", 
      type: "number" 
    },

  ];

  // Πεδία φόρμας για εκπαιδευτή
  const ekpaideutisFormFields = [
    { 
      accessorKey: "onoma", 
      header: "Όνομα",
      validation: yup.string().required("Το όνομα είναι υποχρεωτικό")
    },
    { 
      accessorKey: "epitheto", 
      header: "Επώνυμο",
      validation: yup.string().required("Το επώνυμο είναι υποχρεωτικό")
    },
    { 
      accessorKey: "email", 
      header: "Email",
      validation: yup
        .string()
        .nullable()
        .test('email-format', 'Μη έγκυρο email', function(value) {
          if (!value || value === '') return true;
          const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
          return emailRegex.test(value);
        })
    },
    { 
      accessorKey: "tilefono", 
      header: "Τηλέφωνο",
      validation: yup
        .string()
        .nullable()
        .test('valid-phone', 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία και να περιέχει μόνο αριθμούς και το σύμβολο +', function(value) {
          if (!value || value === '') return true;
          const digitsOnly = value.replace(/[^0-9]/g, '');
          return /^[0-9+]+$/.test(value) && digitsOnly.length >= 10;
        })
    },
    { 
      accessorKey: "epipedo", 
      header: "Επίπεδο",
    },
    { 
      accessorKey: "klados", 
      header: "Κλάδος",
    }
  ];

  // Add this code after your existing sxoliFormFields definition (around line 370)
const addSxoliFormFields = sxoliFormFields.filter(field => field.accessorKey !== "topothesies");

  // Φόρτωση δεδομένων όταν αλλάζει το refreshDataTrigger
  useEffect(() => {
    fetchData();
  }, [refreshDataTrigger]);

  // Ανανέωση δεδομένων
  const refreshData = () => {
    setRefreshDataTrigger(prev => prev + 1);
  };

  // Βελτίωση του fetchData
const fetchData = async () => {
  try {
    setLoading(true);
    
    const [sxolesRes, ekpaideutesRes] = await Promise.all([
      api.get("/sxoles"),
      api.get("/Repafes/ekpaideutes-me-sxoles")
    ]);
    

    
    // Process schools data
    if (Array.isArray(sxolesRes.data)) {
      const processedSxoles = sxolesRes.data.map(sxoli => ({
        ...sxoli,
        id_sxolis: sxoli.id_sxolis || sxoli.id,
      }));
      setSxolesData(processedSxoles);
      
      // Extract available years
      const years = [...new Set(processedSxoles
        .map(s => s.etos)
        .filter(year => year !== null && year !== undefined)
        .sort((a, b) => b - a))];
      setAvailableYears(years);
    } else {
      console.error("sxolesRes.data is not an array:", sxolesRes.data);
      setSxolesData([]);
    }

    // Process teachers data
    if (Array.isArray(ekpaideutesRes.data)) {
      setEkpaideutesData(ekpaideutesRes.data);
    } else {
      console.error("ekpaideutesRes.data is not an array:", ekpaideutesRes.data);
      setEkpaideutesData([]);
    }

    setLoading(false);
  } catch (error) {
    console.error("Σφάλμα κατά τη φόρτωση δεδομένων:", error);
    setLoading(false);
  }
};

  // Διάλογος επεξεργασίας τοποθεσιών
  const LocationEditorDialog = ({ open, onClose, value, onSave, title = "Διαχείριση Τοποθεσιών" }) => {
    const [locations, setLocations] = useState(value || []);
    
    // Ενημέρωση των locations όταν αλλάζει το value
    useEffect(() => {
      if (open) {
        setLocations(value || []);
      }
    }, [value, open]);
    
    const handleSave = () => {
      onSave(locations);
    };
  
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <LocationEditor 
              value={locations} 
              onChange={setLocations} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Άκυρο</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Αποθήκευση ({locations.length} τοποθεσίες)
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ΤΟΠΟΘΕΣΙΕΣ - Διαχείριση τοποθεσιών (component)
  
  // Βελτίωση του handleAddTopothesia
const handleAddTopothesia = async (parentRow) => {
  try {

    // Ασφαλής εξαγωγή schoolId
    const schoolId = typeof parentRow === 'object' ? (parentRow.id_sxolis || parentRow.id) : parentRow;
    
    if (!schoolId && schoolId !== 0) {
      console.error("Could not extract school ID from parentRow:", parentRow);
      alert("Σφάλμα: Δεν βρέθηκε το ID της σχολής.");
      return;
    }


    // Φόρτωση υπάρχουσων τοποθεσιών για τη σχολή
    const response = await api.get(`/sxoles/${schoolId}`);
    const school = response.data;
    
    let existingLocations = [];
    
    // Εξαντλητική αναζήτηση για τοποθεσίες σε όλα τα πιθανά πεδία
    let topothesiaData = school.topothesies || school.topothesia || 
                       (school.details && school.details.topothesia);
                       
    if (topothesiaData) {
      try {
        // Αν είναι string, μετατροπή σε JSON
        if (typeof topothesiaData === 'string') {
          existingLocations = JSON.parse(topothesiaData);
        } else {
          existingLocations = topothesiaData;
        }
        
        // Βεβαιώνουμε ότι είναι πίνακας
        if (!Array.isArray(existingLocations)) {
          existingLocations = [existingLocations];
        }
        
        // Μορφοποίηση τοποθεσιών με IDs για το frontend
        existingLocations = existingLocations.map((loc, idx) => ({
          id: idx,
          topothesia: loc.topothesia || "",
          start: loc.start || loc.hmerominia_enarksis || "",
          end: loc.end || loc.hmerominia_liksis || ""
        }));
      } catch (e) {
        console.error("Σφάλμα ανάλυσης τοποθεσιών:", e);
        existingLocations = [];
      }
    }

    // Άνοιγμα διαλόγου με τις υπάρχουσες τοποθεσίες
    setCurrentLocations(existingLocations);
    setEditingSchoolForLocation(schoolId);
    setLocationDialogOpen(true);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη τοποθεσίας:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Replace or update the existing handleDeleteTopothesia function

// Function to handle delete button click for locations
const handleDeleteTopothesia = async (rowData, parentRow) => {
  try {
    if (!rowData) {
      console.error("Missing rowData for topothesia deletion");
      alert("Δεν επιλέχθηκε τοποθεσία");
      return;
    }
    
    // Ασφαλής εξαγωγή schoolId
    const schoolId = typeof parentRow === 'object' ? 
      (parentRow.id_sxolis || parentRow.id) : 
      parentRow;
    
    if (!schoolId && schoolId !== 0) {
      console.error("Invalid school ID for topothesia deletion");
      alert("Δεν βρέθηκε ID σχολής");
      return;
    }
    
    // Store data and open confirmation dialog instead of immediate deletion
    setLocationToDelete({ rowData, schoolId });
    setLocationDeleteDialog(true);
    
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή τοποθεσίας:", error);
    alert("Σφάλμα κατά τη διαγραφή τοποθεσίας: " + error.message);
  }
};

// Make sure to have a confirmLocationDeletion function to actually perform the deletion
const confirmLocationDeletion = async () => {
  try {
    if (!locationToDelete) {
      setLocationDeleteDialog(false);
      return;
    }
    
    const { rowData, schoolId } = locationToDelete;
    
    // Ανάκτηση τρέχουσας σχολής
    const response = await api.get(`/sxoles/${schoolId}`);
    const school = response.data;
    
    // Επεξεργασία τοποθεσιών
    let topothesiaData = school.topothesies;
    
    // Αν δεν υπάρχουν τοποθεσίες, έλεγξε εναλλακτικά ονόματα πεδίων
    if (!topothesiaData) {
      topothesiaData = school.topothesia || (school.details && school.details.topothesia);
    }
    
    if (!topothesiaData) {
      alert("Δεν βρέθηκαν τοποθεσίες για διαγραφή");
      setLocationDeleteDialog(false);
      setLocationToDelete(null);
      return;
    }
    
    let currentTopothesies = [];
    
    // Μετατροπή των τοποθεσιών σε πίνακα JavaScript
    try {
      if (typeof topothesiaData === 'string') {
        currentTopothesies = JSON.parse(topothesiaData);
      } else {
        currentTopothesies = topothesiaData;
      }
      
      // Διασφάλιση ότι είναι πίνακας
      if (!Array.isArray(currentTopothesies)) {
        currentTopothesies = [currentTopothesies];
      }
    } catch (e) {
      console.error("Σφάλμα ανάλυσης JSON:", e);
      alert("Σφάλμα επεξεργασίας τοποθεσιών");
      setLocationDeleteDialog(false);
      setLocationToDelete(null);
      return;
    }
    
    // Αφαίρεση της τοποθεσίας με το συγκεκριμένο ID
    const updatedTopothesies = currentTopothesies.filter((_, index) => index !== rowData.id);
    
    // Δημιουργούμε το αντικείμενο ενημέρωσης διατηρώντας τις υπάρχουσες τιμές
    const updateData = {
      klados: school.klados,
      epipedo: school.epipedo,
      timi: school.timi,
      etos: school.etos,
      seira: school.seira,
      topothesies: updatedTopothesies
    };
    
    // Ενημέρωση της σχολής στο API
    await api.put(`/sxoles/${schoolId}`, updateData);
    
    // ΑΛΛΑΓΗ: Χρήση local state update αντί για refreshData()
    setSxolesData(prev => {
      return prev.map(sxoli => {
        if (sxoli.id_sxolis == schoolId || sxoli.id == schoolId) {
          return {
            ...sxoli,
            topothesies: updatedTopothesies
          };
        }
        return sxoli;
      });
    });
    
    // Κλείσιμο διαλόγου και καθαρισμός καταστάσεων
    setLocationDeleteDialog(false);
    setLocationToDelete(null);
    
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή τοποθεσίας:", error);
    alert("Σφάλμα κατά τη διαγραφή τοποθεσίας: " + error.message);
    setLocationDeleteDialog(false);
    setLocationToDelete(null);
  }
};
  // Improved handleSaveLocations with local updates
const handleSaveLocations = async (locations) => {
  try {
    if (!editingSchoolForLocation) {
      alert("Δεν επιλέχθηκε σχολή για αποθήκευση τοποθεσιών");
      return;
    }
    
    // Get current school data from local state
    const currentSchool = sxolesData.find(s => 
      s.id_sxolis == editingSchoolForLocation || s.id == editingSchoolForLocation
    );
    
    if (!currentSchool) {
      throw new Error("Δεν βρέθηκαν δεδομένα για την επιλεγμένη σχολή");
    }
    
    // Format locations for API (without IDs for frontend)
    const formattedLocations = locations.map(loc => ({
      topothesia: loc.topothesia,
      start: loc.start,
      end: loc.end
    }));
    
    
    // Create update object preserving existing values
    const updateData = {
      klados: currentSchool.klados,
      epipedo: currentSchool.epipedo,
      timi: currentSchool.timi,
      etos: currentSchool.etos,
      seira: currentSchool.seira,
      topothesies: formattedLocations
    };
    
    // Send to API
    await api.put(`/sxoles/${editingSchoolForLocation}`, updateData);
    
    // Update local state
    setSxolesData(prev => {
      return prev.map(sxoli => {
        if (sxoli.id_sxolis == editingSchoolForLocation || sxoli.id == editingSchoolForLocation) {
          return {
            ...sxoli,
            topothesies: formattedLocations
          };
        }
        return sxoli;
      });
    });
    
    // Close dialog and reset state
    setLocationDialogOpen(false);
    setEditingSchoolForLocation(null);
  } catch (error) {
    console.error("Σφάλμα κατά την αποθήκευση τοποθεσιών:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Προετοιμασία για επεξεργασία σχολής
const handleEditSxoliClick = async (row) => {
  try {

    if (!row) {
      console.error("Missing row data for edit operation");
      alert("Σφάλμα: Λείπουν δεδομένα για επεξεργασία.");
      return;
    }

    // Εξαγωγή του ID της σχολής
    const schoolId = row.id_sxolis || row.id;

    if (!schoolId) {
      console.error("Could not extract school ID from row:", row);
      alert("Σφάλμα: Δεν βρέθηκε το ID της σχολής.");
      return;
    }


    // Κλήση API για φόρτωση δεδομένων σχολής
    const response = await api.get(`/sxoles/${schoolId}`);
    if (!response.data) {
      throw new Error(`Δεν βρέθηκαν δεδομένα για τη σχολή με ID ${schoolId}`);
    }

    const school = response.data;

    // Δημιουργία δεδομένων για το EditDialog
    const sxoliData = {
      id: schoolId,
      id_sxolis: schoolId,
      klados: school.klados || "",
      epipedo: school.epipedo || "",
      timi: school.timi || 0,
      etos: school.etos || "",
      seira: school.seira || "",
      topothesies: school.topothesies || []
    };


    setEditSxoliData(sxoliData);
    setCurrentSxoliId(schoolId);
    setEditSxoliDialogOpen(true);
  } catch (error) {
    console.error("Σφάλμα κατά τη φόρτωση δεδομένων σχολής για επεξεργασία:", error);
    alert("Σφάλμα κατά τη φόρτωση δεδομένων σχολής: " + (error.response?.data?.error || error.message));
  }
};

// Handle confirmed teacher deletion
const confirmTeacherDeletion = async () => {
  try {
    if (!teacherToDelete) {
      setTeacherDeleteDialog(false);
      return;
    }
    
    const { teacherId, schoolId } = teacherToDelete;
    
    // API call with the correct ID
    await api.delete(`/sxoles/${schoolId}/ekpaideutis/${teacherId}`);
    
    // Local state updates
    // 1. Remove teacher from school's teachers list
    setSxolesData(prev => {
      return prev.map(sxoli => {
        if ((sxoli.id_sxolis == schoolId || sxoli.id == schoolId) && 
            Array.isArray(sxoli.ekpaideutes)) {
          return {
            ...sxoli,
            ekpaideutes: sxoli.ekpaideutes.filter(ekp => 
              ekp.id != teacherId && 
              ekp.id_ekpaideuti != teacherId && 
              ekp.id_epafis != teacherId
            )
          };
        }
        return sxoli;
      });
    });
    
    // 2. Remove school from teacher's schools list
    setEkpaideutesData(prev => {
      return prev.map(ekpaideutis => {
        if ((ekpaideutis.id == teacherId || 
            ekpaideutis.id_ekpaideuti == teacherId || 
            ekpaideutis.id_epafis == teacherId) && 
            Array.isArray(ekpaideutis.sxoles)) {
          return {
            ...ekpaideutis,
            sxoles: ekpaideutis.sxoles.filter(sxoli => 
              sxoli.id != schoolId && sxoli.id_sxolis != schoolId
            )
          };
        }
        return ekpaideutis;
      });
    });
    
    // Close the dialog and reset state
    setTeacherDeleteDialog(false);
    setTeacherToDelete(null);
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση εκπαιδευτή από τη σχολή:", error);
    alert("Σφάλμα: " + error.message);
    setTeacherDeleteDialog(false);
    setTeacherToDelete(null);
  }
};
  // Προσθήκη εκπαιδευτή σε σχολή - γραμμή ~1125
const handleAddTeacherToSchool = async (parentRow) => {
  try {

    // Ασφαλής εξαγωγή schoolId
    const schoolId = typeof parentRow === 'object' ? (parentRow.id_sxolis || parentRow.id) : parentRow;
    
    if (!schoolId && schoolId !== 0) {
      console.error("Could not extract school ID from parentRow:", parentRow);
      alert("Σφάλμα: Δεν βρέθηκε το ID της σχολής.");
      return;
    }


    // Κλήση API για φόρτωση δεδομένων σχολής για εύρεση υπαρχόντων εκπαιδευτών
    try {
      const schoolResponse = await api.get(`/sxoles/${schoolId}`);
      
      // Εξαγωγή των ID εκπαιδευτών που ήδη υπάρχουν στη σχολή
      const currentTeacherIds = schoolResponse.data.ekpaideutes 
        ? schoolResponse.data.ekpaideutes.map(e => e.id || e.id_ekpaideuti || e.id_epafis) 
        : [];
        
      // Φιλτράρισμα των διαθέσιμων εκπαιδευτών
      const availableTeachersList = ekpaideutesData.filter(
        teacher => !currentTeacherIds.includes(teacher.id_ekpaideuti || teacher.id_epafis || teacher.id)
      );
      
      // Έλεγχος αν υπάρχουν διαθέσιμοι εκπαιδευτές
      if (availableTeachersList.length === 0) {
        alert("Δεν υπάρχουν διαθέσιμοι εκπαιδευτές για προσθήκη");
        return;
      }
      
      // Άνοιγμα διαλόγου για επιλογή εκπαιδευτών
      setAvailableTeachers(availableTeachersList);
      setSelectedTeachers([]);
      setCurrentSchoolForTeachers(schoolId);
      setTeacherSelectionDialogOpen(true);
    } catch (error) {
      console.error("Σφάλμα κατά την ανάκτηση δεδομένων σχολής:", error);
      alert("Σφάλμα: " + error.message);
    }
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εκπαιδευτή:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Handle adding teachers to school with local updates - improved error handling
const handleAddSelectedTeachers = async () => {
  try {
    if (!currentSchoolForTeachers || selectedTeachers.length === 0) return;

  

    // Get the school we're updating
    const schoolToUpdate = sxolesData.find(s => 
      s.id_sxolis == currentSchoolForTeachers || s.id == currentSchoolForTeachers
    );
    
    if (!schoolToUpdate) {
      alert("Δεν βρέθηκε η σχολή για προσθήκη εκπαιδευτών");
      return;
    }

    // Track successfully added teachers to update state
    const addedTeachersIds = [];

    // Add each selected teacher
    for (const teacherId of selectedTeachers) {
      if (!teacherId && teacherId !== 0) {
       
        continue;
      }
      
    

      // Find teacher object with better error handling
      const ekpaideutis = ekpaideutesData.find(e => 
        e.id_ekpaideuti == teacherId || 
        e.id_epafis == teacherId || 
        e.id == teacherId
      );
      
      if (!ekpaideutis) {
        console.error("Δεν βρέθηκε εκπαιδευτής με ID:", teacherId);
        continue;
      }

      // Make API call
      try {
await api.post(`/sxoles/${currentSchoolForTeachers}/ekpaideutis`, {
  id_ekpaideuti: ekpaideutis.id_ekpaideuti
});
        addedTeachersIds.push(teacherId);
      } catch (apiError) {
        console.error(`Error adding teacher ${teacherId} to school:`, apiError);
        // Continue with other teachers even if one fails
      }
    }

    // Local state updates for successfully added teachers
    if (addedTeachersIds.length > 0) {
      // 1. Update school's teachers list
      setSxolesData(prev => {
        return prev.map(sxoli => {
          if (sxoli.id_sxolis == currentSchoolForTeachers || sxoli.id == currentSchoolForTeachers) {
            // Get teacher objects to add
            const teachersToAdd = addedTeachersIds.map(teacherId => {
              const teacher = ekpaideutesData.find(e => e.id_ekpaideuti == teacherId);
              if (teacher) {
                return {
                  id: teacher.id_ekpaideuti,
                  id_ekpaideuti: teacher.id_ekpaideuti,
                  id_epafis: teacher.id_epafis,
                  firstName: teacher.onoma,
                  lastName: teacher.epitheto,
                  email: teacher.email,
                  phone: teacher.tilefono,
                  epipedo: teacher.epipedo
                };
              }
              return null;
            }).filter(t => t !== null);
            
            // Create new teachers array, ensuring it exists
            const existingTeachers = Array.isArray(sxoli.ekpaideutes) ? sxoli.ekpaideutes : [];
            return {
              ...sxoli,
              ekpaideutes: [...existingTeachers, ...teachersToAdd]
            };
          }
          return sxoli;
        });
      });
      
      // 2. Update teachers' schools lists
      setEkpaideutesData(prev => {
        return prev.map(ekpaideutis => {
          if (addedTeachersIds.includes(ekpaideutis.id_ekpaideuti)) {
            // Get the simplified school object to add
            const schoolForTeacher = {
              id: schoolToUpdate.id_sxolis,
              id_sxolis: schoolToUpdate.id_sxolis,
              onoma: schoolToUpdate.onoma,
              klados: schoolToUpdate.klados,
              epipedo: schoolToUpdate.epipedo,
              etos: schoolToUpdate.etos
            };
            
            // Create new schools array, ensuring it exists
            const existingSchools = Array.isArray(ekpaideutis.sxoles) ? ekpaideutis.sxoles : [];
            return {
              ...ekpaideutis,
              sxoles: [...existingSchools, schoolForTeacher]
            };
          }
          return ekpaideutis;
        });
      });
    }

    // Close dialog and reset state
    setTeacherSelectionDialogOpen(false);
    setCurrentSchoolForTeachers(null);
    setSelectedTeachers([]);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εκπαιδευτών:", error);
    alert("Σφάλμα: " + error.message);
  }
};

// Handle removing teacher from school with local updates
const handleRemoveTeacherFromSchool = async (teacherId, schoolId) => {
  try {
    // Ensure we have valid IDs
    const actualTeacherId = teacherId;
    
    if (!actualTeacherId && actualTeacherId !== 0) {
      console.error("Invalid teacher ID:", actualTeacherId);
      alert("Δεν βρέθηκε έγκυρο ID εκπαιδευτή");
      return;
    }
    
    if (!schoolId && schoolId !== 0) {
      console.error("Invalid school ID:", schoolId);
      alert("Δεν βρέθηκε έγκυρο ID σχολής");
      return;
    }
    
    // Instead of window.confirm, store the IDs and open the dialog
    setTeacherToDelete({ teacherId: actualTeacherId, schoolId });
    setTeacherDeleteDialog(true);
  } catch (error) {
    console.error("Σφάλμα κατά την προετοιμασία αφαίρεσης εκπαιδευτή:", error);
    alert("Σφάλμα: " + error.message);
  }
};
  // CRUD ΛΕΙΤΟΥΡΓΙΕΣ ΣΧΟΛΩΝ
  // Προσθήκη νέας σχολής
  const handleAddSxoli = async (newSxoli) => {
    try {
   
      
      // Δημιουργία αντικειμένου για αποστολή στο API
      const formattedSxoli = {
        klados: newSxoli.klados,
        epipedo: newSxoli.epipedo,
        timi: newSxoli.timi ? parseInt(newSxoli.timi) : null,
        etos: newSxoli.etos ? parseInt(newSxoli.etos) : null,
        seira: newSxoli.seira ? parseInt(newSxoli.seira) : null
      };

      // Μορφοποίηση τοποθεσιών αν υπάρχουν - βελτιωμένη διαχείριση
      if (newSxoli.topothesies && newSxoli.topothesies.length > 0) {
        // Αφαίρεση των ID που χρησιμοποιούνται μόνο στο frontend
        formattedSxoli.topothesies = newSxoli.topothesies.map(loc => ({
          topothesia: loc.topothesia,
          start: loc.start || loc.hmerominia_enarksis,
          end: loc.end || loc.hmerominia_liksis
        }));
      } else {
        // Ορισμός κενού πίνακα όταν δεν υπάρχουν τοποθεσίες
        formattedSxoli.topothesies = [];
      }

      // Αποστολή στο API με χειρισμό σφαλμάτων
      try {
        const response = await api.post("/sxoles", formattedSxoli);
       
        // Τοπική ενημέρωση - προσθήκη της νέας σχολής στο state με όλα τα απαραίτητα δεδομένα
        const newSchoolWithId = {
          ...response.data,
          id_sxolis: response.data.id_sxolis || response.data.id,
          ekpaideutes: [], // Αρχικοποίηση με κενό πίνακα εκπαιδευτών
          topothesies: formattedSxoli.topothesies // Εδώ προσθέτουμε τις τοποθεσίες που έστειλε ο χρήστης
        };
        
        // Ενημέρωση του state σχολών τοπικά
        setSxolesData(prev => [...prev, newSchoolWithId]);
        
        // Ενημέρωση διαθέσιμων ετών αν χρειάζεται
        if (newSchoolWithId.etos && !availableYears.includes(newSchoolWithId.etos)) {
          setAvailableYears(prev => [...prev, newSchoolWithId.etos].sort((a, b) => b - a));
        }
        
        setAddSxoliDialogOpen(false);
      } catch (apiError) {
        if (apiError.response?.data?.error && apiError.response.data.error.includes("Unique constraint")) {
          throw new Error("Υπάρχει ήδη σχολή με το ίδιο ID. Επικοινωνήστε με τον διαχειριστή του συστήματος.");
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη σχολής:", error);
      alert("Σφάλμα κατά την προσθήκη σχολής: " + (error.response?.data?.error || error.message));
    }
  };

  // Επεξεργασία υπάρχουσας σχολής
  const handleEditSxoli = async (editedSxoli) => {
    try {
      if (!currentSxoliId) {
        throw new Error("Δεν υπάρχει ID σχολής για επεξεργασία");
      }
      
      // Δημιουργία αντικειμένου για αποστολή στο API
      const formattedSxoli = {
        klados: editedSxoli.klados,
        epipedo: editedSxoli.epipedo,
        timi: editedSxoli.timi ? parseInt(editedSxoli.timi) : null,
        etos: editedSxoli.etos ? parseInt(editedSxoli.etos) : null,
        seira: editedSxoli.seira ? parseInt(editedSxoli.seira) : null
      };

      // Μορφοποίηση τοποθεσιών - αποθήκευση απευθείας ως αντικείμενο
      if (editedSxoli.topothesies && editedSxoli.topothesies.length > 0) {
        formattedSxoli.topothesies = editedSxoli.topothesies.map(loc => ({
          topothesia: loc.topothesia,
          start: loc.start || loc.hmerominia_enarksis,
          end: loc.end || loc.hmerominia_liksis
        }));
      } else {
        formattedSxoli.topothesies = []; // Κενός πίνακας αν δεν υπάρχουν τοποθεσίες
      }

      // Αποστολή στο API
      const response = await api.put(`/sxoles/${currentSxoliId}`, formattedSxoli);
      
      // Κατασκευή του πλήρους ενημερωμένου αντικειμένου σχολής
 // Κατασκευή του πλήρους ενημερωμένου αντικειμένου σχολής
const updatedSchool = {
  ...formattedSxoli,
  id: currentSxoliId,
  id_sxolis: currentSxoliId,
  // Δυναμικός υπολογισμός του ονόματος από τα ενημερωμένα πεδία
  onoma: `${formattedSxoli.klados || ""} ${formattedSxoli.epipedo || ""} ${formattedSxoli.etos || ""}`.trim()
};
      
      // Τοπικές ενημερώσεις καταστάσεων
      // 1. Ενημέρωση της σχολής στο sxolesData
      setSxolesData(prev => {
        const updatedSxolesData = prev.map(sxoli => 
          (sxoli.id_sxolis === currentSxoliId || sxoli.id === currentSxoliId)
            ? { 
                ...sxoli, 
                ...updatedSchool,
                // Διατήρηση υπαρχόντων εκπαιδευτών
                ekpaideutes: sxoli.ekpaideutes || [],
                // Ensure simmetoxes property is preserved
                simmetoxes: sxoli.simmetoxes
              }
            : sxoli
        );
        return updatedSxolesData;
      });
      
      // 2. Ενημέρωση της αναφοράς σχολής στα δεδομένα εκπαιδευτών
      setEkpaideutesData(prev => {
        return prev.map(ekpaideutis => {
          if (ekpaideutis.sxoles && Array.isArray(ekpaideutis.sxoles)) {
            const updatedSxoles = ekpaideutis.sxoles.map(sxoli => 
              (sxoli.id_sxolis === currentSxoliId || sxoli.id === currentSxoliId)
                ? { ...sxoli, ...updatedSchool }
                : sxoli
            );
            
            return { ...ekpaideutis, sxoles: updatedSxoles };
          }
          return ekpaideutis;
        });
      });
      
      // 3. Ενημέρωση διαθέσιμων ετών με τον νέο χρόνο συμπεριλαμβανόμενο
      const allYears = [...new Set([
        ...(formattedSxoli.etos ? [formattedSxoli.etos] : []), 
        ...sxolesData
          .filter(sxoli => sxoli.id_sxolis !== currentSxoliId && sxoli.id !== currentSxoliId)
          .map(s => s.etos)
          .filter(year => year !== null && year !== undefined)
      ])].sort((a, b) => b - a);
      
      setAvailableYears(allYears);
      
      // Κλείσιμο διαλόγου και καθαρισμός καταστάσεων
      setEditSxoliDialogOpen(false);
      setEditSxoliData(null);
      setCurrentSxoliId(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία σχολής:", error);
      alert("Σφάλμα κατά την επεξεργασία σχολής: " + (error.response?.data?.error || error.message));
    }
  };

  // Διαγραφή σχολής
  const handleDeleteSxoli = async (id) => {
    try {
      if (!id) {
        alert("Δεν υπάρχει ID σχολής για διαγραφή");
        return;
      }
      
      // Remove this redundant confirmation since DataTable already confirms deletion
      // if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη σχολή;")) {
      //   return;
      // }
      
      // Απευθείας κλήση του API
      await api.delete(`/sxoles/${id}`);
      
      // Τοπικές ενημερώσεις καταστάσεων
      // 1. Αφαίρεση σχολής από το sxolesData
      setSxolesData(prev => prev.filter(sxoli => 
        sxoli.id_sxolis !== id && sxoli.id !== id
      ));
      
      // 2. Αφαίρεση σχολής από τις λίστες σχολών των εκπαιδευτών
      setEkpaideutesData(prev => {
        return prev.map(ekpaideutis => {
          if (ekpaideutis.sxoles && Array.isArray(ekpaideutis.sxoles)) {
            // Φιλτράρισμα της διαγραμμένης σχολής από τις σχολές του εκπαιδευτή
            return {
              ...ekpaideutis,
              sxoles: ekpaideutis.sxoles.filter(sxoli => 
                sxoli.id_sxolis !== id && sxoli.id !== id
              )
            };
          }
          return ekpaideutis;
        });
      });
      
      // 3. Ενημέρωση διαθέσιμων ετών (επανυπολογισμός με βάση τις υπόλοιπες σχολές)
      const remainingYears = [...new Set(
        sxolesData
          .filter(sxoli => sxoli.id_sxolis !== id && sxoli.id !== id)
          .map(s => s.etos)
          .filter(year => year !== null && year !== undefined)
      )].sort((a, b) => b - a);
      
      setAvailableYears(remainingYears);
      
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή σχολής:", error);
      
      if (error.response?.status === 409) {
        alert(`Δεν μπορεί να διαγραφεί η σχολή γιατί έχει ${error.response.data.count} παρακολουθήσεις`);
      } else {
        alert("Σφάλμα κατά τη διαγραφή σχολής: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // Διόρθωση στο handleEditEkpaideutiClick - Γραμμή ~1330
const handleEditEkpaideutiClick = async (row) => {
  try {
    
    if (!row) {
      throw new Error("Δεν βρέθηκαν δεδομένα για τον εκπαιδευτή");
      return;
    }
    
    // Διασφαλίζουμε ότι έχουμε τα απαραίτητα δεδομένα από το row
    // αντί να κάνουμε API call που μπορεί να αποτύχει
    const ekpaideutisData = {
      id: row.id_epafis || row.id_ekpaideuti, // Αποθηκεύουμε το ID
      id_epafis: row.id_epafis || row.id_ekpaideuti, // Διπλό ID για συμβατότητα
      onoma: row.onoma || "",
      epitheto: row.epitheto || "",
      email: row.email || "",
      tilefono: row.tilefono || "",
      epipedo: row.epipedo || "",
      klados: row.klados || ""
    };
    
    
    // Βεβαιωνόμαστε ότι έχουμε έγκυρα δεδομένα πριν ανοίξουμε το dialog
    if (!ekpaideutisData.onoma && !ekpaideutisData.epitheto) {
      throw new Error("Δεν βρέθηκαν έγκυρα δεδομένα εκπαιδευτή");
    }
  
    setEditEkpaideutiData(ekpaideutisData);
    setCurrentEkpaideutisId(ekpaideutisData.id_epafis);
    setEditEkpaideutiDialogOpen(true);
  } catch (error) {
    console.error("Σφάλμα κατά τη φόρτωση δεδομένων εκπαιδευτή:", error);
    alert("Σφάλμα κατά τη φόρτωση δεδομένων εκπαιδευτή: " + (error.response?.data?.error || error.message));
  }
};

  // CRUD ΛΕΙΤΟΥΡΓΙΕΣ ΕΚΠΑΙΔΕΥΤΩΝ
  // Προσθήκη νέου εκπαιδευτή
  const handleAddEkpaideutis = async (newEkpaideutis) => {
    try {
      
      // Δημιουργία αντικειμένου για αποστολή στο API
      const formattedEkpaideutis = {
        onoma: newEkpaideutis.onoma,
        epitheto: newEkpaideutis.epitheto,
        email: newEkpaideutis.email,
        tilefono: newEkpaideutis.tilefono,
        idiotita: "Εκπαιδευτής",
        ekpaideutis: {
          create: {
            epipedo: newEkpaideutis.epipedo,
            klados: newEkpaideutis.klados
          }
        }
      };

      // Αποστολή στο API
      const response = await api.post("/Repafes", formattedEkpaideutis);
      
      // Get the created teacher data with ID
      const newTeacherData = response.data;
      
      // Create complete teacher object for local state
      const newTeacher = {
        id_epafis: newTeacherData.id_epafis || newTeacherData.id,
        id_ekpaideuti: newTeacherData.id_ekpaideuti,
        onoma: newTeacherData.onoma,
        epitheto: newTeacherData.epitheto,
        email: newTeacherData.email,
        tilefono: newTeacherData.tilefono,
        epipedo: newEkpaideutis.epipedo,
        klados: newEkpaideutis.klados,
        sxoles: [] // Initialize with empty schools array
      };
      
      // Update teachers state locally
      setEkpaideutesData(prev => [...prev, newTeacher]);
      
      setAddEkpaideutiDialogOpen(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη εκπαιδευτή:", error);
      alert("Σφάλμα κατά την προσθήκη εκπαιδευτή: " + (error.response?.data?.error || error.message));
    }
  };

  // Επεξεργασία υπάρχοντος εκπαιδευτή
  const handleEditEkpaideutis = async (editedEkpaideutis) => {
    try {
      
      if (!currentEkpaideutisId) {
        throw new Error("Δεν υπάρχει ID εκπαιδευτή για επεξεργασία");
      }
      
      // Δημιουργία αντικειμένου για αποστολή στο API
      const formattedEkpaideutis = {
        onoma: editedEkpaideutis.onoma,
        epitheto: editedEkpaideutis.epitheto,
        email: editedEkpaideutis.email,
        tilefono: editedEkpaideutis.tilefono,
        epipedo: editedEkpaideutis.epipedo,
        klados: editedEkpaideutis.klados
      };

      // Αποστολή στο API με το νέο endpoint - διορθωμένη διεύθυνση από Repafes σε sxoles
      await api.put(`/sxoles/ekpaideutis/${currentEkpaideutisId}`, formattedEkpaideutis);
      
      // Τοπικές ενημερώσεις καταστάσεων
      // 1. Ενημέρωση του εκπαιδευτή στο ekpaideutesData
      setEkpaideutesData(prev => {
        return prev.map(ekpaideutis => {
          if (ekpaideutis.id_epafis === currentEkpaideutisId || 
              ekpaideutis.id_ekpaideuti === currentEkpaideutisId || 
              ekpaideutis.id === currentEkpaideutisId) {
            
            // Διατήρηση της λίστας σχολών
            return {
              ...ekpaideutis,
              onoma: formattedEkpaideutis.onoma,
              epitheto: formattedEkpaideutis.epitheto,
              email: formattedEkpaideutis.email,
              tilefono: formattedEkpaideutis.tilefono,
              epipedo: formattedEkpaideutis.epipedo,
              klados: formattedEkpaideutis.klados
            };
          }
          return ekpaideutis;
        });
      });
      
      // 2. Ενημέρωση των δεδομένων του εκπαιδευτή στις σχολές
      setSxolesData(prev => {
        return prev.map(sxoli => {
          if (sxoli.ekpaideutes && Array.isArray(sxoli.ekpaideutes)) {
            const updatedEkpaideutes = sxoli.ekpaideutes.map(ekpaideutis => {
              if (ekpaideutis.id_ekpaideuti === currentEkpaideutisId || 
                  ekpaideutis.id_epafis === currentEkpaideutisId || 
                  ekpaideutis.id === currentEkpaideutisId) {
                
                return {
                  ...ekpaideutis,
                  onoma: formattedEkpaideutis.onoma,
                  epitheto: formattedEkpaideutis.epitheto,
                  email: formattedEkpaideutis.email,
                  tilefono: formattedEkpaideutis.tilefono,
                  epipedo: formattedEkpaideutis.epipedo,
                  klados: formattedEkpaideutis.klados
                };
              }
              return ekpaideutis;
            });
            
            return { ...sxoli, ekpaideutes: updatedEkpaideutes };
          }
          return sxoli;
        });
      });
      
      setEditEkpaideutiDialogOpen(false);
      setEditEkpaideutiData(null);
      setCurrentEkpaideutisId(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία εκπαιδευτή:", error);
           alert("Σφάλμα κατά την επεξεργασία εκπαιδευτή: " + (error.response?.data?.error || error.message));
    }
  };

  // Διαγραφή εκπαιδευτή - εντελώς νέα έκδοση
const handleDeleteEkpaideutis = async (rowOrId) => {
  try {
    
    // ΒΗΜΑ 1: Βρίσκουμε το ID με οποιονδήποτε τρόπο μπορούμε
    let ekpaideutisId = null;
    
    // A. Αν είναι αριθμός ή string, το χρησιμοποιούμε άμεσα
    if (typeof rowOrId === 'number' || (typeof rowOrId === 'string' && rowOrId.trim() !== '')) {
      ekpaideutisId = rowOrId;
    } 
    // B. Αν είναι αντικείμενο, ψάχνουμε για ID μέσα σε αυτό
    else if (rowOrId && typeof rowOrId === 'object') {
      ekpaideutisId = rowOrId.id_ekpaideuti || rowOrId.id_epafis || rowOrId.id ||
        (rowOrId.original && (rowOrId.original.id_ekpaideuti || rowOrId.original.id_epafis || rowOrId.original.id));
    }
    // Γ. Αν είναι undefined/null, προσπαθούμε να πάρουμε το ID από το DOM
    else {
      // 1. Έλεγχος για επιλεγμένη σειρά με κλάση Mui-selected
      const selectedRow = document.querySelector('.MuiDataGrid-row.Mui-selected');
      if (selectedRow) {
        const rowId = selectedRow.getAttribute('data-id');
        if (rowId) {
          ekpaideutisId = rowId;
        }
      }
      
      // 2. Έλεγχος για πρόσφατα κλικαρισμένο κουμπί διαγραφής
      if (!ekpaideutisId) {
        const deleteBtn = document.querySelector('.MuiIconButton-root:focus');
        if (deleteBtn) {
          const row = deleteBtn.closest('.MuiDataGrid-row');
          if (row) {
            const rowId = row.getAttribute('data-id');
            if (rowId) {
              ekpaideutisId = rowId;
            }
          }
        }
      }
      
      // 3. Έλεγχος για το currentEkpaideutisId από το state
      if (!ekpaideutisId && currentEkpaideutisId) {
        ekpaideutisId = currentEkpaideutisId;
      }
    }

    // Αν ακόμα δεν έχουμε ID, αναζήτηση στον πίνακα εκπαιδευτών
    if (!ekpaideutisId) {
      
      // Δημιουργία popup επιλογής
      if (ekpaideutesData.length > 0) {
        const instructorsList = ekpaideutesData.map(e => 
          `${e.id_ekpaideuti || e.id_epafis || e.id}: ${e.onoma} ${e.epitheto}`
        ).join('\n');
        
        const userInput = prompt(
          `Παρακαλώ επιλέξτε ID εκπαιδευτή για διαγραφή:\n\n${instructorsList}`
        );
        
        if (userInput) {
          const parsedId = parseInt(userInput.split(':')[0].trim());
          if (!isNaN(parsedId)) {
            ekpaideutisId = parsedId;
          }
        }
      }
    }

    // Αν ακόμα δεν έχουμε ID, σταματάμε
    if (!ekpaideutisId && ekpaideutisId !== 0) {
      console.error("Could not determine which instructor to delete");
      alert("Δεν ήταν δυνατό να προσδιοριστεί ποιος εκπαιδευτής να διαγραφεί. Παρακαλώ επιλέξτε έναν εκπαιδευτή και δοκιμάστε ξανά.");
      return;
    }

    // ΒΗΜΑ 2: Μετατροπή σε αριθμό αν είναι string
    const numericId = parseInt(ekpaideutisId);
    if (isNaN(numericId)) {
      console.error("ID is not a valid number:", ekpaideutisId);
      alert("Το ID δεν είναι έγκυρο.");
      return;
    }
    

    // ΒΗΜΑ 3: Εύρεση εκπαιδευτή στα τοπικά δεδομένα
    const instructor = ekpaideutesData.find(e => 
      e.id_ekpaideuti == numericId || 
      e.id_epafis == numericId || 
      e.id == numericId
    );
    
    // ΒΗΜΑ 4: Αφαιρέθηκε η επιβεβαίωση που είναι περιττή αφού την παρέχει το DataTable

    // ΒΗΜΑ 5: Αφαίρεση από όλες τις σχολές πρώτα
    const schools = sxolesData.filter(school => 
      Array.isArray(school.ekpaideutes) && 
      school.ekpaideutes.some(t => 
        t.id == numericId || 
        t.id_ekpaideuti == numericId || 
        t.id_epafis == numericId
      )
    );
    
    
    for (const school of schools) {
      try {
        const schoolId = school.id_sxolis || school.id;
        await api.delete(`/sxoles/${schoolId}/ekpaideutis/${numericId}`);
      } catch (err) {
        console.error(`Failed to remove instructor from school:`, err);
      }
    }

    // ΒΗΜΑ 6: Διαγραφή του εκπαιδευτή
    await api.delete(`/Repafes/${numericId}`);

    // ΒΗΜΑ 7: Ενημέρωση τοπικών δεδομένων
    setEkpaideutesData(prev =>
      prev.filter(e =>
        e.id_epafis != numericId &&
        e.id_ekpaideuti != numericId &&
        e.id != numericId
      )
    );
    
    setSxolesData(prev =>
      prev.map(sxoli => ({
        ...sxoli,
        ekpaideutes: Array.isArray(sxoli.ekpaideutes)
          ? sxoli.ekpaideutes.filter(t =>
              t.id != numericId &&
              t.id_ekpaideuti != numericId &&
              t.id_epafis != numericId
            )
          : sxoli.ekpaideutes
      }))
    );
    
  } catch (error) {
    console.error("Error deleting instructor:", error);
    alert("Σφάλμα κατά τη διαγραφή εκπαιδευτή: " + (error.response?.data?.error || error.message));
  }
};

  // Dialog για επιλογή εκπαιδευτών
  

  // Προσθήκη κοντά στα άλλα useEffect περίπου στη γραμμή 500
  useEffect(() => {
    // Όταν αλλάζει το επιλεγμένο row του DataTable, αποθήκευση του ID
    const handleRowSelection = (rowData) => {
      if (rowData && (rowData.id_sxolis || rowData.id)) {
        const schoolId = rowData.id_sxolis || rowData.id;
        setCurrentSchoolForTeachers(schoolId);
      }
    };
    
    // Προσθήκη event listener στον DataTable
    document.addEventListener('row-selected', handleRowSelection);
    
    return () => {
      document.removeEventListener('row-selected', handleRowSelection);
    };
  }, []);

  // Compute available years when sxolesData changes
  useEffect(() => {
    if (sxolesData.length > 0) {
      const years = [...new Set(sxolesData
        .map(s => s.etos)
        .filter(year => year !== null && year !== undefined)
        .sort((a, b) => b - a))];
      setAvailableYears(years);
    }
  }, [sxolesData]);
  
  // Filter schools based on selected year
  const filteredSxolesData = yearFilter 
    ? sxolesData.filter(sxoli => sxoli.etos == yearFilter) 
    : sxolesData;
    
  // Handler for year filter change
  const handleYearFilterChange = (event) => {
    setYearFilter(event.target.value);
  };
  
  // Handler to clear the filter
  const handleClearFilter = () => {
    setYearFilter("");
  };
const fetchAvailableMembers = async (callback) => {
  try {
    setLoading(true);
    
    // First, get all instructors to ensure we have their IDs for comparison
    const instructorsResponse = await api.get("/Repafes/ekpaideutes-me-sxoles");
    const instructorIds = instructorsResponse.data.map(instructor => 
      instructor.id_epafis || instructor.id_ekpaideuti || instructor.id
    );
    
    // Get all members
    const response = await api.get("/melitousillogou/all");
    
    // Enhanced filtering that compares member IDs with instructor IDs
    const members = response.data.filter(member => {
      const memberId = member.id_melous || member.id_es_melous || member.id_ekso_melous || member.id;
      
      // Check if member ID is in the instructor IDs list
      if (instructorIds.includes(memberId)) return false;
      
      // Check ekpaideutis property
      if (member.ekpaideutis) return false;
      
      // Check idiotita property for "εκπαιδευτ"
      if (typeof member.idiotita === "string" && 
          member.idiotita.toLowerCase().includes("εκπαιδευτ")) {
        return false;
      }
      
      // Check roles array
      if (member.roles && 
          Array.isArray(member.roles) && 
          member.roles.some(r => r.toLowerCase().includes("εκπαιδευτ"))) {
        return false;
      }
      
      // Also check epafes.idiotita if available
      if (member.melos?.epafes?.idiotita && 
          typeof member.melos.epafes.idiotita === "string" &&
          member.melos.epafes.idiotita.toLowerCase().includes("εκπαιδευτ")) {
        return false;
      }
      
      // If we got here, the member is not an instructor
      return true;
    });

    // Format members for display in selection dialog
    const formattedMembers = members.map(member => ({
      id: member.id_es_melous || member.id_ekso_melous || member.id,
      fullName: `${member.melos?.epafes?.epitheto || ""} ${member.melos?.epafes?.onoma || ""} ${member.tipo_melous === "esoteriko" ? "(Εσωτερικό)" : "(Εξωτερικό)"}`,
      email: member.melos?.epafes?.email || "",
      tilefono: member.melos?.epafes?.tilefono || ""
    }));

    setAvailableMembers(formattedMembers);
    setLoading(false);

    if (typeof callback === 'function') callback();
  } catch (error) {
    console.error("Σφάλμα κατά τη φόρτωση μελών:", error);
    alert("Σφάλμα κατά τη φόρτωση μελών: " + error.message);
    setLoading(false);
  }
};

// Update the handleConvertMemberToInstructor function to remove the validation for epipedo and klados
const handleConvertMemberToInstructor = async () => {
  if (!selectedMemberId) {
    alert("Παρακαλώ επιλέξτε ένα μέλος");
    return;
  }
  
  // Remove the validation check for epipedo and klados
  // if (!instructorFields.epipedo || !instructorFields.klados) {
  //   alert("Παρακαλώ συμπληρώστε όλα τα πεδία");
  //   return;
  // 
  
  try {
    setLoading(true);
    
    // API call to convert member to instructor
    const response = await api.post("/sxoles/convert-member", {
      memberId: selectedMemberId,
      epipedo: instructorFields.epipedo || "", // Add fallback empty string
      klados: instructorFields.klados || ""   // Add fallback empty string
    });
    
    // Add the new instructor to the local state
    const newInstructor = response.data;
    setEkpaideutesData(prev => [...prev, {
      id_epafis: newInstructor.id_epafis,
      id_ekpaideuti: newInstructor.id_ekpaideuti,
      onoma: newInstructor.onoma,
      epitheto: newInstructor.epitheto,
      email: newInstructor.email,
      tilefono: newInstructor.tilefono,
      epipedo: newInstructor.epipedo,
      klados: newInstructor.klados,
      sxoles: []
    }]);
    
    // Close dialogs and reset state
setMemberSelectionDialogOpen(false);
    setSelectedMemberId("");
    setInstructorFields({
      epipedo: "",
      klados: ""
    });
    
    // Important: Immediately refresh the available members list
    fetchAvailableMembers();
    
    // Show success message
    
    setLoading(false);
  } catch (error) {
    console.error("Σφάλμα κατά τη μετατροπή μέλους σε εκπαιδευτή:", error);
    alert("Σφάλμα: " + (error.response?.data?.error || error.message));
    setLoading(false);
  }
};

// Add this handler to open the member selection dialog
const handleOpenMemberSelection = () => {
  fetchAvailableMembers(() => {
    setMemberSelectionDialogOpen(true);
  });
};

// Add this handler for when a selection is made
// Modify the member selection confirmation handler
const handleMemberSelectionConfirm = (selectedIds) => {
  if (selectedIds && selectedIds.length > 0) {
    setSelectedMemberId(selectedIds[0]); // Get the first selected ID
    setInstructorDetailsDialogOpen(true); // Open instructor details dialog
  }
  setMemberSelectionDialogOpen(false);
};
  // Add this helper function for date formatting
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};

// Helper function to convert from DD/MM/YYYY to YYYY-MM-DD (for input fields)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  try {
    // If it's already in YYYY-MM-DD format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Parse DD/MM/YYYY format
    const parts = dateString.split(/[\/.-]/);
    if (parts.length === 3) {
      // Check if first part is day (length 1-2) and third part is year (length 4)
      if (parts[0].length <= 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    // If format is unrecognized, try to parse as Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return dateString;
  } catch (e) {
    console.error("Error formatting date for input:", e);
    return dateString;
  }
};

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          Διαχείριση Σχολών
        </Typography>
        
        <Box sx={{ mb: 4 }}>

          <Typography variant="h5" sx={{ mb: 2 }}>
            Σχολές ({filteredSxolesData.length})
          </Typography
          >
          
          {/* Year filter component */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel id="year-filter-label">Έτος</InputLabel>
              <Select
                labelId="year-filter-label"
                id="year-filter"
                value={yearFilter}
                label="Έτος"
                onChange={handleYearFilterChange}
              >
                <MenuItem value="">Όλα</MenuItem>
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {yearFilter && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleClearFilter}
              >
                Καθαρισμός Φίλτρου
              </Button>
            )}
          </Box>
          
          <DataTable
            data={filteredSxolesData} // Use filtered data instead of sxolesData
            columns={sxolesColumns}
            detailPanelConfig={sxoliDetailPanelConfig}
            getRowId={(row) => row.id_sxolis}
            initialState={{
              columnVisibility: { id_sxolis: false },
              sorting: [{ id: 'onoma', desc: false }]
            }}
            state={{ isLoading: loading }}
            enableExpand={true}
            enableRowActions={true}
            handleEditClick={handleEditSxoliClick}
            handleDelete={handleDeleteSxoli}
            enableAddNew={true}
            onAddNew={() => setAddSxoliDialogOpen(true)}
          />
        </Box>

<Box sx={{ mb: 3 }}>
  <Typography variant="h5" sx={{ mb: 2 }}>
    Εκπαιδευτές ({ekpaideutesData.length})
  </Typography>
  
  <DataTable
    data={ekpaideutesData}
    columns={ekpaideutesColumns}
    detailPanelConfig={ekpaideutisDetailPanelConfig}
    getRowId={(row) => row.id_ekpaideuti || row.id_epafis || row.id}
    initialState={{
      columnVisibility: { id_ekpaideuti: false },
      sorting: [{ id: 'fullName', desc: false }]
    }}
    state={{ isLoading: loading }}
    enableExpand={true}
    enableRowActions={true}
    handleEditClick={handleEditEkpaideutiClick}
    handleDelete={handleDeleteEkpaideutis}
    deleteConfig={{
      getPayload: (row) => {
        const id = row?.id_ekpaideuti || row?.id_epafis || row?.id;
        return id;
      }
    }}
    enableAddNew={true}
    onAddNew={() => setAddEkpaideutiDialogOpen(true)}
 // First, let's modify the additionalButtons part in the DataTable to open the selection dialog directly
additionalButtons={
  <Button
    variant="contained"
    startIcon={<TransformIcon />}
    onClick={() => {
      // Reset selected member ID
      setSelectedMemberId("");
      setInstructorFields({
        epipedo: "",
        klados: ""
      });
      // Fetch members and open selection dialog directly
      fetchAvailableMembers(() => {
        setMemberSelectionDialogOpen(true);
      });
    }}
  >
    ΜΕΤΑΤΡΟΠΗ ΜΕΛΟΥΣ ΣΕ ΕΚΠΑΙΔΕΥΤΗ
  </Button>
}
  />
</Box>
        
        {/* Dialog για προσθήκη σχολής */}
<AddDialog 
  open={addSxoliDialogOpen}
  onClose={() => setAddSxoliDialogOpen(false)}
  handleAddSave={handleAddSxoli}
  title="Προσθήκη Νέας Σχολής"
  fields={addSxoliFormFields} // Changed from sxoliFormFields to addSxoliFormFields
  fieldComponents={{
    locationEditor: LocationEditor
  }}
/>
        
        {/* Dialog για επεξεργασία σχολής */}
        <EditDialog 
          open={editSxoliDialogOpen}
          onClose={() => {
            setEditSxoliDialogOpen(false);
            setEditSxoliData(null);
            setCurrentSxoliId(null);
          }}
          handleEditSave={handleEditSxoli}
          editValues={editSxoliData}  // Αλλαγή από initialValues σε editValues
          title="Επεξεργασία Σχολής"
          fields={sxoliFormFields}
          fieldComponents={{
            locationEditor: LocationEditor
          }}
        />
        
        {/* Dialog για προσθήκη εκπαιδευτή */}
        <AddDialog 
          open={addEkpaideutiDialogOpen}
          onClose={() => setAddEkpaideutiDialogOpen(false)}
          handleAddSave={handleAddEkpaideutis}
          title="Προσθήκη Νέου Εκπαιδευτή"
          fields={ekpaideutisFormFields}
        />
        
        {/* Dialog για επεξεργασία εκπαιδευτή */}
        <EditDialog 
          open={editEkpaideutiDialogOpen}
          onClose={() => {
            setEditEkpaideutiDialogOpen(false); // Διόρθωση τυπογραφικού λάθους
            setEditEkpaideutiData(null);
            setCurrentEkpaideutisId(null);
          }}
          handleEditSave={handleEditEkpaideutis}
          editValues={editEkpaideutiData || {}} 
          title="Επεξεργασία Εκπαιδευτή"
          fields={ekpaideutisFormFields}
        />

{/* Dialog για επιλογή εκπαιδευτών */}
<AddDialog
  open={teacherSelectionDialogOpen}
  onClose={() => setTeacherSelectionDialogOpen(false)}
  handleAddSave={(selection) => {
    if (selection && selection.id_ekpaideuti) {
      const selectedIds = Array.isArray(selection.id_ekpaideuti) 
        ? selection.id_ekpaideuti 
        : [selection.id_ekpaideuti];
      setSelectedTeachers(selectedIds);
      handleAddSelectedTeachers();
    }
  }}
  title="Προσθήκη Εκπαιδευτών"
  fields={[
    { 
      accessorKey: "id_ekpaideuti", 
      header: "Εκπαιδευτές", 
      type: "tableSelect",
      dataKey: "teachersList",
      singleSelect: false,
      pageSize: 5,
      columns: [
        { field: "fullName", header: "Ονοματεπώνυμο" },
        { field: "email", header: "Email" },
        { field: "phone", header: "Τηλέφωνο" },
        { field: "epipedo", header: "Επίπεδο" },
        { field: "klados", header: "Κλάδος" }
      ],
      searchFields: ["fullName", "email", "phone", "epipedo", "klados"],
      noDataMessage: "Δεν βρέθηκαν διαθέσιμοι εκπαιδευτές"
    }
  ]}
  resourceData={{
    teachersList: availableTeachers.map(teacher => ({
      id: teacher.id_ekpaideuti || teacher.id_epafis || teacher.id,
      fullName: `${teacher.onoma || ""} ${teacher.epitheto || ""}`.trim(),
      email: teacher.email || "",
      phone: teacher.tilefono || "",
      epipedo: teacher.epipedo || "",
      klados: teacher.klados || ""
    }))
  }}
  initialValues={{
    id_ekpaideuti: []
  }}
/>

        {/* Διάλογος επιβεβαίωσης διαγραφής τοποθεσίας */}
        <Dialog
          open={locationDeleteDialog}
          onClose={() => setLocationDeleteDialog(false)}
        >
          <DialogTitle>Επιβεβαίωση Διαγραφής</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την τοποθεσία;
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLocationDeleteDialog(false)} color="primary">
              Άκυρο
            </Button>
            <Button onClick={confirmLocationDeletion} color="error" autoFocus>
              Διαγραφή
            </Button>
          </DialogActions>
        </Dialog>

        {/* Teacher deletion confirmation dialog */}
        <Dialog
          open={teacherDeleteDialog}
          onClose={() => setTeacherDeleteDialog(false)}
        >
          <DialogTitle>Επιβεβαίωση Αφαίρεσης</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτόν τον εκπαιδευτή από τη σχολή;
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTeacherDeleteDialog(false)} color="primary">
              Ακύρωση
            </Button>
            <Button onClick={confirmTeacherDeletion} color="error" autoFocus>
              Αφαίρεση
            </Button>
          </DialogActions>
        </Dialog>

        {/* Διάλογος για μετατροπή μέλους σε εκπαιδευτή */}
    <Dialog 
      open={openMemberConversionDialog}
      onClose={() => setOpenMemberConversionDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Μετατροπή Μέλους σε Εκπαιδευτή
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Member selection button */}
          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1" fontWeight="500">Επιλογή Μέλους</Typography>
            {selectedMemberId ? (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f5f5f5' }}>
                <Typography>
                  {availableMembers.find(m => m.id == selectedMemberId)?.fullName || "Επιλεγμένο μέλος"}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleOpenMemberSelection}
                >
                  Αλλαγή
                </Button>
              </Box>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleOpenMemberSelection}
                fullWidth
              >
                Επιλογή Μέλους
              </Button>
            )}
          </Box>

          {/* Instructor fields */}
          <TextField
            margin="normal"
            label="Επίπεδο"
            fullWidth
            value={instructorFields.epipedo}
            onChange={(e) => setInstructorFields({...instructorFields, epipedo: e.target.value})}

          />
          
          <TextField
            margin="normal"
            label="Κλάδος"
            fullWidth
            value={instructorFields.klados}
            onChange={(e) => setInstructorFields({...instructorFields, klados: e.target.value})}

          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setInstructorDetailsDialogOpen(false)}>
          Άκυρο
        </Button>
        <Button 
          onClick={handleConvertMemberToInstructor} 
          variant="contained" 
          color="primary"
    disabled={!selectedMemberId} // Remove the check for epipedo and klados
        >
          Μετατροπή
        </Button>
      </DialogActions>
    </Dialog>

    {/* Use the SelectionDialog component for member selection */}
<Dialog
  open={memberSelectionDialogOpen}
  onClose={() => setMemberSelectionDialogOpen(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>Μετατροπή Μέλους σε Εκπαιδευτή</DialogTitle>
  <DialogContent>
    {/* Search field */}
    <Box sx={{ mb: 2, mt: 1 }}>
      <TextField
        fullWidth
        placeholder="Αναζήτηση μέλους..."
        variant="outlined"
        size="small"
        value={searchText || ""}
        onChange={(e) => setSearchText(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
            </InputAdornment>
          ),
        }}
      />
    </Box>

    {/* Members selection table with pagination */}
    <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 3 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell>Ονοματεπώνυμο</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Τηλέφωνο</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {availableMembers
            .filter(member => 
              !searchText || 
              member.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
              (member.email && member.email.toLowerCase().includes(searchText.toLowerCase())) ||
              (member.tilefono && member.tilefono.includes(searchText))
            )
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((member) => (
              <TableRow 
                key={member.id}
                hover
                onClick={() => setSelectedMemberId(selectedMemberId === member.id ? "" : member.id)}
                selected={selectedMemberId === member.id}
              >
                <TableCell padding="checkbox">
                  <Radio checked={selectedMemberId === member.id} />
                </TableCell>
                <TableCell>{member.fullName}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.tilefono}</TableCell>
              </TableRow>
            ))}
          {availableMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Δεν βρέθηκαν διαθέσιμα μέλη
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={availableMembers.filter(member => 
        !searchText || 
        member.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (member.tilefono && member.tilefono.includes(searchText))
      ).length}
      page={page}
      onPageChange={(event, newPage) => setPage(newPage)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
      }}
      labelRowsPerPage="Εγγραφές ανά σελίδα:"
      labelDisplayedRows={({ from, to, count }) => 
        `${from}-${to} από ${count !== -1 ? count : `πάνω από ${to}`}`
      }
    />

    {/* Instructor details fields */}
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>Στοιχεία Εκπαιδευτή</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Επίπεδο"
            fullWidth
            value={instructorFields.epipedo}
            onChange={(e) => setInstructorFields({...instructorFields, epipedo: e.target.value})}

          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Κλάδος"
            fullWidth
            value={instructorFields.klados}
            onChange={(e) => setInstructorFields({...instructorFields, klados: e.target.value})}
  
          />
        </Grid>
      </Grid>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setMemberSelectionDialogOpen(false)} color="primary">
      Άκυρωση
    </Button>
    <Button 
      onClick={handleConvertMemberToInstructor} 
      variant="contained" 
      color="primary"
    disabled={!selectedMemberId} // Remove the check for epipedo and klados
    >
      Μετατροπή
    </Button>
  </DialogActions>
</Dialog>

    {/* Διάλογος για διαχείριση τοποθεσιών */}
    <LocationEditorDialog 
      open={locationDialogOpen}
      onClose={() => {
        setLocationDialogOpen(false);
        setEditingSchoolForLocation(null);
      }}
      value={currentLocations}
      onSave={handleSaveLocations}
      title="Διαχείριση Τοποθεσιών"
    />
      </Box>  
  </LocalizationProvider>
  );
}