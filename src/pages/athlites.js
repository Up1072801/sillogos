import "./App.css";
import React, { useState, useCallback, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable"; // Ενημέρωση της διαδρομής εισαγωγής του DataTable
import { fakeAthlites } from "../data/fakeathlites"; // Χρήση ονομαστικών εξαγωγών

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας", enableHiding: true },
  { accessorKey: "arithmosdeltiou", header: "Αριθμός Δελτίου", enableHiding: true },
  { accessorKey: "hmerominiaenarksis", header: "Ημερομηνία Εναρξης", enableHiding: true },
  { accessorKey: "hmerominialiksis", header: "Ημερομηνία Λήξης", enableHiding: true },
  { accessorKey: "athlima", header: "Άθλημα" },
];

const extraColumns = [
  [
    { accessorKey: "drastirioties", header: "Δραστηριότητες", Cell: ({ row }) => row.original.drastirioties.join(", ") },
  ],
  [
    { accessorKey: "sxoles", header: "Σχολές", Cell: ({ row }) => row.original.sxoles.join(", ") },
  ],
  [
    { accessorKey: "agones", header: "Αγώνες", Cell: ({ row }) => row.original.agones.join(", ") }
  ]
];

const detailFields = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
  { accessorKey: "arithmosdeltiou", header: "Αριθμός Δελτίου" },
  { accessorKey: "hmerominiaenarksis", header: "Ημερομηνία Εναρξης" },
  { accessorKey: "hmerominialiksis", header: "Ημερομηνία Λήξης" },
  { accessorKey: "athlima", header: "Άθλημα" }
];

const sportsColumns = [
  { accessorKey: "athlima", header: "Άθλημα" },
  { accessorKey: "participants", header: "Συμμετέχοντες" },
];

export default function Athlites() {
  const [data, setData] = useState(fakeAthlites);

  const handleAddAgonas = useCallback((newAgonas) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.athlima === newAgonas.athlima
          ? { ...item, agonesDetails: [...item.agonesDetails, newAgonas] }
          : item
      )
    );
  }, []);

  const sportsData = useMemo(() => {
    const sportsMap = {};
    data.forEach((athlete) => {
      if (!sportsMap[athlete.athlima]) {
        sportsMap[athlete.athlima] = { athlima: athlete.athlima, participants: 0, agones: [] };
      }
      sportsMap[athlete.athlima].participants += athlete.agonesDetails?.length > 0 ? 1 : 0;
      sportsMap[athlete.athlima].agones.push(...(athlete.agonesDetails || []));
    });
    return Object.values(sportsMap);
  }, [data]);

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Αθλητές <span className="record-count">({fakeAthlites.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={fakeAthlites || []}
          columns={columns}
          extraColumns={extraColumns}
          detailFields={detailFields}
          initialState={{
            columnVisibility: {
              vathmos: false,
              arithmosdeltiou: false,
              hmerominiaenarksis: false,
              hmerominialiksis: false,
            },
          }}
          enableExpand={true}
          enableEditMain={true}
          enableEditExtra={true}
          enableDelete={true}
          enableFilter={true}
        />
      </div>
      <div className="table-container" style={{ marginTop: "20px" }}>
        <h3>Αθλήματα</h3>
        <DataTable
          data={sportsData || []}
          columns={sportsColumns}
          extraColumns={[
            [
              { accessorKey: "agones", header: "Αγώνες", Cell: ({ row }) => row.original.agones.map((agonas, idx) => (
                <div key={idx}>
                  <strong>{agonas.name}</strong>: {agonas.participants.join(", ")}
                </div>
              )) }
            ]
          ]}
          detailFields={[]}
          initialState={{}}
          enableExpand={true}
          enableEditMain={false}
          enableEditExtra={false}
          enableDelete={false}
          enableFilter={false}
        />
      </div>
    </div>
  );
}