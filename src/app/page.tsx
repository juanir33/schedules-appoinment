import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Salón de Uñas</h1>
      <p className="mb-6">Reservá tu turno online. Rápido y sencillo.</p>
      <div className="flex gap-3">
        <Link href="/reservas" className="bg-blue-600 text-white px-4 py-2 rounded">Reservar</Link>
        <Link href="/login" className="border px-4 py-2 rounded">Ingresar</Link>
      </div>
    </div>
  );
}
