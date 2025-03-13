import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../components/DataTable/DataTable"; // Ενημέρωση της διαδρομής εισαγωγής του DataTable
import { fakeAthlites } from "../data/fakeathlites"; // Χρήση ονομαστικών εξαγωγών
import { fakeMeli } from "../data/fakemeli"; // Χρήση ονομαστικών εξαγωγών
import { fakeMeliAllwn } from "../data/fakeMeliallwn"; // Χρήση ονομαστικών εξαγωγών
import { fakeEpafes } from "../data/fakeepafes"; // Χρήση ονομαστικών εξαγωγών

const columns = [
  { accessorKey: "firstName", header: "Όνομα" },
  { accessorKey: "lastName", header: "Επώνυμο" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Τηλέφωνο" },
  { accessorKey: "type", header: "Ιδιότητα" },
];

const detailFields = {
  athlites: [
    { accessorKey: "firstName", header: "Όνομα" },
    { accessorKey: "lastName", header: "Επώνυμο" },
    { accessorKey: "phone", header: "Τηλέφωνο" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
    { accessorKey: "arithmosdeltiou", header: "Αριθμός Δελτίου" },
    { accessorKey: "hmerominiaenarksis", header: "Ημερομηνία Εναρξης" },
    { accessorKey: "hmerominialiksis", header: "Ημερομηνία Λήξης" },
    { accessorKey: "athlima", header: "Άθλημα" }
  ],
  meli: [
    { accessorKey: "firstName", header: "Όνομα" },
    { accessorKey: "lastName", header: "Επώνυμο" },
    { accessorKey: "phone", header: "Τηλέφωνο" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "job", header: "Επάγγελμα" },
    { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
    { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου" },
    { accessorKey: "katastasisindromis", header: "Κατάσταση Συνδρομής" },
    { accessorKey: "datepliromis", header: "Ημερομηνία Πληρωμής Συνδρομής" },
    { accessorKey: "dategrafis", header: "Ημερομηνία Εγγραφής" }
  ],
  meliallwn: [
    { accessorKey: "firstName", header: "Όνομα" },
    { accessorKey: "lastName", header: "Επώνυμο" },
    { accessorKey: "phone", header: "Τηλέφωνο" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "vathmos", header: "Βαθμός Δυσκολίας" },
    { accessorKey: "arithmosmitroou", header: "Αριθμός Μητρώου" },
    { accessorKey: "onomasillogou", header: "Όνομα Συλλόγου" }
  ],
  epafes: [
    { accessorKey: "firstName", header: "Όνομα" },
    { accessorKey: "lastName", header: "Επώνυμο" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Τηλέφωνο" },
    { accessorKey: "type", header: "Ιδιότητα" }
  ]
};

const extraColumns = {
  athlites: [
    [
      { accessorKey: "drastirioties", header: "Δραστηριότητες" },
    ],
    [
      { accessorKey: "sxoles", header: "Σχολές" },
    ],
    [
      { accessorKey: "agones", header: "Αγώνες" }
    ]
  ],
  meli: [
    [
      { accessorKey: "drastirioties", header: "Δραστηριότητες" },
    ],
    [
      { accessorKey: "sxoles", header: "Σχολές" },
    ]
  ],
  meliallwn: [
    [
      { accessorKey: "drastirioties", header: "Δραστηριότητες" },
    ],
    [
      { accessorKey: "sxoles", header: "Σχολές" },
    ]
  ],
  epafes: []
};

const Epafes = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const combinedData = [
      ...fakeAthlites.map(item => ({ ...item, type: "Αθλητής", category: "Αθλητής" })),
      ...fakeMeli.map(item => ({ ...item, type: "Μέλος Συλλόγου", category: "Μέλος Συλλόγου" })),
      ...fakeMeliAllwn.map(item => ({ ...item, type: "Μέλος Άλλου Συλλόγου", category: "Μέλος Άλλου Συλλόγου" })),
      ...fakeEpafes.map(item => ({ ...item, category: "Επαφή" }))
    ];
    setData(combinedData);
  }, []);

  const renderDetailPanel = useCallback(({ row }) => {
    const category = row.original.category;
    const detailFieldsForType = category === "Αθλητής" ? detailFields.athlites : category === "Μέλος Συλλόγου" ? detailFields.meli : category === "Μέλος Άλλου Συλλόγου" ? detailFields.meliallwn : detailFields.epafes;
    const extraCols = category === "Αθλητής" ? extraColumns.athlites : category === "Μέλος Συλλόγου" ? extraColumns.meli : category === "Μέλος Άλλου Συλλόγου" ? extraColumns.meliallwn : extraColumns.epafes;

    return (
      <div>
        <strong>Λεπτομέρειες:</strong>
        {detailFieldsForType.map((field) => (
          row.original[field.accessorKey] && (
            <p key={field.accessorKey}>
              <strong>{field.header}:</strong> {row.original[field.accessorKey]}
            </p>
          )
        ))}
        {extraCols.map((tableData, index) => (
          row.original[tableData[0].accessorKey] && (
            <div key={index}>
              <strong>{tableData[0].header}:</strong>
              <DataTable
                data={row.original[tableData[0].accessorKey]}
                columns={tableData}
                extraColumns={[]}
                detailFields={[]}
                initialState={{}}
                enableExpand={false}
                enableView={false}
                enableDelete={false}
                          enableEditMain = {true}
                          enableEditExtra = {false}
                enableFilter={false}
              />
            </div>
          )
        ))}
      </div>
    );
  }, []);

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header" role="heading" aria-level="2">Επαφές <span className="record-count">({data.length})</span></h2>
      </div>
      <div className="table-container">
        <DataTable
          data={data}
          columns={columns}
          extraColumns={[]}
          detailFields={[]}
          initialState={{}}
          enableExpand={true}
          enableView={true}
          enableDelete={true}
          enableFilter={true}
          renderDetailPanel={renderDetailPanel}
        />
      </div>
    </div>
  );
};

export default Epafes;