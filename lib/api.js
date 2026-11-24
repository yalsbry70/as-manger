import { localApi } from "./local-db";

/** Pure offline device-only mode (no Supabase sync). */
const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";

export function isOfflineApp() {
  return OFFLINE;
}

function loadCloud() {
  // eslint-disable-next-line global-require
  return require("./supabase").supabase;
}

/**
 * Shared database client.
 * - Web + Android (synced) → Supabase (one source of truth)
 * - OFFLINE=1 build only → local IndexedDB (no sync)
 */
export const sb = OFFLINE ? localApi : loadCloud();
