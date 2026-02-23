import express, { Request, Response } from "express";
import pool from "../../db/db.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import isAdmin from "../../middlewares/isAdmin.js";
import decodeToken from "../../utils/decodeToken.js";
import multer from "multer";
import { logAudit } from "../../utils/auditLogger.js";
import { sendEmail } from "../../utils/mailer.js";
import { supplierWelcomeEmail } from "../../templates/supplierWelcomeEmail.js";
import { newPurchaseOrderEmail } from "../../templates/newPurchaseOrderEmail.js";
import { newBillEmail } from "../../templates/newBillEmail.js";
import { lowStockAlertEmail } from "../../templates/lowStockAlertEmail.js";
import { newVendorPaymentEmail } from "../../templates/newVendorPaymentEmail.js";

const router = express.Router();

// Multer for in-memory image uploads
const upload = multer({ storage: multer.memoryStorage() });

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
      const newWarehouse = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "CREATE",
        "Warehouse",
        newWarehouse.id,
        { name, location, manager_id },
        req,
      );
      res.status(201).json(newWarehouse);
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

// Update Warehouse
router.put(
  "/warehouses/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, location } = req.body;
      if (!name?.trim())
        return res.status(400).json({ message: "Warehouse name is required" });
      const result = await pool.query(
        "UPDATE warehouses SET name = $1, location = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        [name, location || null, id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Warehouse not found" });
      const updatedWarehouse = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "UPDATE",
        "Warehouse",
        updatedWarehouse.id,
        { name, location },
        req,
      );
      res.json(updatedWarehouse);
    } catch (error) {
      console.error("Error updating warehouse:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Warehouse
router.delete(
  "/warehouses/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM warehouses WHERE id = $1 RETURNING *",
        [id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Warehouse not found" });
      const deletedWarehouse = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "DELETE",
        "Warehouse",
        deletedWarehouse.id,
        { name: deletedWarehouse.name },
        req,
      );
      res.json({ message: "Warehouse deleted successfully" });
    } catch (error) {
      console.error("Error deleting warehouse:", error);
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
      const newSupplier = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "CREATE",
        "Supplier",
        newSupplier.id,
        { name, contact_person, email, phone, address },
        req,
      );

      // Send greeting email to the new supplier
      if (email) {
        const emailHtml = supplierWelcomeEmail(
          name,
          contact_person || "N/A",
          email,
          phone || "N/A",
        );
        // We do this asynchronously so it doesn't block the API response
        sendEmail({
          to: email,
          subject: "Welcome as a new Supplier",
          html: emailHtml,
        }).catch((err) =>
          console.error("Failed to send supplier creation email:", err),
        );
      }

      res.status(201).json(newSupplier);
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

// Update Supplier
router.put(
  "/suppliers/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, contact_person, email, phone, address } = req.body;
      if (!name?.trim())
        return res.status(400).json({ message: "Supplier name is required" });
      const result = await pool.query(
        `UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
        [
          name,
          contact_person || null,
          email || null,
          phone || null,
          address || null,
          id,
        ],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Supplier not found" });
      const updatedSupplier = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "UPDATE",
        "Supplier",
        updatedSupplier.id,
        { name, contact_person, email, phone, address },
        req,
      );
      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Supplier
router.delete(
  "/suppliers/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM suppliers WHERE id = $1 RETURNING *",
        [id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Supplier not found" });
      const deletedSupplier = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "DELETE",
        "Supplier",
        deletedSupplier.id,
        { name: deletedSupplier.name },
        req,
      );
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// PRODUCTS
// ==========================================

// Upload Product Image
router.post(
  "/products/upload-image",
  authenticateToken,
  isAdmin,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const b64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;
      const image_url = `data:${mimeType};base64,${b64}`;
      res.status(200).json({ image_url });
    } catch (error) {
      console.error("Error uploading product image:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

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
        unit,
        stock_available,
        image_url,
      } = req.body;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Check SKU uniqueness
        const check = await client.query(
          "SELECT id FROM products WHERE sku = $1",
          [sku],
        );
        if (check.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "SKU already exists" });
        }

        if (Number(unit_price) < 0) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ message: "Unit Price cannot be negative" });
        }
        if (stock_available && Number(stock_available) < 0) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ message: "Stock Available cannot be negative" });
        }

        const query = `
            INSERT INTO products (name, description, sku, category, unit_price, cost_price, reorder_level, is_serial_tracking_enabled, unit, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const result = await client.query(query, [
          name,
          description,
          sku,
          category,
          unit_price || 0,
          cost_price || 0,
          reorder_level || 10,
          is_serial_tracking_enabled || false,
          unit || null,
          image_url || null,
        ]);
        const newProduct = result.rows[0];

        // Handle Stock Available
        if (stock_available && Number(stock_available) > 0) {
          // Check if any warehouse exists
          let warehouseRes = await client.query(
            "SELECT id FROM warehouses LIMIT 1",
          );
          let warehouseId;

          if (warehouseRes.rows.length === 0) {
            // Create default warehouse
            const newWarehouseRes = await client.query(
              "INSERT INTO warehouses (name, location) VALUES ($1, $2) RETURNING id",
              ["Main Warehouse", "Default Location"],
            );
            warehouseId = newWarehouseRes.rows[0].id;
          } else {
            warehouseId = warehouseRes.rows[0].id;
          }

          // Insert into stock_levels
          await client.query(
            "INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)",
            [newProduct.id, warehouseId, Number(stock_available)],
          );
        }

        await client.query("COMMIT");
        const token = req.cookies.token;
        const decodedToken: any = decodeToken(token);
        await logAudit(
          decodedToken.id,
          "CREATE",
          "Product",
          newProduct.id,
          {
            name,
            description,
            sku,
            category,
            unit_price,
            cost_price,
            reorder_level,
            is_serial_tracking_enabled,
            unit,
            stock_available,
          },
          req,
        );

        const adminEmail = process.env.ADMIN_EMAIL;
        if (
          adminEmail &&
          stock_available !== undefined &&
          Number(stock_available) <= Number(newProduct.reorder_level)
        ) {
          const emailHtml = lowStockAlertEmail(
            newProduct.name,
            stock_available,
            newProduct.reorder_level,
          );
          sendEmail({
            to: adminEmail,
            subject: `Low Stock Alert: ${newProduct.name}`,
            html: emailHtml,
          }).catch((err) =>
            console.error(
              "Failed to send Low Stock email (POST product):",
              err,
            ),
          );
        }

        res.status(201).json(newProduct);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
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

// Update Product
router.put(
  "/products/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        unit_price,
        cost_price,
        reorder_level,
        is_serial_tracking_enabled,
        unit,
        stock_available,
        image_url,
      } = req.body;

      await client.query("BEGIN");

      // Validate inputs
      if (Number(unit_price) < 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Unit Price cannot be negative" });
      }
      if (stock_available !== undefined && Number(stock_available) < 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Stock Available cannot be negative" });
      }

      // Update basic product details
      const updateQuery = `
        UPDATE products 
        SET name = $1, description = $2, category = $3, unit_price = $4, 
            cost_price = $5, reorder_level = $6, is_serial_tracking_enabled = $7, unit = $8,
            image_url = COALESCE($9, image_url), updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;
      const result = await client.query(updateQuery, [
        name,
        description,
        category,
        unit_price,
        cost_price || 0,
        reorder_level,
        is_serial_tracking_enabled,
        unit,
        image_url || null,
        id,
      ]);

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found" });
      }

      // Handle Stock Update if provided
      // Note: This is a simplified stock update. For robust systems, stock transactions should be used.
      // Here we assume if 'stock_available' is passed, we update the quantity in the first warehouse/stock_level found.
      if (stock_available !== undefined) {
        // Get current stock level for this product (assuming single warehouse for simple logic or main warehouse)
        /* 
            Ideally, stock management should be done via specific stock adjustment endpoints. 
            However, for this "Edit Product" feature, we'll allow updating the total quantity 
            by updating the entry in the default/main warehouse.
         */

        // Find existing stock entry
        const stockRes = await client.query(
          "SELECT * FROM stock_levels WHERE product_id = $1 LIMIT 1",
          [id],
        );

        if (stockRes.rows.length > 0) {
          // Update existing
          await client.query(
            "UPDATE stock_levels SET quantity = $1 WHERE id = $2",
            [Number(stock_available), stockRes.rows[0].id],
          );
        } else {
          // Create new if not exists (similar to create logic)
          let warehouseRes = await client.query(
            "SELECT id FROM warehouses LIMIT 1",
          );
          let warehouseId;
          if (warehouseRes.rows.length === 0) {
            const newWarehouseRes = await client.query(
              "INSERT INTO warehouses (name, location) VALUES ($1, $2) RETURNING id",
              ["Main Warehouse", "Default Location"],
            );
            warehouseId = newWarehouseRes.rows[0].id;
          } else {
            warehouseId = warehouseRes.rows[0].id;
          }
          await client.query(
            "INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)",
            [id, warehouseId, Number(stock_available)],
          );
        }
      }

      await client.query("COMMIT");
      const updatedProduct = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "UPDATE",
        "Product",
        updatedProduct.id,
        {
          name,
          description,
          category,
          unit_price,
          cost_price,
          reorder_level,
          is_serial_tracking_enabled,
          unit,
          stock_available,
        },
        req,
      );

      const adminEmail = process.env.ADMIN_EMAIL;
      if (
        adminEmail &&
        stock_available !== undefined &&
        Number(stock_available) <= Number(updatedProduct.reorder_level)
      ) {
        const emailHtml = lowStockAlertEmail(
          updatedProduct.name,
          stock_available,
          updatedProduct.reorder_level,
        );
        sendEmail({
          to: adminEmail,
          subject: `Low Stock Alert: ${updatedProduct.name}`,
          html: emailHtml,
        }).catch((err) =>
          console.error("Failed to send Low Stock email (PUT product):", err),
        );
      }

      res.json(updatedProduct);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },
);

// Delete Product
router.delete(
  "/products/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      await client.query("BEGIN");

      // Optional: Check for dependencies (e.g. Purchase Order Items) to prevent deleting used products
      // const checkPO = await client.query("SELECT id FROM purchase_order_items WHERE product_id = $1 LIMIT 1", [id]);
      // if (checkPO.rows.length > 0) { ... }

      // Delete stock levels first
      await client.query("DELETE FROM stock_levels WHERE product_id = $1", [
        id,
      ]);

      // Delete product
      const result = await client.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [id],
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found" });
      }

      await client.query("COMMIT");
      const deletedProduct = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "DELETE",
        "Product",
        deletedProduct.id,
        { name: deletedProduct.name, sku: deletedProduct.sku },
        req,
      );
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },
);

// ==========================================
// PURCHASE ORDERS
// ==========================================

// Helper to adjust stock levels
async function adjustStock(
  client: any,
  productId: string | number,
  quantityDelta: number,
) {
  if (!productId || quantityDelta === 0) return;

  // Find a warehouse (using the default/first one, matching existing product creation logic)
  let warehouseRes = await client.query("SELECT id FROM warehouses LIMIT 1");
  let warehouseId;
  if (warehouseRes.rows.length === 0) {
    const newWarehouseRes = await client.query(
      "INSERT INTO warehouses (name, location) VALUES ($1, $2) RETURNING id",
      ["Main Warehouse", "Default Location"],
    );
    warehouseId = newWarehouseRes.rows[0].id;
  } else {
    warehouseId = warehouseRes.rows[0].id;
  }

  const stockRes = await client.query(
    "SELECT id, quantity FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2 LIMIT 1",
    [productId, warehouseId],
  );

  let newQuantity = quantityDelta;
  if (stockRes.rows.length > 0) {
    newQuantity = Number(stockRes.rows[0].quantity) + quantityDelta;
    await client.query("UPDATE stock_levels SET quantity = $1 WHERE id = $2", [
      newQuantity,
      stockRes.rows[0].id,
    ]);
  } else {
    // Only insert if the delta is positive (or we allow negative stock gracefully)
    await client.query(
      "INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)",
      [productId, warehouseId, newQuantity],
    );
  }

  // Check against reorder level
  const prodRes = await client.query(
    "SELECT name, reorder_level FROM products WHERE id = $1",
    [productId],
  );
  if (prodRes.rows.length > 0) {
    const { name, reorder_level } = prodRes.rows[0];
    if (reorder_level !== null && newQuantity <= Number(reorder_level)) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailHtml = lowStockAlertEmail(name, newQuantity, reorder_level);
        sendEmail({
          to: adminEmail,
          subject: `Low Stock Alert: ${name}`,
          html: emailHtml,
        }).catch((err) =>
          console.error("Failed to send Low Stock email (adjustStock):", err),
        );
      }
    }
  }
}

router.post(
  "/purchase-orders",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const {
        order_number,
        supplier_id,
        order_date,
        expected_delivery_date,
        delivery_address,
        delivery_status,
        status,
        total_amount,
        notes,
        items,
      } = req.body;

      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      const created_by = decodedToken.id;

      const insertPOText = `
         INSERT INTO purchase_orders (order_number, supplier_id, order_date, expected_delivery_date, delivery_address, delivery_status, status, total_amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id
       `;
      const poRes = await client.query(insertPOText, [
        order_number,
        supplier_id,
        order_date,
        expected_delivery_date,
        delivery_address,
        delivery_status,
        status,
        total_amount,
        notes,
        created_by,
      ]);
      const poId = poRes.rows[0].id;

      if (items && Array.isArray(items)) {
        for (const item of items) {
          let finalProductId = item.product_id;

          // Auto-create product if product_id is missing but we have a name
          if (!finalProductId && item.item_name) {
            const sku = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newProdRes = await client.query(
              `INSERT INTO products (name, sku, category, unit_price, cost_price, unit) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
              [
                item.item_name,
                sku,
                "Uncategorized",
                item.unit_price || 0,
                item.unit_price || 0,
                item.unit || "pcs",
              ],
            );
            finalProductId = newProdRes.rows[0].id;
          }

          await client.query(
            `
                   INSERT INTO purchase_order_items 
                   (purchase_order_id, product_id, item_name, quantity, unit, unit_price, tax_rate, tax_amount, total_price, description, file_url)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               `,
            [
              poId,
              finalProductId || null,
              item.item_name,
              item.quantity,
              item.unit,
              item.unit_price,
              item.tax_rate,
              item.tax_amount,
              item.total_price,
              item.description,
              item.file_url,
            ],
          );

          // Increase stock
          if (finalProductId && status !== "cancelled") {
            await adjustStock(
              client,
              finalProductId,
              Number(item.quantity) || 0,
            );
          }
        }
      }

      await client.query("COMMIT");
      const poAuditParams = {
        order_number,
        supplier_id,
        order_date,
        expected_delivery_date,
        delivery_address,
        delivery_status,
        status,
        total_amount,
        notes,
      };

      // Fetch Supplier Email
      let supplierEmail = null;
      let supplierName = "Unknown Supplier";
      if (supplier_id) {
        const supRes = await client.query(
          "SELECT email, name FROM suppliers WHERE id = $1",
          [supplier_id],
        );
        if (supRes.rows.length > 0) {
          supplierEmail = supRes.rows[0].email;
          supplierName = supRes.rows[0].name;
        }
      }

      await logAudit(
        created_by,
        "CREATE",
        "Purchase Order",
        poId,
        poAuditParams,
        req,
      );

      // Send Email to Supplier
      if (supplierEmail) {
        let itemsHtml = `
          <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
        `;
        if (items && Array.isArray(items)) {
          items.forEach((item: any) => {
            itemsHtml += `
               <tr>
                 <td>${item.item_name}</td>
                 <td>${item.quantity} ${item.unit || ""}</td>
                 <td>₹${item.unit_price}</td>
                 <td>₹${item.total_price}</td>
               </tr>
             `;
          });
        }
        itemsHtml += `</tbody></table>`;

        const emailHtml = newPurchaseOrderEmail(
          supplierName,
          order_number,
          order_date,
          expected_delivery_date,
          delivery_address,
          total_amount,
          itemsHtml,
        );
        sendEmail({
          to: supplierEmail,
          subject: `New Purchase Order: ${order_number}`,
          html: emailHtml,
        }).catch((err) => console.error("Failed to send PO email:", err));
      }

      res.status(201).json({ message: "Purchase Order Created", id: poId });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error creating PO:", err);
      res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },
);

router.get(
  "/purchase-orders",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `
            SELECT po.*, s.name as supplier_name,
            (SELECT count(*) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) as item_count
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.created_at DESC
        `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching POs:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get single PO with items
router.get(
  "/purchase-orders/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const po = await pool.query(
        `SELECT po.*, s.name as supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = $1`,
        [id],
      );
      if (po.rows.length === 0)
        return res.status(404).json({ message: "Purchase order not found" });
      const items = await pool.query(
        `SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY id`,
        [id],
      );
      res.json({ ...po.rows[0], items: items.rows });
    } catch (err) {
      console.error("Error fetching PO:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update Purchase Order
router.put(
  "/purchase-orders/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { id } = req.params;
      const {
        order_number,
        supplier_id,
        order_date,
        expected_delivery_date,
        delivery_address,
        delivery_status,
        status,
        total_amount,
        notes,
        items,
      } = req.body;
      if (!order_number?.trim())
        return res.status(400).json({ message: "Order number is required" });

      // Revert old stock if the order wasn't previously cancelled
      const oldOrderRes = await client.query(
        "SELECT status FROM purchase_orders WHERE id = $1",
        [id],
      );
      const oldOrderStatus = oldOrderRes.rows[0]?.status;

      if (oldOrderStatus !== "cancelled") {
        const oldItemsRes = await client.query(
          "SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1",
          [id],
        );
        for (const oldItem of oldItemsRes.rows) {
          if (oldItem.product_id) {
            await adjustStock(
              client,
              oldItem.product_id,
              -Number(oldItem.quantity),
            );
          }
        }
      }

      const result = await client.query(
        `UPDATE purchase_orders SET order_number=$1, supplier_id=$2, order_date=$3, expected_delivery_date=$4,
         delivery_address=$5, delivery_status=$6, status=$7, total_amount=$8, notes=$9, updated_at=CURRENT_TIMESTAMP
         WHERE id=$10 RETURNING *`,
        [
          order_number,
          supplier_id,
          order_date,
          expected_delivery_date || null,
          delivery_address || null,
          delivery_status,
          status,
          total_amount,
          notes || null,
          id,
        ],
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Purchase order not found" });
      }
      // Replace items
      await client.query(
        "DELETE FROM purchase_order_items WHERE purchase_order_id = $1",
        [id],
      );
      if (items && Array.isArray(items)) {
        for (const item of items) {
          let finalProductId = item.product_id;

          if (!finalProductId && item.item_name) {
            const sku = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newProdRes = await client.query(
              `INSERT INTO products (name, sku, category, unit_price, cost_price, unit) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
              [
                item.item_name,
                sku,
                "Uncategorized",
                item.unit_price || 0,
                item.unit_price || 0,
                item.unit || "pcs",
              ],
            );
            finalProductId = newProdRes.rows[0].id;
          }

          await client.query(
            `INSERT INTO purchase_order_items (purchase_order_id, product_id, item_name, quantity, unit, unit_price, tax_rate, tax_amount, total_price, description, file_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
              id,
              finalProductId || null,
              item.item_name,
              item.quantity,
              item.unit || null,
              item.unit_price,
              item.tax_rate,
              item.tax_amount,
              item.total_price,
              item.description || null,
              item.file_url || null,
            ],
          );

          if (finalProductId && status !== "cancelled") {
            await adjustStock(
              client,
              finalProductId,
              Number(item.quantity) || 0,
            );
          }
        }
      }
      await client.query("COMMIT");
      const updatedPO = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "UPDATE",
        "Purchase Order",
        updatedPO.id,
        {
          order_number,
          supplier_id,
          order_date,
          expected_delivery_date,
          delivery_address,
          delivery_status,
          status,
          total_amount,
          notes,
        },
        req,
      );
      res.json(updatedPO);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error updating PO:", err);
      res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },
);

// Delete Purchase Order
router.delete(
  "/purchase-orders/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { id } = req.params;

      // Revert stock if the order wasn't already cancelled
      const oldOrderRes = await client.query(
        "SELECT status FROM purchase_orders WHERE id = $1",
        [id],
      );
      if (oldOrderRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Purchase order not found" });
      }

      const oldOrderStatus = oldOrderRes.rows[0].status;
      if (oldOrderStatus !== "cancelled") {
        const oldItemsRes = await client.query(
          "SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1",
          [id],
        );
        for (const oldItem of oldItemsRes.rows) {
          if (oldItem.product_id) {
            await adjustStock(
              client,
              oldItem.product_id,
              -Number(oldItem.quantity),
            );
          }
        }
      }

      const result = await client.query(
        "DELETE FROM purchase_orders WHERE id=$1 RETURNING *",
        [id],
      );

      await client.query("COMMIT");
      const deletedPO = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "DELETE",
        "Purchase Order",
        deletedPO.id,
        { order_number: deletedPO.order_number },
        req,
      );
      res.json({ message: "Purchase order deleted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error deleting PO:", err);
      res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },
);

// ==========================================
// BILLS
// ==========================================

router.post(
  "/bills",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        purchase_order_id,
        supplier_id,
        bill_number,
        bill_date,
        due_date,
        total_amount,
        status,
      } = req.body;
      const query = `
                INSERT INTO bills (purchase_order_id, supplier_id, bill_number, bill_date, due_date, total_amount, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
      const result = await pool.query(query, [
        purchase_order_id,
        supplier_id,
        bill_number,
        bill_date,
        due_date,
        total_amount,
        status,
      ]);
      const newBill = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "CREATE",
        "Bill",
        newBill.id,
        {
          purchase_order_id,
          supplier_id,
          bill_number,
          bill_date,
          due_date,
          total_amount,
          status,
        },
        req,
      );

      // Fetch Supplier Email
      let supplierEmail = null;
      let supplierName = "Unknown Supplier";
      if (supplier_id) {
        const supRes = await pool.query(
          "SELECT email, name FROM suppliers WHERE id = $1",
          [supplier_id],
        );
        if (supRes.rows.length > 0) {
          supplierEmail = supRes.rows[0].email;
          supplierName = supRes.rows[0].name;
        }
      }

      if (supplierEmail) {
        const emailHtml = newBillEmail(
          supplierName,
          bill_number,
          bill_date,
          due_date,
          total_amount,
          status,
        );
        sendEmail({
          to: supplierEmail,
          subject: `New Bill: ${bill_number}`,
          html: emailHtml,
        }).catch((err) => console.error("Failed to send Bill email:", err));
      }

      res.status(201).json(newBill);
    } catch (err) {
      console.error("Error creating Bill:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.get(
  "/bills",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `
                SELECT b.*, s.name as supplier_name 
                FROM bills b
                LEFT JOIN suppliers s ON b.supplier_id = s.id
                ORDER BY b.created_at DESC
            `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching Bills:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update Bill
router.put(
  "/bills/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        purchase_order_id,
        supplier_id,
        bill_number,
        bill_date,
        due_date,
        total_amount,
        status,
      } = req.body;
      if (!bill_number?.trim())
        return res.status(400).json({ message: "Bill number is required" });
      const result = await pool.query(
        `UPDATE bills SET purchase_order_id=$1, supplier_id=$2, bill_number=$3, bill_date=$4,
         due_date=$5, total_amount=$6, status=$7, updated_at=CURRENT_TIMESTAMP
         WHERE id=$8 RETURNING *`,
        [
          purchase_order_id || null,
          supplier_id,
          bill_number,
          bill_date,
          due_date || null,
          total_amount,
          status,
          id,
        ],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Bill not found" });
      const updatedBill = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "UPDATE",
        "Bill",
        updatedBill.id,
        {
          purchase_order_id,
          supplier_id,
          bill_number,
          bill_date,
          due_date,
          total_amount,
          status,
        },
        req,
      );
      res.json(updatedBill);
    } catch (err) {
      console.error("Error updating bill:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Bill
router.delete(
  "/bills/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM bills WHERE id=$1 RETURNING *",
        [id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Bill not found" });
      const deletedBill = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "DELETE",
        "Bill",
        deletedBill.id,
        { bill_number: deletedBill.bill_number },
        req,
      );
      res.json({ message: "Bill deleted successfully" });
    } catch (err) {
      console.error("Error deleting bill:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ==========================================
// VENDOR PAYMENTS
// ==========================================

async function updateBillStatus(bill_id: any) {
  if (!bill_id) return;
  const billRes = await pool.query(
    "SELECT total_amount FROM bills WHERE id = $1",
    [bill_id],
  );
  if (billRes.rows.length === 0) return;
  const billTotal = Number(billRes.rows[0].total_amount || 0);

  const paidRes = await pool.query(
    "SELECT SUM(amount) as total_paid FROM vendor_payments WHERE bill_id = $1",
    [bill_id],
  );
  const totalPaid = Number(paidRes.rows[0].total_paid || 0);

  let newStatus = "Unpaid";
  if (totalPaid > 0 && totalPaid < billTotal) newStatus = "Partially Paid";
  else if (totalPaid >= billTotal) newStatus = "Paid";

  await pool.query("UPDATE bills SET status = $1 WHERE id = $2", [
    newStatus,
    bill_id,
  ]);
}

router.post(
  "/vendor-payments",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        bill_id,
        payment_date,
        amount,
        payment_method,
        reference_number,
        proof_of_payment,
      } = req.body;

      if (!proof_of_payment)
        return res
          .status(400)
          .json({ message: "Proof of payment is required" });

      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      const recorded_by = decodedToken.id;

      if (bill_id) {
        const billRes = await pool.query(
          "SELECT total_amount FROM bills WHERE id = $1",
          [bill_id],
        );
        if (billRes.rows.length > 0) {
          const billTotal = Number(billRes.rows[0].total_amount);
          const paidRes = await pool.query(
            "SELECT SUM(amount) as total_paid FROM vendor_payments WHERE bill_id = $1",
            [bill_id],
          );
          const currentlyPaid = Number(paidRes.rows[0].total_paid || 0);

          if (currentlyPaid + Number(amount) > billTotal) {
            return res.status(400).json({
              message: `Payment exceeds remaining bill amount. Remaining: ₹${billTotal - currentlyPaid}`,
            });
          }
        }
      }

      const query = `
                INSERT INTO vendor_payments (bill_id, payment_date, amount, payment_method, reference_number, proof_of_payment, recorded_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
             `;
      const result = await pool.query(query, [
        bill_id,
        payment_date,
        amount,
        payment_method,
        reference_number,
        proof_of_payment || null,
        recorded_by,
      ]);

      if (bill_id) {
        await updateBillStatus(bill_id);
      }

      const newVP = result.rows[0];
      await logAudit(
        recorded_by,
        "CREATE",
        "Vendor Payment",
        newVP.id,
        {
          bill_id,
          payment_date,
          amount,
          payment_method,
          reference_number,
        },
        req,
      );

      // Send Email to Supplier for Vendor Payment
      if (bill_id) {
        try {
          const billDetailsRes = await pool.query(
            `SELECT b.bill_number, s.name as supplier_name, s.email as supplier_email 
             FROM bills b 
             LEFT JOIN suppliers s ON b.supplier_id = s.id 
             WHERE b.id = $1`,
            [bill_id],
          );

          if (billDetailsRes.rows.length > 0) {
            const { bill_number, supplier_name, supplier_email } =
              billDetailsRes.rows[0];

            if (supplier_email) {
              const emailHtml = newVendorPaymentEmail(
                supplier_name || "Valued Supplier",
                bill_number,
                payment_date,
                amount,
                payment_method,
                reference_number,
              );

              const attachments = proof_of_payment
                ? [
                    {
                      filename: `proof_of_payment_bill_${bill_number}.pdf`, // Generic filename since we assume they might be image or pdf. Usually users click to view.
                      path: proof_of_payment,
                    },
                  ]
                : undefined;

              sendEmail({
                to: supplier_email,
                subject: `Payment Processed: Bill #${bill_number}`,
                html: emailHtml,
                attachments,
              }).catch((err) =>
                console.error("Failed to send Vendor Payment email:", err),
              );
            }
          }
        } catch (emailError) {
          console.error("Error preparing Vendor Payment email:", emailError);
        }
      }

      res.status(201).json(newVP);
    } catch (err) {
      console.error("Error creating Payment:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.get(
  "/vendor-payments",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `
                SELECT vp.*, b.bill_number, b.supplier_id, s.name as supplier_name,
                       u.name as recorded_by_name
                FROM vendor_payments vp
                LEFT JOIN bills b ON vp.bill_id = b.id
                LEFT JOIN suppliers s ON b.supplier_id = s.id
                LEFT JOIN users u ON vp.recorded_by = u.id
                ORDER BY vp.created_at DESC
             `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching Vendor Payments:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update Vendor Payment
router.put(
  "/vendor-payments/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        bill_id,
        payment_date,
        amount,
        payment_method,
        reference_number,
        proof_of_payment,
      } = req.body;
      if (!amount || Number(amount) <= 0)
        return res
          .status(400)
          .json({ message: "Amount must be greater than 0" });
      if (!proof_of_payment) {
        // Check if proof_of_payment exists in the database
        const proofCheckRes = await pool.query(
          "SELECT proof_of_payment FROM vendor_payments WHERE id = $1",
          [id],
        );
        if (
          proofCheckRes.rows.length === 0 ||
          !proofCheckRes.rows[0].proof_of_payment
        ) {
          return res
            .status(400)
            .json({ message: "Proof of payment is required" });
        }
      }

      if (bill_id) {
        const billRes = await pool.query(
          "SELECT total_amount FROM bills WHERE id = $1",
          [bill_id],
        );
        if (billRes.rows.length > 0) {
          const billTotal = Number(billRes.rows[0].total_amount);
          const paidRes = await pool.query(
            "SELECT SUM(amount) as total_paid FROM vendor_payments WHERE bill_id = $1 AND id != $2",
            [bill_id, id],
          );
          const currentlyPaid = Number(paidRes.rows[0].total_paid || 0);

          if (currentlyPaid + Number(amount) > billTotal) {
            return res.status(400).json({
              message: `Payment exceeds remaining bill amount. Remaining: ₹${billTotal - currentlyPaid}`,
            });
          }
        }
      }

      const result = await pool.query(
        `UPDATE vendor_payments SET bill_id=$1, payment_date=$2, amount=$3, payment_method=$4, reference_number=$5, proof_of_payment=COALESCE($6, proof_of_payment)
         WHERE id=$7 RETURNING *`,
        [
          bill_id || null,
          payment_date,
          amount,
          payment_method || null,
          reference_number || null,
          proof_of_payment || null,
          id,
        ],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Payment not found" });

      if (result.rows[0].bill_id) {
        await updateBillStatus(result.rows[0].bill_id);
      }
      // If bill_id changed, we need to update the old bill too
      if (req.body.bill_id === undefined && bill_id !== req.body.bill_id) {
        // just covering simple logic here, best relies on fetching original row before update
      }

      const updatedVP = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "UPDATE",
        "Vendor Payment",
        updatedVP.id,
        {
          bill_id,
          payment_date,
          amount,
          payment_method,
          reference_number,
        },
        req,
      );
      res.json(updatedVP);
    } catch (err) {
      console.error("Error updating payment:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete Vendor Payment
router.delete(
  "/vendor-payments/:id",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get bill_id before deleting
      const pmtRes = await pool.query(
        "SELECT bill_id FROM vendor_payments WHERE id = $1",
        [id],
      );
      const billIdToUpdate =
        pmtRes.rows.length > 0 ? pmtRes.rows[0].bill_id : null;

      const result = await pool.query(
        "DELETE FROM vendor_payments WHERE id=$1 RETURNING *",
        [id],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Payment not found" });

      if (billIdToUpdate) {
        await updateBillStatus(billIdToUpdate);
      }

      const deletedVP = result.rows[0];
      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      await logAudit(
        decodedToken.id,
        "DELETE",
        "Vendor Payment",
        deletedVP.id,
        { amount: deletedVP.amount, payment_date: deletedVP.payment_date },
        req,
      );

      res.json({ message: "Payment deleted successfully" });
    } catch (err) {
      console.error("Error deleting payment:", err);
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
      const result = await pool.query(
        "SELECT * FROM product_categories ORDER BY name ASC",
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      if (!name) return res.status(400).json({ message: "Name is required" });

      const result = await pool.query(
        "INSERT INTO product_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *",
        [name],
      );

      if (result.rows.length === 0) {
        // Already exists, fetch it
        const existing = await pool.query(
          "SELECT * FROM product_categories WHERE name = $1",
          [name],
        );
        return res.status(200).json(existing.rows[0]);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;

// ==========================================
// STOCK MOVEMENTS
// ==========================================

// Create Stock Movement (Adjustment, Issuance, etc.)
router.post(
  "/stock-movements",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const {
        product_id,
        warehouse_id,
        to_warehouse_id,
        type,
        quantity,
        reference_id,
        notes,
      } = req.body;

      if (!product_id || !warehouse_id || !type || !quantity || quantity <= 0) {
        return res
          .status(400)
          .json({
            message:
              "Product, Warehouse, valid Quantity, and Type are required.",
          });
      }

      const token = req.cookies.token;
      const decodedToken: any = decodeToken(token);
      const created_by = decodedToken.id;

      await client.query("BEGIN");

      // Verify Product and get Reorder Level
      const productRes = await client.query(
        "SELECT name, reorder_level FROM products WHERE id = $1",
        [product_id],
      );
      if (productRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found" });
      }
      const productData = productRes.rows[0];

      // Verify/Get Stock Level for source warehouse
      let stockRes = await client.query(
        "SELECT id, quantity FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2 FOR UPDATE",
        [product_id, warehouse_id],
      );

      let currentStock = 0;
      let stockLevelId = null;

      if (stockRes.rows.length === 0) {
        if (type === "OUT" || type === "TRANSFER") {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ message: "Insufficient stock in selected warehouse." });
        }
        // If 'IN' or 'ADJUSTMENT', create it
        const newStockRes = await client.query(
          "INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, 0) RETURNING id",
          [product_id, warehouse_id],
        );
        stockLevelId = newStockRes.rows[0].id;
      } else {
        stockLevelId = stockRes.rows[0].id;
        currentStock = Number(stockRes.rows[0].quantity);
      }

      // Check boundaries for OUT and TRANSFER
      if ((type === "OUT" || type === "TRANSFER") && currentStock < quantity) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: `Insufficient stock. Available: ${currentStock}` });
      }

      // Log movement in stock_movements
      const movementQuery = `
        INSERT INTO stock_movements (product_id, warehouse_id, to_warehouse_id, type, quantity, reference_id, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const movementRes = await client.query(movementQuery, [
        product_id,
        warehouse_id,
        to_warehouse_id || null,
        type,
        quantity,
        reference_id || null,
        notes || null,
        created_by,
      ]);

      const newMovement = movementRes.rows[0];

      // Process effect on stock_levels
      let newQuantity = currentStock;
      if (type === "IN") {
        newQuantity += Number(quantity);
      } else if (type === "OUT") {
        newQuantity -= Number(quantity);
      } else if (type === "TRANSFER") {
        newQuantity -= Number(quantity);
        // Handle target warehouse stock
        if (!to_warehouse_id) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ message: "Target warehouse required for TRANSFER." });
        }

        let targetStockRes = await client.query(
          "SELECT id, quantity FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2 FOR UPDATE",
          [product_id, to_warehouse_id],
        );

        if (targetStockRes.rows.length === 0) {
          await client.query(
            "INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)",
            [product_id, to_warehouse_id, quantity],
          );
        } else {
          await client.query(
            "UPDATE stock_levels SET quantity = quantity + $1 WHERE id = $2",
            [quantity, targetStockRes.rows[0].id],
          );
        }
      } else if (type === "ADJUSTMENT") {
        // ADJ can be positive or negative. For this app, let's assume 'quantity' represents the delta (can send negative in API or enforce positive and add a separate flag).
        // Actually, convention usually separates ADJUSTMENT IN vs OUT. We'll add the signed 'quantity' to current.
        newQuantity += Number(quantity);
        if (newQuantity < 0) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({
              message: `Adjustment results in negative stock. Current: ${currentStock}`,
            });
        }
      }

      await client.query(
        "UPDATE stock_levels SET quantity = $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2",
        [newQuantity, stockLevelId],
      );

      await client.query("COMMIT");

      // Audit Log
      await logAudit(
        created_by,
        "CREATE",
        "Stock Movement",
        newMovement.id,
        {
          product_id,
          warehouse_id,
          type,
          quantity,
          notes,
        },
        req,
      );

      // Trigger Low Stock Email if fell below threshold
      const adminEmail = process.env.ADMIN_EMAIL;
      if (
        (type === "OUT" ||
          type === "TRANSFER" ||
          (type === "ADJUSTMENT" && quantity < 0)) &&
        adminEmail &&
        newQuantity <= productData.reorder_level
      ) {
        const emailHtml = lowStockAlertEmail(
          productData.name,
          newQuantity.toString(),
          productData.reorder_level.toString(),
        );
        sendEmail({
          to: adminEmail,
          subject: `Low Stock Alert: ${productData.name}`,
          html: emailHtml,
        }).catch((err) =>
          console.error("Low Stock Alert failed on Stock Movement:", err),
        );
      }

      res.status(201).json(newMovement);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error creating Stock Movement:", err);
      res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },
);

// Get All Stock Movements
router.get(
  "/stock-movements",
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT sm.*, 
               p.name as product_name,
               w.name as warehouse_name,
               tw.name as to_warehouse_name,
               u.name as created_by_name
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        LEFT JOIN warehouses w ON sm.warehouse_id = w.id
        LEFT JOIN warehouses tw ON sm.to_warehouse_id = tw.id
        LEFT JOIN users u ON sm.created_by = u.id
        ORDER BY sm.created_at DESC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching Stock Movements:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);
