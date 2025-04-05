import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Tooltip } from "@mui/material";
import { useFormik } from "formik";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import * as yup from "yup";

const EditDialog = ({ 
  
  open, 
  onClose, 
  editValues = {},
  handleEditSave, 
  fields 
}) => {
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
      ...fields.reduce((values, field) => {
        values[field.accessorKey] = editValues[field.accessorKey] || "";
        return values;
      }, {}),
      id: editValues.id || ""  // Προσθήκη του id στα initialValues
    },
    validationSchema: validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (Object.keys(formik.errors).length === 0) {
        handleEditSave(values);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="edit-dialog-title">
      <DialogTitle id="edit-dialog-title">Επεξεργασία Εγγραφής</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {fields.map((field) => (
            <div key={field.accessorKey} style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
{field.type === "select" ? (
  <TextField
    margin="dense"
    label={field.header}
    name={field.accessorKey}
    value={formik.values[field.accessorKey] || ""}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    fullWidth
    select
    SelectProps={{
      native: true,
    }}
    error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
    helperText={
      formik.touched[field.accessorKey] && formik.errors[field.accessorKey]
        ? formik.errors[field.accessorKey]
        : ""
    }
  >
    <option value=""></option>
    {field.options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </TextField>
) : (
  <TextField
    margin="dense"
    label={field.header}
    name={field.accessorKey}
    value={formik.values[field.accessorKey] || ""}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    fullWidth
    error={formik.touched[field.accessorKey] && Boolean(formik.errors[field.accessorKey])}
    helperText={
      formik.touched[field.accessorKey] && formik.errors[field.accessorKey]
        ? formik.errors[field.accessorKey]
        : ""
    }
  />
)}
              {field.example && (
                <Tooltip title={`Παράδειγμα: ${field.example}`} placement="right">
                  <span style={{ marginLeft: "8px", color: "#888", cursor: "default" }}>
                    <HelpOutlineIcon fontSize="small" />
                  </span>
                </Tooltip>
              )}
            </div>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Ακύρωση
          </Button>
          <Button 
            type="submit" 
            color="primary" 
            disabled={Object.keys(formik.errors).length > 0 || !formik.dirty}
          >
            Αποθήκευση
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditDialog;