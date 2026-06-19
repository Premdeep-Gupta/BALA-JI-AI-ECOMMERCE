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
const generateLocalFallbackResponse = (message, emotion, products) => {
  const query = message.toLowerCase();
  let reply = "";
  let productCard = null;
  let suggestedProducts = [];
  let cartAction = null;

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
  if (query.includes("cart") && (query.includes("add") || query.includes("daal") || query.includes("put") || query.includes("insert"))) {
    const target = matched[0] || products.find(p => query.includes(p.name?.toLowerCase()));
    if (target) {
      reply = `Bilkul! Maine **${target.name}** ko aapke cart me add kar diya hai. Checkout karne ke liye top bar me cart open karein! 🛒`;
      cartAction = { type: "add_to_cart", product_id: target.id };
      productCard = { id: target.id, name: target.name, price: target.price, category: target.category, images: target.images };
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
    suggestedProducts = budgetMatches.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  } 
  // Ask about product details / product opinion
  else if (matched.length > 0 && (query.includes("kaisa") || query.includes("about") || query.includes("review") || query.includes("opinion") || query.includes("puch") || query.includes("tell me") || query.includes("information") || query.includes("achha"))) {
    const target = matched[0];
    const ratingStr = target.ratings ? `⭐${target.ratings}/5` : "highly rated";
    reply = `**${target.name}** ek behtareen quality product hai category **${target.category}** me! Iski customer rating **${ratingStr}** hai, jo iski features aur user satisfaction ko confirm karti hai. Ye purchase ke liye ek perfect choice hai! Iske similar options niche cards me check kar sakte hain.`;
    productCard = { id: target.id, name: target.name, price: target.price, category: target.category, images: target.images };
    suggestedProducts = matched.slice(1, 4).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  }
  // Best Products search
  else if (query.includes("best") || query.includes("top rated") || query.includes("star") || query.includes("high rated")) {
    const topRated = [...products].sort((a, b) => (Number(b.ratings) || 0) - (Number(a.ratings) || 0)).slice(0, 3);
    reply = "Here are the top-rated items with stellar customer reviews in BalajiMart! ⭐ Ye quality aur durability ke liye number 1 choice hain.";
    suggestedProducts = topRated.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  } 
  // Regular search query with keyword matches
  else if (matched.length > 0) {
    reply = `Sure! Maine matching options filter kiye hain. **${matched[0].name}** is a great choice! 🚀 Aur similar product recommendation specifications niche verify kar sakte hain.`;
    productCard = { id: matched[0].id, name: matched[0].name, price: matched[0].price, category: matched[0].category, images: matched[0].images };
    suggestedProducts = matched.slice(1, 4).map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, images: p.images }));
  } 
  // Fallback Welcome
  else {
    reply = "Namaste! Main BalajiMart ki AI assistant 'Salesman' hoon. 🙏 Main aapko items find karne, comparisons compare karne, aur discounts unlock karne me help kar sakti hoon. Aap aaj kya purchase karna chahte hain? 🛍️";
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
