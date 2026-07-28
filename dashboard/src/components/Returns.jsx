import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  FileText,
  DollarSign,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  ClipboardList,
  Check,
  Building,
  Wallet,
  RefreshCw,
  Info,
  Package
} from "lucide-react";
import { fetchReturnRequests, updateReturnRequestStatus } from "../store/slices/orderSlice";

const Returns = () => {
  const dispatch = useDispatch();
  const { returns = [], loadingReturns } = useSelector((state) => state.order);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [previewImage, setPreviewImage] = useState(null);
  
  // QC Checklist States per Return ID
  const [qcChecklists, setQcChecklists] = useState({});

  // Refund Simulator Modal State — pre-filled from user's chosen method
  const [refundModal, setRefundModal] = useState({
    open: false,
    returnItem: null,
    step: 1,
    channel: "Razorpay Instant Payouts",
    loadingText: "",
    generatedUtr: ""
  });

  useEffect(() => {
    dispatch(fetchReturnRequests());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter((r) => r.status === "Pending").length;
    const underQc = returns.filter((r) => r.status === "Under QC").length;
    const approved = returns.filter((r) => r.status === "Approved").length;
    const pickedUp = returns.filter((r) => r.status === "Product Picked Up").length;
    const refunded = returns.filter((r) => r.status === "Refund Processed").length;
    
    return { total, pending, underQc, approved, pickedUp, refunded };
  }, [returns]);

  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const returnId = item.id || "";
      const orderId = item.order_id || "";
      const buyerName = item.buyer_name || "";
      const matchesSearch =
        !searchTerm.trim() ||
        returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [returns, searchTerm, statusFilter]);

  const handleAction = async (returnId, status, additionalPayload = {}) => {
    await dispatch(updateReturnRequestStatus({ returnId, status, ...additionalPayload }));
    dispatch(fetchReturnRequests());
  };

  // QC Checklist checklist toggle helpers
  const initQcState = (itemId, existingReport) => {
    if (qcChecklists[itemId]) return;
    const checklist = existingReport?.checklist || {
      brandTagsIntact: true,
      unusedCondition: true,
      correctItem: true,
      packagingIntact: true
    };
    const qcNotes = existingReport?.qc_notes || "";
    setQcChecklists(prev => ({
      ...prev,
      [itemId]: { checklist, qcNotes }
    }));
  };

  const handleQcCheckToggle = (itemId, field) => {
    setQcChecklists(prev => {
      const curr = prev[itemId] || {
        checklist: { brandTagsIntact: true, unusedCondition: true, correctItem: true, packagingIntact: true },
        qcNotes: ""
      };
      return {
        ...prev,
        [itemId]: {
          ...curr,
          checklist: {
            ...curr.checklist,
            [field]: !curr.checklist[field]
          }
        }
      };
    });
  };

  const handleQcNotesChange = (itemId, val) => {
    setQcChecklists(prev => {
      const curr = prev[itemId] || {
        checklist: { brandTagsIntact: true, unusedCondition: true, correctItem: true, packagingIntact: true },
        qcNotes: ""
      };
      return {
        ...prev,
        [itemId]: {
          ...curr,
          qcNotes: val
        }
      };
    });
  };

  // Submit QC checklist report
  const submitQcReport = async (itemId, finalDecision) => {
    const report = qcChecklists[itemId];
    if (!report) return;

    if (finalDecision === "Rejected" && !report.qcNotes.trim()) {
      alert("Defect notes are required to reject the Quality Check.");
      return;
    }

    const qc_report = {
      checklist: report.checklist,
      qc_notes: report.qcNotes,
      timestamp: new Date().toISOString()
    };

    await handleAction(itemId, finalDecision, { qc_report });
  };

  // Open refund modal — pre-fill channel from user's chosen refund_method
  const triggerRefundSimulation = (item) => {
    // Map user's refund_method to locked admin channel
    let defaultChannel = "Razorpay Card/Netbanking Refund";
    if (item.refund_method === "Store Wallet Credits") {
      defaultChannel = "Balaji Mart Store Wallet Credits";
    } else if (item.refund_method === "Refund to Original Payment Source" || item.refund_method?.includes("Original")) {
      if (item.bank_details?.upi_id) {
        defaultChannel = "Razorpay Instant UPI Payout";
      } else if (item.bank_details?.account_number) {
        defaultChannel = "IMPS Direct Bank Transfer";
      } else {
        defaultChannel = "Razorpay Card/Netbanking Refund";
      }
    }

    setRefundModal({
      open: true,
      returnItem: item,
      step: 1,
      channel: defaultChannel,
      loadingText: "",
      generatedUtr: ""
    });
  };

  const startRefundPayment = () => {
    const utrHash = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const prefix = refundModal.channel.includes("Razorpay") ? "UTR-RAZORPAY" :
                   refundModal.channel === "IMPS Direct Bank Transfer" ? "UTR-IMPS" : "UTR-STOREWALLET";
    const finalUtr = `${prefix}-${utrHash}`;

    setRefundModal(prev => ({ 
      ...prev, 
      step: 2, 
      generatedUtr: finalUtr,
      loadingText: `Connecting to ${prev.channel} APIs...` 
    }));
    
    setTimeout(() => {
      setRefundModal(prev => ({ ...prev, loadingText: "Validating recipient payout endpoint..." }));
    }, 1500);

    setTimeout(() => {
      setRefundModal(prev => ({ ...prev, loadingText: "Transferring payout value and generating merchant UTR receipt..." }));
    }, 3000);

    setTimeout(() => {
      const refund_details = {
        utr: finalUtr,
        channel: "Balaji Mart Enterprise Hub",
        method: refundModal.channel,
        timestamp: new Date().toISOString()
      };
      
      // Save refund details to DB
      handleAction(refundModal.returnItem.id, "Refund Processed", { refund_details });
      setRefundModal(prev => ({ ...prev, step: 3 }));
    }, 4500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-250";
      case "Under QC":
        return "bg-purple-100 text-purple-800 border border-purple-250";
      case "Approved":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Product Picked Up":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "Refund Processed":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  if (loadingReturns && returns.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen md:pl-[17rem] bg-gray-50">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full bg-gray-50 min-h-screen">
        <div className="flex-1 md:p-6 pb-0">
          <Header />
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="text-slate-800" size={24} /> Return & Quality Inspection Board
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Inspect products, execute QC checklists, and manage secure UTR refunds.
          </p>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:px-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Requests</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-blue-500 uppercase">Pending Pickup</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.pending}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-sm">
            <p className="text-xs font-bold text-purple-500 uppercase">Under Inspection</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.underQc}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-blue-500 uppercase">Approved Returns</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.approved}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-orange-500 uppercase">Product Picked Up</p>
            <h3 className="text-2xl font-black text-slateate-800 mt-1">{stats.pickedUp}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-green-500 uppercase">Refunded / Exchanged</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.refunded}</h3>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 md:mx-6 space-y-4">
          <div className="relative w-full flex items-center group">
            <Search className="absolute left-4 text-gray-400 focus-within:text-slate-800" size={18} />
            <input 
              type="text" 
              placeholder="Search by Return ID, Order ID, or Customer name..."
              className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl font-semibold text-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["All", "Pending", "Under QC", "Approved", "Product Picked Up", "Refund Processed", "Rejected"].map((status) => (
              <button
                key={`filter-${status}`}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* RETURNS WORKFLOW GRID */}
        <div className="md:px-6 space-y-6">
          {filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <ArrowLeftRight size={48} className="text-gray-300 mb-3" />
              <p className="font-semibold text-gray-500">No return requests found.</p>
            </div>
          ) : (
            filteredReturns.map((item) => {
              // Trigger initialization of QC state locally
              initQcState(item.id, item.qc_report);
              const report = qcChecklists[item.id] || {
                checklist: { brandTagsIntact: true, unusedCondition: true, correctItem: true, packagingIntact: true },
                qcNotes: ""
              };

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                  
                  {/* Status Banner */}
                  <div className="flex justify-between items-start flex-wrap gap-4 border-b pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Return ID</span>
                      <p className="font-mono text-sm font-bold text-slate-800 uppercase">#{item.id?.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Requested on {new Date(item.created_at).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                        item.status === "Refund Processed" && item.action === "exchange"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : getStatusBadge(item.status)
                      }`}>
                        {item.status === "Refund Processed" && item.action === "exchange" ? "Exchange Completed" : item.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Customer details card */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2 border-b pb-1">
                          <User size={13} className="text-slate-500" /> Customer Information
                        </h4>
                        <p className="font-semibold">{item.buyer_name}</p>
                        <p className="text-gray-500 flex items-center gap-1 mt-1"><Mail size={11} /> {item.buyer_email}</p>
                        <p className="text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={11} /> {item.shipping_phone || "N/A"}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2 border-b pb-1">
                          <FileText size={13} className="text-slate-500" /> Original Transaction
                        </h4>
                        <p><strong>Order ID:</strong> <span className="font-mono">#{item.order_id?.slice(-8).toUpperCase()}</span></p>
                        <p className="mt-1"><strong>Total Paid:</strong> ₹{Number(item.order_total || 0).toFixed(2)}</p>
                        <p className="mt-0.5 flex items-center gap-1.5">
                          <strong>Mode:</strong>
                          <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                            {item.payment_mode || "Prepaid"}
                          </span>
                        </p>
                      </div>
                      {item.bank_details && (Object.values(item.bank_details).some(v => v)) && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <CreditCard size={13} className="text-slate-500" /> Bank Payout Details
                          </h4>
                          {item.bank_details.upi_id && (
                            <p className="mb-1"><strong>UPI ID:</strong> <span className="font-mono bg-blue-50 px-1 py-0.5 rounded text-blue-700">{item.bank_details.upi_id}</span></p>
                          )}
                          {item.bank_details.account_number && (
                            <div className="space-y-0.5 font-mono text-[11px] text-slate-600">
                              <p><strong>Holder:</strong> {item.bank_details.account_name}</p>
                              <p><strong>Bank:</strong> {item.bank_details.bank_name}</p>
                              <p><strong>A/C No:</strong> {item.bank_details.account_number}</p>
                              <p><strong>IFSC:</strong> {item.bank_details.ifsc_code}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Returning products summary */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Returning Products</h4>
                      <div className="space-y-2">
                        {Array.isArray(item.items) ? (
                          item.items.map((prod, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-150 text-xs">
                              {prod.image && (
                                <img
                                  src={prod.image}
                                  alt={prod.title}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-85 transition shrink-0"
                                  onClick={() => setPreviewImage(prod.image)}
                                />
                              )}
                              <div className="font-bold flex-1 min-w-0">
                                <p className="truncate text-slate-800">{prod.title}</p>
                                <p className="text-gray-400 mt-1">Quantity: {prod.quantity} | Value: ₹{Number(prod.price * prod.quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">N/A</p>
                        )}
                      </div>

                      <div className="bg-red-50/50 p-4 border border-red-100 rounded-2xl text-xs">
                        <p className="font-bold text-red-850 uppercase tracking-wide">Reason: {item.reason}</p>
                        <p className="text-slate-650 leading-relaxed italic mt-1">"{item.comments || "No comments from buyer."}"</p>
                      </div>

                      {/* User's chosen resolution method — read-only for admin */}
                      {item.refund_method && (
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs ${
                          item.action === "exchange"
                            ? "bg-blue-50 border-blue-100 text-blue-800"
                            : item.refund_method === "Store Wallet Credits"
                            ? "bg-amber-50 border-amber-100 text-amber-800"
                            : "bg-green-50 border-green-100 text-green-800"
                        }`}>
                          {item.action === "exchange" ? <RefreshCw size={13} /> : item.refund_method === "Store Wallet Credits" ? <Wallet size={13} /> : <CreditCard size={13} />}
                          <div>
                            <p className="font-black text-[10px] uppercase tracking-wide">Customer's Chosen Resolution</p>
                            <p className="font-bold mt-0.5">{item.refund_method}</p>
                          </div>
                          <div className="ml-auto">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-black/10">USER SELECTED</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Logistics and proofs columns */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2 border-b pb-1">
                          <MapPin size={13} className="text-slate-500" /> Pickup Logistics
                        </h4>
                        <p className="leading-relaxed opacity-85">
                          {item.shipping_name}, {item.address}, {item.city}, {item.state} - {item.pincode}
                        </p>
                        <p className="mt-2 text-slate-700 flex items-center gap-1.5 font-bold">
                          <Calendar size={13} className="text-blue-500" />
                          Slot: {new Date(item.pickup_date).toLocaleDateString('en-IN')} ({item.pickup_slot})
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2 border-b pb-1">
                          <Eye size={13} className="text-slate-500" /> Customer Damage Proof Media
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {Array.isArray(item.media) && item.media.length > 0 ? (
                            item.media.map((imgUrl, i) => (
                              <img
                                key={i}
                                src={imgUrl}
                                alt="Proof"
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-85 transition"
                                onClick={() => setPreviewImage(imgUrl)}
                              />
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400">No media attached</span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ADVANCED PRODUCT QUALITY CHECK (QC) CARD - Shown when in "Under QC" stage */}
                  {item.status === "Under QC" && (
                    <div className="bg-purple-50/30 border border-purple-100 rounded-3xl p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-purple-100 pb-2">
                        <ClipboardList className="text-purple-600" size={18} />
                        <h4 className="font-black text-xs uppercase tracking-wider text-purple-950">Laboratory Quality Inspection Checklist</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-800">
                        <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-150 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={report.checklist.brandTagsIntact}
                            onChange={() => handleQcCheckToggle(item.id, "brandTagsIntact")}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                          <span>Brand Tags Intact</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-150 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={report.checklist.unusedCondition}
                            onChange={() => handleQcCheckToggle(item.id, "unusedCondition")}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                          <span>Unused & Clean Condition</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-150 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={report.checklist.correctItem}
                            onChange={() => handleQcCheckToggle(item.id, "correctItem")}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                          <span>Correct Item Matching</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-150 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={report.checklist.packagingIntact}
                            onChange={() => handleQcCheckToggle(item.id, "packagingIntact")}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                          <span>Original Box Packaging</span>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase text-slate-550">Quality Inspection Report Notes / Defects *</label>
                        <textarea
                          value={report.qcNotes}
                          onChange={(e) => handleQcNotesChange(item.id, e.target.value)}
                          placeholder="Ex: Brand tag is intact. Shoe creases checked, packaging box slightly dented but acceptable. Defect details if any..."
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-purple-500 resize-none h-20 leading-relaxed text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* DISPLAY INACTIVE QC REPORT DETAILS IF CHECKLIST HAS BEEN COMPLETED */}
                  {item.status !== "Pending" && item.status !== "Under QC" && item.qc_report && item.qc_report.checklist && (
                    <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 text-xs space-y-2.5">
                      <p className="font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><ClipboardList size={14}/> QC Report Logged</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 opacity-80 font-bold">
                        <p>🏷️ Tags: <span className={item.qc_report.checklist.brandTagsIntact ? "text-green-600" : "text-red-500"}>{item.qc_report.checklist.brandTagsIntact ? "Intact" : "Missing"}</span></p>
                        <p>✨ Condition: <span className={item.qc_report.checklist.unusedCondition ? "text-green-600" : "text-red-500"}>{item.qc_report.checklist.unusedCondition ? "Unused" : "Used"}</span></p>
                        <p>📦 Package: <span className={item.qc_report.checklist.packagingIntact ? "text-green-600" : "text-red-500"}>{item.qc_report.checklist.packagingIntact ? "OK" : "Damaged"}</span></p>
                        <p>🔍 SKU Match: <span className={item.qc_report.checklist.correctItem ? "text-green-600" : "text-red-500"}>{item.qc_report.checklist.correctItem ? "Verified" : "Mismatch"}</span></p>
                      </div>
                      {item.qc_report.qc_notes && (
                        <p className="italic text-slate-600 border-t pt-2 mt-2"><strong>Notes:</strong> "{item.qc_report.qc_notes}"</p>
                      )}
                    </div>
                  )}

                  {/* DISPLAY REFUND PROOF IN ADMIN CARD IF COMPLETED */}
                  {item.status === "Refund Processed" && item.refund_details && item.refund_details.utr && (
                    item.action === "exchange" ? (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs space-y-1.5">
                        <p className="font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-blue-600"/> Exchange Dispatch Reference generated
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-bold opacity-80 text-slate-700">
                          <p><strong>Replacement Order ID:</strong> <span className="font-mono text-slate-900">{item.refund_details.utr}</span></p>
                          <p><strong>Fulfillment Method:</strong> <span>{item.refund_details.method}</span></p>
                          <p><strong>Dispatched at:</strong> <span>{new Date(item.refund_details.timestamp).toLocaleString('en-IN')}</span></p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 text-xs space-y-1.5">
                        <p className="font-bold text-green-800 uppercase tracking-wide flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-green-600"/> Refund Payout Reference generated
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-bold opacity-80 text-slate-700">
                          <p><strong>UTR:</strong> <span className="font-mono text-slate-900">{item.refund_details.utr}</span></p>
                          <p><strong>Method:</strong> <span>{item.refund_details.method}</span></p>
                          <p><strong>Disbursed at:</strong> <span>{new Date(item.refund_details.timestamp).toLocaleString('en-IN')}</span></p>
                        </div>
                      </div>
                    )
                  )}

                  {/* Bottom Action Row */}
                  <div className="flex justify-end items-center gap-3 border-t pt-4">
                    {item.status === "Pending" && (
                      <button
                        onClick={() => handleAction(item.id, "Under QC")}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <ClipboardList size={14} /> Confirm Pickup & Start QC
                      </button>
                    )}

                    {item.status === "Under QC" && (
                      <>
                        <button
                          onClick={() => submitQcReport(item.id, "Rejected")}
                          className="px-5 py-2.5 bg-red-50 border border-red-200 text-red-650 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <XCircle size={14} /> Fail QC & Reject Return
                        </button>
                        <button
                          onClick={() => submitQcReport(item.id, "Approved")}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle size={14} /> Pass QC & Approve Return
                        </button>
                      </>
                    )}

                    {item.status === "Approved" && (
                      item.action === "exchange" ? (
                        <button
                          onClick={() => handleAction(item.id, "Product Picked Up")}
                          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-md shadow-orange-500/10"
                        >
                          <Package size={14} /> Confirm Exchange Pickup
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(item.id, "Product Picked Up")}
                          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-md shadow-orange-500/10"
                        >
                          <Package size={14} /> Confirm Product Picked Up
                        </button>
                      )
                    )}

                    {item.status === "Product Picked Up" && (
                      item.action === "exchange" ? (
                        <button
                          onClick={() => handleAction(item.id, "Refund Processed")}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-md shadow-blue-500/10"
                        >
                          <CheckCircle size={14} /> Approve & Dispatch Exchange
                        </button>
                      ) : (
                        <button
                          onClick={() => triggerRefundSimulation(item)}
                          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-md shadow-green-500/10"
                        >
                          <DollarSign size={14} /> Process Payment Refund
                        </button>
                      )
                    )}

                    {item.status === "Refund Processed" && (
                      item.action === "exchange" ? (
                        <span className="text-xs font-bold text-blue-650 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-150">
                          <CheckCircle size={14} /> Exchange Dispatched & Completed
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-green-650 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl border border-green-150">
                          <CheckCircle size={14} /> Refund Disbursed & Completed
                        </span>
                      )
                    )}

                    {item.status === "Rejected" && (
                      <span className="text-xs font-bold text-red-655 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-xl border border-red-150">
                        <XCircle size={14} /> Request Rejected
                      </span>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* IMAGE PREVIEW MODAL */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-2xl w-full">
              <img
                src={previewImage}
                alt="Proof Preview"
                className="max-w-full max-h-[85vh] mx-auto rounded-2xl shadow-2xl border-4 border-white"
              />
            </div>
          </div>
        )}

        {/* BANK REFUND SIMULATION MODAL */}
        {refundModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-105 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-green-500 to-emerald-600" />
              
              {refundModal.step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign className="text-green-600" /> Disburse Refund Payment
                  </h3>

                  {/* User's chosen method — highlighted at top */}
                  {refundModal.returnItem?.refund_method && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                      <Info size={15} className="text-blue-600 shrink-0" />
                      <div className="text-xs">
                        <p className="font-black text-blue-800 uppercase tracking-wide text-[10px]">Customer's Preferred Method</p>
                        <p className="font-bold text-blue-700 mt-0.5">{refundModal.returnItem.refund_method}</p>
                      </div>
                    </div>
                  )}

                  {refundModal.returnItem?.bank_details && (Object.values(refundModal.returnItem.bank_details).some(v => v)) && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <p className="font-black text-slate-500 uppercase tracking-wide text-[10px]">Target Refund Destination</p>
                      {refundModal.returnItem.bank_details.upi_id && (
                        <p><strong>UPI ID:</strong> <span className="font-mono bg-green-50 px-1 py-0.5 rounded text-green-700">{refundModal.returnItem.bank_details.upi_id}</span></p>
                      )}
                      {refundModal.returnItem.bank_details.account_number && (
                        <div className="space-y-0.5 font-mono text-[11px] text-slate-650">
                          <p><strong>Holder:</strong> {refundModal.returnItem.bank_details.account_name}</p>
                          <p><strong>Bank:</strong> {refundModal.returnItem.bank_details.bank_name}</p>
                          <p><strong>A/C No:</strong> {refundModal.returnItem.bank_details.account_number}</p>
                          <p><strong>IFSC:</strong> {refundModal.returnItem.bank_details.ifsc_code}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 leading-relaxed">
                    The customer chose <strong>{refundModal.returnItem?.refund_method}</strong>. The refund has been locked to the user's selected payment method.
                  </p>

                  <div className="p-4 border-2 border-green-500/20 bg-green-500/[0.02] rounded-2xl flex items-center gap-3">
                    <CheckCircle className="text-green-600 shrink-0" size={20} />
                    <div className="text-xs">
                      <p className="text-[10px] font-black uppercase text-green-700 tracking-wider">Locked Payout Channel</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{refundModal.channel}</p>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">
                        {refundModal.channel === "Balaji Mart Store Wallet Credits" ? "Funds will be credited directly to the customer's store wallet balance." :
                         refundModal.channel === "Razorpay Instant UPI Payout" ? `Transferred instantly via Razorpay to UPI VPA: ${refundModal.returnItem?.bank_details?.upi_id}` :
                         refundModal.channel === "IMPS Direct Bank Transfer" ? `Transferred via direct IMPS bank transfer to Account: ${refundModal.returnItem?.bank_details?.account_number} (IFSC: ${refundModal.returnItem?.bank_details?.ifsc_code})` :
                         "Funds will be credited back automatically to the customer's original card / payment gateway account source."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl text-xs space-y-1.5 border border-gray-100">
                    <p className="flex justify-between">
                      <span className="opacity-60">Customer Name:</span>
                      <strong className="text-slate-800">{refundModal.returnItem?.buyer_name}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="opacity-60">Original Order:</span>
                      <strong className="text-slate-800 font-mono">#{refundModal.returnItem?.order_id?.slice(-8).toUpperCase()}</strong>
                    </p>
                    <p className="flex justify-between border-t pt-2 mt-2">
                      <span className="opacity-60 font-bold">Total Refund Amount:</span>
                      <strong className="text-green-600 text-sm font-black">₹{Number(refundModal.returnItem?.order_total || 0).toFixed(2)}</strong>
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setRefundModal({ open: false, returnItem: null, step: 1, loadingText: "", generatedUtr: "", channel: "Razorpay Instant Payouts" })}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startRefundPayment}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition text-xs shadow-md shadow-green-500/10"
                    >
                      Authorize Payment
                    </button>
                  </div>
                </div>
              )}

              {refundModal.step === 2 && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="animate-spin text-green-600" size={48} />
                  <p className="text-sm font-bold text-slate-800 animate-pulse">{refundModal.loadingText}</p>
                  <p className="text-[10px] text-gray-400">Simulating secure merchant payout authorization...</p>
                </div>
              )}

              {refundModal.step === 3 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 border-2 border-green-200 shadow-inner">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">Refund Disbursed Successfully!</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    The transaction was processed. Customer has been notified, and ₹{Number(refundModal.returnItem?.order_total || 0).toFixed(2)} credited back to customer via {refundModal.channel}.
                  </p>
                  
                  <div className="bg-slate-50 border p-3.5 rounded-2xl text-left text-[11px] font-bold space-y-1.5 text-slate-700">
                    <p className="text-center font-black uppercase text-[10px] text-green-700 border-b pb-1.5 mb-1.5">Company Payout Receipt</p>
                    <p><strong>UTR:</strong> <span className="font-mono text-slate-900">{refundModal.generatedUtr}</span></p>
                    <p><strong>Merchant:</strong> <span>Balaji Mart Ltd</span></p>
                    <p><strong>Provider:</strong> <span>{refundModal.channel}</span></p>
                    <p><strong>Status:</strong> <span className="text-green-600">SUCCESS / CREDITED</span></p>
                  </div>

                  <button
                    onClick={() => setRefundModal({ open: false, returnItem: null, step: 1, loadingText: "", generatedUtr: "", channel: "Razorpay Instant Payouts" })}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Close & Finish
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </>
  );
};

export default Returns;
