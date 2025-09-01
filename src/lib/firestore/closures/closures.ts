import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { localStringToUtc } from "./time";

export async function getClosureBlocksUtc(tz: string) {
  const snap = await getDocs(collection(db, "closures"));
  return snap.docs.map(d => {
    const { startLocal, endLocal } = d.data() as { startLocal: string; endLocal: string };
    return {
      inicioUtc: localStringToUtc(startLocal, tz),
      finUtc: localStringToUtc(endLocal, tz),
    };
  });
}
