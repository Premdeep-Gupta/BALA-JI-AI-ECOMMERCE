import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

// ─── SYSTEM PROMPT BUILDER ───────────────────────────────────────────────────
const buildSystemPrompt = (productContext, conversationHistory, userMessage, emotionHint) => `
You are "Aura", an advanced, emotionally-intelligent AI Sales Agent for BalajiMart — India's premium e-commerce platform.
You are a human-like, premium sales expert who:
- Speaks naturally in a blend of Hinglish and English.
- Empathizes with the user's budget and sentiment.
- Negotiates smartly: if the user asks for a discount or complains about price, offer them the secret code **AURA10** for an additional 10% off.
- Upsells premium upgrades or matching cross-sells.
- Formats product comparisons side-by-side (e.g. Price, Category, and Ratings).
- Always give a clear and definitive "Verdict" comparing the products to state which one is best and why.

STRICT RULES:
1. Keep every reply CONCISE — max 3-4 sentences.
2. Recommend ONLY from the REAL INVENTORY below.
3. If the user wants to add to cart, generate the [ACTION:...] block at the very end.
4. Offer special discount code **AURA10** during price negotiations.
5. If recommending a product, attach its [PRODUCT_CARD:...] block at the end.
6. When comparing items, always analyze their price and ratings, and state clearly which item is the absolute best choose for the customer.

CURRENT INVENTORY (use this only):
${productContext}

CONVERSATION HISTORY:
${conversationHistory}

DETECTED EMOTION: ${emotionHint || 'neutral'}

USER MESSAGE: "${userMessage}"

RESPONSE FORMAT RULES (CRITICAL):
- Normal chat: Reply in plain Hinglish/English text.
- When recommending a product: Add a JSON block at the END like this (do not put it inline):
  [PRODUCT_CARD:{"id":"<id>","name":"<name>","price":<price>,"category":"<category>"}]
- When user wants add to cart: Add at the END:
  [ACTION:{"type":"add_to_cart","product_id":"<id>"}]
- You can include BOTH a PRODUCT_CARD and an ACTION if user is ready to buy.

Respond now as Aura:
`;

// ─── EMOTION DETECTOR ─────────────────────────────────────────────────────────
const detectEmotion = (msg) => {
  const lower = msg.toLowerCase();
  if (/budget|sasta|cheap|kam paise|afford|mehnga|expensive/.test(lower)) return 'budget_conscious';
  if (/frustrated|bakwas|worst|waste|cheating|fraud|kharab/.test(lower)) return 'frustrated';
  if (/excited|great|amazing|best|love|chahiye|perfect/.test(lower)) return 'excited';
  if (/confused|samajh nahi|kya|help|guide|suggest/.test(lower)) return 'needs_guidance';
  if (/compare|difference|vs|better|which one/.test(lower)) return 'comparing';
  if (/add|cart|buy|kharidna|order|le lun|le lo/.test(lower)) return 'ready_to_buy';
  return 'neutral';
};

// ─── VOICE QUERY PARSER ───────────────────────────────────────────────────────
const parseVoiceQuery = (msg) => {
  const lower = msg.toLowerCase();
  let category = null, maxPrice = null, color = null, keyword = null;

  // Category detection
  if (/shoes|chappal|footwear|boot/.test(lower)) category = 'Footwear';
  else if (/phone|mobile|smartphone|iphone/.test(lower)) category = 'Electronics';
  else if (/laptop|computer|pc/.test(lower)) category = 'Electronics';
  else if (/shirt|kurta|saree|dress|clothes|fashion|kapde/.test(lower)) category = 'Fashion';
  else if (/sofa|furniture|chair|table/.test(lower)) category = 'Home & Living';
  else if (/watch|ghadi/.test(lower)) category = 'Accessories';
  else if (/headphone|earphone|speaker/.test(lower)) category = 'Electronics';

  // Price detection — "under 2000", "2000 se kam", "budget 5000"
  const priceMatch = lower.match(/(?:under|below|upto|within|budget|se kam|tak)\s*(?:rs\.?|₹)?\s*(\d[\d,]*)/i);
  if (priceMatch) maxPrice = parseInt(priceMatch[1].replace(/,/g, ''));

  // Color keyword
  const colorMatch = lower.match(/\b(black|white|red|blue|green|yellow|golden|silver|pink|grey|brown)\b/i);
  if (colorMatch) color = colorMatch[1];

  // General keyword (noun-ish)
  const words = lower.replace(/[^\w\s]/g, '').split(/\s+/);
  const stopwords = ['mujhe', 'show', 'dikhao', 'chahiye', 'hai', 'mera', 'under', 'budget', 'best', 'the', 'and', 'or', 'is', 'me', 'ka', 'ki', 'ke', 'se', 'ko', 'ye', 'yeh'];
  keyword = words.find(w => w.length > 3 && !stopwords.includes(w));

  return { category, maxPrice, color, keyword };
};

// ─── LOCAL FALLBACK NLP REASONING ENGINE (100% ONLINE ALWAYS) ──────────────────
const generateLocalFallbackResponse = (message, emotion, products) => {
  const query = message.toLowerCase();
  let reply = "";
  let productCard = null;
  let suggestedProducts = [];
  let cartAction = null;

  const stopwords = ['mujhe', 'show', 'dikhao', 'chahiye', 'hai', 'mera', 'under', 'budget', 'best', 'the', 'and', 'or', 'is', 'me', 'ka', 'ki', 'ke', 'se', 'ko', 'ye', 'yeh', 'prouct', 'product', 'ko', 'bhi', 'achha', 'to', 'dekhao', 'dekhan', 'na', 'kuch', 'aur', 'nhi', 'sahi', 'hona', 'aaye', 'kaisa', 'aisa', 'ek', 'se', 'ho', 'ya', 'koi', 'puchhe', 'bataye', 'kaise', 'sabse', 'jada', 'jyada'];

  // Tokenize user message to extract search keywords
  const queryWords = query
    .replace(/[^\w\s]/g, '') // remove punctuation
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.includes(w));

  // 1. Scoring database products by matching token keywords
  let matched = [];
  if (queryWords.length > 0) {
    const scoredProducts = products.map(p => {
      let score = 0;
      const nameLower = (p.name || "").toLowerCase();
      const descLower = (p.description || "").toLowerCase();
      const catLower = (p.category || "").toLowerCase();
      
      queryWords.forEach(word => {
        if (nameLower.includes(word)) score += 5;
        if (descLower.includes(word)) score += 2;
        if (catLower.includes(word)) score += 3;
      });
      
      return { product: p, score };
    }).filter(item => item.score > 0);
    
    // Sort by score desc, then by rating desc
    scoredProducts.sort((a, b) => b.score - a.score || (b.product.ratings || 0) - (a.product.ratings || 0));
    matched = scoredProducts.map(item => item.product);
  }

  // 2. Intent checks
  if (query.includes("cart") && (query.includes("add") || query.includes("daal") || query.includes("put") || query.includes("insert"))) {
    const target = matched[0] || products.find(p => query.includes(p.name?.toLowerCase()));
    if (target) {
      reply = `Bilkul! Maine **${target.name}** ko aapke cart me add kar diya hai. Checkout karne ke liye top bar me cart open karein! 🛒`;
      cartAction = { type: "add_to_cart", product_id: target.id };
      productCard = { id: target.id, name: target.name, price: target.price, category: target.category };
    } else {
      reply = "Aap kis product ko cart me add karna chahte hain? Please product ka name mention karein! 🛍️";
    }
  } 
  // Comparison Intent (Detailed comparison with verdict)
  else if (query.includes("compare") || query.includes("vs") || query.includes("antar") || query.includes("difference") || query.includes("difference between")) {
    const compareList = [];
    
    // Match named products in query if possible
    products.forEach(p => {
      const nameWords = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopwords.includes(w));
      const matchCount = nameWords.filter(w => query.includes(w)).length;
      if (matchCount >= 2 || (nameWords.length === 1 && query.includes(nameWords[0]))) {
        compareList.push(p);
      }
    });

    // Fallback to top matches
    if (compareList.length < 2) {
      matched.slice(0, 2).forEach(p => {
        if (!compareList.find(x => x.id === p.id)) compareList.push(p);
      });
    }

    // Default first two products fallback
    if (compareList.length < 2) {
      products.slice(0, 2).forEach(p => {
        if (compareList.length < 2 && !compareList.find(x => x.id === p.id)) compareList.push(p);
      });
    }

    if (compareList.length >= 2) {
      const p1 = compareList[0];
      const p2 = compareList[1];
      
      let bestProduct = p1;
      let reason = "";
      
      if (Number(p2.ratings || 0) > Number(p1.ratings || 0)) {
        bestProduct = p2;
        reason = `iski rating (⭐${p2.ratings}) **${p1.name}** (⭐${p1.ratings}) se better hai.`;
      } else if (Number(p2.ratings || 0) === Number(p1.ratings || 0)) {
        if (Number(p2.price) < Number(p1.price)) {
          bestProduct = p2;
          reason = `dono ki ratings identical hain, par **${p2.name}** value-for-money choice hai (cheaper by ₹${Math.abs(p1.price - p2.price).toLocaleString()}).`;
        } else {
          bestProduct = p1;
          reason = `dono ki ratings identical hain, par **${p1.name}** price and feature point of view se value-for-money choice hai.`;
        }
      } else {
        bestProduct = p1;
        reason = `iski customer rating (⭐${p1.ratings}) **${p2.name}** (⭐${p2.ratings || '4.0'}) se behtar hai.`;
      }
      
      reply = `Dono premium products ka side-by-side comparison ready hai:\n\n1. **${p1.name}**\n   - Price: ₹${Number(p1.price).toLocaleString()}\n   - Rating: ⭐${p1.ratings || '4.2'}/5\n\n2. **${p2.name}**\n   - Price: ₹${Number(p2.price).toLocaleString()}\n   - Rating: ⭐${p2.ratings || '4.0'}/5\n\n**Verdict**: In dono me se **${bestProduct.name}** sabse best option lag raha hai kyunki ${reason} 🏆`;
      suggestedProducts = [p1, p2];
    } else {
      reply = "Aap products select karke comparison view dekh sakte hain ya mujhe devices compare karne ko bol sakte hain! ⚖️";
    }
  }
  // Budget & Offers Intent
  else if (query.includes("sasta") || query.includes("budget") || query.includes("discount") || query.includes("offer") || query.includes("under") || query.includes("kam price") || query.includes("coupon") || query.includes("price")) {
    const numbers = query.match(/\d+/g);
    const maxPrice = numbers ? Number(numbers[0]) : 5000;
    
    const budgetMatches = [...products]
      .filter(p => Number(p.price) <= maxPrice)
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 3);
    
    if (budgetMatches.length === 0) {
      budgetMatches.push(...[...products].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 3));
    }
    
    reply = `Aapke budget (₹${maxPrice.toLocaleString()}) ke liye ye matching products best options hain! 💰 Aap special coupon **AURA10** apply karke checkout page par extra 10% discount le sakte hain!`;
    suggestedProducts = budgetMatches.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category }));
  } 
  // Ask about product details / product opinion
  else if (matched.length > 0 && (query.includes("kaisa") || query.includes("about") || query.includes("review") || query.includes("opinion") || query.includes("puch") || query.includes("tell me") || query.includes("information") || query.includes("achha"))) {
    const target = matched[0];
    const ratingStr = target.ratings ? `⭐${target.ratings}/5` : "highly rated";
    reply = `**${target.name}** ek behtareen quality product hai category **${target.category}** me! Iski customer rating **${ratingStr}** hai, jo iski features aur user satisfaction ko confirm karti hai. Ye purchase ke liye ek perfect choice hai! Iske similar options niche cards me check kar sakte hain.`;
    productCard = { id: target.id, name: target.name, price: target.price, category: target.category };
    suggestedProducts = matched.slice(1, 4).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category }));
  }
  // Best Products search
  else if (query.includes("best") || query.includes("top rated") || query.includes("star") || query.includes("high rated")) {
    const topRated = [...products].sort((a, b) => (Number(b.ratings) || 0) - (Number(a.ratings) || 0)).slice(0, 3);
    reply = "Here are the top-rated items with stellar customer reviews in BalajiMart! ⭐ Ye quality aur durability ke liye number 1 choice hain.";
    suggestedProducts = topRated.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category }));
  } 
  // Regular search query with keyword matches
  else if (matched.length > 0) {
    reply = `Sure! Maine matching options filter kiye hain. **${matched[0].name}** is a great choice! 🚀 Aur similar product recommendation specifications niche verify kar sakte hain.`;
    productCard = { id: matched[0].id, name: matched[0].name, price: matched[0].price, category: matched[0].category };
    suggestedProducts = matched.slice(1, 4).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category }));
  } 
  // Fallback Welcome
  else {
    reply = "Namaste! Main BalajiMart ki AI assistant 'Aura' hoon. 🙏 Main aapko items find karne, comparisons compare karne, aur discounts unlock karne me help kar sakti hoon. Aap aaj kya purchase karna chahte hain? 🛍️";
  }

  return { reply, productCard, suggestedProducts, cartAction };
};

// ─── MAIN CONTROLLER ──────────────────────────────────────────────────────────
export const chatWithSalesman = catchAsyncErrors(async (req, res, next) => {
  const { message, context = [], isVoiceQuery = false } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  if (!API_KEY) {
    return res.status(500).json({ success: false, message: "AI Salesman is offline (API Key missing)." });
  }

  try {
    // 1. Detect emotion and intent
    const emotion = detectEmotion(message);
    const voiceIntent = isVoiceQuery ? parseVoiceQuery(message) : null;

    // 2. Build smart product query based on intent
    let productQuery = "SELECT id, name, category, price, stock, ratings, description FROM products WHERE stock > 0";
    const queryParams = [];

    if (voiceIntent?.category) {
      queryParams.push(voiceIntent.category);
      productQuery += ` AND LOWER(category) ILIKE $${queryParams.length}`;
      queryParams[queryParams.length - 1] = `%${voiceIntent.category.toLowerCase()}%`;
    }
    if (voiceIntent?.maxPrice) {
      queryParams.push(voiceIntent.maxPrice);
      productQuery += ` AND price <= $${queryParams.length}`;
    }
    if (voiceIntent?.keyword && !voiceIntent?.category) {
      queryParams.push(`%${voiceIntent.keyword}%`);
      productQuery += ` AND (LOWER(name) ILIKE $${queryParams.length} OR LOWER(description) ILIKE $${queryParams.length})`;
    }
    if (emotion === 'budget_conscious') {
      productQuery += " ORDER BY price ASC";
    } else {
      productQuery += " ORDER BY ratings DESC";
    }
    productQuery += " LIMIT 15";

    const productRes = await database.query(productQuery, queryParams.length > 0 ? queryParams : undefined);
    const productContext = productRes.rows
      .map(p => `ID:${p.id} | ${p.name} | ${p.category} | ₹${p.price} | ⭐${p.ratings || '4.0'}`)
      .join('\n');

    // 3. Build conversation history string
    const convHistory = Array.isArray(context)
      ? context.slice(-6).map(m => `${m.sender === 'user' ? 'Customer' : 'Aura'}: ${m.text}`).join('\n')
      : String(context).slice(0, 500);

    // 4. Build system prompt
    const systemPrompt = buildSystemPrompt(productContext, convHistory, message, emotion);

    // 5. Call Gemini API
    let rawReply = "";
    let data = null;
    let useFallback = false;

    try {
      const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 400,
            topP: 0.95,
          }
        }),
      });

      data = await response.json();
      if (data?.error) {
        console.warn("Gemini API returned error, falling back locally:", data.error.message);
        useFallback = true;
      } else {
        rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (!rawReply) useFallback = true;
      }
    } catch (apiErr) {
      console.warn("Gemini call failed, activating local fallback:", apiErr.message);
      useFallback = true;
    }

    // 6. Local Fallback logic
    if (useFallback) {
      const fallback = generateLocalFallbackResponse(message, emotion, productRes.rows);
      return res.status(200).json({
        success: true,
        reply: fallback.reply,
        emotion,
        productCard: fallback.productCard,
        cartAction: fallback.cartAction,
        suggestedProducts: fallback.suggestedProducts,
        voiceIntent,
        fallbackActive: true
      });
    }

    // 7. Parse structured actions from the reply
    let productCard = null;
    let cartAction = null;
    let cleanReply = rawReply;

    // Extract PRODUCT_CARD
    const cardMatch = rawReply.match(/\[PRODUCT_CARD:(.*?)\]/s);
    if (cardMatch) {
      try {
        productCard = JSON.parse(cardMatch[1]);
        cleanReply = cleanReply.replace(/\[PRODUCT_CARD:.*?\]/s, '').trim();
      } catch (_) {}
    }

    // Extract ACTION
    const actionMatch = rawReply.match(/\[ACTION:(.*?)\]/s);
    if (actionMatch) {
      try {
        cartAction = JSON.parse(actionMatch[1]);
        cleanReply = cleanReply.replace(/\[ACTION:.*?\]/s, '').trim();
      } catch (_) {}
    }

    // 8. Build suggested products list for frontend
    let suggestedProducts = [];
    if ((isVoiceQuery || emotion === 'ready_to_buy' || productCard) && productRes.rows.length > 0) {
      suggestedProducts = productRes.rows.slice(0, 4).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        ratings: p.ratings,
      }));
    }

    res.status(200).json({
      success: true,
      reply: cleanReply,
      emotion,
      productCard,
      cartAction,
      suggestedProducts,
      voiceIntent,
    });

  } catch (error) {
    console.error("AI Salesman Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── VOICE SEARCH ENDPOINT ────────────────────────────────────────────────────
export const voiceSearch = catchAsyncErrors(async (req, res, next) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ success: false, message: "Transcript required" });

  const intent = parseVoiceQuery(transcript);

  let productQuery = "SELECT id, name, category, price, stock, ratings, images FROM products WHERE stock > 0";
  const queryParams = [];

  if (intent.category) {
    queryParams.push(`%${intent.category.toLowerCase()}%`);
    productQuery += ` AND LOWER(category) ILIKE $${queryParams.length}`;
  }
  if (intent.maxPrice) {
    queryParams.push(intent.maxPrice);
    productQuery += ` AND price <= $${queryParams.length}`;
  }
  if (intent.keyword && !intent.category) {
    queryParams.push(`%${intent.keyword}%`);
    productQuery += ` AND (LOWER(name) ILIKE $${queryParams.length} OR LOWER(description) ILIKE $${queryParams.length})`;
  }

  productQuery += " ORDER BY ratings DESC LIMIT 8";

  const result = await database.query(productQuery, queryParams.length > 0 ? queryParams : undefined);

  res.status(200).json({
    success: true,
    products: result.rows,
    intent,
    transcript,
    resultCount: result.rowCount,
  });
});
