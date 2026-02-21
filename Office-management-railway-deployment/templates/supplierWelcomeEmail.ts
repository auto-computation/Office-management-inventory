export const supplierWelcomeEmail = (
  supplierName: string,
  contactPerson: string,
  email: string,
  phone: string,
) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Supplier Network</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
        .header p { color: #94a3b8; margin: 10px 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
        .value { font-size: 16px; color: #1e293b; font-weight: 500; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .divider { height: 1px; background-color: #e2e8f0; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://autocomputation.com/wp-content/uploads/2025/07/autocomputation-logo.png" alt="Auto Computation Logo" style="max-height: 50px; margin-bottom: 20px;">
            <h1>Welcome to Our Supplier Network! 🤝</h1>
            <p>We look forward to working with you</p>
        </div>
        <div class="content">
            <p style="font-size: 16px; color: #334155;">Hello <strong>${contactPerson}</strong>,</p>
            <p style="margin-bottom: 25px;">Your company, <strong>${supplierName}</strong>, has been officially added to our system as a supplier.</p>
            
            <p>Here are your registered details:</p>

            <div class="card">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                     <div>
                        <span class="label">Company Name</span>
                        <div class="value">${supplierName}</div>
                     </div>
                     <div>
                        <span class="label">Contact Person</span>
                        <div class="value">${contactPerson}</div>
                     </div>
                     <div>
                        <span class="label">Email Address</span>
                        <div class="value">${email}</div>
                     </div>
                     <div>
                        <span class="label">Phone Number</span>
                        <div class="value">${phone || "N/A"}</div>
                     </div>
                </div>
            </div>

            <p style="text-align: center; color: #334155;">If you have any questions or need to update your details, please reach out to us.</p>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #64748b; text-align: center;">
                We are excited about this partnership!
            </p>
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
