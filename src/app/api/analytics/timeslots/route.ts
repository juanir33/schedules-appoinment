import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/src/lib/firebase/firebaseAdmin";
import { getTimeSlotMetrics, AnalyticsDateRange } from "@/src/lib/firestore/analytics/analytics";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verificar que sea admin
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    let dateRange: AnalyticsDateRange;

    if (customStart && customEnd) {
      // Rango personalizado
      dateRange = {
        startDate: startOfDay(new Date(customStart)),
        endDate: endOfDay(new Date(customEnd))
      };
    } else {
      // Rangos predefinidos
      const now = new Date();
      switch (period) {
        case 'day':
          dateRange = {
            startDate: startOfDay(now),
            endDate: endOfDay(now)
          };
          break;
        case 'week':
          dateRange = {
            startDate: startOfWeek(now, { weekStartsOn: 1 }),
            endDate: endOfWeek(now, { weekStartsOn: 1 })
          };
          break;
        case 'month':
          dateRange = {
            startDate: startOfMonth(now),
            endDate: endOfMonth(now)
          };
          break;
        case 'last7days':
          dateRange = {
            startDate: startOfDay(subDays(now, 6)),
            endDate: endOfDay(now)
          };
          break;
        case 'last30days':
          dateRange = {
            startDate: startOfDay(subDays(now, 29)),
            endDate: endOfDay(now)
          };
          break;
        case 'last3months':
          dateRange = {
            startDate: startOfDay(subMonths(now, 3)),
            endDate: endOfDay(now)
          };
          break;
        default:
          dateRange = {
            startDate: startOfMonth(now),
            endDate: endOfMonth(now)
          };
      }
    }

    // Obtener métricas
    const metrics = await getTimeSlotMetrics(dateRange);

    return NextResponse.json({
      success: true,
      data: metrics,
      period,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error al obtener métricas de horarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}