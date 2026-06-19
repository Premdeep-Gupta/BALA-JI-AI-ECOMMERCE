import React, { useState } from "react";
import { Star, Heart, ShoppingCart, Zap, Eye, Scale } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../store/slices/cartSlice";
import { toggleWishlist } from "../../store/slices/wishlistSlice";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { secureUrl } from "../../utils/urlHelper";

const ProductCard = ({ product, isList }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { wishlistItems } = useSelector(
    (state) => state.wishlist || { wishlistItems: [] }
  );

  const productId = product?.id || product?._id;

  const isWishlisted = wishlistItems?.some((item) => {
    const itemId = item.id || item._id;
    return itemId === productId && productId !== undefined;
  });

  // ─── Image parsing ───────────────────────────────────────────────
  const getImages = () => {
    if (!product.images) return [];
    try {
      const parsed = typeof product.images === "string"
        ? JSON.parse(product.images)
        : product.images;
      return Array.isArray(parsed)
        ? parsed.map(img => typeof img === "string" ? { url: secureUrl(img) } : { ...img, url: secureUrl(img?.url) })
        : [];
    } catch {
      return [];
    }
  };

  const images = getImages();
  const [hoveredImg, setHoveredImg] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // ─── Computed values ─────────────────────────────────────────────
  const originalPrice =
    product.discount_percentage > 0
      ? Number(
          product.original_price ||
            Number(product.price) /
              (1 - Number(product.discount_percentage) / 100)
        )
      : null;

  const isNew =
    new Date() - new Date(product.createdAt) < 30 * 24 * 60 * 60 * 1000;
  const isTopRated = Number(product.ratings) >= 4.5;
  const isOutOfStock = !product.stock || product.stock === 0;
  const isLimited = product.stock > 0 && product.stock <= 5;

  // ─── Handlers ────────────────────────────────────────────────────
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success("Added to Cart!");
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    dispatch(addToCart({ product, quantity: 1 }));
    navigate("/cart");
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product));
    toast.success(isWishlisted ? "Removed from Wishlist" : "Added to Wishlist!");
  };

  const handleCompareAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const existing = JSON.parse(localStorage.getItem("ai_compare_queue")) || [];
      const alreadyAdded = existing.some(p => p.id === productId || p._id === productId);
      
      if (alreadyAdded) {
        const updated = existing.filter(p => p.id !== productId && p._id !== productId);
        localStorage.setItem("ai_compare_queue", JSON.stringify(updated));
        toast.info("Removed from compare list");
      } else {
        if (existing.length >= 3) {
          toast.warning("You can compare a maximum of 3 products!");
          return;
        }
        const toAdd = {
          id: productId,
          name: product.name,
          image: images?.[0]?.url || product.image,
          price: product.price,
          ratings: product.ratings,
          category: product.category,
          stock: product.stock,
          offer_type: product.offer_type,
        };
        localStorage.setItem("ai_compare_queue", JSON.stringify([...existing, toAdd]));
        toast.success("Added to Compare AI Queue!");
      }
    } catch {
      toast.error("Failed to update compare list");
    }
  };

  if (isList) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setHoveredImg(0); }}
        className="group relative flex flex-col sm:flex-row bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[var(--primary)]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)] cursor-pointer w-full"
        style={{ willChange: "transform, box-shadow" }}
      >
        {/* Left side: Image container */}
        <Link to={`/product/${productId}`} className="relative block w-full sm:w-60 shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)]">
          <div className="relative w-full bg-white overflow-hidden aspect-square">
            <AnimatePresence mode="wait">
              <motion.img
                key={hoveredImg}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: isHovered ? 1.08 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={images?.[hoveredImg]?.url || "/no-image.png"}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-contain p-4 transition-transform duration-700"
              />
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

            {/* DISCOUNT RIBBON */}
            {product.discount_percentage > 0 && (
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-green-600 text-white font-black text-[11px] px-2.5 py-1 leading-none tracking-wide" style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)" }}>
                  {product.discount_percentage}% OFF
                </div>
              </div>
            )}

            {/* BADGES */}
            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 items-end">
              {(product.matchPct || product.matchPercentage) && (
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider shadow-md flex items-center gap-0.5 animate-pulse">
                  ✨ {product.matchPct || product.matchPercentage}% MATCH
                </span>
              )}
              {isNew && (
                <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest shadow-md">
                  NEW
                </span>
              )}
              {isTopRated && (
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest shadow-md flex items-center gap-0.5">
                  <Zap size={8} fill="currentColor" /> HOT
                </span>
              )}
            </div>

            {/* COMPARE QUEUE BUTTON */}
            <motion.button
              onClick={handleCompareAdd}
              whileTap={{ scale: 0.85 }}
              className="absolute bottom-14 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shadow-md bg-white/90 border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100"
              title="Compare Specs"
            >
              <Scale size={15} />
            </motion.button>

            {/* WISHLIST BUTTON */}
            <motion.button
              onClick={handleWishlist}
              whileTap={{ scale: 0.85 }}
              className={`absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shadow-md ${
                isWishlisted
                  ? "bg-red-500 border-red-500 text-white shadow-red-500/30"
                  : "bg-white/90 border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
              }`}
              title="Wishlist"
            >
              <Heart size={15} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2} />
            </motion.button>

            {/* QUICK VIEW */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-3 left-3 z-10"
                >
                  <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[9px] font-black px-2.5 py-1.5 rounded-full shadow-md border border-gray-200 tracking-wider">
                    <Eye size={10} /> QUICK VIEW
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Out of Stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                <span className="bg-gray-800 text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-lg">
                  OUT OF STOCK
                </span>
              </div>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setHoveredImg(i)}
                    className={`transition-all duration-300 rounded-full ${
                      hoveredImg === i ? "w-4 h-1.5 bg-[var(--primary)]" : "w-1.5 h-1.5 bg-gray-400/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Right side: Info and Action Buttons */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <Link to={`/product/${productId}`} className="block space-y-2.5">
            {/* Category + Rating */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-[0.18em] text-[var(--primary)] uppercase truncate max-w-[60%]">
                {product.category || "General"}
              </span>
              <div className="flex items-center gap-1 bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-black leading-none shrink-0">
                <span>{product.ratings ? Number(product.ratings).toFixed(1) : "0.0"}</span>
                <Star size={8} fill="currentColor" />
              </div>
            </div>

            {/* Product Name */}
            <h3 className="text-[17px] font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-300 leading-snug">
              {product.name}
            </h3>

            {/* Product Description */}
            <p className="text-xs text-[var(--text)]/60 line-clamp-2 leading-relaxed font-medium">
              {product.description || "Discover premium quality and exceptional craftsmanship with this authentic Balaji Mart selection."}
            </p>

            {/* Price Row */}
            <div className="flex items-center gap-2.5 flex-wrap pt-1.5">
              <span className="text-[22px] font-black text-white tracking-tight leading-none">
                ₹{Number(product.price || 0).toLocaleString("en-IN")}
              </span>
              {originalPrice && (
                <span className="text-xs text-[var(--text)]/40 line-through font-medium">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
              {product.discount_percentage > 0 && (
                <span className="text-xs font-black text-green-500 leading-none">
                  {product.discount_percentage}% off
                </span>
              )}
            </div>

            {/* Stock status */}
            <div>
              {isOutOfStock ? (
                <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider">
                  Out of Stock
                </span>
              ) : isLimited ? (
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-wider">
                  Only {product.stock} left!
                </span>
              ) : (
                <span className="text-[10px] text-green-500 font-black uppercase tracking-wider">
                  In Stock
                </span>
              )}
            </div>
          </Link>

          {/* Action buttons (horizontal row in List View) */}
          <div className="flex gap-4 mt-6 border-t border-[var(--border)] pt-4">
            <motion.button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              whileTap={{ scale: 0.97 }}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              <ShoppingCart size={13} strokeWidth={2.5} />
              ADD TO CART
            </motion.button>

            <motion.button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              whileTap={{ scale: 0.97 }}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              <Zap size={12} fill="currentColor" strokeWidth={0} />
              BUY AT ₹{Number(product.price || 0).toLocaleString("en-IN")}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setHoveredImg(0); }}
      className="group relative flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[var(--primary)]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)] cursor-pointer"
      style={{ willChange: "transform, box-shadow" }}
    >

      {/* ══════════════════════════════════════════
          IMAGE AREA — Amazon/Flipkart Premium Style
          ══════════════════════════════════════════ */}
      <Link to={`/product/${productId}`} className="block relative">

        {/* White product image container */}
        <div className="relative w-full bg-white overflow-hidden" style={{ aspectRatio: "1 / 1" }}>

          {/* Main product image with zoom */}
          <AnimatePresence mode="wait">
            <motion.img
              key={hoveredImg}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: isHovered ? 1.08 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              src={images?.[hoveredImg]?.url || "/no-image.png"}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain p-4 transition-transform duration-700"
            />
          </AnimatePresence>

          {/* ── Subtle gradient overlay at bottom ── */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

          {/* ── DISCOUNT RIBBON (top-left) ── */}
          {product.discount_percentage > 0 && (
            <div className="absolute top-0 left-0 z-10">
              <div className="relative">
                <div
                  className="bg-green-600 text-white font-black text-[11px] px-2.5 py-1 leading-none tracking-wide"
                  style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)" }}
                >
                  {product.discount_percentage}% OFF
                </div>
              </div>
            </div>
          )}

          {/* ── BADGES (top-right) ── */}
          <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 items-end">
            {(product.matchPct || product.matchPercentage) && (
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider shadow-md flex items-center gap-0.5 animate-pulse">
                ✨ {product.matchPct || product.matchPercentage}% MATCH
              </span>
            )}
            {isNew && (
              <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest shadow-md">
                NEW
              </span>
            )}
            {isTopRated && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest shadow-md flex items-center gap-0.5">
                <Zap size={8} fill="currentColor" /> HOT
              </span>
            )}
          </div>

          {/* ── COMPARE QUEUE BUTTON ── */}
          <motion.button
            onClick={handleCompareAdd}
            whileTap={{ scale: 0.85 }}
            className="absolute bottom-14 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shadow-md bg-white/90 border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100"
            title="Compare Specs"
          >
            <Scale size={15} />
          </motion.button>

          {/* ── WISHLIST BUTTON ── */}
          <motion.button
            onClick={handleWishlist}
            whileTap={{ scale: 0.85 }}
            className={`absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shadow-md ${
              isWishlisted
                ? "bg-red-500 border-red-500 text-white shadow-red-500/30"
                : "bg-white/90 border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
            }`}
            title="Wishlist"
          >
            <Heart size={15} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2} />
          </motion.button>

          {/* ── QUICK VIEW (center, on hover) ── */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-3 left-3 z-10"
              >
                <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[9px] font-black px-2.5 py-1.5 rounded-full shadow-md border border-gray-200 tracking-wider">
                  <Eye size={10} /> QUICK VIEW
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Out of Stock overlay ── */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <span className="bg-gray-800 text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-lg">
                OUT OF STOCK
              </span>
            </div>
          )}

          {/* ── Multi-image dot indicators ── */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setHoveredImg(i)}
                  onClick={(e) => { e.preventDefault(); setHoveredImg(i); }}
                  className={`transition-all duration-300 rounded-full ${
                    hoveredImg === i
                      ? "w-4 h-1.5 bg-[var(--primary)]"
                      : "w-1.5 h-1.5 bg-gray-400/60 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* ══════════════════════════════════════════
          INFO AREA
          ══════════════════════════════════════════ */}
      <Link to={`/product/${productId}`} className="block flex-1 px-4 pt-3 pb-1">

        {/* Category + Rating row */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black tracking-[0.18em] text-[var(--primary)] uppercase truncate max-w-[60%]">
            {product.category || "General"}
          </span>
          <div className="flex items-center gap-1 bg-green-700 text-white px-1.5 py-0.5 rounded text-[9px] font-black leading-none shrink-0">
            <span>{product.ratings ? Number(product.ratings).toFixed(1) : "0.0"}</span>
            <Star size={8} fill="currentColor" />
          </div>
        </div>

        {/* Product name */}
        <h3 className="text-[13px] font-bold text-[var(--text)] line-clamp-2 leading-snug min-h-[2.6rem] group-hover:text-[var(--primary)] transition-colors duration-300">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[18px] font-black text-[var(--text)] tracking-tight leading-none">
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </span>
          {originalPrice && (
            <span className="text-[11px] text-[var(--text)]/40 line-through font-medium">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          )}
          {product.discount_percentage > 0 && (
            <span className="text-[10px] font-black text-green-500 leading-none">
              {product.discount_percentage}% off
            </span>
          )}
        </div>

        {/* Stock status */}
        <div className="mt-1.5 mb-2">
          {isOutOfStock ? (
            <span className="text-[9px] text-rose-500 font-black uppercase tracking-wider">
              Out of Stock
            </span>
          ) : isLimited ? (
            <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider">
              Only {product.stock} left!
            </span>
          ) : (
            <span className="text-[9px] text-green-500 font-black uppercase tracking-wider">
              In Stock
            </span>
          )}
        </div>
      </Link>

      {/* ══════════════════════════════════════════
          ACTION BUTTONS — Flipkart style
          ══════════════════════════════════════════ */}
      <div className="flex gap-0 border-t border-[var(--border)]">
        <motion.button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-widest bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ShoppingCart size={13} strokeWidth={2.5} />
          ADD TO CART
        </motion.button>

        <motion.button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
        >
          <Zap size={12} fill="currentColor" strokeWidth={0} />
          BUY AT ₹{Number(product.price || 0).toLocaleString("en-IN")}
        </motion.button>
      </div>

    </motion.div>
  );
};

export default ProductCard;
