'use client'

import { useEffect, useState } from "react";
import Protected from "@/src/components/Protected";
import { useAuth } from "@/src/context/auth/AuthContext.context";
import { listMyReservations } from "@/src/lib/firestore";
import { listServices } from "@/src/lib/firestore/services/services";
import { Reservation, Service } from "@/src/types/models.type";
import { Calendar, Clock, User, Sparkles, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ReservationStatus } from "@/src/lib/firestore/enums/reservation.enum";

export default function MisReservas() {
  const { user } = useAuth();
  console.log("🚀 ~ MisReservas ~ user:", user)
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const [reservasData, servicesData] = await Promise.all([
            listMyReservations(user.uid),
            listServices()
          ]);
          setReservas(reservasData);
          setServices(servicesData);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [user]);

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Servicio no encontrado';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm", { locale: es });
    } catch {
      return 'Hora inválida';
    }
  };

  const getStatusColor = (status?: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'text-green-600 bg-green-50 border-green-200';
      case ReservationStatus.CANCELLED:
        return 'text-red-600 bg-red-50 border-red-200';
      case ReservationStatus.PENDING:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusText = (status?: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return "Confirmada";
      case ReservationStatus.CANCELLED:
        return "Cancelada";
      case ReservationStatus.PENDING:
        return "Pendiente";
      default:
        return "Programada";
    }
  };

  const getStatusIcon = (status?: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return <CheckCircle className="w-4 h-4" />;
      case ReservationStatus.CANCELLED:
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Protected>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tus reservas...</p>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to Reservation */}
          <Link href="/reservation" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver a Reservar
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mb-6">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Mis Reservas</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Aquí puedes ver todas tus reservas programadas y su estado actual
            </p>
          </div>

          {/* Reservations List */}
          {reservas.length === 0 ? (
            <div className="card-elegant p-12 text-center">
              <div className="inline-flex p-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mb-6">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">No tienes reservas</h3>
              <p className="text-gray-600 mb-8">¡Es hora de reservar tu próximo turno de belleza!</p>
              <Link href="/reservation" className="btn-primary bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 inline-flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Reservar Ahora
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reservas.map((reserva) => (
                <div key={reserva.id} className="card-elegant p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-bold text-gray-900">
                            {getServiceName(reserva.serviceId)}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{reserva.customer}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-700">
                          <Calendar className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="font-medium">Fecha</p>
                            <p className="text-sm capitalize">{formatDate(reserva.startISO)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-gray-700">
                          <Clock className="w-5 h-5 text-rose-600" />
                          <div>
                            <p className="font-medium">Horario</p>
                            <p className="text-sm">
                              {formatTime(reserva.startISO)} - {formatTime(reserva.endISO)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center md:justify-end">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(reserva.status)}`}>
                        {getStatusIcon(reserva.status)}
                        {getStatusText(reserva.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          {reservas.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/reservation" className="btn-primary bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 inline-flex items-center gap-2 text-lg px-8 py-4">
                <Sparkles className="w-5 h-5" />
                Reservar Otro Turno
              </Link>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}
