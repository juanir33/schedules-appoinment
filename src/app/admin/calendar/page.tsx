
import { useEffect, useState } from "react";

import { collection, getDocs } from "firebase/firestore";
import { Reservation } from "@/src/types/models.type";
import { db } from "@/src/lib/firebase/firebase";
import Protected from "@/src/components/Protected";
import CalendarView from "@/src/components/CalendarView";

export default function CalendarioAdmin() {
  const [reservas, setReservas] = useState<Reservation[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "reservations"));
      const items = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          inicio: data.inicio.toDate().toISOString(),
          fin: data.fin.toDate().toISOString(),
        };
      });
      setReservas(items);
    };
    fetch();
  }, []);

  return (
    <Protected>
      <h1 className="text-2xl font-bold mb-4">Calendario de Reservas</h1>
      <CalendarView reservas={reservas} />
    </Protected>
  );
}
