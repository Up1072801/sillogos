import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";

export default function SchoolDetails() {
  const { id } = useParams();
  const [school, setSchool] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`http://localhost:5000/api/sxoles/${id}`);
        const data = await response.json();
        setSchool(data);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      }
    }
    fetchData();
  }, [id]);

  if (!school) {
    return <div>Η σχολή δεν βρέθηκε.</div>;
  }

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">{school.onoma}</h2>
      </div>
      <div className="details-container">
        <p><strong>Κλάδος:</strong> {school.klados}</p>
        <p><strong>Επίπεδο:</strong> {school.epipedo}</p>
        <p><strong>Τοποθεσία:</strong> {school.topothesia}</p>
        <p><strong>Ημερομηνία Έναρξης:</strong> {school.imerominia_enarksis}</p>
        <p><strong>Ημερομηνία Λήξης:</strong> {school.imerominia_liksis}</p>
      </div>
      <div className="table-container">
        <h3>Εκπαιδευτές</h3>
        <DataTable
          data={school.ekpaideutes || []}
          columns={[
            { accessorKey: "firstName", header: "Όνομα" },
            { accessorKey: "lastName", header: "Επώνυμο" },
            { accessorKey: "email", header: "Email" },
            { accessorKey: "phone", header: "Τηλέφωνο" },
          ]}
          enableExpand={false}
          enableView={false}
          enableDelete={false}
          enableFilter={false}
        />
      </div>
    </div>
  );
}