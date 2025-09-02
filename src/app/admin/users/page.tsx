'use client'

import { useState } from 'react';
import { useAdminClaims } from '@/src/hooks/useAdminClaims';
import AdminProtected from '@/src/components/AdminProtected';
import { User, Shield, ShieldCheck, Search, UserPlus, UserMinus } from 'lucide-react';

interface UserInfo {
  uid: string;
  email: string;
  isAdmin: boolean;
}

export default function UsersAdmin() {
  const { loading, error, assignAdminRole, removeAdminRole, checkUserClaims } = useAdminClaims();
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleAssignAdmin = async () => {
    if (!email.trim()) {
      showMessage('Por favor ingresa un email válido', 'error');
      return;
    }

    try {
      const result = await assignAdminRole(email.trim());
      showMessage(result.message, 'success');
      setEmail('');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error al asignar rol', 'error');
    }
  };

  const handleRemoveAdmin = async () => {
    if (!email.trim()) {
      showMessage('Por favor ingresa un email válido', 'error');
      return;
    }

    try {
      const result = await removeAdminRole(email.trim());
      showMessage(result.message, 'success');
      setEmail('');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error al remover rol', 'error');
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      showMessage('Por favor ingresa un email para buscar', 'error');
      return;
    }

    try {
      const result = await checkUserClaims(searchEmail.trim());
      if (result.user) {
        setUserInfo({
          uid: result.user.uid,
          email: result.user.email,
          isAdmin: result.user.isAdmin
        });
      }
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error al buscar usuario', 'error');
      setUserInfo(null);
    }
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full mb-6">
               <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">Gestión de Usuarios</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Administra roles y permisos de usuarios del sistema de manera segura y eficiente</p>
          </div>

          {/* Mensajes */}
          {message && (
            <div className={`mb-8 p-4 rounded-xl shadow-lg border ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            } fade-in`}>
              <div className="flex items-center gap-3">
                {messageType === 'success' ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <Shield className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}

          {/* Error global */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 shadow-lg fade-in">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-600" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Asignar/Remover Roles */}
            <div className="card-elegant p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">Gestionar Roles</h2>
                  <p className="text-gray-600">Asigna o remueve permisos administrativos</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                    Email del usuario
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="input-elegant"
                    disabled={loading}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleAssignAdmin}
                    disabled={loading || !email.trim()}
                    className="btn-primary bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    {loading ? 'Procesando...' : 'Asignar Admin'}
                  </button>
                  
                  <button
                    onClick={handleRemoveAdmin}
                    disabled={loading || !email.trim()}
                    className="btn-primary bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <UserMinus className="w-5 h-5" />
                    {loading ? 'Procesando...' : 'Remover Admin'}
                  </button>
                </div>
              </div>
            </div>

            {/* Buscar Usuario */}
            <div className="card-elegant p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">Buscar Usuario</h2>
                  <p className="text-gray-600">Consulta información y roles de usuarios</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="searchEmail" className="block text-sm font-semibold text-gray-700 mb-3">
                    Email del usuario
                  </label>
                  <input
                    type="email"
                    id="searchEmail"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="input-elegant"
                    disabled={loading}
                  />
                </div>
                
                <button
                  onClick={handleSearchUser}
                  disabled={loading || !searchEmail.trim()}
                  className="w-full btn-primary bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {loading ? 'Buscando...' : 'Buscar Usuario'}
                </button>
                
                {/* Información del usuario */}
                {userInfo && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-rose-50 rounded-xl border border-amber-200 shadow-lg fade-in">
                    <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
                      Información del Usuario
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                        <span className="font-semibold text-gray-700 block mb-1">Email:</span>
                        <span className="text-gray-600">{userInfo.email}</span>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                        <span className="font-semibold text-gray-700 block mb-1">UID:</span>
                        <span className="text-gray-600 font-mono text-sm">{userInfo.uid}</span>
                      </div>
                      <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                        <span className="font-semibold text-gray-700 block mb-2">Rol:</span>
                        {userInfo.isAdmin ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold shadow-lg">
                            <ShieldCheck className="w-4 h-4" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full text-sm font-semibold shadow-lg">
                            <User className="w-4 h-4" />
                            Usuario
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-lg fade-in">
            <h3 className="font-display font-bold text-amber-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Información Importante
            </h3>
            <div className="space-y-3 text-amber-700">
              <p className="flex items-start gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                Los usuarios deben cerrar sesión y volver a iniciar para que los cambios de rol tomen efecto.
              </p>
              <p className="flex items-start gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                Solo los administradores pueden gestionar roles de otros usuarios.
              </p>
              
            </div>
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}