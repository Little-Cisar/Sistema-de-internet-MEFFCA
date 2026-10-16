import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('mefcca_token');
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem('mefcca_token');
    const restoreSession = async () => {
      if (!token) {
        if (active) setLoading(false);
        return;
      }
      try {
        const response = await authService.profile();
        if (active) setUser(response.data?.usuario ?? response.data?.user ?? null);
      } catch {
        sessionStorage.removeItem('mefcca_token');
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    restoreSession();
    const onUnauthorized = () => { if (active) setUser(null); };
    window.addEventListener('mefcca:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('mefcca:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    const { token, usuario, user: alternateUser } = response.data || {};
    if (!token) throw new Error('La API respondió sin un token de sesión.');
    sessionStorage.setItem('mefcca_token', token);
    setUser(usuario ?? alternateUser ?? null);
    return response.data;
  }, []);

  const register = useCallback((payload) => authService.register(payload), []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user && sessionStorage.getItem('mefcca_token')),
    login,
    register,
    logout: clearSession
  }), [user, loading, login, register, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return context;
}
