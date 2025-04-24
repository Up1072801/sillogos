import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography, Paper, TextField, IconButton, Button, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox } from "@mui/material";
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
        <Link to={`/sxoles/${row.original.id_sxolis}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
              try {
                const date = new Date(value);
                return isNaN(date.getTime()) ? value : date.toLocaleDateString('el-GR');
              } catch (e) {
                return value;
              }
            }
          },
          { 
            accessorKey: "end", 
            header: "Λήξη",
            Cell: ({ value }) => {
              if (!value) return '-';
              try {
                const date = new Date(value);
                return isNaN(date.getTime()) ? value : date.toLocaleDateString('el-GR');
              } catch (e) {
                return value;
              }
            }
          }
        ],
        onEdit: (rowData, parentRow) => handleEditTopothesia(rowData, parentRow),
        onDelete: (rowData, parentRow) => handleDeleteTopothesia(rowData, parentRow),
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
        }
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
      validation: yup.number().min(2000, "Έτος από 2000 και πάνω")
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
      axios.get("http://localhost:5000/api/sxoles"),
      axios.get("http://localhost:5000/api/Repafes/ekpaideutes-me-sxoles") // Νέο endpoint
    ]);
    
    console.log("Loaded sxoles data:", sxolesRes.data);
    console.log("Loaded epafes data with schools:", ekpaideutesRes.data);
    
    // Επεξεργασία δεδομένων σχολών
    if (Array.isArray(sxolesRes.data)) {
      const processedSxoles = sxolesRes.data.map(sxoli => ({
        ...sxoli,
        id_sxolis: sxoli.id_sxolis || sxoli.id,
      }));
      setSxolesData(processedSxoles);
    } else {
      console.error("sxolesRes.data is not an array:", sxolesRes.data);
      setSxolesData([]);
    }

    // Επεξεργασία δεδομένων εκπαιδευτών με τις σχολές τους
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
            start: loc.start || loc.hmerominia_enarksis || "",
            end: loc.end || loc.hmerominia_liksis || ""
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
                            onChange={(e) => handleUpdateLocation(loc.id, "start", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={loc.end}
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
        start: loc.start || loc.hmerominia_enarksis || "",
        end: loc.end || loc.hmerominia_liksis || ""
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
                      onChange={(e) => handleUpdateLocation(loc.id, "start", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      value={loc.end}
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

  // Βελτιωμένο handleAddTopothesia
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

    // Άνοιγμα διαλόγου για προσθήκη τοποθεσίας
    setEditingSchoolForLocation(schoolId);
    setCurrentLocations([]);  // Καθάρισμα παλιών τοποθεσιών
    setLocationDialogOpen(true);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη τοποθεσίας:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Αντικατάσταση της συνάρτησης handleEditTopothesia για να ανοίγει τον διάλογο LocationEditorDialog
const handleEditTopothesia = async (rowData, parentRow) => {
  try {
    if (!parentRow) {
      alert("Δεν επιλέχθηκε σχολή");
      return;
    }

    const schoolId = parentRow.id_sxolis || parentRow.id;

    if (!schoolId) {
      alert("Δεν βρέθηκε ID σχολής");
      return;
    }

    // Ανάκτηση δεδομένων σχολής
    const response = await axios.get(`http://localhost:5000/api/sxoles/${schoolId}`);
    const school = response.data;

    // Εξαγωγή τοποθεσιών
    let topothesiaData = school.topothesies || school.topothesia || (school.details && school.details.topothesia);

    let currentTopothesies = [];
    if (topothesiaData) {
      try {
        // Αν είναι string, μετατροπή σε JSON
        if (typeof topothesiaData === 'string') {
          currentTopothesies = JSON.parse(topothesiaData);
        } else {
          currentTopothesies = topothesiaData;
        }

        // Μορφοποίηση τοποθεσιών
        currentTopothesies = currentTopothesies.map((loc, idx) => ({
          id: idx,
          topothesia: loc.topothesia || "",
          start: loc.start || loc.hmerominia_enarksis || "",
          end: loc.end || loc.hmerominia_liksis || ""
        }));
      } catch (e) {
        console.error("Σφάλμα ανάλυσης JSON:", e);
        currentTopothesies = [];
      }
    }

    console.log("Μορφοποιημένες τοποθεσίες για επεξεργασία:", currentTopothesies);

    // Άνοιγμα διαλόγου με τις υπάρχουσες τοποθεσίες
    setCurrentLocations(currentTopothesies);
    setEditingSchoolForLocation(schoolId);
    setLocationDialogOpen(true);
  } catch (error) {
    console.error("Σφάλμα κατά την προετοιμασία επεξεργασίας τοποθεσιών:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Βελτιωμένο handleDeleteTopothesia
const handleDeleteTopothesia = async (rowData, parentRow) => {
  try {
    console.log("Delete topothesia:", rowData, "parentRow:", parentRow);
    
    if (!parentRow) {
      console.error("Missing parentRow when deleting topothesia");
      alert("Δεν επιλέχθηκε σχολή");
      return;
    }
    
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
    const response = await axios.get(`http://localhost:5000/api/sxoles/${schoolId}`);
    const school = response.data;
    
    // Εξαντλητική αναζήτηση για τοποθεσίες σε όλα τα πιθανά πεδία
    let topothesiaData = school.topothesies || 
                         school.topothesia || 
                         (school.details && school.details.topothesia);
    
    let currentTopothesies = [];
    
    try {
      if (topothesiaData) {
        // Αν είναι string, μετατροπή σε JSON
        if (typeof topothesiaData === 'string') {
          currentTopothesies = JSON.parse(topothesiaData);
        } else {
          currentTopothesies = topothesiaData;
        }
        
        if (!Array.isArray(currentTopothesies)) {
          // Αν δεν είναι πίνακας, το μετατρέπουμε σε πίνακα με ένα στοιχείο
          currentTopothesies = [{ 
            topothesia: typeof currentTopothesies === 'string' ? 
              currentTopothesies : JSON.stringify(currentTopothesies) 
          }];
        }
      }
    } catch (e) {
      console.error("Σφάλμα ανάλυσης JSON:", e);
      currentTopothesies = [];
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
      // Ενημέρωση μόνο των τοποθεσιών
      topothesia: JSON.stringify(updatedTopothesies)
    };
    
    // Ενημέρωση της σχολής
    await axios.put(`http://localhost:5000/api/sxoles/${schoolId}`, updateData);
    
    // Ανανέωση δεδομένων
    refreshData();
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή τοποθεσίας:", error);
    alert("Σφάλμα κατά τη διαγραφή τοποθεσίας: " + error.message);
  }
};

  // Χειρισμός αποθήκευσης τοποθεσιών
const handleSaveLocations = async (locations) => {
  try {
    if (!editingSchoolForLocation) return;
    
    // Φέρνουμε τα τρέχοντα δεδομένα της σχολής
    const schoolResponse = await axios.get(`http://localhost:5000/api/sxoles/${editingSchoolForLocation}`);
    const currentSchoolData = schoolResponse.data;
    
    // Μορφοποίηση τοποθεσιών για το API (χωρίς τα ID που ήταν μόνο για το frontend)
    const formattedLocations = locations.map(loc => ({
      topothesia: loc.topothesia,
      start: loc.start,
      end: loc.end
    }));
    
    console.log("Τοποθεσίες που θα αποθηκευτούν:", formattedLocations);
    
    // Δημιουργούμε το αντικείμενο ενημέρωσης διατηρώντας τις υπάρχουσες τιμές
    const updateData = {
      klados: currentSchoolData.klados,
      epipedo: currentSchoolData.epipedo,
      timi: currentSchoolData.timi,
      etos: currentSchoolData.etos,
      seira: currentSchoolData.seira,
      // Αποθήκευση των τοποθεσιών απευθείας στο πεδίο topothesies αντί για topothesia
      topothesies: formattedLocations // Αποθήκευση ως αντικείμενο, όχι ως string
    };
    
    console.log("Αποστολή δεδομένων για ενημέρωση:", updateData);
    
    // Αποστολή στο API
    await axios.put(`http://localhost:5000/api/sxoles/${editingSchoolForLocation}`, updateData);
    
    // Ανανέωση δεδομένων και κλείσιμο διαλόγου
    refreshData();
    setLocationDialogOpen(false);
    setEditingSchoolForLocation(null);
    alert("Οι τοποθεσίες αποθηκεύτηκαν με επιτυχία!");
  } catch (error) {
    console.error("Σφάλμα κατά την αποθήκευση τοποθεσιών:", error);
    alert("Σφάλμα κατά την αποθήκευση: " + error.message);
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
    const response = await axios.get(`http://localhost:5000/api/sxoles/${schoolId}`);
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
      const schoolResponse = await axios.get(`http://localhost:5000/api/sxoles/${schoolId}`);
      
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

  // Χειρισμός προσθήκης επιλεγμένων εκπαιδευτών
const handleAddSelectedTeachers = async () => {
  try {
    if (!currentSchoolForTeachers || selectedTeachers.length === 0) return;

    console.log("Adding teachers to school:", currentSchoolForTeachers, "Teachers:", selectedTeachers);

    // Προσθήκη κάθε επιλεγμένου εκπαιδευτή
    for (const teacherId of selectedTeachers) {
      console.log("Adding teacher with ID:", teacherId);

      // Εξαγωγή του σωστού ID
      const ekpaideutis = ekpaideutesData.find(e => e.id_ekpaideuti === teacherId);
      if (!ekpaideutis) {
        console.error("Δεν βρέθηκε εκπαιδευτής με ID:", teacherId);
        continue;
      }

      await axios.post(`http://localhost:5000/api/sxoles/${currentSchoolForTeachers}/ekpaideutis`, {
        id_ekpaideuti: ekpaideutis.id_ekpaideuti
      });
    }

    // Ανανέωση δεδομένων και κλείσιμο διαλόγου
    refreshData();
    setTeacherSelectionDialogOpen(false);
    setCurrentSchoolForTeachers(null);
    setSelectedTeachers([]);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη εκπαιδευτών:", error);
    alert("Σφάλμα: " + error.message);
  }
};

  // Διαγραφή εκπαιδευτή από σχολή
  const handleRemoveTeacherFromSchool = async (teacherId, schoolId) => {
    try {
      // Διασφάλιση ότι το teacherId είναι το id_epafis αντί για id_ekpaideuti
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
      
      // Κλήση API με το σωστό ID
      await axios.delete(`http://localhost:5000/api/sxoles/${schoolId}/ekpaideutis/${actualTeacherId}`);
      
      // Ανανέωση δεδομένων
      refreshData();
    } catch (error) {
      console.error("Σφάλμα κατά την αφαίρεση εκπαιδευτή από τη σχολή:", error);
      alert("Σφάλμα κατά την αφαίρεση εκπαιδευτή: " + error.message);
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

      // Μορφοποίηση τοποθεσιών αν υπάρχουν
      if (newSxoli.topothesies && newSxoli.topothesies.length > 0) {
        formattedSxoli.topothesies = newSxoli.topothesies.map(loc => ({
          topothesia: loc.topothesia,
          start: loc.start || loc.hmerominia_enarksis,
          end: loc.end || loc.hmerominia_liksis
        }));
      }

      // Αποστολή στο API με χειρισμό σφαλμάτων
      try {
        const response = await axios.post("http://localhost:5000/api/sxoles", formattedSxoli);
        console.log("Created new sxoli:", response.data);
        
        // Ανανέωση δεδομένων
        refreshData();
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
      await axios.put(`http://localhost:5000/api/sxoles/${currentSxoliId}`, formattedSxoli);
      console.log("Updated sxoli with ID:", currentSxoliId);
      
      // Ανανέωση δεδομένων
      refreshData();
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
      await axios.delete(`http://localhost:5000/api/sxoles/${id}`);
      
      // Ανανέωση δεδομένων
      refreshData();
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
      await axios.post("http://localhost:5000/api/Repafes", formattedEkpaideutis);
      
      // Ανανέωση δεδομένων
      refreshData();
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
        idiotita: "Εκπαιδευτής",
        ekpaideutis: {
          update: {
            epipedo: editedEkpaideutis.epipedo,
            klados: editedEkpaideutis.klados
          }
        }
      };

      // Αποστολή στο API
      await axios.put(`http://localhost:5000/api/Repafes/${currentEkpaideutisId}`, formattedEkpaideutis);
      
      // Ανανέωση δεδομένων
      refreshData();
      setEditEkpaideutiDialogOpen(false);
      setEditEkpaideutiData(null);
      setCurrentEkpaideutisId(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία εκπαιδευτή:", error);
      alert("Σφάλμα κατά την επεξεργασία εκπαιδευτή: " + (error.response?.data?.error || error.message));
    }
  };

  // Βελτιωμένη έκδοση του handleDeleteEkpaideutis - Γραμμή ~1444
const handleDeleteEkpaideutis = async (id) => {
  try {
    console.log("Deleting ekpaideutis with raw ID:", id);
    
    // Έλεγχος για null/undefined id
    if (!id && id !== 0) {
      console.error("Received null or undefined ID for deletion");
      alert("Σφάλμα: Δεν δόθηκε ID εκπαιδευτή για διαγραφή");
      return;
    }
    
    // Διαχείριση όλων των πιθανών μορφών του ID
    let ekpaideutisId;
    
    if (typeof id === 'object' && id !== null) {
      // Λεπτομερέστερη καταγραφή του αντικειμένου για καλύτερη διάγνωση
      console.log("ID is an object with properties:", Object.keys(id));
      
      // Εξαγωγή από αντικείμενο - έλεγχος όλων των πιθανών πεδίων
      ekpaideutisId = id.id_epafis || id.id_ekpaideuti || id.id;
      
      // Έλεγχος στο πεδίο original που μπορεί να προσθέτει το DataTable
      if ((ekpaideutisId === undefined || ekpaideutisId === null) && id.original) {
        console.log("Checking id.original:", id.original);
        ekpaideutisId = id.original.id_epafis || id.original.id_ekpaideuti || id.original.id;
      }
      
      // Χρήση του row αν υπάρχει
      if ((ekpaideutisId === undefined || ekpaideutisId === null) && id.row) {
        console.log("Checking id.row:", id.row);
        ekpaideutisId = id.row.id_epafis || id.row.id_ekpaideuti || id.row.id;
      }
    } else {
      // Χρήση του id απευθείας αν δεν είναι αντικείμενο
      ekpaideutisId = id;
    }
    
    console.log("Final extracted ID for deletion:", ekpaideutisId);
    
    // Έλεγχος εγκυρότητας ID - προσοχή στο 0 που είναι έγκυρο ID
    if (ekpaideutisId === undefined || ekpaideutisId === null || ekpaideutisId === '') {
      console.error("No valid ID found for deletion");
      alert("Δεν βρέθηκε έγκυρο ID εκπαιδευτή για διαγραφή");
      return;
    }
    
    // Ο υπόλοιπος κώδικας παραμένει ίδιος...

    // Επιβεβαίωση από το χρήστη
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον εκπαιδευτή;")) {
      return;
    }
    
    // Αναζήτηση του εκπαιδευτή στα data για να πάρουμε το σωστό id_epafis
    if (ekpaideutesData && ekpaideutesData.length > 0) {
      const ekpaideutis = ekpaideutesData.find(e => 
        e.id_ekpaideuti == ekpaideutisId || 
        e.id_epafis == ekpaideutisId || 
        e.id == ekpaideutisId
      );
      
      if (ekpaideutis) {
        // Προτίμηση του id_epafis που είναι το σωστό για το API
        ekpaideutisId = ekpaideutis.id_epafis || ekpaideutisId;
      }
    }
    
    // Κλήση API με το σωστό ID
    await axios.delete(`http://localhost:5000/api/Repafes/${ekpaideutisId}`);
    
    // Ανανέωση δεδομένων
    refreshData();
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή εκπαιδευτή:", error);
    alert("Σφάλμα κατά τη διαγραφή εκπαιδευτή: " + (error.response?.data?.error || error.message));
  }
};

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
                      key={teacher.id_ekpaideuti}
                      hover
                      onClick={() => handleToggleSelection(teacher.id_ekpaideuti)}
                      selected={selectedTeachers.includes(teacher.id_ekpaideuti)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox 
                          checked={selectedTeachers.includes(teacher.id_ekpaideuti)} 
                          onChange={() => handleToggleSelection(teacher.id_ekpaideuti)}
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          Διαχείριση Σχολών
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Σχολές ({sxolesData.length})
          </Typography>
          <DataTable
            data={sxolesData}
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
            onAddNew={() => setAddSxoliDialogOpen(true)}  // Αυτό είναι για την προσθήκη νέας σχολής
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
            getRowId={(row) => row.id_ekpaideuti}
            initialState={{
              columnVisibility: { id_ekpaideuti: false },
              sorting: [{ id: 'fullName', desc: false }]
            }}
            state={{ isLoading: loading }}
            enableExpand={true}
            enableRowActions={true}
            handleEditClick={handleEditEkpaideutiClick}
            handleDelete={handleDeleteEkpaideutis}
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
            setEditEkpaideutiDialogOpen(false);
            setEditEkpaideutiData(null);
            setCurrentEkpaideutisId(null);
          }}
          handleEditSave={handleEditEkpaideutis}
          editValues={editEkpaideutiData || {}} // Προσθήκη fallback σε κενό αντικείμενο
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