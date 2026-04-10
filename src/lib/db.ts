/**
 * Database driver abstraction.
 * Switch databases by setting the DB_DRIVER environment variable:
 *   DB_DRIVER=postgres  →  uses postgres-js
 *   DB_DRIVER=mysql     →  uses mysql2
 *   DB_DRIVER=sqlite    →  uses better-sqlite3  (default for local dev)
 */

import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import {
  pgItems,
  pgActivityLog,
  mysqlItems,
  mysqlActivityLog,
  sqliteItems,
  sqliteActivityLog,
} from "@/lib/schema";

export type DbDriver = "postgres" | "mysql" | "sqlite";

const driver = (process.env.DB_DRIVER ?? "sqlite") as DbDriver;

// Lazily initialised db singleton
let _db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleMysql> | ReturnType<typeof drizzleSqlite>;

function getDb() {
  if (_db) return _db;

  if (driver === "postgres") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres");
    const client = postgres(process.env.DATABASE_URL!, { ssl: process.env.DB_SSL === "true" ? "require" : undefined });
    _db = drizzlePg(client, { schema: { items: pgItems, activityLog: pgActivityLog } });
  } else if (driver === "mysql") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mysql = require("mysql2/promise");
    const pool = mysql.createPool(process.env.DATABASE_URL!);
    _db = drizzleMysql(pool, { schema: { items: mysqlItems, activityLog: mysqlActivityLog }, mode: "default" });
  } else {
    // SQLite default
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
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
