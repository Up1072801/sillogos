import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, IconButton, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers';

const LocationEditor = ({ value, onChange }) => {
  const [locations, setLocations] = useState(value || []);
  const [newLocation, setNewLocation] = useState({ topothesia: "", start: "", end: "" });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Parse date string to Date object
  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  };

  // Convert Date to ISO string (YYYY-MM-DD) without timezone issues
  const toISODateString = (date) => {
    if (!date) return "";
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
  };
  
  // Ensure each location has a unique ID when value changes
  useEffect(() => {
    if (Array.isArray(value) && value.length > 0) {
      setLocations(value.map((loc, idx) => ({
        ...loc,
        id: loc.id !== undefined ? loc.id : idx,
        topothesia: loc.topothesia || "",
        start: loc.start || loc.hmerominia_enarksis || "", 
        end: loc.end || loc.hmerominia_liksis || ""
      })));
    } else {
      setLocations([]);
    }
  }, [value]);
  
  // Validate dates (similar to the Yup validation pattern)
  const validateDates = (startDate, endDate) => {
    // If either date is missing, validation passes
    if (!startDate || !endDate) return true;
    
    // Parse dates to ensure proper comparison
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) return true;
    
    // End date should be same day or after start date
    return endDateObj >= startDateObj;
  };
  
  // Προσθήκη νέας τοποθεσίας με βελτιωμένο validation
  const handleAddLocation = () => {
    const errors = {};
    
    if (!newLocation.topothesia) {
      errors.topothesia = "Παρακαλώ συμπληρώστε την τοποθεσία";
    }
    
    if (!newLocation.start) {
      errors.start = "Παρακαλώ επιλέξτε ημερομηνία έναρξης";
    }
    
    if (!newLocation.end) {
      errors.end = "Παρακαλώ επιλέξτε ημερομηνία λήξης";
    }
    
    if (newLocation.start && newLocation.end && !validateDates(newLocation.start, newLocation.end)) {
      errors.end = "Η ημερομηνία λήξης πρέπει να είναι μετά ή ίδια με την ημερομηνία έναρξης";
    }
    
    // Check for overlapping dates with existing locations
    if (newLocation.start && newLocation.end) {
      const isOverlapping = locations.some(loc => {
        const existingStart = new Date(loc.start);
        const existingEnd = new Date(loc.end);
        const newStart = new Date(newLocation.start);
        const newEnd = new Date(newLocation.end);
        
        return (
          (newStart >= existingStart && newStart <= existingEnd) ||
          (newEnd >= existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        );
      });
      
      if (isOverlapping) {
        errors.overlap = "Οι ημερομηνίες επικαλύπτονται με υπάρχουσα τοποθεσία";
      }
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Show the first error message
      alert(Object.values(errors)[0]);
      return;
    }
    
    const updatedLocations = [...locations, { ...newLocation, id: Date.now() }];
    setLocations(updatedLocations);
    setNewLocation({ 
      topothesia: "", 
      start: "", 
      end: "" 
    });
    onChange(updatedLocations);
    setValidationErrors({});
  };
  
  const handleUpdateLocation = (id, field, value) => {
    // For date updates, check for overlapping with other locations
    if (field === "start" || field === "end") {
      const currentLoc = locations.find(loc => loc.id === id);
      if (!currentLoc) return;
      
      const updatedDates = {
        start: field === "start" ? value : currentLoc.start,
        end: field === "end" ? value : currentLoc.end
      };
      
      // Check for valid date range using the same validation pattern
      if (updatedDates.start && updatedDates.end && !validateDates(updatedDates.start, updatedDates.end)) {
        alert("Η ημερομηνία λήξης πρέπει να είναι μετά ή ίδια με την ημερομηνία έναρξης");
        return;
      }
      
      // Check for overlapping with other locations
      if (updatedDates.start && updatedDates.end) {
        const isOverlapping = locations.some(loc => {
          if (loc.id === id) return false; // Skip current location
          
          const existingStart = new Date(loc.start);
          const existingEnd = new Date(loc.end);
          const newStart = new Date(updatedDates.start);
          const newEnd = new Date(updatedDates.end);
          
          return (
            (newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          );
        });
        
        if (isOverlapping) {
          alert("Οι ημερομηνίες επικαλύπτονται με άλλη τοποθεσία");
          return;
        }
      }
    }
    
    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    );
    setLocations(updatedLocations);
    onChange(updatedLocations);
  };
  
  const confirmDeleteLocation = (id) => {
    setLocationToDelete(id);
    setOpenDeleteDialog(true);
  };
  
  const handleDeleteLocation = () => {
    if (locationToDelete === null) return;
    
    const updatedLocations = locations.filter(loc => loc.id !== locationToDelete);
    setLocations(updatedLocations);
    onChange(updatedLocations);
    setOpenDeleteDialog(false);
    setLocationToDelete(null);
  };
  
  return (
    <Box sx={{ width: '100%', minWidth: '825px' }}>
      {locations.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 3, width: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="30%">Τοποθεσία</TableCell>
                <TableCell width="25%">Ημ/νία Έναρξης</TableCell>
                <TableCell width="25%">Ημ/νία Λήξης</TableCell>
                <TableCell width="15%">Διαγραφη</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id !== undefined ? loc.id : `loc-${Date.now()}-${Math.random()}`}>
                  <TableCell>
                    <TextField
                      size="medium"
                      value={loc.topothesia}
                      onChange={(e) => handleUpdateLocation(loc.id, "topothesia", e.target.value)}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <DatePicker
                      format="dd/MM/yyyy"
                      value={parseDate(loc.start)}
                      onChange={(newDate) => handleUpdateLocation(loc.id, "start", toISODateString(newDate))}
                      slotProps={{
                        textField: {
                          size: "medium",
                          fullWidth: true,
                          sx: { 
                            '.MuiInputBase-root': {
                              paddingRight: 1
                            },
                            '.MuiInputBase-input': { 
                              paddingRight: 0,
                              fontSize: '1rem'
                            },
                            '.MuiInputAdornment-root': {
                              marginLeft: 0,
                              height: '100%'
                            },
                            '.MuiSvgIcon-root': {
                              fontSize: '1.25rem',
                              color: '#757575' // Changed from primary.main to gray
                            }
                          }
                        },
                        field: {
                          clearable: true
                        }
                      }}
                      maxDate={parseDate(loc.end) || undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <DatePicker
                      format="dd/MM/yyyy"
                      value={parseDate(loc.end)}
                      onChange={(newDate) => handleUpdateLocation(loc.id, "end", toISODateString(newDate))}
                      slotProps={{
                        textField: {
                          size: "medium",
                          fullWidth: true,
                          sx: { 
                            '.MuiInputBase-root': {
                              paddingRight: 1
                            },
                            '.MuiInputBase-input': { 
                              paddingRight: 0,
                              fontSize: '1rem'
                            },
                            '.MuiInputAdornment-root': {
                              marginLeft: 0,
                              height: '100%'
                            },
                            '.MuiSvgIcon-root': {
                              fontSize: '1.25rem',
                              color: '#757575' // Changed from primary.main to gray
                            }
                          }
                        },
                        field: {
                          clearable: true
                        }
                      }}
                      minDate={parseDate(loc.start) || undefined}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="medium" onClick={() => confirmDeleteLocation(loc.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      
      {/* Form for adding new locations - improved spacing and widths */}
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="medium"
            label="Τοποθεσία"
            value={newLocation.topothesia}
            onChange={(e) => setNewLocation({
              ...newLocation, 
              topothesia: e.target.value
            })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            format="dd/MM/yyyy"
            label="Ημ/νία Έναρξης"
            value={parseDate(newLocation.start)}
            onChange={(newDate) => setNewLocation({
              ...newLocation, 
              start: toISODateString(newDate)
            })}
            slotProps={{
              textField: {
                size: "medium",
                fullWidth: true,
                sx: { 
                  '.MuiInputBase-root': {
                    paddingRight: 1
                  },
                  '.MuiInputBase-input': { 
                    paddingRight: 0,
                    fontSize: '1rem'
                  },
                  '.MuiInputAdornment-root': {
                    marginLeft: 0,
                    height: '100%'
                  },
                  '.MuiSvgIcon-root': {
                    fontSize: '1.25rem',
                              color: '#757575' // Changed from primary.main to gray
                  }
                }
              },
              field: {
                clearable: true
              }
            }}
            maxDate={parseDate(newLocation.end) || undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            format="dd/MM/yyyy"
            label="Ημ/νία Λήξης"
            value={parseDate(newLocation.end)}
            onChange={(newDate) => setNewLocation({
              ...newLocation, 
              end: toISODateString(newDate)
            })}
            slotProps={{
              textField: {
                size: "medium",
                fullWidth: true,
                sx: { 
                  '.MuiInputBase-root': {
                    paddingRight: 1
                  },
                  '.MuiInputBase-input': { 
                    paddingRight: 0,
                    fontSize: '1rem'
                  },
                  '.MuiInputAdornment-root': {
                    marginLeft: 0,
                    height: '100%'
                  },
                  '.MuiSvgIcon-root': {
                    fontSize: '1.25rem',
                              color: '#757575' // Changed from primary.main to gray
                  }
                }
              },
              field: {
                clearable: true
              }
            }}
            minDate={parseDate(newLocation.start) || undefined}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleAddLocation}
            disabled={!newLocation.topothesia || !newLocation.start || !newLocation.end}
            size="large"
            sx={{ 
              height: '48px', 
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            ΠΡΟΣΘΗΚΗ
          </Button>
        </Grid>
      </Grid>
      
      {/* Διάλογος επιβεβαίωσης διαγραφής */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Επιβεβαίωση Διαγραφής</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την τοποθεσία;
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Άκυρο
          </Button>
          <Button onClick={handleDeleteLocation} color="error" autoFocus>
            Διαγραφή
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationEditor;