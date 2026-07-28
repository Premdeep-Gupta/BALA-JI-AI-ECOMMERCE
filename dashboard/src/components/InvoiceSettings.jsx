import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { 
  Settings, Building2, Landmark, MapPin, QrCode, Signature, 
  Upload, CheckCircle, RotateCcw, AlertCircle, Sparkles, Image, ArrowLeft
} from "lucide-react";
import { toast } from "react-hot-toast";
import { toggleComponent } from "../store/slices/extraSlice";

const DEFAULT_SETTINGS = {
  companyName: "BALAJI CART PRIVATE LIMITED",
  gstin: "27AABCF8078M1Z1",
  pan: "AAFCI1834E",
  registeredAddress: "Sai Dhara Warehousing Complex, I2 Warehouse,\nMumbai Nashik Highway NH3 Bhiwandi,\nBHIWANDI - 421302, IN-MH",
  sellerRegisteredAddress: "BALAJI CART PRIVATE LIMITED,\nPLOT NO. 88, INDUSTRIAL AREA, GWALIOR,\nMADHYA PRADESH - 474001. FSSAI License number: 10822999000483",
  dispatchAddress: "BALAJI CART DISPATCH DEPOT,\nSAI DHARA WAREHOUSING COMPLEX, I2 WAREHOUSE,\nMUMBAI NASHIK HIGHWAY NH3 BHIWANDI,\nMAHARASHTRA - 421302",
  upiId: "balajicart@upi",
  authorizedSignatory: "Premdeep Gupta",
  subjectJurisdiction: "Gurgaon Jurisdiction",
  logoBase64: ""
};

const InvoiceSettings = () => {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dragActive, setDragActive] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem("balaji_invoice_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (err) {
        console.error("Failed to parse invoice settings", err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings(prev => ({ ...prev, logoBase64: reader.result }));
      toast.success("Logo file processed successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const removeLogo = () => {
    setSettings(prev => ({ ...prev, logoBase64: "" }));
    toast.success("Custom logo removed. Default SVG badge will be used.");
  };

  const saveSettings = () => {
    localStorage.setItem("balaji_invoice_settings", JSON.stringify(settings));
    toast.success("Invoice settings successfully persisted!");
  };

  const resetToDefault = () => {
    if (window.confirm("Are you sure you want to restore default template settings? This will clear all customizations.")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem("balaji_invoice_settings", JSON.stringify(DEFAULT_SETTINGS));
      toast.success("Restored factory settings successfully.");
    }
  };

  return (
    <main className="min-h-screen bg-[#090d16] font-sans text-slate-200 pb-20 transition-all duration-500 w-full antialiased p-[10px] pl-[10px] md:pl-[17rem] box-border relative overflow-x-hidden">
      
      {/* BACKGROUND VECTOR ACCENTS */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="flex-1 md:p-6 space-y-8 relative z-10 w-full box-border">
        
        {/* 🌌 HERO HEADER */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden group w-full box-border">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
          
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-xl shadow-inner w-max">
              <Settings size={11} className="text-indigo-400 animate-pulse" /> Configuration Node
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Invoice Settings Console<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Dynamically customize corporate branding, seller registrations, logistical dispatch parameters, UPI payment handles, and authorized signatures.
            </p>
          </div>

          <button
            onClick={() => dispatch(toggleComponent("Invoices"))}
            className="px-4 py-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition duration-300 shadow-md cursor-pointer z-10 self-start xl:self-auto"
          >
            <ArrowLeft size={13} className="text-slate-400 group-hover:text-white" />
            <span>Back to Invoices</span>
          </button>
        </div>

        {/* 🛠️ CONFIGURATION GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full box-border">
          
          {/* LEFT: FORM FIELD CONTROLS (7 Columns) */}
          <div className="xl:col-span-8 bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-6">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Sparkles size={15} className="text-indigo-400"/> Brand & Billing Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Building2 size={12} className="text-indigo-400" /> Company / Seller Name
                </label>
                <input 
                  type="text" 
                  name="companyName"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200"
                  value={settings.companyName}
                  onChange={handleChange}
                />
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <QrCode size={12} className="text-indigo-400" /> UPI ID / VPA Handle
                </label>
                <input 
                  type="text" 
                  name="upiId"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200"
                  value={settings.upiId}
                  onChange={handleChange}
                />
              </div>

              {/* GSTIN */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Landmark size={12} className="text-indigo-400" /> GSTIN Number
                </label>
                <input 
                  type="text" 
                  name="gstin"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200"
                  value={settings.gstin}
                  onChange={handleChange}
                />
              </div>

              {/* PAN */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Landmark size={12} className="text-indigo-400" /> PAN Number
                </label>
                <input 
                  type="text" 
                  name="pan"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200"
                  value={settings.pan}
                  onChange={handleChange}
                />
              </div>

              {/* Authorized Signatory */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Signature size={12} className="text-indigo-400" /> Authorized Signatory Name
                </label>
                <input 
                  type="text" 
                  name="authorizedSignatory"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200"
                  value={settings.authorizedSignatory}
                  onChange={handleChange}
                />
              </div>

              {/* Jurisdiction */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-indigo-400" /> Subject to Jurisdiction City
                </label>
                <input 
                  type="text" 
                  name="subjectJurisdiction"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200"
                  value={settings.subjectJurisdiction}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Sold By Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <MapPin size={12} className="text-indigo-400" /> Sold By Address (Tax Invoice Page 1 Header)
              </label>
              <textarea 
                rows="3"
                name="registeredAddress"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 resize-none font-mono"
                value={settings.registeredAddress}
                onChange={handleChange}
              />
            </div>

            {/* Seller Registered Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <MapPin size={12} className="text-indigo-400" /> Seller Registered Address (Tax Invoice Page 1 Bottom)
              </label>
              <textarea 
                rows="3"
                name="sellerRegisteredAddress"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 resize-none font-mono"
                value={settings.sellerRegisteredAddress}
                onChange={handleChange}
              />
            </div>

            {/* Consignor Dispatch Depot Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <MapPin size={12} className="text-indigo-400" /> Dispatch Warehouse / Consignor Depot Address (Page 2)
              </label>
              <textarea 
                rows="3"
                name="dispatchAddress"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 resize-none font-mono"
                value={settings.dispatchAddress}
                onChange={handleChange}
              />
            </div>

            {/* CONTROL PANEL BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-850">
              <button
                onClick={resetToDefault}
                className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs flex items-center gap-2 transition"
              >
                <RotateCcw size={14} /> Restore Factory Settings
              </button>

              <button
                onClick={saveSettings}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition"
              >
                <CheckCircle size={14} /> Persist Configuration
              </button>
            </div>
          </div>

          {/* RIGHT: LOGO UPLOADER & SIGNATURE PREVIEW (4 Columns) */}
          <div className="xl:col-span-4 space-y-6 w-full">
            
            {/* Logo Uploader box */}
            <div className="bg-slate-900/30 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-4">
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Image size={14} className="text-indigo-400"/> Logo Configurator
              </h4>

              {settings.logoBase64 ? (
                <div className="space-y-4">
                  <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60 flex flex-col items-center justify-center">
                    <img 
                      src={settings.logoBase64} 
                      alt="Uploaded brand logo" 
                      className="max-h-24 max-w-full rounded object-contain border border-slate-800 p-2 bg-white"
                    />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Active brand asset</span>
                  </div>
                  <button
                    onClick={removeLogo}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-950 bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 font-bold text-xs transition"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragActive 
                      ? "border-indigo-500 bg-indigo-600/5" 
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("logo-file-input").click()}
                >
                  <input 
                    type="file" 
                    id="logo-file-input" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Upload size={24} className="text-slate-500 mb-2 group-hover:text-slate-400 animate-bounce" />
                  <p className="text-[11px] font-bold text-slate-300 text-center uppercase">Upload Logo Asset</p>
                  <p className="text-[9px] text-slate-500 text-center mt-1">Drag & Drop or Click to browse (PNG, JPG, SVG max 2MB)</p>
                </div>
              )}
            </div>

            {/* Signature Stamp Live Preview */}
            <div className="bg-slate-900/30 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-4">
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Signature size={14} className="text-indigo-400"/> Live Seal preview
              </h4>
              
              <div className="border border-slate-800 rounded-2xl p-6 bg-slate-950/60 flex flex-col items-center justify-center min-h-[160px]">
                <div className="flex flex-col items-center justify-center space-y-1 bg-white p-6 rounded-xl w-full border border-slate-300 select-none text-black text-center">
                  <p className="text-[8px] uppercase font-bold text-slate-400 leading-none mb-1">BALAJI CART PRIVATE LIMITED</p>
                  
                  {/* Stylized Signature Stamp */}
                  <div className="relative border border-dashed border-amber-400 p-1.5 bg-amber-50/10 rounded-md w-44 text-center my-1 select-none">
                    <span className="font-serif italic text-base text-amber-900 tracking-widest inline-block transform rotate-[-3deg] font-bold select-none pr-4">
                      {settings.authorizedSignatory || "Authorized Signatory"}
                    </span>
                    <span className="absolute bottom-0 right-1 text-[7px] text-amber-500 font-black uppercase transform rotate-[-8deg] pointer-events-none tracking-widest">
                      BALAJI CART SECURE SEAL
                    </span>
                  </div>
                  
                  <p className="text-[9px] font-bold text-black uppercase tracking-wider mt-1">Authorized Signature</p>
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2.5">Live print simulation</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
};

export default InvoiceSettings;
