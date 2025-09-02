
'use client'

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Reservation } from "@/src/types/models.type";
import { db } from "@/src/lib/firebase/firebase";
import AdminProtected from "@/src/components/AdminProtected";
import CalendarView from "@/src/components/CalendarView";
import { Calendar } from "lucide-react";

export default function CalendarioAdmin() {
  const [reservas, setReservas] = useState<Reservation[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "reservations"));
      const items = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || '',
          customer: data.customer || '',
          serviceId: data.serviceId || '',
          serviceName: data.serviceName || '',
          startISO: data.start?.toDate().toISOString() || data.startISO || '',
          endISO: data.end?.toDate().toISOString() || data.endISO || data.startISO || '',
          status: data.status,
          googleEventId: data.googleEventId,
        };
      });
      setReservas(items);
    };
    fetch();
  }, []);

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-6">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Calendario de Reservas</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Visualiza y gestiona todas las reservas del salón en una vista de calendario completa
            </p>
          </div>

          {/* Calendar Container */}
          <div className="card-elegant p-6">
            <CalendarView reservas={reservas} />
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
