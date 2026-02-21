export const newBillEmail = (
  supplierName: string,
  billNumber: string,
  billDate: string,
  dueDate: string,
  totalAmount: string | number,
  status: string,
) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Bill Generated</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
        .header p { color: #94a3b8; margin: 10px 0 0; font-size: 15px; }
        .content { padding: 30px; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
        .value { font-size: 16px; color: #1e293b; font-weight: 500; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: #e2e8f0; color: #475569; }
        .status-pending { background-color: #fef3c7; color: #d97706; }
        .status-paid { background-color: #dcfce3; color: #166534; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://autocomputation.com/wp-content/uploads/2025/07/autocomputation-logo.png" alt="Auto Computation Logo" style="max-height: 50px; margin-bottom: 20px;">
            <h1>New Bill Recorded</h1>
            <p>Bill #${billNumber}</p>
        </div>
        <div class="content">
            <p style="font-size: 16px; color: #334155;">Dear <strong>${supplierName}</strong>,</p>
            <p>A new bill has been successfully recorded in our system. Here are the details:</p>

            <div class="card">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                     <div>
                        <span class="label">Date of Bill</span>
                        <div class="value">${billDate}</div>
                     </div>
                     <div>
                        <span class="label">Due Date</span>
                        <div class="value">${dueDate || "N/A"}</div>
                     </div>
                     <div>
                        <span class="label">Total Amount</span>
                        <div class="value" style="font-weight: 700; color: #0f172a;">₹${totalAmount}</div>
                     </div>
                     <div>
                        <span class="label">Status</span>
                        <div class="status-badge ${status?.toLowerCase() === "pending" ? "status-pending" : status?.toLowerCase() === "paid" ? "status-paid" : ""}">
                            ${status || "Pending"}
                        </div>
                     </div>
                </div>
            </div>

            <p style="color: #475569;">We will process the payment according to our agreed terms.</p>
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
