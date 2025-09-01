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