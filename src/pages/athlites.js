import "./App.css";
import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας", enableHiding: true },
  { accessorKey: "arithmosdeltiou", header: "Αριθμός Δελτίου", enableHiding: true },
  { accessorKey: "hmerominiaenarksis", header: "Ημερομηνία Εναρξης", enableHiding: true },
  { accessorKey: "hmerominialiksis", header: "Ημερομηνία Λήξης", enableHiding: true },
  { accessorKey: "athlima", header: "Άθλημα" },
  { accessorKey: "totalParticipation", header: "Συμμετοχές σε Αγώνες" },
];

const sportsColumns = [
  { accessorKey: "athlima", header: "Άθλημα" },
  { accessorKey: "participants", header: "Συμμετέχοντες" },
];

export default function Athlites() {
  const [athletesData, setAthletesData] = useState([]);
  const [sportsData, setSportsData] = useState([]);

  // Φόρτωση δεδομένων από το backend
  useEffect(() => {
    async function fetchData() {
      try {
        const athletesResponse = await fetch("http://localhost:5000/api/athlites/athletes");
        const athletes = await athletesResponse.json();
        setAthletesData(athletes);

        const sportsResponse = await fetch("http://localhost:5000/api/athlites/sports");
        const sports = await sportsResponse.json();
        setSportsData(sports);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Αθλητές</h2>
      </div>
      <div className="table-container">
        <DataTable
          data={athletesData}
          columns={columns}
          enableExpand={true}
          enableEditMain={true}
          enableDelete={true}
          enableFilter={true}
        />
      </div>
      <div className="table-container" style={{ marginTop: "20px" }}>
        <h3>Αθλήματα</h3>
        <DataTable
          data={sportsData}
          columns={sportsColumns}
          enableExpand={false}
          enableEditMain={false}
          enableDelete={false}
          enableFilter={false}
        />
      </div>
    </div>
  );
}