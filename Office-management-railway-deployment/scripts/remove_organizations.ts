import pool from "../db/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, "../db/04_remove_organizations.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Running migration: 04_remove_organizations.sql");
    await pool.query(sql);
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit();
  }
}

migrate();
