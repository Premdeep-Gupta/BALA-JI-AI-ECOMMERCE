import { Search, Sparkles, Star, Filter, SlidersHorizontal, RefreshCw, Check, X, ArrowRight } from "lucide-react";
import { categories } from "../data/products";
import ProductCard from "../components/Products/ProductCard";
import Pagination from "../components/Products/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchAllProducts } from "../store/slices/productSlice";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { trackCategoryView } from "../utils/shoppingBrain";

const SUBCATEGORIES = {
  Electronics: [
    { name: "New launches", query: "new", row: 0, col: 0 },
    { name: "Earphones", query: "earphone", row: 0, col: 1 },
    { name: "Two Wheelers", query: "two wheelers", row: 0, col: 2 },
    { name: "Grooming", query: "grooming", row: 0, col: 3 },
    { name: "Mobile cases", query: "case", row: 0, col: 4 },
    { name: "Storage", query: "storage", row: 0, col: 5 },
    { name: "Chargers & cable", query: "charger", row: 0, col: 6 },
    { name: "Gaming", query: "gaming", row: 0, col: 7 },
    { name: "Health Care", query: "health", row: 0, col: 8 },
    { name: "Gaming Hub", query: "gaming", row: 0, col: 9 },
    { name: "Laptops", query: "laptop", row: 1, col: 0 },
    { name: "Tablets", query: "tablet", row: 1, col: 1 },
    { name: "Wearables", query: "watch", row: 1, col: 2 },
    { name: "Accessories", query: "keyboard", row: 1, col: 3 },
    { name: "Printers", query: "printer", row: 1, col: 4 },
    { name: "Camera", query: "camera", row: 1, col: 5 },
    { name: "Power Banks", query: "power bank", row: 1, col: 6 },
    { name: "Smart devices", query: "smart", row: 1, col: 7 },
    { name: "Speakers", query: "speaker", row: 1, col: 8 },
    { name: "Networking", query: "router", row: 1, col: 9 }
  ],
  Fashion: [
    { name: "Shirts,Tees", query: "shirt", sprite: 1, row: 0, col: 0 },
    { name: "Jeans", query: "jeans", sprite: 1, row: 0, col: 1 },
    { name: "Sports Shoes", query: "shoes", sprite: 1, row: 0, col: 2 },
    { name: "Watches", query: "watch", sprite: 1, row: 0, col: 3 },
    { name: "Kids' clothing", query: "kids", sprite: 1, row: 0, col: 4 },
    { name: "Luggage", query: "luggage", sprite: 1, row: 0, col: 5 },
    { name: "Trackpants", query: "trackpants", sprite: 1, row: 0, col: 6 },
    { name: "Casual Wear", query: "casual", sprite: 1, row: 0, col: 7 },
    { name: "Kurta, pajama", query: "kurta", sprite: 1, row: 0, col: 8 },
    { name: "Briefs, Vest", query: "briefs", sprite: 1, row: 0, col: 9 },

    { name: "Kurta sets", query: "kurta set", sprite: 1, row: 1, col: 0 },
    { name: "Dresses", query: "dress", sprite: 1, row: 1, col: 1 },
    { name: "Casual shoes", query: "casual shoes", sprite: 1, row: 1, col: 2 },
    { name: "Trolley bags", query: "trolley bags", sprite: 1, row: 1, col: 3 },
    { name: "Jewellery", query: "jewellery", sprite: 1, row: 1, col: 4 },
    { name: "Sarees", query: "saree", sprite: 1, row: 1, col: 5 },
    { name: "Jeans", query: "jeans", sprite: 1, row: 1, col: 6 },
    { name: "Kurtis", query: "kurti", sprite: 1, row: 1, col: 7 },
    { name: "Sports Shoes", query: "shoes", sprite: 1, row: 1, col: 8 },
    { name: "Nightsuits", query: "nightsuits", sprite: 1, row: 1, col: 9 },

    { name: "Sneakers", query: "sneaker", sprite: 2, row: 0, col: 0 },
    { name: "Slippers", query: "slippers", sprite: 2, row: 0, col: 1 },
    { name: "Shorts, Boxer", query: "shorts", sprite: 2, row: 0, col: 2 },
    { name: "Formal Wear", query: "formal", sprite: 2, row: 0, col: 3 },
    { name: "Raincoat", query: "raincoat", sprite: 2, row: 0, col: 4 },
    { name: "Drips for him", query: "spoyl", sprite: 2, row: 0, col: 5 },
    { name: "College Ready", query: "college", sprite: 2, row: 0, col: 6 },
    { name: "Focus brands", query: "brand", sprite: 2, row: 0, col: 7 },

    { name: "Dress Material", query: "material", sprite: 2, row: 1, col: 0 },
    { name: "Tops", query: "top", sprite: 2, row: 1, col: 1 },
    { name: "Heels & Flats", query: "heels", sprite: 2, row: 1, col: 2 },
    { name: "Lehenga choli", query: "lehenga", sprite: 2, row: 1, col: 3 },
    { name: "Clogs", query: "clogs", sprite: 2, row: 1, col: 4 },
    { name: "Drips for her", query: "spoyl", sprite: 2, row: 1, col: 5 },
    { name: "Celeb Looks", query: "celeb", sprite: 2, row: 1, col: 6 },
    { name: "Next Gen Fashion", query: "fashion", sprite: 2, row: 1, col: 7 }
  ],
  Mobiles: [
    { name: "iPhone", query: "iphone", row: 0, col: 0 },
    { name: "Samsung", query: "samsung", row: 0, col: 1 },
    { name: "realme", query: "realme", row: 0, col: 2 },
    { name: "AI+", query: "ai", row: 0, col: 3 },
    { name: "Snapdragon", query: "snapdragon", row: 0, col: 4 },
    { name: "Nothing", query: "nothing", row: 0, col: 5 },
    { name: "Infinix", query: "infinix", row: 0, col: 6 },
    { name: "HMD", query: "hmd", row: 0, col: 7 },
    { name: "motorola", query: "motorola", row: 1, col: 0 },
    { name: "vivo", query: "vivo", row: 1, col: 1 },
    { name: "POCO", query: "poco", row: 1, col: 2 },
    { name: "OPPO", query: "oppo", row: 1, col: 3 },
    { name: "Google", query: "google", row: 1, col: 4 },
    { name: "Redmi", query: "redmi", row: 1, col: 5 },
    { name: "Tecno", query: "tecno", row: 1, col: 6 }
  ],
  Beauty: [
    { name: "Skin Care", query: "skin", sprite: 1, row: 0, col: 0 },
    { name: "Top 50 deals", query: "top-50", sprite: 1, row: 0, col: 1 },
    { name: "Hair Care", query: "hair", sprite: 1, row: 0, col: 2 },
    { name: "Mens grooming", query: "grooming", sprite: 1, row: 0, col: 3 },
    { name: "Makeup", query: "makeup", sprite: 1, row: 0, col: 4 },
    { name: "Premium", query: "premium", sprite: 1, row: 0, col: 5 },
    { name: "Fragrances", query: "fragrance", sprite: 1, row: 0, col: 6 },
    { name: "Derma", query: "derma", sprite: 1, row: 0, col: 7 },
    { name: "Personal care", query: "care", sprite: 1, row: 0, col: 8 },
    { name: "K-beauty", query: "k-beauty", sprite: 1, row: 0, col: 9 },
    { name: "Hygiene", query: "hygiene", sprite: 2, row: 0, col: 0 },
    { name: "Oral Care", query: "oral", sprite: 2, row: 0, col: 1 },
    { name: "Beauty Picks", query: "beauty", sprite: 2, row: 0, col: 2 }
  ],
  Home: [
    { name: "Dining", query: "dining", row: 0, col: 0 },
    { name: "Bedsheets", query: "bedsheet", row: 0, col: 1 },
    { name: "Bath linen", query: "bath linen", row: 0, col: 2 },
    { name: "Wallpaper", query: "wallpaper", row: 0, col: 3 },
    { name: "Utilities", query: "utilities", row: 0, col: 4 },
    { name: "Hardware", query: "hardware", row: 0, col: 5 },
    { name: "Lighting", query: "lighting", row: 0, col: 6 },
    { name: "Containers", query: "container", row: 0, col: 7 },
    { name: "Mats & rugs", query: "rug", row: 0, col: 8 },
    { name: "Sofas", query: "sofa", row: 0, col: 9 },
    { name: "Minutes", query: "minutes", row: 1, col: 0 },
    { name: "Decor", query: "decor", row: 1, col: 1 },
    { name: "Drinkware", query: "drinkware", row: 1, col: 2 },
    { name: "Bathroom", query: "bathroom", row: 1, col: 3 },
    { name: "Cookware", query: "cookware", row: 1, col: 4 },
    { name: "Mosquito nets", query: "mosquito net", row: 1, col: 5 },
    { name: "Cleaning", query: "cleaning", row: 1, col: 6 },
    { name: "Mattresses", query: "mattress", row: 1, col: 7 },
    { name: "Beds", query: "bed", row: 1, col: 8 },
    { name: "Gardening", query: "gardening", row: 1, col: 9 }
  ],
  Sports: [
    { name: "Badminton", query: "badminton", sprite: 1, row: 0, col: 0 },
    { name: "Ball sports", query: "ball", sprite: 1, row: 0, col: 1 },
    { name: "Yoga", query: "yoga", sprite: 1, row: 0, col: 2 },
    { name: "Fitness", query: "fitness", sprite: 1, row: 0, col: 3 },
    { name: "Kids' cycles", query: "kids cycle", sprite: 1, row: 0, col: 4 },
    { name: "Kids' favorites", query: "kids favorite", sprite: 1, row: 0, col: 5 },
    { name: "Indoor sports", query: "indoor", sprite: 1, row: 0, col: 6 },
    { name: "Cricket", query: "cricket", sprite: 1, row: 0, col: 7 },
    { name: "Treadmills", query: "treadmill", sprite: 1, row: 0, col: 8 },
    { name: "Cycles", query: "cycle", sprite: 1, row: 0, col: 9 },
    { name: "Exercise bike", query: "exercise bike", sprite: 2, row: 0, col: 0 },
    { name: "Supplements", query: "supplements", sprite: 2, row: 0, col: 1 },
    { name: "Camping", query: "camping", sprite: 2, row: 0, col: 2 },
    { name: "Home gym combo", query: "gym", sprite: 2, row: 0, col: 3 }
  ],
  Automotive: [
    { name: "Dashcams", query: "dashcam", row: 0, col: 0 },
    { name: "Helmets", query: "helmet", row: 0, col: 1 },
    { name: "Covers", query: "cover", row: 0, col: 2 },
    { name: "Car washer", query: "washer", row: 0, col: 3 },
    { name: "Tyres", query: "tyre", row: 0, col: 4 },
    { name: "Media player", query: "media player", row: 0, col: 5 },
    { name: "Car mats", query: "mats", row: 0, col: 6 },
    { name: "Engine oils", query: "engine oil", row: 0, col: 7 },
    { name: "Cleaners", query: "cleaner", row: 1, col: 0 },
    { name: "Lights", query: "light", row: 1, col: 1 },
    { name: "Tyre inflator", query: "inflator", row: 1, col: 2 },
    { name: "Batteries", query: "battery", row: 1, col: 3 },
    { name: "Styling", query: "styling", row: 1, col: 4 },
    { name: "Riding gear", query: "riding gear", row: 1, col: 5 },
    { name: "Subwoofers", query: "subwoofer", row: 1, col: 6 },
    { name: "Air fresheners", query: "freshener", row: 1, col: 7 }
  ],
  "Kids & Baby": [
    { name: "Diapers", query: "diaper", sprite: 1, row: 0, col: 0 },
    { name: "Toys & games", query: "toy", sprite: 1, row: 0, col: 1 },
    { name: "Skin & hair care", query: "care", sprite: 1, row: 0, col: 2 },
    { name: "Top brands", query: "brand", sprite: 1, row: 0, col: 3 },
    { name: "Wipes", query: "wipes", sprite: 1, row: 0, col: 4 },
    { name: "Stationery", query: "stationery", sprite: 1, row: 0, col: 5 },
    { name: "Walkers & more", query: "walker", sprite: 1, row: 0, col: 6 },
    { name: "Summer play", query: "play", sprite: 1, row: 0, col: 7 },
    { name: "Infant Nutrition", query: "nutrition", sprite: 1, row: 0, col: 8 },
    { name: "School supplies", query: "school", sprite: 1, row: 0, col: 9 },
    { name: "Bath tub", query: "bath", sprite: 2, row: 0, col: 0 },
    { name: "Pet toys", query: "pet toy", sprite: 2, row: 0, col: 1 },
    { name: "Art kits", query: "art", sprite: 2, row: 0, col: 2 }
  ],
  "Balaji Grocery": [
    { name: "Fruits & Vegetables", query: "fruits", image: "/grocery/fruits_veg.png" },
    { name: "Atta, Rice & Dal", query: "atta", image: "/grocery/atta_rice_dal.png" },
    { name: "Oil, Ghee & Masala", query: "masala", image: "/grocery/oil_ghee_masala.png" },
    { name: "Dairy, Bread & Eggs", query: "dairy", image: "/grocery/dairy_bread_eggs.png" },
    { name: "Cereals & Dry Fruits", query: "seeds", image: "/grocery/cereals_dry_fruits.png" },
    { name: "Chicken, Meat & Fish", query: "chicken", image: "/grocery/chicken_meat_fish.png" },
    { name: "Instant & Frozen Food", query: "instant", image: "/grocery/instant_frozen.png" },
    { name: "Chips & Namkeens", query: "snacks", image: "/grocery/chips_namkeens.png" },
    { name: "Ice Creams", query: "ice cream", image: "/grocery/ice_cream.png" },
    { name: "Drinks & Juices", query: "juice", image: "/grocery/drinks_juices.png" },
    { name: "Sweets & Chocolates", query: "chocolate", image: "/grocery/sweets_chocolates.png" },
    { name: "Tea, Coffee & Milk Drinks", query: "tea", image: "/grocery/tea_coffee_drinks.png" },
    { name: "Bakery & Biscuits", query: "biscuits", image: "/grocery/bakery_biscuits.png" },
    { name: "Sauces & Spreads", query: "sauces", image: "/grocery/sauces_spreads.png" }
  ]
};

const SpriteImage = ({ spriteUrl, cols, rows, col, row, alt, className }) => {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const img = new Image();
    img.src = spriteUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const slotW = img.width / cols;
      const slotH = img.height / rows;

      // Crop top 76% of slot (removes bottom text label from raw image)
      const cropH = slotH * 0.76;

      canvas.width = slotW;
      canvas.height = cropH;

      ctx.drawImage(
        img,
        col * slotW,
        row * slotH,
        slotW,
        cropH,
        0,
        0,
        slotW,
        cropH
      );

      setSrc(canvas.toDataURL("image/png"));
    };
  }, [spriteUrl, col, row, cols, rows]);

  return src ? (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
    />
  ) : (
    <div className="w-full h-full bg-slate-800 animate-pulse rounded-[1.5rem]" />
  );
};

const Products = () => {
  const { products, totalProducts, aiSearchQuery } = useSelector((state) => state.product);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to get query params
  const useQuery = () => {
    return new URLSearchParams(location.search);
  };

  const query = useQuery();
  const initialCategory = query.get("category") || "";
  const initialSearch = query.get("search") || "";

  // Applied filters state (additional parameters mapped to backend)
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [discount, setDiscount] = useState("");
  const [occasion, setOccasion] = useState("");

  // Drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gender");

  // Temporary filters state for the drawer
  const [tempCategory, setTempCategory] = useState(initialCategory);
  const [tempSubcategory, setTempSubcategory] = useState("");
  const [tempPriceRange, setTempPriceRange] = useState([0, 200000]);
  const [tempRating, setTempRating] = useState(0);
  const [tempAvailability, setTempAvailability] = useState("");
  const [tempBrand, setTempBrand] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempColor, setTempColor] = useState("");
  const [tempSize, setTempSize] = useState("");
  const [tempDiscount, setTempDiscount] = useState("");
  const [tempOccasion, setTempOccasion] = useState("");

  // States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [availability, setAvailability] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Similar products fallback states
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const [gridLayout, setGridLayout] = useState(() => {
    return localStorage.getItem("balaji_grid_layout") || "standard";
  });

  const handleLayoutChange = (newLayout) => {
    setGridLayout(newLayout);
    localStorage.setItem("balaji_grid_layout", newLayout);
  };

  const getGridClasses = () => {
    switch (gridLayout) {
      case "dense":
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5";
      case "spacious":
        return "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-10";
      case "list":
        return "flex flex-col gap-6 w-full";
      case "standard":
      default:
        return "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8";
    }
  };

  // Helper to update URL params and push to history
  const updateURL = (newParams) => {
    const params = new URLSearchParams(location.search);
    Object.keys(newParams).forEach((key) => {
      const val = newParams[key];
      if (val === null || val === undefined || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    // Reset page to 1 automatically if any filters or query changes (and page isn't explicitly changed)
    if (!("page" in newParams)) {
      params.set("page", "1");
    }

    navigate(`/products?${params.toString()}`);
  };

  // Sync URL query params with local states when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    setSearchQuery(params.get("search") || "");
    setSelectedCategory(params.get("category") || "");
    setSelectedSubcategory(params.get("subcategory") || "");
    
    const pageVal = parseInt(params.get("page")) || 1;
    setCurrentPage(pageVal);
    
    const priceVal = params.get("price");
    if (priceVal && priceVal.includes("-")) {
      const parts = priceVal.split("-");
      setPriceRange([parseInt(parts[0]) || 0, parseInt(parts[1]) || 200000]);
    } else {
      setPriceRange([0, 200000]);
    }
    
    setSelectedRating(parseInt(params.get("ratings")) || 0);
    setAvailability(params.get("availability") || "");
    setBrand(params.get("brand") || "");
    setGender(params.get("gender") || "");
    setColor(params.get("color") || "");
    setSize(params.get("size") || "");
    setDiscount(params.get("discount") || "");
    setOccasion(params.get("occasion") || "");
  }, [location.search]);

  // Open drawer and sync temporary filter states
  const openDrawer = () => {
    setTempCategory(selectedCategory);
    setTempSubcategory(selectedSubcategory);
    setTempPriceRange(priceRange);
    setTempRating(selectedRating);
    setTempAvailability(availability);
    setTempBrand(brand);
    setTempGender(gender);
    setTempColor(color);
    setTempSize(size);
    setTempDiscount(discount);
    setTempOccasion(occasion);

    // Auto-adjust active tab if it's not supported in the opened category
    const supportedTabs = getFilterTabsForCategory(selectedCategory);
    const isTabSupported = supportedTabs.some(tab => tab.id === activeTab);
    if (!isTabSupported) {
      setActiveTab(supportedTabs[0]?.id || "category");
    }
    setIsFilterDrawerOpen(true);
  };

  // Apply filters from temporary states inside drawer
  const handleApplyFilters = () => {
    const params = {
      category: tempCategory,
      subcategory: tempSubcategory,
      price: (tempPriceRange[0] !== 0 || tempPriceRange[1] !== 200000) ? `${tempPriceRange[0]}-${tempPriceRange[1]}` : "",
      ratings: tempRating || "",
      availability: tempAvailability,
      brand: tempBrand,
      gender: tempGender,
      color: tempColor,
      size: tempSize,
      discount: tempDiscount,
      occasion: tempOccasion,
      page: 1, // Reset to page 1 on filter application
    };
    updateURL(params);
    setIsFilterDrawerOpen(false);
  };

  // Fetch products logic with 12 items limit standardly
  const campaignId = query.get("campaign_id");
  useEffect(() => {
    if (campaignId) {
      if (products.length === 0 || !aiSearchQuery.startsWith("💥 Campaign:")) {
        // Redux state lost (e.g. page refresh), fetch it from backend
        axiosInstance.get("/campaigns/active").then(res => {
          if (res.data.success && res.data.campaigns) {
            const activeCampaign = res.data.campaigns.find(c => c.id === campaignId);
            if (activeCampaign) {
              dispatch({ type: "product/setCampaignProducts", payload: { products: activeCampaign.products, title: activeCampaign.title } });
            }
          }
        }).catch(err => console.log("Failed to load campaign products", err));
      }
      return; // Skip normal fetch
    }

    const isDbSubcategory = [
      "iphone", "samsung", "realme", "nothing", "infinix", "hmd", "motorola", "vivo", "poco", "oppo", "google", "redmi", "tecno",
      "earphone", "two wheelers", "grooming", "case", "storage", "charger", "gaming", "health", "laptop", "tablet", "watch", "keyboard", "printer", "camera", "power bank", "smart", "speaker", "router",
      "shirt", "jeans", "shoes", "kids", "luggage", "trackpants", "casual", "kurta", "briefs", "kurta set", "dress", "casual shoes", "trolley bags", "jewellery", "saree", "nightsuits", "sneaker", "slippers", "shorts", "formal", "raincoat", "spoyl", "college", "brand", "material", "top", "heels", "lehenga", "clogs", "fashion"
    ].includes(selectedSubcategory.toLowerCase());

    const finalSubcategory = isDbSubcategory ? selectedSubcategory : "";
    const finalSearchQuery = isDbSubcategory ? searchQuery : [selectedSubcategory, searchQuery].filter(Boolean).join(" ");

    dispatch(
      fetchAllProducts({
        category: selectedCategory,
        sub_category: finalSubcategory,
        price: `${priceRange[0]}-${priceRange[1]}`,
        search: finalSearchQuery,
        ratings: selectedRating || "", // Pass empty string if 0 to let backend query standardly
        availability: availability,
        brand: brand,
        gender: gender,
        color: color,
        size: size,
        discount: discount,
        occasion: occasion,
        page: 1, // Always fetch starting from page 1 to load all items cumulatively
        limit: currentPage * 120, // Load all items up to the current scroll page
      })
    );
    if (selectedCategory) trackCategoryView(selectedCategory);
  }, [
    dispatch,
    selectedCategory,
    selectedSubcategory,
    priceRange,
    searchQuery,
    selectedRating,
    availability,
    brand,
    gender,
    color,
    size,
    discount,
    occasion,
    currentPage,
    campaignId,
  ]);

  // Suggest similar products if no results
  useEffect(() => {
    if (products.length === 0 && searchQuery) {
      setLoadingSimilar(true);
      axiosInstance.get("/product?limit=30")
        .then(res => {
          const all = res.data.products || [];

          // Try to filter products that have matching category or keyword in their names/descriptions
          const filtered = all.filter(p => {
            const matchesCategory = selectedCategory && p.category?.toLowerCase() === selectedCategory.toLowerCase();
            const matchesQueryWord = searchQuery.split(/\s+/).some(word =>
              word.length > 2 && (
                p.name?.toLowerCase().includes(word.toLowerCase()) ||
                p.description?.toLowerCase().includes(word.toLowerCase()) ||
                p.category?.toLowerCase().includes(word.toLowerCase())
              )
            );
            return matchesCategory || matchesQueryWord;
          });

          // Fallback to first 6 products if no matching similar words found
          setSimilarProducts(filtered.length > 0 ? filtered.slice(0, 6) : all.slice(0, 6));
        })
        .catch(err => {
          console.error("Failed to load similar products", err);
        })
        .finally(() => {
          setLoadingSimilar(false);
        });
    } else {
      setSimilarProducts([]);
    }
  }, [products.length, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(totalProducts / 120); // UPGRADED: 120 items per page calculation

  const handleClearFilters = () => {
    navigate("/products");

    // Reset temp values
    setTempCategory("");
    setTempSubcategory("");
    setTempPriceRange([0, 200000]);
    setTempRating(0);
    setTempAvailability("");
    setTempBrand("");
    setTempGender("");
    setTempColor("");
    setTempSize("");
    setTempDiscount("");
    setTempOccasion("");
  };

  const hasActiveFilters = !!(
    selectedCategory ||
    selectedSubcategory ||
    priceRange[1] < 200000 ||
    selectedRating > 0 ||
    availability ||
    brand ||
    gender ||
    color ||
    size ||
    discount ||
    occasion ||
    searchQuery
  );

  const getFilterTabsForCategory = (cat) => {
    const allTabs = [
      { id: "gender", label: "Gender" },
      { id: "category", label: "Category" },
      { id: "price", label: "Price" },
      { id: "brand", label: "Brands" },
      { id: "occasion", label: "Occasion" },
      { id: "discount", label: "Discount" },
      { id: "color", label: "Colors" },
      { id: "size", label: "Size & Fit" },
      { id: "rating", label: "Ratings" },
      { id: "availability", label: "Stock Status" },
    ];

    if (!cat) return allTabs;

    switch (cat) {
      case "Fashion":
        return allTabs;
      case "Electronics":
      case "Mobiles":
      case "Beauty":
      case "Automotive":
      case "Balaji Grocery":
        return [
          { id: "category", label: "Category" },
          { id: "price", label: "Price" },
          { id: "brand", label: "Brands" },
          { id: "discount", label: "Discount" },
          { id: "rating", label: "Ratings" },
          { id: "availability", label: "Stock Status" },
        ];
      case "Home":
        return [
          { id: "category", label: "Category" },
          { id: "price", label: "Price" },
          { id: "brand", label: "Brands" },
          { id: "discount", label: "Discount" },
          { id: "color", label: "Colors" },
          { id: "rating", label: "Ratings" },
          { id: "availability", label: "Stock Status" },
        ];
      case "Sports":
        return [
          { id: "category", label: "Category" },
          { id: "price", label: "Price" },
          { id: "brand", label: "Brands" },
          { id: "discount", label: "Discount" },
          { id: "rating", label: "Ratings" },
          { id: "availability", label: "Stock Status" },
        ];
      case "Kids & Baby":
        return [
          { id: "category", label: "Category" },
          { id: "price", label: "Price" },
          { id: "brand", label: "Brands" },
          { id: "discount", label: "Discount" },
          { id: "color", label: "Colors" },
          { id: "size", label: "Size & Fit" },
          { id: "rating", label: "Ratings" },
          { id: "availability", label: "Stock Status" },
        ];
      default:
        return allTabs;
    }
  };

  const FILTER_TABS = getFilterTabsForCategory(tempCategory);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[var(--bg)] text-[var(--text)] selection:bg-red-500/30">

      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] bg-[var(--primary)]/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-[var(--accent)]/10 blur-[130px] rounded-full pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[var(--primary)] block mb-1">Premium Shop</span>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-[var(--text)]">
              DISCOVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-700">PRODUCTS</span>
            </h1>
          </motion.div>
          <span className="bg-[var(--primary)]/10 border border-[var(--border)] px-4 py-2 rounded-2xl text-xs font-black tracking-wider w-fit text-[var(--text)]">
            {products ? products.length : 0} of {totalProducts || 0} items displayed
          </span>
        </div>

        {/* ========================================================
            TOP HORIZONTAL FILTERS & CATEGORIES (MODERN PREMIUM VIEW)
            ======================================================== */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-5 md:p-6 mb-8 shadow-xl backdrop-blur-md space-y-5">

          {/* ROW 1: FILTERS & GRID SWITCHERS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--border)]/30 pb-4">
            {/* Grid density switcher */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text)]/40 mr-1">Grid Density:</span>
              <div className="flex bg-[var(--background)] p-1 rounded-2xl border border-[var(--border)]">
                <button
                  onClick={() => handleLayoutChange("dense")}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    gridLayout === "dense"
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15 scale-105"
                      : "text-[var(--text)]/60 hover:text-white"
                  }`}
                  title="Dense (4 Columns)"
                >
                  4×4
                </button>
                <button
                  onClick={() => handleLayoutChange("standard")}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    gridLayout === "standard"
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15 scale-105"
                      : "text-[var(--text)]/60 hover:text-white"
                  }`}
                  title="Standard (3 Columns)"
                >
                  3×3
                </button>
                <button
                  onClick={() => handleLayoutChange("spacious")}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    gridLayout === "spacious"
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15 scale-105"
                      : "text-[var(--text)]/60 hover:text-white"
                  }`}
                  title="Spacious (2 Columns)"
                >
                  2×2
                </button>
                <button
                  onClick={() => handleLayoutChange("list")}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    gridLayout === "list"
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/15 scale-105"
                      : "text-[var(--text)]/60 hover:text-white"
                  }`}
                  title="List View"
                >
                  List
                </button>
              </div>
            </div>

            {/* Filters toggle */}
            <button
              onClick={openDrawer}
              className="p-3 px-6 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider bg-transparent border-[var(--border)] hover:bg-[var(--primary)]/10 text-[var(--text)] font-bold w-full sm:w-auto"
              title="Open Filters Drawer"
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
            </button>
          </div>

          {/* ROW 2: CATEGORY HORIZONTAL SCROLL CHIPS */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] block">Select Category</span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-hide">
              <button
                onClick={() => { updateURL({ category: "", subcategory: "" }); setTempCategory(""); setTempSubcategory(""); }}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${!selectedCategory
                    ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/15"
                    : "bg-[var(--primary)]/[0.04] border-[var(--border)] hover:bg-[var(--primary)]/10 text-[var(--text)] font-bold"
                  }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { updateURL({ category: cat.name, subcategory: "" }); setTempCategory(cat.name); setTempSubcategory(""); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${selectedCategory === cat.name
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/15"
                      : "bg-[var(--primary)]/[0.04] border-[var(--border)] hover:bg-[var(--primary)]/10 text-[var(--text)] font-bold"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* ROW 2.5: SUBCATEGORY CIRCULAR ICONS FILTER (PREMIUM VIEW LIKE ATTACHED IMAGES) */}
          <AnimatePresence>
            {selectedCategory && SUBCATEGORIES[selectedCategory] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="pt-2 pb-2 border-t border-[var(--border)]/30 space-y-2.5 overflow-hidden">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] block">
                      Refine {selectedCategory}
                    </span>
                    {selectedSubcategory && (
                      <button
                        onClick={() => { updateURL({ subcategory: "" }); setTempSubcategory(""); }}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 active:scale-95 transition-all"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>

                  <div className="grid grid-rows-2 grid-flow-col gap-x-6 gap-y-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-hide py-1 px-1">
                    {SUBCATEGORIES[selectedCategory].map((sub, idx) => {
                      const isSelected = selectedSubcategory === sub.query;

                      // Dynamic styling block matching exact colors from screenshots
                      const getSubcategoryBg = () => {
                        if (isSelected) return "border-[var(--primary)] scale-110 shadow-[0_0_15px_rgba(239,68,68,0.25)] bg-[var(--primary)]/10";
                        if (selectedCategory === "Electronics") return "bg-gradient-to-br from-[#ebf4ff] to-[#d6e4ff] border-[#b3d7ff] text-slate-800";
                        if (selectedCategory === "Fashion") return "bg-gradient-to-br from-[#fffbeb] to-[#fef9c3] border-[#fef08a] text-slate-800";
                        if (selectedCategory === "Mobiles") return "bg-gradient-to-br from-[#fff1f2] to-[#ffe4e6] border-[#fecdd3] text-slate-800";
                        if (selectedCategory === "Beauty") return "bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] border-[#fed7aa] text-slate-800";
                        if (selectedCategory === "Home") return "bg-gradient-to-br from-[#fff8f2] to-[#fef0e3] border-[#fcdcb8] text-slate-800";
                        if (selectedCategory === "Sports") return "bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border-[#fde68a] text-slate-800";
                        if (selectedCategory === "Automotive") return "bg-gradient-to-br from-[#fff8f2] to-[#fef0e3] border-[#fcdcb8] text-slate-800";
                        if (selectedCategory === "Kids & Baby") return "bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border-[#fde68a] text-slate-800";
                        if (selectedCategory === "Balaji Grocery") return "bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border-[#bbf7d0] text-slate-800";
                        return "border-[var(--border)] bg-[var(--card)]";
                      };

                      return (
                        <button
                          key={`${sub.name}_${idx}`}
                          onClick={() => {
                            const newSub = isSelected ? "" : sub.query;
                            updateURL({ subcategory: newSub });
                            setTempSubcategory(newSub);
                          }}
                          className="flex flex-col items-center gap-2 group shrink-0 relative transition-transform duration-300 active:scale-95"
                        >
                          <div
                            className={`w-20 h-20 rounded-[1.75rem] overflow-hidden border-2 transition-all duration-300 flex items-center justify-center relative shadow-md ${getSubcategoryBg()}`}
                          >
                            {selectedCategory === "Mobiles" || selectedCategory === "Fashion" || selectedCategory === "Beauty" || selectedCategory === "Electronics" || selectedCategory === "Home" || selectedCategory === "Sports" || selectedCategory === "Automotive" || selectedCategory === "Kids & Baby" ? (
                              <SpriteImage
                                spriteUrl={
                                  selectedCategory === "Mobiles"
                                    ? "/mobiles_sprite.png"
                                    : selectedCategory === "Fashion"
                                      ? sub.sprite === 1
                                        ? "/fashion_sprite_1.png"
                                        : "/fashion_sprite_2.png"
                                      : selectedCategory === "Beauty"
                                        ? sub.sprite === 1
                                          ? "/beauty_sprite_1.png"
                                          : "/beauty_sprite_2.png"
                                        : selectedCategory === "Electronics"
                                          ? "/electronics_sprite.png"
                                          : selectedCategory === "Home"
                                            ? "/home_sprite.png"
                                            : selectedCategory === "Sports"
                                              ? sub.sprite === 1
                                                ? "/sports_sprite_1.png"
                                                : "/sports_sprite_2.png"
                                              : selectedCategory === "Automotive"
                                                ? "/automotive_sprite.png"
                                                : selectedCategory === "Kids & Baby"
                                                  ? sub.sprite === 1
                                                    ? "/kids_sprite_1.png"
                                                    : "/kids_sprite_2.png"
                                                  : ""
                                }
                                cols={
                                  selectedCategory === "Mobiles"
                                    ? 8
                                    : selectedCategory === "Fashion"
                                      ? sub.sprite === 1
                                        ? 10
                                        : 8
                                      : selectedCategory === "Beauty"
                                        ? sub.sprite === 1
                                          ? 10
                                          : 3
                                        : selectedCategory === "Sports"
                                          ? sub.sprite === 1
                                            ? 10
                                            : 4
                                          : selectedCategory === "Automotive"
                                            ? 8
                                            : selectedCategory === "Kids & Baby"
                                              ? sub.sprite === 1
                                                ? 10
                                                : 3
                                              : 10
                                }
                                rows={selectedCategory === "Beauty" || selectedCategory === "Sports" || selectedCategory === "Kids & Baby" ? 1 : 2}
                                col={sub.col}
                                row={sub.row}
                                alt={sub.name}
                                className="w-full h-full object-cover rounded-[1.5rem] p-1 transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="w-full h-full object-cover rounded-[1.5rem] p-1 transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />
                            )}
                            {/* Selected Overlay Checkmark */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/45 flex items-center justify-center rounded-[1.5rem] backdrop-blur-[1px]">
                                <Check className="w-6 h-6 text-white stroke-[4]" />
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider text-center max-w-[84px] leading-tight transition-all duration-200 ${isSelected
                                ? "text-[var(--primary)] scale-105 font-black"
                                : "text-[var(--text)]/80 group-hover:text-[var(--primary)]"
                              }`}
                          >
                            {sub.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* ========================================================
            PRODUCTS LIST GRID (3 COLUMNS ON DESKTOP DIRECTLY)
            ======================================================== */}
        {/* ACTIVE FILTER CHIPS ROW */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-[var(--card)]/40 border border-[var(--border)]/50 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mr-2">Active Filters:</span>
            {selectedCategory && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Category: {selectedCategory}
                <button onClick={() => { updateURL({ category: "" }); setTempCategory(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {selectedSubcategory && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Subcategory: {selectedSubcategory}
                <button onClick={() => { updateURL({ subcategory: "" }); setTempSubcategory(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {priceRange[1] < 200000 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Max Price: ₹{priceRange[1]}
                <button onClick={() => { updateURL({ price: "" }); setTempPriceRange([0, 200000]); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {selectedRating > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Rating: {selectedRating}★ & above
                <button onClick={() => { updateURL({ ratings: "" }); setTempRating(0); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {availability && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Stock: {availability}
                <button onClick={() => { updateURL({ availability: "" }); setTempAvailability(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {brand && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Brand: {brand}
                <button onClick={() => { updateURL({ brand: "" }); setTempBrand(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {gender && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Gender: {gender}
                <button onClick={() => { updateURL({ gender: "" }); setTempGender(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {color && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Color: {color}
                <button onClick={() => { updateURL({ color: "" }); setTempColor(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {size && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Size: {size}
                <button onClick={() => { updateURL({ size: "" }); setTempSize(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {discount && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Discount: Min {discount}%
                <button onClick={() => { updateURL({ discount: "" }); setTempDiscount(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {occasion && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Occasion: {occasion}
                <button onClick={() => { updateURL({ occasion: "" }); setTempOccasion(""); }} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-full text-xs font-semibold">
                Search: {searchQuery}
                <button onClick={() => updateURL({ search: "" })} className="hover:text-red-400 font-bold ml-1">×</button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="ml-auto text-xs font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 active:scale-95 transition-all"
            >
              Clear All
            </button>
          </div>
        )}

        {/* ========================================================
            PRODUCTS LIST GRID (3 COLUMNS ON DESKTOP DIRECTLY)
            ======================================================== */}
        <div className="w-full">
          {(() => {
            const displayedProducts = products ? products.filter(product => {
              if (selectedCategory && selectedCategory !== "Fashion") {
                const nameLower = (product.name || "").toLowerCase();
                const descLower = (product.description || "").toLowerCase();
                if (nameLower.includes("jeans") || nameLower.includes("shoe") || nameLower.includes("shoes") ||
                  descLower.includes("jeans") || descLower.includes("shoe") || descLower.includes("shoes")) {
                  return false;
                }
              }
              return true;
            }) : [];

            const displayedSimilar = similarProducts ? similarProducts.filter(product => {
              if (selectedCategory) {
                if (product.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
                  return false;
                }
                if (selectedCategory !== "Fashion") {
                  const nameLower = (product.name || "").toLowerCase();
                  const descLower = (product.description || "").toLowerCase();
                  if (nameLower.includes("jeans") || nameLower.includes("shoe") || nameLower.includes("shoes") ||
                    descLower.includes("jeans") || descLower.includes("shoe") || descLower.includes("shoes")) {
                    return false;
                  }
                }
              }
              return true;
            }) : [];

            return displayedProducts.length > 0 ? (
              <div className={getGridClasses()}>
                {displayedProducts.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} isList={gridLayout === "list"} />
                ))}
              </div>
            ) : (
              <div className="space-y-12">
                <div className="text-center py-20 bg-[var(--card)] rounded-[2.5rem] border border-dashed border-[var(--border)] flex flex-col items-center justify-center p-6 backdrop-blur-md">
                  <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Search className="w-10 h-10 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">No Products Matching</h3>
                  <p className="text-[var(--text)]/60 text-sm max-w-md leading-relaxed mb-6 font-medium">
                    We couldn't find any products matching your selected filters. Please reset your parameters and try again.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg"
                  >
                    Reset All Filters
                  </button>
                </div>

                {loadingSimilar ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Searching Similar Products...</p>
                  </div>
                ) : displayedSimilar.length > 0 ? (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                      <Sparkles className="w-6 h-6 text-amber-550 animate-pulse" />
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">
                        Similar Products You Might Like
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {displayedSimilar.map((product) => (
                        <ProductCard key={product._id || product.id} product={product} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>

        {/* HYBRID LOAD MORE & PROGRESS BAR PAGINATION */}
        {products && products.length > 0 && totalPages > 1 && (() => {
          const viewedCount = Math.min(currentPage * 120, totalProducts);
          const progressPercent = totalProducts > 0 ? (viewedCount / totalProducts) * 100 : 0;
          return (
            <div className="flex flex-col items-center gap-3.5 mt-16 mb-8 w-full max-w-md mx-auto p-6 glass border border-[hsla(var(--glass-border))] rounded-3xl shadow-xl">
              <span className="text-xs text-[var(--text)]/60 font-black uppercase tracking-wider">
                You've viewed <span className="text-white font-black">{viewedCount}</span> of{" "}
                <span className="text-[var(--primary)] font-black">{totalProducts}</span> products
              </span>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-[var(--border)]/50 p-[2px]">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-rose-500 rounded-full transition-all duration-750 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {currentPage < totalPages && (
                <button
                  onClick={() => updateURL({ page: currentPage + 1 })}
                  className="mt-3.5 w-full py-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black uppercase tracking-widest rounded-2xl transition-all duration-300 active:scale-95 shadow-[0_10px_25px_rgba(220,100,60,0.35)] flex items-center justify-center gap-3 group border border-[var(--primary)]/20"
                >
                  <span>Load More Products</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* LEFT SIDE FILTER DRAWER */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#180a10] border-r border-[var(--border)] shadow-2xl flex flex-col h-full z-10 text-white"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]/30">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[var(--primary)]" />
                  <h2 className="text-xl font-black uppercase tracking-wider">Filters</h2>
                </div>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Drawer Body (Two Columns Split Pane) */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Tab List */}
                <div className="w-[35%] bg-black/35 border-r border-[var(--border)]/20 overflow-y-auto">
                  {FILTER_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left p-4 text-xs font-black uppercase tracking-wider border-b border-[var(--border)]/10 transition-all ${
                          isActive
                            ? "bg-[var(--primary)]/10 text-[var(--primary)] border-l-4 border-l-[var(--primary)]"
                            : "text-slate-400 hover:bg-white/[0.02] hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Tab Option Details */}
                <div className="w-[65%] p-6 overflow-y-auto bg-[#1b0c13]/50">
                  {activeTab === "gender" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Select Gender</h3>
                      <div className="space-y-3">
                        {[
                          { id: "men", label: "Men" },
                          { id: "women", label: "Women" },
                          { id: "unisex", label: "Unisex" },
                          { id: "kids", label: "Kids" }
                        ].map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setTempGender(tempGender === item.id ? "" : item.id)}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-black transition-all flex items-center justify-between ${
                              tempGender === item.id
                                ? "bg-[var(--primary)]/20 border-[var(--primary)] text-white"
                                : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-slate-355 hover:bg-white/[0.02]"
                            }`}
                          >
                            <span>{item.label}</span>
                            {tempGender === item.id && <Check className="w-4 h-4 text-[var(--primary)]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "category" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Filter by Category</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Main Category</label>
                          <select
                            value={tempCategory}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              setTempCategory(newCat);
                              setTempSubcategory("");
                              const supportedTabs = getFilterTabsForCategory(newCat);
                              const isTabSupported = supportedTabs.some(tab => tab.id === activeTab);
                              if (!isTabSupported) {
                                setActiveTab("category");
                              }
                            }}
                            className="w-full bg-[#13060c] border border-[var(--border)]/60 rounded-xl p-3 text-xs text-white outline-none focus:border-[var(--primary)]"
                          >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        {tempCategory && SUBCATEGORIES[tempCategory] && (
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Subcategory</label>
                            <select
                              value={tempSubcategory}
                              onChange={(e) => setTempSubcategory(e.target.value)}
                              className="w-full bg-[#13060c] border border-[var(--border)]/60 rounded-xl p-3 text-xs text-white outline-none focus:border-[var(--primary)]"
                            >
                              <option value="">All Subcategories</option>
                              {SUBCATEGORIES[tempCategory].map((sub, idx) => (
                                <option key={idx} value={sub.query}>{sub.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "price" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Max Budget</h3>
                      <div className="space-y-4">
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          value={tempPriceRange[1]}
                          onChange={(e) => setTempPriceRange([tempPriceRange[0], parseInt(e.target.value)])}
                          className="w-full accent-[var(--primary)] bg-[var(--border)]/50 h-1.5 rounded-lg cursor-pointer transition"
                        />
                        <div className="flex justify-between text-xs font-mono font-bold text-white">
                          <span>₹{tempPriceRange[0]}</span>
                          <span className="text-[var(--primary)]">₹{tempPriceRange[1]?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "brand" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Select Brand</h3>
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {(() => {
                          const brandsList = tempCategory === "Electronics"
                            ? ["Sony", "Apple", "HP", "Dell", "Boat", "JBL", "Logitech", "Canon", "Epson"]
                            : tempCategory === "Fashion"
                            ? ["Nike", "Adidas", "Puma", "Zara", "H&M", "Levi's", "Roadster"]
                            : tempCategory === "Mobiles"
                            ? ["Apple", "Samsung", "OnePlus", "Realme", "Vivo", "OPPO", "POCO", "Redmi", "Motorola"]
                            : tempCategory === "Beauty"
                            ? ["L'Oreal", "Nivea", "Mamaearth", "Lakme", "Maybelline", "Cetaphil"]
                            : tempCategory === "Home"
                            ? ["Sleepwell", "Wakefit", "Philips", "Syska"]
                            : tempCategory === "Balaji Grocery"
                            ? ["Balaji", "Fortune", "Aashirvaad", "Amul", "Britannia", "Nestle"]
                            : ["Apple", "Samsung", "Nike", "L'Oreal", "HP", "Boat"];

                          return brandsList.map(b => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setTempBrand(tempBrand === b ? "" : b)}
                              className={`w-full text-left p-3 rounded-xl border text-xs font-black transition-all flex items-center justify-between ${
                                tempBrand === b
                                  ? "bg-[var(--primary)]/20 border-[var(--primary)] text-white"
                                  : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-slate-355 hover:bg-white/[0.02]"
                              }`}
                            >
                              <span>{b}</span>
                              {tempBrand === b && <Check className="w-4 h-4 text-[var(--primary)]" />}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {activeTab === "occasion" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Select Occasion</h3>
                      <div className="space-y-2">
                        {["Casual", "Formal", "Sports", "Party", "Festive", "Daily Wear"].map(o => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => setTempOccasion(tempOccasion === o ? "" : o)}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-black transition-all flex items-center justify-between ${
                              tempOccasion === o
                                ? "bg-[var(--primary)]/20 border-[var(--primary)] text-white"
                                : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-slate-355 hover:bg-white/[0.02]"
                            }`}
                          >
                            <span>{o}</span>
                            {tempOccasion === o && <Check className="w-4 h-4 text-[var(--primary)]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "discount" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Min Discount</h3>
                      <div className="space-y-2">
                        {[
                          { value: "10", label: "10% and above" },
                          { value: "20", label: "20% and above" },
                          { value: "30", label: "30% and above" },
                          { value: "40", label: "40% and above" },
                          { value: "50", label: "50% and above" },
                        ].map(d => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => setTempDiscount(tempDiscount === d.value ? "" : d.value)}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-black transition-all flex items-center justify-between ${
                              tempDiscount === d.value
                                ? "bg-[var(--primary)]/20 border-[var(--primary)] text-white"
                                : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-slate-355 hover:bg-white/[0.02]"
                            }`}
                          >
                            <span>{d.label}</span>
                            {tempDiscount === d.value && <Check className="w-4 h-4 text-[var(--primary)]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "color" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Select Color</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {["Black", "White", "Blue", "Red", "Green", "Yellow", "Pink", "Grey", "Gold", "Silver", "Multi"].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setTempColor(tempColor === c ? "" : c)}
                            className={`p-3 rounded-xl border text-xs font-black transition-all flex items-center justify-between ${
                              tempColor === c
                                ? "bg-[var(--primary)]/20 border-[var(--primary)] text-white"
                                : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-slate-355 hover:bg-white/[0.02]"
                            }`}
                          >
                            <span>{c}</span>
                            {tempColor === c && <Check className="w-4 h-4 text-[var(--primary)]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "size" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Select Size</h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Clothing Sizes</span>
                          <div className="flex flex-wrap gap-2">
                            {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setTempSize(tempSize === s ? "" : s)}
                                className={`px-4 py-2.5 border rounded-xl text-xs font-black transition-all ${
                                  tempSize === s
                                    ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                                    : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-white hover:bg-white/[0.02]"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Shoe Sizes</span>
                          <div className="flex flex-wrap gap-2">
                            {["6", "7", "8", "9", "10", "11"].map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setTempSize(tempSize === s ? "" : s)}
                                className={`px-4 py-2.5 border rounded-xl text-xs font-black transition-all ${
                                  tempSize === s
                                    ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                                    : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-white hover:bg-white/[0.02]"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "rating" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Minimum Rating</h3>
                      <div className="space-y-2">
                        {[4, 3, 2, 1].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setTempRating(tempRating === rating ? 0 : rating)}
                            className={`w-full p-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                              tempRating === rating
                                ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                                : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-white hover:bg-white/[0.02]"
                            }`}
                          >
                            <Star size={13} className="text-yellow-455 fill-yellow-455 shrink-0" />
                            <span>{rating}★ & Above</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "availability" && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">Stock Status</h3>
                      <div className="space-y-2">
                        {[
                          { id: "in-stock", label: "In Stock" },
                          { id: "limited", label: "Limited Stock" },
                          { id: "out-of-stock", label: "Out of Stock" }
                        ].map((status) => (
                          <button
                            key={status.id}
                            type="button"
                            onClick={() => setTempAvailability(tempAvailability === status.id ? "" : status.id)}
                            className={`w-full p-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                              tempAvailability === status.id
                                ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                                : "bg-[var(--primary)]/[0.04] border-[var(--border)]/50 text-white hover:bg-white/[0.02]"
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-[var(--border)]/30 bg-black/20 flex gap-4">
                <button
                  onClick={() => {
                    // Reset all temp states inside the drawer
                    setTempCategory("");
                    setTempSubcategory("");
                    setTempPriceRange([0, 200000]);
                    setTempRating(0);
                    setTempAvailability("");
                    setTempBrand("");
                    setTempGender("");
                    setTempColor("");
                    setTempSize("");
                    setTempDiscount("");
                    setTempOccasion("");
                  }}
                  className="w-[35%] py-3 border border-[var(--border)] hover:bg-white/5 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="w-[65%] py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[var(--primary)]/20"
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
