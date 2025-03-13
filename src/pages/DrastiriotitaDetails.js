import "./App.css";
import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";
import { fakeEksormiseis } from "../data/fakeEksormiseis";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

export default function DrastiriotitaDetails() {
  const { eksormisiName, drastiriotitaName } = useParams();
  const eksormisi = fakeEksormiseis.find((eksormisi) => eksormisi.onoma === eksormisiName);
  const drastiriotita = eksormisi?.drastirioties.find((drastiriotita) => drastiriotita.onoma === drastiriotitaName);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState({ ...drastiriotita });

  if (!drastiriotita) {
    return <div>Η δραστηριότητα δεν βρέθηκε.</div>;
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

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">{drastiriotita.onoma}</h2>
      </div>
      <div className="details-container" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div className="left-details" style={{ flex: 1, marginRight: "20px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <p><strong>Ημερομηνία:</strong> {drastiriotita.imerominia}</p>
          </div>
          <Button variant="contained" color="primary" onClick={handleEditClick}>
            Επεξεργασία
          </Button>
        </div>
      </div>
      <div className="participants-container" style={{ marginTop: "20px" }}>
        <h3>Συμμετέχοντες</h3>
        <DataTable 
          data={drastiriotita.simmetoxontes || []} 
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
        <DialogTitle id="edit-dialog-title">Επεξεργασία Στοιχείων Δραστηριότητας</DialogTitle>
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
            label="Ημερομηνία"
            name="imerominia"
            value={editValues.imerominia}
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