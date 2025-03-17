import "./App.css";
import React, { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";
import { fakeEksormiseis } from "../data/fakeEksormiseis";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

export default function EksormisiDetails() {
  const { eksormisiId } = useParams();
  const eksormisi = fakeEksormiseis.find((eksormisi) => eksormisi.id === eksormisiId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState(eksormisi ? { ...eksormisi } : {});

  const handleEditClick = useCallback(() => {
    setEditDialogOpen(true);
  }, []);

  const handleEditChange = useCallback((e) => {
    setEditValues((prevValues) => ({
      ...prevValues,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleEditSave = useCallback(() => {
    setEditDialogOpen(false);
  }, []);

  const drastiriotitesColumns = [
    {
      accessorKey: "onoma",
      header: "Όνομα",
      Cell: ({ row }) => (
        <Link to={`/eksormiseis/${eksormisi?.id}/${row.original.id}`}>
          {row.original.onoma}
        </Link>
      ),
    },
  ];

  // Αν το eksormisi είναι undefined, εμφανίστε μήνυμα στο JSX
  if (!eksormisi) {
    return <div>Η εξόρμηση δεν βρέθηκε.</div>;
  }

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">
          {eksormisi.onoma}
        </h2>
      </div>
      <div className="details-container">
        <p>
          <strong>Τοποθεσία:</strong> {eksormisi.topothesia}
        </p>
        <p>
          <strong>Ημερομηνία Έναρξης:</strong> {eksormisi.imerominia_enarksis}
        </p>
        <p>
          <strong>Ημερομηνία Λήξης:</strong> {eksormisi.imerominia_liksis}
        </p>
        <p>
          <strong>Κόστος:</strong> {eksormisi.kostos}
        </p>
        <Button variant="contained" color="primary" onClick={handleEditClick}>
          Επεξεργασία
        </Button>
      </div>
      <div className="drastiriotites-container">
        <h3>Δραστηριότητες</h3>
        <DataTable
          data={eksormisi.drastirioties || []}
          columns={drastiriotitesColumns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{}}
          enableExpand={true}
          enableEditMain={true}
          enableEditExtra={false}
          enableDelete={true}
          enableFilter={true}
        />
      </div>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Επεξεργασία Στοιχείων Εξόρμησης</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Όνομα"
            name="onoma"
            value={editValues.onoma}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Τοποθεσία"
            name="topothesia"
            value={editValues.topothesia}
            onChange={handleEditChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="secondary">
            Ακύρωση
          </Button>
          <Button onClick={handleEditSave} color="primary">
            Αποθήκευση
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}