import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2),
  price: z.number().nonnegative(),
  durationMin: z.number().int().min(5).max(8 * 60),
  active: z.boolean().default(true),
});

export const reservationSchema = z.object({
  client: z.string().min(2),
  serviceId: z.string().min(1),
  startISO: z.string().datetime(),
});
export const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  motivo: z.string().min(3),
});

export const closureSchema = z.object({
  startLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato YYYY-MM-DDTHH:mm"),
  endLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato YYYY-MM-DDTHH:mm"),
  motivo: z.string().min(3),
});

const businessHourSchema = z.object({
  enabled: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
});

const addressSchema = z.object({
  street: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "El estado es requerido"),
  zipCode: z.string().min(1, "El código postal es requerido"),
  country: z.string().min(1, "El país es requerido"),
});

const reservationSettingsSchema = z.object({
  maxAdvanceDays: z.number().int().min(1).max(365),
  minAdvanceHours: z.number().int().min(0).max(168),
  allowCancellation: z.boolean(),
  cancellationHours: z.number().int().min(0).max(168),
  requireConfirmation: z.boolean(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  reminderHours: z.number().int().min(0).max(168),
});

export const businessSettingsSchema = z.object({
  name: z.string().min(2, "El nombre del negocio es requerido"),
  description: z.string().optional(),
  email: z.string().email("Email válido requerido"),
  phone: z.string().optional(),
  website: z.string().url("URL válida requerida").optional().or(z.literal("")),
  address: addressSchema,
  timezone: z.string().min(1, "La zona horaria es requerida"),
  businessHours: z.object({
    monday: businessHourSchema,
    tuesday: businessHourSchema,
    wednesday: businessHourSchema,
    thursday: businessHourSchema,
    friday: businessHourSchema,
    saturday: businessHourSchema,
    sunday: businessHourSchema,
  }),
  reservationSettings: reservationSettingsSchema,
  notificationSettings: notificationSettingsSchema,
  active: z.boolean().default(true),
});

// Schema parcial para actualizaciones
export const businessSettingsUpdateSchema = businessSettingsSchema.partial();