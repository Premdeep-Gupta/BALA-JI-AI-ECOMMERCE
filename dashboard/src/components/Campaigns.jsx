import React, { useEffect, useState } from "react";
import Header from "./Header";
import { 
  Sparkles, Calendar, Tag, Percent, Image as ImageIcon,
  CheckCircle, XCircle, Trash2, Edit3, Loader, MousePointerClick, 
  TrendingUp, RefreshCw, X, UploadCloud, Mail, Bell, Share2, Info,
  ToggleLeft, ToggleRight, Check, Plus, CreditCard, ShoppingBag, Eye, MousePointer
} from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-toastify";

const ANIMATION_OPTIONS = [
  "fade", "zoom", "kenBurns", "flip3D", "neonPulse", "glitch", "slideLeft", "slideRight", "slideUp", "slideDown",
  "elasticBounce", "cyberpunkGlitch", "cinematicPan", "rotateIn", "rotateOut", "blurFadeIn", "skewFloat", "wobble",
  "heartbeat", "jello", "rubberBand", "swing", "tada", "lightSpeedIn", "rollIn", "bounceIn", "bounceInDown", 
  "bounceInLeft", "bounceInRight", "bounceInUp", "fadeInDown", "fadeInLeft", "fadeInRight", "fadeInUp", 
  "flipInX", "flipInY", "zoomInDown", "zoomInLeft", "zoomInRight", "zoomInUp", "slideInDown", "slideInLeft", 
  "slideInRight", "slideInUp", "spin3D", "wave", "pulseGlow", "shimmer", "flash", "shake"
];

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  
  // Settings State
  const [aiAutomation, setAiAutomation] = useState(true);
  
  // Form State for manual scheduling
  const [manualForm, setManualForm] = useState({
    event_name: "",
    title: "",
    banner_text: "",
    tagline: "",
    discount_label: "",
    cta_button_text: "Explore Now",
    discount_percentage: 15,
    bg_color: "#7a0c02",
    text_color: "#ffffff",
    accent_color: "#ffd700",
    start_date: "",
    end_date: "",
    category: "All Categories",
    design_theme: "luxury",
    seo_title: "",
    seo_description: "",
    push_notification_text: "",
    email_text: "",
    social_media_caption: "",
    banner_image: "",
    media_assets: []
  });

  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);

  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    
    setMediaUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("media", files[i]);
    }

    try {
      const { data } = await axiosInstance.post("/campaigns/admin/upload-media", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (data.success) {
        const newAssets = data.assets.map(asset => ({ ...asset, animation: "kenBurns" }));
        setManualForm(prev => ({
          ...prev,
          media_assets: [...prev.media_assets, ...newAssets]
        }));
        toast.success("Media uploaded successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload media.");
    } finally {
      setMediaUploading(false);
    }
  };
  
  const updateMediaAnimation = (index, animation) => {
    const updated = [...manualForm.media_assets];
    updated[index].animation = animation;
    setManualForm({ ...manualForm, media_assets: updated });
  };
  
  const removeMedia = (index) => {
    const updated = manualForm.media_assets.filter((_, i) => i !== index);
    setManualForm({ ...manualForm, media_assets: updated });
  };

  // Fetch all campaigns
  const fetchCampaigns = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await axiosInstance.get("/campaigns/admin/all");
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load campaigns.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Run AI Event Detection
  const handleAIDetection = async () => {
    setDetecting(true);
    try {
      const { data } = await axiosInstance.post("/campaigns/admin/detect");
      if (data.success) {
        toast.success(data.message);
        fetchCampaigns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "AI Event detection failed.");
    } finally {
      setDetecting(false);
    }
  };

  // Toggle Campaign Approval / Activation
  const handleToggleStatus = async (id, currentApproved) => {
    try {
      const { data } = await axiosInstance.put(`/campaigns/admin/update/${id}`, {
        is_approved: !currentApproved
      });
      if (data.success) {
        toast.success(`Campaign ${!currentApproved ? 'approved and activated' : 'deactivated'} successfully!`);
        fetchCampaigns(false);
      }
    } catch (err) {
      toast.error("Failed to update campaign state.");
    }
  };

  // Delete Campaign
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const { data } = await axiosInstance.delete(`/campaigns/admin/delete/${id}`);
      if (data.success) {
        toast.success("Campaign deleted.");
        fetchCampaigns(false);
      }
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  // Handle AI Image Generation
  const handleGenerateImage = async (e) => {
    e.preventDefault();
    if (!imagePrompt) {
      return toast.error("Please enter a prompt for the AI image generator.");
    }
    setImageGenerating(true);
    try {
      const { data } = await axiosInstance.post("/campaigns/admin/generate-image", {
        prompt: imagePrompt
      });
      if (data.success) {
        toast.success(data.message || "AI image added to media slider!");
        // Auto-add to media slider instead of static banner_image
        const newAsset = { url: data.image_url, type: 'image', animation: 'kenBurns' };
        setManualForm(prev => ({ 
          ...prev, 
          banner_image: "", 
          media_assets: [...prev.media_assets, newAsset] 
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate AI banner.");
    } finally {
      setImageGenerating(false);
    }
  };

  // Populate form for editing
  const handleEditClick = (campaign) => {
    setEditingCampaignId(campaign.id);
    setIsCreating(false);
    setManualForm({
      event_name: campaign.event_name || "",
      title: campaign.title || "",
      banner_text: campaign.banner_text || "",
      tagline: campaign.tagline || "",
      discount_label: campaign.discount_label || "",
      cta_button_text: campaign.cta_button_text || "Explore Now",
      discount_percentage: campaign.discount_percentage || 15,
      bg_color: campaign.theme_colors?.bg || "#7a0c02",
      text_color: campaign.theme_colors?.text || "#ffffff",
      accent_color: campaign.theme_colors?.accent || "#ffd700",
      start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().slice(0, 16) : "",
      end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().slice(0, 16) : "",
      category: campaign.category || "All Categories",
      design_theme: campaign.design_theme || "luxury",
      seo_title: campaign.seo_title || "",
      seo_description: campaign.seo_description || "",
      push_notification_text: campaign.push_notification_text || "",
      email_text: campaign.email_text || "",
      social_media_caption: campaign.social_media_caption || "",
      banner_image: campaign.banner_image || "",
      media_assets: campaign.media_assets || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Manual creation or Update
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...manualForm,
        theme_colors: {
          bg: manualForm.bg_color,
          text: manualForm.text_color,
          accent: manualForm.accent_color
        }
      };

      let responseData;
      if (editingCampaignId) {
        const { data } = await axiosInstance.put(`/campaigns/admin/update-details/${editingCampaignId}`, payload);
        responseData = data;
      } else {
        const { data } = await axiosInstance.post("/campaigns/admin/create", payload);
        responseData = data;
      }

      if (responseData.success) {
        toast.success(responseData.message);
        fetchCampaigns();
        setEditingCampaignId(null);
        setIsCreating(false);
        // Reset manual form
        setManualForm({
          event_name: "",
          title: "",
          banner_text: "",
          tagline: "",
          discount_label: "",
          cta_button_text: "Explore Now",
          discount_percentage: 15,
          bg_color: "#7a0c02",
          text_color: "#ffffff",
          accent_color: "#ffd700",
          start_date: "",
          end_date: "",
          category: "All Categories",
          design_theme: "luxury",
          seo_title: "",
          seo_description: "",
          push_notification_text: "",
          email_text: "",
          social_media_caption: "",
          banner_image: "",
          media_assets: []
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create campaign.");
    }
  };

  // Calculate overall campaign analytics
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "0.0";

  return (
    <main className="p-4 md:p-6 md:pl-[18rem] w-full bg-slate-50 min-h-screen">
      <Header />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-indigo-650" /> AI Festival & Campaign Manager
          </h1>
          <p className="text-sm text-gray-500">
            Automatically detect occasions, generate themed hero banners, assign products, and schedule sales.
          </p>
        </div>

        {/* Global Settings & AI Trigger */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase">AI Automation Mode</span>
            <button 
              onClick={() => setAiAutomation(!aiAutomation)}
              className="text-indigo-650 hover:opacity-80 transition"
            >
              {aiAutomation ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <button
            onClick={handleAIDetection}
            disabled={detecting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            {detecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {detecting ? "AI Detecting..." : "AI Auto-Detect Sales"}
          </button>
        </div>
      </div>

      {/* Campaign Performance Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <MousePointer size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Banner Clicks</span>
            <span className="text-2xl font-black text-slate-800">{totalClicks}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Sales Conversions</span>
            <span className="text-2xl font-black text-slate-800">{totalConversions}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Average CTR / Conversion</span>
            <span className="text-2xl font-black text-slate-800">{conversionRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full">
        
        {/* Campaigns Grid (Only show if not editing and not creating) */}
        {!editingCampaignId && !isCreating && (
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} /> Generated & Scheduled Campaigns ({campaigns.length})
            </h2>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition"
            >
              <Plus size={16} /> Schedule Campaign Manually
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white text-center py-20 px-6 rounded-2xl border flex flex-col items-center justify-center">
              <Sparkles className="w-12 h-12 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Scheduled Campaigns</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-1">
                Click "AI Auto-Detect Sales" or use the manual scheduler to set up themed festival offers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((c) => {
                const colors = typeof c.theme_colors === "string" ? JSON.parse(c.theme_colors) : c.theme_colors;
                const isExpanded = expandedCampaignId === c.id;

                return (
                  <div key={c.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:border-indigo-200 transition">
                    
                    {/* Header Row */}
                    <div className="p-5 flex items-start justify-between flex-wrap gap-4 border-b">
                      <div className="flex gap-4">
                        {/* Theme preview box */}
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center border text-xs font-black shadow-inner"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {c.discount_percentage}%
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                              {c.event_name}
                            </span>
                            {c.is_ai_generated && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1">
                                <Sparkles size={8} /> AI Draft
                              </span>
                            )}
                            {(() => {
                              if (!c.is_approved) {
                                return (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200/50">
                                    Draft
                                  </span>
                                );
                              }
                              const now = Date.now();
                              const start = new Date(c.start_date).getTime();
                              const end = new Date(c.end_date).getTime();
                              if (now < start) {
                                return (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200/50">
                                    Scheduled
                                  </span>
                                );
                              }
                              if (now > end) {
                                return (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-750 px-2 py-0.5 rounded border border-rose-200/50">
                                    Expired / Ended
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200/50 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Live & Active
                                </span>
                              );
                            })()}
                          </div>
                          <h3 className="font-bold text-slate-800 mt-1">{c.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(c.start_date).toLocaleDateString()} to {new Date(c.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Approval Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(c.id, c.is_approved)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            c.is_approved 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          }`}
                        >
                          {c.is_approved ? <Check size={12} /> : <X size={12} />}
                          {c.is_approved ? "Approved" : "Approve Draft"}
                        </button>
                        
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setExpandedCampaignId(isExpanded ? null : c.id)}
                          className="p-1.5 hover:bg-gray-150 rounded-lg text-gray-500 text-xs font-bold uppercase"
                        >
                          {isExpanded ? "Collapse" : "Details"}
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                          title="Delete Campaign"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded details (SEO text, Notifications copies, Email body, Social Media captions) */}
                    {isExpanded && (
                      <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-6">
                        
                        {/* Title, Banner, Tagline */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Banner Tagline</span>
                            <span className="text-sm font-bold text-slate-700 mt-1 block">"{c.tagline}"</span>
                          </div>
                          <div className="bg-white p-4 rounded-xl border">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Banner Text Description</span>
                            <span className="text-sm font-bold text-slate-700 mt-1 block">"{c.banner_text}"</span>
                          </div>
                        </div>

                        {/* Push Notification Copy */}
                        <div className="bg-white p-5 rounded-xl border flex items-start gap-4">
                          <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl mt-1 shrink-0">
                            <Bell size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">AI Generated Push Notification</span>
                            <p className="text-sm font-bold text-slate-800 mt-1">"{c.push_notification_text || 'Diwali Sale is Live now!'}"</p>
                          </div>
                        </div>

                        {/* Email Campaign Copy */}
                        <div className="bg-white p-5 rounded-xl border flex items-start gap-4">
                          <div className="p-2 bg-purple-50 text-purple-650 rounded-xl mt-1 shrink-0">
                            <Mail size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">AI Generated Promotional Email</span>
                            <p className="text-xs font-semibold text-slate-650 mt-1 whitespace-pre-line">"{c.email_text || 'Celebrating ethnic deals!'}"</p>
                          </div>
                        </div>

                        {/* Social Caption & SEO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-5 rounded-xl border">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block flex items-center gap-1">
                              <Share2 size={12} /> Social Caption
                            </span>
                            <p className="text-xs font-bold text-slate-700 mt-1.5 whitespace-pre-line">"{c.social_media_caption}"</p>
                          </div>
                          
                          <div className="bg-white p-5 rounded-xl border space-y-2">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block flex items-center gap-1">
                              <Info size={12} /> SEO Meta tags
                            </span>
                            <p className="text-xs font-black text-slate-800">Title: <span className="font-bold text-slate-600">{c.seo_title || 'Mega Fest Sale'}</span></p>
                            <p className="text-xs font-black text-slate-800">Desc: <span className="font-bold text-slate-600">{c.seo_description || 'Exclusive discounts'}</span></p>
                          </div>
                        </div>

                        {/* Assigned Products list */}
                        <div className="bg-white p-5 rounded-xl border space-y-3">
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Assigned Products ({c.product_ids?.length || 0})</span>
                          {c.product_ids && c.product_ids.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {c.product_ids.map((pid) => (
                                <span key={pid} className="bg-slate-100 border text-slate-600 px-2.5 py-1 rounded-lg text-xs font-mono">
                                  {pid.slice(-8).toUpperCase()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No products assigned by AI.</p>
                          )}
                        </div>

                        {/* Performance Details */}
                        <div className="flex gap-6 border-t pt-4 text-xs font-black text-slate-500 uppercase tracking-wide">
                          <p>Clicks: <span className="text-indigo-600 font-black">{c.clicks || 0}</span></p>
                          <p>Conversions: <span className="text-emerald-600 font-black">{c.conversions || 0}</span></p>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Full-Width Form View (Show if Editing OR Creating) */}
        {(editingCampaignId || isCreating) && (
        <div className="bg-white border rounded-2xl p-8 shadow-sm max-w-5xl mx-auto w-full mb-10 relative">
          
          <button 
            onClick={() => { setEditingCampaignId(null); setIsCreating(false); }}
            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition"
            title="Close Form"
          >
            <X size={18} />
          </button>

          <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3 border-b pb-4">
            {editingCampaignId ? <Sparkles className="text-indigo-650" size={28} /> : <Plus className="text-emerald-600" size={28} />}
            {editingCampaignId ? "Edit Campaign Details" : "Create New Campaign Manually"}
          </h2>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Occasion / Event Name *</label>
              <input 
                type="text" 
                required
                className="w-full border rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                placeholder="E.g., Durga Puja Sale, Holi Festival"
                value={manualForm.event_name}
                onChange={(e) => setManualForm({ ...manualForm, event_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Banner Title *</label>
              <input 
                type="text" 
                required
                className="w-full border rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                placeholder="E.g., Durga Puja Mega Offers"
                value={manualForm.title}
                onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Category *</label>
                <select 
                  required
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none bg-slate-50 font-bold text-slate-700"
                  value={manualForm.category}
                  onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Mobiles">Mobiles</option>
                  <option value="Home">Home</option>
                  <option value="Sports">Sports</option>
                  <option value="Books">Books</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Kids & Baby">Kids & Baby</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section Design Theme *</label>
                <select 
                  required
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none bg-indigo-50 font-bold text-indigo-700"
                  value={manualForm.design_theme}
                  onChange={(e) => setManualForm({ ...manualForm, design_theme: e.target.value })}
                >
                  <option value="luxury">Luxury Glassmorphism</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="minimalist">Minimalist Elegance</option>
                  <option value="gold">Gold Prestige</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banner Tagline *</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                  placeholder="Catchy tagline"
                  value={manualForm.tagline}
                  onChange={(e) => setManualForm({ ...manualForm, tagline: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Label *</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                  placeholder="E.g., FLAT 50% OFF"
                  value={manualForm.discount_label}
                  onChange={(e) => setManualForm({ ...manualForm, discount_label: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                Background Image URL <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input 
                type="url" 
                className="w-full border rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none bg-slate-50"
                placeholder="https://example.com/background.jpg"
                value={manualForm.banner_image}
                onChange={(e) => setManualForm({ ...manualForm, banner_image: e.target.value })}
              />
              <p className="text-[10px] text-gray-400 mt-1">This image will be used as the ambient background behind the entire section.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date *</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                  value={manualForm.start_date}
                  onChange={(e) => setManualForm({ ...manualForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date *</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                  value={manualForm.end_date}
                  onChange={(e) => setManualForm({ ...manualForm, end_date: e.target.value })}
                />
              </div>
            </div>

            {/* AI Image Generation Section */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <label className="block text-[10px] font-black text-indigo-700 uppercase mb-2 flex items-center gap-1.5">
                <Sparkles size={12} /> Generate AI Banner Image
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none bg-white"
                  placeholder="Prompt: Luxury Diwali banner with diyas..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={imageGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0 transition shadow-sm disabled:opacity-70"
                >
                  {imageGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
              {manualForm.banner_image && (
                <div className="mt-3 relative aspect-video rounded-lg overflow-hidden border shadow-sm">
                  <img src={manualForm.banner_image} alt="AI Generated Banner" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setManualForm({...manualForm, banner_image: ""})}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded shadow-lg flex items-center justify-center w-6 h-6"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Multi-Media Upload & Animations */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                <UploadCloud size={12} /> Upload Campaign Media (Images & Videos)
              </label>
              
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-100 transition cursor-pointer">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={mediaUploading}
                />
                {mediaUploading ? (
                  <span className="text-xs font-bold text-slate-500 animate-pulse">Uploading Media... Please wait...</span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 flex flex-col items-center gap-2">
                    <UploadCloud size={20} className="text-slate-400" />
                    Drag & Drop or Click to Upload Multiple Images/Videos
                  </span>
                )}
              </div>

              {manualForm.media_assets?.length > 0 && (
                <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {manualForm.media_assets.map((asset, index) => (
                    <div key={index} className="flex gap-3 bg-white p-2 rounded-lg border items-center shadow-sm relative">
                      <div className="w-20 h-14 bg-black rounded overflow-hidden flex-shrink-0 relative">
                        {asset.type === "video" ? (
                          <video src={asset.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={asset.url} alt="media" className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-0 left-0 bg-black/70 text-white text-[8px] px-1 font-bold uppercase tracking-wider">{asset.type}</span>
                      </div>
                      
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Pro Animation Style</label>
                        <select 
                          className="w-full border rounded-lg px-2 py-1.5 text-[10px] md:text-xs font-bold outline-none focus:border-indigo-500 bg-slate-50"
                          value={asset.animation}
                          onChange={(e) => updateMediaAnimation(index, e.target.value)}
                        >
                          {ANIMATION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => removeMedia(index)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colors Preview Selection */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bg Color</label>
                <input 
                  type="color" 
                  className="w-full h-8 border rounded-xl cursor-pointer"
                  value={manualForm.bg_color}
                  onChange={(e) => setManualForm({ ...manualForm, bg_color: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Text Color</label>
                <input 
                  type="color" 
                  className="w-full h-8 border rounded-xl cursor-pointer"
                  value={manualForm.text_color}
                  onChange={(e) => setManualForm({ ...manualForm, text_color: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Accent</label>
                <input 
                  type="color" 
                  className="w-full h-8 border rounded-xl cursor-pointer"
                  value={manualForm.accent_color}
                  onChange={(e) => setManualForm({ ...manualForm, accent_color: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banner Description *</label>
              <textarea 
                required
                className="w-full border rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                placeholder="E.g., Complete your festive decorations and clothing lists with maximum bundle savings..."
                value={manualForm.banner_text}
                onChange={(e) => setManualForm({ ...manualForm, banner_text: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-4 pt-6 mt-6 border-t">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-md"
              >
                {editingCampaignId ? "Update Campaign" : "Add Campaign"}
              </button>
              <button
                type="button"
                onClick={() => { setEditingCampaignId(null); setIsCreating(false); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        )}

      </div>
    </main>
  );
};

export default Campaigns;
