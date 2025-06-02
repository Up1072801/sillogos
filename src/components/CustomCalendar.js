import React, { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./CustomCalendar.module.css";
import { Tooltip, Box, Typography, Badge } from "@mui/material";

// Ελληνικές συντομογραφίες ημερών της εβδομάδας
const daysOfWeek = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

// Προσθέστε το forwarded ref και τροποποιήστε το component για να δέχεται εξωτερικό έλεγχο
const CustomCalendar = React.forwardRef(({ bookings, shelters = [], onDateRangeChange }, ref) => {
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

    // Βελτιωμένη συνάρτηση για έλεγχο εξωτερικού χώρου
    const isExternalSpace = (booking) => {
      // Έλεγχος τόσο του eksoterikos_xoros όσο και του externalSpace
      const value = booking.eksoterikos_xoros || booking.externalSpace;
      
      if (!value) return false;
      
      // Μετατροπή σε string και καθαρισμός
      const cleanValue = String(value).toLowerCase().trim();
      
      // Έλεγχος για όλες τις πιθανές τιμές που υποδηλώνουν εξωτερικό χώρο
      return cleanValue === "ναι" || 
             cleanValue === "nai" ||
             cleanValue === "yes" ||
             cleanValue === "1" ||
             cleanValue === "true" || 
             cleanValue === "αίθουσα 1" || 
             cleanValue === "αιθουσα 1" ||
             cleanValue.includes("αίθουσα") ||
             cleanValue.includes("αιθουσα") ||
             cleanValue.includes("εξωτερικ") ||
             cleanValue.includes("εξωτ") ||
             value === true ||
             value === 1;
    };

    // Διαχωρισμός κρατήσεων μόνο για υπολογισμό χωρητικότητας
    const dayBookingsInside = dayBookings.filter(booking => !isExternalSpace(booking));

    // Υπολογισμός χωρητικότητας μόνο με τις κρατήσεις εσωτερικού χώρου
    const totalPeople = dayBookingsInside.reduce((sum, b) => 
      sum + ((b.members || 0) + (b.nonMembers || 0)), 0);
    
    // Βρίσκουμε τη χωρητικότητα του καταφυγίου
    let totalCapacity = 0;
    if (dayBookingsInside.length > 0) {
      const bookingKatafigioId = String(dayBookingsInside[0].id_katafigiou);
      const shelter = shelters.find(s => String(s.id_katafigiou) === bookingKatafigioId);
      
      if (shelter) {
        totalCapacity = shelter.xoritikotita || 0;
      }
    }
    
    const percentageOccupied = totalCapacity > 0 ? Math.round((totalPeople / totalCapacity) * 100) : 0;
    const isFull = percentageOccupied >= 100;
    const remainingCapacity = Math.max(0, totalCapacity - totalPeople);
    
    return {
      // Εμφάνιση ως κράτηση αν υπάρχει οποιαδήποτε κράτηση (εσωτερική ή εξωτερική)
      className: dayBookings.length > 0 ? (isFull ? styles.full : styles.available) : "",
      bookings: dayBookings, // Όλες οι κρατήσεις
      totalPeople,
      totalCapacity,
      remainingCapacity,
      percentage: percentageOccupied,
      hasBookings: dayBookings.length > 0, // Όλες οι κρατήσεις
      isExternalSpace // Περνάμε τη συνάρτηση για χρήση στο tooltip
    };
  }, [calendarBookings, selectedYear, selectedMonth, shelters]);

  // Δημιουργία λίστας ετών για το dropdown (±10 χρόνια από το σήμερα)
  const years = useMemo(() => Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i), []);

  // Δημιουργία κώδικα HTML για το tooltip μιας ημέρας με κρατήσεις
  const createTooltipContent = (status) => {
    if (!status.hasBookings) return "Καμία κράτηση";

    // Διαχωρισμός κρατήσεων για το tooltip
    const internalBookings = status.bookings.filter(booking => !status.isExternalSpace(booking));
    const externalBookings = status.bookings.filter(booking => status.isExternalSpace(booking));

    return (
      <div className={styles.tooltipContent}>
        {internalBookings.length > 0 && (
          <>
            <div className={styles.tooltipHeader}>
              <strong>Πληρότητα (εσωτερικός χώρος): {status.percentage}%</strong> ({status.totalPeople}/{status.totalCapacity} άτομα)
            </div>
            <div className={styles.tooltipHeader} style={{color: status.remainingCapacity > 0 ? 'green' : 'red', marginTop: '5px'}}>
              <strong>Διαθέσιμη χωρητικότητα: {status.remainingCapacity} άτομα</strong>
            </div>
          </>
        )}
        
        <ul className={styles.bookingsList}>
          {status.bookings.map((booking, idx) => {
            const isExternal = status.isExternalSpace(booking);
            return (
              <li key={idx} style={isExternal ? {backgroundColor: '#f0f0f0'} : {}}>
                <div><strong>{booking.contactName}</strong> ({booking.shelterName})</div>
                <div>Άφιξη: {new Date(booking.arrival).toLocaleDateString("el-GR")}</div>
                <div>Αναχώρηση: {new Date(booking.departure).toLocaleDateString("el-GR")}</div>
                <div>Άτομα: {(booking.members || 0) + (booking.nonMembers || 0)}</div>
                {isExternal && (
                  <div><i>Εξωτερικός χώρος: {booking.eksoterikos_xoros || booking.externalSpace}</i></div>
                )}
              </li>
            );
          })}
        </ul>
        
        {externalBookings.length > 0 && internalBookings.length > 0 && (
          <div style={{marginTop: '5px', fontSize: '12px', color: '#666'}}>
            <i>Οι κρατήσεις εξωτερικού χώρου δεν υπολογίζονται στη διαθεσιμότητα</i>
          </div>
        )}
      </div>
    );
  };

  // Όταν αλλάζει ο μήνας ή το έτος, καλέστε αυτή τη συνάρτηση
  const handleMonthChange = (date) => {
    // Υπολογισμός της πρώτης και τελευταίας ημέρας του μήνα
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Ενημέρωση του γονικού component
    if (onDateRangeChange) {
      onDateRangeChange(firstDay, lastDay);
    }
  };

  // Προσθέστε λειτουργία για ενημέρωση του ημερολογίου από έξω
  React.useImperativeHandle(ref, () => ({
    updateCalendarView: (month, year) => {
      setSelectedMonth(month);
      setSelectedYear(year);
      
      // Επίσης καλέστε το callback για το date range
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      if (onDateRangeChange) {
        onDateRangeChange(firstDay, lastDay);
      }
    }
  }));

  return (
    <div className={styles.calendarContainer} role="region" aria-label="Ημερολόγιο κρατήσεων">
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
});

// Προσθέστε όνομα display για το component (για React DevTools)
CustomCalendar.displayName = 'CustomCalendar';

export default CustomCalendar;