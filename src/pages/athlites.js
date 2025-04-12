import React, { useState, useEffect, useMemo } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import DataTable from "../components/DataTable/DataTable";
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableBody, TableRow, TableCell, Paper, TableContainer 
} from "@mui/material";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import SelectionDialog from "../components/SelectionDialog";
import axios from "axios";
import * as yup from "yup";
import "./App.css";
import { Add, Edit, Delete } from '@mui/icons-material';

// Στήλες για τον πίνακα αθλητών
const athleteColumns = [
  { accessorKey: "id", header: "ID", enableHiding: true },
  { 
    accessorKey: "fullName", 
    header: "Ονοματεπώνυμο", 
    Cell: ({ row }) => `${row.original.firstName || ""} ${row.original.lastName || ""}`,
    filterFn: (row, id, filterValue) => {
      const name = `${row.original.firstName || ""} ${row.original.lastName || ""}`.toLowerCase();
      return name.includes(filterValue.toLowerCase());
    }
  },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "odos", header: "Διεύθυνση", enableHiding: true },
  { accessorKey: "tk", header: "ΤΚ", enableHiding: true },
  { accessorKey: "arithmosdeltiou", header: "Αρ. Δελτίου" },
  { 
    accessorKey: "hmerominiaenarksis", 
    header: "Ημ/νία Έναρξης Δελτίου", 
    enableHiding: true,
    Cell: ({ cell }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("el-GR") : "-"
  },
  { 
    accessorKey: "hmerominialiksis", 
    header: "Ημ/νία Λήξης Δελτίου", 
    enableHiding: true,
    Cell: ({ cell }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("el-GR") : "-" 
  },
  { accessorKey: "athlima", header: "Άθλημα" }, // Διορθώθηκε από "Άθλημα(τα)" σε "Άθλημα"
  { accessorKey: "totalParticipation", header: "Συμμετοχές σε Αγώνες" },
];

// Στήλες για τον πίνακα αθλημάτων
const sportsColumns = [
  { accessorKey: "id", header: "ID", enableHiding: true },
  { accessorKey: "athlima", header: "Άθλημα" },
  { accessorKey: "participants", header: "Αριθμός Αθλητών" },
  { accessorKey: "totalCompetitions", header: "Συνολικές Συμμετοχές Αθλητών" },
];

// Διαμόρφωση του detail panel για τους αθλητές
const athleteDetailPanelConfig = {
  mainDetails: [
    { accessor: "firstName", header: "Όνομα" },
    { accessor: "lastName", header: "Επώνυμο" },
    { accessor: "patronimo", header: "Πατρώνυμο" },
    { accessor: "email", header: "Email" },
    { accessor: "phone", header: "Τηλέφωνο" },
    { accessor: "odos", header: "Διεύθυνση" },
    { accessor: "tk", header: "ΤΚ" },
    { accessor: "arithmos_mitroou", header: "Αριθμός Μητρώου" },
    { accessor: "arithmosdeltiou", header: "Αριθμός Δελτίου" },
    { accessor: "hmerominiaenarksis", header: "Ημ/νία Έναρξης Δελτίου" },
    { accessor: "hmerominialiksis", header: "Ημ/νία Λήξης Δελτίου" },
    { accessor: "vathmos_diskolias", header: "Βαθμός Δυσκολίας" },
  ],
  tables: [
    {
      title: "Συμμετοχές σε Αγώνες",
      accessor: "agones",
      columns: [
        { accessor: "onoma", header: "Όνομα Αγώνα" },
        { accessor: "perigrafi", header: "Περιγραφή" },
        { accessor: "hmerominia", header: "Ημερομηνία", format: (value) => (value ? new Date(value).toLocaleDateString("el-GR") : "-") },
        { accessor: "athlima", header: "Άθλημα" },
      ],
    },
  ],
};

export default function Athlites() {
  const [athletesData, setAthletesData] = useState([]);
  const [sportsData, setSportsData] = useState([]);
  const [sportsListData, setSportsListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddAthleteDialog, setOpenAddAthleteDialog] = useState(false);
  const [openAddCompetitionDialog, setOpenAddCompetitionDialog] = useState(false);
  const [openEditAthleteDialog, setOpenEditAthleteDialog] = useState(false);
  const [editAthleteValues, setEditAthleteValues] = useState({});
  const [currentSportId, setCurrentSportId] = useState(null);
  const [currentSportName, setCurrentSportName] = useState("");
  const [athletesBySport, setAthletesBySport] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [openAthleteSelectionDialog, setOpenAthleteSelectionDialog] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [editCompetitionData, setEditCompetitionData] = useState(null);

  // Φόρτωση δεδομένων
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [athletesRes, sportsRes, sportsListRes, difficultyRes] = await Promise.all([
          axios.get("http://localhost:5000/api/athlites/athletes"),
          axios.get("http://localhost:5000/api/athlites/sports"),
          axios.get("http://localhost:5000/api/athlites/sports-list"),
          axios.get("http://localhost:5000/api/vathmoi-diskolias")
        ]);

        // Προσθήκη fullName για καλύτερο φιλτράρισμα
        const formattedAthletes = athletesRes.data.map(athlete => ({
          ...athlete,
          fullName: `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim(),
        }));

        // Προσθήκη πεδίου totalCompetitions για κάθε άθλημα (συνολικός αριθμός συμμετοχών αθλητών)
        const formattedSports = sportsRes.data.map(sport => {
          // Υπολογισμός συνολικών συμμετοχών αθλητών στο άθλημα
          let totalCompetitions = 0;
          sport.agones.forEach(agonas => {
            totalCompetitions += agonas.summetexontes?.length || 0;
          });
          
          return {
            ...sport,
            totalCompetitions,
            // Προσθήκη μετρητή συμμετεχόντων σε κάθε αγώνα
            agones: sport.agones.map(agonas => ({
              ...agonas,
              summetexontesCount: agonas.summetexontes?.length || 0,
              summetexontes: agonas.summetexontes?.map(athlete => ({
                ...athlete,
                fullName: `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim(),
                arithmosdeltiou: athlete.arithmosdeltiou || "-"
              }))
            }))
          };
        });

        setAthletesData(formattedAthletes);
        setSportsData(formattedSports);
        setSportsListData(sportsListRes.data);
        setDifficultyLevels(difficultyRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Σφάλμα φόρτωσης δεδομένων:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Ενημερώστε αυτή τη συνάρτηση
const fetchAthletesBySport = async (sportId) => {
  try {
    if (!sportId) {
      setAthletesBySport([]);
      return [];
    }
    
    const response = await axios.get(`http://localhost:5000/api/athlites/by-sport/${sportId}`);
    const athletesData = response.data;
    
    setAthletesBySport(athletesData);
    return athletesData;
  } catch (error) {
    console.error("Σφάλμα φόρτωσης αθλητών:", error);
    setAthletesBySport([]);
    return [];
  }
};

// Χειρισμός επεξεργασίας αγώνα
const handleEditCompetition = (competition) => {
  console.log('Editing competition:', competition); // Για debugging
  
  // Βρίσκουμε το σωστό ID
  const competitionId = competition.id_agona || competition.id;
  
  // Πρέπει να βεβαιωθούμε ότι έχουμε σωστά IDs αθλητών
  const athleteIds = competition.summetexontes?.map(athlete => 
    typeof athlete.id === 'number' ? athlete.id : parseInt(athlete.id)
  ) || [];
  
  console.log('Athlete IDs:', athleteIds); // Για debugging
  
  setEditCompetitionData({
    id: competitionId,
    id_agona: competitionId, // Προσθέτουμε και τα δύο για σιγουριά
    onoma: competition.onoma,
    perigrafi: competition.perigrafi,
    hmerominia: competition.hmerominia ? new Date(competition.hmerominia).toISOString().split('T')[0] : "",
    id_athlimatos: competition.id_athlimatos
  });
  
  setCurrentSportId(competition.id_athlimatos);
  
  const sport = sportsData.find(s => s.id === competition.id_athlimatos);
  if (sport) {
    setCurrentSportName(sport.athlima);
  }
  
  // Φόρτωση αθλητών για αυτό το άθλημα και άνοιγμα του dialog
  fetchAthletesBySport(competition.id_athlimatos).then(() => {
    // Καθορισμός των επιλεγμένων αθλητών
    setSelectedAthletes(athleteIds);
    // Άνοιγμα του dialog
    setOpenAddCompetitionDialog(true);
  });
};

// Χειρισμός προσθήκης αγώνα σε άθλημα
const handleAddCompetitionClick = (sportId, sportName) => {
  // Αν δίνεται sportId, προεπιλέγουμε το άθλημα
  if (sportId) {
    setCurrentSportId(sportId);
    setCurrentSportName(sportName);
    fetchAthletesBySport(sportId);
  } else {
    setCurrentSportId(null);
    setCurrentSportName("");
  }
  
  // Καθαρισμός δεδομένων επεξεργασίας
  setEditCompetitionData(null);
  setSelectedAthletes([]);
  setOpenAddCompetitionDialog(true);
};

  // Χειρισμός προσθήκης αθλητή
  const handleAddAthlete = async (newAthlete) => {
    try {
      const requestData = {
        epafes: {
          onoma: newAthlete.firstName,
          epitheto: newAthlete.lastName,
          email: newAthlete.email,
          tilefono: newAthlete.phone,
        },
        vathmos_diskolias: {
          id_vathmou_diskolias: parseInt(newAthlete.vathmos_diskolias) || 1,
        },
        esoteriko_melos: {
          hmerominia_gennhshs: newAthlete.birthDate ? new Date(newAthlete.birthDate) : null,
          patronimo: newAthlete.patronimo,
          odos: newAthlete.odos,
          tk: newAthlete.tk ? parseInt(newAthlete.tk) : null,
          arithmos_mitroou: newAthlete.arithmos_mitroou ? parseInt(newAthlete.arithmos_mitroou) : null,
        },
        athlitis: {
          arithmos_deltiou: newAthlete.arithmosdeltiou ? parseInt(newAthlete.arithmosdeltiou) : null,
          hmerominia_enarksis_deltiou: newAthlete.hmerominiaenarksis ? new Date(newAthlete.hmerominiaenarksis) : null,
          hmerominia_liksis_deltiou: newAthlete.hmerominialiksis ? new Date(newAthlete.hmerominialiksis) : null,
        },
        athlimata: newAthlete.athlimata ? newAthlete.athlimata.map(id => ({ id_athlimatos: parseInt(id) })) : [],
      };

      const response = await axios.post("http://localhost:5000/api/athlites/athlete", requestData);
      
      // Προσθήκη του νέου αθλητή στα δεδομένα και κλείσιμο του dialog
      const formattedAthlete = {
        ...response.data,
        fullName: `${response.data.esoteriko_melos?.melos?.epafes?.onoma || ""} ${response.data.esoteriko_melos?.melos?.epafes?.epitheto || ""}`.trim(),
        firstName: response.data.esoteriko_melos?.melos?.epafes?.onoma || "",
        lastName: response.data.esoteriko_melos?.melos?.epafes?.epitheto || "",
        email: response.data.esoteriko_melos?.melos?.epafes?.email || "",
        phone: response.data.esoteriko_melos?.melos?.epafes?.tilefono || "",
        patronimo: response.data.esoteriko_melos?.patronimo || "",
        odos: response.data.esoteriko_melos?.odos || "",
        tk: response.data.esoteriko_melos?.tk || "",
        arithmos_mitroou: response.data.esoteriko_melos?.arithmos_mitroou || "",
        arithmosdeltiou: response.data.arithmos_deltiou || "",
        hmerominiaenarksis: response.data.hmerominia_enarksis_deltiou ? new Date(response.data.hmerominia_enarksis_deltiou).toISOString().split('T')[0] : "",
        hmerominialiksis: response.data.hmerominia_liksis_deltiou ? new Date(response.data.hmerominia_liksis_deltiou).toISOString().split('T')[0] : "",
        athlima: response.data.asxoleitai?.map(a => a.athlima.onoma).join(", ") || "",
        agones: [],
        totalParticipation: 0,
      };

      setAthletesData([...athletesData, formattedAthlete]);
      setOpenAddAthleteDialog(false);

      // Ανανέωση των δεδομένων για να εμφανιστεί ο νέος αθλητής
      window.location.reload();
    } catch (error) {
      console.error("Σφάλμα προσθήκης αθλητή:", error);
      alert("Σφάλμα κατά την προσθήκη του αθλητή. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  // Διαμόρφωση του detail panel για τα αθλήματα
  const sportDetailPanelConfig = useMemo(() => ({
    mainDetails: [
      // Κάθετη διάταξη για τα βασικά στοιχεία
      { 
        accessor: "athlima", 
        header: "Άθλημα",
        Cell: ({ row }) => (
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {row.original.athlima}
          </Typography>
        )
      },
      { 
        accessor: "participants", 
        header: "Συνολικοί Αθλητές"
      },
      { 
        accessor: "totalCompetitions", 
        header: "Συνολικές Συμμετοχές"
      }
    ],
    tables: [
      {
        title: "Αγώνες",
        accessor: "agones",
        onAddNew: (sportId) => handleAddCompetitionClick(sportId, 
          sportsData.find(s => s.id === sportId)?.athlima || ""),
        onEdit: handleEditCompetition,
        onDelete: (competition) => {
          console.log("Competition to delete:", competition); // Για debugging
          // Χρησιμοποιούμε το σωστό ID αγώνα
          const competitionId = competition.id_agona || competition.id;
          if (!competitionId) {
            console.error("No valid ID found for competition:", competition);
            return;
          }
          handleConfirmDelete(competitionId, null, 'competition');
        },
        columns: [
          { accessor: "onoma", header: "Όνομα Αγώνα" },
          { accessor: "perigrafi", header: "Περιγραφή" },
          { accessor: "hmerominia", header: "Ημερομηνία", format: (value) => (value ? new Date(value).toLocaleDateString("el-GR") : "-") },
          { accessor: "summetexontesCount", header: "Συμμετέχοντες" }
        ],
        // Προσθέτουμε την εμφάνιση των συμμετεχόντων στο expand
        renderExpandedRow: (row) => (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
              Συμμετέχοντες Αθλητές
            </Typography>
            {row.summetexontes && row.summetexontes.length > 0 ? (
              <TableContainer component={Paper} sx={{ maxHeight: 200, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ονοματεπώνυμο</TableCell>
                      <TableCell>Αρ. Δελτίου</TableCell>
                      <TableCell align="right">Ενέργειες</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.summetexontes.map((athlete) => (
                      <TableRow key={athlete.id}>
                        <TableCell>{`${athlete.firstName} ${athlete.lastName}`}</TableCell>
                        <TableCell>{athlete.arithmosdeltiou || "-"}</TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="error"
                            startIcon={<Delete fontSize="small" />}
                            onClick={() => {
                              // Διασφαλίζουμε ότι έχουμε το σωστό ID αγώνα (είτε id είτε id_agona)
                              const competitionId = row.id_agona || row.id;
                              console.log("Deleting athlete from competition:", competitionId, athlete.id);
                              if (!competitionId || !athlete.id) {
                                alert("Δεν ήταν δυνατή η εύρεση των απαραίτητων IDs για την αφαίρεση του αθλητή");
                                return;
                              }
                              handleConfirmDelete(competitionId, athlete.id, 'athlete-from-competition');
                            }}
                          >
                            Αφαίρεση
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>Δεν υπάρχουν συμμετέχοντες αθλητές</Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<Add />} 
                onClick={() => handleAddAthleteToCompetition(row.id)}
              >
                Προσθήκη Αθλητών
              </Button>
            </Box>
          </Box>
        )
      }
    ],
    // Προσθέτουμε την παράμετρο για να απενεργοποιήσουμε το κουμπί επεξεργασίας στοιχείων
    showEditButton: false
  }), [sportsData]);

  // Χειρισμός προσθήκης αγώνα - Διορθωμένη έκδοση
const handleAddCompetition = async (newCompetition) => {
  try {
    console.log("Submit competition data:", newCompetition);
    
    // Έλεγχος ότι όλα τα απαραίτητα πεδία υπάρχουν
    if (!newCompetition.sportId) {
      throw new Error("Δεν έχει επιλεγεί άθλημα");
    }

    if (!newCompetition.onoma) {
      throw new Error("Το όνομα αγώνα είναι υποχρεωτικό");
    }
    
    const sportId = parseInt(newCompetition.sportId);
    
    // Διασφαλίζουμε ότι έχουμε πραγματικό array με IDs αθλητών
    const athleteIds = Array.isArray(newCompetition.athleteIds) ? 
      newCompetition.athleteIds.map(id => typeof id === 'number' ? id : parseInt(id)).filter(id => !isNaN(id)) : 
      [];
    
    console.log("Actual athlete IDs to send:", athleteIds);
    console.log("Edit competition data:", editCompetitionData);
    
    // Αν έχουμε editCompetitionData, κάνουμε επεξεργασία αντί για προσθήκη
    if (editCompetitionData) {
      // Βρίσκουμε το σωστό ID (μπορεί να είναι είτε id είτε id_agona)
      const competitionId = editCompetitionData.id_agona || editCompetitionData.id;
      
      if (!competitionId) {
        throw new Error("Δεν βρέθηκε έγκυρο ID αγώνα για επεξεργασία");
      }
      
      console.log("Using competition ID for update:", competitionId);
      
      // Διαμόρφωση δεδομένων για ενημέρωση
      const updatedCompetition = {
        id_athlimatos: sportId,
        onoma: newCompetition.onoma,
        perigrafi: newCompetition.perigrafi || "",
        hmerominia: newCompetition.hmerominia ? new Date(newCompetition.hmerominia).toISOString() : null
      };
      
      console.log("Updating competition with:", updatedCompetition);
      
      // Ενημέρωση στοιχείων αγώνα
      await axios.put(`http://localhost:5000/api/athlites/agona/${competitionId}`, updatedCompetition);
      
      // Ενημέρωση αθλητών για τον αγώνα μόνο αν έχουμε έγκυρα IDs
      if (athleteIds.length > 0) {
        await axios.post(`http://localhost:5000/api/athlites/agona/${competitionId}/athletes`, {
          athleteIds: athleteIds
        });
      }
      
    } else {
      // Προσθήκη νέου αγώνα
      console.log("Creating competition with athletes:", athleteIds);
      
      const requestData = {
        id_athlimatos: sportId,
        onoma: newCompetition.onoma,
        perigrafi: newCompetition.perigrafi || "",
        hmerominia: newCompetition.hmerominia ? new Date(newCompetition.hmerominia).toISOString() : null
      };
      
      // Προσθέτουμε athleteIds μόνο αν έχουμε διαθέσιμους αθλητές και είναι πίνακας
      if (Array.isArray(athleteIds) && athleteIds.length > 0) {
        requestData.athleteIds = athleteIds;
      }
      
      console.log("Sending request data:", requestData);
      
      try {
        // Δημιουργία νέου αγώνα
        const response = await axios.post("http://localhost:5000/api/athlites/agona", requestData);
        console.log("Success response:", response.data);
      } catch (apiError) {
        console.error("API Error:", apiError.response?.data || apiError.message);
        throw apiError;
      }
    }
    
    // ΚΡΙΣΙΜΟ: Πάντα ανανεώνουμε τα δεδομένα μετά από οποιαδήποτε αλλαγή
    await refreshData();
    
    setOpenAddCompetitionDialog(false);
    setSelectedAthletes([]);
    setEditCompetitionData(null);
  } catch (error) {
    // Βελτιωμένο μήνυμα λάθους με περισσότερες πληροφορίες
    console.error("Σφάλμα προσθήκης/επεξεργασίας αγώνα:", error);
    alert(`Σφάλμα κατά την προσθήκη/επεξεργασία του αγώνα: ${error.response?.data?.error || error.message}`);
  }
};

// Νέα συνάρτηση ανανέωσης δεδομένων - προσθέστε την στο component
const refreshData = async () => {
  try {
    console.log("Refreshing data...");
    
    // Ανανέωση δεδομένων από το API
    const [athletesRes, sportsRes] = await Promise.all([
      axios.get("http://localhost:5000/api/athlites/athletes"),
      axios.get("http://localhost:5000/api/athlites/sports"),
    ]);

    // Διαμόρφωση αθλητών
    const formattedAthletes = athletesRes.data.map(athlete => ({
      ...athlete,
      fullName: `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim(),
    }));

    // Διαμόρφωση αθλημάτων
    const formattedSports = sportsRes.data.map(sport => {
      // Υπολογισμός συνολικών συμμετοχών αθλητών στο άθλημα
      let totalCompetitions = 0;
      sport.agones.forEach(agonas => {
        totalCompetitions += agonas.summetexontes?.length || 0;
      });
      
      return {
        ...sport,
        totalCompetitions,
        // Προσθήκη μετρητή συμμετεχόντων σε κάθε αγώνα
        agones: sport.agones.map(agonas => ({
          ...agonas,
          id: agonas.id_agona, // Διασφάλιση σωστού ID
          summetexontesCount: agonas.summetexontes?.length || 0,
          summetexontes: agonas.summetexontes?.map(athlete => ({
            ...athlete,
            id: athlete.id, // Διασφάλιση σωστού ID
            fullName: `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim(),
            arithmosdeltiou: athlete.arithmosdeltiou || "-"
          })) || []
        }))
      };
    });

    // Ενημέρωση του state με τα νέα δεδομένα
    setAthletesData(formattedAthletes);
    setSportsData(formattedSports);
    
    console.log("Data refresh complete");
  } catch (error) {
    console.error("Error refreshing data:", error);
  }
};

  // Χειρισμός προσθήκης αθλητή σε αγώνα
  const handleAddAthleteToCompetition = (competitionId) => {
    const competition = sportsData.flatMap(s => s.agones).find(a => a.id === competitionId);
    if (competition) {
      setSelectedCompetitionId(competitionId);
      
      // Get the IDs of already selected athletes in this competition
      const existingAthleteIds = competition.summetexontes?.map(athlete => athlete.id) || [];
      
      // Fetch athletes for this sport and then open the dialog
      fetchAthletesBySport(competition.id_athlimatos).then(() => {
        // Pass the existing athlete IDs to be pre-selected
        setSelectedAthletes(existingAthleteIds);
        setOpenAthleteSelectionDialog(true);
      });
    }
  };
  
// Χειρισμός επιλογής αθλητών για αγώνα
const handleCompetitionAthleteSelection = async (selectedIds) => {
  try {
    if (!selectedCompetitionId) return;
    
    // Εκτύπωση των επιλεγμένων IDs για debugging
    console.log("Selected athlete IDs:", selectedIds);
    
    // Βεβαιωθείτε ότι στέλνονται τα σωστά IDs
    const validIds = selectedIds.map(id => 
      typeof id === 'number' ? id : parseInt(id)
    ).filter(id => !isNaN(id));
    
    console.log("Valid athlete IDs to send:", validIds);
    
    // Στείλτε μόνο έγκυρα IDs στο API
    await axios.post(`http://localhost:5000/api/athlites/agona/${selectedCompetitionId}/athletes`, {
      athleteIds: validIds
    });
    
    // Χρησιμοποιούμε την refreshData για να ανανεώσουμε όλα τα δεδομένα
    await refreshData();
    
    // Κλείσιμο του dialog και επαναφορά της κατάστασης
    setOpenAthleteSelectionDialog(false);
    setSelectedCompetitionId(null);
    setSelectedAthletes([]);
    
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη αθλητών στον αγώνα:", error);
    alert("Σφάλμα κατά την προσθήκη αθλητών στον αγώνα. Παρακαλώ δοκιμάστε ξανά.");
  }
};

  // Διαχείριση διαγραφών με επιβεβαίωση
  const handleConfirmDelete = (id, secondaryId = null, type = '') => {
    setItemToDelete({ id, secondaryId });
    setDeleteType(type);
    setConfirmDeleteOpen(true);
  };
  
  // Εκτέλεση διαγραφής μετά την επιβεβαίωση
const executeDelete = async () => {
  try {
    if (!itemToDelete) return;
    
    console.log("Executing delete for:", deleteType, itemToDelete);
    
    switch(deleteType) {
      case 'athlete':
        if (!itemToDelete.id) {
          throw new Error("Δεν καθορίστηκε ID αθλητή για διαγραφή");
        }
        const athleteId = parseInt(itemToDelete.id);
        if (isNaN(athleteId)) {
          throw new Error(`Μη έγκυρο ID αθλητή: ${itemToDelete.id}`);
        }
        await axios.delete(`http://localhost:5000/api/athlites/athlete/${athleteId}`);
        break;
        
      case 'competition':
        if (!itemToDelete.id) {
          throw new Error("Δεν καθορίστηκε ID αγώνα για διαγραφή");
        }
        const competitionId = parseInt(itemToDelete.id);
        if (isNaN(competitionId)) {
          throw new Error(`Μη έγκυρο ID αγώνα: ${itemToDelete.id}`);
        }
        await axios.delete(`http://localhost:5000/api/athlites/agona/${competitionId}`);
        break;
        
      case 'athlete-from-competition':
        if (!itemToDelete.id || !itemToDelete.secondaryId) {
          console.error("Λείπει το ID αγώνα ή αθλητή", itemToDelete);
          throw new Error(`Λείπουν απαραίτητα IDs: αγώνας=${itemToDelete.id}, αθλητής=${itemToDelete.secondaryId}`);
        }
        
        try {
          // Ελέγχουμε αν τα IDs είναι αριθμητικά 
          const compId = parseInt(itemToDelete.id);
          const athId = parseInt(itemToDelete.secondaryId);
          
          if (isNaN(compId) || isNaN(athId)) {
            throw new Error(`Μη έγκυρα IDs: αγώνας=${itemToDelete.id}, αθλητής=${itemToDelete.secondaryId}`);
          }
          
          console.log(`Διαγραφή αθλητή ${athId} από αγώνα ${compId}`);
          await axios.delete(`http://localhost:5000/api/athlites/agona/${compId}/athlete/${athId}`);
        } catch (deleteError) {
          console.error("Σφάλμα κατά την αφαίρεση αθλητή:", deleteError);
          throw deleteError;
        }
        break;
        
      default:
        throw new Error(`Άγνωστος τύπος διαγραφής: ${deleteType}`);
    }
    
    // Ανανέωση όλων των δεδομένων μετά από οποιαδήποτε διαγραφή
    await refreshData();
    
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή:", error);
    alert(`Σφάλμα κατά τη διαγραφή: ${error.message}`);
  } finally {
    setConfirmDeleteOpen(false);
    setItemToDelete(null);
  }
};

  // Χειρισμός διαγραφής αθλητή
  const handleDeleteAthlete = (id) => {
    handleConfirmDelete(id, null, 'athlete');
  };

  // Χειρισμός προσθήκης νέου αγώνα από τον πίνακα αθλημάτων
  const handleAddSportCompetitionClick = () => {
    setCurrentSportId(null);
    setCurrentSportName("");
    setSelectedAthletes([]);
    setEditCompetitionData(null);
    setOpenAddCompetitionDialog(true); // Άνοιγμα απευθείας του κύριου διαλόγου
  };

  // Πεδία φόρμας για επιλογή αθλήματος
  const sportSelectionFormFields = useMemo(() => [
    { 
      accessorKey: "sportId", 
      header: "Άθλημα", 
      type: "select",
      options: sportsListData.map(sport => ({ 
        value: sport.id_athlimatos, 
        label: sport.onoma 
      })),
      validation: yup.string().required("Παρακαλώ επιλέξτε άθλημα")
    }
  ], [sportsListData]);

  // Πεδία φόρμας για προσθήκη αθλητή
  const athleteFormFields = useMemo(() => [
    { 
      accessorKey: "firstName", 
      header: "Όνομα", 
      validation: yup.string().required("Υποχρεωτικό πεδίο") 
    },
    { 
      accessorKey: "lastName", 
      header: "Επώνυμο", 
      validation: yup.string().required("Υποχρεωτικό πεδίο") 
    },
    { 
      accessorKey: "patronimo", 
      header: "Πατρώνυμο", 
      validation: yup.string().required("Υποχρεωτικό πεδίο") 
    },
    { 
      accessorKey: "email", 
      header: "Email", 
      validation: yup.string().email("Μη έγκυρο email") 
    },
    { 
      accessorKey: "phone", 
      header: "Τηλέφωνο", 
      validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία") 
    },
    { 
      accessorKey: "odos", 
      header: "Διεύθυνση" 
    },
    { 
      accessorKey: "tk", 
      header: "ΤΚ", 
      validation: yup.number().typeError("Πρέπει να είναι αριθμός") 
    },
    { 
      accessorKey: "arithmos_mitroou", 
      header: "Αριθμός Μητρώου", 
      validation: yup.number().required("Υποχρεωτικό πεδίο").typeError("Πρέπει να είναι αριθμός") 
    },
    { 
      accessorKey: "vathmos_diskolias", 
      header: "Βαθμός Δυσκολίας", 
      type: "select",
      options: difficultyLevels.map(level => ({ value: level.id_vathmou_diskolias, label: `Βαθμός ${level.epipedo}` })),
    },
    { 
      accessorKey: "arithmosdeltiou", 
      header: "Αριθμός Δελτίου", 
      validation: yup.number().required("Υποχρεωτικό πεδίο").typeError("Πρέπει να είναι αριθμός") 
    },
    { 
      accessorKey: "hmerominiaenarksis", 
      header: "Ημ/νία Έναρξης Δελτίου", 
      type: "date",
    },
    { 
      accessorKey: "hmerominialiksis", 
      header: "Ημ/νία Λήξης Δελτίου", 
      type: "date",
    },
    { 
      accessorKey: "athlimata", 
      header: "Αθλήματα", 
      type: "multiSelect",
      options: sportsListData.map(sport => ({ value: sport.id_athlimatos, label: sport.onoma })),
      validation: yup.array().min(1, "Πρέπει να επιλέξετε τουλάχιστον ένα άθλημα")
    },
  ], [difficultyLevels, sportsListData]);

  // Πεδία φόρμας για προσθήκη/επεξεργασία αγώνα
  const competitionFormFields = useMemo(() => [
    { 
      // Πρώτα το άθλημα
      accessorKey: "sportId", 
      header: "Άθλημα", 
      type: "select",
      options: sportsListData.map(sport => ({ 
        value: sport.id_athlimatos, 
        label: sport.onoma 
      })),
      validation: yup.string().required("Παρακαλώ επιλέξτε άθλημα"),
      disabled: editCompetitionData !== null, // Disable when editing
    },
    { 
      accessorKey: "onoma", 
      header: "Όνομα Αγώνα", 
      validation: yup.string().required("Υποχρεωτικό πεδίο")
    },
    { 
      accessorKey: "perigrafi", 
      header: "Περιγραφή"
    },
    { 
      accessorKey: "hmerominia", 
      header: "Ημερομηνία", 
      type: "date",
      validation: yup.date().required("Υποχρεωτικό πεδίο")
    },
    {
      accessorKey: "athleteIds",
      header: "Συμμετέχοντες Αθλητές",
      type: "tableSelect",
      dataKey: "athletesBySport",
      validation: yup.array(), // Αφαιρέστε το .min(1, "...")
      columns: [
        {
          field: "fullName",
          header: "Ονοματεπώνυμο",
          valueGetter: (item) => `${item.firstName || ''} ${item.lastName || ''}`.trim()
        },
        {
          field: "arithmosdeltiou",
          header: "Αρ. Δελτίου"
        }
      ]
    }
  ], [sportsListData, editCompetitionData]);

  // Στήλες για το dialog επιλογής αθλητών
  const athleteSelectionColumns = [
    {
      field: "name",
      header: "Ονοματεπώνυμο",
      width: "70%"
    },
    {
      field: "athleteNumber",
      header: "Αρ. Δελτίου",
      width: "30%"
    }
  ];

  // Βεβαιωθείτε ότι δεν αλλάζουν τα resourceData σε κάθε render

// Define formatAthletesForSelection first
const formatAthletesForSelection = useMemo(() => {
  return athletesBySport.map(athlete => {
    // Διασφάλιση συνεπούς μορφής δεδομένων για όλα τα πεδία
    const formattedAthlete = {
      ...athlete,
      id: athlete.id,
      name: athlete.name || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim(),
      athleteNumber: athlete.athleteNumber || athlete.arithmosdeltiou || "-",
      firstName: athlete.firstName || athlete.name?.split(' ')[0] || "",
      lastName: athlete.lastName || athlete.name?.split(' ').slice(1).join(' ') || ""
    };
    
    // Προσθήκη πεδίου fullName για καλύτερη εμφάνιση
    formattedAthlete.fullName = formattedAthlete.name || 
      `${formattedAthlete.firstName} ${formattedAthlete.lastName}`.trim();
    
    return formattedAthlete;
  });
}, [athletesBySport]);

// Then use it in competitionResourceData
const competitionResourceData = useMemo(() => ({
  athletesBySport: formatAthletesForSelection
}), [formatAthletesForSelection]);

// Βεβαιωθείτε ότι τα initialValues και resourceData δεν αλλάζουν σε κάθε render

// Βελτίωση του κώδικα που περνάει initialValues
const memoizedInitialValues = useMemo(() => {
  if (editCompetitionData) {
    return {
      sportId: editCompetitionData.id_athlimatos.toString(),
      onoma: editCompetitionData.onoma,
      perigrafi: editCompetitionData.perigrafi,
      hmerominia: editCompetitionData.hmerominia ? new Date(editCompetitionData.hmerominia).toISOString().split('T')[0] : "",
      athleteIds: selectedAthletes || []
    };
  }
  return {
    sportId: currentSportId ? currentSportId.toString() : "",
    athleteIds: []
  };
}, [editCompetitionData, selectedAthletes, currentSportId]);

// Προσθήκη συνάρτησης για επεξεργασία αθλητή (αν χρειάζεται)

// Πλήρης υλοποίηση του handleEditAthlete
const handleEditAthlete = async (athlete) => {
  console.log("Editing athlete:", athlete);
  
  // Δημιουργία αντικειμένου με όλα τα απαραίτητα δεδομένα για επεξεργασία
  const editValues = {
    id: athlete.id,
    firstName: athlete.firstName || "",
    lastName: athlete.lastName || "",
    email: athlete.email || "",
    phone: athlete.phone || "",
    patronimo: athlete.patronimo || "",
    odos: athlete.odos || "",
    tk: athlete.tk || "",
    arithmos_mitroou: athlete.arithmos_mitroou || "",
    vathmos_diskolias: athlete.vathmos_diskolias || "",
    arithmosdeltiou: athlete.arithmosdeltiou || "",
    hmerominiaenarksis: athlete.hmerominiaenarksis || "",
    hmerominialiksis: athlete.hmerominialiksis || "",
    athlimata: athlete.athlimata?.map(a => a.id) || []
  };

  console.log("Prepared athlete edit data:", editValues);
  
  // Ορίζουμε τις τιμές για επεξεργασία και ανοίγουμε το dialog
  setEditAthleteValues(editValues);
  setOpenEditAthleteDialog(true);
};

// Προσθήκη συνάρτησης για την αποθήκευση των αλλαγών μετά την επεξεργασία
const handleEditAthleteSave = async (updatedAthlete) => {
  try {
    console.log("Saving edited athlete:", updatedAthlete);
    
    const athleteId = updatedAthlete.id;
    
    // Δημιουργία του αντικειμένου δεδομένων για το API
    const requestData = {
      epafes: {
        onoma: updatedAthlete.firstName,
        epitheto: updatedAthlete.lastName,
        email: updatedAthlete.email,
        tilefono: updatedAthlete.phone,
      },
      vathmos_diskolias: {
        id_vathmou_diskolias: parseInt(updatedAthlete.vathmos_diskolias) || 1,
      },
      esoteriko_melos: {
        patronimo: updatedAthlete.patronimo,
        odos: updatedAthlete.odos,
        tk: updatedAthlete.tk ? parseInt(updatedAthlete.tk) : null,
        arithmos_mitroou: updatedAthlete.arithmos_mitroou ? parseInt(updatedAthlete.arithmos_mitroou) : null,
      },
      athlitis: {
        arithmos_deltiou: updatedAthlete.arithmosdeltiou ? parseInt(updatedAthlete.arithmosdeltiou) : null,
        hmerominia_enarksis_deltiou: updatedAthlete.hmerominiaenarksis ? new Date(updatedAthlete.hmerominiaenarksis) : null,
        hmerominia_liksis_deltiou: updatedAthlete.hmerominialiksis ? new Date(updatedAthlete.hmerominialiksis) : null,
      },
      athlimata: updatedAthlete.athlimata ? 
        (Array.isArray(updatedAthlete.athlimata) ? 
          updatedAthlete.athlimata.map(id => ({ id_athlimatos: parseInt(id) })) : 
          [{ id_athlimatos: parseInt(updatedAthlete.athlimata) }]
        ) : [],
    };

    // Κλήση του API για ενημέρωση
    await axios.put(`http://localhost:5000/api/athlites/athlete/${athleteId}`, requestData);
    
    // Ανανέωση των δεδομένων
    await refreshData();
    
    // Κλείσιμο του dialog
    setOpenEditAthleteDialog(false);
    setEditAthleteValues({});

  } catch (error) {
    console.error("Σφάλμα κατά την επεξεργασία αθλητή:", error);
    alert(`Σφάλμα κατά την επεξεργασία αθλητή: ${error.response?.data?.error || error.message}`);
  }
};

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Αθλητές ({athletesData.length})
        </Typography>
        <Box sx={{ mb: 4 }}>
          <DataTable
            data={athletesData}
            columns={athleteColumns}
            detailPanelConfig={athleteDetailPanelConfig}
            getRowId={(row) => row.id}
            initialState={{
              columnVisibility: {
                id: false,
                odos: false,
                tk: false,
                arithmosdeltiou: false,   // Πρόσθεσα κρυφή κατάσταση για τον αριθμό δελτίου
                hmerominiaenarksis: false, // Πρόσθεσα κρυφή κατάσταση για την ημερομηνία έναρξης
                athlima: false,            // Πρόσθεσα κρυφή κατάσταση για το άθλημα
                totalParticipation: false  // Πρόσθεσα κρυφή κατάσταση για τις συμμετοχές
              },
              columnOrder: [
                "fullName",
                "phone",
                "email",
                "arithmosdeltiou",
                "athlima",
                "totalParticipation",
                "mrt-actions",
              ]
            }}
            state={{ isLoading: loading }}
            onAddNew={() => setOpenAddAthleteDialog(false)}
            handleEditClick={handleEditAthlete} // Προσθήκη του handler
            handleDelete={handleDeleteAthlete}
            enableExpand={true}
          />
        </Box>

        <Typography variant="h4" gutterBottom>
          Αθλήματα ({sportsData.length})
        </Typography>
        <Box>
          <DataTable
            data={sportsData}
            columns={sportsColumns}
            detailPanelConfig={sportDetailPanelConfig}
            getRowId={(row) => row.id}
            initialState={{
              columnVisibility: {
                id: false,
              },
            }}
            state={{ isLoading: loading }}
            enableExpand={true}
            enableRowActions={false}
            enableAddNew={true}
            enableTopAddButton={false} // Κρύβουμε το κουμπί προσθήκης στην κορυφή
            onAddNew={handleAddSportCompetitionClick}
            handleEditClick={() => {}}
            handleDelete={() => {}}
          />
        </Box>

        {/* Dialogs */}
        <AddDialog
          open={openAddAthleteDialog}
          onClose={() => setOpenAddAthleteDialog(false)}
          handleAddSave={handleAddAthlete}
          fields={athleteFormFields}
          title="Προσθήκη Νέου Αθλητή"
        />

        <AddDialog
          open={openAddCompetitionDialog}
          onClose={() => {
            setOpenAddCompetitionDialog(false);
            setEditCompetitionData(null);
            setSelectedAthletes([]);
          }}
          handleAddSave={handleAddCompetition}
          fields={competitionFormFields}
          title={editCompetitionData ? "Επεξεργασία Αγώνα" : "Προσθήκη Νέου Αγώνα"}
          initialValues={memoizedInitialValues}
          resourceData={competitionResourceData}
        />

        <SelectionDialog
          open={openAthleteSelectionDialog}
          onClose={() => {
            setOpenAthleteSelectionDialog(false);
            if (selectedCompetitionId) setSelectedCompetitionId(null);
          }}
          data={athletesBySport}
          selectedIds={selectedAthletes} // Fix: Always pass selectedAthletes, not empty array
          onChange={(ids) => setSelectedAthletes(ids)} // Fix: Always update selectedAthletes
          onConfirm={selectedCompetitionId ? handleCompetitionAthleteSelection : ids => {
            setSelectedAthletes(ids);
            setOpenAthleteSelectionDialog(false);
          }}
          title={selectedCompetitionId ? "Προσθήκη Αθλητών στον Αγώνα" : "Επιλογή Αθλητών για τον Αγώνα"}
          columns={athleteSelectionColumns}
          idField="id"
          searchFields={["name", "athleteNumber"]}
          noDataMessage="Δεν υπάρχουν διαθέσιμοι αθλητές για αυτό το άθλημα"
        />

        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
        >
          <DialogTitle>Επιβεβαίωση διαγραφής</DialogTitle>
          <DialogContent>
            <Typography>
              {deleteType === 'athlete' && 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον αθλητή;'}
              {deleteType === 'competition' && 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον αγώνα;'}
              {deleteType === 'athlete-from-competition' && 'Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτόν τον αθλητή από τον αγώνα;'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Άκυρο</Button>
            <Button 
              onClick={executeDelete} 
              color="error" 
              variant="contained"
            >
              Διαγραφή
            </Button>
          </DialogActions>
        </Dialog>

        {/* Προσθέστε το EditDialog για αθλητές */}
        <EditDialog
          open={openEditAthleteDialog}
          onClose={() => setOpenEditAthleteDialog(false)}
          handleEditSave={handleEditAthleteSave}
          editValues={editAthleteValues}
          fields={athleteFormFields} // Χρησιμοποιούμε τα ίδια πεδία με το AddDialog
          title="Επεξεργασία Αθλητή"
        />
      </Box>
    </LocalizationProvider>
  );
}