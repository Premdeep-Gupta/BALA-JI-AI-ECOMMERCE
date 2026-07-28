import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toggleViewProductModal } from "../store/slices/extraSlice";
import { X, Star, Package, Tag, Calendar, BadgeCheck, ShieldCheck, Truck, RefreshCcw } from "lucide-react";

const ViewProductModal = ({ selectedProduct }) => {
  const dispatch = useDispatch();
  
  // Image parsing logic (PostgreSQL/JSON compatibility)
  const productImages = typeof selectedProduct?.images === 'string' 
    ? JSON.parse(selectedProduct.images || '[]') 
    : selectedProduct?.images || [];

  const [activeImage, setActiveImage] = useState(productImages[0]?.url || "https://via.placeholder.com/600");

  const parsePromoOffer = (desc) => {
    if (!desc || !desc.startsWith("【Promo Offer: ")) return { offer: null, cleanDesc: desc };
    const endIdx = desc.indexOf("】");
    if (endIdx === -1) return { offer: null, cleanDesc: desc };
    const offer = desc.slice(14, endIdx);
    const cleanDesc = desc.slice(endIdx + 1).trim();
    return { offer, cleanDesc };
  };

  const { offer, cleanDesc } = parsePromoOffer(selectedProduct?.description || "");

  if (!selectedProduct) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-md flex justify-center items-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col md:flex-row relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button
          onClick={() => dispatch(toggleViewProductModal())}
          className="absolute top-6 right-6 z-10 p-2 bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-500 rounded-full transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        {/* --- LEFT SIDE: IMAGE GALLERY --- */}
        <div className="w-full md:w-[55%] bg-slate-50/50 p-6 md:p-10 flex flex-col gap-6">
          {/* Main Large Image */}
          <div className="relative group aspect-square rounded-[2rem] overflow-hidden bg-white border border-slate-100 shadow-inner">
            <img
              src={activeImage}
              alt="Main Product"
              className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-100 flex items-center gap-1.5 shadow-sm">
              <Star className="text-amber-400 fill-amber-400" size={14} />
              <span className="text-xs font-black text-slate-700">{selectedProduct.ratings || "4.5"}</span>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img.url)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                  activeImage === img.url ? "border-indigo-600 scale-95 shadow-lg" : "border-transparent hover:border-slate-200"
                }`}
              >
                <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* --- RIGHT SIDE: PRODUCT INFO --- */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white custom-scrollbar">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {selectedProduct.category}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                <BadgeCheck size={14} /> Verified Authentic
              </span>
              {offer && (
                <span className="flex items-center gap-1 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse shadow-sm">
                  🔥 Offer: {offer}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight italic">
              {selectedProduct.name || selectedProduct.title}
            </h1>
            <p className="text-slate-400 text-xs font-bold mt-2 font-mono uppercase tracking-tighter">
              Item Ref: #{String(selectedProduct.id || selectedProduct._id).slice(-12).toUpperCase()}
            </p>
          </div>

          {/* Pricing & Stock Card */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Valuation</p>
              <h2 className="text-4xl font-black text-slate-900 flex items-baseline gap-1">
                <span className="text-xl font-bold text-indigo-500 italic">₹</span>
                {Number(selectedProduct.price).toLocaleString('en-IN')}
              </h2>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Status</p>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-xs uppercase ${
                selectedProduct.stock > 0 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : "bg-rose-50 border-rose-100 text-rose-600"
              }`}>
                {selectedProduct.stock > 0 ? (
                  <><Package size={14} /> {selectedProduct.stock} Available</>
                ) : "Out of Stock"}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Tag size={16} className="text-indigo-500" /> Executive Summary
              </h4>
              <p className="text-slate-600 font-bold leading-relaxed text-sm">
                {cleanDesc || "No specific details provided for this asset."}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100">
                <Truck size={18} className="text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Shipping</p>
                  <p className="text-[11px] font-bold text-slate-700 truncate">Express Tracked</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100">
                <RefreshCcw size={18} className="text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Policy</p>
                  <p className="text-[11px] font-bold text-slate-700 truncate">30-Day Sync</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Footer Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Added: {new Date(selectedProduct.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <ShieldCheck size={14} /> Secure Inventory Asset
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductModal;