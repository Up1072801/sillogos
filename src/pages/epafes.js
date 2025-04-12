import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";
import * as yup from "yup";
import axios from "axios";
import EditDialog from "../components/DataTable/EditDialog";
import AddDialog from "../components/DataTable/AddDialog";

const fields = [
  {
    accessorKey: "onoma",
    header: "Όνομα",
    validation: yup.string().required("Το όνομα είναι υποχρεωτικό"),
    example: "π.χ. Γιάννης",
  },
  {
    accessorKey: "epitheto",
    header: "Επώνυμο",
    validation: yup.string().required("Το επώνυμο είναι υποχρεωτικό"),
    example: "π.χ. Παπαδόπουλος",
  },
  {
    accessorKey: "email",
    header: "Email",
    validation: yup.string().email("Μη έγκυρο email").required("Το email είναι υποχρεωτικό"),
    example: "π.χ. example@email.com",
  },
  {
    accessorKey: "tilefono",
    header: "Τηλέφωνο",
    validation: yup
      .string()
      .matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία")
      .required("Το τηλέφωνο είναι υποχρεωτικό"),
    example: "π.χ. 2101234567",
  },
  {
    accessorKey: "idiotita",
    header: "Ιδιότητα",
    validation: yup.string().required("Η ιδιότητα είναι υποχρεωτική"),
    example: "π.χ. Μέλος",
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
        const response = await axios.get("http://localhost:5000/api/Repafes");
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
    console.log("Editing contact:", row);
    
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
    
    console.log("Prepared contact edit data:", editData);
    setCurrentRow(editData);
    setEditDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentRow({});
    setAddDialogOpen(true);
  };

  const handleEditSave = async (updatedRow) => {
    try {
      console.log("Updated Row:", updatedRow); // Επαλήθευση του updatedRow
  
      const { id, id_epafis, onoma, epitheto, email, tilefono, idiotita } = updatedRow;
  
      // Αν το id_epafis είναι undefined, χρησιμοποίησε το id
      const epafisId = id_epafis || id;
  
      if (!epafisId) {
        throw new Error("Το id_epafis είναι undefined");
      }
  
      console.log("Αποστολή δεδομένων:", {
        onoma,
        epitheto,
        email,
        tilefono,
        idiotita,
      });
  
      // Ενημέρωση της επαφής στο backend
      const response = await axios.put(`http://localhost:5000/api/Repafes/${epafisId}`, {
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
      const response = await axios.post("http://localhost:5000/api/Repafes", newRow);
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
      await axios.delete(`http://localhost:5000/api/Repafes/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
      setError(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError("Σφάλμα κατά τη διαγραφή της επαφής");
    }
  };

  // Προσαρμογή των στηλών για την εμφάνιση του ονόματος και επωνύμου σε μία στήλη
  const columns = [
    {
      accessorKey: "fullName",
      header: "Όνοματεπώνυμο",
    },
    ...fields.filter((field) => field.accessorKey !== "onoma" && field.accessorKey !== "epitheto"), // Αφαίρεση των πεδίων "onoma" και "epitheto"
  ];

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
          getPayload: (row) => row.id, // Διόρθωση για σωστή διαγραφή
        }}
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