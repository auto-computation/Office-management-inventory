export const lowStockAlertEmail = (
  productName: string,
  currentStock: string | number,
  reorderLevel: string | number,
) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Low Stock Alert</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
        .header p { color: #fecaca; margin: 10px 0 0; font-size: 15px; }
        .content { padding: 30px; }
        .card { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .label { font-size: 12px; text-transform: uppercase; color: #991b1b; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
        .value { font-size: 18px; color: #7f1d1d; font-weight: 700; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
    </style>
    
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://autocomputation.com/wp-content/uploads/2025/07/autocomputation-logo.png" alt="Auto Computation Logo" style="max-height: 50px; margin-bottom: 20px;">
            <h1>⚠️ Low Stock Alert</h1>
            <p>Action Required: Inventory Replenishment</p>
        </div>
        <div class="content">
            <p style="font-size: 16px; color: #334155;">Hello Admin,</p>
            <p>This is an automated alert to notify you that the stock for <strong>${productName}</strong> has fallen to or below its designated reorder level.</p>

            <div class="card">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                     <div>
                        <span class="label">Product Name</span>
                        <div class="value" style="font-size: 16px;">${productName}</div>
                     </div>
                     <div></div>
                     <div>
                        <span class="label">Current Stock</span>
                        <div class="value">${currentStock}</div>
                     </div>
                     <div>
                        <span class="label">Reorder Level</span>
                        <div class="value" style="color: #475569;">${reorderLevel}</div>
                     </div>
                </div>
            </div>

            <p style="color: #475569;">Please review the inventory and place a new purchase order soon to avoid any stockouts.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Auto Computation. All rights reserved.</p>
            <p>This is an automated alert from your inventory management system.</p>
        </div>
    </div>
</body>
</html>
    `;
};
