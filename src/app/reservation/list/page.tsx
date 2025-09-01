import { useEffect, useMemo, useState } from "react";
import { generateSlotsZoned } from "../lib/availability";
import { getHolidaySetForMonth } from "../lib/holidays";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

type Settings = {
  businessTimeZone: string;
  openHour: number;
  closeHour: number;
  stepMin: number;
  offDays: number[];
};

async function loadSettings(): Promise<Settings> {
  const snap = await getDocs(collection(db, "settings"));
  const doc = snap.docs[0];
  const data = doc.data() as any;
  return {
    businessTimeZone: data.businessTimeZone,
    openHour: data.openHour,
    closeHour: data.closeHour,
    stepMin: data.stepMin ?? 15,
    offDays: data.offDays ?? [0],
  };
}

export default function Reservas() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [localDateKey, setLocalDateKey] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear(), m = String(today.getMonth()+1).padStart(2,"0"), d = String(today.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  });
  const [holidaySet, setHolidaySet] = useState<Set<string>>(new Set());
  const [blocksUtc, setBlocksUtc] = useState<{ inicioUtc: Date; finUtc: Date }[]>([]);
  const [durMin, setDurMin] = useState<number>(60); // según servicio elegido

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    (async () => {
      // Cargar feriados (simple: todos; podrías filtrarlos por mes/año)
      setHolidaySet(await getHolidaySetForMonth(0,0));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // Cargar reservas existentes del día para bloquear
      // Si tenés muchas, filtrá por rango de fecha en UTC
      const snap = await getDocs(collection(db, "reservations"));
      const items = snap.docs.map(d => d.data() as any);
      setBlocksUtc(items.map(it => ({
        inicioUtc: it.inicio.toDate() as Date,
        finUtc: it.fin.toDate() as Date,
      })));
    })();
  }, [localDateKey]);

  const slots = useMemo(() => {
    if (!settings) return [];
    return generateSlotsZoned({
      localDateKey,
      tz: settings.businessTimeZone,
      openHour: settings.openHour,
      closeHour: settings.closeHour,
      durMin,
      stepMin: settings.stepMin,
      blocksUtc,
      holidaySet,
      offDays: settings.offDays,
    });
  }, [settings, localDateKey, durMin, blocksUtc, holidaySet]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <input
        type="date"
        className="border p-2 rounded mb-3"
        value={localDateKey}
        onChange={e => setLocalDateKey(e.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        {slots.map(s => (
          <button key={s.inicioUtcISO}
            className="border rounded p-2 hover:bg-blue-50"
            // guarda s.inicioUtcISO al confirmar
          >
            {s.inicioLocal.slice(11,16)}
          </button>
        ))}
      </div>
    </div>
  );
}
