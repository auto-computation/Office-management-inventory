export const newVendorPaymentEmail = (
  supplierName: string,
  billNumber: string,
  paymentDate: string,
  amount: string | number,
  paymentMethod: string,
  referenceNumber: string,
) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://autocomputation.com/wp-content/uploads/2025/07/autocomputation-logo.png" alt="Auto Computation Logo" style="max-height: 50px; margin-bottom: 20px;">
            <h1>Payment Processed successfully</h1>
            <p>For Bill #${billNumber}</p>
        </div>
        <div class="content">
            <p style="font-size: 16px; color: #334155;">Dear <strong>${supplierName}</strong>,</p>
            <p>A vendor payment has just been processed towards your bill in our system. Here are the details:</p>

            <div class="card">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                     <div>
                        <span class="label">Date of Payment</span>
                        <div class="value">${paymentDate}</div>
                     </div>
                     <div>
                        <span class="label">Amount Paid</span>
                        <div class="value" style="font-weight: 700; color: #0f172a;">₹${amount}</div>
                     </div>
                     <div>
                        <span class="label">Payment Method</span>
                        <div class="value">${paymentMethod || "N/A"}</div>
                     </div>
                     <div>
                        <span class="label">Reference Number</span>
                        <div class="value">${referenceNumber || "N/A"}</div>
                     </div>
                </div>
            </div>

            <p style="color: #475569;">Thank you for your excellent service. If you require further clarification, please get in touch with us.</p>
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
