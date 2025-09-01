import { ReservationStatus } from "../lib/firestore/enums/reservation.enum";

export interface Service  {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  active: boolean;
};

export interface Reservation  {
  id: string;
  userId: string;
  customer: string;
  serviceId: string;
  serviceName: string;
  startISO: string; // ISO
  endISO: string;   // ISO
  status: ReservationStatus;
  googleEventId?: string;
};
