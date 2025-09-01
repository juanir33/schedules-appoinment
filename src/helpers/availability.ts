
import { format } from "date-fns";
import { localStringToUtc, addMinutesLocal, rangesOverlap } from "./time";

export type Slot = { inicioUtcISO: string; finUtcISO: string; inicioLocal: string; finLocal: string };
export type BlockUtc = { inicioUtc: Date; finUtc: Date };

export function isOffDay(localDateKey: string, tz: string, offDays: number[]) {
  // Tomamos las 12:00 local para obtener el día de semana estable
  const noonLocal = `${localDateKey}T12:00`;
  const d = localStringToUtc(noonLocal, tz); // UTC
  const dow = new Date(d).getUTCDay(); // 0..6 respecto a UTC, no ideal
  // Truco: mejor obtener el DOW en local: usamos Intl.DateTimeFormat
  const localDow = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" })
    .formatToParts(new Date(d))
    .find(p => p.type === "weekday")?.value;
  const map: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const n = localDow ? map[localDow] : dow;
  return offDays.includes(n);
}

export function generateSlotsZoned(params: {
  localDateKey: string; // "YYYY-MM-DD"
  tz: string;
  openHour: number;
  closeHour: number;
  durMin: number;
  stepMin: number;
  blocksUtc: BlockUtc[]; // reservas existentes y cierres en UTC
  holidaySet?: Set<string>;
  offDays?: number[];
}) {
  const {
    localDateKey, tz, openHour, closeHour, durMin, stepMin, blocksUtc,
    holidaySet = new Set<string>(), offDays = [],
  } = params;

  if (holidaySet.has(localDateKey)) return [];
  if (isOffDay(localDateKey, tz, offDays)) return [];

  // Construimos horas locales
  const startLocal = `${localDateKey}T${String(openHour).padStart(2, "0")}:00`;
  const endLocal = `${localDateKey}T${String(closeHour).padStart(2, "0")}:00`;

  const slots: Slot[] = [];
  let cursorLocal = startLocal;

  const endLocalHM = closeHour * 60;
  let cursorHM = openHour * 60;

  while (cursorHM + durMin <= endLocalHM) {
    const inicioLocal = cursorLocal;
    const finLocal = addMinutesLocal(inicioLocal, durMin, tz);

    const inicioUtc = localStringToUtc(inicioLocal, tz);
    const finUtc = localStringToUtc(finLocal, tz);

    // descartar si solapa con bloqueos en UTC
    const overlap = blocksUtc.some(b => rangesOverlap(inicioUtc, finUtc, b.inicioUtc, b.finUtc));
    if (!overlap) {
      slots.push({
        inicioUtcISO: inicioUtc.toISOString(),
        finUtcISO: finUtc.toISOString(),
        inicioLocal,
        finLocal,
      });
    }

    cursorHM += stepMin;
    cursorLocal = addMinutesLocal(cursorLocal, stepMin, tz);
  }
  return slots;
}
