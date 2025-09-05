import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { ReservationStatus } from "@/src/lib/firestore/enums/reservation.enum";

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

    // Verificar que el usuario es admin
    const userRecord = await adminAuth.getUser(userId);
    const isAdmin = userRecord.customClaims?.admin === true;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Solo los administradores pueden completar reservas" }, { status: 403 });
    }

    // Obtener datos del request
    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: "ID de reserva requerido" }, { status: 400 });
    }

    // Obtener la reserva
    const reservationRef = adminDb.collection("reservations").doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const reservationData = reservationDoc.data()!;

    // Verificar que la reserva no esté ya completada o cancelada
    if (reservationData.status === ReservationStatus.COMPLETED) {
      return NextResponse.json({ error: "La reserva ya está completada" }, { status: 400 });
    }

    if (reservationData.status === ReservationStatus.CANCELLED) {
      return NextResponse.json({ error: "No se puede completar una reserva cancelada" }, { status: 400 });
    }

    // Actualizar la reserva
    const updateData = {
      status: ReservationStatus.COMPLETED,
      completedAt: new Date().toISOString(),
      completedBy: userId
    };

    await reservationRef.update(updateData);

    return NextResponse.json({ 
      message: "Reserva completada exitosamente",
      reservationId,
      completedAt: updateData.completedAt
    }, { status: 200 });

  } catch (error) {
    console.error('Error completando reserva:', error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}