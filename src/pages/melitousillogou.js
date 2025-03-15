import "./App.css";
import React, { useState } from "react";
import DataTable from "../components/DataTable/DataTable";
import EditDialog from "../components/DataTable/EditDialog";
import { fakeMeli } from "../data/fakemeli";
import * as yup from "yup";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { el } from "date-fns/locale";

const columns = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "id", header: "ID" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "job", header: "Επάγγελμα" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας", enableHiding: true },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου", enableHiding: true },
  { accessorKey: "katastasisindromis", header: "Κατάσταση Συνδρομής" },
  { accessorKey: "datepliromis", header: "Ημερομηνία Πληρωμής Συνδρομής", enableHiding: true },
  { accessorKey: "dategrafis", header: "Ημερομηνία Εγγραφής", enableHiding: true },
];

const validationSchema = yup.object({
  firstName: yup
    .string()
    .required("Το όνομα είναι υποχρεωτικό")
    .matches(/^[A-Za-zΑ-Ωα-ω\s]+$/, "Μόνο γράμματα επιτρέπονται"),
  lastName: yup
    .string()
    .required("Το επώνυμο είναι υποχρεωτικό")
    .matches(/^[A-Za-zΑ-Ωα-ω\s]+$/, "Μόνο γράμματα επιτρέπονται"),
  phone: yup
    .string()
    .required("Το τηλέφωνο είναι υποχρεωτικό")
    .matches(/^[0-9]{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία"),
  email: yup
    .string()
    .email("Μη έγκυρο email")
    .required("Το email είναι υποχρεωτικό"),
  job: yup
    .string()
    .required("Το επάγγελμα είναι υποχρεωτικό")
    .matches(/^[A-Za-zΑ-Ωα-ω\s]+$/, "Μόνο γράμματα επιτρέπονται"),
  vathmos: yup
    .number()
    .required("Ο βαθμός είναι υποχρεωτικός")
    .typeError("Πρέπει να είναι αριθμός"),
  arithmosmitroou: yup
    .number()
    .required("Ο αριθμός μητρώου είναι υποχρεωτικός")
    .typeError("Πρέπει να είναι αριθμός"),
  katastasisindromis: yup
    .string()
    .required("Η κατάσταση συνδρομής είναι υποχρεωτική")
    .matches(/^[A-Za-zΑ-Ωα-ω\s]+$/, "Μόνο γράμματα επιτρέπονται"),
  datepliromis: yup
    .date()
    .required("Η ημερομηνία πληρωμής είναι υποχρεωτική")
    .typeError("Πρέπει να είναι έγκυρη ημερομηνία"),
  dategrafis: yup
    .date()
    .required("Η ημερομηνία εγγραφής είναι υποχρεωτική")
    .typeError("Πρέπει να είναι έγκυρη ημερομηνία"),
});

export default function Meloi() {
  const [data, setData] = useState(fakeMeli);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState({});

  const handleEditClick = (row) => {
    setEditValues(row || {});
    setEditDialogOpen(true);
  };

  const handleEditSave = (updatedRow) => {
    setData((prevData) =>
      prevData.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
    setEditDialogOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <div className="container">
        <div className="header-container">
          <h2 className="header" role="heading" aria-level="2">
            Μέλη Συλλόγου <span className="record-count">({data.length})</span>
          </h2>
        </div>
        <div className="table-container">
          <DataTable
            data={data}
            columns={columns}
            onEditClick={handleEditClick}
            enableEditMain={true}
            enableDelete={true}
            enableFilter={true}
          />
        </div>
        <EditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          editValues={editValues}
          handleEditSave={handleEditSave}
          fields={[
            { accessorKey: "firstName", header: "Όνομα", validation: validationSchema.fields.firstName },
            { accessorKey: "lastName", header: "Επώνυμο", validation: validationSchema.fields.lastName },
            { accessorKey: "phone", header: "Τηλέφωνο", validation: validationSchema.fields.phone },
            { accessorKey: "email", header: "Email", validation: validationSchema.fields.email },
            { accessorKey: "job", header: "Επάγγελμα", validation: validationSchema.fields.job },
            { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας", validation: validationSchema.fields.vathmos },
            { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου", validation: validationSchema.fields.arithmosmitroou },
            { accessorKey: "katastasisindromis", header: "Κατάσταση Συνδρομής", validation: validationSchema.fields.katastasisindromis },
            { accessorKey: "datepliromis", header: "Ημερομηνία Πληρωμής Συνδρομής", validation: validationSchema.fields.datepliromis, type: "date" },
            { accessorKey: "dategrafis", header: "Ημερομηνία Εγγραφής", validation: validationSchema.fields.dategrafis, type: "date" },
          ]}
        />
      </div>
    </LocalizationProvider>
  );
}