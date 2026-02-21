
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkCategories() {
  try {
    console.log('Checking product_categories table...');
    const res = await pool.query("SELECT * FROM product_categories");
    console.log(`Found ${res.rows.length} categories.`);
    console.table(res.rows);
  } catch (error) {
    console.error('Error querying categories:', error);
  } finally {
    await pool.end();
  }
}

checkCategories();
