import express, { Request, Response } from "express";
import pool from "../../db/db.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import isAdmin from "../../middlewares/isAdmin.js";

const router = express.Router();

// ==========================================
// WAREHOUSES
// ==========================================

// Create Warehouse
router.post(
  "/warehouses",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { name, location, manager_id } = req.body;
      const query = `
            INSERT INTO warehouses (name, location, manager_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
      const result = await pool.query(query, [
        name,
        location,
        manager_id || null,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get Warehouses
router.get(
  "/warehouses",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `SELECT * FROM warehouses ORDER BY created_at DESC`;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// SUPPLIERS
// ==========================================

// Create Supplier
router.post(
  "/suppliers",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { name, contact_person, email, phone, address } = req.body;
      const query = `
            INSERT INTO suppliers (name, contact_person, email, phone, address)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
      const result = await pool.query(query, [
        name,
        contact_person,
        email,
        phone,
        address,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding supplier:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get Suppliers
router.get(
  "/suppliers",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `SELECT * FROM suppliers ORDER BY created_at DESC`;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// PRODUCTS
// ==========================================

// Create Product
router.post(
  "/products",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        sku,
        category,
        unit_price,
        cost_price,
        reorder_level,
        is_serial_tracking_enabled,
      } = req.body;
      // Check SKU uniqueness
      const check = await pool.query("SELECT id FROM products WHERE sku = $1", [
        sku,
      ]);
      if (check.rows.length > 0) {
        return res.status(400).json({ message: "SKU already exists" });
      }

      const query = `
            INSERT INTO products (name, description, sku, category, unit_price, cost_price, reorder_level, is_serial_tracking_enabled)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
      const result = await pool.query(query, [
        name,
        description,
        sku,
        category,
        unit_price || 0,
        cost_price || 0,
        reorder_level || 10,
        is_serial_tracking_enabled || false,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get Products
router.get(
  "/products",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      // Fetch products with total stock count (aggregating from all warehouses)
      const query = `
            SELECT p.*, COALESCE(SUM(sl.quantity), 0) as total_stock
            FROM products p
            LEFT JOIN stock_levels sl ON p.id = sl.product_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
