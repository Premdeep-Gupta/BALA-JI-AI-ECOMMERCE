import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

// ─── SYSTEM PROMPT BUILDER ───────────────────────────────────────────────────
const buildSystemPrompt = (productContext, conversationHistory, userMessage, emotionHint) => `
You are "Salesman", an advanced, emotionally-intelligent AI Sales Agent for BalajiMart — India's premium e-commerce platform.
You are a human-like, premium sales expert who:
- Detects the language and script of the user's message (e.g. Hindi, Hinglish, Tamil, Telugu, Bengali, Kannada, Marathi, Gujarati, Malayalam, Punjabi, English, etc.) and ALWAYS responds in the exact same language and script that the user used.
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
7. You must identify the user's language and respond in that exact language and script (e.g., Devanagari script for Hindi, Tamil script for Tamil, Bengali script for Bengali).

CURRENT INVENTORY (use this only):
${productContext}

CONVERSATION HISTORY:
${conversationHistory}

DETECTED EMOTION: ${emotionHint || 'neutral'}

USER MESSAGE: "${userMessage}"

RESPONSE FORMAT RULES (CRITICAL):
- Normal chat: Reply in plain text using the user's detected language and script.
- When recommending a product: Add a JSON block at the END like this (do not put it inline):
  [PRODUCT_CARD:{"id":"<id>","name":"<name>","price":<price>,"category":"<category>"}]
- When user wants add to cart: Add at the END:
  [ACTION:{"type":"add_to_cart","product_id":"<id>"}]
- You can include BOTH a PRODUCT_CARD and an ACTION if user is ready to buy.

Respond now as Salesman:
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

// ─── QUERY NORMALIZER (handles Hinglish typos) ────────────────────────────────
const normalizeQueryText = (msg) => {
  if (!msg) return "";
  return msg.toLowerCase()
    .replace(/sumsung|samsang|sumsang|samsong/g, 'samsung')
    .replace(/iphon\b|ipone/g, 'iphone')
    .replace(/leptop|laptep|lapy/g, 'laptop')
    .replace(/mobaile|mobail/g, 'mobile')
    .replace(/shus|juta|jute/g, 'shoes')
    .replace(/sare\b|sari/g, 'saree');
};

// ─── 22-LANGUAGE TRANSLITERATION DICTIONARY ────────────────────────────────────
const transliterateNonEnglishTokens = {
  // Samsung
  "सैमसंग": "samsung", "सेमसंग": "samsung", "समसंग": "samsung",
  "স্যামসাং": "samsung", "স্যামসং": "samsung", "সেমসেং": "samsung",
  "சாம்சங்": "samsung", "சேம்சுங்": "samsung",
  "సామ్‌సంగ్": "samsung", "శామ్‌సంగ్": "samsung", "సామ్సంగ్": "samsung", "శామ్సంగ్": "samsung",
  "ಸ್ಯಾಮ್ಸಂಗ್": "samsung", "ಸ್ಯಾಮ್‌ಸಂಗ್": "samsung",
  "സാംസങ്": "samsung", "സാംസങ്ങ്": "samsung",
  "સેમસંગ": "samsung",
  "ਸੈਮਸੰਗ": "samsung", "ਸੈਮਸੰਗੁ": "samsung",
  "ସାମସଙ୍ଗ": "samsung", "ସାମସଙ୍ਗ୍": "samsung",
  "سیمسنگ": "samsung", "سام سنگ": "samsung", "سامسنگ": "samsung",

  // iPhone
  "आईफोन": "iphone", "आइफोन": "iphone", "आईफ़ोन": "iphone", "आइफ़ोन": "iphone",
  "아이폰": "iphone",
  "আইফোন": "iphone", "আইফন": "iphone",
  "ஐபோன்": "iphone",
  "ఐఫోన్": "iphone",
  "ಐಫೋನ್": "iphone",
  "ഐഫോൺ": "iphone",
  "આઇફોન": "iphone", "આઈફોન": "iphone",
  "ਆਈਫੋਨ": "iphone",
  "ଆଇଫୋନ୍": "iphone", "ଆଇଫୋନ": "iphone",
  "آئی فون": "iphone", "آئیفون": "iphone", "ایں فون": "iphone",

  // Apple
  "एप्पल": "apple", "एपल": "apple", "ऍपल": "apple", "एप्ल": "apple", "सेब": "apple",
  "অ্যাপেল": "apple", "আপেল": "apple", "অ্যাপল": "apple",
  "ஆப்பிள்": "apple", "ஆப்பில்": "apple",
  "యాపిల్": "apple", "ఆపిల్": "apple",
  "ಆಪಲ್": "apple",
  "ആപ്പിൾ": "apple",
  "એપલ": "apple",
  "ਐਪਲ": "apple",
  "ਆਪਲ୍": "apple", "ਆਪଲ": "apple", "ସେଓ": "apple",
  "ایپل": "apple", "سیب": "apple",

  // Laptop
  "लैपटॉप": "laptop", "लेपटॉप": "laptop", "लेपटोप": "laptop", "लैपटोप": "laptop",
  "ল্যাপটপ": "laptop", "লেপটপ": "laptop",
  "லேப்டாப்": "laptop", "மடிக்கணினி": "laptop",
  "ల్యాప్‌టాప్": "laptop", "లాప్‌టాప్": "laptop", "లాప్టాప్": "laptop", "ల్యాప్టాప్": "laptop",
  "ಲ್ಯಾಪ್‌ಟಾಪ್": "laptop", "ಲ್ಯಾಪ್ಟಾಪ್": "laptop",
  "ലാപ്ടോപ്പ്": "laptop", "ലാപ്ടോപ്": "laptop",
  "લેપટોપ": "laptop",
  "ਲੈਪਟਾਪ": "laptop", "ਲੈਪਟੌਪ": "laptop",
  "ଲାପଟପ୍": "laptop", "ଲାପଟପ": "laptop",
  "لیپ ٹاپ": "laptop", "لیپٹاپ": "laptop",

  // Mobile / Phone
  "मोबाइल": "mobile", "मोबाईल": "mobile", "फोन": "mobile", "फ़ोन": "mobile", "स्मार्टफोन": "mobile", "स्मार्टफ़ोन": "mobile",
  "মোবাইল": "mobile", "ফোন": "mobile", "স্মार्टফোন": "mobile",
  "மொபைல்": "mobile", "போன்": "mobile", "தொலைபேசி": "mobile", "ஸ்மார்ட்போன்": "mobile",
  "మొబైల్": "mobile", "ఫోన్": "mobile", "స్మార్ట్‌ఫోన్": "mobile",
  "ಮೊಬೈಲ್": "mobile", "ಮೊಬైಲ್": "mobile", "ಫೋನ್": "mobile", "ಸ್ಮಾರ್ಟ್ಫೋನ್": "mobile",
  "മൊബൈൽ": "mobile", "ഫോൺ": "mobile", "സ്മാർട്ട്ഫോൺ": "mobile",
  "મોબાઇલ": "mobile", "મોಬાઈલ": "mobile", "ફોન": "mobile", "સ્માર્ટফোন": "mobile",
  "ਮੋਬਾਈਲ": "mobile", "ਫੋਨ": "mobile", "ਸਮਾਰਟਫੋน": "mobile",
  "ਮୋବାଇਲ୍": "mobile", "ਮୋବାଇଲ": "mobile", "ଫୋନ୍": "mobile", "ଫୋନ": "mobile",
  "موبائل": "mobile", "فون": "mobile", "اسمارٹ فون": "mobile",

  // Shoes / Footwear
  "जूते": "shoes", "जूता": "shoes", "शूज़": "shoes", "शयूज": "shoes", "चप्पल": "shoes", "फुटवियर": "shoes", "स्लीपर्स": "shoes",
  "জুতো": "shoes", "জুতা": "shoes", "শু": "shoes", "চটি": "shoes",
  "காலணி": "shoes", "செருப்பு": "shoes", "ஷூ": "shoes",
  "బూట్లు": "shoes", "చెప్పులు": "shoes", "షూస్": "shoes", "షూ": "shoes",
  "ಶೂಗಳು": "shoes", "ಶೂ": "shoes", "ಚಪ್ಪಲಿ": "shoes",
  "ഷൂസ്": "shoes", "ഷൂ": "shoes", "ചെരുപ്പ്": "shoes",
  "જૂતા": "shoes", "બૂট": "shoes", "ચંપલ": "shoes", "શૂઝ": "shoes",
  "ਜੁੱਤੇ": "shoes", "ਜੁੱਤੀ": "shoes", "ਸ਼ੂਜ਼": "shoes",
  "ଜୋତା": "shoes", "ଚପଲ": "shoes", "ଶୁଜ୍": "shoes",
  "جوتے": "shoes", "جوتا": "shoes", "شوز": "shoes", "چپل": "shoes",

  // Saree / Sari
  "साड़ी": "saree", "साड़ी": "saree", "साडी": "saree",
  "শাড়ি": "saree", "শাড়ী": "saree", "সাড়ি": "saree",
  "புடவை": "saree", "சேலை": "saree",
  "చీర": "saree", "చీరలు": "saree",
  "ಸೀರೆ": "saree", "ಸೀರೆಗಳು": "saree",
  "സാരി": "saree", "സാരികൾ": "saree",
  "સાડી": "saree",
  "ਸਾੜ੍ਹੀ": "saree", "ਸਾੜੀ": "saree",
  "ଶାଢ଼ୀ": "saree", "ଶାଢୀ": "saree",
  "ساڑھی": "saree", "ساڑی": "saree",

  // Book / Books
  "किताब": "books", "किताबें": "books", "पुस्तक": "books", "पुस्तकें": "books", "बुक": "books", "बुक्स": "books",
  "বই": "books", "বইপত্র": "books", "পুস্তক": "books",
  "புத்தகம்": "books", "புத்தகங்கள்": "books", "நூல்": "books",
  "పుస్తకం": "books", "పుస్తకాలు": "books",
  "ಪುಸ್ತಕ": "books", "ಪುレスレットಗಳು": "books",
  "ಪುಸ್ತಕಗಳು": "books",
  "പുസ്തകം": "books", "പുസ്തകങ്ങൾ": "books", "ബുക്ക്": "books",
  "ચોપડી": "books", "પુસ્તક": "books", "ચોપડીઓ": "books", "પુસ્તકો": "books",
  "ਕਿਤਾਬ": "books", "ਕਿਤਾਬਾਂ": "books", "ਪੁਸਤਕ": "books",
  "ବହି": "books", "ପୁସ୍ତକ": "books",
  "کتاب": "books", "کتابیں": "books", "کتب": "books", "بکس": "books",

  // Watch / Watches
  "घड़ी": "watch", "घड़ी": "watch", "घड़ियाँ": "watch", "घड़ियां": "watch", "वॉच": "watch", "वाच": "watch",
  "ঘড়ি": "watch", "ঘড়ি": "watch",
  "கடிகாரம்": "watch", "வாட்ச்": "watch",
  "வாச்": "watch", "వాచ్": "watch", "వాచీలు": "watch", "గడియారం": "watch",
  "ವಾಚ್": "watch", "ಗಡಿಯಾರ": "watch",
  "വാച്ച്": "watch", "ഘടികാരം": "watch",
  "ઘડિયાળ": "watch", "વોચ": "watch",
  "ਘੜੀ": "watch", "ਘੜੀਆਂ": "watch", "ਵਾਚ": "watch",
  "ଘଣ୍ଟା": "watch", "ଘଡ଼ି": "watch", "ୱାଚ୍": "watch",
  "گھڑی": "watch", "گھڑیاں": "watch", "واچ": "watch",

  // Groceries / Grocery
  "किराना": "grocery", "राशन": "grocery", "ग्रॉसरी": "grocery", "ग्रोसरी": "grocery",
  "মুদিখানা": "grocery", "মুদি": "grocery", "গ্রোসারি": "grocery",
  "மளிகை": "grocery",
  "కిరాణా": "grocery", "గ్రాసరీ": "grocery",
  "ದินಸಿ": "grocery",
  "ದಿನಸಿ ಸಾಮಗ್ರಿಗಳು": "grocery",
  "പലചരക്ക്": "grocery", "ഗ്രോസറി": "grocery",
  "ਕਰિયાણું": "grocery", "ગ્રોસરી": "grocery",
  "ਕਰਿਆਨਾ": "grocery", "ਰਾਸ਼ਨ": "grocery",
  "ଗ୍ରୋସରୀ": "grocery", "ରାସନ": "grocery",
  "راشن": "grocery", "کریانہ": "grocery", "گروسری": "grocery"
};

// Helper to preprocess multi-word combinations in non-English scripts
const preProcessMultilingualText = (text) => {
  if (!text) return "";
  let clean = text;
  
  clean = clean.replace(/आई\s+फोन/g, "आईफोन");
  clean = clean.replace(/आइ\s+फोन/g, "आइफोन");
  clean = clean.replace(/আই\s+ফোন/g, "আইফোন");
  clean = clean.replace(/ஐ\s+போன்/g, "ஐபோன்");
  clean = clean.replace(/ఐ\s+ఫోన్/g, "ఐఫోన్");
  clean = clean.replace(/ಐ\s+ಫೋನ್/g, "ಐಫೋನ್");
  clean = clean.replace(/ഐ\s+ഫോൺ/g, "ಐഫോൺ");
  clean = clean.replace(/આઇ\s+ફોન/g, "આઇફોન");
  clean = clean.replace(/ਆਈ\s+ਫੋਨ/g, "ਆਈਫੋਨ");
  clean = clean.replace(/ਆਈ\s+ଫୋନ୍/g, "ਆਈଫୋନ୍");
  clean = clean.replace(/آئی\s+فون/g, "آئیفون");
  clean = clean.replace(/ایں\s+فون/g, "آئیفون");

  clean = clean.replace(/سام\s+سنگ/g, "سامسنگ");
  
  return clean;
};

// ─── EXTRACT SEARCH TOKENS ───────────────────────────────────────────────────
export const extractSearchTokens = (queryText) => {
  if (!queryText) return [];
  
  const preprocessed = preProcessMultilingualText(queryText);
  const cleanText = preprocessed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘]/g, " ");
  const rawWords = cleanText.split(/\s+/).filter(Boolean);
  
  const stopwords = [
    'mujhe', 'show', 'dikhao', 'chahiye', 'hai', 'mera', 'under', 'budget', 'best', 'the', 'and', 'or', 'is', 'me', 'ka', 'ki', 'ke', 'se', 'ko', 'ye', 'yeh',
    'dikhan', 'dikhana', 'dikhaye', 'dikhayein', 'dhoondo', 'find', 'search', 'list', 'lelo', 'kharidna', 'purchase', 'le', 'jo', 'ho', 'bhi', 'ek', 'ko', 'bhi', 'kuch', 'aur', 'nhi', 'sahi', 'hona',
    'vs', 'versus', 'compare', 'with', 'about', 'information', 'details', 'detail'
  ];

  const tokens = [];
  
  for (const word of rawWords) {
    const wordLower = word.toLowerCase();
    
    if (transliterateNonEnglishTokens[wordLower]) {
      tokens.push(transliterateNonEnglishTokens[wordLower]);
    } else if (transliterateNonEnglishTokens[word]) {
      tokens.push(transliterateNonEnglishTokens[word]);
    } else {
      const normalizedWord = normalizeQueryText(wordLower);
      if (normalizedWord && !stopwords.includes(normalizedWord)) {
        tokens.push(normalizedWord);
      }
    }
  }
  
  return [...new Set(tokens)];
};

// ─── RELEVANCE SEARCH QUERY BUILDER ───────────────────────────────────────────
const buildRelevanceSearchQuery = (tokens, baseQuery = "SELECT id, name, category, price, stock, ratings, description, images", options = {}) => {
  if (!tokens || tokens.length === 0) {
    return {
      query: `${baseQuery} FROM products WHERE stock > 0 ORDER BY ratings DESC LIMIT ${options.limit || 15}`,
      params: []
    };
  }

  const params = [];
  const scoreParts = [];
  
  tokens.forEach((token, index) => {
    params.push(`%${token.toLowerCase()}%`);
    const pIdx = params.length;
    
    scoreParts.push(`
      (CASE WHEN LOWER(name) ILIKE $${pIdx} THEN 10 ELSE 0 END) +
      (CASE WHEN LOWER(category) ILIKE $${pIdx} THEN 5 ELSE 0 END) +
      (CASE WHEN LOWER(description) ILIKE $${pIdx} THEN 2 ELSE 0 END)
    `);
  });

  const scoreSql = `(${scoreParts.join(" + ")})`;
  let query = `${baseQuery}, ${scoreSql} AS relevance_score FROM products WHERE stock > 0`;
  
  if (options.maxPrice) {
    params.push(options.maxPrice);
    query += ` AND price <= $${params.length}`;
  }
  if (options.category) {
    params.push(`%${options.category.toLowerCase()}%`);
    query += ` AND LOWER(category) ILIKE $${params.length}`;
  }
  if (options.color) {
    params.push(`%${options.color.toLowerCase()}%`);
    query += ` AND (LOWER(name) ILIKE $${params.length} OR LOWER(description) ILIKE $${params.length})`;
  }

  query += ` AND ${scoreSql} > 0`;

  if (options.sortByPrice) {
    query += ` ORDER BY relevance_score DESC, price ASC, ratings DESC`;
  } else {
    query += ` ORDER BY relevance_score DESC, ratings DESC`;
  }
  
  query += ` LIMIT ${options.limit || 15}`;

  return { query, params };
};

// ─── VOICE QUERY PARSER ───────────────────────────────────────────────────────
const parseVoiceQuery = (msg) => {
  const tokens = extractSearchTokens(msg);
  const transliteratedMessage = tokens.join(" ");
  const lower = transliteratedMessage.toLowerCase();
  let category = null, maxPrice = null, color = null, keyword = null;

  // Category detection for all 9 categories in database
  if (/\b(shoes|chappal|footwear|boot|shoe)\b/.test(lower)) category = 'Footwear';
  else if (/\b(phone|mobile|smartphone|iphone|android|samsung|oneplus)\b/.test(lower)) category = 'Mobiles';
  else if (/\b(laptop|computer|pc|television|tv|fridge|refrigerator|washing machine|ac|air conditioner|electronics|gadget)\b/.test(lower)) category = 'Electronics';
  else if (/\b(shirt|kurta|saree|sari|dress|clothes|fashion|kapde|jeans|tshirt)\b/.test(lower)) category = 'Fashion';
  else if (/\b(sofa|furniture|chair|table|bed|curtain)\b/.test(lower)) category = 'Home & Living';
  else if (/\b(watch|ghadi|necklace|ring|bag|backpack)\b/.test(lower)) category = 'Accessories';
  else if (/\b(book|novel|comic|read|author|literature|books)\b/.test(lower)) category = 'Books';
  else if (/\b(sports|bat|ball|cricket|football|gym|exercise|fitness|badminton)\b/.test(lower)) category = 'Sports';
  else if (/\b(car|bike|motorcycle|helmet|automotive|tyre|cleaner|car wax)\b/.test(lower)) category = 'Automotive';
  else if (/\b(grocery|food|snack|oil|biscuit|shampoo|soap|paste)\b/.test(lower)) category = 'Grocery';

  // Price detection
  const priceInput = (msg + " " + lower).toLowerCase();
  const priceMatch = priceInput.match(/(?:under|below|upto|within|budget|se kam|tak|से कम|ಕಡಿಮೆ|కంటే తక్కువ|குறைவாக|കുറഞ്ഞ|કરતા ઓછું|ਤੋਂ ਘੱਟ|ଠାରು କମ୍|سے کم)\s*(?:rs\.?|₹)?\s*(\d[\d,]*)/i);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1].replace(/,/g, ''));
  } else {
    const rawNumberMatch = priceInput.match(/\b\d[\d,]*\b/);
    if (rawNumberMatch) {
      const val = parseInt(rawNumberMatch[0].replace(/,/g, ''));
      if (val >= 100 && val <= 500000) {
        maxPrice = val;
      }
    }
  }

  // Color keyword
  const colorMatch = lower.match(/\b(black|white|red|blue|green|yellow|golden|silver|pink|grey|brown)\b/i);
  if (colorMatch) color = colorMatch[1];

  // General keyword (noun-ish)
  const stopwords = [
    'mujhe', 'show', 'dikhao', 'chahiye', 'hai', 'mera', 'under', 'budget', 'best', 'the', 'and', 'or', 'is', 'me', 'ka', 'ki', 'ke', 'se', 'ko', 'ye', 'yeh',
    'dikhan', 'dikhana', 'dikhaye', 'dikhayein', 'dhoondo', 'find', 'search', 'list', 'lelo', 'kharidna', 'purchase', 'le', 'jo', 'ho', 'bhi', 'ek', 'ko', 'bhi', 'kuch', 'aur', 'nhi', 'sahi', 'hona'
  ];
  keyword = tokens.find(w => w.length > 3 && !stopwords.includes(w) && w !== category?.toLowerCase() && w !== color);
  if (!keyword) {
    keyword = tokens.find(w => w.length > 2 && !stopwords.includes(w));
  }

  return { category, maxPrice, color, keyword, tokens };
};

// ─── LOCAL FALLBACK NLP REASONING ENGINE (100% ONLINE ALWAYS) ──────────────────
const detectQueryLanguage = (text) => {
  if (!text) return 'en';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or';
  if (/[\u0600-\u06FF]/.test(text)) return 'ur';
  if (/\b(dikhao|chahiye|hai|sasta|kam|mili|he|ko|se|ya|bhi|kuch|aur|nhi|sahi|hai|kar|diya|karein|karta|hai|namaste|lelo|juta|jute|sari|saree)\b/.test(text.toLowerCase())) return 'hi_hinglish';
  return 'en';
};

const LOCALIZED_RESPONSES = {
  en: {
    addToCartSuccess: (name) => `Sure! I have added **${name}** to your cart. Open the cart in the top bar to checkout! 🛒`,
    addToCartSpecify: "Which product would you like to add to your cart? Please specify the product name! 🛍️",
    compareHeader: "The side-by-side comparison for both premium products is ready:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**Verdict**: Out of these two, **${bestName}** seems to be the best choice because ${reason} 🏆`,
    compareFallback: "You can select products to compare them, or ask me to compare products for you! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `its rating (⭐${p2Rating}) is better than **${p1Name}** (⭐${p1Rating}).`,
    compareReasonPrice: (p2Name, p1Name, diff) => `both ratings are identical, but **${p2Name}** is the budget-friendly choice (₹${diff.toLocaleString()} cheaper).`,
    compareReasonDefault: (p1Name) => `it represents the best overall choice based on price and features.`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `its customer rating (⭐${p1Rating}) is better than **${p2Name}** (⭐${p2Rating}).`,
    budgetIntro: (maxPrice) => `These products are the best options for your budget (₹${maxPrice.toLocaleString()})! 💰 You can use special coupon code **AURA10** for an extra 10% discount at checkout!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** is an excellent quality product in the **${category}** category! Its customer rating is **${ratingStr}**, which guarantees its great features and user satisfaction. It is a perfect choice for purchase! You can check similar products in the cards below.`,
    bestIntro: "Here are the top-rated products with stellar customer reviews at BalajiMart! ⭐ These are the number 1 choices for quality and durability.",
    searchSuccess: (name) => `Sure! I have filtered matching options. **${name}** is a great choice! 🚀 And you can check similar product recommendations in the cards below.`,
    welcome: "Hello! I am 'Salesman', the AI assistant for BalajiMart. 🙏 I can help you find products, compare them, and get discounts. What would you like to buy today? 🛍️"
  },
  bn: {
    addToCartSuccess: (name) => `নিশ্চয়ই! আমি আপনার কার্টে **${name}** যোগ করেছি। চেকআউট করতে ওপরের বারে কার্ট খুলুন! 🛒`,
    addToCartSpecify: "আপনি কোন পণ্যটি কার্টে যোগ করতে চান? দয়া করে পণ্যের নাম উল্লেখ করুন! 🛍️",
    compareHeader: "উভয় প্রিমিয়াম পণ্যের পাশাপাশি তুলনা প্রস্তুত:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**সিদ্ধান্ত**: এই দুটির মধ্যে **${bestName}** সেরা বিকল্প বলে মনে হচ্ছে কারণ ${reason} 🏆`,
    compareFallback: "আপনি তুলনা দেখার জন্য পণ্য নির্বাচন করতে পারেন অথবা আমাকে পণ্য তুলনা করতে বলতে পারেন! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `এর রেটিং (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) এর চেয়ে ভালো।`,
    compareReasonPrice: (p2Name, p1Name, diff) => `উভয় রেটিং একই, তবে **${p2Name}** বাজেট-বান্ধব পছন্দ (₹${diff.toLocaleString()} সস্তা)।`,
    compareReasonDefault: (p1Name) => `দাম এবং বৈশিষ্ট্যের ভিত্তিতে এটিই সেরা পছন্দ।`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `এর গ্রাহক রেটিং (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) এর চেয়ে ভালো।`,
    budgetIntro: (maxPrice) => `আপনার বাজেট (₹${maxPrice.toLocaleString()}) এর জন্য এই পণ্যগুলি সেরা বিকল্প! 💰 চেকআউটের সময় অতিরিক্ত ১০% ছাড়ের জন্য আপনি বিশেষ কুপন **AURA10** ব্যবহার করতে পারেন!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** হলো **${category}** বিভাগের একটি চমৎকার মানের পণ্য! এর গ্রাহক রেটিং হলো **${ratingStr}**, যা এর দুর্দান্ত বৈশিষ্ট্য এবং গ্রাহক সন্তুষ্টির প্রমাণ দেয়। এটি কেনার জন্য একটি আদর্শ পছন্দ! আপনি নিচের কার্ডগুলিতে অনুরূপ বিকল্পগুলি দেখতে পারেন।`,
    bestIntro: "বালাজি মার্টে দুর্দান্ত গ্রাহক পর্যালোচনা সহ শীর্ষ রেটযুক্ত পণ্যগুলি এখানে রয়েছে! ⭐ গুণমান এবং স্থায়িত্বের জন্য এগুলি এক নম্বর পছন্দ।",
    searchSuccess: (name) => `নিশ্চয়ই! আমি মানানসই পণ্যগুলি ফিল্টার করেছি। **${name}** একটি দুর্দান্ত পছন্দ! 🚀 এবং আপনি নিচের কার্ডগুলিতে অনুরূপ পণ্য দেখতে পারেন।`,
    welcome: "নমস্কার! আমি বালাজি মার্টের এআই সহকারী 'সেলসম্যান'। 🙏 আমি আপনাকে পণ্য খুঁজতে, তুলনা করতে এবং ডিসকাউন্ট পেতে সাহায্য করতে পারি। আজ আপনি কী কিনতে চান? 🛍️"
  },
  hi: {
    addToCartSuccess: (name) => `बिल्कुल! मैंने आपके कार्ट में **${name}** जोड़ दिया है। चेकआउट करने के लिए ऊपर बार में कार्ट खोलें! 🛒`,
    addToCartSpecify: "आप कौन सा उत्पाद कार्ट में जोड़ना चाहते हैं? कृपया उत्पाद का नाम बताएं! 🛍️",
    compareHeader: "दोनों प्रीमियम उत्पादों की तुलना तैयार है:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**निर्णय**: इन दोनों में से **${bestName}** सबसे अच्छा विकल्प लग रहा है क्योंकि ${reason} 🏆`,
    compareFallback: "आप तुलना देखने के लिए उत्पादों का चयन कर सकते हैं या मुझसे उत्पादों की तुलना करने के लिए कह सकते हैं! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `इसकी रेटिंग (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) से बेहतर है।`,
    compareReasonPrice: (p2Name, p1Name, diff) => `दोनों रेटिंग समान हैं, लेकिन **${p2Name}** बजट के अनुकूल विकल्प है (₹${diff.toLocaleString()} सस्ता)।`,
    compareReasonDefault: (p1Name) => `यह कीमत और सुविधाओं के आधार पर सबसे अच्छा विकल्प है।`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `इसकी ग्राहक रेटिंग (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) से बेहतर है।`,
    budgetIntro: (maxPrice) => `आपके बजट (₹${maxPrice.toLocaleString()}) के लिए ये उत्पाद सबसे अच्छे विकल्प हैं! 💰 आप चेकआउट के समय अतिरिक्त 10% छूट के लिए विशेष कूपन **AURA10** का उपयोग कर सकते हैं!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** **${category}** श्रेणी में एक बेहतरीन गुणवत्ता वाला उत्पाद है! इसकी ग्राहक रेटिंग **${ratingStr}** है, जो इसकी बेहतरीन सुविधाओं और ग्राहक संतुष्टि की पुष्टि करती है। यह खरीदारी के लिए एक आदर्श विकल्प है! आप नीचे दिए गए कार्डों में इसके समान अन्य विकल्प देख सकते हैं।`,
    bestIntro: "बालाजीमार्ट में शानदार ग्राहक समीक्षाओं वाले टॉप-रेटेड उत्पाद यहाँ हैं! ⭐ गुणवत्ता और स्थायित्व के लिए ये नंबर 1 पसंद हैं।",
    searchSuccess: (name) => `बिल्कुल! मैंने मिलते-जुलते उत्पादों को फ़िल्टर कर दिया है। **${name}** एक बेहतरीन विकल्प है! 🚀 और आप नीचे दिए गए कार्डों में समान उत्पाद देख सकते हैं।`,
    welcome: "नमस्ते! मैं बालाजीमार्ट की एआई सहायक 'सेल्समैन' हूँ। 🙏 मैं आपको उत्पाद खोजने, तुलना करने और छूट पाने में मदद कर सकती हूँ। आज आप क्या खरीदना चाहते हैं? 🛍️"
  },
  hi_hinglish: {
    addToCartSuccess: (name) => `Bilkul! Maine **${name}** ko aapke cart me add kar diya hai. Checkout karne ke liye top bar me cart open karein! 🛒`,
    addToCartSpecify: "Aap kis product ko cart me add karna chahte hain? Please product ka name mention karein! 🛍️",
    compareHeader: "Dono premium products ka side-by-side comparison ready hai:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**Verdict**: In dono me se **${bestName}** sabse best option lag raha hai kyunki ${reason} 🏆`,
    compareFallback: "Aap products select karke comparison view dekh sakte hain ya mujhe devices compare karne ko bol sakte hain! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `iski rating (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) se better hai.`,
    compareReasonPrice: (p2Name, p1Name, diff) => `dono ki ratings identical hain, par **${p2Name}** value-for-money choice hai (cheaper by ₹${diff.toLocaleString()}).`,
    compareReasonDefault: (p1Name) => `dono ki ratings identical hain, par **${p1Name}** price and feature point of view se value-for-money choice hai.`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `iski customer rating (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating || '4.0'}) se behtar hai.`,
    budgetIntro: (maxPrice) => `Aapke budget (₹${maxPrice.toLocaleString()}) ke liye ye matching products best options hain! 💰 Aap special coupon **AURA10** apply karke checkout page par extra 10% discount le sakte hain!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** ek behtareen quality product hai category **${category}** me! Iski customer rating **${ratingStr}** hai, jo iski features aur user satisfaction ko confirm karti hai. Ye purchase ke liye ek perfect choice hai! Iske similar options niche cards me check kar sakte hain.`,
    bestIntro: "Here are the top-rated items with stellar customer reviews in BalajiMart! ⭐ Ye quality aur durability ke liye number 1 choice hain.",
    searchSuccess: (name) => `Sure! Maine matching options filter kiye hain. **${name}** is a great choice! 🚀 Aur similar product recommendation specifications niche verify kar sakte hain.`,
    welcome: "Namaste! Main BalajiMart ki AI assistant 'Salesman' hoon. 🙏 Main aapko items find karne, comparisons compare karne, aur discounts unlock karne me help kar sakti hoon. Aap aaj kya purchase karna chahte hain? 🛍️"
  },
  ta: {
    addToCartSuccess: (name) => `நிச்சயமாக! நான் உங்கள் கார்ட்டில் **${name}** ஐச் சேர்த்துள்ளேன். செக்அவுட் செய்ய மேல் பட்டியில் உள்ள கார்ட்டைத் திறக்கவும்! 🛒`,
    addToCartSpecify: "கார்ட்டில் எந்த தயாரிப்பைச் சேர்க்க விரும்புகிறீர்கள்? தயாரிப்பு பெயரைக் குறிப்பிடவும்! 🛍️",
    compareHeader: "இரண்டு பிரீமியம் தயாரிப்புகளின் ஒப்பீடு தயாராக உள்ளது:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**முடிவு**: இந்த இரண்டில் **${bestName}** சிறந்த தேர்வாகத் தெரிகிறது ஏனெனில் ${reason} 🏆`,
    compareFallback: "ஒப்பீட்டைப் பார்க்க தயாரிப்புகளைத் தேர்ந்தெடுக்கலாம் அல்லது என்னை ஒப்பிடக் கேட்கலாம்! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `இதன் மதிப்பீடு (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) ஐ விட சிறந்தது.`,
    compareReasonPrice: (p2Name, p1Name, diff) => `இரண்டு மதிப்பீடுகளும் சமம், ஆனால் **${p2Name}** பட்ஜெட்-நட்பு தேர்வு (₹${diff.toLocaleString()} மலிவானது).`,
    compareReasonDefault: (p1Name) => `விலை மற்றும் அம்சங்களின் அடிப்படையில் இதுவே சிறந்த தேர்வு.`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `இதன் வாடிக்கையாளர் மதிப்பீடு (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) ஐ விட சிறந்தது.`,
    budgetIntro: (maxPrice) => `உங்கள் பட்ஜெட்டுக்கு (₹${maxPrice.toLocaleString()}) இந்த தயாரிப்புகள் சிறந்தவை! 💰 கூடுதல் 10% தள்ளுபடி பெற செக்அவுட்டில் **AURA10** கூப்பனைப் பயன்படுத்தலாம்!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** என்பது **${category}** பிரிவில் ஒரு சிறந்த தயாரிப்பு! இதன் மதிப்பீடு **${ratingStr}**, இது சிறந்த அம்சங்களை உறுதி செய்கிறது. வாங்குவதற்கு இது ஒரு சிறந்த தேர்வு! கீழே உள்ள கார்டுகளில் ஒத்த தயாரிப்புகளைப் பார்க்கலாம்.`,
    bestIntro: "பாலாஜிமார்ட்டில் சிறந்த வாடிக்கையாளர் மதிப்புரைகளைக் கொண்ட தயாரிப்புகள் இதோ! ⭐ தரம் மற்றும் ஆயுளுக்கு இவை சிறந்த தேர்வு.",
    searchSuccess: (name) => `நிச்சயமாக! பொருந்திய தயாரிப்புகளை நான் வடிகட்டியுள்ளேன். **${name}** சிறந்த தேர்வு! 🚀 கீழே உள்ள கார்டுகளில் ஒத்த தயாரிப்புகளைப் பார்க்கலாம்.`,
    welcome: "வணக்கம்! நான் பாலாஜிமார்ட்டின் AI உதவியாளர் 'சேல்ஸ்மேன்'. 🙏 தயாரிப்புகளைக் கண்டறிய, ஒப்பிட மற்றும் தள்ளுபடிகளைப் பெற நான் உங்களுக்கு உதவ முடியும். இன்று நீங்கள் என்ன வாங்க விரும்புகிறீர்கள்? 🛍️"
  },
  te: {
    addToCartSuccess: (name) => `తప్పకుండా! నేను మీ కార్ట్‌లో **${name}** జోడించాను. చెకౌట్ చేయడానికి పై బార్‌లో కార్ట్‌ని తెరవండి! 🛒`,
    addToCartSpecify: "మీరు ఏ ఉత్పత్తిని కార్ట్‌లో జోడించాలనుకుంటున్నారు? దయచేసి ఉత్పత్తి పేరును పేర్కొనండి! 🛍️",
    compareHeader: "రెండు ప్రీమియం ఉత్పత్తుల పోలిక సిద్ధంగా ఉంది:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**తీర్పు**: ఈ రెండింటిలో **${bestName}** ఉత్తమ ఎంపికగా అనిపిస్తుంది ఎందుకంటే ${reason} 🏆`,
    compareFallback: "పోలికను చూడటానికి ఉత్పత్తులను ఎంచుకోవచ్చు లేదా నన్ను పోల్చమని అడగవచ్చు! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `దీని రేటింగ్ (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) కంటే మెరుగ్గా ఉంది.`,
    compareReasonPrice: (p2Name, p1Name, diff) => `రెండు రేటింగ్‌లు సమానమే, కానీ **${p2Name}** బడ్జెట్ అనుకూల ఎంపిక (₹${diff.toLocaleString()} తక్కువ ధర).`,
    compareReasonDefault: (p1Name) => `ధర మరియు ఫీచర్ల ఆధారంగా ఇది ఉత్తమ ఎంపిక.`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `దీని కస్టమర్ రేటింగ్ (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) కంటే మెరుగ్గా ఉంది.`,
    budgetIntro: (maxPrice) => `మీ బడ్జెట్ (₹${maxPrice.toLocaleString()}) కి ఈ ఉత్పత్తులు ఉత్తమ ఎంపికలు! 💰 చెకౌట్ వద్ద అదనపు 10% తగ్గింపు కోసం ప్రత్యేక కూపన్ **AURA10** ఉపయోగించవచ్చు!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** అనేది **${category}** విభాగంలో అద్భుతమైన నాణ్యత గల ఉత్పత్తి! దీని రేటింగ్ **${ratingStr}**, ఇది దీని గొప్ప ఫీచర్లను నిర్ధారిస్తుంది. కొనుగోలు చేయడానికి ఇది సరైన ఎంపిక! కింద ఉన్న కార్డ్‌లలో ఇలాంటి ఇతర ఉత్పత్తులను చూడవచ్చు.`,
    bestIntro: "బాలాజీమార్ట్‌లో అద్భుతమైన కస్టమర్ రివ్యూలతో ఉన్న టాప్-రేటెడ్ ఉత్పత్తులు ఇవి! ⭐ నాణ్యత మరియు మన్నికకు ఇవి మొదటి ఎంపిక.",
    searchSuccess: (name) => `తప్పకుండా! నేను సరిపోలే ఉత్పత్తులను ఫిల్టర్ చేసాను. **${name}** గొప్ప ఎంపిక! 🚀 కింద ఉన్న కార్డ్‌లలో ఇలాంటి ఇతర ఉత్పత్తులను చూడవచ్చు.`,
    welcome: "నమస్తే! నేను బాలాజీమార్ట్ AI అసిస్టెంట్ 'సేల్స్మేన్'. 🙏 ఉత్పత్తులను కనుగొనడంలో, పోల్చడంలో మరియు తగ్గింపులను పొందడంలో నేను మీకు సహాయం చేయగలను. ఈరోజు మీరు ఏమి కొనాలనుకుంటున్నారు? 🛍️"
  },
  kn: {
    addToCartSuccess: (name) => `ಖಂಡಿತ! ನಾನು ನಿಮ್ಮ ಕಾರ್ಟ್‌ಗೆ **${name}** ಸೇರಿಸಿದ್ದೇನೆ. ಜೆಕ್ಔಟ್ ಮಾಡಲು ಮೇಲಿನ ಬಾರ್‌ನಲ್ಲಿ ಕಾರ್ಟ್ ತೆರೆಯಿರಿ! 🛒`,
    addToCartSpecify: "ನೀವು ಯಾವ ಉತ್ಪನ್ನವನ್ನು ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲು ಬಯಸುತ್ತೀರಿ? ದಯವಿಟ್ಟು ಉತ್ಪನ್ನದ ಹೆಸರನ್ನು ತಿಳಿಸಿ! 🛍️",
    compareHeader: "ಎರಡೂ ಪ್ರೀಮಿಯಂ ಉತ್ಪನ್ನಗಳ ಹೋಲಿಕೆ ಸಿದ್ಧವಾಗಿದೆ:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**ನಿರ್ಣಯ**: ಇವೆರಡರಲ್ಲಿ **${bestName}** ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಯಾಗಿದೆ ಏಕೆಂದರೆ ${reason} 🏆`,
    compareFallback: "ಹೋಲಿಕೆಯನ್ನು ನೋಡಲು ಉತ್ಪನ್ನಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಬಹುದು ಅಥವಾ ಹೋಲಿಸಲು ನನಗೆ ಕೇಳಬಹುದು! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `ಇದರ ರೇಟಿಂಗ್ (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) ಗಿಂತ ಉತ್ತಮವಾಗಿದೆ.`,
    compareReasonPrice: (p2Name, p1Name, diff) => `ಎರಡೂ ರೇಟಿಂಗ್‌ಗಳು ಒಂದೇ ಆಗಿವೆ, ಆದರೆ **${p2Name}** ಬಜೆಟ್ ಸ್ನೇಹಿ ಆಯ್ಕೆಯಾಗಿದೆ (₹${diff.toLocaleString()} ಅಗ್ಗ).`,
    compareReasonDefault: (p1Name) => `ಬೆಲೆ ಮತ್ತು ವೈಶಿಷ್ಟ್ಯಗಳ ಆಧಾರದ ಮೇಲೆ ಇದು ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಯಾಗಿದೆ.`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `ಇದರ ಗ್ರಾಹಕರ ರೇಟಿಂಗ್ (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) ಗಿಂತ ಉತ್ತಮವಾಗಿದೆ.`,
    budgetIntro: (maxPrice) => `ನಿಮ್ಮ ಬಜೆಟ್‌ಗೆ (₹${maxPrice.toLocaleString()}) ಈ ಉತ್ಪನ್ನಗಳು ಅತ್ಯುತ್ತമ ಆಯ್ಕೆಗಳಾಗಿವೆ! 💰 ಜೆಕ್ಔಟ್‌ನಲ್ಲಿ ಹೆಚ್ಚುವರಿ 10% ರಿಯಾಯಿತಿಗಾಗಿ ವಿಶೇಷ ಕೂಪನ್ **AURA10** ಅನ್ನು ಬಳಸಬಹುದು!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** ಎಂಬುದು **${category}** ವರ್ಗದಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಗುಣಮಟ್ಟದ ಉತ್ಪನ್ನವಾಗಿದೆ! ಇದರ ರೇಟಿಂಗ್ **${ratingStr}** ಆಗಿದೆ, ಇದು ಇದರ ಉತ್ತಮ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ. ಖರೀದಿಸಲು ಇದು ಸೂಕ್ತವಾದ ಆಯ್ಕೆಯಾಗಿದೆ! ಕೆಳಗಿನ ಕಾರ್ಡ್‌ಗಳಲ್ಲಿ ಇದೇ ರೀತಿಯ ಇತರ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಬಹುದು.`,
    bestIntro: "ಬಾಲಾಜಿಮಾರ್ಟ್‌ನಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಗ್ರಾಹಕ ವಿಮರ್ಶೆಗಳನ್ನು ಹೊಂದಿರುವ ಉನ್ನತ ರೇಟಿಂಗ್ ಪಡೆದ ಉತ್ಪನ್ನಗಳು ಇಲ್ಲಿವೆ! ⭐ ಗುಣಮಟ್ಟ ಮತ್ತು ಬಾಳಿಕೆಗೆ ಇವು ಮೊದಲ ಆಯ್ಕೆಯಾಗಿವೆ.",
    searchSuccess: (name) => `ಖಂಡಿತ! ನಾನು ಹೊಂದಾಣಿಕೆಯಾಗುವ ಉತ್ಪನ್ನಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿದ್ದೇನೆ. **${name}** ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಯಾಗಿದೆ! 🚀 ಮತ್ತು ಕೆಳಗಿನ ಕಾರ್ಡ್‌ಗಳಲ್ಲಿ ಇದೇ ರೀತಿಯ ಇತರ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಬಹುದು.`,
    welcome: "ನಮಸ್ತೆ! ನಾನು ಬಾಲಾಜಿಮಾರ್ಟ್‌ನ ಎಐ ಸಹಾಯಕ 'ಸೇಲ್ಸ್‌ಮ್ಯಾನ್'. 🙏 ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಲು, ಹೋಲಿಸಲು ಮತ್ತು ರಿಯಾಯಿತಿಗಳನ್ನು ಪಡೆಯಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಏನನ್ನು ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ? 🛍️"
  },
  ml: {
    addToCartSuccess: (name) => `തീർച്ചയായും! ഞാൻ **${name}** നിങ്ങളുടെ കാർട്ടിൽ ചേർത്തു. ചെക്ക്ഔട്ട് ചെയ്യാൻ മുകളിലെ ബാറിൽ കാർട്ട് തുറക്കുക! 🛒`,
    addToCartSpecify: "ഏത് ഉൽപ്പന്നമാണ് കാർട്ടിൽ ചേർക്കാൻ ആഗ്രഹിക്കുന്നത്? ഉൽപ്പന്നത്തിന്റെ പേര് വ്യക്തമാക്കുക! 🛍️",
    compareHeader: "രണ്ട് പ്രീമിയം ഉൽപ്പന്നങ്ങളുടെ താരതമ്യം തയ്യാറാണ്:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**തീരുമാനം**: ഈ രണ്ടിൽ **${bestName}** ആണ് മികച്ച ഉൽപ്പന്നം എന്ന് തോന്നുന്നു കാരണം ${reason} 🏆`,
    compareFallback: "താരതമ്യം കാണാൻ ഉൽപ്പന്നങ്ങൾ തിരഞ്ഞെടുക്കുകയോ എന്നോട് ആവശ്യപ്പെടുകയോ ചെയ്യാം! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `ഇതിന്റെ റേറ്റിംഗ് (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) നെക്കാൾ മികച്ചതാണ്.`,
    compareReasonPrice: (p2Name, p1Name, diff) => `രണ്ട് റേറ്റിംഗുകളും തുല്യമാണ്, എന്നാൽ **${p2Name}** ബജറ്റിന് അനുയോജ്യമായ തിരഞ്ഞെടുപ്പാണ് (₹${diff.toLocaleString()} വിലക്കുറവ്).`,
    compareReasonDefault: (p1Name) => `വിലയും സവിശേഷതകളും അടിസ്ഥാനമാക്കി ഇതാണ് മികച്ച തിരഞ്ഞെടുപ്പ്.`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `ഇതിന്റെ ഉപഭോക്തൃ റേറ്റിംഗ് (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) നെക്കാൾ മികച്ചതാണ്.`,
    budgetIntro: (maxPrice) => `നിങ്ങളുടെ ബജറ്റായ **₹${maxPrice.toLocaleString()}** നുള്ളിലെ മികച്ച ഉൽപ്പന്നങ്ങൾ ഇതാ! 💰 ചെക്ക്ഔട്ടിൽ 10% അധിക ഡിസ്കൗണ്ടിനായി **AURA10** കൂപ്പൺ ഉപയോഗിക്കാം!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** എന്നത് **${category}** വിഭാഗത്തിൽ മികച്ച ഗുണനിലവാരമുള്ള ഒരു ഉൽപ്പന്നമാണ്! ഇതിന്റെ റേറ്റിംഗ് **${ratingStr}** ആണ്. ഇത് വാങ്ങാൻ അനുയോജ്യമായ ഒന്നാണ്! താഴെയുള്ള കാർഡുകളിൽ സമാന ഉൽപ്പന്നങ്ങൾ പരിശോധിക്കാം.`,
    bestIntro: "ബാലാജിമാർട്ടിൽ മികച്ച ഉപഭോക്തൃ അവലോകനങ്ങളുള്ള ഉൽപ്പന്നങ്ങൾ ഇതാ! ⭐ ഗുണനിലവാരത്തിനും ഈടുനിൽപ്പിനും ഇവയാണ് ഒന്നാം നമ്പർ.",
    searchSuccess: (name) => `തീർച്ചയായും! ഞാൻ ചേരുന്ന ഉൽപ്പന്നങ്ങൾ ഫിൽട്ടർ ചെയ്തിട്ടുണ്ട്. **${name}** മികച്ച തിരഞ്ഞെടുപ്പാണ്! 🚀 താഴെയുള്ള കാർഡുകളിൽ സമാന ഉൽപ്പന്നങ്ങൾ കാണാം.`,
    welcome: "നമസ്കാരം! ഞാൻ ബാലാജിമാർട്ടിന്റെ എഐ സഹായിയായ 'സെയിൽസ്മാൻ' ആണ്. 🙏 ഉൽപ്പന്നങ്ങൾ കണ്ടെത്താനും താരതമ്യം ചെയ്യാനും ഡിസ്കൗണ്ടുകൾ നേടാനും ഞാൻ സഹായിക്കാം. ഇന്ന് എന്താണ് വാങ്ങാൻ ആഗ്രഹിക്കുന്നത്? 🛍️"
  },
  gu: {
    addToCartSuccess: (name) => `ચોક્કસ! મેં **${name}** ને તમારા કાર્ટમાં ઉમેરી દીધું છે. ચેકઆઉટ કરવા માટે ઉપર બારમાં કાર્ટ ખોલો! 🛒`,
    addToCartSpecify: "તમે કઈ પ્રોડક્ટ કાર્ટમાં ઉમેરવા માંગો છો? કૃપા કરીને પ્રોડક્ટનું નામ જણાવો! 🛍️",
    compareHeader: "બંને પ્રીમિયમ પ્રોડક્ટ્સની સરખામણી તૈયાર છે:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**નિર્ણય**: આ બંનેમાંથી **${bestName}** સૌથી શ્રેષ્ઠ વિકલ્પ લાગે છે કારણ કે ${reason} 🏆`,
    compareFallback: "તમે સરખામણી જોવા માટે પ્રોડક્ટ્સ પસંદ કરી શકો છો અથવા મને પ્રોડક્ટ્સની સરખામણી કરવા કહી શકો છો! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `તેનું રેટિંગ (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) કરતા સારું છે.`,
    compareReasonPrice: (p2Name, p1Name, diff) => `બંને રેટિંગ સમાન છે, પરંતુ **${p2Name}** બજેટ-અનુકૂળ વિકલ્પ છે (₹${diff.toLocaleString()} સસ્તું).`,
    compareReasonDefault: (p1Name) => `કિંમત અને વિશેષતાઓના આધારે તે શ્રેષ્ઠ પસંદગી છે.`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `તેનું ગ્રાહક રેટિંગ (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) કરતા સારું છે.`,
    budgetIntro: (maxPrice) => `તમારા બજેટ (₹${maxPrice.toLocaleString()}) માટે આ પ્રોડક્ટ્સ શ્રેષ્ઠ વિકલ્પ છે! 💰 તમે ચેકઆઉટ વખતે વધારાના ૧૦% ડિસ્કાઉન્ટ માટે ખાસ કૂપન **AURA10** વાપરી શકો છો!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** એ **${category}** કેટેગરીમાં એક ઉત્કૃષ્ટ ગુણવત્તાવાળી પ્રોડક્ટ છે! તેનું કસ્ટમર રેટિંગ **${ratingStr}** છે, જે તેની શ્રેષ્ઠ વિશેષતાઓ અને ગ્રાહક સંતોષની ખાતરી આપે છે. આ ખરીદી માટે એક આદર્શ પસંદગી છે! તમે નીચે આપેલા કાર્ડ્સમાં તેના જેવા જ બીજા વિકલ્પો જોઈ શકો છો.`,
    bestIntro: "બાલાજીમાર્ટમાં શાનદાર ગ્રાહક સમીક્ષાઓ ધરાવતી ટોપ-રેટેડ પ્રોડક્ટ્સ અહીં છે! ⭐ ગુણવત્તા અને ટકાઉપણું માટે આ નંબર 1 પસંદગી છે.",
    searchSuccess: (name) => `ચોક્કસ! મેં મેળ ખાતી પ્રોડક્ટ્સ ફિલ્ટર કરી દીધી છે. **${name}** એક સરસ પસંદગી છે! 🚀 અને તમે નીચે આપેલા કાર્ડ્સમાં તેના જેવી જ પ્રોડક્ટ્સ જોઈ શકો છો.`,
    welcome: "નમસ્તે! હું બાલાજીમાર્ટની AI આસિસ્ટન્ટ 'સેલ્સમેન' છું. 🙏 હું તમને પ્રોડક્ટ્સ શોધવામાં, સરખામણી કરવામાં અને ડિસ્કાઉન્ટ મેળવવામાં મદદ કરી શકું છું. આજે તમે શું ખરીદવા માંગો છો? 🛍️"
  },
  pa: {
    addToCartSuccess: (name) => `ਬਿਲਕੁਲ! ਮੈਂ **${name}** ਨੂੰ ਤੁਹਾਡੀ ਕਾਰਟ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ ਹੈ। ਚੈੱਕਆਉਟ ਕਰਨ ਲਈ ਉੱਪਰ ਬਾਰ ਵਿੱਚ ਕਾਰਟ ਖੋਲ੍ਹੋ! 🛒`,
    addToCartSpecify: "ਤੁਸੀਂ ਕਿਹੜਾ ਪ੍ਰੋਡਕਟ ਕਾਰਟ ਵਿੱਚ ਜੋੜਨਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਪ੍ਰੋਡਕਟ ਦਾ ਨਾਮ ਦੱਸੋ! 🛍️",
    compareHeader: "ਦੋਵਾਂ ਪ੍ਰੀਮੀਅਮ ਪ੍ਰੋਡਕਟਸ ਦੀ ਤੁਲਨਾ ਤਿਆਰ ਹੈ:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**ਨਤੀਜਾ**: ਇਹਨਾਂ ਦੋਵਾਂ ਵਿੱਚੋਂ **${bestName}** ਸਭ ਤੋਂ ਵਧੀਆ ਵਿਕਲਪ ਲੱਗ ਰਿਹਾ ਹੈ ਕਿਉਂਕਿ ${reason} 🏆`,
    compareFallback: "ਤੁਸੀਂ ਤੁਲਨਾ ਦੇਖਣ ਲਈ ਪ੍ਰੋਡਕਟਸ ਦੀ ਚੋਣ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਮੈਨੂੰ ਡਿਵਾਈਸਾਂ ਦੀ ਤੁਲਨਾ ਕਰਨ ਲਈ ਕਹਿ ਸਕਦੇ ਹੋ! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `ਇਸਦੀ ਰੇਟਿੰਗ (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) ਨਾਲੋਂ ਬਿਹਤਰ ਹੈ।`,
    compareReasonPrice: (p2Name, p1Name, diff) => `ਦੋਵਾਂ ਦੀ ਰੇਟਿੰਗ ਇੱਕੋ ਜਿਹੀ ਹੈ, ਪਰ **${p2Name}** ਬਜਟ-ਅਨੁਕੂਲ ਚੋਣ ਹੈ (₹${diff.toLocaleString()} ਸਸਤਾ ਹੈ)।`,
    compareReasonDefault: (p1Name) => `ਇਹ ਕੀਮਤ ਅਤੇ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਦੇ ਆਧਾਰ 'ਤੇ ਸਭ ਤੋਂ ਵਧੀਆ ਚੋਣ ਹੈ।`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `ਇਸਦੀ ਗਾਹਕ ਰੇਟਿੰਗ (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) ਨਾਲੋਂ ਬਿਹਤਰ ਹੈ।`,
    budgetIntro: (maxPrice) => `ਤੁਹਾਡੇ ਬਜਟ (₹${maxPrice.toLocaleString()}) ਲਈ ਇਹ ਪ੍ਰੋਡਕਟਸ ਸਭ ਤੋਂ ਵਧੀਆ ਵਿਕਲਪ ਹਨ! 💰 ਤੁਸੀਂ ਚੈੱਕਆਉਟ 'ਤੇ ਵਾਧੂ 10% ਛੋਟ ਲਈ ਵਿਸ਼ੇշ ਕੂਪਨ **AURA10** ਲਾਗੂ ਕਰ ਸਕਦੇ ਹੋ!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** ਸ਼੍ਰੇਣੀ **${category}** ਵਿੱਚ ਇੱਕ ਸ਼ਾਨਦาร ਗੁਣਵੱਤਾ ਵਾਲਾ ਪ੍ਰੋਡਕਟ ਹੈ! ਇਸਦੀ ਗਾਹਕ ਰੇਟਿੰਗ **${ratingStr}** ਹੈ, ਜੋ ਇਸਦੀਆਂ ਸ਼ਾਨਦార ਵਿਸ਼ੇশਤਾਵਾਂ ਅਤੇ ਉਪਭੋਗਤਾ ਸੰਤੁշਟੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰਦੀ ਹੈ। ਇਹ ਖਰੀਦਦਾਰੀ ਲਈ ਇੱਕ ਵਧੀਆ ਚੋਣ ਹੈ! ਤੁਸੀਂ ਹੇਠਾਂ ਦਿੱਤੇ ਕਾਰਡਾਂ ਵਿੱਚ ਇਸਦੇ ਸਮਾਨ ਵਿਕਲਪ ਦੇਖ ਸਕਦੇ ਹੋ।`,
    bestIntro: "ਬਾਲਾਜੀਮਾਰਟ ਵਿੱਚ ਸ਼ਾਨਦਾਰ ਗਾਹਕ ਸਮੀਖਿਆਵਾਂ ਵਾਲੇ ਟੌਪ-ਰੇਟਿਡ ਪ੍ਰੋਡਕਟਸ ਇੱਥେ ਹਨ! ⭐ ਇਹ ਗੁਣਵੱਤਾ ਅਤੇ ਟਿਕਾਊਪਨ ਲਈ ਨੰਬਰ 1 ਪਸੰਦ ਹਨ।",
    searchSuccess: (name) => `ਬਿਲਕੁਲ! ਮੈਂ ਮੇਲ ਖਾਂਦੇ ਵਿਕਲਪਾਂ ਨੂੰ ਫਿਲਟਰ ਕਰ ਦਿੱਤਾ ਹੈ। **${name}** ਇੱਕ ਵਧੀਆ ਚੋਣ ਹੈ! 🚀 ਅਤੇ ਤੁਸੀਂ ਹੇਠਾਂ ਦਿੱਤੇ ਕਾਰਡਾਂ ਵਿੱਚ ਸਮਾਨ ਪ੍ਰੋਡਕਟ ਦੇਖ ਸਕਦੇ ਹੋ।`,
    welcome: "ਨਮਸਤੇ! ਮੈਂ ਬਾਲาਜੀਮਾਰਟ ਦੀ ਏਆਈ ਸਹਾਇਕ 'ਸੇਲਜ਼ਮੈਨ' ਹਾਂ। 🙏 ਮੈਂ ਤੁਹਾਨੂੰ ਪ੍ਰੋਡਕਟ ਲੱਭਣ, ਤੁਲਨਾ ਕਰਨ ਅਤੇ ਡਿਸਕਾਊਂਟ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕੀ ਖਰੀਦਣਾ ਚਾਹੁੰਦੇ ਹੋ? 🛍️"
  },
  or: {
    addToCartSuccess: (name) => `ନିଶ୍ଚିତ ଭାବରେ! ମୁଁ ଆପଣଙ୍କ କାର୍ଟରେ **${name}** ଯୋଡି ଦେଇଛି। ଚେକଆଉଟ୍ ପାଇଁ ଉପର ବାରରେ କାର୍ଟ ଖୋଲନ୍ତୁ! 🛒`,
    addToCartSpecify: "ଆପଣ କେଉଁ ପ୍ରଡକ୍ଟକୁ କାର୍ଟରେ ଯୋଡିବାକୁ ଚାହୁଁଛନ୍ତି? ଦୟାକରି ପ୍ରଡକ୍ଟର ନାମ ଉଲ୍ଲେଖ କରନ୍ତು! 🛍️",
    compareHeader: "ଉଭୟ ପ୍ରିମିୟମ ପ୍ରଡକ୍ଟର ତୁଳନାତ୍ମକ ବିବରଣୀ ପ୍ରସ୍ତୁତ ଅଛି:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**ନିଷ୍କର୍ଷ**: ଏହି ଦୁଇଟି ମଧ୍ୟରୁ **${bestName}** ସବୁଠାରୁ ଭଲ ବିକଳ୍ପ ଜଣାପଡୁଛି କାରଣ ${reason} 🏆`,
    compareFallback: "ଆପଣ ତୁଳନା ଦେଖିବା ପାଇଁ ପ୍ରଡକ୍ଟ ଚୟନ କରିପାରିବେ କିମ୍ବା ମୋତେ ଡିଭାଇସ୍ ତୁଳନା କରିବାକୁ କହିପାରିବେ! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `ଏହାର ରେଟିଂ (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) ଅପେକ୍ଷା ଭଲ।`,
    compareReasonPrice: (p2Name, p1Name, diff) => `ଉଭୟଙ୍କ ରେଟିଂ ସମାନ, କିନ୍ତು **${p2Name}** ବଜେଟ୍ ଅନୁକୂଳ ପସନ୍ଦ (₹${diff.toLocaleString()} ସସ୍ତା)।`,
    compareReasonDefault: (p1Name) => `ଏହା ମୂଲ୍ୟ ଏବଂ ସୁବିଧା ଦୃଷ୍ଟିରୁ ସର୍ବୋତ୍ତମ ପସନ୍ଦ।`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `ଏହାର କଷ୍ଟମರ ରେଟିଂ (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) ଅପେକ୍ଷା ଭଲ।`,
    budgetIntro: (maxPrice) => `ଆପଣଙ୍କ ବଜେଟ୍ (₹${maxPrice.toLocaleString()}) ପାଇଁ ଏହି ପ୍ରଡକ୍ଟଗୁଡ଼ିକ ସର୍ବୋତ୍ତମ ବିକଳ୍પ! 💰 ଅତିରିକ୍ତ ୧୦% ରିହାତି ପାଇଁ ଚେକଆଉଟ୍ ସମୟରେ ବିଶେષ କୁପନ୍ **AURA10** ବ୍ୟବହାର କରିପାରିବେ!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** ହେଉଛି **${category}** ଶ୍ରେଣୀରେ ଏକ ଉତ୍କୃଷ୍ଟ ଗୁଣବତ୍ତା ପ୍ରଡକ୍ଟ! ଏହାର କଷ୍ଟମರ ରେଟିଂ ହେଉଛି **${ratingStr}**, ଯାହା ଏହାର ଉତ୍କୃଷ୍ଟ ବୈଶିଷ୍ଟ୍ୟ ଏବଂ ଗ୍ରାհକ ସନ୍ତୋଷକୁ ନିଶ୍ଚିତ କରେ। ଏହା କିଣିବା ପାଇଁ ଏକ ସମ୍ପୂର୍ଣ୍ଣ ଉପଯୁକ୍ତ ବିକଳ୍ප! ଆପଣ ତଳେ ଥିବା କାର୍ଡଗୁଡ଼ିକରେ ସମାନ ବିକଳ୍ප ଯାଞ୍ચ କରିପାରିବେ।`,
    bestIntro: "ବାଲାଜୀମାର୍ଟରେ ଚମତ୍କାର ଗ୍ରାհକ ସମୀକ୍ଷା ସହିତ ଟପ୍-ରେଟେଡ୍ ପ୍ରଡକ୍ଟଗుଡ଼ିକ ଏଠାରେ ଦିଆଗଲା! ⭐ ଏହା ଗୁଣବତ୍ਤਾ ଏବଂ ସ୍ଥାୟୀତ୍ୱ ପାଇଁ ନମ୍ବਰ ୧ ପସନ୍ଦ।",
    searchSuccess: (name) => `ନିଶ୍ଚିତ ଭାବରେ! ମୁଁ ମେଳ ଖାଉଥିବା ପ୍ରଡକ୍ଟଗուଡ଼ିକୁ ଫିଲ୍ଟର୍ କରିଦେଇଛି। **${name}** ଏକ ବହୁତ ଭଲ ବିକଳ୍ප! 🚀 ଏବଂ ଆପଣ ତଳେ ଥିବା କାର୍ଡଗುଡ଼ିକରେ ସମାନ ପ୍ରଡକ୍ଟ ଦେଖିପାରିବେ।`,
    welcome: "ନମସ୍କାର! ମୁଁ ବାଲାଜୀମାର୍ଟର ଏଆଇ ସହାୟକ 'ସେଲ୍ସମ୍ୟାନ୍'। 🙏 ମୁଁ ଆପଣଙ୍କୁ ପ୍ରଡକ୍ଟ ଖୋଜିବା, ତուଳନା କରିବା ଏବଂ ରିହାତି ପାଇବାରେ ସାହାଯ್ಯ କରିପାରିବି। ଆଜି ଆପଣ କଣ କିଣିବାକୁ ଚାହାଁନ୍ତି? 🛍️"
  },
  ur: {
    addToCartSuccess: (name) => `بالکل! میں نے **${name}** کو آپ کے کارٹ میں شامل کر دیا ہے۔ چیک آؤٹ کرنے کے لیے اوپر بار میں کارٹ کھولیں! 🛒`,
    addToCartSpecify: "آپ کس پروڈکٹ کو کارٹ میں شامل کرنا چاہتے ہیں؟ براہ کرم پروڈکٹ کا نام بتائیں! 🛍️",
    compareHeader: "دونوں پریمیم مصنوعات کا موازنہ تیار ہے:\n\n",
    compareVerdict: (bestName, reason) => `\n\n**فیصلہ**: ان دونوں میں سے **${bestName}** سب से बेहतरीन آپشن معلوم ہوتا ہے کیونکہ ${reason} 🏆`,
    compareFallback: "آپ موازنہ دیکھنے کے لیے مصنوعات منتخب کر سکتے ہیں یا مجھ سے آلات کا موازنہ کرنے کو کہہ سکتے ہیں! ⚖️",
    compareReasonRating: (p2Name, p2Rating, p1Name, p1Rating) => `اس کی ریٹنگ (⭐${p2Rating}) **${p1Name}** (⭐${p1Rating}) سے بہتر ہے۔`,
    compareReasonPrice: (p2Name, p1Name, diff) => `دونوں کی ریٹنگ ایک جیسی ہے، لیکن **${p2Name}** بجٹ کے موافق انتخاب है (₹${diff.toLocaleString()} سستا ہے)।`,
    compareReasonDefault: (p1Name) => `یہ قیمت اور خصوصیات کے لئے بہترین متبادل ہے۔`,
    compareReasonRatingBetter: (p1Name, p1Rating, p2Name, p2Rating) => `اس کی کسٹمر ریٹنگ (⭐${p1Rating}) **${p2Name}** (⭐${p2Rating}) سے بہتر ہے۔`,
    budgetIntro: (maxPrice) => `آپ کے بجٹ (₹${maxPrice.toLocaleString()}) کے لیے یہ مصنوعات بہترین اختیارات ہیں! 💰 آپ چیک آؤٹ پر اضافی 10٪ رعایت کے لیے کوپن **AURA10** استعمال کر سکتے ہیں!`,
    opinionIntro: (name, category, ratingStr) => `**${name}** زمرہ **${category}** میں ایک بہترین معیار کی پروڈکٹ ہے! اس کی کسٹمر ریٹنگ **${ratingStr}** ہے، جو اس کی بہترین خصوصیات اور صارف کے اطمینان کی تصدیق کرتی ہے۔ یہ خریداری کے لیے ایک بہترین انتخاب ہے! آپ نیچے دیے گئے کارڈز میں اسی طرح کے اختیارات دیکھ سکتے ہیں۔`,
    bestIntro: "بالاجی مارٹ میں بہترین کسٹمر ریویو کے ساتھ ٹاپ ریٹیڈ مصنوعات یہاں ہیں! ⭐ یہ معیار اور پائیداری کے لیے نمبر 1 پسند ہیں۔",
    searchSuccess: (name) => `یقیناً! میں نے مماثل مصنوعات کو فلٹر کر دیا ہے۔ **${name}** ایک بہترین انتخاب ہے! 🚀 اور آپ نیچے کارڈز میں اسی طرح کی مصنوعات دیکھ سکتے ہیں۔`,
    welcome: "السلام علیکم! میں بالاجی مارٹ کا اے آئی اسسٹنٹ 'سیلزمین' ہوں۔ 🙏 میں مصنوعات تلاش کرنے، موازنہ کرنے اور ڈسکاؤنٹ حاصل کرنے میں آپ کی مدد کر سکتا ہوں۔ آج آپ کیا خریدنا چاہتے ہیں؟ 🛍️"
  }
};

const compileCompareResponse = (p1, p2, bestProduct, lang, resp) => {
  let reason = "";
  
  if (Number(p2.ratings || 0) > Number(p1.ratings || 0)) {
    bestProduct = p2;
    reason = resp.compareReasonRating(p2.name, p2.ratings || '4.0', p1.name, p1.ratings || '4.0');
  } else if (Number(p2.ratings || 0) === Number(p1.ratings || 0)) {
    if (Number(p2.price) < Number(p1.price)) {
      bestProduct = p2;
      reason = resp.compareReasonPrice(p2.name, p1.name, Math.abs(p1.price - p2.price));
    } else {
      bestProduct = p1;
      reason = resp.compareReasonDefault(p1.name);
    }
  } else {
    bestProduct = p1;
    reason = resp.compareReasonRatingBetter(p1.name, p1.ratings || '4.0', p2.name, p2.ratings || '4.0');
  }

  return `${resp.compareHeader}1. **${p1.name}**\n   - Price: ₹${Number(p1.price).toLocaleString()}\n   - Rating: ⭐${p1.ratings || '4.2'}/5\n\n2. **${p2.name}**\n   - Price: ₹${Number(p2.price).toLocaleString()}\n   - Rating: ⭐${p2.ratings || '4.0'}/5${resp.compareVerdict(bestProduct.name, reason)}`;
};

const generateLocalFallbackResponse = (message, emotion, products) => {
  const query = message.toLowerCase();
  let reply = "";
  let productCard = null;
  let suggestedProducts = [];
  let cartAction = null;

  const lang = detectQueryLanguage(message);
  const resp = LOCALIZED_RESPONSES[lang] || LOCALIZED_RESPONSES.en;

  const stopwords = [
    'mujhe', 'show', 'dikhao', 'chahiye', 'hai', 'mera', 'under', 'budget', 'best', 'the', 'and', 'or', 'is', 'me', 'ka', 'ki', 'ke', 'se', 'ko', 'ye', 'yeh', 
    'prouct', 'product', 'ko', 'bhi', 'achha', 'to', 'dekhao', 'dekhan', 'na', 'kuch', 'aur', 'nhi', 'sahi', 'hona', 'aaye', 'kaisa', 'aisa', 'ek', 'se', 'ho', 
    'ya', 'koi', 'puchhe', 'bataye', 'kaise', 'sabse', 'jada', 'jyada', 'dikhan', 'dikhana', 'dikhaye', 'dikhayein', 'dhoondo', 'find', 'search', 'list', 'lelo', 'kharidna', 'purchase', 'le', 'jo', 'ho'
  ];

  // Tokenize user message to extract search keywords
  const queryWords = extractSearchTokens(message);

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
  if (query.includes("cart") && (query.includes("add") || query.includes("daal") || query.includes("put") || query.includes("insert") || query.includes("যোগ") || query.includes("add to cart"))) {
    const target = matched[0] || products.find(p => query.includes(p.name?.toLowerCase()));
    if (target) {
      reply = resp.addToCartSuccess(target.name);
      cartAction = { type: "add_to_cart", product_id: target.id };
      productCard = { id: target.id, name: target.name, price: target.price, category: target.category, images: target.images };
    } else {
      reply = resp.addToCartSpecify;
    }
  } 
  // Comparison Intent (Detailed comparison with verdict)
  else if (query.includes("compare") || query.includes("vs") || query.includes("antar") || query.includes("difference") || query.includes("difference between") || query.includes("বনাম") || query.includes("তুলনা")) {
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
      reply = compileCompareResponse(p1, p2, bestProduct, lang, resp);
      suggestedProducts = [p1, p2];
    } else {
      reply = resp.compareFallback;
    }
  }
  // Budget & Offers Intent
  else if (query.includes("sasta") || query.includes("budget") || query.includes("discount") || query.includes("offer") || query.includes("under") || query.includes("kam price") || query.includes("coupon") || query.includes("price") || query.includes("বাজেট") || query.includes("ছাড়")) {
    const numbers = query.match(/\d+/g);
    const maxPrice = numbers ? Number(numbers[0]) : 5000;
    
    const budgetMatches = [...products]
      .filter(p => Number(p.price) <= maxPrice)
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 3);
    
    if (budgetMatches.length === 0) {
      budgetMatches.push(...[...products].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 3));
    }
    
    reply = resp.budgetIntro(maxPrice);
    suggestedProducts = budgetMatches.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  } 
  // Ask about product details / product opinion
  else if (matched.length > 0 && (query.includes("kaisa") || query.includes("about") || query.includes("review") || query.includes("opinion") || query.includes("puch") || query.includes("tell me") || query.includes("information") || query.includes("achha") || query.includes("কেমন") || query.includes("রিভিউ"))) {
    const target = matched[0];
    const ratingStr = target.ratings ? `⭐${target.ratings}/5` : "highly rated";
    reply = resp.opinionIntro(target.name, target.category, ratingStr);
    productCard = { id: target.id, name: target.name, price: target.price, category: target.category, images: target.images };
    suggestedProducts = matched.slice(1, 4).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  }
  // Best Products search
  else if (query.includes("best") || query.includes("top rated") || query.includes("star") || query.includes("high rated") || query.includes("সেরা")) {
    const topRated = [...products].sort((a, b) => (Number(b.ratings) || 0) - (Number(a.ratings) || 0)).slice(0, 3);
    reply = resp.bestIntro;
    suggestedProducts = topRated.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  } 
  // Regular search query with keyword matches
  else if (matched.length > 0) {
    reply = resp.searchSuccess(matched[0].name);
    productCard = { id: matched[0].id, name: matched[0].name, price: matched[0].price, category: matched[0].category, images: matched[0].images };
    suggestedProducts = matched.slice(1, 4).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  } 
  // Fallback Welcome
  else {
    reply = resp.welcome;
  }

  return { reply, productCard, suggestedProducts, cartAction };
};;

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
    // 1. Detect emotion and intent (parse intent for BOTH text and voice queries)
    const emotion = detectEmotion(message);
    const voiceIntent = parseVoiceQuery(message);

    // 2. Build smart product query based on intent
    const searchTokens = voiceIntent?.tokens || [];
    const relevanceQuery = buildRelevanceSearchQuery(searchTokens, "SELECT id, name, category, price, stock, ratings, description, images", {
      maxPrice: voiceIntent?.maxPrice,
      category: voiceIntent?.category,
      color: voiceIntent?.color,
      sortByPrice: emotion === 'budget_conscious',
      limit: 15
    });

    let productRes = await database.query(relevanceQuery.query, relevanceQuery.params.length > 0 ? relevanceQuery.params : undefined);

    // Retry with broader query if zero results found
    if (productRes.rows.length === 0 && searchTokens.length > 0) {
      const broadQuery = buildRelevanceSearchQuery(searchTokens, "SELECT id, name, category, price, stock, ratings, description, images", {
        maxPrice: voiceIntent?.maxPrice,
        sortByPrice: emotion === 'budget_conscious',
        limit: 15
      });
      const broadRes = await database.query(broadQuery.query, broadQuery.params.length > 0 ? broadQuery.params : undefined);
      if (broadRes.rows.length > 0) {
        productRes = broadRes;
      }
    }

    // Ultimate fallback if still no results found
    if (productRes.rows.length === 0) {
      const fallbackRes = await database.query("SELECT id, name, category, price, stock, ratings, description, images FROM products WHERE stock > 0 ORDER BY ratings DESC LIMIT 15");
      productRes = fallbackRes;
    }
    const productContext = productRes.rows
      .map(p => `ID:${p.id} | ${p.name} | ${p.category} | ₹${p.price} | ⭐${p.ratings || '4.0'}`)
      .join('\n');

    // 3. Build conversation history string
    const convHistory = Array.isArray(context)
      ? context.slice(-6).map(m => `${m.sender === 'user' ? 'Customer' : 'Salesman'}: ${m.text}`).join('\n')
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
        if (productCard && productCard.id) {
          const matchedDbProduct = productRes.rows.find(r => r.id === productCard.id);
          if (matchedDbProduct) {
            productCard.images = matchedDbProduct.images;
          }
        }
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
        images: p.images,
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
  const searchTokens = intent.tokens || [];

  const relevanceQuery = buildRelevanceSearchQuery(searchTokens, "SELECT id, name, category, price, stock, ratings, images", {
    maxPrice: intent.maxPrice,
    category: intent.category,
    color: intent.color,
    limit: 8
  });

  let result = await database.query(relevanceQuery.query, relevanceQuery.params.length > 0 ? relevanceQuery.params : undefined);

  // Broad fallback retry matching just the tokens
  if (result.rows.length === 0 && searchTokens.length > 0) {
    const broadQuery = buildRelevanceSearchQuery(searchTokens, "SELECT id, name, category, price, stock, ratings, images", {
      maxPrice: intent.maxPrice,
      limit: 8
    });
    result = await database.query(broadQuery.query, broadQuery.params.length > 0 ? broadQuery.params : undefined);
  }

  res.status(200).json({
    success: true,
    products: result.rows,
    intent,
    transcript,
    resultCount: result.rowCount,
  });
});
