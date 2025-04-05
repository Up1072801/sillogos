import "./App.css";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";

const sxolesColumns = [
  { accessorKey: "onoma", header: "Όνομα", Cell: ({ row }) => <Link to={`/sxoles/${row.original.id}`}>{row.original.onoma}</Link> },
  { accessorKey: "klados", header: "Κλάδος" },
  { accessorKey: "epipedo", header: "Επίπεδο" },
  { accessorKey: "timi", header: "Τιμή" },
  { accessorKey: "etos", header: "Έτος" },
  { accessorKey: "seira", header: "Σειρά" },
  { accessorKey: "simmetoxes", header: "Συμμετοχές" },
];

const sxolesDetailFields = [
  { accessorKey: "topothesia", header: "Τοποθεσία" },
  { accessorKey: "imerominia_enarksis", header: "Ημερομηνία Έναρξης" },
  { accessorKey: "imerominia_liksis", header: "Ημερομηνία Λήξης" },
];

export default function Sxoles() {
  const [sxolesData, setSxolesData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:5000/api/sxoles");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSxolesData(data);
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
          Σχολές <span className="record-count">({sxolesData.length})</span>
        </h2>
      </div>
      <div className="table-container">
        <DataTable
          data={sxolesData}
          columns={sxolesColumns}
          extraColumns={[]}
          detailFields={sxolesDetailFields}
          initialState={{}}
          enableExpand={true}
          enableView={true}
          enableDelete={true}
          enableEditMain={true}
          enableEditExtra={false}
          enableFilter={true}
        />
      </div>
    </div>
  );
}