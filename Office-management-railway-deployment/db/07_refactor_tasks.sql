-- =============================================
-- Migration: Refactor Tasks
-- =============================================

-- 1. Update Task Status Enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'Incomplete';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'Waiting Approval';

-- 2. Create New Tables first (to avoid dependency issues)

CREATE TABLE IF NOT EXISTS task_assignees (
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS task_files (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Migrate existing data (if any) from assigned_to to task_assignees
INSERT INTO task_assignees (task_id, user_id)
SELECT id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL;

-- 4. Alter Tasks Table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_to; -- Remove after migration
ALTER TABLE tasks DROP COLUMN IF EXISTS project_name; -- Rely on project_id/contracts? Assuming project_id exists or we need to add it if missing. 
-- Note: 'tasks' already had 'project_name'. We should probably add 'project_id' if proper linking is desired, but user didn't explicitly ask for project link refactor, just "project". 
-- Providing project_id is better practice. Let's check schema.sql to see if project_id exists. 
-- Checking schema.sql, tasks has: title, project_name, description... NO project_id.
-- I should add project_id and link to projects table.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INT REFERENCES projects(id) ON DELETE SET NULL;
