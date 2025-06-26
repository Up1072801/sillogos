import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableHead, TableBody, TableRow, TableCell, Checkbox,
  Paper, TableContainer, TextField, InputAdornment, Box, Typography
} from '@mui/material';
import { Search } from '@mui/icons-material';

/**
 * Selection Dialog component that allows users to select items from a list
 */
const SelectionDialog = ({
  open,
  onClose,
  data = [],
  selectedIds = [],
  onChange,
  onConfirm,
  title = "Επιλογή",
  columns = [],
  idField = "id",
  searchFields = [],
  noDataMessage = "Δεν υπάρχουν διαθέσιμα δεδομένα"
}) => {
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState([]);
  const [filteredData, setFilteredData] = useState(data);

  // Initialize selected items when dialog opens or data changes
  useEffect(() => {
    setSelected(selectedIds || []);
  }, [selectedIds, open]);

  // Filter data based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredData(data);
      return;
    }

    const lowerCaseSearchText = searchText.toLowerCase();
    
    const filtered = data.filter(item => {
      // Search through all specified search fields
      return searchFields.some(field => {
        const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], item);
        return fieldValue && String(fieldValue).toLowerCase().includes(lowerCaseSearchText);
      });
    });
    
    setFilteredData(filtered);
  }, [searchText, data, searchFields]);

  const handleToggle = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(item => item !== id);
    }

    setSelected(newSelected);
    if (onChange) onChange(newSelected);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelectedIds = filteredData.map(item => item[idField]);
      setSelected(newSelectedIds);
      if (onChange) onChange(newSelectedIds);
      return;
    }
    
    setSelected([]);
    if (onChange) onChange([]);
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm(selected);
    onClose();
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;
  const numSelected = selected.length;
  const rowCount = filteredData.length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <TextField
            fullWidth
            placeholder="Αναζήτηση..."
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {data.length === 0 ? (
          <Typography align="center" sx={{ py: 3 }}>{noDataMessage}</Typography>
        ) : filteredData.length === 0 ? (
          <Typography align="center" sx={{ py: 3 }}>Δεν βρέθηκαν αποτελέσματα</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={numSelected > 0 && numSelected < rowCount}
                      checked={rowCount > 0 && numSelected === rowCount}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  {columns.map((column, index) => (
                    <TableCell 
                      key={index}
                      style={{ width: column.width }}
                    >
                      {column.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item) => {
                  const isItemSelected = isSelected(item[idField]);
                  return (
                    <TableRow 
                      hover
                      onClick={() => handleToggle(item[idField])}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={item[idField]}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
                      </TableCell>
                      {columns.map((column, index) => (
                        <TableCell key={index}>
                          {item[column.field]}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="body2">
            {numSelected} από {rowCount} επιλεγμένα
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Άκυρο</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Επιβεβαίωση
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectionDialog;