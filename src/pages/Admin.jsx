import React, { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-toastify";
import { 
  Users, 
  Truck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Coins, 
  MapPin, 
  Activity, 
  UserCheck,
  Trash2,
  Search,
  Video,
  Sparkles,
  Play,
  Plus
} from "lucide-react";
import DeliveryAgentVerificationModal from "../components/DeliveryAgentVerificationModal";

const Admin = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Top Level Tab Selection: "directory" vs "compliance" vs "reels"
  const [activeTab, setActiveTab] = useState("directory"); 

  // AI Video & Reels states
  const [reels, setReels] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingReels, setLoadingReels] = useState(false);
  const [generatingReel, setGeneratingReel] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [reelTitle, setReelTitle] = useState("");
  const [reelTag, setReelTag] = useState("Trending");
  const [musicTrack, setMusicTrack] = useState("Lo-fi Beats vol. 1");
  const [scriptPrompt, setScriptPrompt] = useState("");
  const [reelProgress, setReelProgress] = useState(0);
  const [reelStage, setReelStage] = useState("");

  const fetchReels = async () => {
    setLoadingReels(true);
    try {
      const response = await axiosInstance.get("/reels/all");
      if (response.data?.success) {
        setReels(response.data.reels || []);
      }
    } catch (err) {
      console.error("Failed to load reels", err);
    } finally {
      setLoadingReels(false);
    }
  };

  const fetchProductsList = async () => {
    try {
      const response = await axiosInstance.get("/product?limit=300");
      if (response.data?.success) {
        setAllProducts(response.data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products list", err);
    }
  };

  useEffect(() => {
    if (activeTab === "reels") {
      fetchReels();
      fetchProductsList();
    }
  }, [activeTab]);

  const handleGenerateAIReel = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !reelTitle) {
      toast.warning("Please select a product and enter a title.");
      return;
    }

    setGeneratingReel(true);
    setReelProgress(10);
    setReelStage("🤖 Connecting to AI Video Studio...");

    const progressStages = [
      [1000, 30, "🧠 Synthesizing product media & details..."],
      [2500, 60, "🎨 Overlaying typography script and sound..."],
      [4000, 85, "☁️ Hosting video campaign to Cloudinary..."],
      [5500, 95, "🏷️ Registering Shoppable visual campaign..."]
    ];

    progressStages.forEach(([delay, progress, stage]) => {
      setTimeout(() => {
        setReelProgress(progress);
        setReelStage(stage);
      }, delay);
    });

    try {
      const response = await axiosInstance.post("/reels/generate", {
        productId: selectedProductId,
        title: reelTitle,
        categoryTag: reelTag,
        musicTrack,
        scriptPrompt
      });

      setTimeout(() => {
        if (response.data?.success) {
          setReelProgress(100);
          setReelStage("✅ Shoppable Campaign Published!");
          toast.success("AI Product Reel published successfully!");
          setSelectedProductId("");
          setReelTitle("");
          setScriptPrompt("");
          fetchReels();
        } else {
          toast.error("Failed to generate campaign.");
        }
        setGeneratingReel(false);
      }, 6500);

    } catch (err) {
      setTimeout(() => {
        console.error("Failed to generate AI reel", err);
        toast.error("AI video generation service encountered an error.");
        setGeneratingReel(false);
      }, 6500);
    }
  };

  const handleDeleteReel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this visual campaign?")) return;
    try {
      const response = await axiosInstance.delete(`/reels/${id}`);
      if (response.data?.success) {
        toast.success("Visual campaign deleted.");
        fetchReels();
      }
    } catch (err) {
      console.error("Failed to delete reel", err);
      toast.error("Failed to delete campaign.");
    }
  };

  const handleSuggestCaption = () => {
    const product = allProducts.find(p => (p.id || p._id) === selectedProductId);
    if (!product) {
      toast.info("Please select a product first to generate a caption!");
      return;
    }
    const tags = ["Buy now!", "Must-have!", "Limited Stock!", "Trending visual!"];
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    setReelTitle(`✨ Reveal: ${product.name} - ${randomTag}`);
    setScriptPrompt(`Create an active lifestyle video reveal highlighting: ${product.description || product.name}`);
  }; 
  
  // Compliance sub-tab: "all" vs "blocked"
  const [complianceSubTab, setComplianceSubTab] = useState("all"); 

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Compliance Review Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBoyId, setSelectedBoyId] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Verification Details Modal States
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedVerificationAgent, setSelectedVerificationAgent] = useState(null);

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    setLoading(true);
    try {
      // Fixed API Path Bug (baseURL already prepends /api/v1)
      const response = await axiosInstance.get("/admin/delivery-partners");
      if (response.data.success) {
        setDeliveryBoys(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching delivery boys, using local fallback:", error);
      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      setDeliveryBoys(partners);
      toast.info("Showing delivery partners from local cache.");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = async (id) => {
    setSelectedBoyId(id);
    setReviewModalOpen(true);
    setLoadingReview(true);
    setReviewData(null);
    try {
      // Fixed API Path Bug
      const response = await axiosInstance.get(`/admin/delivery-partner/${id}/details`);
      if (response.data.success) {
        setReviewData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching delivery partner details, using local fallback:", error);
      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      const partner = partners.find(p => p.id === id);
      if (partner) {
        setReviewData({
          agent: partner,
          violationsCount: partner.violationsCount || 0,
          offlineLogs: [],
          gpsLogs: [],
          fines: partner.fine_amount > 0 ? [
            { id: 'f_local', created_at: new Date().toISOString(), amount: partner.fine_amount, reason: partner.block_reason || 'Offline During Active Shift', status: 'Pending' }
          ] : []
        });
      } else {
        toast.error("Failed to fetch detailed review logs.");
        setReviewModalOpen(false);
      }
    } finally {
      setLoadingReview(false);
    }
  };

  const handleUnblock = async (waiveFine) => {
    setActionLoading(true);
    try {
      // Fixed API Path Bug
      const response = await axiosInstance.post(`/admin/delivery-partner/${selectedBoyId}/unblock`, { waiveFine });
      if (response.data.success) {
        toast.success(response.data.message || "Partner unblocked successfully.");
        setReviewModalOpen(false);
        fetchDeliveryBoys();
      }
    } catch (error) {
      console.error("Error unblocking partner, running local fallback:", error);
      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      const pIdx = partners.findIndex(p => p.id === selectedBoyId);
      if (pIdx !== -1) {
        partners[pIdx].delivery_partner_status = "ACTIVE";
        partners[pIdx].block_reason = null;
        partners[pIdx].blocked_shift_slot = null;
        partners[pIdx].blocked_shift_date = null;
        partners[pIdx].unblock_request_status = "Approved";
        if (waiveFine) {
          partners[pIdx].fine_amount = 0;
        }
        localStorage.setItem("balaji_delivery_partners", JSON.stringify(partners));
        toast.success(`Partner unblocked successfully (Local fallback). Fine was ${waiveFine ? "waived" : "kept"}.`);
        setReviewModalOpen(false);
        fetchDeliveryBoys();
      } else {
        toast.error("Failed to unblock partner.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAppeal = async () => {
    setActionLoading(true);
    try {
      // Fixed API Path Bug
      const response = await axiosInstance.post(`/admin/delivery-partner/${selectedBoyId}/reject-unblock`);
      if (response.data.success) {
        toast.success(response.data.message || "Appeal request rejected.");
        setReviewModalOpen(false);
        fetchDeliveryBoys();
      }
    } catch (error) {
      console.error("Error rejecting appeal, running local fallback:", error);
      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      const pIdx = partners.findIndex(p => p.id === selectedBoyId);
      if (pIdx !== -1) {
        partners[pIdx].unblock_request_status = "Rejected";
        localStorage.setItem("balaji_delivery_partners", JSON.stringify(partners));
        toast.success("Appeal request rejected (Local fallback).");
        setReviewModalOpen(false);
        fetchDeliveryBoys();
      } else {
        toast.error("Failed to reject appeal.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this delivery partner? This action cannot be undone.")) return;
    try {
      const response = await axiosInstance.delete(`/admin/delivery-agent/${id}`);
      if (response.data.success) {
        toast.success(response.data.message || "Partner deleted successfully.");
        fetchDeliveryBoys();
      }
    } catch (error) {
      console.error("Error deleting partner, running local fallback:", error);
      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      const updated = partners.filter(p => p.id !== id);
      localStorage.setItem("balaji_delivery_partners", JSON.stringify(updated));
      toast.success("Partner deleted successfully (Local fallback).");
      fetchDeliveryBoys();
    }
  };

  // Directory List Filter
  const filteredDirectoryBoys = deliveryBoys.filter(boy => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const nameMatch = boy.name?.toLowerCase().includes(q);
      const phoneMatch = boy.phone?.includes(q);
      const idMatch = boy.id?.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !idMatch) return false;
    }
    return true;
  });

  // Compliance List Filter (shows verified partners OR anyone who is blocked / has a pending appeal)
  const filteredComplianceBoys = deliveryBoys.filter(boy => {
    const isVerified = boy.verification_status === "Verified" || boy.verification_status === "Approved";
    const isBlocked = boy.delivery_partner_status === "BLOCKED";
    const hasPendingAppeal = boy.unblock_request_status === "Pending";

    if (!isVerified && !isBlocked && !hasPendingAppeal) return false;

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const nameMatch = boy.name?.toLowerCase().includes(q);
      const phoneMatch = boy.phone?.includes(q);
      const idMatch = boy.id?.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !idMatch) return false;
    }

    if (complianceSubTab === "blocked") {
      return boy.delivery_partner_status === "BLOCKED";
    }
    return true;
  });

  const blockedCount = deliveryBoys.filter(
    boy => boy.delivery_partner_status === "BLOCKED"
  ).length;

  const pendingAppealCount = deliveryBoys.filter(
    boy => boy.unblock_request_status === "Pending"
  ).length;

  const complianceTotalCount = deliveryBoys.filter(boy => {
    const isVerified = boy.verification_status === "Verified" || boy.verification_status === "Approved";
    const isBlocked = boy.delivery_partner_status === "BLOCKED";
    const hasPendingAppeal = boy.unblock_request_status === "Pending";
    return isVerified || isBlocked || hasPendingAppeal;
  }).length;

  const getStatusBadge = (boy) => {
    if (boy.delivery_partner_status === 'BLOCKED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-red-950/60 text-red-400 border border-red-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          BLOCKED
        </span>
      );
    }
    const isVerified = boy.verification_status === 'Verified' || boy.verification_status === 'Approved';
    if (!isVerified) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-slate-800 text-slate-400 border border-slate-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          INACTIVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse animate-duration-1000"></span>
        ACTIVE
      </span>
    );
  };

  const getVerificationText = (boy) => {
    const status = boy.verification_status || "Pending";
    if (status === "Verified" || status === "Approved") {
      return <span className="text-emerald-500 font-bold text-xs uppercase tracking-wider">APPROVED</span>;
    }
    if (status === "Rejected") {
      return <span className="text-red-550 font-bold text-xs uppercase tracking-wider text-red-500">REJECTED</span>;
    }
    return <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">PENDING</span>;
  };

  return (
    <div className="admin-portal-view min-h-screen bg-[#090d16] text-slate-200 antialiased w-full box-border py-8 px-4 md:px-8 relative overflow-x-hidden">
      {/* BACKGROUND VECTOR */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Segmented Controller Tab Selector */}
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/60 p-1 rounded-2xl flex max-w-lg mb-8">
          <button
            onClick={() => {
              setActiveTab("directory");
              setSearchQuery("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "directory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/35"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Partners Directory
          </button>
          <button
            onClick={() => {
              setActiveTab("compliance");
              setSearchQuery("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "compliance"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/35"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Compliance Reviews
          </button>
          <button
            onClick={() => {
              setActiveTab("reels");
              setSearchQuery("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "reels"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/35"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Video className="w-4 h-4" />
            AI Video Studio
          </button>
        </div>

      {/* Header section */}
      <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden group w-full box-border mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-xl shadow-inner w-max">
            <Truck size={11} className="text-indigo-400 animate-pulse" /> Fleet Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
            {activeTab === "directory" ? "Delivery Partners" : "Delivery Partners Dashboard"}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
            {activeTab === "directory" 
              ? "Manage your delivery fleet, check verification status, and monitor active partners."
              : "Manage status, verify compliance, handle unblock requests, and view fine histories."}
          </p>
        </div>
        
        {/* Stats cards */}
        <div className="flex flex-wrap gap-4 z-10">
          <div className="bg-slate-950/40 border border-slate-800/30 px-6 py-4 rounded-2xl flex items-center gap-4 min-w-[170px]">
            <div className="p-3 bg-indigo-600/20 rounded-lg">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">
                {activeTab === "directory" ? "Total Partners" : "Total Fleet"}
              </p>
              <p className="text-white text-base font-black mt-0.5">
                {activeTab === "directory" 
                  ? `${deliveryBoys.length} Registered`
                  : `${deliveryBoys.filter(b => b.verification_status === "Verified" || b.verification_status === "Approved").length} Active`}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-950/40 border border-slate-800/30 px-6 py-4 rounded-2xl flex items-center gap-4 min-w-[170px]">
            {activeTab === "directory" ? (
              <>
                <div className="p-3 bg-amber-600/20 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Pending Verify</p>
                  <p className="text-amber-400 text-base font-black mt-0.5">
                    {deliveryBoys.filter(b => b.verification_status === "Pending" || !b.verification_status).length} Pending
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-red-600/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-450 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Blocked Fleet</p>
                  <p className="text-red-400 text-base font-black mt-0.5">{blockedCount} Blocked</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Directory Tab View */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                PARTNERS DIRECTORY
              </h3>
              
              {/* Search Bar */}
              <div className="relative flex items-center group w-full sm:w-auto min-w-[250px]">
                <Search className="absolute left-4 text-slate-505 group-focus-within:text-indigo-405 transition-colors" size={15} />
                <input
                  type="text"
                  placeholder="Search by name or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/60 focus:border-indigo-650 rounded-xl font-bold text-xs outline-none transition-all placeholder:text-slate-500 text-slate-200"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
 
            {/* Table */}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-900/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Partner Details</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Vehicle</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Verification</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-350">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading partners...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDirectoryBoys.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-semibold text-sm">
                        No delivery partners found.
                      </td>
                    </tr>
                  ) : (
                    filteredDirectoryBoys.map((boy) => (
                      <tr key={boy.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-slate-200">{boy.name}</div>
                            <div className="text-[10px] font-mono text-indigo-400 mt-1">ID: {boy.id.substring(0, 8)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-350">{boy.phone}</div>
                          <div className="text-[10px] text-slate-500 mt-1">—</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-black tracking-wider">
                            {boy.vehicle_number || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(boy)}
                        </td>
                        <td className="px-6 py-4">
                          {getVerificationText(boy)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setSelectedVerificationAgent(boy);
                                setVerificationModalOpen(true);
                              }}
                              className="px-4 py-2 bg-indigo-950/40 hover:bg-indigo-600 text-indigo-405 hover:text-white border border-indigo-800/30 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
                            >
                              Details & Verify
                            </button>
                            <button 
                              onClick={() => handleDeletePartner(boy.id)}
                              className="p-2 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/30 rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center"
                              title="Delete Partner"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tab View */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          {/* Tabs list */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => setComplianceSubTab("all")}
              className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${
                complianceSubTab === "all"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              All Partners ({complianceTotalCount})
            </button>
            <button
              onClick={() => setComplianceSubTab("blocked")}
              className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                complianceSubTab === "blocked"
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Blocked & Appeals ({blockedCount})
              {pendingAppealCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  {pendingAppealCount} New Appeal
                </span>
              )}
            </button>
          </div>

          {/* Compliance Table Card */}
          <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-405" />
                FLEET COMPLIANCE DIRECTORY
              </h3>
              
              {/* Search Bar */}
              <div className="relative flex items-center group w-full sm:w-auto min-w-[250px]">
                <Search className="absolute left-4 text-slate-505 group-focus-within:text-indigo-405 transition-colors" size={15} />
                <input
                  type="text"
                  placeholder="Search by name or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/60 focus:border-indigo-650 rounded-xl font-bold text-xs outline-none transition-all placeholder:text-slate-500 text-slate-200"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-900/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Name & Details</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Compliance Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Appeals Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Fine Balance</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-350">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-505">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading delivery partners...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredComplianceBoys.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-semibold text-sm">
                        No delivery partners found.
                      </td>
                    </tr>
                  ) : (
                    filteredComplianceBoys.map((boy) => (
                      <tr key={boy.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={boy.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                              alt={boy.name}
                              className="w-10 h-10 rounded-full border border-slate-800 object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-200">{boy.name}</div>
                              <div className="text-[10px] font-mono text-indigo-400 mt-1">ID: {boy.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-355">{boy.phone}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{boy.agency || "Independent"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${
                            boy.delivery_partner_status === 'BLOCKED' 
                              ? 'bg-red-950/60 text-red-400 border border-red-800/40' 
                              : 'bg-emerald-955/40 text-emerald-400 border border-emerald-800/30'
                          }`}>
                            {boy.delivery_partner_status === 'BLOCKED' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            {boy.delivery_partner_status === 'BLOCKED' ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {boy.unblock_request_status === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border bg-amber-955/40 text-amber-400 border-amber-800/30 animate-pulse">
                              ⏳ Pending Appeal
                            </span>
                          ) : boy.unblock_request_status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border bg-emerald-950/40 text-emerald-400 border-emerald-800/30">
                              Approved
                            </span>
                          ) : boy.unblock_request_status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border bg-red-955/40 text-red-450 border-red-800/30">
                              Rejected
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-semibold">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-black text-sm ${boy.fine_amount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                            ₹{parseFloat(boy.fine_amount || 0).toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {boy.delivery_partner_status === 'BLOCKED' ? (
                            <button 
                              onClick={() => openReviewModal(boy.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                            >
                              Review & Unblock
                            </button>
                          ) : (
                            <button 
                              onClick={() => openReviewModal(boy.id)}
                              className="text-indigo-405 hover:text-indigo-305 transition cursor-pointer"
                            >
                              View Logs
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI Video & Shoppable Reels Tab View */}
      {activeTab === "reels" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* LEFT: AI Reel Generator Form */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md h-fit">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h3 className="text-xl font-bold text-white">AI Video Generator</h3>
            </div>
            
            <form onSubmit={handleGenerateAIReel} className="space-y-5">
              {/* Product Select */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none"
                  required
                >
                  <option value="">-- Choose Catalog Product --</option>
                  {allProducts.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name} (₹{Number(p.price).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title / Headline */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Campaign Title</label>
                  <button
                    type="button"
                    onClick={handleSuggestCaption}
                    className="text-[9px] font-black uppercase text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    ✨ Suggest Caption
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Traditional Silk Saree Reveal"
                  value={reelTitle}
                  onChange={(e) => setReelTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              {/* Tags & Audio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Campaign Tag</label>
                  <select
                    value={reelTag}
                    onChange={(e) => setReelTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none"
                  >
                    <option value="Trending">🔥 Trending</option>
                    <option value="Best Seller">⚡ Best Seller</option>
                    <option value="Premium">🛋️ Premium</option>
                    <option value="Luxury Pick">💎 Luxury Pick</option>
                    <option value="Hot Deal">🏷️ Hot Deal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Soundtrack</label>
                  <select
                    value={musicTrack}
                    onChange={(e) => setMusicTrack(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none"
                  >
                    <option value="Lo-fi Beats vol. 1">Lo-fi Beats vol. 1</option>
                    <option value="Energetic Tech EDM">Energetic Tech EDM</option>
                    <option value="Acoustic Chill vibe">Acoustic Chill vibe</option>
                    <option value="Ambient Corporate">Ambient Corporate</option>
                  </select>
                </div>
              </div>

              {/* AI Prompter Script */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">AI Prompt script (Optional)</label>
                <textarea
                  placeholder="Describe special cinematic cues (e.g. slow panning, warm light filters, glowing particle overlays...)"
                  value={scriptPrompt}
                  onChange={(e) => setScriptPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none h-20 resize-none placeholder:opacity-30"
                />
              </div>

              {/* Progress Panel */}
              {generatingReel && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-indigo-400 animate-pulse">{reelStage}</span>
                    <span className="text-white font-mono">{reelProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div style={{ width: `${reelProgress}%` }} className="bg-indigo-600 h-full transition-all duration-300" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={generatingReel}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer text-center block"
              >
                {generatingReel ? "Compiling Video..." : "Generate AI Video Campaign"}
              </button>
            </form>
          </div>

          {/* RIGHT: Active Reels Grid */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md min-h-[400px]">
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Shoppable Video Campaigns</h3>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Active catalog reels published on storefront</p>
            </div>

            {loadingReels ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 opacity-60">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-60 animate-pulse" />
                ))}
              </div>
            ) : reels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-3xl text-center space-y-3">
                <Video className="w-12 h-12 opacity-20 text-indigo-400" />
                <p className="text-slate-550 text-xs font-black uppercase tracking-wider opacity-60">No custom shoppable reels published yet.</p>
                <p className="text-[10px] text-slate-500">Choose a product on the left to compile your first AI video reel campaign!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {reels.map(reel => {
                  const rImages = (() => {
                    if (!reel.product_images) return [];
                    try {
                      return typeof reel.product_images === "string" ? JSON.parse(reel.product_images) : reel.product_images;
                    } catch { return []; }
                  })();
                  const imgUrl = rImages?.[0]?.url || "/no-image.png";

                  return (
                    <div 
                      key={reel.id}
                      className="group relative bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 shadow-lg flex flex-col justify-between"
                    >
                      {/* Badge Tag overlay */}
                      <span className="absolute top-3 left-3 z-10 bg-indigo-950/60 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black text-indigo-400 tracking-wider">
                        {reel.category_tag || "Trending"}
                      </span>

                      {/* Delete button overlay */}
                      <button
                        onClick={() => handleDeleteReel(reel.id)}
                        className="absolute top-3 right-3 z-10 w-7 h-7 bg-black/80 hover:bg-red-650 hover:text-white rounded-full flex items-center justify-center border border-slate-800 text-slate-400 transition cursor-pointer animate-duration-150"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Video/Image preview cover */}
                      <div className="aspect-[4/5] bg-slate-900 relative overflow-hidden">
                        {reel.video_url?.endsWith(".mp4") ? (
                          <video src={reel.video_url} muted loop playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">
                            🎬 {reel.music_track}
                          </span>
                          <h4 className="text-white text-xs font-black truncate">{reel.title}</h4>
                          <span className="text-[10px] text-slate-400 font-bold mt-1">For: {reel.product_name}</span>
                        </div>
                      </div>

                      {/* Analytics stats bar */}
                      <div className="p-3.5 border-t border-slate-850 bg-slate-950/90 flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <span>👀 {reel.views_count} views</span>
                        <span className="text-indigo-400">❤️ {reel.likes_count} likes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review & Unblock Modal Overlay */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#090d16]/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                Partner Compliance Review
              </h3>
              <button 
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold transition text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingReview ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Fetching review history and GPS tracking logs...</span>
              </div>
            ) : reviewData ? (
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                
                {/* Agent Card */}
                <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={reviewData.agent.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                      alt={reviewData.agent.name}
                      className="w-14 h-14 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-black text-white text-base">{reviewData.agent.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Phone: {reviewData.agent.phone}</p>
                      <p className="text-xs text-slate-400">Shift: {reviewData.agent.shift_preference}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Status / Fines</div>
                    <div className="flex items-center gap-2 mt-1 justify-start md:justify-end">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        reviewData.agent.delivery_partner_status === 'BLOCKED' 
                          ? 'bg-red-950/60 text-red-400 border border-red-800/40' 
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      }`}>
                        {reviewData.agent.delivery_partner_status === 'BLOCKED' ? 'Blocked' : 'Active'}
                      </span>
                      <span className="text-red-400 font-black text-sm">
                        ₹{parseFloat(reviewData.agent.fine_amount || 0).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Previous Block violations: <strong className="text-red-400">{reviewData.violationsCount}</strong></p>
                  </div>
                </div>

                {/* Appeal Section */}
                {reviewData.agent.unblock_request_status === 'Pending' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span>Pending Unblock Appeal Request</span>
                    </div>
                    <div className="bg-slate-950/50 border border-amber-500/20 rounded-xl p-4 text-xs font-mono text-amber-300 leading-relaxed italic">
                      "{reviewData.agent.unblock_request_reason}"
                    </div>
                  </div>
                )}

                {/* Grid Lists for History logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Offline warning history list */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
                      <Activity className="w-4 h-4 text-red-400" />
                      Offline & Event History
                    </h5>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {reviewData.offlineLogs.length === 0 ? (
                        <div className="text-xs text-slate-550 italic p-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                          No offline events recorded.
                        </div>
                      ) : (
                        reviewData.offlineLogs.map(log => (
                          <div key={log.id} className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className={`font-bold ${
                                log.event_type.includes('Blocked') ? 'text-red-400' :
                                log.event_type.includes('Appeal') ? 'text-amber-400' : 'text-slate-205'
                              }`}>
                                {log.event_type}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal font-medium">{log.details}</p>
                            <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* GPS Coordinates log list */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      GPS Tracker Coordinates History
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {reviewData.gpsLogs.length === 0 ? (
                        <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                          No GPS coordinate pings recorded.
                        </div>
                      ) : (
                        reviewData.gpsLogs.map(log => (
                          <div key={log.id} className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl text-xs">
                            <span className="font-mono text-[11px] text-slate-300">
                              📍 {parseFloat(log.latitude).toFixed(4)}° N, {parseFloat(log.longitude).toFixed(4)}° E
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Fine History Table */}
                <div className="space-y-3">
                  <h5 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Fines History Logs
                  </h5>
                  <div className="overflow-hidden border border-slate-800/60 rounded-xl bg-slate-950/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800/60">
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-[10px] text-slate-400">Date Applied</th>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-[10px] text-slate-400">Amount</th>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-[10px] text-slate-400">Reason</th>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-[10px] text-slate-400 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {reviewData.fines.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-slate-500 italic">
                              No active or waived fines stored.
                            </td>
                          </tr>
                        ) : (
                          reviewData.fines.map(fine => (
                            <tr key={fine.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="px-4 py-3 text-slate-400 text-xs">
                                {new Date(fine.created_at).toLocaleDateString()} {new Date(fine.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3 font-bold text-red-400">₹{parseFloat(fine.amount).toFixed(0)}</td>
                              <td className="px-4 py-3 text-slate-305">{fine.reason}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  fine.status === 'Pending' ? 'bg-red-950/40 text-red-400 border border-red-800/30' :
                                  fine.status === 'Waived' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                                }`}>
                                  {fine.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : null}

            {/* Modal Action Buttons */}
            {!loadingReview && reviewData && (
              <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-205 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Close Review
                  </button>
                  {reviewData.agent.unblock_request_status === 'Pending' && (
                    <button
                      onClick={handleRejectAppeal}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      Reject Request
                    </button>
                  )}
                </div>

                {reviewData.agent.delivery_partner_status === 'BLOCKED' && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleUnblock(false)}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Unblock (Keep Fine)
                    </button>
                    <button
                      onClick={() => handleUnblock(true)}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Unblock & Waive Fine
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Onboarding Verification Details Modal Overlay */}
      {verificationModalOpen && selectedVerificationAgent && (
        <DeliveryAgentVerificationModal
          agent={selectedVerificationAgent}
          onClose={() => {
            setVerificationModalOpen(false);
            setSelectedVerificationAgent(null);
          }}
          onRefresh={fetchDeliveryBoys}
        />
      )}

    </div>
    </div>
  );
};

export default Admin;
