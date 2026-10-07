// The real account and storage service. Everything the screens need from the server is here.
import { createClient } from "./vendor/supabase.js";
import { CONFIG } from "./config.js";

const sb = createClient(CONFIG.authUrl, CONFIG.authKey, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const MESSAGES = {
  invalid_credentials: "The email or password is not right.",
  email_not_confirmed: "Confirm your email first. We sent you a link when you joined.",
  user_already_exists: "An account with this email already exists. Log in instead.",
  weak_password: "Choose a stronger password: at least 8 characters.",
  over_email_send_rate_limit: "Too many emails were sent. Wait a few minutes and try again.",
  over_request_rate_limit: "Too many tries. Wait a few minutes and try again.",
  same_password: "Choose a password you have not used before.",
  email_address_invalid: "Enter a valid email address.",
};
function friendly(error) {
  if (!error) return "";
  if (MESSAGES[error.code]) return MESSAGES[error.code];
  const m = String(error.message || "");
  if (/failed to fetch|network/i.test(m)) return "Could not reach Forge. Check your internet and try again.";
  if (/invalid login/i.test(m)) return MESSAGES.invalid_credentials;
  if (/already registered/i.test(m)) return MESSAGES.user_already_exists;
  return "Something went wrong. Try again in a moment.";
}
const fail = (error) => { throw new Error(friendly(error)); };
const here = () => window.location.origin + window.location.pathname;

// A failed confirmation or reset link comes back as #error=...&error_description=...
export function takeLinkError() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!/(^|&)error=/.test(raw) && !/(^|&)error_code=/.test(raw)) return "";
  const p = new URLSearchParams(raw.startsWith("/") ? raw.split("?")[1] || "" : raw);
  const code = p.get("error_code") || "";
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  if (code === "otp_expired") return "That link has expired or was already used. Ask for a new one.";
  return "That link did not work. Ask for a new one.";
}

export const backend = {
  async init() {
    const { data } = await sb.auth.getSession();
    return data.session ? { id: data.session.user.id, email: data.session.user.email } : null;
  },
  onAuth(cb) {
    sb.auth.onAuthStateChange((event, session) => {
      // Called outside the auth lock so a handler may call the server again.
      window.setTimeout(() => cb(event, session ? { id: session.user.id, email: session.user.email } : null), 0);
    });
  },
  async signUp(email, password, name) {
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: here(), data: { full_name: name || "" } } });
    if (error) fail(error);
    // An address that is already registered returns a user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error(MESSAGES.user_already_exists);
    return { needsConfirm: !data.session };
  },
  async signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) fail(error);
  },
  async signOut() {
    await sb.auth.signOut();
  },
  async sendReset(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: here() });
    if (error && error.code !== "user_not_found") fail(error);
  },
  async updatePassword(password) {
    const { error } = await sb.auth.updateUser({ password });
    if (error) fail(error);
  },
  async loadFile(userId) {
    const { data, error } = await sb.from("business_files").select("owner_data, staff_data").eq("user_id", userId).maybeSingle();
    if (error) throw new Error("Could not load your file.");
    if (data) return data;
    const ins = await sb.from("business_files").insert({ user_id: userId, owner_data: {} });
    if (ins.error && ins.error.code !== "23505") throw new Error("Could not create your file.");
    return { owner_data: {}, staff_data: {} };
  },
  async saveOwner(userId, ownerData) {
    const { error } = await sb.from("business_files").update({ owner_data: ownerData }).eq("user_id", userId);
    if (error) throw new Error("save failed");
  },
  // The Forge team updates a file: tell the open page. Returns an unsubscribe function.
  watchFile(userId, cb) {
    const ch = sb
      .channel("file-" + userId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "business_files", filter: "user_id=eq." + userId }, (p) => cb(p.new))
      .subscribe();
    return () => sb.removeChannel(ch);
  },
  async upload(userId, slot, file) {
    const ext = ({ "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" })[file.type] || "bin";
    const path = `${userId}/${slot}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("documents").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error("The file could not be uploaded. Check your internet and try again.");
    return path;
  },
  async removeUpload(path) {
    if (path) await sb.storage.from("documents").remove([path]);
  },
  // ---- Forge team only. The database refuses all of these for anyone who is not on the team. ----
  async isStaff() {
    const { data, error } = await sb.rpc("is_staff");
    return !error && data === true;
  },
  async listFiles() {
    const { data, error } = await sb.from("business_files").select("user_id, owner_data, staff_data, updated_at").order("updated_at", { ascending: false });
    if (error) throw new Error("Could not load the files.");
    return data || [];
  },
  async staffPatch(userId, patch) {
    const { data, error } = await sb.rpc("staff_patch_file", { p_user: userId, p_patch: patch });
    if (error) throw new Error("Could not save. You may not have permission.");
    return data;
  },
  async documentUrl(path) {
    const { data, error } = await sb.storage.from("documents").createSignedUrl(path, 300);
    if (error || !data) throw new Error("Could not open the document.");
    return data.signedUrl;
  },
};
