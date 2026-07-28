import { useRef, useState } from "react";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/slices/cartSlice";
import { toggleCart } from "../../store/slices/popupSlice";

const ProductSlider = ({ title, products = [] }) => {
  const scrollRef = useRef(null);
  const dispatch = useDispatch();
  const [wishlist, setWishlist] = useState({});

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const formatPrice = (num) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);

  const handleMouseDown = (e) => {
    isDown.current = true;
    scrollRef.current.classList.add("cursor-grabbing");
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => (isDown.current = false);
  const handleMouseUp = () => (isDown.current = false);

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const flyToCart = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const circle = document.createElement("div");

    circle.style.position = "fixed";
    circle.style.left = rect.left + "px";
    circle.style.top = rect.top + "px";
    circle.style.width = "20px";
    circle.style.height = "20px";
    circle.style.borderRadius = "50%";
    circle.style.background = "#ff4d6d";
    circle.style.zIndex = 9999;
    circle.style.transition = "all 0.8s ease-in-out";

    document.body.appendChild(circle);

    setTimeout(() => {
      circle.style.left = window.innerWidth - 50 + "px";
      circle.style.top = "20px";
      circle.style.opacity = 0;
    }, 50);

    setTimeout(() => circle.remove(), 900);
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) return;

    const id = product._id || product.id;
    if (!product || !id) return;

    flyToCart(e);

    dispatch(addToCart({
      product: {
        ...product,
        id: id
      }
    }));

    dispatch(toggleCart());
  };

  const handleBuyNow = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) return;

    dispatch(addToCart({
      product: {
        ...product,
        id: product._id || product.id
      }
    }));

    window.location.href = "/checkout";
  };

  const handleShare = (product) => {
    navigator.clipboard.writeText(
      window.location.href + "/product/" + (product._id || product.id)
    );
    alert("Product link copied!");
  };

  const toggleWishlist = (product) => {
    const id = product._id || product.id;
    setWishlist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sortedProducts = [...products].sort(
    (a, b) => (b.ratings || 0) - (a.ratings || 0)
  );

  return (
    <section className="w-full py-10">
      <div className="flex justify-between mb-6 px-2">
        <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">{title}</h2>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex gap-6 overflow-x-auto scrollbar-hide cursor-grab"
      >
        {sortedProducts.map((product, index) => {
          const id = product._id || product.id;

          const stock = product.stock || 0;
          const isOut = stock === 0;
          const isLimited = stock > 0 && stock <= 5;

          return (
            <div key={id} className="w-80 flex-shrink-0">
              <div className="relative rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] group hover:scale-105 transition shadow-lg">

                {/* Wishlist + Share */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-2 rounded-full transition ${
                      wishlist[id] ? "bg-red-500 text-white" : "bg-[var(--primary)]/10 text-[var(--text)] border border-[var(--border)]"
                    }`}
                  >
                    <Heart
                      size={14}
                      className={wishlist[id] ? "fill-white" : ""}
                    />
                  </button>

                  <button
                    onClick={() => handleShare(product)}
                    className="p-2 bg-[var(--primary)]/10 text-[var(--text)] border border-[var(--border)] rounded-full transition"
                  >
                    <Share2 size={14} />
                  </button>
                </div>

                {/* IMAGE */}
                <div className="h-52 bg-[var(--primary)]/[0.04] relative">
                  <img
                    src={product.images?.[0]?.url || "/no-image.png"}
                    alt={product.name}
                    className={`w-full h-full object-cover transition duration-300 ${
                      isOut ? "opacity-40" : ""
                    }`}
                  />

                  {isOut && (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--text)] font-black text-xs uppercase tracking-widest bg-black/40">
                      Not Available
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-2">
                  <h3 className="text-[var(--text)] line-clamp-1 font-bold">
                    {product.name}
                  </h3>

                  {/* ⭐ UPDATED RATING BLOCK */}
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={`${id}-star-${i}`}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.ratings || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-slate-400"
                          }`}
                        />
                      ))}
                    </div>

                    <span className="text-xs text-[var(--text)]/50 font-bold">
                      ({product.review_count || 0})
                    </span>
                  </div>

                  <p className="text-[var(--primary)] font-black text-base">
                    ₹{formatPrice(product.price || 0)}
                  </p>

                  {/* STOCK */}
                  <div className="text-xs font-black uppercase tracking-wider">
                    {isOut ? (
                      <span className="text-red-500">Out of Stock</span>
                    ) : isLimited ? (
                      <span className="text-amber-500">
                        Only {stock} left 🔥
                      </span>
                    ) : (
                      <span className="text-green-500">In Stock</span>
                    )}
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-2 pt-2">
                    <button
                      disabled={isOut}
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`flex-1 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all ${
                        isOut
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-orange-400 hover:bg-orange-500 hover:scale-[1.02] active:scale-95 shadow-md shadow-orange-500/10"
                      }`}
                    >
                      ADD TO CART
                    </button>

                    <button
                      disabled={isOut}
                      onClick={(e) => handleBuyNow(product, e)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        isOut
                          ? "bg-gray-500 text-white cursor-not-allowed"
                          : "bg-yellow-400 text-black hover:bg-yellow-500 hover:scale-[1.02] active:scale-95 shadow-md"
                      }`}
                    >
                      BUY AT ₹{formatPrice(product.price || 0)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductSlider;