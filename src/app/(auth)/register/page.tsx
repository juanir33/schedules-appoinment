"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/context/auth/AuthContext.context"

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(email, password);
      router.push("/admin");
    } catch (err: any) {
      setError(err?.message ?? "Error al registrarse");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="border p-3 rounded w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="border p-3 rounded w-full"
          type="password"
          placeholder="Contraseña (mín. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 text-white w-full py-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        ¿Ya tenés cuenta?{" "}
        <Link className="text-blue-700 underline" href="/login">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
