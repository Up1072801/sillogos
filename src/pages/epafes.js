import React, { useState } from "react";
import DataTable from "../components/DataTable/DataTable";
import AddDialog from "../components/DataTable/AddDialog";
import EditDialog from "../components/DataTable/EditDialog";
import { fakeEpafes } from "../data/fakeepafes";
import * as yup from "yup";

const fields = [
  {
    accessorKey: "firstName",
    header: "Όνομα",
    validation: yup.string().required("Το όνομα είναι υποχρεωτικό"),
    example: "π.χ. Γιάννης",
  },
  {
    accessorKey: "lastName",
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
    accessorKey: "phone",
    header: "Τηλέφωνο",
    validation: yup
      .string()
      .matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία")
      .required("Το τηλέφωνο είναι υποχρεωτικό"),
    example: "π.χ. 2101234567",
  },
];

export default function Epafes() {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [data, setData] = useState(fakeEpafes);
  const [editValues, setEditValues] = useState({});

  const handleAddSave = (newRow) => {
    setData((prevData) => [...prevData, { id: `epafes-${prevData.length + 1}`, ...newRow }]);
    setOpenAddDialog(false);
  };

  const handleEditClick = (row) => {
    setEditValues(row || {}); // Ορισμός των τιμών που θα επεξεργαστούμε
    setOpenEditDialog(true);
  };

  const handleEditSave = (updatedRow) => {
    setData((prevData) =>
      prevData.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
    setOpenEditDialog(false);
  };

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header">Επαφές</h2>
      </div>
      <DataTable
        data={data}
        columns={fields}
        onAddNew={() => setOpenAddDialog(true)}
        handleEditClick={handleEditClick}
      />
      <AddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        fields={fields}
        handleAddSave={handleAddSave}
      />
      <EditDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        editValues={editValues}
        handleEditSave={handleEditSave}
        fields={fields}
      />
    </div>
  );
}