import "./App.css";
import React from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable/DataTable";
import { fakeEksormiseis } from "../data/fakeEksormiseis";

const eksormiseisColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "onoma", header: "Όνομα", Cell: ({ row }) => <Link to={`/eksormiseis/${row.original.id}`}>{row.original.onoma}</Link> },
  { accessorKey: "topothesia", header: "Τοποθεσία" },
  { accessorKey: "imerominia_enarksis", header: "Ημερομηνία Έναρξης" },
  { accessorKey: "imerominia_liksis", header: "Ημερομηνία Λήξης" },
  { accessorKey: "kostos", header: "Κόστος" },
];

export default function Eksormiseis() {
  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Εξορμήσεις <span className="record-count">({fakeEksormiseis.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeEksormiseis || []}
          columns={eksormiseisColumns}
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
  );
}