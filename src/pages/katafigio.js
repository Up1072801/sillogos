import "./App.css";
import React, { useCallback } from "react";
import DataTable from "../components/DataTable/DataTable";
import CustomCalendar from "../components/CustomCalendar";
import { fakeBookings } from "../data/fakeBookings"; // Ενημερωμένη εισαγωγή

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
  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Διαχείριση Κρατήσεων Καταφυγίου</h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeBookings || []}
          columns={columns}
          detailFields={detailFields}
        />
      </div>
      <div className="calendar-container">
        <CustomCalendar bookings={fakeBookings || []} />
      </div>
    </div>
  );
}