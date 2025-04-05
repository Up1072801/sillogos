import React, { useEffect, useState, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { Box, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Add, FileDownload } from "@mui/icons-material";
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
  initialState = {}
}) => {
  const [tableData, setTableData] = useState(data);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  // Default renderDetailPanel function if none provided
  const defaultRenderDetailPanel = ({ row }) => {
    const item = row.original;
    
    return (
      <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
        <Grid container spacing={3}>
          {/* Main Details Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Στοιχεία</Typography>
            <Grid container spacing={2}>
              {detailPanelConfig?.mainDetails?.map((field) => (
                <Grid item xs={12} sm={6} key={field.accessor}>
                  <Typography>
                    <strong>{field.header}:</strong> {field.accessor.split('.').reduce((o, i) => o?.[i], item) || '-'}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            
            {enableEditMain && (
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                onClick={() => handleEditClick(item)}
              >
                Επεξεργασία Στοιχείων
              </Button>
            )}
          </Grid>

          {/* Tables Section */}
          <Grid item xs={12} md={6}>
            {detailPanelConfig?.tables?.map((tableConfig, index) => {
              const tableData = tableConfig.accessor.split('.').reduce((o, i) => o?.[i], item) || [];
              
              return tableData.length > 0 && (
                <React.Fragment key={index}>
                  <Typography variant="h6" gutterBottom>{tableConfig.title}</Typography>
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          {tableConfig.columns.map((column) => (
                            <TableCell key={column.accessor}><strong>{column.header}</strong></TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableData.map((rowData, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {tableConfig.columns.map((column) => {
                              const value = column.accessor.split('.').reduce((o, i) => o?.[i], rowData);
                              return (
                                <TableCell key={column.accessor}>
                                  {column.format ? column.format(value) : value || '-'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </React.Fragment>
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

  const columnsWithActions = useMemo(() => [
    ...columns,
    {
      accessorKey: "actions",
      header: "Ενέργειες",
      Cell: ({ row }) => (
        <ActionsCell
          row={row}
          enableEdit={enableEditMain}
          enableDelete={enableDelete}
          handleEditClick={handleEditClick}
          handleDelete={handleDelete}
        />
      ),
      size: 80
    }
  ], [columns, enableEditMain, enableDelete, handleEditClick, handleDelete]);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={onAddNew}
        >
          Προσθήκη Νέου
        </Button>
        <Button 
          variant="contained" 
          startIcon={<FileDownload />} 
          onClick={handleExportClick}
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