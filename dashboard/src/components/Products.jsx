import React, { useState, useEffect, useMemo } from "react";
import { 
  LoaderCircle, Plus, Package, Search, Trash2, Edit3, Eye, 
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Filter, 
  Sparkles, Layers, Box, ArrowUpDown, ShieldCheck, TrendingUp,
  BarChart3, LayoutGrid
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import CreateProductModal from "../modals/CreateProductModal";
import UpdateProductModal from "../modals/UpdateProductModal";
import ViewProductModal from "../modals/ViewProductModal";
import { toggleCreateProductModal, toggleUpdateProductModal, toggleViewProductModal } from "../store/slices/extraSlice";
import { fetchAllProducts, deleteProduct, fetchAllProductsForDashboard } from "../store/slices/productsSlice"; 

const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [maxPages, setMaxPages] = useState(1); 
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [sortConfig, setSortConfig] = useState({ key: "name", order: "asc" });
  const [stockStatusFilter, setStockStatusFilter] = useState("All");

  const [viewingAlertsPage, setViewingAlertsPage] = useState(false);
  const [activeAlertCategory, setActiveAlertCategory] = useState("All");

  const dispatch = useDispatch();

  const { isViewProductModalOpened, isCreateProductModalOpened, isUpdateProductModalOpened } = useSelector((state) => state.extra);
  const { loading, products, totalProducts, fetchingProduct, allProducts } = useSelector((state) => state.product);

  const categoryOptions = [
    "All", "Electronics", "Fashion", "Mobiles", "Home", "Sports", 
    "Books", "Beauty", "Automotive", "Kids & Baby", "Balaji Grocery"
  ];

  // Fetch all products for metrics calculations
  useEffect(() => {
    dispatch(fetchAllProductsForDashboard());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, stockStatusFilter, activeAlertCategory]);

  useEffect(() => {
    const apiCategory = viewingAlertsPage 
      ? (activeAlertCategory === "All" ? "" : activeAlertCategory)
      : (activeCategory === "All" ? "" : activeCategory);

    const apiStock = viewingAlertsPage ? "alerts"
                     : stockStatusFilter === "All" ? "" 
                     : stockStatusFilter === "InStock" ? "in-stock" 
                     : stockStatusFilter === "LowStock" ? "limited" 
                     : stockStatusFilter === "OutOfStock" ? "out-of-stock"
                     : stockStatusFilter === "Alerts" ? "alerts"
                     : "";
                     
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchAllProducts(page, 30, apiCategory, searchTerm, apiStock));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, page, activeCategory, activeAlertCategory, searchTerm, stockStatusFilter, viewingAlertsPage]);

  useEffect(() => {
    if (totalProducts !== undefined) {
      setMaxPages(Math.ceil(totalProducts / 30) || 1);
    }
  }, [totalProducts]);

  const requestSort = (key) => {
    let order = "asc";
    if (sortConfig.key === key && sortConfig.order === "asc") {
      order = "desc";
    }
    setSortConfig({ key, order });
  };

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    let result = products.filter(p => {
      const matchesSearch = p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p?.sub_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            String(p?.id || p?._id || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const effectiveCategory = viewingAlertsPage ? activeAlertCategory : activeCategory;
      const matchesCategory = effectiveCategory === "All" || p?.category === effectiveCategory;
      
      const stockNum = Number(p?.stock) || 0;
      let matchesStock = true;
      if (viewingAlertsPage) {
        matchesStock = stockNum <= 10;
      } else {
        if (stockStatusFilter === "InStock") matchesStock = stockNum > 10;
        else if (stockStatusFilter === "LowStock") matchesStock = stockNum > 0 && stockNum <= 10;
        else if (stockStatusFilter === "OutOfStock") matchesStock = stockNum <= 0;
        else if (stockStatusFilter === "Alerts") matchesStock = stockNum <= 10;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });

    return result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "price" || sortConfig.key === "stock") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, activeCategory, activeAlertCategory, stockStatusFilter, sortConfig, viewingAlertsPage]);

  const alertCategories = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return ["All"];
    const alertProducts = allProducts.filter(p => (Number(p?.stock) || 0) <= 10);
    const categories = alertProducts.map(p => p?.category || "General");
    return ["All", ...new Set(categories)];
  }, [allProducts]);

  const getStockInfo = (stock) => {
    const s = Number(stock) || 0;
    if (s <= 0) return { label: "Out of Stock", icon: <AlertTriangle size={12}/>, color: "bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-50/50" };
    if (s <= 10) return { label: "Low Supply", icon: <AlertTriangle size={12}/>, color: "bg-amber-50 border-amber-100 text-amber-600 shadow-sm shadow-amber-50/50" };
    return { label: "In Stock", icon: <CheckCircle2 size={12}/>, color: "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-50/50" };
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    dispatch(toggleViewProductModal());
  };

  const metrics = useMemo(() => {
    const targetList = allProducts && allProducts.length > 0 ? allProducts : (products || []);
    if (!targetList || !Array.isArray(targetList)) return { lowStock: 0, outOfStock: 0, totalValuation: 0 };
    return {
      lowStock: targetList.filter(p => { const s = Number(p?.stock) || 0; return s > 0 && s <= 10; }).length,
      outOfStock: targetList.filter(p => (Number(p?.stock) || 0) <= 0).length,
      totalValuation: targetList.reduce((acc, p) => acc + (Number(p?.price || 0) * (Number(p?.stock || 0))), 0)
    };
  }, [allProducts, products]);

  return (
    <>
      <main className="p-4 md:p-8 md:pl-[18rem] bg-[#f8fafc] min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-all duration-300 w-full">
        <Header />
        
        <div className="max-w-[1400px] mx-auto mt-6 space-y-8">
          
          {!viewingAlertsPage ? (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200/60">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-full w-max mb-3 border border-indigo-100/50 backdrop-blur-sm">
                    <Sparkles size={12} className="animate-pulse" /> Global Catalog Management Matrix
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">Catalog<span className="text-indigo-600">.</span></h1>
                  <p className="text-slate-500 text-sm font-medium mt-1">Configure retail inventory nodes, balance active supply statuses, and optimize channels visibility.</p>
                </div>
                <button 
                  onClick={() => dispatch(toggleCreateProductModal())}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl shadow-indigo-600/10 transition-all border border-indigo-700"
                >
                  <Plus size={16} /> New Product Node
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <button
                  type="button"
                  onClick={() => { setStockStatusFilter("All"); setPage(1); }}
                  className={`text-left p-6 rounded-[2rem] border shadow-sm flex items-center justify-between hover:shadow-md hover:border-indigo-400 active:scale-98 transition-all duration-300 group cursor-pointer outline-none ${
                    (stockStatusFilter === "All" || stockStatusFilter === "") && !viewingAlertsPage
                    ? "bg-indigo-50/10 border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-50/50"
                    : "bg-white border-slate-200/60"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1 mr-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">Total Inventory</p>
                    <h3 className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors flex items-baseline flex-wrap gap-x-1">
                      <span>{totalProducts || 0}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Items</span>
                    </h3>
                    <p className="text-slate-400 text-xs font-medium truncate">Global items parsed in database</p>
                  </div>
                  <div className={`p-4 rounded-2xl flex-shrink-0 transition-all duration-300 ${(stockStatusFilter === "All" || stockStatusFilter === "") && !viewingAlertsPage ? "bg-indigo-600 text-white" : "bg-indigo-50/60 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"}`}><Box size={20}/></div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewingAlertsPage(true);
                    setActiveAlertCategory("All");
                    setPage(1);
                  }}
                  className="text-left p-6 rounded-[2rem] border border-slate-200/60 bg-white shadow-sm flex items-center justify-between hover:shadow-md hover:border-rose-400 active:scale-98 transition-all duration-300 group cursor-pointer outline-none"
                >
                  <div className="space-y-1 min-w-0 flex-1 mr-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">Supply Alerts</p>
                    <h3 className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-black text-rose-500 tracking-tight flex items-baseline flex-wrap gap-x-1">
                      <span>{metrics.lowStock + metrics.outOfStock}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Units</span>
                    </h3>
                    <p className="text-slate-400 text-xs font-medium truncate">{metrics.outOfStock} critical empty records</p>
                  </div>
                  <div className="p-4 rounded-2xl flex-shrink-0 bg-rose-50/60 text-rose-600 transition-all duration-300 group-hover:bg-rose-600 group-hover:text-white"><AlertTriangle size={20}/></div>
                </button>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-300/80 transition-all duration-300 group">
                  <div className="space-y-1 min-w-0 flex-1 mr-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">Live Segments</p>
                    <h3 className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors flex items-baseline flex-wrap gap-x-1">
                      <span>{categoryOptions.length - 1}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Categories</span>
                    </h3>
                    <p className="text-slate-400 text-xs font-medium truncate">Active storefront filter channels</p>
                  </div>
                  <div className="p-4 rounded-2xl flex-shrink-0 bg-amber-50/60 text-amber-600 transition-all duration-300 group-hover:bg-amber-600 group-hover:text-white"><Layers size={20}/></div>
                </div>

                <button
                  type="button"
                  onClick={() => { setStockStatusFilter(stockStatusFilter === "InStock" ? "All" : "InStock"); setPage(1); }}
                  className={`text-left p-6 rounded-[2rem] border shadow-sm flex items-center justify-between hover:shadow-md hover:border-emerald-400 active:scale-98 transition-all duration-300 group cursor-pointer outline-none ${
                    stockStatusFilter === "InStock" && !viewingAlertsPage
                    ? "bg-emerald-50/10 border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-50/50"
                    : "bg-white border-slate-200/60"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1 mr-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">Total Asset Value</p>
                    <h3 className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-black text-slate-900 tracking-tight flex items-baseline flex-wrap gap-x-0.5 group-hover:text-emerald-600 transition-colors">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-500">₹</span>
                      <span>{metrics.totalValuation.toLocaleString('en-IN')}</span>
                    </h3>
                    <p className="text-slate-400 text-xs font-medium truncate">Stock evaluation in entire database</p>
                  </div>
                  <div className={`p-4 rounded-2xl flex-shrink-0 transition-all duration-300 ${stockStatusFilter === "InStock" && !viewingAlertsPage ? "bg-emerald-600 text-white" : "bg-emerald-50/60 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"}`}><TrendingUp size={20}/></div>
                </button>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-5 flex flex-col xl:flex-row gap-4 justify-between items-center border-b border-slate-100 bg-slate-50/40">
                  <div className="relative w-full flex items-center group">
                    <Search className="absolute left-4 text-indigo-500 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Filter by product catalog title, tags, or UUID..."
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-indigo-100/80 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl font-semibold text-sm outline-none transition-all placeholder:text-slate-400 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.12)] focus:shadow-[0_4px_25px_-2px_rgba(99,102,241,0.22)]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                    <LayoutGrid size={11}/> Category Segment:
                  </span>
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all whitespace-nowrap ${
                        activeCategory === cat
                        ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                    <BarChart3 size={11}/> Supply Filter:
                  </span>
                  {[
                    { id: "All", label: "All Items" },
                    { id: "InStock", label: "In Stock Only" },
                    { id: "LowStock", label: "Low Stock Alert" },
                    { id: "OutOfStock", label: "Empty/Out of Stock" }
                  ].map(status => (
                    <button
                      key={status.id}
                      onClick={() => setStockStatusFilter(status.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        stockStatusFilter === status.id
                        ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto w-full">
                  {fetchingProduct ? (
                    <div className="p-6 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse w-full" />
                      ))}
                    </div>
                  ) : filteredProducts && filteredProducts.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/60 bg-slate-50/40 select-none">
                          <th onClick={() => requestSort("name")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Product Blueprint <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("category")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Category Channel <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("sub_category")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Sub Category <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("price")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Valuation <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("stock")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center cursor-pointer hover:text-slate-700">
                            <div className="flex items-center justify-center gap-1">Supply Logs <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Operation Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((product) => {
                          const stock = getStockInfo(product?.stock);
                          const productId = product?.id || product?._id;
                          
                          let parsedImages = [];
                          if (product?.images) {
                            if (typeof product.images === 'string') {
                              try { parsedImages = JSON.parse(product.images); } catch(e) { parsedImages = []; }
                            } else if (Array.isArray(product.images)) {
                              parsedImages = product.images;
                            }
                          }
                          const targetImageSrc = parsedImages?.[0]?.url || parsedImages?.[0] || product?.avatar?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";

                          const parsePromoOffer = (desc) => {
                            if (!desc || !desc.startsWith("【Promo Offer: ")) return { offer: null, cleanDesc: desc };
                            const endIdx = desc.indexOf("】");
                            if (endIdx === -1) return { offer: null, cleanDesc: desc };
                            const offer = desc.slice(14, endIdx);
                            const cleanDesc = desc.slice(endIdx + 1).trim();
                            return { offer, cleanDesc };
                          };
                          const { offer } = parsePromoOffer(product?.description || "");

                          return (
                            <tr key={productId || Math.random()} className="hover:bg-slate-50/40 transition-colors group">
                              <td className="px-6 py-4 max-w-[320px] cursor-pointer" onClick={() => handleViewDetails(product)}>
                                <div className="flex items-center gap-4">
                                  <div className="relative w-14 h-14 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-sm transition-transform group-hover:scale-105">
                                    <img 
                                      src={targetImageSrc} 
                                      alt="Catalog Item Display" 
                                      className="object-cover w-full h-full"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0 overflow-hidden">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-bold text-sm text-slate-800 leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                        {product?.name || "Untitled Product Resource"}
                                      </p>
                                      {offer && (
                                        <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-wider animate-pulse flex-shrink-0 shadow-sm">
                                          🔥 {offer}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-indigo-500 font-mono font-bold mt-1 uppercase tracking-wider">
                                      UID: #{productId ? String(productId).slice(-8).toUpperCase() : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/40 whitespace-nowrap">
                                  {product?.category || "General"}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                {product?.sub_category ? (
                                  <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-200/50 whitespace-nowrap capitalize">
                                    {product.sub_category}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-300 font-medium">—</span>
                                )}
                              </td>

                              <td className="px-6 py-4 font-black text-sm text-slate-900 whitespace-nowrap">
                                ₹{(Number(product?.price) || 0).toLocaleString('en-IN')}
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase border border-slate-200/20 whitespace-nowrap ${stock.color}`}>
                                  {stock.icon} {stock.label}
                                  <span className="ml-0.5 opacity-60 font-mono text-xs">( {product?.stock || 0} )</span>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1 rounded-xl shadow-inner group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                                  <button 
                                    onClick={() => handleViewDetails(product)} 
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    title="Inspect Specs"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); dispatch(toggleUpdateProductModal()); }} 
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                    title="Edit Product Properties"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    disabled={loading}
                                    onClick={(e) => { e.stopPropagation(); if (productId) dispatch(deleteProduct(productId, page)); }} 
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30"
                                    title="Purge Record node"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="p-8 bg-slate-50 border border-slate-200/40 rounded-full mb-4 text-slate-300 shadow-inner">
                        <Package size={44} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No inventory products found matching selection queries</h3>
                    </div>
                  )}
                </div>

                {!fetchingProduct && filteredProducts?.length > 0 && (
                  <div className="p-5 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Showing <span className="text-slate-800 font-extrabold">{filteredProducts.length}</span> registries in segment <span className="text-indigo-600 font-extrabold">{activeCategory}</span>
                    </p>
                    
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                      <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="p-2 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all shadow-sm"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-black px-2 font-mono">
                        {page} <span className="text-slate-300 font-sans">/</span> {maxPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(p + 1, maxPages))}
                        disabled={page === maxPages}
                        className="p-2 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all shadow-sm"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <button 
                  onClick={() => {
                    setViewingAlertsPage(false);
                    setStockStatusFilter("All");
                    setPage(1);
                  }}
                  className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm transition-all hover:scale-102 active:scale-98"
                >
                  <ChevronLeft size={16} /> Return to General Catalog
                </button>
              </div>

              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-200/60">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50/80 px-3 py-1 rounded-full w-max mb-3 border border-rose-100/50 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    Critical Stock & Low Supply Alerts Hub
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Supply Alerts<span className="text-rose-500">.</span>
                  </h1>
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    Reviewing {metrics.lowStock + metrics.outOfStock} items requiring immediate stock replenishment across active retail segments.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3 flex-1 xl:flex-none min-w-[150px]">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex-shrink-0"><AlertTriangle size={18}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Out of Stock</p>
                      <h4 className="text-xl font-black text-rose-600 leading-none">{metrics.outOfStock} <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span></h4>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3 flex-1 xl:flex-none min-w-[150px]">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0"><AlertTriangle size={18}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Low Supply</p>
                      <h4 className="text-xl font-black text-amber-600 leading-none">{metrics.lowStock} <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span></h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-md border-2 border-rose-100 overflow-hidden shadow-rose-100/10">
                
                <div className="p-5 flex flex-col xl:flex-row gap-4 justify-between items-center border-b border-slate-100 bg-rose-50/10">
                  <div className="relative w-full flex items-center group">
                    <Search className="absolute left-4 text-rose-500 group-focus-within:text-rose-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search within supply alerts (Title, tags, category or UUID)..."
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-rose-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 rounded-2xl font-semibold text-sm outline-none transition-all placeholder:text-slate-400 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.08)] focus:shadow-[0_4px_25px_-2px_rgba(244,63,94,0.18)]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1 whitespace-nowrap">
                    <LayoutGrid size={11}/> Alerts Category Segment:
                  </span>
                  {alertCategories.map((cat) => {
                    const count = cat === "All" 
                      ? (metrics.lowStock + metrics.outOfStock)
                      : allProducts?.filter(p => p?.category === cat && (Number(p?.stock) || 0) <= 10).length || 0;

                    return (
                      <button
                        key={cat}
                        onClick={() => { setActiveAlertCategory(cat); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${
                          activeAlertCategory === cat
                          ? "bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-500/20"
                          : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold transition-colors ${
                          activeAlertCategory === cat
                          ? "bg-white text-rose-600"
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="overflow-x-auto w-full">
                  {fetchingProduct ? (
                    <div className="p-6 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse w-full" />
                      ))}
                    </div>
                  ) : filteredProducts && filteredProducts.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/60 bg-slate-50/40 select-none">
                          <th onClick={() => requestSort("name")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Product Blueprint <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("category")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Category Channel <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("sub_category")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Sub Category <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("price")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700">
                            <div className="flex items-center gap-1">Valuation <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th onClick={() => requestSort("stock")} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center cursor-pointer hover:text-slate-700">
                            <div className="flex items-center justify-center gap-1">Supply Logs <ArrowUpDown size={12} className="opacity-70"/></div>
                          </th>
                          <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Operation Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((product) => {
                          const stock = getStockInfo(product?.stock);
                          const productId = product?.id || product?._id;
                          const isCriticalEmpty = (Number(product?.stock) || 0) <= 0;
                          
                          let parsedImages = [];
                          if (product?.images) {
                            if (typeof product.images === 'string') {
                              try { parsedImages = JSON.parse(product.images); } catch(e) { parsedImages = []; }
                            } else if (Array.isArray(product.images)) {
                              parsedImages = product.images;
                            }
                          }
                          const targetImageSrc = parsedImages?.[0]?.url || parsedImages?.[0] || product?.avatar?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";

                          const parsePromoOffer = (desc) => {
                            if (!desc || !desc.startsWith("【Promo Offer: ")) return { offer: null, cleanDesc: desc };
                            const endIdx = desc.indexOf("】");
                            if (endIdx === -1) return { offer: null, cleanDesc: desc };
                            const offer = desc.slice(14, endIdx);
                            const cleanDesc = desc.slice(endIdx + 1).trim();
                            return { offer, cleanDesc };
                          };
                          const { offer } = parsePromoOffer(product?.description || "");

                          return (
                            <tr key={productId || Math.random()} className={`transition-colors group hover:bg-rose-50/20 bg-rose-50/5 border-l-4 ${isCriticalEmpty ? "border-l-rose-500" : "border-l-amber-500"}`}>
                              <td className="px-6 py-4 max-w-[320px] cursor-pointer" onClick={() => handleViewDetails(product)}>
                                <div className="flex items-center gap-4">
                                  <div className="relative w-14 h-14 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-sm transition-transform group-hover:scale-105">
                                    <img 
                                      src={targetImageSrc} 
                                      alt="Catalog Item Display" 
                                      className="object-cover w-full h-full"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0 overflow-hidden">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-bold text-sm text-slate-800 leading-tight truncate group-hover:text-rose-600 transition-colors">
                                        {product?.name || "Untitled Product Resource"}
                                      </p>
                                      {offer && (
                                        <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-wider flex-shrink-0 shadow-sm">
                                          🔥 {offer}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-rose-500 font-mono font-bold mt-1 uppercase tracking-wider">
                                      UID: #{productId ? String(productId).slice(-8).toUpperCase() : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200/40 whitespace-nowrap">
                                  {product?.category || "General"}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                {product?.sub_category ? (
                                  <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-200/50 whitespace-nowrap capitalize">
                                    {product.sub_category}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-300 font-medium">—</span>
                                )}
                              </td>

                              <td className="px-6 py-4 font-black text-sm text-slate-900 whitespace-nowrap">
                                ₹{(Number(product?.price) || 0).toLocaleString('en-IN')}
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase border border-slate-200/20 whitespace-nowrap ${stock.color}`}>
                                  {stock.icon} {stock.label}
                                  <span className="ml-0.5 opacity-60 font-mono text-xs">( {product?.stock || 0} )</span>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200/60 p-1 rounded-xl shadow-inner group-hover:border-rose-100 transition-colors">
                                  <button 
                                    onClick={() => handleViewDetails(product)} 
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Inspect Specs"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); dispatch(toggleUpdateProductModal()); }} 
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                    title="Edit Product Properties"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    disabled={loading}
                                    onClick={(e) => { e.stopPropagation(); if (productId) dispatch(deleteProduct(productId, page)); }} 
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30"
                                    title="Purge Record node"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="p-8 bg-slate-50 border border-slate-200/40 rounded-full mb-4 text-slate-300 shadow-inner">
                        <Package size={44} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No critical supply alerts found matching selection queries</h3>
                    </div>
                  )}
                </div>

                {!fetchingProduct && filteredProducts?.length > 0 && (
                  <div className="p-5 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Showing <span className="text-slate-800 font-extrabold">{filteredProducts.length}</span> registries in alerts segment <span className="text-rose-600 font-extrabold">{activeAlertCategory}</span>
                    </p>
                    
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                      <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="p-2 bg-slate-50 hover:bg-rose-600 text-slate-700 hover:text-white rounded-lg disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all shadow-sm"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-black px-2 font-mono">
                        {page} <span className="text-slate-300 font-sans">/</span> {maxPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(p + 1, maxPages))}
                        disabled={page === maxPages}
                        className="p-2 bg-slate-50 hover:bg-rose-600 text-slate-700 hover:text-white rounded-lg disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all shadow-sm"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {isCreateProductModalOpened && <CreateProductModal />}
      {isUpdateProductModalOpened && <UpdateProductModal product={selectedProduct} />}
      {isViewProductModalOpened && <ViewProductModal selectedProduct={selectedProduct} />} 
    </>
  );
};

export default Products;
