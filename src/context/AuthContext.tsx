import React, { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser } from "../services/auth";
import { getToken, clearToken, saveToken, saveClientUser, getStoredClientUser, getCurrentUser } from "../services/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logoutUser: () => void;
  authModalOpen: boolean;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalMode: "login" | "register";
  setAuthModalMode: (mode: "login" | "register") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredClientUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const t = getToken();
    if (t && !user) {
      getCurrentUser(t)
        .then((u) => {
          setUser(u);
          saveClientUser(u);
        })
        .catch(() => {
          clearToken();
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  const setAuth = (newUser: AuthUser, newToken: string) => {
    saveToken(newToken);
    saveClientUser(newUser);
    setToken(newToken);
    setUser(newUser);
    setAuthModalOpen(false);
  };

  const logoutUser = () => {
    clearToken();
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        setAuth,
        logoutUser,
        authModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
