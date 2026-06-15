import React, { useState, useEffect } from "react";
import { X, Sparkles, Scale, AlertCircle, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const ComparisonDrawer = () => {
  const [compareList, setCompareList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Sync list from localStorage to communicate with other pages in real-time
  const loadList = () => {
    try {
      const list = JSON.parse(localStorage.getItem("ai_compare_queue")) || [];
      setCompareList(list);
    } catch {
      setCompareList([]);
    }
  };

  useEffect(() => {
    loadList();
    const interval = setInterval(loadList, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRemove = (id, e) => {
    e.stopPropagation();
    const updated = compareList.filter(p => p.id !== id && p._id !== id);
    localStorage.setItem("ai_compare_queue", JSON.stringify(updated));
    setCompareList(updated);
    toast.info("Product removed from comparison list");
  };

  const handleClear = () => {
    localStorage.setItem("ai_compare_queue", JSON.stringify([]));
    setCompareList([]);
    setIsOpen(false);
  };

  if (compareList.length === 0) return null;

  // AI Verdict Generator Algorithm
  const generateAIVerdict = () => {
    if (compareList.length === 0) return "";
    
    // Sort by rating to find the winner
    const sorted = [...compareList].sort((a, b) => Number(b.ratings || 0) - Number(a.ratings || 0));
    const winner = sorted[0];
    
    return `Based on customer feedback and product spec analysis, **${winner.name}** stands out as the ultimate winner! It boasts a premium rating of **${Number(winner.ratings).toFixed(1)} Stars** and superior value mapping in the ${winner.category} category. We highly recommend proceeding with this item! 🏆`;
  };

  return (
    <>
      {/* FLOATING DRAWER TRIGGER BUTTON (BOTTOM RIGHT) */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="fixed bottom-24 left-6 z-40 bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-indigo-400/30 cursor-pointer hover:scale-105 transition"
          onClick={() => setIsOpen(true)}
          style={{ boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
        >
          <Scale size={16} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">Compare AI Queue ({compareList.length})</span>
        </motion.div>
      )}

      {/* COMPARISON MODAL OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#07070d]/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative z-10 w-full max-w-4xl bg-[#0f0f20] border border-indigo-500/25 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

              {/* HEADER */}
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg">
                    <Scale size={16} />
                  </div>
                  <h3 className="text-white text-base font-black uppercase tracking-wider">AI Product Spec Comparer</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleClear} 
                    className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-wider px-3 py-1.5 hover:bg-white/5 border border-transparent rounded-lg transition"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-1.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-xl transition"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* SPECIFICATION SHEET GRID */}
              <div className="flex-1 overflow-x-auto scrollbar-thin mb-6 pr-1">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 text-slate-500 font-bold uppercase tracking-widest text-[9px] w-40">Features</th>
                      {compareList.map((product) => (
                        <th key={product.id || product._id} className="py-4 px-4 text-white font-black text-sm">
                          <div className="flex items-center gap-3">
                            <img src={product.image || "/no-image.png"} className="w-12 h-12 object-cover rounded-lg border border-white/10" alt="" />
                            <div className="min-w-0">
                              <h4 className="line-clamp-1">{product.name}</h4>
                              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">{product.category}</span>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-white/5 font-semibold text-slate-350">
                    {/* Price */}
                    <tr>
                      <td className="py-4 text-slate-400 font-bold uppercase tracking-wider text-[9px]">Price Range</td>
                      {compareList.map((product) => (
                        <td key={product.id || product._id} className="py-4 px-4 font-black text-white text-sm font-mono">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </td>
                      ))}
                    </tr>

                    {/* Ratings */}
                    <tr>
                      <td className="py-4 text-slate-400 font-bold uppercase tracking-wider text-[9px]">User Rating</td>
                      {compareList.map((product) => (
                        <td key={product.id || product._id} className="py-4 px-4">
                          <span className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                            ★ {Number(product.ratings || 5).toFixed(1)}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Offer Badging */}
                    <tr>
                      <td className="py-4 text-slate-400 font-bold uppercase tracking-wider text-[9px]">Dynamic Offer</td>
                      {compareList.map((product) => (
                        <td key={product.id || product._id} className="py-4 px-4">
                          <span className="px-2 py-0.5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-wider rounded-full font-mono">
                            {product.offer_type || "Mega Deal"}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Stock Status */}
                    <tr>
                      <td className="py-4 text-slate-400 font-bold uppercase tracking-wider text-[9px]">Stock Status</td>
                      {compareList.map((product) => {
                        const inStock = product.stock > 0;
                        return (
                          <td key={product.id || product._id} className="py-4 px-4">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${inStock ? "text-emerald-400" : "text-rose-400"}`}>
                              {inStock ? "● In Stock" : "● Out of Stock"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Dimensions */}
                    <tr>
                      <td className="py-4 text-slate-400 font-bold uppercase tracking-wider text-[9px]">AI Weight Rating</td>
                      {compareList.map((product) => (
                        <td key={product.id || product._id} className="py-4 px-4 opacity-70">
                          {product.category === "Electronics" ? "Lightweight / Pro Gear" : "Premium aesthetics / High rank"}
                        </td>
                      ))}
                    </tr>

                    {/* Buy Trigger */}
                    <tr>
                      <td className="py-4 text-slate-400 font-bold uppercase tracking-wider text-[9px]">Checkout Ready</td>
                      {compareList.map((product) => (
                        <td key={product.id || product._id} className="py-4 px-4">
                          <Link 
                            to={`/product/${product.id || product._id}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition"
                          >
                            <ShoppingCart size={11} /> View Specs
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 🤖 AI RECOMMENDATION VERDICT BOX */}
              <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-5 shrink-0 flex items-start gap-4">
                <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl shrink-0 mt-0.5">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-white font-black uppercase tracking-wider text-xs flex items-center gap-1">
                    AI Comparer Verdict
                  </h4>
                  <p 
                    className="text-xs opacity-80 leading-relaxed font-semibold text-slate-200"
                    dangerouslySetInnerHTML={{
                      __html: generateAIVerdict()
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>')
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ComparisonDrawer;
