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
  { accessorKey: "athlima", header: "Άθλημα(τα)" },
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
  const [openAddSportCompetitionDialog, setOpenAddSportCompetitionDialog] = useState(false); // New dialog for adding competition from sports section
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

  // Φόρτωση αθλητών για συγκεκριμένο άθλημα
  const fetchAthletesBySport = async (sportId) => {
    if (!sportId) return;
    
    try {
      setCurrentSportId(sportId);
      const sport = sportsData.find(sport => sport.id === sportId) || 
                  sportsListData.find(sport => sport.id_athlimatos === sportId);
      
      if (sport) {
        setCurrentSportName(sport.athlima || sport.onoma || "");
      }
      
      const response = await axios.get(`http://localhost:5000/api/athlites/athletes-by-sport/${sportId}`);
      setAthletesBySport(response.data);
    } catch (error) {
      console.error("Σφάλμα φόρτωσης αθλητών ανά άθλημα:", error);
      setAthletesBySport([]);
    }
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
        onAddNew: (sportId) => handleAddCompetitionClick(sportId, sportId ? 
          sportsData.find(s => s.id === sportId)?.athlima : ""),
        columns: [
          { accessor: "onoma", header: "Όνομα Αγώνα" },
          { accessor: "perigrafi", header: "Περιγραφή" },
          { accessor: "hmerominia", header: "Ημερομηνία", format: (value) => (value ? new Date(value).toLocaleDateString("el-GR") : "-") },
          { accessor: "summetexontesCount", header: "Συμμετέχοντες" }
        ],
        onEdit: (competition) => handleEditCompetition(competition),
        onDelete: (competition) => handleConfirmDelete(competition.id, null, 'competition'),
        renderExpandedRow: (row) => (
          <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
              Συμμετέχοντες Αθλητές
            </Typography>
            {row.summetexontes && row.summetexontes.length > 0 ? (
              <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'white' }}>
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
                            onClick={() => handleConfirmDelete(row.id, athlete.id, 'athlete-from-competition')}
                          >
                            Αφαίρεση
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography>Δεν υπάρχουν συμμετέχοντες αθλητές</Typography>
            )}
          </Box>
        )
      }
    ]
  }), [sportsData]);

  // Χειρισμός προσθήκης αγώνα σε άθλημα
  const handleAddCompetitionClick = (sportId, sportName) => {
    setCurrentSportId(sportId);
    setCurrentSportName(sportName);
    setEditCompetitionData(null); // Καθάρισμα δεδομένων επεξεργασίας
    fetchAthletesBySport(sportId);
    setSelectedAthletes([]); // Καθάρισμα επιλεγμένων αθλητών
    setOpenAddCompetitionDialog(true);
  };
  
  // Χειρισμός επεξεργασίας αγώνα
  const handleEditCompetition = (competition) => {
    setEditCompetitionData({
      id: competition.id,
      onoma: competition.onoma,
      perigrafi: competition.perigrafi,
      hmerominia: competition.hmerominia ? new Date(competition.hmerominia).toISOString().split('T')[0] : ""
    });
    setCurrentSportId(competition.id_athlimatos);
    const sport = sportsData.find(s => s.id === competition.id_athlimatos);
    if (sport) {
      setCurrentSportName(sport.athlima);
    }
    fetchAthletesBySport(competition.id_athlimatos);
    setSelectedAthletes(competition.summetexontes?.map(athlete => athlete.id) || []);
    setOpenAddCompetitionDialog(true);
  };
  
  // Χειρισμός προσθήκης αγώνα
  const handleAddCompetition = async (newCompetition) => {
    try {
      // Αν έχουμε editCompetitionData, κάνουμε επεξεργασία αντί για προσθήκη
      if (editCompetitionData) {
        // Διαμόρφωση δεδομένων για ενημέρωση
        const updatedCompetition = {
          id_agona: editCompetitionData.id,
          id_athlimatos: parseInt(currentSportId),
          onoma: newCompetition.onoma,
          perigrafi: newCompetition.perigrafi,
          hmerominia: newCompetition.hmerominia ? new Date(newCompetition.hmerominia).toISOString() : null
        };
  
        // Ενημέρωση των αθλητών που συμμετέχουν
        await axios.post(`http://localhost:5000/api/athlites/agona/${editCompetitionData.id}/athletes`, {
          athleteIds: selectedAthletes
        });
  
        // Ανανέωση του UI
        const response = await axios.get("http://localhost:5000/api/athlites/sports");
        setSportsData(response.data.map(sport => ({
          ...sport,
          totalCompetitions: sport.agones.reduce((total, agonas) => total + (agonas.agonizetai?.length || 0), 0),
          agones: sport.agones.map(agonas => ({
            ...agonas,
            summetexontesCount: agonas.agonizetai?.length || 0,
            summetexontes: agonas.agonizetai?.map(agonizetai => ({
              id: agonizetai.athlitis.id_athliti,
              firstName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.onoma || "",
              lastName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "",
              arithmosdeltiou: agonizetai.athlitis.arithmos_deltiou || ""
            })) || []
          }))
        })));
      } else {
        // Προσθήκη νέου αγώνα
        const requestData = {
          id_athlimatos: parseInt(currentSportId),
          onoma: newCompetition.onoma,
          perigrafi: newCompetition.perigrafi || "",
          hmerominia: newCompetition.hmerominia ? new Date(newCompetition.hmerominia).toISOString() : null,
          agonizetai: selectedAthletes
        };
  
        const response = await axios.post("http://localhost:5000/api/athlites/agona", requestData);
        
        // Ενημέρωση του UI με τον νέο αγώνα
        setSportsData(prevData => 
          prevData.map(sport => {
            if (sport.id === currentSportId) {
              // Δημιουργία του νέου αγώνα για το UI
              const newAgona = {
                id: response.data.id_agona,
                onoma: response.data.onoma,
                perigrafi: response.data.perigrafi,
                hmerominia: response.data.hmerominia,
                id_athlimatos: sport.id,
                summetexontesCount: response.data.agonizetai?.length || 0,
                summetexontes: response.data.agonizetai?.map(agonizetai => ({
                  id: agonizetai.athlitis.id_athliti,
                  firstName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.onoma || "",
                  lastName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "",
                  arithmosdeltiou: agonizetai.athlitis.arithmos_deltiou || ""
                })) || []
              };
              
              return {
                ...sport,
                agones: [...sport.agones, newAgona],
                totalCompetitions: sport.totalCompetitions + (response.data.agonizetai?.length || 0)
              };
            }
            return sport;
          })
        );
      }
      
      setOpenAddCompetitionDialog(false);
      setSelectedAthletes([]);
      setEditCompetitionData(null);
    } catch (error) {
      console.error("Σφάλμα προσθήκης/επεξεργασίας αγώνα:", error);
      alert("Σφάλμα κατά την προσθήκη/επεξεργασία του αγώνα. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  // Χειρισμός προσθήκης αθλητή σε αγώνα
  const handleAddAthleteToCompetition = (competitionId) => {
    const competition = sportsData.flatMap(s => s.agones).find(a => a.id === competitionId);
    if (competition) {
      setSelectedCompetitionId(competitionId);
      fetchAthletesBySport(competition.id_athlimatos);
      setOpenAthleteSelectionDialog(true);
    }
  };
  
  // Χειρισμός επιλογής αθλητών για αγώνα
  const handleCompetitionAthleteSelection = async (selectedIds) => {
    try {
      if (!selectedCompetitionId) return;
      
      await axios.post(`http://localhost:5000/api/athlites/agona/${selectedCompetitionId}/athletes`, {
        athleteIds: selectedIds
      });
      
      // Επαναφόρτωση των δεδομένων
      const response = await axios.get("http://localhost:5000/api/athlites/sports");
      const formattedSports = response.data.map(sport => ({
        ...sport,
        totalCompetitions: sport.agones.reduce((total, agonas) => total + (agonas.agonizetai?.length || 0), 0),
        agones: sport.agones.map(agonas => ({
          ...agonas,
          summetexontesCount: agonas.agonizetai?.length || 0,
          summetexontes: agonas.agonizetai?.map(agonizetai => ({
            id: agonizetai.athlitis.id_athliti,
            firstName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.onoma || "",
            lastName: agonizetai.athlitis.esoteriko_melos?.melos?.epafes?.epitheto || "",
            arithmosdeltiou: agonizetai.athlitis.arithmos_deltiou || ""
          }))
        }))
      }));
      
      setSportsData(formattedSports);
      setOpenAthleteSelectionDialog(false);
      setSelectedCompetitionId(null);
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
      
      switch(deleteType) {
        case 'athlete':
          await axios.delete(`http://localhost:5000/api/athlites/athlete/${itemToDelete.id}`);
          setAthletesData(athletesData.filter(athlete => athlete.id !== itemToDelete.id));
          break;
          
        case 'competition':
          await axios.delete(`http://localhost:5000/api/athlites/agona/${itemToDelete.id}`);
          setSportsData(prevData => {
            return prevData.map(sport => ({
              ...sport,
              agones: sport.agones.filter(agonas => agonas.id !== itemToDelete.id),
              totalCompetitions: sport.agones
                .filter(agonas => agonas.id !== itemToDelete.id)
                .reduce((total, agonas) => total + (agonas.summetexontesCount || 0), 0)
            }));
          });
          break;
          
        case 'athlete-from-competition':
          if (itemToDelete.secondaryId) {
            await axios.delete(`http://localhost:5000/api/athlites/agona/${itemToDelete.id}/athlete/${itemToDelete.secondaryId}`);
            setSportsData(prevData => {
              return prevData.map(sport => ({
                ...sport,
                agones: sport.agones.map(agonas => {
                  if (agonas.id === itemToDelete.id) {
                    const updatedSummetexontes = agonas.summetexontes.filter(
                      athlete => athlete.id !== itemToDelete.secondaryId
                    );
                    return {
                      ...agonas,
                      summetexontes: updatedSummetexontes,
                      summetexontesCount: updatedSummetexontes.length
                    };
                  }
                  return agonas;
                }),
                totalCompetitions: sport.totalCompetitions - 1
              }));
            });
          }
          break;
      }
    } catch (error) {
      console.error("Σφάλμα κατά τη διαγραφή:", error);
      alert("Σφάλμα κατά τη διαγραφή. Παρακαλώ δοκιμάστε ξανά.");
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
    setOpenAddSportCompetitionDialog(true);
  };

  // Χειρισμός προσθήκης αγώνα από το dialog επιλογής αθλήματος
  const handleAddSportCompetition = async (newCompetition) => {
    try {
      // Βρίσκουμε το ID του αθλήματος από το όνομα
      const sportId = parseInt(newCompetition.sportId);
      
      if (!sportId) {
        alert("Παρακαλώ επιλέξτε άθλημα");
        return;
      }
      
      // Φόρτωση αθλητών για το επιλεγμένο άθλημα και προετοιμασία για το dialog προσθήκης αγώνα
      setCurrentSportId(sportId);
      const sport = sportsListData.find(s => s.id_athlimatos === sportId);
      if (sport) {
        setCurrentSportName(sport.onoma || "");
      }
      
      // Κλείσιμο του dialog επιλογής αθλήματος και άνοιγμα του dialog προσθήκης αγώνα
      setOpenAddSportCompetitionDialog(false);
      
      // Φόρτωση αθλητών για το επιλεγμένο άθλημα
      await fetchAthletesBySport(sportId);
      
      // Άνοιγμα του dialog προσθήκης αγώνα
      setOpenAddCompetitionDialog(true);
      
    } catch (error) {
      console.error("Σφάλμα προσθήκης αγώνα:", error);
      alert("Σφάλμα κατά την προσθήκη του αγώνα. Παρακαλώ δοκιμάστε ξανά.");
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
      accessorKey: "athletes",
      header: "Συμμετέχοντες Αθλητές",
      type: "custom",
      render: () => (
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => {
              if (!openAthleteSelectionDialog) {
                setOpenAthleteSelectionDialog(true);
              }
            }}
            fullWidth
            sx={{ mb: 1 }}
            startIcon={<Add />}
          >
            Επιλογή Αθλητών
          </Button>
          {selectedAthletes.length > 0 && (
            <Typography variant="body2" sx={{ color: 'success.main' }}>
              <strong>{selectedAthletes.length}</strong> αθλητές επιλεγμένοι
            </Typography>
          )}
        </Box>
      )
    }
  ], [openAthleteSelectionDialog, selectedAthletes.length]);

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
          initialValues={editCompetitionData}
          additionalInfo={currentSportName ? `Άθλημα: ${currentSportName}` : ""}
        />

        <SelectionDialog
          open={openAthleteSelectionDialog}
          onClose={() => {
            setOpenAthleteSelectionDialog(false);
            if (selectedCompetitionId) setSelectedCompetitionId(null);
          }}
          data={athletesBySport}
          selectedIds={selectedCompetitionId ? [] : selectedAthletes}
          onChange={selectedCompetitionId ? null : setSelectedAthletes}
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
        
        {/* Dialog επιλογής αθλήματος για προσθήκη νέου αγώνα */}
        <AddDialog
          open={openAddSportCompetitionDialog}
          onClose={() => setOpenAddSportCompetitionDialog(false)}
          handleAddSave={handleAddSportCompetition}
          fields={sportSelectionFormFields}
          title="Επιλογή Αθλήματος"
          additionalInfo="Επιλέξτε άθλημα για τον νέο αγώνα"
        />
      </Box>
    </LocalizationProvider>
  );
}