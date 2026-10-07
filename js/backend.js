// Picks the real service, or the test stand-in. The sample-data preview has no service at all.
import { CONFIG } from "./config.js";

let impl = null;
export async function loadBackend() {
  if (impl) return impl;
  const mod = CONFIG.fake ? await import("./backend-local.js") : await import("./backend-supabase.js");
  impl = { ...mod.backend, takeLinkError: mod.takeLinkError };
  return impl;
}
