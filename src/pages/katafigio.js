import "./App.css";
import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable/DataTable";
import CustomCalendar from "../components/CustomCalendar";

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "arrival", header: "Ημ. Άφιξης" },
  { accessorKey: "departure", header: "Ημ. Αναχώρησης" },
  { accessorKey: "people", header: "Άτομα" },
  { accessorKey: "capacity", header: "Χωρητικότητα" },
];

const detailFields = [
  { accessorKey: "id", label: "ID" },
  { accessorKey: "arrival", label: "Ημ. Άφιξης" },
  { accessorKey: "departure", label: "Ημ. Αναχώρησης" },
  { accessorKey: "people", label: "Άτομα" },
  { accessorKey: "capacity", label: "Χωρητικότητα" },
];

export default function Katafigio() {
  const [bookings, setBookings] = useState([]);

  // Φόρτωση δεδομένων από το backend
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:5000/api/katafigio");
        const data = await response.json();
        setBookings(data);
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
          Διαχείριση Κρατήσεων Καταφυγίου <span className="record-count">({bookings.length})</span>
        </h2>
      </div>
      <div className="table-container">
        <DataTable
          data={bookings}
          columns={columns}
          detailFields={detailFields}
        />
      </div>
      <div className="calendar-container">
        <CustomCalendar bookings={bookings} />
      </div>
    </div>
  );
}