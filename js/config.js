// Connection settings. The keys below are designed to be public (they only identify the project).
// Accounts and saved files live in the Forge project. Product, domain and exchange-rate lookups
// still use the earlier project until they are moved across.
const w = typeof window !== "undefined" ? window : {};
const demo = w.__FORGE_DEMO__ === true || (w.location && new URLSearchParams(w.location.search).has("demo"));
const fake = w.__FORGE_FAKE_BACKEND__ === true; // tests only
export const CONFIG = {
  supabaseUrl: "https://pmyfswozvkdpqgnsiibf.supabase.co",
  publishableKey: "sb_publishable_RrciEiRwRPkbU6yO6wt8Zg_BI0tSYEW",
  authUrl: "https://xskysylnkjpsgqapqwyx.supabase.co",
  authKey: "sb_publishable__5U4rijp1Y_6O9BmOHv17w_COWOzOwn",
  // Sample-data preview. On with ?demo in the address, or when the page sets window.__FORGE_DEMO__.
  demo,
  fake,
  // Accounts are real unless this is the sample-data preview.
  live: !demo,
  // Test tools: buttons that play Forge's side on a real file. They only appear for accounts listed in the
  // test_accounts table. Set this to false (and empty that table) to switch them off for good.
  testTools: true,
  productPageSize: 24,
  requestTimeoutMs: 15000,
};
