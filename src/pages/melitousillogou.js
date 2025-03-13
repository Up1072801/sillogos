import "./App.css";
import React from "react";
import DataTable from "../components/DataTable/DataTable"; // Ενημέρωση της διαδρομής εισαγωγής του DataTable
import { fakeMeli } from "../data/fakemeli"; // Χρήση ονομαστικών εξαγωγών

const columns = [
  { accessorKey: "firstName", header: "Όνομα" },
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

const extraColumns = [
  [
    { accessorKey: "drastirioties", header: "Δραστηριότητες", Cell: ({ row }) => row.original.drastirioties.join(", "), enableEdit: true },
  ],
  [
    { accessorKey: "sxoles", header: "Σχολές", Cell: ({ row }) => row.original.sxoles.join(", "), enableEdit: false },
  ]
];

const detailFields = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "job", header: "Επάγγελμα" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου" },
  { accessorKey: "katastasisindromis", header: "Κατάσταση Συνδρομής" },
  { accessorKey: "datepliromis", header: "Ημερομηνία Πληρωμής Συνδρομής" },
  { accessorKey: "dategrafis", header: "Ημερομηνία Εγγραφής" }
];

export default function Meloi() {
  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Μέλη Συλλόγου <span className="record-count">({fakeMeli.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeMeli || []}
          columns={columns}
          extraColumns={extraColumns}
          detailFields={detailFields}
          initialState={{
            columnVisibility: {
              vathmos: false,
              arithmosmitroou: false,
              datepliromis: false,
              dategrafis: false,
            },
          }}
          enableExpand={true}
          enableView={false}
          enableEditMain = {true}
          enableEditExtra = {false}
                    enableDelete={true}
          enableFilter={true}
        />
      </div>
    </div>
  );
}