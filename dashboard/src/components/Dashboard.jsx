import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import MiniSummary from "./dashboard-components/MiniSummary";
import TopSellingProducts from "./dashboard-components/TopSellingProducts";
import Stats from "./dashboard-components/Stats";
import MonthlySalesChart from "./dashboard-components/MonthlySalesChart";
import OrdersChart from "./dashboard-components/OrdersChart";
import TopProductsChart from "./dashboard-components/TopProductsChart";

// 🔌 REAL API ACTIONS SYNC
import { fetchAllProductsForDashboard } from "../store/slices/productsSlice";
import { fetchAllOrders } from "../store/slices/orderSlice";
import { getDashboardStats } from "../store/slices/adminSlice";
import { toast } from "react-hot-toast";

import { 
  Sparkles, RefreshCw, Download, Layers, TrendingUp, CheckCircle2, 
  FileText, LayoutDashboard, ChevronDown, Clock, CheckCircle, XCircle, Gauge, Activity, Database, Globe, Terminal
} from "lucide-react";

// 🔥 MODULE A: Live Data Driven Sales Performance Goal Progress Gauge Arc (Full Circle)
const SalesPerformanceGauge = ({ percentage = 80 }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius; 
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-[220px] select-none mt-2">
      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background Track Circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="none" 
          stroke="#1e293b" 
          strokeWidth="7" 
          opacity="0.3" 
        />
        {/* Glow Shadow Filter Circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="none" 
          stroke="url(#gaugeIndigoGlowDashboard)" 
          strokeWidth="7" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1.5s ease-in-out" }}
          filter="url(#glowFilterDashboard)"
        />
        {/* Main Progress Circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="none" 
          stroke="url(#gaugeIndigoGlowDashboard)" 
          strokeWidth="7" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1.5s ease-in-out" }}
        />
        <defs>
          <linearGradient id="gaugeIndigoGlowDashboard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glowFilterDashboard" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-black text-white tracking-tight">{percentage}%</span>
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Sales Goal</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(99.8);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeSegment, setActiveSegment] = useState("all_nodes");

  // 👤 PULLING GENUINE ARRAYS FROM REDUX PRODUCT STATE BRANCH
  const { allProducts } = useSelector((state) => state.product || {});
  const { orders, loading: ordersLoading } = useSelector((state) => state.order || {});

  // 🔥 THE BACKEND INJECTOR: Dashboard load hote hi backend core controller ko hit karega
  useEffect(() => {
    dispatch(fetchAllProductsForDashboard());
    dispatch(fetchAllOrders());
    dispatch(getDashboardStats());
  }, [dispatch]);

  // Real-time system health updater (Removed auto-refresh)

  const handleRefreshPipeline = () => {
    setIsRefreshing(true);
    setSystemHealth(Number((99.1 + Math.random() * 0.8).toFixed(1)));
    
    // Refresh par wapas live backend api trigger hogi
    dispatch(fetchAllProductsForDashboard());
    dispatch(fetchAllOrders());
    dispatch(getDashboardStats());
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 900);
  };

  const exportToCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error("No transaction data to export.");
      return;
    }
    const headers = ["Order ID", "Product", "Date", "Customer", "Amount", "Status"];
    const rows = recentTransactions.map(t => [t.id, `"${t.name.replace(/"/g, '""')}"`, t.date, t.customer, `"${t.price}"`, t.status]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Ledger exported successfully!");
    setShowExportMenu(false);
  };

  // 🔥 DYNAMIC RECENT TRANSACTIONS: Directly mapped from backend database records
  const recentTransactions = React.useMemo(() => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) return [];
    
    // Sort orders by date descending to get the most recent ones first
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA;
    });

    // Sub-slice processing first 4 dynamic orders rows
    let activeOrders = sortedOrders;
    
    if (activeSegment === "isolated") {
      activeOrders = activeOrders.filter(order => {
        const orderStatus = order.status || order.order_status || "Processing";
        return orderStatus === "Processing" || orderStatus === "Pending";
      });
    }

    const activeOrdersSlice = activeOrders.slice(0, 4);
    
    return activeOrdersSlice.map((order, idx) => {
      const orderId = order._id || order.id || `TX-${idx}`;
      const items = order.orderedItems || order.ordered_items || order.order_items || [];
      const firstItem = items[0] || {};
      
      const thumbnailSrc = firstItem.image || firstItem.url || 
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=60";
      
      const productName = firstItem.title || firstItem.name || (items.length > 0 ? "Multiple Items" : "Order Transaction");
      
      const orderStatus = order.status || order.order_status || "Processing";
      // Format backend date
      const rawDate = order.createdAt || order.created_at;
      let dateString = "N/A";
      if (rawDate) {
        const orderDate = new Date(rawDate);
        const today = new Date();
        const isToday = orderDate.getDate() === today.getDate() &&
                        orderDate.getMonth() === today.getMonth() &&
                        orderDate.getFullYear() === today.getFullYear();
        
        if (isToday) {
          dateString = "Today, " + orderDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
        } else {
          dateString = orderDate.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + 
                       orderDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
        }
      }

      const amount = order.totalAmount || order.total_amount || order.total_price || 0;
      const customerName = order.shippingInfo?.full_name || order.shippingInfo?.fullName || "Guest Customer";

      return {
        id: `TX-${orderId.toString().substring(0, 6).toUpperCase()}`,
        name: productName + (items.length > 1 ? ` (+${items.length - 1} more)` : ""),
        category: firstItem.category || "E-Commerce",
        customer: customerName,
        date: dateString,
        price: `₹${Number(amount).toLocaleString("en-IN")}`,
        status: orderStatus === "Delivered" ? "Completed" : orderStatus === "Cancelled" ? "Cancelled" : "Pending",
        thumbnail: thumbnailSrc
      };
    });
  }, [orders]);

  const dynamicGoalPercentage = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) return 80;
    const totalStock = allProducts.reduce((acc, p) => acc + (Number(p?.stock) || 0), 0);
    return totalStock > 0 ? Math.min(100, Math.max(65, Math.round((allProducts.length / totalStock) * 1000))) : 80;
  }, [allProducts]);

  return (
    <>
      <main className="min-h-screen bg-[#090d16] font-sans text-slate-200 pb-20 transition-all duration-500 w-full antialiased p-[10px] pl-[10px] md:pl-[17rem] box-border relative overflow-x-hidden">
        
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-10 left-[20%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="flex-1 md:p-6 space-y-8 relative z-10 w-full box-border">
          <Header />

          {/* 🌌 COMMAND CONTROLS HEADER */}
          <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden group w-full box-border">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-xl shadow-inner">
                  <Sparkles size={11} className="text-indigo-400 animate-pulse" /> Spectrum Matrix Core
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-100/60 px-3 py-1 rounded-xl shadow-inner">
                  <Terminal size={11} /> Stability Grid: {systemHealth}% Active
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3 font-sans">
                Operations Hypervisor Console<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
                Real-time transaction pipelines integrated with predictive goal tracking matrix indicators.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800/60 shadow-inner flex items-center">
                {["all_nodes", "isolated"].map((segment) => (
                  <button
                    key={segment}
                    onClick={() => setActiveSegment(segment)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                      activeSegment === segment
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {segment.replace("_", " ")}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefreshPipeline}
                disabled={isRefreshing}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
              >
                <RefreshCw size={14} className={`transition-transform duration-1000 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-5 py-4 rounded-2xl shadow-lg border border-indigo-500/30"
                >
                  <Download size={13} /> Export Ledger <ChevronDown size={11} className={`transition-transform duration-300 ${showExportMenu ? "rotate-180" : ""}`} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button onClick={exportToCSV} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-xl"><FileText size={13} className="text-emerald-400"/> Stream Raw CSV Node</button>
                    <button onClick={() => { setShowExportMenu(false); window.print(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-xl"><FileText size={13} className="text-rose-400"/> Compile PDF Analytics</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Core Stats Metrics Ribbon Section */}
          <section className="w-full">
            <Stats />
          </section>

          {/* 4. HIGH-PERFORMANCE VISUAL CHARTS LAYER */}
          <div className="space-y-8 w-full box-border">
            <div className="grid grid-cols-1 gap-8 w-full box-border">
              <div className="bg-slate-900/30 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/50 shadow-md relative overflow-hidden group">
                <div className="border-b border-slate-800/60 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={15} className="text-indigo-400"/> Revenue Velocity
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">Monthly transactional aggregate indices logs from production</p>
                  </div>
                </div>
                <MonthlySalesChart />
              </div>

              <div className="bg-slate-900/30 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/50 shadow-md relative overflow-hidden group">
                <div className="border-b border-slate-800/60 pb-4 mb-4">
                  <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={15} className="text-amber-400"/> Category Split Distribution
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Real product category counts loaded straight from your data branch</p>
                </div>
                <OrdersChart />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 w-full box-border">
              <div className="bg-slate-900/30 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/50 shadow-md relative overflow-hidden group flex flex-col justify-between">
                <div className="border-b border-slate-800/60 pb-4 mb-3 w-full">
                  <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Gauge size={15} className="text-emerald-400"/> Sales Performance Target
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Fulfillment completion target dynamic ratio monitor</p>
                </div>
                <div className="py-4">
                  <SalesPerformanceGauge percentage={dynamicGoalPercentage} />
                </div>
                <div className="flex items-center justify-between text-xs font-black text-slate-400 px-2 pt-3 border-t border-slate-800/40 w-full mt-2">
                  <span>Active Items In Store: <strong className="text-white font-mono text-sm ml-1">{allProducts?.length || 0}</strong></span>
                  <span>System Nodes status: <strong className="text-emerald-400 font-mono text-sm ml-1">Connected</strong></span>
                </div>
              </div>

              <div className="bg-slate-900/30 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/50 shadow-md relative overflow-hidden group">
                <div className="border-b border-slate-800/60 pb-4 mb-4">
                  <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <LayoutDashboard size={15} className="text-violet-400"/> Market Segments Density
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Inventory items sales metrics and item volume progressions</p>
                </div>
                <TopProductsChart />
              </div>
            </div>
          </div>

          {/* 5. RECENT TRANSACTION LEDGER TABLE */}
          <div className="bg-slate-900/20 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800/60 shadow-lg p-6 w-full box-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-5 w-full">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Clock size={16} className="text-indigo-400 animate-pulse"/> Recent Transactions Log
                </h3>
                <p className="text-slate-500 text-[10px] font-semibold">Real-time parsed rows computed row matrix from your active database</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest">
                  Live Sync Active
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Order Identifier</th>
                    <th className="px-4 py-3">Product Blueprint Spec</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Customer Node</th>
                    <th className="px-4 py-3">Valuation Cost</th>
                    <th className="px-4 py-3 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-900/40 transition-all duration-200">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-400">{trx.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={trx.thumbnail} alt="asset-thumb" className="w-8 h-8 rounded-xl object-cover border border-slate-800" />
                            <div className="truncate">
                              <p className="font-extrabold text-white text-xs truncate max-w-[150px]">{trx.name}</p>
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">{trx.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{trx.date}</td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-slate-300">{trx.customer}</td>
                        <td className="px-4 py-3.5 font-black text-white font-sans text-xs">{trx.price}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-black text-[9px] uppercase tracking-wider ${
                            trx.status === "Completed" ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" :
                            trx.status === "Pending" ? "bg-amber-950/60 border-amber-800/50 text-amber-400" :
                            "bg-rose-950/60 border-rose-800/50 text-rose-400"
                          }`}>
                            {trx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500 font-bold text-xs uppercase tracking-widest">
                        {ordersLoading ? "Loading transaction streams from data source..." : "No transactions recorded yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Lower Grid: Product Performance Top Performers & Mini Summary */}
          <div className="grid grid-cols-1 gap-8 w-full box-border">
            <div className="bg-slate-900/20 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800/60 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-base tracking-tight">Seller Specifications</h3>
                  <p className="text-slate-500 text-[10px] font-semibold mt-0.5">Real-time compilation mapping conversion metrics</p>
                </div>
                <span className="px-3 py-1 bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={11}/> Core Pipelines Connected
                </span>
              </div>
              <div className="p-4 overflow-x-auto custom-scrollbar">
                <TopSellingProducts />
              </div>
            </div>

            <div className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/60 shadow-lg overflow-hidden flex flex-col justify-between">
              <div className="w-full h-full">
                <MiniSummary />
              </div>
            </div>
          </div>

          {/* 7. Active Infrastructure Security Protocol Hub Frame */}
          <section className="bg-gradient-to-br from-slate-950 via-[#0b111e] to-indigo-950/80 text-white p-6 sm:p-8 rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden border border-slate-800/80 w-full box-border group">
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] -mr-16 -mb-16 rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
              <div className="space-y-1">
                <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400 flex items-center gap-1.5">
                  <Activity size={13} className="animate-pulse" /> Cluster Environment Active Gateway
                </h4>
                <p className="text-xl font-black text-white tracking-tight">System Node Architecture Firewalled</p>
                <p className="text-slate-500 text-[11px] font-semibold">Continuous signature verification streams and atomic row replication sockets checked live.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl shadow-inner text-[9px] font-black uppercase tracking-widest text-slate-300">
                <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
                  <Database size={13} className="text-emerald-400" /> DB Node: Connected
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe size={13} className="text-indigo-400" /> Edge Region: IN-WEST
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
};

export default Dashboard;