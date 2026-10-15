/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { customerAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore the session from the JWT cookie on first load
  useEffect(() => {
    let active = true;
    customerAPI
      .getProfile()
      .then(({ data }) => active && setUser(data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setAuthLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Session expired somewhere else in the app
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await customerAPI.login({ email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await customerAPI.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, authLoading, login, logout }),
    [user, authLoading, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
