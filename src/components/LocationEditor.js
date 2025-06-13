import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, IconButton, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers';

const LocationEditor = ({ value, onChange }) => {
  const [locations, setLocations] = useState(value || []);
  const [newLocation, setNewLocation] = useState({ topothesia: "", start: "", end: "" });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  
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
      // Αντί για toISOString(), χρησιμοποιούμε απευθείας τα τοπικά μέρη της ημερομηνίας
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
      // Διασφαλίζουμε ότι κάθε τοποθεσία έχει μοναδικό id και σωστά ονόματα πεδίων
      setLocations(value.map((loc, idx) => ({
        ...loc,
        id: loc.id !== undefined ? loc.id : idx,
        topothesia: loc.topothesia || "",
        start: loc.start || loc.hmerominia_enarksis || "", 
        end: loc.end || loc.hmerominia_liksis || ""
      })));
    } else {
      // Αν δεν έχουμε αρχική τιμή, ξεκινάμε με άδειο πίνακα
      setLocations([]);
    }
  }, [value]);
  
  // Προσθήκη νέας τοποθεσίας με validation
  const handleAddLocation = () => {
    if (!newLocation.topothesia) {
      alert("Παρακαλώ συμπληρώστε την τοποθεσία");
      return;
    }
    
    if (!newLocation.start) {
      alert("Παρακαλώ επιλέξτε ημερομηνία έναρξης");
      return;
    }
    
    if (!newLocation.end) {
      alert("Παρακαλώ επιλέξτε ημερομηνία λήξης");
      return;
    }
    
    if (new Date(newLocation.end) < new Date(newLocation.start)) {
      alert("Η ημερομηνία λήξης πρέπει να είναι μετά την ημερομηνία έναρξης");
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
  };
  
  // Ενημέρωση υπάρχουσας τοποθεσίας
  const handleUpdateLocation = (id, field, value) => {
    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    );
    setLocations(updatedLocations);
    onChange(updatedLocations);
  };
  
  // Διάλογος επιβεβαίωσης για διαγραφή τοποθεσίας
  const confirmDeleteLocation = (id) => {
    setLocationToDelete(id);
    setOpenDeleteDialog(true);
  };
  
  // Διαγραφή τοποθεσίας μετά από επιβεβαίωση
  const handleDeleteLocation = () => {
    if (locationToDelete === null) return;
    
    const updatedLocations = locations.filter(loc => loc.id !== locationToDelete);
    setLocations(updatedLocations);
    onChange(updatedLocations);
    setOpenDeleteDialog(false);
    setLocationToDelete(null);
  };
  
  return (
    <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>Διαχείριση Τοποθεσιών</Typography>
      
      {locations.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Τοποθεσία</TableCell>
                <TableCell>Ημ/νία Έναρξης</TableCell>
                <TableCell>Ημ/νία Λήξης</TableCell>
                <TableCell>Ενέργειες</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id !== undefined ? loc.id : `loc-${Date.now()}-${Math.random()}`}>
                  <TableCell>
                    <TextField
                      size="small"
                      value={loc.topothesia}
                      onChange={(e) => handleUpdateLocation(loc.id, "topothesia", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <DatePicker
                      format="dd/MM/yyyy"
                      value={parseDate(loc.start)}
                      onChange={(newDate) => handleUpdateLocation(loc.id, "start", toISODateString(newDate))}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true
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
                          size: "small",
                          fullWidth: true
                        }
                      }}
                      minDate={parseDate(loc.start) || undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => confirmDeleteLocation(loc.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Δεν έχουν προστεθεί τοποθεσίες.
        </Typography>
      )}
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Τοποθεσία"
            value={newLocation.topothesia}
            onChange={(e) => setNewLocation({
              ...newLocation, 
              topothesia: e.target.value
            })}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
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
                size: "small",
                fullWidth: true
              }
            }}
            maxDate={parseDate(newLocation.end) || undefined}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
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
                size: "small",
                fullWidth: true
              }
            }}
            minDate={parseDate(newLocation.start) || undefined}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleAddLocation}
            disabled={!newLocation.topothesia || !newLocation.start || !newLocation.end}
          >
            Προσθήκη
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