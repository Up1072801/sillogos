import "./App.css";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";

const eksormiseisColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "onoma", header: "Όνομα", Cell: ({ row }) => <Link to={`/eksormiseis/${row.original.id}`}>{row.original.onoma}</Link> },
  { accessorKey: "topothesia", header: "Τοποθεσία" },
  { accessorKey: "imerominia_enarksis", header: "Ημερομηνία Έναρξης" },
  { accessorKey: "imerominia_liksis", header: "Ημερομηνία Λήξης" },
  { accessorKey: "kostos", header: "Κόστος" },
];

export default function Eksormiseis() {
  const [eksormiseisData, setEksormiseisData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:5000/api/eksormiseis");
        const data = await response.json();
        setEksormiseisData(data);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Εξορμήσεις <span className="record-count">({eksormiseisData.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={eksormiseisData}
          columns={eksormiseisColumns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{}}
          enableExpand={false}
          enableEditMain={true}
          enableEditExtra={false}
          enableDelete={true}
          enableFilter={true}
        />
      </div>
    </div>
  );
}