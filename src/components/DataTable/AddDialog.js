import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormControl, InputLabel, MenuItem, Select, FormHelperText,
  Table, TableHead, TableRow, TableCell, TableBody, Checkbox, TableContainer,
  Paper, Typography, Box, InputAdornment, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { useFormik } from 'formik';
import * as yup from 'yup';

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
      if (field.type === 'tableSelect' || field.type === 'multiSelect') {
        values[field.accessorKey] = [];
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

  const renderField = (field, index) => {
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
        
        const filteredItems = items.filter(item => 
          Object.values(item).some(value => 
            value && String(value).toLowerCase().includes(fieldSearchText.toLowerCase())
          )
        );

        // Βεβαιωθείτε ότι η τιμή είναι πάντα ένας πίνακας
        useEffect(() => {
          if (open && field.type === 'tableSelect' && !Array.isArray(formik.values[field.accessorKey])) {
            formik.setFieldValue(field.accessorKey, []);
          }
        }, [open, field.accessorKey]); // Σημαντική βελτίωση - ελάχιστες εξαρτήσεις
        
        const displayName = (item) => {
          if (item.name) return item.name;
          if (item.fullName) return item.fullName;
          return `${item.firstName || ''} ${item.lastName || ''}`.trim();
        };

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
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          formik.values[field.accessorKey].length > 0 && 
                          formik.values[field.accessorKey].length < items.length
                        }
                        checked={
                          items.length > 0 && 
                          formik.values[field.accessorKey].length === items.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            formik.setFieldValue(
                              field.accessorKey, 
                              items.map(item => item.id)
                            );
                          } else {
                            formik.setFieldValue(field.accessorKey, []);
                          }
                        }}
                      />
                    </TableCell>
                    {field.columns.map((column) => (
                      <TableCell key={column.field}>{column.header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const isSelected = formik.values[field.accessorKey].includes(item.id);
                      return (
                        <TableRow
                          hover
                          onClick={() => {
                            const selectedIds = [...formik.values[field.accessorKey]];
                            const selectedIndex = selectedIds.indexOf(item.id);
                            
                            if (selectedIndex === -1) {
                              selectedIds.push(item.id);
                            } else {
                              selectedIds.splice(selectedIndex, 1);
                            }
                            
                            formik.setFieldValue(field.accessorKey, selectedIds);
                          }}
                          key={item.id}
                          selected={isSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          {field.columns.map((column) => (
                            <TableCell key={`${item.id}-${column.field}`}>
                              {column.valueGetter ? column.valueGetter(item) : item[column.field]}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={field.columns.length + 1} align="center">
                        Δεν βρέθηκαν αποτελέσματα
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {formik.touched[field.accessorKey] && formik.errors[field.accessorKey] && (
              <FormHelperText error>{formik.errors[field.accessorKey]}</FormHelperText>
            )}
            
            <Typography variant="body2" sx={{ mt: 1 }}>
              Επιλεγμένοι: {formik.values[field.accessorKey].length}
            </Typography>
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