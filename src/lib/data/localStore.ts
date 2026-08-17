// Generic localStorage-backed table store for Demo Mode (src/lib/demoMode.ts).
// Every per-user data module (shelf.ts, customProducts.ts, etc.) reads/writes
// through this instead of Supabase when isDemoModeActive() — one shared
// implementation instead of bespoke local logic in each file. Each "table"
// is a JSON array under its own localStorage key; matching is a plain
// key/value predicate object, mirroring the small subset of Supabase's
// .eq()-style filtering these modules actually use.

const STORAGE_PREFIX = "skingredient:demo:";

// Every key this module ever writes — clearLocalTables() (called by the
// demo "Reset" flow) wipes exactly these, nothing else in localStorage.
const KNOWN_TABLES = [
  "shelf_items",
  "custom_products",
  "ingredient_reactions",
  "product_reactions",
  "daily_checkins",
  "routine_items",
  "profiles",
  "skin_analyses",
] as const;

type TableName = (typeof KNOWN_TABLES)[number];

function readTable<T>(table: TableName): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_PREFIX + table);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeTable<T>(table: TableName, rows: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(rows));
}

function matches<T extends object>(row: T, match: Partial<T>): boolean {
  const r = row as Record<string, unknown>;
  return Object.entries(match).every(([key, value]) => r[key] === value);
}

export function getLocalRows<T extends object>(
  table: TableName,
  match?: Partial<T>,
): T[] {
  const rows = readTable<T>(table);
  return match ? rows.filter((row) => matches(row, match)) : rows;
}

/** Appends one row as-is — callers are responsible for generating any id. */
export function insertLocalRow<T extends object>(table: TableName, row: T): T {
  const rows = readTable<T>(table);
  rows.push(row);
  writeTable(table, rows);
  return row;
}

/** Upserts by `match`: patches every row matching `match` if any exist,
 * otherwise inserts `{ ...match, ...patch }` as a new row. */
export function upsertLocalRow<T extends object>(
  table: TableName,
  match: Partial<T>,
  patch: Partial<T>,
): T {
  const rows = readTable<T>(table);
  const existing = rows.find((row) => matches(row, match));
  if (existing) {
    Object.assign(existing, patch);
    writeTable(table, rows);
    return existing;
  }
  const created = { ...match, ...patch } as T;
  rows.push(created);
  writeTable(table, rows);
  return created;
}

export function updateLocalRows<T extends object>(
  table: TableName,
  match: Partial<T>,
  patch: Partial<T>,
): void {
  const rows = readTable<T>(table);
  for (const row of rows) {
    if (matches(row, match)) Object.assign(row, patch);
  }
  writeTable(table, rows);
}

export function deleteLocalRows<T extends object>(
  table: TableName,
  match: Partial<T>,
): void {
  const rows = readTable<T>(table).filter((row) => !matches(row, match));
  writeTable(table, rows);
}

/** Demo "Reset" — wipes every known local table, same effect as
 * resetDemoUser() does against real Supabase (src/lib/data/demoUser.ts). */
export function clearLocalTables(): void {
  if (typeof window === "undefined") return;
  for (const table of KNOWN_TABLES) {
    window.localStorage.removeItem(STORAGE_PREFIX + table);
  }
}
