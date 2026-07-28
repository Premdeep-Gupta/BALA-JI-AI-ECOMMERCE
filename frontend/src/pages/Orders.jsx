import React, { useEffect, useState } from "react";
import {
  Package, Truck, CheckCircle, XCircle, Filter, 
  ChevronDown, ChevronUp, ArrowRight, ShoppingBag, 
  Clock, CreditCard, ShieldCheck, Download, ArrowLeftRight
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMyOrders } from "../store/slices/orderSlice";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { ReturnWizardModal } from "../components/ReturnWizardModal";
import { toast } from "react-toastify";

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const { myOrders = [] } = useSelector((state) => state.order);
  const { authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleDownloadInvoice = (order) => {
    const invoiceWin = window.open("", "_blank");
    if (!invoiceWin) {
      return toast.error("Pop-up blocker active! Invoice view open nahi ho pa raha.");
    }
    const htmlContent = InvoiceTemplate(order, authUser);
    invoiceWin.document.write(htmlContent);
    invoiceWin.document.close();
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const filteredOrders = myOrders.filter(
    (order) => statusFilter === "All" || order.order_status === statusFilter
  );

  const getStatusStyles = (status) => {
    switch (status) {
      case "Processing": return { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", width: "w-1/5", icon: Clock };
      case "Order Packed":
      case "Packed": return { color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", border: "border-fuchsia-400/20", width: "w-2/5", icon: Package };
      case "Shipped": return { color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20", width: "w-3/5", icon: Truck };
      case "Out for Delivery": return { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", width: "w-4/5", icon: Truck };
      case "Delivered": return { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", width: "w-full", icon: CheckCircle };
      case "Cancelled": return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", width: "w-full", icon: XCircle };
      default: return { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", width: "w-1/6", icon: Package };
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[var(--bg)] text-[var(--text)] selection:bg-red-500/30">
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/10 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-2">
              MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-700">ORDERS</span>
            </h1>
            <p className="opacity-70 flex items-center gap-2 italic text-xs">
              <ShieldCheck className="w-4 h-4 text-[var(--primary)]" /> Secure shopping experience
            </p>
          </motion.div>

          {/* Premium Filter Chips */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
            {["All", "Processing", "Shipped", "Out for Delivery", "Delivered"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  statusFilter === s 
                  ? "bg-[var(--primary)] text-[var(--text)] shadow-[0_0_20px_var(--primary)]" 
                  : "hover:bg-[var(--primary)]/10 text-[var(--text)] opacity-70 hover:opacity-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-8">
          {filteredOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-[var(--card)] border border-[var(--border)] rounded-[2rem]">
              <ShoppingBag className="w-20 h-20 mx-auto text-slate-700 mb-6" />
              <h2 className="text-2xl font-bold text-slate-300">No orders yet?</h2>
              <p className="text-slate-500 mb-8">Time to fill that cart with something special.</p>
              <Link to="/shop" className="px-8 py-4 bg-white text-black font-black rounded-full hover:bg-red-600 hover:text-white transition-all">START EXPLORING</Link>
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => {
              const status = getStatusStyles(order.order_status);
              const StatusIcon = status.icon;
              const isExpanded = expandedOrders[order.id];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-[var(--card)] border border-[var(--border)] rounded-[2rem] overflow-hidden hover:border-[var(--primary)] transition-all duration-500 shadow-xl"
                >
                  {/* Order Progress Line (Flipkart Ultra Style) */}
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-white/5">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: status.width }} 
                      className={`h-full ${order.order_status === 'Cancelled' ? 'bg-rose-600' : 'bg-red-600 shadow-[0_0_10px_#dc2626]'}`}
                    />
                  </div>

                  <div className="p-6 md:p-8">
                    {/* Top Row */}
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black tracking-[0.2em] text-[var(--primary)] uppercase">Transaction ID</span>
                          <span className="bg-[var(--primary)]/15 px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text)]">#{order.id?.slice(-12).toUpperCase()}</span>
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
                          Purchased on {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}
                        </h2>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${status.border} ${status.bg} ${status.color} font-black text-[10px] tracking-widest uppercase`}>
                        <StatusIcon className="w-4 h-4" />
                        {order.order_status}
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid gap-4">
                      <AnimatePresence>
                        {((order.order_items && order.order_items.length > 0)
                          ? (isExpanded ? order.order_items : [order.order_items[0]])
                          : []
                        ).map((item, i) => {
                          if (!item) return null;
                          return (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="flex items-center gap-6 p-4 bg-[var(--primary)]/[0.03] rounded-2xl border border-[var(--border)] group-hover:bg-[var(--primary)]/[0.07] transition-all"
                            >
                              <img src={item.image} alt="" className="w-20 h-20 object-cover rounded-xl shadow-2xl" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[var(--text)] font-bold truncate">{item.title}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-xs opacity-70">Qty: <b className="text-[var(--text)]">{item.quantity}</b></span>
                                  <span className="text-xs opacity-70 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Paid</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-[var(--text)]">₹{Number(item.price || 0).toFixed(2)}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {order.order_items && order.order_items.length > 1 && (
                        <button 
                          onClick={() => toggleExpand(order.id)}
                          className="mx-auto mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black tracking-widest uppercase text-slate-400 transition-all flex items-center gap-2"
                        >
                          {isExpanded ? (
                            <>Collapse View <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>Show {order.order_items.length - 1} more items <ChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      )}
                    </div>                    {/* Delivery Agent & OTP Panel (Flipkart Ultra Style) */}
                    {(order.order_status === "Out for Delivery" || order.order_status === "Exchange Out for Delivery" || order.order_status === "Delivered" || order.order_status === "Exchange Completed") && (order.delivery_boy_name || order.delivery_otp) && (
                      <div className={`mt-6 p-5 border rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-lg ${
                        (order.order_status === "Delivered" || order.order_status === "Exchange Completed") 
                          ? "bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20" 
                          : "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
                      }`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-[30px] rounded-full pointer-events-none ${
                          (order.order_status === "Delivered" || order.order_status === "Exchange Completed") ? "bg-emerald-500/10" : "bg-amber-500/10"
                        }`} />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Profile Photo Avatar for Delivery Boy */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-750 border-2 border-white/20 flex items-center justify-center font-black text-sm text-white shadow-md shrink-0 select-none">
                              {order.delivery_boy_name ? order.delivery_boy_name.slice(0,2).toUpperCase() : "DA"}
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              {(order.order_status === "Delivered" || order.order_status === "Exchange Completed") ? (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit">
                                  <CheckCircle size={12} className="text-emerald-500" /> {order.order_status === "Exchange Completed" ? "Exchange Completed" : "Delivered Successfully"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit animate-pulse">
                                  <Truck size={12} className="animate-bounce" /> {order.order_status === "Exchange Out for Delivery" ? "Exchange Out For Delivery" : "Out For Delivery"}
                                </span>
                              )}
                              <h4 className="text-[var(--text)] font-bold text-sm truncate">{order.delivery_boy_name || "Assigned Partner"}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-[var(--text)]/80">
                                <p><strong>Rating:</strong> <span className="text-amber-500 font-bold">★ 4.9 Rated Executive</span></p>
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
                            <div className="w-full md:w-auto shrink-0 bg-[var(--primary)]/[0.04] border border-[var(--border)] p-4 rounded-2xl text-center space-y-2 relative group hover:border-amber-500/30 transition">
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
                                  className="p-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)] rounded-lg text-[var(--text)] hover:text-white transition scale-90"
                                  title="Copy OTP"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                </button>
                              </div>
                              <p className="text-[8px] text-slate-500 max-w-[160px] leading-tight mx-auto">
                                Share this with delivery agent only upon receiving your package.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Bill</p>
                          <p className="text-3xl font-black text-[var(--text)]">₹{Number(order.total_price || 0).toFixed(2)}</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                        <div className="hidden md:block">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Package Size</p>
                          <p className="text-sm font-bold opacity-75">{(order.order_items || []).length} Product(s)</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Method</p>
                          <p className="text-sm font-bold opacity-75">{order.payment_mode || "Prepaid"}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {order.order_status === "Delivered" ? (
                          <>
                            <button 
                              onClick={() => handleDownloadInvoice(order)}
                              className="flex-1 md:flex-none px-6 py-4 bg-[var(--primary)] hover:opacity-90 text-[var(--text)] rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_var(--primary)/15] flex items-center justify-center gap-2"
                            >
                              <Download size={14} /> Download Invoice
                            </button>
                            <button 
                              onClick={() => setReturnModalOrder(order)}
                              className="flex-1 md:flex-none px-6 py-4 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--text)] border border-[var(--border)] rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <ArrowLeftRight size={14} /> Return / Exchange
                            </button>
                            <Link 
                              to={`/order/${order.id}?tab=details`}
                              className="flex-1 md:flex-none px-6 py-4 border border-[var(--border)] hover:bg-[var(--primary)]/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center"
                            >
                              View Details
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link 
                              to={`/order/${order.id}?tab=details`}
                              className="flex-1 md:flex-none px-8 py-4 border border-[var(--border)] hover:bg-[var(--primary)]/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center"
                            >
                              View Details
                            </Link>
                            {order.order_status === "Refunded" || order.order_status === "Exchange Completed" || (order.return_info?.status === "Refund Processed" && order.return_info?.action !== "exchange") ? (
                              <button
                                disabled
                                className="flex-1 md:flex-none px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed text-center flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" /> {order.order_status === "Exchange Completed" || order.return_info?.action === "exchange" ? "Exchange Completed" : "Refund Completed"}
                              </button>
                            ) : (
                              <Link 
                                to={`/order/${order.id}?tab=track`}
                                className="flex-1 md:flex-none px-8 py-4 bg-[var(--primary)] hover:opacity-90 text-[var(--text)] rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_var(--primary)/15] flex items-center justify-center gap-2 group text-center"
                              >
                                Track Package <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Return Modal */}
      <AnimatePresence>
        {returnModalOrder && (
          <ReturnWizardModal 
            order={returnModalOrder} 
            onClose={() => setReturnModalOrder(null)} 
          />
        )}
      </AnimatePresence>
    </div>   
  );
};

export default Orders;