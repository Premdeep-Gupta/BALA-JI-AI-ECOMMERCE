import React, { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders } from "../store/slices/orderSlice";
import { 
  ArrowLeft, ShieldCheck, MapPin, Phone, CreditCard, ShoppingBag, 
  CheckCircle2, Package, Truck, Smartphone, Home, Download, 
  ArrowLeftRight, Calendar, AlertCircle, Printer
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";

// Invoice & Return sub-features integrated directly
import { InvoiceTemplate } from "./InvoiceTemplate"; 
import { ReturnWizardModal } from "../components/ReturnWizardModal"; 

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "details"; // default to details

  const { myOrders = [], fetchingOrders } = useSelector((state) => state.order);
  const { authUser } = useSelector((state) => state.auth);

  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    if (myOrders.length === 0) {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, myOrders.length]);

  const order = myOrders.find((o) => o.id === id);

  if (fetchingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] px-4">
        <AlertCircle size={48} className="text-[var(--primary)] mb-4" />
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <p className="opacity-70 text-sm mt-1 mb-6">The requested order ID could not be found.</p>
        <Link to="/orders" className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--text)] px-6 py-2.5 rounded-xl font-bold transition text-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  // Calculate Dates dynamically for tracking steps based on created_at
  const getStepDate = (stepIndex, baseDateStr) => {
    const baseDate = new Date(baseDateStr);
    let offsetHours = 0;
    if (stepIndex === 1) offsetHours = 12; // Packed
    if (stepIndex === 2) offsetHours = 24; // Shipped
    if (stepIndex === 3) offsetHours = 36; // Out for Delivery
    if (stepIndex === 4) offsetHours = 48; // Delivered

    baseDate.setHours(baseDate.getHours() + offsetHours);
    return baseDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const trackingSteps = [
    { label: "Processing", title: "Order Placed & Confirmed", desc: "Your order has been placed and confirmed.", icon: CheckCircle2 },
    { label: "Packed", title: "Order Packed & Prepared", desc: "Your item has been packed with premium safety wrapping.", icon: Package },
    { label: "Shipped", title: "Package Dispatched", desc: "Your package has been dispatched to the transit carrier.", icon: Truck },
    { label: "Out for Delivery", title: "Out for Delivery", desc: "Our delivery partner is on the way to your location.", icon: Smartphone },
    { label: "Delivered", title: "Successfully Delivered", desc: "Your package has been successfully and securely delivered.", icon: Home }
  ];

  const getStepStatus = (stepIndex) => {
    const statusList = ["Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];
    const currentStatus = order.order_status === "Order Packed" ? "Packed" : order.order_status;

    if (currentStatus === "Cancelled") return "cancelled";

    const currentIdx = statusList.indexOf(currentStatus);
    const effectiveCurrentIdx = currentIdx === -1 ? 0 : currentIdx;

    if (stepIndex < effectiveCurrentIdx) return "completed";
    if (stepIndex === effectiveCurrentIdx) return "current";
    return "pending";
  };

  // Include exchange orders in isReturnRelated
  const isReturnRelated = [
    "Return Requested", "Returned", "Refunded", "Exchange Approved", "Exchange Out for Delivery", "Exchange Completed"
  ].includes(order.order_status) || order.payment_mode === "Exchange";

  const isExchangeAction = order.return_info?.action === "exchange" || order.payment_mode === "Exchange";

  const getReturnStepStatus = (stepIndex) => {
    if (order.order_status === "Exchange Approved") {
      if (stepIndex < 3) return "completed";
      if (stepIndex === 3) return "current";
      return "pending";
    }
    if (order.order_status === "Exchange Out for Delivery") {
      if (stepIndex < 4) return "completed";
      if (stepIndex === 4) return "current";
      return "pending";
    }
    if (order.order_status === "Exchange Completed" || order.order_status === "Refunded") {
      return "completed";
    }

    if (!order.return_info) return "pending";
    const status = order.return_info.status;
    if (status === "Rejected") return "rejected";
    if (status === "Refund Processed") return "completed";

    let effectiveCurrentIdx = 0;
    if (status === "Pending") {
      effectiveCurrentIdx = 0;
    } else if (status === "Under QC") {
      effectiveCurrentIdx = 2;
    } else if (status === "Approved") {
      effectiveCurrentIdx = 3;
    }

    if (stepIndex < effectiveCurrentIdx) return "completed";
    if (stepIndex === effectiveCurrentIdx) return "current";
    return "pending";
  };

  const returnTrackingSteps = [
    {
      title: isExchangeAction ? "Exchange Requested" : "Return Requested",
      desc: isExchangeAction ? "Your exchange request has been registered." : "Your return request has been successfully registered.",
      icon: CheckCircle2
    },
    {
      title: isExchangeAction ? "Simultaneous Pickup & Delivery Scheduled" : "Pickup Completed",
      desc: isExchangeAction
        ? "Exchange agent will pick up old item & deliver replacement simultaneously."
        : "Courier partner has collected the package, and it is in transit.",
      icon: Package
    },
    {
      title: "Quality Check (QC) In Progress",
      desc: "Warehouse inspectors checking physical condition of returned product.",
      icon: ShieldCheck
    },
    {
      title: isExchangeAction ? "Exchange Approved" : "Return Approved",
      desc: isExchangeAction
        ? "QC passed. Replacement order has been approved and is being prepared."
        : "QC passed. Refund payout has been approved by admin.",
      icon: CreditCard
    },
    {
      title: isExchangeAction ? "Replacement Dispatched & Delivered" : "Refund Disbursed & Complete",
      desc: isExchangeAction
        ? "Your replacement item has been delivered and exchanged."
        : "Refund has been successfully credited to your original payment method / wallet.",
      icon: CheckCircle2
    }
  ];

  // Trigger Invoice Download (A4 print)
  const handleDownloadInvoice = () => {
    const invoiceWin = window.open("", "_blank");
    if (!invoiceWin) {
      return toast.error("Pop-up blocker is active! Cannot open the invoice preview.");
    }
    const htmlContent = InvoiceTemplate(order, authUser);
    invoiceWin.document.write(htmlContent);
    invoiceWin.document.close();
  };

  const handlePrintWindow = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[var(--bg)] text-[var(--text)] selection:bg-red-500/30 print:bg-white print:text-black">
      
      {/* Background Decorative Blobs - Hide during printing */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/25 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/15 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link - Hide during printing */}
        <div className="mb-8 flex justify-between items-center print:hidden">
          <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-bold opacity-70 hover:opacity-100 transition uppercase tracking-widest">
            <ArrowLeft size={16} /> Back to My Orders
          </Link>
          
          {/* Quick tab switcher */}
          <div className="flex bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
            <button 
              onClick={() => setSearchParams({ tab: "details" })}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === "details" ? "bg-[var(--primary)] text-white" : "opacity-60 hover:opacity-100"
              }`}
            >
              Invoice details
            </button>
            <button 
              onClick={() => setSearchParams({ tab: "track" })}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === "track" ? "bg-[var(--primary)] text-white" : "opacity-60 hover:opacity-100"
              }`}
            >
              Track Package
            </button>
          </div>
        </div>

        {activeTab === "track" ? (
          /* ========================================================================= */
          /*                       TAB 1: TRACK PACKAGE LAYOUT                         */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT: PROGRESS / TIMELINE */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[var(--card)] border border-[var(--border)] p-6 md:p-8 rounded-[2rem] shadow-xl backdrop-blur-md">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-[var(--primary)] uppercase leading-none mb-1.5">
                      {order.payment_mode === "Exchange" ? "Track Exchange Package" : "Track Package"}
                    </p>
                    <h2 className="text-xl font-bold font-mono text-[var(--text)]">#{order.id?.slice(-12).toUpperCase()}</h2>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded-xl border text-[9px] font-black tracking-widest uppercase ${
                      order.order_status === "Delivered" ? "bg-green-500/10 border-green-500/20 text-green-500" :
                      order.order_status === "Cancelled" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    }`}>
                      {order.order_status}
                    </span>
                  </div>
                </div>

                {/* TIMELINE TRACKING */}
                {order.order_status === "Cancelled" ? (
                  <div className="p-6 bg-red-950/20 border border-red-500/25 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Order Cancelled</h4>
                      <p className="text-xs opacity-70 leading-relaxed mt-1">
                        Your order has been cancelled. Please contact customer support to check your refund status.
                      </p>
                    </div>
                  </div>
                ) : isReturnRelated ? (
                  <div className="space-y-6">
                    {order.return_info?.reason && (
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase leading-none">Return Reason</p>
                        <p className="text-xs text-white font-bold mt-1.5 uppercase">{order.return_info.reason.replace(/_/g, ' ')}</p>
                        {order.return_info.comments && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">"{order.return_info.comments}"</p>
                        )}
                      </div>
                    )}

                    {order.return_info?.status === "Rejected" && (
                      <div className="p-6 bg-red-950/20 border border-red-500/25 rounded-2xl flex items-start gap-4">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-white text-sm">Return Request Rejected</h4>
                          <p className="text-xs opacity-70 leading-relaxed mt-1 text-slate-300">
                            Your product did not pass our quality control checks:
                            <strong className="text-white block mt-1">"{order.return_info.qc_report?.qc_notes || "Product condition does not meet our guidelines."}"</strong>
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--border)]">
                      {returnTrackingSteps.map((step, idx) => {
                        const status = getReturnStepStatus(idx);
                        const StepIcon = step.icon;
                        
                        return (
                          <div key={idx} className="relative flex flex-col sm:flex-row sm:items-start gap-4 group">
                            
                            {/* Status Bubble */}
                            <div className={`absolute -left-[30px] w-[18px] h-[18px] rounded-full border-4 transition-all duration-500 ${
                              status === "completed" ? "bg-green-500 border-[var(--bg)] shadow-[0_0_10px_#22c55e]" :
                              status === "current" ? "bg-[var(--bg)] border-yellow-500 animate-pulse shadow-[0_0_15px_#eab308]" :
                              status === "rejected" ? "bg-rose-500 border-[var(--bg)] shadow-[0_0_10px_#f43f5e]" :
                              "bg-[var(--bg)] border-[var(--border)]"
                            }`} />

                            <div className="flex-1 space-y-1">
                              <h4 className={`text-sm font-bold flex items-center gap-2 ${
                                status === "pending" ? "opacity-40" : "text-[var(--text)]"
                              }`}>
                                <StepIcon size={16} className={status === "pending" ? "opacity-40" : status === "completed" ? "text-green-500" : "text-yellow-500"} />
                                {step.title}
                              </h4>
                              <p className={`text-xs ${status === "pending" ? "opacity-30" : "opacity-70"}`}>
                                {step.desc}
                              </p>
                            </div>

                            {/* Date */}
                            <div className="text-left sm:text-right shrink-0">
                              <p className={`text-[10px] font-mono font-bold ${
                                status === "pending" ? "opacity-30" : "opacity-75"
                              }`}>
                                {order.return_info?.created_at ? new Date(order.return_info.created_at).toLocaleDateString('en-IN') : ""}
                              </p>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--border)]">
                    {trackingSteps.map((step, idx) => {
                      const status = getStepStatus(idx);
                      const StepIcon = step.icon;
                      
                      return (
                        <div key={idx} className="relative flex flex-col sm:flex-row sm:items-start gap-4 group">
                          
                          {/* Status Bubble */}
                          <div className={`absolute -left-[30px] w-[18px] h-[18px] rounded-full border-4 transition-all duration-500 ${
                            status === "completed" ? "bg-[var(--primary)] border-[var(--bg)] shadow-[0_0_10px_var(--primary)]" :
                            status === "current" ? "bg-[var(--bg)] border-[var(--primary)] animate-pulse shadow-[0_0_15px_var(--primary)]" :
                            "bg-[var(--bg)] border-[var(--border)]"
                          }`} />

                          <div className="flex-1 space-y-1">
                            <h4 className={`text-sm font-bold flex items-center gap-2 ${
                              status === "pending" ? "opacity-40" : "text-[var(--text)]"
                            }`}>
                              <StepIcon size={16} className={status === "pending" ? "opacity-40" : "text-[var(--primary)]"} />
                              {step.title}
                            </h4>
                            <p className={`text-xs ${status === "pending" ? "opacity-30" : "opacity-70"}`}>
                              {step.desc}
                            </p>
                          </div>

                          {/* Date */}
                          <div className="text-left sm:text-right shrink-0">
                            <p className={`text-[10px] font-mono font-bold ${
                              status === "pending" ? "opacity-30" : "opacity-75"
                            }`}>
                              {getStepDate(idx, order.created_at)}
                            </p>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Delivery Agent & OTP Panel */}
              {(order.order_status === "Out for Delivery" || order.order_status === "Exchange Out for Delivery" || order.order_status === "Delivered" || order.order_status === "Exchange Completed") && (order.delivery_boy_name || order.delivery_otp) && (
                <div className={`border p-5 md:p-6 rounded-[2rem] relative overflow-hidden backdrop-blur-sm shadow-lg ${
                  (order.order_status === "Delivered" || order.order_status === "Exchange Completed") 
                    ? "bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20" 
                    : "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-650 to-rose-700 border-2 border-white/20 flex items-center justify-center font-black text-sm text-white shrink-0 select-none">
                        {order.delivery_boy_name ? order.delivery_boy_name.slice(0,2).toUpperCase() : "DA"}
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {(order.order_status === "Delivered" || order.order_status === "Exchange Completed") ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit">
                            <CheckCircle2 size={12} className="text-emerald-500" /> {order.order_status === "Exchange Completed" ? "Exchange Completed" : "Delivered Successfully"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit animate-pulse">
                            <Truck size={12} className="animate-bounce" /> {order.order_status === "Exchange Out for Delivery" ? "Exchange Out For Delivery Details" : "Out For Delivery Details"}
                          </span>
                        )}
                        <h4 className="text-[var(--text)] font-bold text-sm truncate">{order.delivery_boy_name || "Assigned Partner"}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-[var(--text)]/80">
                          <p><strong>Rating:</strong> <span className="text-amber-500 font-bold">★ 4.9 Rated Partner</span></p>
                          <p><strong>Vehicle:</strong> <span className="text-[var(--text)] font-mono">{order.delivery_boy_vehicle || "N/A"}</span></p>
                          <p className="flex items-center gap-2">
                            <strong>Contact Phone:</strong> 
                            {order.delivery_boy_phone ? (
                              <a href={`tel:${order.delivery_boy_phone}`} className="text-[var(--primary)] hover:underline font-bold transition-all">
                                {order.delivery_boy_phone}
                              </a>
                            ) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {order.delivery_otp && order.order_status !== "Delivered" && order.order_status !== "Exchange Completed" && (
                      <div className="w-full md:w-auto shrink-0 bg-white/5 border border-white/10 p-4 rounded-2xl text-center space-y-2">
                        <p className="text-[9px] font-black tracking-widest text-amber-500 uppercase leading-none">🔒 Secure Delivery OTP</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-2xl font-black text-[var(--text)] tracking-widest pl-2">
                            {order.delivery_otp}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(order.delivery_otp);
                              toast.success("OTP copied to clipboard!");
                            }}
                            className="p-1.5 bg-white/10 hover:bg-red-655 rounded-lg text-slate-300 transition scale-90"
                          >
                            <svg xmlns="http://www.w3.org/2050/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PACKAGE ITEMS SUMMARY */}
              <div className="bg-[var(--card)] border border-[var(--border)] p-6 md:p-8 rounded-[2rem] space-y-6 shadow-xl backdrop-blur-md">
                <h3 className="font-bold text-[var(--text)] text-sm flex items-center gap-2">
                  <ShoppingBag className="text-[var(--primary)]" size={16} /> Package Contents ({(order.order_items || []).length} items)
                </h3>
                <div className="space-y-4">
                  {order.order_items.map((item, i) => (
                    <div key={i} className="flex gap-4 items-center bg-[var(--primary)]/[0.03] p-4 rounded-2xl border border-[var(--border)]">
                      <img src={item.image} className="w-14 h-14 object-cover rounded-xl border border-[var(--border)]" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[var(--text)] truncate">{item.title}</h4>
                        <p className="text-[10px] opacity-50 mt-1">Quantity: <b className="text-[var(--text)]/80">{item.quantity}</b></p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-[var(--text)] font-bold">₹{Number(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* SHIPPING DETAILS */}
              <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[2rem] space-y-4 shadow-xl backdrop-blur-md">
                <h3 className="font-bold text-[var(--text)] text-sm flex items-center gap-2">
                  <MapPin className="text-[var(--primary)]" size={16} /> Delivery Address
                </h3>
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-[var(--text)]">{order.full_name || authUser?.name}</p>
                  <p className="opacity-70 leading-relaxed">
                    {order.address}, {order.city}, {order.state} - {order.pincode}
                  </p>
                  <p className="opacity-50 flex items-center gap-1.5 pt-2">
                    <Phone size={12} /> {order.phone}
                  </p>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[2rem] space-y-3 shadow-xl backdrop-blur-md">
                <h3 className="font-bold text-[var(--text)] text-xs uppercase tracking-wider text-slate-500">Actions</h3>
                <button 
                  onClick={() => setSearchParams({ tab: "details" })}
                  className="w-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--text)] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition text-center block"
                >
                  View Details & Invoice
                </button>
                {order.order_status === "Delivered" && (
                  <button 
                    onClick={() => setShowReturnModal(true)}
                    className="w-full bg-transparent hover:bg-[var(--primary)]/10 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeftRight size={14} /> Return / Exchange
                  </button>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /*                       TAB 2: DETAILED INVOICE LAYOUT                       */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT: PREMIUM GLASSMORPHISM INVOICE */}
            <div className="md:col-span-2 space-y-6">
              
              <div id="printable-invoice" className="bg-[var(--card)] border border-[var(--border)] p-6 md:p-8 rounded-[2rem] shadow-2xl backdrop-blur-md relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                {/* Visual Glassmorphic Accent lines - Hide during print */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--primary)]/10 to-transparent blur-2xl pointer-events-none print:hidden" />
                
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-[var(--border)] print:border-slate-200">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-white print:text-black">
                      BALAJI<span className="text-[var(--primary)]">MART</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 print:text-slate-600">
                      {order.payment_mode === "Exchange" ? "Premium Exchange Fulfillment" : "Premium E-Commerce Retail"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right font-mono space-y-1">
                    <span className="inline-block px-3 py-1 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/20 text-[10px] font-black text-[var(--primary)] tracking-widest uppercase leading-none print:border-slate-300 print:text-black">
                      {order.payment_mode === "Exchange" ? "EXCHANGE REPLACEMENT" : order.order_status === "Delivered" ? "PAID" : "PROCESSING TRANSACTION"}
                    </span>
                    <p className="text-[10px] opacity-70 mt-2"><strong>Invoice No:</strong> BJM-{order.id?.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] opacity-70"><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {/* Addresses Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[var(--border)] print:border-slate-200 text-xs">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Billed To (Customer Details)</p>
                    <h4 className="font-bold text-[var(--text)] print:text-black">{order.full_name || authUser?.name}</h4>
                    <p className="opacity-70 mt-1">{authUser?.email}</p>
                    <p className="opacity-70 flex items-center gap-1.5 mt-1">
                      <Phone size={12} /> {order.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shipping Destination</p>
                    <h4 className="font-bold text-[var(--text)] print:text-black">{order.full_name}</h4>
                    <p className="opacity-70 leading-relaxed mt-1">
                      {order.address}, {order.city}, {order.state} - {order.pincode}
                    </p>
                  </div>
                </div>

                {/* Payment info detail block */}
                <div className="py-5 bg-white/[0.02] border-b border-[var(--border)] print:border-slate-200 text-xs px-4 rounded-2xl my-6 print:bg-slate-50 print:border">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Method</p>
                      <p className="font-bold text-[var(--text)] print:text-black flex items-center gap-1.5">
                        <CreditCard size={13} className="text-[var(--primary)]" />
                        {order.payment_mode || "Prepaid"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Transaction Ref</p>
                      <p className="font-mono font-bold text-[var(--text)] opacity-80 print:text-black">
                        {order.payment_intent_id || `txn_${order.id?.slice(0, 8)}`}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Status</p>
                      <p className="font-bold text-green-500 uppercase tracking-wide">
                        {order.payment_mode === "Exchange" ? "Exchange Order Created" :
                         order.order_status === "Cancelled" ? "Refund Initiated" : 
                         order.order_status === "Refunded" ? "Refund Completed" : "Verified Complete"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Return QC Check Verification Results */}
                {order.return_info && order.return_info.qc_report && order.return_info.qc_report.checklist && (
                  <div className="my-6 p-5 bg-white/[0.01] border border-[var(--border)] rounded-2xl text-xs print:hidden">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck size={16} className="text-[var(--primary)]" />
                      <span className="font-black text-[10px] tracking-widest text-slate-400 uppercase">Quality Inspection Checklist</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className={order.return_info.qc_report.checklist.brandTagsIntact ? "text-green-500" : "text-red-500"}>●</span>
                        <span>Brand Tags: {order.return_info.qc_report.checklist.brandTagsIntact ? "Intact" : "Missing"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={order.return_info.qc_report.checklist.unusedCondition ? "text-green-500" : "text-red-500"}>●</span>
                        <span>Condition: {order.return_info.qc_report.checklist.unusedCondition ? "Unused" : "Used"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={order.return_info.qc_report.checklist.correctItem ? "text-green-500" : "text-red-500"}>●</span>
                        <span>Item Matching: {order.return_info.qc_report.checklist.correctItem ? "Verified" : "Mismatched"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={order.return_info.qc_report.checklist.packagingIntact ? "text-green-500" : "text-red-500"}>●</span>
                        <span>Packaging: {order.return_info.qc_report.checklist.packagingIntact ? "OK" : "Damaged"}</span>
                      </div>
                    </div>
                    {order.return_info.qc_report.qc_notes && (
                      <p className="mt-3 text-slate-400 italic text-[11px] leading-relaxed">
                        <strong>Inspector Remarks:</strong> "{order.return_info.qc_report.qc_notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Payout / Refund Proof details box */}
                {order.return_info && order.return_info.refund_details && order.return_info.refund_details.utr && (
                  <div className="my-6 p-5 bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-2xl text-xs print:bg-slate-50 print:border">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="font-black text-[10px] tracking-widest text-emerald-500 uppercase">
                        {order.return_info.action === "exchange" ? "Official Proof of Exchange (Replacement Order Receipt)" : "Official Proof of Refund (Company Payout Receipt)"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          {order.return_info.action === "exchange" ? "Replacement Order ID" : "Bank Reference UTR"}
                        </p>
                        <p className="font-mono font-bold text-slate-200 print:text-black">
                          {order.return_info.refund_details.utr}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          {order.return_info.action === "exchange" ? "Fulfillment Channel" : "Payout Channel"}
                        </p>
                        <p className="font-bold text-slate-200 print:text-black">
                          {order.return_info.refund_details.channel || (order.return_info.action === "exchange" ? "Balaji Mart Exchange Dispatch" : "Razorpay Payouts")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          {order.return_info.action === "exchange" ? "Delivery Method" : "Refund Method"}
                        </p>
                        <p className="font-bold text-slate-200 print:text-black">
                          {order.return_info.refund_details.method || (order.return_info.action === "exchange" ? "Product Replacement" : "IMPS Payout")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          {order.return_info.action === "exchange" ? "Dispatched Time" : "Disbursed Time"}
                        </p>
                        <p className="font-mono font-bold text-slate-200 print:text-black">
                          {order.return_info.refund_details.timestamp ? new Date(order.return_info.refund_details.timestamp).toLocaleString('en-IN') : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Itemized Table */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Itemized Breakdown</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] opacity-60 text-[10px] uppercase font-black tracking-wider print:border-slate-300">
                          <th className="py-3 pr-4">Product Details</th>
                          <th className="py-3 px-4 text-center">Qty</th>
                          <th className="py-3 px-4 text-right">Unit Price</th>
                          <th className="py-3 pl-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_items.map((item, idx) => (
                          <tr key={idx} className="border-b border-[var(--border)]/60 hover:bg-white/[0.02] print:border-slate-100">
                            <td className="py-4 pr-4 flex items-center gap-4">
                              <img src={item.image} className="w-10 h-10 object-cover rounded-lg border border-[var(--border)] print:border-slate-300" alt="" />
                              <div>
                                <h4 className="font-bold text-[var(--text)] print:text-black">{item.title}</h4>
                                <span className="text-[9px] opacity-40 font-mono">CODE: {item.product_id?.slice(0, 8)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center font-bold">{item.quantity}</td>
                            <td className="py-4 px-4 text-right opacity-70">₹{Number(item.price || 0).toFixed(2)}</td>
                            <td className="py-4 pl-4 text-right font-bold font-mono">₹{(Number(item.price || 0) * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Print bottom disclaimer */}
                <div className="hidden print:block mt-12 text-center text-[10px] text-slate-400 border-t pt-4">
                  <p>Thank you for shopping at Balaji Mart. This is a computer generated invoice and requires no physical signature.</p>
                  <p className="mt-1">For support questions, please email us at support@balajimart.com</p>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 print:hidden">
              
              {/* BILLING ACTIONS */}
              <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[2rem] space-y-4 shadow-xl backdrop-blur-md">
                <h3 className="font-bold text-[var(--text)] text-sm">Actions</h3>
                <div className="flex flex-col gap-3">
                  {order.order_status === "Delivered" ? (
                    <button 
                      onClick={handleDownloadInvoice}
                      className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(122,31,47,0.15)]"
                    >
                      <Download size={14} /> Download PDF Invoice
                    </button>
                  ) : (
                    <button 
                      disabled 
                      className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--text)]/30 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Invoice Pending Delivery
                    </button>
                  )}

                  <button 
                    onClick={handlePrintWindow}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                    <Printer size={14} /> Print Receipt
                  </button>

                  <button 
                    onClick={() => setSearchParams({ tab: "track" })}
                    className="w-full bg-transparent hover:bg-[var(--primary)]/10 border border-[var(--border)] text-[var(--text)] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                    <Truck size={14} /> Track Package Journey
                  </button>

                  {order.order_status === "Delivered" && (
                    <button 
                      onClick={() => setShowReturnModal(true)}
                      className="w-full bg-transparent hover:bg-[var(--primary)]/10 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight size={14} /> Return / Exchange
                    </button>
                  )}
                </div>
              </div>

              {/* BILLING CALCULATION */}
              <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[2rem] space-y-4 shadow-xl backdrop-blur-md">
                <h3 className="font-bold text-[var(--text)] text-sm flex items-center gap-2">
                  <CreditCard className="text-[var(--primary)]" size={16} /> Billing Summary
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between opacity-60">
                    <span>Subtotal</span>
                    <span className="text-[var(--text)]/80">₹{Number(order.total_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between opacity-60">
                    <span>GST (18% Included)</span>
                    <span className="text-[var(--text)]/80">₹{(Number(order.total_price || 0) * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between opacity-60">
                    <span>Shipping Fee</span>
                    <span className="text-green-500 font-bold">FREE</span>
                  </div>
                  <div className="pt-3 border-t border-[var(--border)] flex justify-between items-end">
                    <span className="font-bold text-[var(--text)] uppercase tracking-wider text-[10px]">Grand Total</span>
                    <span className="text-lg font-black text-[var(--text)] font-mono">₹{Number(order.total_price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Return & Exchange Wizard Modal Component */}
      <AnimatePresence>
        {showReturnModal && (
          <ReturnWizardModal 
            order={order} 
            onClose={() => setShowReturnModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDetail;
