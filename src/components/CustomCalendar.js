import React, { useEffect, useState } from "react";
import styles from "./CustomCalendar.module.css";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CustomCalendar = ({ bookings }) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [calendarBookings, setCalendarBookings] = useState([...bookings]);

  // ✅ Αυτόματη ενημέρωση όταν αλλάζουν τα `bookings`
  useEffect(() => {
    setCalendarBookings([...bookings]); // ✅ Αναγκαστική ανανέωση του state
  }, [bookings]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const checkBookingStatus = (day) => {
    const dateString = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const currentDate = new Date(dateString);

    const booking = calendarBookings.find((b) => {
      const arrivalDate = new Date(b.arrival);
      const departureDate = new Date(b.departure);
      return arrivalDate <= currentDate && departureDate >= currentDate;
    });

    return booking ? (booking.people < booking.capacity ? styles.available : styles.full) : "";
  };

  const years = Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i);
  
  return (
    <div className={styles.calendarContainer}>
      <div className={styles.selector}>
        <label>Μήνας:</label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("el-GR", { month: "long" })}
            </option>
          ))}
        </select>

        <label>Έτος:</label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <h2>{new Date(selectedYear, selectedMonth - 1).toLocaleString("el-GR", { month: "long", year: "numeric" })}</h2>

      <div className={styles.calendarGrid}>
        {daysOfWeek.map((day) => (
          <div key={day} className={styles.dayHeader}>{day}</div>
        ))}
        {monthDays.map((day) => (
          <div key={day} className={`${styles.dayCell} ${checkBookingStatus(day)}`}>
            <span>{day}</span>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <span className={`${styles.legendItem} ${styles.available}`}>Διαθέσιμες κρατήσεις</span>
        <span className={`${styles.legendItem} ${styles.full}`}>Χωρίς χωρητικότητα</span>
      </div>
    </div>
  );
};

export default CustomCalendar;
