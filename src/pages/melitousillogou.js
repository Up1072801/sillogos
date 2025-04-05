import React, { useState, useEffect } from "react";
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
  { accessorKey: "arithmos_mitroou", header: "Αριθμός Μητρώου" }, // Νέα στήλη
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
        { accessor: "drastiriotita.eksormisi.titlos", header: "Τίτλος Εξόρμησης" }, // Νέα στήλη
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/melitousillogou");
        console.log("Δεδομένα από το backend:", response.data); // Logging για έλεγχο
        setData(
          response.data.map((member) => ({
            ...member,
            id: member.id_es_melous, // Βεβαιώσου ότι το ID περιλαμβάνεται
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
      await axios.post("http://localhost:5000/api/melitousillogou", {
        ...newRow,
        epafes: {
          onoma: newRow.onoma,
          epitheto: newRow.epitheto,
          email: newRow.email,
          tilefono: newRow.tilefono
        }
      });
      setOpenAddDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Σφάλμα προσθήκης:", error);
    }
  };
  const handleEditClick = (row) => {
    console.log("Row προς επεξεργασία:", row); // Logging για έλεγχο
    setEditValues({
      ...row,
      id_es_melous: row.id_es_melous || row.id,
      onoma: row.melos?.epafes?.onoma || "",
      epitheto: row.melos?.epafes?.epitheto || "",
      email: row.melos?.epafes?.email || "",
      tilefono: row.melos?.epafes?.tilefono || "",
      epipedo: row.melos?.vathmos_diskolias?.epipedo || "",
      patronimo: row.patronimo || "",
      odos: row.odos || "",
      tk: row.tk || "",
      arithmos_mitroou: row.arithmos_mitroou || "",
      eidosSindromis: row.eidosSindromis || "", // Προσθήκη του πεδίου
    });
    setOpenEditDialog(true);
  };

  const handleEditSave = async (updatedRow) => {
    try {
      const requestData = {
        epafes: {
          onoma: updatedRow.onoma,
          epitheto: updatedRow.epitheto,
          email: updatedRow.email,
          tilefono: updatedRow.tilefono,
        },
        vathmos_diskolias: updatedRow.epipedo ? {
          epipedo: parseInt(updatedRow.epipedo)
        } : undefined,
        patronimo: updatedRow.patronimo,
        arithmos_mitroou: updatedRow.arithmos_mitroou,
        odos: updatedRow.odos,
        tk: updatedRow.tk,
        eidosSindromis: updatedRow.eidosSindromis, // Προσθήκη του πεδίου
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
                epipedo: parseInt(updatedRow.epipedo)
              } : item.melos?.vathmos_diskolias,
            },
            eidosSindromis: updatedRow.eidosSindromis, // Ενημέρωση του πεδίου
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
      // Προσθήκη ελέγχου για έγκυρο ID
      if (!id || isNaN(id)) {
        console.error("Invalid ID");
        return;
      }
  
      // Κάνε το αίτημα διαγραφής στο backend
      await axios.delete(`http://localhost:5000/api/melitousillogou/${id}`);
  
      // Ενημέρωσε το state αφαιρώντας το διαγραμμένο στοιχείο
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

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
          // Προσθήκη row ID configuration
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
          fields={fields.filter(f => !f.accessorKey.includes('melos.'))}
          handleAddSave={handleAddSave}
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
      validation: yup.string().required("Υποχρεωτικό") // Προσθήκη validation
    },
  ]}
/>
      </Box>
    </LocalizationProvider>
  );
}