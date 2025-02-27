import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const { Pool } = pg;

const migrateDB = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL + "?sslmode=require",
  });
  const db = drizzle(pool);
  console.log("Migrating database...");
  await migrate(db, {
    migrationsFolder: "./src/migrations",
  });
  console.log("Database migrated successfully!");
  await pool.end();
  process.exit(0);
};

migrateDB().catch((err) => {
  console.error(err);
  process.exit(1);
});
