import express, { Request, Response } from "express";
import pool from "../../db/db.js";
import bcrypt from "bcrypt";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import isAdmin from "../../middlewares/isAdmin.js";

const router = express.Router();

// ==========================================
// PROJECTS
// ==========================================

// Create Project
router.post(
  "/",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        client_id,
        department_id,
        summary,
        status,
        start_date,
        deadline,
        budget,
        estimated_hours,
        estimated_days,
        category_id,
        description,
        is_public_gantt,
        is_public_task_board,
        requires_admin_approval,
        send_to_client,
      } = req.body;

      // @ts-ignore
      const userId = req.user?.id;

      if (!name)
        return res.status(400).json({ message: "Project name is required" });

      const query = `
            INSERT INTO projects (
                client_id, department_id, category_id, name, summary, description, status, start_date, deadline, 
                budget, estimated_hours, estimated_days, is_public_gantt, is_public_task_board, requires_admin_approval, send_to_client, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `;
      const result = await pool.query(query, [
        client_id || null,
        department_id || null,
        category_id || null,
        name,
        summary || null,
        description || null,
        status || "Not Started",
        start_date || null,
        deadline || null,
        budget || 0,
        estimated_hours || null,
        estimated_days || null,
        is_public_gantt || false,
        is_public_task_board || false,
        requires_admin_approval || false,
        send_to_client || false,
        userId,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// CATEGORIES
// ==========================================

router.get(
  "/categories",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `SELECT * FROM project_categories ORDER BY name ASC`;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching project categories:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.post(
  "/categories",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!name)
        return res.status(400).json({ message: "Category name is required" });

      const query = `INSERT INTO project_categories (name) VALUES ($1) RETURNING *`;
      const result = await pool.query(query, [name]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating project category:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get Projects
router.get(
  "/",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      // Fetch projects with client and department details
      const query = `
            SELECT 
                p.*, 
                c.name as client_name,
                d.name as department_name,
                pc.name as category_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN project_categories pc ON p.category_id = pc.id
            ORDER BY p.created_at DESC
        `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get Single Project Details (with milestones, expenses, invoices, members, files)
router.get(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Verify project exists
      const projectQuery = `
            SELECT 
                p.*, 
                c.name as client_name,
                d.name as department_name,
                pc.name as category_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN project_categories pc ON p.category_id = pc.id
            WHERE p.id = $1
        `;
      const projectRes = await pool.query(projectQuery, [id]);

      if (projectRes.rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      const project = projectRes.rows[0];

      // Parallel fetch for related data
      const [milestonesVal, expensesVal, invoicesVal, membersVal, filesVal] =
        await Promise.all([
          pool.query(
            "SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY CASE WHEN status = 'Completed' THEN 1 ELSE 0 END, due_date ASC NULLS LAST",
            [id],
          ),
          pool.query(
            "SELECT * FROM project_expenses WHERE project_id = $1 ORDER BY incurred_date DESC",
            [id],
          ),
          pool.query(
            "SELECT * FROM project_invoices WHERE project_id = $1 ORDER BY issue_date DESC",
            [id],
          ),
          pool.query(
            `SELECT pm.*, u.name, u.email, u.avatar_url 
           FROM project_members pm
           JOIN users u ON pm.user_id = u.id
           WHERE pm.project_id = $1`,
            [id],
          ),
          pool.query(
            `SELECT pf.*, u.name as uploaded_by_name
           FROM project_files pf
           LEFT JOIN users u ON pf.uploaded_by = u.id
           WHERE pf.project_id = $1
           ORDER BY pf.uploaded_at DESC`,
            [id],
          ),
        ]);

      res.json({
        ...project,
        milestones: milestonesVal.rows,
        expenses: expensesVal.rows,
        invoices: invoicesVal.rows,
        members: membersVal.rows,
        files: filesVal.rows,
      });
    } catch (error) {
      console.error("Error fetching project details:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Updated Project
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        client_id,
        department_id,
        category_id,
        summary,
        description,
        status,
        start_date,
        deadline,
        budget,
        estimated_hours,
        estimated_days,
        is_public_gantt,
        is_public_task_board,
        requires_admin_approval,
        send_to_client,
      } = req.body;

      // Check existence
      const check = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (check.rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      const query = `
            UPDATE projects 
            SET 
                client_id = $1, department_id = $2, category_id = $3, name = $4, summary = $5, description = $6,
                status = $7, start_date = $8, deadline = $9, budget = $10,
                estimated_hours = $11, estimated_days = $12, is_public_gantt = $13,
                is_public_task_board = $14, requires_admin_approval = $15, send_to_client = $16, updated_at = NOW()
            WHERE id = $17
            RETURNING *
        `;
      const result = await pool.query(query, [
        client_id || null,
        department_id || null,
        category_id || null,
        name,
        summary || null,
        description || null,
        status || "Not Started",
        start_date || null,
        deadline || null,
        budget || 0,
        estimated_hours || null,
        estimated_days || null,
        is_public_gantt || false,
        is_public_task_board || false,
        requires_admin_approval || false,
        send_to_client || false,
        id,
      ]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Project
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      // Ensure req.user exists from authenticateToken middleware
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check existence and get status
      const check = await pool.query(
        "SELECT id, status FROM projects WHERE id = $1",
        [id],
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      const projectStatus = check.rows[0].status;

      // If project is started, require and verify password
      if (projectStatus !== "Not Started") {
        if (!password) {
          return res.status(400).json({
            message: "Admin password is required to delete a started project.",
          });
        }

        const userQuery = await pool.query(
          "SELECT password_hash FROM users WHERE id = $1",
          [req.user.id],
        );
        if (userQuery.rows.length === 0) {
          return res.status(401).json({ message: "Admin user not found." });
        }

        const isMatch = await bcrypt.compare(
          password,
          userQuery.rows[0].password_hash,
        );
        if (!isMatch) {
          return res.status(403).json({ message: "Incorrect password." });
        }
      }

      // Perform deletion
      // Assuming ON DELETE CASCADE is set for project_milestones, project_expenses, project_invoices, project_members, project_files.
      await pool.query("DELETE FROM projects WHERE id = $1", [id]);

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// MILESTONES
// ==========================================

router.post(
  "/:id/milestones",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, due_date, status } = req.body;
      // Verify ownership
      const check = await pool.query(
        "SELECT id, status FROM projects WHERE id = $1",
        [id],
      );
      if (check.rows.length === 0)
        return res.status(404).json({ message: "Project not found" });

      const query = `
            INSERT INTO project_milestones (project_id, name, due_date, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
      const result = await pool.query(query, [
        id,
        name,
        due_date,
        status || "Pending",
      ]);

      // Evaluate all milestones to determine project status
      const milestonesQuery = await pool.query(
        "SELECT status FROM project_milestones WHERE project_id = $1",
        [id],
      );

      const allCompleted =
        milestonesQuery.rows.length > 0 &&
        milestonesQuery.rows.every((m) => m.status === "Completed");

      let newProjectStatus = allCompleted ? "Completed" : "In Progress";

      if (check.rows[0].status !== newProjectStatus) {
        await pool.query("UPDATE projects SET status = $1 WHERE id = $2", [
          newProjectStatus,
          id,
        ]);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding milestone:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.put(
  "/:id/milestones/:milestoneId/status",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id, milestoneId } = req.params;
      const { status } = req.body;

      const check = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (check.rows.length === 0)
        return res.status(404).json({ message: "Project not found" });

      const query = `
        UPDATE project_milestones 
        SET status = $1 
        WHERE id = $2 AND project_id = $3
        RETURNING *
      `;
      const result = await pool.query(query, [status, milestoneId, id]);

      if (result.rows.length === 0)
        return res.status(404).json({ message: "Milestone not found" });

      // Evaluate all milestones to determine project status
      const milestonesQuery = await pool.query(
        "SELECT status FROM project_milestones WHERE project_id = $1",
        [id],
      );

      const allCompleted =
        milestonesQuery.rows.length > 0 &&
        milestonesQuery.rows.every((m) => m.status === "Completed");

      let newProjectStatus = allCompleted ? "Completed" : "In Progress";

      await pool.query("UPDATE projects SET status = $1 WHERE id = $2", [
        newProjectStatus,
        id,
      ]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating milestone status:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// EXPENSES
// ==========================================

router.post(
  "/:id/expenses",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, amount, category, incurred_date } = req.body;
      // @ts-ignore
      const userId = req.user?.id;
      // Verify ownership
      const check = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (check.rows.length === 0)
        return res.status(404).json({ message: "Project not found" });

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Insert Expense
        const insertQuery = `
                INSERT INTO project_expenses (project_id, title, amount, category, incurred_date, approved_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
        const result = await client.query(insertQuery, [
          id,
          title,
          amount,
          category,
          incurred_date || new Date(),
          userId,
        ]);

        // Update Project Actual Cost
        await client.query(
          // Note: Actual cost logic remains same
          `
                UPDATE projects 
                SET actual_cost = actual_cost + $1, updated_at = NOW()
                WHERE id = $2
            `,
          [amount, id],
        );

        await client.query("COMMIT");
        res.status(201).json(result.rows[0]);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Expense
router.delete(
  "/:id/expenses/:expenseId",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id, expenseId } = req.params;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Get expense amount before deleting
        const expenseQuery = await client.query(
          "SELECT amount FROM project_expenses WHERE id = $1 AND project_id = $2",
          [expenseId, id],
        );

        if (expenseQuery.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ message: "Expense not found" });
        }

        const amount = expenseQuery.rows[0].amount;

        // Delete Expense
        await client.query(
          "DELETE FROM project_expenses WHERE id = $1 AND project_id = $2",
          [expenseId, id],
        );

        // Update Project Actual Cost
        await client.query(
          `
                UPDATE projects 
                SET actual_cost = actual_cost - $1, updated_at = NOW()
                WHERE id = $2
            `,
          [amount, id],
        );

        await client.query("COMMIT");
        res.json({ message: "Expense deleted successfully" });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// INVOICES
// ==========================================

router.post(
  "/:id/invoices",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { invoice_number, amount, due_date, status } = req.body;
      // @ts-ignore
      const userId = req.user?.id;
      // Verify ownership
      const check = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (check.rows.length === 0)
        return res.status(404).json({ message: "Project not found" });

      const query = `
            INSERT INTO project_invoices (project_id, invoice_number, amount, due_date, status, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
      const result = await pool.query(query, [
        id,
        invoice_number,
        amount,
        due_date,
        status || "Unpaid",
        userId,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// MEMBERS
// ==========================================

router.post(
  "/:id/members",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { user_id, role } = req.body;

      const check = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (check.rows.length === 0)
        return res.status(404).json({ message: "Project not found" });

      const query = `
                INSERT INTO project_members (project_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT (project_id, user_id) DO NOTHING
                RETURNING *
            `;
      const result = await pool.query(query, [id, user_id, role || "Member"]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding member:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.delete(
  "/:id/members/:userId",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id, userId } = req.params;
      await pool.query(
        "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
        [id, userId],
      );
      res.json({ message: "Member removed" });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// FILES
// ==========================================

// NOTE: Middleware for file upload (multer) should be added in the route definition if handling raw files.
// For now, assuming direct metadata insert or pre-uploaded URL.
router.post(
  "/:id/files",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { file_name, file_url, file_type } = req.body;
      // @ts-ignore
      const userId = req.user?.id;

      const check = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
      if (check.rows.length === 0)
        return res.status(404).json({ message: "Project not found" });

      const query = `
                INSERT INTO project_files (project_id, file_name, file_url, file_type, uploaded_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
      const result = await pool.query(query, [
        id,
        file_name,
        file_url,
        file_type,
        userId,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding file:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
