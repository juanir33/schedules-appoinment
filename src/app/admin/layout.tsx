import Protected from "@components/Protected";
import LogoutButton from "@components/LogoutButton";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="p-4 max-w-6xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Panel Administrativo</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin">Inicio</Link>
            <Link href="/admin/calendario">Calendario</Link>
            <Link href="/admin/bloqueos">Bloqueos</Link>
            <LogoutButton />
          </nav>
        </header>
        {children}
      </div>
    </Protected>
  );
}
