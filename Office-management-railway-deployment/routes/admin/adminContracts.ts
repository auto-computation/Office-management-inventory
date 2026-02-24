import express, { Request, Response } from "express";
import pool from "../../db/db.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import isAdmin from "../../middlewares/isAdmin.js";

const router = express.Router();

// ==========================================
// CONTRACT TYPES
// ==========================================

// Get All Contract Types
router.get(
  "/types",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT * FROM contract_types ORDER BY CASE WHEN name = 'Others' THEN 1 ELSE 0 END, name ASC",
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching contract types:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Add Contract Type
router.post(
  "/types",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });

      const result = await pool.query(
        "INSERT INTO contract_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *",
        [name],
      );

      if (result.rows.length === 0) {
        const existing = await pool.query(
          "SELECT * FROM contract_types WHERE name = $1",
          [name],
        );
        return res.status(200).json(existing.rows[0]);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding contract type:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Contract Type
router.delete(
  "/types/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM contract_types WHERE id = $1", [id]);
      res.json({ message: "Contract type deleted successfully" });
    } catch (error) {
      console.error("Error deleting contract type:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// CONTRACTS
// ==========================================

// Get All Contracts
router.get(
  "/",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `
            SELECT 
                c.*, 
                p.name as project_name,
                cl.name as client_name
            FROM contracts c
            LEFT JOIN projects p ON c.project_id = p.id
            LEFT JOIN clients cl ON c.client_id = cl.id
            ORDER BY c.created_at DESC
        `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get Single Contract
router.get(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const query = `
            SELECT 
                c.*, 
                p.name as project_name,
                cl.name as client_name
            FROM contracts c
            LEFT JOIN projects p ON c.project_id = p.id
            LEFT JOIN clients cl ON c.client_id = cl.id
            WHERE c.id = $1
        `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Contract not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Create Contract
router.post(
  "/",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        contract_number,
        project_id,
        client_id,
        description,
        start_date,
        end_date,
        contract_type,
        contract_value,
        status,
      } = req.body;

      if (!contract_number) {
        return res.status(400).json({ message: "Contract number is required" });
      }

      const query = `
        INSERT INTO contracts (
            contract_number, project_id, client_id, description, 
            start_date, end_date, contract_type, contract_value, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const result = await pool.query(query, [
        contract_number,
        project_id || null,
        client_id || null,
        description,
        start_date || null,
        end_date || null,
        contract_type,
        contract_value || 0,
        status || "Active",
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update Contract
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        contract_number,
        project_id,
        client_id,
        description,
        start_date,
        end_date,
        contract_type,
        contract_value,
        status,
      } = req.body;

      const query = `
        UPDATE contracts 
        SET 
            contract_number = $1, project_id = $2, client_id = $3, description = $4,
            start_date = $5, end_date = $6, contract_type = $7, contract_value = $8, status = $9,
            updated_at = NOW()
        WHERE id = $10
        RETURNING *
      `;
      const result = await pool.query(query, [
        contract_number,
        project_id || null,
        client_id || null,
        description,
        start_date || null,
        end_date || null,
        contract_type,
        contract_value || 0,
        status || "Active",
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Contract not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Contract
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const query = `DELETE FROM contracts WHERE id = $1 RETURNING *`;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Contract not found" });
      }

      res.json({ message: "Contract deleted successfully" });
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
