import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Button } from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";

const DetailPanel = ({ row, detailFields, extraColumns, enableEdit, handleEditClick, handleDelete, handleAddClick }) => {
  const hasDetails = detailFields.some((field) => row.original[field.accessorKey]);
  const hasExtraTables = extraColumns.some((tableData) =>
    row.original[tableData[0].accessorKey] && row.original[tableData[0].accessorKey].length > 0
  );

  if (!hasDetails && !hasExtraTables) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 2, padding: 2, backgroundColor: "#f5f5f5", justifyContent: "space-between", flexWrap: "wrap" }}>
      {hasDetails && (
        <Box sx={{ minWidth: "auto", flex: 1 }}>
          <strong>Λεπτομέρειες:</strong>
          {detailFields.map((field) => (
            row.original[field.accessorKey] && (
              <p key={field.accessorKey}>
                <strong>{field.header}:</strong> {row.original[field.accessorKey]}
              </p>
            )
          ))}
          {enableEdit && (
            <Button variant="contained" color="primary" onClick={() => handleEditClick(row.original)}>
              Επεξεργασία
            </Button>
          )}
        </Box>
      )}

      {hasExtraTables && (
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2, flexWrap: "wrap", justifyContent: "flex-start", flex: 2 }}>
          {extraColumns.map((tableData, index) => (
            row.original[tableData[0].accessorKey] &&
            row.original[tableData[0].accessorKey].length > 0 && (
              <TableContainer component={Paper} key={index} sx={{ width: "auto", maxWidth: "100%", overflowY: "visible" }}>
                <Table size="small" className="extra-table">
                  <TableHead>
                    <TableRow>
                      {tableData.map((column) => (
                        <TableCell key={column.accessorKey}>
                          <strong>{column.header}</strong>
                        </TableCell>
                      ))}
                      {enableEdit && <TableCell>Ενέργειες</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.original[tableData[0].accessorKey].map((item, idx) => (
                      <TableRow key={idx}>
                        {tableData.map((column) => (
                          <TableCell key={column.accessorKey}>{item[column.accessorKey]}</TableCell>
                        ))}
                        {enableEdit && (
                          <TableCell>
                            <IconButton onClick={() => handleEditClick(item)}>
                              <Edit />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(item.id)}>
                              <Delete />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {enableEdit && (
                  <Box sx={{ padding: 2 }}>
                    <Button variant="contained" startIcon={<Add />} onClick={() => handleAddClick(tableData)}>
                      Προσθήκη Νέου
                    </Button>
                  </Box>
                )}
              </TableContainer>
            )
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DetailPanel;