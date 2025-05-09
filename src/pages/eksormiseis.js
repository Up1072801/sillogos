import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  
  // Φόρτωση δεδομένων
  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);
  
  // Fetch data from API - Διορθώθηκε το URL
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/eksormiseis");
      console.log("Ακατέργαστα δεδομένα εξορμήσεων:", response.data);

      // Αντικαταστήστε το κομμάτι επεξεργασίας δεδομένων με αυτό το κώδικα:
      const processedData = response.data.map(eksormisi => {
        // Διασφαλίζουμε ότι το id υπάρχει πάντα
        const id = eksormisi.id_eksormisis || eksormisi.id;
          
        return {
          id: id,
          id_eksormisis: id,
          titlos: String(eksormisi.titlos || "Χωρίς Τίτλο"),
          proorismos: String(eksormisi.proorismos || "Χωρίς Προορισμό"),
          // Διασφάλιση ότι το timi είναι πάντα αριθμός
          timi: Number(eksormisi.timi || 0),
          // Διασφάλιση ότι οι ημερομηνίες είναι σωστές
          hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis ? new Date(eksormisi.hmerominia_anaxorisis) : null,
          hmerominia_afiksis: eksormisi.hmerominia_afiksis ? new Date(eksormisi.hmerominia_afiksis) : null,
          // Διασφάλιση ότι το participantsCount είναι αριθμός
          participantsCount: Number(eksormisi.participantsCount || 0),
          // Διασφάλιση σωστής δομής για τις δραστηριότητες
          drastiriotites: (eksormisi.drastiriotites || []).map(dr => ({
            id: dr.id_drastiriotitas || dr.id,
            id_drastiriotitas: dr.id_drastiriotitas || dr.id,
            titlos: dr.titlos || "Χωρίς Τίτλο",
            vathmos_diskolias: dr.vathmos_diskolias || {
              epipedo: "Άγνωστο"
            }
          }))
        };
      });

      console.log("Επεξεργασμένα δεδομένα εξορμήσεων:", processedData);
      console.log("Παράδειγμα τιμής:", processedData[0]?.timi, typeof processedData[0]?.timi);
      setEksormiseisData(processedData);
      setLoading(false);
    } catch (error) {
      console.error("Σφάλμα κατά τη φόρτωση εξορμήσεων:", error);
      setError("Σφάλμα κατά τη φόρτωση δεδομένων. Παρακαλώ δοκιμάστε ξανά αργότερα.");
      setLoading(false);
    }
  };
  
  // Προσθήκη νέας εξόρμησης - Διορθώθηκε το URL
  const handleAddEksormisi = async (newEksormisi) => {
    try {
      const formattedData = {
        titlos: newEksormisi.titlos,
        proorismos: newEksormisi.proorismos,
        timi: parseInt(newEksormisi.timi),
        hmerominia_anaxorisis: newEksormisi.hmerominia_anaxorisis,
        hmerominia_afiksis: newEksormisi.hmerominia_afiksis
      };
      
      const response = await axios.post("http://localhost:5000/api/eksormiseis", formattedData);
      console.log("Νέα εξόρμηση:", response.data);
      
      // Ανανέωση της λίστας
      setRefreshTrigger(prev => prev + 1);
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη εξόρμησης:", error);
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
      
      await axios.put(`http://localhost:5000/api/eksormiseis/${editedEksormisi.id}`, formattedData);      
      // Ανανέωση της λίστας
      setRefreshTrigger(prev => prev + 1);
      setEditDialogOpen(false);
      setCurrentEksormisi(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία εξόρμησης:", error);
      alert("Σφάλμα κατά την επεξεργασία εξόρμησης. Παρακαλώ δοκιμάστε ξανά.");
    }
  };
  
  // Διαγραφή εξόρμησης - Διορθώθηκε το URL
  const handleDelete = async (row) => {
    if (window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εξόρμηση;")) {
      try {
        const id = row.id || row.id_eksormisis;
        await axios.delete(`http://localhost:5000/api/eksormiseis/${id}`);
        
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error("Σφάλμα κατά τη διαγραφή εξόρμησης:", error);
        alert("Σφάλμα κατά τη διαγραφή εξόρμησης. Παρακαλώ δοκιμάστε ξανά.");
      }
    }
  };
  
  // Πεδία φόρμας για εξόρμηση
  const eksormisiFields = [
    { accessorKey: "titlos", header: "Τίτλος", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
    { accessorKey: "proorismos", header: "Προορισμός", validation: yup.string().required("Το πεδίο είναι υποχρεωτικό") },
    { accessorKey: "timi", header: "Τιμή", type: "number", validation: yup.number().min(0, "Η τιμή δεν μπορεί να είναι αρνητική") },
    { accessorKey: "hmerominia_anaxorisis", header: "Ημερομηνία Αναχώρησης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") },
    { accessorKey: "hmerominia_afiksis", header: "Ημερομηνία Άφιξης", type: "date", validation: yup.date().required("Το πεδίο είναι υποχρεωτικό") }
  ];
  
  // Στήλες πίνακα
  const columns = [
    { 
      accessorKey: "titlos", 
      header: "Τίτλος",
      Cell: ({ row }) => {
        // Καλύτερο debug για να δείξει τι έρχεται πραγματικά
        console.log("Titlos cell row data:", row.original);
        
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
            <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
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
          <Chip
            icon={<GroupIcon />}
            label={count}
            size="small"
            color="primary"
            variant="outlined"
          />
        );
      }
    }
  ];
  
  // Προσθέστε τα παρακάτω states στην αρχή της συνάρτησης Eksormiseis
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const [editActivityDialogOpen, setEditActivityDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [currentEksormisiForActivity, setCurrentEksormisiForActivity] = useState(null);
  const [difficultyLevels, setDifficultyLevels] = useState([]);

  // Προσθέστε στο useEffect για άντληση των επιπέδων δυσκολίας
  useEffect(() => {
    const fetchDifficultyLevels = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/vathmoi-diskolias");
        setDifficultyLevels(response.data);
      } catch (error) {
        console.error("Σφάλμα φόρτωσης επιπέδων δυσκολίας:", error);
      }
    };
    
    fetchDifficultyLevels();
  }, []);

  // Προσθέστε τα πεδία φόρμας για δραστηριότητα
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

  // Προσθέστε τους handlers για τις λειτουργίες
  const handleAddActivity = (parentRow) => {
    console.log("Adding activity with parent row:", parentRow);
    
    // Προσθέτουμε περισσότερη λογική για να βρούμε το parentRow
    if (!parentRow) {
      console.log("Trying to find parent row from detail panel config");
      if (detailPanelConfig?.tables?.[0]?.meta?.parentRow) {
        parentRow = detailPanelConfig.tables[0].meta.parentRow;
        console.log("Found parent row from meta:", parentRow);
      } else if (eksormiseisData.length > 0) {
        // Αν δεν υπάρχει άλλος τρόπος, χρησιμοποιούμε την πρώτη εγγραφή
        parentRow = eksormiseisData[0];
        console.log("Using first eksormisi as parent row:", parentRow);
      }
    }
    
    // Έλεγχος για έγκυρο parentRow
    if (!parentRow || (!parentRow.id && !parentRow.id_eksormisis)) {
      console.error("No valid parent eksormisi found for adding activity");
      alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID εξόρμησης για προσθήκη δραστηριότητας");
      return;
    }
    
    setCurrentEksormisiForActivity(parentRow);
    setAddActivityDialogOpen(true);
  };

  const handleAddActivitySave = async (newActivity) => {
    try {
      // Έλεγχος αν έχουμε έγκυρο ID εξόρμησης
      if (!currentEksormisiForActivity) {
        alert("Δεν έχει επιλεγεί εξόρμηση για τη δραστηριότητα");
        return;
      }
      
      const eksormisiId = currentEksormisiForActivity.id || currentEksormisiForActivity.id_eksormisis;
      
      if (!eksormisiId) {
        console.error("Missing eksormisi ID:", currentEksormisiForActivity);
        alert("Σφάλμα: Δεν βρέθηκε έγκυρο ID εξόρμησης");
        return;
      }
      
      console.log("Adding activity to eksormisi ID:", eksormisiId, "with data:", newActivity);
      
      const formattedData = {
        titlos: newActivity.titlos,
        id_vathmou_diskolias: parseInt(newActivity.id_vathmou_diskolias),
        ores_poreias: newActivity.ores_poreias ? parseInt(newActivity.ores_poreias) : null,
        diafora_ipsous: newActivity.diafora_ipsous ? parseInt(newActivity.diafora_ipsous) : null,
        megisto_ipsometro: newActivity.megisto_ipsometro ? parseInt(newActivity.megisto_ipsometro) : null,
        hmerominia: newActivity.hmerominia
      };
      
      await axios.post(`http://localhost:5000/api/eksormiseis/${eksormisiId}/drastiriotita`, formattedData);
      
      // Ανανέωση δεδομένων
      setRefreshTrigger(prev => prev + 1);
      setAddActivityDialogOpen(false);
      setCurrentEksormisiForActivity(null);
    } catch (error) {
      console.error("Σφάλμα κατά την προσθήκη δραστηριότητας:", error);
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
      
      await axios.put(`http://localhost:5000/api/eksormiseis/drastiriotita/${updatedActivity.id}`, formattedData);
      
      // Ανανέωση δεδομένων
      setRefreshTrigger(prev => prev + 1);
      setEditActivityDialogOpen(false);
      setCurrentActivity(null);
      setCurrentEksormisiForActivity(null);
    } catch (error) {
      console.error("Σφάλμα κατά την επεξεργασία δραστηριότητας:", error);
      alert("Σφάλμα: " + error.message);
    }
  };

  const handleDeleteActivity = async (activity) => {
    if (window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη δραστηριότητα;")) {
      try {
        const activityId = activity.id_drastiriotitas || activity.id;
        await axios.delete(`http://localhost:5000/api/eksormiseis/drastiriotita/${activityId}`);
        
        // Ανανέωση δεδομένων
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error("Σφάλμα κατά τη διαγραφή δραστηριότητας:", error);
        alert("Σφάλμα: " + error.message);
      }
    }
  };

  // Τώρα ενημερώστε το detailPanelConfig για να συμπεριλάβει τις νέες λειτουργίες
  // 1. Πρώτα, εισάγουμε το useEffect για να ενημερώνουμε το parentRow
  useEffect(() => {
    console.log("Current eksormiseis data for activities:", eksormiseisData);
    
    // Ενημέρωση του parentRow για κάθε εξόρμηση
    if (detailPanelConfig && detailPanelConfig.tables && detailPanelConfig.tables.length > 0) {
      const firstTable = detailPanelConfig.tables[0];
      eksormiseisData.forEach(eksormisi => {
        if (firstTable.meta) {
          firstTable.meta.parentRow = eksormisi;
        }
      });
      console.log("Updated detail panel config:", detailPanelConfig);
    }
  }, [eksormiseisData]);

  // 2. Τροποποιούμε το detailPanelConfig.tables[0] για να χρησιμοποιεί τις ίδιες παραμέτρους με το athlites.js
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
          console.log("Getting activities data for:", row.titlos);
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
              // Απλοποιημένη έκδοση χωρίς console.log
              if (!row.original.vathmos_diskolias) return "-";
              const vathmosEpipedo = row.original.vathmos_diskolias.epipedo;
              return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TerrainIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
                  {vathmosEpipedo !== undefined ? `Βαθμός ${vathmosEpipedo}` : "-"}
                </Box>
              );
            }
          },
        ],
        getRowId: (row) => row.id || row.id_drastiriotitas,
        enableRowActions: true,
        // Προσθέτουμε αυτά τα πεδία - είναι πιο απλά και λειτουργούν καλύτερα με το DataTable
        onAddNew: (parentRow) => handleAddActivity(parentRow),
        onEdit: (row, parentRow) => handleEditActivity(row, parentRow),
        onDelete: (row) => handleDeleteActivity(row),
        addNewButtonText: "Προσθήκη Δραστηριότητας",
        // Αφαιρούμε τα renderRowActions και renderTopToolbarCustomActions
        meta: {
          parentRow: null // Θα ενημερωθεί δυναμικά
        }
      }
    ]
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Προσθέστε αυτό το log πριν επιστρέψετε το JSX με το DataTable
  console.log("Τελικά δεδομένα πριν το DataTable:", eksormiseisData);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          Διαχείριση Εξορμήσεων
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Εξορμήσεις ({eksormiseisData.length})
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <DataTable 
            data={eksormiseisData}
            columns={columns}
            detailPanelConfig={detailPanelConfig}
            getRowId={(row) => {
              return row.id || row.id_eksormisis;
            }}
            handleRowClick={(row) => {
              console.log("Row clicked:", row);
              navigate(`/eksormisi/${row.id || row.id_eksormisis}`);
            }}
            handleEditClick={handleEditClick}
            handleDelete={handleDelete}
            enableRowActions={true}
            enableExpand={true}
            tableName="eksormiseis"
            enableAddNew={true}
            onAddNew={() => setAddDialogOpen(true)}
            onDetailPanelRender={(row) => {
              // Ενημέρωση του parentRow όταν ανοίγει το detail panel
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