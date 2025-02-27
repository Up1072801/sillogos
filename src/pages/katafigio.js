import "./App.css";
import React, { useState, useEffect } from "react";
import DataTable from "../components/DataTable";
import CustomCalendar from "../components/CustomCalendar";
import fakeBookings from "../data/fakeBookings";

function Katafigio() {
  const [bookings, setBookings] = useState([...fakeBookings]); 

  const handleAddBooking = (newBooking) => {
    const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
    const newEntry = { id: newId, ...newBooking };
    const updatedBookings = [...bookings, newEntry];
    setBookings(updatedBookings);
    fakeBookings.push(newEntry); 
};


  const columns = [
    { accessorKey: "arrival", header: "Ημ. Άφιξης" },
    { accessorKey: "departure", header: "Ημ. Αναχώρησης" },
    { accessorKey: "people", header: "Άτομα" },
    { accessorKey: "capacity", header: "Χωρητικότητα" },
  ];

  return (
    <div>
      <h1>Καταφύγιο</h1>
      <DataTable data={bookings} columns={columns} onAdd={handleAddBooking} />
      <CustomCalendar bookings={bookings} />
    </div>
  );
}

export default Katafigio;
