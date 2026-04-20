// ============================================================
// Amanda Cards – Supabase Client & Auth Helpers
// ============================================================

const SUPABASE_URL = "https://mzokzdbqctnlezngutgb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16b2t6ZGJxY3RubGV6bmd1dGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDg4MTgsImV4cCI6MjA5MDQ4NDgxOH0.Y8JwstAioTUuPVRlypmKl13lpdqXrXmY3A0o8J7AVXA";
const ADMIN_EMAIL = "amandatechnologies@gmail.com";

// ── Base fetch wrapper ──────────────────────────────────────
async function sbFetch(path, opts = {}) {
  let session = getSession();

  if (session && session.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    // If the token expires in the next 5 minutes, get a new one first
    if (now > session.expires_at - 300) {
      console.log("Refreshing token automatically...");
      session = await refreshSession();
    }
  }

  const token = opts.anonymous ? null : getToken();
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };
  const res = await fetch(`${SUPABASE_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(
      err.message || err.msg || err.error_description || `HTTP ${res.status}`,
    );
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Auth helpers ────────────────────────────────────────────
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("ac_session") || "null");
  } catch {
    return null;
  }
}
function getToken() {
  return getSession()?.access_token || null;
}
function getUser() {
  return getSession()?.user || null;
}
function isAdmin() {
  return getUser()?.email === ADMIN_EMAIL;
}
async function isAffiliate() {
  const user = getUser();
  if (!user) return false;
  try {
    const affiliates = await dbSelect("affiliates", `?email=eq.${user.email}`);
    return affiliates && affiliates.length > 0;
  } catch {
    return false;
  }
}
function saveSession(data) {
  localStorage.setItem("ac_session", JSON.stringify(data));
}
function clearSession() {
  localStorage.removeItem("ac_session");
}

// ── Auth: Email/Password Sign In ────────────────────────────
async function signInEmail(email, password) {
  const data = await sbFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(data);

  return data;
}

// ── Auth: Sign Up ───────────────────────────────────────────
async function signUpEmail(email, password, meta = {}) {
  const data = await sbFetch("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: meta }),
  });
  if (data.access_token) saveSession(data);
  return data;
}

// ── Auth: Reset Password ─────────────────────────────────────
async function resetPassword(email) {
  const data = await sbFetch("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({
      email,
      redirect_to: window.location.origin + "/reset-password.html",
    }),
  });
  return data;
}

// ── Auth: Update Password ────────────────────────────────────
async function updatePassword(newPassword) {
  const data = await sbFetch("/auth/v1/user", {
    method: "PUT",
    body: JSON.stringify({ password: newPassword }),
  });
    return data;
}
async function signOut() {
  try {
    await sbFetch("/auth/v1/logout", { method: "POST" });
  } catch (_) {}
  clearSession();
  window.location.href = "/login.html";
}

// ── Auth: Refresh token ─────────────────────────────────────
async function refreshSession() {
  const session = getSession();
  if (!session?.refresh_token) return null;
  try {
    const data = await sbFetch("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    saveSession(data);
    return data;
  } catch {
    clearSession();
    return null;
  }
}

// ── Guard: require login ────────────────────────────────────
async function requireAuth(adminOnly = false) {
  let session = getSession();
  if (!session) {
    window.location.href = "/login.html";
    return null;
  }
  // Refresh if expiring within 5 minutes
  const exp = session.expires_at || 0;
  if (Date.now() / 1000 > exp - 300) {
    session = await refreshSession();
    if (!session) {
      window.location.href = "/login.html";
      return null;
    }
  }
  if (adminOnly && !isAdmin()) {
    window.location.href = "/dashboard.html";
    return null;
  }
  return session;
}

// ── DB: Generic helpers ─────────────────────────────────────
async function dbSelect(table, query = "") {
  return sbFetch(`/rest/v1/${table}${query}`, {
    headers: { Prefer: "return=representation" },
  });
}
async function dbInsert(table, body, single = true) {
  return sbFetch(`/rest/v1/${table}`, {
    method: "POST",
    headers: {
      Prefer: single
        ? "return=representation,resolution=merge-duplicates"
        : "return=representation",
    },
    body: JSON.stringify(body),
  });
}
async function dbUpdate(table, match, body) {
  const query = Object.entries(match)
    .map(([k, v]) => `${k}=eq.${v}`)
    .join("&");
  return sbFetch(`/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
}
async function dbDelete(table, match) {
  const query = Object.entries(match)
    .map(([k, v]) => `${k}=eq.${v}`)
    .join("&");
  return sbFetch(`/rest/v1/${table}?${query}`, { method: "DELETE" });
}

// ── Storage: Upload file ────────────────────────────────────
async function uploadFile(bucket, path, file) {
  const token = getToken();
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: file,
    },
  );
  if (!res.ok) throw new Error("Upload failed");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ── Analytics: track event ──────────────────────────────────
async function trackEvent(table, payload) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
  } catch (_) {
    /* non-blocking */
  }
}

// ── UI Helpers ──────────────────────────────────────────────
function showToast(msg, type = "success") {
  let t = document.getElementById("_toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "_toast";
    t.style.cssText =
      "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 22px;border-radius:100px;font-size:13px;font-weight:600;z-index:9999;transition:opacity 0.3s;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.15)";
    document.body.appendChild(t);
  }
  t.style.background =
    type === "error" ? "#ef4444" : type === "warn" ? "#f59e0b" : "#22c55e";
  t.style.color = "#fff";
  t.style.opacity = "1";
  t.textContent = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = "0";
  }, 3000);
}

function setLoading(btn, loading, label = "Save") {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : label;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso) {
  if (!iso) return "";
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return formatDate(iso);
}

function initials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
