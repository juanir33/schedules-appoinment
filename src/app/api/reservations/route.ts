import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { createEmailCalendarService } from "@/src/lib/services/emailCalendarService";
import { createCalendarService } from "@/src/lib/services/calendarService";
import { getBusinessSettings } from "@/src/lib/firestore/businessSettings/businessSettings";

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

    // Crear evento en Google Calendar si está configurado
    let googleEventId: string | undefined;
    try {
      const calendarService = await createCalendarService('default');
      if (calendarService) {
        const businessSettings = await getBusinessSettings('default');
        const location = businessSettings?.address ? 
          `${businessSettings.address.street}, ${businessSettings.address.city}` : undefined;
        
        const calendarEvent = await calendarService.createEvent({
          summary: `${serviceData.name} - ${customer}`,
          description: `Reserva confirmada\n\nCliente: ${customer}\nServicio: ${serviceData.name}\nDuración: ${serviceData.durationMin} minutos${customerEmail ? `\nEmail: ${customerEmail}` : ''}`,
          startDateTime: toISO(start),
          endDateTime: toISO(end),
          attendees: customerEmail ? [customerEmail] : []
        });
        
        if (calendarEvent) {
          googleEventId = calendarEvent.id;
          console.log('📅 Google Calendar event created:', calendarEvent.id);
        }
      }
    } catch (calendarError) {
      console.error('Error creating Google Calendar event:', calendarError);
      // No fallar la reserva si el calendario falla
    }
    
    // Fallback: Enviar invitación por email si no se pudo crear en Google Calendar
    if (!googleEventId && customerEmail) {
      try {
        const emailCalendarService = await createEmailCalendarService('default');
        if (emailCalendarService) {
          const businessInfo = emailCalendarService.getBusinessInfo();
          await emailCalendarService.createCalendarInvite({
            summary: `Cita: ${serviceData.name}`,
            description: `Reserva confirmada para ${customer}\n\nServicio: ${serviceData.name}\nDuración: ${serviceData.durationMin} minutos`,
            startDateTime: toISO(start),
            endDateTime: toISO(end),
            location: businessInfo?.address ? `${businessInfo.address.street}, ${businessInfo.address.city}` : undefined,
            customerEmail,
            customerName: customer
          });
          console.log('📅 Email calendar invitation sent to:', customerEmail);
        }
      } catch (emailError) {
        console.error('Error sending email calendar invitation:', emailError);
      }
    }

    // Actualizar la reserva como confirmada e incluir googleEventId si existe
    const updateData: { status: string; googleEventId?: string } = { status: "confirmed" };
    if (googleEventId) {
      updateData.googleEventId = googleEventId;
    }
    await reservationsCol.doc(createdId).update(updateData);

    return NextResponse.json({ id: createdId }, { status: 200 });
  } catch (err: unknown) {
    // Si falló Calendar, podrías revertir la reserva o marcar estado
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "Error creando reserva";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
