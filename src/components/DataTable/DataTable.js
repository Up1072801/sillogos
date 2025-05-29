import React, { useEffect, useState, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { 
  Box, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormGroup, FormControlLabel, Checkbox, Divider, Alert 
} from "@mui/material";
import { Add, FileDownload, Edit, Delete, KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import ExportMenu from "./ExportMenu";
import ActionsCell from "./ActionsCell";
import * as XLSX from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import html2canvas from 'html2canvas';

// Διόρθωση της ρύθμισης των fonts για το pdfmake
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;

// Προσθήκη ελληνικών fonts (Roboto περιλαμβάνει ελληνικά)
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

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
  enableTopAddButton = true,
  enableRowActions = true,
  getRowId = (row) => row.id
}) => {
  // Όλα τα hook στην αρχή του component - μην τα μετακινείτε
  const [tableData, setTableData] = useState(data);
  const [anchorEl, setAnchorEl] = useState(null);
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
                {detailPanelConfig?.mainDetails?.map((field, index) => {
                  // Έλεγχος αν το πεδίο πρέπει να εμφανιστεί
                  if (field.shouldRender && !field.shouldRender(item)) {
                    return null; // Αν το shouldRender επιστρέφει false, δεν εμφανίζουμε το πεδίο
                  }
                  
                  return (
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
                  );
                })}
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
                // Πρώτα ελέγχουμε αν υπάρχει getData συνάρτηση
                if (typeof tableConfig.getData === 'function') {
                  tableData = tableConfig.getData(row.original) || [];
                } 
                // Αν δεν επιστράφηκαν δεδομένα και υπάρχει accessor, δοκιμάζουμε να πάρουμε τα δεδομένα μέσω accessor
                else if (tableConfig.accessor && tableData.length === 0) {
                  // Υποστηρίζει και nested accessors με dots (π.χ. "user.address.city")
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
                                    hover={!tableConfig.noRowHover}
                                    sx={{ cursor: tableConfig.noRowClick ? 'default' : 'pointer' }}
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
              } catch (error) {
                console.error("Error getting table data:", error);
                return (
                  <Box sx={{ p: 2 }}>
                    <Typography color="error">
                      Αδυναμία εμφάνισης δεδομένων. Παρακαλώ προσπαθήστε ξανά.
                    </Typography>
                  </Box>
                );
              }
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

  // Τροποποιημένη συνάρτηση για να λαμβάνει υπόψη ΜΟΝΟ τις ορατές στήλες στο τρέχον UI
  const exportToExcel = () => {
    try {
      // Get all columns except actions column
      const allExportableColumns = columns.filter(col => 
        col.accessorKey !== "actions"
      );
      
      // Παίρνουμε ΜΟΝΟ τις τρέχουσες ορατές στήλες από το UI (state)
      const columnVisibility = state.columnVisibility || {};
      
      // DEBUG: Let's see what's in columnVisibility
      console.log('All exportable columns:', allExportableColumns.map(c => c.accessorKey));
      console.log('Column visibility state:', columnVisibility);
      
      // Φιλτράρουμε τις στήλες που είναι όντως ορατές στη διεπαφή χρήστη
      const visibleColumns = allExportableColumns.filter(col => {
        // In Material React Table, a column is visible if:
        // 1. It's not explicitly set to false in columnVisibility, OR
        // 2. columnVisibility is empty (all columns visible by default)
        const isVisible = columnVisibility[col.accessorKey] !== false;
        console.log(`Column ${col.accessorKey}: visibility = ${columnVisibility[col.accessorKey]}, isVisible = ${isVisible}`);
        return isVisible;
      });
      
      console.log('Visible columns for export:', visibleColumns.map(c => c.accessorKey));
      
      if (visibleColumns.length === 0) {
        alert("Δεν υπάρχουν ορατές στήλες για εξαγωγή");
        return;
      }
      
      // Προετοιμασία δεδομένων με μόνο τις ορατές στήλες
      const filteredData = tableData.map(row => {
        const newRow = {};
        
        visibleColumns.forEach(col => {
          let value;
          
          // Υποστήριξη για nested fields (όπως "melos.epafes.email")
          if (col.accessorKey && col.accessorKey.includes(".")) {
            const keys = col.accessorKey.split(".");
            value = keys.reduce((obj, key) => obj && obj[key] !== undefined ? obj[key] : null, row);
          } else if (col.accessorKey) {
            value = row[col.accessorKey];
          } else if (typeof col.accessor === 'string') {
            const keys = col.accessor.split(".");
            value = keys.reduce((obj, key) => obj && obj[key] !== undefined ? obj[key] : null, row);
          }
          
          // Μορφοποίηση ημερομηνιών
          if (value instanceof Date) {
            value = value.toLocaleDateString('el-GR');
          } else if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                value = date.toLocaleDateString('el-GR');
              }
            } catch (e) {
              console.error("Σφάλμα μορφοποίησης ημερομηνίας:", e);
            }
          }
          
          newRow[col.header] = value !== null && value !== undefined ? value : '';
        });
        
        return newRow;
      });
      
      // Δημιουργία του Excel worksheet
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      
      // Αυτόματη προσαρμογή πλάτους στηλών
      const colWidths = [];
      
      // Αρχικοποίηση με το πλάτος των επικεφαλίδων
      visibleColumns.forEach((col, idx) => {
        colWidths[idx] = col.header ? col.header.length + 2 : 10;
      });
      
      // Υπολογισμός μέγιστου πλάτους βάσει περιεχομένου
      filteredData.forEach(row => {
        visibleColumns.forEach((col, idx) => {
          const value = row[col.header];
          if (value) {
            const valueLength = String(value).length;
            colWidths[idx] = Math.max(colWidths[idx], valueLength + 2);
          }
        });
      });
      
      // Εφαρμογή των πλατών στο worksheet
      worksheet['!cols'] = colWidths.map(width => ({ width }));
      
      // Δημιουργία του Excel αρχείου
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      
      // Κατέβασμα του Excel
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `δεδομένα-${today}.xlsx`);
      handleExportClose();
    } catch (error) {
      console.error("Σφάλμα κατά την εξαγωγή Excel:", error);
      alert("Σφάλμα κατά την εξαγωγή Excel. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  // Συνάρτηση που καλείται όταν θέλουμε να εξάγουμε σε PDF
  const handleStartPdfExport = () => {
    try {
      // Get all columns except actions column
      const allExportableColumns = columns.filter(col => 
        col.accessorKey !== "actions"
      );
      
      // Παίρνουμε ΜΟΝΟ τις τρέχουσες ορατές στήλες από το UI (state)
      const columnVisibility = state.columnVisibility || {};
      
      // DEBUG: Let's see what's happening
      console.log('PDF Export - All exportable columns:', allExportableColumns.map(c => c.accessorKey));
      console.log('PDF Export - Column visibility state:', columnVisibility);
      
      // Φιλτράρουμε τις στήλες που είναι όντως ορατές στη διεπαφή χρήστη
      const actuallyVisibleColumns = allExportableColumns.filter(col => {
        const isVisible = columnVisibility[col.accessorKey] !== false;
        console.log(`PDF Column ${col.accessorKey}: visibility = ${columnVisibility[col.accessorKey]}, isVisible = ${isVisible}`);
        return isVisible;
      });
      
      console.log('PDF Export - Visible columns:', actuallyVisibleColumns.map(c => c.accessorKey));
      
      if (actuallyVisibleColumns.length === 0) {
        alert("Δεν υπάρχουν ορατές στήλες για εξαγωγή");
        return;
      }
      
      // Απευθείας εξαγωγή PDF με τις ορατές στήλες
      exportToPDF(actuallyVisibleColumns.map(col => col.accessorKey));
      handleExportClose();
    } catch (error) {
      console.error("Σφάλμα κατά την προετοιμασία εξαγωγής PDF:", error);
      alert("Σφάλμα κατά την προετοιμασία εξαγωγής PDF. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  // Τροποποιημένη συνάρτηση exportToPDF που δέχεται τις επιλεγμένες στήλες
  const exportToPDF = (selectedColumnKeys) => {
    try {
      // Φιλτράρουμε τις στήλες με βάση τα selectedColumnKeys
      const visibleColumns = columns.filter(col => 
        selectedColumnKeys.includes(col.accessorKey)
      );

      // Δημιουργία επικεφαλίδων για το PDF
      const headers = visibleColumns.map(col => ({
        text: col.header,
        style: 'tableHeader'
      }));

      // Βελτιωμένη εξαγωγή δεδομένων με καλύτερο χειρισμό των πεδίων
      const body = tableData.map(row => {
        return visibleColumns.map(col => {
          // Πιο στιβαρή προσπέλαση της τιμής
          let accessorKey = col.accessorKey || col.accessor;
          let value;
          
          // Έλεγχος για nested accessors (με τελείες)
          if (typeof accessorKey === 'string' && accessorKey.includes('.')) {
            const keys = accessorKey.split('.');
            value = keys.reduce((obj, key) => obj && obj[key] !== undefined ? obj[key] : null, row);
          } else if (accessorKey) {
            value = row[accessorKey];
          } else if (col.accessor && typeof col.accessor === 'function') {
            // Υποστήριξη για function accessors
            value = col.accessor(row);
          }
          
          // Ειδική διαχείριση για email και τηλέφωνα
          if (accessorKey === 'email' || 
              accessorKey === 'tilefono' || 
              accessorKey === 'phone' || 
              /email|tilefono|phone/i.test(accessorKey)) {
            return { 
              text: value != null ? String(value) : '', 
              style: 'tableCell',
              characterSpacing: 0
            };
          }
          
          // Μορφοποίηση ημερομηνιών
          if (value instanceof Date) {
            value = value.toLocaleDateString('el-GR');
          } else if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
            try {
              value = new Date(value).toLocaleDateString('el-GR');
            } catch (e) { }
          }
          
          return { 
            text: value != null ? String(value) : '', 
            style: 'tableCell' 
          };
        });
      });

      // Υπολογισμός πλάτους στηλών με βάση το πλήθος των στηλών
      const calculateColumnWidths = () => {
        // Αν έχουμε πολλές στήλες, προσαρμόζουμε τα πλάτη
        if (visibleColumns.length > 8) {
          // Προσαρμοσμένα πλάτη για καλύτερη κατανομή στο χώρο
          const totalWidth = 530; // Περίπου το διαθέσιμο πλάτος σε points στη σελίδα landscape
          const avgWidth = Math.floor(totalWidth / visibleColumns.length);
          
          return Array(visibleColumns.length).fill(avgWidth);
        }
        // Διαφορετικά χρησιμοποιούμε auto πλάτος
        return Array(visibleColumns.length).fill('*');
      };

      // Ορίζουμε το έγγραφο PDF
      const docDefinition = {
        // Πάντα landscape όταν έχουμε πολλές στήλες
        pageOrientation: visibleColumns.length > 5 ? 'landscape' : 'portrait',
        pageSize: 'A4',
        // Μικρότερα περιθώρια για να χωρέσουν περισσότερα δεδομένα
        pageMargins: [15, 20, 15, 20],
        defaultStyle: {
          font: 'Roboto'
        },
        content: [
          { text: 'Εξαγωγή Δεδομένων', style: 'header' },
          {
            style: 'table',
            table: {
              headerRows: 1,
              // Υπολογισμός πλάτους στηλών αναλόγως το πλήθος τους
              widths: calculateColumnWidths(),
              body: [headers, ...body]
            },
            layout: {
              fillColor: function(rowIndex) {
                return (rowIndex % 2 === 0) ? '#f9f9f9' : null;
              },
              // Μικρότερα paddings για εξοικονόμηση χώρου
              paddingLeft: function() { return 3; },
              paddingRight: function() { return 3; },
              paddingTop: function() { return 2; },
              paddingBottom: function() { return 2; }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 16,
            bold: true,
            alignment: 'center',
            color: '#2980b9',
            margin: [0, 0, 0, 10]
          },
          table: {
            margin: [0, 5, 0, 10]
          },
          tableHeader: {
            bold: true,
            // Μικρότερη γραμματοσειρά για το header
            fontSize: visibleColumns.length > 10 ? 8 : (visibleColumns.length > 8 ? 9 : 10),
            color: '#ffffff',
            fillColor: '#2980b9',
            alignment: 'left'
          },
          tableCell: {
            // Μικρότερη γραμματοσειρά για τα κελιά
            fontSize: visibleColumns.length > 10 ? 7 : (visibleColumns.length > 8 ? 8 : 9),
            alignment: 'left'
          }
        }
      };

      // Δημιουργία και κατέβασμα του PDF
      const today = new Date().toISOString().split('T')[0];
      pdfMake.createPdf(docDefinition).download(`δεδομένα-${today}.pdf`);
      
    } catch (error) {
      console.error("Σφάλμα κατά την εξαγωγή PDF:", error);
      alert("Σφάλμα κατά την εξαγωγή PDF. Παρακαλώ δοκιμάστε ξανά.");
    }
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
          exportToPDF={handleStartPdfExport}
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
        muiTableProps={{
          sx: { tableLayout: 'fixed' }
        }}
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            whiteSpace: 'nowrap'
          }
        }}
        muiTableBodyCellProps={{
          sx: { whiteSpace: 'nowrap' }
        }}
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