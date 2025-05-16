import React, { useState, useEffect, useMemo } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import DataTable from "../components/DataTable/DataTable";
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableBody, TableRow, TableCell, Paper, TableContainer, IconButton,
  Grid, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import SelectionDialog from "../components/SelectionDialog";
import axios from "axios";
import * as yup from "yup";
import "./App.css";
import { Add, Edit, Delete, KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';

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
      // Προσθήκη αυτών των γραμμών για απενεργοποίηση του hover και του click
      noRowHover: true,
      noRowClick: true
    },
  ],
};

export default function Athlites() {
  // Αρχικά όλα τα state variables
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
  const [expandedCompetitions, setExpandedCompetitions] = useState({});
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [dialogSelectedSport, setDialogSelectedSport] = useState(null);

  // Φόρτωση δεδομένων
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add the missing Promise.all() function here
        const [athletesRes, sportsRes, sportsListRes, difficultyRes] = await Promise.all([
          axios.get("http://localhost:5000/api/athlites/athletes"),
          axios.get("http://localhost:5000/api/athlites/sports"),
          axios.get("http://localhost:5000/api/athlites/sports-list"),
          axios.get("http://localhost:5000/api/vathmoi-diskolias")
        ]);

        // Προσθήκη fullName για καλύτερο φιλτράρισμα
        const formattedAthletes = athletesRes.data.map(athlete => ({
          ...athlete,
          fullName: `${athlete.firstName || athlete.esoteriko_melos?.melos?.epafes?.onoma || ""} ${athlete.lastName || athlete.esoteriko_melos?.melos?.epafes?.epitheto || ""}`.trim(),
          firstName: athlete.firstName || athlete.esoteriko_melos?.melos?.epafes?.onoma || "",
          lastName: athlete.lastName || athlete.esoteriko_melos?.melos?.epafes?.epitheto || ""
        }));

        // Προσθήκη πεδίου totalCompetitions για κάθε άθλημα με συμμετοχές ανά έτος
        const formattedSports = sportsRes.data.map(sport => {
          // Υπολογισμός συνολικών συμμετοχών
          let totalCompetitions = 0;
          
          // Ομαδοποίηση συμμετοχών ανά έτος
          const participationsByYear = {};
          
          sport.agones.forEach(agonas => {
            const summetexontes = agonas.summetexontes?.length || 0;
            totalCompetitions += summetexontes;
            
            // Εξαγωγή έτους από την ημερομηνία του αγώνα
            if (agonas.hmerominia && summetexontes > 0) {
              const year = new Date(agonas.hmerominia).getFullYear();
              if (!participationsByYear[year]) {
                participationsByYear[year] = 0;
              }
              participationsByYear[year] += summetexontes;
            }
          });
          
          // Ταξινόμηση ετών
          const sortedYearlyParticipations = Object.entries(participationsByYear)
            .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
            .map(([year, count]) => ({ year, count }));
          
          return {
            ...sport,
            totalCompetitions,
            yearlyParticipations: sortedYearlyParticipations,
            // Προσθήκη μετρητή συμμετεχόντων σε κάθε αγώνα
            agones: sport.agones.map(agonas => ({
              ...agonas,
              summetexontesCount: agonas.summetexontes?.length || 0,
              summetexontes: agonas.summetexontes?.map(athlete => {
                // Βελτιωμένο mapping με όλα τα πιθανά μονοπάτια δεδομένων
                // Λεπτομερής αναζήτηση ονόματος
                const firstName = athlete.firstName || 
                                 athlete.esoteriko_melos?.melos?.epafes?.onoma || 
                                 athlete.athlitis?.esoteriko_melos?.melos?.epafes?.onoma ||
                                 athlete.epafes?.onoma ||
                                 athlete.melos?.epafes?.onoma ||
                                 athlete.athlitis?.firstName ||
                                 athlete.athliti?.firstName ||
                                 athlete.name?.split(' ')[0] || "";
                
                // Λεπτομερής αναζήτηση επωνύμου
                const lastName = athlete.lastName || 
                                athlete.esoteriko_melos?.melos?.epafes?.epitheto || 
                                athlete.athlitis?.esoteriko_melos?.melos?.epafes?.epitheto ||
                                athlete.epafes?.epitheto ||
                                athlete.melos?.epafes?.epitheto ||
                                athlete.athlitis?.lastName ||
                                athlete.athliti?.lastName ||
                                athlete.name?.split(' ').slice(1).join(' ') || "";
                
                // Δημιουργία fullName με προτεραιότητα
                const fullName = athlete.fullName || 
                                `${firstName} ${lastName}`.trim() || 
                                athlete.name || 
                                "Άγνωστο Όνομα";  // Fallback σε περίπτωση που δεν βρεθεί όνομα
                
                // Εκτύπωση debugging για προβληματικές περιπτώσεις
                if (!firstName && !lastName && !athlete.fullName && !athlete.name) {
                  console.warn("Αδυναμία εξαγωγής ονόματος αθλητή:", JSON.stringify(athlete, null, 2));
                }
                
                return {
                  ...athlete,
                  id: athlete.id_athliti || athlete.id || athlete.athlitis?.id_athliti,
                  firstName,
                  lastName,
                  fullName,
                  name: fullName,
                  arithmosdeltiou: athlete.arithmosdeltiou || athlete.arithmos_deltiou || athlete.athlitis?.arithmos_deltiou || "-"
                };
              }) || []
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

  // Προσθέστε αυτό μετά το κύριο useEffect που φορτώνει τα δεδομένα
  useEffect(() => {
    // Εξαγωγή όλων των διαθέσιμων ετών από τους αγώνες
    const years = new Set();
    
    sportsData.forEach(sport => {
      sport.agones.forEach(agonas => {
        if (agonas.hmerominia) {
          const year = new Date(agonas.hmerominia).getFullYear();
          years.add(year);
        }
      });
    });
    
    // Ταξινόμηση ετών σε φθίνουσα σειρά
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    setAvailableYears(sortedYears);
    
    // Φιλτράρισμα αγώνων με βάση τα επιλεγμένα φίλτρα
    filterCompetitions();
  }, [sportsData]);

  // Προσθέστε αυτό useEffect για να ενημερώνονται τα φιλτραρισμένα αποτελέσματα
  useEffect(() => {
    filterCompetitions();
  }, [selectedSportFilter, selectedYearFilter, sportsData]);

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

  // Διαχείριση διαγραφών με επιβεβαίωση - ΜΕΤΑΚΙΝΗΜΕΝΟ ΠΡΙΝ ΤΟ sportDetailPanelConfig
  const handleConfirmDelete = (id, secondaryId = null, type = '') => {
    // Διασφάλιση ότι το id είναι πάντα μια τιμή, όχι ένα αντικείμενο
    let actualId = id;
    
    // Αν το id είναι αντικείμενο, προσπάθησε να εξάγεις το πραγματικό id
    if (typeof id === 'object' && id !== null) {
      actualId = id.id_agona || id.id || id.id_athliti;
      console.log("Extracted ID from object:", actualId);
    }
    
    if (!actualId && actualId !== 0) {
      console.error("Invalid ID for deletion", id);
      alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID για διαγραφή");
      return;
    }
    
    setItemToDelete({ id: actualId, secondaryId });
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
          if (!itemToDelete.id && itemToDelete.id !== 0) {
            throw new Error("Δεν καθορίστηκε ID αθλητή για διαγραφή");
          }
          const athleteId = parseInt(itemToDelete.id);
          if (isNaN(athleteId)) {
            throw new Error(`Μη έγκυρο ID αθλητή: ${itemToDelete.id}`);
          }
          await axios.delete(`http://localhost:5000/api/athlites/athlete/${athleteId}`);
          break;
          
        case 'competition':
          if (!itemToDelete.id && itemToDelete.id !== 0) {
            throw new Error("Δεν καθορίστηκε ID αγώνα για διαγραφή");
          }
          const competitionId = parseInt(itemToDelete.id);
          if (isNaN(competitionId)) {
            throw new Error(`Μη έγκυρο ID αγώνα: ${itemToDelete.id}`);
          }
          await axios.delete(`http://localhost:5000/api/athlites/agona/${competitionId}`);
          break;
          
        case 'athlete-from-competition':
          if ((!itemToDelete.id && itemToDelete.id !== 0) || 
              (!itemToDelete.secondaryId && itemToDelete.secondaryId !== 0)) {
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
            
            // ΣΗΜΑΝΤΙΚΟ: Ενημέρωση άμεσα του state
            setSportsData(prevSportsData => {
              return prevSportsData.map(sport => {
                // Ενημέρωση μόνο του σχετικού sport
                if (sport.agones.some(agonas => agonas.id === compId || agonas.id_agona === compId)) {
                  // Βρίσκουμε και ενημερώνουμε μόνο τον συγκεκριμένο αγώνα
                  const updatedAgones = sport.agones.map(agonas => {
                    if (agonas.id === compId || agonas.id_agona === compId) {
                      // Αφαιρούμε τον αθλητή από τη λίστα
                      const updatedSummetexontes = agonas.summetexontes.filter(athlete => 
                        athlete.id !== athId && athlete.id_athliti !== athId
                      );
                      
                      return {
                        ...agonas,
                        summetexontesCount: updatedSummetexontes.length,
                        summetexontes: updatedSummetexontes
                      };
                    }
                    return agonas;
                  });

                  return {
                    ...sport,
                    agones: updatedAgones
                  };
                }
                return sport;
              });
            });
          } catch (deleteError) {
            console.error("Σφάλμα κατά την αφαίρεση αθλητή:", deleteError);
            throw deleteError;
          }
          break;
          
        default:
          throw new Error(`Άγνωστος τύπος διαγραφής: ${deleteType}`);
      }
      
      // Ανανέωση όλων των δεδομένων μετά από οποιαδήποτε διαγραφή
      if (deleteType !== 'athlete-from-competition') {
        await refreshData();
      }
      
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή:", error);
      alert(`Σφάλμα κατά τη διαγραφή: ${error.message}`);
    } finally {
      setConfirmDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  // Χειρισμός επεξεργασίας αγώνα
const handleEditCompetition = (competition) => {
  console.log('Editing competition:', competition);
  
  // Βρίσκουμε το σωστό ID
  const competitionId = competition.id_agona || competition.id;
  
  // Πρέπει να βεβαιωθούμε ότι έχουμε σωστά IDs αθλητών
  const athleteIds = competition.summetexontes?.map(athlete => 
    typeof athlete.id === 'number' ? athlete.id : parseInt(athlete.id)
  ) || [];
  
  console.log('Athlete IDs:', athleteIds);
  
  setEditCompetitionData({
    id: competitionId,
    id_agona: competitionId, // Προσθέτουμε και τα δύο για σιγουριά
    onoma: competition.onoma,
    perigrafi: competition.perigrafi,
    hmerominia: competition.hmerominia ? new Date(competition.hmerominia).toISOString().split('T')[0] : "",
    id_athlimatos: competition.id_athlimatos || competition.sportId
  });
  
  setCurrentSportId(competition.id_athlimatos || competition.sportId);
  
  const sport = sportsData.find(s => s.id === competition.id_athlimatos || s.id_athlimatos === competition.id_athlimatos || s.id_athlimatos === competition.sportId);
  if (sport) {
    setCurrentSportName(sport.athlima);
  }
  
  // Φόρτωση όλων των αθλητών για αυτό το άθλημα
  fetchAthletesBySport(competition.id_athlimatos || competition.sportId).then(() => {
    // Καθορισμός των επιλεγμένων αθλητών
    
    setSelectedAthletes(athleteIds);
    
    // Άνοιγμα του dialog
    setOpenAddCompetitionDialog(true);
  });
};

  // Χειρισμός προσθήκης αγώνα σε άθλημα - ΜΕΤΑΚΙΝΗΜΕΝΟ ΠΡΙΝ ΤΟ sportDetailPanelConfig
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

  // Χειρισμός προσθήκης αθλητή σε αγώνα - ΜΕΤΑΚΙΝΗΜΕΝΟ ΠΡΙΝ ΤΟ sportDetailPanelConfig
  const handleAddAthleteToCompetition = (competitionId) => {
    const competition = sportsData.flatMap(s => s.agones).find(a => a.id === competitionId || a.id_agona === competitionId);
    if (competition) {
      setSelectedCompetitionId(competitionId);
      
      // Αποθήκευση των ID των αθλητών που ήδη συμμετέχουν
      const existingAthleteIds = competition.summetexontes?.map(athlete => athlete.id || athlete.id_athliti) || [];
      
      // Φόρτωση αθλητών για αυτό το άθλημα
      fetchAthletesBySport(competition.id_athlimatos || competition.sportId).then((allAthletes) => {
        // Set currently selected athletes to those already participating
        setSelectedAthletes(existingAthleteIds);
        
        // Άνοιγμα του dialog
        setOpenAthleteSelectionDialog(true);
      });
    }
  };

  // Προσθέστε αυτή τη συνάρτηση μετά τον ορισμό του state expandedCompetitions και πριν το sportDetailPanelConfig
  const toggleCompetition = (competitionId) => {
    setExpandedCompetitions(prev => ({
      ...prev,
      [competitionId]: !prev[competitionId]
    }));
  };

  // ΤΩΡΑ μπορούμε με ασφάλεια να ορίσουμε το sportDetailPanelConfig
  const sportDetailPanelConfig = useMemo(() => ({
    mainDetails: [
      // Διατηρούμε μόνο τα βασικά στοιχεία - αφαίρεση του yearlyParticipations
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
        title: "Αγώνες ανά Έτος",
        accessor: "yearlyParticipations",
        columns: [
          { accessor: "year", header: "Έτος" },
          { accessor: "count", header: "Συμμετοχές" }
        ],
        renderExpandedRow: (yearData, rowData) => {
          console.log("renderExpandedRow called with:", { yearData, rowData });
          
          // First check if we have the year data
          if (!yearData || !yearData.year) {
            console.log("No year data found");
            return (
              <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Δεν βρέθηκαν δεδομένα έτους
                </Typography>
              </Box>
            );
          }
          
          // Get the current sport data from various possible structures
          let currentSport;
          let sportId;
          
          try {
            // CRITICAL: Find the parent sport row that contains this year data
            // This will ensure we connect the correct sport with its yearly data
            
            if (rowData && rowData.parentRow?.original) {
              // This is the most reliable source - direct parent row
              currentSport = rowData.parentRow.original;
              sportId = currentSport.id || currentSport.id_athlimatos;
              console.log("Found sport from parent row:", currentSport);
            } 
            else if (rowData && rowData.original) {
              // Secondary method
              currentSport = rowData.original;
              sportId = currentSport.id || currentSport.id_athlimatos;
              console.log("Using rowData.original:", currentSport);
            } 
            else if (rowData && rowData.row && rowData.row.original) {
              // Another possible structure
              currentSport = rowData.row.original;
              sportId = currentSport.id || currentSport.id_athlimatos;
              console.log("Using rowData.row.original:", currentSport);
            } 
            else if (rowData && (rowData.id || rowData.id_athlimatos)) {
              // Directly from rowData
              currentSport = rowData;
              sportId = currentSport.id || currentSport.id_athlimatos;
              console.log("Using rowData directly:", currentSport);
            }
            
            // If we still don't have currentSport, search the sportsData array
            // using BOTH the year AND the sport context
            if (!currentSport && sportsData) {
              console.log("Sport not found in row data, searching in sportsData...");
              
              // First try to get sportId from the expanded row context
              if (rowData.id || rowData.id_athlimatos) {
                sportId = rowData.id || rowData.id_athlimatos;
                console.log("Using sportId from rowData:", sportId);
              }
              
              // If we have a sportId, find that exact sport
              if (sportId) {
                currentSport = sportsData.find(sport => 
                  sport.id === sportId || sport.id_athlimatos === sportId
                );
                console.log("Found sport by ID:", currentSport);
              }
              
              // Last resort: Find any sport with this year's data
              if (!currentSport && yearData) {
                console.log("Fallback: Finding any sport with year:", yearData.year);
                currentSport = sportsData.find(sport => {
                  return sport.yearlyParticipations?.some(y => y.year === yearData.year);
                });
              }
            }
            
            // Special case: if we still don't have the sport, try looking at the table
            // structure to find where this expanded row belongs
            if (!currentSport && yearData && rowData.table) {
              // Look at the table structure to determine the context
              const tableParent = rowData.table?.options?.meta?.parentRow;
              if (tableParent?.original) {
                currentSport = tableParent.original;
                sportId = currentSport.id || currentSport.id_athlimatos;
                console.log("Found sport from table context:", currentSport);
              }
            }
            
          } catch (error) {
            console.error("Error finding sport data:", error);
          }
          
          // If we still don't have sport data, show a message
          if (!currentSport || !currentSport.agones) {
            return (
              <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Δεν υπάρχουν διαθέσιμα δεδομένα για το έτος {yearData.year}
                </Typography>
              </Box>
            );
          }
          
          // Now proceed with filtering competitions for this sport and year
          const competitionsForYear = currentSport.agones.filter(agon => {
            if (!agon || !agon.hmerominia) return false;
            
            // First check if this competition belongs to the current sport
            const agonSportId = agon.id_athlimatos;
            const belongsToCurrentSport = agonSportId === sportId;
            
            // Then check if the year matches
            const agonDate = new Date(agon.hmerominia);
            const agonYear = agonDate.getFullYear().toString();
            const yearMatches = agonYear === yearData.year;
            
            // Return true only if both conditions are true
            return belongsToCurrentSport && yearMatches;
          }) || [];
          
          // Rest of your rendering code for the competitions
          return (
            <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
                Αγώνες {yearData.year} - {currentSport.athlima}
              </Typography>
              
              {competitionsForYear.length > 0 ? (
                <Box>
                  {competitionsForYear.map((competition) => (
                    <Paper 
                      key={competition.id} 
                      elevation={1} 
                      sx={{ 
                        mb: 2, 
                        overflow: 'hidden',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                      }}
                    >
                      {/* Header του αγώνα */}
                      <Box 
                        sx={{ 
                          p: 2, 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: '#f5f9ff', // Πιο φιλικό χρώμα - γαλάζιο ανοιχτό
                          borderBottom: expandedCompetitions[competition.id] ? '1px solid #e0e0e0' : 'none'
                        }}
                        onClick={() => toggleCompetition(competition.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {/* Εικονίδιο expand/collapse */}
                          <IconButton size="small" sx={{ mr: 1 }}>
                            {expandedCompetitions[competition.id] ? 
                              <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
                            }
                          </IconButton>
                          
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {competition.onoma}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {competition.perigrafi || "-"} | 
                              {competition.hmerominia 
                                ? ` ${new Date(competition.hmerominia).toLocaleDateString("el-GR")}` 
                                : " Χωρίς ημερομηνία"} | 
                              {` ${competition.summetexontes?.length || 0} αθλητές`}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Κουμπιά ενεργειών */}
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCompetition(competition);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={(e) => {
                              e.stopPropagation();
                              const competitionId = competition.id_agona || competition.id;
                              handleConfirmDelete(competitionId, null, 'competition');
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {/* Λεπτομέρειες αγώνα - εμφανίζονται μόνο όταν είναι expanded */}
                      {expandedCompetitions[competition.id] && (
                        <Box sx={{ p: 2, backgroundColor: '#ffffff' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: '#3f51b5' }}>
                            Συμμετέχοντες Αθλητές
                          </Typography>
                          
                          {(competition.summetexontes?.length > 0) ? (
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: '#f0f4fa' }}>
                                    <TableCell>Ονοματεπώνυμο</TableCell>
                                    <TableCell>Αρ. Δελτίου</TableCell>
                                    <TableCell align="right">Ενέργειες</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {competition.summetexontes.map((athlete) => (
                                    <TableRow key={athlete.id} hover>
                                      <TableCell>{athlete.fullName}</TableCell>
                                      <TableCell>{athlete.arithmosdeltiou}</TableCell>
                                      <TableCell align="right">
                                        <IconButton 
                                          size="small" 
                                          color="error"
                                          onClick={() => {
                                            const competitionId = competition.id_agona || competition.id;
                                            const athleteId = athlete.id;
                                            handleConfirmDelete(competitionId, athleteId, 'athlete-from-competition');
                                          }}
                                        >
                                          <Delete fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Δεν υπάρχουν συμμετέχοντες αθλητές
                            </Typography>
                          )}
                          
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            sx={{ 
                              mt: 1, 
                              backgroundColor: '#f5f9ff',
                              '&:hover': {
                                backgroundColor: '#e8f0fe',
                              }
                            }}
                            onClick={() => handleAddAthleteToCompetition(competition.id_agona || competition.id)}
                          >
                            Προσθήκη Αθλητή
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Δεν υπάρχουν αγώνες για το έτος {yearData.year}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        },
        noRowHover: false,
        noRowClick: false,
        onAddNew: (sportId) => handleAddCompetitionClick(sportId, 
          sportsData.find(s => s.id === sportId)?.athlima || "")
      }
    ],
    showEditButton: false
  }), [sportsData, handleEditCompetition, handleConfirmDelete, handleAddAthleteToCompetition, handleAddCompetitionClick, expandedCompetitions]);

  // Χειρισμός προσθήκης αγώνα - με σωστή διαχείριση state και σφαλμάτων
const handleAddCompetition = async (newCompetition) => {
  try {
    // Έλεγχος απαραίτητων πεδίων
    if (!newCompetition.sportId) {
      throw new Error("Παρακαλώ επιλέξτε άθλημα");
    }

    if (!newCompetition.onoma) {
      throw new Error("Το όνομα του αγώνα είναι υποχρεωτικό");
    }
    
    const sportId = parseInt(newCompetition.sportId);
    
    // Προετοιμασία δεδομένων για API
    const requestData = {
      id_athlimatos: sportId,
      onoma: newCompetition.onoma,
      perigrafi: newCompetition.perigrafi || "",
      hmerominia: newCompetition.hmerominia ? new Date(newCompetition.hmerominia).toISOString() : null,
      athleteIds: selectedAthletes
        .map(id => typeof id === 'number' ? id : parseInt(id))
        .filter(id => !isNaN(id))
    };
    
    if (editCompetitionData) {
      // Ενημέρωση υπάρχοντος αγώνα
      const competitionId = editCompetitionData.id_agona || editCompetitionData.id;
      await axios.put(`http://localhost:5000/api/athlites/agona/${competitionId}`, requestData);
      
      // Ενημέρωση αθλητών στον αγώνα
      await axios.post(`http://localhost:5000/api/athlites/agona/${competitionId}/athletes`, {
        athleteIds: requestData.athleteIds
      });
    } else {
      // Προσθήκη νέου αγώνα
      await axios.post("http://localhost:5000/api/athlites/agona", requestData);
    }
    
    // Ανανέωση δεδομένων
    await refreshData();
    
    // Επαναφορά state
    setOpenAddCompetitionDialog(false);
    setSelectedAthletes([]);
    setEditCompetitionData(null);
    setDialogSelectedSport(null);
  } catch (error) {
    console.error("Σφάλμα προσθήκης/επεξεργασίας αγώνα:", error);
    alert(`Σφάλμα: ${error.response?.data?.error || error.message}`);
  }
};

  // Νέα συνάρτηση ανανέωσης δεδομένων - προσθέστε την στο component
  const refreshData = async () => {
    try {
      console.log("Refreshing data...");
      
      // Store current data before fetching new data
      const currentAthletes = [...athletesData];
      
      const [athletesRes, sportsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/athlites/athletes"),
        axios.get("http://localhost:5000/api/athlites/sports"),
      ]);

      // Much more robust athlete formatting
      const formattedAthletes = athletesRes.data.map(athlete => {
        // Try to find this athlete in current data for name preservation
        const existingAthlete = currentAthletes.find(a => a.id === athlete.id || a.id === athlete.id_athliti);
        
        // Get firstName from multiple possible sources with fallbacks
        const firstName = 
          athlete.firstName || 
          athlete.esoteriko_melos?.melos?.epafes?.onoma || 
          athlete.athlitis?.esoteriko_melos?.melos?.epafes?.onoma ||
          existingAthlete?.firstName ||
          athlete.epafes?.onoma ||
          athlete.name?.split(' ')[0] || 
          "";
        
        // Get lastName from multiple possible sources with fallbacks
        const lastName = 
          athlete.lastName || 
          athlete.esoteriko_melos?.melos?.epafes?.epitheto || 
          athlete.athlitis?.esoteriko_melos?.melos?.epafes?.epitheto ||
          existingAthlete?.lastName ||
          athlete.epafes?.epitheto ||
          athlete.name?.split(' ').slice(1).join(' ') || 
          "";
        
        // Create fullName with fallbacks
        const fullName = 
          athlete.fullName || 
          `${firstName} ${lastName}`.trim() || 
          existingAthlete?.fullName ||
          "Άγνωστος Αθλητής";
        
        // If we still have no name, log an error
        if (!firstName && !lastName && !athlete.fullName) {
          console.error("Αδυναμία εξαγωγής ονόματος για αθλητή:", athlete);
        }
        
        return {
          ...athlete,
          id: athlete.id || athlete.id_athliti,
          id_athliti: athlete.id_athliti || athlete.id,
          fullName,
          firstName,
          lastName,
          email: athlete.email || athlete.esoteriko_melos?.melos?.epafes?.email || existingAthlete?.email || "",
          phone: athlete.phone || athlete.esoteriko_melos?.melos?.epafes?.tilefono?.toString() || existingAthlete?.phone || ""
        };
      });

      // Διαμόρφωση αθλημάτων με συμμετοχές ανά έτος
      const formattedSports = sportsRes.data.map(sport => {
        // Υπολογισμός συνολικών συμμετοχών αθλητών στο άθλημα
        let totalCompetitions = 0;
        
        // Ομαδοποίηση συμμετοχών και αγώνων ανά έτος
        const participationsByYear = {};
        const competitionsByYear = {};
        
        sport.agones.forEach(agonas => {
          const summetexontes = agonas.summetexontes?.length || 0;
          totalCompetitions += summetexontes;
          
          // Εξαγωγή έτους από την ημερομηνία του αγώνα
          if (agonas.hmerominia) {
            const year = new Date(agonas.hmerominia).getFullYear();
            
            // Καταμέτρηση συμμετοχών ανά έτος
            if (!participationsByYear[year]) {
              participationsByYear[year] = 0;
              competitionsByYear[year] = [];
            }
            
            if (summetexontes > 0) {
              participationsByYear[year] += summetexontes;
            }
            
            // Προσθήκη του αγώνα στη λίστα αγώνων του έτους
            competitionsByYear[year].push({
              ...agonas,
              id: agonas.id_agona,
              summetexontesCount: summetexontes,
              summetexontes: agonas.summetexontes?.map(athlete => ({
                ...athlete,
                id: athlete.id_athliti || athlete.id,
                firstName: athlete.firstName || "",
                lastName: athlete.lastName || "",
                fullName: athlete.fullName || `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim(),
                arithmosdeltiou: athlete.arithmosdeltiou || "-",
              })) || []
            });
          }
        });
        
        // Μετατροπή των ετών σε ταξινομημένο πίνακα (φθίνουσα σειρά)
        const sortedYears = Object.keys(participationsByYear)
          .sort((a, b) => Number(b) - Number(a));
        
        // Δημιουργία δομημένου αντικειμένου με δεδομένα ανά έτος
        const yearlyData = sortedYears.map(year => ({
          year,
          count: participationsByYear[year],
          competitions: competitionsByYear[year]
        }));
        
        return {
          ...sport,
          totalCompetitions,
          yearlyParticipations: yearlyData,
          competitionsByYear: yearlyData
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

  // Χειρισμός επιλογής αθλητών για αγώνα - με βελτιωμένο χειρισμό σφαλμάτων και ανανέωσης δεδομένων
const handleCompetitionAthleteSelection = async (selectedIds) => {
  try {
    if (!selectedCompetitionId) {
      alert("Δεν έχει επιλεγεί αγώνας");
      return;
    }

    // Βεβαιωθείτε ότι στέλνονται τα σωστά IDs
    const validIds = selectedIds
      .map(id => typeof id === 'number' ? id : parseInt(id))
      .filter(id => !isNaN(id));

    if (validIds.length === 0) {
      alert("Παρακαλώ επιλέξτε τουλάχιστον έναν αθλητή");
      return;
    }

    console.log(`Προσθήκη ${validIds.length} αθλητών στον αγώνα ${selectedCompetitionId}`);

    await axios.post(`http://localhost:5000/api/athlites/agona/${selectedCompetitionId}/athletes`, {
      athleteIds: validIds
    });

    // Πλήρης ανανέωση δεδομένων για να εξασφαλίσουμε συνέπεια
    await refreshData();

    setOpenAthleteSelectionDialog(false);
    setSelectedCompetitionId(null);
    setSelectedAthletes([]);
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη αθλητών στον αγώνα:", error);
    alert(`Σφάλμα: ${error.response?.data?.error || error.message}`);
  }
};

  // Improved version of handleDeleteAthlete
const handleDeleteAthlete = async (athlete) => {
  try {
    // Παίρνουμε το ID ανεξάρτητα από το αν είναι αντικείμενο ή αριθμός
    let athleteId;
    if (typeof athlete === 'number' || typeof athlete === 'string') {
      athleteId = parseInt(athlete);
    } else if (typeof athlete === 'object') {
      // Αναζήτηση σε διάφορες πιθανές θέσεις για το ID
      athleteId = athlete.id_athliti || athlete.id || 
                  (athlete.original && (athlete.original.id_athliti || athlete.original.id));
    }
    
    if (isNaN(athleteId)) {
      throw new Error(`Μη έγκυρο ID αθλητή: ${JSON.stringify(athlete)}`);
    }
    
    // Επιβεβαίωση χρήστη
    if (!window.confirm("Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτόν τον αθλητή;")) {
      return;
    }
    
    await axios.delete(`http://localhost:5000/api/athlites/athlete/${athleteId}`);
    
    // Ενημέρωση των τοπικών δεδομένων
    await refreshData();
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή αθλητή:", error);
    alert(`Σφάλμα κατά τη διαγραφή αθλητή: ${error.message}`);
  }
};

  // Χειρισμός προσθήκης νέου αγώνα από τον πίνακα αθλημάτων
  const handleAddSportCompetitionClick = () => {
    setCurrentSportId(null);
    setCurrentSportName("");
    setSelectedAthletes([]);
    setEditCompetitionData(null);
    setOpenAddCompetitionDialog(true); // Άνοιγμα απευθείας του κύριου διαλόγου
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
      await refreshData();
    } catch (error) {
      console.error("Σφάλμα προσθήκης αθλητή:", error);
      alert("Σφάλμα κατά την προσθήκη του αθλητή. Παρακαλώ δοκιμάστε ξανά.");
    }
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
      onChangeCallback: (value) => {
        // Όταν αλλάζει το άθλημα, φόρτωσε τους αθλητές για αυτό το άθλημα
        if (value) {
          fetchAthletesBySport(value);
        }
      }
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

  // Modified competitionFormFields without athleteIds field
const competitionFormFieldsWithoutAthletes = useMemo(() => [
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
    onChangeCallback: (value) => {
      // Όταν αλλάζει το άθλημα, φόρτωσε τους αθλητές για αυτό το άθλημα
      if (value) {
        fetchAthletesBySport(value);
      }
    }
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

  const competitionResourceData = useMemo(() => ({
    athletesBySport: formatAthletesForSelection
  }), [formatAthletesForSelection]);

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

  // Στήλες για τον πίνακα αγώνων
  const competitionsColumns = useMemo(() => [
    { accessorKey: "id", header: "ID", enableHiding: true },
    { accessorKey: "id_agona", header: "ID Αγώνα", enableHiding: true },
    { accessorKey: "onoma", header: "Όνομα Αγώνα" },
    { accessorKey: "sportName", header: "Άθλημα" },
    { 
      accessorKey: "hmerominia", 
      header: "Ημερομηνία",
      Cell: ({ cell }) => {
        const value = cell.getValue();
        return value ? new Date(value).toLocaleDateString("el-GR") : "-";
      }
    },
    { 
      accessorKey: "summetexontesCount", 
      header: "Συμμετέχοντες",
      Cell: ({ cell }) => cell.getValue() || 0
    }
  ], []);

  // Διαμόρφωση του detail panel για τους αγώνες
  const competitionDetailPanelConfig = useMemo(() => ({
    mainDetails: [
      { accessor: "onoma", header: "Όνομα Αγώνα" },
      { accessor: "sportName", header: "Άθλημα" },
      { accessor: "hmerominia", header: "Ημερομηνία", format: (value) => (value ? new Date(value).toLocaleDateString("el-GR") : "-") },
      { accessor: "perigrafi", header: "Περιγραφή" }
    ],
    tables: [
      {
        title: "Συμμετέχοντες Αθλητές",
        accessor: "summetexontes",
        columns: [
          { accessor: "fullName", header: "Ονοματεπώνυμο" },
          { accessor: "arithmosdeltiou", header: "Αριθμός Δελτίου" }
        ],
        onDelete: (rowData, athlete) => {
          const competitionId = rowData.id_agona || rowData.id;
          const athleteId = athlete.id_athliti || athlete.id;
          handleConfirmDelete(competitionId, athleteId, 'athlete-from-competition');
        },
        onAddNew: (competitionId) => handleAddAthleteToCompetition(competitionId)
      }
    ],
    showEditButton: true
  }), [handleConfirmDelete, handleAddAthleteToCompetition]);

  // Προσθέστε αυτή τη συνάρτηση μαζί με τις άλλες συναρτήσεις του component
  const filterCompetitions = () => {
    if (!sportsData || sportsData.length === 0) {
      setFilteredCompetitions([]);
      return;
    }
    
    // Συλλογή όλων των αγώνων από όλα τα αθλήματα
    let allCompetitions = [];
    
    sportsData.forEach(sport => {
      // Προσθήκη των αγώνων του κάθε αθλήματος με πρόσθετη πληροφορία αθλήματος
      const sportCompetitions = sport.agones.map(agonas => ({
        ...agonas,
        sportName: sport.athlima,
        sportId: sport.id_athlimatos
      }));
      
      allCompetitions = [...allCompetitions, ...sportCompetitions];
    });
    
    // Εφαρμογή φίλτρων
    let filtered = allCompetitions;
    
    // Φιλτράρισμα με βάση το άθλημα
    if (selectedSportFilter !== 'all') {
      filtered = filtered.filter(comp => 
        comp.sportId === selectedSportFilter || 
        comp.id_athlimatos === selectedSportFilter
      );
    }
    
    // Φιλτράρισμα με βάση το έτος
    if (selectedYearFilter !== 'all') {
      filtered = filtered.filter(comp => {
        if (!comp.hmerominia) return false;
        const compYear = new Date(comp.hmerominia).getFullYear().toString();
        return compYear === selectedYearFilter.toString();
      });
    }
    
    // Ταξινόμηση με βάση την ημερομηνία (πιο πρόσφατοι πρώτα)
    filtered.sort((a, b) => {
      if (!a.hmerominia) return 1;
      if (!b.hmerominia) return -1;
      return new Date(b.hmerominia) - new Date(a.hmerominia);
    });
    
    setFilteredCompetitions(filtered);
  };

  // Βελτιωμένη έκδοση για διαγραφή αθλητή από αγώνα
const handleDeleteAthleteFromCompetition = async (competitionId, athleteId) => {
  try {
    // Επιβεβαίωση χρήστη
    if (!window.confirm("Είστε βέβαιοι ότι θέλετε να αφαιρέσετε τον αθλητή από αυτόν τον αγώνα;")) {
      return;
    }
    
    // Έλεγχος εγκυρότητας IDs
    if (!competitionId || !athleteId) {
      throw new Error("Λείπει το ID του αγώνα ή του αθλητή");
    }
    
    // API κλήση
    await axios.delete(`http://localhost:5000/api/athlites/agona/${competitionId}/athlete/${athleteId}`);
    
    // Ενημέρωση του τοπικού state - παρόμοια με το EksormisiDetails.js
    setSportsData(prevSportsData => {
      return prevSportsData.map(sport => {
        const updatedAgones = sport.agones.map(agonas => {
          if (agonas.id === competitionId || agonas.id_agona === competitionId) {
            return {
              ...agonas,
              summetexontes: agonas.summetexontes.filter(
                athlete => athlete.id !== athleteId
              ),
              summetexontesCount: agonas.summetexontes.filter(
                athlete => athlete.id !== athleteId
              ).length
            };
          }
          return agonas;
        });
        
        return {
          ...sport,
          agones: updatedAgones
        };
      });
    });
    
  } catch (error) {
    console.error("Σφάλμα κατά την αφαίρεση αθλητή από αγώνα:", error);
    alert(`Σφάλμα: ${error.message}`);
  }
};

// Νέα συνάρτηση για προβολή διαλόγου επιβεβαίωσης όπως στο EksormisiDetails.js
const showDeleteConfirmation = (item, type, callback) => {
  let message = "Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτό το στοιχείο;";
  
  switch (type) {
    case 'athlete':
      message = "Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτόν τον αθλητή;";
      break;
    case 'competition':
      message = "Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτόν τον αγώνα;";
      break;
    case 'athlete-competition':
      message = "Είστε βέβαιοι ότι θέλετε να αφαιρέσετε τον αθλητή από αυτόν τον αγώνα;";
      break;
  }
  
  if (window.confirm(message)) {
    callback(item);
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
            onAddNew={() => setOpenAddAthleteDialog(true)}
            handleEditClick={handleEditAthlete} // Προσθήκη του handler
            handleDelete={handleDeleteAthlete}
            enableExpand={true}
          />
        </Box>

        <Typography variant="h4" gutterBottom>
          Αγώνες
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Άθλημα</InputLabel>
                <Select
                  value={selectedSportFilter || 'all'}
                  onChange={(e) => setSelectedSportFilter(e.target.value)}
                  label="Άθλημα"
                >
                  <MenuItem value="all">Όλα τα αθλήματα</MenuItem>
                  {sportsListData.map(sport => (
                    <MenuItem key={sport.id_athlimatos} value={sport.id_athlimatos}>
                      {sport.onoma}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Έτος</InputLabel>
                <Select
                  value={selectedYearFilter || 'all'}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  label="Έτος"
                >
                  <MenuItem value="all">Όλα τα έτη</MenuItem>
                  {availableYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={handleAddSportCompetitionClick}
              >
                Νέος Αγώνας
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Box>
          <DataTable
            data={filteredCompetitions}
            columns={competitionsColumns}
            detailPanelConfig={competitionDetailPanelConfig}
            getRowId={(row) => row.id || row.id_agona}
            initialState={{
              columnVisibility: {
                id: false,
                id_agona: false,
              },
            }}
            state={{ isLoading: loading }}
            enableExpand={true}
            enableRowActions={true}
            handleEditClick={handleEditCompetition}
            handleDelete={(competition) => {
              const competitionId = competition.id_agona || competition.id;
              handleConfirmDelete(competitionId, null, 'competition');
            }}
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

        {/* Modified AddDialog for competitions that uses SelectionDialog for athletes */}
        <AddDialog
          open={openAddCompetitionDialog}
          onClose={() => {
            setOpenAddCompetitionDialog(false);
            setEditCompetitionData(null);
            setSelectedAthletes([]);
            setDialogSelectedSport(null);
          }}
          handleAddSave={handleAddCompetition}
          fields={competitionFormFieldsWithoutAthletes} // Use fields without the athleteIds field
          title={editCompetitionData ? "Επεξεργασία Αγώνα" : "Προσθήκη Νέου Αγώνα"}
          initialValues={memoizedInitialValues}
          onChange={(values) => {
            // Όταν αλλάζει το sportId, φόρτωσε τους αντίστοιχους αθλητές
            if (values.sportId && values.sportId !== dialogSelectedSport) {
              setDialogSelectedSport(values.sportId);
              
              // Immediately fetch athletes for this sport
              fetchAthletesBySport(values.sportId).then(athletes => {
                // Ensure athlete data is properly formatted for display
                const formattedAthletes = athletes.map(athlete => ({
                  ...athlete,
                  id: athlete.id || athlete.id_athliti,
                  name: athlete.name || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim(),
                  fullName: athlete.fullName || athlete.name || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim(),
                  athleteNumber: athlete.athleteNumber || athlete.arithmosdeltiou || "-"
                }));
                
                // Update athlete state with formatted data
                setAthletesBySport(formattedAthletes);
                
                // Open athlete selection dialog for new competitions
                if (!editCompetitionData && !openAthleteSelectionDialog) {
                  setOpenAthleteSelectionDialog(true);
                }
              });
            }
          }}
          footerContent={
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                if (dialogSelectedSport) {
                  setOpenAthleteSelectionDialog(true);
                } else {
                  alert("Παρακαλώ επιλέξτε πρώτα ένα άθλημα");
                }
              }}
              startIcon={<Add />}
              sx={{ mr: 2 }}
            >
              Επιλογή Αθλητών
            </Button>
          }
        />

        <SelectionDialog
          open={openAthleteSelectionDialog}
          onClose={() => {
            setOpenAthleteSelectionDialog(false);
            if (selectedCompetitionId) setSelectedCompetitionId(null);
          }}
          data={athletesBySport}
          selectedIds={selectedAthletes}
          onChange={(ids) => setSelectedAthletes(ids)}
          onConfirm={selectedCompetitionId ? handleCompetitionAthleteSelection : ids => {
            setSelectedAthletes(ids);
            setOpenAthleteSelectionDialog(false);
          }}
          title={selectedCompetitionId ? "Προσθήκη Αθλητών στον Αγώνα" : `Επιλογή Αθλητών για τον Αγώνα (${athletesBySport.length} διαθέσιμοι)`}
          columns={athleteSelectionColumns}
          idField="id"
          searchFields={["name", "athleteNumber", "firstName", "lastName"]}
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