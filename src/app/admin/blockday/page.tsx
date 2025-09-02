'use client'

import AdminProtected from "@/src/components/AdminProtected";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { holidaySchema, closureSchema } from "@/src/lib/validations/validation";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  createHoliday, listHolidays, deleteHoliday,
  createClosure, listClosures, deleteClosure,
  Holiday, Closure
} from "@/src/lib/adminBlocks";
import { Ban, Calendar, Clock, Plus, Trash2, CalendarX, XCircle } from "lucide-react";

export default function BloqueosAdmin() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);

  const {
    register: regHoliday, handleSubmit: submitHoliday, reset: resetHoliday,
    formState: { errors: errHoliday }
  } = useForm({ resolver: zodResolver(holidaySchema) });

  const {
    register: regClosure, handleSubmit: submitClosure, reset: resetClosure,
    formState: { errors: errClosure }
  } = useForm({ resolver: zodResolver(closureSchema) });

  useEffect(() => {
    listHolidays().then(setHolidays);
    listClosures().then(setClosures);
  }, []);

  const addHoliday = async (data: z.infer<typeof holidaySchema>) => {
    await createHoliday(data);
    setHolidays(await listHolidays());
    resetHoliday();
  };

  const addClosure = async (data: z.infer<typeof closureSchema>) => {
    await createClosure(data);
    setClosures(await listClosures());
    resetClosure();
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-red-400 to-rose-500 rounded-full mb-6">
              <Ban className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Gestión de Bloqueos</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Configura días festivos y horarios de cierre para el salón de belleza
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feriados */}
            <div className="card-elegant p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">Feriados</h2>
                  <p className="text-gray-600">Días festivos donde el salón permanece cerrado</p>
                </div>
              </div>

              <form onSubmit={submitHoliday(addHoliday)} className="space-y-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Fecha del feriado
                  </label>
                  <input
                    type="date"
                    {...regHoliday("date")}
                    className="input-elegant"
                  />
                  {errHoliday.date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {errHoliday.date.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Motivo del feriado
                  </label>
                  <input
                    placeholder="Ej: Día de la Independencia"
                    {...regHoliday("motivo")}
                    className="input-elegant"
                  />
                  {errHoliday.motivo && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {errHoliday.motivo.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Feriado
                </button>
              </form>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {holidays.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay feriados configurados</p>
                  </div>
                ) : (
                  holidays.map(h => (
                    <div key={h.id} className="bg-white/80 p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{h.motivo}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(h.date).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteHoliday(h.id).then(() => listHolidays().then(setHolidays))}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar feriado"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cierres por rango */}
            <div className="card-elegant p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">Cierres Temporales</h2>
                  <p className="text-gray-600">Bloqueos de horarios específicos</p>
                </div>
              </div>

              <form onSubmit={submitClosure(addClosure)} className="space-y-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Fecha y hora de inicio
                    </label>
                    <input
                      type="datetime-local"
                      {...regClosure("startLocal")}
                      className="input-elegant"
                    />
                    {errClosure.startLocal && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {errClosure.startLocal.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Fecha y hora de fin
                    </label>
                    <input
                      type="datetime-local"
                      {...regClosure("endLocal")}
                      className="input-elegant"
                    />
                    {errClosure.endLocal && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {errClosure.endLocal.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Motivo del cierre
                  </label>
                  <input
                    placeholder="Ej: Mantenimiento del local"
                    {...regClosure("motivo")}
                    className="input-elegant"
                  />
                  {errClosure.motivo && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {errClosure.motivo.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Cierre
                </button>
              </form>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {closures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay cierres temporales configurados</p>
                  </div>
                ) : (
                  closures.map(c => (
                    <div key={c.id} className="bg-white/80 p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{c.motivo}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Desde: {new Date(c.startLocal).toLocaleString('es-ES')}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Hasta: {new Date(c.endLocal).toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteClosure(c.id).then(() => listClosures().then(setClosures))}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar cierre"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
