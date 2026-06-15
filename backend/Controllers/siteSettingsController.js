import database from "../database/db.js";

const DEFAULT_ABOUT = {
  title: "About Balaji Mart",
  subtitle: "Your trusted partner in premium online shopping. We bring the world to your doorstep.",
  mission: "Our mission is to revolutionize e-commerce by providing top-tier products, ultra-fast delivery, and an unmatched user experience that puts the customer first.",
  stats: [
    { label: "Happy Customers", value: "1M+" },
    { label: "Premium Products", value: "50k+" },
    { label: "Delivery Cities", value: "200+" },
    { label: "Years of Trust", value: "5+" }
  ],
  story: "Founded with a vision to make quality shopping accessible to everyone, Balaji Mart has grown from a small startup into a leading e-commerce platform. We partner directly with top brands and manufacturers to ensure authenticity and quality. Whether you're looking for the latest electronics, trendy fashion, or daily essentials, we've got you covered with our extensive catalog and secure payment systems."
};

const DEFAULT_FAQ = [
  {
    category: "Orders & Delivery",
    items: [
      { q: "How do I track my order?", a: "You can track your order in real-time by going to the 'My Orders' section in your profile. Click on any active order to see its live status and delivery agent details." },
      { q: "What is the delivery time?", a: "Standard delivery takes 3-5 business days. For premium members, we offer next-day and same-day delivery options depending on your location." },
      { q: "Do you ship internationally?", a: "Currently, we only ship within the country. However, we are expanding our operations rapidly, so stay tuned!" }
    ]
  },
  {
    category: "Returns & Refunds",
    items: [
      { q: "What is your return policy?", a: "We offer a hassle-free 7-day return policy for most items. The product must be unused, in its original packaging, and with all tags intact." },
      { q: "How do I initiate a return?", a: "Go to 'My Orders', select the item you wish to return, and click on 'Return Item'. A pickup will be scheduled at your convenience." },
      { q: "When will I get my refund?", a: "Once the returned item is received and inspected, the refund will be processed to your original payment method within 3-5 business days." }
    ]
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods are accepted?", a: "We accept all major Credit/Debit Cards, UPI, Net Banking, and Cash on Delivery (COD) for eligible pin codes." },
      { q: "Is it safe to save my card details?", a: "Absolutely! We use bank-level encryption and do not store your CVV. Your data is 100% secure with us." }
    ]
  }
];

// Ensure table exists before querying
async function ensureTable() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) UNIQUE NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export const getAboutSettings = async (req, res) => {
  try {
    await ensureTable();
    let result = await database.query(`SELECT data FROM site_settings WHERE type = 'about'`);
    if (result.rows.length === 0) {
      await database.query(
        `INSERT INTO site_settings (type, data) VALUES ('about', $1)`,
        [JSON.stringify(DEFAULT_ABOUT)]
      );
      result = await database.query(`SELECT data FROM site_settings WHERE type = 'about'`);
    }
    res.status(200).json({ success: true, data: result.rows[0].data });
  } catch (error) {
    console.error("About settings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqSettings = async (req, res) => {
  try {
    await ensureTable();
    let result = await database.query(`SELECT data FROM site_settings WHERE type = 'faq'`);
    if (result.rows.length === 0) {
      await database.query(
        `INSERT INTO site_settings (type, data) VALUES ('faq', $1)`,
        [JSON.stringify(DEFAULT_FAQ)]
      );
      result = await database.query(`SELECT data FROM site_settings WHERE type = 'faq'`);
    }
    res.status(200).json({ success: true, data: result.rows[0].data });
  } catch (error) {
    console.error("FAQ settings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
