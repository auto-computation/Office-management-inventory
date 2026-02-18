import pool from "../db/db.js";
import dotenv from "dotenv";
dotenv.config();

const fixPhase1 = async () => {
  const client = await pool.connect();
  try {
    console.log("Starting Phase 1 Fix Migration...");
    await client.query("BEGIN");

    // 1. Create organizations table if not exists
    console.log("Creating organizations table...");
    await client.query(`
            CREATE TABLE IF NOT EXISTS organizations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subdomain VARCHAR(100) UNIQUE NOT NULL,
                logo_url TEXT,
                subscription_status VARCHAR(50) DEFAULT 'trial',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    // 2. Insert default organization if not exists
    console.log("Inserting default organization...");
    const orgRes = await client.query(`
            INSERT INTO organizations (name, subdomain, subscription_status)
            VALUES ('System Admin', 'admin', 'active')
            ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `);
    const defaultOrgId = orgRes.rows[0].id;
    console.log(`Default Organization ID: ${defaultOrgId}`);

    // 3. Add organization_id to users if not exists
    console.log("Adding organization_id to users...");
    await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS organization_id INT;
        `);

    // 4. Update existing users to default organization
    console.log("Updating existing users...");
    await client.query(
      `
            UPDATE users 
            SET organization_id = $1 
            WHERE organization_id IS NULL;
        `,
      [defaultOrgId],
    );

    // 5. Add FK constraint
    console.log("Adding FK constraint...");
    await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_organization') THEN 
                    ALTER TABLE users 
                    ADD CONSTRAINT fk_users_organization 
                    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE; 
                END IF; 
            END $$;
        `);

    await client.query("COMMIT");
    console.log("Phase 1 Fix completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Phase 1 Fix failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
};

fixPhase1();
