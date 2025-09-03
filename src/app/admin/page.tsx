import Link from "next/link";
import AdminProtected from "@/src/components/AdminProtected";
import { Calendar, Settings, Ban, Users, Crown, ArrowRight, BarChart3, BookOpen, Cog } from "lucide-react";

export default function AdminHome() {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Panel Administrativo</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Gestiona tu salón de belleza desde un solo lugar. Controla reservas, servicios y configuraciones.
            </p>
          </div>

          {/* Admin Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Calendar Card */}
            <Link href="/admin/calendar" className="group">
              <div className="card-elegant p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Calendario</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">Ver y gestionar todas las reservas del salón</p>
                  <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                    <span className="text-sm font-medium">Acceder</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Services Card */}
            <Link href="/admin/services" className="group">
              <div className="card-elegant p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Servicios</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">Administrar servicios, precios y duraciones</p>
                  <div className="flex items-center text-green-600 group-hover:text-green-700 transition-colors">
                    <span className="text-sm font-medium">Gestionar</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Block Days Card */}
            <Link href="/admin/blockday" className="group">
              <div className="card-elegant p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-red-400 to-rose-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Ban className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Bloqueos</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">Configurar días y horarios no disponibles</p>
                  <div className="flex items-center text-red-600 group-hover:text-red-700 transition-colors">
                    <span className="text-sm font-medium">Configurar</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Users Card */}
            <Link href="/admin/users" className="group">
              <div className="card-elegant p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Usuarios</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">Gestionar permisos y roles de administrador</p>
                  <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors">
                    <span className="text-sm font-medium">Administrar</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Dashboard Card */}
            <Link href="/admin/dashboard" className="group">
              <div className="card-elegant p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Dashboard</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">Analytics y métricas del negocio</p>
                  <div className="flex items-center text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    <span className="text-sm font-medium">Ver métricas</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Reservations Card */}
            <Link href="/admin/reservations" className="group">
              <div className="card-elegant p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Reservas</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">Gestionar todas las reservas del salón</p>
                  <div className="flex items-center text-orange-600 group-hover:text-orange-700 transition-colors">
                    <span className="text-sm font-medium">Gestionar</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Settings Card */}
            <Link href="/admin/settings" className="group">
              <div className="card-elegant p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-gradient-to-r from-gray-400 to-slate-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Cog className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Configuración</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">Ajustes generales del sistema</p>
                  <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors">
                    <span className="text-sm font-medium">Configurar</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Stats or Additional Info */}
          <div className="mt-12 text-center">
            <div className="card-elegant p-6 max-w-2xl mx-auto">
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Centro de Control</h3>
              <p className="text-gray-600">
                Desde aquí puedes acceder a todas las herramientas necesarias para administrar tu salón de belleza de manera eficiente y profesional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
