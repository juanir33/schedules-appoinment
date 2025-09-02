import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { createCalendarService } from "@/src/lib/services/calendarService";

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

    // Integración con calendario (parametrizable por negocio)
    // Por ahora usamos un businessId por defecto, pero esto debería venir del contexto del usuario
    const businessId = "default"; // TODO: Obtener del contexto del usuario/negocio
    
    const calendarService = await createCalendarService(businessId);
    let googleEventId: string | undefined;
    
    if (calendarService) {
      const calendarEvent = await calendarService.createEvent({
        summary: `${serviceData.name} - ${customer}`,
        description: `Reserva de ${serviceData.name} para ${customer}`,
        startDateTime: toISO(start),
        endDateTime: toISO(end),
      });
      
      googleEventId = calendarEvent?.id;
    }

    // Actualizar la reserva con el eventId si se creó
    const updateData: { status: string; googleEventId?: string } = { status: "confirmed" };
    if (googleEventId) {
      updateData.googleEventId = googleEventId;
    }
    
    await reservationsCol.doc(createdId).update(updateData);

    return NextResponse.json({ id: createdId, googleEventId }, { status: 200 });
  } catch (err: unknown) {
    // Si falló Calendar, podrías revertir la reserva o marcar estado
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "Error creando reserva";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
