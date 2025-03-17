import "./App.css";
import React from "react";
import DataTable from "../components/DataTable/DataTable"; // Ενημέρωση της διαδρομής εισαγωγής του DataTable
import { fakeMeliAllwn } from "../data/fakeMeliallwn"; // Χρήση ονομαστικών εξαγωγών

  const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας", enableHiding: true },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου", enableHiding: true },
  { accessorKey: "onomasillogou", header: "Όνομα Συλλόγου" },
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
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου" },
  { accessorKey: "onomasillogou", header: "Όνομα Συλλόγου" }
];

export default function MeloiAllwn() {
  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Μέλη άλλων συλλόγων <span className="record-count">({fakeMeliAllwn.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeMeliAllwn || []}
          columns={columns}
          extraColumns={extraColumns}
          detailFields={detailFields}
          initialState={{
            columnVisibility: {
              vathmos: false,
              arithmosmitroou: false,
            },
          }}
          enableExpand={true}
          enableView={false}
          enableDelete={true}
                    enableEditMain = {true}
                    enableEditExtra = {false}
          enableFilter={true}
        />
      </div>
    </div>
  );
}