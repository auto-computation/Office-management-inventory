import pool from "../db/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

// Get current directory name (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
  try {
    console.log("Pool config:", {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const sqlPath = path.join(__dirname, "../db/03_projects_migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Starting Project Management Migration...");
    console.log(`Reading SQL from: ${sqlPath}`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log("Migration completed successfully!");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Migration failed. Rolled back changes.");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
