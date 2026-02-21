import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient"; // your axios/fetch wrapper

interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/auth/verify-cookies")
      .then((res) => setUser(res.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login-email-password", { email, password });
    setUser(res.data.data.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const res = await apiClient.post("/auth/register-email", { email, password, name });
    setUser(res.data.data.user);
  };

  const logout = async () => {
    await apiClient.post("/auth/logout");
    setUser(null);
  };

  return { user, loading, login, signup, logout };
}