import React, { useState, useEffect, useMemo } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import DataTable from "../components/DataTable/DataTable";

import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Table, TableHead, TableBody, TableRow, TableCell, Paper, Divider, TableContainer, IconButton,
  Grid, FormControl, InputLabel, Select, MenuItem, Checkbox, FormGroup, FormControlLabel, FormHelperText
} from '@mui/material';
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import SelectionDialog from "../components/SelectionDialog";
// Add this import at the top with your other imports
import CheckboxSportsSelector from '../components/CheckboxSportsSelector';
import api from '../utils/api';
import * as yup from "yup";
import "./App.css";
import { Add, Edit, Delete, KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import TransformIcon from '@mui/icons-material/Transform';

// Στήλες για τον πίνακα αθλητών
const athleteColumns = [
  { accessorKey: "id", header: "ID", enableHiding: true },
// Replace the fullName column definition in athleteColumns array with these two separate columns
{ 
  accessorKey: "lastName", 
  header: "Επώνυμο", 
  filterFn: (row, id, filterValue) => {
    const lastName = (row.original.lastName || '').toLowerCase();
    return lastName.includes(filterValue.toLowerCase());
  },
  sortingFn: (rowA, rowB, columnId) => {
    const lastNameA = rowA.original.lastName || "";
    const lastNameB = rowB.original.lastName || "";
    return lastNameA.localeCompare(lastNameB);
  }
},
{ 
  accessorKey: "firstName", 
  header: "Όνομα", 
  filterFn: (row, id, filterValue) => {
    const firstName = (row.original.firstName || '').toLowerCase();
    return firstName.includes(filterValue.toLowerCase());
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
    Cell: ({ cell }) => {
      const value = cell.getValue();
      if (!value) return "-";
      const date = new Date(value);
      return date.toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'});
    }
  },
  { 
    accessorKey: "hmerominialiksis", 
    header: "Ημ/νία Λήξης Δελτίου", 
    enableHiding: true,
    Cell: ({ cell }) => {
      const value = cell.getValue();
      if (!value) return "-";
      const date = new Date(value);
      return date.toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'});
    } 
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
    { accessor: "lastName", header: "Επώνυμο" },
    { accessor: "firstName", header: "Όνομα" },
    { accessor: "patronimo", header: "Πατρώνυμο" },
    { accessor: "email", header: "Email" },
    { accessor: "phone", header: "Τηλέφωνο" },
    { accessor: "odos", header: "Διεύθυνση" },
    { accessor: "tk", header: "ΤΚ" },
        { 
      accessor: "athlimata", 
      header: "Αθλήματα",
      Cell: ({ row }) => {
        const athlimata = row.original.athlimata || [];
        return athlimata.map(a => a.onoma).join(", ");
      }
    },
    { accessor: "arithmos_mitroou", header: "Αριθμός Μητρώου" },
    { accessor: "arithmosdeltiou", header: "Αριθμός Δελτίου" },
    { accessor: "hmerominiaenarksis", header: "Ημ/νία Έναρξης Δελτίου", format: (value) => value ? new Date(value).toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "-" },
    { accessor: "hmerominialiksis", header: "Ημ/νία Λήξης Δελτίου", format: (value) => value ? new Date(value).toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "-" },
    { accessor: "vathmos_diskolias", header: "Βαθμός Δυσκολίας" },
  ],
  tables: [
    {
      title: "Συμμετοχές σε Αγώνες",
      accessor: "agones",
      columns: [
        { accessor: "onoma", header: "Όνομα Αγώνα" },
        { accessor: "perigrafi", header: "Περιγραφή" },
        { accessor: "hmerominia", header: "Ημερομηνία", format: (value) => (value ? new Date(value).toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "-") },
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

const [deletePaymentDialog, setDeletePaymentDialog] = useState(false);
const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [openAddAthleteDialog, setOpenAddAthleteDialog] = useState(false);
  const [openAddCompetitionDialog, setOpenAddCompetitionDialog] = useState(false);
  const [openEditAthleteDialog, setOpenEditAthleteDialog] = useState(false);
  const [editAthleteValues, setEditAthleteValues] = useState({});
  const [currentSportId, setCurrentSportId] = useState(null);
  const [athletesBySport, setAthletesBySport] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [openAthleteSelectionDialog, setOpenAthleteSelectionDialog] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [editCompetitionData, setEditCompetitionData] = useState(null);
  const [expandedCompetitions, setExpandedCompetitions] = useState({});
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [dialogSelectedSport, setDialogSelectedSport] = useState(null);
  // Add these with your other state variables
const [openDeleteAthleteDialog, setOpenDeleteAthleteDialog] = useState(false);
const [athleteToDelete, setAthleteToDelete] = useState(null);
// Add this with the other state variables at the top of your component
const [currentSportName, setCurrentSportName] = useState("");
  // State for the confirmation dialog
const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
const [confirmDialogCallback, setConfirmDialogCallback] = useState(null);
const [confirmDialogItem, setConfirmDialogItem] = useState(null);
const [availableMembers, setAvailableMembers] = useState([]);

// Φόρτωση δεδομένων
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add the missing Promise.all() function here
        const [athletesRes, sportsRes, sportsListRes, difficultyRes] = await Promise.all([
          api.get("/athlites/athletes"),
          api.get("/athlites/sports"),
          api.get("/athlites/sports-list"),
          api.get("/vathmoi-diskolias")
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
      
      const response = await api.get(`/athlites/by-sport/${sportId}`);
      const athletesData = response.data;
      
      setAthletesBySport(athletesData);
      return athletesData;
    } catch (error) {
      console.error("Σφάλμα φόρτωσης αθλητών:", error);
      setAthletesBySport([]);
      return [];
    }
  };

  // Απλοποιημένη συνάρτηση επιβεβαίωσης διαγραφής
  const handleConfirmDelete = (id, secondaryId = null, type) => {
    let message = "";

    switch (type) {
      case 'athlete':
        message = "Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτόν τον αθλητή;";
        break;
      case 'competition':
        message = "Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτόν τον αγώνα;";
        break;
      case 'athlete-from-competition':
        message = "Είστε βέβαιοι ότι θέλετε να αφαιρέσετε τον αθλητή από αυτόν τον αγώνα;";
        break;
      default:
        message = "Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτό το στοιχείο;";
    }
    
    if (window.confirm(message)) {
      
      if (type === 'athlete-from-competition') {
        handleDeleteAthleteFromCompetition(id, secondaryId);
      } else if (type === 'competition') {
        handleDeleteCompetition(id);
      } else if (type === 'athlete') {
        handleDeleteAthlete(id);
      }
    }
  };
  
  // Χειρισμός επεξεργασίας αγώνα
const handleEditCompetition = (competition) => {
  
  // Βρίσκουμε το σωστό ID
  const competitionId = competition.id_agona || competition.id;
  
  // Πρέπει να βεβαιωθούμε ότι έχουμε σωστά IDs αθλητών
  const athleteIds = competition.summetexontes?.map(athlete => 
    typeof athlete.id === 'number' ? athlete.id : parseInt(athlete.id)
  ) || [];
  
  
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


  // Add this with your other state variables
const [openConvertMemberDialog, setOpenConvertMemberDialog] = useState(false);

// Add this with your other useMemo hooks
const convertMemberFormFields = useMemo(() => [
  { 
    accessorKey: "memberId", 
    header: "Επιλογή Μέλους", 
    type: "tableSelect",
    dataKey: "availableMembers",
    singleSelect: true,
    columns: [
      { field: "fullName", header: "Ονοματεπώνυμο" },
      { field: "email", header: "Email" },
      { field: "tilefono", header: "Τηλέφωνο" }
    ],
    validation: yup.string().required("Παρακαλώ επιλέξτε μέλος")
  },
  { 
  accessorKey: "memberType", 
  header: "Τύπος Μέλους", 
  type: "select",
  options: [
    { value: "athlete", label: "Αθλητής" },
    { value: "both", label: "Αθλητής και Συνδρομητής" }
  ],
  defaultValue: "both",
  validation: yup.string().required("Παρακαλώ επιλέξτε τύπο μέλους")
},
  { 
    accessorKey: "arithmosdeltiou", 
    header: "Αριθμός Δελτίου", 
    validation: yup
      .number()
      .nullable()
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null) return null;
        return value;
      })
      .typeError("Πρέπει να είναι αριθμός")
  },
  { 
    accessorKey: "hmerominiaenarksis", 
    header: "Ημ/νία Έναρξης Δελτίου", 
    type: "date",
    maxDateField: "hmerominialiksis",
    validation: yup.date().nullable(),
    dateFormat: "dd/MM/yyyy",
  },
  { 
    accessorKey: "hmerominialiksis", 
    header: "Ημ/νία Λήξης Δελτίου", 
    type: "date", 
    minDateField: "hmerominiaenarksis",
    validation: yup.date().nullable()
      .test('end-after-start', 'Η ημερομηνία λήξης πρέπει να είναι μετά ή ίδια με την ημερομηνία έναρξης', function(value) {
        const startDate = this.parent.hmerominiaenarksis;
        if (!value || !startDate) return true;
        const endDate = new Date(value);
        const startDateObj = new Date(startDate);
        if (isNaN(endDate.getTime()) || isNaN(startDateObj.getTime())) return true;
        return endDate >= startDateObj;
      }),
    dateFormat: "dd/MM/yyyy",
  },
  { 
    accessorKey: "athlimata", 
    header: "Αθλήματα", 
    type: "custom",
    validation: yup.array().min(1, "Τουλάχιστον ένα άθλημα είναι υποχρεωτικό"), 
    renderInput: ({ field, fieldState }) => (
      <CheckboxSportsSelector
        options={sportsListData.map(sport => ({ 
          value: sport.id_athlimatos, 
          label: sport.onoma 
        }))}
        value={field.value || []}
        onChange={field.onChange}
        error={fieldState.error?.message}
      />
    )
  },
], [sportsListData]);

// Add this new function to handle the conversion
const handleConvertMember = async (formData) => {
  try {
    const requestData = {
      existingMemberId: parseInt(formData.memberId),
      athlitis: {
        arithmos_deltiou: formData.arithmosdeltiou ? parseInt(formData.arithmosdeltiou) : null,
        // Use proper ISO strings for dates
        hmerominia_enarksis_deltiou: formData.hmerominiaenarksis ? new Date(formData.hmerominiaenarksis).toISOString() : null,
        hmerominia_liksis_deltiou: formData.hmerominialiksis ? new Date(formData.hmerominialiksis).toISOString() : null,
      },
      athlimata: formData.athlimata && Array.isArray(formData.athlimata) 
        ? formData.athlimata.map(id => parseInt(id)).filter(id => !isNaN(id))
        : [],
      keepSubscriber: formData.memberType === "both" // Add this parameter
    };

    const response = await api.post("/athlites/athlete", requestData);
    
    // Format the response for UI update
    const formattedAthlete = {
      ...response.data,
      fullName: `${response.data.esoteriko_melos?.melos?.epafes?.onoma || ""} ${response.data.esoteriko_melos?.melos?.epafes?.epitheto || ""}`.trim(),
      firstName: response.data.esoteriko_melos?.melos?.epafes?.onoma || "",
      lastName: response.data.esoteriko_melos?.melos?.epafes?.epitheto || "",
      email: response.data.esoteriko_melos?.melos?.epafes?.email || "",
      phone: response.data.esoteriko_melos?.melos?.epafes?.tilefono || "",
      arithmosdeltiou: response.data.arithmos_deltiou || "",
      hmerominiaenarksis: response.data.hmerominia_enarksis_deltiou ? 
        new Date(response.data.hmerominia_enarksis_deltiou).toISOString().split('T')[0] : "",
      hmerominialiksis: response.data.hmerominia_liksis_deltiou ? 
        new Date(response.data.hmerominia_liksis_deltiou).toISOString().split('T')[0] : "",
      athlima: response.data.asxoleitai?.map(a => a.athlima.onoma).join(", ") || "",
      agones: [],
      totalParticipation: 0,
    };

    setAthletesData(prev => [...prev, formattedAthlete]);
    setOpenConvertMemberDialog(false);
    await refreshData();

    // Update available members list by filtering out the newly converted athlete
    setAvailableMembers(prev => prev.filter(member => member.id !== formData.memberId));
    
  } catch (error) {
    console.error("Σφάλμα κατά τη μετατροπή μέλους σε αθλητή:", error);
    const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message;
    alert(`Σφάλμα: ${errorMessage}`);
  }
};
  // Χειρισμός προσθήκης αθλητή σε αγώνα - με φιλτράρισμα για αθλητές που ήδη υπάρχουν
const handleAddAthleteToCompetition = (competitionId) => {
  console.log("Adding athlete to competition:", competitionId);
  
  // Early check for undefined competitionId
  if (!competitionId) {
    console.error("Competition ID is undefined");
    setAthletesBySport([]);
    setSelectedAthletes([]);
    setOpenAthleteSelectionDialog(true);
    return;
  }
  
  // Set competition ID first
  setSelectedCompetitionId(competitionId);
  
  const competition = sportsData.flatMap(s => s.agones).find(a => 
    (a.id && a.id.toString() === competitionId.toString()) || 
    (a.id_agona && a.id_agona.toString() === competitionId.toString())
  );
  
  if (!competition) {
    console.error("Competition not found for ID:", competitionId);
    // Still open dialog with empty list
    setAthletesBySport([]);
    setSelectedAthletes([]);
    setOpenAthleteSelectionDialog(true);
    return;
  }
  
  // Rest of your existing function...
  const existingAthleteIds = competition.summetexontes?.map(athlete => 
    athlete.id || athlete.id_athliti
  ) || [];
  
  
  // Use a try/catch block to handle any errors
  try {
    const sportId = competition.id_athlimatos || competition.sportId;
    
    // Φόρτωση αθλητών για αυτό το άθλημα
    fetchAthletesBySport(sportId).then((allAthletes) => {
      if (!allAthletes || allAthletes.length === 0) {
        console.log("No athletes found for sport ID:", sportId);
        setAthletesBySport([]);
        setSelectedAthletes([]);
        setOpenAthleteSelectionDialog(true);
        return;
      }
      
      // Φιλτράρισμα μόνο των αθλητών που δεν συμμετέχουν ήδη
      const filteredAthletes = allAthletes.filter(athlete => {
        const athleteId = athlete.id || athlete.id_athliti;
        return !existingAthleteIds.some(id => id === athleteId);
      });
      
      // Διαμόρφωση αθλητών για εμφάνιση
      const formattedAthletes = filteredAthletes.map(athlete => ({
        ...athlete,
        id: athlete.id || athlete.id_athliti,
        name: `${athlete.lastName || ""} ${athlete.firstName || ""}`.trim(),
        fullName: `${athlete.lastName || ""} ${athlete.firstName || ""}`.trim(),
        athleteNumber: athlete.athleteNumber || athlete.arithmosdeltiou || "-"
      }));
      
      // Ενημέρωση του state με τους φιλτραρισμένους αθλητές
      setAthletesBySport(formattedAthletes);
      
      // Άνοιγμα του dialog με κενή επιλογή
      setSelectedAthletes([]);
      console.log("Opening athlete selection dialog");
      setOpenAthleteSelectionDialog(true);
    }).catch(error => {
      console.error("Error fetching athletes:", error);
      // Still open dialog with empty list
      setAthletesBySport([]);
      setSelectedAthletes([]);
      setOpenAthleteSelectionDialog(true);
    });
  } catch (error) {
    console.error("Error in handleAddAthleteToCompetition:", error);
    // Still open dialog with empty list
    setAthletesBySport([]);
    setSelectedAthletes([]);
    setOpenAthleteSelectionDialog(true);
  }
};

  // Προσθέστε αυτή τη συνάρτηση μετά τον ορισμό του state expandedCompetitions και πριν το sportDetailPanelConfig
  const toggleCompetition = (competitionId) => {
    setExpandedCompetitions(prev => ({
      ...prev,
      [competitionId]: !prev[competitionId]
    }));
  };

const handleDeleteAthleteFromCompetition = async (competitionId, athleteId) => {
  try {
    if (!competitionId || !athleteId) {
      console.error("Λείπει το ID αγώνα ή αθλητή");
      alert("Λείπουν απαραίτητα δεδομένα για τη διαγραφή");
      return false;
    }

    // Make sure we're using the correct ID properties
    let compId = competitionId;
    let athId = athleteId;

    // If they are objects, extract the correct IDs
    if (typeof competitionId === 'object') {
      compId = competitionId.id_agona || competitionId.id;
    }
    if (typeof athleteId === 'object') {
      athId = athleteId.id_athliti || athleteId.id;
    }

    // Convert to numbers
    compId = parseInt(compId);
    athId = parseInt(athId);

    if (isNaN(compId) || isNaN(athId)) {
      console.error("Μη έγκυρα IDs για διαγραφή αθλητή από αγώνα:", { compId, athId });
      alert("Μη έγκυρα δεδομένα για τη διαγραφή");
      return false;
    }

    console.log(`Διαγραφή αθλητή ${athId} από αγώνα ${compId}`);
    const deleteRoute = `/athlites/agona/${compId}/athlete/${athId}`;
    
    // Try to delete the athlete from the competition
    const response = await api.delete(deleteRoute);

    // Manually update the sportsData state to remove the athlete from the competition
    setSportsData(prevSportsData => 
      prevSportsData.map(sport => ({
        ...sport,
        agones: sport.agones.map(agonas => {
          if (agonas.id_agona === compId || agonas.id === compId) {
            return {
              ...agonas,
              summetexontes: (agonas.summetexontes || []).filter(
                a => (a.id !== athId && a.id_athliti !== athId)
              ),
              summetexontesCount: (agonas.summetexontes?.length || 0) - 1
            };
          }
          return agonas;
        })
      }))
    );
    
    // Refresh data to ensure consistency
    await refreshData();
    
    return true;
  } catch (error) {
    console.error("Σφάλμα διαγραφής:", error);
    alert(`Σφάλμα κατά τη διαγραφή: ${error.response?.data?.error || error.message}`);
    return false;
  }
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
          
          // First check if we have the year data
          if (!yearData || !yearData.year) {
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
            } 
            else if (rowData && rowData.original) {
              // Secondary method
              currentSport = rowData.original;
              sportId = currentSport.id || currentSport.id_athlimatos;
            } 
            else if (rowData && rowData.row && rowData.row.original) {
              // Another possible structure
              currentSport = rowData.row.original;
              sportId = currentSport.id || currentSport.id_athlimatos;
            } 
            else if (rowData && (rowData.id || rowData.id_athlimatos)) {
              // Directly from rowData
              currentSport = rowData;
              sportId = currentSport.id || currentSport.id_athlimatos;
            }
            
            // If we still don't have currentSport, search the sportsData array
            // using BOTH the year AND the sport context
            if (!currentSport && sportsData) {
              
              // First try to get sportId from the expanded row context
              if (rowData.id || rowData.id_athlimatos) {
                sportId = rowData.id || rowData.id_athlimatos;
              }
              
              // If we have a sportId, find that exact sport
              if (sportId) {
                currentSport = sportsData.find(sport => 
                  sport.id === sportId || sport.id_athlimatos === sportId
                );
              }
              
              // Last resort: Find any sport with this year's data
              if (!currentSport && yearData) {
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
                                ? ` ${new Date(competition.hmerominia).toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'})}` 
                                : " Χωρίς ημερομηνία"} | 
                              {` ${competition.summetexontes?.length || 0} αθλητές`}
                            </Typography>
                          </Box>
                        </Box>

<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
  <Button 
    variant="contained" 
    color="primary"
    startIcon={<Add />}
    onClick={() => setOpenAddAthleteDialog(true)}
  >
    Προσθηκη Νεου Αθλητη
  </Button>
  
  <Button 
      variant="contained" 
      color="primary"
      startIcon={<TransformIcon />}
    onClick={() => setOpenConvertMemberDialog(true)}
  >
    Μετατροπή Μέλους σε Αθλητή
  </Button>
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
                                    <TableCell>Ονοματεπώνυμο</TableCell> {/* Διόρθωση του ορθογραφικού */}
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
onClick={(e) => {
  e.stopPropagation(); // Prevent event bubbling
  const competitionId = competition.id_agona || competition.id;
  const athleteId = athlete.id_athliti || athlete.id;
  
  setConfirmDialogMessage("Είστε βέβαιοι ότι θέλετε να αφαιρέσετε τον αθλητή από αυτόν τον αγώνα;");
  setConfirmDialogCallback(() => () => handleDeleteAthleteFromCompetition(competitionId, athleteId));
  setConfirmDialogOpen(true);
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
    
    // Format athleteIds properly - ensure it's an array of valid integers
    const validAthleteIds = selectedAthletes
      .map(id => typeof id === 'number' ? id : parseInt(id))
      .filter(id => !isNaN(id));
    
    // Προετοιμασία δεδομένων για API
    const requestData = {
      id_athlimatos: sportId,
      onoma: newCompetition.onoma,
      perigrafi: newCompetition.perigrafi || "",
      hmerominia: newCompetition.hmerominia ? new Date(newCompetition.hmerominia).toISOString() : null,
      athleteIds: validAthleteIds
    };
    
    if (editCompetitionData) {
      // Ενημέρωση υπάρχοντος αγώνα
      const competitionId = editCompetitionData.id_agona || editCompetitionData.id;
      await api.put(`/athlites/agona/${competitionId}`, requestData);
      
      // Only add athletes if there are valid IDs to add
      if (validAthleteIds.length > 0) {
        // Ενημέρωση αθλητών στον αγώνα
        await api.post(`/athlites/agona/${competitionId}/athletes`, {
          athleteIds: validAthleteIds
        });
      }
    } else {
      // Προσθήκη νέου αγώνα
      await api.post("/athlites/agona", requestData);
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
    // Include more detailed error information
    const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message;
    alert(`Σφάλμα: ${errorMessage}`);
  }
};

  // Νέα συνάρτηση ανανέωσης δεδομένων - προσθέστε την στο component
  const refreshData = async () => {
    try {
      
      // Store current data before fetching new data
      const currentAthletes = [...athletesData];
      
      const [athletesRes, sportsRes] = await Promise.all([
        api.get("/athlites/athletes"),
        api.get("/athlites/sports"),
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
        // Υπολογισμός συνολικών συμμετοχών αθλητων στο άθλημα
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


    await api.post(`/athlites/agona/${selectedCompetitionId}/athletes`, {
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

  // Απλοποιημένη έκδοση του handleDeleteAthlete
  const handleDeleteAthlete = async (athleteId) => {
    try {
      // Καθαρισμός του ID
      const id = parseInt(athleteId);
      if (isNaN(id)) {
        throw new Error(`Μη έγκυρο ID αθλητή: ${athleteId}`);
      }
      
      
      // API κλήση
      await api.delete(`/athlites/athlete/${id}`);
      
      // Άμεση ενημέρωση του τοπικού state
      setAthletesData(prevData => prevData.filter(athlete => athlete.id !== id));
      
      // Ανανέωση όλων των δεδομένων
      await refreshData();
      
      return true;
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή αθλητή:", error);
      alert(`Σφάλμα κατά τη διαγραφή αθλητή: ${error.message}`);
      return false;
    }
  };

// Πρόσθεσε αυτή τη συνάρτηση ακριβώς πριν το handleDeleteAthlete
const handleDeleteCompetition = async (competitionId) => {
  try {
    
    // Χειρισμός διαφορετικών τύπων παραμέτρων
    let id;
    
    // Αν είναι αντικείμενο, προσπαθούμε να εξάγουμε το ID
    if (typeof competitionId === 'object' && competitionId !== null) {
      id = competitionId.id_agona || competitionId.id;
    } else {
      // Αν είναι primitive (string ή number)
      id = competitionId;
    }
    
    // Μετατροπή σε αριθμό
    id = parseInt(id, 10);
    
    if (isNaN(id)) {
      throw new Error(`Μη έγκυρο ID αγώνα: ${competitionId}`);
    }
    
    
    // Κλήση του API για διαγραφή
    await api.delete(`/athlites/agona/${id}`);
    
    // Τοπική ενημέρωση του state - αφαίρεση του αγώνα από όλα τα αθλήματα
    setSportsData(prevSportsData => {
      return prevSportsData.map(sport => {
        if (sport.agones && Array.isArray(sport.agones)) {
          return {
            ...sport,
            agones: sport.agones.filter(agona => 
              agona.id !== id && agona.id_agona !== id
            )
          };
        }
        return sport;
      });
    });
    
    // Επανυπολογισμός των φιλτραρισμένων αγώνων
    filterCompetitions();
    
    return true;
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή αγώνα:", error);
    alert(`Σφάλμα κατά τη διαγραφή αγώνα: ${error.message}`);
    return false;
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

  // Χειρισμός προσθήκης αθλητή - διορθωμένη έκδοση
  const handleAddAthlete = async (newAthlete) => {
    try {
      // Check if we're using an existing member or creating a new one
      const isExistingMember = Boolean(newAthlete.existingMemberId);
      
      const requestData = {
        // If using existing member, only send the ID
        existingMemberId: isExistingMember ? parseInt(newAthlete.existingMemberId) : undefined,
        
        // Only include these fields if creating a new member
        ...(!isExistingMember && {
          epafes: {
            onoma: newAthlete.firstName || "",
            epitheto: newAthlete.lastName || "",
            email: newAthlete.email || "",
            tilefono: newAthlete.phone || "",
          },
          vathmos_diskolias: {
            id_vathmou_diskolias: parseInt(newAthlete.vathmos_diskolias) || 1
          },
          esoteriko_melos: {
            patronimo: newAthlete.patronimo || "",
            odos: newAthlete.odos || "",
            tk: newAthlete.tk ? parseInt(newAthlete.tk) : null,
            arithmos_mitroou: newAthlete.arithmos_mitroou ? parseInt(newAthlete.arithmos_mitroou) : null,
          }
        }),
        
        // These athlete-specific fields are always included
        athlitis: {
          arithmos_deltiou: newAthlete.arithmosdeltiou ? parseInt(newAthlete.arithmosdeltiou) : null,
          hmerominia_enarksis_deltiou: newAthlete.hmerominiaenarksis || null,
          hmerominia_liksis_deltiou: newAthlete.hmerominialiksis || null,
        },
        
        // Sports are always included
        athlimata: newAthlete.athlimata && Array.isArray(newAthlete.athlimata) 
          ? newAthlete.athlimata.map(id => parseInt(id)).filter(id => !isNaN(id))
          : [],
      };

      console.log("Αποστολή δεδομένων:", requestData);
      const response = await api.post("/athlites/athlete", requestData);
      
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
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message;
      alert(`Σφάλμα κατά την προσθήκη του αθλητή: ${errorMessage}`);
    }
  };

  // Βοηθητική συνάρτηση μετατροπής ημερομηνίας από dd/mm/yyyy σε ISO format
const convertDateFormat = (dateString) => {
  if (!dateString) return null;
  
  // Εάν είναι ήδη σε μορφή ISO, επιστρέφουμε ως έχει
  if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
    return new Date(dateString);
  }
  
  // Αλλιώς υποθέτουμε ότι είναι σε μορφή dd/mm/yyyy
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Οι μήνες στο JavaScript είναι 0-11
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  // Fallback αν δεν είναι σε καμία αναμενόμενη μορφή
  return new Date(dateString);
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
      accessorKey: "lastName", 
      header: "Επώνυμο", 
      validation: yup.string()
        .when('existingMemberId', {
          is: id => !id,
          then: schema => schema.required("Το επώνυμο είναι υποχρεωτικό")
        })
        .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο επώνυμο', 
          value => !value || !/[0-9]/.test(value))
    },
    { 
      accessorKey: "firstName", 
      header: "Όνομα", 
      validation: yup.string()
        .when('existingMemberId', {
          is: id => !id,
          then: schema => schema.required("Το όνομα είναι υποχρεωτικό")
        })
        .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο όνομα', 
          value => !value || !/[0-9]/.test(value))
    },
    { 
      accessorKey: "patronimo", 
      header: "Πατρώνυμο",
      validation: yup.string()
        .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο πατρώνυμο', 
          value => !value || !/[0-9]/.test(value))
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
      accessorKey: "phone", 
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
      accessorKey: "odos", 
      header: "Διεύθυνση" 
    },
    { 
      accessorKey: "tk", 
      header: "ΤΚ", 
      validation: yup
        .number()
        .nullable()
        .transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null) return null;
          return value;
        })
        .typeError("Πρέπει να είναι αριθμός")
    },
    { 
      accessorKey: "arithmos_mitroou", 
      header: "Αριθμός Μητρώου", 
      validation: yup
        .number()
        .nullable()
        .transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null) return null;
          return value;
        })
        .typeError("Πρέπει να είναι αριθμός")
    },
    { 
      accessorKey: "vathmos_diskolias", 
      header: "Βαθμός Δυσκολίας", 
      type: "select",
      options: difficultyLevels.map(level => ({ 
        value: level.id_vathmou_diskolias, 
        label: `Βαθμός ${level.epipedo}` 
      })),
      defaultValue: difficultyLevels[0]?.id_vathmou_diskolias || 1,
      validation: yup.number().min(1, "Ο βαθμός πρέπει να είναι τουλάχιστον 1") 
    },
    { 
      accessorKey: "arithmosdeltiou", 
      header: "Αριθμός Δελτίου", 
      validation: yup
        .number()
        .nullable()
        .transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null) return null;
          return value;
        })
        .typeError("Πρέπει να είναι αριθμός")
    },
  // In the athleteFormFields useMemo
// In the athleteFormFields useMemo
{ 
  accessorKey: "hmerominiaenarksis", 
  header: "Ημ/νία Έναρξης Δελτίου", 
  type: "date",
  // Προσθήκη μέγιστης ημερομηνίας (δεν επιτρέπει επιλογή μετά την ημερομηνία λήξης)
  maxDateField: "hmerominialiksis",
  validation: yup.date().nullable(),
  dateFormat: "dd/MM/yyyy",
},
{ 
  accessorKey: "hmerominialiksis", 
  header: "Ημ/νία Λήξης Δελτίου", 
  type: "date", 
  // Προσθήκη ελάχιστης ημερομηνίας (δεν επιτρέπει επιλογή πριν την ημερομηνία έναρξης)
  minDateField: "hmerominiaenarksis",
  validation: yup.date().nullable()
    .test('end-after-start', 'Η ημερομηνία λήξης πρέπει να είναι μετά ή ίδια με την ημερομηνία έναρξης', function(value) {
      const startDate = this.parent.hmerominiaenarksis;
      // If either date is missing, validation passes
      if (!value || !startDate) return true;
      
      // Parse dates to ensure proper comparison
      const endDate = new Date(value);
      const startDateObj = new Date(startDate);
      
      // Check if dates are valid
      if (isNaN(endDate.getTime()) || isNaN(startDateObj.getTime())) return true;
      
      // End date should be same day or after start date
      return endDate >= startDateObj;
    }),
  dateFormat: "dd/MM/yyyy",
},
    { 
      accessorKey: "athlimata", 
      header: "Αθλήματα", 
      type: "custom",
      validation: yup.array().min(1, "Τουλάχιστον ένα άθλημα είναι υποχρεωτικό"), 
      renderInput: ({ field, fieldState }) => (
        <CheckboxSportsSelector
          options={sportsListData.map(sport => ({ 
            value: sport.id_athlimatos, 
            label: sport.onoma 
          }))}
          value={field.value || []}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )
    },
  ], [difficultyLevels, sportsListData]);

  // Πεδία φόρμας για προσθήκη/επεξεργασία αγώνα
  const competitionFormFields = useMemo(() => [
    { 
      accessorKey: "sportId", 
      header: "Άθλημα", 
      type: "select",
      options: sportsListData.map(sport => ({ 
 
        value: sport.id_athlimatos, 
        label: sport.onoma 
      })),
      validation: yup.string(), // Αφαίρεση του .required() αν θέλετε
      disabled: editCompetitionData !== null,
      onChangeCallback: (value) => {
        if (value) {
          fetchAthletesBySport(value);
        }
      }
    },
    { 
      accessorKey: "onoma", 
      header: "Όνομα Αγώνα", 
      validation: yup.string() // Αφαίρεση του .required()
    },
    { 
      accessorKey: "perigrafi", 
      header: "Περιγραφή"
    },
    { 
      accessorKey: "hmerominia", 
      header: "Ημερομηνία", 
      type: "date",
      dateFormat: "dd/MM/yyyy",
      validation: yup.date().nullable() // Αφαίρεση του .required()
    },
    {
      accessorKey: "athleteIds",
      header: "Συμμετέχοντες Αθλητές",
      type: "tableSelect",
      dataKey: "athletesBySport",
      validation: yup.array(), // Ήδη χωρίς .required()
      columns: [
        {
          field: "fullName",
          header: "Οματεπώνυμο",
          valueGetter: (item) => `${item.firstName || ''} ${item.lastName || ''}`.trim()
        },
        {
          field: "arithmosdeltiou",
          header: "Αριθμός Δελτίου"
        }
      ]
    }
  ], [sportsListData, editCompetitionData]);

  // Modified competitionFormFields without athleteIds field
const competitionFormFieldsWithoutAthletes = useMemo(() => [
  { 
    accessorKey: "sportId", 
    header: "Άθλημα", 
    type: "select",
    options: sportsListData.map(sport => ({ 
      value: sport.id_athlimatos, 
      label: sport.onoma 
    })),
    validation: yup.string(), // Αφαίρεση του .required() αν θέλετε
    disabled: editCompetitionData !== null,
    onChangeCallback: (value) => {
      if (value) {
        fetchAthletesBySport(value);
      }
    }
  },
  { 
    accessorKey: "onoma", 
    header: "Όνομα Αγώνα", 
    validation: yup.string() // Αφαίρεση του .required()
  },
  { 
    accessorKey: "perigrafi", 
    header: "Περιγραφή"
  },
  { 
    accessorKey: "hmerominia", 
    header: "Ημερομηνία", 
    type: "date",
    dateFormat: "dd/MM/yyyy",
    validation: yup.date().nullable() // Αφαίρεση του .required()
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
        firstName: athlete.firstName || athlete.name?.split(' ')[0] || "",
        lastName: athlete.lastName || athlete.name?.split(' ').slice(1).join(' ') || ""
      };
      
      // Προσθήκη πεδίου fullName με επώνυμο πρώτα
      formattedAthlete.fullName = 
        `${formattedAthlete.lastName} ${formattedAthlete.firstName}`.trim();
      
      // Ενημέρωση και του πεδίου name για συνέπεια
      formattedAthlete.name = formattedAthlete.fullName;
      
      return formattedAthlete;
    });
  }, [athletesBySport]);

const competitionResourceData = useMemo(() => ({
  athletesBySport: formatAthletesForSelection,
  availableMembers: availableMembers // Add this line
}), [formatAthletesForSelection, availableMembers]);

  // Add this helper function to your component
  const updateFieldVisibility = (fieldName, formikValues) => {
    if (fieldName === "existingMemberId") return true;
    return !formikValues.existingMemberId;
  };

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

    
    // Ορίζουμε τις τιμές για επεξεργασία και ανοίγουμε το dialog
    setEditAthleteValues(editValues);
    setOpenEditAthleteDialog(true);
  };

  // Προσθήκη συνάρτησης για την αποθήκευση των αλλαγών μετά την επεξεργασία
  const handleEditAthleteSave = async (updatedAthlete) => {
    try {
      
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
            updatedAthlete.athlimata.map(id => parseInt(id)) : 
            [parseInt(updatedAthlete.athlimata)]
          ) : [],
      };

      // Κλήση του API για ενημέρωση
      await api.put(`/athlites/athlete/${athleteId}`, requestData);
      
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
        return value ? new Date(value).toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "-";
      }
    },
    { 
      accessorKey: "summetexontesCount", 
      header: "Συμμετέχοντες",
      Cell: ({ cell }) => cell.getValue() || 0
    }
  ], []);

const handleAthleteCompetitionTableDelete = (athlete, competition) => {
  
  // The competition parameter comes from the parent row context
  const competitionId = competition?.id_agona || competition?.id;
  
  // The athlete parameter is the actual row being deleted
  const athleteId = athlete?.id_athliti || athlete?.id;
  
  
  // Open confirmation dialog instead of directly deleting
  setAthleteToDelete({ athleteId, competitionId });
  setOpenDeleteAthleteDialog(true);
};

  // Διαμόρφωση του detail panel για τους αγώνες - διορθώνουμε το ορθογραφικό
 // Update your competitionDetailPanelConfig to include onAddNew handler for the athletes table
 // Update your competitionDetailPanelConfig
const competitionDetailPanelConfig = useMemo(() => ({
  mainDetails: [
    { accessor: "onoma", header: "Όνομα Αγώνα" },
    { accessor: "sportName", header: "Άθλημα" },
    { accessor: "hmerominia", header: "Ημερομηνία", format: (value) => (value ? new Date(value).toLocaleDateString("el-GR", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "-") },
    { accessor: "perigrafi", header: "Περιγραφή" }
  ],
  tables: [
    {
      title: "Συμμετοχές Αθλητών",
      accessor: "summetexontes",
      columns: [
        { accessor: "fullName", header: "Ονοματεπώνυμο" },
        { accessor: "arithmosdeltiou", header: "Αριθμός Δελτίου" }
      ],
      // Fix the bug in the onAddNew handler
 // Fix the bug in the onAddNew handler
onAddNew: (rowData) => {
  console.log("onAddNew called with data:", rowData);
  
  // Handle case where rowData is directly the competition ID (number)
  let competitionId = rowData;
  
  // If rowData is an object, try to extract ID from its properties
  if (typeof rowData === 'object' && rowData !== null) {
    if (rowData.tableData && rowData.tableData.parentId) {
      competitionId = rowData.tableData.parentId;
    }
    else if (rowData.id_agona || rowData.id) {
      competitionId = rowData.id_agona || rowData.id;
    }
  }
  
  if (!competitionId) {
    console.error("Could not extract competition ID from:", rowData);
    return;
  }
  
  console.log("Extracted competition ID:", competitionId);
  handleAddAthleteToCompetition(competitionId);
},
onDelete: (athlete, competition) => {
  // If competition is directly an ID
  let competitionId = (typeof competition === 'object' && competition !== null) 
    ? (competition.id_agona || competition.id) 
    : competition;
    
  // If athlete is directly an ID
  let athleteId = (typeof athlete === 'object' && athlete !== null)
    ? (athlete.id_athliti || athlete.id)
    : athlete;
  
  if (!athleteId || !competitionId) {
    console.error("Missing ID for athlete or competition:", { athlete, competition });
    return;
  }
  
  setConfirmDialogMessage("Είστε βέβαιοι ότι θέλετε να αφαιρέσετε τον αθλητή από αυτόν τον αγώνα;");
  setConfirmDialogCallback(() => () => handleDeleteAthleteFromCompetition(competitionId, athleteId));
  setConfirmDialogOpen(true);
}
    }
  ],
  showEditButton: true
}), [handleAddAthleteToCompetition]); // Keep the dependency array

  // Διορθωμένη συνάρτηση filterCompetitions
  const filterCompetitions = () => {
    if (!sportsData || sportsData.length === 0) {
      setFilteredCompetitions([]);
      return;
    }
    
    // Συλλογή όλων των αγώνων από όλα τα αθλήματα
    let allCompetitions = [];
    
       
    sportsData.forEach(sport => {
      // Προσθήκη των αγώνων του κάθε αθλήματος με πρόσθετη πληροφορία αθλήματος
      if (sport && sport.agones) {
        const sportCompetitions = sport.agones.map(agonas => ({
          ...agonas,
          sportName: sport.athlima,
          sportId: sport.id_athlimatos
        }));
        
        allCompetitions = [...allCompetitions, ...sportCompetitions];
      }
    });
    
    // Εφαρμογή φίλτρων - Βεβαιωνόμαστε ότι η 'filtered' είναι σωστά ορισμένη
  let filtered = [...allCompetitions];

  // Φιλτράρισμα με βάση το επιλεγμένο άθλημα
  if (selectedSportFilter !== 'all') {
    filtered = filtered.filter(comp => comp.sportId === selectedSportFilter);
  }
 
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

// Add this useEffect after your main data loading useEffect
 const fetchAvailableMembers = async () => {
  try {
    const response = await api.get("/melitousillogou/internal");
    
    if (response.data && Array.isArray(response.data)) {
      const formattedMembers = response.data
        .filter(member => 
          member.sindromitis && // Must be a subscriber
          !member.athlitis     // Must not be an athlete
        )
        .map(member => ({
          id: member.id_es_melous,
          fullName: `${member.melos?.epafes?.epitheto || ""} ${member.melos?.epafes?.onoma || ""}`.trim() || 
                    (member.fullName ? member.fullName : "Χωρίς όνομα"),
          email: member.melos?.epafes?.email || member.email || "",
          tilefono: member.melos?.epafes?.tilefono?.toString() || member.tilefono || ""
        }));
      
      setAvailableMembers(formattedMembers);
    } else {
      console.error("Unexpected response format:", response.data);
      setAvailableMembers([]);
    }
  } catch (error) {
    console.error("Σφάλμα φόρτωσης διαθέσιμων μελών:", error);
    setAvailableMembers([]);
  }
};
  
// Update the fetchAvailableMembers function in the useEffect
useEffect(() => {

  fetchAvailableMembers();
}, []);

  return (
  <LocalizationProvider 
    dateAdapter={AdapterDateFns} 
    adapterLocale={el}
    dateFormats={{ keyboardDate: 'dd/MM/yyyy' }}
  >
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Αθλητές ({athletesData.length})
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Add />}
            onClick={() => setOpenAddAthleteDialog(true)}
          >
            Προσθήκη Νέου Αθλητή
          </Button>
          
<Button 
  variant="contained" 
  color="primary"
  startIcon={<TransformIcon />}
  onClick={() => {
    fetchAvailableMembers(); 
    setOpenConvertMemberDialog(true);
  }}
>
  Μετατροπη συνδρομητη σε αθλητη
</Button>

        </Box>

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
              arithmosdeltiou: false,
              hmerominiaenarksis: false,
              athlima: false,
              totalParticipation: false
            },
            columnOrder: [
              "lastName",   // Last name first
              "firstName",  // First name second
              "phone",
              "email",
              "arithmosdeltiou",
              "athlima",
              "totalParticipation",
              "mrt-actions",
            ],
            sorting: [
              { id: "lastName", desc: false } // Sort by last name alphabetically
            ]
          }}
          state={{ isLoading: loading }}
          onAddNew={null} // Set to null to disable the default add button
          handleEditClick={handleEditAthlete}
          handleDelete={handleDeleteAthlete}
          enableExpand={true}
          hideAddButton={true} // Hide the default add button as we have our custom buttons now
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
          handleDelete={handleDeleteCompetition}
          onAddNew={handleAddSportCompetitionClick}
          enableAddNew={true}
          enableTopAddButton={true}
        />
      </Box>


<AddDialog
  open={openConvertMemberDialog}
  onClose={() => {
    setOpenConvertMemberDialog(false);
    fetchAvailableMembers(); // Refresh data when dialog closes
  }}
  handleAddSave={handleConvertMember}
  fields={convertMemberFormFields}
  title="Μετατροπή Μέλους σε Αθλητή"
  resourceData={{availableMembers}}
/>

<AddDialog
  open={openAddAthleteDialog}
  onClose={() => setOpenAddAthleteDialog(false)}
  handleAddSave={handleAddAthlete}
  fields={athleteFormFields}
  title="Προσθήκη Νέου Αθλητή"
  resourceData={{availableMembers}}
  fieldVisibility={updateFieldVisibility}
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
          // Όταν αλλάζει το άθλημα, φόρτωσε τους αντίστοιχους αθλητές
          if (values.sportId && values.sportId !== dialogSelectedSport) {
            setDialogSelectedSport(values.sportId);
            
            // Immediately fetch athletes for this sport
            fetchAthletesBySport(values.sportId).then(athletes => {
              // Φιλτράρισμα για νέο αγώνα ώστε να μην εμφανίζονται ήδη επιλεγμένοι αθλητές
              let athletesToShow = athletes;
              
              if (editCompetitionData) {
                // Για επεξεργασία, κρατάμε τους ήδη επιλεγμένους και για προσθήκη νέων
                const existingIds = selectedAthletes || [];
              } else {
                // Για νέο αγώνα, δεν χρειαζόμαστε φιλτράρισμα
              }
              
              // Ensure athlete data is properly formatted for display
              const formattedAthletes = athletesToShow.map(athlete => ({
                ...athlete,
                id: athlete.id || athlete.id_athliti,
                name: `${athlete.lastName || ""} ${athlete.firstName || ""}`.trim(),
                fullName: `${athlete.lastName || ""} ${athlete.firstName || ""}`.trim(),
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

      {/* Προσθέστε το EditDialog για αθλητές */}
      <EditDialog
        open={openEditAthleteDialog}
        onClose={() => setOpenEditAthleteDialog(false)}
        handleEditSave={handleEditAthleteSave}
        editValues={editAthleteValues}
        fields={athleteFormFields} // Χρησιμοποιούμε τα ίδια πεδία με το AddDialog
        title="Επεξεργασία Αθλητή"
      />

      {/* Add this Dialog component at the end of your return statement */}
<Dialog
  open={confirmDialogOpen}
  onClose={() => setConfirmDialogOpen(false)}
>
  <DialogTitle>Επιβεβαίωση</DialogTitle>
  <DialogContent>
    <DialogContentText>
      {confirmDialogMessage}
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
      Ακύρωση
    </Button>
    <Button 
      onClick={() => {
        if (confirmDialogCallback) {
          confirmDialogCallback(confirmDialogItem);
        }
        setConfirmDialogOpen(false);
      }} 
      color="error" 
      autoFocus
    >
      Διαγραφή
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  </LocalizationProvider>
  );
}

