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
import { getSecureProductImage } from "../../utils/urlHelper";

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
    return getSecureProductImage(product);
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
    let cleanQuery = query.trim();
    if (cleanQuery.startsWith("📸 Visual:")) {
      const match = cleanQuery.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        cleanQuery = match[1];
      } else {
        cleanQuery = cleanQuery.replace(/^📸\s*Visual:\s*/i, "").replace(/^[^(]+/, "").replace(/[()]/g, "").trim();
      }
    }
    const q = (resolveAlias(cleanQuery) || cleanQuery).trim();
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
  const speakFeedback = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "hi-IN";
    utter.rate = 1.05;
    utter.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes("hi-IN") || v.lang.includes("en-IN") || v.name.includes("Google Hindi"));
    if (preferredVoice) utter.voice = preferredVoice;
    window.speechSynthesis.speak(utter);
  };

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
        speakFeedback(`Sir, maine aapke liye ${final} search kar diya hai.`);
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

      // Extract average/dominant color of image via Canvas
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(tempImg, 0, 0, 10, 10);
        const imgData = ctx.getImageData(0, 0, 10, 10).data;
        
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < imgData.length; i += 4) {
          if (imgData[i + 3] > 10) {
            rSum += imgData[i];
            gSum += imgData[i + 1];
            bSum += imgData[i + 2];
            count++;
          }
        }
        
        if (count > 0) {
          const rAvg = Math.round(rSum / count);
          const gAvg = Math.round(gSum / count);
          const bAvg = Math.round(bSum / count);
          
          const colors = {
            red: [180, 40, 40],
            green: [40, 150, 40],
            blue: [40, 40, 180],
            yellow: [200, 200, 40],
            white: [220, 220, 220],
            black: [35, 35, 35],
            gray: [120, 120, 120],
            orange: [200, 110, 30],
            pink: [220, 110, 160],
            purple: [110, 40, 160],
            brown: [110, 70, 40]
          };
          
          let nearestColor = "gray";
          let minDistance = Infinity;
          for (const [name, rgb] of Object.entries(colors)) {
            const dist = Math.sqrt(
              Math.pow(rAvg - rgb[0], 2) +
              Math.pow(gAvg - rgb[1], 2) +
              Math.pow(bAvg - rgb[2], 2)
            );
            if (dist < minDistance) {
              minDistance = dist;
              nearestColor = name;
            }
          }
          window.localColorValue = nearestColor;
          console.log(`Extracted local color: ${nearestColor} (rgb: ${rAvg}, ${gAvg}, ${bAvg})`);
        }
      } catch (colorErr) {
        console.warn("Failed to extract local color:", colorErr);
      }

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
      if (window.localColorValue) {
        formData.append("localColor", window.localColorValue);
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
        
        // Save to recent search history
        const categoryName = response.data.category || "";
        const keywordsList = Array.isArray(response.data.keywords) ? response.data.keywords : [];
        const keywordSlice = keywordsList.length > 0 ? keywordsList.slice(0, 3).join(", ") : "";
        let visualQuery = "📸 Visual";
        if (categoryName && keywordSlice) {
          visualQuery = `📸 Visual: ${categoryName} (${keywordSlice})`;
        } else if (categoryName) {
          visualQuery = `📸 Visual: ${categoryName}`;
        } else if (keywordSlice) {
          visualQuery = `📸 Visual: (${keywordSlice})`;
        }
        
        saveRecent(visualQuery);
        setRecentSearches(getRecent());
        
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
      {/* Dynamic Keyframes Styling */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0.6; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.6; }
        }
        .animate-scan-laser {
          position: absolute;
          animation: scan-laser 3s infinite linear;
        }
        @keyframes aura-pulse {
          0% { box-shadow: 0 0 10px rgba(99,102,241,0.2), 0 0 20px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 25px rgba(99,102,241,0.45), 0 0 45px rgba(99,102,241,0.2); }
          100% { box-shadow: 0 0 10px rgba(99,102,241,0.2), 0 0 20px rgba(99,102,241,0.1); }
        }
        .animate-aura-pulse {
          animation: aura-pulse 3s infinite ease-in-out;
        }
        .scrollbar-futuristic::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-futuristic::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 99px;
        }
        .scrollbar-futuristic::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, var(--primary), #6366f1);
          border-radius: 99px;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[12px] transition-all duration-300"
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
          <div className="relative rounded-[24px] overflow-hidden border border-white/[0.08] backdrop-blur-[24px] shadow-[0_30px_100px_rgba(0,0,0,0.85),_0_0_50px_rgba(99,102,241,0.1)] bg-slate-900/75"
            style={{
              background: "linear-gradient(135deg, rgba(17, 18, 36, 0.8) 0%, rgba(10, 11, 22, 0.95) 100%)",
            }}
          >
            {/* Ambient Background Glow Blobs */}
            <div className="absolute -z-10 -top-32 -left-32 w-80 h-80 bg-[var(--primary)]/15 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
            <div className="absolute -z-10 -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />
            
            {/* Glow top border */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-slate-950/30 relative">
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--primary)] to-indigo-600 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 animate-aura-pulse">
                  <Sparkles size={14} className="text-white animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <p className="text-white text-[12px] font-black tracking-[0.15em] uppercase flex items-center gap-1.5">
                    Smart Search Engine
                    <span className="text-[7px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded tracking-widest uppercase">PRO</span>
                  </p>
                  <p className="text-[var(--primary)]/70 text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5">AURA AI · MULTI-LINGUAL COGNITIVE CORE</p>
                </div>
              </div>
              <button
                onClick={closeOverlay}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <X size={14} />
              </button>
            </div>

            {/* ── CAMERA SCANNER PANEL ── */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent"
                >
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Image preview */}
                      <div className="md:col-span-5 relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 aspect-square flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        {scanImage && (
                          <img src={scanImage} className="w-full h-full object-cover" alt="scan" />
                        )}
                        {/* Scanning grid overlay & continuous laser sweep */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
                          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent blur-[0.5px] shadow-[0_0_10px_var(--primary),_0_0_20px_var(--primary)] animate-scan-laser" />
                        </div>
                        {/* Corner brackets */}
                        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[var(--primary)] rounded-tl-md shadow-[0_0_5px_var(--primary)]" />
                        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[var(--primary)] rounded-tr-md shadow-[0_0_5px_var(--primary)]" />
                        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[var(--primary)] rounded-bl-md shadow-[0_0_5px_var(--primary)]" />
                        <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[var(--primary)] rounded-br-md shadow-[0_0_5px_var(--primary)]" />
                        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none" />
                      </div>

                      {/* Scan results */}
                      <div className="md:col-span-7 flex flex-col justify-between space-y-4 h-full">
                        {/* Progress bar */}
                        <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl shadow-inner relative overflow-hidden">
                          <div className="flex items-center gap-1.5 mb-2">
                            <RefreshCw size={11} className={`text-[var(--primary)] ${scanProgress < 100 ? "animate-spin" : ""}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--primary)]">AURA AI COGNITIVE SCAN</span>
                            <span className="ml-auto text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded-md">{scanProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--primary)] via-indigo-500 to-[var(--primary)] rounded-full transition-all duration-500 shadow-[0_0_8px_var(--primary)]"
                              style={{ width: `${scanProgress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 leading-relaxed truncate max-w-[80%]">{scanStage}</p>
                            {scanProgress === 100 && (
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Sync Ready</span>
                            )}
                          </div>
                        </div>

                        {scanResults.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                              Visual Matches Identified:
                            </p>
                            <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-futuristic">
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
                                    className="group relative flex items-start gap-4 p-2.5 bg-slate-950/20 hover:bg-slate-900/50 hover:shadow-[0_0_20px_color-mix(in srgb,var(--primary)_15%,transparent)] border border-white/[0.04] hover:border-[var(--primary)]/30 rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden"
                                  >
                                    {/* Image with discount */}
                                    <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                      {imgSrc && (
                                        <img src={imgSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                      )}
                                      {item.discount_percentage > 0 && (
                                        <div className="absolute top-1 left-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
                                          -{item.discount_percentage}%
                                        </div>
                                      )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-16">
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)] animate-pulse" />
                                          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--primary)]">Balaji Mart</span>
                                          {item.ratings && (
                                            <span className="ml-auto text-[8px] font-bold text-amber-400 flex items-center gap-0.5">
                                              ★ {Number(item.ratings).toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="text-[11px] font-bold text-slate-200 group-hover:text-white line-clamp-1 leading-normal transition-colors">
                                          {item.name}
                                        </h4>
                                      </div>

                                      <div className="flex items-end justify-between mt-1">
                                        <div>
                                          <span className="text-[12px] font-black text-white">₹{parseFloat(item.price).toLocaleString()}</span>
                                          {item.original_price && parseFloat(item.original_price) > parseFloat(item.price) && (
                                            <span className="text-[9px] text-slate-500 line-through ml-1.5">
                                              ₹{parseFloat(item.original_price).toLocaleString()}
                                            </span>
                                          )}
                                        </div>

                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border shadow-sm ${
                                          item.matchPct >= 90
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]'
                                            : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 shadow-[0_0_10px_color-mix(in srgb,var(--primary)_5%,transparent)]'
                                        }`}>
                                          {item.matchPct}% Match
                                        </span>
                                      </div>
                                    </div>
                                    {/* Hover Arrow Effect */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300 text-[var(--primary)] font-bold text-[14px]">
                                      →
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
            <div className="p-4 pb-3">
              <div className={`flex items-center rounded-2xl border overflow-visible transition-all duration-300 relative ${
                focused
                  ? "border-[var(--primary)] shadow-[0_0_25px_rgba(99,102,241,0.25),_inset_0_1px_1px_rgba(255,255,255,0.1)] bg-slate-950/60"
                  : "border-white/10 hover:border-white/15 bg-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]"
              }`}>

                {/* Search input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={voiceTranscript || searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 200)}
                  placeholder={isListening ? "Listening (auto-detecting language)..." : "Search for products, brands, or describe what you need..."}
                  className="flex-1 px-4 h-12 bg-transparent outline-none text-white text-[13px] font-semibold placeholder:text-slate-500 placeholder:font-normal"
                />

                {/* Right controls */}
                <div className="flex items-center gap-1.5 px-2 shrink-0">
                  {/* Clear */}
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                      className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                      <X size={12} />
                    </button>
                  )}

                  {/* Hotkey Hint */}
                  <span className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/5 text-slate-500 text-[8px] font-black border border-white/5 uppercase tracking-wider select-none pointer-events-none">
                    Enter ↵
                  </span>

                  {/* Voice Search (Auto-Language) */}
                  <button
                    onClick={handleVoiceSearch}
                    title="Voice Search (Auto-detect Language)"
                    className={`p-2.5 h-9 rounded-xl transition-all duration-200 border border-white/[0.08] relative overflow-hidden ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-400"
                        : "text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/20"
                    }`}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>

                  {/* Camera */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Visual Product Search"
                    className="p-2.5 h-9 rounded-xl text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/20 border border-white/[0.08] transition-all hover:scale-105"
                  >
                    <Camera size={14} />
                  </button>

                  {/* Search button */}
                  <button
                    onClick={() => handleSearch()}
                    className="px-4 h-9 bg-gradient-to-r from-[var(--primary)] via-indigo-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-[11px] font-black tracking-wider transition-all duration-300 shadow-md shadow-[var(--primary)]/20 flex items-center gap-1.5 active:scale-95 hover:-translate-y-0.5"
                  >
                    <Search size={13} />
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
                  className="mx-4 mb-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 shadow-[0_4px_15px_rgba(245,158,11,0.05)] rounded-2xl flex items-center gap-2"
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
                  <span className="text-[8px] text-slate-500 font-mono ml-1">
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
                  className="mx-4 mb-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-slate-950/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                >
                  {/* Tab selector */}
                  {searchQuery.length === 0 && (
                    <div className="flex p-1.5 bg-white/[0.02] border-b border-white/[0.06] gap-1.5">
                      {hasRecent && (
                        <button
                          onClick={() => setActiveTab("recent")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                            activeTab === "recent"
                              ? "text-white bg-[var(--primary)] shadow-[0_4px_12px_color-mix(in srgb,var(--primary)_25%,transparent)]"
                              : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                          }`}
                        >
                          <Clock size={11} /> Recent Searches
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab("trending")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                          activeTab === "trending"
                            ? "text-white bg-[var(--primary)] shadow-[0_4px_12px_color-mix(in srgb,var(--primary)_25%,transparent)]"
                            : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                        }`}
                      >
                        <TrendingUp size={11} /> Trending Searches
                      </button>
                    </div>
                  )}

                  {/* Product suggestions */}
                  {searchQuery.length > 0 && hasSuggestions && (
                    <div className="max-h-72 overflow-y-auto scrollbar-futuristic">
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
                          className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--primary)]/10 hover:border-l-2 hover:border-l-[var(--primary)] border-b border-white/[0.03] last:border-0 transition-all duration-200 group text-left"
                        >
                          {/* Product image */}
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center shadow-inner">
                            {getProductImage(product) ? (
                              <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <ShoppingBag size={14} className="text-slate-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-slate-200 group-hover:text-white truncate transition-colors">{product.name}</p>
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
                              <p className="text-[12px] font-black text-emerald-400">₹{product.price.toLocaleString()}</p>
                            )}
                            <ArrowRight size={10} className="text-slate-500 group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all ml-auto mt-0.5" />
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
                    <div className="p-3 space-y-1 max-h-72 overflow-y-auto scrollbar-futuristic">
                      {[
                        searchQuery,
                        searchQuery + " under 1000",
                        "best " + searchQuery,
                        searchQuery + " online",
                      ].map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(s)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:translate-x-1 rounded-xl text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all font-semibold text-left group"
                        >
                          <Search size={11} className="text-slate-600 shrink-0 group-hover:text-[var(--primary)] transition-colors" />
                          {s}
                          <ArrowRight size={10} className="ml-auto text-slate-700 group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Recent searches tab */}
                  {searchQuery.length === 0 && activeTab === "recent" && hasRecent && (
                    <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto scrollbar-futuristic">
                      {recentSearches.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 group">
                          <button
                            onClick={() => handleSearch(q)}
                            className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all font-semibold text-left group"
                          >
                            <Clock size={11} className="text-slate-600 shrink-0 group-hover:text-[var(--primary)] transition-colors" />
                            {q}
                          </button>
                          <button
                            onClick={() => {
                              deleteRecent(q);
                              setRecentSearches(getRecent());
                            }}
                            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-500/10 mr-1.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trending tab */}
                  {searchQuery.length === 0 && activeTab === "trending" && (
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-1.5">
                        {TRENDING.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearch(item.text)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-left bg-slate-950/20 hover:bg-[var(--primary)]/10 border border-transparent hover:border-[var(--primary)]/20 transition-all duration-200 group"
                          >
                            <span className="text-[10px] font-black text-slate-600 w-4 shrink-0 transition-colors group-hover:text-[var(--primary)]">#{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-slate-300 group-hover:text-white truncate transition-colors">{item.text}</p>
                              <p className="text-[8px] text-[var(--primary)]/60 font-semibold mt-0.5">{item.cat}</p>
                            </div>
                            <TrendingUp size={10} className="text-slate-700 group-hover:text-[var(--primary)] shrink-0 ml-auto" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search History Products Section */}
                  {searchQuery.length === 0 && recentProducts.length > 0 && (
                    <div className="p-3.5 border-t border-white/[0.06] bg-white/[0.01]">
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
                            className="flex items-center gap-3 p-2 bg-slate-950/25 hover:bg-[var(--primary)]/10 border border-white/[0.04] hover:border-[var(--primary)]/30 rounded-xl transition-all duration-300 text-left group w-full hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center relative shadow-inner">
                              {getProductImage(prod) ? (
                                <img src={getProductImage(prod)} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <ShoppingBag size={14} className="text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-12">
                              <p className="text-[10px] font-bold text-slate-200 group-hover:text-white truncate w-full transition-colors">{prod.name}</p>
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
              <div className="px-4 pb-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">Quick Tags:</span>
                  {["iPhone", "Saree", "Laptop", "Sneakers", "Earbuds", "Yoga Mat", "Kurti"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setSearchQuery(tag); handleSearch(tag); }}
                      className="px-3 py-1 text-[9px] font-black rounded-full border border-white/10 hover:border-[var(--primary)]/40 text-slate-400 hover:text-[var(--primary)] bg-white/[0.02] hover:bg-[var(--primary)]/10 hover:scale-105 hover:-translate-y-0.5 shadow-sm transition-all duration-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom hint */}
            <div className="px-5 pb-4.5 flex items-center justify-between border-t border-white/[0.04] pt-3.5 bg-slate-950/10">
              <p className="text-[9px] text-slate-500 font-semibold flex items-center gap-2">
                <Globe size={10} className="text-[var(--primary)]" />
                Supports Hindi, English + 8 more languages · Nickname search enabled
              </p>
              <p className="text-[8px] text-slate-600 font-mono flex items-center gap-1">
                Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-slate-400 border border-white/10 font-sans text-[8px] font-bold">Enter ↵</kbd> to search
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SearchOverlay;