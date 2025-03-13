import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fakeSxoles } from "../data/fakesxoles"; // Χρήση ονομαστικών εξαγωγών
import DataTable from "../components/DataTable/DataTable"; // Ενημέρωση της διαδρομής εισαγωγής του DataTable
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import "../pages/App.css";

export default function SchoolDetails() {
  const { id } = useParams();
  const school = fakeSxoles.find((school) => school.id === id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState({ ...school });
  const [newPayment, setNewPayment] = useState({ amount: '', date: '' });

  if (!school) {
    return <div>Η σχολή δεν βρέθηκε.</div>;
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

  const handleAddPayment = useCallback((participantId) => {
    const updatedParticipants = school.participants.map(participant => {
      if (participant.id === participantId) {
        return {
          ...participant,
          payments: [...participant.payments, newPayment]
        };
      }
      return participant;
    });
    setEditValues((prevValues) => ({
      ...prevValues,
      participants: updatedParticipants,
    }));
    setNewPayment({ amount: '', date: '' });
  }, [newPayment, school.participants]);

  const participantsColumns = [
    { accessorKey: "name", header: "Όνομα" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Τηλέφωνο" },
  ];

  const paymentsColumns = [
    { accessorKey: "amount", header: "Ποσό" },
    { accessorKey: "date", header: "Ημερομηνία Πληρωμής" },
  ];

  const periodsColumns = [
    { accessorKey: "topothesia", header: "Τοποθεσία" },
    { accessorKey: "imerominia_enarksis", header: "Ημερομηνία Έναρξης" },
    { accessorKey: "imerominia_liksis", header: "Ημερομηνία Λήξης" },
  ];

  const detailFields = [
    { accessorKey: "name", header: "Όνομα" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Τηλέφωνο" },
  ];

  const extraColumns = [
    { accessorKey: "payments", header: "Πληρωμές", Cell: ({ row }) => (
      <div>
        <DataTable 
          data={row.original.payments || []}
          columns={paymentsColumns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{}}
          enableExpand={false}
          enableView={false}
          enableDelete={false}
          enableFilter={false}
        />
        <h4>Προσθήκη Πληρωμής</h4>
        <TextField
          margin="dense"
          label="Ποσό"
          name="amount"
          value={newPayment.amount}
          onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
          fullWidth
        />
        <TextField
          margin="dense"
          label="Ημερομηνία Πληρωμής"
          name="date"
          value={newPayment.date}
          onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
          fullWidth
        />
        <Button variant="contained" color="primary" onClick={() => handleAddPayment(row.original.id)}>
          Προσθήκη Πληρωμής
        </Button>
      </div>
    )}
  ];

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">{school.onoma}</h2>
      </div>
      <div className="details-container" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div className="left-details" style={{ flex: 1, marginRight: "20px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <p><strong>Κλάδος:</strong> {school.klados}</p>
            <p><strong>Επίπεδο:</strong> {school.epipedo}</p>
            <p><strong>Εποχή:</strong> {school.epoxi}</p>
            <p><strong>Χρονολογία:</strong> {school.xronologia}</p>
            <p><strong>Τιμή:</strong> {school.timi}</p>
            <p><strong>Κόστος:</strong> {school.kostos}</p>
            <p><strong>Σύνολο Εγγραφών:</strong> {school.synoloEggrafon}</p>
            <p><strong>Εκπαιδευτής:</strong> {school.ekpaideutis}</p>
            <p><strong>Email Εκπαιδευτή:</strong> {school.emailEkpaideuti}</p>
            <p><strong>Τηλέφωνο Εκπαιδευτή:</strong> {school.phoneEkpaideuti}</p>
          </div>
          <Button variant="contained" color="primary" onClick={handleEditClick}>
            Επεξεργασία
          </Button>
        </div>
        <div className="right-details" style={{ flex: 1 }}>
          <h3>Περίοδοι</h3>
          <DataTable 
            data={school.details || []} 
            columns={periodsColumns} 
            extraColumns={[]} 
            detailFields={[]} 
            initialState={{}} 
            enableExpand={false}
            enableView={false}
            enableDelete={false}
            enableFilter={false}
          />
        </div>
      </div>
      <div className="participants-container" style={{ marginTop: "20px" }}>
        <h3>Συμμετέχοντες</h3>
        <DataTable 
          data={school.participants || []} 
          columns={participantsColumns} 
          extraColumns={[]} 
          detailFields={[]} 
          initialState={{}} 
          enableExpand={true}
                    enableEditMain = {true}
                    enableEditExtra = {true}
          enableView={false}
          enableDelete={false}
          enableFilter={true}
        />
      </div>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} aria-labelledby="edit-dialog-title">
        <DialogTitle id="edit-dialog-title">Επεξεργασία Στοιχείων Σχολής</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Κλάδος"
            name="klados"
            value={editValues.klados}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Επίπεδο"
            name="epipedo"
            value={editValues.epipedo}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Εποχή"
            name="epoxi"
            value={editValues.epoxi}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Χρονολογία"
            name="xronologia"
            value={editValues.xronologia}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Τιμή"
            name="timi"
            value={editValues.timi}
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
          <TextField
            margin="dense"
            label="Σύνολο Εγγραφών"
            name="synoloEggrafon"
            value={editValues.synoloEggrafon}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Εκπαιδευτής"
            name="ekpaideutis"
            value={editValues.ekpaideutis}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Email Εκπαιδευτή"
            name="emailEkpaideuti"
            value={editValues.emailEkpaideuti}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Τηλέφωνο Εκπαιδευτή"
            name="phoneEkpaideuti"
            value={editValues.phoneEkpaideuti}
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