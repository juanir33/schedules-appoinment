import Link from "next/link";

export default function AdminHome() {
  return (
    <section>
       <h1>Dashboard</h1>
        <ul>
          <li><Link href="/reservas">Reservas</Link></li>
          <li><Link href="/admin/servicios">Servicios</Link></li>
        </ul>
    </section>
  );
}
