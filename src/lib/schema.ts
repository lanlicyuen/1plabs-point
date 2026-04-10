import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  mysqlTable,
  varchar as mysqlVarchar,
  text as mysqlText,
  boolean as mysqlBoolean,
  datetime,
  char,
} from "drizzle-orm/mysql-core";
import {
  sqliteTable,
  text as sqliteText,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

// ─── PostgreSQL Schema ──────────────────────────────────────────────────────

export const pgItems = pgTable("items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 20 }).notNull(), // decision / progress / blocker / announcement
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  priority: varchar("priority", { length: 10 }).default("normal"), // urgent / high / normal / low
  status: varchar("status", { length: 20 }).default("pending"), // pending / active / done / archived
  assignee: varchar("assignee", { length: 50 }),
  createdBy: varchar("created_by", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`NOW()`
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(
    sql`NOW()`
  ),
  updatedBy: varchar("updated_by", { length: 50 }),
  pinned: boolean("pinned").default(false),
});

export const pgActivityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: uuid("item_id").references(() => pgItems.id, {
    onDelete: "cascade",
  }),
  action: varchar("action", { length: 20 }).notNull(), // created / updated / status_changed / archived
  detail: text("detail"),
  actor: varchar("actor", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`NOW()`
  ),
});

// ─── MySQL Schema ────────────────────────────────────────────────────────────

export const mysqlItems = mysqlTable("items", {
  id: char("id", { length: 36 }).primaryKey(),
  type: mysqlVarchar("type", { length: 20 }).notNull(),
  title: mysqlVarchar("title", { length: 200 }).notNull(),
  content: mysqlText("content"),
  priority: mysqlVarchar("priority", { length: 10 }).default("normal"),
  status: mysqlVarchar("status", { length: 20 }).default("pending"),
  assignee: mysqlVarchar("assignee", { length: 50 }),
  createdBy: mysqlVarchar("created_by", { length: 50 }).notNull(),
  createdAt: datetime("created_at").default(sql`NOW()`),
  updatedAt: datetime("updated_at").default(sql`NOW()`),
  updatedBy: mysqlVarchar("updated_by", { length: 50 }),
  pinned: mysqlBoolean("pinned").default(false),
});

export const mysqlActivityLog = mysqlTable("activity_log", {
  id: char("id", { length: 36 }).primaryKey(),
  itemId: char("item_id", { length: 36 }),
  action: mysqlVarchar("action", { length: 20 }).notNull(),
  detail: mysqlText("detail"),
  actor: mysqlVarchar("actor", { length: 50 }).notNull(),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

// ─── SQLite Schema ───────────────────────────────────────────────────────────

export const sqliteItems = sqliteTable("items", {
  id: sqliteText("id").primaryKey(),
  type: sqliteText("type").notNull(),
  title: sqliteText("title").notNull(),
  content: sqliteText("content"),
  priority: sqliteText("priority").default("normal"),
  status: sqliteText("status").default("pending"),
  assignee: sqliteText("assignee"),
  createdBy: sqliteText("created_by").notNull(),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`),
  updatedAt: sqliteText("updated_at").default(sql`(datetime('now'))`),
  updatedBy: sqliteText("updated_by"),
  pinned: integer("pinned", { mode: "boolean" }).default(false),
});

export const sqliteActivityLog = sqliteTable("activity_log", {
  id: sqliteText("id").primaryKey(),
  itemId: sqliteText("item_id").references(() => sqliteItems.id, {
    onDelete: "cascade",
  }),
  action: sqliteText("action").notNull(),
  detail: sqliteText("detail"),
  actor: sqliteText("actor").notNull(),
  createdAt: sqliteText("created_at").default(sql`(datetime('now'))`),
});

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type ItemType = "decision" | "progress" | "blocker" | "announcement";
export type ItemPriority = "urgent" | "high" | "normal" | "low";
export type ItemStatus = "pending" | "active" | "done" | "archived";
export type ActionType = "created" | "updated" | "status_changed" | "archived";

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  content: string | null;
  priority: ItemPriority;
  status: ItemStatus;
  assignee: string | null;
  createdBy: string;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  updatedBy: string | null;
  pinned: boolean;
}

export interface ActivityLog {
  id: string;
  itemId: string | null;
  action: ActionType;
  detail: string | null;
  actor: string;
  createdAt: string | Date | null;
}
