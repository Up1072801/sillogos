import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Typography,
  InputAdornment,
  TablePagination,
  Checkbox
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import el from 'date-fns/locale/el';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import api from '../utils/api';

const MultiLoanForm = ({ contactsList, availableEquipment, onSuccess, onCancel }) => {
  // State for form values
  const [contactId, setContactId] = useState('');
  const [loanDate, setLoanDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(null);
  const [status, setStatus] = useState('Σε εκκρεμότητα');
  const [equipmentItems, setEquipmentItems] = useState([
    { id_eksoplismou: '', quantity: 1 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Contact selection table state
  const [searchText, setSearchText] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(contactsList || []);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Effect to filter contacts based on search text
  useEffect(() => {
    if (!contactsList) {
      setFilteredContacts([]);
      return;
    }
    
    const filtered = contactsList.filter(contact => {
      if (!searchText.trim()) return true;
      
      const searchFields = ['fullName', 'email', 'tilefono'];
      return searchFields.some(field => {
        const value = contact[field];
        return value && String(value).toLowerCase().includes(searchText.toLowerCase());
      });
    });
    
    setFilteredContacts(filtered);
    setPage(0); // Reset to first page when filtering
  }, [searchText, contactsList]);

  // Equipment handling functions
  const addEquipmentItem = () => {
    setEquipmentItems([...equipmentItems, { id_eksoplismou: '', quantity: 1 }]);
  };

  const removeEquipmentItem = (index) => {
    if (equipmentItems.length === 1) return;
    const updatedItems = [...equipmentItems];
    updatedItems.splice(index, 1);
    setEquipmentItems(updatedItems);
  };

  const updateEquipmentItem = (index, field, value) => {
    const updatedItems = [...equipmentItems];
    updatedItems[index][field] = value;
    setEquipmentItems(updatedItems);
  };

  // Contact selection
  const handleSelectContact = (contact) => {
    if (contactId === contact.id_epafis.toString()) {
      setContactId(''); // Deselect if already selected
    } else {
      setContactId(contact.id_epafis.toString());
    }
  };

  // Form submission
  const handleSubmit = async () => {
    setError(null);
    
    // Validation
    if (!contactId) {
      setError("Παρακαλώ επιλέξτε επαφή");
      return;
    }
    
    if (equipmentItems.length === 0) {
      setError("Προσθέστε τουλάχιστον ένα είδος εξοπλισμού");
      return;
    }
    
    // Validate all equipment items
    const invalidItems = equipmentItems.filter(item => !item.id_eksoplismou);
    if (invalidItems.length > 0) {
      setError("Όλα τα πεδία εξοπλισμού πρέπει να συμπληρωθούν");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/eksoplismos/daneismos-multi', {
        id_epafis: parseInt(contactId),
        equipment_items: equipmentItems.map(item => ({
          id_eksoplismou: parseInt(item.id_eksoplismou),
          quantity: parseInt(item.quantity) || 1
        })),
        hmerominia_daneismou: loanDate.toISOString(),
        hmerominia_epistrofis: returnDate ? returnDate.toISOString() : null,
        katastasi_daneismou: status
      });
      
      setLoading(false);
      onSuccess(response.data);
    } catch (error) {
      setLoading(false);
      setError(error.response?.data?.error || "Σφάλμα κατά την προσθήκη δανεισμών");
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
      <Box sx={{ width: '100%' }}>
        {error && (
          <Box sx={{ color: 'error.main', my: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
            {error}
          </Box>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Επιλογή Επαφής
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Αναζήτηση επαφής..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" width="5%"></TableCell>
                  <TableCell width="40%">Ονοματεπώνυμο</TableCell>
                  <TableCell width="30%">Email</TableCell>
                  <TableCell width="25%">Τηλέφωνο</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.length > 0 ? (
                  filteredContacts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((contact) => (
                      <TableRow 
                        key={contact.id_epafis} 
                        hover 
                        onClick={() => handleSelectContact(contact)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox 
                            checked={contactId === contact.id_epafis.toString()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectContact(contact);
                            }}
                          />
                        </TableCell>
                        <TableCell>{contact.fullName}</TableCell>
                        <TableCell>{contact.email || '-'}</TableCell>
                        <TableCell>{contact.tilefono || '-'}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Δεν βρέθηκαν επαφές
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredContacts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Ανά σελίδα:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} από ${count}`}
          />
          
          {!contactId && (
            <FormHelperText error>Η επιλογή επαφής είναι υποχρεωτική</FormHelperText>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <DatePicker
            label="Ημερομηνία Δανεισμού"
            value={loanDate}
            onChange={(newValue) => setLoanDate(newValue)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
          
          <DatePicker
            label="Ημερομηνία Επιστροφής"
            value={returnDate}
            onChange={(newValue) => setReturnDate(newValue)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Κατάσταση</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Κατάσταση"
            >
              <MenuItem value="Σε εκκρεμότητα">Σε εκκρεμότητα</MenuItem>
              <MenuItem value="Επιστράφηκε">Επιστράφηκε</MenuItem>
              <MenuItem value="Εκπρόθεσμο">Εκπρόθεσμο</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">Εξοπλισμός</Typography>
            <Button 
              startIcon={<AddIcon />} 
              onClick={addEquipmentItem}
              variant="outlined"
              size="small"
            >
              Προσθήκη Εξοπλισμού
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Εξοπλισμός</TableCell>
                  <TableCell align="right">Ποσότητα</TableCell>
                  <TableCell align="right">Ενέργειες</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipmentItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          value={item.id_eksoplismou}
                          onChange={(e) => updateEquipmentItem(index, 'id_eksoplismou', e.target.value)}
                          displayEmpty
                          required
                        >
                          <MenuItem value="" disabled>Επιλέξτε εξοπλισμό</MenuItem>
                          {(availableEquipment || []).map((equip) => (
                            <MenuItem 
                              key={equip.id_eksoplismou} 
                              value={equip.id_eksoplismou}
                            >
                              {equip.onoma} 
                              {equip.marka && ` - ${equip.marka}`}
                              {equip.xroma && ` (${equip.xroma})`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateEquipmentItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        InputProps={{ inputProps: { min: 1 } }}
                        size="small"
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => removeEquipmentItem(index)}
                        disabled={equipmentItems.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={onCancel} disabled={loading}>
            Ακύρωση
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmit}
            disabled={loading || equipmentItems.some(item => !item.id_eksoplismou) || !contactId}
          >
            {loading ? 'Υποβολή...' : 'Αποθήκευση Δανεισμού'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default MultiLoanForm;