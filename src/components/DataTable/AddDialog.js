import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField } from "@mui/material";

const AddDialog = ({ open, onClose, newRow, handleAddChange, handleAddSave, fields }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="add-dialog-title">
      <DialogTitle id="add-dialog-title">Προσθήκη Νέου Στοιχείου</DialogTitle>
      <DialogContent>
        {fields.map((field) => (
          <TextField
            key={field.accessorKey}
            margin="dense"
            label={field.header}
            name={field.accessorKey}
            value={newRow[field.accessorKey] || ""}
            onChange={handleAddChange}
            fullWidth
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Ακύρωση
        </Button>
        <Button onClick={handleAddSave} color="primary">
          Αποθήκευση
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDialog;