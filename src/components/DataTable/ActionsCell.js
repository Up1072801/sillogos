import React, { useState } from "react";
import { Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

const ActionsCell = ({ row, enableEdit, enableDelete, handleEditClick, handleDelete, deleteConfig }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    const deletePayload = deleteConfig?.getPayload
      ? deleteConfig.getPayload(row.original)
      : row.original.id;  // Αποστολή μόνο του ID αν δεν υπάρχει deleteConfig
    handleDelete(deletePayload);
    setOpenDeleteDialog(false);
  };

  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "flex-end" }}>
      {enableEdit && (
        <Tooltip title="Επεξεργασία">
          <IconButton onClick={() => handleEditClick(row.original)}>
            <Edit />
          </IconButton>
        </Tooltip>
      )}
      {enableDelete && (
        <>
          <Tooltip title="Διαγραφή">
            <IconButton onClick={handleDeleteClick}>
              <Delete />
            </IconButton>
          </Tooltip>
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
          >
            <DialogTitle>Επιβεβαίωση Διαγραφής</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {deleteConfig?.confirmationMessage || "Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή την εγγραφή;"}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                Ακύρωση
              </Button>
              <Button onClick={handleConfirmDelete} color="error" autoFocus>
                Διαγραφή
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ActionsCell;