"use client";
import Protected from "@components/Protected";
import LogoutButton from "@components/LogoutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Crown, Home, Calendar, Ban, Settings, Users, ArrowLeft, Menu, X, Cog, BookOpen, BarChart3 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <Protected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {/* Navbar elegante */}
        <header className="bg-white/80 backdrop-filter backdrop-blur-lg border-b border-amber-200/50 shadow-soft sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo y título */}
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-shrink">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-400 to-rose-400 rounded-lg flex-shrink-0">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-shrink">
                    <h1 className="font-display text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">Panel Admin</h1>
                    <p className="text-xs text-gray-600 hidden sm:block truncate">Gestión del salón</p>
                  </div>
                </div>
              </div>

              {/* Navegación principal - Desktop */}
              <nav className="hidden xl:flex items-center space-x-0.5 gap-1">
                <Link href="/admin" className={`nav-link mx-1 group ${isActive('/admin') ? 'nav-link-active' : ''}`}>
                  <Home className="w-4 h-4 text-amber-600 group-hover:text-amber-700" />
                  <span className="text-sm">Inicio</span>
                </Link>
                <Link href="/admin/dashboard" className={`nav-link group ${isActive('/admin/dashboard') ? 'nav-link-active' : ''}`}>
                  <BarChart3 className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700" />
                  <span className="text-sm">Dashboard</span>
                </Link>
                <Link href="/admin/calendar" className={`nav-link group ${isActive('/admin/calendar') ? 'nav-link-active' : ''}`}>
                  <Calendar className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                  <span className="text-sm">Calendario</span>
                </Link>
                <Link href="/admin/reservations" className={`nav-link group ${isActive('/admin/reservations') ? 'nav-link-active' : ''}`}>
                  <BookOpen className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" />
                  <span className="text-sm">Reservas</span>
                </Link>
                <Link href="/admin/services" className={`nav-link group ${isActive('/admin/services') ? 'nav-link-active' : ''}`}>
                  <Settings className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                  <span className="text-sm">Servicios</span>
                </Link>
                <Link href="/admin/blockday" className={`nav-link group ${isActive('/admin/blockday') ? 'nav-link-active' : ''}`}>
                  <Ban className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                  <span className="text-sm">Bloqueos</span>
                </Link>
                <Link href="/admin/users" className={`nav-link group ${isActive('/admin/users') ? 'nav-link-active' : ''}`}>
                  <Users className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                  <span className="text-sm">Usuarios</span>
                </Link>
                <Link href="/admin/settings" className={`nav-link group ${isActive('/admin/settings') ? 'nav-link-active' : ''}`}>
                  <Cog className="w-4 h-4 text-gray-600 group-hover:text-gray-700" />
                  <span className="text-sm">Configuración</span>
                </Link>
              </nav>

              {/* Acciones de usuario - Desktop */}
              <div className="hidden xl:flex items-center space-x-2">
                <Link 
                  href="/" 
                  className="flex items-center space-x-1.5 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al sitio</span>
                </Link>
                <LogoutButton />
              </div>

              {/* Botón menú móvil */}
              <div className="xl:hidden flex items-center space-x-1 flex-shrink-0">
                <Link 
                  href="/" 
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Volver al sitio"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <button
                  onClick={toggleMobileMenu}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Menú móvil */}
            {isMobileMenuOpen && (
              <div className="xl:hidden border-t border-amber-200/50 bg-white/95 backdrop-blur-sm">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <Link 
                    href="/admin" 
                    className={`mobile-nav-link ${isActive('/admin') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="w-5 h-5 text-amber-600" />
                    <span>Inicio</span>
                  </Link>
                  <Link 
                    href="/admin/dashboard" 
                    className={`mobile-nav-link ${isActive('/admin/dashboard') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    href="/admin/calendar" 
                    className={`mobile-nav-link ${isActive('/admin/calendar') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Calendario</span>
                  </Link>
                  <Link 
                    href="/admin/reservations" 
                    className={`mobile-nav-link ${isActive('/admin/reservations') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span>Reservas</span>
                  </Link>
                  <Link 
                    href="/admin/services" 
                    className={`mobile-nav-link ${isActive('/admin/services') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5 text-green-600" />
                    <span>Servicios</span>
                  </Link>
                  <Link 
                    href="/admin/blockday" 
                    className={`mobile-nav-link ${isActive('/admin/blockday') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Ban className="w-5 h-5 text-red-600" />
                    <span>Bloqueos</span>
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className={`mobile-nav-link ${isActive('/admin/users') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Usuarios</span>
                  </Link>
                  <Link 
                    href="/admin/settings" 
                    className={`mobile-nav-link ${isActive('/admin/settings') ? 'mobile-nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Cog className="w-5 h-5 text-gray-600" />
                    <span>Configuración</span>
                  </Link>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="px-3">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </Protected>
  );
}
