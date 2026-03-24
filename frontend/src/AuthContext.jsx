import { createContext, useContext, useState, useEffect } from "react";


const API = "/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on page refresh ─────────────────────
  useEffect(() => {
    const savedToken = sessionStorage.getItem("hoa_token");
    const savedUser = sessionStorage.getItem("hoa_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem("hoa_token");
        sessionStorage.removeItem("hoa_user");
      }
    }
    setLoading(false);
  }, []);

  // ── Login ────────────────────────────────────────────────
  async function login(username, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server error. Make sure the backend is running.");
    }

    if (!data.success) throw new Error(data.message || "Login failed.");

    sessionStorage.setItem("hoa_token", data.token);
    sessionStorage.setItem("hoa_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // ── Register ─────────────────────────────────────────────
  async function register(firstName, lastName, email, username, password) {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, username, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server error. Make sure the backend is running.");
    }

    if (!data.success) throw new Error(data.message || "Registration failed.");

    sessionStorage.setItem("hoa_token", data.token);
    sessionStorage.setItem("hoa_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // ── Logout ───────────────────────────────────────────────
  function logout() {
    sessionStorage.removeItem("hoa_token");
    sessionStorage.removeItem("hoa_user");
    setToken(null);
    setUser(null);
  }

  // ── Authenticated fetch (for admin routes etc.) ──────────
  async function authFetch(url, options = {}) {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server error. Make sure the backend is running.");
    }

    return data;
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;