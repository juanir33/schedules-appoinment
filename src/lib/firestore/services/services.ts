
import {
  collection, addDoc, getDocs, query, where, updateDoc, doc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Service } from "@/src/types/models.type";

const col = collection(db, "services");

export async function createService(data: Omit<Service, "id">) {
  const ref = await addDoc(col, data);
  return { id: ref.id, ...data } as Service;
}

export async function listServices(onlyActive = false) {
  const q = onlyActive ? query(col, where("active", "==", true)) : col;
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Service, "id">) }));
}

export async function updateService(id: string, data: Partial<Omit<Service, "id">>) {
  await updateDoc(doc(col, id), data);
}
