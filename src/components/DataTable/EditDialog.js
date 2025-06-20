import React, { useState, useEffect } from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Divider,
  Tooltip, FormControl, InputLabel, MenuItem, Select, FormHelperText,
  Table, TableHead, TableRow, TableCell, TableBody, Checkbox, TableContainer,
  Paper, Typography, Box, InputAdornment, FormLabel, FormGroup, FormControlLabel,Grid
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useFormik } from "formik";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import * as yup from "yup";
import LocationEditor from "../../components/LocationEditor"; // Προσαρμόστε το path ανάλογα
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { el } from 'date-fns/locale';

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

const EditDialog = ({ 
  open, 
  onClose, 
  editValues = {},
  handleEditSave, 
  fields,
  title = "Επεξεργασία",
  resourceData = {} // Added parameter for additional data needed by custom field types
}) => {
  const [searchText, setSearchText] = useState('');
  const [isFormValid, setIsFormValid] = useState(true);

  const validationSchema = yup.object(
    fields.reduce((schema, field) => {
      if (field.validation) {
        schema[field.accessorKey] = field.validation;
      }
      return schema;
    }, {})
  );

  const formik = useFormik({
    initialValues: {
      // Χρήση ασφαλούς πρόσβασης με fallback σε κενό αντικείμενο
      ...fields.reduce((values, field) => {
        // Διασφαλίζουμε ότι το editValues δεν είναι null/undefined
        const safeEditValues = editValues || {};
        
        if (field.accessorKey.includes('.')) {
          // Χειρισμός εμφωλευμένων πεδίων
          const accessorParts = field.accessorKey.split('.');
          let value = safeEditValues;
          
          for (const part of accessorParts) {
            value = value && typeof value === 'object' ? value[part] : undefined;
          }
          
          values[field.accessorKey] = value !== undefined ? value : "";
        } else {
          // Χειρισμός απλών πεδίων
          values[field.accessorKey] = safeEditValues[field.accessorKey] !== undefined ? 
            safeEditValues[field.accessorKey] : "";
        }
        
        return values;
      }, {}),
      id: editValues?.id || editValues?.id_sxolis || editValues?.id_epafis || editValues?.id_ekpaideuti || ""
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleEditSave(values);
    },
  });

  useEffect(() => {
    if (editValues && Object.keys(editValues).length > 0) {
      const updatedValues = {};
      
      fields.forEach(field => {
        if (field.accessorKey.includes('.')) {
          // Χειρισμός εμφωλευμένων πεδίων
          const accessorParts = field.accessorKey.split('.');
          let value = editValues;
          
          for (const part of accessorParts) {
            if (!value) break;
            value = value[part];
          }
          
          updatedValues[field.accessorKey] = value !== undefined ? value : "";
        } else {
          // Χειρισμός απλών πεδίων
          updatedValues[field.accessorKey] = editValues[field.accessorKey] !== undefined ? 
            editValues[field.accessorKey] : "";
        }
      });
      
      formik.setValues({
        ...formik.values,
        ...updatedValues,
        id: editValues.id || editValues.id_sxolis || editValues.id_epafis || editValues.id_ekpaideuti || ""
      });
    }
  }, [editValues, fields]);

  useEffect(() => {
    formik.validateForm().then(errors => {
      setIsFormValid(Object.keys(errors).length === 0);
    });
  }, [formik.values]);

  const renderField = (field) => {
    // Έλεγχος για το locationEditor type
    if (field.type === 'locationEditor') {
      return (
        <LocationEditor
          value={formik.values[field.accessorKey] || []}
          onChange={(newValue) => formik.setFieldValue(field.accessorKey, newValue)}
        />
      );
    }

    // Το υπάρχον switch μένει ως έχει
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
                      const v = formik.values[field.accessorKey];
                      
                      // For ISO strings (YYYY-MM-DDT...)
                      if (typeof v === "string" && v.includes("T")) {
                        return new Date(v);
                      }
                      
                      // For YYYY-MM-DD format
                      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
                        const [y, m, d] = v.split("-");
                        return new Date(Number(y), Number(m) - 1, Number(d));
                      }
                      
                      // For DD/MM/YYYY format (Greek)
                      if (typeof v === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
                        const [d, m, y] = v.split("/");
                        return new Date(Number(y), Number(m) - 1, Number(d));
                      }
                      
                      // If it's already a Date object
                      if (v instanceof Date) return v;
                      
                      return null;
                    })()
                  : null
              }
              onChange={(date) => {
                if (date instanceof Date && !isNaN(date.getTime())) {
                  // Create YYYY-MM-DD string without timezone issues
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const localDateString = `${year}-${month}-${day}`;
                  formik.setFieldValue(field.accessorKey, localDateString);
                  
                  // Mark field as touched and run validation immediately
                  formik.setFieldTouched(field.accessorKey, true, true);
                } else {
                  formik.setFieldValue(field.accessorKey, "");
                  formik.setFieldTouched(field.accessorKey, true, true);
                }
                formik.validateForm(); // Still keep this
              }}
              format="dd/MM/yyyy" // Display in Greek format
              slotProps={{
                textField: {
                  fullWidth: true,
                  id: field.accessorKey, // Add id for focusing
                  error: formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey]),
                  helperText: formik.touched[field.accessorKey] ? formik.errors[field.accessorKey] : "",
                  // Add onBlur to mark field as touched
                  onBlur: () => formik.setFieldTouched(field.accessorKey, true, true)
                }
              }}
            />
          </LocalizationProvider>
        );
        
      case 'tableSelect': // New field type for athlete selection
        const items = resourceData[field.dataKey] || [];
        const filteredItems = items.filter(item => 
          (item.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
          (item.firstName?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
          (item.lastName?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
          (item.fullName?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
          (item.athleteNumber?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
          (item.arithmosdeltiou?.toString().toLowerCase() || '').includes(searchText.toLowerCase())
        );
        
        const displayName = (item) => {
          if (item.name) return item.name;
          if (item.fullName) return item.fullName;
          return `${item.firstName || ''} ${item.lastName || ''}`.trim();
        };

        // Make sure the value is always an array
        if (!Array.isArray(formik.values[field.accessorKey])) {
          formik.setFieldValue(field.accessorKey, []);
        }
        
        return (
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              {field.header}
            </Typography>
            
            <TextField
              fullWidth
              placeholder="Αναζήτηση..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
        
      case "custom":
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
        
      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            maxRows={6}
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
          <div style={{ position: "relative" }}>
            <TextField
              fullWidth
              id={field.accessorKey}
              name={field.accessorKey}
              label={field.header}
              value={formik.values[field.accessorKey] || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
              helperText={
                formik.touched[field.accessorKey] && formik.errors[field.accessorKey]
                ? formik.errors[field.accessorKey]
                : ""
              }
            />
            {field.example && (
              <Tooltip title={`Παράδειγμα: ${field.example}`} placement="right">
                <span style={{ marginLeft: "8px", color: "#888", cursor: "default" }}>
                  <HelpOutlineIcon fontSize="small" />
                </span>
              </Tooltip>
            )}
          </div>
        );
    }
  };

  // Determine if there are any tableSelect fields
  const hasTableSelects = fields.some(field => field.type === 'tableSelect');

  // Add this handler for Enter key press
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Prevent default to avoid unexpected behavior
      event.preventDefault();
      // Submit the form if valid
      if (Object.keys(formik.errors).length === 0 && !formik.isSubmitting) {
        formik.handleSubmit();
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={hasTableSelects ? "md" : "sm"} 
      fullWidth
      onKeyDown={handleKeyDown} // Add keyDown handler here
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
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
          <Button onClick={onClose} color="secondary">
            Ακύρωση
          </Button>
          <Button 
            type="submit" 
            color="primary" 
            disabled={!isFormValid || formik.isSubmitting}
          >
            Αποθήκευση
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditDialog;