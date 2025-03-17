import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Tooltip } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const AddDialog = ({ open, onClose, fields, handleAddSave }) => {
  // Δημιουργία σχήματος επικύρωσης δυναμικά με βάση τα πεδία
  const validationSchema = yup.object(
    fields.reduce((schema, field) => {
      if (field.validation) {
        schema[field.accessorKey] = field.validation;
      }
      return schema;
    }, {})
  );

  const formik = useFormik({
    initialValues: fields.reduce((values, field) => {
      values[field.accessorKey] = field.defaultValue || "";
      return values;
    }, {}),
    validationSchema: validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values) => {
      if (Object.keys(formik.errors).length === 0) {
        handleAddSave(values);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="add-dialog-title">
      <DialogTitle id="add-dialog-title">Προσθήκη Νέας Επαφής</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {fields.map((field) => (
            <div key={field.accessorKey} style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <TextField
                margin="dense"
                label={field.header}
                name={field.accessorKey}
                value={formik.values[field.accessorKey]}
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
              <Tooltip title={field.example || "Παράδειγμα"} placement="right">
                <span style={{ marginLeft: "8px", color: "#888", cursor: "default" }}>
                  <HelpOutlineIcon fontSize="small" />
                </span>
              </Tooltip>
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

export default AddDialog;