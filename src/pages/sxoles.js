import React, { useState, useEffect } from "react";
import api from '../utils/api';
import { Box, Typography, Paper, TextField, IconButton, Button, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import * as yup from "yup";
import DeleteIcon from '@mui/icons-material/Delete';
import "./App.css";

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
    console.log("extractId called with null/undefined");
    return null;
  }
  
  // Αν είναι ήδη primitive (αριθμός/string) προσπαθούμε να το επιστρέψουμε άμεσα
  if (typeof obj !== 'object') {
    console.log("extractId called with primitive value:", obj);
    return obj;
  }
  
  // Λεπτομερής καταγραφή για διάγνωση
  console.log("Attempting to extract ID from:", obj);
  
  // Έλεγχος για απευθείας ID properties
  const idProps = ['id_sxolis', 'id', 'id_ekpaideuti', 'id_epafis'];
  for (const prop of idProps) {
    if (obj[prop] !== undefined) {
      console.log(`Found ID in property '${prop}':`, obj[prop]);
      return obj[prop];
    }
  }
  
  // Έλεγχος σε εμφωλευμένα αντικείμενα
  if (obj.original) {
    for (const prop of idProps) {
      if (obj.original[prop] !== undefined) {
        console.log(`Found ID in original.${prop}:`, obj.original[prop]);
        return obj.original[prop];
      }
    }
  }
  
  if (obj.row) {
    for (const prop of idProps) {
      if (obj.row[prop] !== undefined) {
        console.log(`Found ID in row.${prop}:`, obj.row[prop]);
        return obj.row[prop];
      }
    }
  }
  
  console.log("No ID could be extracted from object");
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
          
          console.log(`Removing teacher ${teacherId} from school ${schoolId}`);
          
          // Κλήση της συνάρτησης με τα αντίστοιχα IDs
          handleRemoveTeacherFromSchool(teacherId, schoolId);
        },
        onAddNew: (parentRow) => {
          console.log("onAddNew called for teachers with parentRow:", parentRow);
          
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
          console.log("Τοποθεσίες row:", row); // Για διάγνωση
          
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
          console.log("onAddNew called for locations with parentRow:", parentRow);
          
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
          console.log("Λήψη σχολών για τον εκπαιδευτή:", row);
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
    { 
      accessorKey: "topothesies", 
      header: "Τοποθεσίες",
      type: "locationEditor",
      validation: yup.array().of(
        yup.object().shape({
          topothesia: yup.string().required("Η τοποθεσία είναι υποχρεωτική"),
          start: yup.date().required("Η ημερομηνία έναρξης είναι υποχρεωτική"),
          end: yup.date().required("Η ημερομηνία λήξης είναι υποχρεωτική")
        })
      )
    }
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
      validation: yup.string().email("Μη έγκυρο email").required("Το email είναι υποχρεωτικό")
    },
    { 
      accessorKey: "tilefono", 
      header: "Τηλέφωνο",
      validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία")
    },
    { 
      accessorKey: "epipedo", 
      header: "Επίπεδο",
      validation: yup.string().required("Το επίπεδο είναι υποχρεωτικό")
    },
    { 
      accessorKey: "klados", 
      header: "Κλάδος",
      validation: yup.string().required("Ο κλάδος είναι υποχρεωτικός")
    }
  ];

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
    
    console.log("Loaded sxoles data:", sxolesRes.data);
    console.log("Loaded epafes data with schools:", ekpaideutesRes.data);
    
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
    const [locations, setLocations] = useState([]);
    const [newLocation, setNewLocation] = useState({ 
      topothesia: "", 
      start: "", 
      end: "" 
    });
    
    useEffect(() => {
      if (open) {
        console.log("LocationEditorDialog received value:", value);
        
        // Αρχικοποίηση των τοποθεσιών όταν ανοίγει ο διάλογος
        if (Array.isArray(value) && value.length > 0) {
          // Βεβαιωνόμαστε ότι κάθε τοποθεσία έχει μοναδικό id
          setLocations(value.map((loc, idx) => ({
            ...loc,
            id: loc.id !== undefined ? loc.id : idx,
            topothesia: loc.topothesia || "",
            start: formatDateForInput(loc.start || loc.hmerominia_enarksis || ""),
            end: formatDateForInput(loc.end || loc.hmerominia_liksis || "")
          })));
        } else {
          setLocations([]);
        }
        
        // Καθαρισμός του newLocation
        setNewLocation({ topothesia: "", start: "", end: "" });
      }
    }, [value, open]);
    
    const handleAddLocation = () => {
      if (newLocation.topothesia && newLocation.start && newLocation.end) {
        // Προσθήκη με μοναδικό ID
        const updatedLocations = [
          ...locations, 
          { 
            ...newLocation, 
            id: Date.now() 
          }
        ];
        
        setLocations(updatedLocations);
        setNewLocation({ topothesia: "", start: "", end: "" });
      }
    };
    
    const handleUpdateLocation = (id, field, value) => {
      const updatedLocations = locations.map(loc => 
        loc.id === id ? { ...loc, [field]: value } : loc
      );
      setLocations(updatedLocations);
    };
    
    const handleDeleteLocation = (id) => {
      const updatedLocations = locations.filter(loc => loc.id !== id);
      setLocations(updatedLocations);
    };
    
    const handleSave = () => {
      onSave(locations);
    };
  
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            {/* Λίστα τοποθεσιών */}
            {locations.length > 0 ? (
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
                    {locations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={loc.topothesia}
                            onChange={(e) => handleUpdateLocation(loc.id, "topothesia", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={loc.start}
                            inputProps={{ 
                              max: loc.end || "9999-12-31"
                            }}
                            onChange={(e) => handleUpdateLocation(loc.id, "start", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={loc.end}
                            inputProps={{ 
                              min: loc.start || "0000-01-01"
                            }}
                            onChange={(e) => handleUpdateLocation(loc.id, "end", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleDeleteLocation(loc.id)}>
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
                    onClick={handleAddLocation}
                    disabled={!newLocation.topothesia || !newLocation.start || !newLocation.end}
                  >
                    Προσθήκη
                  </Button>
                </Grid>
              </Grid>
            </Paper>
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
// Βελτίωση του component LocationEditor
const LocationEditor = ({ value, onChange }) => {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState({ 
    topothesia: "", 
    start: "", 
    end: "" 
  });
  
  // Ενημέρωση των locations όταν αλλάζει το value από έξω
  useEffect(() => {
    console.log("LocationEditor received value:", value);
    
    // Αν έχουμε τιμή και είναι πίνακας
    if (Array.isArray(value) && value.length > 0) {
      // Διασφαλίζουμε ότι κάθε τοποθεσία έχει μοναδικό id και σωστά ονόματα πεδίων
      setLocations(value.map((loc, idx) => ({
        ...loc,
        id: loc.id !== undefined ? loc.id : idx,
        topothesia: loc.topothesia || "",
        start: formatDateForInput(loc.start || loc.hmerominia_enarksis || ""), 
        end: formatDateForInput(loc.end || loc.hmerominia_liksis || "")
      })));
    } else {
      // Αν δεν έχουμε αρχική τιμή, ξεκινάμε με άδειο πίνακα
      setLocations([]);
    }
  }, [value]);
  
  // Προσθήκη νέας τοποθεσίας με validation
  const handleAddLocation = () => {
    if (!newLocation.topothesia) {
      alert("Παρακαλώ συμπληρώστε την τοποθεσία");
      return;
    }
    
    if (!newLocation.start) {
      alert("Παρακαλώ επιλέξτε ημερομηνία έναρξης");
      return;
    }
    
    if (!newLocation.end) {
      alert("Παρακαλώ επιλέξτε ημερομηνία λήξης");
      return;
    }
    
    if (new Date(newLocation.end) < new Date(newLocation.start)) {
      alert("Η ημερομηνία λήξης πρέπει να είναι μετά την ημερομηνία έναρξης");
      return;
    }
    
    const updatedLocations = [...locations, { ...newLocation, id: Date.now() }];
    setLocations(updatedLocations);
    setNewLocation({ 
      topothesia: "", 
      start: "", 
      end: "" 
    });
    onChange(updatedLocations);
  };
  
  // Ενημέρωση υπάρχουσας τοποθεσίας
  const handleUpdateLocation = (id, field, value) => {
    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    );
    setLocations(updatedLocations);
    onChange(updatedLocations);
  };
  
  // Διαγραφή τοποθεσίας
  const handleDeleteLocation = (id) => {
    const updatedLocations = locations.filter(loc => loc.id !== id);
    setLocations(updatedLocations);
    onChange(updatedLocations);
  };
  
  return (
    <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>Διαχείριση Τοποθεσιών</Typography>
      
      {/* Λίστα τοποθεσιών */}
      {locations.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 2 }}>
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
              {locations.map((loc) => (
                // Fix: Always ensure each loc has a unique id
                <TableRow key={loc.id !== undefined ? loc.id : `loc-${Date.now()}-${Math.random()}`}>
                  <TableCell>
                    <TextField
                      size="small"
                      value={loc.topothesia}
                      onChange={(e) => handleUpdateLocation(loc.id, "topothesia", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      value={loc.start}
                      inputProps={{ 
                        max: loc.end || "9999-12-31"
                      }}
                      onChange={(e) => handleUpdateLocation(loc.id, "start", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      value={loc.end}
                      inputProps={{ 
                        min: loc.start || "0000-01-01"
                      }}
                      onChange={(e) => handleUpdateLocation(loc.id, "end", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleDeleteLocation(loc.id)}>
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
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Τοποθεσία"
            value={newLocation.topothesia}
            onChange={(e) => setNewLocation({
              ...newLocation, 
              topothesia: e.target.value
            })}
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
            onChange={(e) => setNewLocation({
              ...newLocation, 
              start: e.target.value
            })}
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
            onChange={(e) => setNewLocation({
              ...newLocation, 
              end: e.target.value
            })}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleAddLocation}
            disabled={!newLocation.topothesia || !newLocation.start || !newLocation.end}
          >
            Προσθήκη
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

  // Βελτιωμένη έκδοση του handleAddTopothesia
const handleAddTopothesia = async (parentRow) => {
  try {
    console.log("AddTopothesia called with parentRow:", parentRow);

    // Ασφαλής εξαγωγή schoolId
    const schoolId = typeof parentRow === 'object' ? (parentRow.id_sxolis || parentRow.id) : parentRow;
    
    if (!schoolId && schoolId !== 0) {
      console.error("Could not extract school ID from parentRow:", parentRow);
      alert("Σφάλμα: Δεν βρέθηκε το ID της σχολής.");
      return;
    }

    console.log("Extracted school ID for adding location:", schoolId);

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

  // Replace the handleDeleteTopothesia function with local state update
const handleDeleteTopothesia = async (rowData, parentRow) => {
  try {
    console.log("Delete topothesia:", rowData, "parentRow:", parentRow);
    
    if (!parentRow) {
      console.error("Missing parentRow when deleting topothesia");
      alert("Δεν επιλέχθηκε σχολή");
      return;
    }
    
    // Ασφαλής εξαγωγή schoolId
    const schoolId = typeof parentRow === 'object' ? 
      (parentRow.id_sxolis || parentRow.id) : 
      parentRow;
    
    console.log("School ID for topothesia deletion:", schoolId);
    
    if (!schoolId && schoolId !== 0) {
      console.error("Invalid school ID for topothesia deletion");
      alert("Δεν βρέθηκε ID σχολής");
      return;
    }
    
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την τοποθεσία;")) {
      return;
    }
    
    // Ανάκτηση τρέχουσας σχολής
    const response = await api.get(`/sxoles/${schoolId}`);
    const school = response.data;
    
    // Εξαγωγή τοποθεσιών
    let topothesiaData = school.topothesies;
    
    // Αν δεν υπάρχουν τοποθεσίες, έλεγξε εναλλακτικά ονόματα πεδίων
    if (!topothesiaData) {
      topothesiaData = school.topothesia || (school.details && school.details.topothesia);
    }
    
    if (!topothesiaData) {
      alert("Δεν βρέθηκαν τοποθεσίες για διαγραφή");
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
      return;
    }
    
    console.log("Τοποθεσίες πριν τη διαγραφή:", currentTopothesies);
    console.log("Διαγραφή τοποθεσίας με ID/index:", rowData.id);
    
    // Αφαίρεση της τοποθεσίας με το συγκεκριμένο ID
    const updatedTopothesies = currentTopothesies.filter((_, index) => index !== rowData.id);
    
    console.log("Τοποθεσίες μετά τη διαγραφή:", updatedTopothesies);
    
    // Δημιουργούμε το αντικείμενο ενημέρωσης διατηρώντας τις υπάρχουσες τιμές
    const updateData = {
      klados: school.klados,
      epipedo: school.epipedo,
      timi: school.timi,
      etos: school.etos,
      seira: school.seira,
      // Αποθήκευση του τροποποιημένου πίνακα τοποθεσιών
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
    
    // Προαιρετικά: μήνυμα επιτυχίας
    alert("Η τοποθεσία διαγράφηκε επιτυχώς!");
    
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή τοποθεσίας:", error);
    alert("Σφάλμα κατά τη διαγραφή τοποθεσίας: " + error.message);
  }
};

  // Improved handleSaveLocations with local state updates
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
    
    console.log("Locations to be saved:", formattedLocations);
    
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
    alert("Οι τοποθεσίες αποθηκεύτηκαν με επιτυχία!");
  } catch (error) {
    console.error("Σφάλμα κατά την αποθήκευση τοποθεσιών:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Προετοιμασία για επεξεργασία σχολής
const handleEditSxoliClick = async (row) => {
  try {
    console.log("Edit sxoli clicked with full row data:", row);

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

    console.log("Extracted school ID:", schoolId);

    // Κλήση API για φόρτωση δεδομένων σχολής
    const response = await api.get(`/sxoles/${schoolId}`);
    if (!response.data) {
      throw new Error(`Δεν βρέθηκαν δεδομένα για τη σχολή με ID ${schoolId}`);
    }

    const school = response.data;
    console.log("School details from API:", school);

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

    console.log("Prepared edit data:", sxoliData);

    setEditSxoliData(sxoliData);
    setCurrentSxoliId(schoolId);
    setEditSxoliDialogOpen(true);
  } catch (error) {
    console.error("Σφάλμα κατά τη φόρτωση δεδομένων σχολής για επεξεργασία:", error);
    alert("Σφάλμα κατά τη φόρτωση δεδομένων σχολής: " + (error.response?.data?.error || error.message));
  }
};

// Προσθήκη εκπαιδευτή σε σχολή - γραμμή ~1125
const handleAddTeacherToSchool = async (parentRow) => {
  try {
    console.log("AddTeacherToSchool called with parentRow:", parentRow);

    // Ασφαλής εξαγωγή schoolId
    const schoolId = typeof parentRow === 'object' ? (parentRow.id_sxolis || parentRow.id) : parentRow;
    
    if (!schoolId && schoolId !== 0) {
      console.error("Could not extract school ID from parentRow:", parentRow);
      alert("Σφάλμα: Δεν βρέθηκε το ID της σχολής.");
      return;
    }

    console.log("Extracted school ID for adding teacher:", schoolId);

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

    console.log("Adding teachers to school:", currentSchoolForTeachers, "Teachers:", selectedTeachers);

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
        console.log("Skipping invalid teacher ID:", teacherId);
        continue;
      }
      
      console.log("Adding teacher with ID:", teacherId);

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
    
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να αφαιρέσετε τον εκπαιδευτή από τη σχολή;")) {
      return;
    }
    
    // API call with the correct ID
    await api.delete(`/sxoles/${schoolId}/ekpaideutis/${actualTeacherId}`);
    
    // Local state updates
    // 1. Remove teacher from school's teachers list
    setSxolesData(prev => {
      return prev.map(sxoli => {
        if ((sxoli.id_sxolis == schoolId || sxoli.id == schoolId) && 
            Array.isArray(sxoli.ekpaideutes)) {
          return {
            ...sxoli,
            ekpaideutes: sxoli.ekpaideutes.filter(ekp => 
              ekp.id != actualTeacherId && 
              ekp.id_ekpaideuti != actualTeacherId && 
              ekp.id_epafis != actualTeacherId
            )
          };
        }
        return sxoli;
      });
    });
    
    // 2. Remove school from teacher's schools list
    setEkpaideutesData(prev => {
      return prev.map(ekpaideutis => {
        if ((ekpaideutis.id == actualTeacherId || 
            ekpaideutis.id_ekpaideuti == actualTeacherId || 
            ekpaideutis.id_epafis == actualTeacherId) && 
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
    
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση εκπαιδευτή από τη σχολή:", error);
    alert("Σφάλμα: " + error.message);
  }
};
  // CRUD ΛΕΙΤΟΥΡΓΙΕΣ ΣΧΟΛΩΝ
  // Προσθήκη νέας σχολής
  const handleAddSxoli = async (newSxoli) => {
    try {
      console.log("Adding new sxoli:", newSxoli);
      
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
        console.log("Created new sxoli:", response.data);
        
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
      console.log("Editing sxoli:", editedSxoli, "with ID:", currentSxoliId);
      
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
      await api.put(`/sxoles/${currentSxoliId}`, formattedSxoli);
      console.log("Updated sxoli with ID:", currentSxoliId);
      
      // Τοπικές ενημερώσεις καταστάσεων
      // 1. Ενημέρωση της σχολής στο sxolesData
      setSxolesData(prev => {
        return prev.map(sxoli => 
          sxoli.id_sxolis === currentSxoliId || sxoli.id === currentSxoliId
            ? { 
                ...sxoli, 
                ...formattedSxoli, 
                id_sxolis: currentSxoliId,
                // Διατήρηση υπαρχόντων εκπαιδευτών
                ekpaideutes: sxoli.ekpaideutes || []
              }
            : sxoli
        );
      });
      
      // 2. Ενημέρωση της αναφοράς σχολής στα δεδομένα εκπαιδευτών
      setEkpaideutesData(prev => {
        return prev.map(ekpaideutis => {
          // Έλεγχος αν αυτός ο εκπαιδευτής έχει τη σχολή που ενημερώνουμε
          if (ekpaideutis.sxoles && Array.isArray(ekpaideutis.sxoles)) {
            // Ενημέρωση των στοιχείων της σχολής στη λίστα σχολών του εκπαιδευτή
            const updatedSxoles = ekpaideutis.sxoles.map(sxoli => 
              (sxoli.id_sxolis === currentSxoliId || sxoli.id === currentSxoliId)
                ? { ...sxoli, ...formattedSxoli, id_sxolis: currentSxoliId }
                : sxoli
            );
            
            return { ...ekpaideutis, sxoles: updatedSxoles };
          }
          return ekpaideutis;
        });
      });
      
      // 3. Ενημέρωση διαθέσιμων ετών αν χρειάζεται (επανυπολογισμός με βάση τις υπόλοιπες σχολές)
      const remainingYears = [...new Set(
        sxolesData
          .filter(sxoli => sxoli.id_sxolis !== currentSxoliId && sxoli.id !== currentSxoliId)
          .map(s => s.etos)
          .filter(year => year !== null && year !== undefined)
      )].sort((a, b) => b - a);
      
      setAvailableYears(remainingYears);
      
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
      console.log("Deleting sxoli with ID:", id);
      
      if (!id) {
        alert("Δεν υπάρχει ID σχολής για διαγραφή");
        return;
      }
      
      if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη σχολή;")) {
        return;
      }
      
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
      
      // 3. Ενημέρωση διαθέσιμων ετών αν χρειάζεται (επανυπολογισμός με βάση τις υπόλοιπες σχολές)
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
    console.log("Edit ekpaideutis clicked for row:", row);
    
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
    
    console.log("Prepared ekpaideutis data for editing:", ekpaideutisData);
    
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
      console.log("Adding new ekpaideutis:", newEkpaideutis);
      
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
      console.log("Created new ekpaideutis:", newTeacherData);
      
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
      console.log("Editing ekpaideutis:", editedEkpaideutis, "with ID:", currentEkpaideutisId);
      
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

  // Διαγραφή εκπαιδευτή
// Διαγραφή εκπαιδευτή - εντελώς νέα έκδοση
const handleDeleteEkpaideutis = async (rowOrId) => {
  try {
    console.log("Delete triggered with arg:", rowOrId);
    
    // ΒΗΜΑ 1: Βρίσκουμε το ID με οποιονδήποτε τρόπο μπορούμε
    let ekpaideutisId = null;
    
    // A. Αν είναι αριθμός ή string, το χρησιμοποιούμε άμεσα
    if (typeof rowOrId === 'number' || (typeof rowOrId === 'string' && rowOrId.trim() !== '')) {
      ekpaideutisId = rowOrId;
      console.log("Using direct ID value:", ekpaideutisId);
    } 
    // B. Αν είναι αντικείμενο, ψάχνουμε για ID μέσα σε αυτό
    else if (rowOrId && typeof rowOrId === 'object') {
      ekpaideutisId = rowOrId.id_ekpaideuti || rowOrId.id_epafis || rowOrId.id ||
        (rowOrId.original && (rowOrId.original.id_ekpaideuti || rowOrId.original.id_epafis || rowOrId.original.id));
      console.log("Extracted ID from object:", ekpaideutisId);
    }
    // Γ. Αν είναι undefined/null, προσπαθούμε να πάρουμε το ID από το DOM
    else {
      console.log("No valid argument, trying to find selected row in DOM");
      // 1. Έλεγχος για επιλεγμένη σειρά με κλάση Mui-selected
      const selectedRow = document.querySelector('.MuiDataGrid-row.Mui-selected');
      if (selectedRow) {
        const rowId = selectedRow.getAttribute('data-id');
        if (rowId) {
          ekpaideutisId = rowId;
          console.log("Found ID from selected row:", ekpaideutisId);
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
              console.log("Found ID from delete button's row:", ekpaideutisId);
            }
          }
        }
      }
      
      // 3. Έλεγχος για το currentEkpaideutisId από το state
      if (!ekpaideutisId && currentEkpaideutisId) {
        ekpaideutisId = currentEkpaideutisId;
        console.log("Using currentEkpaideutisId:", ekpaideutisId);
      }
    }

    // Αν ακόμα δεν έχουμε ID, αναζήτηση στον πίνακα εκπαιδευτών
    if (!ekpaideutisId) {
      console.log("All methods failed. Asking user to select an instructor from the list");
      
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
            console.log("User selected instructor ID:", ekpaideutisId);
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
    
    console.log("Final instructor ID for deletion:", numericId);

    // ΒΗΜΑ 3: Εύρεση εκπαιδευτή στα τοπικά δεδομένα
    const instructor = ekpaideutesData.find(e => 
      e.id_ekpaideuti == numericId || 
      e.id_epafis == numericId || 
      e.id == numericId
    );
    
    // ΒΗΜΑ 4: Επιβεβαίωση
    if (!window.confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε τον εκπαιδευτή ${
      instructor ? `"${instructor.onoma} ${instructor.epitheto}"` : `με ID ${numericId}`
    };`)) {
      return;
    }

    // ΒΗΜΑ 5: Αφαίρεση από όλες τις σχολές πρώτα
    const schools = sxolesData.filter(school => 
      Array.isArray(school.ekpaideutes) && 
      school.ekpaideutes.some(t => 
        t.id == numericId || 
        t.id_ekpaideuti == numericId || 
        t.id_epafis == numericId
      )
    );
    
    console.log(`Will remove instructor from ${schools.length} schools`);
    
    for (const school of schools) {
      try {
        const schoolId = school.id_sxolis || school.id;
        console.log(`Removing instructor ${numericId} from school ${schoolId}`);
        await api.delete(`/sxoles/${schoolId}/ekpaideutis/${numericId}`);
      } catch (err) {
        console.error(`Failed to remove instructor from school:`, err);
      }
    }

    // ΒΗΜΑ 6: Διαγραφή του εκπαιδευτή
    console.log(`Deleting instructor with ID ${numericId}`);
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
    
    alert("Ο εκπαιδευτής διαγράφηκε επιτυχώς.");
  } catch (error) {
    console.error("Error deleting instructor:", error);
    alert("Σφάλμα κατά τη διαγραφή εκπαιδευτή: " + (error.response?.data?.error || error.message));
  }
};

  // Dialog για επιλογή εκπαιδευτών
  const TeacherSelectionDialog = ({ open, onClose, onSave, availableTeachers, selectedTeachers, setSelectedTeachers }) => {
    const handleToggleSelection = (teacherId) => {
      if (selectedTeachers.includes(teacherId)) {
        setSelectedTeachers(selectedTeachers.filter(id => id !== teacherId));
      } else {
        setSelectedTeachers([...selectedTeachers, teacherId]);
      }
    };
    
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Επιλογή Εκπαιδευτών</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox 
                        indeterminate={selectedTeachers.length > 0 && selectedTeachers.length < availableTeachers.length}
                        checked={availableTeachers.length > 0 && selectedTeachers.length === availableTeachers.length}
                        onChange={() => {
                          if (selectedTeachers.length === availableTeachers.length) {
                            setSelectedTeachers([]);
                          } else {
                            // Fix: Use consistent ID property
                            setSelectedTeachers(availableTeachers.map(t => t.id_ekpaideuti));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Ονοματεπώνυμο</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Τηλέφωνο</TableCell>
                    <TableCell>Επίπεδο</TableCell>
                    <TableCell>Κλάδος</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableTeachers.map((teacher) => (
                    <TableRow 
                      key={teacher.id_ekpaideuti || teacher.id}
                      hover
                      onClick={() => handleToggleSelection(teacher.id_ekpaideuti)}
                      selected={selectedTeachers.includes(teacher.id_ekpaideuti)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox 
                          // Fix: Make sure we use the right ID property consistently
                          checked={selectedTeachers.includes(teacher.id_ekpaideuti)} 
                          onChange={() => handleToggleSelection(teacher.id_ekpaideutis)}
                        />
                      </TableCell>
                      <TableCell>{`${teacher.onoma || ""} ${teacher.epitheto || ""}`}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.tilefono}</TableCell>
                      <TableCell>{teacher.epipedo}</TableCell>
                      <TableCell>{teacher.klados}</TableCell>
                    </TableRow>
                  ))}

                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Άκυρο</Button>
          <Button 
            onClick={onSave} 
            variant="contained" 
            color="primary"
            disabled={selectedTeachers.length === 0}
          >
            Προσθήκη {selectedTeachers.length > 0 && `(${selectedTeachers.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Προσθήκη κοντά στα άλλα useEffect περίπου στη γραμμή 500
  useEffect(() => {
    // Όταν αλλάζει το επιλεγμένο row του DataTable, αποθήκευση του ID
    const handleRowSelection = (rowData) => {
      if (rowData && (rowData.id_sxolis || rowData.id)) {
        const schoolId = rowData.id_sxolis || rowData.id;
        console.log('Αποθήκευση επιλεγμένης σχολής:', schoolId);
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
      console.log("Delete config called with:", row);
      const id = row?.id_ekpaideuti || row?.id_epafis || row?.id;
      console.log("Extracted ID:", id);
      return id;
    }
  }}
  enableAddNew={true}
  onAddNew={() => setAddEkpaideutiDialogOpen(true)}
/>
        </Box>
        
        {/* Dialog για προσθήκη σχολής */}
        <AddDialog 
          open={addSxoliDialogOpen}
          onClose={() => setAddSxoliDialogOpen(false)}
          handleAddSave={handleAddSxoli}
          title="Προσθήκη Νέας Σχολής"
          fields={sxoliFormFields}
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
        <TeacherSelectionDialog
          open={teacherSelectionDialogOpen}
          onClose={() => setTeacherSelectionDialogOpen(false)}
          onSave={handleAddSelectedTeachers}
          availableTeachers={availableTeachers}
          selectedTeachers={selectedTeachers}
          setSelectedTeachers={setSelectedTeachers}
        />
      </Box>
    
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

  </LocalizationProvider>
  );
}