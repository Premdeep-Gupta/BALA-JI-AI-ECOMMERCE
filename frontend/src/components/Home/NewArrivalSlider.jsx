import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag, Heart, Eye, Sparkles } from "lucide-react";
import { useDispatch } from "react-redux";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { addToCart } from "../../store/slices/cartSlice";
import { toggleCart } from "../../store/slices/popupSlice";
import { toast } from "react-toastify";

const NewArrivalSlider = ({ title = "New Arrivals", products = [], loading = false }) => {
  const dispatch = useDispatch();
  const [wishlist, setWishlist] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  // Filter products that have valid data
  const validProducts = [...products].filter(p => p.id || p._id).slice(0, 12);
  
  // Double products to make infinite looping seamless
  const duplicatedProducts = [...validProducts, ...validProducts];

  // Quick Cart Action
  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    dispatch(addToCart({ product: { ...product, id: product._id || product.id } }));
    toast.success("Added to Cart!");
    dispatch(toggleCart());
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Framer Motion Infinite Scroll Controller
  const controls = useAnimation();
  const x = useMotionValue(0);

  // Speed: lower is faster
  const loopDuration = validProducts.length * 5;

  useEffect(() => {
    if (validProducts.length === 0 || loading) return;

    const startAnimation = async () => {
      const scrollWidth = containerRef.current ? containerRef.current.scrollWidth / 2 : 1200;
      
      await controls.start({
        x: -scrollWidth,
        transition: {
          ease: "linear",
          duration: isHovered ? 99999 : loopDuration,
          repeat: Infinity,
        }
      });
    };

    if (!isHovered) {
      startAnimation();
    } else {
      controls.stop();
    }
  }, [controls, isHovered, validProducts.length, loopDuration, loading]);

  // Render Premium Skeleton Shimmer Loading State
  if (loading || validProducts.length === 0) {
    return (
      <section className="w-full py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-white/5 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex gap-6 px-6 overflow-x-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-72 flex-shrink-0 bg-white/5 border border-white/10 rounded-[2rem] p-4 space-y-4">
              <div className="h-48 bg-white/10 rounded-2xl animate-pulse relative overflow-hidden">
                {/* Shining reflection */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-10 bg-white/10 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-red-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            ✨ {title} 
            <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-md animate-pulse uppercase flex items-center gap-1 shadow-[0_0_15px_#dc2626]">
              <Sparkles size={8} /> NEW
            </span>
          </h2>
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">Freshly curated products recently added to catalog</p>
        </div>
      </div>

      {/* Infinite Carousels Container */}
      <div 
        className="w-full overflow-hidden py-4 cursor-grab active:cursor-grabbing relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          ref={containerRef}
          animate={controls}
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -3000, right: 0 }}
          onDragStart={() => setIsHovered(true)}
          className="flex gap-6 w-max"
        >
          {duplicatedProducts.map((product, index) => {
            const id = product._id || product.id;
            const isWish = wishlist[id];
            const stock = product.stock || 0;
            const isOut = stock === 0;

            return (
              <motion.div
                key={`${id}-${index}`}
                className="w-72 flex-shrink-0 relative group"
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                // Scroll triggered fade + slide animation
                initial={{ opacity: 0.8, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                {/* Product Card Glassmorphism Layout with glowing shadows */}
                <div className="relative rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 group-hover:border-red-500/30 transition-all duration-500 p-4 shadow-xl backdrop-blur-md">
                  
                  {/* Neon border highlight glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-500/0 via-transparent to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2rem]" />
                  
                  {/* Dynamic Discount Badge */}
                  {product.discount_percentage > 0 && (
                    <div className="absolute top-6 left-6 bg-red-600 text-white font-black text-[9px] px-2.5 py-1 rounded-lg tracking-widest z-10 shadow-lg shadow-red-650/15">
                      -{product.discount_percentage}% OFF
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => toggleWishlist(id)}
                      className={`p-2 rounded-full border border-white/10 shadow-lg transition-all ${
                        isWish ? "bg-red-500 text-white" : "bg-black/50 text-white hover:bg-red-500"
                      }`}
                    >
                      <Heart size={14} className={isWish ? "fill-white" : ""} />
                    </button>
                    <Link
                      to={`/product/${id}`}
                      className="p-2 bg-black/50 border border-white/10 hover:bg-[var(--primary)] text-white rounded-full shadow-lg transition-all"
                    >
                      <Eye size={14} />
                    </Link>
                  </div>

                  {/* Image Container */}
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/5 mb-4 aspect-video shadow-md">
                    <img
                      src={product.images?.[0]?.url || "/no-image.png"}
                      alt={product.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                        isOut ? "opacity-40" : ""
                      }`}
                    />
                    {isOut && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white font-black text-[9px] tracking-widest uppercase">
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{product.category}</span>
                    <h3 className="text-white font-bold text-sm truncate">{product.name}</h3>
                    
                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-black text-slate-300">{Number(product.ratings || 0).toFixed(1)} ★</span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
                      <div className="flex flex-col">
                        <span className="text-xs opacity-50 uppercase tracking-wider text-slate-400">Price</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-white">₹{Number(product.price || 0).toFixed(2)}</span>
                          {product.original_price && (
                            <span className="text-[10px] line-through text-slate-400">₹{Number(product.original_price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isOut}
                        className="p-2.5 bg-red-650 hover:bg-red-500 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 rounded-xl text-white transition-all shadow-md shadow-red-650/15"
                        title="Add to Cart"
                      >
                        <ShoppingBag size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default NewArrivalSlider;
