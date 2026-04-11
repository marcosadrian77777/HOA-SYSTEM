import { createContext, useContext, useState, useEffect } from "react";

const API = "/api";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session ──────────────────────────────────────
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

  // ── Login ─────────────────────────────────────────────────
  // Returns either:
  // { requiresOTP: true, userId, maskedEmail, maskedPhone, otpSentVia }
  // OR logs in directly if OTP not configured:
  // { requiresOTP: false, token, user }
  async function login(username, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    let data;
    try { data = await res.json(); }
    catch { throw new Error("Server error. Make sure the backend is running."); }

    if (!data.success) throw new Error(data.message || "Login failed.");

    // If OTP is not required, log in directly
    if (!data.requiresOTP) {
      sessionStorage.setItem("hoa_token", data.token);
      sessionStorage.setItem("hoa_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  }

  // ── Verify OTP ────────────────────────────────────────────
  async function verifyOTP(userId, otp) {
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, otp }),
    });
    let data;
    try { data = await res.json(); }
    catch { throw new Error("Server error. Make sure the backend is running."); }

    if (!data.success) throw new Error(data.message || "OTP verification failed.");

    sessionStorage.setItem("hoa_token", data.token);
    sessionStorage.setItem("hoa_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // ── Resend OTP ────────────────────────────────────────────
  async function resendOTP(userId) {
    const res = await fetch(`${API}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    let data;
    try { data = await res.json(); }
    catch { throw new Error("Server error."); }
    if (!data.success) throw new Error(data.message || "Failed to resend OTP.");
    return data;
  }

  // ── Register ──────────────────────────────────────────────
  async function register(firstName, lastName, email, username, password, phone) {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, username, password, phone }),
    });
    let data;
    try { data = await res.json(); }
    catch { throw new Error("Server error. Make sure the backend is running."); }

    if (!data.success) throw new Error(data.message || "Registration failed.");

    sessionStorage.setItem("hoa_token", data.token);
    sessionStorage.setItem("hoa_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // ── Logout ────────────────────────────────────────────────
  function logout() {
    sessionStorage.removeItem("hoa_token");
    sessionStorage.removeItem("hoa_user");
    setToken(null);
    setUser(null);
  }

  // ── Authenticated fetch ───────────────────────────────────
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
    try { data = await res.json(); }
    catch { throw new Error("Server error. Make sure the backend is running."); }
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyOTP, resendOTP, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;