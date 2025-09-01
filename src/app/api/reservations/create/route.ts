import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { localStringToUtc, utcToLocalString } from "../../../lib/time";

async function isHolidayLocal(localDateKey: string) {
  const snap = await adminDb.collection("holidays").where("date", "==", localDateKey).get();
  return !snap.empty;
}

function isOffDayLocal(localDateKey: string, tz: string, offDays: number[]) {
  const noonLocal = `${localDateKey}T12:00`;
  const d = localStringToUtc(noonLocal, tz);
  const localDow = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" })
    .formatToParts(new Date(d))
    .find(p => p.type === "weekday")?.value;
  const map: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const n = localDow ? map[localDow] : 0;
  return offDays.includes(n);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No auth" });
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { cliente, servicioId, inicioLocal, tz } = req.body as {
      cliente: string; servicioId: string; inicioLocal: string; tz: string;
    };
    if (!cliente || !servicioId || !inicioLocal || !tz) {
      return res.status(400).json({ error: "Campos faltantes" });
    }

    // Settings
    const settingsSnap = await adminDb.collection("settings").limit(1).get();
    const settings = settingsSnap.docs[0].data() as any;
    const businessTz = settings.businessTimeZone as string;
    const openHour = settings.openHour as number;
    const closeHour = settings.closeHour as number;
    const offDays = (settings.offDays as number[]) ?? [];

    if (tz !== businessTz) {
      // opcional: obligar a usar tz del negocio
    }

    const inicioUtc = localStringToUtc(inicioLocal, businessTz);

    // Cargar servicio y calcular fin
    const serviceDoc = await adminDb.collection("services").doc(servicioId).get();
    if (!serviceDoc.exists) return res.status(400).json({ error: "Servicio no existe" });
    const service = serviceDoc.data() as { nombre: string; duracionMin: number; activo: boolean };
    if (!service.activo) return res.status(400).json({ error: "Servicio inactivo" });

    const finUtc = new Date(inicioUtc.getTime() + service.duracionMin * 60 * 1000);

    // Validaciones locales: offDays/feriados/horario
    const localDateKey = inicioLocal.slice(0, 10); // YYYY-MM-DD
    if (await isHolidayLocal(localDateKey)) return res.status(400).json({ error: "Feriado / día bloqueado" });
    if (isOffDayLocal(localDateKey, businessTz, offDays)) return res.status(400).json({ error: "Día no laborable" });

    const localStartHM = parseInt(inicioLocal.slice(11,13),10) * 60 + parseInt(inicioLocal.slice(14,16),10);
    if (localStartHM < openHour*60 || localStartHM + service.duracionMin > closeHour*60) {
      return res.status(400).json({ error: "Fuera de horario" });
    }

    // Antisolapado (UTC)
    const q = await adminDb.collection("reservations")
      .where("inicio", "<", Timestamp.fromDate(finUtc))
      .where("fin", ">", Timestamp.fromDate(inicioUtc))
      .get();
    if (!q.empty) return res.status(400).json({ error: "Slot no disponible" });

    // Crear reserva
    const ref = await adminDb.collection("reservations").add({
      userId,
      cliente,
      servicioId,
      servicioNombre: service.nombre,
      inicio: Timestamp.fromDate(inicioUtc),
      fin: Timestamp.fromDate(finUtc),
      tz: businessTz,
      estado: "pendiente",
      createdAt: Timestamp.now(),
    });

    res.status(200).json({ id: ref.id });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Error" });
  }
}
