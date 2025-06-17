"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface AuthContextType {
  isSignedIn: boolean;
  signIn: (credentials?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth status securely from the server
  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        setIsSignedIn(res.ok);
      } catch {
        setIsSignedIn(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Call API to sign in (server sets HttpOnly cookie)
  const signIn = async (credentials?: any) => {
    setLoading(true);
    try {
      if (!credentials || !credentials.email || !credentials.password) {
        console.warn("signIn called without valid credentials");
        setIsSignedIn(false);
        return;
      }
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      setIsSignedIn(res.ok);
    } finally {
      setLoading(false);
    }
  };

  // Call API to sign out (server clears cookie)
  const signOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      setIsSignedIn(false);
      if (typeof window !== "undefined") {
        window.location.replace("/sign-in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
