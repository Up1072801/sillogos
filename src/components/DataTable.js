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
} from "@mui/material";
import { Delete, Add, Edit } from "@mui/icons-material";

export default function DataTable({ data, columns, extraColumns = [], onAdd }) {
  
    useEffect(() => {
    }, [data]);

  const [tableData, setTableData] = useState(data);
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRow, setNewRow] = useState({});
  
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
    if (onAdd) {
      onAdd(newRow);
    }
    setOpenAddDialog(false);
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
    <Box sx={{ padding: 2 }}>
      <Button variant="contained" startIcon={<Add />} onClick={handleAddClick} sx={{ marginBottom: 2 }}>
        Προσθήκη Νέου
      </Button>
      <MaterialReactTable
      key={data.length} 
      enablePagination={false} 
        columns={columnsWithActions}
        data={tableData}
        enableExpanding
        getRowCanExpand={() => true}
        enableExpandAll={false}
        enableColumnOrdering={false}
        enableColumnHiding={false}
        renderDetailPanel={({ row }) => (
          <Box sx={{ display: "flex", gap: 2, padding: 2, backgroundColor: "#f5f5f5" }}>
          <Box sx={{ flex: 1 }}>
            <strong>Λεπτομέρειες:</strong>
            <p>ID: {row.original.id}</p>
            <p>Όνομα: {row.original.firstName} {row.original.lastName}</p>
            <p>Email: {row.original.email}</p>
            <p>Πόλη: {row.original.city}</p>
          </Box>
          <TableContainer component={Paper} sx={{ flex: 1, maxWidth: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {extraColumns.map((column) => (
                      <TableCell key={column.accessorKey}><strong>{column.header}</strong></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {extraColumns.map((column) => (
                      <TableCell key={column.accessorKey}>{row.original[column.accessorKey]}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
        </Box>
        )}
      />
      {editingRow && (
        <Dialog open={true} onClose={() => setEditingRow(null)}>
          <DialogTitle>Επεξεργασία Εγγραφής</DialogTitle>
          <DialogContent>
            {columns.map((column) => (
              column.accessorKey !== "actions" && (
                <TextField
                  key={column.accessorKey}
                  label={column.header}
                  name={column.accessorKey}
                  value={editValues[column.accessorKey] || ""}
                  onChange={handleEditChange}
                  fullWidth
                  margin="dense"
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
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Προσθήκη Νέου Ατόμου</DialogTitle>
        <DialogContent>
          {columns.map((column) => (
            column.accessorKey !== "actions" && (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                value={newRow[column.accessorKey] || ""}
                onChange={handleAddChange}
                fullWidth
                margin="dense"
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