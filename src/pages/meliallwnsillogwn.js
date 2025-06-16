import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import api from '../utils/api';
import { Box, Typography } from "@mui/material";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import * as yup from "yup";

// Ορισμός των στηλών του πίνακα
const columns = [
  { accessorKey: "id", header: "ID" },
  { 
    accessorKey: "fullName", 
    header: "Ονοματεπώνυμο", 
    Cell: ({ row }) => `${row.original.lastName || ''} ${row.original.firstName || ''}`,
    filterFn: (row, id, filterValue) => {
      const name = `${row.original.lastName || ''} ${row.original.firstName || ''}`.toLowerCase();
      return name.includes(filterValue.toLowerCase());
    }
  },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου", enableHiding: true },
  { accessorKey: "onomasillogou", header: "Όνομα Συλλόγου" },
  { accessorKey: "vathmos_diskolias", header: "Βαθμός Δυσκολίας" }
];

// Διαμόρφωση του detail panel
const detailPanelConfig = {
  mainDetails: [
    { accessor: "firstName", header: "Όνομα" },
    { accessor: "lastName", header: "Επώνυμο" },
    { accessor: "email", header: "Email" },
    { accessor: "phone", header: "Τηλέφωνο" },
    { accessor: "arithmosmitroou", header: "Αριθμός Μητρώου" },
    { accessor: "onomasillogou", header: "Όνομα Συλλόγου" },
    { accessor: "vathmos_diskolias", header: "Βαθμός Δυσκολίας" }
  ],
  tables: [
    {
      title: "Δραστηριότητες",
      accessor: "melos.simmetoxi",
      columns: [
        {
          accessor: "eksormisi.titlos",
          header: "Τίτλος Εξόρμησης",
          Cell: ({ row }) => {
            const eksormisiId = row.original.eksormisi?.id_eksormisis;
            const titlos = row.original.eksormisi?.titlos || "-";
            return eksormisiId ? (
              <a
                href={`/eksormisi/${eksormisiId}`}
                style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}
                onClick={e => { e.stopPropagation(); }}
              >
                {titlos}
              </a>
            ) : titlos;
          }
        },
        { 
          accessor: "drastiriotita.titlos", 
          header: "Τίτλος Δραστηριότητας",
          Cell: ({ row }) => row.original.drastiriotita?.titlos || "-" 
        },
        { 
          accessor: "drastiriotita.vathmos_diskolias.epipedo", 
          header: "ΒΔ",
          Cell: ({ row }) => row.original.drastiriotita?.vathmos_diskolias?.epipedo || "-" 
        },
        {
          accessor: "drastiriotita.hmerominia",
          header: "Ημερομηνία",
          Cell: ({ row }) => {
            const dateValue = row.original.drastiriotita?.hmerominia;
            if (!dateValue) return "-";
            
            try {
              // Check if the value is already a formatted string (contains /)
              if (typeof dateValue === 'string' && dateValue.includes('/')) {
                // Parse the Greek formatted date (D/M/YYYY or DD/MM/YYYY)
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  // Ensure day and month are always two digits
                  const day = String(parseInt(parts[0])).padStart(2, '0');
                  const month = String(parseInt(parts[1])).padStart(2, '0');
                  const year = parts[2];
                  
                  return `${day}/${month}/${year}`;
                }
                return dateValue; // Return as-is if we can't parse it
              }
              
              // If it's not already formatted, treat it as a raw date
              const date = new Date(dateValue);
              if (isNaN(date.getTime())) return "-";
              
              // Explicitly format as DD/MM/YYYY
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              
              return `${day}/${month}/${year}`;
            } catch (e) {
              console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e, dateValue);
              return "-";
            }
          }
        }
      ],
      getData: (row) => {
        // Get all active participations
        const simmetoxes = (row.melos?.simmetoxi || []).filter(item => item.katastasi === "Ενεργή");
        
        // Flatten the structure to create one row per activity
        const activities = [];
        
        simmetoxes.forEach(simmetoxi => {
          if (simmetoxi.simmetoxi_drastiriotites && simmetoxi.simmetoxi_drastiriotites.length > 0) {
            // Create a row for each activity in this participation
            simmetoxi.simmetoxi_drastiriotites.forEach(rel => {
              if (rel.drastiriotita) {
                activities.push({
                  id_simmetoxis: simmetoxi.id_simmetoxis,
                  eksormisi: simmetoxi.eksormisi,
                  drastiriotita: rel.drastiriotita
                });
              }
            });
          } else if (simmetoxi.drastiriotita) {
            // Backward compatibility for old data structure
            activities.push({
              id_simmetoxis: simmetoxi.id_simmetoxis,
              eksormisi: simmetoxi.eksormisi,
              drastiriotita: simmetoxi.drastiriotita
            });
          }
        });
        
        return activities;
      },
      noRowHover: true,
      noRowClick: true
    },
    {
      title: "Σχολές",
      accessor: "melos.parakolouthisi",
      columns: [
        {
          accessor: "sxoli.titlos",
          header: "Τίτλος Σχολής",
          Cell: ({ row }) => {
            const sxoli = row.original.sxoli;
            if (!sxoli) return "-";
            const sxoliId = sxoli.id_sxolis;
            const onomaSxolis = [
              sxoli.titlos,
              sxoli.klados,
              sxoli.epipedo,
              sxoli.etos
            ].filter(Boolean).join("   ");
            return sxoliId ? (
              <a
                href={`/sxoles/${sxoliId}`}
                style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}
                onClick={e => {
                  e.stopPropagation();
                  window.location.href = `/sxoles/${sxoliId}`;
                }}
              >
                {onomaSxolis}
              </a>
            ) : onomaSxolis || "-";
          }
        }
      ],
      getData: (row) => row.melos?.parakolouthisi || [],
      noRowHover: true,
      noRowClick: true
    }
  ],
};

export default function MeliAllwn() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [difficultyLevels, setDifficultyLevels] = useState([]);

  // Ενημέρωση του useEffect για να διαμορφώσει καλύτερα τα δεδομένα
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, difficultyRes] = await Promise.all([
          api.get("/meliallwnsillogwn"),
          api.get("/vathmoi-diskolias")
        ]);

        setDifficultyLevels(difficultyRes.data);
        
        // Διαμόρφωση των δεδομένων για την καλύτερη αξιοποίηση τους στο UI
        const formattedData = membersRes.data.map(member => {
          // Εύρεση του ονόματος του βαθμού δυσκολίας
          const difficultyLevel = difficultyRes.data.find(
            level => level.id_vathmou_diskolias === member.melos?.vathmos_diskolias?.id_vathmou_diskolias
          );
          
          return {
            ...member,
            fullName: `${member.lastName || ""} ${member.firstName || ""}`.trim(),
            id: member.id,
            vathmos_diskolias: difficultyLevel ? `Βαθμός ${difficultyLevel.epipedo}` : "Βαθμός 1", // Εμφάνιση ονόματος
            // Βεβαιωθείτε ότι το melos περιέχει τα απαραίτητα δεδομένα
            melos: member.melos || {
              simmetoxi: member.melos?.simmetoxi || [],
              parakolouthisi: member.melos?.parakolouthisi || []
            }
          };
        });
        
        setData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Σφάλμα φόρτωσης:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddSave = async (newRow) => {
    try {
      // Διασφάλιση ότι έχουμε έγκυρο βαθμό δυσκολίας
      const vathmosDiskolias = newRow.vathmos_diskolias || 1;
      const selectedDifficultyLevel = difficultyLevels.find(
        level => level.id_vathmou_diskolias === parseInt(vathmosDiskolias)
      ) || difficultyLevels.find(level => level.id_vathmou_diskolias === 1);

      const requestData = {
        epafes: {
          onoma: newRow.firstName || "",
          epitheto: newRow.lastName || "",
          email: newRow.email || "",
          tilefono: newRow.phone || "",
        },
        melos: {
          tipo_melous: "eksoteriko",
          vathmos_diskolias: {
            id_vathmou_diskolias: selectedDifficultyLevel ? selectedDifficultyLevel.id_vathmou_diskolias : 1,
          },
        },
        eksoteriko_melos: {
          onoma_sillogou: newRow.onomasillogou || "",
          arithmos_mitroou: newRow.arithmosmitroou ? parseInt(newRow.arithmosmitroou) : null,
        },
      };

      const response = await api.post("/meliallwnsillogwn", requestData);
      setOpenAddDialog(false);
      
      // Προσθήκη του νέου μέλους στα δεδομένα και διαμόρφωση του για το UI
      const newMember = {
        ...response.data,
        fullName: `${response.data.lastName || ""} ${response.data.firstName || ""}`.trim(),
        id: response.data.id,
        melos: response.data.melos || {
          epafes: response.data.epafes || {},
          vathmos_diskolias: response.data.vathmos_diskolias || {},
          simmetoxi: [],
          parakolouthisi: []
        }
      };
      
      setData(prevData => [...prevData, newMember]);
    } catch (error) {
      console.error("Σφάλμα προσθήκης:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message;
      alert(`Σφάλμα κατά την προσθήκη του μέλους: ${errorMessage}`);
    }
  };

  const handleEditClick = (row) => {
    // Εξαγωγή των ακριβών τιμών που χρειάζονται για την επεξεργασία
    const difficultyId = row.melos?.vathmos_diskolias?.id_vathmou_diskolias || 1;
    
    const editData = {
      id: row.id,
      firstName: row.firstName || row.melos?.epafes?.onoma || "",
      lastName: row.lastName || row.melos?.epafes?.epitheto || "",
      email: row.email || row.melos?.epafes?.email || "",
      phone: row.phone || row.melos?.epafes?.tilefono || "",
      vathmos_diskolias: difficultyId,
      arithmosmitroou: row.arithmosmitroou || row.arithmos_mitroou || "",
      onomasillogou: row.onomasillogou || row.onoma_sillogou || ""
    };
    
    setEditValues(editData);
    setOpenEditDialog(true);
  };

  const handleEditSave = async (updatedRow) => {
    try {
      // Διασφάλιση ότι έχουμε έγκυρο βαθμό δυσκολίας
      const vathmosDiskolias = updatedRow.vathmos_diskolias || 1;
      const selectedDifficultyLevel = difficultyLevels.find(
        level => level.id_vathmou_diskolias === parseInt(vathmosDiskolias)
      ) || difficultyLevels.find(level => level.id_vathmou_diskolias === 1);

      const requestData = {
        epafes: {
          onoma: updatedRow.firstName || "",
          epitheto: updatedRow.lastName || "",
          email: updatedRow.email || "",
          tilefono: updatedRow.phone || "",
        },
        melos: {
          tipo_melous: "eksoteriko",
          vathmos_diskolias: {
            id_vathmou_diskolias: selectedDifficultyLevel ? selectedDifficultyLevel.id_vathmou_diskolias : 1,
          },
        },
        eksoteriko_melos: {
          onoma_sillogou: updatedRow.onomasillogou || "",
          arithmos_mitroou: updatedRow.arithmosmitroou ? parseInt(updatedRow.arithmosmitroou) : null,
        },
      };

      const id = updatedRow.id;
      if (!id) {
        console.error("No ID provided for update");
        return;
      }

      const response = await api.put(`/meliallwnsillogwn/${id}`, requestData);
      
      // Ενημέρωση των δεδομένων στο UI
      const updatedMember = {
        ...response.data,
        fullName: `${response.data.lastName || ""} ${response.data.firstName || ""}`.trim()
      };
      
      setData((prevData) =>
        prevData.map((item) => item.id === id ? updatedMember : item)
      );

      setOpenEditDialog(false);
    } catch (error) {
      console.error("Σφάλμα ενημέρωσης:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message;
      alert(`Σφάλμα κατά την ενημέρωση του μέλους: ${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!id || isNaN(id)) {
        console.error("Invalid ID");
        return;
      }
  
      await api.delete(`/meliallwnsillogwn/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  // Δημιουργία των fields για το AddDialog και EditDialog με useMemo
  const formFields = useMemo(() => {
    if (difficultyLevels.length === 0) {
      return [];
    }
    
    return [
      { 
        accessorKey: "firstName", 
        header: "Όνομα", 
        validation: yup.string()
          .required("Το όνομα είναι υποχρεωτικό")
          .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο όνομα', 
            value => !value || !/[0-9]/.test(value))
      },
      { 
        accessorKey: "lastName", 
        header: "Επώνυμο", 
        validation: yup.string()
          .required("Το επώνυμο είναι υποχρεωτικό")
          .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο επώνυμο', 
            value => !value || !/[0-9]/.test(value))
      },
      { 
        accessorKey: "email", 
        header: "Email", 
        validation: yup
          .string()
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
          .test('phone-format', 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία και να περιέχει μόνο αριθμούς και το σύμβολο +', function(value) {
            if (!value || value === '') return true;
            const digitsOnly = value.replace(/[^0-9]/g, '');
            return /^[0-9+]+$/.test(value) && digitsOnly.length >= 10;
          })
      },
      { 
        accessorKey: "vathmos_diskolias", 
        header: "Βαθμός Δυσκολίας", 
        type: "select",
        options: difficultyLevels.map(level => ({ 
          value: level.id_vathmou_diskolias, 
          label: `Βαθμός ${level.epipedo}` 
        })),
        defaultValue: difficultyLevels.find(level => level.id_vathmou_diskolias === 1)?.id_vathmou_diskolias || difficultyLevels[0]?.id_vathmou_diskolias || 1,
        validation: yup.number().min(1, "Ο βαθμός πρέπει να είναι τουλάχιστον 1")
      },
      { 
        accessorKey: "arithmosmitroou", 
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
        accessorKey: "onomasillogou", 
        header: "Όνομα Συλλόγου", 
        validation: yup.string()
      }
    ];
  }, [difficultyLevels]);

  const tableInitialState = useMemo(() => ({
    columnOrder: [
      "fullName",
      "phone",
      "email",
      "onomasillogou",
      "vathmos_diskolias",
      "mrt-actions",
    ],
    columnVisibility: {
      id: false,
      arithmosmitroou: false,
    },
    sorting: [{ id: "fullName", desc: false }]
  }), []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Μέλη Άλλων Συλλόγων ({data.length})
        </Typography>
        <DataTable
          data={data}
          columns={columns}
          detailPanelConfig={detailPanelConfig}
          getRowId={(row) => row.id}
          initialState={tableInitialState}
          state={{ isLoading: loading }}
          onAddNew={() => setOpenAddDialog(true)}
          handleEditClick={handleEditClick}
          handleDelete={handleDelete}
          enableExpand={true}
        />

        <AddDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          handleAddSave={handleAddSave}
          fields={formFields}
        />

        <EditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          editValues={editValues}
          handleEditSave={handleEditSave}
          fields={formFields}
        />
      </Box>
    </LocalizationProvider>
  );
}