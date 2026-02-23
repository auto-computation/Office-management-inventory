import pool from "../db/db.js";

const createTable = async () => {
  // @ts-ignore
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL
      );
    `);
    console.log("Table product_categories created or already exists.");

    // Insert default category
    await client.query(`
      INSERT INTO product_categories (name)
      VALUES ('Others')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('Default category "Others" added.');

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating product_categories table:", error);
  } finally {
    client.release();
    process.exit();
  }
};

createTable();
