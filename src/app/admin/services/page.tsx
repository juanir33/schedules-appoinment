'use client'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";
import { serviceSchema } from "@/src/lib/validations/validation";
import { Service } from "@/src/types/models.type";
import { createService, listServices, updateService } from "@/src/lib/firestore/services/services";
import Protected from "@/src/components/Protected";

type FormData = z.infer<typeof serviceSchema>;

export default function ServiciosAdmin() {
  const [items, setItems] = useState<Service[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { active: true }
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
    <Protected>
      <h1>Servicios</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Nombre" {...register("name")} />
        <input type="number" placeholder="Precio" {...register("price", { valueAsNumber: true })} />
        <input type="number" placeholder="Duración (min)" {...register("durationMin", { valueAsNumber: true })} />
        <label>
          Activo <input type="checkbox" {...register("active")} />
        </label>
        <button type="submit">Crear</button>
        <div>
          {errors.name && <p>{errors.name.message}</p>}
          {errors.price && <p>{errors.price.message}</p>}
          {errors.durationMin && <p>{errors.durationMin.message}</p>}
        </div>
      </form>

      <ul>
        {items.map(s => (
          <li key={s.id}>
            {s.name} — {s.price} — {s.durationMin}min — {s.active ? "Activo" : "Inactivo"}
            <button onClick={() => toggleActivo(s)}>Alternar</button>
          </li>
        ))}
      </ul>
    </Protected>
  );
}
