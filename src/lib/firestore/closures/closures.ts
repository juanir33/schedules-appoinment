import { db } from "@/src/lib/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { localStringToUtc } from "@/src/helpers/time";

export async function getClosureBlocksUtc(tz: string) {
  const snap = await getDocs(collection(db, "closures"));
  return snap.docs.map(d => {
    const { startLocal, endLocal } = d.data() as { startLocal: string; endLocal: string };
    return {
      startUtc: localStringToUtc(startLocal, tz),
    endUtc: localStringToUtc(endLocal, tz),
    };
  });
}
