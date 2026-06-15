import database from "../database/db.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function generatePaymentIntent(orderId, totalPrice) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100),
      currency: "inr",
      metadata: { order_id: orderId.toString() }
    });

    // ✅ FINAL FIXED QUERY
    // Hum database ko bata rahe hain ki agar 'payments_order_id_key' hit ho, 
    // toh error mat dena, bas data update kar dena.
    await database.query(
      `INSERT INTO payments (order_id, amount, payment_type, payment_status, payment_intent_id) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT ON CONSTRAINT payments_order_id_key 
       DO UPDATE SET 
         amount = EXCLUDED.amount,
         payment_intent_id = EXCLUDED.payment_intent_id,
         payment_status = EXCLUDED.payment_status`,
      [orderId, totalPrice, "Online", "Pending", paymentIntent.client_secret]
    );

    return { success: true, clientSecret: paymentIntent.client_secret };

  } catch (error) {
    console.error("❌ Stripe/DB Error:", error.message);
    return { success: false, message: error.message };
  }
}