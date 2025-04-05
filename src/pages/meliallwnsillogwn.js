import "./App.css";
import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου", enableHiding: true },
  { accessorKey: "onomasillogou", header: "Όνομα Συλλόγου" },
];

export default function MeloiAllwn() {
  const [data, setData] = useState([]);

  // Φόρτωση δεδομένων από το backend
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:5000/api/meliallwnsillogwn");
        const members = await response.json();
        setData(members);
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
          Μέλη άλλων συλλόγων <span className="record-count">({data.length})</span>
        </h2>
      </div>
      <div className="table-container">
        <DataTable
          data={data}
          columns={columns}
          enableExpand={true}
          enableView={false}
          enableDelete={true}
          enableEditMain={true}
          enableEditExtra={false}
          enableFilter={true}
        />
      </div>
    </div>
  );
}