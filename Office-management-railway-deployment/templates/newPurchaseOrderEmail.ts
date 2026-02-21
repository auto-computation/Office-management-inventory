export const newPurchaseOrderEmail = (
  supplierName: string,
  orderNumber: string,
  orderDate: string,
  expectedDeliveryDate: string,
  deliveryAddress: string,
  totalAmount: string | number,
  itemsHtml: string,
) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Purchase Order</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
        .container { max-width: 650px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
        .header p { color: #94a3b8; margin: 10px 0 0; font-size: 15px; }
        .content { padding: 30px; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
        .value { font-size: 15px; color: #1e293b; font-weight: 500; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        
        .table-wrapper { overflow-x: auto; margin-top: 25px; border-radius: 8px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin: 0; background-color: #fff; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { color: #334155; font-size: 14px; }
        table tr:last-child td { border-bottom: none; }
        
        .total-amount { font-size: 20px; font-weight: 700; color: #1e293b; text-align: right; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://autocomputation.com/wp-content/uploads/2025/07/autocomputation-logo.png" alt="Auto Computation Logo" style="max-height: 50px; margin-bottom: 20px;">
            <h1>New Purchase Order (#${orderNumber})</h1>
            <p>A new order has been generated for you</p>
        </div>
        <div class="content">
            <p style="font-size: 16px; color: #334155;">Dear <strong>${supplierName}</strong>,</p>
            <p>Please review the details of the new purchase order generated below.</p>

            <div class="card">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                     <div>
                        <span class="label">Order Date</span>
                        <div class="value">${orderDate}</div>
                     </div>
                     <div>
                        <span class="label">Expected Delivery</span>
                        <div class="value">${expectedDeliveryDate || "N/A"}</div>
                     </div>
                     <div style="grid-column: span 2;">
                        <span class="label">Delivery Address</span>
                        <div class="value">${deliveryAddress || "N/A"}</div>
                     </div>
                </div>
            </div>

            <h3 style="color: #1e293b; margin-top: 30px; margin-bottom: 10px;">Order Items</h3>
            <div class="table-wrapper">
                ${itemsHtml}
            </div>

            <div class="total-amount">
                Total Amount: ₹${totalAmount}
            </div>

            <p style="margin-top: 30px; font-size: 15px; color: #475569;">Please review the order and process it at your earliest convenience.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Auto Computation. All rights reserved.</p>
            <p>Please do not reply to this automated email.</p>
        </div>
    </div>
</body>
</html>
    `;
};
