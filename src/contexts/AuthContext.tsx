import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, AuthState } from '../types';
import { api } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, twoFactorToken?: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  setupTwoFactor: () => Promise<{ qrCode: string; secret: string }>;
  enableTwoFactor: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  });

  useEffect(() => {
    const token = localStorage.getItem('voxvote_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      api.get('/auth/me')
        .then(response => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
        })
        .catch(() => {
          localStorage.removeItem('voxvote_token');
          delete api.defaults.headers.common['Authorization'];
        });
    }
  }, []);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await api.post('/auth/login', { email, password, twoFactorToken });
      const { token, user } = response.data;
      
      localStorage.setItem('voxvote_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.response?.data?.message || 'Login failed' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('voxvote_token');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const register = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await api.post('/auth/register', { email, password });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.response?.data?.message || 'Registration failed' });
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      await api.post('/auth/verify-email', { token });
    } catch (error: any) {
      throw error;
    }
  };

  const setupTwoFactor = async () => {
    try {
      const response = await api.post('/auth/setup-2fa');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const enableTwoFactor = async (token: string) => {
    try {
      await api.post('/auth/enable-2fa', { token });
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      register,
      verifyEmail,
      setupTwoFactor,
      enableTwoFactor
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};