import type { Config } from "drizzle-kit";

const driver = (process.env.DB_DRIVER ?? "sqlite") as "postgres" | "mysql" | "sqlite";

const configs: Record<"postgres" | "mysql" | "sqlite", Config> = {
  postgres: {
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL ?? "",
    },
  },
  mysql: {
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    dialect: "mysql",
    dbCredentials: {
      url: process.env.DATABASE_URL ?? "",
    },
  },
  sqlite: {
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    dialect: "sqlite",
    dbCredentials: {
      url: process.env.SQLITE_PATH ?? "./local.db",
    },
  },
};

export default configs[driver];
