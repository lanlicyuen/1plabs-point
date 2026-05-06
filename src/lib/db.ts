/**
 * Database driver abstraction.
 * Switch databases by setting the DB_DRIVER environment variable:
 *   DB_DRIVER=postgres  →  uses postgres-js
 *   DB_DRIVER=mysql     →  uses mysql2
 *   DB_DRIVER=sqlite    →  uses better-sqlite3 as an explicit dev fallback
 */

import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { createRequire } from "node:module";
import {
  pgItems,
  pgActivityLog,
  mysqlItems,
  mysqlActivityLog,
  sqliteItems,
  sqliteActivityLog,
} from "@/lib/schema";

export type DbDriver = "postgres" | "mysql" | "sqlite";

export const driver = (process.env.DB_DRIVER ?? "postgres") as DbDriver;

// Lazily initialised db singleton
let _db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleMysql> | unknown;

function requireDatabaseUrl(selectedDriver: DbDriver) {
  if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL is required when DB_DRIVER=${selectedDriver}`);
  }
  return process.env.DATABASE_URL;
}

function requireDevFallbackPackage(packageName: string) {
  // Keep native SQLite packages out of the production standalone trace.
  const runtimeRequire = createRequire(process.cwd() + "/package.json");
  return runtimeRequire(packageName);
}

function getDb() {
  if (_db) return _db;

  if (driver === "postgres") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres");
    const client = postgres(requireDatabaseUrl("postgres"), {
      ssl: process.env.DB_SSL === "true" ? "require" : undefined,
    });
    _db = drizzlePg(client, { schema: { items: pgItems, activityLog: pgActivityLog } });
  } else if (driver === "mysql") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mysql = require("mysql2/promise");
    const pool = mysql.createPool(requireDatabaseUrl("mysql"));
    _db = drizzleMysql(pool, { schema: { items: mysqlItems, activityLog: mysqlActivityLog }, mode: "default" });
  } else {
    // SQLite is a dev fallback. Keep the native module out of the production
    // Postgres path by loading it only when DB_DRIVER=sqlite.
    const { drizzle: drizzleSqlite } = requireDevFallbackPackage("drizzle-orm/better-sqlite3");
    const Database = requireDevFallbackPackage("better-sqlite3");
    const dbPath = process.env.SQLITE_PATH ?? "./local.db";
    const sqlite = new Database(dbPath);
    _db = drizzleSqlite(sqlite, { schema: { items: sqliteItems, activityLog: sqliteActivityLog } });
  }

  return _db;
}

/** Drizzle db instance (driver-agnostic) */
export const db = new Proxy({} as ReturnType<typeof drizzlePg>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** Tables for the active driver */
export function getTables() {
  if (driver === "postgres") return { items: pgItems, activityLog: pgActivityLog };
  if (driver === "mysql") return { items: mysqlItems, activityLog: mysqlActivityLog };
  return { items: sqliteItems, activityLog: sqliteActivityLog };
}
