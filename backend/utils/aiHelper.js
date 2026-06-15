import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", "config", "config.env") });

/**
 * Parses search query locally to extract category & keywords (Hinglish/Hindi rule-based)
 */
export function parseSearchQueryLocally(query) {
  const dictionary = {
    // Grocery / Kitchen / FMCG
    "chini": "sugar",
    "cheeni": "sugar",
    "sabun": "soap",
    "sabon": "soap",
    "namak": "salt",
    "doodh": "milk",
    "dudh": "milk",
    "dahi": "curd",
    "chawal": "rice",
    "atta": "flour",
    "aata": "flour",
    "maida": "flour",
    "suji": "semolina",
    "ghee": "ghee",
    "makkhan": "butter",
    "chai": "tea",
    "chaipatti": "tea",
    "pani": "water",
    "paani": "water",
    "tel": "oil",
    "masala": "spice",
    "masaley": "spices",
    "haldi": "turmeric",
    "jeera": "cumin",
    "dhaniya": "coriander",
    "hing": "asafoetida",
    "adrak": "ginger",
    "lehsun": "garlic",
    "pyaz": "onion",
    "pyaaz": "onion",
    "tamatar": "tomato",
    "aloo": "potato",
    "aalu": "potato",
    "dal": "pulses",
    "biscuit": "cookies",
    "namkeen": "snacks",
    
    // Fashion / Clothes / Shoes
    "kapde": "clothing",
    "kapda": "clothing",
    "joota": "shoes",
    "jootey": "shoes",
    "jute": "shoes",
    "chappal": "slippers",
    "sandals": "sandals",
    "saree": "saree",
    "sadi": "saree",
    "sari": "saree",
    "lehenga": "gown",
    "kurta": "kurta",
    "kurti": "kurti",
    "pajama": "trousers",
    "payjama": "trousers",
    "chashma": "glasses",
    "ghadi": "watch",
    "thaila": "bag",
    "jhola": "bag",
    
    // Home / Decor
    "parda": "curtain",
    "parde": "curtains",
    "takiya": "pillow",
    "chadar": "bedsheet",
    "kambal": "blanket",
    "razai": "quilt",
    "toliya": "towel",
    
    // Electronics / Utility
    "pankha": "fan",
    "tar": "wire",
    "batti": "light"
  };

  const cleanQuery = query.toLowerCase().trim();
  const words = cleanQuery.split(/\s+/);
  const translatedWords = words.map(w => dictionary[w] || w);
  const lowerQuery = translatedWords.join(" ");
  
  let category = null;
  // Dynamically split user query into clean keywords (ignoring short words)
  const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

  // Kids & Baby food / products
  if (
    lowerQuery.includes("bachha") || 
    lowerQuery.includes("bacchon") || 
    lowerQuery.includes("baby") || 
    lowerQuery.includes("kid") ||
    lowerQuery.includes("child") ||
    lowerQuery.includes("khilane") ||
    lowerQuery.includes("khana") ||
    lowerQuery.includes("cerelac") ||
    lowerQuery.includes("lactogen") ||
    lowerQuery.includes("similac") ||
    lowerQuery.includes("diaper") ||
    lowerQuery.includes("nappy") ||
    lowerQuery.includes("pampers") ||
    lowerQuery.includes("huggies") ||
    lowerQuery.includes("bib") ||
    lowerQuery.includes("pacifier") ||
    lowerQuery.includes("crib") ||
    lowerQuery.includes("toy") ||
    lowerQuery.includes("teddy") ||
    lowerQuery.includes("doll") ||
    lowerQuery.includes("nipple")
  ) {
    category = "Kids & Baby";
  } 
  // Beauty & Personal Care
  else if (
    lowerQuery.includes("shampoo") || 
    lowerQuery.includes("conditioner") || 
    lowerQuery.includes("cream") || 
    lowerQuery.includes("moisturizer") ||
    lowerQuery.includes("kajal") ||
    lowerQuery.includes("makeup") ||
    lowerQuery.includes("lipstick") ||
    lowerQuery.includes("face wash") ||
    lowerQuery.includes("hair oil") ||
    lowerQuery.includes("baalon ka tel") ||
    lowerQuery.includes("lotion") ||
    lowerQuery.includes("perfume") ||
    lowerQuery.includes("cosmetics") ||
    lowerQuery.includes("mascara")
  ) {
    category = "Beauty";
  }
  // Grocery & Pantry
  else if (
    lowerQuery.includes("atta") || 
    lowerQuery.includes("dal") || 
    lowerQuery.includes("rice") || 
    lowerQuery.includes("chawal") ||
    lowerQuery.includes("biscuit") ||
    lowerQuery.includes("namkeen") ||
    lowerQuery.includes("chips") ||
    lowerQuery.includes("masala") ||
    lowerQuery.includes("ghee") ||
    lowerQuery.includes("butter") ||
    lowerQuery.includes("tea") ||
    lowerQuery.includes("chai") ||
    lowerQuery.includes("coffee") ||
    lowerQuery.includes("cooking oil") ||
    lowerQuery.includes("oil") ||
    lowerQuery.includes("tel") ||
    lowerQuery.includes("toothpaste") ||
    lowerQuery.includes("colgate") ||
    lowerQuery.includes("closeup") ||
    lowerQuery.includes("paste") ||
    lowerQuery.includes("toothbrush") ||
    lowerQuery.includes("sensodyne") ||
    lowerQuery.includes("himalaya") ||
    lowerQuery.includes("soap") ||
    lowerQuery.includes("detergent") ||
    lowerQuery.includes("dishwash")
  ) {
    category = "Balaji Grocery";
  }
  // Fashion / Clothing
  else if (
    lowerQuery.includes("shirt") || 
    lowerQuery.includes("jeans") || 
    lowerQuery.includes("pant") || 
    lowerQuery.includes("dress") ||
    lowerQuery.includes("saree") ||
    lowerQuery.includes("lehenga") ||
    lowerQuery.includes("tunic") ||
    lowerQuery.includes("shoes") ||
    lowerQuery.includes("chappal") ||
    lowerQuery.includes("joota") ||
    lowerQuery.includes("sandals") ||
    lowerQuery.includes("slippers") ||
    lowerQuery.includes("denim") ||
    lowerQuery.includes("skirt") ||
    lowerQuery.includes("gown") ||
    lowerQuery.includes("sweater") ||
    lowerQuery.includes("jacket") ||
    lowerQuery.includes("sarong") ||
    lowerQuery.includes("miniskirt") ||
    lowerQuery.includes("stole") ||
    lowerQuery.includes("apparel")
  ) {
    category = "Fashion";
  }
  // Home
  else if (
    lowerQuery.includes("curtain") || 
    lowerQuery.includes("parda") || 
    lowerQuery.includes("pillow") || 
    lowerQuery.includes("takiya") ||
    lowerQuery.includes("bed") ||
    lowerQuery.includes("blanket") ||
    lowerQuery.includes("razai") ||
    lowerQuery.includes("towel") ||
    lowerQuery.includes("sheet") ||
    lowerQuery.includes("rug") ||
    lowerQuery.includes("carpet")
  ) {
    category = "Home";
  }

  return { category, keywords };
}

/**
 * Parses search query using Gemini, falls back to local parser on error or rate-limit
 */
export async function parseSearchQuery(query) {
  const localResult = parseSearchQueryLocally(query);
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return localResult;
  }

  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  
  const prompt = `You are a search query analyzer for an e-commerce platform called Balaji Mart.
Analyze this user search query (which may be in English, Hindi, or Hinglish): "${query}".

Determine the most appropriate database category from this exact list:
- "Balaji Grocery" (for all foods, cooking items, snacks, beverages, chocolates, pantry, grocery oils, ghee, dals, masalas, etc.)
- "Kids & Baby" (for baby food, baby cereals, cerelac, diapers, baby wipes, baby soap, kids wear)
- "Fashion" (for adult apparel, clothing, adult shoes, jewelry, tunics, sarees, dresses)
- "Beauty" (for cosmetics, makeup, body wash, shampoo, conditioner, adult hair oil)
- "Home" (for curtains, bed sheets, decor)
- "Books"
- "Sports"
- "Automotive"
- "Electronics"

Also extract 2-5 clean, descriptive English keywords that represent the products they are looking for. For example:
- "bacchon ko khilane wala" -> category: "Kids & Baby", keywords: ["baby food", "cereal", "baby snack", "cerelac"]
- "chappal" -> category: "Fashion", keywords: ["slippers", "sandals"]
- "sarees under 1000" -> category: "Fashion", keywords: ["saree"]
- "dove conditioner" -> category: "Beauty", keywords: ["dove", "conditioner"]

Respond ONLY with a JSON object in this exact format, with no markdown, no explanation:
{
  "category": "Kids & Baby" or other category or null,
  "keywords": ["word1", "word2", ...]
}`;

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return {
      category: parsed.category || localResult.category,
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : localResult.keywords
    };
  } catch (err) {
    console.warn("Gemini query parser failed (falling back to local parser):", err.message);
    return localResult;
  }
}

/**
 * Local fallback for image parsing using filename & type
 */
export async function parseImageFallback(fileName, mimeType) {
  const lowerName = (fileName || "").toLowerCase();
  
  let category = null;
  let keywords = [];

  if (
    lowerName.includes("saree") || 
    lowerName.includes("dress") || 
    lowerName.includes("kurti") || 
    lowerName.includes("suit") ||
    lowerName.includes("jeans") ||
    lowerName.includes("shirt") ||
    lowerName.includes("pant") ||
    lowerName.includes("clothing") ||
    lowerName.includes("apparel") ||
    lowerName.includes("tunic") ||
    lowerName.includes("gown") ||
    lowerName.includes("woman") ||
    lowerName.includes("girl")
  ) {
    category = "Fashion";
    const cleanWords = lowerName.replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(w => w.length > 2 && w !== "jpg" && w !== "png" && w !== "jpeg" && w !== "image" && w !== "screenshot");
    keywords = cleanWords.length > 0 ? cleanWords : ["dress", "clothing"];
  } else if (
    lowerName.includes("baby") || 
    lowerName.includes("kids") || 
    lowerName.includes("child") || 
    lowerName.includes("cerelac") || 
    lowerName.includes("formula") || 
    lowerName.includes("diaper")
  ) {
    category = "Kids & Baby";
    const cleanWords = lowerName.replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(w => w.length > 2 && w !== "jpg" && w !== "png" && w !== "jpeg");
    keywords = cleanWords.length > 0 ? cleanWords : ["baby", "food", "diaper"];
  } else if (
    lowerName.includes("shampoo") || 
    lowerName.includes("conditioner") || 
    lowerName.includes("cream") || 
    lowerName.includes("moisturizer") || 
    lowerName.includes("beauty") ||
    lowerName.includes("kajal") ||
    lowerName.includes("makeup")
  ) {
    category = "Beauty";
    const cleanWords = lowerName.replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(w => w.length > 2 && w !== "jpg" && w !== "png" && w !== "jpeg");
    keywords = cleanWords.length > 0 ? cleanWords : ["beauty", "cosmetics", "shampoo"];
  } else if (
    lowerName.includes("curtain") || 
    lowerName.includes("bed") || 
    lowerName.includes("pillow") || 
    lowerName.includes("home")
  ) {
    category = "Home";
    const cleanWords = lowerName.replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(w => w.length > 2 && w !== "jpg" && w !== "png" && w !== "jpeg");
    keywords = cleanWords.length > 0 ? cleanWords : ["curtains", "bedding"];
  } else if (
    lowerName.includes("atta") || 
    lowerName.includes("ghee") || 
    lowerName.includes("oil") || 
    lowerName.includes("masala") || 
    lowerName.includes("rice") || 
    lowerName.includes("biscuit") || 
    lowerName.includes("chips") ||
    lowerName.includes("food") ||
    lowerName.includes("grocery") ||
    lowerName.includes("toothpaste") ||
    lowerName.includes("closeup") ||
    lowerName.includes("colgate") ||
    lowerName.includes("sensodyne") ||
    lowerName.includes("toothbrush")
  ) {
    category = "Balaji Grocery";
    const cleanWords = lowerName.replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(w => w.length > 2 && w !== "jpg" && w !== "png" && w !== "jpeg");
    keywords = cleanWords.length > 0 ? cleanWords : ["toothpaste", "grocery"];
  }

  // Default fallback if name doesn't specify category
  if (!category) {
    category = null;
    keywords = [];
  }

  return { category, keywords };
}

/**
 * Parses image using Gemini Multimodal Vision to extract rich metadata for Hybrid Camera Search
 */
export async function parseImage(base64Data, mimeType) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const prompt = `You are a highly advanced AI vision and product recognition engine for a premium e-commerce store called Balaji Mart.

Look carefully at this image and identify what product is shown. Extract all possible visual attributes.

STEP 1: Determine the product category EXACTLY from this list:
"Balaji Grocery", "Kids & Baby", "Fashion", "Beauty", "Home", "Books", "Sports", "Automotive", "Electronics".
(Note: Toothpaste/Soap = "Balaji Grocery". Clothing = "Fashion".)

STEP 2: Perform Brand and OCR Detection. Look for any visible logos, brand names, or text on the packaging/product.
STEP 3: Extract the primary color and material/texture (if applicable).
STEP 4: Extract 3-8 specific English keywords that describe the product completely.

Respond ONLY with a JSON object in this EXACT format, no markdown, no explanation:
{
  "category": "one category from the list",
  "brands": ["detected_brand_1", "detected_brand_2"],
  "ocrText": "Any text written on the packaging",
  "color": "primary_color",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
               { text: prompt },
               {
                 inlineData: {
                   mimeType: mimeType || "image/jpeg",
                   data: base64Data
                 }
               }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.warn("Gemini visual analysis failed:", err.message);
    throw err;
  }
}
