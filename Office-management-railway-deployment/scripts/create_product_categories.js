
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'office_app',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number(process.env.DB_PORT) || 5432,
});

const createTable = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL
      );
    `);
    console.log('Table product_categories created or already exists.');

    // Insert default category
    await client.query(`
      INSERT INTO product_categories (name)
      VALUES ('Others')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('Default category "Others" added.');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating product_categories table:', error);
  } finally {
    client.release();
    pool.end();
  }
};

createTable();
