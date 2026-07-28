import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleUpdateProductModal } from "../store/slices/extraSlice";
import { LoaderCircle, X, Layers, Package, IndianRupee, AlignLeft, Sparkles, UploadCloud, CheckCircle2, ChevronDown, Check } from "lucide-react";
import { updateProduct } from "../store/slices/productsSlice";

const SUBCATEGORIES_MAP = {
  Electronics: [
    { name: "New launches", query: "new" },
    { name: "Earphones", query: "earphone" },
    { name: "Two Wheelers", query: "two wheelers" },
    { name: "Grooming", query: "grooming" },
    { name: "Mobile cases", query: "case" },
    { name: "Storage", query: "storage" },
    { name: "Chargers & cable", query: "charger" },
    { name: "Gaming", query: "gaming" },
    { name: "Health Care", query: "health" },
    { name: "Gaming Hub", query: "gaming" },
    { name: "Laptops", query: "laptop" },
    { name: "Tablets", query: "tablet" },
    { name: "Wearables", query: "watch" },
    { name: "Accessories", query: "keyboard" },
    { name: "Printers", query: "printer" },
    { name: "Camera", query: "camera" },
    { name: "Power Banks", query: "power bank" },
    { name: "Smart devices", query: "smart" },
    { name: "Speakers", query: "speaker" },
    { name: "Networking", query: "router" }
  ],
  Fashion: [
    { name: "Shirts,Tees", query: "shirt" },
    { name: "Jeans", query: "jeans" },
    { name: "Sports Shoes", query: "shoes" },
    { name: "Watches", query: "watch" },
    { name: "Kids' clothing", query: "kids" },
    { name: "Luggage", query: "luggage" },
    { name: "Trackpants", query: "trackpants" },
    { name: "Casual Wear", query: "casual" },
    { name: "Kurta, pajama", query: "kurta" },
    { name: "Briefs, Vest", query: "briefs" },
    { name: "Kurta sets", query: "kurta set" },
    { name: "Dresses", query: "dress" },
    { name: "Casual shoes", query: "casual shoes" },
    { name: "Trolley bags", query: "trolley bags" },
    { name: "Jewellery", query: "jewellery" },
    { name: "Sarees", query: "saree" },
    { name: "Kurtis", query: "kurti" },
    { name: "Nightsuits", query: "nightsuits" },
    { name: "Sneakers", query: "sneaker" },
    { name: "Slippers", query: "slippers" },
    { name: "Shorts, Boxer", query: "shorts" },
    { name: "Formal Wear", query: "formal" },
    { name: "Raincoat", query: "raincoat" },
    { name: "Drips for him", query: "spoyl" },
    { name: "College Ready", query: "college" },
    { name: "Focus brands", query: "brand" },
    { name: "Dress Material", query: "material" },
    { name: "Tops", query: "top" },
    { name: "Heels & Flats", query: "heels" },
    { name: "Lehenga choli", query: "lehenga" },
    { name: "Clogs", query: "clogs" },
    { name: "Drips for her", query: "spoyl" },
    { name: "Celeb Looks", query: "celeb" },
    { name: "Next Gen Fashion", query: "fashion" }
  ],
  Mobiles: [
    { name: "iPhone", query: "iphone" },
    { name: "Samsung", query: "samsung" },
    { name: "realme", query: "realme" },
    { name: "motorola", query: "motorola" },
    { name: "vivo", query: "vivo" },
    { name: "POCO", query: "poco" },
    { name: "OPPO", query: "oppo" },
    { name: "Google", query: "google" },
    { name: "Redmi", query: "redmi" }
  ],
  Home: [
    { name: "Dining", query: "dining" },
    { name: "Bedsheets", query: "bedsheet" },
    { name: "Wallpaper", query: "wallpaper" },
    { name: "Decor", query: "decor" },
    { name: "Cookware", query: "cookware" },
    { name: "Beds", query: "bed" },
    { name: "Mattresses", query: "mattress" },
    { name: "Sofas", query: "sofa" }
  ],
  Sports: [
    { name: "Badminton", query: "badminton" },
    { name: "Ball sports", query: "ball" },
    { name: "Yoga", query: "yoga" },
    { name: "Fitness", query: "fitness" },
    { name: "Cricket", query: "cricket" },
    { name: "Cycles", query: "cycle" },
    { name: "Home gym combo", query: "gym" }
  ],
  Books: [
    { name: "Fiction", query: "fiction" },
    { name: "Non-Fiction", query: "non-fiction" },
    { name: "Educational", query: "educational" },
    { name: "Literature", query: "literature" }
  ],
  Beauty: [
    { name: "Skin Care", query: "skin" },
    { name: "Hair Care", query: "hair" },
    { name: "Mens grooming", query: "grooming" },
    { name: "Makeup", query: "makeup" },
    { name: "Fragrances", query: "fragrance" }
  ],
  Automotive: [
    { name: "Dashcams", query: "dashcam" },
    { name: "Helmets", query: "helmet" },
    { name: "Covers", query: "cover" },
    { name: "Car washer", query: "washer" },
    { name: "Tyres", query: "tyre" },
    { name: "Media player", query: "media player" },
    { name: "Car mats", query: "mats" },
    { name: "Engine oils", query: "engine oil" },
    { name: "Cleaners", query: "cleaner" },
    { name: "Lights", query: "light" },
    { name: "Tyre inflator", query: "inflator" },
    { name: "Batteries", query: "battery" },
    { name: "Styling", query: "styling" },
    { name: "Riding gear", query: "riding gear" },
    { name: "Subwoofers", query: "subwoofer" },
    { name: "Air fresheners", query: "freshener" }
  ],
  "Kids & Baby": [
    { name: "Diapers", query: "diaper" },
    { name: "Toys & games", query: "toy" },
    { name: "Skin & hair care", query: "care" },
    { name: "Top brands", query: "brand" },
    { name: "Wipes", query: "wipes" },
    { name: "Stationery", query: "stationery" },
    { name: "Walkers & More", query: "walkers" },
    { name: "Summer play", query: "play" },
    { name: "Infant Nutrition", query: "nutrition" },
    { name: "School supplies", query: "school" },
    { name: "Bath tub", query: "bath" },
    { name: "Pet toys", query: "pet toy" },
    { name: "Art kits", query: "art" }
  ],
  "Balaji Grocery": [
    { name: "Fruits & Vegetables", query: "fruits" },
    { name: "Atta, Rice & Dal", query: "atta" },
    { name: "Oil, Ghee & Masala", query: "masala" },
    { name: "Dairy, Bread & Eggs", query: "dairy" },
    { name: "Cereals & Dry Fruits", query: "seeds" },
    { name: "Chicken, Meat & Fish", query: "chicken" },
    { name: "Instant & Frozen Food", query: "instant" },
    { name: "Chips & Namkeens", query: "snacks" },
    { name: "Ice Creams", query: "ice cream" },
    { name: "Drinks & Juices", query: "juice" },
    { name: "Sweets & Chocolates", query: "chocolate" },
    { name: "Tea, Coffee & Milk Drinks", query: "tea" },
    { name: "Bakery & Biscuits", query: "biscuits" },
    { name: "Sauces & Spreads", query: "sauces" }
  ]
};

const UpdateProductModal = ({ product }) => {
  const { loading } = useSelector((state) => state.product);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    sub_category: "",
    stock: "",
  });

  // 🔥 STATE SPLITTING: Keep track of raw selected files and mixed previews separately
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  useEffect(() => {
    if (!subDropdownOpen) return;
    const handleClose = () => setSubDropdownOpen(false);
    const timer = setTimeout(() => {
      window.addEventListener("click", handleClose);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleClose);
    };
  }, [subDropdownOpen]);

  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [promoText, setPromoText] = useState("");

  const handlePriceCalc = (orig, disc) => {
    setOriginalPrice(orig);
    setDiscountPercent(disc);
    const p = parseFloat(orig);
    const d = parseFloat(disc);
    if (!isNaN(p)) {
      const calculated = isNaN(d) ? p : parseFloat((p - (p * d) / 100).toFixed(2));
      setFormData((prev) => ({ ...prev, price: calculated > 0 ? calculated : "" }));
    } else {
      setFormData((prev) => ({ ...prev, price: "" }));
    }
  };

  const categoryOptions = [
    "Electronics", "Fashion", "Mobiles", "Home", "Sports", 
    "Books", "Beauty", "Automotive", "Kids & Baby", "Balaji Grocery"
  ];

  // Sync state with product data when modal opens
  useEffect(() => {
    if (product) {
      const parsePromoOffer = (desc) => {
        if (!desc || !desc.startsWith("【Promo Offer: ")) return { offer: null, cleanDesc: desc };
        const endIdx = desc.indexOf("】");
        if (endIdx === -1) return { offer: null, cleanDesc: desc };
        const offer = desc.slice(14, endIdx);
        const cleanDesc = desc.slice(endIdx + 1).trim();
        return { offer, cleanDesc };
      };

      const parsed = parsePromoOffer(product.description || "");

      setFormData({
        name: product.name || "",
        description: parsed.cleanDesc || "",
        price: product.price || "",
        category: product.category || "",
        sub_category: product.sub_category || "",
        stock: product.stock || "",
      });
      setOriginalPrice(product.original_price ? String(product.original_price) : "");
      setDiscountPercent(product.discount_percentage ? String(product.discount_percentage) : "");
      setPromoText(parsed.offer || "");
      setIsPromoActive(!!parsed.offer);

      // Safely parse old images array strings from database
      const existingImages = typeof product?.images === "string" 
        ? JSON.parse(product.images || "[]") 
        : product?.images || [];
      
      setPreviewImages(existingImages.map(img => img.url || img));
      setSelectedFiles([]); // Reset fresh files array on reopen
    }
  }, [product]);

  // Image Selection Logic
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Append raw files for multi-part transmission
    setSelectedFiles((prev) => [...prev, ...files]);

    // Generate accurate distinct local memory addresses object blobs previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (indexToId) => {
    // 1. Flush targeted asset straight from rendering preview viewport array
    const updatedPreviews = previewImages.filter((_, i) => i !== indexToId);
    setPreviewImages(updatedPreviews);
    
    // 2. Calculate offset index position inside selected file queue safely
    // Since existing cloud images don't occupy slots inside raw file array chunks
    const baseOffset = previewImages.length - selectedFiles.length;
    if (indexToId >= baseOffset) {
      const fileTargetIdx = indexToId - baseOffset;
      setSelectedFiles((prev) => prev.filter((_, i) => i !== fileTargetIdx));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productId = product?._id || product?.id;
    
    if (!productId) return;

    const finalDesc = isPromoActive && promoText.trim()
      ? `【Promo Offer: ${promoText.trim()}】\n\n${formData.description.trim()}`
      : formData.description.trim();

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("description", finalDesc);
    data.append("price", String(formData.price));
    data.append("category", formData.category);
    data.append("sub_category", formData.sub_category);
    data.append("stock", String(formData.stock));
    data.append("original_price", String(originalPrice || formData.price));
    
    // 🔥 STREAM PAYLOAD: Append fresh file matrices or send existing track tags back safely
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        data.append("images", file);
      });
    } else {
      // Safe fallback option: if no new assets chose, retain earlier references array directly
      const remainingCloudUrls = previewImages.filter(src => !src.startsWith("blob:"));
      const structuredFormat = remainingCloudUrls.map(url => ({ url }));
      data.append("images", JSON.stringify(structuredFormat));
    }

    dispatch(updateProduct(productId, data));
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
        
        {/* Left Panel: Live Preview Section */}
        <div className="w-full md:w-[32%] bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] -mr-32 -mt-32"></div>
          
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-6">
              <Sparkles size={18} />
              <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Product Preview</span>
            </div>
            
            <div className="relative group rounded-3xl overflow-hidden aspect-square border border-white/10 shadow-2xl bg-slate-800">
              <img 
                src={previewImages[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop"} 
                className="w-full h-full object-cover transition-all duration-500" 
                alt="preview" 
              />
            </div>

            <div className="mt-6 space-y-2">
               <h3 className="font-black text-xl leading-tight truncate">{formData.name || "Untitled"}</h3>
               <p className="text-indigo-400 font-black text-2xl">₹{Number(formData.price || 0).toLocaleString('en-IN')}</p>
               <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-300">
                  {formData.category || "General"}
               </span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {previewImages.slice(0, 4).map((img, i) => (
                <img key={i} src={img} className="w-10 h-10 rounded-lg object-cover border border-white/20 flex-shrink-0" alt="thumb" />
            ))}
          </div>
        </div>

        {/* Right Panel: Scrollable Form */}
        <div className="flex-1 p-8 md:p-12 relative bg-white overflow-y-auto max-h-[90vh] custom-scrollbar">
          <button
            type="button"
            onClick={() => dispatch(toggleUpdateProductModal())}
            className="absolute top-8 right-8 p-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-2xl transition-all active:scale-90"
          >
            <X size={20} />
          </button>

          <header className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Edit Core<span className="text-indigo-600">.</span></h2>
            <p className="text-slate-400 font-bold mt-2">Update information and manage product media.</p>
          </header>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            
            <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Layers size={16}/> Product Title</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><AlignLeft size={16} /> Category</label>
              <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all cursor-pointer" value={formData.category} onChange={(e) => {
                const cat = e.target.value;
                const defaultSub = SUBCATEGORIES_MAP[cat]?.[0]?.query || "";
                setFormData({ ...formData, category: cat, sub_category: defaultSub });
              }} required >
                {categoryOptions.map((cat, idx) => ( <option key={idx} value={cat}>{cat}</option> ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><AlignLeft size={16} /> Sub Category</label>
              <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all cursor-pointer" value={formData.sub_category} onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })} required >
                {[...(SUBCATEGORIES_MAP[formData.category] || [])]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((sub, idx) => ( <option key={idx} value={sub.query}>{sub.name}</option> ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Package size={16}/> Stock</label>
                <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all" required />
            </div>

             <div className="flex flex-col gap-2">
                 <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><IndianRupee size={16}/> Original Price <span className="text-slate-400 font-bold text-[9px] lowercase">(Optional)</span></label>
                 <input type="number" min="0" value={originalPrice} onChange={(e) => handlePriceCalc(e.target.value, discountPercent)} placeholder="Total Price" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all" />
             </div>

             <div className="flex flex-col gap-2">
                 <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><IndianRupee size={16}/> Discount (%) <span className="text-slate-400 font-bold text-[9px] lowercase">(Optional)</span></label>
                 <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => handlePriceCalc(originalPrice, e.target.value)} placeholder="Discount (e.g. 10)" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all" />
             </div>

             <div className="flex flex-col gap-2 md:col-span-2">
                 <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><IndianRupee size={16}/> Selling Price *</label>
                 <input type="number" min="1" step="any" value={formData.price} onChange={(e) => {
                   setFormData({ ...formData, price: e.target.value });
                   setOriginalPrice(""); // Clear calculator inputs if edited manually
                   setDiscountPercent("");
                 }} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all font-semibold" required />
             </div>

            {/* ✅ IMAGE UPLOAD SECTION */}
            <div className="md:col-span-2">
              <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest mb-2 block">Media Assets</label>
              <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group relative cursor-pointer text-center">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadCloud className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" size={40} />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tap to Replace/Add New Images</p>
              </div>

              {/* Individual Image Previews with Remove button */}
              {previewImages.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                  {previewImages.map((src, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={src} className="w-16 h-16 object-cover rounded-xl border-2 border-slate-100" alt="p" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROMO / SALE OFFER OPTION */}
            <div className="md:col-span-2 bg-indigo-50/20 border-2 border-indigo-50/40 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Put Product on Sale / Promo Offer?</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Define promo campaigns like "Buy One Get One Free"</p>
                </div>
                <input 
                  type="checkbox"
                  checked={isPromoActive}
                  onChange={(e) => {
                    setIsPromoActive(e.target.checked);
                    if (!e.target.checked) setPromoText("");
                  }}
                  className="w-5 h-5 accent-indigo-650 rounded cursor-pointer"
                />
              </div>

              {isPromoActive && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Promo Offer Details *</label>
                  <input
                    type="text"
                    required={isPromoActive}
                    placeholder="e.g. Buy One Get One Free, Flat ₹500 Off"
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    className="w-full p-4 bg-white border-2 border-indigo-150 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-slate-900 font-black text-[11px] uppercase tracking-widest italic">Story / Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all resize-none min-h-[140px]" required />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-400 text-white p-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] md:col-span-2 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <LoaderCircle className="w-5 h-5 animate-spin" />
              ) : (
                <>Commit All Changes <CheckCircle2 size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProductModal;