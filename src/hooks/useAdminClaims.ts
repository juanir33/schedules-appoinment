'use client'

import { useState } from 'react';
import { useAuth } from '@/src/context/auth/AuthContext.context';

interface SetClaimsResponse {
  success: boolean;
  message: string;
  user?: {
    uid: string;
    email: string;
    admin: boolean;
  };
  error?: string;
}

interface CheckClaimsResponse {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    customClaims: Record<string, boolean | string | number>;
    isAdmin: boolean;
  };
  error?: string;
}

export function useAdminClaims() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const setAdminClaim = async (email: string, isAdmin: boolean): Promise<SetClaimsResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/admin/set-claims', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, isAdmin }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar rol');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkUserClaims = async (email: string): Promise<CheckClaimsResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/admin/set-claims?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar usuario');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignAdminRole = (email: string) => setAdminClaim(email, true);
  const removeAdminRole = (email: string) => setAdminClaim(email, false);

  return {
    loading,
    error,
    setAdminClaim,
    checkUserClaims,
    assignAdminRole,
    removeAdminRole,
  };
}