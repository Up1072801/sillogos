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
  Checkbox,
  Radio, // Προσθήκη του Radio
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import el from 'date-fns/locale/el';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import api from '../utils/api';

const MultiLoanForm = ({ 
  contactsList, 
  availableEquipment, 
  onSuccess, 
  onCancel, 
  editData = null // Προσθήκη prop για τα δεδομένα επεξεργασίας 
}) => {
  // State for form values with initialization from editData if available
  const [contactId, setContactId] = useState(editData ? String(editData.id_epafis) : '');
  const [loanDate, setLoanDate] = useState(editData?.hmerominia_daneismou ? new Date(editData.hmerominia_daneismou) : null);
  const [returnDate, setReturnDate] = useState(editData?.hmerominia_epistrofis ? new Date(editData.hmerominia_epistrofis) : null);
  const [status, setStatus] = useState(editData?.katastasi_daneismou || 'Σε εκκρεμότητα');
  
  // Initialize equipment items from editData if available
  const [equipmentItems, setEquipmentItems] = useState(
    editData?.equipment_items 
      ? editData.equipment_items.map(item => ({
          id_eksoplismou: String(item.id_eksoplismou),
          quantity: item.quantity || 1,
          id: item.id // Keep original loan ID for updates
        }))
      : [{ id_eksoplismou: '', quantity: 1 }]
  );
  // Προσθήκη μιας κατάστασης αναφοράς για τα αρχικά αντικείμενα εξοπλισμού
  const [originalEquipmentItems, setOriginalEquipmentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Contact selection table state
  const [searchText, setSearchText] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(contactsList || []);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // New state variables for delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);
  
  // Add a new state variable to track field touches
  const [loanDateTouched, setLoanDateTouched] = useState(false);
  
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

  // Effect to initialize form when editData changes
  useEffect(() => {
    if (editData) {
      setContactId(String(editData.id_epafis || ''));
      
      // Proper date parsing
      if (editData.hmerominia_daneismou) {
        const loanDateObj = new Date(editData.hmerominia_daneismou);
        setLoanDate(isNaN(loanDateObj) ? new Date() : loanDateObj);
      }
      
      if (editData.hmerominia_epistrofis) {
        const returnDateObj = new Date(editData.hmerominia_epistrofis);
        setReturnDate(isNaN(returnDateObj) ? null : returnDateObj);
      } else {
        setReturnDate(null);
      }
      
      setStatus(editData.katastasi_daneismou || 'Σε εκκρεμότητα');
      
      if (editData.equipment_items && editData.equipment_items.length > 0) {
        const formattedItems = editData.equipment_items.map(item => ({
          id_eksoplismou: String(item.id_eksoplismou || ''),
          quantity: parseInt(item.quantity) || 1,
          id: item.id // Keep original loan ID for updates
        }));
        
        setEquipmentItems(formattedItems);
        // Αποθήκευση των αρχικών αντικειμένων για σύγκριση κατά την υποβολή
        setOriginalEquipmentItems(formattedItems);
      }
    }
  }, [editData]);

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

  // Handle delete click
  const handleDeleteClick = (index) => {
    setItemToDeleteIndex(index);
    setOpenDeleteDialog(true);
  };

  // Confirm delete
  const confirmRemoveEquipmentItem = () => {
    if (itemToDeleteIndex === null || equipmentItems.length === 1) return;
    
    const updatedItems = [...equipmentItems];
    updatedItems.splice(itemToDeleteIndex, 1);
    setEquipmentItems(updatedItems);
    setOpenDeleteDialog(false);
    setItemToDeleteIndex(null);
  };

  // Form submission
  const handleSubmit = async () => {
    setError(null);
    
    // Validation (keep existing validation code)
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
    
    // Validation for dates
    if (returnDate && loanDate) {
      if (new Date(returnDate) < new Date(loanDate)) {
        setError("Η ημερομηνία επιστροφής δεν μπορεί να είναι πριν από την ημερομηνία δανεισμού");
        return;
      }
    }
    
    setLoading(true);
    
    try {
      let response;
      
      // Check if we're editing an existing loan or creating a new one
      if (editData) {
        // We're in edit mode
        
        // 1. Εντοπισμός αντικειμένων προς ενημέρωση (έχουν ID και είναι ακόμα στη φόρμα)
        const itemsToUpdate = equipmentItems
          .filter(item => item.id) // Only include items with IDs (existing loans)
          .map(item => item.id);
        
        // 2. Εντοπισμός αντικειμένων προς προσθήκη (δεν έχουν ID)
        const itemsToAdd = equipmentItems.filter(item => !item.id);
        
        // 3. Εντοπισμός αντικειμένων προς διαγραφή (έχουν ID αλλά δεν είναι πλέον στη φόρμα)
        const itemsToDelete = originalEquipmentItems
          .filter(original => original.id && !equipmentItems.some(current => current.id === original.id))
          .map(item => item.id);
        
        // Πρώτα, ενημέρωση υπαρχόντων δανεισμών αν υπάρχουν
        if (itemsToUpdate.length > 0) {
          // 1. Ενημέρωση του group με τα κοινά στοιχεία (ημερομηνίες και κατάσταση)
          await api.put('/eksoplismos/daneismos-group/update', {
            id_epafis: parseInt(contactId),
            hmerominia_daneismou: loanDate.toISOString(),
            hmerominia_epistrofis: returnDate ? returnDate.toISOString() : null,
            katastasi_daneismou: status,
            equipment_ids: itemsToUpdate
          });
          
          // 2. Ενημέρωση των ποσοτήτων για κάθε δανεισμό ξεχωριστά
          const quantityUpdatePromises = equipmentItems
            .filter(item => item.id) // Μόνο τα αντικείμενα με ID (υπάρχοντες δανεισμοί)
            .map(item => 
              api.put(`/eksoplismos/daneismos/${item.id}`, {
                quantity: parseInt(item.quantity) || 1
              })
            );
          
          if (quantityUpdatePromises.length > 0) {
            await Promise.all(quantityUpdatePromises);
          }
        }
        
        // Στη συνέχεια, διαγραφή των δανεισμών που αφαιρέθηκαν
        const deletePromises = itemsToDelete.map(id => 
          api.delete(`/eksoplismos/daneismos/${id}`)
        );
        
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
        }
        
        // Τέλος, προσθήκη νέων δανεισμών αν υπάρχουν
        if (itemsToAdd.length > 0) {
          const addResponse = await api.post('/eksoplismos/daneismos-multi', {
            id_epafis: parseInt(contactId),
            equipment_items: itemsToAdd.map(item => ({
              id_eksoplismou: parseInt(item.id_eksoplismou),
              quantity: parseInt(item.quantity) || 1
            })),
            hmerominia_daneismou: loanDate.toISOString(),
            hmerominia_epistrofis: returnDate ? returnDate.toISOString() : null,
            katastasi_daneismou: status
          });
          
          response = addResponse; // Use this as the final response
        } else {
          // If no items were added, create a synthetic response
          response = {
            data: {
              success: true,
              message: "Οι δανεισμοί ενημερώθηκαν με επιτυχία"
            }
          };
        }
      } else {
        // We're creating a new loan (keep existing create code)
        response = await api.post('/eksoplismos/daneismos-multi', {
          id_epafis: parseInt(contactId),
          equipment_items: equipmentItems.map(item => ({
            id_eksoplismou: parseInt(item.id_eksoplismou),
            quantity: parseInt(item.quantity) || 1
          })),
          hmerominia_daneismou: loanDate.toISOString(),
          hmerominia_epistrofis: returnDate ? returnDate.toISOString() : null,
          katastasi_daneismou: status
        });
      }
      
      setLoading(false);
      onSuccess(response.data);
    } catch (error) {
      setLoading(false);
      setError(error.response?.data?.error || "Σφάλμα κατά την επεξεργασία δανεισμών");
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
            {editData ? "Δανειζόμενος" : "Επιλογή Επαφής"}
          </Typography>
          
          {editData ? (
            // When in edit mode, just show the selected contact name
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f5f5f5' }}>
              <Typography variant="body1">
                {contactsList.find(contact => contact.id_epafis.toString() === contactId)?.fullName || 'Άγνωστος'}
              </Typography>
            </Box>
          ) : (
            // When in create mode, show the full contact selection UI with tableSelect style
            <>
              <TextField
                fullWidth
                placeholder="Αναζήτηση επαφής..."
                value={searchText || ""}
                onChange={(e) => setSearchText(e.target.value)}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />
              
              <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead 
                    sx={{ 
                      bgcolor: 'grey.100',
                      '& .MuiTableCell-root': {
                        fontWeight: 'bold',
                        color: 'rgba(0, 0, 0, 0.87)',
                        borderBottom: '2px solid rgba(224, 224, 224, 1)'
                      }
                    }}
                  >
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
                            selected={contactId === contact.id_epafis.toString()}
                          >
                            <TableCell padding="checkbox">
                              <Radio 
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
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} από ${count !== -1 ? count : `πάνω από ${to}`}`}
              />
              
              {!contactId && (
                <FormHelperText error>Η επιλογή επαφής είναι υποχρεωτική</FormHelperText>
              )}
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <DatePicker
            label="Ημερομηνία Δανεισμού"
            value={loanDate}
            onChange={(newValue) => {
              if (newValue instanceof Date && !isNaN(newValue.getTime())) {
                setLoanDate(newValue);
              }
              setLoanDateTouched(true); // Mark as touched when changed
            }}
            maxDate={returnDate || undefined}
            format="dd/MM/yyyy"
            closeOnSelect={true}
            desktopModeMediaQuery="(min-width: 0px)"
            views={["year", "month", "day"]}
            slotProps={{
              textField: { 
                fullWidth: true,
                error: loanDateTouched && !loanDate, // Only show error if touched and empty
                helperText: (loanDateTouched && !loanDate) ? "Η ημερομηνία δανεισμού είναι υποχρεωτική" : "",
                onBlur: () => setLoanDateTouched(true), // Mark as touched on blur
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
                    color: '#757575'
                  }
                }
              },
              field: {
                clearable: true
              },
              popper: {
                sx: {
                  zIndex: 1500,
                  "& .MuiPaper-root": {
                    boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    width: "auto",
                    maxWidth: "325px"
                  }
                }
              }
            }}
          />
          
          <DatePicker
            label="Ημερομηνία Επιστροφής"
            value={returnDate}
            onChange={(newValue) => {
              if (!newValue) {
                setReturnDate(null);
              } else if (newValue instanceof Date && !isNaN(newValue.getTime())) {
                setReturnDate(newValue);
              }
            }}
            minDate={loanDate || undefined}
            format="dd/MM/yyyy"
            closeOnSelect={true}
            desktopModeMediaQuery="(min-width: 0px)"
            views={["year", "month", "day"]}
            slotProps={{
              textField: { 
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
                    color: '#757575'
                  }
                }
              },
              field: {
                clearable: true
              },
              popper: {
                sx: {
                  zIndex: 1500,
                  "& .MuiPaper-root": {
                    boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    width: "auto",
                    maxWidth: "325px"
                  }
                }
              }
            }}
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
                {equipmentItems.map((item, index) => {
                  // Filter logic for available equipment
                  const filteredEquipment = (availableEquipment || []).filter(equip => {
                    // Allow the currently selected item in this row
                    if (item.id_eksoplismou && equip.id_eksoplismou.toString() === item.id_eksoplismou.toString()) {
                      return true;
                    }
                    
                    // In edit mode, also allow items that are part of the original loan
                    if (editData && item.id && originalEquipmentItems.some(
                      origItem => origItem.id === item.id && 
                      origItem.id_eksoplismou.toString() === equip.id_eksoplismou.toString()
                    )) {
                      return true;
                    }
                    
                    // Exclude items that are selected in other rows
                    return !equipmentItems.some(
                      (selectedItem, selectedIndex) => 
                        selectedIndex !== index && 
                        selectedItem.id_eksoplismou && 
                        selectedItem.id_eksoplismou.toString() === equip.id_eksoplismou.toString()
                    );
                  });

                  return (
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
                            {filteredEquipment.map((equip) => (
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
                          onClick={() => handleDeleteClick(index)}
                          disabled={equipmentItems.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
            {loading ? 'Υποβολή...' : editData ? 'Ενημέρωση Δανεισμού' : 'Αποθήκευση Δανεισμού'}
          </Button>
        </Box>
        
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Επιβεβαίωση Διαγραφής</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Είστε σίγουρος ότι θέλετε να διαγράψετε αυτόν τον εξοπλισμό;
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
              Ακύρωση
            </Button>
            <Button onClick={confirmRemoveEquipmentItem} color="error" autoFocus>
              Διαγραφή
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MultiLoanForm;