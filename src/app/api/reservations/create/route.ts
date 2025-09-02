import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { localStringToUtc } from "@/src/helpers/time";

interface Settings {
  businessTimeZone: string;
  openHour: number;
  closeHour: number;
  offDays: number[];
}

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

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No auth" }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const body = await req.json();
    const { customer, serviceId, startLocal, tz } = body as {
      customer: string; serviceId: string; startLocal: string; tz: string;
    };
    if (!customer || !serviceId || !startLocal || !tz) {
      return NextResponse.json({ error: "Campos faltantes" }, { status: 400 });
    }

    // Settings
    const settingsSnap = await adminDb.collection("settings").limit(1).get();
    const settings = settingsSnap.docs[0].data() as Settings;
    const businessTz = settings.businessTimeZone as string;
    const openHour = settings.openHour as number;
    const closeHour = settings.closeHour as number;
    const offDays = (settings.offDays as number[]) ?? [];

    if (tz !== businessTz) {
      // opcional: obligar a usar tz del negocio
    }

    const startUtc = localStringToUtc(startLocal, businessTz);

    // Cargar servicio y calcular fin
    const serviceDoc = await adminDb.collection("services").doc(serviceId).get();
    if (!serviceDoc.exists) return NextResponse.json({ error: "Servicio no existe" }, { status: 400 });
    const service = serviceDoc.data() as { name: string; durationMin: number; active: boolean };
    if (!service.active) return NextResponse.json({ error: "Servicio inactivo" }, { status: 400 });

    const endUtc = new Date(new Date(startUtc).getTime() + service.durationMin * 60 * 1000);

    // Validaciones locales: offDays/feriados/horario
    const localDateKey = startLocal.slice(0, 10); // YYYY-MM-DD
    if (await isHolidayLocal(localDateKey)) return NextResponse.json({ error: "Feriado / día bloqueado" }, { status: 400 });
    if (isOffDayLocal(localDateKey, businessTz, offDays)) return NextResponse.json({ error: "Día no laborable" }, { status: 400 });

    const localStartHM = parseInt(startLocal.slice(11,13),10) * 60 + parseInt(startLocal.slice(14,16),10);
    if (localStartHM < openHour*60 || localStartHM + service.durationMin > closeHour*60) {
      return NextResponse.json({ error: "Fuera de horario" }, { status: 400 });
    }

    // Antisolapado (UTC)
    const q = await adminDb.collection("reservations")
      .where("start", "<", Timestamp.fromDate(endUtc))
      .where("end", ">", Timestamp.fromDate(new Date(startUtc)))
      .get();
    if (!q.empty) return NextResponse.json({ error: "Slot no disponible" }, { status: 400 });

    // Crear reserva
    const ref = await adminDb.collection("reservations").add({
      userId,
      customer,
      serviceId,
      serviceName: service.name,
      start: Timestamp.fromDate(new Date(startUtc)),
      end: Timestamp.fromDate(endUtc),
      tz: businessTz,
      status: "pending",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ id: ref.id }, { status: 200 });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
