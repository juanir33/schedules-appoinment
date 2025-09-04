'use client'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { 
  createOrUpdateBusinessSettings, 
  getBusinessSettings
} from "@/src/lib/firestore/businessSettings/businessSettings";
import AdminProtected from "@/src/components/AdminProtected";
import { 
  Settings, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Clock, 
  Calendar, 
  Bell, 
  Save,
  CheckCircle,
  AlertCircle,
  Link,
  Unlink
} from "lucide-react";

interface FormData {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  timezone: string;
  businessHours: {
    monday: { enabled: boolean; openTime: string; closeTime: string; };
    tuesday: { enabled: boolean; openTime: string; closeTime: string; };
    wednesday: { enabled: boolean; openTime: string; closeTime: string; };
    thursday: { enabled: boolean; openTime: string; closeTime: string; };
    friday: { enabled: boolean; openTime: string; closeTime: string; };
    saturday: { enabled: boolean; openTime: string; closeTime: string; };
    sunday: { enabled: boolean; openTime: string; closeTime: string; };
  };
  reservationSettings: {
    maxAdvanceDays: number;
    minAdvanceHours: number;
    allowCancellation: boolean;
    cancellationHours: number;
    requireConfirmation: boolean;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderHours: number;
  };
  active: boolean;
}

type BusinessHourKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const BUSINESS_ID = "default";

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

const TIMEZONES = [
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
];

export default function ConfiguracionesAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      description: "",
      phone: "",
      website: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Argentina"
      },
      timezone: "America/Buenos_Aires",
      businessHours: {
        monday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
        tuesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
        wednesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
        thursday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
        friday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
        saturday: { enabled: true, openTime: "09:00", closeTime: "15:00" },
        sunday: { enabled: false, openTime: "09:00", closeTime: "15:00" }
      },
      reservationSettings: {
        maxAdvanceDays: 30,
        minAdvanceHours: 2,
        allowCancellation: true,
        cancellationHours: 24,
        requireConfirmation: false
      },
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        reminderHours: 24
      },
      active: true
    }
  });

  useEffect(() => {
    loadBusinessSettings();
  }, []);

  const loadBusinessSettings = async () => {
    try {
      setLoading(true);
      const settings = await getBusinessSettings(BUSINESS_ID);
      
      if (settings) {
        reset({
          name: settings.name,
          description: settings.description || "",
          email: settings.email,
          phone: settings.phone || "",
          website: settings.website || "",
          address: settings.address,
          timezone: settings.timezone,
          businessHours: {
            monday: settings.businessHours.monday || { enabled: true, openTime: "09:00", closeTime: "18:00" },
            tuesday: settings.businessHours.tuesday || { enabled: true, openTime: "09:00", closeTime: "18:00" },
            wednesday: settings.businessHours.wednesday || { enabled: true, openTime: "09:00", closeTime: "18:00" },
            thursday: settings.businessHours.thursday || { enabled: true, openTime: "09:00", closeTime: "18:00" },
            friday: settings.businessHours.friday || { enabled: true, openTime: "09:00", closeTime: "18:00" },
            saturday: settings.businessHours.saturday || { enabled: true, openTime: "09:00", closeTime: "15:00" },
            sunday: settings.businessHours.sunday || { enabled: false, openTime: "09:00", closeTime: "15:00" }
          },
          reservationSettings: settings.reservationSettings,
          notificationSettings: settings.notificationSettings,
          active: settings.active
        });
        
        // Verificar si Google Calendar está conectado
        setGoogleCalendarConnected(
          settings.calendarIntegration?.provider === 'google' && 
          settings.calendarIntegration?.enabled === true
        );
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
      setMessage({ type: 'error', text: 'Error al cargar las configuraciones' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await createOrUpdateBusinessSettings(BUSINESS_ID, data);
      setMessage({ type: 'success', text: 'Configuraciones guardadas exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving business settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar las configuraciones' });
    } finally {
      setSaving(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      setConnectingGoogle(true);
      // Redirigir al endpoint de autorización de Google
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setMessage({ type: 'error', text: 'Error al conectar con Google Calendar' });
      setConnectingGoogle(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      setConnectingGoogle(true);
      // Actualizar configuración del negocio para remover la integración
      const currentSettings = await getBusinessSettings(BUSINESS_ID);
      if (currentSettings) {
        await createOrUpdateBusinessSettings(BUSINESS_ID, {
          ...currentSettings,
          calendarIntegration: null
        });
        setGoogleCalendarConnected(false);
        setMessage({ type: 'success', text: 'Google Calendar desconectado exitosamente' });
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      setMessage({ type: 'error', text: 'Error al desconectar Google Calendar' });
    } finally {
      setConnectingGoogle(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'horarios', label: 'Horarios', icon: Clock },
    { id: 'reservas', label: 'Reservas', icon: Calendar },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'calendario', label: 'Google Calendar', icon: Link }
  ];

  if (loading) {
    return (
      <AdminProtected>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuraciones...</p>
          </div>
        </div>
      </AdminProtected>
    );
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-6">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Configuraciones del Negocio</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Personaliza todos los aspectos de tu negocio desde un solo lugar
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* Tab: General */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building2 className="w-4 h-4 inline mr-2" />
                          Nombre del Negocio *
                        </label>
                        <input
                          {...register('name', { required: true })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Mi Salón de Belleza"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email del Negocio *
                        </label>
                        <input
                          {...register('email', { required: true })}
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="contacto@misalon.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Teléfono
                        </label>
                        <input
                          {...register('phone')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="+54 358 45678"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Globe className="w-4 h-4 inline mr-2" />
                          Sitio Web
                        </label>
                        <input
                          {...register('website')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="https://www.misalon.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Describe tu negocio..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona Horaria *
                      </label>
                      <select
                        {...register('timezone', { required: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Dirección
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <input
                            {...register('address.street', { required: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Calle y número"
                          />
                        </div>
                        <div>
                          <input
                            {...register('address.city', { required: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Ciudad"
                          />
                        </div>
                        <div>
                          <input
                            {...register('address.state', { required: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Provincia"
                          />
                        </div>
                        <div>
                          <input
                            {...register('address.zipCode', { required: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Código Postal"
                          />
                        </div>
                        <div>
                          <input
                            {...register('address.country', { required: true })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Google Calendar */}
                {activeTab === 'calendario' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Integración con Google Calendar</h3>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">¿Qué es la integración con Google Calendar?</h4>
                          <p className="text-sm text-blue-700">
                            Conecta tu cuenta de Google Calendar para sincronizar automáticamente las reservas confirmadas como eventos en tu calendario personal.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Estado de la conexión</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {googleCalendarConnected 
                              ? 'Tu cuenta de Google Calendar está conectada y sincronizada.'
                              : 'No hay ninguna cuenta de Google Calendar conectada.'
                            }
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          googleCalendarConnected 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {googleCalendarConnected ? (
                            <>
                              <Link className="w-4 h-4" />
                              Conectado
                            </>
                          ) : (
                            <>
                              <Unlink className="w-4 h-4" />
                              Desconectado
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {googleCalendarConnected ? (
                          <button
                            type="button"
                            onClick={disconnectGoogleCalendar}
                            disabled={connectingGoogle}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {connectingGoogle ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Desconectando...
                              </>
                            ) : (
                              <>
                                <Unlink className="w-4 h-4" />
                                Desconectar Google Calendar
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={connectGoogleCalendar}
                            disabled={connectingGoogle}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {connectingGoogle ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Conectando...
                              </>
                            ) : (
                              <>
                                <Link className="w-4 h-4" />
                                Conectar Google Calendar
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {googleCalendarConnected && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Sincronización activa</h4>
                            <p className="text-sm text-green-700">
                              Las nuevas reservas confirmadas se crearán automáticamente como eventos en tu Google Calendar.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Horarios */}
                {activeTab === 'horarios' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios de Atención</h3>
                    
                    <div className="space-y-4">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-24">
                            <label className="flex items-center gap-2">
                              <input
                                {...register(`businessHours.${day.key as BusinessHourKey}.enabled`)}
                                type="checkbox"
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="font-medium text-gray-700">{day.label}</span>
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              {...register(`businessHours.${day.key as BusinessHourKey}.openTime`)}
                              type="time"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              disabled={!watch(`businessHours.${day.key as BusinessHourKey}.enabled`)}
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              {...register(`businessHours.${day.key as BusinessHourKey}.closeTime`)}
                              type="time"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              disabled={!watch(`businessHours.${day.key as BusinessHourKey}.enabled`)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Reservas */}
                {activeTab === 'reservas' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Reservas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Máximo días de anticipación
                        </label>
                        <input
                          {...register('reservationSettings.maxAdvanceDays', { valueAsNumber: true })}
                          type="number"
                          min="1"
                          max="365"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mínimo horas de anticipación
                        </label>
                        <input
                          {...register('reservationSettings.minAdvanceHours', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          max="168"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas para cancelar
                        </label>
                        <input
                          {...register('reservationSettings.cancellationHours', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          max="168"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          disabled={!watch('reservationSettings.allowCancellation')}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          {...register('reservationSettings.allowCancellation')}
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-medium text-gray-700">Permitir cancelaciones</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          {...register('reservationSettings.requireConfirmation')}
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-medium text-gray-700">Requerir confirmación manual</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Tab: Notificaciones */}
                {activeTab === 'notificaciones' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Notificaciones</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          {...register('notificationSettings.emailNotifications')}
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-medium text-gray-700">Notificaciones por email</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          {...register('notificationSettings.smsNotifications')}
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-medium text-gray-700">Notificaciones por SMS</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas antes para recordatorio
                      </label>
                      <input
                        {...register('notificationSettings.reminderHours', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="168"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Configuraciones
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtected>
  );
}