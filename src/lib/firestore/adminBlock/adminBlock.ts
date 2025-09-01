import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function createHoliday(data: { date: string; motivo: string }) {
  return await addDoc(collection(db, "holidays"), data);
}

export async function listHolidays() {
  const snap = await getDocs(collection(db, "holidays"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteHoliday(id: string) {
  return await deleteDoc(doc(db, "holidays", id));
}

export async function createClosure(data: { startLocal: string; endLocal: string; motivo: string }) {
  return await addDoc(collection(db, "closures"), data);
}

export async function listClosures() {
  const snap = await getDocs(collection(db, "closures"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteClosure(id: string) {
  return await deleteDoc(doc(db, "closures", id));
}
