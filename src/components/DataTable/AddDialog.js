import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormControl, InputLabel, MenuItem, Select, FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { useFormik } from 'formik';
import * as yup from 'yup';

const AddDialog = ({ open, onClose, fields = [], handleAddSave }) => {
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

  // Μνημοποίηση των αρχικών τιμών για να μην ξαναδημιουργούνται σε κάθε render
  const initialValues = useMemo(() => {
    const values = {};
    fields.forEach(field => {
      values[field.accessorKey] = field.defaultValue || '';
    });
    return values;
  }, [fields]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      handleAddSave(values);
    },
    enableReinitialize: true,
  });

  // Επαναφορά της φόρμας όταν κλείνει το dialog
  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const renderField = (field, index) => {
    if (!field) return null;
    
    const key = `field-${field.accessorKey}-${index}`;
    
    switch (field.type) {
      case 'select':
        return (
          <FormControl 
            fullWidth 
            key={key}
            error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
          >
            <InputLabel id={`${field.accessorKey}-label`}>{field.header}</InputLabel>
            <Select
              labelId={`${field.accessorKey}-label`}
              name={field.accessorKey}
              value={formik.values[field.accessorKey] || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label={field.header}
              disabled={field.disabled}
            >
              {field.options?.map((option, optIndex) => (
                <MenuItem key={`${key}-option-${optIndex}`} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {formik.touched[field.accessorKey] && formik.errors[field.accessorKey]}
            </FormHelperText>
          </FormControl>
        );
      case 'date':
        return (
          <DatePicker
            key={key}
            label={field.header}
            value={formik.values[field.accessorKey] ? parseISO(formik.values[field.accessorKey]) : null}
            onChange={(value) => {
              formik.setFieldValue(
                field.accessorKey, 
                value ? format(value, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null
              );
            }}
            disabled={field.disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
                error: formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey]),
                helperText: formik.touched[field.accessorKey] && formik.errors[field.accessorKey],
              },
            }}
          />
        );
      default:
        return (
          <TextField
            key={key}
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>Προσθήκη Νέας Εγγραφής</DialogTitle>
        <DialogContent>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            {fields.map((field, index) => (
              <div key={`field-container-${field.accessorKey}-${index}`}>
                {renderField(field, index)}
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Άκυρο</Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={!formik.isValid || formik.isSubmitting}
          >
            Προσθήκη
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddDialog;