import "./App.css";
import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable";
import { fakeEpafes } from "../data/fakeEpafes";

const columns = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "city", header: "Πόλη" },
];

const extraColumns = [
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "registrationDate", header: "Ημερομηνία Εγγραφής" },
  { accessorKey: "status", header: "Κατάσταση" }
];

export default function Epafes() {

  const [epafes, setEpafes] = useState([...fakeEpafes]);

  useEffect(() => {
  }, []);

  const handleAddEpafi = (newEpafi) => {
  
    const newId = epafes.length > 0 ? Math.max(...epafes.map(e => Number(e.id))) + 1 : 1;
    const newEntry = { id: newId.toString(), ...newEpafi };

    const updatedEpafes = [...epafes, newEntry];
    setEpafes(updatedEpafes);

    fakeEpafes.length = 0; 
    fakeEpafes.push(...updatedEpafes);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px" }}>
      <h2 style={{ marginBottom: "20px" }}>Διαχείριση Επαφών</h2>
      <DataTable data={epafes} columns={columns} extraColumns={extraColumns} onAdd={handleAddEpafi} />
    </div>
  );
}
