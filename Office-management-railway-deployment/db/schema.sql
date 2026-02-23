-- =============================================
-- UNIFIED DATABASE SCHEMA
-- =============================================

-- 1. ENUMERATIONS
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'hr', 'manager', 'employee');
CREATE TYPE user_status AS ENUM ('Active', 'On Leave', 'Past', 'Probation', 'Terminated', 'Suspended');
CREATE TYPE employment_type AS ENUM ('Full Time', 'Part Time', 'Contract', 'Intern', 'Remote');
CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Half Day', 'On Leave', 'Late');
CREATE TYPE leave_type AS ENUM ('Sick', 'Casual', 'Privilege', 'Maternity', 'Paternity', 'Unpaid');
CREATE TYPE leave_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled');
CREATE TYPE payroll_status AS ENUM ('paid', 'processing', 'pending', 'failed');
CREATE TYPE task_priority AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE task_status AS ENUM ('Pending', 'In Progress', 'In Review', 'Completed', 'Blocked', 'Incomplete', 'Waiting Approval');
CREATE TYPE chat_type AS ENUM ('direct', 'group', 'space', 'announcement');
CREATE TYPE message_sender_type AS ENUM ('user', 'system', 'bot');
CREATE TYPE attachment_type AS ENUM ('image', 'file', 'video', 'audio');
CREATE TYPE notification_type AS ENUM ('success', 'error', 'info', 'warning', 'reminder');
CREATE TYPE stock_movement_type AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');

-- =============================================
-- 2. CORE TABLES (Users, Departments)
-- =============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'employee',
    designation VARCHAR(100),
    status user_status DEFAULT 'Active',
    phone VARCHAR(20),
    location VARCHAR(100),
    bio TEXT DEFAULT NULL,
    joining_date DATE DEFAULT CURRENT_DATE,
    salary NUMERIC(15, 2) DEFAULT 0,
    skills TEXT[],
    employment_type employment_type DEFAULT 'Full Time',
    avatar_url TEXT,
    reset_password_token VARCHAR(255) DEFAULT NULL,
    reset_password_expires TIMESTAMP DEFAULT NULL,
    two_factor_secret VARCHAR(255) DEFAULT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_session_id TEXT DEFAULT NULL,
    department_id INT -- FK added later to avoid circular dependency
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Circular FK for Users -> Departments
ALTER TABLE users ADD CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- =============================================
-- 3. HR & OPERATIONS (Attendance, Leaves, Payroll)
-- =============================================

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    check_in_ip VARCHAR(45),
    check_out_ip VARCHAR(45),
    work_hours NUMERIC(4, 2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4, 1),
    reason TEXT,
    rejection_reason TEXT,
    status leave_status DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(50) NOT NULL,
    payment_date DATE DEFAULT NULL,
    transaction_id VARCHAR(100),
    basic_salary NUMERIC(12, 2) NOT NULL,
    allowances NUMERIC(12, 2) DEFAULT 0,
    deductions NUMERIC(12, 2) DEFAULT 0,
    bonus NUMERIC(12, 2) DEFAULT 0,
    tax NUMERIC(12, 2) DEFAULT 0,
    net_salary NUMERIC(12, 2) NOT NULL,
    status payroll_status DEFAULT 'pending',
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. CLIENTS & PROJECTS
-- =============================================

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    category_id INT REFERENCES project_categories(id) ON DELETE SET NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    summary TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Not Started',
    start_date DATE,
    deadline DATE,
    budget NUMERIC(15, 2) DEFAULT 0.00,
    estimated_hours NUMERIC(10, 2),
    estimated_days NUMERIC(10, 2),
    actual_cost NUMERIC(15, 2) DEFAULT 0.00, -- From expenses
    is_public_gantt BOOLEAN DEFAULT FALSE,
    is_public_task_board BOOLEAN DEFAULT FALSE,
    requires_admin_approval BOOLEAN DEFAULT FALSE,
    send_to_client BOOLEAN DEFAULT FALSE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(255) NOT NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    contract_type VARCHAR(100),
    contract_value NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_members (
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE project_files (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    completion_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_expenses (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    category VARCHAR(100),
    incurred_date DATE DEFAULT CURRENT_DATE,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_invoices (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Unpaid',
    payment_date DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. TASKS
-- =============================================

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    details TEXT,
    priority task_priority DEFAULT 'Medium',
    status task_status DEFAULT 'Pending',
    start_date DATE,
    due_date DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    completion_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_assignees (
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE task_dependencies (
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE TABLE task_files (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. INVENTORY
-- =============================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    unit_price NUMERIC(15, 2) DEFAULT 0.00,
    cost_price NUMERIC(15, 2) DEFAULT 0.00,
    reorder_level INT DEFAULT 10,
    is_serial_tracking_enabled BOOLEAN DEFAULT FALSE,
    unit VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    location VARCHAR(255),
    manager_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_levels (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INT REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INT REFERENCES warehouses(id) ON DELETE CASCADE,
    to_warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
    type stock_movement_type NOT NULL,
    quantity INT NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    delivery_address TEXT,
    delivery_status VARCHAR(50) DEFAULT 'Not Started',
    status VARCHAR(50) DEFAULT 'Draft',
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(255),
    quantity INT DEFAULT 1,
    unit VARCHAR(50),
    unit_price NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_price NUMERIC(15, 2) DEFAULT 0.00,
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    bill_number VARCHAR(50) NOT NULL,
    bill_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_payments (
    id SERIAL PRIMARY KEY,
    bill_id INT REFERENCES bills(id) ON DELETE SET NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    proof_of_payment TEXT,
    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. COMMUNICATION & SYSTEM
-- =============================================

CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    type chat_type NOT NULL,
    name VARCHAR(100),
    description TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_members (
    chat_id INT REFERENCES chats(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE SET NULL,
    sender_type message_sender_type DEFAULT 'user',
    content TEXT,
    attachment_url TEXT,
    attachment_type attachment_type,
    is_read BOOLEAN DEFAULT FALSE,
    read_by JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100),
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    day VARCHAR(20),
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    user_id INT[],
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    join_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE past_employees (
    id SERIAL PRIMARY KEY,
    original_user_id INT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(100),
    skills TEXT[],
    employment_type  employment_type DEFAULT 'Full Time',
    joining_date DATE,
    designation VARCHAR(100),
    department_name VARCHAR(100),
    exit_date DATE,
    reason_for_exit TEXT,
    exit_interview_notes TEXT,
    removed_by_admin_id INT REFERENCES users(id)
);

CREATE TABLE allowed_ips (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    label VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. INDEXING
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dept ON users(department_id);

CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_dept ON projects(department_id);
CREATE INDEX idx_projects_status ON projects(status);

CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);

CREATE INDEX idx_tasks_project ON tasks(project_id);
-- CREATE INDEX idx_tasks_assigned ON tasks(assigned_to); -- Removed as column dropped
CREATE INDEX idx_products_sku ON products(sku);

CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_bills_supplier ON bills(supplier_id);
CREATE INDEX idx_bills_status ON bills(status);

-- =============================================
-- 9. FUNCTIONS & TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION create_initial_payroll()
RETURNS TRIGGER AS $$
DECLARE
    next_month_str VARCHAR;
BEGIN
    next_month_str := TO_CHAR((CURRENT_DATE + interval '1 month'), 'Month YYYY');

    INSERT INTO payroll (user_id, month, basic_salary, net_salary, status)
    VALUES (
        NEW.id,
        TRIM(next_month_str),
        COALESCE(NEW.salary, 0),
        COALESCE(NEW.salary, 0),
        'pending'
    );

    INSERT INTO audit_logs (action, entity_name, entity_id, details)
    VALUES ('USER_CREATED', 'users', NEW.id, jsonb_build_object('email', NEW.email, 'role', NEW.role));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_payroll
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_initial_payroll();

CREATE OR REPLACE FUNCTION auto_mark_absent_users()
RETURNS void AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    INSERT INTO attendance (user_id, date, status, remarks)
    SELECT
        u.id,
        today,
        'Absent',
        'System Auto-marked: No check-in by 7 PM'
    FROM users u
    WHERE u.status = 'Active'
    AND u.role NOT IN ('super_admin')
    AND NOT EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.user_id = u.id AND a.date = today
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. SEED DATA
-- =============================================

INSERT INTO users (
    name,
    email,
    password_hash,
    role,
    designation,
    status,
    salary
) VALUES (
    'Sujay Kotal',
    'kotalsujay8@gmail.com',
    '$2a$10$Q9uQEqmf3HN.AxqVUIQdVuG2Ay73O5VGuSs3r4BwkhxuwDtC0u.TS', -- Password hash
    'super_admin',
    'System Owner',
    'Active',
    0.00
);
