import "./App.css";
import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";

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
  const [eksoplismosData, setEksoplismosData] = useState([]);
  const [daneismoiData, setDaneismoiData] = useState([]);

  // Φόρτωση δεδομένων από το backend
  useEffect(() => {
    async function fetchData() {
      try {
        const eksoplismosResponse = await fetch("http://localhost:5000/api/eksoplismos");
        const eksoplismos = await eksoplismosResponse.json();
        setEksoplismosData(eksoplismos);

        const daneismoiResponse = await fetch("http://localhost:5000/api/eksoplismos/daneismoi");
        const daneismoi = await daneismoiResponse.json();
        setDaneismoiData(daneismoi);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">
          Εξοπλισμός <span className="record-count">({eksoplismosData.length})</span>
        </h2>
      </div>
      <div className="table-container">
        <DataTable
          data={eksoplismosData}
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
        <h2 className="header" role="heading" aria-level="2">
          Δανεισμοί <span className="record-count">({daneismoiData.length})</span>
        </h2>
      </div>
      <div className="table-container">
        <DataTable
          data={daneismoiData}
          columns={newcolumns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{}}
          enableExpand={false}
          enableView={false}
          enableEditMain={true}
          enableEditExtra={false}
          enableDelete={false}
          enableFilter={true}
        />
      </div>
    </div>
  );
}