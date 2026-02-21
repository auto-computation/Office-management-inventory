
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

async function migrate() {
  try {
    console.log('Adding image_url column to products table...');
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;");
    console.log('Column image_url added successfully.');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await pool.end();
  }
}

migrate();
