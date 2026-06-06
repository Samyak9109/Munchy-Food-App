import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // app password not your gmail password
  },
});

transporter.verify((error) => {
  if (error) console.error("Email server error:", error);
  else console.log("Email server ready");
});

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
  const itemsList = order.items
    .map(
      (item) =>
        `<div style="padding:8px 0;border-bottom:1px solid #eee">${item.food.name} x${item.quantity} — ₹${item.price * item.quantity}</div>`,
    )
    .join("");

  await sendEmail(
    to,
    "Order Placed — Munchy",
    baseTemplate(`
      <h2>Order Placed Successfully! 🎉</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Store:</strong> ${order.store.name}</p>
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
      <p>Your order from <strong>${order.store.name}</strong> has been confirmed.</p>
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
      <p>Head to <strong>${order.store.name}</strong> to pick up your order.</p>
      <p><strong>Address:</strong> ${order.store.address}</p>
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
  const itemsList = order.items
    .map(
      (item) =>
        `<div style="padding:8px 0;border-bottom:1px solid #eee">${item.food.name} x${item.quantity} — ₹${item.price * item.quantity}</div>`,
    )
    .join("");

  await sendEmail(
    to,
    "New Order Received — Munchy",
    baseTemplate(`
      <h2>New Order! 🔔</h2>
      <p><strong>Customer:</strong> ${order.user.name}</p>
      ${itemsList}
      <p style="font-size:18px;font-weight:bold">Total: ₹${order.totalPrice}</p>
      ${order.note ? `<p><strong>Note:</strong> ${order.note}</p>` : ""}
    `),
  );
};

export default sendEmail;
