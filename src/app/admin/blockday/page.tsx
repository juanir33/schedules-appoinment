import Protected from "../../components/Protected";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { holidaySchema, closureSchema } from "../../lib/validation";
import { useEffect, useState } from "react";
import {
  createHoliday, listHolidays, deleteHoliday,
  createClosure, listClosures, deleteClosure
} from "../../lib/adminBlocks";

export default function BloqueosAdmin() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);

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

  const addHoliday = async (data: any) => {
    await createHoliday(data);
    setHolidays(await listHolidays());
    resetHoliday();
  };

  const addClosure = async (data: any) => {
    await createClosure(data);
    setClosures(await listClosures());
    resetClosure();
  };

  return (
    <Protected>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Bloqueos del salón</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Feriados</h2>
          <form onSubmit={submitHoliday(addHoliday)} className="mb-4">
            <input type="date" {...regHoliday("date")} className="border p-2 rounded mr-2" />
            <input placeholder="Motivo" {...regHoliday("motivo")} className="border p-2 rounded mr-2" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Agregar</button>
            {errHoliday.date && <p className="text-red-500">{errHoliday.date.message}</p>}
            {errHoliday.motivo && <p className="text-red-500">{errHoliday.motivo.message}</p>}
          </form>
          <ul>
            {holidays.map(h => (
              <li key={h.id} className="mb-2">
                {h.date} — {h.motivo}
                <button onClick={() => deleteHoliday(h.id).then(() => listHolidays().then(setHolidays))}
                  className="ml-2 text-red-600">Eliminar</button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Cierres por rango</h2>
          <form onSubmit={submitClosure(addClosure)} className="mb-4">
            <input type="datetime-local" {...regClosure("startLocal")} className="border p-2 rounded mr-2" />
            <input type="datetime-local" {...regClosure("endLocal")} className="border p-2 rounded mr-2" />
            <input placeholder="Motivo" {...regClosure("motivo")} className="border p-2 rounded mr-2" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Agregar</button>
            {errClosure.startLocal && <p className="text-red-500">{errClosure.startLocal.message}</p>}
            {errClosure.endLocal && <p className="text-red-500">{errClosure.endLocal.message}</p>}
            {errClosure.motivo && <p className="text-red-500">{errClosure.motivo.message}</p>}
          </form>
          <ul>
            {closures.map(c => (
              <li key={c.id} className="mb-2">
                {c.startLocal} → {c.endLocal} — {c.motivo}
                <button onClick={() => deleteClosure(c.id).then(() => listClosures().then(setClosures))}
                  className="ml-2 text-red-600">Eliminar</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Protected>
  );
}
