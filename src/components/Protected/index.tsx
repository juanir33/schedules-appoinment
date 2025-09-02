"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/auth/AuthContext.context";


export default function Protected({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();

   useEffect(() => {
     if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

   if (loading) return <div className="p-6">Cargando...</div>;
  if (!user) return null;

  return <>{children}</>;
}
