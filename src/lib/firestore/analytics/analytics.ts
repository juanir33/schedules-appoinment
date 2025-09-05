import { adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { ReservationStatus } from "../enums/reservation.enum";

export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReservationMetrics {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  byDay: { date: string; count: number }[];
  byWeek: { week: string; count: number }[];
  byMonth: { month: string; count: number }[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  projectedRevenue: number;
  averageTicket: number;
  byDay: { date: string; revenue: number }[];
  byWeek: { week: string; revenue: number }[];
  byMonth: { month: string; revenue: number }[];
}

export interface ServiceMetrics {
  mostPopular: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }[];
  leastPopular: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }[];
  byService: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }[];
}

export interface TimeSlotMetrics {
  busyHours: { hour: number; count: number }[];
  busyDays: { dayOfWeek: number; dayName: string; count: number }[];
}

export interface CancellationMetrics {
  totalCancellations: number;
  cancellationRate: number;
  reasonBreakdown: { reason: string; count: number }[];
  byCustomer: number;
  byAdmin: number;
}

interface ReservationData {
  id: string;
  userId: string;
  customer: string;
  serviceId: string;
  serviceName: string;
  start: Timestamp;
  end: Timestamp;
  status: ReservationStatus;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: "customer" | "admin";
}

interface ServiceData {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  active: boolean;
}

/**
 * Obtener métricas de reservas en un rango de fechas
 */
export async function getReservationMetrics(
  dateRange: AnalyticsDateRange
): Promise<ReservationMetrics> {
  const reservationsRef = adminDb.collection("reservations");

  const query = reservationsRef
    .where("start", ">=", Timestamp.fromDate(dateRange.startDate))
    .where("start", "<=", Timestamp.fromDate(dateRange.endDate))
    .orderBy("start", "asc");

  const snapshot = await query.get();
  const reservations: ReservationData[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as ReservationData)
  );

  // Contar por estado
  const statusCounts = {
    total: reservations.length,
    confirmed: reservations.filter(
      (r) => r.status === ReservationStatus.CONFIRMED
    ).length,
    pending: reservations.filter((r) => r.status === ReservationStatus.PENDING)
      .length,
    cancelled: reservations.filter(
      (r) => r.status === ReservationStatus.CANCELLED
    ).length,
    completed: reservations.filter(
      (r) => r.status === ReservationStatus.COMPLETED
    ).length,
  };

  // Agrupar por día
  const byDay = groupReservationsByPeriod(reservations, "day");

  // Agrupar por semana
  const byWeek = groupReservationsByPeriod(reservations, "week");

  // Agrupar por mes
  const byMonth = groupReservationsByPeriod(reservations, "month");

  return {
    ...statusCounts,
    byDay,
    byWeek,
    byMonth,
  };
}

/**
 * Obtener métricas de ingresos en un rango de fechas
 */
export async function getRevenueMetrics(
  dateRange: AnalyticsDateRange
): Promise<RevenueMetrics> {
  const reservationsRef = adminDb.collection("reservations");
  const servicesRef = adminDb.collection("services");

  // Obtener servicios para calcular precios
  const servicesSnapshot = await servicesRef.get();
  const services = new Map<string, ServiceData>();
  servicesSnapshot.docs.forEach((doc) => {
    services.set(doc.id, { id: doc.id, ...doc.data() } as ServiceData);
  });

  const query = reservationsRef
    .where("start", ">=", Timestamp.fromDate(dateRange.startDate))
    .where("start", "<=", Timestamp.fromDate(dateRange.endDate))
    .orderBy("start", "asc");

  const snapshot = await query.get();
  const reservations: ReservationData[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as ReservationData)
  );

  // Calcular ingresos
  let totalRevenue = 0;
  let projectedRevenue = 0;
  const revenueData = reservations.map((reservation) => {
    const service = services.get(reservation.serviceId);
    const price = service?.price || 0;

    if (reservation.status === ReservationStatus.COMPLETED) {
      totalRevenue += price;
    }

    if (
      [
        ReservationStatus.CONFIRMED,
        ReservationStatus.PENDING,
        ReservationStatus.COMPLETED,
      ].includes(reservation.status)
    ) {
      projectedRevenue += price;
    }

    return {
      ...reservation,
      price,
      date: reservation.start.toDate(),
    };
  });

  const completedReservations = revenueData.filter(
    (r) => r.status === ReservationStatus.COMPLETED
  );
  const averageTicket =
    completedReservations.length > 0
      ? totalRevenue / completedReservations.length
      : 0;

  // Agrupar ingresos por período
  const byDay = groupRevenueByPeriod(revenueData, "day");
  const byWeek = groupRevenueByPeriod(revenueData, "week");
  const byMonth = groupRevenueByPeriod(revenueData, "month");

  return {
    totalRevenue,
    projectedRevenue,
    averageTicket,
    byDay,
    byWeek,
    byMonth,
  };
}

/**
 * Obtener métricas de servicios más populares
 */
export async function getServiceMetrics(
  dateRange: AnalyticsDateRange
): Promise<ServiceMetrics> {
  const reservationsRef = adminDb.collection("reservations");
  const servicesRef = adminDb.collection("services");

  // Obtener servicios
  const servicesSnapshot = await servicesRef.get();
  const services = new Map<string, ServiceData>();
  servicesSnapshot.docs.forEach((doc) => {
    services.set(doc.id, { id: doc.id, ...doc.data() } as ServiceData);
  });

  const query = reservationsRef
    .where("start", ">=", Timestamp.fromDate(dateRange.startDate))
    .where("start", "<=", Timestamp.fromDate(dateRange.endDate));

  const snapshot = await query.get();
  const reservations: ReservationData[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as ReservationData)
  );

  // Agrupar por servicio
  const serviceStats = new Map<
    string,
    { serviceId: string; serviceName: string; count: number; revenue: number }
  >();

  reservations.forEach((reservation) => {
    const service = services.get(reservation.serviceId);
    if (!service) return;

    const key = reservation.serviceId;
    if (!serviceStats.has(key)) {
      serviceStats.set(key, {
        serviceId: key,
        serviceName: service.name,
        count: 0,
        revenue: 0,
      });
    }

    const stats = serviceStats.get(key)!;
    stats.count++;

    if (reservation.status === ReservationStatus.COMPLETED) {
      stats.revenue += service.price || 0;
    }
  });

  const byService = Array.from(serviceStats.values());
  const mostPopular = [...byService]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const leastPopular = [...byService]
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  return {
    mostPopular,
    leastPopular,
    byService,
  };
}

/**
 * Obtener métricas de horarios más demandados
 */
export async function getTimeSlotMetrics(
  dateRange: AnalyticsDateRange
): Promise<TimeSlotMetrics> {
  const reservationsRef = adminDb.collection("reservations");

  const query = reservationsRef
    .where("start", ">=", Timestamp.fromDate(dateRange.startDate))
    .where("start", "<=", Timestamp.fromDate(dateRange.endDate));

  const snapshot = await query.get();
  const reservations: ReservationData[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as ReservationData)
  );

  // Agrupar por hora
  const hourStats = new Map<number, number>();
  const dayStats = new Map<number, number>();

  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  reservations.forEach((reservation) => {
    const date = reservation.start.toDate();
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Contar por hora
    hourStats.set(hour, (hourStats.get(hour) || 0) + 1);

    // Contar por día de la semana
    dayStats.set(dayOfWeek, (dayStats.get(dayOfWeek) || 0) + 1);
  });

  const busyHours = Array.from(hourStats.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);

  const busyDays = Array.from(dayStats.entries())
    .map(([dayOfWeek, count]) => ({
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    busyHours,
    busyDays,
  };
}

/**
 * Obtener métricas de cancelaciones
 */
export async function getCancellationMetrics(
  dateRange: AnalyticsDateRange
): Promise<CancellationMetrics> {
  const reservationsRef = adminDb.collection("reservations");

  const query = reservationsRef
    .where("start", ">=", Timestamp.fromDate(dateRange.startDate))
    .where("start", "<=", Timestamp.fromDate(dateRange.endDate));

  const snapshot = await query.get();
  const reservations: ReservationData[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as ReservationData)
  );

  const totalReservations = reservations.length;
  const cancelledReservations = reservations.filter(
    (r) => r.status === ReservationStatus.CANCELLED
  );
  const totalCancellations = cancelledReservations.length;
  const cancellationRate =
    totalReservations > 0 ? (totalCancellations / totalReservations) * 100 : 0;

  // Agrupar por razón de cancelación
  const reasonStats = new Map<string, number>();
  let byCustomer = 0;
  let byAdmin = 0;

  cancelledReservations.forEach((reservation) => {
    const reason = reservation.cancellationReason || "Sin especificar";
    reasonStats.set(reason, (reasonStats.get(reason) || 0) + 1);

    if (reservation.cancelledBy === "customer") {
      byCustomer++;
    } else if (reservation.cancelledBy === "admin") {
      byAdmin++;
    }
  });

  const reasonBreakdown = Array.from(reasonStats.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCancellations,
    cancellationRate,
    reasonBreakdown,
    byCustomer,
    byAdmin,
  };
}

/**
 * Función auxiliar para agrupar reservas por período
 */
function groupReservationsByPeriod(
  reservations: ReservationData[],
  period: "day"
): { date: string; count: number }[];
function groupReservationsByPeriod(
  reservations: ReservationData[],
  period: "week"
): { week: string; count: number }[];
function groupReservationsByPeriod(
  reservations: ReservationData[],
  period: "month"
): { month: string; count: number }[];
function groupReservationsByPeriod(
  reservations: ReservationData[],
  period: "day" | "week" | "month"
):
  | { date: string; count: number }[]
  | { week: string; count: number }[]
  | { month: string; count: number }[] {
  const groups = new Map<string, number>();

  reservations.forEach((reservation) => {
    const date = reservation.start.toDate();
    let key: string;

    switch (period) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    groups.set(key, (groups.get(key) || 0) + 1);
  });

  return Array.from(groups.entries())
    .map(([dateKey, count]) => {
      const result: Record<string, string | number> = { count };
      if (period === "day") result.date = dateKey;
      else if (period === "week") result.week = dateKey;
      else result.month = dateKey;
      return result;
    })
    .sort((a, b) => {
      const aKey =
        period === "day"
          ? (a.date as string)
          : period === "week"
          ? (a.week as string)
          : (a.month as string);
      const bKey =
        period === "day"
          ? (b.date as string)
          : period === "week"
          ? (b.week as string)
          : (b.month as string);
      return aKey.localeCompare(bKey);
    }) as
    | { date: string; count: number }[]
    | { week: string; count: number }[]
    | { month: string; count: number }[];
}

/**
 * Función auxiliar para agrupar ingresos por período
 */
function groupRevenueByPeriod(
  revenueData: (ReservationData & { price: number; date: Date })[],
  period: "day"
): { date: string; revenue: number }[];
function groupRevenueByPeriod(
  revenueData: (ReservationData & { price: number; date: Date })[],
  period: "week"
): { week: string; revenue: number }[];
function groupRevenueByPeriod(
  revenueData: (ReservationData & { price: number; date: Date })[],
  period: "month"
): { month: string; revenue: number }[];
function groupRevenueByPeriod(
  revenueData: (ReservationData & { price: number; date: Date })[],
  period: "day" | "week" | "month"
):
  | { date: string; revenue: number }[]
  | { week: string; revenue: number }[]
  | { month: string; revenue: number }[] {
  const groups = new Map<string, number>();

  revenueData.forEach((item) => {
    if (item.status !== ReservationStatus.COMPLETED) return;

    const date = item.date;
    let key: string;

    switch (period) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    groups.set(key, (groups.get(key) || 0) + item.price);
  });

  return Array.from(groups.entries())
    .map(([dateKey, revenue]) => {
      const result: Record<string, string | number> = { revenue };
      if (period === "day") result.date = dateKey;
      else if (period === "week") result.week = dateKey;
      else result.month = dateKey;
      return result;
    })
    .sort((a, b) => {
      const aKey =
        period === "day"
          ? (a.date as string)
          : period === "week"
          ? (a.week as string)
          : (a.month as string);
      const bKey =
        period === "day"
          ? (b.date as string)
          : period === "week"
          ? (b.week as string)
          : (b.month as string);
      return aKey.localeCompare(bKey);
    }) as
    | { date: string; revenue: number }[]
    | { week: string; revenue: number }[]
    | { month: string; revenue: number }[];
}
