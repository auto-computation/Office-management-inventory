-- =============================================
-- Phase 3: Project Management Migration
-- =============================================

-- 1. Projects Breakdown
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    client_id INT REFERENCES users(id) ON DELETE SET NULL, -- Use 'users' table for clients? Or new 'clients' table? Sticking to users for now (Role: client?)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, On Hold, Completed, Cancelled
    start_date DATE,
    deadline DATE,
    estimated_budget NUMERIC(15, 2) DEFAULT 0.00,
    actual_cost NUMERIC(15, 2) DEFAULT 0.00,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Milestones (Phased tracking)
CREATE TABLE IF NOT EXISTS project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g. "Phase 1: Design"
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Completed
    completion_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Project Expenses (Cost tracking)
CREATE TABLE IF NOT EXISTS project_expenses (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    category VARCHAR(100), -- Travel, Equipment, Software, Labor
    incurred_date DATE DEFAULT CURRENT_DATE,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Project Invoices (Billing)
CREATE TABLE IF NOT EXISTS project_invoices (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. INV-2023-001
    amount NUMERIC(15, 2) NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Unpaid', -- Unpaid, Paid, Overdue, Cancelled
    payment_date DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_expenses_project ON project_expenses(project_id);
CREATE INDEX idx_invoices_project ON project_invoices(project_id);
