import React, { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { 
  Users, 
  ShoppingBag, 
  Search, 
  IndianRupee, 
  TrendingUp, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  Sparkles,
  RefreshCw,
  UserCheck,
  Filter,
  ArrowUpDown,
  Layers,
  Activity
} from "lucide-react";
import toast from "react-hot-toast";

const Buyer = () => {
  // Core CRM States
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedBuyerId, setExpandedBuyerId] = useState(null);
  
  // Pro UX Controls
  const [sortBy, setSortBy] = useState("spent"); // spent, orders, name
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc

  // ================= 🚀 REAL-TIME DATA SYNC ENGINE =================
  const fetchLiveBuyersData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const { data } = await axiosInstance.get("/admin/buyers");
      
      if (data.success) {
        setBuyers(data.buyers || []);
        if (silent) toast.success("CRM Engine synchronized with real-time logs.");
      }
    } catch (error) {
      console.error("CRM Sync Error:", error);
      toast.error(error.response?.data?.message || "Failed to load real-time CRM database.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveBuyersData();
  }, []);

  const toggleRow = (id) => {
    setExpandedBuyerId(expandedBuyerId === id ? null : id);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // ================= 📊 CSV REPORT EXPORT UTILITY (PRO CONFIG) =================
  const exportCRMReport = () => {
    if (!buyers || buyers.length === 0) {
      toast.error("No data available to export!");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Buyer ID,Name,Email,Phone,Total Orders,Total Spent,Address\n";
    
    buyers.forEach(b => {
      const bId = b.id || "N/A";
      const name = (b.name || "N/A").replace(/,/g, " ");
      const email = b.email || "N/A";
      const phone = b.phone || "N/A";
      const orders = b.total_orders || 0;
      const spent = b.total_spent || 0;
      const address = (b.address || "No Address captured").replace(/,/g, " ");
      
      csvContent += `${bId},${name},${email},${phone},${orders},${spent},${address}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ShopMate_CRM_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CRM Data Sheet successfully downloaded!");
  };

  // ================= 🔍 SEGMENTATION & SORTING ANALYTICS MATRIX =================
  const filteredAndSortedBuyers = buyers
    .filter(buyer => {
      const name = buyer.name || "";
      const email = buyer.email || "";
      const id = String(buyer.id || "");

      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            id.toLowerCase().includes(searchTerm.toLowerCase());
      
      let currentSegment = "New";
      if (Number(buyer.total_orders) > 8 || Number(buyer.total_spent) > 25000) currentSegment = "VIP";
      else if (Number(buyer.total_orders) > 0) currentSegment = "Active";

      const matchesFilter = statusFilter === "All" || currentSegment === statusFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let fieldA, fieldB;
      if (sortBy === "spent") {
        fieldA = Number(a.total_spent || 0);
        fieldB = Number(b.total_spent || 0);
      } else if (sortBy === "orders") {
        fieldA = Number(a.total_orders || 0);
        fieldB = Number(b.total_orders || 0);
      } else {
        fieldA = (a.name || "").toLowerCase();
        fieldB = (b.name || "").toLowerCase();
      }

      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Aggregated Analytics Math Calculations
  const totalAudience = buyers.length;
  const grossValue = buyers.reduce((acc, curr) => acc + Number(curr.total_spent || 0), 0);
  const totalPipelineOrders = buyers.reduce((acc, curr) => acc + Number(curr.total_orders || 0), 0);
  const vipCount = buyers.filter(b => Number(b.total_orders) > 8 || Number(b.total_spent) > 25000).length;
  const vipRetentionRate = totalAudience > 0 ? ((vipCount / totalAudience) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen md:pl-[17rem] bg-[#fafafa]">
         <div className="relative flex items-center justify-center mb-4">
           <div className="absolute w-16 h-16 border-4 border-indigo-100 rounded-full animate-pulse"></div>
           <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative" />
         </div>
         <p className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Syncing CRM Core Grid Pipeline...</p>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8 md:pl-[18rem] bg-[#f8fafc] min-h-screen font-sans transition-all duration-300 w-full selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- SECTION 1: HEADER LAYOUT --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-full w-max mb-3 border border-indigo-100/50">
              <Activity size={12} className="animate-pulse" /> Global CRM Enterprise Layer
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Buyers Hub<span className="text-indigo-600">.</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Lifecycle valuation engine, behavioral segments, and nested cross-order tracking logs.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => fetchLiveBuyersData(true)}
              disabled={isRefreshing}
              className="p-3 bg-white border border-slate-200/80 text-slate-600 rounded-2xl hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-sm group"
              title="Synchronize Database"
            >
              <RefreshCw size={16} className={`${isRefreshing ? "animate-spin text-indigo-600" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            </button>
            <button
              onClick={exportCRMReport}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-xl shadow-slate-900/10 transition-all border border-slate-950"
            >
              <Download size={14} /> Export Sheets
            </button>
          </div>
        </div>

        {/* --- SECTION 2: METRICS DASHBOARD CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-300/80 transition-all duration-300 group">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Audience</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{totalAudience} <span className="text-sm font-bold text-slate-400">Users</span></h3>
            </div>
            <div className="p-4 bg-indigo-50/60 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"><Users size={22} /></div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-300/80 transition-all duration-300 group">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gross Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center group-hover:text-emerald-600 transition-colors">
                <span className="text-lg font-extrabold text-emerald-500 mr-0.5">₹</span>
                {grossValue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300"><IndianRupee size={22} /></div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-300/80 transition-all duration-300 group">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Volume</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">{totalPipelineOrders} <span className="text-sm font-bold text-slate-400">Units</span></h3>
            </div>
            <div className="p-4 bg-amber-50/60 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300"><ShoppingBag size={22} /></div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-300/80 transition-all duration-300 group">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">VIP Density</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">{vipRetentionRate}%</h3>
            </div>
            <div className="p-4 bg-rose-50/60 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300"><TrendingUp size={22} /></div>
          </div>

        </div>

        {/* --- SECTION 3: SEARCH STAGE AND FILTER BARS --- */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          <div className="relative w-full lg:w-[28rem] flex items-center group">
            <Search className="absolute left-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search customers by name, email, or system id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 focus:border-indigo-600 focus:bg-white rounded-2xl font-semibold text-sm outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={12}/> Filter:
            </span>
            {["All", "VIP", "Active", "New"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border ${
                  statusFilter === tab
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/10"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

        </div>

        {/* --- SECTION 4: DATA ENGINE ARCHITECTURE CONTAINER --- */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/70">
                  <th onClick={() => handleSort("name")} className="px-6 py-4.5 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none">
                    <div className="flex items-center gap-1">Buyer Profile <ArrowUpDown size={12}/></div>
                  </th>
                  <th className="px-6 py-4.5 text-[11px] font-black uppercase tracking-widest text-slate-400 select-none">Contact Details</th>
                  <th className="px-6 py-4.5 text-[11px] font-black uppercase tracking-widest text-slate-400 select-none">Segmentation</th>
                  <th onClick={() => handleSort("orders")} className="px-6 py-4.5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center cursor-pointer hover:text-slate-700 select-none">
                    <div className="flex items-center justify-center gap-1">Orders <ArrowUpDown size={12}/></div>
                  </th>
                  <th onClick={() => handleSort("spent")} className="px-6 py-4.5 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none">
                    <div className="flex items-center gap-1">Lifetime Value <ArrowUpDown size={12}/></div>
                  </th>
                  <th className="px-6 py-4.5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center select-none">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedBuyers.length > 0 ? (
                  filteredAndSortedBuyers.map((buyer) => {
                    const bId = buyer.id;
                    const isExpanded = expandedBuyerId === bId;

                    let dynamicSegment = "New";
                    if (Number(buyer.total_orders) > 8 || Number(buyer.total_spent) > 25000) dynamicSegment = "VIP";
                    else if (Number(buyer.total_orders) > 0) dynamicSegment = "Active";

                    return (
                      <React.Fragment key={bId}>
                        <tr 
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer group ${isExpanded ? "bg-indigo-50/20 hover:bg-indigo-50/30" : ""}`} 
                          onClick={() => toggleRow(bId)}
                        >
                          
                          {/* Profile Data Block */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center font-black text-sm text-slate-600 group-hover:text-indigo-600 uppercase shadow-sm flex-shrink-0">
                                {(buyer.name || "BY").slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-slate-800 leading-tight truncate group-hover:text-indigo-600 transition-colors">{buyer.name || "Anonymous Client"}</h4>
                                <p className="text-[10px] font-mono font-semibold text-slate-400 mt-1 uppercase tracking-wider truncate">UID: {String(bId || "").slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>

                          {/* Contacts Channels */}
                          <td className="px-6 py-4.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 truncate"><Mail size={13} className="text-slate-400 flex-shrink-0" /> {buyer.email}</div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400"><Phone size={13} className="text-slate-400 flex-shrink-0" /> {buyer.phone && buyer.phone !== "N/A" ? buyer.phone : "No Phone Blocked"}</div>
                          </td>

                          {/* Badges Hub */}
                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                              dynamicSegment === "VIP" 
                                ? "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm shadow-indigo-100/30" 
                                : dynamicSegment === "Active"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}>
                              {dynamicSegment === "VIP" && <Zap size={10} className="fill-indigo-600" />}
                              {dynamicSegment} Account
                            </span>
                          </td>

                          {/* Order Volume counter */}
                          <td className="px-6 py-4.5 text-center font-extrabold text-sm text-slate-700">{buyer.total_orders || 0}</td>

                          {/* LTV calculation display */}
                          <td className="px-6 py-4.5 font-black text-sm text-slate-900">
                            ₹{Number(buyer.total_spent || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Toggle expand button trigger */}
                          <td className="px-6 py-4.5 text-center">
                            <div className="inline-flex p-2 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-500 group-hover:bg-white group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all shadow-sm">
                              {isExpanded ? <ChevronUp size={14} className="animate-bounce" /> : <ChevronDown size={14} />}
                            </div>
                          </td>

                        </tr>

                        {/* --- COLLAPSIBLE METRICS NESTED HISTORY SUB-PANEL --- */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="6" className="px-8 py-6 bg-[#fafbfc] border-l-4 border-indigo-600">
                              <div className="space-y-4 transition-all duration-300">
                                
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200/60 pb-3">
                                  <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                    <Layers size={14} className="text-indigo-500 animate-pulse"/> Transaction Mapping Logs
                                  </h5>
                                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                    <MapPin size={13} className="text-rose-500 flex-shrink-0"/> Registered Address: <span className="text-slate-800 font-bold">{buyer.address && buyer.address !== "No captured shipping address" ? buyer.address : "No captured shipping address record in DB"}</span>
                                  </p>
                                </div>

                                {/* Dynamic Items List parsing grids logs mapping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {buyer.order_history && buyer.order_history.length > 0 ? (
                                    buyer.order_history.map((order, index) => (
                                      <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all group/card">
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-start gap-2">
                                            <p className="text-xs font-black text-slate-800 line-clamp-2 group-hover/card:text-indigo-600 transition-colors">{order.title || "Ordered Item Product"}</p>
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider flex-shrink-0 border ${
                                              order.order_status === "Delivered" 
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                                : "bg-indigo-50 border-indigo-100 text-indigo-600"
                                            }`}>{order.order_status || "Processing"}</span>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400">
                                            <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">TXID: #{String(order.order_id || "").slice(-6).toUpperCase()}</span>
                                            <span>Qty: {order.quantity}</span>
                                          </div>
                                        </div>

                                        <div className="border-t border-slate-100 pt-2.5 mt-3 flex justify-between items-center">
                                          <span className="text-[10px] font-bold text-slate-400">Item Valuation:</span>
                                          <p className="text-xs font-black text-slate-900">₹{Number(order.price * order.quantity).toLocaleString('en-IN')}</p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="py-6 col-span-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white shadow-inner">
                                      <Sparkles size={14} className="text-amber-500 animate-spin"/> No recorded shopping item logs parsed for this user.
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-20 font-bold text-slate-400 text-xs uppercase tracking-widest bg-white">
                      No client profiles found matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
};

export default Buyer;