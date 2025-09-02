'use client'

import { useAuth } from "@/src/context/auth/AuthContext.context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminProtectedProps {
  children: React.ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Si no está autenticado, redirigir a login
        router.push("/login");
        return;
      }
      
      if (!isAdmin) {
        // Si no es admin, redirigir a página principal
        router.push("/");
        return;
      }
    }
  }, [user, loading, isAdmin, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado o no es admin, no mostrar contenido
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Acceso denegado</div>
      </div>
    );
  }

  // Si es admin autenticado, mostrar el contenido
  return <>{children}</>;
}