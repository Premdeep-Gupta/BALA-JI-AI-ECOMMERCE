import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../database/db.js";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";

// ==============================================================
// 1. AI SPECIAL DAY CAMPAIGN DETECTOR & GENERATOR (GEMINI POWERED)
// ==============================================================
export const detectSpecialDays = catchAsyncErrors(async (req, res, next) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return next(new ErrorHandler("Gemini API key is not configured in backend env.", 500));
  }

  try {
    // A. Fetch current products catalog to allow AI to select matching products
    const productsRes = await database.query("SELECT id, name, category, price, ratings FROM products");
    const products = productsRes.rows;

    const todayDate = new Date().toISOString().split("T")[0];
    
    // B. Build the AI Event Generator prompt
    const geminiPrompt = `
You are an advanced AI E-commerce Campaign Manager.
Today's local date is: ${todayDate}.

Your task is to analyze upcoming famous festivals, shopping events, holidays, national/international occasions, and collection seasons occurring within the next 45 days.

Generate exactly 3 attractive, relevant sales campaign drafts suited for an e-commerce website and mobile app.

For each campaign, you MUST:
1. Provide a title, banner text, a catchy tagline, CTA button text, and discount labels.
2. Formulate brand-identity theme colors (hex colors for bg, text, and accent).
3. Determine a specific "target_category" (e.g. "Electronics", "Fashion", "Home & Kitchen", "Beauty", "Books") that fits the event best.
4. Determine a "design_theme" (e.g. "luxury", "minimalist", "cyberpunk", "gold", "holographic") that fits the aesthetic of the event.
5. Generate premium promotional content: SEO Title, SEO Description, Push Notification Text, Email Campaign Body, and a Social Media Caption.
6. Provide start_date and end_date (in ISO 8601 YYYY-MM-DD HH:MM:SS format) scheduled to start a few days before the event.

CRITICAL RULES:
- Return ONLY a raw JSON array matching the EXACT OUTPUT FORMAT below.
- Do NOT include markdown code blocks, no \`\`\`json, and no explanations.

OUTPUT FORMAT:
[
  {
    "event_name": "Diwali Special",
    "title": "Diwali Mega Fest Sale",
    "banner_text": "Bring Home Prosperity with Up to 60% OFF on Top Picks",
    "tagline": "Shine Bright This Festival of Lights",
    "discount_label": "UP TO 60% OFF",
    "cta_button_text": "Shop Festive",
    "theme_colors": {
      "bg": "#7a0c02",
      "text": "#ffffff",
      "accent": "#ffd700"
    },
    "discount_percentage": 50,
    "target_category": "Home & Kitchen",
    "design_theme": "gold",
    "start_date": "2026-10-25 00:00:00",
    "end_date": "2026-11-02 23:59:59",
    "seo_title": "Diwali Mega Sale | Best Festive Offers",
    "seo_description": "Exclusive discounts on home decors. Get free delivery.",
    "push_notification_text": "🪔 Diwali Sale is Live! Flat 60% OFF on beautiful collections.",
    "email_text": "Celebrate this Festival of Lights with our massive Diwali Mega Fest.",
    "social_media_caption": "Celebrate lights and savings! 🪔 Explore the Diwali Mega Fest."
  }
]
`;

    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
      }),
    });

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // If Gemini fails (e.g., quota exceeded / limit 0), use a premium fallback
    if (!text) {
      console.warn("Gemini API failed or quota exceeded. Using premium fallback data.");
      text = `[
        {
          "event_name": "Weekend Flash Sale",
          "title": "Weekend Mega Deals",
          "banner_text": "Unbeatable prices on electronics and fashion this weekend only.",
          "tagline": "Grab Before It's Gone",
          "discount_label": "FLAT 40% OFF",
          "cta_button_text": "Shop Weekend Deals",
          "theme_colors": { "bg": "#1e3a8a", "text": "#ffffff", "accent": "#60a5fa" },
          "discount_percentage": 40,
          "target_category": "Electronics",
          "design_theme": "cyberpunk",
          "start_date": "${new Date().toISOString()}",
          "end_date": "${new Date(Date.now() + 259200000).toISOString()}",
          "seo_title": "Weekend Mega Deals 2026",
          "seo_description": "Exclusive weekend discounts on top products.",
          "push_notification_text": "⚡ The Weekend Flash Sale is LIVE! Grab 40% OFF now.",
          "email_text": "Don't miss out on our Weekend Mega Deals. Stock up on your favorite items.",
          "social_media_caption": "Weekend vibes just got better with FLAT 40% OFF! 🛍️✨"
        },
        {
          "event_name": "Payday Super Sale",
          "title": "Payday Bonanza",
          "banner_text": "Treat yourself with our ultimate payday collection.",
          "tagline": "You Earned It. Now Enjoy It.",
          "discount_label": "UP TO 30% OFF",
          "cta_button_text": "Treat Yourself",
          "theme_colors": { "bg": "#064e3b", "text": "#ffffff", "accent": "#34d399" },
          "discount_percentage": 30,
          "target_category": "Fashion",
          "design_theme": "luxury",
          "start_date": "${new Date(Date.now() + 86400000).toISOString()}",
          "end_date": "${new Date(Date.now() + 604800000).toISOString()}",
          "seo_title": "Payday Super Sale",
          "seo_description": "Massive payday discounts across all categories.",
          "push_notification_text": "💸 Salary is credited! Time to treat yourself with 30% OFF.",
          "email_text": "Your hard work deserves a reward. Check out our Payday Super Sale.",
          "social_media_caption": "Payday is here! Time to empty your wishlist. 🛒💰"
        }
      ]`;
    } else {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    let generatedCampaigns;
    try {
      generatedCampaigns = JSON.parse(text);
    } catch (err) {
      console.error("Gemini Response parsing failed:", text);
      return res.status(500).json({ success: false, message: "AI response parsing failed. Retry in a few seconds." });
    }

    if (!Array.isArray(generatedCampaigns)) {
      return res.status(500).json({ success: false, message: "AI returned invalid non-array campaign format." });
    }

    // C. Save the campaigns as drafts in the database
    const savedDrafts = [];
    for (const c of generatedCampaigns) {
      // 1. Smart Product Assignment: Query real database products matching AI's target category
      const targetCategory = c.target_category || "All Categories";
      const designTheme = c.design_theme || "luxury";
      
      const prodRes = await database.query(
        "SELECT id FROM products WHERE category ILIKE $1 OR name ILIKE $1 ORDER BY ratings DESC LIMIT 12",
        [`%${targetCategory.split(" ")[0]}%`]
      );
      const productsAssigned = prodRes.rows.map(p => p.id);

      // Clean dates for Postgres
      const start = c.start_date || new Date().toISOString();
      const end = c.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const insertQuery = `
        INSERT INTO sales_campaigns (
          title, banner_text, tagline, discount_label, cta_button_text, 
          theme_colors, discount_percentage, event_name, start_date, end_date, 
          is_ai_generated, is_approved, is_active, product_ids, 
          seo_title, seo_description, push_notification_text, email_text, social_media_caption,
          category, design_theme
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `;
      
      const colors = typeof c.theme_colors === 'object' ? c.theme_colors : { bg: "#000000", text: "#ffffff", accent: "#ff007f" };

      const values = [
        c.title, c.banner_text, c.tagline, c.discount_label, c.cta_button_text || 'Explore Now',
        JSON.stringify(colors), c.discount_percentage || 15, c.event_name, start, end,
        true, false, false, productsAssigned,
        c.seo_title, c.seo_description, c.push_notification_text, c.email_text, c.social_media_caption,
        targetCategory, designTheme
      ];

      const savedRes = await database.query(insertQuery, values);
      savedDrafts.push(savedRes.rows[0]);
    }

    res.status(200).json({
      success: true,
      message: `AI detected and successfully created ${savedDrafts.length} campaign drafts.`,
      campaigns: savedDrafts
    });

  } catch (error) {
    console.error("AI campaign generation error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================
// 2. GET ACTIVE HOMEPAGE CAMPAIGN
// ==============================================================
export const getActiveCampaign = catchAsyncErrors(async (req, res, next) => {
  const query = `
    SELECT * FROM sales_campaigns 
    WHERE is_approved = true AND is_active = true 
    AND start_date <= CURRENT_TIMESTAMP AND end_date >= CURRENT_TIMESTAMP 
    ORDER BY created_at DESC
  `;
  const result = await database.query(query);

  if (result.rows.length === 0) {
    return res.status(200).json({ success: true, active: false, campaigns: [] });
  }

  const activeCampaigns = [];

  for (const campaign of result.rows) {
    let assignedProducts = [];
    if (campaign.product_ids && campaign.product_ids.length > 0) {
      const prodQuery = `
        SELECT id, name, category, price, ratings, images, stock, discount_percentage 
        FROM products 
        WHERE id = ANY($1::uuid[])
      `;
      const prodRes = await database.query(prodQuery, [campaign.product_ids]);
      assignedProducts = prodRes.rows;
    }
    activeCampaigns.push({
      ...campaign,
      products: assignedProducts
    });
  }

  res.status(200).json({
    success: true,
    active: true,
    campaigns: activeCampaigns
  });
});

// ==============================================================
// 3. FETCH ALL CAMPAIGNS (ADMIN & SCHEDULER VIEW)
// ==============================================================
export const getAllCampaigns = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query("SELECT * FROM sales_campaigns ORDER BY start_date ASC");
  res.status(200).json({ success: true, campaigns: result.rows });
});

// ==============================================================
// 4. MANUAL CAMPAIGN CREATION
// ==============================================================
export const createCampaign = catchAsyncErrors(async (req, res, next) => {
  const {
    title, banner_text, tagline, discount_label, cta_button_text,
    theme_colors, discount_percentage, event_name, start_date, end_date,
    product_ids, seo_title, seo_description, push_notification_text,
    email_text, social_media_caption, banner_image, media_assets,
    category, design_theme
  } = req.body;

  if (!title || !banner_text || !tagline || !discount_label || !start_date || !end_date || !event_name) {
    return next(new ErrorHandler("Provide all required fields for scheduling manually.", 400));
  }

  const insertQuery = `
    INSERT INTO sales_campaigns (
      title, banner_text, tagline, discount_label, cta_button_text, 
      theme_colors, discount_percentage, event_name, start_date, end_date, 
      is_ai_generated, is_approved, is_active, product_ids, 
      seo_title, seo_description, push_notification_text, email_text, social_media_caption, banner_image, media_assets,
      category, design_theme
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    RETURNING *
  `;

  const colors = theme_colors || { bg: "#000000", text: "#ffffff", accent: "#ff007f" };
  const productsAssigned = Array.isArray(product_ids) ? product_ids : [];

  const values = [
    title, banner_text, tagline, discount_label, cta_button_text || 'Explore Now',
    JSON.stringify(colors), discount_percentage || 15, event_name, start_date, end_date,
    false, true, false, productsAssigned, // Manually created is auto approved
    seo_title, seo_description, push_notification_text, email_text, social_media_caption, banner_image || null,
    media_assets ? JSON.stringify(media_assets) : JSON.stringify([]),
    category || 'All Categories', design_theme || 'luxury'
  ];

  const result = await database.query(insertQuery, values);
  res.status(201).json({ success: true, message: "Campaign created and scheduled successfully.", campaign: result.rows[0] });
});

// ==============================================================
// 4b. MANUAL CAMPAIGN UPDATE (EDIT MODE)
// ==============================================================
export const updateCampaignDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    title, banner_text, tagline, discount_label, cta_button_text,
    theme_colors, discount_percentage, event_name, start_date, end_date,
    product_ids, seo_title, seo_description, push_notification_text,
    email_text, social_media_caption, banner_image, media_assets,
    category, design_theme
  } = req.body;

  if (!title || !banner_text || !tagline || !start_date || !end_date) {
    return next(new ErrorHandler("Provide required fields for update.", 400));
  }

  const checkCampaign = await database.query("SELECT * FROM sales_campaigns WHERE id = $1", [id]);
  if (checkCampaign.rows.length === 0) return next(new ErrorHandler("Campaign not found.", 404));

  const updateQuery = `
    UPDATE sales_campaigns SET
      title = $1, banner_text = $2, tagline = $3, discount_label = $4, cta_button_text = $5,
      theme_colors = $6, discount_percentage = $7, event_name = $8, start_date = $9, end_date = $10,
      product_ids = $11, seo_title = $12, seo_description = $13, push_notification_text = $14,
      email_text = $15, social_media_caption = $16, banner_image = $17, media_assets = $18,
      category = $19, design_theme = $20, updated_at = CURRENT_TIMESTAMP
    WHERE id = $21
    RETURNING *
  `;

  const colors = theme_colors || { bg: "#000000", text: "#ffffff", accent: "#ff007f" };
  const productsAssigned = Array.isArray(product_ids) ? product_ids : [];

  const values = [
    title, banner_text, tagline, discount_label, cta_button_text || 'Explore Now',
    JSON.stringify(colors), discount_percentage || 15, event_name, start_date, end_date,
    productsAssigned, seo_title, seo_description, push_notification_text, email_text, 
    social_media_caption, banner_image || null, media_assets ? JSON.stringify(media_assets) : JSON.stringify([]),
    category || 'All Categories', design_theme || 'luxury',
    id
  ];

  const result = await database.query(updateQuery, values);
  res.status(200).json({ success: true, message: "Campaign updated successfully.", campaign: result.rows[0] });
});

// ==============================================================
// 5. UPDATE CAMPAIGN STATUS (APPROVE / REJECT / TOGGLE AUTOMATION)
// ==============================================================
export const updateCampaignStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { is_approved, product_ids, is_active } = req.body;

  const checkCampaign = await database.query("SELECT * FROM sales_campaigns WHERE id = $1", [id]);
  if (checkCampaign.rows.length === 0) return next(new ErrorHandler("Campaign not found.", 404));

  let updatedRes;

  if (is_approved !== undefined) {
    updatedRes = await database.query(
      "UPDATE sales_campaigns SET is_approved = $1, is_active = $1 WHERE id = $2 RETURNING *",
      [is_approved, id]
    );
  } else if (is_active !== undefined) {
    updatedRes = await database.query(
      "UPDATE sales_campaigns SET is_active = $1 WHERE id = $2 RETURNING *",
      [is_active, id]
    );
  } else if (product_ids !== undefined) {
    updatedRes = await database.query(
      "UPDATE sales_campaigns SET product_ids = $1 WHERE id = $2 RETURNING *",
      [product_ids, id]
    );
  } else {
    // Toggle overall status
    const currentStatus = checkCampaign.rows[0].is_approved;
    updatedRes = await database.query(
      "UPDATE sales_campaigns SET is_approved = $1, is_active = $1 WHERE id = $2 RETURNING *",
      [!currentStatus, id]
    );
  }

  res.status(200).json({ success: true, message: "Campaign updated successfully.", campaign: updatedRes.rows[0] });
});

// ==============================================================
// 6. DELETE CAMPAIGN
// ==============================================================
export const deleteCampaign = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const result = await database.query("DELETE FROM sales_campaigns WHERE id = $1 RETURNING *", [id]);
  if (result.rows.length === 0) return next(new ErrorHandler("Campaign not found.", 404));
  res.status(200).json({ success: true, message: "Campaign deleted successfully." });
});

// ==============================================================
// 7. TRACK CAMPAIGN ANALYTICS (CLICKS / CONVERSIONS)
// ==============================================================
export const trackCampaignAction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { action } = req.body; // 'click' or 'conversion'

  const checkCampaign = await database.query("SELECT * FROM sales_campaigns WHERE id = $1", [id]);
  if (checkCampaign.rows.length === 0) return next(new ErrorHandler("Campaign not found.", 404));

  let updated;
  if (action === "conversion") {
    updated = await database.query("UPDATE sales_campaigns SET conversions = conversions + 1 WHERE id = $1 RETURNING *", [id]);
  } else {
    updated = await database.query("UPDATE sales_campaigns SET clicks = clicks + 1 WHERE id = $1 RETURNING *", [id]);
  }

  res.status(200).json({ success: true, campaign: updated.rows[0] });
});

// ==============================================================
// 8. GET CAMPAIGN ANALYTICS REPORT
// ==============================================================
export const getCampaignAnalytics = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(`
    SELECT id, title, event_name, clicks, conversions, discount_percentage, 
           start_date, end_date, is_active 
    FROM sales_campaigns 
    ORDER BY created_at DESC
  `);
  res.status(200).json({ success: true, analytics: result.rows });
});

// ==============================================================
// 9. LOG BROWSE HISTORY EVENT ("STILL LOOKING?" TRACKER)
// ==============================================================
export const logBrowseHistory = catchAsyncErrors(async (req, res, next) => {
  const { productId, category } = req.body;
  const userId = req.user?.id || null;
  const sessionId = req.headers["x-session-id"] || "anonymous_session";

  if (!productId || !category) {
    return next(new ErrorHandler("Product ID and category are required to log browsing history.", 400));
  }

  // Insert browsing history tracking record
  await database.query(
    "INSERT INTO browsing_history (user_id, session_id, product_id, category) VALUES ($1, $2, $3, $4)",
    [userId, sessionId, productId, category]
  );

  res.status(201).json({ success: true, message: "Browsing activity logged." });
});

// ==============================================================
// 10. AI PRODUCT RECOMMENDATIONS ("STILL LOOKING?" RECOMMENDATIONS)
// ==============================================================
export const getAIProductRecommendations = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers["x-session-id"] || "anonymous_session";
  const API_KEY = process.env.GEMINI_API_KEY;

  // A. Fetch last 5 browsing history items of this user/session
  let browseQuery = `
    SELECT p.name, p.category 
    FROM browsing_history bh
    JOIN products p ON bh.product_id = p.id
    WHERE (bh.user_id = $1 OR bh.session_id = $2) 
    AND bh.viewed_at >= CURRENT_TIMESTAMP - INTERVAL '48 hours' 
    ORDER BY bh.viewed_at DESC LIMIT 5
  `;
  
  const browseRes = await database.query(browseQuery, [userId, sessionId]);
  
  let targetCategory = req.query.top_category || "";
  let products = [];

  // B. True AI Semantic Recommendation via Gemini 2.0
  if ((browseRes.rows.length > 0 || targetCategory) && API_KEY) {
    try {
      const viewedItems = browseRes.rows.map(r => `${r.name} (${r.category})`).join(", ");
      let promptContext = viewedItems ? `The user recently viewed these products: ${viewedItems}` : `The user is interested in the category: ${targetCategory}`;
      
      const geminiPrompt = `
        You are an AI Product Recommendation Engine.
        ${promptContext}
        Based on this, what exactly is the user looking for? 
        Return ONLY a single 1-3 word keyword phrase representing their intent (e.g. "wireless audio", "casual shoes", "kitchen appliances").
        Do not explain.
      `;
      const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: geminiPrompt }] }] }),
      });
      const data = await response.json();
      const aiIntent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/['"]/g, '');
      
      if (aiIntent) {
        targetCategory = aiIntent; // The AI intent keyword
        const matchQuery = `
          SELECT p.*, COUNT(r.id) AS review_count 
          FROM products p 
          LEFT JOIN reviews r ON p.id = r.product_id
          WHERE (p.name ILIKE $1 OR p.category ILIKE $1) AND p.stock > 0
          GROUP BY p.id 
          ORDER BY p.ratings DESC, p.created_at DESC LIMIT 6
        `;
        const matchRes = await database.query(matchQuery, [`%${targetCategory.split(" ")[0]}%`]);
        products = matchRes.rows;
      }
    } catch (e) {
      console.warn("AI recommendation failed, falling back", e.message);
    }
  }

  // C. Fallback: If AI fails or no results, use the most recently viewed category or targetCategory
  if (products.length < 4 && (browseRes.rows.length > 0 || targetCategory)) {
    targetCategory = targetCategory || browseRes.rows[0].category;
    const matchQuery = `
      SELECT p.*, COUNT(r.id) AS review_count 
      FROM products p 
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.category ILIKE $1 AND p.stock > 0
      GROUP BY p.id 
      ORDER BY p.ratings DESC, p.created_at DESC LIMIT 6
    `;
    const matchRes = await database.query(matchQuery, [`%${targetCategory}%`]);
    products = matchRes.rows;
  }

  // D. Final Fallback: Trending top-rated products
  if (products.length < 4) {
    const trendingQuery = `
      SELECT p.*, COUNT(r.id) AS review_count 
      FROM products p 
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.stock > 0
      GROUP BY p.id 
      ORDER BY p.ratings DESC, p.created_at DESC LIMIT 6
    `;
    const trendingRes = await database.query(trendingQuery);
    products = [...products, ...trendingRes.rows].filter(
      (value, index, self) => self.findIndex(p => p.id === value.id) === index
    ).slice(0, 6);
    if (!targetCategory) targetCategory = "Trending Picks";
  }

  res.status(200).json({
    success: true,
    category: targetCategory,
    products
  });
});

// ==============================================================
// 8. GENERATE AI IMAGE VIA OPENAI
// ==============================================================
// 10. UPLOAD CAMPAIGN MEDIA (IMAGES / VIDEOS)
// ==============================================================
export const uploadCampaignMedia = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("No media files were uploaded.", 400));
  }

  // Handle single or multiple files
  const files = Array.isArray(req.files.media) ? req.files.media : [req.files.media];
  const uploadedAssets = [];

  for (const file of files) {
    // Determine if video or image
    const isVideo = file.mimetype.startsWith("video/");
    
    // Upload to Cloudinary with auto resource_type to handle both images and videos
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "Ecommerce_Campaign_Media",
      resource_type: isVideo ? "video" : "image",
    });

    uploadedAssets.push({
      url: result.secure_url,
      public_id: result.public_id,
      type: isVideo ? "video" : "image"
    });
  }

  res.status(200).json({
    success: true,
    assets: uploadedAssets
  });
});

export const generateImage = catchAsyncErrors(async (req, res, next) => {
  const { prompt } = req.body;
  if (!prompt) {
    return next(new ErrorHandler("Prompt is required for image generation.", 400));
  }

  // 1. AI Prompt Enhancement using Gemini 2.0
  const API_KEY = process.env.GEMINI_API_KEY;
  let enhancedPrompt = prompt;

  if (API_KEY) {
    try {
      const geminiPrompt = `
        You are an expert AI Prompt Engineer for cinematic e-commerce product banners.
        The user wants an image based on this idea: "${prompt}".
        Enhance this into a highly detailed, 4k resolution, hyper-realistic, studio lighting, professional commercial photography prompt.
        Return ONLY the enhanced prompt string. Do not use markdown, quotes, or explanations. Keep it under 500 characters.
      `;
      const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: geminiPrompt }] }] }),
      });
      const data = await response.json();
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiText) {
        enhancedPrompt = aiText.trim().substring(0, 800);
      }
    } catch (e) {
      console.warn("Gemini Prompt Enhancement failed, falling back to original prompt");
    }
  }

  // 2. Generate image using Free Pollinations AI with the enhanced prompt
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=576&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

  // 2. Upload to Cloudinary to make it permanent and optimized
  const uploadResult = await cloudinary.uploader.upload(imageUrl, {
    folder: "Ecommerce_Campaign_Banners",
  });

  res.status(200).json({
    success: true,
    message: "Image generated via Free AI and saved successfully.",
    image_url: uploadResult.secure_url
  });
});
