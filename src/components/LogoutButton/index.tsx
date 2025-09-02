"use client";

import { useAuth } from "@/src/context/auth/AuthContext.context";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button
      onClick={() => logout()}
      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 ease-in-out border border-gray-200 hover:border-red-200"
    >
      <LogOut className="w-4 h-4" />
      <span>Cerrar sesión</span>
    </button>
  );
}
