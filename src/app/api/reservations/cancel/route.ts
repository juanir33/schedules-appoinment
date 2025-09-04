import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { getBusinessSettings } from "@/src/lib/firestore/businessSettings/businessSettings";
import { ReservationStatus } from "@/src/lib/firestore/enums/reservation.enum";
import { Timestamp } from "firebase-admin/firestore";
import { createCalendarService } from "@/src/lib/services/calendarService";

const BUSINESS_ID = "default";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Obtener datos del request
    const { reservationId, reason, cancelledBy = 'customer' } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: "ID de reserva requerido" }, { status: 400 });
    }

    // Obtener configuración del negocio
    const businessSettings = await getBusinessSettings(BUSINESS_ID);
    if (!businessSettings) {
      return NextResponse.json({ error: "Configuración del negocio no encontrada" }, { status: 500 });
    }

    // Verificar si las cancelaciones están permitidas
    if (!businessSettings.reservationSettings.allowCancellation) {
      return NextResponse.json({ error: "Las cancelaciones no están permitidas" }, { status: 403 });
    }

    // Obtener la reserva
    const reservationRef = adminDb.collection("reservations").doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const reservationData = reservationDoc.data()!;

    // Verificar que la reserva pertenece al usuario (excepto si es admin)
    if (cancelledBy === 'customer' && reservationData.userId !== userId) {
      return NextResponse.json({ error: "No autorizado para cancelar esta reserva" }, { status: 403 });
    }

    // Verificar que la reserva no esté ya cancelada
    if (reservationData.status === ReservationStatus.CANCELLED) {
      return NextResponse.json({ error: "La reserva ya está cancelada" }, { status: 400 });
    }

    // Verificar tiempo límite para cancelación (solo para clientes)
    if (cancelledBy === 'customer') {
      const reservationStart = reservationData.start.toDate();
      const now = new Date();
      const hoursUntilReservation = (reservationStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilReservation < businessSettings.reservationSettings.cancellationHours) {
        return NextResponse.json({ 
          error: `No se puede cancelar. Debe hacerlo al menos ${businessSettings.reservationSettings.cancellationHours} horas antes de la cita` 
        }, { status: 400 });
      }
    }

    // Actualizar la reserva
    const updateData = {
      status: ReservationStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || 'Sin razón especificada',
      cancelledBy: cancelledBy
    };

    await reservationRef.update(updateData);

    // Eliminar evento de Google Calendar si existe
    if (reservationData.googleEventId) {
      console.log('🔍 Attempting to delete Google Calendar event:', reservationData.googleEventId);
      try {
        const calendarService = await createCalendarService(BUSINESS_ID);
        console.log('📋 Calendar service created:', !!calendarService);
        if (calendarService) {
          const deleted = await calendarService.deleteEvent(reservationData.googleEventId);
          if (deleted) {
            console.log('✅ Google Calendar event deleted successfully:', reservationData.googleEventId);
          } else {
            console.warn('⚠️ Failed to delete Google Calendar event:', reservationData.googleEventId);
          }
        } else {
          console.warn('⚠️ Calendar service not available');
        }
      } catch (calendarError) {
        console.error('❌ Error deleting Google Calendar event:', calendarError);
        // No fallar la cancelación si el calendario falla
      }
    } else {
      console.log('ℹ️ No Google Calendar event ID found for this reservation');
    }

    // TODO: Enviar notificación por email de cancelación

    return NextResponse.json({ 
      message: "Reserva cancelada exitosamente",
      reservationId,
      cancelledAt: updateData.cancelledAt
    }, { status: 200 });

  } catch (error) {
    console.error('Error cancelando reserva:', error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}