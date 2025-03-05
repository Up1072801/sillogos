import "./App.css";
import React from "react";
import DataTable from "../components/DataTable";
import { fakeMeli } from "../data/fakemeli";

const columns = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "fathersname", header: "Πατρώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "job", header: "Επάγγελμα" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου", enableHiding: true, isVisible: false },
  { accessorKey: "katastasisindromis", header: "Κατάσταση Συνδρομής", enableHiding: true, isVisible: false },
];

const extraColumns = [
  [
    { accessorKey: "drastirioties", header: "Δραστηριότητες" },
  ],
  [
    { accessorKey: "sxoles", header: "Σχολές" },
  ]
];

const detailFields = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "fathersname", header: "Πατρώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "job", header: "Επάγγελμα" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου" },
  { accessorKey: "katastasisindromis", header: "Κατάσταση Συνδρομής" },
  { accessorKey: "datepliromis", header: "Ημερομηνία Πληρωμής Συνδρομής" },
  { accessorKey: "dategrafis", header: "Ημερομηνία Εγγραφής" },
];

export default function melitousillogou() {
  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header">Μέλη του Συλλόγου</h2>
        <div className="record-count">{fakeMeli.length} </div>
      </div>
      <div className="table-container">
        <DataTable 
          data={fakeMeli || []} // ✅ Περνάμε τα αρχικά δεδομένα, αποφεύγοντας undefined errors
          columns={columns} 
          extraColumns={extraColumns} 
          detailFields={detailFields} 
        />
      </div>
    </div>
  );
}