import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@lib/firebase/firebase";

const holidaysCol = collection(db, "holidays");
const closuresCol = collection(db, "closures");

export async function listHolidays(): Promise<Holiday[]> {
  const snap = await getDocs(holidaysCol);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Holiday, "id">) }));
}

export async function createHoliday(data: { date: string; motivo: string }): Promise<Holiday> {
  const ref = await addDoc(holidaysCol, data);
  return { id: ref.id, ...data } as Holiday;
}

export async function deleteHoliday(id: string): Promise<void> {
  await deleteDoc(doc(holidaysCol, id));
}

export async function listClosures(): Promise<Closure[]> {
  const snap = await getDocs(closuresCol);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Closure, "id">) }));
}

export async function createClosure(data: { startLocal: string; endLocal: string; motivo: string }): Promise<Closure> {
  const ref = await addDoc(closuresCol, data);
  return { id: ref.id, ...data } as Closure;
}

export async function deleteClosure(id: string): Promise<void> {
  await deleteDoc(doc(closuresCol, id));
}

// Types for the data structures
export interface Holiday {
  id: string;
  date: string;
  motivo: string;
}

export interface Closure {
  id: string;
  startLocal: string;
  endLocal: string;
  motivo: string;
}