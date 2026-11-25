const DB_NAME = "ac-manager-local";
const DB_VER = 1;
const AUTH_KEY = "ac-manager-auth";
const SESSION_KEY = "ac-manager-session";

const BRANDS = [
  ["جري", 10], ["إل جي", 20], ["سامسونج", 30], ["ميديا", 40], ["كارير", 50],
  ["أو جنرال", 60], ["جنرال", 70], ["هايسنس", 80], ["شارب", 90], ["هاير", 100],
  ["توشيبا", 110], ["هيتاشي", 120], ["دايكن", 130], ["ترين", 140], ["يورك", 150],
  ["باناسونيك", 160], ["ميتسوبيشي", 170], ["فوجيتسو", 180], ["وايت ويل", 190],
  ["سوبر جنرال", 200], ["أكسن", 210], ["نيكاي", 220], ["جولدي", 230], ["فريش", 240], ["زامل", 250],
];
const AC_TYPES = [
  ["سبليت", 10], ["شباك", 20], ["دولابي", 30], ["كاسيت", 40], ["مخفي", 50],
  ["مركزي", 60], ["باكج", 70], ["صحراوي", 80], ["متنقل", 90],
];

const STORES = [
  "customers", "engineers", "jobs", "customer_payments", "engineer_payments", "brands", "ac_types",
];

let dbPromise;

function uid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };
    req.onsuccess = async () => {
      const db = req.result;
      await seedIfEmpty(db);
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("aborted"));
  });
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function seedIfEmpty(db) {
  const count = await reqToPromise(db.transaction("brands", "readonly").objectStore("brands").count());
  if (count > 0) return;
  const tx = db.transaction(["brands", "ac_types"], "readwrite");
  for (const [name, sort] of BRANDS) {
    tx.objectStore("brands").put({ id: uid(), name, sort });
  }
  for (const [name, sort] of AC_TYPES) {
    tx.objectStore("ac_types").put({ id: uid(), name, sort });
  }
  await txDone(tx);
}

async function getAll(store) {
  const db = await openDb();
  return reqToPromise(db.transaction(store, "readonly").objectStore(store).getAll());
}

async function put(store, row) {
  const db = await openDb();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(row);
  await txDone(tx);
  return row;
}

async function putMany(store, rows) {
  const db = await openDb();
  const tx = db.transaction(store, "readwrite");
  for (const row of rows) tx.objectStore(store).put(row);
  await txDone(tx);
  return rows;
}

function n(v) {
  return Number(v || 0);
}

function addMonths(dateStr, months) {
  if (!dateStr || !months) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + n(months));
  return d.toISOString().slice(0, 10);
}

async function buildJobFinancials() {
  const [jobs, payments] = await Promise.all([getAll("jobs"), getAll("customer_payments")]);
  const paidMap = {};
  for (const p of payments) {
    paidMap[p.job_id] = (paidMap[p.job_id] || 0) + n(p.amount);
  }
  return jobs
    .filter((j) => !j.deleted_at)
    .map((j) => {
      const paid = Math.round((paidMap[j.id] || 0) * 100) / 100;
      const price = n(j.price);
      const engineer_fee = n(j.engineer_fee);
      const materials_cost = n(j.materials_cost);
      const remaining = Math.round((price - paid) * 100) / 100;
      const profit = Math.round((price - engineer_fee - materials_cost) * 100) / 100;
      return {
        ...j,
        paid,
        remaining,
        profit,
        warranty_until: addMonths(j.job_date, j.warranty_months),
      };
    });
}

function sortRows(rows, orders) {
  const list = [...rows];
  list.sort((a, b) => {
    for (const { col, asc } of orders) {
      const av = a[col];
      const bv = b[col];
      if (av == null && bv == null) continue;
      if (av == null) return asc ? 1 : -1;
      if (bv == null) return asc ? -1 : 1;
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
    }
    return 0;
  });
  return list;
}

class Query {
  constructor(table) {
    this.table = table;
    this._filters = [];
    this._orders = [];
    this._op = "select";
    this._payload = null;
    this._wantSingle = false;
    this._doSelect = false;
  }

  select() {
    this._op = this._op === "insert" || this._op === "update" ? this._op : "select";
    this._doSelect = true;
    return this;
  }

  insert(row) {
    this._op = "insert";
    this._payload = row;
    return this;
  }

  update(row) {
    this._op = "update";
    this._payload = row;
    return this;
  }

  eq(col, val) {
    this._filters.push({ col, val });
    return this;
  }

  order(col, opts = {}) {
    this._orders.push({ col, asc: opts.ascending !== false });
    return this;
  }

  single() {
    this._wantSingle = true;
    return this;
  }

  then(resolve, reject) {
    return this._run().then(resolve, reject);
  }

  async _run() {
    try {
      if (this._op === "insert") return this._insert();
      if (this._op === "update") return this._update();
      return this._select();
    } catch (error) {
      return { data: null, error };
    }
  }

  async _select() {
    let rows;
    if (this.table === "job_financials") rows = await buildJobFinancials();
    else rows = await getAll(this.table);

    for (const f of this._filters) {
      rows = rows.filter((r) => r[f.col] === f.val);
    }
    if (this._orders.length) rows = sortRows(rows, this._orders);

    if (this.table === "brands" || this.table === "ac_types") {
      // keep as-is
    } else if (this.table === "engineer_payments") {
      // keep
    }

    if (this._wantSingle) {
      if (!rows.length) return { data: null, error: { message: "not found" } };
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null };
  }

  async _insert() {
    const rowsIn = Array.isArray(this._payload) ? this._payload : [this._payload];
    const saved = [];
    for (const raw of rowsIn) {
      const row = {
        ...raw,
        id: raw.id || uid(),
        created_at: raw.created_at || nowIso(),
      };
      await put(this.table, row);
      saved.push(row);
    }
    if (this._doSelect) {
      if (this._wantSingle) return { data: saved[0], error: null };
      return { data: saved, error: null };
    }
    return { data: null, error: null };
  }

  async _update() {
    let rows = await getAll(this.table);
    for (const f of this._filters) {
      rows = rows.filter((r) => r[f.col] === f.val);
    }
    if (!rows.length) return { data: null, error: { message: "not found" } };
    const updated = rows.map((r) => ({ ...r, ...this._payload, id: r.id }));
    await putMany(this.table, updated);
    if (this._doSelect) {
      if (this._wantSingle) return { data: updated[0], error: null };
      return { data: updated, error: null };
    }
    return { data: null, error: null };
  }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const authListeners = new Set();

function emitAuth(session) {
  for (const fn of authListeners) fn("LOCAL", session);
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  emitAuth(session);
}

export const localApi = {
  from(table) {
    return new Query(table);
  },
  auth: {
    async getSession() {
      await openDb();
      let session = readSession();
      if (session?.user?.email) {
        try {
          const raw = localStorage.getItem(AUTH_KEY);
          if (raw) {
            const saved = JSON.parse(raw);
            session = { user: { email: saved.email, user_metadata: saved.meta || {} } };
            writeSession(session);
          }
        } catch (_) { /* keep existing session */ }
      }
      return { data: { session }, error: null };
    },
    onAuthStateChange(cb) {
      authListeners.add(cb);
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(cb);
            },
          },
        },
      };
    },
    async signInWithPassword({ email, password }) {
      await openDb();
      const hash = await sha256(String(password));
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email: String(email).trim().toLowerCase(), hash, meta: {} }));
        const session = { user: { email: String(email).trim().toLowerCase(), user_metadata: {} } };
        writeSession(session);
        return { data: { session }, error: null };
      }
      const saved = JSON.parse(raw);
      if (saved.email !== String(email).trim().toLowerCase() || saved.hash !== hash) {
        return { data: { session: null }, error: { message: "invalid" } };
      }
      const session = { user: { email: saved.email, user_metadata: saved.meta || {} } };
      writeSession(session);
      return { data: { session }, error: null };
    },
    async signOut() {
      writeSession(null);
      return { error: null };
    },
    async updateUser({ email, password, data } = {}) {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return { data: { user: null }, error: { message: "لا يوجد حساب محلي" } };
      const saved = JSON.parse(raw);
      const next = { ...saved, meta: { ...(saved.meta || {}) } };
      if (email) next.email = String(email).trim().toLowerCase();
      if (password) next.hash = await sha256(String(password));
      if (data && typeof data === "object") next.meta = { ...next.meta, ...data };
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      const session = { user: { email: next.email, user_metadata: next.meta || {} } };
      writeSession(session);
      return { data: { user: session.user }, error: null };
    },
  },
};

export async function ensureLocalDb() {
  await openDb();
}
