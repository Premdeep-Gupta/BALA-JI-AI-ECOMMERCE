import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Undo2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // ✅ ADD useNavigate
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

import { toggleCart } from "../../store/slices/popupSlice";
import {
  increaseQty,
  decreaseQty,
  removeFromCart,
  updateQuantity,
} from "../../store/slices/cartSlice";

const CartSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // ✅ ADD

  const cart = useSelector((state) => state.cart.cart || []);
  const isOpen = useSelector((state) => state.popup.isCartOpen);

  const [lastRemoved, setLastRemoved] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const formatPrice = (num) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (item.product?.price || 0) * (item.quantity || 0),
    0
  );

  let discount = 0;
  if (appliedCoupon === "SAVE10") discount = subtotal * 0.1;
  if (appliedCoupon === "SAVE20") discount = subtotal * 0.2;

  const deliveryCharge = subtotal > 499 ? 0 : 40;
  const total = subtotal - discount + deliveryCharge;

  const inc = (id) => dispatch(increaseQty(id));
  const dec = (id) => dispatch(decreaseQty(id));

  const remove = (item) => {
    dispatch(removeFromCart(item.product.id));
    setLastRemoved(item);
    toast.error("Removed from cart");
    setTimeout(() => setLastRemoved(null), 5000);
  };

  const undoRemove = () => {
    if (lastRemoved) {
      dispatch(
        updateQuantity({
          id: lastRemoved.product.id,
          quantity: lastRemoved.quantity,
        })
      );
      toast.success("Item restored");
      setLastRemoved(null);
    }
  };

  const setQty = (id, value) => {
    if (value < 1) return;
    dispatch(updateQuantity({ id, quantity: Number(value) }));
  };

  const handleDragEnd = (info, item) => {
    if (info.offset.x < -120) remove(item);
  };

  const applyCoupon = () => {
    if (coupon === "SAVE10" || coupon === "SAVE20") {
      setAppliedCoupon(coupon);
      toast.success(`Coupon ${coupon} applied`);
    } else {
      toast.error("Invalid coupon");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCoupon("");
    toast("Coupon removed");
  };

  // ✅ FIX: Checkout navigation
  const handleCheckout = () => {
    dispatch(toggleCart()); // close sidebar
    navigate("/checkout", {
      state: { cart, total, subtotal, discount, deliveryCharge },
    });
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
            onClick={() => dispatch(toggleCart())}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 120 }}
        className="fixed top-0 right-0 h-full w-[360px] z-50 flex flex-col text-white 
        backdrop-blur-xl border-l border-white/10 shadow-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(40,0,20,0.7), rgba(10,0,10,0.95))",
        }}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="font-bold text-lg">
            🛒 Cart ({totalItems})
          </h2>
          <X
            className="cursor-pointer hover:text-red-400"
            onClick={() => dispatch(toggleCart())}
          />
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center mt-20 opacity-70">
              <ShoppingBag size={70} className="mx-auto mb-3" />
              <p className="mb-4">Your cart is empty</p>

              <Link
                to="/products"
                onClick={() => dispatch(toggleCart())}
                className="inline-block px-5 py-2 rounded-lg font-medium 
                bg-gradient-to-r from-pink-600 to-red-500 
                hover:scale-105 transition"
              >
                Browse Products 🛍️
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.product.id}
                className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
              >
                {/* ✅ IMAGE FIX */}
                <img
                  src={
                    item.product?.image ||
                    item.product?.images?.[0]?.url ||
                    "https://via.placeholder.com/80"
                  }
                  className="w-16 h-16 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <p className="font-medium line-clamp-1">
                    {item.product.name}
                  </p>
                  <p className="text-pink-300 text-sm">
                    ₹{formatPrice(item.product.price)}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => dec(item.product.id)}>
                      <Minus size={14} />
                    </button>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        setQty(item.product.id, e.target.value)
                      }
                      className="w-10 text-center text-black rounded"
                    />

                    <button onClick={() => inc(item.product.id)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <Trash2 onClick={() => remove(item)} />
              </motion.div>
            ))
          )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-white/10 space-y-3 bg-black/30">

            <div className="text-sm space-y-1">
              <p className="flex justify-between">
                <span>Total</span>
                <span>₹{formatPrice(total)}</span>
              </p>
            </div>

            {/* ✅ UPDATED BUTTON */}
            <button
              onClick={handleCheckout}
              className="block w-full text-center py-3 rounded-xl font-semibold 
              bg-gradient-to-r from-pink-600 to-red-500 hover:scale-105 transition"
            >
              Proceed to Checkout ({totalItems})
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default CartSidebar;