import express, { Request, Response } from "express";
import pool from "../../db/db.js";
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
        description,
        status,
        start_date,
        deadline,
        estimated_budget,
      } = req.body;
      // @ts-ignore
      const orgId = req.user?.organizationId;
      // @ts-ignore
      const userId = req.user?.id;

      if (!name)
        return res.status(400).json({ message: "Project name is required" });

      const query = `
            INSERT INTO projects (client_id, name, description, status, start_date, deadline, estimated_budget, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
      const result = await pool.query(query, [
        client_id || null,
        name,
        description,
        status || "Not Started",
        start_date || null,
        deadline || null,
        estimated_budget || 0,
        userId,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating project:", error);
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
      // Fetch projects with client details
      const query = `
            SELECT p.*, u.name as client_name 
            FROM projects p
            LEFT JOIN users u ON p.client_id = u.id
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

// Get Single Project Details (with milestones, expenses, invoices)
router.get(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Verify project exists
      const projectQuery = `SELECT * FROM projects WHERE id = $1`;
      const projectRes = await pool.query(projectQuery, [id]);

      if (projectRes.rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      const project = projectRes.rows[0];

      // Parallel fetch for related data
      const [milestonesVal, expensesVal, invoicesVal] = await Promise.all([
        pool.query(
          "SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY due_date ASC",
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
      ]);

      res.json({
        ...project,
        milestones: milestonesVal.rows,
        expenses: expensesVal.rows,
        invoices: invoicesVal.rows,
      });
    } catch (error) {
      console.error("Error fetching project details:", error);
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
      const check = await pool.query("SELECT id FROM projects WHERE id = $1", [
        id,
      ]);
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
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding milestone:", error);
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

export default router;
