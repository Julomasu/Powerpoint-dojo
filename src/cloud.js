// Compte + synchronisation de la progression, par l'API REST de Supabase (sans bibliothèque).
// Connexion par e-mail + mot de passe : pas de lien à ouvrir, donc ça marche aussi dans le volet d'Excel.
import { CLOUD } from "./config.js";
import { getProgress, mergeProgress, replaceProgress } from "./progress.js";

const SESSION_KEY = "powerpoint-dojo.session";
const listeners = new Set();
let status = { state: "off", msg: "" }; // off | out | syncing | ok | error
let timer = null;

export const cloudEnabled = () => !!(CLOUD.url && CLOUD.key);
export const getStatus = () => status;
export const onStatus = (fn) => listeners.add(fn);
const setStatus = (state, msg = "") => {
  status = { state, msg };
  listeners.forEach((fn) => fn(status));
};

const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};
const saveSession = (s) => {
  try {
    s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY);
  } catch {
    /* pas de stockage : il faudra se reconnecter */
  }
};
export const getSession = () => loadSession();
export const userEmail = () => loadSession()?.user?.email ?? "";

async function call(path, { method = "GET", body, token, headers = {} } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 12000);
  try {
    const res = await fetch(CLOUD.url.replace(/\/$/, "") + path, {
      method,
      signal: ctl.signal,
      headers: { apikey: CLOUD.key, Authorization: `Bearer ${token ?? CLOUD.key}`, "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw Object.assign(new Error(json?.msg || json?.error_description || json?.message || `Erreur ${res.status}`), { status: res.status, code: json?.error_code || json?.code });
    return json;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Le serveur ne répond pas (vérifie ta connexion).");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

const friendly = (e) => {
  const m = String(e.message || e);
  if (/invalid login/i.test(m)) return "E-mail ou mot de passe incorrect.";
  if (/already registered|already been registered/i.test(m)) return "Un compte existe déjà avec cet e-mail : connecte-toi.";
  if (/password.*(short|least|6)/i.test(m)) return "Le mot de passe doit faire au moins 6 caractères.";
  if (/email.*(invalid|valid)/i.test(m)) return "Cet e-mail n'est pas valide.";
  if (/rate limit|too many/i.test(m)) return "Trop d'essais : attends une minute.";
  if (/failed to fetch|network/i.test(m)) return "Pas de connexion à Internet, ou le serveur est bloqué sur ce réseau.";
  return m;
};

const toSession = (r) => ({
  access_token: r.access_token,
  refresh_token: r.refresh_token,
  expires_at: r.expires_at ?? Math.floor(Date.now() / 1000) + (r.expires_in ?? 3600),
  user: { id: r.user?.id, email: r.user?.email },
});

async function token() {
  let s = loadSession();
  if (!s) throw new Error("Pas connecté");
  if (s.expires_at - 60 < Date.now() / 1000) {
    const r = await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.refresh_token } });
    s = toSession(r);
    saveSession(s);
  }
  return s;
}

export async function signUp(email, password) {
  try {
    const r = await call("/auth/v1/signup", { method: "POST", body: { email, password } });
    if (!r?.access_token) return { needsConfirm: true };
    saveSession(toSession(r));
    await syncNow();
    return {};
  } catch (e) {
    throw new Error(friendly(e));
  }
}

export async function signIn(email, password) {
  try {
    const r = await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
    saveSession(toSession(r));
    await syncNow();
  } catch (e) {
    throw new Error(friendly(e));
  }
}

export function signOut() {
  saveSession(null);
  setStatus(cloudEnabled() ? "out" : "off");
}

// Récupère la progression du compte, la fusionne avec celle de cet appareil, puis envoie le résultat.
export async function syncNow() {
  if (!cloudEnabled()) return setStatus("off");
  if (!loadSession()) return setStatus("out");
  setStatus("syncing");
  try {
    const s = await token();
    const rows = await call(`/rest/v1/${CLOUD.table}?select=data&user_id=eq.${s.user.id}`, { token: s.access_token });
    const remote = rows?.[0]?.data;
    const merged = mergeProgress(getProgress(), remote && remote.done ? remote : null);
    replaceProgress(merged);
    await call(`/rest/v1/${CLOUD.table}?on_conflict=user_id`, {
      method: "POST",
      token: s.access_token,
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: { user_id: s.user.id, data: merged, updated_at: new Date().toISOString() },
    });
    setStatus("ok", `Synchronisé à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (e) {
    setStatus("error", friendly(e));
  }
}

// Après chaque exercice réussi : envoi différé (regroupe plusieurs réussites rapprochées)
export function schedulePush() {
  if (!cloudEnabled() || !loadSession()) return;
  clearTimeout(timer);
  timer = setTimeout(syncNow, 1500);
}

export function init() {
  setStatus(!cloudEnabled() ? "off" : loadSession() ? "syncing" : "out");
  if (cloudEnabled() && loadSession()) syncNow();
}
