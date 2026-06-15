import Stripe from "stripe";
import database from "../database/db.js";
import { config } from "dotenv";

config({ path: "./config/config.env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const processPayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID is required" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), 
      currency: "inr",
      metadata: { company: "ShopMate", orderId },
    });

    res.status(200).json({ success: true, client_secret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmPaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentMode } = req.body;

    await database.query('BEGIN');

    // 1. Update Order Table
    await database.query(
      `UPDATE orders SET order_status = 'Processing', paid_at = CURRENT_TIMESTAMP, payment_mode = COALESCE($2, payment_mode) WHERE id = $1`,
      [orderId, paymentMode]
    );

    // 2. Update Payments Table (Check constraint is already removed)
    await database.query(
      `UPDATE payments SET payment_status = 'succeeded' WHERE order_id = $1`,
      [orderId]
    );

    // ✅ DB mein cart_items table nahi hai, isliye hum yahan kuch delete nahi karenge.
    // Frontend Redux state ko handle kar lega.

    await database.query('COMMIT');
    res.status(200).json({ success: true, message: "Payment confirmed in database" });
  } catch (error) {
    await database.query('ROLLBACK');
    console.error("❌ Confirm Payment Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};