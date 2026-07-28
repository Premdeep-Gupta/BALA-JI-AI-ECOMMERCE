import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-toastify";
import { clearCart } from "../store/slices/cartSlice";

const PaymentForm = ({ amount, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { authUser } = useSelector((state) => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !orderId) return;

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // 1. Client Secret fetch karein
      const { data: intentData } = await axiosInstance.post(
        "/payment/process", 
        { amount: Math.round(Number(amount).toFixed(2) * 100), orderId }
      );

      // 2. Stripe Confirm
      const result = await stripe.confirmCardPayment(intentData.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: authUser?.name || "Customer",
            email: authUser?.email,
          },
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message);
        setIsProcessing(false);
      } else if (result.paymentIntent.status === "succeeded") {
        
        // ✅ CRITICAL FIX: Sahi route '/confirm' hit karein (PostgreSQL sync ke liye)
        try {
          await axiosInstance.post(
            "/payment/confirm", 
            { 
              orderId: orderId, 
              paymentId: result.paymentIntent.id 
            }
          );
          
          // Data successfully confirm hone ke baad hi cart clear karein
          dispatch(clearCart());
          toast.success("Order Placed Successfully!");
          navigate("/order-success");

        } catch (confirmError) {
          console.error("PG Database Update Error:", confirmError.response?.data);
          // Agar database update fail ho, toh bhi cart clear karke aage badhein
          dispatch(clearCart());
          navigate("/order-success");
        }
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Payment Failed.");
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: "#ffffff",
        fontFamily: '"Inter", sans-serif',
        fontSize: "16px",
        "::placeholder": { color: "#64748b" },
      },
      invalid: { color: "#ef4444", iconColor: "#ef4444" },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between px-1">
          Secure Payment Terminal
          <ShieldCheck size={14} className="text-green-500" />
        </label>
        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl focus-within:border-red-500/40 transition-all">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {errorMessage && (
        <div className="text-red-400 bg-red-500/10 p-4 rounded-xl text-xs font-bold border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <button
        disabled={!stripe || isProcessing}
        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3"
      >
        {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={18} /> Pay ₹{Number(amount).toLocaleString()}</>}
      </button>
    </form>
  );
};

export default PaymentForm;