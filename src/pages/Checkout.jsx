import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Checkout = () => {
  const navigate = useNavigate();

  const { cart = [], totalItems, totalPrice, gst, deliveryCharges, discount, finalPrice } = useSelector((state) => state.cart);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center bg-[var(--card)] p-8 md:p-12 rounded-[2rem] border border-[var(--border)] shadow-xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-black mb-4">
            Your cart is empty
          </h1>
          <p className="text-sm opacity-60 mb-8 leading-relaxed">
            Please add items to your cart before proceeding to checkout.
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

  const handlePlaceOrder = () => {
    navigate("/payment");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-16 px-4">
      
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] bg-[var(--primary)]/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-[var(--accent)]/10 blur-[130px] rounded-full pointer-events-none" />
      </div>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-white">
          CHECK<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-700">OUT</span>
        </h1>
        <p className="opacity-70 text-xs mt-1 uppercase tracking-widest font-semibold">
          {totalItems} items ready to order
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT SIDE - ITEMS */}
        <div className="lg:col-span-2 space-y-4">

          {cart.map((item) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--primary)] hover:shadow-xl transition-all duration-300"
            >

              {/* IMAGE */}
              <img
                src={
                  item.product.image ||
                  item.product.images?.[0]?.url ||
                  "/no-image.png"
                }
                className="w-24 h-24 object-cover rounded-xl border border-[var(--border)] shrink-0 mx-auto"
                alt=""
              />

              {/* DETAILS */}
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white line-clamp-1 leading-snug">
                    {item.product.name}
                  </h2>

                  <p className="text-xs text-[var(--primary)] font-bold mt-1">
                    ₹{Number(item.product.price || 0).toFixed(2)} each
                  </p>

                  <p className="text-xs opacity-60 mt-1">
                    Quantity: {item.quantity}
                  </p>
                </div>

                {/* BADGE */}
                <span className="inline-block mt-3 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--text)] rounded-full w-fit">
                  ⚡ Fast Delivery Available
                </span>
              </div>

              {/* PRICE */}
              <div className="font-black text-[var(--text)] text-xl sm:text-right shrink-0 mt-2 sm:mt-0">
                ₹{Number(item.product.price * item.quantity).toFixed(2)}
              </div>

            </motion.div>
          ))}

        </div>

        {/* RIGHT SIDE - SUMMARY (FLIPKART STYLE CARD) */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-6 h-fit sticky top-28 shadow-xl backdrop-blur-md">

          <h2 className="text-lg font-black uppercase tracking-widest mb-4 text-[var(--primary)] border-b border-[var(--border)] pb-3">
            Price Details
          </h2>

          <div className="space-y-4 text-xs font-medium">

             <div className="flex justify-between opacity-80">
              <span>Price ({totalItems} items)</span>
              <span className="font-mono">₹{Number(totalPrice || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between opacity-80">
              <span>GST (18%)</span>
              <span className="font-mono">₹{Number(gst || 0).toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between opacity-80">
                <span>Discount ({discount}%)</span>
                <span className="text-green-500 font-bold font-mono">- ₹{Number((totalPrice * discount) / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between opacity-80">
              <span>Delivery Charges</span>
              <span className={deliveryCharges === 0 ? "text-green-500 font-bold" : "font-mono"}>
                {deliveryCharges === 0 ? "FREE" : `₹${Number(deliveryCharges || 0).toFixed(2)}`}
              </span>
            </div>

          </div>

          <hr className="my-5 border-[var(--border)]" />

          <div className="flex justify-between items-end text-xl font-bold mb-8">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)] mb-1">Total Amount</span>
            <span className="text-2xl font-black text-white font-mono">₹{Number(finalPrice || 0).toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePlaceOrder}
              className="w-full py-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg"
            >
              Place Order
            </button>

            <Link
              to="/products"
              className="block text-center border border-[var(--border)] hover:border-[var(--primary)] py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--primary)]/10 text-[var(--text)] transition"
            >
              Continue Shopping
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;