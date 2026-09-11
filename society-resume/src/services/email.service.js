const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "RESOLV <onboarding@resend.dev>";

// Helper: format status nicely
const formatStatus = (status) => {
  const map = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
  };
  return map[status] || status;
};

// Helper: status color
const statusColor = (status) => {
  const map = {
    OPEN: "#F59E0B",
    IN_PROGRESS: "#0992C2",
    RESOLVED: "#10B981",
  };
  return map[status] || "#6B7280";
};

// Email: Complaint submitted confirmation (sent to resident)
const sendComplaintSubmittedEmail = async (toEmail, complaint) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `✅ Complaint Received — #${complaint.id}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F6F6;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
        <!-- Header -->
        <tr>
          <td style="background:#0D9488;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">Resolv</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Smart Complaint Management System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Your complaint has been received.</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
              Thank you for submitting your complaint. Our team will review it shortly. Here's a summary:
            </p>
            <!-- Complaint card -->
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;">Reference</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">#${complaint.id}</p>
                  </td>
                  <td align="right" style="padding-bottom:12px;">
                    <span style="display:inline-block;background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;text-transform:uppercase;">Open</span>
                  </td>
                </tr>
                <tr><td colspan="2" style="border-top:1px solid #E5E7EB;padding-top:12px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Title</p>
                  <p style="margin:0 0 12px;font-size:14px;color:#374151;font-weight:600;">${complaint.title}</p>
                  ${complaint.category ? `<p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Category</p><p style="margin:0 0 12px;font-size:14px;color:#374151;">${complaint.category}</p>` : ""}
                  ${complaint.location ? `<p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Location</p><p style="margin:0;font-size:14px;color:#374151;">${complaint.location}</p>` : ""}
                </td></tr>
              </table>
            </div>
            <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
              You'll receive another email when your complaint status changes. You can also track it from your dashboard.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Resolv Systems · This is an automated notification.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });
  } catch (err) {
    console.error("Failed to send complaint submitted email:", err);
    // Non-fatal — don't throw, just log
  }
};

// Email: Status changed notification (sent to resident)
const sendStatusChangedEmail = async (toEmail, complaint, newStatus) => {
  try {
    const color = statusColor(newStatus);
    const label = formatStatus(newStatus);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `🔔 Complaint #${complaint.id} Status Updated — ${label}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F6F6;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
        <!-- Header -->
        <tr>
          <td style="background:#1F2937;padding:28px 36px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">Resolv</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Status Update Notification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Your complaint status changed.</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
              An update has been made to complaint <strong>#${complaint.id}</strong>. Here are the details:
            </p>
            <!-- Status badge -->
            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;background:${color}20;color:${color};font-size:16px;font-weight:700;padding:10px 28px;border-radius:99px;border:2px solid ${color};">
                ${label}
              </span>
            </div>
            <!-- Complaint card -->
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Complaint Title</p>
              <p style="margin:0 0 12px;font-size:14px;color:#374151;font-weight:600;">${complaint.title}</p>
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Reference</p>
              <p style="margin:0;font-size:14px;color:#374151;">#${complaint.id}</p>
            </div>
            <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
              Log in to your dashboard to view more details or submit additional information.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Resolv Systems · This is an automated notification.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });
  } catch (err) {
    console.error("Failed to send status changed email:", err);
    // Non-fatal — don't throw, just log
  }
};

module.exports = {
  sendComplaintSubmittedEmail,
  sendStatusChangedEmail,
};
