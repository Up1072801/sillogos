import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Εισαγωγή του Link
import DataTable from "../components/DataTable/DataTable";

export default function EksormisiDetails() {
  const { eksormisiId } = useParams();
  const [eksormisi, setEksormisi] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`http://localhost:5000/api/eksormiseis/${eksormisiId}`);
        const data = await response.json();
        setEksormisi(data);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      }
    }
    fetchData();
  }, [eksormisiId]);

  if (!eksormisi) {
    return <div>Η εξόρμηση δεν βρέθηκε.</div>;
  }

  const drastiriotitesColumns = [
    {
      accessorKey: "onoma",
      header: "Όνομα",
      Cell: ({ row }) => (
        <Link
          to={`/eksormiseis/${eksormisiId}/${row.original.id}`} // Χρήση του σωστού ID
          style={{ textDecoration: "underline", color: "blue" }}
        >
          {row.original.onoma}
        </Link>
      ),
    },
    { accessorKey: "ores_poreias", header: "Ώρες Πορείας" },
    { accessorKey: "diafora_ipsous", header: "Διαφορά Ύψους" },
    { accessorKey: "megisto_ipsometro", header: "Μέγιστο Υψόμετρο" },
    { accessorKey: "hmerominia", header: "Ημερομηνία" },
  ];

  return (
    <div className="container">
      <div className="header-container">
        <h2 className="header">{eksormisi.onoma}</h2>
      </div>
      <div className="details-container">
        <p><strong>Τοποθεσία:</strong> {eksormisi.topothesia}</p>
        <p><strong>Ημερομηνία Έναρξης:</strong> {eksormisi.imerominia_enarksis}</p>
        <p><strong>Ημερομηνία Λήξης:</strong> {eksormisi.imerominia_liksis}</p>
        <p><strong>Κόστος:</strong> {eksormisi.kostos}</p>
      </div>
      <div className="table-container">
        <h3>Δραστηριότητες</h3>
        <DataTable
          data={eksormisi.drastiriotites || []}
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
  );
}