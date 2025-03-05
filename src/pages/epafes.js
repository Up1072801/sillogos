import "./App.css";
import React from "react";
import DataTable from "../components/DataTable";
import { fakeEpafes } from "../data/fakeEpafes";

const columns = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
];

const extraColumns = [
  [
    { accessorKey: "phone", header: "Τηλέφωνο" },
    { accessorKey: "email", header: "Email" }
  ],
  [
    { accessorKey: "address", header: "Διεύθυνση" },
    { accessorKey: "city", header: "Πόλη" }
  ]
];

const detailFields = [
  { accessorKey: "id", label: "ID" },
  { accessorKey: "firstName", label: "Όνομα" },
  { accessorKey: "lastName", label: "Επώνυμο" },
  { accessorKey: "email", label: "Email" },
  { accessorKey: "city", label: "Πόλη" }
];

export default function Epafes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: "50px", width: "100%", alignItems: "flex-start", padding: "0 20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "left" }}>Διαχείριση Επαφών</h2>
      <div style={{ width: "100%" }}>
        <DataTable 
          data={fakeEpafes || []} // ✅ Περνάμε τα αρχικά δεδομένα, αποφεύγοντας undefined errors
          columns={columns} 
          extraColumns={extraColumns} 
          detailFields={detailFields} 
        />
      </div>
    </div>
  );
}
