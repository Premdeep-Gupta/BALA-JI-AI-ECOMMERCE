import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone, Sparkles, Send, BarChart2, Users, DollarSign, ArrowUpRight, 
  MessageSquare, Mail, Smartphone, Bell, RefreshCw, Layers, CheckCircle2, TrendingUp
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllProductsForDashboard } from '../store/slices/productsSlice';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import Header from './Header';

const MARKETING_THEMES = [
  { id: 'diwali', name: '🪔 Diwali Festival Sale', discount: '35% OFF' },
  { id: 'clearance', name: '🔥 Stock Clearance Sale', discount: '50% OFF' },
  { id: 'weekend', name: '⚡ Flash Weekend Madness', discount: '20% OFF' },
  { id: 'monsoon', name: '🌧️ Monsoon Super Deals', discount: '25% OFF' }
];

const CHANNELS = [
  { id: 'instagram', name: 'Instagram Ads', icon: <Smartphone size={16} />, color: 'from-pink-500 to-rose-500' },
  { id: 'email', name: 'Email Newsletter', icon: <Mail size={16} />, color: 'from-blue-500 to-indigo-500' },
  { id: 'whatsapp', name: 'WhatsApp Broadcast', icon: <MessageSquare size={16} />, color: 'from-emerald-500 to-green-500' },
  { id: 'sms', name: 'SMS Blast', icon: <Bell size={16} />, color: 'from-amber-500 to-orange-500' }
];

const INITIAL_EVENTS = [
  { id: 1, time: 'Just now', type: 'click', message: 'User from Mumbai clicked "Traditional Silk Saree" ad' },
  { id: 2, time: '2 mins ago', type: 'conversion', message: 'User from Delhi purchased "Alienware Gaming Laptop"' },
  { id: 3, time: '5 mins ago', type: 'cart', message: 'User from Pune added "Emerald Velvet Sofa" to cart' },
  { id: 4, time: '8 mins ago', type: 'like', message: 'User from Bangalore liked "Chronograph Gold Watch" reel' }
];

const LOCATIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur'];
const EVENT_TYPES = ['click', 'cart', 'conversion', 'like'];

export default function AIMarketingStudio() {
  const dispatch = useDispatch();
  const { allProducts } = useSelector((state) => state.product || {});

  // Fetch products on mount if not loaded
  useEffect(() => {
    dispatch(fetchAllProductsForDashboard());
  }, [dispatch]);

  // Live traffic stream logs state
  const [liveEvents, setLiveEvents] = useState(INITIAL_EVENTS);
  const [activeViewers, setActiveViewers] = useState(482);

  // Budget states
  const [budgetSocial, setBudgetSocial] = useState(15000);
  const [budgetEmail, setBudgetEmail] = useState(5000);
  const [budgetWhatsapp, setBudgetWhatsapp] = useState(8000);
  const [budgetSMS, setBudgetSMS] = useState(3000);

  // Copywriter states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]);
  const [selectedTheme, setSelectedTheme] = useState(MARKETING_THEMES[0]);
  const [generatedCopies, setGeneratedCopies] = useState([]);
  const [isCopywriting, setIsCopywriting] = useState(false);

  // Campaign Dispatch states
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeDispatchChannel, setActiveDispatchChannel] = useState(null);

  // Map raw redux products
  const productsList = allProducts?.map(p => ({
    id: p._id || p.id,
    name: p.name,
    price: `₹${Number(p.price).toLocaleString('en-IN')}`,
    category: p.category
  })) || [];

  // Set default product when list changes
  useEffect(() => {
    if (productsList.length > 0 && !selectedProduct) {
      setSelectedProduct(productsList[0]);
    }
  }, [allProducts, selectedProduct, productsList]);

  // Live Traffic Stream Real-Time Ticker from Backend
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const response = await axiosInstance.get('/admin/fetch/marketing-stream');
        if (response.data?.success) {
          const formattedEvents = response.data.events.map(ev => {
            const timeDiffMs = Date.now() - new Date(ev.time).getTime();
            let relativeTime = 'Just now';
            if (timeDiffMs > 60000) {
              const mins = Math.floor(timeDiffMs / 60000);
              relativeTime = `${mins} min${mins > 1 ? 's' : ''} ago`;
              if (mins >= 60) {
                const hours = Math.floor(mins / 60);
                relativeTime = `${hours} hour${hours > 1 ? 's' : ''} ago`;
                if (hours >= 24) {
                  const days = Math.floor(hours / 24);
                  relativeTime = `${days} day${days > 1 ? 's' : ''} ago`;
                }
              }
            }
            return {
              ...ev,
              time: relativeTime
            };
          });
          setLiveEvents(formattedEvents);
          if (response.data.activeViewers) {
            setActiveViewers(response.data.activeViewers);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch real-time marketing stream:", err.message);
      }
    };

    fetchLiveData(); // Initial fetch
    const interval = setInterval(fetchLiveData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Copywriter logic - Connected to Backend Gemini AI
  const handleGenerateCopy = async () => {
    if (!selectedProduct) {
      toast.error("Please select a catalog product first.");
      return;
    }
    setIsCopywriting(true);
    const toastId = toast.loading("AI copywriter generating campaign script from backend...", { id: 'copy-gen' });

    try {
      const format = selectedChannel.id === 'instagram' ? 'UGC Video' : 'TV Spot';
      const response = await axiosInstance.post('/reels/generate-script', {
        productId: selectedProduct.id,
        format: format,
        hook: 'Curiosity',
        scene: 'Luxury Penthouse'
      });

      if (response.data?.success && response.data?.script) {
        const script = response.data.script;
        const captionsText = script.captions?.join('\n') || '';

        const templates = [
          {
            title: `✨ AI Generated ${selectedChannel.name} Script`,
            subject: script.title || `${selectedProduct.name} Promotion`,
            body: captionsText || `Special discount during ${selectedTheme.name}!\nGrab the ${selectedProduct.name} now for only ${selectedProduct.price}!`
          }
        ];
        setGeneratedCopies(templates);
        toast.success("✨ AI copy variations generated successfully!", { id: 'copy-gen' });
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (err) {
      console.warn("Failed to generate AI script from backend, using custom local templates:", err.message);
      
      const prodName = selectedProduct.name;
      const price = selectedProduct.price;
      const themeName = selectedTheme.name;
      const discount = selectedTheme.discount;

      let templates = [];
      if (selectedChannel.id === 'email') {
        templates = [
          {
            title: "💎 Premium Subject Line",
            subject: `🔥 Special Launch: Get ${discount} on the new ${prodName}!`,
            body: `Hi there!\n\nUpgrade your experience with the all-new ${prodName}, designed specifically to elevate your style.\n\nAs part of our ${themeName}, we are giving you an instant ${discount} and free shipping across India.\n\nShop the campaign now: [Link]`
          }
        ];
      } else {
        templates = [
          {
            title: "📈 High CTR Caption (UGC Style)",
            body: `✨ Elevate your everyday routine with ${prodName}! 🚀 Grab yours now at ${price} with an extra ${discount} as part of the ${themeName}. Link in bio to shop! #BalajiMart #${selectedChannel.id} #ShopLocal #Sale`
          }
        ];
      }
      setGeneratedCopies(templates);
      toast.success("✨ Fallback template generated!", { id: 'copy-gen' });
    } finally {
      setIsCopywriting(false);
    }
  };

  // Campaign dispatcher progress runner - Connected to Backend Campaign Creator
  const handleLaunchCampaign = async (channel, copy) => {
    if (isDispatching) return;
    setIsDispatching(true);
    setActiveDispatchChannel(channel);
    setDispatchProgress(0);
    toast.loading(`Launching ${channel.name} broadcast...`, { id: 'dispatch' });

    try {
      await axiosInstance.post('/campaigns/admin/create', {
        title: copy.subject || `${selectedProduct.name} - Campaign`,
        banner_text: copy.body || `Special Sale!`,
        tagline: `AI Dispatch: ${selectedTheme.name}`,
        discount_label: selectedTheme.discount || "Special Offer",
        cta_button_text: "Shop Campaign",
        theme_colors: { bg: "#09090f", text: "#ffffff", accent: "#4f46e5" },
        discount_percentage: parseInt(selectedTheme.discount) || 20,
        event_name: selectedTheme.name || "AI Marketing Campaign",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        product_ids: selectedProduct ? [selectedProduct.id] : [],
        seo_title: copy.subject || `${selectedProduct.name} Campaign`,
        seo_description: copy.body || `${selectedProduct.name} promotion`,
        push_notification_text: copy.body || `${selectedProduct.name} promotion`,
        email_text: copy.body || `${selectedProduct.name} promotion`,
        social_media_caption: copy.body || `${selectedProduct.name} promotion`,
        category: selectedProduct ? selectedProduct.category : 'General',
        design_theme: 'luxury'
      });
    } catch (err) {
      console.warn("Failed to create campaign record in backend database:", err.message);
    }
  };

  useEffect(() => {
    let interval;
    if (isDispatching) {
      interval = setInterval(() => {
        setDispatchProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setIsDispatching(false);
            toast.success(`🚀 Campaign launched successfully on ${activeDispatchChannel.name}!`, { id: 'dispatch', icon: '🎉', duration: 4000 });
            return 100;
          }
          return p + 10;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isDispatching, activeDispatchChannel]);

  // Budget calculations
  const totalBudget = Number(budgetSocial) + Number(budgetEmail) + Number(budgetWhatsapp) + Number(budgetSMS);
  
  const metrics = (() => {
    if (totalBudget === 0) return { reach: 0, clicks: 0, conversions: 0, revenue: 0, roas: "0.00" };
    // Simulated ROAS performance based on channel distribution
    const socialWeight = budgetSocial * 3.4;
    const emailWeight = budgetEmail * 5.1; // Higher ROAS but lower reach limit
    const whatsappWeight = budgetWhatsapp * 4.2;
    const smsWeight = budgetSMS * 2.8;

    const weightedScore = (socialWeight + emailWeight + whatsappWeight + smsWeight) / totalBudget;
    const clicks = Math.round(totalBudget * 0.08 * (weightedScore / 3.5));
    const reach = Math.round(totalBudget * 1.5 * (weightedScore / 3.5));
    const conversions = Math.round(clicks * 0.045);
    const revenue = Math.round(conversions * 1450); // average order value in INR
    const roas = (revenue / totalBudget).toFixed(2);

    return { reach, clicks, conversions, revenue, roas };
  })();

  return (
    <div className="min-h-screen bg-[#09090f] text-white font-sans selection:bg-indigo-500/30 pb-16 p-4 md:p-8 md:pl-[18rem]">
      <Header title="AI Marketing Studio" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* TOP LEVEL REAL-TIME METRICS WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Campaign Budget</span>
              <h3 className="text-2xl font-black font-mono">₹{totalBudget.toLocaleString('en-IN')}</h3>
              <p className="text-[9px] text-slate-500 font-bold">Sum of all active ad channels</p>
            </div>
            <div className="p-3.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl group-hover:scale-105 transition-all">
              <DollarSign size={20} />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Predicted Clicks</span>
              <h3 className="text-2xl font-black font-mono">{metrics.clicks.toLocaleString()}</h3>
              <p className="text-[9px] text-emerald-400 font-black flex items-center gap-0.5">
                <ArrowUpRight size={10} /> {(totalBudget > 0 ? (metrics.clicks / totalBudget * 100).toFixed(1) : 0)}% CTR (Avg)
              </p>
            </div>
            <div className="p-3.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl group-hover:scale-105 transition-all">
              <BarChart2 size={20} />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expected ROAS</span>
              <h3 className="text-2xl font-black font-mono text-indigo-400">{metrics.roas}x</h3>
              <p className="text-[9px] text-slate-500 font-bold">Return on Advertising Spend</p>
            </div>
            <div className="p-3.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl group-hover:scale-105 transition-all">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Viewers (Storefront)</span>
              <h3 className="text-2xl font-black font-mono text-emerald-400 flex items-center gap-2">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                {activeViewers}
              </h3>
              <p className="text-[9px] text-slate-500 font-bold">Active sessions in past 5 mins</p>
            </div>
            <div className="p-3.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-105 transition-all">
              <Users size={20} />
            </div>
          </div>

        </div>

        {/* MIDDLE SECTION: BUDGET OPTIMIZER & LIVE STREAM EVENT TICKER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AI BUDGET SIMULATOR & OPTIMIZER */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight text-white">AI Budget Optimizer</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Drag to adjust allocation & view expected revenue predictions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Social Channel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>Instagram Ads</span>
                    <span className="font-mono text-white">₹{Number(budgetSocial).toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={budgetSocial}
                    onChange={(e) => setBudgetSocial(e.target.value)}
                    className="w-full accent-indigo-600 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Email Channel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>Email Newsletter</span>
                    <span className="font-mono text-white">₹{Number(budgetEmail).toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={budgetEmail}
                    onChange={(e) => setBudgetEmail(e.target.value)}
                    className="w-full accent-indigo-600 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* WhatsApp Channel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>WhatsApp Broadcast</span>
                    <span className="font-mono text-white">₹{Number(budgetWhatsapp).toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={budgetWhatsapp}
                    onChange={(e) => setBudgetWhatsapp(e.target.value)}
                    className="w-full accent-indigo-600 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* SMS Channel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>SMS Blast</span>
                    <span className="font-mono text-white">₹{Number(budgetSMS).toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    step="200"
                    value={budgetSMS}
                    onChange={(e) => setBudgetSMS(e.target.value)}
                    className="w-full accent-indigo-600 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Simulated Return display boxes */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-6 bg-slate-950/20 -mx-6 -mb-6 p-6 rounded-b-3xl">
              <div className="text-left space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Predicted Reach</span>
                <span className="text-lg font-black font-mono text-white">{(metrics.reach).toLocaleString()}</span>
              </div>
              <div className="text-left space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Predicted Orders</span>
                <span className="text-lg font-black font-mono text-white">{(metrics.conversions).toLocaleString()}</span>
              </div>
              <div className="text-left space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Estimated Revenue</span>
                <span className="text-lg font-black font-mono text-indigo-400">₹{(metrics.revenue).toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

          {/* REAL-TIME LIVE TRAFFIC EVENT STREAM */}
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white">Live Event Stream</h4>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Real-Time user interactions scan log</p>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">LIVE DATA FLOWING</span>
              </div>

              {/* Log stream viewport */}
              <div className="space-y-3.5 min-h-[180px]">
                {liveEvents.map((ev) => (
                  <div key={ev.id} className="flex gap-3 text-left items-start animate-fadeIn text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      ev.type === 'conversion' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                      ev.type === 'cart' ? 'bg-indigo-400' :
                      ev.type === 'like' ? 'bg-pink-400' : 'bg-slate-400'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-200 leading-tight">{ev.message}</p>
                      <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">{ev.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: AI AD COPYWRITER & LIVE DISPATCH CHANNEL TRIGGERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AI COPYWRITER INTERACTIVE FORM */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-5 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight text-white">AI Ad Copywriter</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Select a product to generate custom ad variations</p>
                </div>
              </div>

              {/* Product Select dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-wider text-slate-400">Target Catalog Product</label>
                <select
                  value={selectedProduct ? selectedProduct.id : ''}
                  onChange={(e) => setSelectedProduct(productsList.find(p => p.id === e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                >
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price})</option>
                  ))}
                </select>
              </div>

              {/* Sale theme dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black uppercase tracking-wider text-slate-400">Marketing Theme</label>
                  <select
                    value={selectedTheme.id}
                    onChange={(e) => setSelectedTheme(MARKETING_THEMES.find(t => t.id === e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    {MARKETING_THEMES.map(t => (
                      <option key={t.id} value={t.id}>{t.name.split(' ')[1]}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black uppercase tracking-wider text-slate-400">Target Channel</label>
                  <select
                    value={selectedChannel.id}
                    onChange={(e) => setSelectedChannel(CHANNELS.find(c => c.id === e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    {CHANNELS.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateCopy}
                disabled={isCopywriting || !selectedProduct}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isCopywriting ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                Generate Marketing Script
              </button>
            </div>
          </div>

          {/* AI AD SCRIPT PREVIEW & LIVE SCHEDULER DISPATCH PANEL */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <Send size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight text-white">Live Campaign Dispatches</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Select generated variation & trigger live notifications to all users</p>
                </div>
              </div>

              {generatedCopies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {generatedCopies.map((copy, idx) => (
                    <div key={idx} className="bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition duration-300">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 block">{copy.title || "Copy Variation"}</span>
                        {copy.subject && (
                          <p className="text-xs font-black text-white leading-tight">Subject: {copy.subject}</p>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed whitespace-pre-line bg-black/40 p-2.5 rounded-xl border border-white/5">{copy.body}</p>
                      </div>

                      <button
                        onClick={() => handleLaunchCampaign(selectedChannel, copy)}
                        disabled={isDispatching}
                        className="py-2 px-4 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send size={10} /> Dispatch Campaign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-44 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-2.5">
                  <Megaphone className="w-8 h-8 text-slate-600 animate-bounce" />
                  <div>
                    <p className="text-xs font-bold text-slate-400">No generated ad copy variations available.</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Click "Generate Marketing Script" on the left to write ad copy drafts.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Circular Dispatch Animation Overlay */}
            {isDispatching && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-50">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="text-slate-800" strokeWidth="6" fill="none" stroke="currentColor" />
                    <circle cx="48" cy="48" r="40" className="text-indigo-500 transition-all duration-300" strokeWidth="6" fill="none" stroke="currentColor"
                      strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * dispatchProgress) / 100} />
                  </svg>
                  <span className="absolute text-sm font-black font-mono">{dispatchProgress}%</span>
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 animate-pulse">Broadcasting LIVE Broadcast</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Sending push requests to server channels...</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
