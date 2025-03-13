import "./App.css";
import React, { useCallback } from "react";
import DataTable from "../components/DataTable/DataTable"; // Ενημέρωση της διαδρομής εισαγωγής του DataTable
import { fakeEksoplismos, fakeDaneismosEksoplismou } from "../data/fakeeksoplismos"; // Χρήση ονομαστικών εξαγωγών
const columns = [
  { accessorKey: "Name", header: "Όνομα" },
  { accessorKey: "marka", header: "Μάρκα" },
  { accessorKey: "xroma", header: "Χρώμα" },
  { accessorKey: "megethos", header: "Μέγεθος" },
  { accessorKey: "imerominiakataskeuis", header: "Ημερομηνία Κατασκευής", enableHiding: true },
];

const newcolumns = [
  { accessorKey: "Name", header: "Δανειζόμενος" },
  { accessorKey: "nameeksoplismou", header: "Όνομα Εξοπλισμού" },
  { accessorKey: "imerominiadaneismou", header: "Ημερομηνία Δανεισμού" },
  { accessorKey: "imerominiaepistrofis", header: "Ημερομηνία Επιστροφής" },
];

export default function Eksoplismos() {
  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Εξοπλισμός <span className="record-count">({fakeEksoplismos.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeEksoplismos || []}
          columns={columns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{
            columnVisibility: {
              imerominiakataskeuis: false,
            },
          }}
          enableExpand={false}
          enableView={false}
          enableDelete={true}
          enableFilter={true}
        />
      </div>
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Δανεισμοί <span className="record-count">({fakeDaneismosEksoplismou.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeDaneismosEksoplismou || []}
          columns={newcolumns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{}}
          enableExpand={false}
          enableView={false}
          enableEditMain = {true}
          enableEditExtra = {false}
                    enableDelete={false}
          enableFilter={true}
        />
      </div>
    </div>
  );
}