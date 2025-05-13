import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormControl, InputLabel, MenuItem, Select, FormHelperText,
  Table, TableHead, TableRow, TableCell, TableBody, Checkbox, TableContainer,
  Paper, Typography, Box, InputAdornment, IconButton, TablePagination, Radio
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { useFormik } from 'formik';
import * as yup from 'yup';
import LocationEditor from "../LocationEditor";

const AddDialog = ({ 
  open, 
  onClose, 
  fields = [], 
  handleAddSave,
  title = "Προσθήκη Νέας Εγγραφής",
  additionalInfo,
  initialValues: externalInitialValues,
  resourceData = {} // Added parameter for additional data needed by custom field types
}) => {
  const [searchTexts, setSearchTexts] = useState({});
  const [paginationState, setPaginationState] = useState({});
  
  // Μνημοποίηση (memoization) του validation schema για να μην ξαναδημιουργείται σε κάθε render
  const validationSchema = useMemo(() => {
    const schemaObject = {};
    fields.forEach(field => {
      if (field?.validation) {
        schemaObject[field.accessorKey] = field.validation;
      }
    });
    return yup.object(schemaObject);
  }, [fields]);

  // Χρησιμοποιήστε useMemo για τα initialValues και μετακινήστε το αρχικό αντικείμενο έξω από το render
  const initialValues = useMemo(() => {
    const values = {};
    fields.forEach(field => {
      if (field.type === 'tableSelect') {
        values[field.accessorKey] = []; // Πάντα αρχικοποίηση ως πίνακας
      } else if (field.type === 'multiSelect') {
        values[field.accessorKey] = [];
      } else if (field.defaultValue !== undefined) {
        values[field.accessorKey] = field.defaultValue;
      } else {
        values[field.accessorKey] = '';
      }
    });
    return values;
  }, [fields]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      handleAddSave(values);
    },
    enableReinitialize: false, // Σημαντικό: Μην ενεργοποιήσετε αυτό!
  });

  // Προσθέστε μετά την αρχικοποίηση του formik (περίπου γραμμή 60)

  // State για την αποθήκευση του υπολογισμένου κόστους
  const [calculatedCost, setCalculatedCost] = useState(null);

  // Υπολογισμός κόστους όταν αλλάζουν τα τιμές φόρμας
  useEffect(() => {
    if (resourceData?.calculateCost) {
      const cost = resourceData.calculateCost(formik.values, resourceData);
      setCalculatedCost(cost);
    }
  }, [formik.values, resourceData]);

  // Διορθώσεις στο AddDialog για την επεξεργασία 
  // Προσθήκη στην αρχή της συνάρτησης για να διασφαλίσουμε ότι το initialValues χρησιμοποιείται σωστά

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      formik.resetForm({
        values: initialValues
      });
    }
  }, [initialValues]);

  // Επαναφορά της φόρμας όταν κλείνει το dialog
  useEffect(() => {
    // Μόνο όταν ανοίγει το dialog και υπάρχουν externalInitialValues
    if (open && externalInitialValues) {
      // Αναφέρουμε συγκεκριμένα τα πεδία αντί να κάνουμε βρόχο για όλα
      fields.forEach(field => {
        if (externalInitialValues.hasOwnProperty(field.accessorKey)) {
          formik.setFieldValue(field.accessorKey, externalInitialValues[field.accessorKey]);
        }
      });
    }
    
    // Επαναφορά της φόρμας όταν κλείνει το dialog
    if (!open) {
      formik.resetForm();
    }
  }, [open]); // Μόνο το open ως εξάρτηση - Σημαντικό

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  // Αντικείμενο που αντιστοιχεί τύπους πεδίων με components
  const CUSTOM_COMPONENTS = {
    locationEditor: (field, formik) => (
      <LocationEditor
        value={formik.values[field.accessorKey] || []}
        onChange={(newValue) => formik.setFieldValue(field.accessorKey, newValue)}
      />
    )
  };

  const renderField = (field, index) => {
    // Πρώτα, έλεγχος αν υπάρχει custom component για αυτόν τον τύπο
    if (CUSTOM_COMPONENTS[field.type]) {
      return CUSTOM_COMPONENTS[field.type](field, formik);
    }
    
    // Αν δεν υπάρχει, συνεχίστε με το υπάρχον switch
    switch (field.type) {
      case 'select':
        return (
          <FormControl 
            fullWidth 
            error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
          >
            <InputLabel id={`${field.accessorKey}-label`}>{field.header}</InputLabel>
            <Select
              labelId={`${field.accessorKey}-label`}
              id={field.accessorKey}
              name={field.accessorKey}
              value={formik.values[field.accessorKey] || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label={field.header}
              disabled={field.disabled}
            >
              {field.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched[field.accessorKey] && formik.errors[field.accessorKey] && (
              <FormHelperText>{formik.errors[field.accessorKey]}</FormHelperText>
            )}
          </FormControl>
        );
        
      case 'multiSelect':
        return (
          <FormControl 
            fullWidth 
            error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
          >
            <InputLabel id={`${field.accessorKey}-label`}>{field.header}</InputLabel>
            <Select
              labelId={`${field.accessorKey}-label`}
              id={field.accessorKey}
              name={field.accessorKey}
              multiple
              value={formik.values[field.accessorKey] || []}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label={field.header}
              disabled={field.disabled}
            >
              {field.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched[field.accessorKey] && formik.errors[field.accessorKey] && (
              <FormHelperText>{formik.errors[field.accessorKey]}</FormHelperText>
            )}
          </FormControl>
        );
        
      case 'date':
        return (
          <TextField
            id={field.accessorKey}
            name={field.accessorKey}
            label={field.header}
            type="date"
            value={formik.values[field.accessorKey] || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
            helperText={formik.touched[field.accessorKey] && formik.errors[field.accessorKey]}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        );
        
      case 'tableSelect': {
        const items = resourceData[field.dataKey] || [];
        const fieldSearchText = searchTexts[field.accessorKey] || '';
        
        // Use paginationState instead of local useState hooks
        const fieldKey = field.accessorKey;
        const page = paginationState[fieldKey]?.page || 0;
        const rowsPerPage = paginationState[fieldKey]?.rowsPerPage || (field.pageSize || 5);
        
        // Update page handlers to use the shared state
        const handleChangePage = (e, newPage) => {
          setPaginationState(prev => ({
            ...prev,
            [fieldKey]: {
              ...prev[fieldKey],
              page: newPage
            }
          }));
        };
        
        const handleChangeRowsPerPage = (e) => {
          const newRowsPerPage = parseInt(e.target.value, 10);
          setPaginationState(prev => ({
            ...prev,
            [fieldKey]: {
              ...prev[fieldKey],
              page: 0,
              rowsPerPage: newRowsPerPage
            }
          }));
        };
        
        // Φιλτράρισμα στοιχείων με βάση το κείμενο αναζήτησης
        const filteredItems = items.filter(item => {
          if (!fieldSearchText.trim()) return true;
          
          // Αναζήτηση στα καθορισμένα πεδία ή σε όλα τα πεδία
          if (field.searchFields && field.searchFields.length > 0) {
            return field.searchFields.some(searchField => 
              item[searchField] && String(item[searchField]).toLowerCase().includes(fieldSearchText.toLowerCase())
            );
          }
          
          // Αναζήτηση σε όλα τα πεδία αν δεν καθορίζονται συγκεκριμένα
          return Object.values(item).some(value => 
            value && String(value).toLowerCase().includes(fieldSearchText.toLowerCase())
          );
        });
        
        // Εφαρμογή σελιδοποίησης
        const paginatedItems = filteredItems.slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage
        );
        
        // Έλεγχος αν είναι ενεργοποιημένη η μονή επιλογή
        const singleSelect = field.singleSelect === true;
        
        const handleItemSelection = (itemId) => {
          if (singleSelect) {
            // Μονή επιλογή - αντικατάσταση της τιμής με το νέο ID
            formik.setFieldValue(field.accessorKey, itemId);
          } else {
            // Πολλαπλή επιλογή - διαχείριση πίνακα τιμών
            const currentValues = Array.isArray(formik.values[field.accessorKey]) 
              ? [...formik.values[field.accessorKey]] 
              : [];
            
            const index = currentValues.indexOf(itemId);
            
            if (index === -1) {
              formik.setFieldValue(field.accessorKey, [...currentValues, itemId]);
            } else {
              currentValues.splice(index, 1);
              formik.setFieldValue(field.accessorKey, currentValues);
            }
          }
        };
        
        // Διασφάλιση σωστών αρχικών τιμών με βάση τον τύπο επιλογής (μονή/πολλαπλή)
        useEffect(() => {
          if (open) {
            if (singleSelect && Array.isArray(formik.values[field.accessorKey])) {
              formik.setFieldValue(field.accessorKey, '');
            } else if (!singleSelect && !Array.isArray(formik.values[field.accessorKey])) {
              formik.setFieldValue(field.accessorKey, []);
            }
          }
        }, [open, singleSelect, field.accessorKey]);
        
        useEffect(() => {
          // Εδώ τοποθετούμε τη συνθήκη ΜΕΣΑ στο useEffect, όχι έξω
          if (open && initialValues && initialValues[field.accessorKey]) {
            const lookupId = initialValues[field.accessorKey].toString();
            const foundItem = items.find(item => {
              // Δοκιμάζουμε διάφορους τρόπους αντιστοίχισης ID
              const itemIds = [
                item.id?.toString(),
                item.id_epafis?.toString(), 
                item.id_eksoplismou?.toString(),
                item.id_ekpaideuti?.toString()
              ].filter(Boolean);
              
              return itemIds.includes(lookupId);
            });
            
            if (foundItem) {
              const itemId = foundItem.id?.toString() || 
                             foundItem.id_epafis?.toString() || 
                             foundItem.id_eksoplismou?.toString() ||
                             foundItem.id_ekpaideuti?.toString();
              
              if (field.singleSelect) {
                formik.setFieldValue(field.accessorKey, itemId);
              } else if (itemId && !formik.values[field.accessorKey]?.includes(itemId)) {
                const currentValues = Array.isArray(formik.values[field.accessorKey]) ? 
                                    [...formik.values[field.accessorKey]] : [];
                formik.setFieldValue(field.accessorKey, [...currentValues, itemId]);
              }
            }
          }
        }, [open, items, initialValues, formik, field.accessorKey, field.singleSelect]);
        
        return (
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              {field.header}
            </Typography>
            
            <TextField
              fullWidth
              placeholder="Αναζήτηση..."
              value={fieldSearchText}
              onChange={(e) => setSearchTexts(prev => ({
                ...prev,
                [field.accessorKey]: e.target.value
              }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />
            
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    {field.columns?.map((col, idx) => (
                      <TableCell key={idx}>{col.header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((item) => {
                      // Έλεγχος αν το στοιχείο είναι επιλεγμένο
                      const isSelected = singleSelect
                        ? formik.values[field.accessorKey] === item.id?.toString() || 
                          formik.values[field.accessorKey] === item.id
                        : Array.isArray(formik.values[field.accessorKey]) && 
                          (formik.values[field.accessorKey]?.includes(item.id?.toString()) || 
                           formik.values[field.accessorKey]?.includes(item.id));
                      
                      return (
                        <TableRow
                          hover
                          onClick={() => handleItemSelection(item.id?.toString())}
                          key={item.id}
                          selected={isSelected}
                        >
                          <TableCell padding="checkbox">
                            {singleSelect ? (
                              <Radio checked={isSelected} />
                            ) : (
                              <Checkbox checked={isSelected} />
                            )}
                          </TableCell>
                          {field.columns?.map((col, idx) => (
                            <TableCell key={idx}>{item[col.field]}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={(field.columns?.length || 0) + 1} align="center">
                        {field.noDataMessage || "Δεν βρέθηκαν αποτελέσματα"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Προσθήκη σελιδοποίησης */}
            <TablePagination
              component="div"
              count={filteredItems.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Ανά σελίδα:"
              labelDisplayedRows={({from, to, count}) => 
                `${from}-${to} από ${count !== -1 ? count : `πάνω από ${to}`}`
              }
            />
            
            {formik.touched[field.accessorKey] && formik.errors[field.accessorKey] && (
              <FormHelperText error>{formik.errors[field.accessorKey]}</FormHelperText>
            )}
          </Box>
        );
      }
        
      case 'custom':
        return field.render ? field.render(formik) : null;
        
      default:
        return (
          <TextField
            id={field.accessorKey}
            name={field.accessorKey}
            label={field.header}
            value={formik.values[field.accessorKey] || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
            helperText={formik.touched[field.accessorKey] && formik.errors[field.accessorKey]}
            fullWidth
            variant="outlined"
            disabled={field.disabled}
            type={field.fieldType || 'text'}
            placeholder={field.placeholder || ''}
          />
        );
    }
  };

  // Αν δεν υπάρχουν πεδία, δεν εμφανίζουμε τίποτα
  if (!fields || fields.length === 0) {
    return null;
  }

  // Determine if there are any tableSelect fields
  const hasTableSelects = fields.some(field => field.type === 'tableSelect');

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={hasTableSelects ? "md" : "sm"} 
      fullWidth
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {additionalInfo && (
            <Typography variant="subtitle2" sx={{ mb: 2, fontStyle: 'italic' }}>
              {additionalInfo}
            </Typography>
          )}
          
          <Box sx={{ mt: 2 }}>
            {fields.map((field, index) => (
              <Box 
                key={`field-container-${field.accessorKey}-${index}`}
                sx={{
                  mb: 3,
                  ...(field.type === 'tableSelect' && { gridColumn: '1 / -1' })
                }}
              >
                {renderField(field, index)}
              </Box>
            ))}
          </Box>

          {resourceData?.enableCostCalculation && calculatedCost && (
            <Box 
              sx={{ 
                mt: 2, 
                mb: 1, 
                p: 2, 
                backgroundColor: 'rgba(25, 118, 210, 0.08)', 
                borderRadius: 1,
                border: '1px solid rgba(25, 118, 210, 0.2)'
              }}
            >
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Υπολογισμός Κόστους:
              </Typography>
              
              {calculatedCost.days && (
                <Typography variant="body2" gutterBottom>
                  Ημέρες Παραμονής: {calculatedCost.days}
                </Typography>
              )}
              
              {calculatedCost.memberPrice !== undefined && (
                <Typography variant="body2" gutterBottom>
                  Κόστος Μελών: {calculatedCost.memberPrice}€
                </Typography>
              )}
              
              {calculatedCost.nonMemberPrice !== undefined && (
                <Typography variant="body2" gutterBottom>
                  Κόστος Μη Μελών: {calculatedCost.nonMemberPrice}€
                </Typography>
              )}
              
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }} fontWeight="bold">
                Συνολικό Κόστος: {calculatedCost.totalPrice !== undefined ? `${calculatedCost.totalPrice}€` : 'Υπολογίζεται...'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Άκυρο</Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={!formik.isValid || formik.isSubmitting}
          >
            {externalInitialValues ? 'Αποθήκευση' : 'Προσθήκη'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddDialog;