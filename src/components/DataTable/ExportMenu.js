import React from "react";
import { Menu, MenuItem } from "@mui/material";

const ExportMenu = ({ anchorEl, onClose, exportToExcel, exportToPDF }) => {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem onClick={exportToExcel}>Εξαγωγή σε Excel</MenuItem>
      <MenuItem onClick={exportToPDF}>Εξαγωγή σε PDF</MenuItem>
    </Menu>
  );
};

export default ExportMenu;