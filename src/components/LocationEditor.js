import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, IconButton, Button, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const LocationEditor = ({ value, onChange }) => {
  const [locations, setLocations] = useState(value || []);
  const [newLocation, setNewLocation] = useState({ topothesia: "", start: "", end: "" });
  
  // Ενημέρωση των locations όταν αλλάζει η external value
  useEffect(() => {
    if (Array.isArray(value)) {
      setLocations(value);
    }
  }, [value]);
  
  const handleAddLocation = () => {
    if (newLocation.topothesia && newLocation.start && newLocation.end) {
      const updatedLocations = [...locations, { ...newLocation, id: Date.now() }];
      setLocations(updatedLocations);
      setNewLocation({ topothesia: "", start: "", end: "" });
      onChange(updatedLocations);
    }
  };
  
  const handleUpdateLocation = (id, field, value) => {
    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    );
    setLocations(updatedLocations);
    onChange(updatedLocations);
  };
  
  const handleDeleteLocation = (id) => {
    const updatedLocations = locations.filter(loc => loc.id !== id);
    setLocations(updatedLocations);
    onChange(updatedLocations);
  };
  
  return (
    <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>Διαχείριση Τοποθεσιών</Typography>
      
      {/* Λίστα τοποθεσιών */}
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
                <TableRow key={loc.id}>
                  <TableCell>
                    <TextField
                      size="small"
                      value={loc.topothesia}
                      onChange={(e) => handleUpdateLocation(loc.id, "topothesia", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      value={loc.start}
                      onChange={(e) => handleUpdateLocation(loc.id, "start", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      value={loc.end}
                      onChange={(e) => handleUpdateLocation(loc.id, "end", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleDeleteLocation(loc.id)}>
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
      
      {/* Φόρμα προσθήκης */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Τοποθεσία"
            value={newLocation.topothesia}
            onChange={(e) => setNewLocation({...newLocation, topothesia: e.target.value})}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            type="date"
            size="small"
            label="Ημ/νία Έναρξης"
            InputLabelProps={{ shrink: true }}
            value={newLocation.start}
            onChange={(e) => setNewLocation({...newLocation, start: e.target.value})}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            type="date"
            size="small"
            label="Ημ/νία Λήξης"
            InputLabelProps={{ shrink: true }}
            value={newLocation.end}
            onChange={(e) => setNewLocation({...newLocation, end: e.target.value})}
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
    </Box>
  );
};

export default LocationEditor;