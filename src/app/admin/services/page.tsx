'use client'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { serviceSchema } from "@/src/lib/validations/validation";
import { Service } from "@/src/types/models.type";
import { createService, listServices, updateService } from "@/src/lib/firestore/services/services";
import AdminProtected from "@/src/components/AdminProtected";
import { Settings, Plus, Clock, DollarSign, ToggleLeft, ToggleRight, CheckCircle, XCircle } from "lucide-react";

type FormData = z.infer<typeof serviceSchema>;

export default function ServiciosAdmin() {
  const [items, setItems] = useState<Service[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', price: 0, durationMin: 0, active: true }
  });

  useEffect(() => { listServices().then(setItems); }, []);

  const onSubmit = async (data: FormData) => {
    const created = await createService(data);
    setItems(prev => [created, ...prev]);
    reset({ active: true });
  };

  const toggleActivo = async (s: Service) => {
    await updateService(s.id, { active: !s.active });
    setItems(prev => prev.map(i => i.id === s.id ? { ...i, active: !i.active } : i));
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Gestión de Servicios</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Administra los servicios del salón, precios y duraciones de manera eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario para crear servicio */}
            <div className="card-elegant p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">Nuevo Servicio</h2>
                  <p className="text-gray-600">Agrega un nuevo servicio al catálogo</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nombre del servicio
                  </label>
                  <input
                    placeholder="Ej: Corte de cabello"
                    {...register("name")}
                    className="input-elegant"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Precio
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      {...register("price", { valueAsNumber: true })}
                      className="input-elegant"
                    />
                    {errors.price && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      {...register("durationMin", { valueAsNumber: true })}
                      className="input-elegant"
                    />
                    {errors.durationMin && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {errors.durationMin.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register("active")}
                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Servicio activo (disponible para reservas)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Crear Servicio
                </button>
              </form>
            </div>

            {/* Lista de servicios */}
            <div className="card-elegant p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">Servicios Existentes</h2>
                  <p className="text-gray-600">Gestiona y modifica los servicios actuales</p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay servicios creados aún</p>
                  </div>
                ) : (
                  items.map(s => (
                    <div key={s.id} className="bg-white/80 p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{s.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${s.price}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {s.durationMin} min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            s.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {s.active ? (
                              <><CheckCircle className="w-3 h-3" /> Activo</>
                            ) : (
                              <><XCircle className="w-3 h-3" /> Inactivo</>
                            )}
                          </span>
                          <button
                            onClick={() => toggleActivo(s)}
                            className={`p-2 rounded-lg transition-colors ${
                              s.active 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={s.active ? 'Desactivar servicio' : 'Activar servicio'}
                          >
                            {s.active ? (
                              <ToggleRight className="w-6 h-6" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                        </div>
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
