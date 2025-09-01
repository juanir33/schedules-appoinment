import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "./firebase";

// holidays: { date: "YYYY-MM-DD", motivo: string }
export async function getHolidaySetForMonth(year: number, month: number) {
  // month 1–12 -> normalízalo si preferís; aquí lo dejamos informativo
  const snap = await getDocs(collection(db, "holidays"));
  const set = new Set<string>();
  snap.docs.forEach(d => {
    const { date } = d.data() as { date: string };
    set.add(date); // YYYY-MM-DD
  });
  return set;
}
