/**
 * Database migration script — creates tables if they don't exist.
 * Supports SQLite, PostgreSQL, and MySQL.
 *
 * Usage:
 *   DB_DRIVER=sqlite npx ts-node scripts/migrate.ts
 *   DB_DRIVER=postgres DATABASE_URL=... npx ts-node scripts/migrate.ts
 */

import "dotenv/config";

async function migrate() {
  const driver = (process.env.DB_DRIVER ?? "sqlite") as "postgres" | "mysql" | "sqlite";
  console.log(`Running migrations for driver: ${driver}`);

  if (driver === "sqlite") {
    const Database = require("better-sqlite3");
    const dbPath = process.env.SQLITE_PATH ?? "./local.db";
    const sqlite = new Database(dbPath);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        assignee TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        updated_by TEXT,
        pinned INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        detail TEXT,
        actor TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    sqlite.close();
    console.log(`SQLite database ready at: ${dbPath}`);
  } else if (driver === "postgres") {
    const postgres = require("postgres");
    const sql = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.DB_SSL === "true" ? "require" : undefined,
    });

    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        priority VARCHAR(10) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        assignee VARCHAR(50),
        created_by VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by VARCHAR(50),
        pinned BOOLEAN DEFAULT FALSE
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES items(id) ON DELETE CASCADE,
        action VARCHAR(20) NOT NULL,
        detail TEXT,
        actor VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql.end();
    console.log("PostgreSQL tables ready.");
  } else if (driver === "mysql") {
    const mysql = require("mysql2/promise");
    const conn = await mysql.createConnection(process.env.DATABASE_URL!);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id CHAR(36) PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        priority VARCHAR(10) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        assignee VARCHAR(50),
        created_by VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT NOW(),
        updated_at DATETIME DEFAULT NOW(),
        updated_by VARCHAR(50),
        pinned TINYINT(1) DEFAULT 0
      );
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id CHAR(36) PRIMARY KEY,
        item_id CHAR(36),
        action VARCHAR(20) NOT NULL,
        detail TEXT,
        actor VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT NOW()
      );
    `);
    await conn.end();
    console.log("MySQL tables ready.");
  }

  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
