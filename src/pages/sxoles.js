import "./App.css";
import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable"; // Ενημέρωση της διαδρομής εισαγωγής του DataTable
import { fakeSxoles, fakeEkpaideutes } from "../data/fakesxoles"; // Χρήση ονομαστικών εξαγωγών
const sxolesColumns = [
  { accessorKey: "onoma", header: "Όνομα", Cell: ({ row }) => <Link to={`/sxoles/${row.original.id}`}>{row.original.onoma}</Link> },
  { accessorKey: "klados", header: "Κλάδος" },
  { accessorKey: "epipedo", header: "Επίπεδο" },
  { accessorKey: "timi", header: "Τιμή" },
  { accessorKey: "etos", header: "Έτος" },
  { accessorKey: "seira", header: "Σειρά" },
  { accessorKey: "simmetoxes", header: "Συμμετοχές" },
];

const sxolesDetailFields = [
  { accessorKey: "topothesia", header: "Τοποθεσία" },
  { accessorKey: "imerominia_enarksis", header: "Ημερομηνία Έναρξης" },
  { accessorKey: "imerominia_liksis", header: "Ημερομηνία Λήξης" },
];

const ekpaideutesColumns = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "epipedo", header: "Επίπεδο" },
  { accessorKey: "klados", header: "Κλάδος" },
];

export default function Sxoles() {
  const renderDetailPanel = useCallback(({ row }) => (
    <div>
      <DataTable
        data={row.original.details || []}
        columns={sxolesDetailFields}
        extraColumns={[]}
        detailFields={[]}
        initialState={{}}
        enableExpand={false}
        enableView={false}
        enableEditMain = {true}
        enableEditExtra = {false}
        enableDelete={false}
        enableFilter={false}
      />
    </div>
  ), []);

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Σχολές <span className="record-count">({fakeSxoles.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeSxoles || []}
          columns={sxolesColumns}
          extraColumns={[]}
          detailFields={sxolesDetailFields}
          initialState={{}}
          enableExpand={true}
          enableView={true}
          enableDelete={true}
          enableEditMain = {true}
          enableEditExtra = {false}
          enableFilter={true}
          renderDetailPanel={renderDetailPanel}
        />
      </div>
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Εκπαιδευτές <span className="record-count">({fakeEkpaideutes.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeEkpaideutes || []}
          columns={ekpaideutesColumns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{}}
          enableExpand={false}
          enableView={false}
          enableDelete={false}
          enableFilter={true}
        />
      </div>
    </div>
  );
}