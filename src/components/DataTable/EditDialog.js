import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

const EditDialog = ({ open, onClose, editValues, handleEditChange, handleEditSave }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="edit-dialog-title" role="dialog">
      <DialogTitle id="edit-dialog-title">Επεξεργασία Εγγραφής</DialogTitle>
      <DialogContent>
        {Object.keys(editValues).map((key) => (
          <TextField
            key={key}
            label={key}
            name={key}
            value={editValues[key] || ""}
            onChange={handleEditChange}
            fullWidth
            margin="dense"
            type={key.includes("date") ? "date" : "text"}
            InputLabelProps={{ shrink: true }}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Ακύρωση</Button>
        <Button onClick={handleEditSave} color="primary" variant="contained">Αποθήκευση</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;