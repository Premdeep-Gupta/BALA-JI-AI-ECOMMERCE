import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star, ShoppingCart, Heart, Share2, Plus, Minus,
  ShieldCheck, Truck, ArrowLeft, Zap, Check, ChevronDown,
  ChevronRight, MapPin, RefreshCw, Tag, CreditCard, Smartphone,
  Package, BadgeCheck, Clock, ZoomIn, ChevronLeft, Copy,
  Sparkles, X, Link2, Play, Maximize, Cpu, Battery, Camera, Database,
  Layers, Pause, RotateCcw
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import { addToCart } from "../store/slices/cartSlice";
import { fetchAllProductDetails } from "../store/slices/productSlice";
import { toggleWishlist } from "../store/slices/wishlistSlice";
import { toggleCart } from "../store/slices/popupSlice";
import ReviewsContainer from "../components/Products/ReviewsContainer";
import Loader from "../components/Layout/Loader";
import ProductCard from "../components/Products/ProductCard";
import { axiosInstance } from "../lib/axios";
import { trackCategoryView } from "../utils/shoppingBrain";

const SIZES = {
  Fashion: ["S", "M", "L", "XL", "XXL", "XXXL"],
  Footwear: ["6", "7", "8", "9", "10", "11"],
};

const isShoeProduct = (prod) => {
  if (!prod) return false;
  if (prod.category === "Footwear" || prod.category === "footwear") return true;

  const nameLower = (prod.name || "").toLowerCase();
  const descLower = (prod.description || "").toLowerCase();
  const subCategoryLower = (prod.sub_category || "").toLowerCase();

  // Exclude clothing items from shoe classification
  const clothingKeywords = [
    "shirt", "tee", "tshirt", "jeans", "denim", "pants", "trouser", "trousers", 
    "dress", "kurtis", "kurti", "kurta", "pajama", "pyjama", "briefs", "vest", 
    "saree", "sari", "lehenga", "choli", "shorts", "boxer", "top", "tops", 
    "blouse", "tunics", "tunic", "leggings", "joggers", "trackpants", "suit", 
    "lingerie", "bra", "cardigan", "sweater", "sweatshirt", "hoodie", "nightwear", 
    "loungewear", "sleepwear", "romper", "bodysuit", "clothing", "apparel"
  ];
  
  const hasClothingTerm = clothingKeywords.some(kw => 
    new RegExp(`\\b${kw}\\b`, 'i').test(nameLower) || 
    new RegExp(`\\b${kw}\\b`, 'i').test(descLower) ||
    new RegExp(`\\b${kw}\\b`, 'i').test(subCategoryLower)
  );

  if (hasClothingTerm) {
    // If it has clothing terms, only classify as a shoe if name explicitly says so
    const shoeSpecificKeywords = ["shoe", "shoes", "sneaker", "sneakers", "loafer", "loafers", "sandal", "sandals", "boots", "boot"];
    const hasShoeTermInName = shoeSpecificKeywords.some(kw => 
      new RegExp(`\\b${kw}\\b`, 'i').test(nameLower)
    );
    if (!hasShoeTermInName) {
      return false; 
    }
  }

  // Match actual shoe keywords with strict word boundaries
  const shoeKeywords = [
    "shoe", "shoes", "oxford", "oxfords", "sneaker", "sneakers", "boot", "boots", 
    "slipper", "slippers", "footwear", "clog", "clogs", "heels", "heel", 
    "flats", "loafer", "loafers", "sandal", "sandals"
  ];

  return shoeKeywords.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(nameLower) || regex.test(descLower) || regex.test(subCategoryLower);
  });
};

const getShoeSizes = (prod) => {
  if (!prod) return ["4", "5", "6", "7", "8", "9", "10"];
  const nameLower = (prod.name || "").toLowerCase();
  const descLower = (prod.description || "").toLowerCase();

  const isWomen = nameLower.includes("women") || descLower.includes("women") || nameLower.includes("woman") || descLower.includes("woman") || nameLower.includes("girl") || descLower.includes("girl") || nameLower.includes("female") || descLower.includes("female");

  if (isWomen) {
    return ["3", "4", "5", "6", "7", "8", "9"];
  }
  return ["4", "5", "6", "7", "8", "9", "10"];
};

const OFFERS = [
  {
    icon: <Tag size={14} className="text-green-500 shrink-0 mt-0.5" />,
    title: "Bank Offer",
    desc: "10% off on SBI Credit Card, up to ₹1,500. Min purchase of ₹5,000",
    tag: "T&C",
  },
  {
    icon: <CreditCard size={14} className="text-blue-500 shrink-0 mt-0.5" />,
    title: "Special Price",
    desc: "Get extra ₹50 off (price inclusive of cashback/coupon)",
    tag: "T&C",
  },
  {
    icon: <Smartphone size={14} className="text-purple-500 shrink-0 mt-0.5" />,
    title: "UPI Offer",
    desc: "5% Unlimited Cashback on Flipkart Axis Bank Credit Card",
    tag: "T&C",
  },
  {
    icon: <RefreshCw size={14} className="text-orange-500 shrink-0 mt-0.5" />,
    title: "Free Returns",
    desc: "7-day easy return policy. Hassle free pickup & refund",
    tag: "Policy",
  },
];

const parseMobileName = (name) => {
  if (!name) return { model: "Smartphone", color: "Gravity Black", variant: "64 GB + 4 GB" };
  const regex = /^(.*?)\s*\(([^,]+?)\s*,\s*([^)]+?)\)$/i;
  const match = name.match(regex);
  if (match) {
    let colorVal = match[2].trim();
    let variantVal = match[3].trim();
    if (!variantVal.includes("RAM") && !variantVal.includes("+")) {
      variantVal = `${variantVal} + 4 GB`;
    }
    return {
      model: match[1].trim(),
      color: colorVal,
      variant: variantVal
    };
  }
  return {
    model: name,
    color: "Gravity Black",
    variant: "64 GB + 4 GB"
  };
};

const parseMobileSpecs = (descStr) => {
  if (!descStr) return { ramRom: "4 GB RAM | 64 GB ROM", display: "6.5 inch HD+ Display", camera: "50MP Dual Rear Camera", processor: "Octa Core Processor", battery: "5000 mAh Battery", warranty: "1 Year Manufacturer Warranty" };
  const clean = descStr.replace(/[\[\]']/g, "");
  const parts = clean.split(/[.|;|,\n]+/).map(p => p.trim()).filter(Boolean);
  let ramRom = "";
  let display = "";
  let camera = "";
  let processor = "";
  let battery = "";
  let warranty = "";
  parts.forEach(part => {
    const lower = part.toLowerCase();
    if (lower.includes("rom") || lower.includes("ram")) {
      ramRom = part;
    } else if (lower.includes("display") || lower.includes("inch") || lower.includes("screen") || lower.includes("lcd") || lower.includes("amoled")) {
      display = part;
    } else if (lower.includes("camera") || lower.includes("rear") || lower.includes("front") || lower.includes("mp")) {
      camera = part;
    } else if (lower.includes("processor") || lower.includes("chip") || lower.includes("snapdragon") || lower.includes("unisoc") || lower.includes("helio") || lower.includes("dimensity") || lower.includes("mediatek")) {
      processor = part;
    } else if (lower.includes("battery") || lower.includes("mah")) {
      battery = part;
    } else if (lower.includes("warranty") || lower.includes("year")) {
      warranty = part;
    }
  });
  return {
    ramRom: ramRom || "4 GB RAM | 64 GB ROM",
    display: display || "16.71 cm (6.58 inch) Full HD+ Display",
    camera: camera || "50MP + 2MP | 8MP Front Camera",
    processor: processor || "Qualcomm Snapdragon 680 Processor",
    battery: battery || "5000 mAh Battery",
    warranty: warranty || "1 Year on Handset and 6 Months on Accessories"
  };
};

// ── Fashion color helpers ──────────────────────────────────────
const parseFashionColor = (name) => {
  if (!name) return null;
  const match = name.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : null;
};

const getFashionBaseName = (name) => {
  if (!name) return "";
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
};
// ──────────────────────────────────────────────────────────────

const ThreeSixtyViewer = ({ images, product }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [scale, setScale] = useState(1);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startFrame = useRef(0);
  const startRotationY = useRef(0);
  const startRotationX = useRef(0);

  // Parse specs for hotspots
  const specs = parseMobileSpecs(product?.description || "");
  const isMobile = product?.category === "Mobiles" || product?.name?.toLowerCase().includes("phone");

  const hotspots = isMobile ? [
    { id: 1, top: "28%", left: "50%", title: "Display Panel", content: specs.display || "Full HD+ Immersive Display" },
    { id: 2, top: "12%", left: "78%", title: "AI Camera", content: specs.camera || "High Resolution Main Camera" },
    { id: 3, top: "72%", left: "48%", title: "Battery", content: specs.battery || "Long Lasting Battery Power" }
  ] : [
    { id: 1, top: "35%", left: "45%", title: "Premium Design", content: "Built with premium materials and ergonomic layout." },
    { id: 2, top: "65%", left: "68%", title: "Quality Checked", content: "100% original brand certified product with seller warranty." }
  ];

  // Auto rotation tick
  useEffect(() => {
    if (!isAutoRotating) return;
    let animId;
    const tick = () => {
      if (images.length >= 30) {
        setFrameIndex(prev => (prev + 1) % images.length);
      } else {
        setRotationY(prev => (prev + 1.2) % 360);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating, images.length]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startFrame.current = frameIndex;
    startRotationY.current = rotationY;
    startRotationX.current = rotationX;
    setIsAutoRotating(false); // Pause auto-rotation on user drag
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (images.length >= 30) {
      const speed = 8;
      const frameCount = images.length;
      const offset = Math.floor(deltaX / speed);
      let nextFrame = (startFrame.current - offset) % frameCount;
      if (nextFrame < 0) nextFrame += frameCount;
      setFrameIndex(nextFrame);
    } else {
      const sensitivity = 0.6;
      setRotationY(startRotationY.current + deltaX * sensitivity);
      // Clamp vertical tilt between -40 and 40
      const nextRotX = Math.max(-40, Math.min(40, startRotationX.current - deltaY * sensitivity));
      setRotationX(nextRotX);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 0) return;
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startFrame.current = frameIndex;
    startRotationY.current = rotationY;
    startRotationX.current = rotationX;
    setIsAutoRotating(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    if (images.length >= 30) {
      const speed = 8;
      const frameCount = images.length;
      const offset = Math.floor(deltaX / speed);
      let nextFrame = (startFrame.current - offset) % frameCount;
      if (nextFrame < 0) nextFrame += frameCount;
      setFrameIndex(nextFrame);
    } else {
      const sensitivity = 0.6;
      setRotationY(startRotationY.current + deltaX * sensitivity);
      const nextRotX = Math.max(-40, Math.min(40, startRotationX.current - deltaY * sensitivity));
      setRotationX(nextRotX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const width = 280;
  const height = 280;
  const depth = 80;

  const radY = (rotationY * Math.PI) / 180;
  const radX = (rotationX * Math.PI) / 180;
  
  // Projected shadow width
  const shadowWidth = (Math.abs(Math.cos(radY)) * width + Math.abs(Math.sin(radY)) * depth);
  const shadowScaleX = shadowWidth / width;
  const shadowOpacity = Math.max(0.04, 0.16 * Math.cos(radX));
  const shadowBlur = 3 + Math.abs(rotationX) * 0.15;
  const shadowTranslateY = rotationX * 0.3;

  const renderFallbackFace = (label) => {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100/90 via-white/50 to-gray-200/90 backdrop-blur-md flex flex-col items-center justify-center border border-gray-300/30 shadow-inner p-4 rounded-xl overflow-hidden select-none">
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        {/* Specular Glare */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-white/60 pointer-events-none" />
        <img 
          src={images[0]} 
          alt="" 
          className="w-[120%] h-[120%] object-contain opacity-[0.08] blur-md absolute pointer-events-none"
        />
        <div className="relative z-10 flex flex-col items-center gap-1 text-gray-400">
          <Layers size={20} className="stroke-[1.5] text-gray-300 animate-pulse" />
          <span className="text-[9px] font-black tracking-widest uppercase text-gray-400">{label}</span>
          <span className="text-[7px] text-gray-400/80 tracking-normal font-medium">{product?.brand || "Premium Quality"}</span>
        </div>
      </div>
    );
  };

  const viewerContent = (
    <div 
      className={`relative select-none flex flex-col items-center justify-center bg-white overflow-hidden transition-all duration-300 ${
        isFullscreen ? "w-full h-full max-h-[85vh] p-8" : "w-full h-full p-6"
      }`}
    >
      {/* 3D Scene Viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className="w-full flex-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        {images.length >= 30 ? (
          // Sequence Viewer
          <div 
            className="w-[85%] h-[80%] flex items-center justify-center transition-transform duration-200 ease-out"
            style={{ transform: `scale(${scale})` }}
          >
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Frame ${i + 1}`}
                className="w-full h-full object-contain pointer-events-none"
                style={{ display: i === frameIndex ? "block" : "none" }}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
        ) : (
          // Premium CSS 3D Volumetric Prism
          <div 
            className="w-[280px] h-[280px] relative transition-transform duration-100 ease-out flex items-center justify-center"
            style={{ 
              transformStyle: "preserve-3d",
              transform: `scale(${scale}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
              width: `${width}px`,
              height: `${height}px`
            }}
          >
            {/* Front Face */}
            <div 
              className="absolute w-[280px] h-[280px] bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-md overflow-hidden"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: `translateZ(${depth / 2}px)`,
                left: 0,
                top: 0
              }}
            >
              <img 
                src={images[0]} 
                alt="Front View" 
                className="w-full h-full object-contain pointer-events-none p-4"
              />
              {/* Dynamic glare */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
                style={{
                  background: `linear-gradient(${135 - rotationY}deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 65%)`
                }}
              />
              
              {/* Pulsing Hotspots */}
              {showHotspots && hotspots.map((hotspot) => (
                <div 
                  key={hotspot.id}
                  className="absolute group z-30"
                  style={{ top: hotspot.top, left: hotspot.left }}
                >
                  <div className="relative w-4 h-4 -translate-x-1/2 -translate-y-1/2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                    <span className="relative flex rounded-full h-4 w-4 bg-cyan-500 border border-white items-center justify-center cursor-pointer shadow-md">
                      <span className="text-[9px] text-white font-bold font-sans">+</span>
                    </span>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-40 p-2 bg-black/80 backdrop-blur-md text-white text-[9px] rounded-lg shadow-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      <div className="font-bold text-cyan-400 mb-0.5">{hotspot.title}</div>
                      <div className="text-gray-200 leading-tight">{hotspot.content}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back Face */}
            <div 
              className="absolute w-[280px] h-[280px] bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-md overflow-hidden"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: `translateZ(${-depth / 2}px) rotateY(180deg)`,
                left: 0,
                top: 0
              }}
            >
              <img 
                src={images[1] || images[0]} 
                alt="Back View" 
                className="w-full h-full object-contain pointer-events-none p-4"
              />
              {/* Dynamic glare */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
                style={{
                  background: `linear-gradient(${135 - rotationY - 180}deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 65%)`
                }}
              />
            </div>

            {/* Left Face */}
            <div 
              className="absolute rounded-xl overflow-hidden"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                width: `${depth}px`,
                height: `${height}px`,
                left: `${(width - depth) / 2}px`,
                top: 0,
                transform: `translateX(${-width / 2}px) rotateY(-90deg)`
              }}
            >
              {images[2] ? (
                <div className="w-full h-full bg-white flex items-center justify-center border border-gray-100 p-2 shadow-inner">
                  <img src={images[2]} alt="Left Side View" className="w-full h-full object-contain pointer-events-none" />
                </div>
              ) : renderFallbackFace("Left Side")}
            </div>

            {/* Right Face */}
            <div 
              className="absolute rounded-xl overflow-hidden"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                width: `${depth}px`,
                height: `${height}px`,
                left: `${(width - depth) / 2}px`,
                top: 0,
                transform: `translateX(${width / 2}px) rotateY(90deg)`
              }}
            >
              {images[3] ? (
                <div className="w-full h-full bg-white flex items-center justify-center border border-gray-100 p-2 shadow-inner">
                  <img src={images[3]} alt="Right Side View" className="w-full h-full object-contain pointer-events-none" />
                </div>
              ) : renderFallbackFace("Right Side")}
            </div>

            {/* Top Face */}
            <div 
              className="absolute rounded-xl overflow-hidden"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                width: `${width}px`,
                height: `${depth}px`,
                left: 0,
                top: `${(height - depth) / 2}px`,
                transform: `translateY(${-height / 2}px) rotateX(90deg)`
              }}
            >
              {images[4] ? (
                <div className="w-full h-full bg-white flex items-center justify-center border border-gray-100 p-2 shadow-inner">
                  <img src={images[4]} alt="Top View" className="w-full h-full object-contain pointer-events-none" />
                </div>
              ) : renderFallbackFace("Top View")}
            </div>

            {/* Bottom Face */}
            <div 
              className="absolute rounded-xl overflow-hidden"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                width: `${width}px`,
                height: `${depth}px`,
                left: 0,
                top: `${(height - depth) / 2}px`,
                transform: `translateY(${height / 2}px) rotateX(-90deg)`
              }}
            >
              {images[5] ? (
                <div className="w-full h-full bg-white flex items-center justify-center border border-gray-100 p-2 shadow-inner">
                  <img src={images[5]} alt="Bottom View" className="w-full h-full object-contain pointer-events-none" />
                </div>
              ) : renderFallbackFace("Bottom View")}
            </div>
          </div>
        )}

        {/* Dynamic 3D floor shadow underneath the object */}
        {images.length < 30 && (
          <div 
            className="absolute bottom-8 w-[240px] h-3 bg-gradient-to-r from-transparent via-black/25 to-transparent blur-[4px] rounded-full transition-all duration-100 ease-out pointer-events-none"
            style={{
              transform: `translateX(${shadowTranslateY * -1}px) scaleX(${shadowScaleX}) scaleY(${1 + Math.abs(rotationX) * 0.01})`,
              opacity: shadowOpacity,
              filter: `blur(${shadowBlur}px)`
            }}
          />
        )}
      </div>

      {/* Floating Glassmorphic Controls Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/75 backdrop-blur-md border border-white/10 rounded-full shadow-2xl z-30 select-none transition-all">
        <button 
          onClick={() => setIsAutoRotating(!isAutoRotating)} 
          className="p-2 hover:bg-white/10 active:scale-95 text-white rounded-full transition-all"
          title={isAutoRotating ? "Pause Auto-rotate" : "Auto-rotate"}
        >
          {isAutoRotating ? <Pause size={14} className="text-cyan-400" /> : <Play size={14} />}
        </button>
        <button 
          onClick={() => setScale(s => Math.min(1.6, s + 0.15))} 
          className="p-2 hover:bg-white/10 active:scale-95 text-white rounded-full transition-all"
          title="Zoom In"
        >
          <Plus size={14} />
        </button>
        <button 
          onClick={() => setScale(s => Math.max(0.8, s - 0.15))} 
          className="p-2 hover:bg-white/10 active:scale-95 text-white rounded-full transition-all"
          title="Zoom Out"
        >
          <Minus size={14} />
        </button>
        {images.length < 30 && (
          <button 
            onClick={() => setShowHotspots(!showHotspots)} 
            className="p-2 hover:bg-white/10 active:scale-95 text-white rounded-full transition-all"
            title="Toggle Specs"
          >
            <Sparkles size={14} className={showHotspots ? "text-cyan-400" : "text-white"} />
          </button>
        )}
        <button 
          onClick={() => {
            setRotationY(0);
            setRotationX(0);
            setScale(1.0);
            setIsAutoRotating(false);
          }} 
          className="p-2 hover:bg-white/10 active:scale-95 text-white rounded-full transition-all"
          title="Reset Camera"
        >
          <RotateCcw size={14} />
        </button>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)} 
          className="p-2 hover:bg-white/10 active:scale-95 text-white rounded-full transition-all"
          title={isFullscreen ? "Close Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <X size={14} className="text-red-400" /> : <Maximize size={14} />}
        </button>
      </div>

      {/* Floating User Helper Badge */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[7px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase pointer-events-none flex items-center gap-1 shadow-md border border-white/5">
        <RefreshCw size={8} className="animate-spin-slow text-cyan-400" />
        DRAG MOUSE OR TOUCH TO ORBIT
      </div>
    </div>
  );

  return (
    <>
      {viewerContent}

      {/* Fullscreen Portal Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-5xl h-full max-h-[85vh] bg-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            {viewerContent}
          </div>
        </div>
      )}
    </>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const product = useSelector((state) => state.product?.productDetails);
  const { loading, productReviews } = useSelector((state) => state.product);
  const { wishlistItems } = useSelector((state) => state.wishlist || { wishlistItems: [] });

  const mediaItems = [];
  if (product?.images && Array.isArray(product.images)) {
    product.images.forEach((img, idx) => {
      mediaItems.push({ type: "image", url: img.url, index: idx });
    });
  }
  if (product?.video && product.video.url) {
    mediaItems.push({ type: "video", url: product.video.url });
  }

  // 360-degree rotation view sequence
  let threeSixtyImages = [];
  if (product?.three_sixty_images && Array.isArray(product.three_sixty_images) && product.three_sixty_images.length > 0) {
    threeSixtyImages = product.three_sixty_images;
  } else if (product?.images && Array.isArray(product.images) && product.images.length > 1) {
    threeSixtyImages = product.images.map(img => img.url);
  } else {
    // If no multi-image gallery is available, fallback to the demo Vivo sequence
    threeSixtyImages = Array.from({ length: 60 }, (_, i) => 
      `https://scaleflex.cloudimg.io/v7/demo/vivo-mobile/product-${i + 1}.jpg?width=600`
    );
  }

  if (threeSixtyImages.length > 1) {
    mediaItems.push({ type: "360", images: threeSixtyImages });
  }

  const getYoutubeThumbnail = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    return null;
  };

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColorState, setSelectedColorState] = useState("");
  const [selectedVariantState, setSelectedVariantState] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState("Showcase");
  const [productVariants, setProductVariants] = useState([]);
  
  // Lightbox Modal States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  const isMobile = product?.category === "Mobiles";
  const isFashion = product?.category === "Fashion";
  const mobileNameInfo = isMobile ? parseMobileName(product.name) : null;
  const mobileSpecs = isMobile ? parseMobileSpecs(product.description) : null;
  const activeColor = selectedColorState || mobileNameInfo?.color || "Gravity Black";
  const activeVariant = selectedVariantState || mobileNameInfo?.variant || "64 GB + 4 GB";

  // Fashion color derived from product name parentheses
  const fashionColorFromName = parseFashionColor(product?.name || "");
  const activeFashionColor = selectedColorState || fashionColorFromName || "";

  // Sibling variants parsing
  const allSiblings = productVariants.length > 0 ? productVariants : [product];

  const uniqueColors = isMobile
    ? allSiblings.reduce((acc, p) => {
        const parsed = parseMobileName(p?.name);
        if (parsed?.color) {
          const colorName = parsed.color.trim();
          if (!acc.some(c => c.toLowerCase() === colorName.toLowerCase())) {
            acc.push(colorName);
          }
        }
        return acc;
      }, [])
    : [];

  // Fashion sibling colours
  const uniqueFashionColors = isFashion
    ? allSiblings.reduce((acc, p) => {
        const color = parseFashionColor(p?.name);
        if (color && !acc.some(c => c.toLowerCase() === color.toLowerCase())) {
          acc.push(color);
        }
        return acc;
      }, [])
    : [];

  const uniqueVariants = isMobile
    ? allSiblings.reduce((acc, p) => {
        const parsed = parseMobileName(p?.name);
        if (parsed?.variant) {
          const variantSize = parsed.variant.trim();
          if (!acc.some(v => v.toLowerCase() === variantSize.toLowerCase())) {
            acc.push(variantSize);
          }
        }
        return acc;
      }, [])
    : [];

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedSize, setSelectedSize] = useState("");
  // Premium zoom lens + double-click zoom state
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [showLens, setShowLens] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);     // double-click toggle
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const imgContainerRef = useRef(null);
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [highlightsExpanded, setHighlightsExpanded] = useState(true);
  const [allDetailsExpanded, setAllDetailsExpanded] = useState(false);

  const [slaTime, setSlaTime] = useState("");
  const [checkedBundleItems, setCheckedBundleItems] = useState([true, true, true]);

  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recentlyViewed, setRecentlyViewed]         = useState([]);   // 24h viewed products
  const [loadingRecent, setLoadingRecent]           = useState(false);
  const [exploreMore, setExploreMore]               = useState([]);   // all same-category
  const [loadingExplore, setLoadingExplore]         = useState(false);
  const [exploreVisible, setExploreVisible]         = useState(8);    // pagination

  // Live SLA Countdown Estimator for Express delivery
  useEffect(() => {
    const updateSlaTimer = () => {
      const now = new Date();
      const cutoffHour = 18; // 6:00 PM shipping cutoff
      let target = new Date();
      target.setHours(cutoffHour, 0, 0, 0);
      if (now.getHours() >= cutoffHour) {
        target.setDate(target.getDate() + 1);
      }
      const diffMs = target - now;
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setSlaTime(`${hours}h ${minutes}m ${seconds}s`);
    };
    updateSlaTimer();
    const timer = setInterval(updateSlaTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      dispatch(fetchAllProductDetails(id));
      setSelectedImage(0);
      setSelectedSize("");
      setPincode("");
      setPincodeChecked(false);
      setSelectedColorState("");
      setSelectedVariantState("");
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!loading && product) {
      window.scrollTo(0, 0);
    }
  }, [loading, product]);

  useEffect(() => {
    if (product?.category) {
      trackCategoryView(product.category);
    }
  }, [product]);

  useEffect(() => {
    if (product && (product.category === "Mobiles" || product.category === "Fashion")) {
      const baseModelName = product.name.split("(")[0].trim();
      if (baseModelName) {
        axiosInstance
          .get(`/product?search=${encodeURIComponent(baseModelName)}&limit=100`)
          .then((res) => {
            if (res.data?.products) {
              const filtered = res.data.products.filter(p =>
                p.category === product.category &&
                p.name.toLowerCase().startsWith(baseModelName.toLowerCase())
              );
              setProductVariants(filtered);
            }
          })
          .catch((err) => {
            console.error("Failed to fetch product variants", err);
          });
      }
    } else {
      setProductVariants([]);
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      try {
        const saved   = localStorage.getItem("recently_viewed") || "[]";
        const tsStore = JSON.parse(localStorage.getItem("recently_viewed_ts") || "{}");
        let parsed    = JSON.parse(saved);
        const prodId  = product.id || product._id;
        const now     = Date.now();
        if (prodId) {
          // Save timestamp for this visit
          tsStore[prodId] = now;
          parsed = parsed.filter((itemId) => itemId !== prodId);
          parsed.unshift(prodId);
          // Keep only last 20
          const trimmed = parsed.slice(0, 20);
          localStorage.setItem("recently_viewed",    JSON.stringify(trimmed));
          localStorage.setItem("recently_viewed_ts", JSON.stringify(tsStore));
          axiosInstance
            .post("/campaigns/browse", { productId: prodId, category: product.category })
            .catch((err) => console.log("Browse history log failed:", err.message));
        }
      } catch (e) {
        console.error("Failed to update recently viewed products", e);
      }
    }
  }, [product]);

  // ══════════════════════════════════════════════════════════════
  // 1. AI SIMILAR PRODUCTS
  //    Rule: SAME CATEGORY is MANDATORY. Then rank by keyword match.
  //    This prevents food showing when user views shoes.
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const currentProdId = product?.id || product?._id;
    if (currentProdId) {
      setLoadingSuggestions(true);
      const startTime = Date.now();
      axiosInstance
        .get(`/product/similar/${currentProdId}`)
        .then((res) => {
          if (res.data?.success) {
            const elapsed = Date.now() - startTime;
            const delay = Math.max(0, 1500 - elapsed);
            setTimeout(() => {
              setSuggestedProducts(res.data.products || []);
            }, delay);
          }
        })
        .catch((err) => {
          console.error("Failed to load similar products", err);
        })
        .finally(() => {
          const elapsed = Date.now() - startTime;
          const delay = Math.max(0, 1500 - elapsed);
          setTimeout(() => {
            setLoadingSuggestions(false);
          }, delay);
        });
    }
  }, [product]);

  // ══════════════════════════════════════════════════════════════
  // 2. RECENTLY VIEWED (last 24 hours from localStorage)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const currentProdId = product?.id || product?._id;
    try {
      const savedIds = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
      const tsStore  = JSON.parse(localStorage.getItem("recently_viewed_ts") || "{}");
      const cutoff   = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

      // Filter: viewed in last 24h, not current product
      const recentIds = savedIds.filter(
        (pid) => pid !== currentProdId && (tsStore[pid] || 0) >= cutoff
      ).slice(0, 10);

      if (recentIds.length === 0) { setRecentlyViewed([]); return; }

      setLoadingRecent(true);
      axiosInstance
        .get("/product?limit=200")
        .then((res) => {
          const all = res.data.products || [];
          const viewed = recentIds
            .map((pid) => all.find((p) => (p.id || p._id) === pid))
            .filter(Boolean);
          setRecentlyViewed(viewed);
        })
        .catch((err) => console.error("Recently viewed load failed", err))
        .finally(() => setLoadingRecent(false));
    } catch (e) {
      console.error("Recently viewed parse error", e);
    }
  }, [product]);

  // ══════════════════════════════════════════════════════════════
  // 3. EXPLORE MORE LIKE THIS (all same-category, AI sorted)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (product && product.category) {
      const currentProdId = product.id || product._id;
      const currentCat   = (product.category || "").toLowerCase().trim();
      setLoadingExplore(true);
      axiosInstance
        .get("/product?limit=200")
        .then((res) => {
          const all = res.data.products || [];
          // All same-category except current, sorted by rating desc
          const explore = all
            .filter(
              (p) =>
                (p.category || "").toLowerCase().trim() === currentCat &&
                (p.id || p._id) !== currentProdId
            )
            .sort((a, b) => (Number(b.ratings) || 0) - (Number(a.ratings) || 0));
          setExploreMore(explore);
        })
        .catch((err) => console.error("Explore more load failed", err))
        .finally(() => setLoadingExplore(false));
    }
  }, [product]);

  const isWishlisted = wishlistItems?.some(
    (item) => (item.id || item._id) === (product?.id || product?._id)
  );

  // Lens follow — works during normal hover AND during zoomed state
  const handleMouseMove = useCallback((e) => {
    if (!imgContainerRef.current) return;
    const { left, top, width, height } = imgContainerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - left) / width) * 100, 0), 100);
    const y = Math.min(Math.max(((e.clientY - top) / height) * 100, 0), 100);
    setLensPos({ x, y });
  }, []);

  // Double-click: toggle zoom in/out
  const handleDoubleClick = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  // Native Web Share API with copy fallback
  const handleShare = async () => {
    const url  = window.location.href;
    const text = `Check out ${product?.name} on Balaji Mart!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, text, url });
        return;
      } catch { /* user cancelled */ }
    }
    // Fallback: show share modal
    setShowShareModal(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddCart = () => {
    if (!product) return;
    dispatch(addToCart({ product: { ...product, id: product._id || product.id }, quantity }));
    toast.success("Added to Cart!");
    dispatch(toggleCart());
  };

  const handlePincodeCheck = () => {
    if (pincode.length === 6) {
      setPincodeChecked(true);
      toast.success(`Delivery available to ${pincode}!`);
    } else {
      toast.error("Please enter a valid 6-digit pincode.");
    }
  };

  // Determine if this product category uses sizes
  const isShoe = isShoeProduct(product);
  const applicableSizes =
    isShoe
      ? getShoeSizes(product)
      : (product?.category === "Fashion"
        ? SIZES.Fashion
        : null);

  const discountedOriginal =
    product?.discount_percentage > 0
      ? Number(
          product.original_price ||
            Number(product.price) / (1 - product.discount_percentage / 100)
        ).toFixed(2)
      : null;

  if (loading) return <Loader />;
  if (!product)
    return (
      <div className="h-screen flex items-center justify-center text-[var(--text)] bg-[var(--bg)] font-black uppercase tracking-widest">
        Product Not Found
      </div>
    );

  const visibleOffers = showAllOffers ? OFFERS : OFFERS.slice(0, 2);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--primary)]/30">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/15 blur-[130px] rounded-full pointer-events-none" />
      </div>

      {/* BREADCRUMB NAV */}
      <style>{`
        @keyframes scanEffect {
          0% { top: 0%; opacity: 0.2; }
          50% { top: 100%; opacity: 0.95; }
          100% { top: 0%; opacity: 0.2; }
        }
      `}</style>
      <nav className="fixed top-16 left-0 right-0 z-40 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)] px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold hover:text-[var(--primary)] transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="hidden md:flex gap-2 text-[9px] uppercase tracking-[0.2em] opacity-50 font-black">
            <span>Home</span> <span>/</span> <span>{product.category}</span> <span>/</span>{" "}
            <span className="text-[var(--text)] max-w-[200px] truncate">{product.name}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-32 pb-20">
        {/* ─── TOP SECTION: IMAGE + INFO ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">

          {/* ══════════════════════════════════════════════
              LEFT: ULTRA PREMIUM IMAGE GALLERY
              Amazon/Flipkart style — vertical thumbnails
              + white bg main image + magnifier lens zoom
              ══════════════════════════════════════════════ */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
            <div className="flex gap-3">

              {/* ── VERTICAL THUMBNAIL STRIP (Amazon style left side) ── */}
              <div className="hidden md:flex flex-col gap-2 w-[72px] shrink-0">
                {mediaItems.map((item, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-[72px] h-[72px] rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white shrink-0 ${
                      selectedImage === i
                        ? "border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20 ring-1 ring-[var(--primary)]/30"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                    }`}
                  >
                    {item.type === "360" ? (
                      <div className="w-full h-full relative bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:text-[var(--primary)] transition-colors gap-0.5">
                        <RefreshCw size={20} className="text-gray-400" />
                        <span className="text-[8px] font-black tracking-wider uppercase leading-none">360° View</span>
                      </div>
                    ) : item.type === "video" ? (
                      <div className="w-full h-full relative bg-black">
                        <img
                          src={getYoutubeThumbnail(item.url) || "/no-image.png"}
                          alt="Video thumbnail"
                          className="w-full h-full object-contain opacity-70"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md">
                            <Play size={14} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`View ${i + 1}`}
                        className="w-full h-full object-contain p-1.5"
                        loading="lazy"
                      />
                    )}
                    {selectedImage === i && (
                      <div className="absolute inset-0 border-2 border-[var(--primary)] rounded-lg pointer-events-none" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* ── MAIN IMAGE AREA ── */}
              <div className="flex-1 flex flex-col gap-3">

                {/* Main large image container */}
                <div
                  ref={imgContainerRef}
                  className={`relative w-full rounded-2xl overflow-hidden bg-white border shadow-xl select-none transition-all duration-300 ${
                    isZoomed && mediaItems[selectedImage]?.type === "image"
                      ? "border-[var(--primary)] shadow-[var(--primary)]/20 cursor-zoom-out"
                      : mediaItems[selectedImage]?.type === "image" ? "border-[var(--border)] cursor-zoom-in" : "border-[var(--border)]"
                  }`}
                  style={{ aspectRatio: "1 / 1" }}
                  onMouseMove={mediaItems[selectedImage]?.type === "image" ? handleMouseMove : undefined}
                  onMouseEnter={mediaItems[selectedImage]?.type === "image" ? () => setShowLens(true) : undefined}
                  onMouseLeave={mediaItems[selectedImage]?.type === "image" ? () => { setShowLens(false); } : undefined}
                  onDoubleClick={mediaItems[selectedImage]?.type === "image" ? handleDoubleClick : undefined}
                >
                  {mediaItems[selectedImage]?.type === "360" ? (
                    <ThreeSixtyViewer images={mediaItems[selectedImage].images} product={product} />
                  ) : mediaItems[selectedImage]?.type === "video" ? (
                    <div className="w-full h-full bg-black">
                      <iframe
                        src={mediaItems[selectedImage].url}
                        title="Product Video"
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    /* Main product image — zooms on double-click, lens tracks cursor */
                    <motion.img
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{
                        opacity: 1,
                        scale: isZoomed ? 2.2 : 1,
                        x: isZoomed ? `${-(lensPos.x - 50) * 0.9}%` : "0%",
                        y: isZoomed ? `${-(lensPos.y - 50) * 0.9}%` : "0%",
                      }}
                      transition={{ duration: isZoomed ? 0.15 : 0.35, ease: "easeOut" }}
                      src={mediaItems[selectedImage]?.url || "/no-image.png"}
                      alt={product.name}
                      className="w-full h-full object-contain p-6 pointer-events-none"
                      draggable={false}
                    />
                  )}

                  {/* AI Scan Laser Line */}
                  {loadingSuggestions && (
                    <div 
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-90 shadow-[0_0_15px_var(--primary)] z-10 pointer-events-none"
                      style={{
                        animation: "scanEffect 2.5s linear infinite"
                      }}
                    />
                  )}

                  {/* ── Lens circle — visible on hover (NOT zoomed) ── */}
                  {showLens && !isZoomed && mediaItems[selectedImage]?.type === "image" && (
                    <>
                      <div
                        className="absolute pointer-events-none border-2 border-[var(--primary)]/70 bg-[var(--primary)]/10 rounded-full z-20"
                        style={{
                          width: 90,
                          height: 90,
                          left: `calc(${lensPos.x}% - 45px)`,
                          top: `calc(${lensPos.y}% - 45px)`,
                          boxShadow: "0 0 0 1px rgba(255,255,255,0.6), 0 4px 18px rgba(0,0,0,0.12)",
                          transition: "left 0.05s, top 0.05s",
                        }}
                      />
                      {/* Side zoom preview panel (xl only) */}
                      <div
                        className="absolute right-[-108%] top-0 z-30 bg-white rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden hidden xl:block pointer-events-none"
                        style={{ width: "100%", height: "100%" }}
                      >
                        <img
                          src={mediaItems[selectedImage]?.url || "/no-image.png"}
                          alt="Zoomed preview"
                          className="absolute object-contain pointer-events-none"
                          style={{
                            width: "300%",
                            height: "300%",
                            left: `${-(lensPos.x) * 2}%`,
                            top: `${-(lensPos.y) * 2}%`,
                            transform: "translate(33.33%, 33.33%)",
                          }}
                          draggable={false}
                        />
                        <div className="absolute top-3 right-3 bg-black/10 text-[8px] font-black px-2 py-1 rounded-full tracking-widest flex items-center gap-1 text-gray-600">
                          <ZoomIn size={9} /> ZOOM
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Zoom mode: crosshair lens that follows cursor ── */}
                  {isZoomed && showLens && mediaItems[selectedImage]?.type === "image" && (
                    <div
                      className="absolute pointer-events-none border border-white/60 rounded-full z-20"
                      style={{
                        width: 70,
                        height: 70,
                        left: `calc(${lensPos.x}% - 35px)`,
                        top: `calc(${lensPos.y}% - 35px)`,
                        background: "rgba(255,255,255,0.08)",
                        boxShadow: "0 0 0 2px var(--primary), 0 0 20px rgba(0,0,0,0.2)",
                        transition: "left 0.04s, top 0.04s",
                      }}
                    />
                  )}

                  {/* ── Zoom toggle hint badge ── */}
                  <AnimatePresence>
                    {!isZoomed && mediaItems[selectedImage]?.type === "image" && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: showLens ? 0 : 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                      >
                        <span className="bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold px-3 py-1.5 rounded-full tracking-wider flex items-center gap-1 whitespace-nowrap">
                          <ZoomIn size={9} /> Double-click to zoom
                        </span>
                      </motion.div>
                    )}
                    {isZoomed && mediaItems[selectedImage]?.type === "image" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                      >
                        <span className="bg-[var(--primary)] text-white text-[8px] font-black px-3 py-1.5 rounded-full tracking-wider flex items-center gap-1 shadow-lg whitespace-nowrap">
                          <ZoomIn size={9} /> Zoomed — Double-click to exit
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── TOP LEFT: Bestseller ribbon ── */}
                  {!isZoomed && product.ratings >= 4.5 && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full tracking-widest shadow-lg flex items-center gap-1">
                        <Zap size={9} fill="currentColor" /> BESTSELLER
                      </div>
                    </div>
                  )}

                  {/* ── TOP RIGHT: Discount ribbon ── */}
                  {!isZoomed && product.discount_percentage > 0 && (
                    <div className="absolute top-0 right-0 z-10">
                      <div className="bg-green-600 text-white font-black text-[11px] px-3 py-1.5 leading-none tracking-wide rounded-bl-xl rounded-tr-2xl shadow-md">
                        -{product.discount_percentage}%
                      </div>
                    </div>
                  )}

                  {/* ── Image/Media counter badge ── */}
                  {!isZoomed && mediaItems.length > 1 && mediaItems[selectedImage]?.type !== "360" && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-wider">
                        {selectedImage + 1} / {mediaItems.length}
                      </span>
                    </div>
                  )}

                  {/* ── Wishlist FAB ── */}
                  {!isZoomed && (
                    <motion.button
                      onClick={() => dispatch(toggleWishlist(product))}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 ${
                        isWishlisted
                          ? "bg-red-500 border-red-500 text-white shadow-red-500/30"
                          : "bg-white border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500"
                      }`}
                    >
                      <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2} />
                    </motion.button>
                  )}

                  {/* ── Prev/Next arrows ── */}
                  {!isZoomed && mediaItems.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((prev) => Math.max(0, prev - 1))}
                        disabled={selectedImage === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center shadow-md text-gray-600 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => Math.min((mediaItems.length || 1) - 1, prev + 1))}
                        disabled={selectedImage === (mediaItems.length || 1) - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center shadow-md text-gray-600 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </button>
                    </>
                  )}
                </div>

                {/* ── HORIZONTAL thumbnail strip for mobile ── */}
                <div className="flex md:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {mediaItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`min-w-[60px] h-[60px] rounded-lg overflow-hidden border-2 transition-all bg-white shrink-0 ${
                        selectedImage === i
                          ? "border-[var(--primary)] shadow-md"
                          : "border-[var(--border)] opacity-50 hover:opacity-80"
                      }`}
                    >
                      {item.type === "360" ? (
                        <div className="w-full h-full relative bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:text-[var(--primary)] transition-colors gap-0.5">
                          <RefreshCw size={18} className="text-gray-400" />
                          <span className="text-[7px] font-black tracking-wider uppercase leading-none">360°</span>
                        </div>
                      ) : item.type === "video" ? (
                        <div className="w-full h-full relative bg-black">
                          <img
                            src={getYoutubeThumbnail(item.url) || "/no-image.png"}
                            alt="Video thumbnail"
                            className="w-full h-full object-contain opacity-70"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md">
                              <Play size={10} fill="currentColor" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img src={item.url} className="w-full h-full object-contain p-1" alt="" />
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Share + Wishlist row ── */}
                <div className="flex gap-2">
                  {/* PREMIUM SHARE BUTTON */}
                  <motion.button
                    onClick={handleShare}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-500/60 transition-all"
                  >
                    <Share2 size={13} />
                    Share
                  </motion.button>
                  <motion.button
                    onClick={copyLink}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                  >
                    {copied ? <Check size={13} className="text-green-500" /> : <Link2 size={13} />}
                    {copied ? "Copied!" : "Copy Link"}
                  </motion.button>
                  <motion.button
                    onClick={() => dispatch(toggleWishlist(product))}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isWishlisted
                        ? "border-red-400 text-red-500 bg-red-500/5"
                        : "border-[var(--border)] hover:border-red-400 hover:text-red-500"
                    }`}
                  >
                    <Heart size={13} fill={isWishlisted ? "currentColor" : "none"} />
                    {isWishlisted ? "Saved" : "Wishlist"}
                  </motion.button>
                </div>

                {/* ── Full View Button ── */}
                <motion.button
                  onClick={() => {
                    if (mediaItems[selectedImage]?.type === "image") {
                      setIsLightboxOpen(true);
                      setLightboxImageIndex(selectedImage);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all border border-[var(--primary)]/40"
                >
                  <Maximize size={13} />
                  Full View
                </motion.button>

                {/* ── Share Modal (fallback for non-native-share browsers) ── */}
                <AnimatePresence>
                  {showShareModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                      onClick={() => setShowShareModal(false)}
                    >
                      <motion.div
                        initial={{ y: 60, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 22, stiffness: 280 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-5 shadow-2xl"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-0.5">Share This Product</p>
                            <p className="text-sm font-bold text-[var(--text)] line-clamp-1">{product?.name}</p>
                          </div>
                          <button onClick={() => setShowShareModal(false)} className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center hover:bg-[var(--primary)]/20 transition-all">
                            <X size={14} className="text-[var(--text)]" />
                          </button>
                        </div>

                        {/* Social share buttons */}
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: "WhatsApp", color: "bg-green-500", href: `https://wa.me/?text=${encodeURIComponent(product?.name + " " + window.location.href)}`, emoji: "💬" },
                            { label: "Telegram", color: "bg-blue-500", href: `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product?.name)}`, emoji: "✈️" },
                            { label: "Twitter", color: "bg-sky-500", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(product?.name)}&url=${encodeURIComponent(window.location.href)}`, emoji: "🐦" },
                            { label: "Facebook", color: "bg-blue-700", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, emoji: "👍" },
                          ].map((s) => (
                            <a
                              key={s.label}
                              href={s.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setShowShareModal(false)}
                              className="flex flex-col items-center gap-1.5 group"
                            >
                              <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}>
                                {s.emoji}
                              </div>
                              <span className="text-[9px] font-bold text-[var(--text)]/60">{s.label}</span>
                            </a>
                          ))}
                        </div>

                        {/* Copy link row */}
                        <div className="flex gap-2 items-center bg-[var(--primary)]/5 border border-[var(--border)] rounded-xl px-3 py-2">
                          <Link2 size={13} className="text-[var(--primary)] shrink-0" />
                          <span className="text-[10px] text-[var(--text)]/60 font-medium flex-1 truncate">{window.location.href}</span>
                          <button
                            onClick={copyLink}
                            className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                              copied ? "bg-green-500 text-white" : "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                            }`}
                          >
                            {copied ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>

          {/* ── RIGHT: PRODUCT DETAILS (Flipkart-style) ── */}
          <div className="lg:col-span-7 flex flex-col gap-0">

            {/* Product Title & Rating */}
            <div className="pb-4 border-b border-[var(--border)]">
              <span className="text-[var(--primary)] font-black tracking-[0.35em] uppercase text-[9px] mb-2 block">
                Ref: {product.id?.slice(-6) || "BALAJIMART"}
              </span>
              <h1 className="text-2xl lg:text-3xl font-black leading-tight tracking-tight text-[var(--text)] mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center bg-green-700 text-white px-2.5 py-0.5 rounded-md gap-1.5">
                  <span className="font-black text-sm leading-none">{Number(product.ratings || 0).toFixed(1)}</span>
                  <Star size={12} fill="currentColor" />
                </div>
                <span className="text-xs font-bold opacity-50">
                  {productReviews?.length || 0} Ratings & Reviews
                </span>
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                    product.stock > 0
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  }`}
                >
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="py-4 border-b border-[var(--border)]">
              <div className="flex items-end gap-3 flex-wrap">
                {discountedOriginal && (
                  <span className="text-[var(--primary)] font-black text-xl">
                    {product.discount_percentage}% off
                  </span>
                )}
                <span className="text-4xl font-black text-[var(--text)] tracking-tighter leading-none">
                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </span>
                {discountedOriginal && (
                  <span className="text-base opacity-40 line-through font-bold mb-0.5">
                    ₹{Number(discountedOriginal).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-xs text-green-500 font-bold mt-1">Inclusive of all taxes</p>
            </div>

            {/* ── SELECTED COLOR SELECTOR (Mobiles only) ── */}
            {isMobile && uniqueColors.length > 0 && (
              <div className="py-4 border-b border-[var(--border)]">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--text)]/60 block mb-2">
                  Selected Color: <span className="text-[var(--text)] font-black">{activeColor}</span>
                </span>
                <div className="flex gap-3">
                  {uniqueColors.map((colorName, i) => {
                    const match = allSiblings.find(p => {
                      const parsed = parseMobileName(p.name);
                      return parsed.color.toLowerCase() === colorName.toLowerCase() &&
                             parsed.variant.toLowerCase() === activeVariant.toLowerCase();
                    });
                    
                    const fallbackMatch = match || allSiblings.find(p => 
                      parseMobileName(p.name).color.toLowerCase() === colorName.toLowerCase()
                    );
                    
                    const isAvailable = !!fallbackMatch && fallbackMatch.stock > 0;
                    const isSelected = activeColor.toLowerCase() === colorName.toLowerCase();
                    const targetProduct = fallbackMatch || product;
                    
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const targetId = targetProduct.id || targetProduct._id;
                          if (targetId && targetId !== (product.id || product._id)) {
                            navigate(`/product/${targetId}`);
                          }
                        }}
                        className={`relative w-12.5 h-16 rounded-xl border transition-all duration-300 flex items-center justify-center p-1 overflow-hidden ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/30 scale-105 shadow-md"
                            : "border-[var(--border)] opacity-60 bg-[var(--card)]/40 hover:opacity-85"
                        }`}
                      >
                        <img
                          src={targetProduct.images?.[0]?.url || "/no-image.png"}
                          alt={colorName}
                          className="w-full h-full object-contain rounded-lg"
                        />
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-0.5">
                            <span className="text-[6px] font-black text-rose-500 uppercase tracking-widest text-center leading-tight">Out of stock</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SELECTED COLOR SELECTOR (Fashion only) ── */}
            {isFashion && uniqueFashionColors.length > 1 && (
              <div className="py-4 border-b border-[var(--border)]">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--text)]/60 block mb-3">
                  Selected Color: <span className="text-[var(--text)] font-black">{activeFashionColor}</span>
                </span>
                <div className="flex flex-wrap gap-3">
                  {uniqueFashionColors.map((colorName, i) => {
                    const targetProduct =
                      allSiblings.find(p =>
                        parseFashionColor(p?.name)?.toLowerCase() === colorName.toLowerCase()
                      ) || product;

                    const isAvailable = (targetProduct?.stock ?? 0) > 0;
                    const isSelected =
                      activeFashionColor.toLowerCase() === colorName.toLowerCase();

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const targetId = targetProduct.id || targetProduct._id;
                          if (targetId && targetId !== (product.id || product._id)) {
                            navigate(`/product/${targetId}`);
                          }
                        }}
                        title={colorName}
                        className={`relative w-[50px] h-[64px] rounded-xl border transition-all duration-300 flex flex-col items-center justify-center p-1 overflow-hidden ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/30 scale-105 shadow-md"
                            : "border-[var(--border)] opacity-60 bg-[var(--card)]/40 hover:opacity-90 hover:border-[var(--primary)]/50"
                        }`}
                      >
                        {/* Product thumbnail */}
                        <img
                          src={targetProduct?.images?.[0]?.url || "/no-image.png"}
                          alt={colorName}
                          className="w-full h-[48px] object-contain rounded-lg flex-1"
                        />
                        {/* Colour name chip at bottom */}
                        <span className="absolute bottom-0 inset-x-0 text-[6.5px] font-black text-center bg-black/65 text-white py-[2px] truncate px-0.5 rounded-b-xl leading-tight">
                          {colorName}
                        </span>
                        {/* Selected check ring */}
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-3 h-3 bg-[var(--primary)] rounded-full border border-white flex items-center justify-center shadow">
                            <Check size={7} className="text-white stroke-[3]" />
                          </span>
                        )}
                        {/* Out of stock overlay */}
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-0.5 rounded-xl">
                            <span className="text-[6px] font-black text-rose-500 uppercase tracking-widest text-center leading-tight">
                              Out of
                              <br />stock
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── VARIANT SELECTOR (Mobiles only) ── */}
            {isMobile && uniqueVariants.length > 0 && (
              <div className="py-4 border-b border-[var(--border)]">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--text)]/60 block mb-2">
                  Variant: <span className="text-[var(--text)] font-black">{activeVariant}</span>
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {uniqueVariants.map((variantSize, i) => {
                    const match = allSiblings.find(p => {
                      const parsed = parseMobileName(p.name);
                      return parsed.variant.toLowerCase() === variantSize.toLowerCase() &&
                             parsed.color.toLowerCase() === activeColor.toLowerCase();
                    });
                    
                    const fallbackMatch = match || allSiblings.find(p => 
                      parseMobileName(p.name).variant.toLowerCase() === variantSize.toLowerCase()
                    );
                    
                    const isAvailable = !!fallbackMatch && fallbackMatch.stock > 0;
                    const isSelected = activeVariant.toLowerCase() === variantSize.toLowerCase();
                    const targetProduct = fallbackMatch || product;
                    
                    const itemPrice = targetProduct.price;
                    const itemDiscount = targetProduct.discount_percentage;
                    const itemOriginal = targetProduct.original_price || (itemDiscount > 0 ? (itemPrice / (1 - itemDiscount / 100)) : null);
                    
                    const priceInfo = isAvailable ? (
                      <div className="flex items-center gap-1.5 text-[9px] mt-0.5">
                        {itemDiscount > 0 && (
                          <span className="text-green-500 font-bold">↓{itemDiscount}%</span>
                        )}
                        {itemOriginal && (
                          <span className="line-through opacity-50 font-bold">₹{Math.round(itemOriginal).toLocaleString("en-IN")}</span>
                        )}
                        <span className="text-[var(--text)] font-extrabold">₹{Number(itemPrice || 0).toLocaleString("en-IN")}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] opacity-40 font-medium block mt-0.5">Available in other colours</span>
                    );
                    
                    const desc = isAvailable
                      ? (targetProduct.stock <= 5 ? `${targetProduct.stock} left` : "In stock")
                      : "";
                      
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const targetId = targetProduct.id || targetProduct._id;
                          if (targetId && targetId !== (product.id || product._id)) {
                            navigate(`/product/${targetId}`);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all duration-300 ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/35 shadow-md"
                            : isAvailable
                              ? "border-[var(--border)] opacity-85 hover:border-[var(--primary)] bg-[var(--card)]/20"
                              : "border-[var(--border)]/70 opacity-45 cursor-not-allowed bg-[var(--card)]/10 hover:opacity-60"
                        }`}
                        style={{ minWidth: "145px" }}
                      >
                        <span className="text-xs font-black block text-[var(--text)]">{variantSize}</span>
                        {priceInfo}
                        {desc && (
                          <span className={`text-[8px] font-black block mt-1 uppercase tracking-wider ${targetProduct.stock <= 2 ? "text-rose-500 animate-pulse" : "text-green-500"}`}>
                            {desc}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SIZE SELECTOR (Fashion/Footwear only) ── */}
            {applicableSizes && (
              <div className="py-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black uppercase tracking-wider text-[var(--text)]">
                    Select Size
                  </span>
                  <button className="text-[var(--primary)] text-xs font-bold flex items-center gap-1 hover:underline">
                    Size Chart <ChevronRight size={12} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {applicableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                      className={`w-12 h-12 rounded-full border-2 text-sm font-black transition-all relative ${
                        selectedSize === size
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-md shadow-[var(--primary)]/15"
                          : "border-[var(--border)] hover:border-[var(--primary)]/60 text-[var(--text)]"
                      }`}
                    >
                      {size}
                      {selectedSize === size && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] rounded-full flex items-center justify-center">
                          <Check size={9} className="text-white stroke-[3]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── OFFERS & COUPONS ── */}
            <div className="py-4 border-b border-[var(--border)]">
              <button
                onClick={() => setShowAllOffers(!showAllOffers)}
                className="flex items-center justify-between w-full mb-3 group"
              >
                <span className="text-sm font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                  <Tag size={15} className="text-[var(--primary)]" />
                  Available Offers
                </span>
                <ChevronDown
                  size={15}
                  className={`text-[var(--text)] opacity-50 transition-transform ${showAllOffers ? "rotate-180" : ""}`}
                />
              </button>

              <div className="space-y-2.5">
                {visibleOffers.map((offer, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5 items-start"
                  >
                    {offer.icon}
                    <p className="text-xs text-[var(--text)]/80 leading-snug flex-1">
                      <span className="font-black text-[var(--text)]">{offer.title}: </span>
                      {offer.desc}
                      <button className="ml-1 text-[var(--primary)] font-bold hover:underline text-[10px]">
                        {offer.tag}
                      </button>
                    </p>
                  </motion.div>
                ))}
              </div>

              {OFFERS.length > 2 && (
                <button
                  onClick={() => setShowAllOffers(!showAllOffers)}
                  className="mt-2.5 text-[var(--primary)] text-xs font-black flex items-center gap-1 hover:underline"
                >
                  {showAllOffers ? "Show less" : `+${OFFERS.length - 2} more offers`}
                  <ChevronDown size={12} className={`transition-transform ${showAllOffers ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            {/* ── DELIVERY DETAILS ── */}
            <div className="py-4 border-b border-[var(--border)]">
              <span className="text-sm font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-2 mb-3">
                <Truck size={15} className="text-[var(--primary)]" />
                Delivery Details
              </span>

              {/* Pincode checker */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 border border-[var(--border)] rounded-lg px-3 py-2 flex-1 focus-within:border-[var(--primary)] transition-all">
                  <MapPin size={13} className="text-[var(--text)]/40 shrink-0" />
                  <input
                    type="number"
                    maxLength={6}
                    placeholder="Enter delivery pincode"
                    value={pincode}
                    onChange={(e) => {
                      if (e.target.value.length <= 6) setPincode(e.target.value);
                      setPincodeChecked(false);
                    }}
                    className="bg-transparent border-0 outline-none text-xs font-bold text-[var(--text)] placeholder:text-[var(--text)]/30 w-full"
                  />
                </div>
                <button
                  onClick={handlePincodeCheck}
                  className="px-4 py-2 text-[var(--primary)] border border-[var(--primary)] rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[var(--primary)] hover:text-white transition-all"
                >
                  Check
                </button>
              </div>

              {/* Live SLA Urgency Banner */}
              <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/15 to-orange-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wide block">
                      ⚡ Express Shipping SLA
                    </span>
                    <span className="text-xs font-bold text-[var(--text)]/85">
                      Order within <span className="font-black text-amber-400">{slaTime}</span> for delivery by{" "}
                      <span className="font-black text-green-400">
                        {new Date(Date.now() + (new Date().getHours() >= 18 ? 2 : 1) * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery info rows */}
              <div className="space-y-2.5">
                {[
                  {
                    icon: <Truck size={14} className="text-[var(--primary)] shrink-0" />,
                    label: pincodeChecked
                      ? `Delivery to ${pincode} — by ${new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`
                      : "Express Shipping — 2–3 Working Days",
                    sub: product.price > 500 ? "Free Delivery" : "Delivery charges apply",
                  },
                  {
                    icon: <RefreshCw size={14} className="text-orange-500 shrink-0" />,
                    label: "7 Day Return & Exchange Policy",
                    sub: "Easy pickup and refund",
                  },
                  {
                    icon: <BadgeCheck size={14} className="text-blue-500 shrink-0" />,
                    label: "Fulfilled by Balaji Mart",
                    sub: "Verified & Genuine Product",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {item.icon}
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">{item.label}</p>
                      <p className="text-[10px] text-[var(--text)]/50 font-medium">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── PRODUCT HIGHLIGHTS ── */}
            {isMobile ? (
              <div className="py-4 border-b border-[var(--border)]">
                <button
                  onClick={() => setHighlightsExpanded(!highlightsExpanded)}
                  className="flex items-center justify-between w-full mb-3 group"
                >
                  <span className="text-sm font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                    <Package size={15} className="text-[var(--primary)]" />
                    Product Highlights
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-[var(--text)] opacity-50 transition-transform ${highlightsExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {highlightsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3.5 pl-1 py-1">
                        {[
                          { icon: <Database size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />, text: mobileSpecs.ramRom, desc: "Store up to 2000 photos and videos easily" },
                          { icon: <Cpu size={14} className="text-amber-500 shrink-0 mt-0.5" />, text: mobileSpecs.processor, desc: "Powerful Performance. No Hang Phone" },
                          { icon: <Camera size={14} className="text-green-500 shrink-0 mt-0.5" />, text: mobileSpecs.camera, desc: "Get Vibrant Pictures, Full Of Detail" },
                          { icon: <Smartphone size={14} className="text-blue-500 shrink-0 mt-0.5" />, text: mobileSpecs.display, desc: "Big Screen. Fine Video Viewing Experience" },
                          { icon: <Battery size={14} className="text-red-500 shrink-0 mt-0.5" />, text: mobileSpecs.battery, desc: "Charging that can last up to 2 days*" }
                        ].map((hl, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/10 flex items-center justify-center shrink-0">
                              {hl.icon}
                            </div>
                            <div>
                              <p className="text-xs font-black text-[var(--text)]">{hl.text}</p>
                              <p className="text-[10px] text-[var(--text)]/50 font-bold mt-0.5 leading-relaxed">{hl.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-4 border-b border-[var(--border)]">
                <button
                  onClick={() => setHighlightsExpanded(!highlightsExpanded)}
                  className="flex items-center justify-between w-full mb-3 group"
                >
                  <span className="text-sm font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                    <Package size={15} className="text-[var(--primary)]" />
                    Product Highlights
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-[var(--text)] opacity-50 transition-transform ${highlightsExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {highlightsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {[
                          { label: "Category", value: product.category },
                          { label: "Status", value: product.stock > 0 ? "Available" : "Out of Stock" },
                          { label: "Brand", value: "Balaji Mart Official" },
                          { label: "Rating", value: `${Number(product.ratings || 0).toFixed(1)} ★` },
                          ...(product.discount_percentage > 0
                            ? [{ label: "Discount", value: `${product.discount_percentage}% off` }]
                            : []),
                          { label: "SKU", value: product.id?.slice(-8)?.toUpperCase() || "N/A" },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between py-1.5 border-b border-[var(--border)]/50">
                            <span className="text-[11px] text-[var(--text)]/50 font-medium">{item.label}</span>
                            <span className="text-[11px] font-black text-[var(--text)] text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── ALL DETAILS ── */}
            {isMobile ? (
              <div className="py-4 border-b border-[var(--border)]">
                <button
                  onClick={() => setAllDetailsExpanded(!allDetailsExpanded)}
                  className="flex items-center justify-between w-full group"
                >
                  <span className="text-sm font-black uppercase tracking-wider text-[var(--text)]">
                    All Details
                  </span>
                  <div className="flex items-center gap-1 text-[var(--text)]/40 text-[10px] font-bold">
                    <span>Showcase, Specs, Description</span>
                    <ChevronDown
                      size={15}
                      className={`transition-transform ${allDetailsExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {allDetailsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      {/* Detail Tabs */}
                      <div className="flex border-b border-[var(--border)]/40 mb-3 overflow-x-auto scrollbar-hide">
                        {["Showcase", "Specifications", "Description", "Warranty", "Manufacturer Info"].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveDetailTab(tab)}
                            className={`pb-2 pr-4 text-xs font-black uppercase tracking-wider transition-all relative ${
                              activeDetailTab === tab ? "text-[var(--primary)]" : "opacity-50 hover:opacity-100"
                            }`}
                          >
                            {tab}
                            {activeDetailTab === tab && (
                              <div className="absolute bottom-0 left-0 right-4 h-0.5 bg-[var(--primary)]" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Detail Content */}
                      <div className="text-xs text-[var(--text)]/85 leading-relaxed font-medium">
                        {activeDetailTab === "Showcase" && (
                          <div className="space-y-2.5 p-3.5 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-xl">
                            <p className="font-black text-[var(--primary)] text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <span>🌟</span> Balaji Verified Showcase
                            </p>
                            <p>Experience peak performance and elegant craftsmanship with the <strong>{product.name}</strong>. Designed for modern lifestyles with a high-capacity {mobileSpecs.battery} battery and crystal-clear {mobileSpecs.display} screen.</p>
                          </div>
                        )}

                        {activeDetailTab === "Specifications" && (
                          <div className="space-y-1 bg-[var(--card)] p-3 border border-[var(--border)] rounded-xl">
                            {[
                              { key: "Model Name", val: mobileNameInfo.model },
                              { key: "Color", val: activeColor },
                              { key: "Storage/RAM", val: activeVariant },
                              { key: "Primary Camera", val: mobileSpecs.camera },
                              { key: "Battery Capacity", val: mobileSpecs.battery },
                              { key: "Processor", val: mobileSpecs.processor }
                            ].map((spec, i) => (
                              <div key={i} className="flex justify-between py-2 border-b border-[var(--border)]/30 last:border-0">
                                <span className="text-[10px] text-[var(--text)]/50 font-bold uppercase tracking-wider">{spec.key}</span>
                                <span className="text-[10px] text-[var(--text)] font-black text-right">{spec.val}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeDetailTab === "Description" && (
                          <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                            <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
                          </div>
                        )}

                        {activeDetailTab === "Warranty" && (
                          <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center shrink-0">
                              <ShieldCheck className="text-green-500 w-4.5 h-4.5" />
                            </div>
                            <div>
                              <p className="font-black text-[var(--text)] text-xs">Manufacturer Warranty</p>
                              <p className="text-[10px] text-[var(--text)]/60 mt-0.5">{mobileSpecs.warranty}</p>
                            </div>
                          </div>
                        )}

                        {activeDetailTab === "Manufacturer Info" && (
                          <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-2 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
                              <Package className="text-indigo-500 w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-[var(--text)] text-xs">Manufacturer & Importer Details</p>
                              <div className="space-y-1.5 text-[10px] text-[var(--text)]/70 mt-1.5 font-bold">
                                <p><span className="font-black text-[var(--text)]/90">Manufacturer:</span> {(product.name?.split(" ")?.[0] || "Smartphone").toUpperCase()} India Private Limited</p>
                                <p><span className="font-black text-[var(--text)]/90">Importer:</span> Balaji Mart Retail Division, New Delhi, India</p>
                                <p><span className="font-black text-[var(--text)]/90">Packer:</span> Balaji Logistics & Distribution Hub, Sector 62, Noida, UP</p>
                                <p><span className="font-black text-[var(--text)]/90">Country of Origin:</span> India</p>
                                <p><span className="font-black text-[var(--text)]/90">Consumer Care Contact:</span> feedback@balajimart.com | Toll-Free: 1800-300-1122</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-4 border-b border-[var(--border)]">
                <button
                  onClick={() => setAllDetailsExpanded(!allDetailsExpanded)}
                  className="flex items-center justify-between w-full group"
                >
                  <span className="text-sm font-black uppercase tracking-wider text-[var(--text)]">
                    All Details
                  </span>
                  <div className="flex items-center gap-1 text-[var(--text)]/40 text-[10px] font-bold">
                    <span>Features, description and more</span>
                    <ChevronDown
                      size={15}
                      className={`transition-transform ${allDetailsExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {allDetailsExpanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 text-xs text-[var(--text)]/70 leading-relaxed font-medium overflow-hidden"
                    >
                      {product.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── QUANTITY + ADD TO CART ── */}
            <div className="pt-5 space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase tracking-wider opacity-60">Qty:</span>
                <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden shadow-inner">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                  >
                    <Minus size={14} />
                  </motion.button>
                  <span className="w-10 text-center font-black text-sm border-x border-[var(--border)]">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                  >
                    <Plus size={14} />
                  </motion.button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddCart}
                  disabled={product.stock < 1}
                  className="flex-[2] bg-orange-400 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest disabled:opacity-45 transition-all"
                >
                  <ShoppingCart size={17} /> ADD TO CART
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { handleAddCart(); navigate("/payment"); }}
                  disabled={product.stock < 1}
                  className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest disabled:opacity-45 transition-all shadow-lg"
                >
                  BUY AT ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </motion.button>
              </div>

              {/* Secure guarantee strip */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-50">
                  <ShieldCheck size={13} className="text-green-500" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-50">
                  <Clock size={13} className="text-blue-500" />
                  <span>On-time Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-50">
                  <RefreshCw size={13} className="text-orange-500" />
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── DESCRIPTION + REVIEWS TABS ─── */}
        <div className="mt-20 pt-12 border-t border-[var(--border)]">
          <div className="flex gap-10 mb-10 overflow-x-auto scrollbar-hide border-b border-[var(--border)]">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab ? "text-[var(--primary)]" : "opacity-50 hover:opacity-100"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tabMarker" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="opacity-80 text-sm leading-loose max-w-4xl"
            >
              {activeTab === "description" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <p className="leading-relaxed">{product.description}</p>
                  <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] h-fit shadow-lg">
                    <h4 className="text-[var(--text)] font-black text-[10px] uppercase tracking-widest mb-4">
                      Specifications
                    </h4>
                    <ul className="space-y-2.5 opacity-90 text-xs">
                      <li className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span>Category</span>
                        <span className="text-[var(--text)] font-bold">{product.category}</span>
                      </li>
                      <li className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span>Status</span>
                        <span className="text-[var(--text)] font-bold">
                          {product.stock > 0 ? "Available" : "Unavailable"}
                        </span>
                      </li>
                      <li className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span>Brand</span>
                        <span className="text-[var(--text)] font-bold">Balaji Mart Official</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <ReviewsContainer
                  productId={product?._id || product?.id}
                  productName={product?.name}
                  reviews={productReviews}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 🤝 FREQUENTLY BOUGHT TOGETHER BUNDLE SELECTOR */}
        {(() => {
          const bundleProducts = product ? [product, ...(suggestedProducts || []).slice(0, 2)] : [];
          if (bundleProducts.length < 3) return null;

          return (
            <div className="mt-24 pt-14 border-t border-[var(--border)] space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Frequently Bought Together</h3>
                  <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider">Bundle & save 5% extra on combined visual sets</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[var(--card)] to-slate-900/40 border border-[var(--border)] rounded-[2.5rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                
                <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
                  {/* Bundle Items Wrapper */}
                  <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-6 flex-1 w-full">
                    {bundleProducts.map((p, idx) => {
                      const pImages = (() => {
                        if (!p.images) return [];
                        try {
                          return typeof p.images === "string" ? JSON.parse(p.images) : p.images;
                        } catch { return []; }
                      })();
                      const imgUrl = pImages?.[0]?.url || p.image || "/no-image.png";
                      const isOriginal = idx === 0;

                      return (
                        <React.Fragment key={p.id || p._id || idx}>
                          {/* Connection Plus Operator */}
                          {idx > 0 && (
                            <span className="text-white/30 font-bold text-2xl select-none mx-2 shrink-0">+</span>
                          )}

                          {/* Bundle Product Card */}
                          <div className="relative bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center w-full max-w-[280px] hover:border-[var(--primary)]/50 transition-all duration-300">
                            {/* Checked Checkbox Overlay */}
                            <div className="absolute top-3 right-3 z-10">
                              <input
                                type="checkbox"
                                checked={checkedBundleItems[idx] || false}
                                onChange={() => {
                                  const updated = [...checkedBundleItems];
                                  updated[idx] = !updated[idx];
                                  setCheckedBundleItems(updated);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] accent-[var(--primary)] cursor-pointer"
                              />
                            </div>

                            {/* Image */}
                            <div className="w-16 h-16 rounded-xl bg-white overflow-hidden p-1.5 shrink-0">
                              <img src={imgUrl} className="w-full h-full object-contain" alt="" />
                            </div>

                            {/* Info */}
                            <div className="space-y-1 overflow-hidden">
                              {isOriginal && (
                                <span className="text-[7px] font-black tracking-widest bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 px-1.5 py-0.5 rounded-full uppercase block w-fit">
                                  This Item
                                </span>
                              )}
                              <h4 className="text-xs font-black text-white truncate max-w-[155px]">{p.name}</h4>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs font-black text-[var(--primary)]">₹{Number(p.price).toLocaleString("en-IN")}</span>
                                {p.discount_percentage > 0 && (
                                  <span className="text-[9px] line-through opacity-40 font-bold">
                                    ₹{Math.round(p.original_price || (p.price / (1 - p.discount_percentage / 100))).toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Bundle Equals Operator */}
                  <span className="hidden xl:inline text-white/30 font-bold text-2xl select-none mx-2">=</span>

                  {/* Bundle Pricing Summary */}
                  {(() => {
                    const checkedCount = checkedBundleItems.filter(Boolean).length;
                    const totalOriginalPrice = bundleProducts.reduce((sum, p, i) => {
                      if (!checkedBundleItems[i]) return sum;
                      const orig = p.discount_percentage > 0 ? Number(p.original_price || (p.price / (1 - p.discount_percentage / 100))) : p.price;
                      return sum + Number(orig);
                    }, 0);

                    const totalDiscountedPrice = bundleProducts.reduce((sum, p, i) => {
                      if (!checkedBundleItems[i]) return sum;
                      return sum + Number(p.price);
                    }, 0);

                    const isBundleDiscount = checkedCount >= 2;
                    const finalBundlePrice = isBundleDiscount ? Math.round(totalDiscountedPrice * 0.95) : totalDiscountedPrice;
                    const totalSavings = totalOriginalPrice - finalBundlePrice;

                    return (
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 w-full xl:w-80 space-y-4 shrink-0">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">
                            Bundle Price ({checkedCount} items Selected)
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white font-mono">₹{finalBundlePrice.toLocaleString("en-IN")}</span>
                            {totalOriginalPrice > finalBundlePrice && (
                              <span className="text-sm line-through opacity-45 font-bold">
                                ₹{totalOriginalPrice.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>

                        {totalSavings > 0 && (
                          <div className="flex flex-col gap-1 text-[10px] font-bold">
                            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl w-fit">
                              🎉 Total Savings: ₹{totalSavings.toLocaleString("en-IN")}
                            </span>
                            {isBundleDiscount && (
                              <span className="text-indigo-400 pl-2">
                                ✓ 5% extra Bundle Discount applied!
                              </span>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            let addedCount = 0;
                            bundleProducts.forEach((p, i) => {
                              if (checkedBundleItems[i]) {
                                dispatch(addToCart({ product: p, quantity: 1 }));
                                addedCount++;
                              }
                            });
                            if (addedCount > 0) {
                              toast.success(`Successfully added ${addedCount} bundle items to cart!`);
                            } else {
                              toast.warning("Please select at least one item to add.");
                            }
                          }}
                          disabled={checkedCount === 0}
                          className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:from-white/10 disabled:to-white/10 disabled:opacity-40 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-600/10 active:scale-95 transition-all w-full text-center"
                        >
                          Add Bundle to Cart
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════════════════════════════════════════════════════════
            1. AI SIMILAR PRODUCTS (same category + keyword ranked)
            ════════════════════════════════════════════════════════ */}
        <div className="mt-24 pt-14 border-t border-[var(--border)] space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[var(--primary)]">
                  You Might Also Like
                </span>
                <span className="flex items-center gap-1 bg-gradient-to-r from-purple-500/20 to-pink-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-purple-400 tracking-widest">
                  <Sparkles size={8} className="animate-pulse" /> AI PICKS
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[var(--text)] flex items-center gap-2">
                SIMILAR{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-700">PRODUCTS</span>
                <span className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black text-rose-400 tracking-wider">
                  <Sparkles size={9} className="animate-spin text-rose-400" /> AI SCAN
                </span>
              </h2>
              <p className="text-xs opacity-40 mt-1 font-medium">
                Scanned visually using AI CLIP embeddings database matching
              </p>
            </div>
            {suggestedProducts.length > 0 && (
              <span className="text-[10px] font-black opacity-40 uppercase tracking-wider shrink-0">
                {suggestedProducts.length} results
              </span>
            )}
          </div>

          {loadingSuggestions ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="animate-pulse bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                  <div className="bg-[var(--primary)]/5 aspect-square w-full" />
                  <div className="p-4 space-y-2">
                    <div className="h-2 bg-[var(--primary)]/10 rounded w-1/3" />
                    <div className="h-4 bg-[var(--primary)]/10 rounded w-3/4" />
                    <div className="h-3 bg-[var(--primary)]/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {suggestedProducts.map((p, idx) => (
                <motion.div
                  key={p.id || p._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.4 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center">
              <Sparkles size={32} className="mx-auto mb-3 opacity-20 text-[var(--primary)]" />
              <p className="opacity-50 font-bold uppercase tracking-widest text-xs">No similar products found in {product.category}</p>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════
            2. RECENTLY VIEWED (last 24 hours)
            ════════════════════════════════════════════════════════ */}
        {(recentlyViewed.length > 0 || loadingRecent) && (
          <div className="mt-20 pt-14 border-t border-[var(--border)] space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[var(--primary)]">Recently Viewed</span>
                  <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-amber-400 tracking-widest">
                    <Clock size={8} /> LAST 24H
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                  RECENTLY{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">VIEWED</span>
                </h2>
                <p className="text-xs opacity-40 mt-1 font-medium">Products you explored in the last 24 hours</p>
              </div>
              {recentlyViewed.length > 0 && (
                <span className="text-[10px] font-black opacity-40 uppercase tracking-wider shrink-0">
                  {recentlyViewed.length} items
                </span>
              )}
            </div>

            {loadingRecent ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="animate-pulse bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shrink-0 w-44">
                    <div className="bg-[var(--primary)]/5 aspect-square w-full" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-[var(--primary)]/10 rounded w-3/4" />
                      <div className="h-3 bg-[var(--primary)]/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                {recentlyViewed.map((p, idx) => {
                  const imgs = (() => { try { return typeof p.images === "string" ? JSON.parse(p.images) : (p.images || []); } catch { return []; } })();
                  return (
                    <motion.div
                      key={p.id || p._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/product/${p.id || p._id}`)}
                      className="group shrink-0 w-44 bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden cursor-pointer hover:border-[var(--primary)] hover:shadow-lg transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-white overflow-hidden">
                        <img
                          src={imgs?.[0]?.url || "/no-image.png"}
                          alt={p.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {p.discount_percentage > 0 && (
                          <span className="absolute top-0 right-0 bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg">
                            -{p.discount_percentage}%
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-1 truncate">{p.category}</p>
                        <p className="text-[11px] font-bold text-[var(--text)] line-clamp-2 leading-snug mb-1.5 group-hover:text-[var(--primary)] transition-colors">{p.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-[var(--text)]">₹{Number(p.price || 0).toLocaleString("en-IN")}</span>
                          <div className="flex items-center gap-0.5 bg-green-700 text-white px-1.5 py-0.5 rounded text-[8px] font-black">
                            <span>{Number(p.ratings || 0).toFixed(1)}</span>
                            <Star size={7} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            3. EXPLORE MORE LIKE THIS (all same-category products)
            ════════════════════════════════════════════════════════ */}
        {(exploreMore.length > 0 || loadingExplore) && (
          <div className="mt-20 pt-14 border-t border-[var(--border)] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[var(--primary)]">Explore More</span>
                  <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-blue-400 tracking-widest">
                    <Zap size={8} fill="currentColor" /> ALL IN CATEGORY
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                  EXPLORE MORE{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">LIKE THIS</span>
                </h2>
                <p className="text-xs opacity-40 mt-1 font-medium">
                  All products in <span className="font-black text-[var(--text)]/60">{product.category}</span> — sorted by top rating
                </p>
              </div>
              {exploreMore.length > 0 && (
                <span className="text-[10px] font-black opacity-40 uppercase tracking-wider shrink-0">
                  {exploreMore.length} products total
                </span>
              )}
            </div>

            {loadingExplore ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <div key={i} className="animate-pulse bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                    <div className="bg-[var(--primary)]/5 aspect-square w-full" />
                    <div className="p-4 space-y-2">
                      <div className="h-2 bg-[var(--primary)]/10 rounded w-1/3" />
                      <div className="h-4 bg-[var(--primary)]/10 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {exploreMore.slice(0, exploreVisible).map((p, idx) => (
                    <motion.div
                      key={p.id || p._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 8) * 0.05, duration: 0.4 }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>

                {/* Load More button */}
                {exploreVisible < exploreMore.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center pt-4"
                  >
                    <motion.button
                      onClick={() => setExploreVisible((v) => v + 8)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-8 py-3 border-2 border-[var(--primary)] text-[var(--primary)] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all duration-300 shadow-md shadow-[var(--primary)]/10"
                    >
                      <ChevronDown size={15} />
                      Show More ({exploreMore.length - exploreVisible} remaining)
                    </motion.button>
                  </motion.div>
                )}

                {/* All loaded indicator */}
                {exploreVisible >= exploreMore.length && exploreMore.length > 8 && (
                  <p className="text-center text-[10px] opacity-40 font-black uppercase tracking-widest py-2">
                    ✓ All {exploreMore.length} products in {product.category} shown
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {/* ULTRA-PREMIUM LIGHTBOX MODAL */}
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none"
              onClick={() => setIsLightboxOpen(false)}
            >
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-6 right-6 text-white hover:text-[var(--primary)] transition-colors w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-lg"
              >
                <X size={24} />
              </motion.button>

              {/* Lightbox Navigation Buttons */}
              {mediaItems.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImageIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
                    }}
                    className="absolute left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>

                  {/* Right Arrow */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImageIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight size={24} />
                  </motion.button>
                </>
              )}

              {/* Lightbox Image Container */}
              <div 
                className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.img
                  key={lightboxImageIndex}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  src={mediaItems[lightboxImageIndex]?.url || "/no-image.png"}
                  alt={product.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl bg-white p-4"
                />
                {/* Image Index indicator */}
                {mediaItems.length > 1 && (
                  <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-black px-4 py-2 rounded-full tracking-widest uppercase">
                    {lightboxImageIndex + 1} / {mediaItems.length}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ProductDetail;