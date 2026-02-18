import pool from "./db/db.js";
import matchPassword from "./utils/matchPassword.js";

async function debugAuth() {
  try {
    const email = "kotalsujay8@gmail.com";
    const password = "password123";

    console.log(`Checking user: ${email}`);
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      console.log("User not found!");
    } else {
      const user = result.rows[0];
      console.log("User found:", {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        password_hash: user.password_hash.substring(0, 20) + "...",
      });

      const isMatch = await matchPassword(password, user.password_hash);
      console.log(`Password '${password}' match result: ${isMatch}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

debugAuth();
