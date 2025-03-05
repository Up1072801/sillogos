import "./App.css";
import React from "react";
import DataTable from "../components/DataTable";
import CustomCalendar from "../components/CustomCalendar";
import fakeBookings from "../data/fakeBookings";

const columns = [
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
  { accessorKey: "capacity", label: "Χωρητικότητα" }
];

export default function Katafigio() {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: "50px", width: "100%", alignItems: "flex-start", padding: "0 20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "left" }}>Διαχείριση Κρατήσεων Καταφυγίου</h2>
      <div style={{ width: "100%" }}>
        <DataTable 
          data={fakeBookings || []} // ✅ Περνάμε τα αρχικά δεδομένα
          columns={columns} 
          detailFields={detailFields} 
        />
      </div>
      <CustomCalendar bookings={fakeBookings || []} /> {/* ✅ Το ημερολόγιο ενημερώνεται αυτόματα */}
    </div>
  );
}
