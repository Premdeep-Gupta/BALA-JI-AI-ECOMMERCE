import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Check, X, MapPin, Phone, User,
  Plus, Trash2, Home, Briefcase, Navigation, ShieldCheck,
  MapPinned, MessageSquare, Smartphone, ShoppingBag, Globe, MoreHorizontal,
  Loader2, CreditCard, Banknote, Sparkles, Shield, QrCode, RefreshCw, Wallet2,
  CheckCircle, Clock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { axiosInstance } from "../lib/axios";
import { clearCart } from "../store/slices/cartSlice";
import { toast } from "react-toastify";

const STATES_INDIA = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi"
];

const EMI_BANKS = [
  {
    id: "hdfc", name: "HDFC Bank", plans: [
      { months: 3, rate: "12%", interestMult: 0.03 },
      { months: 6, rate: "13%", interestMult: 0.06 },
      { months: 12, rate: "14%", interestMult: 0.12 }
    ]
  },
  {
    id: "sbi", name: "State Bank of India", plans: [
      { months: 3, rate: "11.5%", interestMult: 0.028 },
      { months: 6, rate: "12.5%", interestMult: 0.058 },
      { months: 12, rate: "13.5%", interestMult: 0.115 }
    ]
  },
  {
    id: "icici", name: "ICICI Bank", plans: [
      { months: 3, rate: "12.5%", interestMult: 0.031 },
      { months: 6, rate: "13.5%", interestMult: 0.062 },
      { months: 12, rate: "14.5%", interestMult: 0.125 }
    ]
  }
];

const Payment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { cart = [], totalPrice = 0, gst = 0, deliveryCharges = 0, finalPrice = 0, discount = 0 } = useSelector((state) => state.cart || { cart: [] });

  // ================= STATE MANAGEMENT =================
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Helper: Normalize DB row (snake_case) → component-friendly camelCase
  const normalizeAddress = (row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    altPhone: row.alt_phone || "",
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 || "",
    landmark: row.landmark || "",
    city: row.city,
    state: row.state,
    country: row.country || "India",
    pincode: row.pincode,
    addressType: row.address_type || "Home",
    instructions: row.instructions || "",
    isDefault: row.is_default || false,
  });

  // Fetch saved addresses from DB on load
  useEffect(() => {
    if (authUser?._id) {
      setAddressesLoading(true);
      axiosInstance.get("/auth/addresses")
        .then(({ data }) => {
          if (data.success) {
            const normalized = data.addresses.map(normalizeAddress);
            setAddresses(normalized);
            // Auto-select default if present
            const def = normalized.find(a => a.isDefault);
            if (def) setSelectedAddress(def);
          }
        })
        .catch(err => console.error("Failed to load addresses:", err))
        .finally(() => setAddressesLoading(false));
    }
  }, [authUser?._id]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Custom Payment Gateways States
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiProvider, setUpiProvider] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [selectedEmiBank, setSelectedEmiBank] = useState("");
  const [selectedEmiPlan, setSelectedEmiPlan] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // New Simulated Card States
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // New UPI Sub-tab and Scan & Pay States
  const [upiTab, setUpiTab] = useState("upiId");
  const [qrTimer, setQrTimer] = useState(300);
  const [qrScanned, setQrScanned] = useState(false);

  // New Secure Bank OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpTargetMode, setOtpTargetMode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const generateCaptcha = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCaptchaCode(code);
    setCaptchaInput("");
  };

  useEffect(() => {
    if (paymentMethod === "cod") {
      generateCaptcha();
    }
  }, [paymentMethod]);

  // QR Code Timer Effect
  useEffect(() => {
    let timer;
    if (paymentMethod === "upi" && upiTab === "qrCode" && qrTimer > 0 && !qrScanned) {
      timer = setInterval(() => {
        setQrTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentMethod, upiTab, qrTimer, qrScanned]);

  // Reset QR scan state and timer when tab opens
  useEffect(() => {
    if (paymentMethod === "upi" && upiTab === "qrCode") {
      setQrScanned(false);
      setQrTimer(300);
    }
  }, [paymentMethod, upiTab]);

  // Card Brand Detection
  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return "MasterCard";
    if (/^(60|65|508)/.test(clean)) return "RuPay";
    return "Unknown";
  }, [cardNumber]);

  // Card Inputs Handlers
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) setCardCvv(value);
  };

  // Helper to Confirm Payment in Database Immediately
  const confirmPaymentDirectly = async (modeText) => {
    setIsPaying(true);
    try {
      const paymentId = `TXN_DIRECT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await axiosInstance.post(
        "/payment/confirm",
        {
          orderId: orderId,
          paymentId: paymentId,
          paymentMode: modeText
        }
      );
      dispatch(clearCart());
      toast.success("Payment confirmed! Order Placed Successfully!");
      navigate("/order-success");
    } catch (error) {
      console.error("Direct confirmation error:", error);
      dispatch(clearCart());
      toast.info("Order processed successfully.");
      navigate("/order-success");
    } finally {
      setIsPaying(false);
    }
  };

  // Helper to Open Secure Bank OTP Modal
  const triggerOtpModal = (modeText) => {
    setOtpTargetMode(modeText);
    setOtpValue("");
    setOtpError("");
    setShowOtpModal(true);
  };

  // Payment Submit Handlers
  const handleCardSubmit = (e) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.length < 16) {
      return toast.error("Please enter a valid 16-digit Card Number.");
    }
    if (!cardName.trim()) {
      return toast.error("Please enter Cardholder Name.");
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return toast.error("Please enter Expiry Date in MM/YY format.");
    }
    if (cardCvv.length < 3) {
      return toast.error("Please enter a valid CVV.");
    }

    const last4 = cleanNum.slice(-4);
    triggerOtpModal(`Card: ${cardBrand} ****${last4}`);
  };

  const handleUpiSubmit = (e) => {
    e.preventDefault();
    if (!upiId.trim() || !upiId.includes("@")) {
      return toast.error("Please enter a valid UPI ID (e.g. name@upi)");
    }
    triggerOtpModal(`UPI ID: ${upiId} (${upiProvider.toUpperCase()})`);
  };

  const handleCodSubmit = (e) => {
    e.preventDefault();
    if (captchaInput !== captchaCode) {
      return toast.error("Verification Code standard match fail. Check again!");
    }
    confirmPaymentDirectly("COD (Cash on Delivery)");
  };

  const handleEmiSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmiBank || !selectedEmiPlan) {
      return toast.error("Please select both Bank and EMI plan!");
    }
    // Validate card inputs
    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.length < 16 || !cardName.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry) || cardCvv.length < 3) {
      return toast.error("Please enter your card details to set up the EMI installment plan.");
    }
    const bankObj = EMI_BANKS.find(b => b.id === selectedEmiBank);
    const bankName = bankObj ? bankObj.name : selectedEmiBank;
    const planMonths = selectedEmiPlan.split("-")[0];
    triggerOtpModal(`EMI: ${bankName} - ${planMonths} Months`);
  };

  const handleLazerSubmit = (e) => {
    e.preventDefault();
    if (!walletConnected) {
      return toast.error("Please connect your Lazer Wallet first!");
    }
    confirmPaymentDirectly("Lazer Pay");
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    try {
      // Simulate bank verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const paymentId = `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await axiosInstance.post(
        "/payment/confirm",
        {
          orderId: orderId,
          paymentId: paymentId,
          paymentMode: otpTargetMode
        }
      );

      setShowOtpModal(false);
      dispatch(clearCart());
      toast.success("Payment Verified! Order Placed Successfully!");
      navigate("/order-success");
    } catch (error) {
      console.error("OTP confirmation error:", error);
      setShowOtpModal(false);
      dispatch(clearCart());
      toast.info("Order processed successfully.");
      navigate("/order-success");
    } finally {
      setOtpLoading(false);
    }
  };

  const [form, setForm] = useState({
    fullName: "", phone: "", altPhone: "", pincode: "", country: "India",
    addressLine1: "", addressLine2: "", landmark: "",
    city: "", state: "", instructions: "",
    addressType: "Home", isDefault: false,
  });

  // ================= REDIRECTS =================
  useEffect(() => {
    if (!authUser) navigate("/login");
    window.scrollTo(0, 0);
  }, [authUser, navigate, step]);

  const stats = useMemo(() => {
    return {
      subtotal: Number(totalPrice),
      gst: Number(gst),
      delivery: Number(deliveryCharges),
      total: Number(finalPrice)
    };
  }, [totalPrice, gst, deliveryCharges, finalPrice]);

  // ================= ADDRESS LOGIC (DB-Backed) =================

  const handleAddAddress = async () => {
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.pincode || !form.state || !form.city) {
      return alert("Please fill in all required fields.");
    }
    try {
      const { data } = await axiosInstance.post("/auth/addresses", form);
      if (data.success) {
        const newAddr = normalizeAddress(data.address);
        let updated;
        if (newAddr.isDefault) {
          updated = [newAddr, ...addresses.map(a => ({ ...a, isDefault: false }))];
        } else {
          updated = [newAddr, ...addresses];
        }
        setAddresses(updated);
        setSelectedAddress(newAddr);
        setShowModal(false);
        resetForm();
        toast.success("Address saved!");
      }
    } catch (err) {
      console.error("Add address error:", err);
      toast.error(err.response?.data?.message || "Failed to save address.");
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/auth/addresses/${id}`);
      const updated = addresses.filter((a) => a.id !== id);
      setAddresses(updated);
      if (selectedAddress?.id === id) setSelectedAddress(null);
      toast.success("Address removed.");
    } catch (err) {
      console.error("Delete address error:", err);
      toast.error("Failed to delete address.");
    }
  };

  const resetForm = () => setForm({
    fullName: "", phone: "", altPhone: "", pincode: "", country: "India",
    addressLine1: "", addressLine2: "", landmark: "",
    city: "", state: "", instructions: "", addressType: "Home", isDefault: false,
  });

  const handleAutofill = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        if (data.address) {
          setForm(prev => ({
            ...prev,
            city: data.address.city || data.address.town || "",
            state: data.address.state || "",
            pincode: data.address.postcode || "",
          }));
        }
      } catch (err) {
        console.error("Address fetch error:", err);
        alert("Failed to fetch address.");
      }
      finally { setLoading(false); }
    }, () => setLoading(false));
  };

  const handleCreateOrder = async () => {
    if (!selectedAddress) return alert("Please select an address first.");

    setIsCreatingOrder(true);
    try {
      const orderData = {
        full_name: selectedAddress.fullName,
        state: selectedAddress.state,
        city: selectedAddress.city,
        country: selectedAddress.country || "India",
        address: `${selectedAddress.addressLine1}, ${selectedAddress.addressLine2}`,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phone,
        orderedItems: cart.map(item => ({
          product: {
            id: item.product.id || item.product._id,
            images: item.product.image ? [{ url: item.product.image }] : []
          },
          quantity: item.quantity
        }))
      };

      const { data } = await axiosInstance.post(
        "/order/new",
        orderData
      );

      if (data.success && data.orderId) {
        setOrderId(data.orderId);
        setStep(2);
      }
    } catch (error) {
      console.error("Order Creation Error:", error.response?.data);
      alert(error.response?.data?.message || "Failed to initialize order.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (cart.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] px-4">
      <div className="bg-[var(--primary)]/10 p-8 rounded-full mb-4 shadow-inner"><ShoppingBag size={48} className="text-[var(--primary)] animate-bounce" /></div>
      <h2 className="text-2xl font-black">Your cart is empty</h2>
      <Link to="/products" className="mt-4 text-[var(--primary)] hover:underline font-bold">Continue Shopping</Link>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 bg-[var(--bg)] text-[var(--text)] px-4 pb-20 selection:bg-red-500/30">

      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/15 blur-[130px] rounded-full pointer-events-none" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link to="/cart" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition"><ArrowLeft size={20} /></Link>
            <div><h1 className="text-3xl font-extrabold text-white tracking-tight">Checkout</h1><p className="text-sm opacity-55">Step {step} of 2</p></div>
          </div>
          <div className="flex items-center bg-white/5 p-2 rounded-2xl border border-white/10">
            {[{ id: 1, label: "Address" }, { id: 2, label: "Payment" }].map((s) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${step === s.id ? "bg-[var(--primary)] text-white shadow-lg" : "opacity-40"}`}>
                  <span className="flex items-center justify-center w-6 h-6 rounded-full border border-current text-xs font-bold">{step > s.id ? <Check size={14} /> : s.id}</span>
                  <span className="font-semibold">{s.label}</span>
                </div>
                {s.id === 1 && <div className="w-8 h-[2px] bg-white/10 mx-2" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-[2rem] shadow-xl backdrop-blur-md">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-bold flex items-center gap-2"><MapPin size={22} className="text-[var(--primary)]" /> Saved Addresses</h2>
                      <button onClick={() => setShowModal(true)} className="text-xs font-black uppercase tracking-widest text-[var(--primary)] hover:text-red-400 bg-[var(--primary)]/10 px-5 py-2.5 rounded-full transition flex items-center gap-1"><Plus size={16} /> Add New</button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {addresses.length > 0 ? (
                        addresses.map((addr) => (
                          <div key={addr.id} onClick={() => setSelectedAddress(addr)} className={`group relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedAddress?.id === addr.id ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-2xl" : "border-[var(--border)] bg-transparent hover:border-[var(--primary)]/30"}`}>
                            <h3 className="font-bold text-white">{addr.fullName}</h3>
                            <p className="text-xs opacity-75 mt-1">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-xs opacity-50 mt-3 flex items-center gap-2"><Phone size={12} /> {addr.phone}</p>
                            <button onClick={(e) => handleDelete(e, addr.id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition"><Trash2 size={16} /></button>
                            {selectedAddress?.id === addr.id && <div className="absolute top-10 right-4 text-[var(--primary)] bg-white rounded-full p-0.5 shadow-lg"><Check size={16} strokeWidth={3} /></div>}
                          </div>
                        ))
                      ) : <div className="col-span-2 py-12 text-center border-2 border-dashed border-[var(--border)] rounded-3xl opacity-50">No addresses found.</div>}
                    </div>
                  </div>
                  <button disabled={!selectedAddress || isCreatingOrder} onClick={handleCreateOrder} className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-2 text-white shadow-lg shadow-[var(--primary)]/10">
                    {isCreatingOrder ? <Loader2 className="animate-spin" size={20} /> : "Proceed to Payment"}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[var(--card)] border border-[var(--border)] p-6 md:p-8 rounded-[2rem] shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-8">
                    <ShieldCheck size={24} className="text-[var(--primary)] animate-pulse" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Choose Payment Method</h2>
                      <p className="text-sm opacity-55">100% Secured and Encrypted Transactions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[350px]">
                    {/* LEFT TABS */}
                    <div className="md:col-span-4 flex flex-col gap-2 border-r border-[var(--border)] pr-0 md:pr-4">
                      {[
                        { id: "upi", label: "UPI (Paytm/GPay)", icon: <QrCode size={18} /> },
                        { id: "card", label: "Credit/Debit Card", icon: <CreditCard size={18} /> },
                        { id: "cod", label: "Cash on Delivery", icon: <Banknote size={18} /> },
                        { id: "emi", label: "Easy EMI", icon: <Sparkles size={18} /> },
                        { id: "lazer", label: "Lazer Pay", icon: <Wallet2 size={18} /> }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPaymentMethod(tab.id)}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-left transition-all ${paymentMethod === tab.id
                              ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
                              : "bg-transparent hover:bg-[var(--primary)]/10 text-[var(--text)] opacity-70 hover:opacity-100 border border-[var(--border)]"
                            }`}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* RIGHT FORM CONTAINER */}
                    <div className="md:col-span-8 pl-0 md:pl-2 flex flex-col justify-between">
                      <AnimatePresence mode="wait">
                        {paymentMethod === "upi" && (
                          <motion.div key="upi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Sub-tabs */}
                            <div className="flex gap-2 border-b border-white/10 pb-3">
                              <button
                                type="button"
                                onClick={() => setUpiTab("upiId")}
                                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider transition-all text-center ${upiTab === "upiId" ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" : "opacity-55 hover:opacity-100"
                                  }`}
                              >
                                Pay via UPI ID
                              </button>
                              <button
                                type="button"
                                onClick={() => setUpiTab("qrCode")}
                                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider transition-all text-center ${upiTab === "qrCode" ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" : "opacity-55 hover:opacity-100"
                                  }`}
                              >
                                Scan & Pay (QR Code)
                              </button>
                            </div>

                            {upiTab === "upiId" ? (
                              <div className="space-y-6">
                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Select UPI App</label>
                                  <div className="grid grid-cols-3 gap-3">
                                    {[
                                      { id: "gpay", name: "Google Pay", color: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400" },
                                      { id: "phonepe", name: "PhonePe", color: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400" },
                                      { id: "paytm", name: "Paytm", color: "border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400" }
                                    ].map(p => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setUpiProvider(p.id)}
                                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 ${upiProvider === p.id
                                            ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--text)]"
                                            : p.color
                                          }`}
                                      >
                                        <Smartphone size={20} />
                                        {p.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <form onSubmit={handleUpiSubmit} className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">UPI ID</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. username@upi"
                                      value={upiId}
                                      onChange={(e) => setUpiId(e.target.value)}
                                      className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3.5 rounded-xl text-[var(--text)] outline-none transition-all font-mono"
                                    />
                                  </div>
                                  <button
                                    disabled={isPaying}
                                    type="submit"
                                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-45 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                                  >
                                    {isPaying ? <Loader2 className="animate-spin" size={16} /> : <>Pay ₹{Number(stats.total).toLocaleString()} via UPI ID</>}
                                  </button>
                                </form>
                              </div>
                            ) : (
                              <div className="space-y-6 flex flex-col items-center justify-center py-4 text-center">
                                {/* QR Code Graphic */}
                                <div className="relative p-6 bg-white rounded-3xl shadow-xl flex items-center justify-center w-[200px] h-[200px] border-4 border-[var(--primary)]/20 overflow-hidden">
                                  {/* Scanning Pulse Line Effect */}
                                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)] animate-pulse" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }} />

                                  {/* QR code image */}
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=shopmate@hdfcbank%26pn=ShopMate%26am=${stats.total}%26cu=INR`}
                                    alt="UPI QR Code"
                                    className="w-[150px] h-[150px] object-contain"
                                  />
                                  {qrScanned && (
                                    <div className="absolute inset-0 bg-black/95 rounded-2xl flex flex-col items-center justify-center text-green-400 p-4">
                                      <CheckCircle className="w-12 h-12 mb-2 animate-bounce" />
                                      <p className="font-black text-xs uppercase tracking-wider">Payment Received!</p>
                                    </div>
                                  )}
                                </div>

                                {/* Timer & Instructions */}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Scan using BHIM, GPay, Paytm, or PhonePe</p>
                                  <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full font-mono text-sm text-white">
                                    <Clock size={16} className="text-[var(--primary)] animate-pulse" />
                                    <span>
                                      {Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, "0")}
                                    </span>
                                  </div>
                                </div>

                                {/* Verify Payment Button */}
                                <button
                                  type="button"
                                  disabled={qrScanned || isPaying}
                                  onClick={async () => {
                                    setIsPaying(true);
                                    toast.info("Checking payment status from bank API...");
                                    // Simulate bank callback latency
                                    await new Promise((resolve) => setTimeout(resolve, 2500));
                                    setQrScanned(true);
                                    toast.success("Payment Verified!");
                                    await confirmPaymentDirectly("UPI: Scan & Pay (QR Code)");
                                  }}
                                  className="px-6 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 w-full max-w-[250px]"
                                >
                                  {isPaying ? (
                                    <>
                                      <Loader2 className="animate-spin" size={14} /> Verifying...
                                    </>
                                  ) : (
                                    "I Have Scanned & Paid"
                                  )}
                                </button>

                                <p className="text-[10px] text-slate-500 max-w-[280px] leading-relaxed mx-auto">
                                  Please scan the QR code and click the button above once done to complete your payment.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {paymentMethod === "card" && (
                          <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Card Face Visualizer */}
                            <div className="relative w-full max-w-[340px] h-[190px] mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[var(--primary)]/10 rounded-full blur-2xl pointer-events-none" />

                              <div className="flex justify-between items-center z-10">
                                <div className="w-10 h-7 bg-amber-400/20 rounded-md border border-amber-400/30 flex items-center justify-center">
                                  <div className="w-5 h-4 bg-amber-400/60 rounded-sm" />
                                </div>
                                <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                                  {cardBrand !== "Unknown" ? cardBrand : "Card"}
                                </span>
                              </div>

                              <div className="text-lg font-mono tracking-[0.18em] text-center my-3 z-10 text-slate-200">
                                {cardNumber || "•••• •••• •••• ••••"}
                              </div>

                              <div className="flex justify-between items-end z-10">
                                <div>
                                  <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Card Holder</p>
                                  <p className="text-xs font-black font-mono tracking-wide uppercase line-clamp-1 max-w-[170px] text-slate-300">
                                    {cardName || "YOUR NAME"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-0.5">Expires</p>
                                  <p className="text-xs font-black font-mono text-slate-300">{cardExpiry || "MM/YY"}</p>
                                </div>
                              </div>
                            </div>

                            <form onSubmit={handleCardSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Card Number</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    value={cardNumber}
                                    onChange={handleCardNumberChange}
                                    className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3.5 rounded-xl text-[var(--text)] outline-none transition-all font-mono"
                                  />
                                  {cardBrand !== "Unknown" && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-lg">
                                      {cardBrand}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Cardholder Name</label>
                                <input
                                  type="text"
                                  placeholder="Name as printed on card"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                  className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3.5 rounded-xl text-[var(--text)] outline-none transition-all"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Expiry Date</label>
                                  <input
                                    type="text"
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={handleExpiryChange}
                                    className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3.5 rounded-xl text-[var(--text)] outline-none transition-all text-center font-mono"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">CVV</label>
                                  <input
                                    type="password"
                                    maxLength="4"
                                    placeholder="•••"
                                    value={cardCvv}
                                    onChange={handleCvvChange}
                                    className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3.5 rounded-xl text-[var(--text)] outline-none transition-all text-center font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                disabled={isPaying}
                                type="submit"
                                className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-45 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                              >
                                {isPaying ? <Loader2 className="animate-spin" size={16} /> : <>Pay ₹{Number(stats.total).toLocaleString()} via Card</>}
                              </button>
                            </form>
                          </motion.div>
                        )}

                        {paymentMethod === "cod" && (
                          <motion.div key="cod" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="p-5 bg-[var(--primary)]/[0.03] border border-[var(--border)] rounded-2xl space-y-3">
                              <h4 className="font-bold text-white text-sm">Cash on Delivery (COD)</h4>
                              <p className="text-xs opacity-70 leading-relaxed font-semibold text-slate-300">
                                Pay securely in cash or via QR at the time of delivery. No extra handling charges. Delivery executive will verify with secure OTP.
                              </p>
                              <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                                <span className="opacity-50">COD Limit</span>
                                <span className="text-green-500 font-bold font-mono">Eligible (Max ₹50,000)</span>
                              </div>
                            </div>

                            <form onSubmit={handleCodSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Enter Security Verification Code</label>
                                <div className="flex gap-3">
                                  <input
                                    type="text"
                                    maxLength="6"
                                    placeholder="Enter Code"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    className="flex-1 bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3 rounded-xl text-[var(--text)] text-center font-bold text-lg tracking-[0.2em] outline-none transition-all font-mono"
                                  />
                                  <div className="px-5 bg-white/5 border border-white/15 rounded-xl flex items-center gap-3 select-none shrink-0">
                                    <span className="font-black text-xl tracking-[0.1em] text-[var(--primary)] font-mono italic line-through opacity-80">{captchaCode}</span>
                                    <button type="button" onClick={generateCaptcha} className="text-slate-500 hover:text-white transition"><RefreshCw size={14} /></button>
                                  </div>
                                </div>
                              </div>
                              <button
                                disabled={isPaying}
                                type="submit"
                                className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-45 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                              >
                                {isPaying ? <Loader2 className="animate-spin" size={16} /> : <>Confirm Cash on Delivery Order</>}
                              </button>
                            </form>
                          </motion.div>
                        )}

                        {paymentMethod === "emi" && (
                          <motion.div key="emi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Select Card Issuer Bank</label>
                              <select
                                value={selectedEmiBank}
                                onChange={(e) => { setSelectedEmiBank(e.target.value); setSelectedEmiPlan(""); }}
                                className="w-full bg-transparent border border-[var(--border)] px-4 py-3.5 rounded-xl text-[var(--text)] outline-none focus:border-[var(--primary)] transition-all font-bold text-xs"
                              >
                                <option value="" className="bg-[var(--card)] text-[var(--text)]">Select Bank Options</option>
                                {EMI_BANKS.map(b => <option key={b.id} value={b.id} className="bg-[var(--card)] text-[var(--text)]">{b.name}</option>)}
                              </select>
                            </div>

                            {selectedEmiBank && (
                              <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Choose Installment Plan</label>
                                <div className="space-y-2">
                                  {EMI_BANKS.find(b => b.id === selectedEmiBank)?.plans.map(p => {
                                    const monthlyCost = Math.round((stats.total * (1 + p.interestMult)) / p.months);
                                    const planId = `${p.months}-months`;
                                    return (
                                      <div
                                        key={p.months}
                                        onClick={() => setSelectedEmiPlan(planId)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${selectedEmiPlan === planId
                                            ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--text)]"
                                            : "border-[var(--border)] bg-transparent hover:border-[var(--primary)]/30 text-[var(--text)]/80"
                                          }`}
                                      >
                                        <div>
                                          <p className="font-bold text-sm text-white">₹{monthlyCost.toLocaleString()} <span className="text-xs opacity-50 font-medium font-sans">/ month</span></p>
                                          <p className="text-[10px] opacity-60 font-semibold uppercase tracking-wider mt-1">{p.months} Months plan @ {p.rate} p.a.</p>
                                        </div>
                                        {selectedEmiPlan === planId && <div className="w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {selectedEmiPlan && (
                              <div className="space-y-4 pt-4 border-t border-white/10">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Enter Credit Card Details</label>
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    placeholder="Card Number (0000 0000 0000 0000)"
                                    value={cardNumber}
                                    onChange={handleCardNumberChange}
                                    className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3 rounded-xl text-xs text-[var(--text)] outline-none transition-all font-mono"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Cardholder Name"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3 rounded-xl text-xs text-[var(--text)] outline-none transition-all"
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="MM/YY"
                                      value={cardExpiry}
                                      onChange={handleExpiryChange}
                                      className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3 rounded-xl text-xs text-[var(--text)] outline-none transition-all text-center font-mono"
                                    />
                                    <input
                                      type="password"
                                      maxLength="4"
                                      placeholder="CVV"
                                      value={cardCvv}
                                      onChange={handleCvvChange}
                                      className="w-full bg-transparent border border-[var(--border)] focus:border-[var(--primary)] px-4 py-3 rounded-xl text-xs text-[var(--text)] outline-none transition-all text-center font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <button
                              disabled={isPaying || !selectedEmiPlan}
                              onClick={handleEmiSubmit}
                              className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-45 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              {isPaying ? <Loader2 className="animate-spin" size={16} /> : <>Setup EMI & Pay</>}
                            </button>
                          </motion.div>
                        )}

                        {paymentMethod === "lazer" && (
                          <motion.div key="lazer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="p-5 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400">
                                <Wallet2 size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm">Lazer Crypto Gateway</h4>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Web3 Payments protocol</p>
                              </div>
                              {walletConnected ? (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="px-3 py-1 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest">Wallet Connected</span>
                                  <span className="font-mono text-xs opacity-50">0x71C...8E29</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { setWalletConnected(true); toast.success("Metamask/Lazer Wallet connected!"); }}
                                  className="px-6 py-2.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-black uppercase tracking-widest transition"
                                >
                                  Connect Wallet
                                </button>
                              )}
                            </div>

                            <button
                              disabled={isPaying || !walletConnected}
                              onClick={handleLazerSubmit}
                              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-45 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              {isPaying ? <Loader2 className="animate-spin" size={16} /> : <>Pay using LAZER PAY</>}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[2rem] shadow-xl backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-6 text-center border-b border-[var(--border)] pb-4">Order Summary</h2>
              <div className="space-y-4 max-h-[240px] overflow-y-auto mb-6 pr-2 scrollbar-thin">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <img src={item.product.image} className="w-14 h-14 bg-white/5 rounded-xl object-cover border border-[var(--border)] shrink-0" alt="" />
                    <div className="flex-1 text-xs"><p className="font-bold text-white line-clamp-1">{item.product.name}</p><p className="opacity-55 mt-0.5">Qty: {item.quantity}</p><p className="text-[var(--primary)] font-bold mt-1">₹{Number(item.product.price || 0).toFixed(2)}</p></div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-[var(--border)] pt-6 text-xs">
                <div className="flex justify-between opacity-60"><span>Subtotal</span><span className="text-white font-medium">₹{Number(stats.subtotal || 0).toFixed(2)}</span></div>
                <div className="flex justify-between opacity-60"><span>GST (18%)</span><span className="text-white font-medium">₹{Number(stats.gst || 0).toFixed(2)}</span></div>
                <div className="flex justify-between opacity-60"><span>Delivery</span><span className={stats.delivery === 0 ? "text-green-500 font-bold" : "text-white"}>{stats.delivery === 0 ? "FREE" : `₹${Number(stats.delivery || 0).toFixed(2)}`}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between opacity-60">
                    <span>Discount ({discount}%)</span>
                    <span className="text-green-500 font-bold font-mono">- ₹{Number((stats.subtotal * discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-[var(--border)] flex justify-between items-end"><span className="font-bold text-white text-[10px] uppercase tracking-widest">Total Payable</span><span className="text-2xl font-black text-white font-mono">₹{Number(stats.total || 0).toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--card)] text-[var(--text)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative border border-[var(--border)] p-8 max-h-[85vh] overflow-y-auto custom-scrollbar backdrop-blur-md">
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Add Delivery Details</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full"><X /></button></div>
              <button disabled={loading} onClick={handleAutofill} className="w-full mb-6 bg-[var(--primary)]/10 text-[var(--text)] py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 border border-[var(--border)]">{loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />} Use Live Location</button>
              <div className="grid md:grid-cols-2 gap-5">
                <input className="modal-input md:col-span-2" placeholder="Full Name *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <input className="modal-input" placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="modal-input" placeholder="Alt Phone" value={form.altPhone} onChange={(e) => setForm({ ...form, altPhone: e.target.value })} />
                <input className="modal-input md:col-span-2" placeholder="Flat, House no. *" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
                <input className="modal-input md:col-span-2" placeholder="Area, Street *" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
                <input className="modal-input" placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <select className="modal-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}><option value="">State *</option>{STATES_INDIA.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <input className="modal-input" placeholder="Pincode *" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                <button onClick={handleAddAddress} className="md:col-span-2 mt-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-[var(--primary)]/10">Save & Continue</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!otpLoading) setShowOtpModal(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-3xl shadow-2xl relative p-8 backdrop-blur-md overflow-hidden text-left"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ShieldCheck size={28} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Secure Bank Authentication</h3>
                  <p className="text-xs opacity-50 mt-1 uppercase tracking-wider font-semibold text-slate-300">
                    {otpTargetMode}
                  </p>
                </div>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block text-center">
                    Enter 6-Digit Secure OTP
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-3xl font-mono tracking-[0.25em] bg-transparent border border-slate-700 focus:border-[var(--primary)] rounded-2xl px-4 py-4 outline-none transition-all font-black text-slate-100"
                    disabled={otpLoading}
                  />
                  {otpError && (
                    <p className="text-xs text-red-400 font-bold text-center bg-red-500/5 p-2.5 rounded-xl border border-red-500/10">
                      {otpError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpValue("123456")}
                    className="flex-1 px-4 py-3.5 bg-slate-800 hover:bg-slate-750 text-xs font-black uppercase tracking-widest rounded-xl transition text-white border border-slate-700"
                    disabled={otpLoading}
                  >
                    Auto-fill OTP
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-45 text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition shadow-lg shadow-[var(--primary)]/10 text-white"
                    disabled={otpLoading}
                  >
                    {otpLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Verify & Pay"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-input { width: 100%; bg: transparent; border: 1px solid var(--border); padding: 12px 18px; border-radius: 14px; color: var(--text); outline: none; transition: 0.3s; }
        .modal-input:focus { border-color: var(--primary); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Payment;