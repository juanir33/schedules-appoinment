import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { google } from "googleapis";
import { Timestamp } from "firebase-admin/firestore";

function toISO(d: Date | string) {
  return (typeof d === "string" ? new Date(d) : d).toISOString();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const body = await req.json();
    const { customer, serviceId, startISO } = body as {
      customer: string; serviceId: string; startISO: string;
    };
    if (!customer || !serviceId || !startISO) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Cargar servicio para obtener duración y nombre
    const serviceSnap = await adminDb.collection("services").doc(serviceId).get();
    if (!serviceSnap.exists) return NextResponse.json({ error: "Servicio no existe" }, { status: 400 });
    const serviceData = serviceSnap.data() as { name: string; durationMin: number; active: boolean };
    if (!serviceData.active) return NextResponse.json({ error: "Servicio inactivo" }, { status: 400 });

    const start = new Date(startISO);
    const end = addMinutes(start, serviceData.durationMin);

    const reservationsCol = adminDb.collection("reservations");

    // Transacción: evitar solapados
    let createdId = "";
    await adminDb.runTransaction(async (tx) => {
      const overlapQuery = await tx.get(
        reservationsCol
          .where("start", "<", Timestamp.fromDate(end))
          .where("end", ">", Timestamp.fromDate(start))
      );

      if (!overlapQuery.empty) {
        throw new Error("Slot no disponible");
      }

      const ref = reservationsCol.doc();
      tx.set(ref, {
        userId,
        customer,
        serviceId,
        serviceName: serviceData.name,
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
        status: "pending",
        createdAt: Timestamp.now(),
      });
      createdId = ref.id;
    });

    // Crear evento en Google Calendar (cuenta del negocio)
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN! });
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      requestBody: {
        summary: `${serviceData.name} - ${customer}`,
        start: { dateTime: toISO(start) },
        end: { dateTime: toISO(end) },
      },
    });

    // Guardar eventId en la reserva
    await reservationsCol.doc(createdId).update({ googleEventId: event.data.id, status: "confirmed" });

    return NextResponse.json({ id: createdId, googleEventId: event.data.id }, { status: 200 });
  } catch (err: unknown) {
    // Si falló Calendar, podrías revertir la reserva o marcar estado
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "Error creando reserva";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
