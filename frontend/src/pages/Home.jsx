import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Sparkles, Clock, ArrowRight, Star, ShoppingBag, Percent, Gift, History, Award, CheckCircle, Flame, Zap, ShieldCheck, Tag, Play, Pause, Volume2, VolumeX, Video, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import HeroSlider from "../components/Home/HeroSlider";
import NewArrivalSlider from "../components/Home/NewArrivalSlider";
// FeatureSection and NewsletterSection are loaded inside the footer
import ProductCard from "../components/Products/ProductCard";
import { fetchAllProducts, setCampaignProducts } from "../store/slices/productSlice";
import { categories } from "../data/products";
import { addToCart } from "../store/slices/cartSlice";
import { toggleCart } from "../store/slices/popupSlice";
import { axiosInstance } from "../lib/axios";
import { getTopCategory, getAIRecommendationDetails, saveShoppingProfile } from "../utils/shoppingBrain";

// ─── AI PRODUCT REELS DATA (published by admin from AI Video Studio) ───
const MOCK_REELS = [
  {
    id: 'reel1',
    title: 'Traditional Silk Saree',
    category: 'Fashion',
    price: '₹5,999',
    discount: '40% OFF',
    badge: '🔥 Trending',
    platform: 'Instagram Reels',
    views: '89.4K',
    caption: '✨ Drape yourself in elegance! Premium Silk Saree at unbeatable price!',
    color: '#be185d',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop',
    video_url: 'https://www.w3schools.com/html/movie.mp4',
  },
  {
    id: 'reel2',
    title: 'Alienware Gaming Laptop',
    category: 'Electronics',
    price: '₹1,24,999',
    discount: '₹15,000 OFF',
    badge: '⚡ Best Seller',
    platform: 'YouTube Ads',
    views: '24.8K',
    caption: '💻 Game-changing performance. Alienware - Dominate every session!',
    color: '#1d4ed8',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop',
    video_url: 'https://vjs.zencdn.net/v/oceans.mp4',
  },
  {
    id: 'reel3',
    title: 'Emerald Velvet Sofa',
    category: 'Home & Living',
    price: '₹48,500',
    discount: '25% OFF',
    badge: '🛋️ Premium',
    platform: 'Instagram Reels',
    views: '12.3K',
    caption: '🛋️ Transform your living space! Luxurious comfort, timeless design.',
    color: '#047857',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
    video_url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
  },
  {
    id: 'reel4',
    title: 'Chronograph Gold Watch',
    category: 'Accessories',
    price: '₹18,999',
    discount: '20% OFF',
    badge: '⌚ Luxury Pick',
    platform: 'TikTok',
    views: '56.1K',
    caption: '⌚ Time is luxury. Own the Chronograph Gold — only on BalajiMart!',
    color: '#b45309',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: 'reel5',
    title: 'Wireless Noise Cancelling Headphones',
    category: 'Electronics',
    price: '₹9,499',
    discount: '35% OFF',
    badge: '🎧 Editor\'s Pick',
    platform: 'Instagram Reels',
    views: '41.2K',
    caption: '🎧 Pure sound, zero distractions. Wireless ANC Headphones — hear the difference!',
    color: '#6d28d9',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    video_url: 'https://vjs.zencdn.net/v/oceans.mp4',
  },
  {
    id: 'reel6',
    title: 'Smart Air Fryer Pro',
    category: 'Kitchen',
    price: '₹7,299',
    discount: '30% OFF',
    badge: '🍟 Hot Deal',
    platform: 'YouTube Ads',
    views: '18.7K',
    caption: '🍟 Fry smarter, not harder! Smart Air Fryer Pro — healthy cooking made easy.',
    color: '#dc2626',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?q=80&w=600&auto=format&fit=crop',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
];

// ─── PRODUCT REEL CARD (mimics Amazon/Flipkart short video card) ───
const ProductReelCard = ({ reel, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Simulate "playing" by cycling the product overlay on hover
  useEffect(() => {
    let interval;
    if (isHovered) {
      interval = setInterval(() => setCaptionIdx(p => (p + 1) % 3), 1800);
    } else {
      setCaptionIdx(0);
    }
    return () => clearInterval(interval);
  }, [isHovered]);

  const captions = [
    reel.caption,
    `🛒 Add to Cart — ${reel.price}`,
    `🎁 ${reel.discount} • Free Delivery!`,
  ];

  return (
    <div
      onClick={onClick}
      className="relative flex-shrink-0 w-44 md:w-52 rounded-2xl overflow-hidden cursor-pointer group border border-white/10 hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ aspectRatio: '9/16', background: reel.color + '22' }}
    >
      {/* Background visual asset (video vs image) */}
      {reel.video_url ? (
        <video
          src={getSafeVideoUrl(reel.video_url)}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-in-out ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />
      ) : (
        <img
          src={reel.image}
          alt={reel.title}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-in-out ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
      )}

      {/* Floating PIP Product Card on top of Video Loop backdrops */}
      {reel.video_url && (
        <div className="absolute top-[16%] left-2.5 right-2.5 z-10 p-1.5 bg-black/65 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-2 shadow-2xl pointer-events-none">
          <img 
            src={reel.image} 
            className="w-7 h-7 rounded-lg object-contain bg-white/5 border border-white/10 shrink-0" 
            alt="" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[9px] font-black text-white truncate leading-tight">{reel.title}</p>
            <p className="text-[8px] font-black text-emerald-400 mt-0.5">{reel.price}</p>
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

      {/* Top badges */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
        <span className="text-[9px] font-black bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-full border border-white/20">
          {reel.badge}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setIsMuted(m => !m); }}
          className="p-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition"
        >
          {isMuted ? <VolumeX size={9} /> : <Volume2 size={9} />}
        </button>
      </div>

      {/* Play / pause indicator center */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${ isHovered ? 'opacity-0' : 'opacity-100' }`}>
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
          <Play size={16} className="text-white ml-0.5" />
        </div>
      </div>

      {/* Animated waveform when playing */}
      {isHovered && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-end gap-[2px] h-8">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="bg-white/70 rounded-full w-[3px] animate-pulse"
              style={{ height: `${40 + Math.sin(i * 0.8 + Date.now() / 300) * 60}%`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}

      {/* Scrolling caption when hovered */}
      {isHovered && (
        <div className="absolute bottom-14 left-2 right-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={captionIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] font-bold text-white drop-shadow-lg leading-tight line-clamp-2"
            >
              {captions[captionIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* Bottom product info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: reel.color }}>{reel.category}</span>
          <span className="text-[8px] font-bold text-white/60">{reel.views} views</span>
        </div>
        <p className="text-[11px] font-black text-white line-clamp-1">{reel.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-white">{reel.price}</span>
          <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-1.5 py-0.5 rounded">{reel.discount}</span>
        </div>
      </div>
    </div>
  );
};

const CelebrityVoices = {
  srk: { pitch: 1.15, rate: 1.05, voiceName: 'en-IN' },
  modi: { pitch: 0.85, rate: 0.82, voiceName: 'en-IN' },
  deep: { pitch: 0.75, rate: 0.9, voiceName: 'en-US' },
  luxury: { pitch: 1.1, rate: 0.8, voiceName: 'en-US' },
  off: { pitch: 1.0, rate: 1.0, voiceName: '' }
};

const speakText = (text, style) => {
  if (!text || style === 'off' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceConfig = CelebrityVoices[style] || CelebrityVoices.deep;
    utterance.pitch = voiceConfig.pitch;
    utterance.rate = voiceConfig.rate;
    
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.includes(voiceConfig.voiceName)) || voices[0];
    if (matchedVoice) utterance.voice = matchedVoice;
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Speech synthesis failed:", e);
  }
};

const Index = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { topRatedProducts, newProducts, products, totalProducts, loading } = useSelector(
    (state) => state.product
  );

  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalProducts / 120);

  // Sync URL query params with local states when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageVal = parseInt(params.get("page")) || 1;
    setCurrentPage(pageVal);
  }, [location.search]);

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
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Deals of the day timer
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  // Dynamic AI Campaign state
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [globalCampaignIndex, setGlobalCampaignIndex] = useState(0);
  const activeCampaign = activeCampaigns[globalCampaignIndex] || null;
  const [campaignTimeLeft, setCampaignTimeLeft] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  // AI Recommendation browsing state ("Still Looking?")
  const [recommendedCategory, setRecommendedCategory] = useState("");
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Local states for mixed category catalog
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [totalCatalogProducts, setTotalCatalogProducts] = useState(0);
  const totalCatalogPages = Math.ceil(totalCatalogProducts / 120);

  // Recently Viewed local state
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // AI Video Reels personalization states
  const [dbReels, setDbReels] = useState([]);
  const [rankedReels, setRankedReels] = useState([]);
  const [activeReelModal, setActiveReelModal] = useState(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [modalMuted, setModalMuted] = useState(true);
  const [modalSlideIdx, setModalSlideIdx] = useState(0);

  // Auto-cycle modal captions and voiceover speak
  useEffect(() => {
    let interval;
    if (activeReelModal) {
      setModalSlideIdx(0);
      const captionsList = activeReelModal.captions || [activeReelModal.caption];
      if (captionsList.length > 1) {
        interval = setInterval(() => {
          setModalSlideIdx(prev => (prev + 1) % captionsList.length);
        }, 3500);
      }
    }
    return () => clearInterval(interval);
  }, [activeReelModal]);

  useEffect(() => {
    if (activeReelModal && !modalMuted) {
      const captionsList = activeReelModal.captions || [activeReelModal.caption];
      const currentText = captionsList[modalSlideIdx];
      if (currentText) {
        const cleanText = currentText.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
        speakText(cleanText, activeReelModal.voiceover || 'srk');
      }
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [activeReelModal, modalMuted, modalSlideIdx]);

  // Fetch Shoppable video campaigns from database
  useEffect(() => {
    const fetchDbReels = async () => {
      try {
        const response = await axiosInstance.get("/reels/all");
        if (response.data?.success && response.data.reels?.length > 0) {
          const formatted = response.data.reels.map((r) => {
            const rImages = (() => {
              if (!r.product_images) return [];
              try {
                return typeof r.product_images === "string" ? JSON.parse(r.product_images) : r.product_images;
              } catch { return []; }
            })();
            const parsedCaptions = (() => {
              if (!r.captions) return null;
              try {
                return typeof r.captions === "string" ? JSON.parse(r.captions) : r.captions;
              } catch {
                return [r.captions];
              }
            })();
            const primaryCaption = parsedCaptions?.[0] || `Check out our premium ${r.product_name || "product"}!`;

            return {
              id: r.id,
              title: r.title,
              category: r.product_category || "General",
              price: `₹${Number(r.product_price).toLocaleString("en-IN")}`,
              discount: r.product_discount_percentage > 0 ? `${r.product_discount_percentage}% OFF` : "Hot Offer",
              badge: r.category_tag || "🔥 Trending",
              platform: r.music_track,
              views: `${(r.views_count / 1000).toFixed(1)}K`,
              caption: primaryCaption,
              captions: parsedCaptions,
              voiceover: r.voiceover || "srk",
              color: "#be185d",
              image: rImages?.[0]?.url || "/no-image.png",
              video_url: r.video_url,
              product_id: r.product_id
            };
          });
          setDbReels(formatted);
        }
      } catch (err) {
        console.error("Failed to load db reels", err);
      }
    };
    fetchDbReels();
  }, []);

  useEffect(() => {
    const activeReelsList = dbReels.length > 0 ? dbReels : MOCK_REELS;
    const topCat = getTopCategory();
    if (topCat) {
      const sorted = [...activeReelsList].sort((a, b) => {
        const aMatches = a.category?.toLowerCase() === topCat.toLowerCase();
        const bMatches = b.category?.toLowerCase() === topCat.toLowerCase();
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
      setRankedReels(sorted);
    } else {
      setRankedReels(activeReelsList);
    }
  }, [products, dbReels]);

  const handleOpenReel = (reel, index) => {
    setActiveReelModal(reel);
    setActiveReelIndex(index);
    const updated = { ...getAIRecommendationDetails().profile };
    updated.categories = updated.categories || {};
    updated.categories[reel.category] = (updated.categories[reel.category] || 0) + 1;
    saveShoppingProfile(updated);
    if (reel.id && typeof reel.id === "number") {
      axiosInstance.post(`/reels/track-view/${reel.id}`).catch(() => {});
    }
  };

  const handleNextReel = () => {
    const nextIdx = (activeReelIndex + 1) % rankedReels.length;
    setActiveReelIndex(nextIdx);
    setActiveReelModal(rankedReels[nextIdx]);
    if (rankedReels[nextIdx].id && typeof rankedReels[nextIdx].id === "number") {
      axiosInstance.post(`/reels/track-view/${rankedReels[nextIdx].id}`).catch(() => {});
    }
  };

  const handlePrevReel = () => {
    const prevIdx = (activeReelIndex - 1 + rankedReels.length) % rankedReels.length;
    setActiveReelIndex(prevIdx);
    setActiveReelModal(rankedReels[prevIdx]);
    if (rankedReels[prevIdx].id && typeof rankedReels[prevIdx].id === "number") {
      axiosInstance.post(`/reels/track-view/${rankedReels[prevIdx].id}`).catch(() => {});
    }
  };

  // Category Navbar Scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mock Session ID for tracking
  useEffect(() => {
    if (!localStorage.getItem("browse_session_id")) {
      localStorage.setItem("browse_session_id", "session_" + Math.random().toString(36).slice(2, 11));
    }
  }, []);

  // Campaign Slider Auto-Play (Global Slider)
  useEffect(() => {
    if (activeCampaigns && activeCampaigns.length > 1) {
      const interval = setInterval(() => {
        setGlobalCampaignIndex((prev) => (prev + 1) % activeCampaigns.length);
        setActiveSlide(0); // reset internal slide when campaign changes
      }, 7000); // 7 seconds per campaign slide
      return () => clearInterval(interval);
    }
  }, [activeCampaigns]);

  // Internal Media Slider Auto-Play
  useEffect(() => {
    if (activeCampaign && activeCampaign.media_assets && activeCampaign.media_assets.length > 0) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % activeCampaign.media_assets.length);
      }, 4000); // 4 second per media slide
      return () => clearInterval(interval);
    }
  }, [activeCampaign]);

  // Timer Countdown Logic (Deals of the Day)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 14, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // AI visual recommendations based on recently viewed products
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoadingSuggestions(true);
        const savedIds = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
        const tsStore  = JSON.parse(localStorage.getItem("recently_viewed_ts") || "{}");
        const cutoff   = Date.now() - 24 * 60 * 60 * 1000;
        
        const recentIds = savedIds.filter(pid => (tsStore[pid] || 0) >= cutoff).slice(0, 10);
        
        const response = await axiosInstance.post("/product/recommendations", { recentIds });
        if (response.data?.success) {
          setSuggestedProducts(response.data.products || []);
        }
      } catch (err) {
        console.error("Failed to load visual recommendations", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    
    fetchRecommendations();
  }, []);
  // Fetch all initial catalog products
  useEffect(() => {
    dispatch(
      fetchAllProducts({
        category: "",
        price: "0-50000",
        search: "",
        ratings: "",
        availability: "",
        page: 1,
        limit: currentPage * 120,
      })
    );
  }, [dispatch, currentPage]);

  // Fetch recently viewed products from 24h history
  useEffect(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
      const tsStore  = JSON.parse(localStorage.getItem("recently_viewed_ts") || "{}");
      const cutoff   = Date.now() - 24 * 60 * 60 * 1000;

      const recentIds = savedIds.filter(
        (pid) => (tsStore[pid] || 0) >= cutoff
      ).slice(0, 10);

      if (recentIds.length === 0) {
        setRecentlyViewed([]);
        return;
      }

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
        .catch((err) => console.error("Recently viewed load failed on home", err))
        .finally(() => setLoadingRecent(false));
    } catch (e) {
      console.error("Recently viewed parse error on home", e);
    }
  }, [products]);

  // Fetch mixed category catalog products to solve dominant categories (electronics) issue
  useEffect(() => {
    const fetchCatalogProducts = async () => {
      setLoadingCatalog(true);
      try {
        const topCat = getTopCategory();
        const cats = ["Fashion", "Electronics", "Mobiles", "Beauty", "Home", "Sports", "Automotive", "Kids & Baby", "Balaji Grocery"];
        
        // Fetch products for each category in parallel
        const limitPerCategory = Math.max(12, Math.ceil((currentPage * 120) / cats.length));
        
        const promises = cats.map(cat => 
          axiosInstance.get("/product", {
            params: {
              category: cat,
              limit: limitPerCategory,
              page: 1
            }
          }).then(res => ({
            category: cat,
            products: res.data.products || [],
            total: res.data.totalProducts || 0
          })).catch(err => {
            console.error(`Failed to fetch catalog products for ${cat}:`, err.message);
            return { category: cat, products: [], total: 0 };
          })
        );
        
        const results = await Promise.all(promises);
        
        // Combine and mix products
        const groups = {};
        let grandTotal = 0;
        results.forEach(res => {
          groups[res.category] = res.products;
          grandTotal += res.total;
        });
        
        // Prioritize topCategory first
        const catsOrder = [...cats];
        if (topCat) {
          const idx = catsOrder.findIndex(c => c.toLowerCase() === topCat.toLowerCase());
          if (idx > -1) {
            const [removed] = catsOrder.splice(idx, 1);
            catsOrder.unshift(removed);
          }
        }
        
        const mixed = [];
        const pointers = {};
        catsOrder.forEach(c => { pointers[c] = 0; });
        
        let added = true;
        while (added) {
          added = false;
          for (const c of catsOrder) {
            const group = groups[c] || [];
            const ptr = pointers[c];
            if (ptr < group.length) {
              const isTop = topCat && c.toLowerCase() === topCat.toLowerCase();
              const batchSize = isTop ? 4 : 2;
              for (let i = 0; i < batchSize && (pointers[c] < group.length); i++) {
                mixed.push(group[pointers[c]]);
                pointers[c]++;
              }
              added = true;
            }
          }
        }
        
        setCatalogProducts(mixed);
        setTotalCatalogProducts(grandTotal || mixed.length * 5);
      } catch (err) {
        console.error("Failed to load catalog products:", err);
      } finally {
        setLoadingCatalog(false);
      }
    };
    
    fetchCatalogProducts();
  }, [currentPage]);

  // Fetch active festival campaign & custom recommendations from backend
  useEffect(() => {
    const fetchCampaignAndRecs = async () => {
      try {
        // 1. Get active campaigns
        const campaignRes = await axiosInstance.get("/campaigns/active");
        if (campaignRes.data.success && campaignRes.data.campaigns && campaignRes.data.campaigns.length > 0) {
          setActiveCampaigns(campaignRes.data.campaigns);
        }

        // 2. Get AI Browsing recommendations
        const sessionHeader = localStorage.getItem("browse_session_id") || "anonymous_session";
        const topCat = getTopCategory();
        
        const recRes = await axiosInstance.get("/campaigns/recommendations", {
          headers: { "x-session-id": sessionHeader },
          params: { top_category: topCat || undefined }
        });
        if (recRes.data.success) {
          setRecommendedProducts(recRes.data.products || []);
          setRecommendedCategory(recRes.data.category || topCat || "");
        }
      } catch (err) {
        console.warn("Dynamic API fetching failed. Handled graceful offline defaults:", err.message);
        
        // Offline Fallback for Recommendations using Local Shopping Brain
        const topCat = getTopCategory();
        if (topCat && products?.length > 0) {
           const localRecs = products.filter(p => p.category === topCat).slice(0, 4);
           if (localRecs.length > 0) {
              setRecommendedProducts(localRecs);
              setRecommendedCategory(topCat);
           }
        }
      }
    };

    fetchCampaignAndRecs();
  }, []);

  // Campaign end-date timer countdown
  useEffect(() => {
    if (!activeCampaign || !activeCampaign.end_date) return;

    const timer = setInterval(() => {
      const distance = new Date(activeCampaign.end_date) - new Date();
      if (distance < 0) {
        setCampaignTimeLeft("Campaign Expired");
        clearInterval(timer);
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCampaignTimeLeft(`${days}d : ${hours}h : ${minutes}m : ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCampaign]);

  const handleCampaignClick = async (e) => {
    if (e) e.preventDefault();
    if (!activeCampaign) return;
    try {
      await axiosInstance.post(`/campaigns/track/${activeCampaign.id}`, { action: "click" });
    } catch (err) {
      console.log("Failed to track click analytics", err.message);
    }
    dispatch(setCampaignProducts({ products: activeCampaign.products, title: activeCampaign.title }));
    navigate(`/products?campaign_id=${activeCampaign.id}`);
  };

  const handleQuickAdd = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    dispatch(addToCart({ product: { ...product, id: product._id || product.id }, quantity: 1 }));
    toast.success("Added to Cart!");
    dispatch(toggleCart());
  };

  // Source products: prioritize mixed catalog products, fallback to global state
  const sourceProducts = catalogProducts.length > 0 ? catalogProducts : products;

  // Filter highest discount products ("Intelligent Deal of the Day")
  const dealOfTheDayProducts = [...sourceProducts]
    .filter(p => p.discount_percentage > 0)
    .sort((a, b) => b.discount_percentage - a.discount_percentage)
    .slice(0, 4);

  // Buy One Get One / Combo Bundle offers ("Best Offers For You")
  const comboOffersProducts = [...sourceProducts]
    .filter(p => p.offer_type === 'BOGO' || p.offer_type === 'MEGADEAL')
    .slice(0, 4);

  // Fallback if BOGO query is empty
  const displayedComboProducts = comboOffersProducts.length > 0 ? comboOffersProducts : sourceProducts.slice(4, 8);

  // Tech Gadgets AI Showcase with BOGO / MEGADEAL badge styling
  const techGadgets = [...sourceProducts]
    .filter(p => p.category?.toLowerCase().includes("electronic") || p.category?.toLowerCase().includes("gadget") || p.offer_type === 'FLASHSALE')
    .slice(0, 4);

  const colors = activeCampaign 
    ? (typeof activeCampaign.theme_colors === "string" 
        ? JSON.parse(activeCampaign.theme_colors) 
        : activeCampaign.theme_colors || { bg: "#7a0c02", text: "#ffffff", accent: "#ffd700" })
    : { bg: "#7a0c02", text: "#ffffff", accent: "#ffd700" };

  const renderFestivalBackground = (eventName, colors) => {
    const name = (eventName || "").toLowerCase();
    const bg = colors.bg || '#7a0c02';
    const accent = colors.accent || '#ffd700';
    const text = colors.text || '#ffffff';

    // 1. EID / BAKRID / RAMADAN
    if (name.includes("bakrid") || name.includes("eid") || name.includes("ramadan") || name.includes("mubarak") || name.includes("megh") || name.includes("good")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
          {/* High-Fidelity AI Generated Stage backdrop image */}
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-lighten" style={{ backgroundImage: "url('/campaigns/eid_banner.png')" }} />
          {/* Real-time elegant vector gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/80 via-transparent to-black/90" />
          
          {/* Islamic Lattice Grid overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `radial-gradient(circle, ${accent} 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px'
          }} />
          {/* Mosque arches silhouette in vector */}
          <svg className="absolute bottom-0 left-0 w-full h-48 text-emerald-800/10 pointer-events-none" viewBox="0 0 1440 200" fill="currentColor" preserveAspectRatio="none">
            <path d="M0,200 L0,150 C120,120 240,120 360,150 C480,180 600,180 720,150 C840,120 960,120 1080,150 C1200,180 1320,180 1440,150 L1440,200 Z" />
          </svg>
          {/* Twilight stars blinking */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDuration: '4s' }} />
            <div className="absolute top-1/3 left-2/3 w-1 h-1 bg-white rounded-full animate-pulse-slow" />
          </div>
        </div>
      );
    }

    // 2. DIWALI / DEEPAVALI
    if (name.includes("diwali") || name.includes("deepavali")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
          {/* High-Fidelity AI Generated Diwali Stage backdrop image */}
          <div className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-lighten" style={{ backgroundImage: "url('/campaigns/diwali_banner.png')" }} />
          {/* Real-time warm overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-950/70 via-transparent to-black/80" />
          
          {/* Rangoli Backdrop spinner */}
          <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] opacity-[0.06] text-amber-400 rotate-slow animate-spin-slow">
            <svg className="w-full h-full" viewBox="0 0 200 200" fill="currentColor">
              <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 6" />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x = 100 + 55 * Math.cos(angle);
                const y = 100 + 55 * Math.sin(angle);
                return <circle key={i} cx={x} cy={y} r="8" />;
              })}
            </svg>
          </div>
          {/* Sparkling golden dots floating up */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-12 left-1/4 w-2 h-2 bg-yellow-400 rounded-full blur-[1px] animate-bounce-slow" />
            <div className="absolute bottom-20 left-1/2 w-2 h-2 bg-orange-400 rounded-full blur-[1.5px] animate-pulse-slow" />
          </div>
        </div>
      );
    }

    // 3. HOLI
    if (name.includes("holi")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
          {/* High-Fidelity AI Generated Holi Color stage backdrop */}
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-lighten" style={{ backgroundImage: "url('/campaigns/holi_banner.png')" }} />
          {/* Real-time neon gradient mask */}
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-950/60 via-transparent to-slate-900/90" />
          
          {/* Huge color splashes with heavy blurs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-[60px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-yellow-500/5 blur-[80px] animate-pulse-slow" style={{ animationDuration: '8s' }} />
        </div>
      );
    }

    // 4. DURGA PUJA / NAVRATRI
    if (name.includes("durga") || name.includes("puja") || name.includes("navratri")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950"
             style={{ background: `linear-gradient(135deg, ${bg}ff, #380105 100%)` }}>
          {/* High-Fidelity AI Generated Diwali/Festival background fallback */}
          <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen" style={{ backgroundImage: "url('/campaigns/diwali_banner.png')" }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-red-950/80 via-transparent to-black/90" />
          
          {/* Elegant gold geometric halo mandala */}
          <div className="absolute left-[65%] top-[10%] w-[500px] h-[500px] opacity-[0.05] text-amber-500 animate-spin-slow">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
              <circle cx="50" cy="50" r="45" strokeDasharray="2,2" />
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)} y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)} />
              ))}
            </svg>
          </div>
        </div>
      );
    }

    // 5. CHRISTMAS / XMAS
    if (name.includes("christmas") || name.includes("xmas")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
          {/* High-Fidelity AI Generated Christmas stage backdrop */}
          <div className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-lighten" style={{ backgroundImage: "url('/campaigns/christmas_banner.png')" }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/70 via-transparent to-red-950/70" />
          
          {/* Falling vector snowflakes backdrop */}
          <div className="absolute inset-0 opacity-15">
            <svg className="w-full h-full text-white fill-currentColor" viewBox="0 0 100 100">
              <circle cx="15" cy="20" r="0.8" className="animate-pulse" />
              <circle cx="45" cy="15" r="1.2" />
              <circle cx="75" cy="30" r="0.6" className="animate-pulse" />
            </svg>
          </div>
        </div>
      );
    }

    // 6. NEW YEAR
    if (name.includes("new year")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
          {/* High-Fidelity AI Generated Christmas/Cyber stage background combo */}
          <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen" style={{ backgroundImage: "url('/campaigns/default_banner.png')" }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/80 via-transparent to-black/95" />
          
          {/* Champagne bokeh bubbles floating */}
          <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-20">
            <svg className="w-full h-full text-yellow-400 fill-currentColor" viewBox="0 0 100 100">
              <circle cx="25" cy="50" r="2" className="animate-bounce-slow" style={{ animationDelay: '1s' }} />
              <circle cx="70" cy="60" r="2.5" className="animate-bounce-slow" style={{ animationDelay: '2s' }} />
            </svg>
          </div>
        </div>
      );
    }

    // 7. VALENTINE
    if (name.includes("valentine") || name.includes("love")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
          {/* High-Fidelity AI Generated Valentine stage backdrop */}
          <div className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-lighten" style={{ backgroundImage: "url('/campaigns/valentine_banner.png')" }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/70 via-transparent to-black/80" />
          
          {/* Layered translucent floating hearts */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full fill-current text-rose-500" viewBox="0 0 100 100">
              <path d="M12,5 C10,3 7,3 5,5 C3,7 3,10 5,12 L12,19 L19,12 C21,10 21,7 19,5 C17,3 14,3 12,5 Z" transform="translate(10, 20) scale(1.5)" />
            </svg>
          </div>
        </div>
      );
    }

    // 8. CYBER / BLACK FRIDAY / TECH / FLASH
    if (name.includes("black friday") || name.includes("cyber") || name.includes("tech") || name.includes("flash")) {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
          {/* High-Fidelity AI Generated Cyberpunk tech stage backdrop */}
          <div className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-screen animate-pulse-slow" style={{ backgroundImage: "url('/campaigns/cyber_banner.png')", animationDuration: '6s' }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/70 via-transparent to-black/95" />
          
          {/* Floating glowing circuit paths */}
          <svg className="absolute inset-0 w-full h-full opacity-15 text-indigo-500 fill-none" stroke="currentColor" strokeWidth="1">
            <path d="M 100,0 L 100,150 L 250,250 L 500,250" />
            <circle cx="500" cy="250" r="3" fill="currentColor" />
          </svg>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
        {/* High-Fidelity AI Generated Modern 3D stage backdrop fallback */}
        <div className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-screen" style={{ backgroundImage: "url('/campaigns/default_banner.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-black/95" />
        
        {/* Fine dotted geometric array matrix */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle, ${text} 1px, transparent 1px)`,
          backgroundSize: '16px 16px'
        }} />
      </div>
    );
  };

  const renderFestivalArtwork = (eventName, colors) => {
    const name = (eventName || "").toLowerCase();

    if (name.includes("bakrid") || name.includes("eid") || name.includes("ramadan") || name.includes("mubarak") || name.includes("megh") || name.includes("good")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <svg className="w-56 h-56 drop-shadow-[0_0_35px_rgba(253,224,71,0.5)] animate-pulse" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="artGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
            <path d="M30,50 A25,25 0 1,0 80,50 A20,20 0 1,1 30,50 Z" fill="url(#artGoldGradient)" />
            {/* Star */}
            <polygon points="52,30 55,37 62,37 57,42 59,49 52,44 45,49 47,42 42,37 49,37" fill="#ffffff" className="animate-bounce-slow" />
          </svg>
          <div className="text-[10px] font-black tracking-[0.25em] text-yellow-350 uppercase bg-black/45 px-4 py-1.5 rounded-full border border-yellow-300/30 backdrop-blur-md shadow-2xl">
            🌙 Mubarak Deals Live
          </div>
        </div>
      );
    }

    if (name.includes("diwali") || name.includes("deepavali")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <svg className="w-56 h-56 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="artClayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a16207" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>
              <linearGradient id="artFlameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="40%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>
            {/* Diya Clay Base */}
            <path d="M15,65 C15,80 85,80 85,65 C85,50 15,50 15,65 Z" fill="url(#artClayGradient)" />
            <path d="M15,65 C35,74 65,74 85,65 C80,60 20,60 15,65 Z" fill="#451a03" />
            {/* Flicker Flame */}
            <path d="M50,15 C56,33 58,43 50,58 C42,43 44,33 50,15 Z" fill="url(#artFlameGradient)" className="animate-flicker" style={{ transformOrigin: '50px 58px' }} />
          </svg>
          <div className="text-[10px] font-black tracking-[0.25em] text-amber-300 uppercase bg-black/45 px-4 py-1.5 rounded-full border border-amber-300/30 backdrop-blur-md shadow-2xl animate-pulse">
            🪔 Shubh Deepavali
          </div>
        </div>
      );
    }

    if (name.includes("holi")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Swirling color powders visual artwork */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-yellow-400 to-cyan-400 rounded-full blur-xl opacity-35 animate-spin-slow" />
            <svg className="w-48 h-48 drop-shadow-[0_0_35px_rgba(236,72,153,0.5)] z-10" viewBox="0 0 100 100">
              <path d="M30,30 Q50,5 70,30 T90,70 Q50,95 10,70 Z" fill="#ec4899" className="animate-pulse" />
              <path d="M40,20 Q60,45 80,20 T60,80 Q30,60 40,20 Z" fill="#eab308" opacity="0.8" />
              <path d="M20,40 Q50,60 80,40 T50,80 Z" fill="#06b6d4" opacity="0.7" />
            </svg>
          </div>
          <div className="text-[10px] font-black tracking-[0.25em] text-pink-300 uppercase bg-black/45 px-4 py-1.5 rounded-full border border-pink-300/30 backdrop-blur-md shadow-2xl">
            🎨 Festival of Colors
          </div>
        </div>
      );
    }

    if (name.includes("durga") || name.includes("puja") || name.includes("navratri")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <svg className="w-52 h-52 text-white drop-shadow-[0_0_25px_rgba(220,38,38,0.5)]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            {/* Left Eye */}
            <path d="M15,50 C30,35 45,35 60,50 C45,65 30,65 15,50 Z" strokeWidth="2.5" />
            <circle cx="37.5" cy="50" r="5" fill="currentColor" />
            {/* Right Eye */}
            <path d="M40,50 C55,35 70,35 85,50 C70,65 55,65 40,50 Z" strokeWidth="2.5" />
            <circle cx="62.5" cy="50" r="5" fill="currentColor" />
            {/* Third Eye */}
            <path d="M45,28 C50,15 50,15 55,28 C50,35 50,35 45,28 Z" strokeWidth="2" />
            <circle cx="50" cy="26" r="3.5" fill="currentColor" />
            {/* Traditional Bindu */}
            <circle cx="50" cy="38" r="4.5" fill="#dc2626" />
          </svg>
          <div className="text-[10px] font-black tracking-[0.25em] text-red-600 uppercase bg-white px-4 py-1.5 rounded-full border border-red-500/20 shadow-2xl animate-pulse">
            🕉️ Maa Durga Blessings
          </div>
        </div>
      );
    }

    if (name.includes("christmas") || name.includes("xmas")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <svg className="w-48 h-48 text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.4)] animate-bounce-slow" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50,10 L75,45 L62,45 L80,72 L20,72 L38,45 L25,45 Z" />
            <rect x="46" y="72" width="8" height="12" fill="#78350f" />
            <polygon points="50,4 53,11 44,7 56,7 47,11" fill="#f59e0b" />
          </svg>
          <div className="text-[10px] font-black tracking-[0.25em] text-emerald-300 uppercase bg-black/45 px-4 py-1.5 rounded-full border border-emerald-300/30 backdrop-blur-md shadow-2xl animate-pulse">
            🎄 Merry Christmas
          </div>
        </div>
      );
    }

    if (name.includes("new year")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <svg className="w-48 h-48" viewBox="0 0 100 100" stroke="currentColor" fill="none">
            <circle cx="50" cy="50" r="30" strokeDasharray="3,6" strokeWidth="2.5" className="text-pink-500 animate-ping" />
            <circle cx="50" cy="50" r="18" strokeDasharray="2,4" strokeWidth="1.5" className="text-yellow-400 animate-pulse" />
            <circle cx="50" cy="50" r="8" strokeWidth="1" className="text-cyan-400" />
          </svg>
          <div className="text-[10px] font-black tracking-[0.25em] text-pink-300 uppercase bg-black/45 px-4 py-1.5 rounded-full border border-pink-300/30 backdrop-blur-md shadow-2xl">
            ✨ Happy New Year
          </div>
        </div>
      );
    }

    if (name.includes("valentine") || name.includes("love")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <svg className="w-44 h-44 fill-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <div className="text-[10px] font-black tracking-[0.25em] text-rose-300 uppercase bg-black/45 px-4 py-1.5 rounded-full border border-rose-300/30 backdrop-blur-md shadow-2xl">
            💖 Valentine Special
          </div>
        </div>
      );
    }

    if (name.includes("black friday") || name.includes("cyber") || name.includes("tech") || name.includes("flash")) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 z-10 animate-in zoom-in duration-500 w-full relative">
          <svg className="w-44 h-44 text-indigo-400 drop-shadow-[0_0_30px_rgba(129,140,248,0.6)] animate-bounce-slow" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="60,10 25,60 50,60 40,90 75,40 50,40" />
          </svg>
          <div className="text-[10px] font-black tracking-[0.25em] text-indigo-300 uppercase bg-black/45 px-4 py-1.5 rounded-full border border-indigo-300/30 backdrop-blur-md shadow-2xl animate-pulse">
            ⚡ Cyber Flash Sale
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="w-64 h-64 border border-white/10 rounded-[2.5rem] bg-black/30 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-3 shadow-2xl z-10">
        <Sparkles className="w-12 h-12 animate-bounce" style={{ color: colors.accent || '#ffd700' }} />
        <span className="text-xs font-black uppercase tracking-widest text-white">MEGA LIVE CELEBRATION</span>
        <span className="text-[10px] font-medium opacity-50 uppercase text-slate-400">Unbelievable deals live now!</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--primary)]/30">
      {activeCampaign && (
        <style>{`
          :root {
            --primary: ${colors.bg || '#7a0c02'};
            --primary-glow: ${colors.accent || '#ffd700'}33;
          }
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes flicker {
            0%, 100% { opacity: 0.9; transform: scale(1) rotate(-1deg); }
            50% { opacity: 1; transform: scale(1.04) rotate(2deg); }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.25; }
            50% { opacity: 0.55; }
          }
          .animate-spin-slow {
            animation: spin-slow 22s linear infinite;
          }
          .animate-flicker {
            animation: flicker 2s ease-in-out infinite;
          }
          .animate-bounce-slow {
            animation: bounce-slow 4.5s ease-in-out infinite;
          }
          .animate-pulse-slow {
            animation: pulse-slow 3.5s ease-in-out infinite;
          }
        `}</style>
      )}
      
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[5%] left-[-15%] w-[45%] h-[45%] bg-[var(--primary)]/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-15%] w-[45%] h-[45%] bg-[var(--accent)]/10 blur-[140px] rounded-full" />
      </div>

      {/* 🌟 1. DYNAMIC FESTIVAL CAMPAIGN HERO WIDGET */}
      <AnimatePresence>
        {activeCampaign && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={handleCampaignClick}
            className="w-full relative py-6 px-4 text-center cursor-pointer overflow-hidden border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${activeCampaign.theme_colors?.bg || '#6b1111'}dd, ${activeCampaign.theme_colors?.accent || '#1c0c0c'}ee)`,
              color: activeCampaign.theme_colors?.text || '#ffffff'
            }}
          >
            {/* Glowing Festival Ambient Circle */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 blur-2xl rounded-full animate-pulse" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 blur-2xl rounded-full" />

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 border border-white/20 rounded-xl animate-bounce">
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/20 rounded-md">
                    📢 {activeCampaign.event_name} Active
                  </span>
                  <h4 className="text-xl font-black uppercase tracking-tight mt-1">{activeCampaign.title}</h4>
                  <p className="text-xs opacity-85 font-medium">{activeCampaign.banner_text}</p>
                </div>
              </div>

              {/* Countdown & CTA */}
              <div className="flex flex-wrap items-center gap-4">
                {campaignTimeLeft && (
                  <div className="flex items-center gap-2 bg-black/40 border border-white/20 px-3.5 py-1.5 rounded-xl text-xs font-mono font-black text-amber-300">
                    <Clock size={13} className="animate-spin-slow" />
                    <span>CLOSING IN: {campaignTimeLeft}</span>
                  </div>
                )}
                
                <button 
                  onClick={handleCampaignClick}
                  className="px-5 py-2 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition shadow-lg flex items-center gap-2"
                >
                  {activeCampaign.cta_button_text} <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK CATEGORIES NAV STRIP */}
      <div className={`bg-[var(--bg)]/90 border-b border-[var(--border)] overflow-x-auto scrollbar-hide sticky top-[4.5rem] md:top-[72px] z-40 backdrop-blur-xl transition-all duration-300 ${isScrolled ? 'py-1 shadow-md' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between gap-6 md:gap-8 min-w-max">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/products?category=${cat.name}`} 
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className={`rounded-full overflow-hidden border border-[var(--border)] group-hover:border-[var(--primary)] transition-all bg-[var(--card)] shadow-sm group-hover:scale-110 flex items-center justify-center ${isScrolled ? 'w-8 h-8 p-0 border-2' : 'w-12 h-12 md:w-14 md:h-14 p-0.5'}`}>
                <img src={cat.image} className="w-full h-full object-cover rounded-full" alt={cat.name} />
              </div>
              <span className={`font-black text-[var(--text)] group-hover:text-[var(--primary)] uppercase tracking-wider transition-all ${isScrolled ? 'text-[7px] md:text-[8px] opacity-90' : 'text-[9px] md:text-[10px]'}`}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* HERO SLIDER or FESTIVAL HERO BANNER */}
      <div className={activeCampaign ? "w-full animate-in fade-in duration-550" : "container mx-auto px-4 md:px-6 pt-6 max-w-7xl animate-in fade-in duration-550"}>
        {activeCampaign ? (
          <div 
            className="relative w-full min-h-[400px] lg:min-h-[500px] overflow-hidden flex flex-col md:flex-row items-center justify-center shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] group transition-all duration-500"
          >
            {/* AI Generated Procedural Themed Background */}
            {activeCampaign.banner_image ? (
              <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" style={{ backgroundColor: colors.bg || '#0f0f13' }}>
                <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 group-hover:scale-100 transition-transform duration-10000" style={{ backgroundImage: `url('${activeCampaign.banner_image}')` }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${colors.bg || '#0f0f13'}ff 0%, ${colors.bg || '#0f0f13'}aa 40%, ${colors.bg || '#0f0f13'}40 100%)` }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${colors.bg || '#0f0f13'}ff 0%, transparent 20%)` }} />
              </div>
            ) : (
              renderFestivalBackground(activeCampaign.event_name, colors)
            )}

            {/* Ambient glowing circles */}
            <div className="absolute top-0 right-1/4 w-[50%] h-[50%] bg-white/10 blur-[150px] rounded-full pointer-events-none -z-10 group-hover:scale-125 transition-transform duration-[3000ms]" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="container mx-auto px-4 md:px-12 py-8 lg:py-12 flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-16 relative z-10 w-full max-w-[90rem]">
              {/* Left Column: Campaign descriptions & CTA */}
              <div className="flex-1 space-y-8 text-left max-w-2xl relative">
                
                {/* Glowing Sale Badge */}
                <div className="w-fit inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-xl border mb-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] animate-pulse"
                     style={{ backgroundColor: `${colors.text}15`, borderColor: `${colors.text}30` }}>
                  <div className="relative flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-red-500 animate-[ping_1.5s_infinite]" />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.25em] uppercase drop-shadow-md" style={{ color: colors.text || '#ffffff' }}>SALE IS LIVE</span>
                </div>

                {/* Massive 3D Title */}
                <h1 
                  className="text-4xl md:text-6xl lg:text-[5rem] font-black tracking-tighter leading-[0.85] uppercase italic drop-shadow-2xl transform -skew-x-6"
                  style={{ 
                    color: colors.text || '#ffffff',
                    textShadow: `4px 4px 0 ${colors.accent || '#ffd700'}, 6px 6px 0 rgba(0,0,0,0.7)`
                  }}
                >
                  {activeCampaign.title}
                </h1>
                
                {/* Glowing Tagline */}
                <p 
                  className="text-xl md:text-3xl font-black tracking-tight"
                  style={{ color: colors.accent || '#ffd700', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                >
                  {activeCampaign.tagline}
                </p>
                <p 
                  className="text-sm md:text-lg opacity-90 leading-relaxed font-bold max-w-lg"
                  style={{ color: colors.text || '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                >
                  {activeCampaign.banner_text}
                </p>

                {/* Countdown Timer Block - Glassmorphism */}
                {campaignTimeLeft && (
                  <div className="flex flex-col gap-3 pt-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2" style={{ color: colors.text || '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      <Clock size={14} className="animate-spin-slow" /> Ends In
                    </span>
                    <div className="flex gap-4">
                      {(() => {
                        const parts = campaignTimeLeft.split(":");
                        const labels = ["DAYS", "HRS", "MINS", "SECS"];
                        return parts.map((part, idx) => {
                          const val = part.trim().split(" ")[0] || "0";
                          const label = labels[idx] || "UNIT";
                          return (
                            <div 
                              key={idx} 
                              className="relative overflow-hidden backdrop-blur-2xl border px-3 md:px-5 py-3 md:py-4 rounded-3xl text-center min-w-[70px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] group-hover:-translate-y-1 transition-transform"
                              style={{ 
                                background: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.1))`,
                                borderColor: `${colors.accent || '#ffd700'}50`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 30px rgba(0,0,0,0.5)`
                              }}
                            >
                              <span className="block text-3xl md:text-5xl font-black font-mono tracking-tighter" style={{ color: colors.text || '#ffffff', textShadow: `0 2px 10px rgba(0,0,0,0.8)` }}>{val.padStart(2, '0')}</span>
                              <span className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-1 opacity-80" style={{ color: colors.text || '#ffffff', textShadow: `0 1px 4px rgba(0,0,0,0.8)` }}>{label}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* CTA Button Row */}
                <div className="pt-4 flex flex-wrap gap-4 items-center relative z-20">
                  <Link 
                    to="/products"
                    className="relative overflow-hidden px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3 group/btn"
                  >
                    <span className="relative z-10">{activeCampaign.cta_button_text}</span>
                    <ArrowRight size={18} className="relative z-10 group-hover/btn:translate-x-2 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 -translate-x-full group-hover/btn:animate-[shimmer_1s_infinite]" />
                  </Link>
                  <div className="text-left font-black tracking-[0.15em] uppercase text-xs leading-tight opacity-90 drop-shadow-md" style={{ color: colors.text || '#ffffff' }}>
                    <p className="flex items-center gap-1.5"><Star size={12} className="text-yellow-400" /> Free Delivery</p>
                    <p className="mt-1 flex items-center gap-1.5" style={{ color: colors.accent || '#ffd700' }}><Zap size={12} /> Instant Cashback</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Beautiful Large Dynamic Artwork Slider */}
              <div className="flex-grow lg:w-1/2 flex flex-col items-center justify-center relative z-20 min-h-[300px] md:min-h-0 w-full mt-10 md:mt-0 perspective-[1000px]">
                {activeCampaign.media_assets && activeCampaign.media_assets.length > 0 ? (
                  <div className={`relative w-full aspect-[4/3] lg:aspect-[16/10] max-w-[650px] lg:max-w-[750px] mb-8 ${
                    activeCampaign.design_theme === 'cyberpunk' ? 'rounded-none border-x-4 border-y-0 transform skew-x-[-2deg] shadow-[0_0_40px_rgba(0,255,255,0.4)]' : 
                    activeCampaign.design_theme === 'minimalist' ? 'rounded-xl border-[1px] shadow-sm' :
                    activeCampaign.design_theme === 'gold' ? 'rounded-[2rem] border-4 shadow-[0_0_50px_rgba(255,215,0,0.3)]' :
                    'rounded-[3rem] border-8 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9),_0_0_100px_20px_var(--primary-glow)]'
                  } transform rotate-y-6 rotate-x-4 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700`}
                       style={{ borderColor: activeCampaign.design_theme === 'gold' ? '#ffd700' : activeCampaign.design_theme === 'cyberpunk' ? '#0ff' : `${colors.text || '#ffffff'}20` }}>
                    
                    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeSlide}
                        initial={(() => {
                          const asset = activeCampaign.media_assets[activeSlide] || activeCampaign.media_assets[0];
                          const type = asset?.animation;
                          if (type === "slideLeft") return { x: 100, opacity: 0 };
                          if (type === "slideUp") return { y: 100, opacity: 0 };
                          if (type === "zoom") return { scale: 0.8, opacity: 0 };
                          if (type === "kenBurns") return { scale: 1.1, opacity: 0 };
                          if (type === "flip3D") return { rotateY: 90, opacity: 0 };
                          if (type === "elasticBounce") return { scale: 0 };
                          if (type === "cinematicPan") return { x: '-10%', scale: 1.1 };
                          if (type === "blurFadeIn") return { filter: 'blur(20px)', opacity: 0 };
                          return { opacity: 0 }; // fade default
                        })()}
                        animate={(() => {
                          const asset = activeCampaign.media_assets[activeSlide] || activeCampaign.media_assets[0];
                          const type = asset?.animation;
                          if (type === "slideLeft" || type === "slideUp" || type === "zoom" || type === "flip3D" || type === "blurFadeIn") return { x: 0, y: 0, scale: 1, rotateY: 0, filter: 'blur(0px)', opacity: 1 };
                          if (type === "kenBurns") return { scale: 1, opacity: 1, transition: { duration: 5 } };
                          if (type === "elasticBounce") return { scale: 1, transition: { type: "spring", stiffness: 300, damping: 10 } };
                          if (type === "cinematicPan") return { x: '0%', scale: 1, transition: { duration: 5 } };
                          return { opacity: 1, scale: 1 }; // fade default
                        })()}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full"
                      >
                        {(() => {
                          const currentAsset = activeCampaign.media_assets[activeSlide] || activeCampaign.media_assets[0];
                          if (!currentAsset) return null;
                          return currentAsset.type === "video" ? (
                            <video src={currentAsset.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={currentAsset.url} alt="Campaign Slider" className="w-full h-full object-cover" />
                          );
                        })()}
                      </motion.div>
                    </AnimatePresence>

                    {/* Slide Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                      {activeCampaign.media_assets.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                ) : activeCampaign.banner_image ? (
                  <div className="relative w-full aspect-video md:aspect-[4/3] max-w-[480px] rounded-[3rem] overflow-hidden border-8 transform rotate-y-6 rotate-x-4 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9),_0_0_100px_20px_var(--primary-glow)]"
                       style={{ borderColor: `${colors.text || '#ffffff'}20` }}>
                    <img src={activeCampaign.banner_image} alt="Campaign Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </div>
                ) : (
                  <div className="transform hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                    {renderFestivalArtwork(activeCampaign.event_name, colors)}
                  </div>
                )}

                {/* Floating Frosted Discount Card (Moved below the image completely) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="relative mt-2 w-[90%] max-w-[400px] z-30 backdrop-blur-3xl border px-6 py-4 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden group hover:-translate-y-2 transition-transform duration-500"
                  style={{ backgroundColor: `rgba(0,0,0,0.7)`, borderColor: `${colors.accent || '#ffd700'}60` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out -skew-x-12" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.25em] mb-1 drop-shadow-md">
                        {activeCampaign.category || 'Special Offers'}
                      </p>
                      <p className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                        {activeCampaign.discount_label || `${activeCampaign.discount_percentage}% OFF`}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-white/20 to-white/5 p-3 rounded-2xl border border-white/20 shadow-inner">
                      <Tag size={28} style={{ color: colors.accent || '#ffd700' }} />
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>

            {/* Global Multi-Campaign Carousel Navigation Dots */}
            {activeCampaigns && activeCampaigns.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-40 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-2xl">
                {activeCampaigns.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setGlobalCampaignIndex(i); setActiveSlide(0); }}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === globalCampaignIndex ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-1.5 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <HeroSlider />
        )}
      </div>

      <div className="container mx-auto px-4 md:px-6 pt-16 max-w-7xl space-y-16">
        {/* 📢 DYNAMIC CAMPAIGN PRODUCT DEAL GRID */}
        {activeCampaign && activeCampaign.products && activeCampaign.products.length > 0 && (
          <div className="space-y-6 pt-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div 
                className="p-2.5 rounded-2xl border flex items-center justify-center animate-bounce animate-smooth"
                style={{ backgroundColor: `${colors.accent || '#ffd700'}15`, borderColor: `${colors.accent || '#ffd700'}30` }}
              >
                <Flame className="w-5 h-5 animate-pulse" style={{ color: colors.accent || '#ffd700' }} />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text)]">
                  {activeCampaign.event_name} <span style={{ color: colors.accent || '#ffd700' }}>SPECIAL DEALS</span>
                </h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">Handpicked premium offers celebrating this occasion</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {activeCampaign.products.map((p) => (
                <ProductCard key={p.id || p._id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* 🏆 TOP SELLERS SPOTLIGHT */}
        {topRatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text)]">Top Sellers Spotlight</h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">Highest rated products in the catalog</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topRatedProducts.slice(0, 3).map((p, idx) => (
                <div key={p.id || p._id} className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-amber-550/10 via-[var(--card)] to-transparent border border-amber-500/25 p-6 flex flex-col justify-between group hover:border-[var(--primary)] transition shadow-xl h-[280px]">
                  <div className="absolute top-4 right-4 bg-amber-550/20 text-amber-500 border border-amber-500/30 rounded-lg text-[9px] font-black tracking-widest px-2.5 py-1 uppercase">
                    Rank #{idx + 1} Best Seller
                  </div>

                  <div className="flex gap-4 items-start pt-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--primary)]/[0.04] border border-[var(--border)] shrink-0 shadow-lg">
                      <img src={p.images?.[0]?.url || "/no-image.png"} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" alt={p.name} />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)]">{p.category}</span>
                      <h4 className="text-[var(--text)] font-bold text-sm truncate"><Link to={`/product/${p.id || p._id}`}>{p.name}</Link></h4>
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                        <Star size={13} fill="currentColor" className="text-amber-500 fill-amber-500" />
                        <span>{Number(p.ratings || 0).toFixed(1)} ★ ({p.review_count || 0})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-4">
                    <span className="text-xl font-black text-[var(--text)]">₹{Number(p.price || 0).toFixed(2)}</span>
                    <Link to={`/product/${p.id || p._id}`} className="px-4 py-2 bg-yellow-400 text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 hover:bg-yellow-500 transition shadow-lg flex items-center gap-1.5">
                      BUY AT ₹{Number(p.price || 0).toLocaleString("en-IN")} <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🎬 AI PRODUCT REELS SECTION — Amazon/Flipkart Style */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl">
                <Video className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text)]">AI Product Reels</h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">Hover to preview · AI-generated product campaigns</p>
              </div>
            </div>
            <Link to="/products" className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition border border-indigo-500/30 bg-indigo-600/10 px-4 py-2 rounded-xl">
              See All <ArrowRight size={12} />
            </Link>
          </div>

          {/* Horizontal scroll reel strip */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
            {rankedReels.map((reel, index) => (
              <ProductReelCard key={reel.id} reel={reel} onClick={() => handleOpenReel(reel, index)} />
            ))}
          </div>

          {/* Platform labels strip */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {['Instagram Reels', 'YouTube Ads', 'TikTok', 'Feed Ads'].map(p => (
              <span key={p} className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:border-white/30 cursor-pointer transition">
                {p}
              </span>
            ))}
            <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/40 rounded-full text-indigo-400">
              ✨ AI-Powered by BalajiMart Studio
            </span>
          </div>
        </div>

        {/* ⚡ 2. SMART DEAL OF THE DAY - REALTIME DISCOUNT ENGINE */}
        {dealOfTheDayProducts.length > 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[var(--primary)]/10 to-transparent blur-[40px] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
                  <Flame className="w-5 h-5 animate-pulse text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text)]">Smart Deals of the Day</h3>
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">Top deals dynamically prioritized by highest discount percentage in the database</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 bg-red-505/15 border border-red-500/30 px-4 py-2 rounded-2xl w-fit">
                <Clock className="w-4 h-4 text-red-500 animate-spin-slow animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text)] mr-1.5">UP TO 75% OFF • LIMITED TIME</span>
                <div className="flex items-center gap-1 font-mono text-sm font-black text-red-500">
                  <span className="bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/30">
                    {timeLeft.hours.toString().padStart(2, "0")}
                  </span>
                  <span>:</span>
                  <span className="bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/30">
                    {timeLeft.minutes.toString().padStart(2, "0")}
                  </span>
                  <span>:</span>
                  <span className="bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/30">
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dealOfTheDayProducts.map((p) => {
                const discount = p.discount_percentage || 15;
                const original = p.original_price ? Math.round(p.original_price) : Math.round(p.price / 0.75);
                const stock = p.stock || 0;

                return (
                  <div key={p.id || p._id} className="relative group bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-4 flex flex-col justify-between hover:border-[var(--primary)] transition-all duration-300 shadow-md">
                    <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[9px] px-2.5 py-1 rounded-lg tracking-widest z-10 shadow-lg shadow-red-600/20 animate-pulse flex items-center gap-1">
                      🔥 BEST DEAL • -{discount}% OFF
                    </div>
                    
                    <Link to={`/product/${p.id || p._id}`} className="block relative aspect-square overflow-hidden rounded-2xl bg-[var(--primary)]/[0.04] mb-4 border border-[var(--border)] group-hover:border-red-500/20 transition-all duration-300">
                      <img src={p.images?.[0]?.url || "/no-image.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                    </Link>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest">{p.category}</span>
                      <h4 className="text-[var(--text)] font-bold text-sm line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                        <Link to={`/product/${p.id || p._id}`}>{p.name}</Link>
                      </h4>
                      
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-[var(--text)]">{Number(p.ratings || 0).toFixed(1)} ★</span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-lg font-black text-[var(--text)]">₹{Number(p.price || 0).toFixed(2)}</span>
                        <span className="text-xs line-through opacity-50">₹{Number(original || 0).toFixed(2)}</span>
                      </div>

                      {/* Urgency Badge */}
                      {stock > 0 && stock <= 5 && (
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-wider animate-pulse flex items-center gap-1 mt-1 bg-amber-500/5 p-1 rounded-lg w-fit">
                          ⚠️ Only {stock} left in stock!
                        </p>
                      )}
                    </div>

                    <button 
                      onClick={(e) => handleQuickAdd(p, e)}
                      disabled={p.stock === 0}
                      className="mt-4 w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg"
                    >
                      <ShoppingBag size={12} /> Quick Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 3. NEW ARRIVALS CAROUSEL (Framer Motion Infinite, Fade+Slide & Shimmers) */}
        <NewArrivalSlider 
          title="Futuristic New Arrivals" 
          products={newProducts}
          loading={loading}
        />

        {/* 🕵️ 4. AI-POWERED "STILL LOOKING FOR THESE?" PERSONALIZED RECOMMENDATIONS */}
        <div className="bg-[var(--primary)]/[0.01] border border-[var(--border)] rounded-[2.5rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--border)] animate-pulse">
              <History className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Still Looking? 
                {recommendedCategory && (
                  <span className="text-[9px] bg-red-650 text-white font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-[0_0_10px_#dc2626]">
                    Recommended For You: {recommendedCategory}
                  </span>
                )}
              </h3>
              <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-0.5">
                Dynamic 48-Hour Cross-Platform Tracking Scans your Browsing Category Preferences to recommend matching products
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {recommendedProducts.slice(0, 4).map((p) => (
              <div key={p.id || p._id} className="group bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-4 flex gap-4 items-center hover:border-[var(--primary)] transition duration-300 relative shadow-md">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--primary)]/[0.04] shrink-0 border border-[var(--border)] shadow-md group-hover:scale-105 transition-transform duration-300">
                  <img src={p.images?.[0]?.url || "/no-image.png"} className="w-full h-full object-cover" alt={p.name} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[8px] font-bold text-[var(--primary)] uppercase tracking-wider block">{p.category}</span>
                  <h4 className="text-white font-bold text-xs truncate group-hover:text-[var(--primary)] transition-colors">
                    <Link to={`/product/${p.id || p._id}`}>{p.name}</Link>
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold">
                    <Star size={11} className="fill-yellow-500 text-yellow-500" />
                    <span>{Number(p.ratings || 0).toFixed(1)}</span>
                  </div>
                  <span className="text-sm font-black text-white block">₹{Number(p.price || 0).toFixed(2)}</span>
                </div>
                <Link to={`/product/${p.id || p._id}`} className="absolute bottom-4 right-4 p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full hover:bg-[var(--primary)] hover:text-white transition shadow-sm">
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 5. PROMOTIONAL SPLITS BANNERS (TECH GADGET SHOWCASE UPGRADE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Wine Red Showcase */}
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-red-950/70 to-rose-950/40 border border-[var(--border)] p-8 flex flex-col justify-between h-[290px] shadow-xl group">
            <div className="absolute top-0 right-0 w-56 h-56 bg-[var(--primary)]/10 blur-[50px] group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            <div className="space-y-3 z-10">
              <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest w-fit block animate-pulse">
                🔥 Hot Seller Highlight
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tighter leading-none">
                WINE RED <br/> FASHION SEASON
              </h3>
              <p className="text-xs opacity-60 font-medium max-w-sm">Experience handpicked luxurious apparel designs and high-fashion accessories.</p>
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-red-400">
                <Percent size={18} />
                <span className="font-mono font-black text-xl">UP TO 60% OFF</span>
              </div>
              <Link to="/products?category=Fashion" className="flex items-center gap-2 bg-white text-black font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:scale-105 transition shadow-lg">
                Explore <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Premium Tech Showcase with dynamic offer tags */}
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-950/70 to-slate-900/60 border border-[var(--border)] p-8 flex flex-col justify-between h-[290px] shadow-xl group">
            <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 blur-[50px] group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            <div className="space-y-3 z-10">
              <span className="px-3 py-1 bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded-full text-[9px] font-black uppercase tracking-widest w-fit block flex items-center gap-1.5 animate-pulse">
                <Zap size={11} className="text-indigo-400" /> MEGA TECH SALE • FLASHSALE
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tighter leading-none">
                PREMIUM TECH <br/> GADGET SHOWCASE
              </h3>
              <p className="text-xs opacity-60 font-medium max-w-sm">Explore cutting-edge headphones, smartwatches, and innovative tech accessories with Free Shipping and Special Rewards.</p>
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-indigo-400">
                <Gift size={18} className="text-indigo-400 animate-bounce" />
                <span className="font-mono font-black text-xl text-indigo-400">UP TO 50% OFF</span>
              </div>
              <Link to="/products?category=Electronics" className="flex items-center gap-2 bg-white text-black font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:scale-105 transition shadow-lg">
                Explore Tech <ArrowRight size={12} />
              </Link>
            </div>
          </div>

        </div>

        {/* 🌟 6. NEW HOMEPAGE SECTION: "BEST OFFERS FOR YOU" / BOGO / BUNDLE COMBO SHOWCASE */}
        {displayedComboProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                <Zap className="w-4 h-4 animate-bounce text-indigo-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">Best Offers For You</h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">Premium Buy One Get One offers, combo packages, and bundle savings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedComboProducts.map((p) => {
                const isBogo = p.offer_type === 'BOGO';
                const tag = isBogo ? "BUY 1 GET 1 FREE" : "MEGA COMBO OFFER";

                return (
                  <div key={p.id || p._id} className="relative group bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-4 flex flex-col justify-between hover:border-[var(--primary)] transition shadow-md">
                    <div className="absolute top-6 left-6 bg-indigo-600 text-white font-black text-[9px] px-2.5 py-1 rounded-lg tracking-widest z-10 shadow-md">
                      {tag}
                    </div>
                    
                    <Link to={`/product/${p.id || p._id}`} className="block relative aspect-square overflow-hidden rounded-2xl bg-[var(--primary)]/[0.04] mb-4 border border-[var(--border)] group-hover:scale-102 transition duration-300">
                      <img src={p.images?.[0]?.url || "/no-image.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={p.name} />
                    </Link>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{p.category}</span>
                      <h4 className="text-white font-bold text-sm truncate group-hover:text-[var(--primary)] transition-colors">
                        <Link to={`/product/${p.id || p._id}`}>{p.name}</Link>
                      </h4>
                      <span className="text-lg font-black text-white block">₹{Number(p.price || 0).toFixed(2)}</span>
                    </div>

                    <button 
                      onClick={(e) => handleQuickAdd(p, e)}
                      disabled={p.stock === 0}
                      className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40 shadow-md shadow-indigo-600/10"
                    >
                      <ShoppingBag size={12} /> Claim Offer
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🕒 RECENTLY VIEWED PRODUCTS */}
        {(loadingRecent || recentlyViewed.length > 0) && (
          <div className="space-y-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
                <History className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text)] flex items-center gap-2">
                  Recently Viewed
                  <span className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-rose-400 tracking-widest animate-pulse">
                    RECENT
                  </span>
                </h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">Products you have recently viewed on the store</p>
              </div>
            </div>

            {loadingRecent && recentlyViewed.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 opacity-60">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-3xl h-80 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recentlyViewed.map((p) => (
                  <ProductCard key={p.id || p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🌟 SUGGESTED FOR YOU */}
        {(loadingSuggestions || suggestedProducts.length > 0) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 text-green-500 rounded-2xl border border-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text)] flex items-center gap-2">
                  Suggested For You
                  <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-green-400 tracking-widest">
                    <Sparkles size={8} className="animate-pulse" /> AI SUGGESTED
                  </span>
                </h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">AI customized recommendations matched to your history</p>
              </div>
            </div>

            {loadingSuggestions && suggestedProducts.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 opacity-60">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-3xl h-80 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {suggestedProducts.map((p) => (
                  <ProductCard key={p.id || p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🌟 EXPLORE OUR CATALOG */}
        {(loadingCatalog || catalogProducts.length > 0) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text)] flex items-center gap-2">
                  Explore Our Catalog
                  <span className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-indigo-400 tracking-widest">
                    ✨ CATALOG
                  </span>
                </h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">Browse all products from our curated categories</p>
              </div>
            </div>

            {loadingCatalog && catalogProducts.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 opacity-60">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-3xl h-80 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {catalogProducts.map((p) => (
                  <ProductCard key={p.id || p._id} product={p} />
                ))}
              </div>
            )}

            {/* HYBRID LOAD MORE & PROGRESS BAR PAGINATION */}
            {totalCatalogPages > 1 && (() => {
              const viewedCount = Math.min(currentPage * 120, totalCatalogProducts);
              const progressPercent = totalCatalogProducts > 0 ? (viewedCount / totalCatalogProducts) * 100 : 0;
              return (
                <div className="flex flex-col items-center gap-3.5 mt-16 mb-8 w-full max-w-md mx-auto p-6 glass border border-[hsla(var(--glass-border))] rounded-3xl shadow-xl">
                  <span className="text-xs text-[var(--text)]/60 font-black uppercase tracking-wider">
                    You've viewed <span className="text-white font-black">{viewedCount}</span> of{" "}
                    <span className="text-[var(--primary)] font-black">{totalCatalogProducts}</span> products
                  </span>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-[var(--border)]/50 p-[2px]">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-rose-500 rounded-full transition-all duration-750 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {currentPage < totalCatalogPages && (
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
        )}

      </div>

      {/* 🎬 DYNAMIC FULL-SCREEN TIKTOK REELS SWIPE VIEWPORT OVERLAY */}
      <AnimatePresence>
        {activeReelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            
            {/* Close trigger */}
            <button 
              onClick={() => setActiveReelModal(null)} 
              className="absolute top-6 right-6 z-[110] p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition shadow-lg shrink-0"
            >
              <X size={20} />
            </button>

            <div className="relative w-full max-w-[380px] h-[85vh] rounded-[2.5rem] overflow-hidden border border-white/15 bg-[#09090f] flex flex-col shadow-2xl">
              
              {/* Swipe navigations inside frame */}
              <div className="absolute top-1/2 -left-14 -translate-y-1/2 flex flex-col gap-2 z-20">
                <button 
                  onClick={handlePrevReel} 
                  className="p-3 bg-[#0d0d18] border border-white/10 hover:border-indigo-500/50 text-white rounded-full transition hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                >
                  ▲
                </button>
                <button 
                  onClick={handleNextReel} 
                  className="p-3 bg-[#0d0d18] border border-white/10 hover:border-indigo-500/50 text-white rounded-full transition hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                >
                  ▼
                </button>
              </div>

              {/* Main vertical content screen */}
              <div className="relative flex-1 bg-[#09090f] overflow-hidden flex flex-col justify-end">
                {activeReelModal.video_url ? (
                  <video 
                    src={getSafeVideoUrl(activeReelModal.video_url)} 
                    autoPlay 
                    loop 
                    muted={modalMuted} 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover select-none" 
                  />
                ) : (
                  <img src={activeReelModal.image} className="absolute inset-0 w-full h-full object-cover select-none" alt="" />
                )}

                {/* Floating PIP Product Card on top of Video Loop backdrops */}
                {activeReelModal.video_url && (
                  <div className="absolute top-[18%] left-4 right-4 z-20 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 animate-scaleUp text-left pointer-events-none">
                    <img 
                      src={activeReelModal.image} 
                      className="w-14 h-14 rounded-xl object-contain bg-black/40 border border-white/10 shrink-0" 
                      alt="" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="px-1.5 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 rounded text-[7px] font-black uppercase tracking-wider inline-block">
                        {activeReelModal.category}
                      </span>
                      <h4 className="text-[10px] font-black text-white truncate mt-0.5 leading-tight">{activeReelModal.title}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-emerald-405 bg-emerald-500/10 px-1 py-0.2 rounded">
                          {activeReelModal.price}
                        </span>
                        <span className="text-[8px] text-white/50">{activeReelModal.discount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Product Image on top of Video Loop backdrops */}
                {activeReelModal.video_url && (() => {
                  const catKey = getReelCategoryKey(activeReelModal);
                  
                  // Define overlay classes matching AIVideoStudio.jsx layouts
                  let containerClass = "w-full h-full flex items-center justify-center p-4 relative z-10 pointer-events-none";
                  let imageClass = "max-w-[80%] max-h-[80%] object-contain rounded-[1.5rem] drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]";
                  
                  if (catKey === 'fashion') {
                    // Overlay dress directly onto model's body
                    containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                    imageClass = "absolute max-w-[42%] max-h-[42%] top-[34%] left-[28%] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-[2000ms] animate-pulse";
                  } else if (catKey === 'cosmetics') {
                    // Overlay cosmetics float near makeup hand
                    containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                    imageClass = "absolute max-w-[28%] max-h-[28%] bottom-[30%] right-[12%] z-[10] drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] animate-bounce";
                  } else if (catKey === 'food') {
                    // Food placed on dining table
                    containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                    imageClass = "absolute max-w-[32%] max-h-[32%] bottom-[20%] left-[32%] z-[15] drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)] scale-y-[0.9] origin-bottom animate-pulse";
                  } else if (catKey === 'electronics') {
                    // Gadget aligned with unboxing hands
                    containerClass = "absolute inset-0 flex items-center justify-center pointer-events-none z-[15]";
                    imageClass = "absolute max-w-[35%] max-h-[35%] bottom-[22%] right-[30%] drop-shadow-[0_12px_25px_rgba(0,0,0,0.5)] transition-all duration-[2000ms] animate-pulse";
                  } else {
                    // General fallback - displays standard centered layout but with a cleaner frosted badge
                    containerClass = "absolute inset-x-6 top-16 bottom-48 flex items-center justify-center pointer-events-none z-[15]";
                    return (
                      <div className={containerClass}>
                        <div className="w-full h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-3 shadow-2xl flex items-center justify-center overflow-hidden">
                          <img 
                            src={getProcessedImage(activeReelModal.image)} 
                            className="max-w-full max-h-full object-contain rounded-[1.5rem] drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]" 
                            alt="" 
                            style={{ mixBlendMode: 'multiply' }}
                            onError={(e) => { 
                              e.target.onerror = null; 
                              e.target.src = activeReelModal.image; 
                            }}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className={containerClass}>
                      <img 
                        src={getProcessedImage(activeReelModal.image)} 
                        className={imageClass} 
                        alt="" 
                        style={{ mixBlendMode: 'multiply' }}
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = activeReelModal.image; 
                        }}
                      />
                    </div>
                  );
                })()}
                
                {/* Dark vignette styling gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/40 pointer-events-none" />
 
                {/* Left product detail overlay block */}
                <div className="absolute bottom-6 left-6 right-16 text-left space-y-2.5 z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 text-white rounded-md shadow" 
                      style={{ background: activeReelModal.color }}
                    >
                      {activeReelModal.category}
                    </span>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      {activeReelModal.discount}
                    </span>
                  </div>
                  <h3 className="text-white font-black text-base line-clamp-1">{activeReelModal.title}</h3>
                  <p className="text-[11px] text-slate-350 leading-relaxed font-semibold line-clamp-3">
                    "{activeReelModal.captions ? activeReelModal.captions[modalSlideIdx] : activeReelModal.caption}"
                  </p>
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        const target = products.find(p => (p.id || p._id) === activeReelModal.product_id || p.name?.toLowerCase().includes(activeReelModal.title.toLowerCase()) || p.category === activeReelModal.category);
                        if (target) {
                          dispatch(addToCart({ product: target, quantity: 1 }));
                          toast.success("Added to Cart!");
                          dispatch(toggleCart());
                          setActiveReelModal(null);
                        } else {
                          navigate("/products");
                          setActiveReelModal(null);
                        }
                      }}
                      className="px-5 py-3 bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 transition active:scale-95 shadow-lg inline-flex items-center gap-1.5 border border-white/5"
                    >
                      <ShoppingBag size={11} /> Shop - {activeReelModal.price}
                    </button>
                  </div>
                </div>

                {/* Right interaction column */}
                <div className="absolute right-4 bottom-1/4 flex flex-col gap-5 items-center z-10 text-white font-bold text-[9px]">
                  <div 
                    className="flex flex-col items-center gap-1.5 cursor-pointer group" 
                    onClick={() => setModalMuted(m => !m)}
                  >
                    <div className="p-3 bg-[#0d0d18]/70 border border-white/10 rounded-full group-hover:scale-110 group-active:scale-95 transition shadow-md flex items-center justify-center">
                      {modalMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-indigo-400" />}
                    </div>
                    <span className="uppercase tracking-widest font-mono">{modalMuted ? "Sound" : "Mute"}</span>
                  </div>

                  <div 
                    className="flex flex-col items-center gap-1.5 cursor-pointer group" 
                    onClick={() => {
                      const updated = { ...getAIRecommendationDetails().profile };
                      updated.categories[activeReelModal.category] = (updated.categories[activeReelModal.category] || 0) + 3;
                      saveShoppingProfile(updated);
                      toast.success(`Liked Reel! AI boosted relevance for ${activeReelModal.category}.`);
                    }}
                  >
                    <div className="p-3 bg-[#0d0d18]/70 border border-white/10 rounded-full group-hover:scale-110 group-active:scale-95 transition shadow-md flex items-center justify-center">
                      <Heart size={16} className="text-rose-500" fill="currentColor" />
                    </div>
                    <span className="uppercase tracking-widest font-mono">Like</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                    <div className="p-3 bg-[#0d0d18]/70 border border-white/10 rounded-full group-hover:scale-110 group-active:scale-95 transition shadow-md flex items-center justify-center">
                      <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                    </div>
                    <span className="uppercase tracking-widest font-mono">Match</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

const getReelCategoryKey = (reel) => {
  if (!reel) return 'general';
  const cat = (reel.category || '').toLowerCase();
  const title = (reel.title || '').toLowerCase();
  if (cat.includes('fashion') || cat.includes('cloth') || cat.includes('apparel') || title.includes('shirt') || title.includes('tshirt') || title.includes('jeans') || title.includes('dress') || title.includes('jacket') || title.includes('suit') || title.includes('saree') || title.includes('pajama')) {
    return 'fashion';
  }
  if (cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('makeup') || cat.includes('personal') || title.includes('lipstick') || title.includes('cream') || title.includes('tint') || title.includes('gloss') || title.includes('shampoo') || title.includes('soap')) {
    return 'cosmetics';
  }
  if (cat.includes('food') || cat.includes('grocery') || cat.includes('drink') || cat.includes('snack') || title.includes('cookie') || title.includes('juice') || title.includes('snack') || title.includes('chips') || title.includes('tea') || title.includes('coffee') || title.includes('food') || title.includes('fryer') || title.includes('kitchen')) {
    return 'food';
  }
  if (cat.includes('electronic') || cat.includes('mobile') || cat.includes('laptop') || cat.includes('gadget') || cat.includes('tech') || title.includes('phone') || title.includes('earphone') || title.includes('headphone') || title.includes('watch') || title.includes('camera') || title.includes('mouse') || title.includes('keyboard')) {
    return 'electronics';
  }
  return 'general';
};

const getProcessedImage = (url) => {
  if (!url) return '';
  const cloudName = "dftpcmc7l";
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/e_background_removal/");
    }
    return url;
  }
  return `https://res.cloudinary.com/${cloudName}/image/fetch/e_background_removal/${encodeURIComponent(url)}`;
};

const getSafeVideoUrl = (url) => {
  if (!url) return '';
  const u = String(url).toLowerCase();
  if (u.includes('mixkit.co') || u.includes('movie.mp4') || u.includes('w3schools') || u.includes('oceans.mp4') || u.includes('trailer_hd.mp4') || u.includes('mov_bbb.mp4')) {
    if (u.includes('young-woman-smiling-broadly') || u.includes('fashion') || u.includes('runway') || u.includes('saree') || u.includes('pajama') || u.includes('dress') || u.includes('suit') || u.includes('garment')) {
      return 'https://video.wixstatic.com/video/c9f0be_58b128bbe3f345a7b73046d88501a18e/1080p/mp4/file.mp4';
    }
    if (u.includes('applying-lip-gloss') || u.includes('makeup') || u.includes('beauty') || u.includes('lipstick') || u.includes('mirror') || u.includes('cosmetic')) {
      return 'https://video.wixstatic.com/video/550f4d_fabf39995ffe4e9f9e1da4c808af2d1e/1080p/mp4/file.mp4';
    }
    if (u.includes('vegetables-chopping') || u.includes('food') || u.includes('eating') || u.includes('cooking') || u.includes('chef') || u.includes('grocery') || u.includes('cookie') || u.includes('fryer') || u.includes('kitchen')) {
      return 'https://video.wixstatic.com/video/a5e29c_7e1fe25289d6445fa3b7b936f73621a8/480p/mp4/file.mp4';
    }
    if (u.includes('unboxing') || u.includes('smartphone') || u.includes('hands-of-a-man') || u.includes('office') || u.includes('tech') || u.includes('laptop') || u.includes('headphone') || u.includes('phone') || u.includes('electronic')) {
      return 'https://video.wixstatic.com/video/52bd90_1323700cec5f4de1872921299e0db601/1080p/mp4/file.mp4';
    }
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }
  return url;
};

export default Index;