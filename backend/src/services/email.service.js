import config from "../config/config.js";

// Token cache for Google OAuth2 access token
let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Exchange the Google refresh token for an access token.
 * Tokens are cached in-memory and refreshed 60 seconds before expiration.
 */
async function getAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now) {
    return cachedAccessToken;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.CLIENT_ID,
      client_secret: config.CLIENT_SECRET,
      refresh_token: config.REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google token refresh failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  // Cache token until 60 seconds before Google's expires_in
  tokenExpiresAt = now + ((data.expires_in || 3600) - 60) * 1000;
  return cachedAccessToken;
}

/**
 * Send an email via the Gmail REST API v1 over HTTPS.
 * Render free tier blocks outbound SMTP ports 25, 465, and 587.
 * Sending via HTTPS to gmail.googleapis.com avoids port blocks completely.
 */
export const sendEmail = async (to, subject, html) => {
  const isDevOrTest = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const missingCreds =
    !config.CLIENT_ID ||
    !config.CLIENT_SECRET ||
    !config.REFRESH_TOKEN ||
    !config.EMAIL_USER;

  // In development/test mode without live credentials, log and gracefully return
  if (isDevOrTest && (missingCreds || config.REFRESH_TOKEN === "test_refresh_token")) {
    console.log(`[Email Mock (${process.env.NODE_ENV})] To: ${to} | Subject: ${subject}`);
    return;
  }

  // Construct MIME RFC 2822 email message
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: "Munchy" <${config.EMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html).toString("base64"),
  ];
  const rawMessage = messageParts.join("\r\n");
  const encodedMessage = Buffer.from(rawMessage).toString("base64url");

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encodedMessage }),
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        // If 401, invalidate cached token and retry once
        if (response.status === 401) {
          cachedAccessToken = null;
          tokenExpiresAt = 0;
          if (attempts < maxAttempts) continue;
        }
        const errBody = await response.text();
        throw new Error(`Gmail API error (${response.status}): ${errBody}`);
      }

      return await response.json();
    } catch (err) {
      if (attempts >= maxAttempts) {
        throw new Error(`Email sending failed after ${attempts} attempts: ${err.message}`);
      }
    }
  }
};

// ── TEMPLATES ────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #FF5352; padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .body { padding: 30px; color: #333; line-height: 1.6; }
    .otp { font-size: 36px; font-weight: bold; color: #FF5352; letter-spacing: 8px; text-align: center; padding: 20px; background: #fff5f0; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f1f1f1; padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🍔 Munchy</h1></div>
    <div class="body">${content}</div>
    <div class="footer">© 2025 Munchy. All rights reserved.</div>
  </div>
</body>
</html>`;

export const sendVerificationEmail = async (to, otp) => {
  await sendEmail(
    to,
    "Verify your Munchy account",
    baseTemplate(`
      <h2>Welcome to Munchy! 🎉</h2>
      <p>Use the OTP below to verify your email:</p>
      <div class="otp">${otp}</div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
    `),
  );
};

export const sendPasswordResetEmail = async (to, otp) => {
  await sendEmail(
    to,
    "Reset your Munchy password",
    baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>Use the OTP below to reset your password:</p>
      <div class="otp">${otp}</div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
    `),
  );
};

export const sendOrderPlacedEmail = async (to, order, otp) => {
  const itemsList = (order.items || [])
    .map(
      (item) =>
        `<div style="padding:8px 0;border-bottom:1px solid #eee">${item.food?.name || item.name} x${item.quantity} — ₹${item.price * item.quantity}</div>`,
    )
    .join("");

  await sendEmail(
    to,
    "Order Placed — Munchy",
    baseTemplate(`
      <h2>Order Placed Successfully! 🎉</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Store:</strong> ${order.store?.name || ""}</p>
      ${itemsList}
      <p style="font-size:18px;font-weight:bold">Total: ₹${order.totalPrice}</p>
      <p>Your pickup OTP:</p>
      <div class="otp">${otp}</div>
      <p>Show this at the restaurant when picking up.</p>
    `),
  );
};

export const sendOrderConfirmedEmail = async (to, order) => {
  await sendEmail(
    to,
    "Order Confirmed — Munchy",
    baseTemplate(`
      <h2>Order Confirmed! ✅</h2>
      <p>Your order from <strong>${order.store?.name || "the restaurant"}</strong> has been confirmed.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p>We'll notify you when your food is ready.</p>
    `),
  );
};

export const sendOrderReadyEmail = async (to, order) => {
  await sendEmail(
    to,
    "Your food is ready! — Munchy",
    baseTemplate(`
      <h2>Your Food is Ready! 🍕</h2>
      <p>Head to <strong>${order.store?.name || "the restaurant"}</strong> to pick up your order.</p>
      ${order.store?.address ? `<p><strong>Address:</strong> ${order.store.address}</p>` : ""}
      <p>Don't forget your pickup OTP from the order placed email.</p>
    `),
  );
};

export const sendOrderPickedUpEmail = async (to, order) => {
  await sendEmail(
    to,
    "Order Complete — Enjoy your meal!",
    baseTemplate(`
      <h2>Order Complete! 🎊</h2>
      <p>Your order has been picked up successfully.</p>
      <p><strong>Total Paid:</strong> ₹${order.totalPrice}</p>
      <p>Enjoy your meal! Don't forget to leave a review. 😊</p>
    `),
  );
};

export const sendNewOrderEmail = async (to, order) => {
  const itemsList = (order.items || [])
    .map(
      (item) =>
        `<div style="padding:8px 0;border-bottom:1px solid #eee">${item.food?.name || item.name} x${item.quantity} — ₹${item.price * item.quantity}</div>`,
    )
    .join("");

  await sendEmail(
    to,
    "New Order Received — Munchy",
    baseTemplate(`
      <h2>New Order! 🔔</h2>
      <p><strong>Customer:</strong> ${order.user?.name || "A customer"}</p>
      ${itemsList}
      <p style="font-size:18px;font-weight:bold">Total: ₹${order.totalPrice}</p>
      ${order.note ? `<p><strong>Note:</strong> ${order.note}</p>` : ""}
    `),
  );
};

export default sendEmail;
