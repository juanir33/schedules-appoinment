import { Calendar, momentLocalizer, View } from "react-big-calendar";
import { parseISO } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Reservation } from "@/src/types/models.type";
import moment from "moment";
import "moment/locale/es";
import { useState, useMemo } from "react";
import { Filter, Eye, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

type Props = {
  reservas: Reservation[];
};

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: Reservation;
};

export default function CalendarView({ reservas }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Reservation | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Filtrar reservas por estado
  const filteredReservas = useMemo(() => {
    if (selectedStatus === 'all') return reservas;
    return reservas.filter(r => r.status === selectedStatus);
  }, [reservas, selectedStatus]);

  // Convertir reservas a eventos del calendario
  const events: CalendarEvent[] = useMemo(() => {
    return filteredReservas.map(r => ({
      title: `${r.serviceName} - ${r.customer}`,
      start: parseISO(r.startISO),
      end: parseISO(r.endISO),
      resource: r,
    }));
  }, [filteredReservas]);

  // Obtener estados únicos
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(reservas.map(r => r.status).filter(Boolean))];
    return statuses;
  }, [reservas]);

  // Personalizar el estilo de los eventos según el estado
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3174ad';
    
    switch (status) {
      case 'confirmed':
        backgroundColor = '#10b981'; // Verde
        break;
      case 'pending':
        backgroundColor = '#f59e0b'; // Amarillo
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // Rojo
        break;
      case 'completed':
        backgroundColor = '#6366f1'; // Índigo
        break;
      default:
        backgroundColor = '#6b7280'; // Gris
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Manejar clic en evento
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event.resource);
  };

  // Funciones de navegación
  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const goToToday = () => {
    setDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(date);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      default:
        newDate.setMonth(newDate.getMonth() - 1);
    }
    setDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(date);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      default:
        newDate.setMonth(newDate.getMonth() + 1);
    }
    setDate(newDate);
  };

  // Formatear título de la fecha actual
  const getDateTitle = () => {
    switch (view) {
      case 'month':
        return moment(date).format('MMMM YYYY');
      case 'week':
        const startWeek = moment(date).startOf('week');
        const endWeek = moment(date).endOf('week');
        return `${startWeek.format('DD MMM')} - ${endWeek.format('DD MMM YYYY')}`;
      case 'day':
        return moment(date).format('dddd, DD [de] MMMM [de] YYYY');
      default:
        return moment(date).format('MMMM YYYY');
    }
  };

  // Mensajes en español para el calendario
  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango',
    showMore: (total: number) => `+ Ver más (${total})`
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de navegación y filtros */}
      <div className="space-y-4">
        {/* Navegación del calendario */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Botones de navegación */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-200"
              >
                Hoy
              </button>
              
              <button
                onClick={goToNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Siguiente"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Título de fecha */}
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {getDateTitle()}
            </h2>
          </div>

          {/* Selector de vista */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as View[]).map((viewOption) => (
                <button
                  key={viewOption}
                  onClick={() => setView(viewOption)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === viewOption
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewOption === 'month' ? 'Mes' : viewOption === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">Todas las reservas</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{filteredReservas.length} reservas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Confirmada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Cancelada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-indigo-500 rounded"></div>
          <span>Completada</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
        <div className="h-[500px] sm:h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            messages={messages}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={setView}
            date={date}
            onNavigate={handleNavigate}
            popup
            showMultiDayTimes
            step={30}
            timeslots={2}
            toolbar={false}
          />
        </div>
      </div>

      {/* Modal de detalles del evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalles de la Reserva</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Cliente</label>
                <p className="text-gray-900">{selectedEvent.customer}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Servicio</label>
                <p className="text-gray-900">{selectedEvent.serviceName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha y Hora</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="w-4 h-4" />
                  <span>{moment(selectedEvent.startISO).format('DD/MM/YYYY HH:mm')}</span>
                  <span>-</span>
                  <span>{moment(selectedEvent.endISO).format('HH:mm')}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.status)}`}>
                  {getStatusLabel(selectedEvent.status)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
