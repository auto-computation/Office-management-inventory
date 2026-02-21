-- =============================================
-- Migration: Inventory Refactor (POs, Bills, Payments)
-- =============================================

-- 1. Create Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    delivery_address TEXT,
    delivery_status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Delivered, Cancelled
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Sent, Received, Cancelled
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(255), -- Snapshot or ad-hoc
    quantity INT DEFAULT 1,
    unit VARCHAR(50), -- e.g. Pcs, Kg
    unit_price NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_price NUMERIC(15, 2) DEFAULT 0.00,
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    bill_number VARCHAR(50) NOT NULL,
    bill_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Unpaid', -- Unpaid, Paid, Partially Paid, Overdue
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Vendor Payments Table
CREATE TABLE IF NOT EXISTS vendor_payments (
    id SERIAL PRIMARY KEY,
    bill_id INT REFERENCES bills(id) ON DELETE SET NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) DEFAULT 0.00,
    payment_method VARCHAR(50), -- Cash, Bank Transfer, Check, etc.
    reference_number VARCHAR(100),
    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
