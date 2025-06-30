import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormControl, InputLabel, MenuItem, Select, FormHelperText, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Checkbox, TableContainer,
  Paper, Typography, Box, InputAdornment, IconButton, TablePagination, Radio,
  FormLabel, FormGroup, FormControlLabel, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import el from 'date-fns/locale/el';
import { format, parseISO } from 'date-fns';
import { useFormik } from 'formik';
import * as yup from 'yup';
import LocationEditor from "../LocationEditor";
// Add this to your imports at the top of the file
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    // Επιστρέφει DD/MM/YYYY
    return date.toLocaleDateString("el-GR");
  } catch (e) {
    return "";
  }
};

const AddDialog = ({ 
  open, 
  onClose, 
  fields = [], 
  handleAddSave,
  title = "Προσθήκη Νέας Εγγραφής",
  additionalInfo,
  initialValues: externalInitialValues,
  resourceData = {},
  fieldComponents = {} // Add this parameter to accept fieldComponents
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
    validateOnChange: true,    // Προσθήκη για άμεση επικύρωση κατά την πληκτρολόγηση
    validateOnBlur: true       // Προσθήκη για επικύρωση όταν φεύγει το focus
  });

  // Προσθήκη state για την παρακολούθηση της εγκυρότητας της φόρμας
  const [isFormValid, setIsFormValid] = useState(true);
  
  // Έλεγχος εγκυρότητας φόρμας σε κάθε αλλαγή τιμών
  useEffect(() => {
    formik.validateForm().then(errors => {
      setIsFormValid(Object.keys(errors).length === 0);
    });
  }, [formik.values]);

  // Handler για το Enter key press
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      // Touch all fields
      Object.keys(formik.values).forEach(field => {
        formik.setFieldTouched(field, true, true);
      });
      
      // Force validation before submission
      formik.validateForm().then(errors => {
        if (Object.keys(errors).length === 0 && !formik.isSubmitting) {
          formik.handleSubmit();
        } else {
          // Focus the first field with an error
          const firstErrorField = Object.keys(errors)[0];
          const element = document.getElementById(firstErrorField);
          if (element) element.focus();
        }
      });
    }
  };

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

  // Αντικείμενο που αντιστοιχίζει τύπους πεδίων με components
  const CUSTOM_COMPONENTS = {
    locationEditor: (field, formik) => (
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
        <LocationEditor
          value={formik.values[field.accessorKey] || []}
          onChange={(newValue) => formik.setFieldValue(field.accessorKey, newValue)}
        />
      </LocalizationProvider>
    )
  };

  const renderField = (field, index) => {
    // First, check if there's a custom component for this field type in fieldComponents prop
    if (field.type && fieldComponents && fieldComponents[field.type]) {
      // Use the provided component from fieldComponents
      const CustomComponent = fieldComponents[field.type];
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
          <CustomComponent
            value={formik.values[field.accessorKey] || []}
            onChange={(newValue) => formik.setFieldValue(field.accessorKey, newValue)}
          />
        </LocalizationProvider>
      );
    }
    
    // If no custom component from props, use the built-in CUSTOM_COMPONENTS
    if (field.type && CUSTOM_COMPONENTS[field.type]) {
      return CUSTOM_COMPONENTS[field.type](field, formik);
    }
    
    // If neither, continue with the existing switch
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
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={el}>
            <DatePicker
              label={field.header}
              value={
                formik.values[field.accessorKey]
                  ? (() => {
                      // Same conversion logic as before
                      const v = formik.values[field.accessorKey];
                      
                      if (typeof v === "string" && v.includes("T")) {
                        return new Date(v);
                      }
                      
                      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
                        const [y, m, d] = v.split("-");
                        return new Date(Number(y), Number(m) - 1, Number(d));
                      }
                      
                      if (typeof v === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
                        const [d, m, y] = v.split("/");
                        return new Date(Number(y), Number(m) - 1, Number(d));
                      }
                      
                      if (v instanceof Date) return v;
                      
                      return null;
                    })()
                  : null
              }
              onChange={(date) => {
                if (date instanceof Date && !isNaN(date.getTime())) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const localDateString = `${year}-${month}-${day}`;
                  formik.setFieldValue(field.accessorKey, localDateString);
                } else {
                  formik.setFieldValue(field.accessorKey, "");
                }
                formik.setFieldTouched(field.accessorKey, true, true);
              }}
              format="dd/MM/yyyy"
              openTo="day"
              views={["year", "month", "day"]} // Allow switching between year, month and day views
              slotProps={{
                textField: {
                  fullWidth: true,
                  id: field.accessorKey,
                  error: formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey]),
                  helperText: formik.touched[field.accessorKey] ? formik.errors[field.accessorKey] : "",
                  onBlur: () => formik.setFieldTouched(field.accessorKey, true, true),
                },
                popper: {
                  sx: {
                    zIndex: 1500,
                    "& .MuiPaper-root": {
                      boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
                      borderRadius: "8px",
                      width: "auto",
                      maxWidth: "325px" // Ensure a reasonable max-width
                    }
                  }
                }
              }}
              closeOnSelect={true}
              desktopModeMediaQuery="(min-width: 0px)" // Force desktop mode
              minDate={field.minDateField 
                ? new Date(formik.values[field.minDateField]) 
                : (field.minDate ? new Date(field.minDate) : undefined)}
              maxDate={field.maxDateField 
                ? new Date(formik.values[field.maxDateField]) 
                : (field.maxDate ? new Date(field.maxDate) : undefined)}
              disablePast={field.disablePast === true}
            />
          </LocalizationProvider>
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
        return field.renderInput({ 
          field: { 
            value: formik.values[field.accessorKey] || [], 
            onChange: (value) => formik.setFieldValue(field.accessorKey, value) 
          },
          fieldState: { 
            error: formik.touched[field.accessorKey] && formik.errors[field.accessorKey] 
              ? { message: formik.errors[field.accessorKey] } 
              : undefined 
          }
        });
        
      case 'checkboxGroup':
        return (
          <FormControl 
            fullWidth 
            margin="normal"
            error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
          >
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'medium' }}>{field.header}</FormLabel>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                maxHeight: '200px', 
                overflowY: 'auto',
                backgroundColor: '#fafafa'
              }}
            >
              <Grid container spacing={2}>
                {field.options.map((option) => (
                  <Grid item xs={12} sm={6} md={4} key={option.value}>
                    <FormControlLabel
                      sx={{
                        display: 'flex',
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem'
                        }
                      }}
                      control={
                        <Checkbox
                          checked={formik.values[field.accessorKey]?.includes(option.value.toString())}
                          onChange={(e) => {
                            const values = [...(formik.values[field.accessorKey] || [])];
                            if (e.target.checked) {
                              values.push(option.value.toString());
                            } else {
                              const index = values.indexOf(option.value.toString());
                              if (index !== -1) {
                                values.splice(index, 1);
                              }
                            }
                            formik.setFieldValue(field.accessorKey, values);
                          }}
                          name={`${field.accessorKey}-${option.value}`}
                          size="small"
                          color="primary"
                        />
                      }
                      label={option.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
            <FormHelperText error={Boolean(formik.touched[field.accessorKey] && formik.errors[field.accessorKey])}>
              {formik.touched[field.accessorKey] && formik.errors[field.accessorKey]}
            </FormHelperText>
          </FormControl>
        );
        
      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            maxRows={8}
            id={field.accessorKey}
            name={field.accessorKey}
            label={field.header}
            value={formik.values[field.accessorKey] || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
            helperText={formik.touched[field.accessorKey] && formik.errors[field.accessorKey]}
            margin="normal"
            disabled={field.disabled}
          />
        );
        
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
      onKeyDown={handleKeyDown} // Add keyDown handler here for dialog-level Enter key handling
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
            disabled={!isFormValid || formik.isSubmitting}
            onClick={(e) => {
              e.preventDefault(); // Prevent default form submission
              
              // Touch all fields first to show validation errors
              Object.keys(formik.values).forEach(field => {
                formik.setFieldTouched(field, true, true);
              });
              
              // Force validation before submission
              formik.validateForm().then(errors => {
                if (Object.keys(errors).length === 0) {
                  formik.handleSubmit(); // Only submit if no errors
                } else {
                  // Focus the first field with an error
                  const firstErrorField = Object.keys(errors)[0];
                  const element = document.getElementById(firstErrorField);
                  if (element) element.focus();
                }
              });
            }}
          >
            Αποθήκευση
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddDialog;