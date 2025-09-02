"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/context/auth/AuthContext.context";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const { login, reset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email) return setError("Ingresá tu email para recuperar la contraseña");
    setError("");
    try {
      await reset(email);
      setResetSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el email de recuperación");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto pt-px p-10
           ">
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Volver al inicio
        </Link>

        {/* Login Card */}
        <div className="card-elegant p-8 sm:p-10 fade-in">
            <div className="text-center mb-10">
              <div className="inline-flex p-3 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Bienvenida</h1>
              <p className="text-gray-600 text-lg">Ingresá a tu cuenta para gestionar tus reservas</p>
            </div>

          {resetSent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 text-sm text-center">
                ✅ Te enviamos un email para restablecer tu contraseña
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Mail className="inline w-4 h-4 mr-2 text-amber-600" />
                    Email
                  </label>
                  <input
                    className="input-elegant"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Lock className="inline w-4 h-4 mr-2 text-amber-600" />
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      className="input-elegant pr-12"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-amber-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-amber-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              <div className="mt-8 pt-2">
                 <button
                   type="submit"
                   disabled={busy}
                   className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {busy ? (
                     <div className="flex items-center justify-center">
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                       Ingresando...
                     </div>
                   ) : (
                     'Ingresar a mi cuenta'
                   )}
                 </button>
               </div>
             </form>

             {/* Separador visual */}
             <div className="mt-10 pt-8 border-t border-gray-200">
               <div className="text-center space-y-5">
                 <button
                   type="button"
                   onClick={handleReset}
                   className="text-amber-600 hover:text-amber-700 text-sm font-semibold transition-colors block mx-auto hover:underline"
                 >
                   ¿Olvidaste tu contraseña?
                 </button>
                
                <div className="text-gray-600 text-base">
                  ¿No tenés cuenta?{' '}
                  <Link href="/register" className="text-amber-600 hover:text-amber-700 font-semibold transition-colors hover:underline">
                    Registrate acá
                  </Link>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
