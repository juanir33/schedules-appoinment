import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { createEmailCalendarService } from "@/src/lib/services/emailCalendarService";

function toISO(d: Date | string) {
  return (typeof d === "string" ? new Date(d) : d).toISOString();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// GET: Obtener todas las reservas (solo para admin)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    
    // Verificar que el usuario tenga permisos de admin
    if (!decoded.admin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const reservationsCol = adminDb.collection("reservations");
    const snapshot = await reservationsCol.orderBy("createdAt", "desc").get();
    
    const reservations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        start: data.start?.toDate?.()?.toISOString() || data.start,
        end: data.end?.toDate?.()?.toISOString() || data.end,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (err: unknown) {
    console.error("Error obteniendo reservas:", err);
    const errorMessage = err instanceof Error ? err.message : "Error obteniendo reservas";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const body = await req.json();
    const { customer, serviceId, startISO, customerEmail } = body as {
      customer: string; serviceId: string; startISO: string; customerEmail?: string;
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

    // Enviar invitación de calendario si hay email del cliente
    if (customerEmail) {
      try {
        const calendarService = await createEmailCalendarService('default');
        if (calendarService) {
          const businessInfo = calendarService.getBusinessInfo();
          await calendarService.createCalendarInvite({
            summary: `Cita: ${serviceData.name}`,
            description: `Reserva confirmada para ${customer}\n\nServicio: ${serviceData.name}\nDuración: ${serviceData.durationMin} minutos`,
            startDateTime: toISO(start),
            endDateTime: toISO(end),
            location: businessInfo?.address ? `${businessInfo.address.street}, ${businessInfo.address.city}` : undefined,
            customerEmail,
            customerName: customer
          });
          console.log('📅 Calendar invitation sent to:', customerEmail);
        }
      } catch (calendarError) {
        console.error('Error sending calendar invitation:', calendarError);
        // No fallar la reserva si el calendario falla
      }
    }

    // Actualizar la reserva como confirmada
    await reservationsCol.doc(createdId).update({ status: "confirmed" });

    return NextResponse.json({ id: createdId }, { status: 200 });
  } catch (err: unknown) {
    // Si falló Calendar, podrías revertir la reserva o marcar estado
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "Error creando reserva";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
