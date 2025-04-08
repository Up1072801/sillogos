import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, InputAdornment, Typography, Box, Checkbox, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState(selectedIds);

  // Φιλτράρισμα δεδομένων με βάση την αναζήτηση
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return searchFields.some(field => {
      const fieldValue = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], item) 
        : item[field];
      return String(fieldValue || '').toLowerCase().includes(searchTermLower);
    });
  });

  // Ενημέρωση του selectAll όταν αλλάζουν τα επιλεγμένα ids
  useEffect(() => {
    if (filteredData.length > 0) {
      const allSelected = filteredData.every(item => 
        localSelectedIds.includes(item[idField])
      );
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [localSelectedIds, filteredData, idField]);

  // Αρχικοποίηση των τοπικών επιλεγμένων ids όταν ανοίγει το dialog
  useEffect(() => {
    setLocalSelectedIds(selectedIds);
  }, [selectedIds, open]);

  // Χειρισμός επιλογής/αποεπιλογής όλων
  const handleSelectAll = () => {
    if (selectAll) {
      // Αποεπιλογή όλων των φιλτραρισμένων αντικειμένων
      const filteredIds = filteredData.map(item => item[idField]);
      const newSelected = localSelectedIds.filter(id => !filteredIds.includes(id));
      setLocalSelectedIds(newSelected);
      onChange && onChange(newSelected);
    } else {
      // Επιλογή όλων των φιλτραρισμένων αντικειμένων
      const filteredIds = filteredData.map(item => item[idField]);
      const newSelected = [...new Set([...localSelectedIds, ...filteredIds])];
      setLocalSelectedIds(newSelected);
      onChange && onChange(newSelected);
    }
  };

  // Χειρισμός επιλογής/αποεπιλογής μεμονωμένου στοιχείου
  const handleToggleItem = (id) => {
    let newSelected;
    if (localSelectedIds.includes(id)) {
      newSelected = localSelectedIds.filter(itemId => itemId !== id);
    } else {
      newSelected = [...localSelectedIds, id];
    }
    setLocalSelectedIds(newSelected);
    onChange && onChange(newSelected);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <TextField
            fullWidth
            placeholder="Αναζήτηση..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {filteredData.length > 0 ? (
          <Box>
            {/* Επιλογή όλων */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  indeterminate={
                    localSelectedIds.some(id => 
                      filteredData.some(item => item[idField] === id)
                    ) && 
                    !filteredData.every(item => 
                      localSelectedIds.includes(item[idField])
                    )
                  }
                />
              }
              label={<Typography sx={{ fontWeight: 'bold' }}>Επιλογή όλων</Typography>}
            />
            
            {/* Πίνακας δεδομένων */}
            <TableContainer 
              component={Paper} 
              sx={{ mt: 1, maxHeight: 350, overflow: 'auto' }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" style={{ width: '48px' }}></TableCell>
                    {columns.map((column, index) => (
                      <TableCell 
                        key={index}
                        style={column.width ? { width: column.width } : {}}
                      >
                        {column.header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item) => {
                    const isSelected = localSelectedIds.includes(item[idField]);
                    
                    return (
                      <TableRow 
                        key={item[idField]}
                        hover
                        selected={isSelected}
                        onClick={() => handleToggleItem(item[idField])}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleToggleItem(item[idField])}
                          />
                        </TableCell>
                        {columns.map((column, index) => (
                          <TableCell key={index}>
                            {column.render 
                              ? column.render(item) 
                              : column.field.includes('.')
                                ? column.field.split('.').reduce((obj, key) => obj?.[key], item)
                                : item[column.field] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Μετρητής επιλεγμένων */}
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Επιλεγμένα: {localSelectedIds.length} από {data.length}
            </Typography>
          </Box>
        ) : (
          <Typography align="center" sx={{ py: 4 }}>{noDataMessage}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Ακύρωση</Button>
        <Button 
          variant="contained" 
          onClick={() => onConfirm && onConfirm(localSelectedIds)}
          disabled={localSelectedIds.length === 0}
        >
          Επιλογή
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectionDialog;