import React, { useEffect, useState, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { 
  Box, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormGroup, FormControlLabel, Checkbox, Divider, Alert,
  Card, CardContent // Added for better comment display
} from "@mui/material";
import { Add, FileDownload, Edit, Delete, KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon, Comment as CommentIcon } from "@mui/icons-material";
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
  getRowId = (row) => row.id,
  maxHeight = "600px" // Add default maxHeight
}) => {
  // Όλα τα hook στην αρχή του component - μην τα μετακινείτε
  const [tableData, setTableData] = useState(data);
  const [anchorEl, setAnchorEl] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // New state for export column selection
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState(null); // 'excel' or 'pdf'
  const [selectedExportColumns, setSelectedExportColumns] = useState({});
  
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
          {/* Main Details Section */}
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
                  ΕΠΕΞΕΡΓΑΣΙΑ ΣΤΟΙΧΕΙΩΝ
                </Button>
              )}
            </Box>
          </Grid>

          {/* Tables Section */}
          <Grid item xs={12} md={8}>
            {/* Render tables first */}
            {detailPanelConfig?.tables?.map((tableConfig, tableIndex) => {
              let tableData = [];
              
              try {
                // Get table data
                if (typeof tableConfig.getData === 'function') {
                  tableData = tableConfig.getData(row.original) || [];
                } 
                else if (tableConfig.accessor && tableData.length === 0) {
                  const nestedData = tableConfig.accessor.split('.').reduce((o, i) => o?.[i], row.original);
                  tableData = Array.isArray(nestedData) ? nestedData : [];
                }
                
                return (
                  <Box key={`table-${tableIndex}`} sx={{ mb: 3 }}>
                    {/* Table content */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="div">{tableConfig.title}</Typography>
                      {tableConfig.onAddNew && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => tableConfig.onAddNew(item.id, item.athlima)}
                        >
                          {tableConfig.addNewButtonLabel || "ΠΡΟΣΘΗΚΗ ΝΕΟΥ"}
                        </Button>
                      )}
                    </Box>

                    {/* Table rendering */}
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
            
            {/* Comments Section - Now placed after tables */}
            {item.melos?.sxolia && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" component="div" gutterBottom>Σχόλια</Typography>
                {item.melos.sxolia ? (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap', 
                      maxHeight: '180px', 
                      overflowY: 'auto',
                      lineHeight: 1.6
                    }}
                  >
                    {item.melos.sxolia}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Δεν υπάρχουν δεδομένα
                  </Typography>
                )}
              </Box>
            )}
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

  // Helper function to check if a value is a date and format it
  const formatDateIfNeeded = (value) => {
    if (value === null || value === undefined || value === '') 
      return '';
    
    // Use improved date detection
    if (isLikelyADate(value)) {
      const dateObj = value instanceof Date ? value : new Date(value);
      // Return empty string for Unix epoch (1970) dates
      if (dateObj.getFullYear() === 1970) return '';
      
      // Format as DD/MM/YYYY
      return dateObj.toLocaleDateString("el-GR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return value;
  };

  // Updated Excel export function with date formatting
  const exportToExcel = (selectedColumnKeys) => {
    try {
      // Filter columns based on selected keys
      const visibleColumns = columns.filter(col => 
        selectedColumnKeys.includes(col.accessorKey)
      );
      
      if (visibleColumns.length === 0) {
        alert("Δεν υπάρχουν στήλες για εξαγωγή");
        return;
      }
      
      // Προετοιμασία δεδομένων για εξαγωγή - μόνο επιλεγμένες στήλες
      const filteredData = tableData.map(row => {
        const newRow = {};
        
        visibleColumns.forEach(col => {
          let cellValue = null;
          
          // Χειρισμός ένθετων ιδιοτήτων (π.χ., "melos.epafes.email")
          if (col.accessorKey && col.accessorKey.includes(".")) {
            const keys = col.accessorKey.split(".");
            cellValue = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, row);
          } else if (col.accessorKey) {
            cellValue = row[col.accessorKey];
          }
          
          // Handle null values and 1970 dates
          if (cellValue === null || cellValue === undefined) {
            newRow[col.header] = '';
          } else if (cellValue instanceof Date || (typeof cellValue === 'string' && !isNaN(new Date(cellValue).getTime()))) {
            const dateObj = cellValue instanceof Date ? cellValue : new Date(cellValue);
            // Check for Unix epoch dates (1970)
            if (dateObj.getFullYear() === 1970) {
              newRow[col.header] = '';
            } else {
              newRow[col.header] = formatDateIfNeeded(cellValue);
            }
          } else {
            newRow[col.header] = formatDateIfNeeded(cellValue);
          }
        });
        
        return newRow;
      });
      
      // Δημιουργία Excel workbook και worksheet
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      
      // Ορισμός πλάτους στηλών βάσει περιεχομένου
      const colWidths = visibleColumns.map(col => ({
        width: Math.max(
          (col.header || '').length,
          ...filteredData.map(row => String(row[col.header] || '').length)
        ) + 2
      }));
      
      worksheet['!cols'] = colWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `δεδομένα-${today}.xlsx`);
      
    } catch (error) {
      console.error("Σφάλμα κατά την εξαγωγή Excel:", error);
      alert("Σφάλμα κατά την εξαγωγή Excel. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  // Updated PDF export with date formatting
  const exportToPDF = (selectedColumnKeys) => {
    try {
      // Filter columns based on the passed selectedColumnKeys
      const visibleColumns = columns.filter(col => 
        selectedColumnKeys.includes(col.accessorKey)
      );
      
      if (visibleColumns.length === 0) {
        alert("Δεν υπάρχουν στήλες για εξαγωγή");
        return;
      }

      const headers = visibleColumns.map(col => ({
        text: col.header,
        style: 'tableHeader'
      }));

      // Filter row data to include only visible columns
      const body = tableData.map(row => {
        return visibleColumns.map(col => {
          let cellValue = null;
          
          if (col.accessorKey && col.accessorKey.includes('.')) {
            const keys = col.accessorKey.split('.');
            cellValue = keys.reduce((o, i) => (o && o[i] !== undefined) ? o[i] : null, row);
          } else if (col.accessorKey) {
            cellValue = row[col.accessorKey];
          }
          
          // Format dates before converting to string
          cellValue = formatDateIfNeeded(cellValue);
          
          return { text: cellValue !== undefined && cellValue !== null ? cellValue.toString() : '-' };
        });
      });
      
      // Υπολογισμός πλάτους στηλών με βάση το πλήθος των στηλών
      const calculateColumnWidths = () => {
        // Αν έχουμε πολλές στήλες, προσαρμόζουμε τα πλάτη
        if (visibleColumns.length > 8) {
          // Προσαρμοσμένα πλάτη για καλύτερη κατανομή στο χώρο
          const totalWidth = 700; // Fixed width for landscape page
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

  const columnsWithSizing = useMemo(() => {
    return columns.map(column => {
      // If column already has size defined, preserve it as minWidth instead of fixed width
      if (column.size) {
        return { 
          ...column,
          minWidth: column.size,
          maxWidth: column.size * 2.5 // Allow growing up to 2.5x the minimum size
        };
      }
      
      // Set reasonable minimum widths and flexible maximum widths based on content type
      if (column.accessorKey === "id") {
        return { ...column, minWidth: 60, maxWidth: 100 };
      }
      
      // Names/titles need more space and flexibility
      if (column.accessorKey?.toLowerCase().includes('name') || 
          column.header?.toLowerCase().includes('όνομα') || 
          column.header?.toLowerCase().includes('τίτλος')) {
        return { ...column, minWidth: 180, maxWidth: 400 };
      }
      
      // Dates need medium space
      if (column.accessorKey?.toLowerCase().includes('date') || 
          column.accessorKey?.toLowerCase().includes('hmerominia')) {
        return { ...column, minWidth: 120, maxWidth: 200 };
      }
      
      // Email addresses need space for longer content
      if (column.accessorKey?.toLowerCase().includes('email')) {
        return { ...column, minWidth: 160, maxWidth: 300 };
      }
      
      // Phone numbers need medium space
      if (column.accessorKey?.toLowerCase().includes('phone') || 
          column.accessorKey?.toLowerCase().includes('tilefono')) {
        return { ...column, minWidth: 120, maxWidth: 180 };
      }
      
      // Default for other columns - allow flexibility
      return { ...column, minWidth: 100, maxWidth: 250 };
    });
  }, [columns]);
  
  const columnsWithActions = useMemo(() => {
    if (!enableRowActions) {
      return columnsWithSizing; // Use columnsWithSizing instead of columns
    }
    
    return [
      ...columnsWithSizing, // Use columnsWithSizing instead of columns
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
  }, [columnsWithSizing, enableEditMain, enableDelete, handleEditClick, handleDelete, enableRowActions]);

  // Function to initialize column selection when starting an export (nothing pre-selected)
  const startExport = (type) => {
    try {
      // Initialize column selection with nothing selected by default
      const initialSelection = {};
      columns.forEach(col => {
        // Only include columns that aren't actions, IDs, or marked for hiding
        if (col.accessorKey && 
            col.accessorKey !== 'actions' && 
            !col.accessorKey.toLowerCase().includes('id_') && 
            col.accessorKey !== 'id' && 
            col.enableHiding !== true) {
          initialSelection[col.accessorKey] = false; // Default to unchecked
        } else if (col.accessorKey) {
          // Explicitly set ID columns to false - won't appear in dialog but prevents bugs
          initialSelection[col.accessorKey] = false;
        }
      });
      
      setSelectedExportColumns(initialSelection);
      setExportType(type);
      setExportDialogOpen(true);
      handleExportClose();
    } catch (error) {
      console.error(`Σφάλμα κατά την προετοιμασία εξαγωγής ${type}:`, error);
      alert(`Σφάλμα κατά την προετοιμασία εξαγωγής. Παρακαλώ δοκιμάστε ξανά.`);
    }
  };

  // Modified handlers for export menu items
  const handleStartExcelExport = () => startExport('excel');
  const handleStartPdfExport = () => startExport('pdf');

  // Function to handle export after column selection
  const handleExportWithSelectedColumns = (selectedColumnKeys) => {
    try {
      if (!selectedColumnKeys || selectedColumnKeys.length === 0) {
        alert("Παρακαλώ επιλέξτε τουλάχιστον μια στήλη για εξαγωγή");
        return;
      }
      
      if (exportType === 'excel') {
        exportToExcel(selectedColumnKeys);
      } else if (exportType === 'pdf') {
        exportToPDF(selectedColumnKeys);
      }
      
      setExportDialogOpen(false);
    } catch (error) {
      console.error("Σφάλμα κατά την εξαγωγή:", error);
      alert("Προέκυψε σφάλμα κατά την εξαγωγή. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  // First, let's create a memoized version of the column selection dialog

  const ColumnSelectionDialog = React.memo(({
    open,
    onClose,
    columns,
    exportType,
    selectedColumns,
    onSelectionChange,
    onExport
  }) => {
    // Local state for column selection to avoid parent re-renders
    const [localSelectedColumns, setLocalSelectedColumns] = React.useState({});
    
    // Sync with parent state when dialog opens
    React.useEffect(() => {
      if (open) {
        setLocalSelectedColumns(selectedColumns);
      }
    }, [open, selectedColumns]);
    
    // Filter out ID-related columns for export
    const exportableColumns = columns.filter(col => 
      col.accessorKey && 
      col.accessorKey !== 'actions' &&
      !col.accessorKey.toLowerCase().includes('id_') &&
      col.accessorKey !== 'id' &&
      col.enableHiding !== true
    );
    
    const allColumnsCount = exportableColumns.length;
    const selectedCount = Object.values(localSelectedColumns).filter(Boolean).length;
    const allSelected = selectedCount === allColumnsCount && allColumnsCount > 0;
    
    const handleSelectAll = (checked) => {
      const newSelection = {};
      columns.forEach(col => {
        if (col.accessorKey) {
          // Only set to true if it's an exportable column
          const isExportable = !col.accessorKey.toLowerCase().includes('id_') && 
                              col.accessorKey !== 'id' &&
                              col.accessorKey !== 'actions' &&
                              col.enableHiding !== true;
          newSelection[col.accessorKey] = checked && isExportable;
        }
      });
      setLocalSelectedColumns(newSelection);
    };
    
    const handleCheckboxChange = (accessorKey, checked) => {
      setLocalSelectedColumns(prev => ({
        ...prev,
        [accessorKey]: checked
      }));
    };
    
    const handleExportClick = () => {
      // Only send the updated selection back to parent when actually exporting
      onSelectionChange(localSelectedColumns);
      
      // Get selected column keys
      const selectedColumnKeys = Object.keys(localSelectedColumns)
        .filter(key => localSelectedColumns[key]);
        
      // Pass selected keys to the export function
      onExport(selectedColumnKeys);
    };
    
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Επιλέξτε Στήλες για Εξαγωγή {exportType === 'excel' ? 'Excel' : 'PDF'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            Επιλέξτε τις στήλες που θέλετε να συμπεριληφθούν στην εξαγωγή:
          </Typography>
          <FormGroup>
            {/* Select All checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label={<strong>ΕΠΙΛΟΓΗ ΟΛΩΝ</strong>}
            />
            <Divider sx={{ my: 1 }} />
            
            {/* Only show exportable columns in the dialog */}
            {exportableColumns.map((column) => (
              <FormControlLabel
                key={column.accessorKey}
                control={
                  <Checkbox
                    checked={!!localSelectedColumns[column.accessorKey]}
                    onChange={(e) => handleCheckboxChange(column.accessorKey, e.target.checked)}
                  />
                }
                label={column.header}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>ΑΚΥΡΩΣΗ</Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={handleExportClick}
          >
            ΕΞΑΓΩΓΗ
          </Button>
        </DialogActions>
      </Dialog>
    );
  });

  // Add this improved date detection function
  const isLikelyADate = (value) => {
    if (value instanceof Date) return true;
    
    // Only process strings that look like dates
    if (typeof value === 'string') {
      // Check if it has date separators
      if (value.includes('-') || value.includes('/') || value.includes('T')) {
        const dateObj = new Date(value);
        return !isNaN(dateObj.getTime());
      }
    }
    return false;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        {enableAddNew && enableTopAddButton && onAddNew && (
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={onAddNew}
          >
            ΠΡΟΣΘΗΚΗ ΝΕΟΥ
          </Button>
        )}
        <Button 
          variant="contained" 
          startIcon={<FileDownload />} 
          onClick={handleExportClick}
          sx={{ ml: !enableAddNew || !enableTopAddButton || !onAddNew ? 'auto' : 0 }}
        >
          ΕΞΑΓΩΓΗ
        </Button>
        <ExportMenu
          anchorEl={anchorEl}
          onClose={handleExportClose}
          exportToExcel={handleStartExcelExport}
          exportToPDF={handleStartPdfExport}
        />
        <ColumnSelectionDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          columns={columns}
          exportType={exportType}
          selectedColumns={selectedExportColumns}
          onSelectionChange={setSelectedExportColumns}
          onExport={handleExportWithSelectedColumns}
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
        enableDensityToggle={false}  // Disable the density toggle button
        enableFullScreenToggle={false}  // Disable the full screen toggle button
        muiTableProps={{
          sx: { tableLayout: 'fixed' } // Forces fixed table layout
        }}
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            whiteSpace: 'nowrap'
          }
        }}
        muiTableBodyCellProps={{
          sx: { 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          },
          // Add custom cell formatting for all cells
          muiTableBodyCellProps: ({ cell }) => ({
            sx: {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            },
            // This ensures consistent handling of empty/null values across the table
            children: () => {
              const value = cell.getValue();
              
              // Handle null, undefined, or empty values
              if (value === null || value === undefined || value === '') 
                return '';
              
              // Use the improved date detection function
              if (isLikelyADate(value)) {
                const dateObj = value instanceof Date ? value : new Date(value);
                // Check for Unix epoch dates (1970)
                if (dateObj.getFullYear() === 1970) {
                  return '';
                }
                // Format dates properly
                return dateObj.toLocaleDateString("el-GR", {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
              }
              
              // For non-dates, just return the value as is
              return value;
            }
          })
        }}
        muiTableContainerProps={{
          sx: { 
            maxHeight: maxHeight, 
            overflowX: 'auto' // Enables horizontal scrolling
          }
        }}
        density="compact" // Set compact density by default
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