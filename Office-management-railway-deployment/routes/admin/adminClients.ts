import express, { Request, Response } from "express";
import pool from "../../db/db.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import isAdmin from "../../middlewares/isAdmin.js";
import { sendEmail } from "../../utils/mailer.js";
import { clientWelcomeEmail } from "../../templates/clientWelcomeEmail.js";

const router = express.Router();

// ==========================================
// CLIENTS
// ==========================================

// Get All Clients
router.get(
  "/",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `SELECT * FROM clients ORDER BY created_at DESC`;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get Single Client
router.get(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const query = `SELECT * FROM clients WHERE id = $1`;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Create Client
router.post(
  "/",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { name, email, phone, company_name, address } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Client name is required" });
      }

      const query = `
        INSERT INTO clients (name, email, phone, company_name, address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const result = await pool.query(query, [
        name,
        email,
        phone,
        company_name,
        address,
      ]);

      const newClient = result.rows[0];

      // Send welcome email to the newly created client
      try {
        await sendEmail({
          to: email,
          subject: "Welcome to Auto Computation!",
          html: clientWelcomeEmail(name, company_name, email, phone),
        });
      } catch (emailError) {
        console.error("Failed to send welcome email to client:", emailError);
        // We don't fail the request if the email fails, but we could notify the frontend
        return res.status(201).json({ ...newClient, emailSent: false });
      }

      res.status(201).json({ ...newClient, emailSent: true });
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update Client
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, phone, company_name, address } = req.body;

      const query = `
        UPDATE clients 
        SET name = $1, email = $2, phone = $3, company_name = $4, address = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      const result = await pool.query(query, [
        name,
        email,
        phone,
        company_name,
        address,
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Client
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const query = `DELETE FROM clients WHERE id = $1 RETURNING *`;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
