import pool from "../db/db.js";
import dotenv from "dotenv";
dotenv.config();

const checkUsers = async () => {
  try {
    console.log("Checking users table columns...");
    const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY column_name;
        `);
    console.log(
      "Columns:",
      res.rows.map((r) => r.column_name),
    );
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    await pool.end();
  }
};

checkUsers();
