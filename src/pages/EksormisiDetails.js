import "./App.css";
import React, { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";
import { fakeEksormiseis } from "../data/fakeEksormiseis";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

export default function EksormisiDetails() {
  const { eksormisiName } = useParams();
  const eksormisi = fakeEksormiseis.find((eksormisi) => eksormisi.onoma === eksormisiName);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState({ ...eksormisi });

  if (!eksormisi) {
    return <div>Η εξόρμηση δεν βρέθηκε.</div>;
  }

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
    // Εδώ μπορείς να προσθέσεις τον κώδικα για την αποθήκευση των αλλαγών
    setEditDialogOpen(false);
  }, []);

  const participantsColumns = [
    { accessorKey: "name", header: "Όνομα" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Τηλέφωνο" },
  ];

  const drastiriotitesColumns = [
    { accessorKey: "onoma", header: "Όνομα", Cell: ({ row }) => <Link to={`/eksormiseis/${eksormisiName}/${row.original.onoma}`}>{row.original.onoma}</Link> },
    { accessorKey: "imerominia", header: "Ημερομηνία" },
  ];

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">{eksormisi.onoma}</h2>
      </div>
      <div className="details-container" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div className="left-details" style={{ flex: 1, marginRight: "20px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <p><strong>Τοποθεσία:</strong> {eksormisi.topothesia}</p>
            <p><strong>Ημερομηνία Έναρξης:</strong> {eksormisi.imerominia_enarksis}</p>
            <p><strong>Ημερομηνία Λήξης:</strong> {eksormisi.imerominia_liksis}</p>
            <p><strong>Κόστος:</strong> {eksormisi.kostos}</p>
          </div>
          <Button variant="contained" color="primary" onClick={handleEditClick}>
            Επεξεργασία
          </Button>
        </div>
        <div className="right-details" style={{ flex: 1 }}>
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
      </div>
      <div className="participants-container" style={{ marginTop: "20px" }}>
        <h3>Συμμετέχοντες</h3>
        <DataTable 
          data={eksormisi.simmetoxontes || []} 
          columns={participantsColumns} 
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

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} aria-labelledby="edit-dialog-title">
        <DialogTitle id="edit-dialog-title">Επεξεργασία Στοιχείων Εξόρμησης</DialogTitle>
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
          <TextField
            margin="dense"
            label="Ημερομηνία Έναρξης"
            name="imerominia_enarksis"
            value={editValues.imerominia_enarksis}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Ημερομηνία Λήξης"
            name="imerominia_liksis"
            value={editValues.imerominia_liksis}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Κόστος"
            name="kostos"
            value={editValues.kostos}
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