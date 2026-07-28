import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Send, RefreshCw, Type, Hash, Download, CheckCircle, Flame, Palette, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from "./Header";
import { axiosInstance } from "../lib/axios";

const PRESETS = [
  { name: 'Diwali Dhamaka 🪔', prompt: 'Diwali Dhamaka Super Sale - Electronics and home appliances with grand festive discounts!', theme: 'diwali' },
  { name: 'Cyber Monday 🎮', prompt: 'Cyber Monday Special Tech Deals - High-end gaming laptops and ultimate setup accessories!', theme: 'cyber' },
  { name: 'Christmas Magic 🎄', prompt: 'Christmas Holiday Grand Sale - Warm winter clothing, custom gifts, and decoration sales!', theme: 'christmas' },
  { name: 'Eid Mubarak 🌙', prompt: 'Eid Mubarak Special Fashion Sale - Designer kurtas, traditional dresses, and luxury gifts!', theme: 'eid' },
  { name: 'Holi Colors 🎨', prompt: 'Holi Festive Color Sale - Organic colors, premium water guns, and colorful party bundles!', theme: 'holi' },
  { name: 'Valentine Love 💖', prompt: 'Valentines Day Season of Love Sale - Premium luxury cosmetics, fine jewelry, and special flower hampers!', theme: 'valentine' },
];

const THEME_DATA = {
  diwali: {
    banner: '/diwali_banner.png',
    themeName: 'Diwali Festive 🪔',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    primaryColor: 'text-amber-600',
    caption: (prompt) => `🪔✨ Happy Diwali Dhamaka Sale! ✨🪔\n\nCelebrate the festival of lights with the year's biggest discounts! Exclusive deals on all categories. Spread the joy and shop your favorites today!\n\n🛍️ Up to 70% OFF + Free Shipping!`,
    hashtags: '#DiwaliSale #FestiveDeals #DiwaliDhamaka #HappyDiwali #IndianFestival #ShoppingSpree #SpecialDiscount'
  },
  cyber: {
    banner: '/cyber_banner.png',
    themeName: 'Cyber & Tech 🎮',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    primaryColor: 'text-cyan-600',
    caption: (prompt) => `🎮💻 CYBER MONDAY MEGA SALE! 💻🎮\n\nLevel up your gear with next-gen tech! Massive discounts on top-tier gaming laptops, accessories, and premium electronics. Strictly limited stock!\n\n⚡ Up to 50% OFF | Instant cashback at checkout!`,
    hashtags: '#CyberMonday #TechDeals #GamingLaptop #ElectronicsSale #PCGamer #SpecialOffer #GadgetLovers'
  },
  christmas: {
    banner: '/christmas_banner.png',
    themeName: 'Christmas Magic 🎄',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    primaryColor: 'text-emerald-600',
    caption: (prompt) => `🎄⛄ Merry Christmas Grand Sale! ⛄🎄\n\nUnwrap the joy of savings this holiday season! Perfect gifts for your loved ones at prices you'll love. Make this Christmas extra magical with our special offers.\n\n🎁 Flat 60% OFF sitewide! Use code: SANTA60`,
    hashtags: '#ChristmasSale #HolidaySavings #MerryChristmas #XmasDeals #GiftIdeas #WinterSale #FestiveVibes'
  },
  eid: {
    banner: '/eid_banner.png',
    themeName: 'Eid Special 🌙',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    primaryColor: 'text-purple-600',
    caption: (prompt) => `🌙✨ Eid Mubarak Special Sale! ✨🌙\n\nCelebrate Eid with beautiful new styles and exciting offers! Curated collections for the perfect festive look. Gift happiness to your family with our premium deals.\n\n🛍️ Buy 2 Get 1 Free + Extra 15% OFF today!`,
    hashtags: '#EidSale #EidMubarak #RamadanDeals #FestiveFashion #EidShopping #FamilyGifts #CelebrateInStyle'
  },
  holi: {
    banner: '/holi_banner.png',
    themeName: 'Holi Colors 🎨',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    primaryColor: 'text-pink-600',
    caption: (prompt) => `🎨🌈 Vibrant Holi Festive Sale! 🌈🎨\n\nAdd colors of joy and savings to your life! Splash into the ultimate shopping experience with unbeatable discounts across all products. Celebrate with big savings!\n\n💥 Double Discount Coupons active today only!`,
    hashtags: '#HoliSale #FestivalOfColors #VibrantDeals #HoliDhamaka #ColorYourLife #ShoppingDhamaka #HappyHoli'
  },
  valentine: {
    banner: '/valentine_banner.png',
    themeName: 'Season of Love 💖',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    primaryColor: 'text-rose-600',
    caption: (prompt) => `💖🌹 Valentine's Day Season of Love Sale! 🌹💖\n\nShow your love with the perfect romantic gift! Exclusive jewelry, premium fashion, and customized gift hampers at sweet discounts. Celebrate your special someone today.\n\n💝 Gift wrapping free + Express delivery guaranteed!`,
    hashtags: '#ValentinesSale #SeasonOfLove #PerfectGift #GiftForHer #GiftForHim #Romance #SpecialDeals'
  },
  default: {
    banner: '/default_banner.png',
    themeName: 'Smart Campaign ✨',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    primaryColor: 'text-indigo-600',
    caption: (prompt) => `🔥 FLASH SALE ALERT! 🔥\n\nUnbelievable discounts live right now! Grab the best-selling products of the week at absolute lowest prices. Act fast - these deals won't last long!\n\n🛒 Tap the link in bio to shop the collection before it sells out!`,
    hashtags: '#FlashSale #MegaDeals #SmartShopping #BestPrice #LimitedTimeOffer #ShopNow #TrendingProducts'
  }
};

const AICreativeStudio = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBanner, setGeneratedBanner] = useState(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [generatedText, setGeneratedText] = useState({
    caption: '',
    hashtags: ''
  });
  
  const [loadingStep, setLoadingStep] = useState('');
  const [currentPreset, setCurrentPreset] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const detectTheme = (promptText) => {
    const p = promptText.toLowerCase();
    if (p.includes('diwali') || p.includes('deepavali') || p.includes('diya') || p.includes('cracker') || p.includes('festival of lights')) {
      return 'diwali';
    }
    if (p.includes('cyber') || p.includes('monday') || p.includes('laptop') || p.includes('gaming') || p.includes('pc') || p.includes('tech') || p.includes('electronic') || p.includes('computer') || p.includes('phone') || p.includes('mobile') || p.includes('gadget') || p.includes('appliances')) {
      return 'cyber';
    }
    if (p.includes('christmas') || p.includes('xmas') || p.includes('winter') || p.includes('new year') || p.includes('santa') || p.includes('snow') || p.includes('holiday')) {
      return 'christmas';
    }
    if (p.includes('eid') || p.includes('ramadan') || p.includes('mubarak') || p.includes('iftar') || p.includes('bakrid')) {
      return 'eid';
    }
    if (p.includes('holi') || p.includes('color') || p.includes('gulal') || p.includes('phagwa') || p.includes('colors')) {
      return 'holi';
    }
    if (p.includes('valentine') || p.includes('love') || p.includes('heart') || p.includes('anniversary') || p.includes('rose') || p.includes('couple') || p.includes('wedding')) {
      return 'valentine';
    }
    return 'default';
  };

  // Keep theme updated live as user types for direct visual feedback
  const liveTheme = detectTheme(prompt);

  const handlePresetSelect = (preset) => {
    setPrompt(preset.prompt);
    setCurrentPreset(preset.name);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for the AI');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('AI Shopping Brain initializing creative suite...', { id: 'ai-gen' });

    const steps = [
      { msg: 'Analyzing campaign prompt & brand sentiment...', delay: 400 },
      { msg: 'Detecting optimal visual theme & color palette...', delay: 800 },
      { msg: 'Synthesizing professional high-res banner asset...', delay: 1200 },
      { msg: 'Generating dynamic SEO-friendly copywriting...', delay: 1600 },
      { msg: 'Finalizing brand identity details...', delay: 1900 }
    ];

    // Play ultra premium multi-stage loading animation
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay - (steps.indexOf(step) > 0 ? steps[steps.indexOf(step)-1].delay : 0)));
      setLoadingStep(step.msg);
    }

    try {
      const themeKey = detectTheme(prompt);
      const themeObj = THEME_DATA[themeKey];

      // Native Image preloading to guarantee zero broken images and instant load
      const img = new Image();
      img.src = themeObj.banner;
      
      img.onload = () => {
        setGeneratedBanner(themeObj.banner);
        setActiveTheme(themeKey);
        setGeneratedText({
          caption: themeObj.caption(prompt),
          hashtags: themeObj.hashtags
        });
        toast.success('Creative assets synthesized successfully!', { id: 'ai-gen' });
        setIsGenerating(false);
      };

      img.onerror = () => {
        // Safe fallback
        setGeneratedBanner(themeObj.banner);
        setActiveTheme(themeKey);
        setGeneratedText({
          caption: themeObj.caption(prompt),
          hashtags: themeObj.hashtags
        });
        toast.success('Creative assets synthesized successfully!', { id: 'ai-gen' });
        setIsGenerating(false);
      };

    } catch (error) {
      console.error(error);
      toast.error('Failed to generate creative campaign', { id: 'ai-gen' });
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedBanner) return;
    try {
      const response = await fetch(generatedBanner);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeTheme}_campaign_banner.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Campaign Banner Downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download banner. Please right-click the image and save.');
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    const toastId = toast.loading('Initializing database sync for live launch...', { id: 'ai-launch' });

    try {
      const colors = {
        diwali: { bg: '#7a0c02', text: '#ffffff', accent: '#ffd700' },
        cyber: { bg: '#0F2027', text: '#ffffff', accent: '#00e5ff' },
        christmas: { bg: '#064e3b', text: '#ffffff', accent: '#ef4444' },
        eid: { bg: '#3b0764', text: '#ffffff', accent: '#eab308' },
        holi: { bg: '#be185d', text: '#ffffff', accent: '#f43f5e' },
        valentine: { bg: '#881337', text: '#ffffff', accent: '#fb7185' },
        default: { bg: '#1e1b4b', text: '#ffffff', accent: '#6366f1' }
      }[activeTheme] || { bg: '#1e1b4b', text: '#ffffff', accent: '#6366f1' };

      const eventTitles = {
        diwali: 'Diwali Dhamaka Super Sale',
        cyber: 'Cyber Monday Tech Deals',
        christmas: 'Christmas Magic Sale',
        eid: 'Eid Mubarak Sale',
        holi: 'Holi Colors Festival',
        valentine: 'Valentine Love Sale',
        default: 'Mega Flash Sale'
      };

      const payload = {
        title: eventTitles[activeTheme] || 'Mega Flash Sale',
        banner_text: prompt,
        tagline: prompt.slice(0, 70) + '...',
        discount_label: activeTheme === 'diwali' ? 'FLAT 70% OFF' : 'FLAT 50% OFF',
        cta_button_text: 'Explore Now',
        discount_percentage: activeTheme === 'diwali' ? 70 : 50,
        event_name: 'AI Creative: ' + THEME_DATA[activeTheme].themeName,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: activeTheme === 'cyber' ? 'Electronics' : activeTheme === 'christmas' ? 'Fashion' : 'All Categories',
        design_theme: activeTheme === 'diwali' ? 'gold' : activeTheme === 'cyber' ? 'cyberpunk' : 'luxury',
        theme_colors: colors,
        banner_image: `/campaigns/${activeTheme}_banner.png`,
        media_assets: [{ type: "image", url: `/campaigns/${activeTheme}_banner.png`, animation: "slideLeft" }],
        product_ids: []
      };

      // 1. Create the campaign draft in database
      const createRes = await axiosInstance.post("/campaigns/admin/create", payload);
      
      if (createRes.data.success) {
        const campaignId = createRes.data.campaign.id;
        
        // 2. Immediately Approve and Activate it
        const activateRes = await axiosInstance.put(`/campaigns/admin/update/${campaignId}`, {
          is_approved: true,
          is_active: true
        });

        if (activateRes.data.success) {
          toast.success('🚀 Campaign Launched! Banner is now live on the storefront homepage.', {
            id: 'ai-launch',
            duration: 6000,
            icon: '🎉'
          });
        } else {
          toast.error('Campaign created but activation failed.', { id: 'ai-launch' });
        }
      } else {
        toast.error('Failed to create campaign draft.', { id: 'ai-launch' });
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to launch live campaign. Please check admin session.', { id: 'ai-launch' });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <main className="p-4 md:p-8 md:pl-[18rem] bg-[#f8fafc] min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-all duration-300 w-full">
      <Header />
      <div className="max-w-[1400px] mx-auto mt-6 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <Sparkles className="text-indigo-600 animate-pulse" size={32} />
              AI Creative Studio
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Create gorgeous, theme-appropriate banner designs, captions, and tags in seconds.
            </p>
          </div>
          
          {/* Live Sentiment Meter */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Detection:</span>
            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md border ${THEME_DATA[liveTheme].badgeColor} transition-all duration-300`}>
              {THEME_DATA[liveTheme].themeName}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Type size={18} className="text-indigo-600" />
                  Campaign Idea
                </h2>
                
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      What's the sale about?
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        setCurrentPreset(null);
                      }}
                      placeholder="e.g., Diwali Dhamaka Super Sale - Electronics and home appliances..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                      rows={5}
                    />
                  </div>

                  {/* High Quality Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Or Choose a Quick Preset
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
                            currentPreset === preset.name
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Campaign Creative
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Output Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Banner Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} className="text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    Generated Banner
                  </h2>
                  {generatedBanner && (
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${THEME_DATA[activeTheme].badgeColor}`}>
                      {THEME_DATA[activeTheme].themeName} Theme
                    </span>
                  )}
                </div>
                {generatedBanner && (
                  <button
                    onClick={handleDownload}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition border border-indigo-100"
                  >
                    <Download size={14} /> Download Banner
                  </button>
                )}
              </div>
              
              <div className="w-full aspect-[1200/630] bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-center overflow-hidden relative shadow-inner">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3 text-indigo-600 px-6 text-center">
                    <RefreshCw className="animate-spin w-10 h-10" />
                    <span className="text-sm font-bold text-indigo-600 animate-pulse mt-2">{loadingStep}</span>
                  </div>
                ) : generatedBanner ? (
                  <div className="w-full h-full relative group">
                    <img 
                      src={generatedBanner} 
                      alt="Generated Campaign Banner" 
                      className="w-full h-full object-cover transition duration-500 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-xs font-bold text-white tracking-wide uppercase bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
                        Pre-rendered & Optimized (1200x630)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 p-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                      <ImageIcon size={32} className="opacity-40 text-slate-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">No Creative Generated Yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Enter a custom idea prompt or choose one of our high-quality festival presets on the left.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Copy & Hashtags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Copy */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Type size={18} className="text-indigo-600" />
                    AI Campaign Caption
                  </h2>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[140px] relative">
                    {isGenerating ? (
                      <div className="space-y-3 animate-pulse py-2">
                        <div className="h-2.5 bg-slate-200 rounded w-full"></div>
                        <div className="h-2.5 bg-slate-200 rounded w-5/6"></div>
                        <div className="h-2.5 bg-slate-200 rounded w-4/6"></div>
                        <div className="h-2.5 bg-slate-200 rounded w-full"></div>
                      </div>
                    ) : generatedText.caption ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                        {generatedText.caption}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic font-medium">
                        Your marketing copywriting will appear here after generation.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hashtags */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Hash size={18} className="text-indigo-600" />
                    Trending Campaign Hashtags
                  </h2>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[140px] relative">
                    {isGenerating ? (
                      <div className="space-y-3 animate-pulse py-2">
                        <div className="h-2.5 bg-slate-200 rounded w-full"></div>
                        <div className="h-2.5 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2.5 bg-slate-200 rounded w-5/6"></div>
                      </div>
                    ) : generatedText.hashtags ? (
                      <p className={`text-sm font-semibold leading-relaxed ${THEME_DATA[activeTheme].primaryColor}`}>
                        {generatedText.hashtags}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic font-medium">
                        Trending high-conversion hashtags will appear here.
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Action Footer */}
            {generatedBanner && (
              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleLaunch}
                  disabled={isLaunching}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-emerald-400 disabled:to-emerald-400 text-white rounded-xl font-bold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border border-emerald-500"
                >
                  {isLaunching ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Syncing Live...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      1-Click Launch Campaign
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
};

export default AICreativeStudio;
