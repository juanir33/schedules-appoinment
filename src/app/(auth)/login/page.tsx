"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/context/auth/AuthContext.context";

export default function LoginPage() {
  const { login, reset } = useAuth();
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
      await login(email, password);
      router.push("/admin"); // o /reservas si preferís
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email) return setError("Ingresá tu email para recuperar la contraseña");
    setError("");
    try {
      await reset(email);
      alert("Te enviamos un email para restablecer tu contraseña");
    } catch (err: any) {
      setError(err?.message ?? "No se pudo enviar el email de recuperación");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
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
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 text-white w-full py-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Ingresando..." : "Ingresar"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="text-blue-700 underline text-sm"
        >
          Olvidé mi contraseña
        </button>
      </form>
      <p className="mt-4 text-sm">
        ¿No tenés cuenta?{" "}
        <Link className="text-blue-700 underline" href="/(auth)/register">
          Registrate
        </Link>
      </p>
    </div>
  );
}
