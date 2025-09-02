import { Calendar, momentLocalizer } from "react-big-calendar";
import { parseISO } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Reservation } from "@/src/types/models.type";
import moment from "moment";

const localizer = momentLocalizer(moment);

type Props = {
  reservas: Reservation[];
};

export default function CalendarView({ reservas }: Props) {
  const events = reservas.map(r => ({
    title: `${r.serviceName} - ${r.customer}`,
    start: parseISO(r.startISO),
    end: parseISO(r.endISO),
  }));

  return (
    <div className="h-[600px] bg-white rounded shadow p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
      />
    </div>
  );
}
