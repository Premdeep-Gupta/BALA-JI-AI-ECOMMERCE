import { Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useExitIntent } from "../utils/useExitIntent";
import { X, Gift, Sparkles, Clock } from "lucide-react";

import {
    updateQuantity,
    removeFromCart,
} from "../store/slices/cartSlice";

const Cart = () => {
    const dispatch = useDispatch();

    const { cart = [] } = useSelector((state) => state.cart);
    const [pressTimer, setPressTimer] = useState(null);
    const { isShowing, close } = useExitIntent({ threshold: 20, delay: 500 });

    // AI Cart Discount states
    const [couponCode, setCouponCode] = useState("");
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [cartTimer, setCartTimer] = useState(299); // 5 minutes timer

    // Spin-the-Wheel states
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelDegree, setWheelDegree] = useState(0);
    const [spinResult, setSpinResult] = useState(null);

    const subtotal = cart.reduce(
        (sum, item) =>
            sum + (item.product?.price || 0) * (item.quantity || 0),
        0
    );

    // Dynamic calculations
    const discountAmount = subtotal * couponDiscount;
    const gst = (subtotal - discountAmount) * 0.18;
    const delivery = subtotal > 999 ? 0 : 99;
    const total = subtotal - discountAmount + gst + delivery;

    const cartItemsCount = cart.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
    );

    // Reservation timer loop
    useEffect(() => {
        if (couponCode) {
            const timer = setInterval(() => {
                setCartTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCouponCode("");
                        setCouponDiscount(0);
                        toast.error("Discount reservation coupon expired!");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [couponCode]);

    const formatTimer = (secs) => {
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
    };

    const handleSpin = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        
        // Spin rotations + land on Indigo sector (15% OFF)
        const targetDeg = 1440 + 135; // 4 full spins + 135 degrees
        setWheelDegree(targetDeg);

        setTimeout(() => {
            setIsSpinning(false);
            setSpinResult("RESCUE15");
            setCouponCode("RESCUE15");
            setCouponDiscount(0.15); // 15% discount
            toast.success("🎉 You won 15% OFF! Coupon applied to your cart.");
        }, 3600);
    };

    const updateQuantityHandler = (id, quantity) => {
        if (quantity <= 0) {
            toast.error("Minimum quantity is 1");
            return;
        }
        dispatch(updateQuantity({ id, quantity }));
    };

    const handlePressStart = (item) => {
        const timer = setTimeout(() => {
            dispatch(removeFromCart(item.product.id));
            toast.success("Item removed");
        }, 800);
        setPressTimer(timer);
    };

    const handlePressEnd = () => clearTimeout(pressTimer);

    if (!cart.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
                <div className="text-center bg-[var(--card)] p-8 md:p-12 rounded-[2rem] border border-[var(--border)] shadow-xl max-w-md w-full mx-4">
                    <h1 className="text-2xl font-black mb-4">
                        Your cart is empty
                    </h1>
                    <p className="text-sm opacity-60 mb-8 leading-relaxed">
                        Looks like you haven't added anything to your cart yet. Let's find something beautiful.
                    </p>

                    <Link
                        to="/products"
                        className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold rounded-xl inline-block text-xs uppercase tracking-widest transition shadow-lg"
                    >
                        Shop Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-16 px-4">
            
            {/* Background Decorative Blobs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
                <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] bg-[var(--primary)]/20 blur-[130px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-[var(--accent)]/10 blur-[130px] rounded-full pointer-events-none" />
            </div>

            {/* HEADER */}
            <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">
                        MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-700">CART</span> ({cartItemsCount})
                    </h1>
                    <p className="opacity-70 text-xs mt-1 uppercase tracking-widest font-semibold">
                        Secure checkout experience powered by AI
                    </p>
                </div>

                {/* AI TIMED RESERVATION BANNER */}
                {couponCode && (
                    <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2.5 rounded-2xl animate-pulse">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                            AI Reserved Slot: Discount Locks for {formatTimer(cartTimer)} min
                        </span>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT ITEMS */}
                <div className="lg:col-span-2 space-y-4">

                    {cart.map((item) => (
                        <motion.div
                            key={item.product.id}
                            onMouseDown={() => handlePressStart(item)}
                            onMouseUp={handlePressEnd}
                            onTouchStart={() => handlePressStart(item)}
                            onTouchEnd={handlePressEnd}
                            className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-xl transition-all duration-300"
                        >

                            {/* IMAGE */}
                            <Link to={`/product/${item.product.id}`} className="shrink-0">
                                <img
                                    src={
                                        item.product?.image ||
                                        item.product?.images?.[0]?.url ||
                                        "/no-image.png"
                                    }
                                    className="w-24 h-24 object-cover rounded-xl border border-[var(--border)] mx-auto"
                                    alt=""
                                />
                            </Link>

                            {/* DETAILS */}
                            <div className="flex-1 flex flex-col justify-between">

                                <div>
                                    <Link
                                        to={`/product/${item.product.id}`}
                                        className="hover:text-[var(--primary)] transition"
                                    >
                                        <h2 className="font-bold text-lg text-white line-clamp-1 leading-snug">
                                            {item.product.name}
                                        </h2>
                                    </Link>

                                    <p className="text-xs text-[var(--primary)] font-bold mt-1">
                                        ₹{Number(item.product.price || 0).toFixed(2)} each
                                    </p>
                                </div>

                                {/* QUANTITY CONTROL */}
                                <div className="flex items-center gap-3 mt-4">

                                    <button
                                        onClick={() => {
                                            if (item.quantity <= 1) {
                                                toast.error("Minimum quantity is 1");
                                                return;
                                            }
                                            updateQuantityHandler(
                                                item.product.id,
                                                item.quantity - 1
                                            );
                                        }}
                                        className="p-1 border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition text-[var(--text)]"
                                    >
                                        <Minus size={14} />
                                    </button>

                                    <span className="px-2 font-mono text-sm font-bold">
                                        {item.quantity}
                                    </span>

                                    <button
                                        onClick={() =>
                                            updateQuantityHandler(
                                                item.product.id,
                                                item.quantity + 1
                                            )
                                        }
                                        className="p-1 border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition text-[var(--text)]"
                                    >
                                        <Plus size={14} />
                                    </button>

                                    <button
                                        onClick={() => dispatch(removeFromCart(item.product.id))}
                                        className="p-1 text-rose-500 hover:text-rose-450 hover:bg-rose-500/10 rounded transition ml-4"
                                        title="Remove Item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* PRICE */}
                            <div className="font-black text-[var(--text)] text-xl sm:text-right shrink-0 mt-2 sm:mt-0">
                                ₹{Number(item.product.price * item.quantity).toFixed(2)}
                            </div>

                        </motion.div>
                    ))}
                </div>

                {/* RIGHT SUMMARY (FLIPKART STYLE CARD) */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-6 h-fit sticky top-28 shadow-xl backdrop-blur-md">

                    <h2 className="text-lg font-black uppercase tracking-widest mb-4 text-[var(--primary)] border-b border-[var(--border)] pb-3">
                        Price Details
                    </h2>

                    <div className="space-y-4 text-xs font-medium">

                        <div className="flex justify-between opacity-80">
                            <span>Price ({cartItemsCount} items)</span>
                            <span className="font-mono">₹{Number(subtotal || 0).toFixed(2)}</span>
                        </div>

                        {couponDiscount > 0 && (
                            <div className="flex justify-between text-indigo-400 font-bold">
                                <span>AI Rescue Discount (15%)</span>
                                <span className="font-mono">-₹{Number(discountAmount || 0).toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between opacity-80">
                            <span>GST (18%)</span>
                            <span className="font-mono">₹{gst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>

                        <div className="flex justify-between opacity-80">
                            <span>Delivery</span>
                            <span className="text-green-500 font-bold">
                                {delivery === 0 ? "FREE" : `₹${delivery}`}
                            </span>
                        </div>

                    </div>

                    <hr className="my-5 border-[var(--border)]" />

                    <div className="flex justify-between items-end text-xl font-bold mb-8">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)] mb-1">Total Amount</span>
                        <span className="text-2xl font-black text-white font-mono">₹{Number(total || 0).toFixed(2)}</span>
                    </div>

                    <div className="space-y-3">
                        <Link
                            to="/checkout"
                            className="block text-center bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg"
                        >
                            Proceed to Checkout
                        </Link>

                        <Link
                            to="/products"
                            className="block text-center border border-[var(--border)] hover:border-[var(--primary)] py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--primary)]/10 text-[var(--text)] transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>

                </div>

            </div>

            {/* AI Predictive Cart Abandonment Spin-the-Wheel Modal */}
            <AnimatePresence>
                {isShowing && !spinResult && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-transparent pointer-events-none" />
                            
                            <button onClick={close} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition z-10">
                                <X size={16} />
                            </button>

                            <div className="relative z-10 text-center">
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Gift className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-black text-white mb-1 uppercase">Claim AI Rescue Gift!</h2>
                                <p className="text-xs opacity-75 mb-6 max-w-xs mx-auto">
                                    Don't leave empty handed. Spin our neural surprise wheel to unlock a guaranteed checkout discount!
                                </p>

                                {/* SPINNING WHEEL LAYOUT */}
                                <div className="relative w-44 h-44 mx-auto mb-6">
                                    <motion.div 
                                        animate={{ rotate: wheelDegree }}
                                        transition={{ type: "spring", damping: 20, stiffness: 45 }}
                                        className="w-full h-full rounded-full border-4 border-indigo-500 relative bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center"
                                        style={{
                                            backgroundImage: "conic-gradient(from 0deg, #dc2626 0deg 90deg, #4f46e5 90deg 180deg, #10b981 180deg 270deg, #eab308 270deg 360deg)"
                                        }}
                                    >
                                        <div className="absolute top-2 text-[8px] font-black text-white uppercase">10% OFF</div>
                                        <div className="absolute right-2 text-[8px] font-black text-white uppercase">15% OFF</div>
                                        <div className="absolute bottom-2 text-[8px] font-black text-white uppercase">FREE GIFT</div>
                                        <div className="absolute left-2 text-[8px] font-black text-white uppercase">20% OFF</div>
                                    </motion.div>
                                    {/* Indicator peg */}
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 border-2 border-slate-950 shrink-0 z-10" />
                                </div>

                                <button 
                                    onClick={handleSpin} 
                                    disabled={isSpinning}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
                                >
                                    {isSpinning ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            <span>Spinning Wheel...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} />
                                            <span>Spin the Wheel</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Cart;