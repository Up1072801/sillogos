import React, { useEffect, useState, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { Box, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from "@mui/material";
import { Add, FileDownload, Edit, Delete, KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
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
  enableTopAddButton = true, // Νέα παράμετρος
  enableRowActions = true,
  getRowId = (row) => row.id
}) => {
  const [tableData, setTableData] = useState(data);
  const [anchorEl, setAnchorEl] = useState(null);
  // Προσθέτουμε state για παρακολούθηση των γραμμών που έχουν επεκταθεί
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    setTableData(data);
  }, [data]);

  // Handler για την επέκταση/σύμπτυξη μιας γραμμής
  const handleRowExpand = (rowId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
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
              <Typography variant="h6" component="div" gutterBottom>Στοιχεία</Typography>
              <Grid container direction="column" spacing={1}>
                {detailPanelConfig?.mainDetails?.map((field, index) => (
                  <Grid item key={index}>
                    <Box sx={{ display: 'flex' }}>
                      <Typography component="span" sx={{ fontWeight: 'bold', mr: 0.5 }}>
                        {field.header}:
                      </Typography>
                      <Typography component="span">
                        {field.Cell 
                          ? field.Cell({ row }) 
                          : field.format 
                            ? field.format(field.accessor && typeof field.accessor === 'string' 
                                ? field.accessor.split('.').reduce((o, i) => o?.[i], item)
                                : field.accessorKey
                                  ? item[field.accessorKey]
                                  : null)
                            : typeof field.accessor === 'string'
                              ? field.accessor.split('.').reduce((o, i) => o?.[i], item) || '-'
                              : field.accessorKey
                                ? item[field.accessorKey] || '-'
                                : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              {enableEditMain && handleEditClick && detailPanelConfig?.showEditButton !== false && (
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
            {detailPanelConfig?.tables?.map((tableConfig, tableIndex) => {
              let tableData = [];
              try {
                tableData = tableConfig.getData(item);
              } catch (e) {
                console.error("Error getting table data:", e);
              }
            
              // Πρώτα ελέγξτε αν υπάρχει getData συνάρτηση
              if (tableConfig.getData) {
                tableData = tableConfig.getData(row.original) || [];
              }
              // Αν δεν επιστράφηκαν δεδομένα και υπάρχει accessor, δοκιμάστε να πάρετε τα δεδομένα μέσω accessor
              else if (tableConfig.accessor && tableData.length === 0) {
                const nestedData = tableConfig.accessor.split('.').reduce((o, i) => o?.[i], row.original);
                tableData = Array.isArray(nestedData) ? nestedData : [];
              }
              
              return (
                <Box key={`table-${tableIndex}`} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div">{tableConfig.title}</Typography>
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
                    <Typography variant="body2" component="div">Δεν υπάρχουν δεδομένα</Typography>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'grey.100' }}>
                          <TableRow>
                            {/* Προσθήκη στήλης για το expand στην αρχή */}
                            {tableConfig.renderExpandedRow && (
                              <TableCell padding="checkbox" style={{ width: '48px' }}></TableCell>
                            )}
                            {tableConfig.columns.map((column, colIndex) => (
                              <TableCell key={`header-${colIndex}`}>
                                <strong>{column.header}</strong>
                              </TableCell>
                            ))}
                            {/* Στήλη ενεργειών στο τέλος */}
                            {(tableConfig.onEdit || tableConfig.onDelete) && (
                              <TableCell align="right" style={{ width: '160px' }}>
                                <strong>Ενέργειες</strong>
                              </TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tableData.map((rowData, rowIndex) => {
                            // Προσθήκη ελέγχου για null/undefined
                            const rowIdValue = ((rowData.id !== undefined && rowData.id !== null) ? rowData.id : 
                                                (rowData.id_sxolis !== undefined && rowData.id_sxolis !== null) ? rowData.id_sxolis : 
                                                (rowData.id_agona !== undefined && rowData.id_agona !== null) ? rowData.id_agona : 
                                                rowIndex);
                            
                            return (
                              <React.Fragment key={`row-${rowIdValue}`}>
                                <TableRow 
                                  hover
                                  sx={{ cursor: 'pointer' }}
                                >
                                  {/* Προσθήκη του κουμπιού expand στην αρχή */}
                                  {tableConfig.renderExpandedRow && (
                                    <TableCell padding="checkbox">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Βεβαιωθείτε ότι χρησιμοποιείτε το σωστό ID για κάθε γραμμή
                                          const rowId = rowData.id || rowData.id_agona;
                                          handleRowExpand(rowId);
                                        }}
                                      >
                                        {expandedRows.has(rowData.id || rowData.id_agona) ? 
                                          <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                      </IconButton>
                                    </TableCell>
                                  )}
                                  {tableConfig.columns.map((column) => {
                                    // Έλεγχος αν το accessor είναι string προτού κάνουμε split
                                    const value = typeof column.accessor === 'string' 
                                      ? column.accessor.split('.').reduce((o, i) => o?.[i], rowData)
                                      : column.accessorKey 
                                        ? rowData[column.accessorKey] 
                                        : undefined;
                                    
                                    return (
                                      <TableCell key={column.accessor || column.accessorKey}>
                                        {column.Cell ? column.Cell({ value, row: { original: rowData } }) : 
                                        (value !== undefined ? value : '-')}
                                      </TableCell>
                                    );
                                  })}
                                  
                                  {/* Κουμπιά ενεργειών με εικονίδια */}
                                  {(tableConfig.onEdit || tableConfig.onDelete) && (
                                    <TableCell align="right">
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        {tableConfig.onEdit && (
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              tableConfig.onEdit(rowData);
                                            }}
                                          >
                                            <Edit fontSize="small" />
                                          </IconButton>
                                        )}
                                        {tableConfig.onDelete && (
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              tableConfig.onDelete(rowData, item); // Προσθέτουμε το item ως parentRow
                                            }}
                                          >
                                            <Delete fontSize="small" />
                                          </IconButton>
                                        )}
                                      </Box>
                                    </TableCell>
                                  )}
                                </TableRow>

                                {/* Αν η γραμμή είναι επεκταμένη, εμφανίζουμε το περιεχόμενο */}
                                {tableConfig.renderExpandedRow && expandedRows.has(rowData.id || rowData.id_agona) && (
                                  <TableRow key={`expanded-row-${rowData.id || rowData.id_agona}`}>
                                    <TableCell 
                                      colSpan={
                                        tableConfig.columns.length + 
                                        (tableConfig.renderExpandedRow ? 1 : 0) + 
                                        ((tableConfig.onEdit || tableConfig.onDelete) ? 1 : 0)
                                      }
                                    >
                                      <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                        {tableConfig.renderExpandedRow(rowData)}
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
        {enableAddNew && enableTopAddButton && onAddNew && (
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
          sx={{ ml: !enableAddNew || !enableTopAddButton || !onAddNew ? 'auto' : 0 }}
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