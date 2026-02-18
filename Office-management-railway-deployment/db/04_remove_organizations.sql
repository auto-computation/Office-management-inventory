
-- Remove Foreign Key Constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_organization_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_organization_id_fkey;
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_organization_id_fkey;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_organization_id_fkey;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_organization_id_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_organization_id_fkey;

-- Drop Unique Constraints (that involve organization_id)
-- Note: Constraint names might vary, so using generic DROP CONSTRAINT if known, or identifying them.
-- Postgres usually names them table_column_key.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_id_email_key;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_organization_id_name_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_organization_id_sku_key;
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_organization_id_name_key;

-- Drop Columns
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE departments DROP COLUMN IF EXISTS organization_id;
ALTER TABLE products DROP COLUMN IF EXISTS organization_id;
ALTER TABLE warehouses DROP COLUMN IF EXISTS organization_id;
ALTER TABLE suppliers DROP COLUMN IF EXISTS organization_id;
ALTER TABLE stock_movements DROP COLUMN IF EXISTS organization_id;
ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;

-- Drop Table
DROP TABLE IF EXISTS organizations;
