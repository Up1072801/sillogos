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

      const processedData = response.data.map(eksormisi => {
        // Διασφάλιση ότι το id υπάρχει πάντα
        const id = eksormisi.id_eksormisis || eksormisi.id;
        
        // Προσθήκη ελέγχων για κάθε πεδίο
        return {
          id: id,
          id_eksormisis: id,
          titlos: eksormisi.titlos || "Χωρίς Τίτλο",
          proorismos: eksormisi.proorismos || "Χωρίς Προορισμό",
          timi: typeof eksormisi.timi === 'number' ? eksormisi.timi : 0,
          hmerominia_anaxorisis: eksormisi.hmerominia_anaxorisis || null,
          hmerominia_afiksis: eksormisi.hmerominia_afiksis || null,
          
          // Υπολογισμός των συμμετεχόντων από τις δραστηριότητες
          participantsCount: eksormisi.participantsCount || 
            (eksormisi.drastiriotites || []).reduce((total, dr) => 
              total + ((dr.simmetoxi || []).length || 0), 0),
          
          // Διασφάλιση σωστής δομής για τις δραστηριότητες
          drastiriotites: (eksormisi.drastiriotites || []).map(dr => ({
            id: dr.id_drastiriotitas || dr.id,
            id_drastiriotitas: dr.id_drastiriotitas || dr.id,
            titlos: dr.titlos || "Χωρίς Τίτλο",
            vathmos_diskolias: dr.vathmos_diskolias || null
          }))
        };
      });

      console.log("Επεξεργασμένα δεδομένα εξορμήσεων:", processedData);
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
      Cell: ({ value, row }) => (
        <Box 
          sx={{ 
            cursor: "pointer", 
            color: "primary.main", 
            fontWeight: "medium",
            "&:hover": { textDecoration: "underline" } 
          }}
          onClick={(e) => {
            e.stopPropagation(); // Σταματά την προώθηση του event
            const id = row.original.id || row.original.id_eksormisis;
            console.log("Πλοήγηση σε eksormisi:", id);
            navigate(`/eksormisi/${id}`);
          }}
        >
          {value || "-"}
        </Box>
      )
    },
    { accessorKey: "proorismos", header: "Προορισμός" },
    { 
      accessorKey: "hmerominia_anaxorisis", 
      header: "Ημερομηνία Αναχώρησης",
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString('el-GR') : "-"
    },
    { 
      accessorKey: "hmerominia_afiksis", 
      header: "Ημερομηνία Άφιξης",
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString('el-GR') : "-"
    },
    { 
      accessorKey: "timi", 
      header: "Τιμή",
      Cell: ({ value }) => `${value}€`
    },
    { 
      accessorKey: "participantsCount", 
      header: "Συμμετέχοντες",
      Cell: ({ value }) => (
        <Chip
          icon={<GroupIcon />}
          label={value || 0}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    { 
      accessorKey: "vathmos_diskolias", 
      header: "Βαθμός Δυσκολίας",
      Cell: ({ row }) => {
        // Ελέγχουμε αν υπάρχει το vathmos_diskolias
        const vathmosData = row.original.vathmos_diskolias || {};
        const vathmosOnoma = vathmosData.onoma;
        const vathmosEpipedo = vathmosData.epipedo;
        const vathmosId = vathmosData.id_vathmou_diskolias;
        
        // Debug
        console.log("Δεδομένα βαθμού δυσκολίας:", row.original.id, vathmosData);
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TerrainIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
            {vathmosOnoma || vathmosEpipedo || vathmosId ? 
              `Βαθμός ${vathmosEpipedo || vathmosOnoma || vathmosId}` : "-"}
          </Box>
        );
      }
    }
  ];
  
  // Διαμόρφωση πίνακα λεπτομερειών
  const detailPanelConfig = {
    mainDetails: [
      { accessor: "titlos", header: "Τίτλος" },
      { accessor: "proorismos", header: "Προορισμός" },
      { 
        accessor: "hmerominia_anaxorisis", 
        header: "Ημερομηνία Αναχώρησης",
        format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-'
      },
      { 
        accessor: "hmerominia_afiksis", 
        header: "Ημερομηνία Άφιξης",
        format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-'
      },
      { 
        accessor: "timi", 
        header: "Τιμή",
        format: (value) => value ? `${value}€` : '-'
      }
    ],
    tables: [
      {
        title: "Δραστηριότητες",
        getData: (row) => row.drastiriotites || [],
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
              const vathmosOnoma = row.original.vathmos_diskolias?.onoma;
              const vathmosEpipedo = row.original.vathmos_diskolias?.epipedo;
              const vathmosId = row.original.vathmos_diskolias?.id_vathmou_diskolias;
              
              return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TerrainIcon sx={{ mr: 0.5, fontSize: 'small', color: 'text.secondary' }} />
                  {vathmosOnoma || vathmosEpipedo || vathmosId ? 
                    `Βαθμός ${vathmosEpipedo || vathmosOnoma || vathmosId}` : "-"}
                </Box>
              );
            }
          }
        ],
        getRowId: (row) => row.id || row.id_drastiriotitas,
        handleRowClick: (row) => {
          const id = row.id || row.id_drastiriotitas;
          navigate(`/drastiriotita/${id}`);
        },
        enableRowActions: true
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, my: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              <HikingIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
              Εξορμήσεις
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Νέα Εξόρμηση
            </Button>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <DataTable 
            data={eksormiseisData}
            columns={columns}
            detailPanelConfig={detailPanelConfig}
            getRowId={(row) => row.id || row.id_eksormisis}
            handleRowClick={(row) => {
              console.log("Row clicked:", row);
              navigate(`/eksormisi/${row.id || row.id_eksormisis}`);
            }}
            handleEditClick={handleEditClick}
            handleDelete={handleDelete}
            enableRowActions={true}
            enableExpand={true}
            tableName="eksormiseis"
          />
        </Paper>
        
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
      </Container>
    </LocalizationProvider>
  );
}