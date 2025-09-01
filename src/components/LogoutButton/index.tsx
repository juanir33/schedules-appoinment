"use client";

import { useAuth } from "@/src/context/auth/AuthContext.context";

export default function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button
      onClick={() => logout()}
      className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
    >
      Cerrar sesión
    </button>
  );
}
