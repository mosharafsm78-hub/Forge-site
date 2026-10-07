// Picks the real service, or the test stand-in. The sample-data preview has no service at all.
import { CONFIG } from "./config.js?v=1791374586";

let impl = null;
export async function loadBackend() {
  if (impl) return impl;
  const mod = CONFIG.fake ? await import("./backend-local.js?v=1791374586") : await import("./backend-supabase.js?v=1791374586");
  impl = { ...mod.backend, takeLinkError: mod.takeLinkError };
  return impl;
}
