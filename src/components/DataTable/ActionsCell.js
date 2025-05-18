import React, { useState } from "react";
import { Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

const ActionsCell = ({ row, enableEdit, enableDelete, handleEditClick, handleDelete, deleteConfig }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    let deletePayload;
    
    // Χρησιμοποιούμε το deleteConfig.getPayload αν υπάρχει
    if (deleteConfig?.getPayload) {
      console.log("Using deleteConfig.getPayload");
      deletePayload = deleteConfig.getPayload(row.original);
    }
    // Διαφορετικά ψάχνουμε για οποιοδήποτε πεδίο ID
    else {
      console.log("Finding ID from row.original");
      // Προτεραιότητα: id, id_ekpaideuti, id_epafis, οποιοδήποτε πεδίο που περιέχει "id" στο όνομα
      deletePayload = row.original.id || 
                     row.original.id_ekpaideuti || 
                     row.original.id_epafis;
                     
      // Αν ακόμα δεν έχουμε βρει ID, ψάχνουμε οποιοδήποτε πεδίο που περιέχει "id"
      if (!deletePayload && deletePayload !== 0) {
        for (const key in row.original) {
          if (key.toLowerCase().includes('id') && row.original[key] !== null && row.original[key] !== undefined) {
            console.log(`Found ID field: ${key} = ${row.original[key]}`);
            deletePayload = row.original[key];
            break;
          }
        }
      }
    }
    
    console.log("Final deletePayload:", deletePayload);
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