import database from "../database/db.js";

export const trackVisualSearchClick = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID required" });
    }

    // Upsert into product_stats table
    const query = `
      INSERT INTO product_stats (product_id, visual_search_clicks, last_clicked_at)
      VALUES ($1, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (product_id) 
      DO UPDATE SET 
        visual_search_clicks = product_stats.visual_search_clicks + 1,
        last_clicked_at = CURRENT_TIMESTAMP;
    `;

    await database.query(query, [productId]);

    // Track user history if logged in (simulated by session or userId from auth middleware)
    if (req.user) {
      await database.query(`
        INSERT INTO browsing_history (user_id, session_id, product_id, category, search_query, is_visual_search)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [req.user.id, req.sessionID || 'session', productId, 'Unknown', 'Visual Search Click', true]);
    }

    res.status(200).json({ success: true, message: "Click tracked for self-learning ranking" });
  } catch (error) {
    console.error("❌ Analytics Tracking Error:", error);
    res.status(500).json({ success: false });
  }
};
