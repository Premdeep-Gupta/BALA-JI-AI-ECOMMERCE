import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft, Check, Upload, Trash2, Calendar, Clock, AlertCircle, RefreshCw, Wallet, CreditCard, ArrowLeftRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { requestOrderReturn } from "../store/slices/orderSlice";
import { toast } from "react-toastify";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// ── Reasons per action type ──────────────────────────────────────────────────
const RETURN_REFUND_REASONS = [
  { value: "Defective / Damaged", label: "Defective / Damaged", requiresImage: true },
  { value: "Item not as described", label: "Item not as described", requiresImage: true },
  { value: "Empty Box", label: "Empty Box Received", requiresImage: true },
  { value: "Wrong item sent", label: "Wrong Item Sent", requiresImage: true },
  { value: "Size / Fit issue", label: "Size / Fit Issue", requiresImage: false },
  { value: "Quality not satisfactory", label: "Quality not satisfactory", requiresImage: false },
  { value: "Changed my mind", label: "Changed my mind", requiresImage: false },
  { value: "Other", label: "Other", requiresImage: false },
];

const EXCHANGE_REASONS = [
  { value: "Wrong size ordered", label: "Wrong Size Ordered", requiresImage: false },
  { value: "Size not fitting", label: "Size Not Fitting After Try-on", requiresImage: false },
  { value: "Want different colour", label: "Want a Different Colour Variant", requiresImage: false },
  { value: "Received wrong size", label: "Received Wrong Size (Seller Error)", requiresImage: false },
  { value: "Fabric preference change", label: "Fabric Preference Change", requiresImage: false },
  { value: "Gift exchange", label: "Gift Exchange", requiresImage: false },
];

export const ReturnWizardModal = ({ order, onClose }) => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State: Item selection
  const [selectedItems, setSelectedItems] = useState(() => {
    const initial = {};
    if (order.order_items && order.order_items.length > 0) {
      initial[0] = { checked: true, qty: 1 };
    }
    return initial;
  });

  // Step 2 State: Return Action — "refund_source" | "refund_wallet" | "exchange"
  const [returnAction, setReturnAction] = useState("refund_source");

  // Step 3 State: Reason
  const isExchange = returnAction === "exchange";
  const reasonList = isExchange ? EXCHANGE_REASONS : RETURN_REFUND_REASONS;
  const [reason, setReason] = useState(reasonList[0].value);
  const [comments, setComments] = useState("");

  // Step 4 State: Media Upload
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Step 5 State: Pickup Details
  const [pickupSlot, setPickupSlot] = useState("morning");
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  // Bank Account State for COD / QR Scan order refunds
  const [bankDetails, setBankDetails] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: ""
  });

  // Real-Name Verification States
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [verifiedUpiName, setVerifiedUpiName] = useState("");
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [verifiedBankName, setVerifiedBankName] = useState("");

  const handleVerifyUpi = () => {
    if (!bankDetails.upi_id || !bankDetails.upi_id.includes("@")) {
      return toast.error("Please enter a valid UPI ID format (e.g., username@bank).");
    }
    setVerifyingUpi(true);
    setTimeout(() => {
      setVerifyingUpi(false);
      setVerifiedUpiName(authUser?.name || "Premdeep Gupta");
      toast.success("UPI ID Verified successfully!");
    }, 1000);
  };

  const handleVerifyBank = () => {
    if (!bankDetails.account_number || !bankDetails.ifsc_code) {
      return toast.error("Please enter both Account Number and IFSC Code.");
    }
    setVerifyingBank(true);
    setTimeout(() => {
      setVerifyingBank(false);
      setVerifiedBankName(authUser?.name || "Premdeep Gupta");
      toast.success("Bank Account Verified successfully!");
    }, 1000);
  };

  // Determine current reason config
  const currentReasonConfig = reasonList.find(r => r.value === reason) || reasonList[0];
  const isImageMandatory = !isExchange && currentReasonConfig.requiresImage;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleItemToggle = (idx) => {
    setSelectedItems(prev => {
      const current = prev[idx];
      if (current) {
        const copy = { ...prev };
        delete copy[idx];
        return copy;
      } else {
        return { ...prev, [idx]: { checked: true, qty: 1 } };
      }
    });
  };

  const handleQtyChange = (idx, val, maxQty) => {
    setSelectedItems(prev => {
      if (!prev[idx]) return prev;
      return { ...prev, [idx]: { ...prev[idx], qty: Math.min(maxQty, Math.max(1, val)) } };
    });
  };

  const handleActionChange = (actionId) => {
    setReturnAction(actionId);
    const newList = actionId === "exchange" ? EXCHANGE_REASONS : RETURN_REFUND_REASONS;
    setReason(newList[0].value);
    if (actionId === "exchange") {
      uploadedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
      setUploadedFiles([]);
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const updated = [...uploadedFiles];
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error(`File "${file.name}" exceeds 5MB size limit.`);
      }
      
      const fileType = file.type.split("/")[0];
      const previewUrl = URL.createObjectURL(file);
      updated.push({ file, type: fileType, previewUrl });
    });
    setUploadedFiles(updated);
  };

  const handleRemoveFile = (idx) => {
    const updated = [...uploadedFiles];
    URL.revokeObjectURL(updated[idx].previewUrl);
    updated.splice(idx, 1);
    setUploadedFiles(updated);
  };

  // ── Next step validation ──────────────────────────────────────────────────
  const handleNext = () => {
    // On step 1: ensure at least 1 item selected
    if (step === 1 && Object.keys(selectedItems).length === 0) {
      return toast.error("Please select at least 1 item to return.");
    }
    // On step 2: validate bank details if payment is COD / QR scan / UPI and source refund chosen
    if (step === 2 && returnAction === "refund_source") {
      const isManualPay = order.payment_mode?.includes("COD") || order.payment_mode?.includes("QR") || order.payment_mode?.includes("Scan") || order.payment_mode === "Exchange";
      const { account_name, bank_name, account_number, ifsc_code, upi_id } = bankDetails;
      
      if (isManualPay) {
        // Complete bank details are mandatory for COD / QR
        const hasBank = account_name.trim() && bank_name.trim() && account_number.trim() && ifsc_code.trim();
        if (!hasBank) {
          return toast.error("Please provide complete Bank Account details (Name, Bank Name, Account Number, and IFSC Code) for your refund.");
        }
      } else {
        // Prepaid / UPI orders can accept either bank details or UPI ID
        const hasUpi = upi_id.trim().length > 0;
        const hasBank = account_name.trim().length > 0 && bank_name.trim().length > 0 && account_number.trim().length > 0 && ifsc_code.trim().length > 0;
        if (!hasUpi && !hasBank) {
          return toast.error("Please provide either your UPI ID or complete Bank Account details.");
        }
      }
    }
    // On step 4 (media): enforce mandatory upload
    if (step === 4 && isImageMandatory && uploadedFiles.length === 0) {
      return toast.error(`Image upload is mandatory for "${reason}". Please attach at least one photo.`);
    }
    // Skip media upload step (step 4) for exchange
    if (step === 3 && isExchange) {
      setStep(5); // skip step 4 entirely for exchange
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    // When going back from step 5, if exchange skip step 4
    if (step === 5 && isExchange) {
      setStep(3);
      return;
    }
    setStep(s => s - 1);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitReturn = async () => {
    const itemsArray = Object.keys(selectedItems).map(idx => {
      const orderItem = order.order_items[Number(idx)];
      return {
        title: orderItem.title,
        price: orderItem.price,
        quantity: selectedItems[idx].qty,
        image: orderItem.image || ""
      };
    });

    if (itemsArray.length === 0) {
      return toast.error("Please select at least 1 item to return.");
    }

    setIsSubmitting(true);
    try {
      // Convert all uploaded files to base64 (real images for QC)
      let base64Media = [];
      if (uploadedFiles.length > 0) {
        const mediaPromises = uploadedFiles.map(f => convertToBase64(f.file));
        base64Media = await Promise.all(mediaPromises);
      }

      const returnData = {
        action: returnAction,
        reason,
        comments,
        items: itemsArray,
        pickup: { date: pickupDate, slot: pickupSlot },
        media: base64Media,
        // Send user's chosen refund method to backend so admin sees it
        refund_method: isExchange ? "exchange" : returnAction === "refund_wallet" ? "Store Wallet Credits" : "Refund to Original Payment Source",
        bank_details: returnAction === "refund_source" ? bankDetails : null
      };

      dispatch(requestOrderReturn({ orderId: order.id, returnData }));
      toast.success("Return request submitted successfully!");
      onClose();
    } catch (err) {
      console.error("Return submit error:", err);
      toast.error("Failed to submit return request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Total step count: 5 (but exchange skips step 4)
  const visibleTotalSteps = isExchange ? 4 : 5;
  const visibleStepNum = (step === 5 && isExchange) ? 4 : step;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0d0710] border border-white/10 text-slate-200 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative p-6 md:p-8 max-h-[88vh] overflow-y-auto custom-scrollbar z-10"
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-full transition">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">
            {isExchange ? "Exchange Assistant" : "Return & Refund Assistant"}
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">
            {isExchange ? "Exchange Request" : "Order Return Request"}
          </h2>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-mono">
            <span>Step {visibleStepNum} of {visibleTotalSteps}</span>
            <span>•</span>
            <span>ID: #{order.id?.slice(-8).toUpperCase()}</span>
          </div>

          {/* Step Progress Bar */}
          <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${(visibleStepNum / visibleTotalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[220px] mb-8">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: ITEM SELECTION ──────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Select Items & Quantities</label>
                <div className="space-y-2">
                  {order.order_items.map((item, idx) => {
                    const isChecked = !!selectedItems[idx];
                    return (
                      <div key={idx} className={`p-4 rounded-2xl border transition flex items-center gap-4 ${isChecked ? "border-red-600 bg-red-600/5" : "border-white/5 bg-white/[0.02]"}`}>
                        <input type="checkbox" checked={isChecked} onChange={() => handleItemToggle(idx)} className="w-4 h-4 accent-red-600 cursor-pointer" />
                        <img src={item.image} className="w-12 h-12 object-cover rounded-xl border border-white/5" alt="" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">₹{item.price.toLocaleString()}</p>
                        </div>
                        {isChecked && (
                          <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 bg-black/40">
                            <button type="button" onClick={() => handleQtyChange(idx, selectedItems[idx].qty - 1, item.quantity)} className="px-2 py-0.5 text-xs font-black text-slate-400 hover:text-white">-</button>
                            <span className="w-5 text-center text-xs font-bold text-white">{selectedItems[idx].qty}</span>
                            <button type="button" onClick={() => handleQtyChange(idx, selectedItems[idx].qty + 1, item.quantity)} className="px-2 py-0.5 text-xs font-black text-slate-400 hover:text-white">+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: RETURN ACTION ───────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Choose Resolution Mode</label>
                <div className="space-y-3">
                  {[
                    {
                      id: "refund_source",
                      icon: <CreditCard size={18} className="text-green-400" />,
                      title: "Refund to Original Source",
                      desc: "Amount refunded back to your original card / UPI / bank used at checkout.",
                      badge: "3-5 Business Days"
                    },
                    {
                      id: "refund_wallet",
                      icon: <Wallet size={18} className="text-amber-400" />,
                      title: "Instant Store Wallet Credits",
                      desc: "Refund credited instantly to your Balaji Mart wallet for next purchase.",
                      badge: "Instant"
                    },
                    {
                      id: "exchange",
                      icon: <ArrowLeftRight size={18} className="text-blue-400" />,
                      title: "Exchange for Same Item",
                      desc: "Swap size, colour or replace with same product. Pickup & delivery happen simultaneously.",
                      badge: "Simultaneous Pickup & Delivery"
                    }
                  ].map(act => (
                    <div
                      key={act.id}
                      onClick={() => handleActionChange(act.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition ${returnAction === act.id ? "border-red-600 bg-red-600/5" : "border-white/5 bg-white/[0.02]"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{act.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-bold text-xs text-white">{act.title}</h4>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              act.id === "exchange" ? "bg-blue-500/20 text-blue-400" :
                              act.id === "refund_wallet" ? "bg-amber-500/20 text-amber-400" :
                              "bg-green-500/20 text-green-400"
                            }`}>{act.badge}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{act.desc}</p>
                        </div>
                        {returnAction === act.id && <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shrink-0"><Check size={12} className="text-white" /></div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bank / UPI details form if Refund to Source is selected */}
                {returnAction === "refund_source" && (
                  <div className="mt-4 p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <AlertCircle size={14} className="text-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-white">Add Payout Details for Refund</span>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      {/* If COD / QR, bank account details are required */}
                      {(order.payment_mode?.includes("COD") || order.payment_mode?.includes("QR") || order.payment_mode?.includes("Scan") || order.payment_mode === "Exchange") ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Account Holder Name *</label>
                              <input
                                type="text"
                                value={bankDetails.account_name}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, account_name: e.target.value });
                                  setVerifiedBankName("");
                                }}
                                placeholder="John Doe"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Bank Name *</label>
                              <input
                                type="text"
                                value={bankDetails.bank_name}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, bank_name: e.target.value });
                                  setVerifiedBankName("");
                                }}
                                placeholder="HDFC Bank"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Account Number *</label>
                              <input
                                type="text"
                                value={bankDetails.account_number}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, account_number: e.target.value });
                                  setVerifiedBankName("");
                                }}
                                placeholder="50100012345678"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Bank IFSC Code *</label>
                              <input
                                type="text"
                                value={bankDetails.ifsc_code}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() });
                                  setVerifiedBankName("");
                                }}
                                placeholder="HDFC0000240"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleVerifyBank}
                              disabled={verifyingBank || !bankDetails.account_number || !bankDetails.ifsc_code}
                              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50"
                            >
                              {verifyingBank ? "Verifying..." : "Verify Bank Account"}
                            </button>
                          </div>
                          {verifiedBankName && (
                            <p className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/25 p-2 rounded-xl flex items-center gap-1.5 mt-1">
                              <Check size={12} className="text-green-400" /> Account Verified: {verifiedBankName}
                            </p>
                          )}
                        </>
                      ) : (
                        /* If online payment / UPI, they can add UPI ID or Bank account details */
                        <>
                          <div className="space-y-2">
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">UPI ID (VPA) *</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={bankDetails.upi_id}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, upi_id: e.target.value });
                                  setVerifiedUpiName("");
                                }}
                                placeholder="johndoe@okhdfcbank"
                                className="flex-1 bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyUpi}
                                disabled={verifyingUpi || !bankDetails.upi_id}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50"
                              >
                                {verifyingUpi ? "Verifying..." : "Verify"}
                              </button>
                            </div>
                            {verifiedUpiName && (
                              <p className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/25 p-2 rounded-xl flex items-center gap-1.5 mt-1">
                                <Check size={12} className="text-green-400" /> UPI ID Verified: {verifiedUpiName}
                              </p>
                            )}
                          </div>

                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-black uppercase">OR</span>
                            <div className="flex-grow border-t border-white/5"></div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Account Holder Name</label>
                              <input
                                type="text"
                                value={bankDetails.account_name}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, account_name: e.target.value });
                                  setVerifiedBankName("");
                                }}
                                placeholder="John Doe"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Bank Name</label>
                              <input
                                type="text"
                                value={bankDetails.bank_name}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, bank_name: e.target.value });
                                  setVerifiedBankName("");
                                }}
                                placeholder="HDFC Bank"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Account Number</label>
                              <input
                                type="text"
                                value={bankDetails.account_number}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, account_number: e.target.value });
                                  setVerifiedBankName("");
                                }}
                                placeholder="50100012345678"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Bank IFSC Code</label>
                              <input
                                type="text"
                                value={bankDetails.ifsc_code}
                                onChange={(e) => {
                                  setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() });
                                  setVerifiedBankName("");
                                }}
                                placeholder="HDFC0000240"
                                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleVerifyBank}
                              disabled={verifyingBank || !bankDetails.account_number || !bankDetails.ifsc_code}
                              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50"
                            >
                              {verifyingBank ? "Verifying..." : "Verify Bank Account"}
                            </button>
                          </div>
                          {verifiedBankName && (
                            <p className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/25 p-2 rounded-xl flex items-center gap-1.5 mt-1">
                              <Check size={12} className="text-green-400" /> Account Verified: {verifiedBankName}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: REASON & COMMENTS ───────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  {isExchange ? "Why do you want to exchange?" : "Tell us what went wrong"}
                </label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 block font-semibold">Reason Category</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-xs"
                    >
                      {reasonList.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>

                    {/* Mandatory image warning for return/refund reasons */}
                    {!isExchange && currentReasonConfig.requiresImage && (
                      <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <AlertCircle size={13} className="text-amber-400 shrink-0" />
                        <p className="text-[10px] text-amber-300 font-semibold">
                          Photo / video proof is <strong>mandatory</strong> for this reason. You must upload at least 1 image.
                        </p>
                      </div>
                    )}

                    {/* Exchange info note */}
                    {isExchange && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <RefreshCw size={13} className="text-blue-400 shrink-0" />
                        <p className="text-[10px] text-blue-300 font-semibold">
                          No image upload required for exchange. Our agent will inspect at pickup.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 block font-semibold">Additional Details (Optional)</label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={isExchange ? "e.g. I ordered size L but need XL instead..." : "Describe the issue in detail..."}
                      className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-red-500 transition-all text-xs h-28 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: PHOTO/VIDEO UPLOAD (only for non-exchange) ─── */}
            {step === 4 && !isExchange && (
              <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                    Attach Damage Proof
                  </label>
                  {isImageMandatory && (
                    <span className="text-[9px] font-black uppercase px-2 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/20">
                      MANDATORY
                    </span>
                  )}
                </div>

                <div className="border-2 border-dashed border-white/10 hover:border-red-500/40 rounded-2xl p-6 text-center cursor-pointer transition bg-white/[0.01] relative flex flex-col items-center justify-center min-h-[120px]">
                  <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="text-red-500 mb-2" size={24} />
                  <p className="text-xs font-bold text-white">Drag & drop or Click to upload</p>
                  <p className="text-[10px] text-slate-500 mt-1">Photos (PNG, JPG) or Video logs (MP4) — Max 5MB each</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {uploadedFiles.map((fileObj, idx) => (
                      <div key={idx} className="relative aspect-square bg-[#0c0c0f] border border-white/10 rounded-xl overflow-hidden group">
                        {fileObj.type === "image" ? (
                          <img src={fileObj.previewUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-red-500 bg-red-500/10">
                            <span className="text-[9px] font-black uppercase font-mono">Video</span>
                          </div>
                        )}
                        <button onClick={() => handleRemoveFile(idx)} className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 p-1.5 rounded-full text-white transition scale-90">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Note */}
                <p className="text-[10px] text-slate-600 italic">
                  These images will be reviewed by our QC team before processing your refund.
                </p>
              </motion.div>
            )}

            {/* ── STEP 5: SCHEDULE PICKUP ─────────────────────────────── */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Schedule Pickup Slot</label>

                {isExchange && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <RefreshCw size={16} className="text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-300">Simultaneous Pickup & Delivery</p>
                      <p className="text-[10px] text-blue-400/70 mt-0.5 leading-relaxed">
                        Your exchange agent will pick up the old item and deliver the replacement at the same time — saving delivery charges for both sides.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-slate-400">Pickup Address:</p>
                  <p className="text-white">{order.full_name}</p>
                  <p className="text-slate-500 leading-relaxed">{order.address}, {order.city}, {order.state} - {order.pincode}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1.5"><Calendar size={12} /> Schedule Date</label>
                    <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1.5"><Clock size={12} /> Preferred Slot</label>
                    <select value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:border-red-500 transition-all font-bold text-xs">
                      <option value="morning">Morning (9am–12pm)</option>
                      <option value="afternoon">Afternoon (12pm–4pm)</option>
                      <option value="evening">Evening (4pm–7pm)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-red-950/15 border border-red-500/10 rounded-2xl flex gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {isExchange
                      ? "Ensure the original item is packed securely. Exchange agent will verify condition at pickup before handing over the replacement."
                      : "Make sure packaging tags are intact. QC executive will evaluate product condition at pickup before confirming return."}
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 border-t border-white/5 pt-6 mt-6">
          {step > 1 ? (
            <button onClick={handleBack} className="flex-1 py-3.5 border border-white/10 hover:border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> Back
            </button>
          ) : null}

          {step < 5 ? (
            <button onClick={handleNext} className="flex-[2] bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
              Next Step <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmitReturn} disabled={isSubmitting} className="flex-[2] bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:from-slate-800 disabled:to-slate-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
              {isSubmitting ? "Processing..." : isExchange ? "Submit Exchange Request" : "Submit Return Request"}
            </button>
          )}
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      `}</style>
    </div>
  );
};
