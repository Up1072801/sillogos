import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../utils/api';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import {
  Box, Container, Typography, Button, CircularProgress, Alert,
  Paper, Divider, Chip
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PlaceIcon from '@mui/icons-material/Place';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HikingIcon from '@mui/icons-material/Hiking';
import TerrainIcon from '@mui/icons-material/Terrain';
import * as yup from "yup";
import { Add, Edit, Delete } from '@mui/icons-material';

import Layout from "../components/Layout";
import DataTable from "../components/DataTable/DataTable";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";

const defaultEksormisiValues = {
  titlos: "",
  proorismos: "",
  timi: "",
  hmerominia_anaxorisis: new Date().toISOString().split('T')[0],
  hmerominia_afiksis: new Date().toISOString().split('T')[0]
};

export default function Eksormiseis() {
  const navigate = useNavigate();
  
  const [eksormiseisData, setEksormiseisData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEksormisi, setCurrentEksormisi] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const [editActivityDialogOpen, setEditActivityDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [currentEksormisiForActivity, setCurrentEksormisiForActivity] = useState(null);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [expeditionFilter, setExpeditionFilter] = useState('upcoming'); // 'all', 'past', 'upcoming'
  
  // Φόρτωση δεδομένων
  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);
  
  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/eksormiseis");
      
      // Προσθήκη ελέγχου για array πριν τη χρήση .map()
      const processedData = Array.isArray(response.data) 
        ? response.data.map(eksormisi => {
            const id = eksormisi.id_eksormisis || eksormisi.id;
            
            // Create a Set of unique member IDs to count unique participants
            const uniqueParticipantIds = new Set();
            (eksormisi.summetexei || []).forEach(s => {
              if (s.id_melous) uniqueParticipantIds.add(s.id_melous);
            });
            const uniqueParticipantsCount = uniqueParticipantIds.size;
            
            return {
              id,
              id_eksormisis: id,
              titlos: eksormisi.titlos || "Χωρίς Τίτλο",
              proorismos: eksormisi.proorismos || "Χωρίς Προορισμό",
              timi: Number(eksormisi.timi || 0),
              hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis ? new Date(eksormisi.hmerominia_anaxorisis) : null,
              hmerominia_afiksis: eksormisi.hmerominia_afiksis ? new Date(eksormisi.hmerominia_afiksis) : null,
              participantsCount: uniqueParticipantsCount,
              drastiriotites: Array.isArray(eksormisi.drastiriotites)
                ? eksormisi.drastiriotites.map(dr => ({
                    id: dr.id_drastiriotitas || dr.id,
                    id_drastiriotitas: dr.id_drastiriotitas || dr.id,
                    titlos: dr.titlos || "Χωρίς Τίτλο",
                    vathmos_diskolias: dr.vathmos_diskolias || {
                      epipedo: "Άγνωστο"
                    }
                  }))
                : []
            };
          }) 
        : []; // Επιστροφή κενού πίνακα αν response.data δεν είναι array
      
      setEksormiseisData(processedData);
      setLoading(false);
    } catch (error) {
      setError("Σφάλμα κατά τη φόρτωση δεδομένων. Παρακαλώ δοκιμάστε ξανά αργότερα.");
      setLoading(false);
      console.error("Error fetching data:", error);
    }
  };
  
  // Προσθήκη νέας εξόρμησης
  const handleAddEksormisi = async (newEksormisi) => {
    try {
      const formattedData = {
        titlos: newEksormisi.titlos,
        proorismos: newEksormisi.proorismos,
        timi: parseInt(newEksormisi.timi),
        hmerominia_anaxorisis: newEksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: newEksormisi.hmerominia_afiksis
      };
      
      // Send data to API
      const response = await api.post("/eksormiseis", formattedData);
      
      // Process the new expedition data
      const newEksormisiData = {
        id: response.data.id_eksormisis || response.data.id,
        id_eksormisis: response.data.id_eksormisis || response.data.id,
        titlos: String(response.data.titlos || "Χωρίς Τίτλο"),
        proorismos: String(response.data.proorismos || "Χωρίς Προορισμό"),
        timi: Number(response.data.timi || 0),
        hmerominia_anaxorisis: response.data.hmerominia_anaxorisis ? new Date(response.data.hmerominia_anaxorisis) : null,
        hmerominia_afiksis: response.data.hmerominia_afiksis ? new Date(response.data.hmerominia_afiksis) : null,
        participantsCount: 0, // New expedition has no participants yet
        drastiriotites: []
      };
      
      // Add to local data
      setEksormiseisData(prevData => [...prevData, newEksormisiData]);
      setAddDialogOpen(false);
    } catch (error) {
      alert("Σφάλμα κατά την προσθήκη εξόρμησης. Παρακαλώ δοκιμάστε ξανά.");
    }
  };
  
  // Επεξεργασία εξόρμησης
  const handleEditClick = (row) => {
    setCurrentEksormisi({
      id: row.id || row.id_eksormisis,
      titlos: row.titlos,
      proorismos: row.proorismos,
      timi: row.timi,
      hmerominia_anaxorisis: row.hmerominia_anaxorisis ? new Date(row.hmerominia_anaxorisis).toISOString().split('T')[0] : "",
      hmerominia_afiksis: row.hmerominia_afiksis ? new Date(row.hmerominia_afiksis).toISOString().split('T')[0] : ""
    });
    setEditDialogOpen(true);
  };
  
  // Διορθώθηκε το URL
  const handleEditSave = async (editedEksormisi) => {
    try {
      const formattedData = {
        titlos: editedEksormisi.titlos,
        proorismos: editedEksormisi.proorismos,
        timi: parseInt(editedEksormisi.timi),
        hmerominia_anaxorisis: editedEksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: editedEksormisi.hmerominia_afiksis
      };
      
      // Send update to API
      const response = await api.put(`/eksormiseis/${editedEksormisi.id}`, formattedData);
      
      // Update local data
      setEksormiseisData(prevData => 
        prevData.map(eksormisi => {
          if (eksormisi.id === editedEksormisi.id) {
            return {
              ...eksormisi,
              titlos: editedEksormisi.titlos,
              proorismos: editedEksormisi.proorismos,
              timi: parseInt(editedEksormisi.timi),
              hmerominia_anaxorisis: new Date(editedEksormisi.hmerominia_anaxorisis),
              hmerominia_afiksis: new Date(editedEksormisi.hmerominia_afiksis)
            };
          }
          return eksormisi;
        })
      );
      
      setEditDialogOpen(false);
      setCurrentEksormisi(null);
    } catch (error) {
      alert("Σφάλμα κατά την επεξεργασία εξόρμησης. Παρακαλώ δοκιμάστε ξανά.");
    }
  };
  
  // Διαγραφή εξόρμησης
  const handleDelete = async (row) => {
    let id;
    
    if (typeof row === 'number' || typeof row === 'string') {
      id = row;
    } 
    else if (row && typeof row === 'object') {
      id = row.id || row.id_eksormisis;
    }
  
    if (!row) {
      alert("Σφάλμα: Δεν παρασχέθηκαν δεδομένα για διαγραφή.");
      return;
    }
  
    if (!id && id !== 0) {
      alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID εξόρμησης για διαγραφή.");
      return;
    }
  
    try {
      await api.delete(`/eksormiseis/${id}`);
      
      // Update local state directly instead of triggering refresh
      setEksormiseisData(prevData => 
        prevData.filter(eksormisi => eksormisi.id !== id && eksormisi.id_eksormisis !== id)
      );
    } catch (error) {
      alert("Σφάλμα κατά τη διαγραφή εξόρμησης. Παρακαλώ δοκιμάστε ξανά.");
    }
  };
  
  // Πεδία φόρμας για εξόρμηση
  const eksormisiFields = React.useMemo(() => [
    { accessorKey: "titlos", header: "Τίτλος", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
    { accessorKey: "proorismos", header: "Προορισμός", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
    { accessorKey: "timi", header: "Τιμή", type: "number", validation: yup.number().min(0, "Η τιμή δεν μπορεί να είναι αρνητική") },
    { accessorKey: "hmerominia_anaxorisis", header: "Ημερομηνία Αναχώρησης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") },
    { accessorKey: "hmerominia_afiksis", header: "Ημερομηνία Άφιξης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") }
  ], []);
  
  // Στήλες πίνακα
  const columns = [
    { 
      accessorKey: "titlos", 
      header: "Τίτλος",
      Cell: ({ row }) => {
        return (
          <Box 
            sx={{ 
              cursor: "pointer", 
              color: "primary.main", 
              fontWeight: "medium",
              "&:hover": { textDecoration: "underline" } 
            }}
            onClick={(e) => {
              e.stopPropagation();
              const id = row.original.id || row.original.id_eksormisis;
              navigate(`/eksormisi/${id}`);
            }}
          >
            {row.original.titlos || "-"}
          </Box>
        );
      }
    },
    { 
      accessorKey: "proorismos", 
      header: "Προορισμός",
      Cell: ({ row }) => row.original.proorismos || "-"
    },
    { 
      accessorKey: "hmerominia_anaxorisis", 
      header: "Ημερομηνία Αναχώρησης",
      Cell: ({ row }) => {
        const value = row.original.hmerominia_anaxorisis;
        return value ? new Date(value).toLocaleDateString('el-GR') : "-";
      }
    },
    { 
      accessorKey: "hmerominia_afiksis", 
      header: "Ημερομηνία Άφιξης",
      Cell: ({ row }) => {
        const value = row.original.hmerominia_afiksis;
        return value ? new Date(value).toLocaleDateString('el-GR') : "-";
      }
    },
    { 
      accessorKey: "timi", 
      header: "Τιμή",
      Cell: ({ row }) => {
        const amount = Number(row.original.timi || 0);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {`${amount}€`}
          </Box>
        );
      }
    },
    { 
      accessorKey: "participantsCount", 
      header: "Συμμετέχοντες",
      Cell: ({ row }) => {
        const count = Number(row.original.participantsCount || 0);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">
              {count === 0 ? '0' : 
               count === 1 ? '1' : 
               `${count}`}
            </Typography>
          </Box>
        );
      }
    }
  ];
  
  // Άντληση των επιπέδων δυσκολίας
  useEffect(() => {
    const fetchDifficultyLevels = async () => {
      try {
        const response = await api.get("/vathmoi-diskolias");
        setDifficultyLevels(response.data);
      } catch (error) {
        // Αποτυχία φόρτωσης επιπέδων δυσκολίας
      }
    };
    
    fetchDifficultyLevels();
  }, []);

  // Πεδία φόρμας για δραστηριότητα
  const activityFields = [
    { accessorKey: "titlos", header: "Τίτλος", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
    { 
      accessorKey: "id_vathmou_diskolias", 
      header: "Βαθμός Δυσκολίας", 
      type: "select",
      options: difficultyLevels.map(level => ({
        value: level.id_vathmou_diskolias,
        label: `Βαθμός ${level.epipedo}`
      })),
      validation: yup.number().required("Το πεδίο είναι υποχρεωτικό")
    },
    { accessorKey: "ores_poreias", header: "Ώρες Πορείας", type: "number" },
    { accessorKey: "diafora_ipsous", header: "Διαφορά Ύψους", type: "number" },
    { accessorKey: "megisto_ipsometro", header: "Μέγιστο Υψόμετρο", type: "number" },
    { accessorKey: "hmerominia", header: "Ημερομηνία", type: "date" }
  ];

  // Handlers για τις λειτουργίες δραστηριοτήτων
  const handleAddActivity = (parentRow) => {
    if (!parentRow) {
      if (detailPanelConfig?.tables?.[0]?.meta?.parentRow) {
        parentRow = detailPanelConfig.tables[0].meta.parentRow;
      } else if (eksormiseisData.length > 0) {
        parentRow = eksormiseisData[0];
      }
    }
    
    if (!parentRow || (!parentRow.id && !parentRow.id_eksormisis)) {
      alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID εξόρμησης για προσθήκη δραστηριότητας");
      return;
    }
    
    setCurrentEksormisiForActivity(parentRow);
    setAddActivityDialogOpen(true);
  };

  const handleAddActivitySave = async (newActivity) => {
    try {
      if (!currentEksormisiForActivity) {
        alert("Σφάλμα: Δεν έχει επιλεγεί εξόρμηση για τη δραστηριότητα");
        return;
      }
      
      const eksormisiId = currentEksormisiForActivity.id || currentEksormisiForActivity.id_eksormisis;
      if (!eksormisiId) {
        alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID εξόρμησης");
        return;
      }
      
      const formattedData = {
        titlos: newActivity.titlos,
        id_vathmou_diskolias: parseInt(newActivity.id_vathmou_diskolias),
        ores_poreias: newActivity.ores_poreias ? parseInt(newActivity.ores_poreias) : null,
        diafora_ipsous: newActivity.diafora_ipsous ? parseInt(newActivity.diafora_ipsous) : null,
        megisto_ipsometro: newActivity.megisto_ipsometro ? parseInt(newActivity.megisto_ipsometro) : null,
        hmerominia: newActivity.hmerominia
      };
      
      await api.post(`/eksormiseis/${eksormisiId}/drastiriotita`, formattedData);
      
      // Ανανέωση δεδομένων
      setRefreshTrigger(prev => prev + 1);
      setAddActivityDialogOpen(false);
      setCurrentEksormisiForActivity(null);
    } catch (error) {
      alert("Σφάλμα: " + error.message);
    }
  };

  const handleEditActivity = (activity, eksormisi) => {
    setCurrentActivity({
      id: activity.id || activity.id_drastiriotitas,
      titlos: activity.titlos || "",
      id_vathmou_diskolias: activity.vathmos_diskolias?.id_vathmou_diskolias || "",
      ores_poreias: activity.ores_poreias || "",
      diafora_ipsous: activity.diafora_ipsous || "",
      megisto_ipsometro: activity.megisto_ipsometro || "",
      hmerominia: activity.hmerominia ? new Date(activity.hmerominia).toISOString().split('T')[0] : ""
    });
    setCurrentEksormisiForActivity(eksormisi);
    setEditActivityDialogOpen(true);
  };

  const handleEditActivitySave = async (updatedActivity) => {
    try {
      const formattedData = {
        titlos: updatedActivity.titlos,
        id_vathmou_diskolias: parseInt(updatedActivity.id_vathmou_diskolias),
        ores_poreias: updatedActivity.ores_poreias ? parseInt(updatedActivity.ores_poreias) : null,
        diafora_ipsous: updatedActivity.diafora_ipsous ? parseInt(updatedActivity.diafora_ipsous) : null,
        megisto_ipsometro: updatedActivity.megisto_ipsometro ? parseInt(updatedActivity.megisto_ipsometro) : null,
        hmerominia: updatedActivity.hmerominia
      };
      
      await api.put(`/eksormiseis/drastiriotita/${updatedActivity.id}`, formattedData);
      
      // Ανανέωση δεδομένων
      setRefreshTrigger(prev => prev + 1);
      setEditActivityDialogOpen(false);
      setCurrentActivity(null);
      setCurrentEksormisiForActivity(null);
    } catch (error) {
      alert("Σφάλμα: " + error.message);
    }
  };

  const handleDeleteActivity = async (activity) => {
    if (window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη δραστηριότητα;")) {
      try {
        const activityId = activity.id_drastiriotitas || activity.id;
        await api.delete(`/eksormiseis/drastiriotita/${activityId}`);
        
        // Update local data instead of refreshing
        setEksormiseisData(prevData => 
          prevData.map(eksormisi => ({
            ...eksormisi,
            drastiriotites: eksormisi.drastiriotites.filter(dr => 
              (dr.id !== activityId && dr.id_drastiriotitas !== activityId)
            )
          }))
        );
      } catch (error) {
        alert("Σφάλμα: " + error.message);
      }
    }
  };

  // Ενημέρωση του parentRow
  useEffect(() => {
    if (detailPanelConfig && detailPanelConfig.tables && detailPanelConfig.tables.length > 0) {
      const firstTable = detailPanelConfig.tables[0];
      eksormiseisData.forEach(eksormisi => {
        if (firstTable.meta) {
          firstTable.meta.parentRow = eksormisi;
        }
      });
    }
  }, [eksormiseisData]);

  // Detail panel configuration
  const detailPanelConfig = {
    mainDetails: [
      { accessor: "titlos", header: "Τίτλος" },
      { accessor: "proorismos", header: "Προορισμός" },
      { 
        accessor: "hmerominia_anaxorisis", 
        header: "Ημερομηνία Αναχώρησης",
        format: (value) => value && !isNaN(new Date(value).getTime()) ? 
          new Date(value).toLocaleDateString('el-GR') : '-'
      },
      { 
        accessor: "hmerominia_afiksis", 
        header: "Ημερομηνία Άφιξης",
        format: (value) => value && !isNaN(new Date(value).getTime()) ? 
          new Date(value).toLocaleDateString('el-GR') : '-'
      },
      { 
        accessor: "timi", 
        header: "Τιμή",
        format: (value) => `${Number(value || 0)}€`
      }
    ],
    tables: [
      { 
        title: "Δραστηριότητες",
        getData: (row) => {
          return row.drastiriotites || [];
        },
        columns: [
          { 
            accessorKey: "titlos", 
            header: "Τίτλος",
            Cell: ({ value, row }) => (
              <Box 
                sx={{ 
                  cursor: "pointer", 
                  color: "primary.main",
                  fontWeight: "medium",
                  "&:hover": { textDecoration: "underline" } 
                }} 
                onClick={(e) => {
                  e.stopPropagation();
                  const id = row.original.id || row.original.id_drastiriotitas;
                  navigate(`/drastiriotita/${id}`);
                }}
              >
                {value || "-"}
              </Box>
            )
          },
          { 
            accessorKey: "vathmos_diskolias", 
            header: "Βαθμός Δυσκολίας",
            Cell: ({ row }) => {
              if (!row.original.vathmos_diskolias) return "-";
              const vathmosEpipedo = row.original.vathmos_diskolias.epipedo;
              return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TerrainIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
                  {vathmosEpipedo !== undefined ? `Βαθμός ${vathmosEpipedo}` : "-"}
                </Box>
              );
            }
          }
        ],
        getRowId: (row) => row.id || row.id_drastiriotitas,
        enableRowActions: false,
        meta: {
          parentRow: null
        }
      }
    ]
  };

  const filteredData = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for date comparison
    
    switch(expeditionFilter) {
      case 'past':
        return eksormiseisData.filter(expedition => {
          const departureDate = expedition.hmerominia_anaxorisis 
            ? new Date(expedition.hmerominia_anaxorisis) 
            : null;
          return departureDate && departureDate < today;
        });
      case 'upcoming':
        return eksormiseisData.filter(expedition => {
          const departureDate = expedition.hmerominia_anaxorisis 
            ? new Date(expedition.hmerominia_anaxorisis) 
            : null;
          return departureDate && departureDate >= today;
        });
      default:
        return eksormiseisData;
    }
  }, [eksormiseisData, expeditionFilter]);

  const tableInitialState = React.useMemo(() => ({
    sorting: [
      {
        id: "hmerominia_anaxorisis",
        desc: false // false for ascending (closest date first)
      }
    ]
  }), []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          Διαχείριση Εξορμήσεων
        </Typography>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Εξορμήσεις ({filteredData.length}/{eksormiseisData.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant={expeditionFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => setExpeditionFilter('all')}
                size="small"
                color="primary"
              >
                Όλες ({eksormiseisData.length})
              </Button>
              <Button 
                variant={expeditionFilter === 'upcoming' ? 'contained' : 'outlined'}
                onClick={() => setExpeditionFilter('upcoming')}
                size="small"
                color="success"
              >
                Επερχόμενες ({eksormiseisData.filter(exp => {
                  const departureDate = exp.hmerominia_anaxorisis ? new Date(exp.hmerominia_anaxorisis) : null;
                  return departureDate && departureDate >= new Date();
                }).length})
              </Button>
              <Button 
                variant={expeditionFilter === 'past' ? 'contained' : 'outlined'}
                onClick={() => setExpeditionFilter('past')}
                size="small"
                color="secondary"
              >
                Παλαιότερες ({eksormiseisData.filter(exp => {
                  const departureDate = exp.hmerominia_anaxorisis ? new Date(exp.hmerominia_anaxorisis) : null;
                  return departureDate && departureDate < new Date();
                }).length})
              </Button>
            </Box>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <DataTable 
            data={filteredData}
            columns={columns}
            detailPanelConfig={detailPanelConfig}
            getRowId={(row) => {
              return row.id || row.id_eksormisis;
            }}
            handleRowClick={(row) => {
              navigate(`/eksormisi/${row.id || row.id_eksormisis}`);
            }}
            handleEditClick={handleEditClick}
            handleDelete={handleDelete}
            enableRowActions={true}
            enableExpand={true}
            tableName="eksormiseis"
            enableAddNew={true}
            initialState={tableInitialState} // Add this line
            onAddNew={() => setAddDialogOpen(true)}
            onDetailPanelRender={(row) => {
              if (detailPanelConfig?.tables?.[0]) {
                detailPanelConfig.tables[0].meta = { 
                  ...detailPanelConfig.tables[0].meta,
                  parentRow: row.original 
                };
              }
            }}
          />
        </Box>
        <AddDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          handleAddSave={handleAddEksormisi}
          initialValues={defaultEksormisiValues}
          title="Προσθήκη Νέας Εξόρμησης"
          fields={eksormisiFields}
        />
        {currentEksormisi && (
          <EditDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setCurrentEksormisi(null);
            }}
            handleEditSave={handleEditSave}
            editValues={currentEksormisi}
            title="Επεξεργασία Εξόρμησης"
            fields={eksormisiFields}
          />
        )}
      </Box>
      {/* Dialogs για δραστηριότητες */}
      <AddDialog
        open={addActivityDialogOpen}
        onClose={() => setAddActivityDialogOpen(false)}
        handleAddSave={handleAddActivitySave}
        initialValues={{
          titlos: "",
          id_vathmou_diskolias: "",
          ores_poreias: "",
          diafora_ipsous: "",
          megisto_ipsometro: "",
          hmerominia: new Date().toISOString().split('T')[0]
        }}
        title="Προσθήκη Νέας Δραστηριότητας"
        fields={activityFields}
      />
      {currentActivity && (
        <EditDialog
          open={editActivityDialogOpen}
          onClose={() => {
            setEditActivityDialogOpen(false);
            setCurrentActivity(null);
            setCurrentEksormisiForActivity(null);
          }}
          handleEditSave={handleEditActivitySave}
          editValues={currentActivity}
          title="Επεξεργασία Δραστηριότητας"
          fields={activityFields}
        />
      )}
    </LocalizationProvider>
  );
}