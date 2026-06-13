import React, { createContext, useContext, useState, useEffect } from 'react';

// Wir nutzen standardmäßig localhost:8000 für das Python FastAPI Backend, es sei denn eine Env-Var ist gesetzt.
export const API_BASE_URL = (typeof process !== 'undefined' ? process.env.BUN_PUBLIC_API_BASE_URL : undefined) || 'http://localhost:8000';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, username: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple JWT decoder to avoid adding extra libraries like jwt-decode if not strictly necessary
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    username: null,
    role: null,
  });

  useEffect(() => {
    // Check local storage on initial load
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const decoded = parseJwt(storedToken);
      // Check if token is expired
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setAuthState({
          token: storedToken,
          username: decoded.sub,
          role: decoded.role,
        });
      } else {
        // Token expired, clear it
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token: string, username: string, role: string) => {
    localStorage.setItem('token', token);
    setAuthState({ token, username, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({ token: null, username: null, role: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isAuthenticated: !!authState.token }}>
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

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Assuming application/json by default unless dealing with FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle unauthorized globally (e.g. force logout)
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return response;
};
