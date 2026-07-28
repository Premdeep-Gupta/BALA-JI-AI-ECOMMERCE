import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createProduct } from "../store/slices/productsSlice"; 
import { toggleCreateProductModal } from "../store/slices/extraSlice";
import { LoaderCircle, X, UploadCloud, ChevronDown, Check } from "lucide-react";

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
    { name: "realme", query: "realme" },
    { name: "Snapdragon", query: "snapdragon" },
    { name: "Infinix", query: "infinix" },
    { name: "motorola", query: "motorola" },
    { name: "POCO", query: "poco" },
    { name: "Google", query: "google" },
    { name: "Tecno", query: "tecno" },
    { name: "Samsung", query: "samsung" },
    { name: "AI+", query: "ai" },
    { name: "Nothing", query: "nothing" },
    { name: "HMD", query: "hmd" },
    { name: "vivo", query: "vivo" },
    { name: "OPPO", query: "oppo" },
    { name: "Redmi", query: "redmi" }
  ],
  Home: [
    { name: "Dining", query: "dining" },
    { name: "Bath linen", query: "bath linen" },
    { name: "Utilities", query: "utilities" },
    { name: "Lighting", query: "lighting" },
    { name: "Mats & rugs", query: "rug" },
    { name: "Minutes", query: "minutes" },
    { name: "Drinkware", query: "drinkware" },
    { name: "Cookware", query: "cookware" },
    { name: "Cleaning", query: "cleaning" },
    { name: "Beds", query: "bed" },
    { name: "Bedsheets", query: "bedsheet" },
    { name: "Wallpaper", query: "wallpaper" },
    { name: "Hardware", query: "hardware" },
    { name: "Containers", query: "container" },
    { name: "Sofas", query: "sofa" },
    { name: "Decor", query: "decor" },
    { name: "Bathroom", query: "bathroom" },
    { name: "Mosquito nets", query: "mosquito net" },
    { name: "Mattresses", query: "mattress" },
    { name: "Gardening", query: "gardening" }
  ],
  Sports: [
    { name: "Badminton", query: "badminton" },
    { name: "Yoga", query: "yoga" },
    { name: "Kids' cycles", query: "kids cycle" },
    { name: "Indoor sports", query: "indoor" },
    { name: "Treadmills", query: "treadmill" },
    { name: "Exercise bike", query: "exercise bike" },
    { name: "Camping", query: "camping" },
    { name: "Ball sports", query: "ball" },
    { name: "Fitness", query: "fitness" },
    { name: "Kids' favorites", query: "kids favorite" },
    { name: "Cricket", query: "cricket" },
    { name: "Cycles", query: "cycle" },
    { name: "Supplements", query: "supplements" },
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
    { name: "Makeup", query: "makeup" },
    { name: "Fragrances", query: "fragrance" },
    { name: "Personal care", query: "care" },
    { name: "Hygiene", query: "hygiene" },
    { name: "Beauty Picks", query: "beauty" },
    { name: "Top 50 deals", query: "top-50" },
    { name: "Mens grooming", query: "grooming" },
    { name: "Premium", query: "premium" },
    { name: "Derma", query: "derma" },
    { name: "K-beauty", query: "k-beauty" },
    { name: "Oral Care", query: "oral" }
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
    { name: "Walkers & More ", query: "walkers" },
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

const CreateProductModal = () => {
  const dispatch = useDispatch();
  const { loading, success } = useSelector((state) => state.product);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Electronics",
    sub_category: "new",
    stock: "",
    images: [],
  });

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

  useEffect(() => {
    if (success) {
      dispatch(toggleCreateProductModal());
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "Electronics",
        sub_category: "new",
        stock: "",
        images: [],
      });
      setPreviewImages([]);
      setOriginalPrice("");
      setDiscountPercent("");
      setIsPromoActive(false);
      setPromoText("");
    }
  }, [success, dispatch]);

  const categoryOptions = [
    "Electronics", "Fashion", "Mobiles", "Home", "Sports", 
    "Books", "Beauty", "Automotive", "Kids & Baby", "Balaji Grocery"
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files]
    }));

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    const updatedPreviews = previewImages.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
    setPreviewImages(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.images || formData.images.length === 0) {
      alert("Please upload at least one image file");
      return;
    }

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
    
    formData.images.forEach((file) => {
      data.append("images", file);
    });

    dispatch(createProduct(data)); 
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden transform transition-all">
        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Add New Product</h2>
          <button
            type="button"
            onClick={() => dispatch(toggleCreateProductModal())}
            className="p-2 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Product Name</label>
              <input
                type="text"
                required
                placeholder="Product Title"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Category</label>
              <select
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const defaultSub = SUBCATEGORIES_MAP[cat]?.[0]?.query || "";
                  setFormData({ ...formData, category: cat, sub_category: defaultSub });
                }}
                required
              >
                {categoryOptions.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Sub Category</label>
              <select
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white font-semibold text-gray-700 cursor-pointer"
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                required
              >
                {[...(SUBCATEGORIES_MAP[formData.category] || [])]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((sub, idx) => (
                    <option key={idx} value={sub.query}>{sub.name}</option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Original Price (₹) <span className="text-gray-400 font-normal text-xs">(Optional for calculator)</span></label>
              <input
                type="number"
                min="0"
                placeholder="Total Price (e.g. 100)"
                value={originalPrice}
                onChange={(e) => handlePriceCalc(e.target.value, discountPercent)}
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Discount (%) <span className="text-gray-400 font-normal text-xs">(Optional for calculator)</span></label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Discount rate (e.g. 10)"
                value={discountPercent}
                onChange={(e) => handlePriceCalc(originalPrice, e.target.value)}
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Final calculated price"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  setOriginalPrice(""); // Clear calculator inputs if edited manually
                  setDiscountPercent("");
                }}
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Stock</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Quantity"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 mb-2 block">Upload Images</label>
              <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group relative">
                <input
                  type="file"
                  id="pro-file-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <UploadCloud className="text-indigo-400 group-hover:text-indigo-600 mb-2" size={40} />
                  <p className="text-sm text-gray-600 font-medium">Click or Drag to Upload Images</p>
                </div>
              </div>
              
              {previewImages.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto p-2">
                  {previewImages.map((src, i) => (
                    <div key={i} className="relative group flex-shrink-0">
                      <img 
                        src={src} 
                        alt="preview" 
                        className="w-20 h-20 object-cover rounded-xl shadow-md border-2 border-white"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROMO / SALE OFFER OPTION */}
            <div className="col-span-1 md:col-span-2 bg-indigo-50/40 border border-indigo-100/50 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Put Product on Sale / Promo Offer?</h4>
                  <p className="text-xs text-gray-500 font-medium">Add custom offers like "Buy 1 Get 1 Free" or custom cash discounts.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={isPromoActive}
                  onChange={(e) => {
                    setIsPromoActive(e.target.checked);
                    if (!e.target.checked) setPromoText("");
                  }}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {isPromoActive && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-indigo-700">Promo Offer Details *</label>
                  <input
                    type="text"
                    required={isPromoActive}
                    placeholder="e.g. Buy One Get One Free, Flat ₹500 Off"
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    className="border border-indigo-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-sm font-semibold"
                  />
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Description</label>
              <textarea
                placeholder="Product details..."
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => dispatch(toggleCreateProductModal())}
              className="flex-1 py-3.5 px-6 rounded-xl border-2 border-gray-100 font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl transition-all disabled:bg-indigo-300"
            >
              {loading ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  Uploading Assets...
                </>
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;