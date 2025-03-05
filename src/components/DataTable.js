import React, { useEffect, useState } from "react";
import { MaterialReactTable } from "material-react-table";
import {
  Box,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuItem,
} from "@mui/material";
import { Delete, Add, Edit, FileDownload } from "@mui/icons-material";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DataTable({ data = [], columns, extraColumns = [], detailFields = [] }) {
  const [tableData, setTableData] = useState(data || []); 
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    setTableData(data || []);
  }, [data]);

  const handleAddRow = (newRow) => {  
    setTableData((prevData) => {
      const newId = prevData.length > 0 ? Math.max(...prevData.map(e => Number(e.id))) + 1 : 1;
      return [...prevData, { id: newId.toString(), ...newRow }];
    });
    setOpenAddDialog(false);
  };

  const handleDelete = (id) => {
    setTableData(tableData.filter((row) => row.id !== id));
  };

  const handleEditClick = (row) => {
    setEditingRow(row.id);
    setEditValues({ ...row });
  };

  const handleEditChange = (e) => {
    setEditValues({ ...editValues, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    setTableData(tableData.map(row => row.id === editingRow ? editValues : row));
    setEditingRow(null);
  };

  const handleAddClick = () => {
    setNewRow({});
    setOpenAddDialog(true);
  };

  const handleAddChange = (e) => {
    setNewRow({ ...newRow, [e.target.name]: e.target.value });
  };

  const handleAddSave = () => {
    handleAddRow(newRow);
  };

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "data.xlsx");
    handleExportClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Χρήση της γραμματοσειράς Helvetica
    doc.setFont("helvetica");

    // Δημιουργία κεφαλίδων από τις στήλες
    const headers = columns.map(col => col.header);

    // Δημιουργία δεδομένων από τα δεδομένα του πίνακα
    const data = tableData.map(row => columns.map(col => row[col.accessorKey]));

    // Χρήση της autoTable για να προσθέσεις τα δεδομένα στο PDF
    autoTable(doc, {
      head: [headers],
      body: data,
    });

    doc.save('table.pdf');
    handleExportClose();
  };

  const uniqueFields = (fields) => {
    const seen = new Set();
    return fields.filter(field => {
      const isDuplicate = seen.has(field.accessorKey);
      seen.add(field.accessorKey);
      return !isDuplicate;
    });
  };

  const columnsWithActions = [
    {
      accessorKey: "expand",
      header: "",
      enableHiding: false,
      enableSorting: false,
      enableColumnActions: false,
      size: 40,
    },
    ...columns.map(col => ({
      ...col,
      muiTableHeadCellProps: {
        sx: { paddingLeft: 0, paddingRight: 4 },
      },
      muiTableBodyCellProps: {
        sx: { paddingLeft: 0, paddingRight: 0 },
      },
    })),
    {
      accessorKey: "actions",
      header: "",
      enableHiding: false,
      enableSorting: false,
      enableColumnActions: false,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "flex-end" }}>
          <Tooltip title="Επεξεργασία">
            <IconButton onClick={() => handleEditClick(row.original)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Διαγραφή">
            <IconButton onClick={() => handleDelete(row.original.id)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      size: 80,
    },
  ];

  return (
    <Box sx={{ padding: 2, overflowX: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddClick}>
          Προσθήκη Νέου
        </Button>
        <Button variant="contained" startIcon={<FileDownload />} onClick={handleExportClick}>
          Εξαγωγή
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={exportToExcel}>Εξαγωγή σε Excel</MenuItem>
          <MenuItem onClick={exportToPDF}>Εξαγωγή σε PDF</MenuItem>
        </Menu>
      </Box>
      <MaterialReactTable
        key={data.length} 
        enablePagination={false} 
        columns={columnsWithActions}
        data={tableData}
        enableExpanding
        getRowCanExpand={() => true}
        enableExpandAll={false}
        enableColumnOrdering={false}
        enableColumnHiding={true} // Ενεργοποίηση δυνατότητας απόκρυψης στηλών
        initialState={{
          columnVisibility: {
            arithmosmitroou: false,
            katastasisindromis: false,
          },
        }}
        muiTableBodyCellProps={{
          sx: {
            fontSize: '0.75rem', // Μείωση μεγέθους γραμμάτων
            padding: '0.25rem', // Μείωση του padding
          },
        }}
        muiTableHeadCellProps={{
          sx: {
            fontSize: '0.75rem', // Μείωση μεγέθους γραμμάτων
            padding: '0.25rem', // Μείωση του padding
          },
        }}
        renderDetailPanel={({ row }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
              padding: 2,
              backgroundColor: "#f5f5f5",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            {/* Κύριες Λεπτομέρειες */}
            <Box sx={{ minWidth: "auto", flex: 1 }}>
              <strong>Λεπτομέρειες:</strong>
              {detailFields.map((field) => (
                <p key={field.accessorKey}><strong>{field.header}:</strong> {row.original[field.accessorKey]}</p>
              ))}
            </Box>
        
            {/* Υποπίνακες */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
                flexWrap: "wrap",
                justifyContent: "space-between",
                flex: 2,
              }}
            >
              {extraColumns.map((tableData, index) => (
                row.original[tableData[0].accessorKey] && row.original[tableData[0].accessorKey].length > 0 && (
                  <TableContainer
                    component={Paper}
                    key={index}
                    sx={{
                      width: "auto",
                      maxWidth: "100%",
                      overflowY: "auto"
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {tableData.map((column) => (
                            <TableCell key={column.accessorKey}><strong>{column.header}</strong></TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {row.original[tableData[0].accessorKey].map((item, idx) => (
                          <TableRow key={idx}>
                            {tableData.map((column) => (
                              <TableCell key={column.accessorKey}>{item}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              ))}
            </Box>
          </Box>
        )}
      />
      {editingRow && (
        <Dialog open={true} onClose={() => setEditingRow(null)} aria-labelledby="edit-dialog-title" role="dialog">
          <DialogTitle id="edit-dialog-title">Επεξεργασία Εγγραφής</DialogTitle>
          <DialogContent>
            {uniqueFields(columns.concat(detailFields)).map((column) => (
              column.accessorKey !== "actions" && (
                <TextField
                  key={column.accessorKey}
                  label={column.header}
                  name={column.accessorKey}
                  value={editValues[column.accessorKey] || ""}
                  onChange={handleEditChange}
                  fullWidth
                  margin="dense"
                  type={column.accessorKey.includes("date") ? "date" : "text"}
                  InputLabelProps={{ shrink: true }}
                  inputProps={
                    column.accessorKey === "firstName" || column.accessorKey === "lastName" || column.accessorKey === "fathersname"
                      ? { pattern: "[A-Za-zΑ-Ωα-ωά-ώΆ-Ώ ]*" }
                      : column.accessorKey === "phone"
                      ? { inputMode: "numeric", pattern: "[0-9]*" }
                      : {}
                  }
                />
              )
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingRow(null)} color="secondary">Ακύρωση</Button>
            <Button onClick={handleEditSave} color="primary" variant="contained">Αποθήκευση</Button>
          </DialogActions>
        </Dialog>
      )}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} aria-labelledby="add-dialog-title" role="dialog">
        <DialogTitle id="add-dialog-title">Προσθήκη Νέου Ατόμου</DialogTitle>
        <DialogContent>
          {uniqueFields(columns.concat(detailFields)).map((column) => (
            column.accessorKey !== "actions" && (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                value={newRow[column.accessorKey] || ""}
                onChange={handleAddChange}
                fullWidth
                margin="dense"
                type={column.accessorKey.includes("date") ? "date" : "text"}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: column.accessorKey === "firstName" || column.accessorKey === "lastName" || column.accessorKey === "fathersname"
                    ? { pattern: "[A-Za-zΑ-Ωα-ωά-ώΆ-Ώ ]*" }
                    : column.accessorKey === "phone"
                    ? { inputMode: "numeric", pattern: "[0-9]*" }
                    : {}
                }}
              />
            )
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} color="secondary">Ακύρωση</Button>
          <Button onClick={handleAddSave} color="primary" variant="contained">Προσθήκη</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}