import pool from "../db/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
  try {
    const sqlPath = path.join(__dirname, "../db/09_add_proof_of_payment.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log("Migration completed successfully for proof_of_payment!");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Migration failed.", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
