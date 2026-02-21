import { BASE_URL } from "@/config/config";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";



interface User {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify cookies on mount
  useEffect(() => {
    verifyCookies();
  }, []);

  const verifyCookies = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-cookies`, {
        method: "GET",
        credentials: "include", // Important: sends httpOnly cookies
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        // Handle different response structures
        setUser(data.data?.user || data.user || data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Cookie verification failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login-email-password`, {
      method: "POST",
      credentials: "include", // Important: receive cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await res.json();
    setUser(data.data?.user || data.user || data);
  };

  const signup = async (email: string, password: string, name: string) => {
    const res = await fetch(`${BASE_URL}/auth/register-email`, {
      method: "POST",
      credentials: "include", // Important: receive cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Signup failed");
    }

    const data = await res.json();
    setUser(data.data?.user || data.user || data);
  };

  const logout = async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};