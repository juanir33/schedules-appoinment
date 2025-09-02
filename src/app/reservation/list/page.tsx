'use client'

import { useEffect, useState } from "react";
import Protected from "@/src/components/Protected";
import { useAuth } from "@/src/context/auth/AuthContext.context";
import { listMyReservations, cancelReservationApi } from "@/src/lib/firestore";
import { listServices } from "@/src/lib/firestore/services/services";
import { getBusinessSettings } from "@/src/lib/firestore/businessSettings/businessSettings";
import { Reservation, Service, BusinessSettings } from "@/src/types/models.type";
import { Calendar, Clock, User, Sparkles, CheckCircle, XCircle, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ReservationStatus } from "@/src/lib/firestore/enums/reservation.enum";
import toast from "react-hot-toast";
import { showConfirmToast } from "@/src/components/ConfirmToast/ConfirmToast";

export default function MisReservas() {
  const { user } = useAuth();
  console.log("🚀 ~ MisReservas ~ user:", user)
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const [reservasData, servicesData, businessData] = await Promise.all([
            listMyReservations(user.uid),
            listServices(),
            getBusinessSettings('default')
          ]);
          setReservas(reservasData);
          setServices(servicesData);
          setBusinessSettings(businessData);
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

  const canCancelReservation = (reserva: Reservation) => {
    // No se puede cancelar si ya está cancelada
    if (reserva.status === ReservationStatus.CANCELLED) {
      return { canCancel: false, reason: 'Ya está cancelada' };
    }

    // Verificar si las cancelaciones están permitidas
    if (!businessSettings?.reservationSettings.allowCancellation) {
      return { canCancel: false, reason: 'Las cancelaciones no están permitidas' };
    }

    // Verificar tiempo límite para cancelación
    const reservationStart = new Date(reserva.startISO);
    const now = new Date();
    const hoursUntilReservation = (reservationStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilReservation < (businessSettings?.reservationSettings.cancellationHours || 24)) {
      return { 
        canCancel: false, 
        reason: `Debe cancelar al menos ${businessSettings?.reservationSettings.cancellationHours || 24} horas antes` 
      };
    }

    return { canCancel: true, reason: '' };
  };

  const handleCancelReservation = async (reservationId: string) => {
    showConfirmToast({
      message: '¿Estás seguro de que quieres cancelar esta reserva?',
      confirmText: 'Sí, cancelar',
      cancelText: 'No, mantener',
      type: 'danger',
      onConfirm: () => {
        performCancellation(reservationId);
      },
      onCancel: () => {
        // No hacer nada, solo cerrar el toast
      }
    });
  };

  const performCancellation = async (reservationId: string) => {
    setCancellingId(reservationId);
    try {
      await cancelReservationApi(reservationId, 'Cancelada por el cliente');
      // Recargar las reservas
      if (user) {
        const updatedReservas = await listMyReservations(user.uid);
        setReservas(updatedReservas);
      }
      toast.success('Reserva cancelada exitosamente', {
        duration: 4000,
      });
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      toast.error(error instanceof Error ? error.message : 'Error cancelando la reserva', {
        duration: 5000,
      });
    } finally {
      setCancellingId(null);
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
                    
                    <div className="flex items-center justify-center md:justify-end gap-3">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(reserva.status)}`}>
                        {getStatusIcon(reserva.status)}
                        {getStatusText(reserva.status)}
                      </div>
                      
                      {(() => {
                        const cancelInfo = canCancelReservation(reserva);
                        if (cancelInfo.canCancel) {
                          return (
                            <button
                              onClick={() => handleCancelReservation(reserva.id)}
                              disabled={cancellingId === reserva.id}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancelar reserva"
                            >
                              {cancellingId === reserva.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              {cancellingId === reserva.id ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          );
                        } else if (reserva.status !== ReservationStatus.CANCELLED) {
                          return (
                            <div 
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed"
                              title={cancelInfo.reason}
                            >
                              <Trash2 className="w-4 h-4" />
                              No se puede cancelar
                            </div>
                          );
                        }
                        return null;
                      })()} 
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
