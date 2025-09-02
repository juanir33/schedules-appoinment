import { addMinutes, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function localStringToUtc(localString: string, tz: string): string {
  // Convierte una fecha/hora local a UTC
  const localDate = parseISO(localString);
  const utcDate = fromZonedTime(localDate, tz);
  return utcDate.toISOString();
}

export function addMinutesLocal(localString: string, minutes: number, tz: string): string {
  // Añade minutos a una fecha/hora local
  const localDate = parseISO(localString);
  const utcDate = fromZonedTime(localDate, tz);
  const newUtcDate = addMinutes(utcDate, minutes);
  const newLocalDate = toZonedTime(newUtcDate, tz);
  return newLocalDate.toISOString().slice(0, 19);
}

export function rangesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  // Verifica si dos rangos de tiempo se superponen
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2;
  
  return s1 < e2 && s2 < e1;
}