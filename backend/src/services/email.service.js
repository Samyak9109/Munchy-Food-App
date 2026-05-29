import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error, success) => {
  if (error) console.error("Email server error:", error);
  else console.log("Email server ready");
});

// base email wrapper — consistent styling across all emails
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #FF4500; padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .body { padding: 30px; color: #333; line-height: 1.6; }
    .otp { font-size: 36px; font-weight: bold; color: #FF4500; letter-spacing: 8px; text-align: center; padding: 20px; background: #fff5f0; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #FF4500; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #f1f1f1; padding: 20px; text-align: center; color: #999; font-size: 12px; }
    .status { font-size: 20px; font-weight: bold; color: #FF4500; }
    .order-item { padding: 8px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
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

// ── SEND EMAIL ───────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Munchy" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// ── TEMPLATE 1: EMAIL VERIFICATION ──────────────────────────
export const sendVerificationEmail = async (to, otp) => {
  await sendEmail(
    to,
    "Verify your Munchy account",
    baseTemplate(`
      <h2>Welcome to Munchy! 🎉</h2>
      <p>Thanks for signing up. Use the OTP below to verify your email:</p>
      <div class="otp">${otp}</div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't create a Munchy account, ignore this email.</p>
    `),
  );
};

// ── TEMPLATE 2: PASSWORD RESET ───────────────────────────────
export const sendPasswordResetEmail = async (to, otp) => {
  await sendEmail(
    to,
    "Reset your Munchy password",
    baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Use the OTP below:</p>
      <div class="otp">${otp}</div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request a password reset, ignore this email.</p>
    `),
  );
};

// ── TEMPLATE 3: ORDER PLACED ─────────────────────────────────
export const sendOrderPlacedEmail = async (to, order, otp) => {
  const itemsList = order.items
    .map(
      (item) => `
      <div class="order-item">
        ${item.food.name} x${item.quantity} — ₹${item.price * item.quantity}
      </div>`,
    )
    .join("");

  await sendEmail(
    to,
    "Order Placed — Munchy",
    baseTemplate(`
      <h2>Order Placed Successfully! 🎉</h2>
      <p>Your order has been placed. Here are your details:</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Store:</strong> ${order.store.name}</p>
      <br/>
      <p><strong>Items:</strong></p>
      ${itemsList}
      <div class="total">Total: ₹${order.totalPrice}</div>
      <br/>
      <p>Your pickup OTP:</p>
      <div class="otp">${otp}</div>
      <p>Show this to the restaurant when picking up your order.</p>
    `),
  );
};

// ── TEMPLATE 4: ORDER CONFIRMED ──────────────────────────────
export const sendOrderConfirmedEmail = async (to, order) => {
  await sendEmail(
    to,
    "Order Confirmed — Munchy",
    baseTemplate(`
      <h2>Order Confirmed! ✅</h2>
      <p>Great news! The restaurant has confirmed your order.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Store:</strong> ${order.store.name}</p>
      <p><strong>Total:</strong> ₹${order.totalPrice}</p>
      <p>We'll notify you when your food is ready for pickup.</p>
    `),
  );
};

// ── TEMPLATE 5: ORDER READY ──────────────────────────────────
export const sendOrderReadyEmail = async (to, order) => {
  await sendEmail(
    to,
    "Your food is ready! — Munchy",
    baseTemplate(`
      <h2>Your Food is Ready! 🍕</h2>
      <p>Your order is ready for pickup at <strong>${order.store.name}</strong>.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Address:</strong> ${order.store.address}</p>
      <br/>
      <p>Don't forget your pickup OTP — you'll need it at the restaurant.</p>
    `),
  );
};

// ── TEMPLATE 6: ORDER PICKED UP ──────────────────────────────
export const sendOrderPickedUpEmail = async (to, order) => {
  await sendEmail(
    to,
    "Order Complete — Enjoy your meal!",
    baseTemplate(`
      <h2>Order Complete! 🎊</h2>
      <p>Your order has been picked up successfully.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Total Paid:</strong> ₹${order.totalPrice}</p>
      <br/>
      <p>Enjoy your meal! Don't forget to leave a review. 😊</p>
    `),
  );
};

// ── TEMPLATE 7: NEW ORDER FOR PARTNER ───────────────────────
export const sendNewOrderEmail = async (to, order) => {
  const itemsList = order.items
    .map(
      (item) => `
      <div class="order-item">
        ${item.food.name} x${item.quantity} — ₹${item.price * item.quantity}
      </div>`,
    )
    .join("");

  await sendEmail(
    to,
    "New Order Received — Munchy",
    baseTemplate(`
      <h2>New Order Received! 🔔</h2>
      <p>You have a new order. Please confirm it as soon as possible.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Customer:</strong> ${order.user.name}</p>
      <br/>
      <p><strong>Items:</strong></p>
      ${itemsList}
      <div class="total">Total: ₹${order.totalPrice}</div>
      ${order.note ? `<p><strong>Note:</strong> ${order.note}</p>` : ""}
    `),
  );
};

export default sendEmail;
