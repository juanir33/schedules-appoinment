import { getDocs, collection } from "firebase/firestore";
import { db } from "@/src/lib/firebase/firebase";

// holidays: { date: "YYYY-MM-DD", motivo: string }
export async function getHolidaySetForMonth() {
  // Gets all holidays from the collection
  const snap = await getDocs(collection(db, "holidays"));
  const set = new Set<string>();
  snap.docs.forEach(d => {
    const { date } = d.data() as { date: string };
    set.add(date); // YYYY-MM-DD
  });
  return set;
}
