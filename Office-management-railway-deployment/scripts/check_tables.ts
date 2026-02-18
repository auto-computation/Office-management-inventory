import pool from "../db/db.js";
import dotenv from "dotenv";
dotenv.config();

const checkTables = async () => {
  try {
    console.log("Checking tables in database...");
    const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
    console.log(
      "Tables found:",
      res.rows.map((r) => r.table_name),
    );
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    await pool.end();
  }
};

checkTables();
