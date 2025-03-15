import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { Box, Button } from "@mui/material";
import { Add, FileDownload } from "@mui/icons-material";
import AddDialog from "./AddDialog";
import EditDialog from "./EditDialog";
import ExportMenu from "./ExportMenu";
import DetailPanel from "./DetailPanel";
import ActionsCell from "./ActionsCell";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../pages/App.css";

const DataTable = React.memo(({
  data = [],
  columns,
  extraColumns = [],
  detailFields = [],
  initialState = {},
  enableExpand = true,
  enableEditMain = true,
  enableEditExtra = true,
  enableDelete = true,
  enableFilter = true,
  onAddNew,
}) => {
  const [tableData, setTableData] = useState(data || []);
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [addFields, setAddFields] = useState([]);

  useEffect(() => {
    setTableData(data || []);
  }, [data]);

  const handleAddRow = useCallback((newRow) => {
    setTableData((prevData) => {
      const newId = prevData.length > 0 ? Math.max(...prevData.map(e => Number(e.id))) + 1 : 1;
      return [...prevData, { id: newId.toString(), ...newRow }];
    });
    setOpenAddDialog(false);
  }, []);

  const handleDelete = useCallback((id) => {
    setTableData((prevData) => prevData.filter((row) => row.id !== id));
  }, []);

  const handleEditClick = useCallback((row) => {
    setEditingRow(row.id);
    setEditValues({ ...row });
  }, []);

  const handleEditChange = useCallback((e) => {
    setEditValues((prevValues) => ({
      ...prevValues,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleEditSave = useCallback(() => {
    setTableData((prevData) =>
      prevData.map((row) => (row.id === editingRow ? editValues : row))
    );
    setEditingRow(null);
  }, [editingRow, editValues]);

  const handleAddClick = useCallback((fields) => {
    setNewRow({});
    setAddFields(fields);
    setOpenAddDialog(true);
  }, []);

  const handleAddChange = useCallback((e) => {
    setNewRow((prevRow) => ({
      ...prevRow,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleAddSave = useCallback(() => {
    handleAddRow(newRow);
  }, [handleAddRow, newRow]);

  const handleExportClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleExportClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const exportToExcel = useCallback(() => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(tableData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, "data.xlsx");
      handleExportClose();
    } catch (error) {
      console.error("Failed to export to Excel:", error);
    }
  }, [tableData, handleExportClose]);

  const exportToPDF = useCallback(() => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");
      const headers = columns.map((col) => col.header);
      const data = tableData.map((row) => columns.map((col) => row[col.accessorKey]));
      autoTable(doc, {
        head: [headers],
        body: data,
      });
      doc.save("table.pdf");
      handleExportClose();
    } catch (error) {
      console.error("Failed to export to PDF:", error);
    }
  }, [columns, tableData, handleExportClose]);

  const columnsWithActions = useMemo(() => [
    ...columns,
    (enableEditMain || enableDelete) && {
      accessorKey: "actions",
      header: "Ενέργειες",
      enableHiding: false,
      enableSorting: false,
      enableColumnActions: false,
      Cell: ({ row }) => (
        <ActionsCell
          row={row}
          enableEdit={enableEditMain}
          enableDelete={enableDelete}
          handleEditClick={handleEditClick}
          handleDelete={handleDelete}
        />
      ),
      size: 80,
    },
  ].filter(Boolean), [columns, enableEditMain, enableDelete, handleEditClick, handleDelete]);

  return (
    <Box sx={{ padding: 2, overflowX: "hidden" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddNew || (() => handleAddClick(columns))}
        >
          Προσθήκη Νέου
        </Button>
        <Button variant="contained" startIcon={<FileDownload />} onClick={handleExportClick}>
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
        key={data.length}
        enablePagination={false}
        columns={columnsWithActions}
        data={tableData}
        enableExpanding={enableExpand}
        getRowCanExpand={() => enableExpand}
        enableExpandAll={false}
        enableColumnOrdering={false}
        enableColumnHiding={true}
        initialState={initialState}
        muiTableBodyCellProps={{
          sx: {
            fontSize: "0.75rem",
            padding: "0.25rem",
          },
        }}
        muiTableHeadCellProps={{
          sx: {
            fontSize: "0.75rem",
            padding: "0.25rem",
          },
        }}
        onRowClick={({ row }) => enableExpand && row.toggleRowExpanded()}
        renderDetailPanel={({ row }) => (
          <DetailPanel
            row={row}
            detailFields={detailFields}
            extraColumns={extraColumns}
            enableEdit={enableEditExtra}
            handleEditClick={handleEditClick}
            handleDelete={handleDelete}
            handleAddClick={handleAddClick}
          />
        )}
      />
      <EditDialog
        open={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        editValues={editValues || {}} // Προεπιλεγμένη τιμή για το editValues
        handleEditSave={handleEditSave}
        fields={columns}
      />
      <AddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        newRow={newRow}
        handleAddChange={handleAddChange}
        handleAddSave={handleAddSave}
        fields={addFields}
      />
    </Box>
  );
});

export default DataTable;