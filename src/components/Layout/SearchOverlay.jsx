import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Search, Mic, Camera, RefreshCw, Image as ImageIcon,
  Clock, TrendingUp, Globe, ArrowRight, Star, MicOff,
  ShoppingBag, Sparkles, Zap
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSearchBar } from "../../store/slices/popupSlice";
import { motion, AnimatePresence } from "framer-motion";
import { axiosInstance } from "../../lib/axios";

// ============================================================
// 🌐 MEGA ALIAS DICTIONARY — Hindi + English Nicknames
// ============================================================
const ALIAS_MAP = {
  // 📱 Phones
  "mobile": "phone", "mobail": "phone", "fone": "phone",
  "cell": "phone", "cellular": "phone", "handset": "phone",
  "android": "smartphone", "iphone": "iPhone",
  "galaxy": "Samsung", "nokia": "Nokia phone",
  "moto": "Motorola", "vivo": "vivo", "oppo": "oppo",

  // 💻 Computers
  "laptop": "laptop", "lappie": "laptop", "leptop": "laptop",
  "lptop": "laptop", "lapptop": "laptop",
  "notebook": "laptop", "pc": "computer",
  "desktop": "desktop computer", "ipad": "tablet", "tab": "tablet",

  // 📺 Home Appliances
  "tv": "television", "telly": "television", "led": "LED TV",
  "smart tv": "Smart TV", "oled": "OLED TV",
  "ac": "air conditioner", "aircon": "air conditioner",
  "split": "split air conditioner", "window ac": "window air conditioner",
  "fridge": "refrigerator", "freeze": "refrigerator",
  "frij": "refrigerator", "frigde": "refrigerator",
  "cooler": "air cooler", "desert cooler": "air cooler",
  "pankha": "fan", "ceiling fan": "ceiling fan",
  "washing machine": "washing machine", "washer": "washing machine",
  "geyser": "water heater", "heater": "room heater",
  "microwave": "microwave oven", "oven": "oven",
  "mixer": "mixer grinder", "juicer": "juicer",
  "iron": "electric iron", "steam iron": "steam iron",
  "vacuum": "vacuum cleaner",

  // 🎧 Audio & Accessories
  "earphone": "earphones", "earfone": "earphones",
  "headphone": "headphones", "headfone": "headphones",
  "hedfone": "headphones", "earbud": "earbuds",
  "airpod": "earbuds", "bluetooth earphone": "wireless earbuds",
  "speaker": "bluetooth speaker", "soundbar": "soundbar",
  "bluetooth speaker": "bluetooth speaker", "jbl": "JBL speaker",
  "bose": "Bose headphones", "sony": "Sony headphones",

  // 🎮 Gaming
  "game": "gaming", "gamer": "gaming",
  "ps5": "PlayStation 5", "playstation": "PlayStation",
  "xbox": "Xbox", "nintendo": "Nintendo",
  "gaming mouse": "gaming mouse", "gaming chair": "gaming chair",
  "gaming headset": "gaming headset",

  // 📸 Camera & Photography
  "cam": "camera", "dslr": "DSLR camera",
  "mirrorless": "mirrorless camera", "gopro": "action camera",
  "webcam": "webcam", "tripod": "camera tripod",

  // ⌚ Wearables
  "watch": "smartwatch", "smart watch": "smartwatch",
  "fitness band": "fitness band", "fit band": "fitness band",
  "apple watch": "Apple Watch",

  // 🔋 Power & Charging
  "charger": "mobile charger", "fast charger": "fast charger",
  "power bank": "power bank", "powerbank": "power bank",
  "adapter": "charger adapter", "cable": "USB cable",

  // 👕 Fashion - Men
  "shirt": "shirt", "tshirt": "t-shirt", "tee": "t-shirt",
  "polo": "polo t-shirt", "full sleeve": "full sleeve shirt",
  "half sleeve": "half sleeve shirt",
  "pant": "trousers", "trouser": "trousers", "formal pant": "formal trousers",
  "chino": "chinos", "cargo": "cargo pants",
  "jeans": "jeans", "denim": "denim jeans",
  "slim fit jeans": "slim fit jeans",
  "jacket": "jacket", "bomber": "bomber jacket",
  "leather jacket": "leather jacket", "windbreaker": "jacket",
  "hoodie": "hoodie", "sweatshirt": "sweatshirt",
  "sweater": "sweater", "pullover": "sweater",
  "blazer": "blazer", "suit": "formal suit",
  "kurta": "kurta", "kurta pajama": "kurta set",
  "dhoti": "dhoti", "lungi": "lungi",
  "underwear": "innerwear", "brief": "underwear",
  "vest": "vest innerwear",

  // 👗 Fashion - Women
  "saree": "saree", "sari": "saree", "sare": "saree",
  "lehenga": "lehenga", "anarkali": "anarkali dress",
  "salwar": "salwar kameez", "salwar kameez": "salwar suit",
  "kurti": "kurti", "kurtis": "kurtis",
  "dress": "dress", "frock": "frock",
  "maxi": "maxi dress", "bodycon": "bodycon dress",
  "top": "women top", "blouse": "blouse",
  "skirt": "skirt", "palazzo": "palazzo pants",
  "legging": "leggings", "tights": "leggings",
  "dupatta": "dupatta", "stole": "stole",
  "nightie": "nightdress", "night suit": "night suit",

  // 👟 Footwear
  "shoe": "shoes", "shoes": "shoes",
  "joota": "shoes", "joote": "shoes",
  "jutti": "shoes", "juttis": "shoes",
  "chappal": "slippers", "chappals": "slippers",
  "sandal": "sandals", "flip flop": "slippers",
  "sneaker": "sneakers", "trainer": "running shoes",
  "sports shoe": "sports shoes", "running shoe": "running shoes",
  "casual shoe": "casual shoes",
  "heel": "heels", "high heel": "high heels",
  "flat": "flat shoes", "mule": "mules",
  "boot": "boots", "ankle boot": "ankle boots",
  "loafer": "loafers", "oxford": "oxford shoes",
  "formal shoe": "formal shoes",

  // 👜 Bags & Accessories
  "bag": "handbag", "purse": "handbag",
  "backpack": "backpack", "school bag": "school backpack",
  "laptop bag": "laptop bag", "trolley": "trolley bag",
  "suitcase": "suitcase", "luggage": "luggage bag",
  "wallet": "wallet", "purse wallet": "wallet",
  "belt": "belt", "leather belt": "leather belt",
  "sunglasses": "sunglasses", "sunglass": "sunglasses",
  "specs": "eyeglasses", "goggle": "sunglasses",
  "cap": "cap", "hat": "hat", "topi": "cap",
  "beanie": "beanie", "baseball cap": "cap",
  "scarf": "scarf", "muffler": "muffler",
  "gloves": "gloves", "socks": "socks",

  // 🏠 Home & Kitchen
  "ghar": "home decor", "rasoi": "kitchen",
  "bistar": "bedsheet", "chadar": "bedsheet",
  "takiya": "pillow", "pillow cover": "pillow cover",
  "razai": "quilt", "blanket": "blanket", "comforter": "comforter",
  "curtain": "curtains", "parda": "curtains",
  "sofa": "sofa", "couch": "sofa", "settee": "sofa",
  "bed": "bed frame", "divan": "divan",
  "mattress": "mattress", "gadda": "mattress",
  "chair": "chair", "table": "table",
  "desk": "study desk", "shelf": "bookshelf",
  "wardrobe": "wardrobe", "almirah": "wardrobe",
  "tawa": "tawa", "kadhai": "kadhai",
  "cooker": "pressure cooker", "pressure cooker": "pressure cooker",
  "bartan": "utensils", "steel bartan": "steel utensils",
  "bowl": "bowl", "plate": "dinner plate",
  "glass": "drinking glass", "mug": "mug",
  "dabba": "storage container", "dibba": "storage box",
  "jhaadu": "broom", "pochha": "mop",
  "lamp": "table lamp", "bulb": "LED bulb",
  "light": "ceiling light", "LED light": "LED strip",
  "wall art": "wall art", "photo frame": "photo frame",
  "clock": "wall clock", "ghadhi": "clock",
  "doormat": "doormat", "rug": "carpet",

  // 📚 Books
  "kitaab": "books", "novel": "novel", "book": "books",
  "ncert": "NCERT books", "textbook": "textbook",
  "upsc": "UPSC books", "engineering book": "engineering books",
  "story book": "story books", "comic": "comic books",

  // 🧴 Beauty & Personal Care
  "cream": "face cream", "moisturizer": "moisturizer",
  "sunscreen": "sunscreen", "spf": "sunscreen SPF",
  "serum": "face serum", "toner": "toner",
  "cleanser": "face wash", "face wash": "face wash",
  "scrub": "face scrub", "mask": "face mask",
  "shampoo": "shampoo", "conditioner": "conditioner",
  "hair oil": "hair oil", "baalon ka tel": "hair oil",
  "lipstick": "lipstick", "lip gloss": "lip gloss",
  "foundation": "foundation", "kajal": "kajal",
  "eyeliner": "eyeliner", "eyeshadow": "eyeshadow",
  "blush": "blush", "highlighter": "highlighter",
  "perfume": "perfume", "deo": "deodorant",
  "deodorant": "deodorant", "body spray": "body spray",
  "razor": "shaving razor", "shaving": "shaving cream",

  // 🍎 Grocery
  "atta": "wheat flour", "maida": "maida flour",
  "chawal": "rice", "basmati": "basmati rice",
  "daal": "lentils", "masoor": "masoor dal",
  "tel": "cooking oil", "sarso": "mustard oil",
  "ghee": "ghee", "butter": "butter",
  "namak": "salt", "cheeni": "sugar",
  "masala": "spices", "haldi": "turmeric",
  "chai": "tea", "green tea": "green tea",
  "coffee": "coffee", "nescafe": "Nescafe coffee",
  "biscuit": "biscuits", "cookie": "cookies",
  "namkeen": "namkeen snacks", "chips": "chips",
  "chocolate": "chocolate", "dairy milk": "Cadbury",

  // 🏋️ Sports & Fitness
  "gym": "gym equipment", "dumbbell": "dumbbells",
  "yoga mat": "yoga mat", "yoga": "yoga mat",
  "cricket bat": "cricket bat", "cricket ball": "cricket ball",
  "football": "football", "basketball": "basketball",
  "tennis": "tennis racket", "badminton": "badminton racket",
  "cycle": "bicycle", "cycling": "bicycle",
  "treadmill": "treadmill", "protein": "protein powder",
  "supplement": "fitness supplements",

  // 🚗 Automotive
  "helmet": "bike helmet", "bike helmet": "motorcycle helmet",
  "car cover": "car body cover", "seat cover": "car seat cover",
  "car mat": "car floor mat", "dashcam": "dashcam",
  "tyre": "tyre", "tire": "tyre",

  // 👶 Kids & Baby
  "bachha": "baby products", "bacchon": "kids products",
  "bacchon ko khilane wala": "baby food", "bachha khata hai": "baby food",
  "bacchon ka khana": "baby food", "baby food": "baby food",
  "cerelac": "Cerelac Rice Cereal", "lactogen": "Lactogen formula",
  "similac": "Similac infant formula", "diaper": "baby diapers",
  "baby wipes": "baby wipes", "huggies": "Huggies diapers",
  "pampers": "Pampers diapers", "mamy poko": "MamyPoko pants",
  "baby milk": "flavoured milk", "milkshake": "milk shake",
};

// ============================================================
// 🔥 TRENDING SEARCHES
// ============================================================
const TRENDING = [
  { text: "iPhone 15", cat: "Mobiles" },
  { text: "Wireless Earbuds", cat: "Electronics" },
  { text: "Saree", cat: "Fashion" },
  { text: "Nike Running Shoes", cat: "Fashion" },
  { text: "Laptop Under 50000", cat: "Electronics" },
  { text: "Air Fryer", cat: "Home" },
  { text: "Gaming Mouse", cat: "Electronics" },
  { text: "Smartwatch", cat: "Electronics" },
  { text: "Kurta Set", cat: "Fashion" },
  { text: "Power Bank", cat: "Electronics" },
  { text: "Yoga Mat", cat: "Sports" },
  { text: "Face Serum", cat: "Beauty" },
];



// ============================================================
// 🔍 Smart Alias Resolver
// ============================================================
const resolveAlias = (query) => {
  const q = query.toLowerCase().trim();
  // Check for direct match
  if (ALIAS_MAP[q]) return ALIAS_MAP[q];
  
  // Split query into words to match whole words only (prevents substring matching like "ac" in "black")
  const words = q.split(/\s+/);
  for (const [alias, resolved] of Object.entries(ALIAS_MAP)) {
    if (words.includes(alias)) return resolved;
  }
  return null;
};

// ============================================================
// 🔢 Fuzzy Levenshtein Distance
// ============================================================
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

// Smart product scorer
const scoreProduct = (product, rawQuery) => {
  const query = rawQuery.toLowerCase().trim();
  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();

  let score = 0;

  // Exact name match (highest)
  if (name === query) score += 100;
  else if (name.includes(query)) score += 70;
  else if (query.includes(name.split(" ")[0])) score += 50;

  // Category match
  if (cat.includes(query)) score += 40;

  // Brand match
  if (brand.includes(query)) score += 35;

  // Description match
  if (desc.includes(query)) score += 15;

  // Word-by-word match
  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  queryWords.forEach(word => {
    if (name.includes(word)) score += 20;
    if (cat.includes(word)) score += 15;
    if (brand.includes(word)) score += 10;
    if (desc.includes(word)) score += 5;
  });

  // Fuzzy levenshtein on first word
  const firstWord = name.split(" ")[0];
  const dist = levenshtein(query, firstWord);
  if (dist <= 2) score += Math.max(0, 30 - dist * 10);

  return score;
};

// ============================================================
// RECENT SEARCHES (localStorage)
// ============================================================
const getRecent = () => {
  try {
    return JSON.parse(localStorage.getItem("__sg_recent") || "[]").slice(0, 8);
  } catch { return []; }
};
const saveRecent = (query) => {
  try {
    const prev = getRecent().filter(q => q !== query);
    localStorage.setItem("__sg_recent", JSON.stringify([query, ...prev].slice(0, 8)));
  } catch {}
};
const deleteRecent = (query) => {
  try {
    const prev = getRecent().filter(q => q !== query);
    localStorage.setItem("__sg_recent", JSON.stringify(prev));
  } catch {}
};

// ============================================================
// RECENT PRODUCTS (localStorage)
// ============================================================
const getRecentProducts = () => {
  try {
    return JSON.parse(localStorage.getItem("__sg_recent_products") || "[]").slice(0, 5);
  } catch { return []; }
};
const saveRecentProduct = (product) => {
  if (!product) return;
  try {
    const pData = {
      id: product._id || product.id,
      _id: product._id || product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category,
      ratings: product.ratings
    };
    const prev = getRecentProducts().filter(p => (p._id || p.id) !== (pData._id || pData.id));
    localStorage.setItem("__sg_recent_products", JSON.stringify([pData, ...prev].slice(0, 5)));
  } catch {}
};

// ============================================================
// 🎨 MAIN COMPONENT
// ============================================================
const SearchOverlay = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // Camera states
  const [isScanning, setIsScanning] = useState(false);
  const [scanImage, setScanImage] = useState(null);
  const [scanStage, setScanStage] = useState("");
  const [scanResults, setScanResults] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);

  // Smart correction
  const [aliasHint, setAliasHint] = useState("");
  const [typoHint, setTypoHint] = useState("");

  // Recent searches and products
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);

  // UI state
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("suggestions"); // suggestions | trending | recent

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const { isSearchBarOpen } = useSelector((state) => state.popup);
  const { products = [] } = useSelector((state) => state.product || {});

  // ── Init on open
  useEffect(() => {
    if (isSearchBarOpen) {
      setSearchQuery("");
      setSuggestions([]);
      setAliasHint("");
      setTypoHint("");
      setIsScanning(false);
      setScanImage(null);
      setScanResults([]);
      setScanProgress(0);
      setRecentSearches(getRecent());
      setRecentProducts(getRecentProducts());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchBarOpen]);

  const getProductImage = (product) => {
    if (!product || !product.images) return null;
    let parsed = [];
    try {
      parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    } catch (_) {}
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0]?.url || parsed[0];
    }
    if (typeof product.images === 'string' && product.images.startsWith('http')) {
      return product.images;
    }
    return null;
  };

  // ── Smart suggestions engine (Live API Autocomplete)
  useEffect(() => {
    const delay = setTimeout(async () => {
      const q = searchQuery.trim();
      if (!q) {
        setSuggestions([]);
        setAliasHint("");
        setTypoHint("");
        return;
      }

      // 1. Alias resolution
      const resolved = resolveAlias(q);
      if (resolved && resolved.toLowerCase() !== q.toLowerCase()) {
        setAliasHint(resolved);
      } else {
        setAliasHint("");
      }

      // 2. Smart query from entire database (Live API Suggestions)
      const effectiveQuery = resolved || q;
      try {
        const res = await axiosInstance.get(`/product?search=${encodeURIComponent(effectiveQuery)}&limit=12`);
        const liveProducts = res.data.products || [];
        setSuggestions(liveProducts);
      } catch (err) {
        console.warn("Dynamic live autocomplete failed, using local fallback:", err.message);
        // Local fallback
        const scored = products
          .map(p => ({ p, score: scoreProduct(p, effectiveQuery) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map(x => x.p);
        setSuggestions(scored);
      }
    }, 200);

    return () => clearTimeout(delay);
  }, [searchQuery, products]);

  // ── Handle search
  const handleSearch = useCallback(async (query = searchQuery) => {
    const q = (resolveAlias(query) || query).trim();
    if (!q) return;

    saveRecent(query.trim());
    setRecentSearches(getRecent());

    try {
      const res = await axiosInstance.get(`/product?search=${encodeURIComponent(q)}&limit=100`);
      const searchResults = res.data.products || [];

      dispatch(toggleSearchBar());

      // If exactly ONE product matches, redirect directly to that product page
      if (searchResults.length === 1) {
        saveRecentProduct(searchResults[0]);
        setRecentProducts(getRecentProducts());
        navigate(`/product/${searchResults[0]._id || searchResults[0].id}`);
      } else {
        navigate(`/products?search=${encodeURIComponent(q)}`);
      }
    } catch (err) {
      console.error("Search fetch failed, using fallback:", err);
      dispatch(toggleSearchBar());
      navigate(`/products?search=${encodeURIComponent(q)}`);
    }

    setSearchQuery("");
    setSuggestions([]);
  }, [searchQuery, dispatch, navigate]);

  // ── Voice search
  const handleVoiceSearch = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search not supported. Please use Chrome browser.");
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = navigator.language || "en-IN";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setIsListening(true);

    rec.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setVoiceTranscript(final || interim);
      if (final) {
        setSearchQuery(final);
        setVoiceTranscript("");
        setTimeout(() => handleSearch(final), 400);
      }
    };

    rec.onerror = () => {
      setIsListening(false);
      setVoiceTranscript("");
    };

    rec.onend = () => {
      setIsListening(false);
      setVoiceTranscript("");
    };

    rec.start();
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script ${src}`));
      document.body.appendChild(script);
    });
  };

  // ── Camera search
  const handleImageSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setScanImage(imageUrl);
    setIsScanning(true);
    setScanProgress(0);
    setScanStage("🔍 Initializing Visual AI Engine...");
    setScanResults([]);

    const stages = [
      [300, 15, "🧠 Connecting to Balaji Visual Server..."],
      [600, 30, "🎨 Analyzing Image Color & Pattern..."],
      [900, 50, "📐 Running Gemini Multi-modal Classifier..."],
      [1300, 75, "🏷️ Matching Features with Catalog..."],
      [1700, 90, "📊 Finalizing Rank Scores..."],
    ];

    stages.forEach(([delay, progress, stage]) => {
      setTimeout(() => {
        // Only update progress stages if we're not currently doing heavy local classification
        setScanProgress(Math.max(progress, 15));
      }, delay);
    });

    let localKeywords = [];
    try {
      setScanStage("🤖 Initializing local classifier...");
      // Re-use TensorFlow.js from @vladmandic/face-api if possible to avoid duplicate registration warnings
      if (!window.tf) {
        try {
          const faceapi = await import("@vladmandic/face-api");
          if (faceapi && faceapi.tf) {
            window.tf = faceapi.tf;
            console.log("Successfully re-used TensorFlow.js from @vladmandic/face-api");
          }
        } catch (err) {
          console.warn("Could not import face-api tf instance, falling back to CDN:", err);
        }
      }

      if (!window.tf) {
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
      }
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet");

      setScanStage("🧠 Analyzing image features locally...");
      const tempImg = new Image();
      tempImg.src = imageUrl;
      await new Promise((resolve, reject) => {
        tempImg.onload = resolve;
        tempImg.onerror = reject;
      });

      const model = await window.mobilenet.load();
      const predictions = await model.classify(tempImg);
      // Clean and split className strings (e.g. "nappy, diaper" -> ["nappy", "diaper"])
      localKeywords = predictions.flatMap(p => 
        p.className.toLowerCase().split(/,\s*/)
      );
      console.log("Local Visual Classifier predictions:", predictions, "Keywords:", localKeywords);
    } catch (localErr) {
      console.warn("Client-side local classification fallback failed:", localErr);
    }

    try {
      setScanStage("🏷️ Matching features with catalog...");
      const formData = new FormData();
      formData.append("image", file);
      if (localKeywords.length > 0) {
        formData.append("localKeywords", JSON.stringify(localKeywords));
      }

      // Call visual search endpoint
      const response = await axiosInstance.post("/product/camera-search", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        setScanProgress(100);
        if (response.data.isFallback) {
          setScanStage("⚠️ Gemini API limit exceeded. Used local visual classifier fallback.");
        } else {
          setScanStage("✅ Scan Complete!");
        }
        
        // Take matching products from backend and show them
        let results = response.data.products || [];
        if (results.length === 0 && response.data.multiObjects) {
          const seenIds = new Set();
          results = response.data.multiObjects
            .flatMap(obj => obj.products || [])
            .filter(prod => {
              const id = prod._id || prod.id;
              if (!id || seenIds.has(id)) return false;
              seenIds.add(id);
              return true;
            });
        }
        setScanResults(results);
      } else {
        throw new Error("Failed to search products");
      }
    } catch (err) {
      console.error("Camera search failed:", err);
      setScanProgress(100);
      setScanStage("❌ Visual search failed. Showing general recommendations.");
      // Fallback
      setScanResults(products.slice(0, 4));
    }
  };

  const closeOverlay = () => {
    dispatch(toggleSearchBar());
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  if (!isSearchBarOpen) return null;

  const showDropdown = focused && (searchQuery.length > 0 || recentSearches.length > 0 || TRENDING.length > 0);
  const hasSuggestions = suggestions.length > 0;
  const hasRecent = recentSearches.length > 0;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-8 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOverlay}
      />

      <div className="relative z-10 w-full max-w-[880px]">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* ── MAIN SEARCH CARD ── */}
          <div className="relative rounded-[20px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
            style={{
              background: "linear-gradient(135deg, rgba(15,15,30,0.97) 0%, rgba(10,10,25,0.99) 100%)",
              border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
            }}
          >
            {/* Glow top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[color-mix(in srgb,var(--primary)_80%,black)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                  <Sparkles size={13} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-[11px] font-black tracking-[0.12em] uppercase">Smart Search Engine</p>
                  <p className="text-[var(--primary)]/60 text-[9px] font-semibold tracking-widest uppercase">AI · Multi-Language · Visual Search</p>
                </div>
              </div>
              <button
                onClick={closeOverlay}
                className="w-7 h-7 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/8 hover:border-red-500/30 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all duration-200"
              >
                <X size={13} />
              </button>
            </div>

            {/* ── CAMERA SCANNER PANEL ── */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-white/[0.06]"
                >
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Image preview */}
                      <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 aspect-video flex items-center justify-center">
                        {scanImage && (
                          <img src={scanImage} className="w-full h-full object-cover" alt="scan" />
                        )}
                        {/* Scanning grid overlay */}
                        {scanProgress < 100 && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(color-mix(in srgb,var(--primary)_5%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in srgb,var(--primary)_5%,transparent)_1px,transparent_1px)] bg-[size:10px_10px]" />
                            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent blur-[2px]" style={{ top: `${(scanProgress / 100) * 100}%`, transition: "top 0.4s ease" }} />
                            <div className="absolute left-0 right-0 h-12 bg-gradient-to-b from-[var(--primary)]/10 to-transparent opacity-60" style={{ top: `${(scanProgress / 100) * 100}%`, transition: "top 0.4s ease", transform: "translateY(-100%)" }} />
                          </div>
                        )}
                        {/* Corner brackets */}
                        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[var(--primary)]/70 rounded-tl-sm animate-pulse" />
                        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[var(--primary)]/70 rounded-tr-sm animate-pulse" />
                        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[var(--primary)]/70 rounded-bl-sm animate-pulse" />
                        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[var(--primary)]/70 rounded-br-sm animate-pulse" />
                      </div>

                      {/* Scan results */}
                      <div className="flex flex-col justify-between space-y-4">
                        {/* Progress bar */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <RefreshCw size={10} className={`text-[var(--primary)] ${scanProgress < 100 ? "animate-spin" : ""}`} />
                            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--primary)]">Neural Scan</span>
                            <span className="ml-auto text-[9px] font-mono font-black text-white">{scanProgress}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--primary)] to-[color-mix(in srgb,var(--primary)_70%,black)] rounded-full transition-all duration-500"
                              style={{ width: `${scanProgress}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-relaxed">{scanStage}</p>
                        </div>

                        {scanResults.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--primary)]/60 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
                              Visual Matches:
                            </p>
                            <div className="grid grid-cols-1 gap-2.5 max-h-[160px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-[var(--primary)]/30">
                              {scanResults.map((item, idx) => {
                                const imgSrc = getProductImage(item);

                                return (
                                  <div
                                    key={item._id || item.id || idx}
                                    onClick={() => {
                                      saveRecentProduct(item);
                                      setRecentProducts(getRecentProducts());
                                      dispatch(toggleSearchBar());
                                      navigate(`/product/${item._id || item.id}`);
                                    }}
                                    className="group relative flex items-start gap-3 p-2 bg-white/[0.03] hover:bg-[var(--primary)]/10 border border-white/[0.06] hover:border-[var(--primary)]/30 rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 shadow-md"
                                  >
                                    {/* Image with discount */}
                                    <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                                      {imgSrc && (
                                        <img src={imgSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                      )}
                                      {item.discount_percentage > 0 && (
                                        <div className="absolute top-0.5 left-0.5 bg-rose-600 text-white text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-wider">
                                          {item.discount_percentage}%
                                        </div>
                                      )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-14">
                                      <div>
                                        <div className="flex items-center gap-1 mb-0.5">
                                          <span className="w-1 h-1 rounded-full bg-[var(--primary)]" />
                                          <span className="text-[7px] font-black uppercase tracking-widest text-[var(--primary)]/80">Balaji Mart</span>
                                          {item.ratings && (
                                            <span className="ml-auto text-[7px] font-bold text-amber-400 flex items-center gap-0.5">
                                              ★ {Number(item.ratings).toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="text-[9px] font-bold text-slate-200 group-hover:text-white line-clamp-1 leading-normal">
                                          {item.name}
                                        </h4>
                                      </div>

                                      <div className="flex items-end justify-between mt-1">
                                        <div>
                                          <span className="text-[10px] font-black text-white">₹{parseFloat(item.price).toLocaleString()}</span>
                                          {item.original_price && parseFloat(item.original_price) > parseFloat(item.price) && (
                                            <span className="text-[8px] text-slate-500 line-through ml-1">
                                              ₹{parseFloat(item.original_price).toLocaleString()}
                                            </span>
                                          )}
                                        </div>

                                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border ${
                                          item.matchPct >= 90
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                            : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/25'
                                        }`}>
                                          {item.matchPct}% Match
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

             {/* ── MAIN SEARCH BAR ── */}
             <div className="p-3 pb-2">
               <div className={`flex items-center rounded-2xl border overflow-visible transition-all duration-300 ${
                 focused
                   ? "border-[var(--primary)]/80 shadow-[0_0_20px_color-mix(in srgb,var(--primary)_25%,transparent),_0_0_0_3px_color-mix(in srgb,var(--primary)_15%,transparent)] bg-slate-950/40"
                   : "border-white/[0.08]"
               } bg-white/[0.04]`}>
 
                {/* Search input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={voiceTranscript || searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 200)}
                  placeholder={isListening ? "Listening (auto-detect language)..." : "Search for products, brands, or describe what you need..."}
                  className="flex-1 px-4 h-11 bg-transparent outline-none text-white text-[12px] font-semibold placeholder:text-slate-500 placeholder:font-normal"
                />

                {/* Right controls */}
                <div className="flex items-center gap-1 px-2 shrink-0">
                  {/* Clear */}
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                      className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                      <X size={12} />
                    </button>
                  )}

                  {/* Voice Search (Auto-Language) */}
                  <button
                    onClick={handleVoiceSearch}
                    title="Voice Search (Auto-detect Language)"
                    className={`p-2 h-8 rounded-xl transition-all duration-200 border border-white/[0.08] ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"
                    }`}
                  >
                    {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                  </button>
 
                  {/* Camera */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Visual Product Search"
                    className="p-2 h-8 rounded-xl text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 border border-white/[0.08] transition-all"
                  >
                    <Camera size={13} />
                  </button>
 
                  {/* Search button */}
                  <button
                    onClick={() => handleSearch()}
                    className="px-3 h-8 bg-gradient-to-r from-[var(--primary)] to-[color-mix(in srgb,var(--primary)_80%,black)] hover:opacity-90 text-white rounded-xl text-[11px] font-black tracking-wider transition-all duration-200 shadow-lg shadow-[var(--primary)]/20 flex items-center gap-1.5 active:scale-95"
                  >
                    <Search size={12} />
                    <span className="hidden sm:block">Search</span>
                  </button>
                </div>
 
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSearch} className="hidden" />
              </div>
            </div>

            {/* ── ALIAS / TYPO HINT ── */}
            <AnimatePresence>
              {(aliasHint || typoHint) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-3 mb-2 px-4 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl flex items-center gap-2"
                >
                  <Zap size={11} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] text-slate-300 font-semibold">
                    {aliasHint ? "Smart match found:" : "Did you mean:"}
                  </span>
                  <button
                    onClick={() => {
                      const fix = aliasHint || typoHint;
                      setSearchQuery(fix);
                      setAliasHint("");
                      setTypoHint("");
                    }}
                    className="text-[10px] font-black text-amber-400 hover:text-amber-300 underline underline-offset-2 tracking-wide"
                  >
                    {aliasHint || typoHint}
                  </button>
                  <span className="text-[8px] text-slate-600 font-mono ml-1">
                    {aliasHint ? "(nickname resolved)" : "(auto-correct)"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── DROPDOWN PANEL ── */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-3 mb-3 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl"
                >
                  {/* Tab selector */}
                  {searchQuery.length === 0 && (
                    <div className="flex border-b border-white/[0.06]">
                      {hasRecent && (
                        <button
                          onClick={() => setActiveTab("recent")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                            activeTab === "recent" ? "text-[var(--primary)] border-b-2 border-[var(--primary)] bg-white/[0.02]" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <Clock size={10} /> Recent Searches
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab("trending")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeTab === "trending" ? "text-[var(--primary)] border-b-2 border-[var(--primary)] bg-white/[0.02]" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <TrendingUp size={10} /> Trending
                      </button>
                    </div>
                  )}

                  {/* Product suggestions */}
                  {searchQuery.length > 0 && hasSuggestions && (
                    <div className="max-h-72 overflow-y-auto">
                      {suggestions.map((product, i) => (
                        <button
                          key={product._id || product.id || i}
                          onClick={() => {
                            saveRecent(product.name);
                            saveRecentProduct(product);
                            setRecentSearches(getRecent());
                            setRecentProducts(getRecentProducts());
                            dispatch(toggleSearchBar());
                            navigate(`/product/${product._id || product.id}`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--primary)]/10 border-b border-white/[0.04] last:border-0 transition-all duration-150 group text-left"
                        >
                          {/* Product image */}
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
                            {getProductImage(product) ? (
                              <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <ShoppingBag size={14} className="text-slate-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-[var(--primary)]/70 font-semibold truncate">{product.category}</span>
                              {product.ratings && (
                                <span className="flex items-center gap-0.5 text-[9px] text-yellow-500 font-bold">
                                  <Star size={8} className="fill-yellow-500" /> {product.ratings}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {product.price && (
                              <p className="text-[11px] font-black text-emerald-400">₹{product.price.toLocaleString()}</p>
                            )}
                            <ArrowRight size={10} className="text-slate-600 group-hover:text-[var(--primary)] transition-colors ml-auto mt-0.5" />
                          </div>
                        </button>
                      ))}

                      {/* Search all results */}
                      <button
                        onClick={() => handleSearch()}
                        className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-[var(--primary)] hover:text-white hover:bg-[var(--primary)]/10 transition-all uppercase tracking-wider border-t border-white/[0.06]"
                      >
                        <Search size={11} />
                        See all results for "{searchQuery}"
                      </button>
                    </div>
                  )}

                  {/* Text-only suggestions fallback */}
                  {searchQuery.length > 0 && !hasSuggestions && (
                    <div className="p-3 space-y-1">
                      {[
                        searchQuery,
                        searchQuery + " under 1000",
                        "best " + searchQuery,
                        searchQuery + " online",
                      ].map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(s)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all font-semibold text-left"
                        >
                          <Search size={11} className="text-slate-600 shrink-0" />
                          {s}
                          <ArrowRight size={10} className="ml-auto text-slate-700" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Recent searches tab */}
                  {searchQuery.length === 0 && activeTab === "recent" && hasRecent && (
                    <div className="p-2 space-y-0.5">
                      {recentSearches.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 group">
                          <button
                            onClick={() => handleSearch(q)}
                            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all font-semibold text-left"
                          >
                            <Clock size={11} className="text-slate-600 shrink-0" />
                            {q}
                          </button>
                          <button
                            onClick={() => {
                              deleteRecent(q);
                              setRecentSearches(getRecent());
                            }}
                            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-500/10"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trending tab */}
                  {searchQuery.length === 0 && activeTab === "trending" && (
                    <div className="p-2">
                      <div className="grid grid-cols-2 gap-1">
                        {TRENDING.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearch(item.text)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-[var(--primary)]/10 border border-transparent hover:border-[var(--primary)]/20 transition-all duration-150 group"
                          >
                            <span className="text-[9px] font-black text-slate-600 w-4 shrink-0">#{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate">{item.text}</p>
                              <p className="text-[8px] text-[var(--primary)]/60 font-semibold">{item.cat}</p>
                            </div>
                            <TrendingUp size={9} className="text-slate-700 group-hover:text-[var(--primary)] ml-auto shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search History Products Section */}
                  {searchQuery.length === 0 && recentProducts.length > 0 && (
                    <div className="p-3 border-t border-white/[0.06] bg-white/[0.01]">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <Clock size={10} className="text-[var(--primary)]" /> Recent Products History
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {recentProducts.map((prod, idx) => (
                          <button
                            key={prod._id || prod.id || idx}
                            onClick={() => {
                              saveRecentProduct(prod);
                              setRecentProducts(getRecentProducts());
                              dispatch(toggleSearchBar());
                              navigate(`/product/${prod._id || prod.id}`);
                            }}
                            className="flex items-center gap-3 p-2 bg-white/[0.03] hover:bg-[var(--primary)]/10 border border-white/[0.06] hover:border-[var(--primary)]/30 rounded-xl transition-all duration-200 text-left group w-full"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center relative">
                              {getProductImage(prod) ? (
                                <img src={getProductImage(prod)} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <ShoppingBag size={14} className="text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-12">
                              <p className="text-[10px] font-bold text-slate-200 group-hover:text-white truncate w-full">{prod.name}</p>
                              <div className="flex items-center justify-between w-full mt-1">
                                <span className="text-[8px] text-[var(--primary)]/70 font-semibold truncate max-w-[60%]">{prod.category}</span>
                                <span className="text-[9px] font-black text-emerald-400">₹{prod.price?.toLocaleString()}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── QUICK TAGS (shown when nothing typed) ── */}
            {!focused && !isScanning && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-600">Quick:</span>
                  {["iPhone", "Saree", "Laptop", "Sneakers", "Earbuds", "Yoga Mat", "Kurti"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setSearchQuery(tag); handleSearch(tag); }}
                      className="px-2.5 py-1 text-[9px] font-bold rounded-full border border-[var(--primary)]/20 text-[var(--primary)]/70 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom hint */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <p className="text-[8px] text-slate-600 font-semibold flex items-center gap-1.5">
                <Globe size={9} className="text-[var(--primary)]" />
                Supports Hindi, English + 8 more languages · Nickname search enabled
              </p>
              <p className="text-[8px] text-slate-700 font-mono">
                Press <kbd className="px-1 py-0.5 bg-white/5 rounded text-slate-600 border border-white/10">Enter</kbd> to search
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SearchOverlay;