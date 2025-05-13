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
  { 
    accessorKey: "subscriptionEndDate", 
    header: "Λήξη Συνδρομής"
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
    },
    {
      accessor: "subscriptionEndDate",
      header: "Ημερομηνία Λήξης"
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
      getData: (row) => row.melos?.simmetoxi || [],
      // Προσθήκη για αποτροπή clickable εμφάνισης
      noRowHover: true,
      noRowClick: true
    },
    {
      title: "Σχολές",
      accessor: "melos.parakolouthisi",
      columns: [
        { accessor: "sxoli.epipedo", header: "Επίπεδο" },
        { accessor: "sxoli.klados", header: "Κλάδος" },
      ],
      getData: (row) => row.melos?.parakolouthisi || [],
      // Προσθήκη για αποτροπή clickable εμφάνισης
      noRowHover: true,
      noRowClick: true
    },
  ],
};

// Αυτή τη συνάρτηση πρέπει να προσθέσετε ή να διορθώσετε στο component
const calculateSubscriptionEndDate = (startDateStr) => {
  if (!startDateStr) return "Άγνωστη";
  
  const startDate = new Date(startDateStr);
  const startYear = startDate.getFullYear();
  const juneFirst = new Date(startYear, 5, 1); // Ιούνιος είναι ο μήνας 5 (0-11)
  
  // Αν η ημερομηνία έναρξης είναι μετά την 1η Ιουνίου, λήγει στο τέλος του επόμενου έτους
  if (startDate >= juneFirst) {
    return `31/12/${startYear + 1}`;
  } else {
    // Αλλιώς λήγει στο τέλος του τρέχοντος έτους
    return `31/12/${startYear}`;
  }
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
  
  // Νέα state για τις προτιμήσεις του πίνακα
  // Αφαιρούμε τη χειροκίνητη διαχείριση των προτιμήσεων καθώς τώρα γίνεται στο DataTable component
  // const [tablePreferences, setTablePreferences] = useState(() => {...});
  // useEffect(() => {...}, [tablePreferences]);
  // const handleTablePreferenceChange = (type, value) => {...};

  const tableInitialState = useMemo(() => ({
    columnOrder: [
      "fullName",
      "patronimo",
      "melos.epafes.email",
      "melos.epafes.tilefono",
      "status",
      "eidosSindromis",
      "melos.vathmos_diskolias.epipedo",
      "arithmos_mitroou",
      "mrt-actions",
    ],
    columnVisibility: {
      // Κρύψιμο των ζητούμενων στηλών
      "patronimo": false,
      "eidosSindromis": false,
      "melos.vathmos_diskolias.epipedo": false,
      "odos": false,
      "tk": false,
      "subscriptionEndDate": false
    }
  }), []); // Το άδειο array εξαρτήσεων εξασφαλίζει ότι δημιουργείται μόνο μία φορά

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
            status: member.athlitis ? "Αθλητής" : member.sindromitis?.katastasi_sindromis || "-",
            hmerominia_egrafis: member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis
              ? new Date(member.sindromitis.exei[0].sindromi.hmerominia_enarksis).toLocaleDateString("el-GR")
              : "-",
            hmerominia_pliromis: member.hmerominia_pliromis
              ? new Date(member.hmerominia_pliromis).toLocaleDateString("el-GR")
              : "-",
            subscriptionEndDate: calculateSubscriptionEndDate(member.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis),
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

      // Διασφάλιση έγκυρου ID βαθμού δυσκολίας (σημαντικό!)
      let difficultyId = 1; // Προεπιλογή
      
      if (newRow.epipedo) {
        // Απευθείας μετατροπή σε αριθμό (χωρίς τη χρήση του find)
        difficultyId = parseInt(newRow.epipedo);
        console.log("Επιλεγμένος βαθμός δυσκολίας ID:", difficultyId);
      }

      // Διασφάλιση ότι οι ημερομηνίες είναι σε σωστή μορφή ISO
      const formattedBirthDate = newRow.hmerominia_gennhshs 
        ? new Date(newRow.hmerominia_gennhshs).toISOString() 
        : today;

      const formattedStartDate = newRow.hmerominia_enarksis 
        ? new Date(newRow.hmerominia_enarksis).toISOString()
        : today;
        
      const formattedPaymentDate = newRow.hmerominia_pliromis 
        ? new Date(newRow.hmerominia_pliromis).toISOString()
        : today;

      // Προσαρμοσμένα δεδομένα για το backend
      const requestData = {
        epafes: {
          onoma: newRow.onoma,
          epitheto: newRow.epitheto,
          email: newRow.email || "",
          tilefono: newRow.tilefono || "",
        },
        melos: {
          tipo_melous: "esoteriko",
          vathmos_diskolias: {
            id_vathmou_diskolias: difficultyId // Απευθείας χρήση του ID
          }
        },
        esoteriko_melos: {
          hmerominia_gennhshs: formattedBirthDate,
          patronimo: newRow.patronimo || "",
          odos: newRow.odos || "",
          tk: newRow.tk ? parseInt(newRow.tk) : 0,
          arithmos_mitroou: newRow.arithmos_mitroou ? parseInt(newRow.arithmos_mitroou) : 0,
        },
        sindromitis: {
          katastasi_sindromis: newRow.katastasi_sindromis || "Ενεργή",
          exei: {
            hmerominia_pliromis: formattedPaymentDate,
            sindromi: {
              hmerominia_enarksis: formattedStartDate,
              eidos_sindromis: newRow.eidosSindromis,
            },
          },
        },
      };

      console.log("Αποστέλλονται δεδομένα:", requestData);
      
      const response = await axios.post("http://localhost:5000/api/melitousillogou", requestData);
      console.log("Απάντηση:", response.data);
      
      // Κλείσιμο του dialog
      setOpenAddDialog(false);
      
      // Αντί για επαναφόρτωση της σελίδας, προσθέτουμε το νέο μέλος στον πίνακα
      if (response.data) {
        const newMember = {
          ...response.data,
          id: response.data.id_es_melous,
          fullName: `${response.data.melos?.epafes?.onoma || ""} ${response.data.melos?.epafes?.epitheto || ""}`.trim(),
          email: response.data.melos?.epafes?.email || "-",
          tilefono: response.data.melos?.epafes?.tilefono || "-",
          odos: response.data.odos || "-",
          tk: response.data.tk || "-",
          arithmos_mitroou: response.data.arithmos_mitroou || "-",
          eidosSindromis: newRow.eidosSindromis || "-",
          status: response.data.athlitis ? "Αθλητής" : response.data.sindromitis?.katastasi_sindromis || "-",
          hmerominia_egrafis: response.data.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis
            ? new Date(response.data.sindromitis.exei[0].sindromi.hmerominia_enarksis).toLocaleDateString("el-GR")
            : "-",
          hmerominia_pliromis: response.data.hmerominia_pliromis
            ? new Date(response.data.hmerominia_pliromis).toLocaleDateString("el-GR")
            : "-",
          subscriptionEndDate: calculateSubscriptionEndDate(response.data.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis),
        };
        
        // Προσθήκη στα υπάρχοντα δεδομένα
        setData(prevData => [...prevData, newMember]);
      }
      
      // ΑΦΑΙΡΕΣΗ αυτής της γραμμής:
      // window.location.reload();
    } catch (error) {
      console.error("Σφάλμα προσθήκης:", error);
      if (error.response && error.response.data) {
        console.error("Λεπτομέρειες σφάλματος:", error.response.data);
        alert(`Σφάλμα: ${error.response.data.details || error.response.data.error || "Άγνωστο σφάλμα"}`);
      }
    }
  };

  const handleEditClick = (row) => {
    console.log("Editing member:", row);
    
    // Εξαγωγή των τιμών που χρειαζόμαστε για την επεξεργασία
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
      // Μορφοποίηση των ημερομηνιών για τη φόρμα επεξεργασίας
      hmerominia_enarksis: row.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis ? 
        new Date(row.sindromitis.exei[0].sindromi.hmerominia_enarksis).toISOString().split('T')[0] : "",
      hmerominia_pliromis: row.sindromitis?.exei?.[0]?.hmerominia_pliromis ? 
        new Date(row.sindromitis.exei[0].hmerominia_pliromis).toISOString().split('T')[0] : "",
      // Επιπλέον πεδία για συμβατότητα με τη φόρμα επεξεργασίας
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
      const id = editValues.id_es_melous || editValues.id;
      
      if (!id) {
        console.error("No ID provided for update");
        alert("Σφάλμα: Δεν βρέθηκε το ID μέλους");
        return;
      }

      // Εύρεση του αντικειμένου βαθμού δυσκολίας με βάση το ID
      const selectedDifficultyLevel = difficultyLevels.find(
        level => level.id_vathmou_diskolias === parseInt(updatedRow.epipedo)
      );

      // Μετατροπή των αριθμητικών πεδίων σε αριθμούς
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
        arithmos_mitroou: updatedRow.arithmos_mitroou ? parseInt(updatedRow.arithmos_mitroou) : undefined,
        odos: updatedRow.odos,
        tk: updatedRow.tk ? parseInt(updatedRow.tk) : undefined,
        
        // Αυτά τα πεδία πρέπει να πάνε στο sindromitis και sindromi μέσω του exei
        sindromitis: {
          katastasi_sindromis: updatedRow.katastasi_sindromis,
          exei: {
            sindromi: {
              hmerominia_enarksis: updatedRow.hmerominia_enarksis
            },
            hmerominia_pliromis: updatedRow.hmerominia_pliromis
          }
        },
        eidosSindromis: updatedRow.eidosSindromis
      };

      console.log("Αποστέλλονται δεδομένα ενημέρωσης:", requestData, "για ID:", id);
      
      const response = await axios.put(`http://localhost:5000/api/melitousillogou/${id}`, requestData);
      console.log("Απάντηση από API:", response.data);
      
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
              exei: [{
                ...item.sindromitis?.exei?.[0],
                hmerominia_pliromis: updatedRow.hmerominia_pliromis || item.sindromitis?.exei?.[0]?.hmerominia_pliromis,
                sindromi: {
                  ...item.sindromitis?.exei?.[0]?.sindromi,
                  hmerominia_enarksis: updatedRow.hmerominia_enarksis || item.sindromitis?.exei?.[0]?.sindromi?.hmerominia_enarksis,
                  eidos_sindromis: updatedRow.eidosSindromis
                }
              }]
            }
          } : item
        )
      );

      setOpenEditDialog(false);
    } catch (error) {
      console.error("Σφάλμα ενημέρωσης:", error);
      if (error.response && error.response.data) {
        console.error("Λεπτομέρειες σφάλματος:", error.response.data);
        alert(`Σφάλμα: ${error.response.data.details || error.response.data.error || "Άγνωστο σφάλμα"}`);
      } else {
        alert("Σφάλμα κατά την ενημέρωση του μέλους.");
      }
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
          tableName="melitousillogou"
          initialState={tableInitialState} // <-- Χρήση του useMemo αντικειμένου
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
            },
            // Προσθήκη των πεδίων ημερομηνίας
            { 
              accessorKey: "hmerominia_enarksis", 
              header: "Ημερομηνία Έναρξης Συνδρομής", 
              type: "date",
              validation: yup.date()
            },
            { 
              accessorKey: "hmerominia_pliromis", 
              header: "Ημερομηνία Πληρωμής", 
              type: "date",
              validation: yup.date()
            }
          ]}
        />
      </Box>
    </LocalizationProvider>
  );
}