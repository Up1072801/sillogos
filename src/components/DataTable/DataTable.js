import React, { useEffect, useState, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { Box, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Add, FileDownload, Edit, Delete } from "@mui/icons-material";
import ExportMenu from "./ExportMenu";
import ActionsCell from "./ActionsCell";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const DataTable = React.memo(({
  data = [],
  columns,
  enableExpand = true,
  enableEditMain = true,
  enableDelete = true,
  onAddNew,
  handleEditClick,
  handleDelete,
  detailPanelConfig,
  state = {},
  initialState = {},
  enableAddNew = true,
  enableRowActions = true,
  getRowId = (row) => row.id
}) => {
  const [tableData, setTableData] = useState(data);
  const [anchorEl, setAnchorEl] = useState(null);
  // Προσθέτουμε state για παρακολούθηση της γραμμής που έχει επεκταθεί
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  // Handler για την επέκταση/σύμπτυξη μιας γραμμής
  const handleRowExpand = (rowData) => {
    // Εάν η γραμμή είναι ήδη επεκταμένη, τη συμπτύσσουμε
    if (expandedRow && expandedRow.id === rowData.id) {
      setExpandedRow(null);
    } else {
      // Διαφορετικά, την επεκτείνουμε
      setExpandedRow(rowData);
    }
  };

  // Βελτιωμένο layout για τα κύρια στοιχεία και τους εμφωλευμένους πίνακες
  const defaultRenderDetailPanel = ({ row }) => {
    const item = row.original;
    
    return (
      <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
        <Grid container spacing={3}>
          {/* Main Details Section - Κάθετη διάταξη για εξοικονόμηση χώρου */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Στοιχεία</Typography>
              <Grid container direction="column" spacing={1}>
                {detailPanelConfig?.mainDetails?.map((field, index) => (
                  <Grid item key={index}>
                    <Typography>
                      <strong>{field.header}:</strong>{' '}
                      {field.Cell 
                        ? field.Cell({ row }) 
                        : field.format 
                          ? field.format(field.accessor.split('.').reduce((o, i) => o?.[i], item))
                          : field.accessor.split('.').reduce((o, i) => o?.[i], item) || '-'}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
              
              {enableEditMain && handleEditClick && (
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={() => handleEditClick(item)}
                >
                  Επεξεργασία Στοιχείων
                </Button>
              )}
            </Box>
          </Grid>

          {/* Tables Section - Περισσότερος χώρος για τον πίνακα αγώνων */}
          <Grid item xs={12} md={8}>
            {detailPanelConfig?.tables?.map((tableConfig, index) => {
              const tableData = tableConfig.accessor
                ? tableConfig.accessor.split('.').reduce((o, i) => o?.[i], item) || []
                : [];
              
              return (
                <Box key={index} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{tableConfig.title}</Typography>
                    {tableConfig.onAddNew && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        onClick={() => tableConfig.onAddNew(item.id, item.athlima)}
                      >
                        Προσθήκη Νέου
                      </Button>
                    )}
                  </Box>

                  {tableData.length === 0 ? (
                    <Typography variant="body2">Δεν υπάρχουν δεδομένα</Typography>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'grey.100' }}>
                          <TableRow>
                            {tableConfig.columns.map((column) => (
                              <TableCell key={column.accessor}>
                                <strong>{column.header}</strong>
                              </TableCell>
                            ))}
                            {/* Στήλη ενεργειών στο τέλος */}
                            {(tableConfig.onEdit || tableConfig.onDelete) && (
                              <TableCell align="right">
                                <strong>Ενέργειες</strong>
                              </TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tableData.map((rowData, rowIndex) => (
                            <TableRow 
                              key={rowIndex}
                              hover
                              onClick={tableConfig.renderExpandedRow ? () => handleRowExpand(rowData) : undefined}
                              sx={{ cursor: tableConfig.renderExpandedRow ? 'pointer' : 'default' }}
                            >
                              {tableConfig.columns.map((column) => {
                                const value = column.accessor.split('.').reduce((o, i) => o?.[i], rowData);
                                return (
                                  <TableCell key={column.accessor}>
                                    {column.format ? column.format(value) : value || '-'}
                                  </TableCell>
                                );
                              })}
                              
                              {/* Κουμπιά ενεργειών στο τέλος */}
                              {(tableConfig.onEdit || tableConfig.onDelete) && (
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    {tableConfig.onEdit && (
                                      <Button 
                                        size="small" 
                                        variant="outlined" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          tableConfig.onEdit(rowData);
                                        }}
                                        startIcon={<Edit fontSize="small" />}
                                      >
                                        Επεξεργασία
                                      </Button>
                                    )}
                                    {tableConfig.onDelete && (
                                      <Button 
                                        size="small" 
                                        variant="outlined" 
                                        color="error"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          tableConfig.onDelete(rowData);
                                        }}
                                        startIcon={<Delete fontSize="small" />}
                                      >
                                        Διαγραφή
                                      </Button>
                                    )}
                                  </Box>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  {/* Expandable Detail Panel για τις γραμμές του πίνακα */}
                  {tableConfig.renderExpandedRow && expandedRow && (
                    <Box sx={{ p: 2, mt: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      {tableConfig.renderExpandedRow(expandedRow)}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Grid>
        </Grid>
      </Box>
    );
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
    const headers = columns.map(col => col.header);
    const data = tableData.map(row => columns.map(col => row[col.accessorKey]));
    autoTable(doc, { head: [headers], body: data });
    doc.save("table.pdf");
    handleExportClose();
  };

  const columnsWithActions = useMemo(() => {
    if (!enableRowActions) {
      return columns;
    }
    
    return [
      ...columns,
      {
        accessorKey: "actions",
        header: "Ενέργειες",
        enableHiding: false,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <ActionsCell
            row={row}
            enableEdit={enableEditMain}
            enableDelete={enableDelete}
            handleEditClick={handleEditClick || (() => {})}
            handleDelete={handleDelete || (() => {})}
          />
        ),
        size: 100
      }
    ];
  }, [columns, enableEditMain, enableDelete, handleEditClick, handleDelete, enableRowActions]);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        {enableAddNew && onAddNew && (
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={onAddNew}
          >
            Προσθήκη Νέου
          </Button>
        )}
        <Button 
          variant="contained" 
          startIcon={<FileDownload />} 
          onClick={handleExportClick}
          sx={{ ml: !enableAddNew || !onAddNew ? 'auto' : 0 }}
        >
          Εξαγωγή
        </Button>
        <ExportMenu
          anchorEl={anchorEl}
          onClose={handleExportClose}
          exportToExcel={exportToExcel}
          exportToPDF={exportToPDF}
        />
      </Box>
      
      <MaterialReactTable
        columns={columnsWithActions}
        data={tableData}
        enableExpanding={enableExpand}
        renderDetailPanel={detailPanelConfig ? defaultRenderDetailPanel : undefined}
        initialState={initialState}
        state={state}
        getRowId={getRowId}
        positionActionsColumn="last"
        localization={{
          muiTablePagination: {
            labelRowsPerPage: 'Εγγραφές ανά σελίδα:',
            labelDisplayedRows: ({ from, to, count }) => 
              `${from}-${to} από ${count !== -1 ? count : `πάνω από ${to}`}`,
          }
        }}
      />
    </Box>
  );
});

export default DataTable;