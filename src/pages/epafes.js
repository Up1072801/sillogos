import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable";
import * as yup from "yup";
import api from '../utils/api';
import EditDialog from "../components/DataTable/EditDialog";
import AddDialog from "../components/DataTable/AddDialog";

const fields = [
  {
    accessorKey: "onoma",
    header: "Όνομα",
    validation: yup.string()
      .required("Το όνομα είναι υποχρεωτικό")
      .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο όνομα', 
        value => !value || !/[0-9]/.test(value)),
  },
  {
    accessorKey: "epitheto", 
    header: "Επώνυμο",
    validation: yup.string()
      .required("Το επώνυμο είναι υποχρεωτικό")
      .test('no-numbers', 'Δεν επιτρέπονται αριθμοί στο επώνυμο', 
        value => !value || !/[0-9]/.test(value)),
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
      }),
  },
  {
    accessorKey: "tilefono",
    header: "Τηλέφωνο",
    validation: yup
      .string()
      .nullable()
      .test('valid-phone', 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία και να περιέχει μόνο αριθμούς και το σύμβολο +', function(value) {
        if (!value || value === '') return true;
        const digitsOnly = value.replace(/[^0-9]/g, '');
        return /^[0-9+]+$/.test(value) && digitsOnly.length >= 10;
      }),
  },
  {
    accessorKey: "idiotita",
    header: "Ιδιότητα", 
    validation: yup.string(), // Αφαίρεση του .required()
  },
];

export default function Epafes() {
  const [data, setData] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/Repafes");
        setData(
          response.data.map((item) => ({
            ...item,
            id: item.id_epafis,
            tilefono: item.tilefono?.toString(),
            idiotita: item.idiotita || "Χωρίς Ιδιότητα",
            fullName: `${item.onoma} ${item.epitheto}`, // Υπολογισμός του fullName
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Σφάλμα κατά την ανάκτηση των δεδομένων");
      }
    };
    fetchData();
  }, []);

  const handleEditClick = (row) => {

  
    // Βεβαιωνόμαστε ότι έχουμε όλα τα απαραίτητα πεδία
    const editData = {
      id: row.id,
      id_epafis: row.id_epafis || row.id, // Διασφάλιση ότι έχουμε το σωστό ID
      onoma: row.onoma || "",
      epitheto: row.epitheto || "",
      email: row.email || "",
      tilefono: row.tilefono || "",
      idiotita: row.idiotita || ""
    };
    
    setCurrentRow(editData);
    setEditDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentRow({});
    setAddDialogOpen(true);
  };

  const handleEditSave = async (updatedRow) => {
    try {
  
      const { id, id_epafis, onoma, epitheto, email, tilefono, idiotita } = updatedRow;
  
      // Αν το id_epafis είναι undefined, χρησιμοποίησε το id
      const epafisId = id_epafis || id;
  
      if (!epafisId) {
        throw new Error("Το id_epafis είναι undefined");
      }
  
      // Ενημέρωση της επαφής στο backend
      const response = await api.put(`/Repafes/${epafisId}`, {
        onoma,
        epitheto,
        email,
        tilefono,
        idiotita,
      });
  
      // Ενημέρωση του state με τα νέα δεδομένα
      setData((prevData) =>
        prevData.map((item) =>
          item.id_epafis === epafisId
            ? {
                ...item,
                ...response.data,
                fullName: `${response.data.onoma} ${response.data.epitheto}`, // Ενημέρωση του fullName
              }
            : item
        )
      );
  
      setEditDialogOpen(false); // Κλείσιμο του διαλόγου επεξεργασίας
    } catch (error) {
      console.error("Σφάλμα ενημέρωσης:", error);
      setError("Σφάλμα κατά την ενημέρωση της επαφής");
    }
  };
  
  const handleAddSave = async (newRow) => {
    try {
      const response = await api.post("/Repafes", newRow);
      setData((prevData) => [
        ...prevData,
        {
          ...response.data,
          id: response.data.id_epafis,
          tilefono: response.data.tilefono?.toString(),
          idiotita: response.data.idiotita || "Χωρίς Ιδιότητα",
          fullName: `${response.data.onoma} ${response.data.epitheto}`, // Υπολογισμός του fullName
        },
      ]);
      setAddDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error("Error adding new contact:", error);
      setError("Σφάλμα κατά τη δημιουργία νέας επαφής");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/Repafes/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
      setError(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError("Σφάλμα κατά τη διαγραφή της επαφής");
    }
  };

  // Προσαρμογή των στηλών για την εμφάνιση του ονόματος και επωνύμου σε μία στήλη με sorting/φίλτρο όπως melitousillogou.js
  const columns = [
    {
      accessorKey: "fullName",
      header: "Όνοματεπώνυμο",
      Cell: ({ row }) => `${row.original.epitheto || ""} ${row.original.onoma || ""}`,
      filterFn: (row, id, filterValue) => {
        const name = `${row.original.epitheto || ""} ${row.original.onoma || ""}`.toLowerCase();
        return name.includes(filterValue.toLowerCase());
      },
      sortingFn: (rowA, rowB) => {
        const a = `${rowA.original.epitheto || ""} ${rowA.original.onoma || ""}`.toLowerCase();
        const b = `${rowB.original.epitheto || ""} ${rowB.original.onoma || ""}`.toLowerCase();
        return a.localeCompare(b, "el");
      }
    },
    ...fields.filter((field) => field.accessorKey !== "onoma" && field.accessorKey !== "epitheto"),
  ];

  // Αρχικό state για sorting με βάση το επώνυμο
  const tableInitialState = useMemo(() => ({
    sorting: [{ id: "fullName", desc: false }]
  }), []);

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header">Επαφές</h2>
        {error && <div style={{ color: "red", margin: "10px 0" }}>{error}</div>}
      </div>
      <DataTable
        data={data}
        columns={columns}
        enableExpand={false}
        enableEditMain={true}
        enableDelete={true}
        onAddNew={handleAddNew}
        handleEditClick={handleEditClick}
        handleDelete={handleDelete}
        deleteConfig={{
          getPayload: (row) => row.id,
        }}
        initialState={tableInitialState}
      />

      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        editValues={currentRow}
        handleEditSave={handleEditSave}
        fields={fields}
      />

      <AddDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        handleAddSave={handleAddSave}
        fields={fields}
      />
    </div>
  );
}