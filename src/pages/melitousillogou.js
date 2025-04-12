import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";
import axios from "axios";
import { Box, Typography } from "@mui/material";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import * as yup from "yup";

const fields = [
  { 
    accessorKey: "fullName", 
    header: "Ονοματεπώνυμο", 
    Cell: ({ row }) => `${row.original.melos?.epafes?.onoma || ''} ${row.original.melos?.epafes?.epitheto || ''}`,
    filterFn: (row, id, filterValue) => {
      const name = `${row.original.melos?.epafes?.onoma || ''} ${row.original.melos?.epafes?.epitheto || ''}`.toLowerCase();
      return name.includes(filterValue.toLowerCase());
    }
  },
  { accessorKey: "patronimo", header: "Πατρώνυμο", validation: yup.string().required("Υποχρεωτικό") },
  { accessorKey: "arithmos_mitroou", header: "Αριθμός Μητρώου" },
  { accessorKey: "odos", header: "Οδός", validation: yup.string().required("Υποχρεωτικό") },
  { accessorKey: "tk", header: "ΤΚ", validation: yup.number().required("Υποχρεωτικό") },
  { 
    accessorKey: "melos.epafes.email", 
    header: "Email", 
    validation: yup.string().email("Μη έγκυρο email").required("Υποχρεωτικό") 
  },
  { 
    accessorKey: "melos.epafes.tilefono", 
    header: "Τηλέφωνο", 
    validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία").required("Υποχρεωτικό") 
  },
  { 
    accessorKey: "status", 
    header: "Κατάσταση", 
    Cell: ({ row }) => row.original.athlitis ? "Αθλητής" : row.original.sindromitis?.katastasi_sindromis || '-' 
  },
  { 
    accessorKey: "melos.vathmos_diskolias.epipedo", 
    header: "Βαθμός Δυσκολίας", 
    Cell: ({ row }) => row.original.melos?.vathmos_diskolias?.epipedo || '-' 
  },
  { 
    accessorKey: "eidosSindromis", 
    header: "Είδος Συνδρομής", 
    Cell: ({ row }) => row.original.eidosSindromis || '-' 
  },
];

const detailPanelConfig = {
  mainDetails: [
    { accessor: "melos.epafes.onoma", header: "Όνομα" },
    { accessor: "melos.epafes.epitheto", header: "Επώνυμο" },
    { accessor: "patronimo", header: "Πατρώνυμο" },
    { accessor: "odos", header: "Οδός" },
    { accessor: "tk", header: "ΤΚ" },
    { accessor: "arithmos_mitroou", header: "Αρ. Μητρώου" },
    { accessor: "hmerominia_gennhshs", header: "Ημ. Γέννησης" },
    { accessor: "melos.epafes.email", header: "Email" },
    { accessor: "melos.epafes.tilefono", header: "Τηλέφωνο" },
    { 
      accessor: "status", 
      header: "Κατάσταση",
      Cell: ({ row }) => {
        if (row.original.athlitis) return "Αθλητής";
        return row.original.sindromitis?.katastasi_sindromis || '-';
      }
    },
    { 
      accessor: "melos.vathmos_diskolias.epipedo", 
      header: "Βαθμός Δυσκολίας" 
    },
    {
      accessor: "hmerominia_egrafis",
      header: "Ημ. Εγγραφής",
      format: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      accessor: "hmerominia_pliromis",
      header: "Ημ. Πληρωμής",
      format: (value) => value ? new Date(value).toLocaleDateString('el-GR') : '-'
    }
  ],
  tables: [
    {
      title: "Δραστηριότητες",
      accessor: "melos.simmetoxi",
      columns: [
        { accessor: "drastiriotita.titlos", header: "Τίτλος" },
        { accessor: "drastiriotita.hmerominia", header: "Ημερομηνία", format: (value) => value ? new Date(value).toLocaleDateString() : '-' },
        { accessor: "drastiriotita.vathmos_diskolias.epipedo", header: "Βαθμός Δυσκολίας" },
        { accessor: "drastiriotita.eksormisi.titlos", header: "Τίτλος Εξόρμησης" },
      ],
    },
    {
      title: "Σχολές",
      accessor: "melos.parakolouthisi",
      columns: [
        { accessor: "sxoli.epipedo", header: "Επίπεδο" },
        { accessor: "sxoli.klados", header: "Κλάδος" },
      ],
    },
  ],
};

export default function Meloi() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [subscriptionStatuses, setSubscriptionStatuses] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, difficultyRes, typesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/melitousillogou"),
          axios.get("http://localhost:5000/api/vathmoi-diskolias"),
          axios.get("http://localhost:5000/api/eidi-sindromis")
        ]);

        setDifficultyLevels(difficultyRes.data);
        setSubscriptionTypes(typesRes.data);
        setSubscriptionStatuses([
          { value: "Ενεργή", label: "Ενεργή" },
          { value: "Ληγμένη", label: "Ληγμένη" },
          { value: "Διαγραμμένη", label: "Διαγραμμένη" }
        ]);

        setData(
          membersRes.data.map((member) => ({
            ...member,
            id: member.id_es_melous,
            fullName: `${member.melos?.epafes?.onoma || ""} ${member.melos?.epafes?.epitheto || ""}`.trim(),
            email: member.melos?.epafes?.email || "-",
            tilefono: member.melos?.epafes?.tilefono || "-",
            odos: member.odos || "-",
            tk: member.tk || "-",
            arithmos_mitroou: member.arithmos_mitroou || "-",
            eidosSindromis: member.eidosSindromis || "-",
            hmerominia_gennhshs: member.hmerominia_gennhshs
              ? new Date(member.hmerominia_gennhshs).toLocaleDateString("el-GR")
              : "-",
            status: member.athlitis
              ? "Αθλητής"
              : member.sindromitis?.katastasi_sindromis || "Χωρίς Συνδρομή",
            parakolouthisi: member.melos?.parakolouthisi || [],
            simmetoxi: member.melos?.simmetoxi || [],
            hmerominia_egrafis: member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis
              ? new Date(member.sindromitis.exei[0].sindromi.hmerominia_enarksis).toLocaleDateString("el-GR")
              : "-",
            hmerominia_pliromis: member.hmerominia_pliromis
              ? new Date(member.hmerominia_pliromis).toLocaleDateString("el-GR")
              : "-",
          }))
        );
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
      const today = new Date().toISOString();

      // Εύρεση του αντικειμένου βαθμού δυσκολίας με βάση το ID
      const selectedDifficultyLevel = difficultyLevels.find(
        level => level.id_vathmou_diskolias === parseInt(newRow.epipedo)
      );

      const requestData = {
        epafes: {
          onoma: newRow.onoma,
          epitheto: newRow.epitheto,
          email: newRow.email,
          tilefono: newRow.tilefono,
        },
        melos: {
          tipo_melous: "esoteriko",
          vathmos_diskolias: {
            epipedo: selectedDifficultyLevel ? selectedDifficultyLevel.id_vathmou_diskolias : 1,
          },
        },
        esoteriko_melos: {
          hmerominia_gennhshs: newRow.hmerominia_gennhshs || today,
          patronimo: newRow.patronimo,
          odos: newRow.odos,
          tk: parseInt(newRow.tk),
          arithmos_mitroou: parseInt(newRow.arithmos_mitroou),
        },
        sindromitis: {
          katastasi_sindromis: newRow.katastasi_sindromis || "Ενεργή",
          exei: {
            hmerominia_pliromis: newRow.hmerominia_pliromis || today,
            sindromi: {
              hmerominia_enarksis: newRow.hmerominia_enarksis || today,
              eidos_sindromis: newRow.eidosSindromis,
            },
          },
        },
      };

      await axios.post("http://localhost:5000/api/melitousillogou", requestData);
      setOpenAddDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Σφάλμα προσθήκης:", error);
    }
  };

  const handleEditClick = (row) => {
    console.log("Edit row:", row);

    const editData = {
      id_es_melous: row.id_es_melous || row.id,
      onoma: row.melos?.epafes?.onoma || "",
      epitheto: row.melos?.epafes?.epitheto || "",
      email: row.melos?.epafes?.email || "",
      tilefono: row.melos?.epafes?.tilefono || "",
      epipedo: row.melos?.vathmos_diskolias?.id_vathmou_diskolias || "",
      patronimo: row.patronimo || "",
      odos: row.odos || "",
      tk: row.tk || "",
      arithmos_mitroou: row.arithmos_mitroou || "",
      eidosSindromis: row.eidosSindromis || "",
      katastasi_sindromis: row.sindromitis?.katastasi_sindromis || "",
      // Προσθέτουμε και τα επιπλέον πεδία για συμβατότητα με την επεξεργασία
      "melos.epafes.onoma": row.melos?.epafes?.onoma || "",
      "melos.epafes.epitheto": row.melos?.epafes?.epitheto || "",
      "melos.epafes.email": row.melos?.epafes?.email || "",
      "melos.epafes.tilefono": row.melos?.epafes?.tilefono || "",
      "melos.vathmos_diskolias.epipedo": row.melos?.vathmos_diskolias?.epipedo || ""
    };

    console.log("Prepared edit data:", editData);
    setEditValues(editData);
    setOpenEditDialog(true);
  };

  const handleEditSave = async (updatedRow) => {
    try {
      const today = new Date().toISOString();
      const isStatusChangedToActive = 
        updatedRow.katastasi_sindromis === "Ενεργή" && 
        editValues.katastasi_sindromis !== "Ενεργή";

      // Εύρεση του αντικειμένου βαθμού δυσκολίας με βάση το ID
      const selectedDifficultyLevel = difficultyLevels.find(
        level => level.id_vathmou_diskolias === parseInt(updatedRow.epipedo)
      );

      const requestData = {
        epafes: {
          onoma: updatedRow.onoma,
          epitheto: updatedRow.epitheto,
          email: updatedRow.email,
          tilefono: updatedRow.tilefono,
        },
        vathmos_diskolias: updatedRow.epipedo ? {
          id_vathmou_diskolias: parseInt(updatedRow.epipedo)
        } : undefined,
        patronimo: updatedRow.patronimo,
        arithmos_mitroou: updatedRow.arithmos_mitroou,
        odos: updatedRow.odos,
        tk: updatedRow.tk,
        eidosSindromis: updatedRow.eidosSindromis,
        katastasi_sindromis: updatedRow.katastasi_sindromis,
        hmerominia_pliromis: isStatusChangedToActive ? today : undefined
      };

      const id = updatedRow.id_es_melous || updatedRow.id;
      if (!id) {
        console.error("No ID provided for update");
        return;
      }

      const response = await axios.put(`http://localhost:5000/api/melitousillogou/${id}`, requestData);
      
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { 
            ...item, 
            ...response.data,
            melos: {
              ...item.melos,
              epafes: {
                ...item.melos?.epafes,
                onoma: updatedRow.onoma,
                epitheto: updatedRow.epitheto,
                email: updatedRow.email,
                tilefono: updatedRow.tilefono,
              },
              vathmos_diskolias: updatedRow.epipedo ? {
                id_vathmou_diskolias: parseInt(updatedRow.epipedo),
                epipedo: selectedDifficultyLevel ? selectedDifficultyLevel.epipedo : null
              } : item.melos?.vathmos_diskolias,
            },
            eidosSindromis: updatedRow.eidosSindromis,
            sindromitis: {
              ...item.sindromitis,
              katastasi_sindromis: updatedRow.katastasi_sindromis,
              exei: isStatusChangedToActive ? [{
                ...item.sindromitis?.exei?.[0],
                hmerominia_pliromis: today
              }] : item.sindromitis?.exei
            }
          } : item
        )
      );

      setOpenEditDialog(false);
    } catch (error) {
      console.error("Σφάλμα ενημέρωσης:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!id || isNaN(id)) {
        console.error("Invalid ID");
        return;
      }
  
      await axios.delete(`http://localhost:5000/api/melitousillogou/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  // Δημιουργία των fields για το AddDialog με useMemo για να αποφύγουμε άπειρους επανασχεδιασμούς
  const addFields = useMemo(() => {
    if (difficultyLevels.length === 0 || subscriptionTypes.length === 0) {
      return [];
    }
    
    return [
      { 
        accessorKey: "onoma", 
        header: "Όνομα", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "epitheto", 
        header: "Επώνυμο", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "email", 
        header: "Email", 
        validation: yup.string().email("Μη έγκυρο email").required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "tilefono", 
        header: "Τηλέφωνο", 
        validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία").required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "epipedo", 
        header: "Βαθμός Δυσκολίας", 
        type: "select",
        options: difficultyLevels.map(level => ({ 
          value: level.id_vathmou_diskolias, 
          label: `Βαθμός ${level.epipedo}` 
        })),
        validation: yup.number().min(1, "Ο βαθμός πρέπει να είναι τουλάχιστον 1")
      },
      { 
        accessorKey: "hmerominia_gennhshs", 
        header: "Ημερομηνία Γέννησης", 
        type: "date",
        validation: yup.date().required("Υποχρεωτικό")
      },
      { 
        accessorKey: "patronimo", 
        header: "Πατρώνυμο", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "odos", 
        header: "Οδός", 
        validation: yup.string().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "tk", 
        header: "ΤΚ", 
        validation: yup.number().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "arithmos_mitroou", 
        header: "Αριθμός Μητρώου", 
        validation: yup.number().required("Υποχρεωτικό") 
      },
      { 
        accessorKey: "katastasi_sindromis", 
        header: "Κατάσταση Συνδρομής",
        type: "select",
        options: subscriptionStatuses,
        defaultValue: "Ενεργή",
        validation: yup.string().required("Υποχρεωτικό")
      },
      { 
        accessorKey: "hmerominia_pliromis", 
        header: "Ημερομηνία Πληρωμής", 
        type: "date",
        defaultValue: new Date().toISOString(),
        validation: yup.date().required("Υποχρεωτικό")
      },
      { 
        accessorKey: "hmerominia_enarksis", 
        header: "Ημερομηνία Έναρξης Συνδρομής", 
        type: "date",
        defaultValue: new Date().toISOString(),
        validation: yup.date().required("Υποχρεωτικό")
      },
      { 
        accessorKey: "eidosSindromis", 
        header: "Είδος Συνδρομής",
        type: "select",
        options: subscriptionTypes.map(type => ({ value: type.titlos, label: type.titlos })),
        validation: yup.string().required("Υποχρεωτικό")
      }
    ];
  }, [difficultyLevels, subscriptionTypes, subscriptionStatuses]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Μέλη Συλλόγου ({data.length})
        </Typography>
        <DataTable
          data={data}
          columns={fields}
          detailPanelConfig={detailPanelConfig}
          getRowId={(row) => row.id_es_melous}
          initialState={{
            columnVisibility: {
              hmerominia_gennhshs: false,
              arithmos_mitroou: false,
              odos: false,
              tk: false,
              "melos.vathmos_diskolias.epipedo": false,
              eidosSindromis: false,
            },
            columnOrder: [
              "fullName",
              "patronimo",
              "melos.epafes.email",
              "melos.epafes.tilefono",
              "status",
              "eidosSindromis",
              "melos.vathmos_diskolias.epipedo",
              "arithmos_mitroou",
              "melos.sindromitis.exei.sindromi.eidos_sindromis.titlos",
              "mrt-actions",
            ]
          }}
          state={{ isLoading: loading }}
          onAddNew={() => setOpenAddDialog(true)}
          handleEditClick={handleEditClick}
          handleDelete={handleDelete}
        />

        <AddDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          handleAddSave={handleAddSave}
          fields={addFields}
        />

        <EditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          editValues={editValues}
          handleEditSave={handleEditSave}
          fields={[
            { 
              accessorKey: "onoma", 
              header: "Όνομα", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "epitheto", 
              header: "Επώνυμο", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "patronimo", 
              header: "Πατρώνυμο", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "email", 
              header: "Email", 
              validation: yup.string().email("Μη έγκυρο email").required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "tilefono", 
              header: "Τηλέφωνο", 
              validation: yup.string().matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία").required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "epipedo", 
              header: "Βαθμός Δυσκολίας", 
              type: "select",
              options: difficultyLevels.map(level => ({ 
                value: level.id_vathmou_diskolias, 
                label: `Βαθμός ${level.epipedo}` 
              })),
              validation: yup.number().min(1, "Ο βαθμός πρέπει να είναι τουλάχιστον 1") 
            },
            { 
              accessorKey: "arithmos_mitroou", 
              header: "Αριθμός Μητρώου" 
            },
            { 
              accessorKey: "odos", 
              header: "Οδός", 
              validation: yup.string().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "tk", 
              header: "ΤΚ", 
              validation: yup.number().required("Υποχρεωτικό") 
            },
            { 
              accessorKey: "eidosSindromis", 
              header: "Είδος Συνδρομής",
              type: "select",
              options: subscriptionTypes.map(type => ({ value: type.titlos, label: type.titlos })),
              validation: yup.string().required("Υποχρεωτικό")
            },
            { 
              accessorKey: "katastasi_sindromis", 
              header: "Κατάσταση Συνδρομής",
              type: "select",
              options: subscriptionStatuses,
              validation: yup.string().required("Υποχρεωτικό")
            }
          ]}
        />
      </Box>
    </LocalizationProvider>
  );
}