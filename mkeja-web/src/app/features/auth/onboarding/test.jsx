import { useState, useCallback, useRef } from "react";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  kcbGreen:   "#006633",
  kcbDark:    "#004422",
  kcbLight:   "#E8F5EE",
  safGreen:   "#4CAF50",
  safDark:    "#1B5E20",
  gold:       "#C8960C",
  goldLight:  "#FFF8E7",
  navy:       "#0A1628",
  navyMid:    "#1A2E4A",
  slate:      "#2C3E50",
  muted:      "#6B7A8D",
  border:     "#D1D9E0",
  surface:    "#F4F6F9",
  white:      "#FFFFFF",
  error:      "#C0392B",
  errorLight: "#FDECEA",
  success:    "#006633",
  successLight:"#E8F5EE",
  warn:       "#C8960C",
  warnLight:  "#FFF8E7",
};

// ─── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  input: {
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, color: C.slate, background: C.white,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Nunito Sans', sans-serif",
    transition: "border-color .2s",
  },
  label: {
    display: "block", fontSize: 12, fontWeight: 700,
    color: C.muted, marginBottom: 6, letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  error: { fontSize: 11, color: C.error, marginTop: 4 },
  select: {
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, color: C.slate, background: C.white,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Nunito Sans', sans-serif",
    appearance: "none",
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={S.label}>{label}</label>}
      {children}
      {error && <div style={S.error}>{error}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ ...S.input, borderColor: focused ? C.kcbGreen : C.border }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...S.select, borderColor: focused ? C.kcbGreen : C.border }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div style={{
        position: "absolute", right: 12, top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
        color: C.muted, fontSize: 12,
      }}>▼</div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, full }) {
  const [hov, setHov] = useState(false);
  const base = {
    padding: "12px 28px", borderRadius: 8, fontWeight: 700,
    fontSize: 14, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s", border: "none",
    width: full ? "100%" : undefined, display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "'Nunito Sans', sans-serif", letterSpacing: "0.02em",
    opacity: disabled ? 0.55 : 1,
  };
  const styles = {
    primary: {
      background: hov && !disabled ? C.kcbDark : C.kcbGreen,
      color: C.white,
      boxShadow: hov && !disabled ? `0 4px 14px rgba(0,102,51,.35)` : "none",
    },
    secondary: {
      background: "transparent",
      color: C.kcbGreen,
      border: `1.5px solid ${C.kcbGreen}`,
    },
    ghost: {
      background: hov && !disabled ? C.surface : "transparent",
      color: C.muted,
      border: `1.5px solid ${C.border}`,
    },
    gold: {
      background: hov && !disabled ? "#a77a09" : C.gold,
      color: C.white,
      boxShadow: hov && !disabled ? `0 4px 14px rgba(200,150,12,.35)` : "none",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...styles[variant] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const colors = {
    success: { bg: C.successLight, border: C.kcbGreen, text: C.kcbDark, icon: "✓" },
    error: { bg: C.errorLight, border: C.error, text: C.error, icon: "✕" },
    info: { bg: C.warnLight, border: C.gold, text: "#7a5a00", icon: "ℹ" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 12,
      background: c.bg, borderLeft: `4px solid ${c.border}`,
      padding: "14px 20px", borderRadius: 8, maxWidth: 380,
      boxShadow: "0 4px 20px rgba(0,0,0,.12)",
      animation: "slideIn .3s ease",
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: "50%",
        background: c.border, color: C.white,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>{c.icon}</span>
      <span style={{ fontSize: 14, color: c.text, fontWeight: 600 }}>{msg}</span>
    </div>
  );
}

function UploadCard({ label, icon, preview, onUpload, onClear, hint }) {
  const ref = useRef();
  return (
    <div style={{
      border: `2px dashed ${preview ? C.kcbGreen : C.border}`,
      borderRadius: 10, overflow: "hidden",
      background: preview ? C.kcbLight : C.white,
      transition: "all .2s",
    }}>
      <div style={{
        background: preview ? C.kcbLight : C.surface,
        padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: `1px solid ${preview ? C.border : C.border}`,
        fontSize: 13, fontWeight: 700, color: C.slate,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        {label}
        {preview && (
          <span style={{
            marginLeft: "auto", background: C.kcbGreen, color: C.white,
            fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
          }}>UPLOADED</span>
        )}
      </div>
      {preview ? (
        <div style={{ position: "relative", height: 130 }}>
          <img src={preview} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button
            onClick={onClear}
            style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(0,0,0,.6)", color: C.white,
              border: "none", borderRadius: "50%",
              width: 28, height: 28, cursor: "pointer",
              fontSize: 14, fontWeight: 700,
            }}
          >✕</button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          style={{
            padding: "28px 20px", textAlign: "center",
            cursor: "pointer", transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.surface}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Click to upload</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint || "JPEG, PNG or PDF · Max 5MB"}</div>
        </div>
      )}
      <input
        ref={ref} type="file"
        accept="image/jpeg,image/png,application/pdf"
        style={{ display: "none" }}
        onChange={onUpload}
      />
    </div>
  );
}

// ─── Step Indicators ───────────────────────────────────────────────────────────
function Stepper({ current, total, labels }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: step < total ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: done ? C.kcbGreen : active ? C.white : "rgba(255,255,255,.15)",
                border: `2px solid ${done || active ? C.kcbGreen : "rgba(255,255,255,.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700,
                color: done ? C.white : active ? C.kcbGreen : "rgba(255,255,255,.5)",
                transition: "all .3s",
                boxShadow: active ? "0 0 0 4px rgba(255,255,255,.2)" : "none",
              }}>
                {done ? "✓" : step}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 400,
                color: active ? C.white : "rgba(255,255,255,.55)",
                textTransform: "uppercase", letterSpacing: "0.06em",
                whiteSpace: "nowrap",
              }}>{labels[i]}</span>
            </div>
            {step < total && (
              <div style={{
                flex: 1, height: 2, margin: "0 8px", marginBottom: 22,
                background: done ? C.kcbGreen : "rgba(255,255,255,.2)",
                transition: "background .3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      margin: "28px 0 18px",
    }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{
        fontSize: 11, fontWeight: 800, color: C.muted,
        letterSpacing: "0.1em", textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Onboarding() {
  // ── state ──
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("INDIVIDUAL_LANDLORD");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [touched, setTouched] = useState({});

  // step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [kraPin, setKraPin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [saccoName, setSaccoName] = useState("");
  const [saccoLic, setSaccoLic] = useState("");
  const [directors, setDirectors] = useState([]);
  const [owners, setOwners] = useState([]);
  const [trustees, setTrustees] = useState([]);

  // step 2
  const [bankName, setBankName] = useState("");
  const [bankAccNum, setBankAccNum] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [propAddr, setPropAddr] = useState("");
  const [units, setUnits] = useState("1");
  const [terms, setTerms] = useState(false);

  // step 3 documents
  const [docs, setDocs] = useState({});

  // step 4
  const [kycResult] = useState("PENDING");

  function showToast(text, type = "info") {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }

  const totalSteps = userType === "TENANT" ? 3 : 4;
  const stepLabels = userType === "TENANT"
    ? ["Account", "Documents", "Review"]
    : ["Account", "Bank & Property", "Documents", "Review"];

  // ── validation ──
  function validateStep(s) {
    const errs = {};
    if (s === 1) {
      if (!fullName.trim() || fullName.length < 3) errs.fullName = "Full name required (min 3 chars)";
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Valid email required";
      if (!phone.match(/^(07|01|254)[0-9]{8,9}$/)) errs.phone = "Valid Kenyan phone required";
      if (userType !== "TENANT") {
        if (!idNumber.match(/^[0-9]{6,8}$/)) errs.idNumber = "6-8 digit ID number";
        if (!kraPin.match(/^[A-Z][0-9]{9}[A-Z]$/)) errs.kraPin = "Format: A001234567Z";
      }
      if (userType === "CORPORATE_LANDLORD") {
        if (!companyName.trim()) errs.companyName = "Company name required";
        if (!regNumber.trim()) errs.regNumber = "Registration number required";
      }
      if (userType === "SACCO") {
        if (!saccoName.trim()) errs.saccoName = "SACCO name required";
        if (!saccoLic.trim()) errs.saccoLic = "License number required";
      }
    }
    if (s === 2 && userType !== "TENANT") {
      if (!bankName.trim()) errs.bankName = "Account name required";
      if (!bankAccNum.match(/^[0-9]{10,16}$/)) errs.bankAccNum = "10-16 digit account number";
      if (!bankCode) errs.bankCode = "Select a bank";
      if (!bankBranch.trim()) errs.bankBranch = "Branch required";
      if (!propAddr.trim()) errs.propAddr = "Property address required";
      if (!units || parseInt(units) < 1) errs.units = "At least 1 unit";
      if (!terms) errs.terms = "You must accept terms";
    }
    if (s === 3) {
      if (userType === "INDIVIDUAL_LANDLORD") {
        if (!docs.idFront) errs.idFront = "Required";
        if (!docs.idBack) errs.idBack = "Required";
        if (!docs.selfie) errs.selfie = "Required";
        if (!docs.proofOfResidence) errs.proofOfResidence = "Required";
      } else if (userType === "CORPORATE_LANDLORD") {
        if (!docs.incorporation) errs.incorporation = "Required";
        if (!docs.cr12) errs.cr12 = "Required";
        if (!docs.bizAddress) errs.bizAddress = "Required";
        if (!docs.boardRes) errs.boardRes = "Required";
      } else if (userType === "SACCO") {
        if (!docs.saccoLic) errs.saccoLic = "Required";
        if (!docs.saccoBylaws) errs.saccoBylaws = "Required";
      } else if (userType === "TENANT") {
        if (!docs.idFront) errs.idFront = "Required";
        if (!docs.selfie) errs.selfie = "Required";
      }
    }
    return errs;
  }

  function handleNext() {
    setTouched({ all: true });
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      showToast("Please complete all required fields", "error");
      return;
    }
    if (step < totalSteps) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
  }

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
    }, 2000);
  }

  function handleFile(field, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("File too large (max 5MB)", "error"); return; }
    const reader = new FileReader();
    reader.onload = ev => setDocs(d => ({ ...d, [field]: ev.target?.result }));
    reader.readAsDataURL(file);
  }

  const errs = validateStep(step);

  function addDirector() {
    setDirectors(d => [...d, { name: "", id: "", kra: "" }]);
  }
  function removeDirector(i) { setDirectors(d => d.filter((_, j) => j !== i)); }
  function updateDirector(i, k, v) {
    setDirectors(d => d.map((x, j) => j === i ? { ...x, [k]: v } : x));
  }

  function addOwner() { setOwners(d => [...d, { name: "", id: "", pct: "" }]); }
  function removeOwner(i) { setOwners(d => d.filter((_, j) => j !== i)); }
  function updateOwner(i, k, v) {
    setOwners(d => d.map((x, j) => j === i ? { ...x, [k]: v } : x));
  }

  function addTrustee() { setTrustees(d => [...d, { name: "", id: "", kra: "" }]); }
  function removeTrustee(i) { setTrustees(d => d.filter((_, j) => j !== i)); }
  function updateTrustee(i, k, v) {
    setTrustees(d => d.map((x, j) => j === i ? { ...x, [k]: v } : x));
  }

  // ── Layout shell ──
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .fade-up { animation: fadeUp .35s ease; }
        .spin { animation: spin .7s linear infinite; }
        input[type="checkbox"] { accent-color: #006633; width: 16px; height: 16px; cursor: pointer; }
        textarea { resize: vertical; }
      `}</style>

      <Toast msg={toast?.text} type={toast?.type} />

      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyMid} 40%, #0F3320 100%)`,
        fontFamily: "'Nunito Sans', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* ── Header ── */}
        <div style={{
          width: "100%", maxWidth: 860,
          padding: "36px 40px 0",
        }}>
          {/* Logo bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 40,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* KCB-style logo mark */}
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: C.kcbGreen,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,102,51,.4)",
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: C.white, fontFamily: "'Playfair Display', serif" }}>M</span>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  Mkeja
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Property Platform
                </div>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              padding: "6px 14px", borderRadius: 20,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.safGreen }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>Secure Onboarding</span>
            </div>
          </div>

          {/* Title block */}
          {!showSuccess && (
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 38, fontWeight: 700, color: C.white,
                margin: "0 0 10px", letterSpacing: "-0.02em",
              }}>
                {userType === "TENANT" ? "Complete Your Profile" : "Open Your Account"}
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,.65)", margin: 0 }}>
                Guaranteed rent payments · Bank-grade security · M-Pesa integrated
              </p>
              {/* Trust badges */}
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}>
                {["KCB Partnered", "Safaricom M-Pesa", "CBK Licensed"].map(b => (
                  <div key={b} style={{
                    background: "rgba(255,255,255,.07)",
                    border: "1px solid rgba(255,255,255,.12)",
                    padding: "5px 14px", borderRadius: 20,
                    fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}>{b}</div>
                ))}
              </div>
            </div>
          )}

          {/* Stepper */}
          {!showSuccess && (
            <Stepper current={step} total={totalSteps} labels={stepLabels} />
          )}
        </div>

        {/* ── Form Card ── */}
        <div style={{
          width: "100%", maxWidth: 860,
          padding: "0 40px 60px",
        }}>
          <div style={{
            background: C.white, borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,.35)",
            overflow: "hidden",
          }}>

            {/* Card top accent */}
            <div style={{
              height: 4,
              background: `linear-gradient(90deg, ${C.kcbGreen}, ${C.safGreen}, ${C.gold})`,
            }} />

            <div style={{ padding: "40px 44px" }} className="fade-up">

              {/* ════════════════ STEP 1 ════════════════ */}
              {step === 1 && !showSuccess && (
                <>
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: "0 0 6px" }}>
                      Account & Identity
                    </h2>
                    <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                      Tell us who you are. All information is encrypted and verified against KRA & IPRS.
                    </p>
                  </div>

                  {/* User type selector */}
                  <div style={{ marginBottom: 28 }}>
                    <label style={S.label}>Account Type</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                      {[
                        { val: "INDIVIDUAL_LANDLORD", icon: "👤", title: "Individual", desc: "Personal property owner" },
                        { val: "CORPORATE_LANDLORD", icon: "🏢", title: "Corporate", desc: "Company / Institution" },
                        { val: "SACCO", icon: "🏦", title: "SACCO", desc: "Savings cooperative" },
                      ].map(t => (
                        <div
                          key={t.val}
                          onClick={() => { setUserType(t.val); setTouched({}); }}
                          style={{
                            padding: "18px 16px", borderRadius: 12, cursor: "pointer",
                            border: `2px solid ${userType === t.val ? C.kcbGreen : C.border}`,
                            background: userType === t.val ? C.kcbLight : C.white,
                            transition: "all .2s", textAlign: "center", position: "relative",
                          }}
                        >
                          <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: C.navy, marginBottom: 4 }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{t.desc}</div>
                          {userType === t.val && (
                            <div style={{
                              position: "absolute", top: -10, right: -10,
                              width: 22, height: 22, borderRadius: "50%",
                              background: C.kcbGreen, color: C.white,
                              fontSize: 11, fontWeight: 800,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <SectionHead label="Personal Information" />

                  <Field label="Full Legal Name" error={touched.all && errs.fullName}>
                    <Input value={fullName} onChange={setFullName} placeholder="As shown on your National ID" />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <Field label="Email Address" error={touched.all && errs.email}>
                      <Input value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
                    </Field>
                    <Field label="Phone Number" error={touched.all && errs.phone}>
                      <Input value={phone} onChange={setPhone} placeholder="0712 345 678 or 254712345678" />
                    </Field>
                  </div>

                  {userType !== "TENANT" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <Field label="National ID / Passport No." error={touched.all && errs.idNumber}>
                        <Input value={idNumber} onChange={setIdNumber} placeholder="8 digit ID number" />
                      </Field>
                      <Field label="KRA PIN" error={touched.all && errs.kraPin}>
                        <Input value={kraPin} onChange={setKraPin} placeholder="A001234567Z" />
                      </Field>
                    </div>
                  )}

                  {userType === "CORPORATE_LANDLORD" && (
                    <>
                      <SectionHead label="Company Details" />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <Field label="Company Name" error={touched.all && errs.companyName}>
                          <Input value={companyName} onChange={setCompanyName} placeholder="Registered company name" />
                        </Field>
                        <Field label="Registration Number" error={touched.all && errs.regNumber}>
                          <Input value={regNumber} onChange={setRegNumber} placeholder="e.g. PVT/123456" />
                        </Field>
                      </div>

                      <SectionHead label="Directors" />
                      {directors.map((d, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "end" }}>
                          <Field label={i === 0 ? "Full Name" : undefined}>
                            <Input value={d.name} onChange={v => updateDirector(i, "name", v)} placeholder="Full name" />
                          </Field>
                          <Field label={i === 0 ? "ID Number" : undefined}>
                            <Input value={d.id} onChange={v => updateDirector(i, "id", v)} placeholder="ID number" />
                          </Field>
                          <Field label={i === 0 ? "KRA PIN" : undefined}>
                            <Input value={d.kra} onChange={v => updateDirector(i, "kra", v)} placeholder="KRA PIN" />
                          </Field>
                          <button onClick={() => removeDirector(i)} style={{
                            background: C.errorLight, color: C.error, border: "none",
                            borderRadius: 8, padding: "11px 14px", cursor: "pointer",
                            fontWeight: 800, marginBottom: 18,
                          }}>✕</button>
                        </div>
                      ))}
                      <button onClick={addDirector} style={{
                        background: "none", border: `1.5px dashed ${C.kcbGreen}`,
                        color: C.kcbGreen, padding: "9px 20px", borderRadius: 8,
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                        marginBottom: 8,
                      }}>+ Add Director</button>

                      <SectionHead label="Beneficial Owners (≥10%)" />
                      {owners.map((o, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 10, marginBottom: 10, alignItems: "end" }}>
                          <Field label={i === 0 ? "Full Name" : undefined}>
                            <Input value={o.name} onChange={v => updateOwner(i, "name", v)} placeholder="Full name" />
                          </Field>
                          <Field label={i === 0 ? "ID Number" : undefined}>
                            <Input value={o.id} onChange={v => updateOwner(i, "id", v)} placeholder="ID number" />
                          </Field>
                          <Field label={i === 0 ? "%" : undefined}>
                            <Input value={o.pct} onChange={v => updateOwner(i, "pct", v)} placeholder="%" />
                          </Field>
                          <button onClick={() => removeOwner(i)} style={{
                            background: C.errorLight, color: C.error, border: "none",
                            borderRadius: 8, padding: "11px 14px", cursor: "pointer",
                            fontWeight: 800, marginBottom: 18,
                          }}>✕</button>
                        </div>
                      ))}
                      <button onClick={addOwner} style={{
                        background: "none", border: `1.5px dashed ${C.kcbGreen}`,
                        color: C.kcbGreen, padding: "9px 20px", borderRadius: 8,
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                      }}>+ Add Beneficial Owner</button>
                    </>
                  )}

                  {userType === "SACCO" && (
                    <>
                      <SectionHead label="SACCO Details" />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <Field label="SACCO Name" error={touched.all && errs.saccoName}>
                          <Input value={saccoName} onChange={setSaccoName} placeholder="Registered SACCO name" />
                        </Field>
                        <Field label="SASRA License Number" error={touched.all && errs.saccoLic}>
                          <Input value={saccoLic} onChange={setSaccoLic} placeholder="License number" />
                        </Field>
                      </div>

                      <SectionHead label="Trustees" />
                      {trustees.map((t, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "end" }}>
                          <Field label={i === 0 ? "Full Name" : undefined}>
                            <Input value={t.name} onChange={v => updateTrustee(i, "name", v)} placeholder="Full name" />
                          </Field>
                          <Field label={i === 0 ? "ID Number" : undefined}>
                            <Input value={t.id} onChange={v => updateTrustee(i, "id", v)} placeholder="ID number" />
                          </Field>
                          <Field label={i === 0 ? "KRA PIN" : undefined}>
                            <Input value={t.kra} onChange={v => updateTrustee(i, "kra", v)} placeholder="KRA PIN" />
                          </Field>
                          <button onClick={() => removeTrustee(i)} style={{
                            background: C.errorLight, color: C.error, border: "none",
                            borderRadius: 8, padding: "11px 14px", cursor: "pointer",
                            fontWeight: 800, marginBottom: 18,
                          }}>✕</button>
                        </div>
                      ))}
                      <button onClick={addTrustee} style={{
                        background: "none", border: `1.5px dashed ${C.kcbGreen}`,
                        color: C.kcbGreen, padding: "9px 20px", borderRadius: 8,
                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                      }}>+ Add Trustee</button>
                    </>
                  )}
                </>
              )}

              {/* ════════════════ STEP 2 — Bank & Property ════════════════ */}
              {step === 2 && userType !== "TENANT" && !showSuccess && (
                <>
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: "0 0 6px" }}>
                      Bank & Property Details
                    </h2>
                    <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                      Your settlement account for guaranteed rent disbursements.
                    </p>
                  </div>

                  {/* Bank info note */}
                  <div style={{
                    background: C.goldLight, border: `1px solid ${C.gold}`,
                    borderRadius: 10, padding: "14px 18px",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    marginBottom: 28,
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🏦</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#7a5a00", marginBottom: 2 }}>
                        Rent Disbursement via KCB Real-time Settlement
                      </div>
                      <div style={{ fontSize: 12, color: "#a07a20" }}>
                        Guaranteed rent is settled to your account by the 1st of every month, regardless of tenant payment status.
                      </div>
                    </div>
                  </div>

                  <SectionHead label="Bank Account" />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <Field label="Account Name" error={touched.all && errs.bankName}>
                      <Input value={bankName} onChange={setBankName} placeholder="As registered with your bank" />
                    </Field>
                    <Field label="Account Number" error={touched.all && errs.bankAccNum}>
                      <Input value={bankAccNum} onChange={setBankAccNum} placeholder="10–16 digit account number" />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <Field label="Bank" error={touched.all && errs.bankCode}>
                      <Select
                        value={bankCode}
                        onChange={setBankCode}
                        placeholder="Select your bank"
                        options={[
                          { value: "01", label: "KCB Bank" },
                          { value: "02", label: "Equity Bank" },
                          { value: "03", label: "Co-operative Bank" },
                          { value: "04", label: "Absa Bank Kenya" },
                          { value: "11", label: "NCBA Bank" },
                          { value: "23", label: "Stanbic Bank" },
                          { value: "31", label: "I&M Bank" },
                          { value: "57", label: "Diamond Trust Bank" },
                          { value: "63", label: "Family Bank" },
                          { value: "68", label: "Prime Bank" },
                        ]}
                      />
                    </Field>
                    <Field label="Branch" error={touched.all && errs.bankBranch}>
                      <Input value={bankBranch} onChange={setBankBranch} placeholder="Branch name" />
                    </Field>
                  </div>

                  <SectionHead label="Property Information" />

                  <Field label="Property Address" error={touched.all && errs.propAddr}>
                    <textarea
                      value={propAddr}
                      onChange={e => setPropAddr(e.target.value)}
                      placeholder="Physical address of your rental property (estate, road, county)"
                      rows={3}
                      style={{ ...S.input }}
                    />
                  </Field>

                  <Field label="Number of Rental Units" error={touched.all && errs.units}>
                    <Input value={units} onChange={setUnits} placeholder="e.g. 12" type="number" />
                  </Field>

                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    background: C.surface, borderRadius: 10, padding: "16px 18px",
                    marginTop: 8,
                  }}>
                    <input
                      type="checkbox"
                      checked={terms}
                      onChange={e => setTerms(e.target.checked)}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.6 }}>
                      I agree to the{" "}
                      <span style={{ color: C.kcbGreen, fontWeight: 700, cursor: "pointer" }}>Terms of Service</span>
                      {" "}and{" "}
                      <span style={{ color: C.kcbGreen, fontWeight: 700, cursor: "pointer" }}>Privacy Policy</span>
                      . I confirm that all provided information is accurate and I authorise Mkeja to verify my details with KRA, IPRS and KCB.
                    </div>
                  </div>
                  {touched.all && errs.terms && (
                    <div style={S.error}>You must accept the terms to continue</div>
                  )}
                </>
              )}

              {/* ════════════════ STEP 3 — Documents ════════════════ */}
              {((step === 3 && userType !== "TENANT") || (step === 2 && userType === "TENANT")) && !showSuccess && (
                <>
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: "0 0 6px" }}>
                      KYC Document Verification
                    </h2>
                    <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                      Required for CBK compliance. Documents are encrypted with AES-256 and verified by our automated system.
                    </p>
                  </div>

                  {userType === "INDIVIDUAL_LANDLORD" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <UploadCard
                          label="National ID — Front" icon="🪪"
                          preview={docs.idFront}
                          onUpload={e => handleFile("idFront", e)}
                          onClear={() => setDocs(d => ({ ...d, idFront: null }))}
                        />
                        <UploadCard
                          label="National ID — Back" icon="🪪"
                          preview={docs.idBack}
                          onUpload={e => handleFile("idBack", e)}
                          onClear={() => setDocs(d => ({ ...d, idBack: null }))}
                        />
                        <UploadCard
                          label="Selfie with Liveness" icon="📸"
                          preview={docs.selfie}
                          onUpload={e => handleFile("selfie", e)}
                          onClear={() => setDocs(d => ({ ...d, selfie: null }))}
                          hint="Clear, front-facing photo · JPEG or PNG"
                        />
                        <UploadCard
                          label="Proof of Residence" icon="🏠"
                          preview={docs.proofOfResidence}
                          onUpload={e => handleFile("proofOfResidence", e)}
                          onClear={() => setDocs(d => ({ ...d, proofOfResidence: null }))}
                          hint="Utility bill or bank statement (≤3 months)"
                        />
                      </div>
                      {touched.all && (errs.idFront || errs.idBack || errs.selfie || errs.proofOfResidence) && (
                        <div style={{ ...S.error, marginTop: 12 }}>All four documents are required</div>
                      )}
                    </>
                  )}

                  {userType === "CORPORATE_LANDLORD" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <UploadCard
                          label="Certificate of Incorporation" icon="🏢"
                          preview={docs.incorporation}
                          onUpload={e => handleFile("incorporation", e)}
                          onClear={() => setDocs(d => ({ ...d, incorporation: null }))}
                        />
                        <UploadCard
                          label="CR12 Form" icon="📄"
                          preview={docs.cr12}
                          onUpload={e => handleFile("cr12", e)}
                          onClear={() => setDocs(d => ({ ...d, cr12: null }))}
                          hint="From the Registrar of Companies"
                        />
                        <UploadCard
                          label="Proof of Business Address" icon="📍"
                          preview={docs.bizAddress}
                          onUpload={e => handleFile("bizAddress", e)}
                          onClear={() => setDocs(d => ({ ...d, bizAddress: null }))}
                        />
                        <UploadCard
                          label="Board Resolution" icon="📜"
                          preview={docs.boardRes}
                          onUpload={e => handleFile("boardRes", e)}
                          onClear={() => setDocs(d => ({ ...d, boardRes: null }))}
                          hint="Authorising this registration"
                        />
                      </div>
                    </>
                  )}

                  {userType === "SACCO" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <UploadCard
                          label="SASRA License" icon="🏦"
                          preview={docs.saccoLic}
                          onUpload={e => handleFile("saccoLic", e)}
                          onClear={() => setDocs(d => ({ ...d, saccoLic: null }))}
                        />
                        <UploadCard
                          label="SACCO By-Laws" icon="📋"
                          preview={docs.saccoBylaws}
                          onUpload={e => handleFile("saccoBylaws", e)}
                          onClear={() => setDocs(d => ({ ...d, saccoBylaws: null }))}
                        />
                        <UploadCard
                          label="Proof of Business Address" icon="📍"
                          preview={docs.bizAddress}
                          onUpload={e => handleFile("bizAddress", e)}
                          onClear={() => setDocs(d => ({ ...d, bizAddress: null }))}
                        />
                      </div>
                    </>
                  )}

                  {userType === "TENANT" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <UploadCard
                          label="National ID / Passport" icon="🪪"
                          preview={docs.idFront}
                          onUpload={e => handleFile("idFront", e)}
                          onClear={() => setDocs(d => ({ ...d, idFront: null }))}
                        />
                        <UploadCard
                          label="Selfie" icon="📸"
                          preview={docs.selfie}
                          onUpload={e => handleFile("selfie", e)}
                          onClear={() => setDocs(d => ({ ...d, selfie: null }))}
                          hint="Clear, well-lit photo"
                        />
                      </div>
                    </>
                  )}

                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: C.kcbLight, borderRadius: 8, padding: "12px 16px",
                    marginTop: 20,
                  }}>
                    <span style={{ fontSize: 16 }}>🔒</span>
                    <span style={{ fontSize: 12, color: C.kcbDark, fontWeight: 600 }}>
                      All documents are encrypted with AES-256 and stored in CBK-compliant infrastructure.
                    </span>
                  </div>
                </>
              )}

              {/* ════════════════ STEP 4 — Review ════════════════ */}
              {((step === 4 && userType !== "TENANT") || (step === 3 && userType === "TENANT")) && !showSuccess && (
                <>
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: "0 0 6px" }}>
                      Review & Submit
                    </h2>
                    <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                      Confirm your details are accurate before submission.
                    </p>
                  </div>

                  {/* Review cards */}
                  {[
                    {
                      title: "Personal Information",
                      rows: [
                        ["Full Name", fullName || "—"],
                        ["Email", email || "—"],
                        ["Phone", phone || "—"],
                        userType !== "TENANT" && ["ID Number", idNumber || "—"],
                        userType !== "TENANT" && ["KRA PIN", kraPin || "—"],
                        ["Account Type", { INDIVIDUAL_LANDLORD: "Individual Landlord", CORPORATE_LANDLORD: "Corporate Landlord", SACCO: "SACCO", TENANT: "Tenant" }[userType]],
                      ].filter(Boolean),
                    },
                    userType !== "TENANT" && {
                      title: "Bank & Property",
                      rows: [
                        ["Bank Account Name", bankName || "—"],
                        ["Account Number", bankAccNum || "—"],
                        ["Bank", ["", "KCB Bank", "Equity Bank", "Co-operative Bank", "Absa Bank", , , , , , , "NCBA Bank"][parseInt(bankCode)] || bankCode || "—"],
                        ["Branch", bankBranch || "—"],
                        ["Property Address", propAddr || "—"],
                        ["Rental Units", units || "—"],
                      ],
                    },
                    {
                      title: "Documents Uploaded",
                      rows: Object.keys(docs).filter(k => docs[k]).map(k => ([
                        { idFront: "ID Front", idBack: "ID Back", selfie: "Selfie", proofOfResidence: "Proof of Residence", incorporation: "Certificate of Incorporation", cr12: "CR12 Form", bizAddress: "Business Address", boardRes: "Board Resolution", saccoLic: "SASRA License", saccoBylaws: "SACCO By-Laws" }[k] || k,
                        "Uploaded ✓"
                      ])),
                    },
                  ].filter(Boolean).map(section => (
                    <div key={section.title} style={{
                      background: C.surface, borderRadius: 12,
                      padding: "20px 24px", marginBottom: 20,
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        fontSize: 12, fontWeight: 800, color: C.muted,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        marginBottom: 16, paddingBottom: 12,
                        borderBottom: `1px solid ${C.border}`,
                      }}>{section.title}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {section.rows.map(([k, v]) => (
                          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}</span>
                            <span style={{
                              fontSize: 14, fontWeight: 600, color: C.navy,
                              color: String(v).includes("✓") ? C.kcbGreen : C.navy,
                            }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{
                    background: `linear-gradient(135deg, ${C.kcbLight}, ${C.goldLight})`,
                    border: `1px solid ${C.kcbGreen}`,
                    borderRadius: 12, padding: "18px 22px",
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.kcbDark, marginBottom: 4 }}>
                        Instant Automated Verification
                      </div>
                      <div style={{ fontSize: 12, color: C.kcbGreen, lineHeight: 1.6 }}>
                        Your details will be verified against IPRS, KRA and CBK databases. Most verifications complete within 2 minutes. Complex cases may require up to 48 hours.
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ════════════════ SUCCESS SCREEN ════════════════ */}
              {showSuccess && (
                <div style={{ textAlign: "center", padding: "20px 0" }} className="fade-up">
                  <div style={{
                    width: 88, height: 88, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.kcbGreen}, ${C.safGreen})`,
                    margin: "0 auto 28px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 40, color: C.white,
                    boxShadow: `0 8px 24px rgba(0,102,51,.35)`,
                    animation: "pop .5s ease",
                  }}>✓</div>

                  <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 30, fontWeight: 700, color: C.navy, margin: "0 0 10px",
                  }}>Application Submitted!</h2>
                  <p style={{ fontSize: 15, color: C.muted, margin: "0 0 36px" }}>
                    {userType === "TENANT"
                      ? "Your profile is active. You can now make rent contributions."
                      : "Your KYC verification is in progress. We'll notify you via SMS."}
                  </p>

                  <div style={{
                    background: C.surface, borderRadius: 14,
                    padding: "24px 32px", marginBottom: 32,
                    border: `1px solid ${C.border}`,
                    display: "inline-block", minWidth: 320,
                  }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: C.warnLight, border: `1px solid ${C.gold}`,
                      padding: "6px 16px", borderRadius: 20, marginBottom: 16,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#7a5a00", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        KYC PENDING
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.7 }}>
                      Our compliance team will review your documents within 24–48 hours. You'll receive an SMS and email notification once approved.
                    </p>
                  </div>

                  {/* What happens next */}
                  <div style={{ textAlign: "left", marginBottom: 32 }}>
                    {[
                      ["Automated verification", "IPRS and KRA checks complete within minutes"],
                      ["Document review", "Our team verifies uploaded documents"],
                      ["Account activation", "You receive SMS confirmation and dashboard access"],
                    ].map(([title, desc], i) => (
                      <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: C.kcbLight, border: `2px solid ${C.kcbGreen}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 800, color: C.kcbGreen,
                        }}>{i + 1}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{title}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Btn onClick={() => {}} variant="primary">
                    Go to Dashboard →
                  </Btn>
                </div>
              )}

              {/* ── Navigation ── */}
              {!showSuccess && (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 36, paddingTop: 28,
                  borderTop: `1px solid ${C.border}`,
                }}>
                  <Btn
                    onClick={handleBack}
                    variant="ghost"
                    disabled={step === 1}
                  >
                    ← Back
                  </Btn>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>
                      Step {step} of {totalSteps}
                    </span>
                    <Btn
                      onClick={handleNext}
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spin" style={{
                            display: "inline-block", width: 14, height: 14,
                            border: "2px solid rgba(255,255,255,.4)",
                            borderTopColor: C.white,
                            borderRadius: "50%",
                          }} />
                          Processing...
                        </>
                      ) : step === totalSteps ? "Submit Application →" : "Continue →"}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center", marginTop: 28, paddingBottom: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
          }}>
            {["🔒 256-bit Encryption", "🏛 CBK Compliant", "📱 M-Pesa Integrated"].map(t => (
              <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}