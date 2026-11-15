import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginInput, RegisterInput } from '../types';
import { authApi } from '../api/auth.api';
import { getStoredToken, setStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const activeToken = getStoredToken();
      if (!activeToken) {
        setUser(null);
        setToken(null);
        return;
      }
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      setToken(activeToken);
    } catch {
      setStoredToken(null);
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const existingToken = getStoredToken();
      if (existingToken) {
        await refreshUser();
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for unauthorized events emitted by API client interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setStoredToken(null);
    };

    window.addEventListener('servora:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('servora:unauthorized', handleUnauthorized);
    };
  }, [refreshUser]);

  const login = async (credentials: LoginInput): Promise<void> => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    setToken(data.token);
  };

  const register = async (input: RegisterInput): Promise<void> => {
    const data = await authApi.register(input);
    setUser(data.user);
    setToken(data.token);
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setToken(null);
      setStoredToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
