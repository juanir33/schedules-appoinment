import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";
import { google } from "googleapis";
import { Timestamp } from "firebase-admin/firestore";

function toISO(d: Date | string) {
  return (typeof d === "string" ? new Date(d) : d).toISOString();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No auth token" });

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { cliente, servicioId, inicioISO } = req.body as {
      cliente: string; servicioId: string; inicioISO: string;
    };
    if (!cliente || !servicioId || !inicioISO) return res.status(400).json({ error: "Missing fields" });

    // Cargar servicio para obtener duración y nombre
    const serviceSnap = await adminDb.collection("services").doc(servicioId).get();
    if (!serviceSnap.exists) return res.status(400).json({ error: "Servicio no existe" });
    const serviceData = serviceSnap.data() as { nombre: string; duracionMin: number; activo: boolean };
    if (!serviceData.activo) return res.status(400).json({ error: "Servicio inactivo" });

    const inicio = new Date(inicioISO);
    const fin = addMinutes(inicio, serviceData.duracionMin);

    const reservationsCol = adminDb.collection("reservations");

    // Transacción: evitar solapados
    let createdId = "";
    await adminDb.runTransaction(async (tx) => {
      const overlapQuery = await tx.get(
        reservationsCol
          .where("inicio", "<", Timestamp.fromDate(fin))
          .where("fin", ">", Timestamp.fromDate(inicio))
      );

      if (!overlapQuery.empty) {
        throw new Error("Slot no disponible");
      }

      const ref = reservationsCol.doc();
      tx.set(ref, {
        userId,
        cliente,
        servicioId,
        servicioNombre: serviceData.nombre,
        inicio: Timestamp.fromDate(inicio),
        fin: Timestamp.fromDate(fin),
        estado: "pendiente",
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
        summary: `${serviceData.nombre} - ${cliente}`,
        start: { dateTime: toISO(inicio) },
        end: { dateTime: toISO(fin) },
      },
    });

    // Guardar eventId en la reserva
    await reservationsCol.doc(createdId).update({ googleEventId: event.data.id, estado: "confirmada" });

    res.status(200).json({ id: createdId, googleEventId: event.data.id });
  } catch (err: any) {
    // Si falló Calendar, podrías revertir la reserva o marcar estado
    console.error(err);
    res.status(400).json({ error: err.message || "Error creando reserva" });
  }
}
