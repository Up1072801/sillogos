import React, { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./CustomCalendar.module.css";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CustomCalendar = ({ bookings }) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [calendarBookings, setCalendarBookings] = useState([...bookings]);

  // Ενημέρωση των κρατήσεων όταν αλλάζουν τα `bookings`
  useEffect(() => {
    setCalendarBookings([...bookings]);
  }, [bookings]);

  // Υπολογισμός των ημερών του μήνα
  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedYear, selectedMonth]);
  const monthDays = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // Έλεγχος κατάστασης κράτησης για μια συγκεκριμένη ημέρα
  const checkBookingStatus = useCallback((day) => {
    const dateString = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const currentDate = new Date(dateString);

    const booking = calendarBookings.find((b) => {
      const arrivalDate = new Date(b.arrival);
      const departureDate = new Date(b.departure);
      return arrivalDate <= currentDate && departureDate >= currentDate;
    });

    return booking ? (booking.people < booking.capacity ? styles.available : styles.full) : "";
  }, [calendarBookings, selectedYear, selectedMonth]);

  // Δημιουργία λίστας ετών για το dropdown
  const years = useMemo(() => Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i), []);

  return (
    <div className={styles.calendarContainer} role="region" aria-label="Ημερολόγιο κρατήσεων">
      <div className={styles.selector}>
        <label htmlFor="month-select">Μήνας:</label>
        <select id="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("el-GR", { month: "long" })}
            </option>
          ))}
        </select>

        <label htmlFor="year-select">Έτος:</label>
        <select id="year-select" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <h2>{new Date(selectedYear, selectedMonth - 1).toLocaleString("el-GR", { month: "long", year: "numeric" })}</h2>

      <div className={styles.calendarGrid} role="grid">
        {daysOfWeek.map((day) => (
          <div key={day} className={styles.dayHeader} role="columnheader">{day}</div>
        ))}
        {monthDays.map((day) => (
          <div key={day} className={`${styles.dayCell} ${checkBookingStatus(day)}`} role="gridcell">
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