import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

const { Pool } = pg;

let connection: pg.Pool;

if (
  process.env.NEXT_PUBLIC_APP_ENV === "production" ||
  process.env.NEXT_PUBLIC_APP_ENV === "staging"
) {
  connection = new Pool({
    connectionString: process.env.DATABASE_URL + "?sslmode=require",
    max: 1,
  });
} else {
  const globalConnection = global as typeof globalThis & {
    connection: pg.Pool;
  };

  globalConnection.connection = new Pool({
    connectionString: process.env.DATABASE_URL + "?sslmode=require",
    max: 20,
  });

  connection = globalConnection.connection;
}

const db = drizzle(connection, {
  schema,
  logger:
    process.env.NEXT_PUBLIC_APP_ENV === "development" &&
    process.env.LOG_SQL_QUERIES === "true",
});

export * from "./schema";
export { db };
