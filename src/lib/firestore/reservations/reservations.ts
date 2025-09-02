
import { collection, addDoc, Timestamp, query, getDocs, where } from "firebase/firestore";
import {auth, db} from '@lib/firebase/firebase'
import { CreateReservation } from "../types/createReservation.type";
import { ReservationStatus } from "../enums/reservation.enum";
import { getIdToken } from "firebase/auth";

interface ReservationData {
  userId: string;
  customer: string;
  serviceId: string;
  serviceName: string;
  start: Timestamp;
  end: Timestamp;
  tz: string;
  status: string;
  createdAt: Timestamp;
}

export const createReservation = async (
  {client, service, reservationDate} : CreateReservation
) => {
  await addDoc(collection(db, "reservations"), {
    client,
    service,
    reservationDate: Timestamp.fromDate(reservationDate),
    status: ReservationStatus.PENDING,
  });
};

export async function createReservationApi(body: { customer: string; serviceId: string; startISO: string; customerEmail?: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error("No auth");
  const token = await getIdToken(user, true);
  const res = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error");
  return res.json();
}

export async function listMyReservations(userId: string) {
  const q = query(collection(db, "reservations"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data() as ReservationData;
    return {
      id: d.id,
      userId: data.userId,
      customer: data.customer,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      startISO: (data.start as Timestamp).toDate().toISOString(),
      endISO: (data.end as Timestamp).toDate().toISOString(),
      status: data.status as ReservationStatus,
      googleEventId: undefined,
    };
  });
}
