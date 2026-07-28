import {
  X,
  Heart,
  Trash2,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toggleWishlist } from "../../store/slices/popupSlice";
import { toggleWishlist as toggleProductWishlist } from "../../store/slices/wishlistSlice";
import { addToCart } from "../../store/slices/cartSlice";
import { toast } from "react-toastify";

const WishlistSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const wishlist = useSelector((state) => state.wishlist.wishlistItems || []);
  const isOpen = useSelector((state) => state.popup.isWishlistOpen);

  const formatPrice = (num) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);

  const handleAddToCart = (product) => {
    // cart items match format in store
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  const handleRemove = (product) => {
    dispatch(toggleProductWishlist(product));
  };

  const handleBuyNow = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    dispatch(toggleWishlist()); // close wishlist drawer
    navigate("/cart");
  };

  return (
    <>
      {/* OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black backdrop-blur-sm"
            onClick={() => dispatch(toggleWishlist())}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="fixed top-0 right-0 h-full w-[360px] z-50 flex flex-col text-white 
            backdrop-blur-xl border-l border-white/10 shadow-2xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(30,5,15,0.85), rgba(10,2,8,0.98))",
            }}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h2 className="font-black text-md flex items-center gap-2 text-white">
                <Heart size={18} className="fill-red-500 text-red-500" /> Wishlist ({wishlist.length})
              </h2>
              <button 
                onClick={() => dispatch(toggleWishlist())}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>

            {/* ITEMS LIST */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center mt-24 opacity-75 space-y-4">
                  <Heart size={64} className="mx-auto text-slate-500 stroke-1 animate-pulse" />
                  <div>
                    <p className="font-bold text-sm text-slate-350">Your Wishlist is empty</p>
                    <p className="text-[10px] text-slate-500 mt-1">Add items you love to keep track of them!</p>
                  </div>

                  <Link
                    to="/products"
                    onClick={() => dispatch(toggleWishlist())}
                    className="inline-block px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider
                    bg-gradient-to-r from-red-600 to-rose-650 hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    Browse Products 🛍️
                  </Link>
                </div>
              ) : (
                wishlist.map((product) => {
                  const pImage = product.image || product.images?.[0]?.url || "https://via.placeholder.com/80";

                  return (
                    <motion.div
                      key={product._id || product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all duration-300 flex gap-3 shadow-md"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={pImage}
                        alt={product.name}
                        className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-white truncate group-hover:text-red-400 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-[10px] opacity-50 mt-0.5">{product.category}</p>
                        </div>
                        <p className="text-red-400 text-xs font-black">
                          ₹{formatPrice(product.price)}
                        </p>
                      </div>

                      {/* Side Actions Column */}
                      <div className="flex flex-col justify-between items-end shrink-0 pl-1">
                        <button
                          onClick={() => handleRemove(product)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white/5 transition"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="p-1.5 bg-orange-450/20 hover:bg-orange-450/30 rounded-lg text-orange-400 transition active:scale-90"
                            title="ADD TO CART"
                          >
                            <ShoppingCart size={12} />
                          </button>
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="p-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-black transition active:scale-90"
                            title={`BUY AT ₹${formatPrice(product.price)}`}
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* FOOTER */}
            {wishlist.length > 0 && (
              <div className="p-4 border-t border-white/10 bg-black/40 space-y-3">
                <button
                  onClick={() => {
                    dispatch(toggleWishlist());
                    navigate("/products");
                  }}
                  className="block w-full text-center py-3 rounded-xl font-black text-xs uppercase tracking-widest
                  bg-white/5 hover:bg-white/10 text-white transition border border-white/10"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WishlistSidebar;
