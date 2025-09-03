"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/context/auth/AuthContext.context";
import { CalendarDays, DollarSign, Users, Clock, TrendingUp, TrendingDown } from "lucide-react";
import AdminProtected from "@/src/components/AdminProtected";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardMetrics {
  reservations: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
    byPeriod: Array<{ date: string; count: number }>;
  };
  revenue: {
    total: number;
    projected: number;
    real: number;
    byPeriod: Array<{ date: string; amount: number }>;
  };
  services: {
    mostPopular: Array<{ serviceId: string; serviceName: string; count: number; revenue: number }>;
  };
  timeSlots: {
    peakHours: Array<{ hour: number; count: number }>;
  };
  cancellations: {
    total: number;
    rate: number;
    byReason: Array<{ reason: string; count: number }>;
  };
}

function DashboardContent() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all metrics in parallel
      const [reservationsRes, revenueRes, servicesRes, timeSlotsRes, cancellationsRes] = await Promise.all([
        fetch(`/api/analytics/reservations?period=${period}`, { headers }),
        fetch(`/api/analytics/revenue?period=${period}`, { headers }),
        fetch(`/api/analytics/services?period=${period}`, { headers }),
        fetch(`/api/analytics/timeslots?period=${period}`, { headers }),
        fetch(`/api/analytics/cancellations?period=${period}`, { headers })
      ]);

      if (!reservationsRes.ok || !revenueRes.ok || !servicesRes.ok || !timeSlotsRes.ok || !cancellationsRes.ok) {
        throw new Error('Error al cargar las métricas');
      }

      const [reservations, revenue, services, timeSlots, cancellations] = await Promise.all([
        reservationsRes.json(),
        revenueRes.json(),
        servicesRes.json(),
        timeSlotsRes.json(),
        cancellationsRes.json()
      ]);

      setMetrics({
        reservations: reservations.data,
        revenue: revenue.data,
        services: services.data,
        timeSlots: timeSlots.data,
        cancellations: cancellations.data
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Error al cargar las métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta semana';
      case 'month': return 'Este mes';
      case 'last7days': return 'Últimos 7 días';
      case 'last30days': return 'Últimos 30 días';
      case 'last3months': return 'Últimos 3 meses';
      default: return 'Este mes';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Resumen de métricas y analytics del salón
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="day">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="last7days">Últimos 7 días</option>
            <option value="last30days">Últimos 30 días</option>
            <option value="last3months">Últimos 3 meses</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <>
          {/* Main KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Reservas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Reservas</h3>
                <CalendarDays className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.reservations?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {getPeriodLabel(period)}
              </p>
            </div>

            {/* Ingresos Reales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Ingresos Reales</h3>
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.revenue?.real || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Proyectado: {formatCurrency(metrics.revenue?.projected || 0)}
              </p>
            </div>

            {/* Reservas Confirmadas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Reservas Confirmadas</h3>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.reservations?.confirmed || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Pendientes: {metrics.reservations?.pending || 0}
              </p>
            </div>

            {/* Tasa de Cancelación */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Tasa de Cancelación</h3>
                <TrendingDown className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.cancellations?.rate?.toFixed(1) || '0.0'}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.cancellations?.total || 0} cancelaciones
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tendencia de Reservas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Tendencia de Reservas</h3>
                <p className="text-sm text-gray-600">
                  Evolución de reservas en {getPeriodLabel(period).toLowerCase()}
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.reservations?.byPeriod || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return period === 'day' ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) :
                               period === 'week' ? `S${Math.ceil(date.getDate() / 7)}` :
                               date.toLocaleDateString('es-ES', { month: 'short' });
                      }}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('es-ES');
                      }}
                      formatter={(value) => [value, 'Reservas']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tendencia de Ingresos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Tendencia de Ingresos</h3>
                <p className="text-sm text-gray-600">
                  Evolución de ingresos en {getPeriodLabel(period).toLowerCase()}
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.revenue?.byPeriod || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return period === 'day' ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) :
                               period === 'week' ? `S${Math.ceil(date.getDate() / 7)}` :
                               date.toLocaleDateString('es-ES', { month: 'short' });
                      }}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('es-ES');
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Ingresos']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Additional Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Servicios Populares */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Servicios Más Populares</h3>
                <p className="text-sm text-gray-600">
                  Servicios con mayor demanda en {getPeriodLabel(period).toLowerCase()}
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.services?.mostPopular?.slice(0, 5) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="serviceName" 
                      stroke="#6b7280"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip formatter={(value) => [value, 'Reservas']} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Horarios de Mayor Demanda */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Horarios de Mayor Demanda</h3>
                <p className="text-sm text-gray-600">
                  Horas con más reservas en {getPeriodLabel(period).toLowerCase()}
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.timeSlots?.peakHours?.slice(0, 8) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => `${value}:00 - ${value + 1}:00`}
                      formatter={(value) => [value, 'Reservas']}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Estado de Reservas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Reservas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Confirmadas</span>
                  <span className="text-sm font-bold text-green-600">{metrics.reservations?.confirmed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pendientes</span>
                  <span className="text-sm font-bold text-yellow-600">{metrics.reservations?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completadas</span>
                  <span className="text-sm font-bold text-blue-600">{metrics.reservations?.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Canceladas</span>
                  <span className="text-sm font-bold text-red-600">{metrics.reservations?.cancelled || 0}</span>
                </div>
              </div>
            </div>

            {/* Resumen de Ingresos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Ingresos</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Proyectado</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(metrics.revenue?.projected || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ingresos Reales</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(metrics.revenue?.real || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Diferencia</span>
                  <span className={`text-sm font-bold ${
                    (metrics.revenue?.real || 0) >= (metrics.revenue?.projected || 0) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency((metrics.revenue?.real || 0) - (metrics.revenue?.projected || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Métricas de Cancelación */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Cancelación</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Cancelaciones</span>
                  <span className="text-sm font-bold text-gray-900">{metrics.cancellations?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasa de Cancelación</span>
                  <span className="text-sm font-bold text-gray-900">{metrics.cancellations?.rate?.toFixed(1) || '0.0'}%</span>
                </div>
                {metrics.cancellations?.byReason?.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">Razón principal:</span>
                    <div className="text-sm font-medium text-gray-900">
                      {metrics.cancellations?.byReason?.[0]?.reason} ({metrics.cancellations?.byReason?.[0]?.count})
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AdminProtected>
      <DashboardContent />
    </AdminProtected>
  );
}