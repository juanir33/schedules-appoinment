'use client'

import Protected from "@/src/components/Protected";
import { useAuth } from "@/src/context/auth/AuthContext.context";
import { generateSlots } from "@/src/helpers/availability";
import { createReservationApi, listMyReservations } from "@/src/lib/firestore";
import { listServices } from "@/src/lib/firestore/services/services";
import { reservationSchema } from "@/src/lib/validations/validation";
import { Service } from "@/src/types/models.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

type FormData = z.infer<typeof reservationSchema>;

export default function Reservas() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [dayISO, setDayISO] = useState(startOfDay(new Date()).toISOString());
  const [reservas, setReservas] = useState<any[]>([]);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(reservationSchema),
  });

  useEffect(() => {
    listServices(true).then(setServices);
  }, []);

  useEffect(() => {
    if (user) listMyReservations(user.uid).then(setReservas);
  }, [user]);

  const selectedService = useMemo(
    () => services.find(s => s.id === watch("servicioId")),
    [services, watch]
  );

  const slots = useMemo(() => {
    const bloqueos = reservas.map(r => ({ inicioISO: r.inicioISO, finISO: r.finISO }));
    const dur = selectedService?.durationMin ?? 60;
    return generateSlots(dayISO, 9, 18, dur, bloqueos, 15);
  }, [reservas, selectedService, dayISO]);

  const onSubmit = async (data: FormData) => {
    await createReservationApi({
      cliente: data.client,
      servicioId: data.serviceId,
      inicioISO: data.startISO,
    });
    if (user) setReservas(await listMyReservations(user.uid));
    alert("Reserva creada");
  };

  return (
    <Protected>
      <h1>Reservar turno</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Tu nombre" {...register("client")} />
        <select {...register("serviceId")} defaultValue="">
          <option value="" disabled>Seleccioná un servicio</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.durationMin}min</option>)}
        </select>

        <input type="date"
          onChange={e => setDayISO(new Date(e.target.value).toISOString())}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {slots.map(s => (
            <button type="button" key={s.inicioISO}
              onClick={() => setValue("startISO", s.inicioISO)}>
              {new Date(s.inicioISO).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>

        <input type="hidden" {...register("startISO")} />
        <button type="submit" disabled={!watch("startISO") || !watch("serviceId")}>Confirmar</button>

        <div>
          {errors.client && <p>{errors.client.message}</p>}
          {errors.serviceId && <p>{errors.serviceId.message}</p>}
          {errors.startISO && <p>{errors.startISO.message}</p>}
        </div>
      </form>
    </Protected>
  );
}
