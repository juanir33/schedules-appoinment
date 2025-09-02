'use client'

import Protected from "@/src/components/Protected";
import { useAuth } from "@/src/context/auth/AuthContext.context";
import { generateSlotsZoned } from "@/src/helpers/availability";
import { createReservationApi, listMyReservations } from "@/src/lib/firestore";
import { listServices } from "@/src/lib/firestore/services/services";
import { reservationSchema } from "@/src/lib/validations/validation";
import { Service, Reservation } from "@/src/types/models.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import Link from "next/link";
import { Calendar, Clock, User, Sparkles, CheckCircle, XCircle, List } from "lucide-react";

type FormData = z.infer<typeof reservationSchema>;

export default function Reservas() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [dayISO, setDayISO] = useState(startOfDay(new Date()).toISOString());
  const [reservas, setReservas] = useState<Reservation[]>([]);
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
    () => services.find(s => s.id === watch("serviceId")),
    [services, watch]
  );

  const slots = useMemo(() => {
    const bloqueos = reservas.map(r => ({ inicioUtc: new Date(r.startISO), finUtc: new Date(r.endISO) }));
    const dur = selectedService?.durationMin ?? 60;
    const localDateKey = dayISO.split('T')[0];
    return generateSlotsZoned({
      localDateKey,
      tz: 'America/Argentina/Buenos_Aires',
      openHour: 9,
      closeHour: 18,
      durMin: dur,
      stepMin: 15,
      blocksUtc: bloqueos
    });
  }, [reservas, selectedService, dayISO]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitType, setSubmitType] = useState<'success' | 'error'>('success');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      await createReservationApi({
        cliente: data.client,
        servicioId: data.serviceId,
        inicioISO: data.startISO,
      });
      if (user) setReservas(await listMyReservations(user.uid));
      setSubmitMessage('¡Reserva creada exitosamente!');
      setSubmitType('success');
      // Reset form
      setValue('client', '');
      setValue('serviceId', '');
      setValue('startISO', '');
    } catch (error) {
      setSubmitMessage('Error al crear la reserva. Intenta nuevamente.');
      setSubmitType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Protected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Reservar Turno</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              Selecciona tu servicio favorito y elige el horario que mejor se adapte a ti
            </p>
            <Link href="/reservation/list" className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors gap-2 font-medium">
              <List className="w-5 h-5" />
              Ver mis reservas
            </Link>
          </div>

          {/* Reservation Form */}
          <div className="card-elegant p-8 mb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <User className="w-4 h-4 inline mr-2" />
                  Tu nombre completo
                </label>
                <input
                  placeholder="Ingresa tu nombre completo"
                  {...register("client")}
                  className="input-elegant"
                />
                {errors.client && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {errors.client.message}
                  </p>
                )}
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Selecciona tu servicio
                </label>
                <select {...register("serviceId")} defaultValue="" className="input-elegant">
                  <option value="" disabled>Elige el servicio que deseas</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.durationMin} minutos — ${s.price}
                    </option>
                  ))}
                </select>
                {errors.serviceId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {errors.serviceId.message}
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Selecciona la fecha
                </label>
                <input
                  type="date"
                  onChange={e => setDayISO(new Date(e.target.value).toISOString())}
                  className="input-elegant"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Slots */}
              {selectedService && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Horarios disponibles
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {slots.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay horarios disponibles para esta fecha</p>
                        <p className="text-sm">Intenta seleccionar otra fecha</p>
                      </div>
                    ) : (
                      slots.map(s => {
                        const isSelected = watch("startISO") === s.inicioUtcISO;
                        return (
                          <button
                            type="button"
                            key={s.inicioUtcISO}
                            onClick={() => setValue("startISO", s.inicioUtcISO)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 font-medium ${
                              isSelected
                                ? 'border-amber-500 bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-lg'
                                : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md text-gray-700'
                            }`}
                          >
                            {s.inicioLocal.split('T')[1].substring(0, 5)}
                          </button>
                        );
                      })
                    )}
                  </div>
                  {errors.startISO && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {errors.startISO.message}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={!watch("startISO") || !watch("serviceId") || isSubmitting}
                  className="w-full btn-primary bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg py-4"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Reserva
                    </>
                  )}
                </button>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  submitType === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {submitType === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">{submitMessage}</span>
                </div>
              )}
            </form>
          </div>

          {/* Service Info */}
          {selectedService && (
            <div className="card-elegant p-6 bg-gradient-to-r from-amber-50 to-rose-50">
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                Resumen del servicio seleccionado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Servicio:</span>
                  <span>{selectedService.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Duración:</span>
                  <span>{selectedService.durationMin} minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">$</span>
                  <span className="font-medium">Precio:</span>
                  <span className="font-bold text-amber-600">${selectedService.price}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}
