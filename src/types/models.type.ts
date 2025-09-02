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
  customerEmail?: string;
  // Campos de cancelación
  cancelledAt?: string; // ISO timestamp
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'admin';
};

export interface CalendarSettings {
  id: string;
  businessId: string; // ID del negocio/cliente
  provider: 'google' | 'outlook' | 'none';
  enabled: boolean;
  config: GoogleCalendarConfig | OutlookCalendarConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  redirectUri?: string;
}

export interface OutlookCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  tenantId: string;
}

export interface BusinessSettings {
  id: string;
  // Información básica del negocio
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  
  // Dirección
  address: Address;
  
  // Configuración de tiempo
  timezone: string;
  
  // Horarios de atención
  businessHours: {
    [key: string]: { // 'monday', 'tuesday', etc.
      enabled: boolean;
      openTime: string; // 'HH:mm'
      closeTime: string; // 'HH:mm'
    }
  };
  
  // Configuraciones de reservas
  reservationSettings: {
    maxAdvanceDays: number; // Máximo días de anticipación para reservar
    minAdvanceHours: number; // Mínimo horas de anticipación
    allowCancellation: boolean;
    cancellationHours: number; // Horas antes para cancelar
    requireConfirmation: boolean;
  };
  
  // Configuraciones de notificaciones
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderHours: number; // Horas antes para recordatorio
  };
  
  // Integración de calendario
  calendarIntegration?: CalendarSettings | null;
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}