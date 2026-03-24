import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import logo from "./logo.jpeg";

// ─────────────────────────────────────────────────────────────
// MODAL COMPONENTS
// ─────────────────────────────────────────────────────────────

function LoginModal({ onClose, onSwitch }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) { setError("Please enter your username and password."); return; }
    setError(""); setLoading(true);
    try {
      await login(username, password);
      onClose();
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Welcome Back!</h2>
        <div className="modal-sub">Login to your account</div>
        {error && <div className="api-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Username</label>
            <input type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Logging in..." : "LOG IN"}
          </button>
        </form>
        <div className="modal-footer">
          Don't have an account? <button onClick={onSwitch}>Register here</button>
        </div>
      </div>
    </div>
  );
}

function RegisterModal({ onClose, onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const { firstName, lastName, email, username, password } = form;
    if (!firstName || !lastName || !email || !username || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);
    try {
      await register(firstName, lastName, email, username, password);
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Create Account</h2>
        <div className="modal-sub">Join the community portal</div>
        {error && <div className="api-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field"><label>First Name</label><input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} autoFocus /></div>
            <div className="form-field"><label>Last Name</label><input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} /></div>
          </div>
          <div className="form-field"><label>Email</label><input type="email" name="email" placeholder="you@email.com" value={form.email} onChange={handleChange} /></div>
          <div className="form-row">
            <div className="form-field"><label>Username</label><input name="username" placeholder="Choose username" value={form.username} onChange={handleChange} /></div>
            <div className="form-field"><label>Password</label><input type="password" name="password" placeholder="Min 8 characters" value={form.password} onChange={handleChange} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Registering..." : "REGISTER"}
          </button>
        </form>
        <div className="modal-footer">
          Already have an account? <button onClick={onSwitch}>Log in</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOMEOWNER DASHBOARD
// ─────────────────────────────────────────────────────────────

function HomeownerDashboard({ user }) {
  const name = `${user.firstName} ${user.lastName}`;
  return (
    <div className="dashboard-wrap">
      <div className="section-title">Welcome back, <span>{name}! 👋</span></div>
      <div className="dashboard-grid">
        <div className="card highlight">
          <div className="card-label">Current Balance</div>
          <div className="card-value">₱0.00</div>
          <div className="card-sub">No pending bills</div>
        </div>
        <div className="card">
          <div className="card-label">Last Payment</div>
          <div className="card-value">—</div>
          <div className="card-sub">No payments yet</div>
        </div>
        <div className="card">
          <div className="card-label">Water Usage</div>
          <div className="card-value">— <span style={{ fontSize: 16 }}>m³</span></div>
          <div className="card-sub">This Month</div>
        </div>
        <div className="card">
          <div className="card-label">Account Status</div>
          <div className="card-value" style={{ fontSize: 20 }}>Active</div>
          <div className="card-sub">All dues up to date</div>
        </div>
      </div>

      <div style={{ padding: "0 40px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div className="card">
          <div className="card-label">Monthly Usage Overview</div>
          <div className="chart-bar-wrap">
            {[50, 65, 55, 80, 60, 90].map((h, i) => (
              <div key={i} className="chart-bar" style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.7 }} />
            ))}
          </div>
          <div className="chart-labels">
            {["SEP","OCT","NOV","DEC","JAN","FEB"].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>

      <div className="section-title">My Recent Transactions</div>
      <div className="table-wrap">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr><th>Billing Period</th><th>Amount Due</th><th>Amount Paid</th><th>Usage</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr className="loading-row">
                <td colSpan={5}>No billing records yet. Contact the HOA office for assistance.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOA ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────

function AdminDashboard({ user }) {
  const { authFetch } = useAuth();
  const name = `${user.firstName} ${user.lastName}`;
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const loadUsers = useCallback(async () => {
    setUsersLoading(true); setUsersError("");
    try {
      const data = await authFetch("/admin/users");
      if (data.success) setUsers(data.users);
      else setUsersError(data.message || "Failed to load users.");
    } catch {
      setUsersError("⚠️ Cannot connect to server. Make sure backend is running.");
    } finally { setUsersLoading(false); }
  }, [authFetch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function toggleStatus(userId) {
    try {
      const data = await authFetch(`/admin/users/${userId}/toggle`, { method: "PATCH" });
      if (data.success) loadUsers();
      else alert(data.message || "Failed to update status.");
    } catch { alert("Cannot connect to server."); }
  }

  async function changeRole(userId, newRole) {
    try {
      const data = await authFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      if (!data.success) { alert(data.message || "Failed to update role."); loadUsers(); }
      else loadUsers();
    } catch { alert("Cannot connect to server."); }
  }

  const homeowners = users.filter(u => u.role === "homeowner");
  const tabs = [
    { id: "users", label: "👥 All Users" },
    { id: "unpaid", label: "⚠️ Unpaid Bills" },
    { id: "payments", label: "💳 Payment History" },
    { id: "consumption", label: "💧 Consumption Records" },
  ];

  return (
    <div className="dashboard-wrap">
      <div className="section-title">HOA Admin Panel — <span>{name}! 👋</span></div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="card highlight">
          <div className="card-label">Total Homeowners</div>
          <div className="card-value">{usersLoading ? "—" : homeowners.length}</div>
          <div className="card-sub">Registered accounts</div>
        </div>
        <div className="card">
          <div className="card-label">Total Collections</div>
          <div className="card-value">₱0.00</div>
          <div className="card-sub">This month</div>
        </div>
        <div className="card">
          <div className="card-label">Unpaid Bills</div>
          <div className="card-value">—</div>
          <div className="card-sub">Needs attention</div>
        </div>
        <div className="card">
          <div className="card-label">Total Users</div>
          <div className="card-value">{usersLoading ? "—" : users.length}</div>
          <div className="card-sub">All roles</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: All Users */}
      {activeTab === "users" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead>
                <tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th></tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr className="loading-row"><td colSpan={6}>⏳ Loading users...</td></tr>
                ) : usersError ? (
                  <tr className="loading-row"><td colSpan={6}>{usersError}</td></tr>
                ) : users.length === 0 ? (
                  <tr className="loading-row"><td colSpan={6}>No users found.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id || u._id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="role-select"
                        value={u.role}
                        disabled={u.id === user.id}
                        onChange={e => changeRole(u.id || u._id, e.target.value)}
                      >
                        <option value="homeowner">Homeowner</option>
                        <option value="staff_admin">Staff</option>
                        <option value="hoa_admin">HOA Admin</option>
                      </select>
                    </td>
                    <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-PH") : "Never"}</td>
                    <td>
                      <button
                        className={`toggle-btn badge ${u.isActive ? "badge-paid" : "badge-unpaid"}`}
                        disabled={u.id === user.id}
                        onClick={() => toggleStatus(u.id || u._id)}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Unpaid Bills */}
      {activeTab === "unpaid" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Billing Period</th><th>Amount Due</th><th>Usage</th><th>Status</th></tr></thead>
              <tbody><tr className="loading-row"><td colSpan={5}>Billing module coming soon.</td></tr></tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Payment History */}
      {activeTab === "payments" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Amount</th><th>Date Paid</th><th>Method</th><th>Status</th></tr></thead>
              <tbody><tr className="loading-row"><td colSpan={5}>Payment module coming soon.</td></tr></tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Consumption Records */}
      {activeTab === "consumption" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Month</th><th>Previous Reading</th><th>Current Reading</th><th>Consumption</th></tr></thead>
              <tbody><tr className="loading-row"><td colSpan={5}>Consumption module coming soon.</td></tr></tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAFF DASHBOARD
// ─────────────────────────────────────────────────────────────

function StaffDashboard({ user }) {
  const name = `${user.firstName} ${user.lastName}`;
  return (
    <div className="dashboard-wrap">
      <div className="section-title">Staff Dashboard — <span>{name}! 👋</span></div>
      <div className="dashboard-grid">
        <div className="card highlight">
          <div className="card-label">Pending Readings</div>
          <div className="card-value">0</div>
          <div className="card-sub">To be encoded</div>
        </div>
        <div className="card">
          <div className="card-label">Payments Recorded</div>
          <div className="card-value">0</div>
          <div className="card-sub">This month</div>
        </div>
      </div>
      <div style={{ padding: "0 40px", maxWidth: 1200, margin: "16px auto 0", width: "100%" }}>
        <div className="card">
          <p style={{ color: "#888", textAlign: "center", padding: 20 }}>
            Water consumption recording and billing features coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────

function App() {
  const { user, logout, loading } = useAuth();
  const [page, setPage] = useState("home");
  const [modal, setModal] = useState(null); // "login" | "register" | null

  // Auto-redirect to dashboard after login
  useEffect(() => {
    if (user) setPage("dashboard");
  }, [user]);

  function goTo(name) { setPage(name); }

  function handleLogout() {
    logout();
    setPage("home");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--purple-mid)", fontWeight: 700 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── NAVBAR ── */}
      <nav>
        <div className="nav-brand">Online Water Billing — Sta. Barbara Villas 1</div>
        <div className="nav-links">
          <button className={page === "home" ? "active" : ""} onClick={() => goTo("home")}>Home</button>
          <button className={page === "about" ? "active" : ""} onClick={() => goTo("about")}>About Us</button>
          <button className={page === "contact" ? "active" : ""} onClick={() => goTo("contact")}>Our Contact</button>
          {user && (
            <button className={page === "dashboard" ? "active" : ""} onClick={() => goTo("dashboard")}>Dashboard</button>
          )}
          {user && (
            <button className="nav-logout" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </nav>

      {/* ── HOME PAGE ── */}
      {page === "home" && (
        <main className="home-main">
          <div className="logo-wrap">
            <img src={logo} alt="Sta. Barbara Villas 1 HOA Logo" />
          </div>
          <div className="welcome-text">WELCOME <span>KA-BARBARA!</span></div>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => setModal("login")}>LOG IN</button>
            <button className="btn btn-secondary" onClick={() => setModal("register")}>REGISTER</button>
          </div>
        </main>
      )}

      {/* ── DASHBOARD PAGE ── */}
      {page === "dashboard" && user && (
        <>
          {user.role === "hoa_admin" && <AdminDashboard user={user} />}
          {user.role === "staff_admin" && <StaffDashboard user={user} />}
          {user.role === "homeowner" && <HomeownerDashboard user={user} />}
        </>
      )}

      {/* ── ABOUT PAGE ── */}
      {page === "about" && (
        <div className="about-wrap">
          <h1>About Us</h1>
          <div className="accent-line"></div>
          <p>The Water Billing and Dues Management System for the HOA of Sta. Barbara Villas 1 is a web-based platform developed to modernize the community's billing and dues processes.</p>
          <p>Created by BSIT students, the platform allows HOA administrators to manage member records, generate billing statements, track payments, and produce financial reports.</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--purple-dark)", margin: "32px 0 16px" }}>Development Team</h2>
          <div className="team-grid">
            {[
              { name: "Jerrick Sam E. Saceda", init: "J" },
              { name: "Elbert Louis A. Bautista", init: "E" },
              { name: "Adrian Justin A. Marcos", init: "A" },
              { name: "Kyle Chester C. Mabasa", init: "K" },
              { name: "Lawrence Adrian E. Balala", init: "L" },
            ].map(m => (
              <div key={m.init} className="team-card">
                <div className="team-avatar">{m.init}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">Developer</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTACT PAGE ── */}
      {page === "contact" && (
        <div className="contact-wrap">
          <h1>Contact Us</h1>
          <div className="accent-line"></div>
          <p>Have questions? Feel free to reach out to our development team or the HOA administration.</p>
          <div className="contact-card">
            <p><strong>Development Team</strong></p>
            <p>Jerrick Saceda / Elbert Bautista / Adrian Marcos / Kyle Mabasa / Lawrence Balala</p>
            <br />
            <p><strong>HOA Administration:</strong></p>
            <p>Contact the HOA office directly for billing inquiries and system concerns.</p>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer>© 2025 Sta. Barbara Villas 1 Homeowners' Association</footer>

      {/* ── MODALS ── */}
      {modal === "login" && (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitch={() => setModal("register")}
        />
      )}
      {modal === "register" && (
        <RegisterModal
          onClose={() => setModal(null)}
          onSwitch={() => setModal("login")}
        />
      )}
    </div>
  );
}

export default App;