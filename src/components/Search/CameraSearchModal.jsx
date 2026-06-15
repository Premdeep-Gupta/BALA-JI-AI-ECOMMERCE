import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Camera, Image as ImageIcon, Loader2, Sparkles, CheckCircle, Crosshair } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CameraSearchModal = ({ isOpen, onClose }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Phase 2: Multi-Object State
  const [multiObjects, setMultiObjects] = useState([]);
  const [activeObjectIndex, setActiveObjectIndex] = useState(0); // Which tab is selected
  const [aiMetadata, setAiMetadata] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api/v1` : "http://localhost:4000/api/v1");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      handleSearch(file);
    }
  };

  const handleSearch = async (file) => {
    setIsScanning(true);
    setMultiObjects([]);
    setAiMetadata(null);
    setActiveObjectIndex(0);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(`${API_URL}/product/camera-search`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        // Handle Multi-Object Results
        setMultiObjects(res.data.multiObjects || []);
        setAiMetadata(res.data.aiAnalysis);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  // Phase 2: Self-Learning Rank Tracker
  const handleProductClick = async (productId) => {
    try {
      // Fire-and-forget analytics event
      axios.post(`${API_URL}/product/analytics/track-search-click`, { productId }).catch(() => {});
    } finally {
      onClose();
      navigate(`/product/${productId}`);
    }
  };

  const resetSearch = () => {
    setImage(null);
    setPreviewUrl(null);
    setMultiObjects([]);
    setAiMetadata(null);
    setActiveObjectIndex(0);
  };

  if (!isOpen) return null;

  // Render current object's products
  const activeProducts = multiObjects.length > 0 && multiObjects[activeObjectIndex] 
      ? multiObjects[activeObjectIndex].products 
      : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 text-indigo-600">
              <Camera className="w-6 h-6" />
              <h2 className="text-xl font-bold">Advanced Visual AI</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-6">
            {!previewUrl ? (
              // Upload Section
              <div 
                className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Upload className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload or Take a Photo</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  Find exact products or discover similar items. We'll automatically identify different objects in your photo!
                </p>
                <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Select Image
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Image Preview & Scanner */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <div className="relative rounded-2xl overflow-hidden shadow-md bg-black/5 aspect-[3/4] flex items-center justify-center group">
                    <img src={previewUrl} alt="Search Query" className="w-full h-full object-cover" />
                    
                    {/* Bounding Boxes for Detected Objects */}
                    {!isScanning && multiObjects.map((obj, idx) => {
                       if (!obj.box) return null;
                       // Convert absolute coordinates to percentages (rough estimation for UI demo)
                       // In production, you'd calculate this based on original image dimensions
                       return (
                         <div 
                           key={idx}
                           onClick={() => setActiveObjectIndex(idx)}
                           className={`absolute border-2 transition-all cursor-pointer ${activeObjectIndex === idx ? 'border-green-400 bg-green-400/20 z-10' : 'border-white/60 bg-white/10 hover:border-white'}`}
                           style={{ 
                             left: `${obj.box.left || 20}%`, 
                             top: `${obj.box.top || 20}%`, 
                             width: `${obj.box.width || 50}%`, 
                             height: `${obj.box.height || 50}%`
                           }}
                           title={`Select ${obj.label}`}
                         >
                           {activeObjectIndex === idx && (
                             <span className="absolute -top-6 left-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                               {obj.label}
                             </span>
                           )}
                         </div>
                       );
                    })}

                    {/* Scanning Animation */}
                    {isScanning && (
                      <>
                        <div className="absolute inset-0 bg-indigo-500/20" />
                        <motion.div 
                          className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Crosshair className="w-16 h-16 text-white/50 animate-pulse" />
                        </div>
                      </>
                    )}
                  </div>

                  <button onClick={resetSearch} className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                    Search Another Image
                  </button>
                </div>

                {/* Results Section */}
                <div className="w-full lg:w-2/3 flex flex-col">
                  {isScanning ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Segmenting Image...</h3>
                      <p className="text-gray-500 flex items-center gap-2 justify-center">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        Removing background and identifying multiple objects
                      </p>
                    </div>
                  ) : multiObjects.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      
                      {/* AI Analysis Badges */}
                      {aiMetadata && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-2">
                          <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Image Context</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiMetadata.category && (
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
                                {aiMetadata.category}
                              </span>
                            )}
                            {aiMetadata.brands?.map((brand, i) => (
                              <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-100">
                                {brand}
                              </span>
                            ))}
                            {aiMetadata.color && (
                              <span className="px-3 py-1 bg-pink-50 text-pink-700 text-sm font-medium rounded-full border border-pink-100">
                                {aiMetadata.color}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Object Tabs */}
                      {multiObjects.length > 1 && (
                        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                          {multiObjects.map((obj, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveObjectIndex(idx)}
                              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                                activeObjectIndex === idx 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span className="capitalize">{obj.label}</span>
                              <span className="ml-2 opacity-70 text-sm">({obj.products.length})</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-gray-800">
                        {multiObjects[activeObjectIndex]?.label} Matches 
                        <span className="text-xs font-normal text-indigo-500 ml-2 bg-indigo-50 px-2 py-0.5 rounded-full">Personalized</span>
                      </h3>
                      
                      {/* Product Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {activeProducts.map((product, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            key={product.id} 
                            onClick={() => handleProductClick(product.id)}
                            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md cursor-pointer group flex flex-col"
                          >
                            <div className="relative aspect-square overflow-hidden bg-gray-100">
                              <img 
                                src={product.image_url || "https://via.placeholder.com/300"} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {product.matchPercentage && (
                                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                  {product.matchPercentage}% Match
                                </div>
                              )}
                              {product.past_clicks > 0 && (
                                <div className="absolute bottom-2 left-2 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                                  Trending
                                </div>
                              )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                              <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight flex-1">{product.name}</h4>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-indigo-600 font-bold">₹{product.price}</span>
                                {product.discount_percentage > 0 && (
                                  <span className="text-xs text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded">
                                    -{product.discount_percentage}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {activeProducts.length === 0 && (
                        <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                           <p>No visually similar {multiObjects[activeObjectIndex]?.label} found.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500">
                        <Camera className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg">Upload an image to start searching.</p>
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CameraSearchModal;
