import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import logo from "./logo.jpeg";

// ─────────────────────────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSwitch, onOTPRequired }) {
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
      const data = await login(username, password);
      onClose();
      onOTPRequired(data);
    } catch (err) {
      setError(err.message || "Login failed.");
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
          <div className="form-field"><label>Username</label><input type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} autoFocus /></div>
          <div className="form-field"><label>Password</label><input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? "Verifying..." : "LOG IN"}</button>
        </form>
        <div className="modal-footer">Don't have an account? <button onClick={onSwitch}>Register here</button></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OTP MODAL
// ─────────────────────────────────────────────────────────────
function OTPModal({ otpData, onClose, onSuccess }) {
  const { verifyOTP, resendOTP } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!otp || otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(""); setLoading(true);
    try { await verifyOTP(otpData.userId, otp); onSuccess(); }
    catch (err) { setError(err.message || "Invalid OTP."); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    try { await resendOTP(otpData.userId); setResendMsg("New OTP sent!"); setCountdown(300); setOtp(""); }
    catch (err) { setResendMsg(err.message || "Failed to resend."); }
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Verify Identity</h2>
        <div className="modal-sub">OTP Verification</div>
        <div style={{ background: "var(--purple-pale)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--purple-dark)" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>OTP sent via: {otpData.otpSentVia?.join(" & ")}</p>
          {otpData.maskedEmail && <p style={{ margin: "4px 0 0", color: "#666" }}>📧 {otpData.maskedEmail}</p>}
          {otpData.maskedPhone && <p style={{ margin: "4px 0 0", color: "#666" }}>📱 {otpData.maskedPhone}</p>}
        </div>
        {error && <div className="api-error">⚠️ {error}</div>}
        {resendMsg && <div style={{ background: "#e8f9ef", border: "1.5px solid #1a7a40", borderRadius: 10, padding: "10px 14px", color: "#1a7a40", fontSize: 13, marginBottom: 12 }}>✅ {resendMsg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Enter 6-Digit OTP</label>
            <input type="text" placeholder="_ _ _ _ _ _" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ fontSize: 24, letterSpacing: "0.4em", textAlign: "center", fontWeight: 800 }} autoFocus maxLength={6} />
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            {countdown > 0
              ? <p style={{ fontSize: 13, color: countdown < 60 ? "#b01c1c" : "#888" }}>Expires in <strong>{mm}:{ss}</strong></p>
              : <p style={{ fontSize: 13, color: "#b01c1c", fontWeight: 700 }}>OTP expired. Please resend.</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || countdown === 0}>{loading ? "Verifying..." : "VERIFY OTP"}</button>
        </form>
        <div className="modal-footer">Didn't receive it? <button onClick={handleResend}>Resend OTP</button></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REGISTER MODAL
// ─────────────────────────────────────────────────────────────
function RegisterModal({ onClose, onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", username: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const { firstName, lastName, email, username, password, phone } = form;
    if (!firstName || !lastName || !email || !username || !password) { setError("Please fill in all required fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);
    try { await register(firstName, lastName, email, username, password, phone); onClose(); }
    catch (err) { setError(err.message || "Registration failed."); }
    finally { setLoading(false); }
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
            <div className="form-field"><label>First Name *</label><input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} autoFocus /></div>
            <div className="form-field"><label>Last Name *</label><input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} /></div>
          </div>
          <div className="form-field"><label>Email *</label><input type="email" name="email" placeholder="you@email.com" value={form.email} onChange={handleChange} /></div>
          <div className="form-field"><label>Phone <span style={{ color: "#aaa", fontWeight: 400 }}>(for SMS OTP)</span></label><input type="tel" name="phone" placeholder="e.g. 09171234567" value={form.phone} onChange={handleChange} /></div>
          <div className="form-row">
            <div className="form-field"><label>Username *</label><input name="username" placeholder="Choose username" value={form.username} onChange={handleChange} /></div>
            <div className="form-field"><label>Password *</label><input type="password" name="password" placeholder="Min 8 characters" value={form.password} onChange={handleChange} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? "Registering..." : "REGISTER"}</button>
        </form>
        <div className="modal-footer">Already have an account? <button onClick={onSwitch}>Log in</button></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOMEOWNER DASHBOARD
// ─────────────────────────────────────────────────────────────
function HomeownerDashboard({ user }) {
  const { authFetch } = useAuth();
  const name = `${user.firstName} ${user.lastName}`;
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [summary, setSummary] = useState({ balance: 0, lastPaid: "—", usage: "—" });

  useEffect(() => {
    async function load() {
      try {
        const data = await authFetch("/billing/bills/my");
        if (data.success) {
          setBills(data.bills);
          const unpaid = data.bills.filter(b => b.status !== "paid");
          const totalBalance = unpaid.reduce((s, b) => s + (b.totalAmount - b.amountPaid), 0);
          const lastPaid = data.bills.find(b => b.status === "paid");
          const latest = data.bills[0];
          setSummary({
            balance: totalBalance,
            lastPaid: lastPaid ? `₱${lastPaid.amountPaid.toFixed(2)}` : "—",
            usage: latest ? `${latest.consumption} m³` : "—",
          });
        }
      } catch { /* ignore */ }
      finally { setBillsLoading(false); }
    }
    load();
  }, [authFetch]);

  function statusBadge(s) {
    if (s === "paid") return <span className="badge badge-paid">Paid</span>;
    if (s === "partial") return <span className="badge badge-pending">Partial</span>;
    if (s === "overdue") return <span className="badge badge-unpaid">Overdue</span>;
    return <span className="badge badge-unpaid">Unpaid</span>;
  }

  return (
    <div className="dashboard-wrap">
      <div className="section-title">Welcome back, <span>{name}! 👋</span></div>
      <div className="dashboard-grid">
        <div className="card highlight">
          <div className="card-label">Outstanding Balance</div>
          <div className="card-value">₱{summary.balance.toFixed(2)}</div>
          <div className="card-sub">{summary.balance > 0 ? "Please settle your bill" : "All paid up!"}</div>
        </div>
        <div className="card">
          <div className="card-label">Last Payment</div>
          <div className="card-value">{summary.lastPaid}</div>
          <div className="card-sub">Most recent payment</div>
        </div>
        <div className="card">
          <div className="card-label">Water Usage</div>
          <div className="card-value">{summary.usage}</div>
          <div className="card-sub">Latest billing period</div>
        </div>
        <div className="card">
          <div className="card-label">Account Status</div>
          <div className="card-value" style={{ fontSize: 20 }}>{user.isActive ? "Active" : "Inactive"}</div>
          <div className="card-sub">Membership standing</div>
        </div>
      </div>

      <div className="section-title">My Bills</div>
      <div className="table-wrap">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr><th>Billing Period</th><th>Consumption</th><th>Water Charge</th><th>HOA Dues</th><th>Total</th><th>Amount Paid</th><th>Due Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {billsLoading ? (
                <tr className="loading-row"><td colSpan={8}>⏳ Loading bills...</td></tr>
              ) : bills.length === 0 ? (
                <tr className="loading-row"><td colSpan={8}>No bills yet. Contact the HOA office.</td></tr>
              ) : bills.map(b => (
                <tr key={b._id}>
                  <td>{b.billingPeriod}</td>
                  <td>{b.consumption} m³</td>
                  <td>₱{b.waterCharge?.toFixed(2)}</td>
                  <td>₱{b.monthlyDues?.toFixed(2)}</td>
                  <td><strong>₱{b.totalAmount?.toFixed(2)}</strong></td>
                  <td>₱{b.amountPaid?.toFixed(2)}</td>
                  <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString("en-PH") : "—"}</td>
                  <td>{statusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAFF DASHBOARD
// ─────────────────────────────────────────────────────────────
function StaffDashboard({ user }) {
  const { authFetch } = useAuth();
  const name = `${user.firstName} ${user.lastName}`;
  const [activeTab, setActiveTab] = useState("reading");
  const [consumers, setConsumers] = useState([]);
  const [readings, setReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Reading form
  const [readingForm, setReadingForm] = useState({ consumerId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), previousReading: "", currentReading: "", notes: "" });
  // Payment form
  const [paymentForm, setPaymentForm] = useState({ billId: "", amount: "", method: "cash", referenceNumber: "", notes: "" });

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  useEffect(() => {
    async function loadAll() {
      try {
        const [c, r, b, p] = await Promise.all([
          authFetch("/consumers"),
          authFetch("/billing/readings"),
          authFetch("/billing/bills"),
          authFetch("/payments"),
        ]);
        if (c.success) setConsumers(c.consumers);
        if (r.success) setReadings(r.readings);
        if (b.success) setBills(b.bills);
        if (p.success) setPayments(p.payments);
      } catch { /* ignore */ }
    }
    loadAll();
  }, [authFetch]);

  function showMsg(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  }

  async function submitReading(e) {
    e.preventDefault();
    const { consumerId, month, year, previousReading, currentReading, notes } = readingForm;
    if (!consumerId || !currentReading) { showMsg("error", "Consumer and current reading are required."); return; }
    try {
      const data = await authFetch("/billing/readings", {
        method: "POST",
        body: JSON.stringify({ consumerId, month: Number(month), year: Number(year), previousReading: Number(previousReading) || 0, currentReading: Number(currentReading), notes }),
      });
      if (!data.success) { showMsg("error", data.message); return; }
      showMsg("success", `Reading recorded! Consumption: ${data.reading.consumption} m³`);
      setReadingForm(f => ({ ...f, consumerId: "", previousReading: "", currentReading: "", notes: "" }));
      const r = await authFetch("/billing/readings");
      if (r.success) setReadings(r.readings);
    } catch { showMsg("error", "Failed to record reading."); }
  }

  async function generateBill(readingId) {
    try {
      const data = await authFetch("/billing/generate", { method: "POST", body: JSON.stringify({ readingId }) });
      if (!data.success) { showMsg("error", data.message); return; }
      showMsg("success", `Bill generated! Total: ₱${data.bill.totalAmount.toFixed(2)}`);
      const b = await authFetch("/billing/bills");
      if (b.success) setBills(b.bills);
    } catch { showMsg("error", "Failed to generate bill."); }
  }

  async function submitPayment(e) {
    e.preventDefault();
    const { billId, amount, method, referenceNumber, notes } = paymentForm;
    if (!billId || !amount) { showMsg("error", "Bill and amount are required."); return; }
    try {
      const data = await authFetch("/payments", {
        method: "POST",
        body: JSON.stringify({ billId, amount: Number(amount), method, referenceNumber, notes }),
      });
      if (!data.success) { showMsg("error", data.message); return; }
      showMsg("success", `Payment recorded! Receipt: ${data.receiptNumber}`);
      setPaymentForm({ billId: "", amount: "", method: "cash", referenceNumber: "", notes: "" });
      const [b, p] = await Promise.all([authFetch("/billing/bills"), authFetch("/payments")]);
      if (b.success) setBills(b.bills);
      if (p.success) setPayments(p.payments);
    } catch { showMsg("error", "Failed to record payment."); }
  }

  function statusBadge(s) {
    if (s === "paid") return <span className="badge badge-paid">Paid</span>;
    if (s === "partial") return <span className="badge badge-pending">Partial</span>;
    if (s === "overdue") return <span className="badge badge-unpaid">Overdue</span>;
    return <span className="badge badge-unpaid">Unpaid</span>;
  }

  const unpaidBills = bills.filter(b => b.status !== "paid");

  return (
    <div className="dashboard-wrap">
      <div className="section-title">Staff Dashboard — <span>{name}! 👋</span></div>

      {/* Summary */}
      <div className="dashboard-grid">
        <div className="card highlight">
          <div className="card-label">Consumers</div>
          <div className="card-value">{consumers.length}</div>
          <div className="card-sub">Total registered</div>
        </div>
        <div className="card">
          <div className="card-label">Readings This Month</div>
          <div className="card-value">{readings.filter(r => r.month === new Date().getMonth() + 1).length}</div>
          <div className="card-sub">Recorded so far</div>
        </div>
        <div className="card">
          <div className="card-label">Unpaid Bills</div>
          <div className="card-value">{unpaidBills.length}</div>
          <div className="card-sub">Need collection</div>
        </div>
        <div className="card">
          <div className="card-label">Payments Today</div>
          <div className="card-value">{payments.filter(p => new Date(p.paymentDate).toDateString() === new Date().toDateString()).length}</div>
          <div className="card-sub">Recorded today</div>
        </div>
      </div>

      {/* Alert */}
      {msg.text && (
        <div style={{ margin: "0 40px 16px", padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: msg.type === "success" ? "#e8f9ef" : "#fce8e8", color: msg.type === "success" ? "#1a7a40" : "#b01c1c", border: `1.5px solid ${msg.type === "success" ? "#1a7a40" : "#e075a0"}` }}>
          {msg.type === "success" ? "✅ " : "⚠️ "}{msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: "reading", label: "💧 Record Reading" },
          { id: "bills", label: "📄 All Bills" },
          { id: "payment", label: "💳 Record Payment" },
          { id: "history", label: "📋 Payment History" },
        ].map(t => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab: Record Reading */}
      {activeTab === "reading" && (
        <div className="table-wrap">
          <div className="card" style={{ maxWidth: 600 }}>
            <div className="card-label" style={{ marginBottom: 16 }}>New Water Meter Reading</div>
            <form onSubmit={submitReading}>
              <div className="form-field">
                <label>Homeowner / Consumer</label>
                <select className="role-select" style={{ width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 14 }} value={readingForm.consumerId} onChange={e => setReadingForm(f => ({ ...f, consumerId: e.target.value }))}>
                  <option value="">-- Select homeowner --</option>
                  {consumers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.userId?.firstName} {c.userId?.lastName} — Unit {c.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Month</label>
                  <select className="role-select" style={{ width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 14 }} value={readingForm.month} onChange={e => setReadingForm(f => ({ ...f, month: e.target.value }))}>
                    {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Year</label>
                  <input type="number" placeholder="2026" value={readingForm.year} onChange={e => setReadingForm(f => ({ ...f, year: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Previous Reading (m³)</label>
                  <input type="number" placeholder="0" value={readingForm.previousReading} onChange={e => setReadingForm(f => ({ ...f, previousReading: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} />
                </div>
                <div className="form-field">
                  <label>Current Reading (m³)</label>
                  <input type="number" placeholder="0" value={readingForm.currentReading} onChange={e => setReadingForm(f => ({ ...f, currentReading: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} />
                </div>
              </div>
              {readingForm.previousReading && readingForm.currentReading && (
                <div style={{ background: "var(--purple-pale)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "var(--purple-dark)", fontWeight: 700 }}>
                  💧 Consumption: {Math.max(0, Number(readingForm.currentReading) - Number(readingForm.previousReading))} m³
                </div>
              )}
              <div className="form-field">
                <label>Notes (optional)</label>
                <input type="text" placeholder="e.g. Meter replaced" value={readingForm.notes} onChange={e => setReadingForm(f => ({ ...f, notes: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>RECORD READING</button>
            </form>
          </div>

          {/* Recent readings table */}
          <div style={{ marginTop: 24 }}>
            <div className="section-title" style={{ padding: "0 0 12px" }}>Recent Readings</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table>
                <thead><tr><th>Homeowner</th><th>Unit</th><th>Period</th><th>Prev</th><th>Current</th><th>Consumption</th><th>Bill</th></tr></thead>
                <tbody>
                  {readings.length === 0
                    ? <tr className="loading-row"><td colSpan={7}>No readings yet.</td></tr>
                    : readings.slice(0, 10).map(r => {
                      const hasBill = bills.some(b => b.waterReadingId === r._id || (b.month === r.month && b.year === r.year && b.consumerId?._id === (r.consumerId?._id || r.consumerId)));
                      return (
                        <tr key={r._id}>
                          <td>{r.consumerId?.userId?.firstName} {r.consumerId?.userId?.lastName}</td>
                          <td>{r.consumerId?.unitNumber}</td>
                          <td>{months[r.month - 1]} {r.year}</td>
                          <td>{r.previousReading} m³</td>
                          <td>{r.currentReading} m³</td>
                          <td><strong>{r.consumption} m³</strong></td>
                          <td>
                            {hasBill
                              ? <span className="badge badge-paid">Generated</span>
                              : <button className="btn-sm btn btn-primary" onClick={() => generateBill(r._id)}>Generate Bill</button>}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: All Bills */}
      {activeTab === "bills" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Unit</th><th>Period</th><th>Consumption</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                {bills.length === 0
                  ? <tr className="loading-row"><td colSpan={9}>No bills generated yet.</td></tr>
                  : bills.map(b => (
                    <tr key={b._id}>
                      <td>{b.consumerId?.userId?.firstName} {b.consumerId?.userId?.lastName}</td>
                      <td>{b.consumerId?.unitNumber}</td>
                      <td>{b.billingPeriod}</td>
                      <td>{b.consumption} m³</td>
                      <td>₱{b.totalAmount?.toFixed(2)}</td>
                      <td>₱{b.amountPaid?.toFixed(2)}</td>
                      <td>₱{(b.totalAmount - b.amountPaid)?.toFixed(2)}</td>
                      <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString("en-PH") : "—"}</td>
                      <td>{statusBadge(b.status)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Record Payment */}
      {activeTab === "payment" && (
        <div className="table-wrap">
          <div className="card" style={{ maxWidth: 600 }}>
            <div className="card-label" style={{ marginBottom: 16 }}>Record Cash Payment</div>
            <form onSubmit={submitPayment}>
              <div className="form-field">
                <label>Select Unpaid Bill</label>
                <select className="role-select" style={{ width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 14 }} value={paymentForm.billId} onChange={e => {
                  const bill = bills.find(b => b._id === e.target.value);
                  setPaymentForm(f => ({ ...f, billId: e.target.value, amount: bill ? (bill.totalAmount - bill.amountPaid).toFixed(2) : "" }));
                }}>
                  <option value="">-- Select bill --</option>
                  {unpaidBills.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.consumerId?.userId?.firstName} {b.consumerId?.userId?.lastName} — {b.billingPeriod} — Balance: ₱{(b.totalAmount - b.amountPaid).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Amount (₱)</label>
                  <input type="number" placeholder="0.00" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} />
                </div>
                <div className="form-field">
                  <label>Payment Method</label>
                  <select className="role-select" style={{ width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 14 }} value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))}>
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Reference Number (optional)</label>
                <input type="text" placeholder="For GCash/bank payments" value={paymentForm.referenceNumber} onChange={e => setPaymentForm(f => ({ ...f, referenceNumber: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} />
              </div>
              <div className="form-field">
                <label>Notes (optional)</label>
                <input type="text" placeholder="Any additional notes" value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>RECORD PAYMENT</button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Payment History */}
      {activeTab === "history" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Bill Period</th><th>Amount</th><th>Method</th><th>Reference</th><th>Receipt</th><th>Date</th></tr></thead>
              <tbody>
                {payments.length === 0
                  ? <tr className="loading-row"><td colSpan={7}>No payments recorded yet.</td></tr>
                  : payments.map(p => (
                    <tr key={p._id}>
                      <td>{p.consumerId?.userId?.firstName} {p.consumerId?.userId?.lastName}</td>
                      <td>{p.billId?.billingPeriod}</td>
                      <td>₱{p.amount?.toFixed(2)}</td>
                      <td><span className="badge badge-homeowner" style={{ textTransform: "capitalize" }}>{p.method}</span></td>
                      <td>{p.referenceNumber || "—"}</td>
                      <td>{p.receiptNumber}</td>
                      <td>{new Date(p.paymentDate).toLocaleDateString("en-PH")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
  const [consumers, setConsumers] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalCollections: 0, unpaidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Consumer form
  const [consumerForm, setConsumerForm] = useState({ userId: "", unitNumber: "", blockLot: "", streetAddress: "", phone: "", meterNumber: "" });
  // Rate form
  const [rateForm, setRateForm] = useState({ baseCharge: "", ratePerCubicMeter: "", monthlyDues: "", penaltyRate: "" });
  const [currentRate, setCurrentRate] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [u, c, b, p, s, r] = await Promise.all([
        authFetch("/admin/users"),
        authFetch("/consumers"),
        authFetch("/billing/bills"),
        authFetch("/payments"),
        authFetch("/payments/summary"),
        authFetch("/billing/rates"),
      ]);
      if (u.success) setUsers(u.users);
      else setError(u.message);
      if (c.success) setConsumers(c.consumers);
      if (b.success) setBills(b.bills);
      if (p.success) setPayments(p.payments);
      if (s.success) setSummary(s.summary);
      if (r.success && r.rate) { setCurrentRate(r.rate); setRateForm({ baseCharge: r.rate.baseCharge, ratePerCubicMeter: r.rate.ratePerCubicMeter, monthlyDues: r.rate.monthlyDues, penaltyRate: r.rate.penaltyRate }); }
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function showMsg(type, text) { setMsg({ type, text }); setTimeout(() => setMsg({ type: "", text: "" }), 4000); }

  async function toggleStatus(id) {
    const data = await authFetch(`/admin/users/${id}/toggle`, { method: "PATCH" });
    if (data.success) loadAll(); else alert(data.message);
  }
  async function changeRole(id, role) {
    const data = await authFetch(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
    if (data.success) loadAll(); else alert(data.message);
  }

  async function submitConsumer(e) {
    e.preventDefault();
    if (!consumerForm.userId || !consumerForm.unitNumber) { showMsg("error", "User and unit number are required."); return; }
    const data = await authFetch("/consumers", { method: "POST", body: JSON.stringify(consumerForm) });
    if (!data.success) { showMsg("error", data.message); return; }
    showMsg("success", "Consumer profile created!");
    setConsumerForm({ userId: "", unitNumber: "", blockLot: "", streetAddress: "", phone: "", meterNumber: "" });
    loadAll();
  }

  async function submitRate(e) {
    e.preventDefault();
    const { baseCharge, ratePerCubicMeter, monthlyDues, penaltyRate } = rateForm;
    if (!baseCharge || !ratePerCubicMeter || !monthlyDues) { showMsg("error", "All rate fields are required."); return; }
    const data = await authFetch("/billing/rates", { method: "POST", body: JSON.stringify({ baseCharge: Number(baseCharge), ratePerCubicMeter: Number(ratePerCubicMeter), monthlyDues: Number(monthlyDues), penaltyRate: Number(penaltyRate) || 50 }) });
    if (!data.success) { showMsg("error", data.message); return; }
    showMsg("success", "Billing rate updated!");
    loadAll();
  }

  const homeowners = users.filter(u => u.role === "homeowner");
  const usersWithoutProfile = users.filter(u => u.role === "homeowner" && !consumers.find(c => c.userId?._id === u.id || c.userId === u.id));

  function statusBadge(s) {
    if (s === "paid") return <span className="badge badge-paid">Paid</span>;
    if (s === "partial") return <span className="badge badge-pending">Partial</span>;
    if (s === "overdue") return <span className="badge badge-unpaid">Overdue</span>;
    return <span className="badge badge-unpaid">Unpaid</span>;
  }

  const tabs = [
    { id: "users", label: "👥 All Users" },
    { id: "consumers", label: "🏠 Consumer Profiles" },
    { id: "bills", label: "📄 All Bills" },
    { id: "payments", label: "💳 Payment History" },
    { id: "rates", label: "⚙️ Billing Rates" },
  ];

  return (
    <div className="dashboard-wrap">
      <div className="section-title">HOA Admin Panel — <span>{name}! 👋</span></div>

      <div className="dashboard-grid">
        <div className="card highlight">
          <div className="card-label">Total Homeowners</div>
          <div className="card-value">{loading ? "—" : homeowners.length}</div>
          <div className="card-sub">Registered accounts</div>
        </div>
        <div className="card">
          <div className="card-label">Collections This Month</div>
          <div className="card-value">₱{summary.totalCollectionsThisMonth?.toFixed(2) || "0.00"}</div>
          <div className="card-sub">Total collected</div>
        </div>
        <div className="card">
          <div className="card-label">Unpaid Bills</div>
          <div className="card-value">{summary.unpaidBillsCount ?? "—"}</div>
          <div className="card-sub">Needs attention</div>
        </div>
        <div className="card">
          <div className="card-label">Total Users</div>
          <div className="card-value">{loading ? "—" : users.length}</div>
          <div className="card-sub">All roles</div>
        </div>
      </div>

      {msg.text && (
        <div style={{ margin: "0 40px 16px", padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: msg.type === "success" ? "#e8f9ef" : "#fce8e8", color: msg.type === "success" ? "#1a7a40" : "#b01c1c", border: `1.5px solid ${msg.type === "success" ? "#1a7a40" : "#e075a0"}` }}>
          {msg.type === "success" ? "✅ " : "⚠️ "}{msg.text}
        </div>
      )}

      <div className="tabs">
        {tabs.map(t => <button key={t.id} className={`tab-btn${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
      </div>

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th><th>Last Login</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? <tr className="loading-row"><td colSpan={7}>⏳ Loading...</td></tr>
                : error ? <tr className="loading-row"><td colSpan={7}>{error}</td></tr>
                : users.length === 0 ? <tr className="loading-row"><td colSpan={7}>No users found.</td></tr>
                : users.map(u => (
                  <tr key={u.id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || "—"}</td>
                    <td>
                      <select className="role-select" value={u.role} disabled={u.id === user.id} onChange={e => changeRole(u.id, e.target.value)}>
                        <option value="homeowner">Homeowner</option>
                        <option value="staff_admin">Staff</option>
                        <option value="hoa_admin">HOA Admin</option>
                      </select>
                    </td>
                    <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-PH") : "Never"}</td>
                    <td>
                      <button className={`toggle-btn badge ${u.isActive ? "badge-paid" : "badge-unpaid"}`} disabled={u.id === user.id} onClick={() => toggleStatus(u.id)}>
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

      {/* Tab: Consumer Profiles */}
      {activeTab === "consumers" && (
        <div className="table-wrap">
          {/* Create form */}
          <div className="card" style={{ maxWidth: 600, marginBottom: 24 }}>
            <div className="card-label" style={{ marginBottom: 16 }}>Assign Consumer Profile to Homeowner</div>
            <form onSubmit={submitConsumer}>
              <div className="form-field">
                <label>Homeowner Account</label>
                <select className="role-select" style={{ width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 14 }} value={consumerForm.userId} onChange={e => setConsumerForm(f => ({ ...f, userId: e.target.value }))}>
                  <option value="">-- Select homeowner --</option>
                  {usersWithoutProfile.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Unit Number *</label><input placeholder="e.g. B12" value={consumerForm.unitNumber} onChange={e => setConsumerForm(f => ({ ...f, unitNumber: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
                <div className="form-field"><label>Block & Lot</label><input placeholder="e.g. Blk 3 Lot 5" value={consumerForm.blockLot} onChange={e => setConsumerForm(f => ({ ...f, blockLot: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Meter Number</label><input placeholder="e.g. M-00123" value={consumerForm.meterNumber} onChange={e => setConsumerForm(f => ({ ...f, meterNumber: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
                <div className="form-field"><label>Phone</label><input placeholder="09XXXXXXXXX" value={consumerForm.phone} onChange={e => setConsumerForm(f => ({ ...f, phone: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>ASSIGN PROFILE</button>
            </form>
          </div>

          {/* Existing consumers */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Unit</th><th>Block/Lot</th><th>Meter No.</th><th>Phone</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {consumers.length === 0
                  ? <tr className="loading-row"><td colSpan={7}>No consumer profiles yet.</td></tr>
                  : consumers.map(c => (
                    <tr key={c._id}>
                      <td>{c.userId?.firstName} {c.userId?.lastName}</td>
                      <td>{c.unitNumber}</td>
                      <td>{c.blockLot || "—"}</td>
                      <td>{c.meterNumber || "—"}</td>
                      <td>{c.phone || "—"}</td>
                      <td>₱{c.outstandingBalance?.toFixed(2) || "0.00"}</td>
                      <td><span className={`badge ${c.isActive ? "badge-paid" : "badge-unpaid"}`}>{c.isActive ? "Active" : "Inactive"}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: All Bills */}
      {activeTab === "bills" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Unit</th><th>Period</th><th>Consumption</th><th>Base</th><th>Water</th><th>Dues</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead>
              <tbody>
                {bills.length === 0
                  ? <tr className="loading-row"><td colSpan={10}>No bills generated yet.</td></tr>
                  : bills.map(b => (
                    <tr key={b._id}>
                      <td>{b.consumerId?.userId?.firstName} {b.consumerId?.userId?.lastName}</td>
                      <td>{b.consumerId?.unitNumber}</td>
                      <td>{b.billingPeriod}</td>
                      <td>{b.consumption} m³</td>
                      <td>₱{b.baseCharge?.toFixed(2)}</td>
                      <td>₱{b.waterCharge?.toFixed(2)}</td>
                      <td>₱{b.monthlyDues?.toFixed(2)}</td>
                      <td><strong>₱{b.totalAmount?.toFixed(2)}</strong></td>
                      <td>₱{b.amountPaid?.toFixed(2)}</td>
                      <td>{statusBadge(b.status)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Payment History */}
      {activeTab === "payments" && (
        <div className="table-wrap">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Homeowner</th><th>Period</th><th>Amount</th><th>Method</th><th>Reference</th><th>Receipt</th><th>Recorded By</th><th>Date</th></tr></thead>
              <tbody>
                {payments.length === 0
                  ? <tr className="loading-row"><td colSpan={8}>No payments recorded yet.</td></tr>
                  : payments.map(p => (
                    <tr key={p._id}>
                      <td>{p.consumerId?.userId?.firstName} {p.consumerId?.userId?.lastName}</td>
                      <td>{p.billId?.billingPeriod}</td>
                      <td>₱{p.amount?.toFixed(2)}</td>
                      <td><span className="badge badge-homeowner" style={{ textTransform: "capitalize" }}>{p.method}</span></td>
                      <td>{p.referenceNumber || "—"}</td>
                      <td>{p.receiptNumber}</td>
                      <td>{p.recordedBy?.firstName} {p.recordedBy?.lastName}</td>
                      <td>{new Date(p.paymentDate).toLocaleDateString("en-PH")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Billing Rates */}
      {activeTab === "rates" && (
        <div className="table-wrap">
          {currentRate && (
            <div style={{ background: "var(--purple-pale)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: 13 }}>
              <strong>Current Active Rate:</strong> Base ₱{currentRate.baseCharge} + ₱{currentRate.ratePerCubicMeter}/m³ + ₱{currentRate.monthlyDues} dues
            </div>
          )}
          <div className="card" style={{ maxWidth: 500 }}>
            <div className="card-label" style={{ marginBottom: 16 }}>Set New Billing Rate</div>
            <form onSubmit={submitRate}>
              <div className="form-row">
                <div className="form-field"><label>Base Charge (₱)</label><input type="number" placeholder="50" value={rateForm.baseCharge} onChange={e => setRateForm(f => ({ ...f, baseCharge: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
                <div className="form-field"><label>Rate per m³ (₱)</label><input type="number" placeholder="15" value={rateForm.ratePerCubicMeter} onChange={e => setRateForm(f => ({ ...f, ratePerCubicMeter: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Monthly HOA Dues (₱)</label><input type="number" placeholder="200" value={rateForm.monthlyDues} onChange={e => setRateForm(f => ({ ...f, monthlyDues: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
                <div className="form-field"><label>Late Penalty (₱)</label><input type="number" placeholder="50" value={rateForm.penaltyRate} onChange={e => setRateForm(f => ({ ...f, penaltyRate: e.target.value }))} style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--purple-light)", background: "var(--purple-pale)", fontSize: 14, outline: "none" }} /></div>
              </div>
              {rateForm.baseCharge && rateForm.ratePerCubicMeter && rateForm.monthlyDues && (
                <div style={{ background: "var(--purple-pale)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "var(--purple-dark)" }}>
                  <strong>Sample Bill (10 m³):</strong> ₱{Number(rateForm.baseCharge)} base + ₱{(Number(rateForm.ratePerCubicMeter) * 10).toFixed(2)} water + ₱{Number(rateForm.monthlyDues)} dues = <strong>₱{(Number(rateForm.baseCharge) + Number(rateForm.ratePerCubicMeter) * 10 + Number(rateForm.monthlyDues)).toFixed(2)}</strong>
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>SET BILLING RATE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
function App() {
  const { user, logout, loading } = useAuth();
  const [page, setPage] = useState("home");
  const [modal, setModal] = useState(null);
  const [otpData, setOtpData] = useState(null);

  useEffect(() => { if (user) setPage("dashboard"); }, [user]);

  function handleLogout() { logout(); setPage("home"); }
  function handleOTPRequired(data) { setOtpData(data); setModal("otp"); }
  function handleOTPSuccess() { setModal(null); setOtpData(null); }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--purple-mid)", fontWeight: 700 }}>Loading...</p>
    </div>
  );

  return (
    <div>
      <nav>
        <div className="nav-brand">Online Water Billing — Sta. Barbara Villas 1</div>
        <div className="nav-links">
          <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}>Home</button>
          <button className={page === "about" ? "active" : ""} onClick={() => setPage("about")}>About Us</button>
          <button className={page === "contact" ? "active" : ""} onClick={() => setPage("contact")}>Our Contact</button>
          {user && <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>Dashboard</button>}
          {user && <button className="nav-logout" onClick={handleLogout}>Logout</button>}
        </div>
      </nav>

      {page === "home" && (
        <main className="home-main">
          <div className="logo-wrap"><img src={logo} alt="HOA Logo" /></div>
          <div className="welcome-text">WELCOME <span>KA-BARBARA!</span></div>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => setModal("login")}>LOG IN</button>
            <button className="btn btn-secondary" onClick={() => setModal("register")}>REGISTER</button>
          </div>
        </main>
      )}

      {page === "dashboard" && user && (
        <>
          {user.role === "hoa_admin" && <AdminDashboard user={user} />}
          {user.role === "staff_admin" && <StaffDashboard user={user} />}
          {user.role === "homeowner" && <HomeownerDashboard user={user} />}
        </>
      )}

      {page === "about" && (
        <div className="about-wrap">
          <h1>About Us</h1>
          <div className="accent-line"></div>
          <p>The Water Billing and Dues Management System for the HOA of Sta. Barbara Villas 1 is a web-based platform developed to modernize the community's billing and dues processes.</p>
          <p>Created by BSIT students, the platform allows HOA administrators to manage member records, generate billing statements, track payments, and produce financial reports.</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--purple-dark)", margin: "32px 0 16px" }}>Development Team</h2>
          <div className="team-grid">
            {[{ name: "Jerrick Sam E. Saceda", init: "J" }, { name: "Elbert Louis A. Bautista", init: "E" }, { name: "Adrian Justin A. Marcos", init: "A" }, { name: "Kyle Chester C. Mabasa", init: "K" }, { name: "Lawrence Adrian E. Balala", init: "L" }].map(m => (
              <div key={m.init} className="team-card">
                <div className="team-avatar">{m.init}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">Developer</div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <footer>© 2025 Sta. Barbara Villas 1 Homeowners' Association</footer>

      {modal === "login" && <LoginModal onClose={() => setModal(null)} onSwitch={() => setModal("register")} onOTPRequired={handleOTPRequired} />}
      {modal === "register" && <RegisterModal onClose={() => setModal(null)} onSwitch={() => setModal("login")} />}
      {modal === "otp" && otpData && <OTPModal otpData={otpData} onClose={() => setModal(null)} onSuccess={handleOTPSuccess} />}
    </div>
  );
}

export default App;