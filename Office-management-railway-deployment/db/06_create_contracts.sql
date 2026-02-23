-- =============================================
-- Migration: Create Contracts Table
-- =============================================

CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_name VARCHAR(255) NOT NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    contract_type VARCHAR(100), -- e.g. Fixed, Hourly
    value NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
