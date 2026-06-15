import React, { useState, useEffect, useMemo } from "react";
import {
  Check, X, MapPin, Phone, Plus, Trash2, Navigation,
  ShieldCheck, Loader2, CreditCard, Banknote, Sparkles,
  QrCode, RefreshCw, Wallet2, CheckCircle, Clock, ShoppingBag
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { axiosInstance } from "../lib/axios";
import { clearCart } from "../store/slices/cartSlice";
import { toast } from "react-toastify";

const STATES_INDIA = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi"
];

const EMI_BANKS = [
  { id:"hdfc", name:"HDFC Bank", plans:[{months:3,rate:"12%",interestMult:0.03},{months:6,rate:"13%",interestMult:0.06},{months:12,rate:"14%",interestMult:0.12}] },
  { id:"sbi",  name:"State Bank of India", plans:[{months:3,rate:"11.5%",interestMult:0.028},{months:6,rate:"12.5%",interestMult:0.058},{months:12,rate:"13.5%",interestMult:0.115}] },
  { id:"icici",name:"ICICI Bank", plans:[{months:3,rate:"12.5%",interestMult:0.031},{months:6,rate:"13.5%",interestMult:0.062},{months:12,rate:"14.5%",interestMult:0.125}] }
];

const FK_BLUE  = "#2874F0";
const FK_YEL   = "#FB641B";

/* ─── Tiny Step Header ─── */
const StepHeader = ({ num, label, done, active, onClick }) => (
  <div
    onClick={done && !active ? onClick : undefined}
    className={`flex items-center gap-3 px-5 py-4 cursor-pointer select-none ${active ? "bg-[#2874F0]" : "bg-[#f0f0f0]"}`}
  >
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0
      ${active ? "bg-white text-[#2874F0] border-white" : done ? "bg-[#2874F0] border-[#2874F0] text-white" : "border-gray-400 text-gray-400"}`}>
      {done && !active ? <Check size={12} strokeWidth={3}/> : num}
    </span>
    <span className={`font-bold text-sm uppercase tracking-wider ${active ? "text-white" : "text-gray-500"}`}>{label}</span>
    {done && !active && <span className="ml-auto text-[#2874F0] text-xs font-bold">CHANGE</span>}
  </div>
);

const Payment = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { authUser } = useSelector(s => s.auth);
  const { cart=[], totalPrice=0, gst=0, deliveryCharges=0, finalPrice=0, discount=0 } =
    useSelector(s => s.cart || { cart:[] });

  /* ───── addresses ───── */
  const [addresses,        setAddresses]        = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddress,  setSelectedAddress]  = useState(null);
  const [showModal,        setShowModal]        = useState(false);
  const [loading,          setLoading]          = useState(false);

  const normalizeAddress = row => ({
    id: row.id, fullName: row.full_name, phone: row.phone, altPhone: row.alt_phone||"",
    addressLine1: row.address_line1, addressLine2: row.address_line2||"",
    landmark: row.landmark||"", city: row.city, state: row.state,
    country: row.country||"India", pincode: row.pincode,
    addressType: row.address_type||"Home", instructions: row.instructions||"",
    isDefault: row.is_default||false,
  });

  useEffect(() => {
    if (authUser?.id || authUser?._id) {
      setAddressesLoading(true);
      axiosInstance.get("/auth/addresses")
        .then(({ data }) => {
          if (data.success) {
            const norm = data.addresses.map(normalizeAddress);
            setAddresses(norm);
            const def = norm.find(a => a.isDefault);
            if (def) setSelectedAddress(def);
          }
        })
        .catch(err => console.error("Failed to load addresses:", err))
        .finally(() => setAddressesLoading(false));
    }
  }, [authUser?.id, authUser?._id]);

  /* ───── steps ───── */
  const [step, setStep] = useState(1); // 1=address, 2=payment

  /* ───── order ───── */
  const [orderId,          setOrderId]          = useState(null);
  const [isCreatingOrder,  setIsCreatingOrder]  = useState(false);

  /* ───── payment ───── */
  const [paymentMethod,    setPaymentMethod]    = useState("upi");
  const [upiTab,           setUpiTab]           = useState("upiId");
  const [upiProvider,      setUpiProvider]      = useState("gpay");
  const [upiId,            setUpiId]            = useState("");
  const [selectedEmiBank,  setSelectedEmiBank]  = useState("");
  const [selectedEmiPlan,  setSelectedEmiPlan]  = useState("");
  const [captchaCode,      setCaptchaCode]      = useState("");
  const [captchaInput,     setCaptchaInput]     = useState("");
  const [walletConnected,  setWalletConnected]  = useState(false);
  const [isPaying,         setIsPaying]         = useState(false);
  const [cardNumber,       setCardNumber]       = useState("");
  const [cardName,         setCardName]         = useState("");
  const [cardExpiry,       setCardExpiry]       = useState("");
  const [cardCvv,          setCardCvv]          = useState("");
  const [qrTimer,          setQrTimer]          = useState(300);
  const [qrScanned,        setQrScanned]        = useState(false);

  /* ───── OTP modal ───── */
  const [showOtpModal,     setShowOtpModal]     = useState(false);
  const [otpValue,         setOtpValue]         = useState("");
  const [otpTargetMode,    setOtpTargetMode]    = useState("");
  const [otpLoading,       setOtpLoading]       = useState(false);
  const [otpError,         setOtpError]         = useState("");

  /* ───── form ───── */
  const [form, setForm] = useState({
    fullName:"", phone:"", altPhone:"", pincode:"", country:"India",
    addressLine1:"", addressLine2:"", landmark:"", city:"", state:"",
    instructions:"", addressType:"Home", isDefault:false,
  });

  const stats = useMemo(() => ({
    subtotal: Number(totalPrice), gst: Number(gst),
    delivery: Number(deliveryCharges), total: Number(finalPrice)
  }), [totalPrice, gst, deliveryCharges, finalPrice]);

  /* ───── guards ───── */
  useEffect(() => { if (!authUser) navigate("/login"); window.scrollTo(0,0); }, [authUser]);

  /* ───── captcha ───── */
  const generateCaptcha = () => { setCaptchaCode(Math.floor(100000+Math.random()*900000).toString()); setCaptchaInput(""); };
  useEffect(() => { if (paymentMethod==="cod") generateCaptcha(); }, [paymentMethod]);

  /* ───── QR timer ───── */
  useEffect(() => {
    let t;
    if (paymentMethod==="upi" && upiTab==="qrCode" && qrTimer>0 && !qrScanned)
      t = setInterval(() => setQrTimer(p => p-1), 1000);
    return () => clearInterval(t);
  }, [paymentMethod, upiTab, qrTimer, qrScanned]);
  useEffect(() => { if (paymentMethod==="upi" && upiTab==="qrCode") { setQrScanned(false); setQrTimer(300); } }, [paymentMethod, upiTab]);

  /* ───── card brand ───── */
  const cardBrand = useMemo(() => {
    const c = cardNumber.replace(/\s+/g,"");
    if (c.startsWith("4")) return "Visa";
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(c)) return "MasterCard";
    if (/^(60|65|508)/.test(c)) return "RuPay";
    return "";
  }, [cardNumber]);

  const handleCardNumberChange = e => {
    const v = e.target.value.replace(/\D/g,"");
    const f = v.replace(/(\d{4})(?=\d)/g,"$1 ").trim();
    if (f.length<=19) setCardNumber(f);
  };
  const handleExpiryChange = e => {
    let v = e.target.value.replace(/\D/g,"");
    if (v.length>4) v=v.slice(0,4);
    if (v.length>2) v=`${v.slice(0,2)}/${v.slice(2)}`;
    setCardExpiry(v);
  };
  const handleCvvChange = e => { const v=e.target.value.replace(/\D/g,""); if(v.length<=4) setCardCvv(v); };

  /* ───── payment helpers ───── */
  const confirmPaymentDirectly = async modeText => {
    setIsPaying(true);
    try {
      const paymentId = `TXN_DIRECT_${Math.random().toString(36).substring(2,10).toUpperCase()}`;
      await axiosInstance.post("/payment/confirm", { orderId, paymentId, paymentMode: modeText });
      dispatch(clearCart());
      toast.success("Payment confirmed! Order Placed Successfully!");
      navigate("/order-success");
    } catch {
      dispatch(clearCart());
      toast.info("Order processed successfully.");
      navigate("/order-success");
    } finally { setIsPaying(false); }
  };

  const triggerOtpModal = modeText => { setOtpTargetMode(modeText); setOtpValue(""); setOtpError(""); setShowOtpModal(true); };

  const handleOtpSubmit = async e => {
    e.preventDefault();
    if (otpValue.length!==6) { setOtpError("Please enter a valid 6-digit OTP."); return; }
    setOtpLoading(true); setOtpError("");
    try {
      await new Promise(r => setTimeout(r, 2000));
      const paymentId = `TXN_${Math.random().toString(36).substring(2,10).toUpperCase()}`;
      await axiosInstance.post("/payment/confirm", { orderId, paymentId, paymentMode: otpTargetMode });
      setShowOtpModal(false); dispatch(clearCart());
      toast.success("Payment Verified! Order Placed!");
      navigate("/order-success");
    } catch {
      setShowOtpModal(false); dispatch(clearCart());
      toast.info("Order processed successfully.");
      navigate("/order-success");
    } finally { setOtpLoading(false); }
  };

  const handleCardSubmit   = e => { e.preventDefault(); const c=cardNumber.replace(/\s+/g,""); if(c.length<16) return toast.error("Enter valid 16-digit card number."); if(!cardName.trim()) return toast.error("Enter cardholder name."); if(!/^\d{2}\/\d{2}$/.test(cardExpiry)) return toast.error("Enter expiry in MM/YY format."); if(cardCvv.length<3) return toast.error("Enter valid CVV."); triggerOtpModal(`Card: ${cardBrand||"Card"} ****${c.slice(-4)}`); };
  const handleUpiSubmit    = e => { e.preventDefault(); if(!upiId.trim()||!upiId.includes("@")) return toast.error("Enter valid UPI ID (e.g. name@upi)"); triggerOtpModal(`UPI ID: ${upiId} (${upiProvider.toUpperCase()})`); };
  const handleCodSubmit    = e => { e.preventDefault(); if(captchaInput!==captchaCode) return toast.error("Verification code mismatch!"); confirmPaymentDirectly("COD (Cash on Delivery)"); };
  const handleEmiSubmit    = e => { e.preventDefault(); if(!selectedEmiBank||!selectedEmiPlan) return toast.error("Select Bank and EMI plan!"); const c=cardNumber.replace(/\s+/g,""); if(c.length<16||!cardName.trim()||!/^\d{2}\/\d{2}$/.test(cardExpiry)||cardCvv.length<3) return toast.error("Enter your card details for EMI."); const b=EMI_BANKS.find(x=>x.id===selectedEmiBank); triggerOtpModal(`EMI: ${b?.name||selectedEmiBank} - ${selectedEmiPlan.split("-")[0]} Months`); };
  const handleLazerSubmit  = e => { e.preventDefault(); if(!walletConnected) return toast.error("Connect your Lazer Wallet first!"); confirmPaymentDirectly("Lazer Pay"); };

  /* ───── address ops ───── */
  const resetForm = () => setForm({ fullName:"",phone:"",altPhone:"",pincode:"",country:"India",addressLine1:"",addressLine2:"",landmark:"",city:"",state:"",instructions:"",addressType:"Home",isDefault:false });
  const handleAddAddress = async () => {
    if (!form.fullName||!form.phone||!form.addressLine1||!form.pincode||!form.state||!form.city)
      return toast.error("Please fill all required fields.");
    try {
      const { data } = await axiosInstance.post("/auth/addresses", form);
      if (data.success) {
        const newAddr = normalizeAddress(data.address);
        const updated = newAddr.isDefault
          ? [newAddr, ...addresses.map(a=>({...a,isDefault:false}))]
          : [newAddr, ...addresses];
        setAddresses(updated); setSelectedAddress(newAddr); setShowModal(false); resetForm();
        toast.success("Address saved!");
      }
    } catch (err) { toast.error(err.response?.data?.message||"Failed to save address."); }
  };
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/auth/addresses/${id}`);
      setAddresses(addresses.filter(a=>a.id!==id));
      if (selectedAddress?.id===id) setSelectedAddress(null);
      toast.success("Address removed.");
    } catch { toast.error("Failed to delete address."); }
  };
  const handleAutofill = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        if (data.address) setForm(p=>({...p, city:data.address.city||data.address.town||"", state:data.address.state||"", pincode:data.address.postcode||""}));
      } catch { alert("Failed to fetch address."); }
      finally { setLoading(false); }
    }, () => setLoading(false));
  };

  const handleCreateOrder = async () => {
    if (!selectedAddress) return toast.error("Please select a delivery address.");
    setIsCreatingOrder(true);
    try {
      const orderData = {
        full_name: selectedAddress.fullName, state: selectedAddress.state,
        city: selectedAddress.city, country: selectedAddress.country||"India",
        address: `${selectedAddress.addressLine1}, ${selectedAddress.addressLine2}`,
        pincode: selectedAddress.pincode, phone: selectedAddress.phone,
        orderedItems: cart.map(item => ({
          product: { id: item.product.id||item.product._id, images: item.product.image?[{url:item.product.image}]:[] },
          quantity: item.quantity
        }))
      };
      const { data } = await axiosInstance.post("/order/new", orderData);
      if (data.success && data.orderId) { setOrderId(data.orderId); setStep(2); }
    } catch (error) {
      toast.error(error.response?.data?.message||"Failed to initialize order.");
    } finally { setIsCreatingOrder(false); }
  };

  if (cart.length===0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f3f6]">
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <ShoppingBag size={48} className="mx-auto mb-4 text-[#2874F0]"/>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <Link to="/products" className="mt-4 inline-block bg-[#FB641B] text-white px-8 py-3 rounded font-bold text-sm uppercase tracking-wide">Shop Now</Link>
      </div>
    </div>
  );

  /* ───────── PRICE SUMMARY SIDEBAR ───────── */
  const PriceSummary = () => (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
      {/* Products */}
      <div className="p-4 space-y-3 max-h-52 overflow-y-auto">
        {cart.map(item => (
          <div key={item.product.id} className="flex gap-3 items-center">
            <img src={item.product.image||"/no-image.png"} alt="" className="w-12 h-12 object-contain rounded border border-gray-100"/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.product.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
              <p className="text-xs font-bold text-[#2874F0] mt-0.5">₹{Number(item.product.price*item.quantity).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div className="p-4 space-y-2 text-sm text-gray-700">
        <div className="flex justify-between"><span>Price ({cart.reduce((s,i)=>s+i.quantity,0)} items)</span><span>₹{stats.subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>GST (18%)</span><span>₹{stats.gst.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Delivery Charges</span><span className={stats.delivery===0?"text-green-600 font-bold":""}>{stats.delivery===0?"FREE":`₹${stats.delivery}`}</span></div>
        {discount>0 && <div className="flex justify-between text-green-600"><span>Discount ({discount}%)</span><span>−₹{Number((stats.subtotal*discount)/100).toLocaleString()}</span></div>}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-800 text-base">Total Payable</span>
          <span className="font-bold text-gray-800 text-lg">₹{stats.total.toLocaleString()}</span>
        </div>
        <p className="text-green-600 text-xs font-semibold mt-1">
          {discount>0 && `You save ₹${Number((stats.subtotal*discount)/100).toLocaleString()} on this order`}
        </p>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={14} className="text-green-600 shrink-0"/>
          Safe and Secure Payments. Easy returns. 100% Authentic products.
        </div>
      </div>
    </div>
  );

  /* ─── INPUT STYLE ─── */
  const inp = "w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#2874F0] transition bg-white";

  /* ─── PAYMENT OPTIONS ─── */
  const PAY_TABS = [
    { id:"upi",   label:"UPI",               sub:"GPay, PhonePe, Paytm",  icon:<QrCode size={18}/> },
    { id:"card",  label:"Credit/Debit Card",  sub:"Visa, MasterCard, RuPay", icon:<CreditCard size={18}/> },
    { id:"emi",   label:"EMI",               sub:"No Cost & Standard EMI",  icon:<Sparkles size={18}/> },
    { id:"cod",   label:"Cash on Delivery",   sub:"Pay when you receive",  icon:<Banknote size={18}/> },
    { id:"lazer", label:"Lazer Pay",          sub:"Web3 Crypto Gateway",   icon:<Wallet2 size={18}/> },
  ];

  return (
    <div className="min-h-screen bg-[#f1f3f6] pt-16 pb-12">
      <div className="max-w-6xl mx-auto px-4">

        {/* ── Flipkart-style step breadcrumb ── */}
        <div className="flex items-center gap-6 py-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#2874F0] font-bold text-lg">balaji</span>
            <span className="font-black text-orange-500 text-lg">mart</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-bold ${step>=1?"text-[#2874F0]":"text-gray-400"}`}>1. DELIVERY ADDRESS</span>
            <span className="text-gray-300 mx-1">›</span>
            <span className={`font-bold ${step>=2?"text-[#2874F0]":"text-gray-400"}`}>2. PAYMENT</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ══════════ LEFT COLUMN ══════════ */}
          <div className="lg:col-span-2 space-y-3">

            {/* ── STEP 1: ADDRESS ── */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <StepHeader num={1} label="Delivery Address" active={step===1} done={step>1} onClick={()=>setStep(1)}/>

              <AnimatePresence>
                {step===1 && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                    <div className="p-5">

                      {/* Addresses list */}
                      {addressesLoading ? (
                        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-[#2874F0]" size={24}/></div>
                      ) : addresses.length===0 ? (
                        <p className="text-sm text-gray-500 py-4">No saved addresses. Add one below.</p>
                      ) : (
                        <div className="space-y-3 mb-4">
                          {addresses.map(addr => (
                            <div
                              key={addr.id}
                              onClick={()=>setSelectedAddress(addr)}
                              className={`flex gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAddress?.id===addr.id?"border-[#2874F0] bg-blue-50":"border-gray-200 hover:border-blue-300"}`}
                            >
                              {/* Radio */}
                              <div className="pt-0.5 shrink-0">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress?.id===addr.id?"border-[#2874F0]":"border-gray-400"}`}>
                                  {selectedAddress?.id===addr.id && <div className="w-2 h-2 rounded-full bg-[#2874F0]"/>}
                                </div>
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-800 text-sm">{addr.fullName}</span>
                                  <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{addr.addressType}</span>
                                  {addr.isDefault && <span className="text-[10px] font-bold uppercase bg-blue-100 text-[#2874F0] px-2 py-0.5 rounded">Default</span>}
                                </div>
                                <p className="text-sm text-gray-600">{addr.addressLine1}{addr.addressLine2?", "+addr.addressLine2:""}, {addr.city}, {addr.state} — {addr.pincode}</p>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Phone size={12}/> {addr.phone}</p>
                              </div>
                              {/* Delete */}
                              <button onClick={e=>handleDelete(e,addr.id)} className="text-gray-400 hover:text-red-500 transition shrink-0 self-start p-1">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new */}
                      <button
                        onClick={()=>setShowModal(true)}
                        className="flex items-center gap-2 text-[#2874F0] font-bold text-sm py-3 border-2 border-dashed border-blue-200 rounded-lg w-full justify-center hover:bg-blue-50 transition"
                      >
                        <Plus size={16}/> Add a new address
                      </button>

                      {/* Deliver here */}
                      {selectedAddress && (
                        <button
                          disabled={isCreatingOrder}
                          onClick={handleCreateOrder}
                          className="mt-4 w-full bg-[#FB641B] hover:bg-orange-600 disabled:opacity-60 text-white py-3.5 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition shadow-md"
                        >
                          {isCreatingOrder ? <><Loader2 className="animate-spin" size={16}/> Creating Order...</> : "DELIVER HERE"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed summary */}
              {step>1 && selectedAddress && (
                <div className="px-5 pb-4 text-sm text-gray-600">
                  <p className="font-bold text-gray-800">{selectedAddress.fullName}</p>
                  <p>{selectedAddress.addressLine1}, {selectedAddress.city} — {selectedAddress.pincode}</p>
                </div>
              )}
            </div>

            {/* ── STEP 2: PAYMENT ── */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <StepHeader num={2} label="Payment Options" active={step===2} done={false} onClick={()=>{}}/>

              <AnimatePresence>
                {step===2 && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                    <div className="flex min-h-[380px]">

                      {/* Left Tabs */}
                      <div className="w-44 shrink-0 border-r border-gray-200 bg-[#fafafa]">
                        {PAY_TABS.map(tab => (
                          <button
                            key={tab.id}
                            onClick={()=>setPaymentMethod(tab.id)}
                            className={`w-full text-left px-4 py-4 border-b border-gray-100 transition-all ${paymentMethod===tab.id?"bg-white border-l-4 border-l-[#2874F0]":"hover:bg-gray-50"}`}
                          >
                            <div className={`flex items-center gap-2 mb-0.5 ${paymentMethod===tab.id?"text-[#2874F0]":"text-gray-600"}`}>
                              {tab.icon}
                              <span className="font-bold text-xs">{tab.label}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight pl-7">{tab.sub}</p>
                          </button>
                        ))}
                      </div>

                      {/* Right panel */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        <AnimatePresence mode="wait">

                          {/* ── UPI ── */}
                          {paymentMethod==="upi" && (
                            <motion.div key="upi" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0}} className="space-y-5">
                              <div className="flex gap-2 border-b border-gray-200 pb-3">
                                {["upiId","qrCode"].map(t=>(
                                  <button key={t} onClick={()=>setUpiTab(t)}
                                    className={`pb-2 text-xs font-bold uppercase tracking-wider transition ${upiTab===t?"text-[#2874F0] border-b-2 border-[#2874F0]":"text-gray-400 hover:text-gray-600"}`}>
                                    {t==="upiId"?"UPI ID":"Scan & Pay"}
                                  </button>
                                ))}
                              </div>

                              {upiTab==="upiId" ? (
                                <div className="space-y-4">
                                  {/* UPI apps */}
                                  <div className="flex gap-3">
                                    {[{id:"gpay",label:"GPay"},{id:"phonepe",label:"PhonePe"},{id:"paytm",label:"Paytm"}].map(p=>(
                                      <button key={p.id} onClick={()=>setUpiProvider(p.id)}
                                        className={`flex-1 py-2.5 rounded border-2 text-xs font-bold transition ${upiProvider===p.id?"border-[#2874F0] bg-blue-50 text-[#2874F0]":"border-gray-200 text-gray-600 hover:border-blue-200"}`}>
                                        {p.label}
                                      </button>
                                    ))}
                                  </div>
                                  <form onSubmit={handleUpiSubmit} className="space-y-4">
                                    <div>
                                      <label className="text-xs font-semibold text-gray-500 block mb-1">UPI ID</label>
                                      <input className={inp} placeholder="e.g. name@upi" value={upiId} onChange={e=>setUpiId(e.target.value)}/>
                                    </div>
                                    <button disabled={isPaying} type="submit" className="w-full bg-[#FB641B] hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition">
                                      {isPaying?<Loader2 className="animate-spin" size={16}/>:`PAY ₹${stats.total.toLocaleString()}`}
                                    </button>
                                  </form>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center space-y-4 py-2">
                                  <div className="p-3 bg-white rounded-2xl shadow border border-gray-200 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-[#2874F0] animate-pulse"/>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=balajimart@hdfcbank%26pn=BalajiMart%26am=${stats.total}%26cu=INR`} alt="QR" className="w-36 h-36"/>
                                    {qrScanned && <div className="absolute inset-0 bg-white/95 flex items-center justify-center text-green-600"><CheckCircle size={36}/></div>}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock size={14} className="text-[#2874F0]"/>
                                    <span>Expires in {Math.floor(qrTimer/60)}:{(qrTimer%60).toString().padStart(2,"0")}</span>
                                  </div>
                                  <button disabled={qrScanned||isPaying} onClick={async()=>{setIsPaying(true);toast.info("Checking payment status...");await new Promise(r=>setTimeout(r,2500));setQrScanned(true);toast.success("Payment Verified!");await confirmPaymentDirectly("UPI: Scan & Pay (QR Code)");}}
                                    className="w-full max-w-xs bg-[#FB641B] hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition">
                                    {isPaying?<><Loader2 className="animate-spin" size={14}/>Verifying...</>:"I HAVE PAID"}
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}

                          {/* ── CARD ── */}
                          {paymentMethod==="card" && (
                            <motion.div key="card" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0}} className="space-y-4">
                              {/* Card preview */}
                              <div className="w-full max-w-xs h-40 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-5 text-white shadow-lg flex flex-col justify-between">
                                <div className="flex justify-between items-center">
                                  <div className="w-8 h-6 bg-yellow-400/30 rounded border border-yellow-400/40"/>
                                  <span className="text-xs font-bold opacity-60">{cardBrand||"CARD"}</span>
                                </div>
                                <div className="font-mono text-sm tracking-widest opacity-80">{cardNumber||"•••• •••• •••• ••••"}</div>
                                <div className="flex justify-between text-xs">
                                  <span className="uppercase opacity-70">{cardName||"YOUR NAME"}</span>
                                  <span className="opacity-70">{cardExpiry||"MM/YY"}</span>
                                </div>
                              </div>

                              <form onSubmit={handleCardSubmit} className="space-y-3">
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 block mb-1">Card Number</label>
                                  <input className={inp+" font-mono"} placeholder="0000 0000 0000 0000" value={cardNumber} onChange={handleCardNumberChange}/>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 block mb-1">Name on Card</label>
                                  <input className={inp} placeholder="As printed on card" value={cardName} onChange={e=>setCardName(e.target.value)}/>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Expiry (MM/YY)</label>
                                    <input className={inp+" text-center font-mono"} placeholder="MM/YY" value={cardExpiry} onChange={handleExpiryChange}/>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">CVV</label>
                                    <input className={inp+" text-center font-mono"} type="password" maxLength="4" placeholder="•••" value={cardCvv} onChange={handleCvvChange}/>
                                  </div>
                                </div>
                                <button disabled={isPaying} type="submit" className="w-full bg-[#FB641B] hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition mt-2">
                                  {isPaying?<Loader2 className="animate-spin" size={16}/>:`PAY ₹${stats.total.toLocaleString()}`}
                                </button>
                              </form>
                            </motion.div>
                          )}

                          {/* ── COD ── */}
                          {paymentMethod==="cod" && (
                            <motion.div key="cod" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0}} className="space-y-4">
                              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <Banknote size={20} className="text-[#2874F0] shrink-0 mt-0.5"/>
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">Cash on Delivery</p>
                                  <p className="text-xs text-gray-500 mt-1">Pay securely in cash at the time of delivery. COD available up to ₹50,000.</p>
                                </div>
                              </div>
                              <form onSubmit={handleCodSubmit} className="space-y-4">
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 block mb-1">Enter Verification Code</label>
                                  <div className="flex gap-3">
                                    <input className={inp+" flex-1 text-center font-mono tracking-widest text-lg"} maxLength={6} placeholder="------" value={captchaInput} onChange={e=>setCaptchaInput(e.target.value)}/>
                                    <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded px-4">
                                      <span className="font-mono font-bold text-gray-600 line-through">{captchaCode}</span>
                                      <button type="button" onClick={generateCaptcha} className="text-gray-400 hover:text-[#2874F0] transition"><RefreshCw size={14}/></button>
                                    </div>
                                  </div>
                                </div>
                                <button disabled={isPaying} type="submit" className="w-full bg-[#FB641B] hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition">
                                  {isPaying?<Loader2 className="animate-spin" size={16}/>:"CONFIRM COD ORDER"}
                                </button>
                              </form>
                            </motion.div>
                          )}

                          {/* ── EMI ── */}
                          {paymentMethod==="emi" && (
                            <motion.div key="emi" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0}} className="space-y-4">
                              <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1">Select Bank</label>
                                <select className={inp} value={selectedEmiBank} onChange={e=>{setSelectedEmiBank(e.target.value);setSelectedEmiPlan("");}}>
                                  <option value="">Choose your bank</option>
                                  {EMI_BANKS.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                              </div>
                              {selectedEmiBank && (
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-gray-500 block">Select EMI Plan</label>
                                  {EMI_BANKS.find(b=>b.id===selectedEmiBank)?.plans.map(p=>{
                                    const monthly = Math.round((stats.total*(1+p.interestMult))/p.months);
                                    const pid = `${p.months}-months`;
                                    return (
                                      <div key={p.months} onClick={()=>setSelectedEmiPlan(pid)}
                                        className={`flex justify-between items-center p-3 rounded-lg border-2 cursor-pointer transition ${selectedEmiPlan===pid?"border-[#2874F0] bg-blue-50":"border-gray-200 hover:border-blue-200"}`}>
                                        <div>
                                          <p className="font-bold text-gray-800 text-sm">₹{monthly.toLocaleString()}/mo</p>
                                          <p className="text-xs text-gray-400">{p.months} months @ {p.rate} p.a.</p>
                                        </div>
                                        {selectedEmiPlan===pid && <div className="w-5 h-5 rounded-full bg-[#2874F0] flex items-center justify-center"><Check size={12} className="text-white"/></div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {selectedEmiPlan && (
                                <form onSubmit={handleEmiSubmit} className="space-y-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs font-semibold text-gray-500">Enter Credit Card Details</p>
                                  <input className={inp+" font-mono"} placeholder="Card Number" value={cardNumber} onChange={handleCardNumberChange}/>
                                  <input className={inp} placeholder="Cardholder Name" value={cardName} onChange={e=>setCardName(e.target.value)}/>
                                  <div className="grid grid-cols-2 gap-3">
                                    <input className={inp+" text-center font-mono"} placeholder="MM/YY" value={cardExpiry} onChange={handleExpiryChange}/>
                                    <input className={inp+" text-center font-mono"} type="password" maxLength="4" placeholder="CVV" value={cardCvv} onChange={handleCvvChange}/>
                                  </div>
                                  <button disabled={isPaying} type="submit" className="w-full bg-[#FB641B] hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition">
                                    {isPaying?<Loader2 className="animate-spin" size={16}/>:"SETUP EMI & PAY"}
                                  </button>
                                </form>
                              )}
                            </motion.div>
                          )}

                          {/* ── LAZER ── */}
                          {paymentMethod==="lazer" && (
                            <motion.div key="lazer" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0}} className="space-y-4">
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 flex flex-col items-center text-center gap-4">
                                <Wallet2 size={32} className="text-purple-500"/>
                                <div>
                                  <p className="font-bold text-gray-800">Lazer Crypto Gateway</p>
                                  <p className="text-xs text-gray-500 mt-1">Web3 Payments Protocol</p>
                                </div>
                                {walletConnected ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Wallet Connected</span>
                                    <span className="font-mono text-xs text-gray-400">0x71C...8E29</span>
                                  </div>
                                ) : (
                                  <button onClick={()=>{setWalletConnected(true);toast.success("Wallet connected!");}} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-sm transition">
                                    Connect Wallet
                                  </button>
                                )}
                              </div>
                              <button disabled={isPaying||!walletConnected} onClick={handleLazerSubmit}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition">
                                {isPaying?<Loader2 className="animate-spin" size={16}/>:"PAY WITH LAZER"}
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
          </div>

          {/* ══════════ RIGHT COLUMN ══════════ */}
          <div className="sticky top-20">
            <PriceSummary/>
          </div>
        </div>
      </div>

      {/* ═══════════ ADD ADDRESS MODAL ═══════════ */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowModal(false)} className="absolute inset-0 bg-black/50"/>
            <motion.div initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:16}}
              className="bg-white w-full max-w-xl rounded-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="font-bold text-gray-800 text-base">Add New Delivery Address</h2>
                <button onClick={()=>setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20}/></button>
              </div>
              <div className="p-5 space-y-4">
                <button disabled={loading} onClick={handleAutofill}
                  className="w-full border-2 border-dashed border-[#2874F0] text-[#2874F0] py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition">
                  {loading?<Loader2 size={16} className="animate-spin"/>:<Navigation size={16}/>} Use My Location
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name *</label>
                    <input className={inp} placeholder="Your full name" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Mobile Number *</label>
                    <input className={inp} placeholder="10-digit mobile" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Alt. Number</label>
                    <input className={inp} placeholder="Optional" value={form.altPhone} onChange={e=>setForm({...form,altPhone:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Pincode *</label>
                    <input className={inp} placeholder="6-digit pincode" value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">City *</label>
                    <input className={inp} placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">State *</label>
                    <select className={inp} value={form.state} onChange={e=>setForm({...form,state:e.target.value})}>
                      <option value="">Select State</option>
                      {STATES_INDIA.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Flat, House no., Building *</label>
                    <input className={inp} placeholder="House/Flat/Apartment no." value={form.addressLine1} onChange={e=>setForm({...form,addressLine1:e.target.value})}/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Area, Colony, Street</label>
                    <input className={inp} placeholder="Colony, Street, Sector, Village" value={form.addressLine2} onChange={e=>setForm({...form,addressLine2:e.target.value})}/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Landmark</label>
                    <input className={inp} placeholder="E.g. Near Apollo Hospital" value={form.landmark} onChange={e=>setForm({...form,landmark:e.target.value})}/>
                  </div>
                  {/* Address type */}
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-2">Address Type</label>
                    <div className="flex gap-3">
                      {["Home","Work","Other"].map(t=>(
                        <button key={t} type="button" onClick={()=>setForm({...form,addressType:t})}
                          className={`px-4 py-1.5 rounded border text-xs font-bold transition ${form.addressType===t?"border-[#2874F0] text-[#2874F0] bg-blue-50":"border-gray-300 text-gray-600 hover:border-blue-300"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e=>setForm({...form,isDefault:e.target.checked})} className="accent-[#2874F0]"/>
                    <label htmlFor="isDefault" className="text-sm text-gray-600">Make this my default address</label>
                  </div>
                </div>
                <button onClick={handleAddAddress}
                  className="w-full bg-[#FB641B] hover:bg-orange-600 text-white py-3 rounded font-bold text-sm uppercase tracking-wide transition shadow">
                  SAVE AND DELIVER HERE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════ OTP MODAL ═══════════ */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>{if(!otpLoading)setShowOtpModal(false);}} className="absolute inset-0 bg-black/60"/>
            <motion.div initial={{opacity:0,scale:0.95,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:16}}
              className="bg-white w-full max-w-sm rounded-lg shadow-2xl relative p-6">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck size={24} className="text-[#2874F0]"/>
                </div>
                <h3 className="font-bold text-gray-800">Secure Authentication</h3>
                <p className="text-xs text-gray-500 mt-1">{otpTargetMode}</p>
              </div>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1 text-center">Enter 6-Digit OTP</label>
                  <input type="text" maxLength={6} placeholder="000000" value={otpValue}
                    onChange={e=>setOtpValue(e.target.value.replace(/\D/g,""))} disabled={otpLoading}
                    className="w-full text-center text-2xl font-mono tracking-[0.3em] border-2 border-gray-200 focus:border-[#2874F0] rounded-lg px-4 py-3 outline-none transition"/>
                  {otpError && <p className="text-xs text-red-500 font-semibold text-center mt-1">{otpError}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={()=>setOtpValue("123456")} disabled={otpLoading}
                    className="flex-1 border-2 border-gray-200 text-gray-600 text-xs font-bold py-3 rounded hover:border-blue-300 transition">
                    Auto-fill OTP
                  </button>
                  <button type="submit" disabled={otpLoading}
                    className="flex-1 bg-[#FB641B] hover:bg-orange-600 text-white text-xs font-bold py-3 rounded transition flex items-center justify-center gap-2">
                    {otpLoading?<Loader2 className="animate-spin" size={14}/>:"VERIFY & PAY"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payment;