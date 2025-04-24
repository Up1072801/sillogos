import React, { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./CustomCalendar.module.css";
import { Tooltip, Box, Typography, Badge } from "@mui/material";

// Ελληνικές συντομογραφίες ημερών της εβδομάδας
const daysOfWeek = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

const CustomCalendar = ({ bookings, shelters = [] }) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [calendarBookings, setCalendarBookings] = useState([...bookings]);
  const [selectedShelterId, setSelectedShelterId] = useState('all');

  // Ενημέρωση των κρατήσεων όταν αλλάζουν τα `bookings`
  useEffect(() => {
    if (selectedShelterId === 'all') {
      setCalendarBookings([...bookings]);
    } else {
      const filtered = bookings.filter(booking => 
        booking.id_katafigiou.toString() === selectedShelterId
      );
      setCalendarBookings(filtered);
    }
  }, [bookings, selectedShelterId]);

  // Υπολογισμός της πρώτης ημέρας του μήνα και προσθήκη κενών κελιών
  const firstDayOfMonth = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Προσαρμογή για να ξεκινά από Δευτέρα (0) αντί για Κυριακή (0)
  }, [selectedYear, selectedMonth]);

  // Υπολογισμός των ημερών του μήνα
  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedYear, selectedMonth]);
  const monthDays = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // Έλεγχος αν η ημέρα είναι η σημερινή
  const isToday = useCallback((day) => {
    const now = new Date();
    return day === now.getDate() && 
           selectedMonth === now.getMonth() + 1 && 
           selectedYear === now.getFullYear();
  }, [selectedMonth, selectedYear]);

  // Έλεγχος κατάστασης κράτησης για μια συγκεκριμένη ημέρα - βελτιωμένη έκδοση
  const checkBookingStatus = useCallback((day) => {
    const dateString = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const currentDate = new Date(dateString);
    
    // Βρίσκουμε όλες τις κρατήσεις για τη συγκεκριμένη ημέρα
    const dayBookings = calendarBookings.filter((b) => {
      const arrivalDate = new Date(b.arrival);
      const departureDate = new Date(b.departure);
      return arrivalDate <= currentDate && departureDate >= currentDate;
    });
    
    // Υπολογίζουμε συνολικά άτομα και χωρητικότητα
    const totalPeople = dayBookings.reduce((sum, b) => sum + ((b.members || 0) + (b.nonMembers || 0)), 0);
    
    // Βρίσκουμε τη χωρητικότητα του καταφυγίου
    let totalCapacity = 0;
    if (dayBookings.length > 0) {
      // Μετατροπή σε string για να διασφαλίσουμε τη σύγκριση
      const bookingKatafigioId = String(dayBookings[0].id_katafigiou);
      
      const shelter = shelters.find(s => String(s.id_katafigiou) === bookingKatafigioId);
      
      if (shelter) {
        console.log(`Βρέθηκε καταφύγιο: ${shelter.onoma}, χωρητικότητα: ${shelter.xoritikotita}`);
        totalCapacity = shelter.xoritikotita || 0;
      } else {
        console.log(`Δεν βρέθηκε καταφύγιο με ID ${bookingKatafigioId}. Διαθέσιμα καταφύγια:`, 
          shelters.map(s => `ID: ${s.id_katafigiou}, Όνομα: ${s.onoma}`));
      }
    }
    
    const percentageOccupied = totalCapacity > 0 ? Math.round((totalPeople / totalCapacity) * 100) : 0;
    const isFull = percentageOccupied >= 100;
    
    // Υπολογισμός διαθέσιμης χωρητικότητας (πάντα ≥ 0)
    const remainingCapacity = Math.max(0, totalCapacity - totalPeople);
    
    return {
      className: dayBookings.length > 0 ? (isFull ? styles.full : styles.available) : "",
      bookings: dayBookings,
      totalPeople,
      totalCapacity,
      remainingCapacity, // Προσθήκη διαθέσιμης χωρητικότητας
      percentage: percentageOccupied,
      hasBookings: dayBookings.length > 0
    };
  }, [calendarBookings, selectedYear, selectedMonth, shelters]);

  // Δημιουργία λίστας ετών για το dropdown (±10 χρόνια από το σήμερα)
  const years = useMemo(() => Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i), []);

  // Δημιουργία κώδικα HTML για το tooltip μιας ημέρας με κρατήσεις
  const createTooltipContent = (status) => {
    if (!status.hasBookings) return "Καμία κράτηση";

    return (
      <div className={styles.tooltipContent}>
        <div className={styles.tooltipHeader}>
          <strong>Πληρότητα: {status.percentage}%</strong> ({status.totalPeople}/{status.totalCapacity} άτομα)
        </div>
        <div className={styles.tooltipHeader} style={{color: status.remainingCapacity > 0 ? 'green' : 'red', marginTop: '5px'}}>
          <strong>Διαθέσιμη χωρητικότητα: {status.remainingCapacity} άτομα</strong>
        </div>
        <ul className={styles.bookingsList}>
          {status.bookings.map((booking, idx) => (
            <li key={idx}>
              <div><strong>{booking.contactName}</strong> ({booking.shelterName})</div>
              <div>Άφιξη: {new Date(booking.arrival).toLocaleDateString("el-GR")}</div>
              <div>Αναχώρηση: {new Date(booking.departure).toLocaleDateString("el-GR")}</div>
              <div>Άτομα: {(booking.members || 0) + (booking.nonMembers || 0)}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

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
        
        {shelters.length > 1 && (
          <>
            <label htmlFor="shelter-select">Καταφύγιο:</label>
            <select 
              id="shelter-select" 
              value={selectedShelterId} 
              onChange={(e) => setSelectedShelterId(e.target.value)}
            >
              <option value="all">Όλα τα καταφύγια</option>
              {shelters.map(shelter => (
                <option key={shelter.id_katafigiou} value={shelter.id_katafigiou.toString()}>
                  {shelter.onoma}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <h2>{new Date(selectedYear, selectedMonth - 1).toLocaleString("el-GR", { month: "long", year: "numeric" })}</h2>

      <div className={styles.calendarGrid} role="grid">
        {daysOfWeek.map((day) => (
          <div key={day} className={styles.dayHeader} role="columnheader">{day}</div>
        ))}
        
        {/* Κενά κελιά για σωστή στοίχιση των ημερών */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className={styles.dayCell} role="gridcell"></div>
        ))}
        
        {/* Ημέρες του μήνα */}
        {monthDays.map((day) => {
          const status = checkBookingStatus(day);
          return (
            <Tooltip
              key={day}
              title={createTooltipContent(status)}
              placement="top"
              arrow
              enterTouchDelay={0}
              leaveTouchDelay={3000}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'white',
                    color: 'rgba(0, 0, 0, 0.87)',
                    '& .MuiTooltip-arrow': {
                      color: 'white',
                    },
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)',
                    borderRadius: '4px',
                    p: 1.5,
                    maxWidth: 350,
                  },
                },
              }}
            >
              <div 
                className={`${styles.dayCell} ${status.className} ${isToday(day) ? styles.today : ''}`} 
                role="gridcell"
                style={isToday(day) ? { backgroundColor: 'rgba(173, 216, 230, 0.3)' } : {}}
              >
                <span className={styles.dayNumber}>{day}</span>
                {status.hasBookings && (
                  <Badge 
                    badgeContent={status.bookings.length} 
                    color="primary" // Σταθερό χρώμα "primary" αντί για δυναμικό
                    className={styles.bookingBadge}
                  >
                    <div className={styles.occupancyBar}>
                      <div 
                        className={styles.occupancyBarFill} 
                        style={{width: `${Math.min(100, status.percentage)}%`}}
                        title={`${status.percentage}% πληρότητα`}
                      ></div>
                    </div>
                  </Badge>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={`${styles.legendItem} ${styles.available}`}>Κρατήσεις</span>
        <span className={`${styles.legendItem} ${styles.full}`}>Πλήρης χωρητικότητα</span>
        <span className={`${styles.legendItem} ${styles.today}`}>Σημερινή ημέρα</span>
      </div>
    </div>
  );
};

export default CustomCalendar;