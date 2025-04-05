import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function DrastiriotitaDetails() {
  const { eksormisiId, drastiriotitaId } = useParams();
  const [drastiriotita, setDrastiriotita] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`http://localhost:5000/api/eksormiseis/${eksormisiId}`);
        const data = await response.json();
        const foundDrastiriotita = data.drastiriotites.find(
          (d) => d.id === parseInt(drastiriotitaId)
        );
        setDrastiriotita(foundDrastiriotita);
      } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των δεδομένων:", error);
      }
    }
    fetchData();
  }, [eksormisiId, drastiriotitaId]);

  if (!drastiriotita) {
    return <div>Η δραστηριότητα δεν βρέθηκε.</div>;
  }

  return (
    <div className="container">
      <h2>{drastiriotita.onoma}</h2>
      <p><strong>Ώρες Πορείας:</strong> {drastiriotita.ores_poreias}</p>
      <p><strong>Διαφορά Ύψους:</strong> {drastiriotita.diafora_ipsous}</p>
      <p><strong>Μέγιστο Υψόμετρο:</strong> {drastiriotita.megisto_ipsometro}</p>
      <p><strong>Ημερομηνία:</strong> {drastiriotita.hmerominia}</p>
    </div>
  );
}