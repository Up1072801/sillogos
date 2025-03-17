import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

const ActionsCell = ({ row, enableEdit, enableDelete, handleEditClick, handleDelete }) => {
  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "flex-end" }}>
      {enableEdit && (
        <Tooltip title="Επεξεργασία" aria-label="επεξεργασία">
          <IconButton onClick={() => handleEditClick(row.original)}>
            <Edit />
          </IconButton>
        </Tooltip>
      )}
      {enableDelete && (
        <Tooltip title="Διαγραφή" aria-label="διαγραφή">
          <IconButton onClick={() => handleDelete(row.original.id)}>
            <Delete />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ActionsCell;
