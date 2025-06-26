import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

const DetailPanel = ({ 
  row, 
  detailPanelConfig, 
  handleEditClick,
  handleAddClick,
  enableEdit = false
}) => {
  // State για τα δεδομένα των πινάκων
  const [tableDataCache, setTableDataCache] = useState({});
  const [loading, setLoading] = useState({});

  // Φόρτωση δεδομένων για πίνακες που έχουν loadData function
  useEffect(() => {
    const loadTableData = async () => {
      if (!detailPanelConfig?.tables) return;

      for (let i = 0; i < detailPanelConfig.tables.length; i++) {
        const tableConfig = detailPanelConfig.tables[i];
        const tableKey = `table-${i}`;

        if (typeof tableConfig.loadData === 'function') {
          setLoading(prev => ({ ...prev, [tableKey]: true }));
          
          try {
            const data = await tableConfig.loadData(row.original);
            setTableDataCache(prev => ({ ...prev, [tableKey]: data || [] }));
          } catch (error) {
            console.error(`Error loading data for table ${tableConfig.title}:`, error);
            setTableDataCache(prev => ({ ...prev, [tableKey]: [] }));
          } finally {
            setLoading(prev => ({ ...prev, [tableKey]: false }));
          }
        }
      }
    };

    loadTableData();
  }, [row.original, detailPanelConfig]);

  const detailFields = detailPanelConfig?.mainDetails || [];
  const hasExtraTables = detailPanelConfig?.tables && detailPanelConfig.tables.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: hasExtraTables ? "column" : "row", gap: 2 }}>
      {/* Main Details Section */}
      {detailFields.length > 0 && (
        <Box sx={{ minWidth: hasExtraTables ? "100%" : "300px", mb: hasExtraTables ? 2 : 0 }}>
          <Typography variant="h6" gutterBottom>
            <strong>Λεπτομέρειες:</strong>
          </Typography>
          <Grid container spacing={1}>
            {detailFields.map((field, index) => {
              // Skip field if shouldRender returns false
              if (field.shouldRender && !field.shouldRender(row.original)) {
                return null;
              }

              let value = '';
              if (field.value && typeof field.value === 'function') {
                value = field.value(row.original);
              } else if (field.accessor) {
                const parts = field.accessor.split('.');
                value = parts.reduce((obj, part) => obj?.[part], row.original);
              }

              if (field.format && typeof field.format === 'function') {
                value = field.format(value);
              }

              return (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {field.header}:
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '0.875rem' }}>
                      {value || '-'}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          
          {enableEdit && handleEditClick && detailPanelConfig?.showEditButton !== false && (
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => handleEditClick(row.original)}
            >
              Επεξεργασία Στοιχείων
            </Button>
          )}
        </Box>
      )}

      {/* Tables Section */}
      {hasExtraTables && (
        <Box sx={{ width: "100%" }}>
          {detailPanelConfig.tables.map((tableConfig, tableIndex) => {
            const tableKey = `table-${tableIndex}`;
            let tableData = [];

            // Πρώτα ελέγχουμε αν έχουμε cached δεδομένα από loadData
            if (tableDataCache[tableKey]) {
              tableData = tableDataCache[tableKey];
            }
            // Αν όχι, δοκιμάζουμε τη getData συνάρτηση
            else if (typeof tableConfig.getData === 'function') {
              try {
                tableData = tableConfig.getData({ original: row.original }) || [];
              } catch (error) {
                console.error(`Error in getData for table ${tableConfig.title}:`, error);
                tableData = [];
              }
            }
            // Τέλος, δοκιμάζουμε το accessor
            else if (tableConfig.accessor) {
              const nestedData = tableConfig.accessor.split('.').reduce((o, i) => o?.[i], row.original);
              tableData = Array.isArray(nestedData) ? nestedData : [];
            }

            const isLoading = loading[tableKey];

            return (
              <Box key={tableKey} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">{tableConfig.title}</Typography>
                  {tableConfig.onAddNew && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        if (typeof tableConfig.onAddNew === 'function') {
                          tableConfig.onAddNew(row.id || row.original.id || row.original);
                        }
                      }}
                    >
                      Προσθήκη Νέου
                    </Button>
                  )}
                </Box>

                {isLoading ? (
                  <Typography>Φόρτωση...</Typography>
                ) : tableData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {tableConfig.emptyMessage || "Δεν υπάρχουν δεδομένα"}
                  </Typography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          {tableConfig.columns.map((column, colIndex) => (
                            <TableCell key={`header-${colIndex}`}>
                              <strong>{column.header}</strong>
                            </TableCell>
                          ))}
                          {(tableConfig.onEdit || tableConfig.onDelete) && (
                            <TableCell align="right" style={{ width: '160px' }}>
                              <strong>Ενέργειες</strong>
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableData.map((rowData, rowIndex) => {
                          const rowId = (tableConfig.getRowId && typeof tableConfig.getRowId === 'function') 
                            ? tableConfig.getRowId(rowData)
                            : rowData.id || rowIndex;

                          return (
                            <TableRow key={rowId} hover>
                              {tableConfig.columns.map((column, colIndex) => {
                                let cellValue = '';
                                
                                if (column.Cell && typeof column.Cell === 'function') {
                                  cellValue = column.Cell({ row: { original: rowData }, value: rowData[column.accessorKey] });
                                } else if (column.accessorKey) {
                                  const value = column.accessorKey.split('.').reduce((o, i) => o?.[i], rowData);
                                  cellValue = value !== undefined ? value : '-';
                                }

                                return (
                                  <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                                    {cellValue}
                                  </TableCell>
                                );
                              })}
                              
                              {(tableConfig.onEdit || tableConfig.onDelete) && (
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    {tableConfig.onEdit && (
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          tableConfig.onEdit(rowData, row.original);
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
                                          tableConfig.onDelete(rowData, row.original);
                                        }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Box>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default DetailPanel;