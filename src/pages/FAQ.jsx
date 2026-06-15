import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, HelpCircle, MessageCircle, PhoneCall, Loader2 } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const FAQ = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchFaq = async () => {
      try {
        const res = await axiosInstance.get("/site/faq");
        const data = res.data.data;
        setCategories(data);
        if (data.length > 0) setActiveCategory(data[0].category);
      } catch (err) {
        console.error("Failed to fetch FAQ data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaq();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--primary)]">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  // Filter logic based on search
  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const displayCategory = searchQuery ? filteredCategories[0]?.category : activeCategory;
  const currentItems = searchQuery 
    ? filteredCategories.find(c => c.category === displayCategory)?.items || []
    : categories.find(c => c.category === activeCategory)?.items || [];

  return (
    <div className="min-h-screen pb-20 pt-28 bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      
      {/* HERO SECTION */}
      <div className="relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6 pt-10 pb-16">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] mb-2">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            How can we help you?
          </h1>
          
          {/* SEARCH BAR */}
          <div className="max-w-2xl mx-auto mt-8 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text)] opacity-40" size={20} />
            <input 
              type="text" 
              placeholder="Search for answers, orders, returns..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setOpenIndex(null); }}
              className="w-full pl-14 pr-6 py-4 rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all font-medium text-lg"
              style={{ color: "var(--text)" }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* CATEGORY SIDEBAR */}
          <div className="md:col-span-4 lg:col-span-3 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4 px-4">Categories</h3>
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setActiveCategory(cat.category); setSearchQuery(""); setOpenIndex(null); }}
                className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold transition-all ${
                  (!searchQuery && activeCategory === cat.category)
                    ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
                    : "hover:bg-[var(--primary)]/10 text-[var(--text)] opacity-70 hover:opacity-100"
                }`}
              >
                {cat.category}
              </button>
            ))}

            {/* CONTACT CARD */}
            <div className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20">
              <h4 className="font-black text-lg mb-2">Still need help?</h4>
              <p className="text-sm opacity-70 mb-4 font-medium">Our support team is available 24/7 to assist you.</p>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] font-bold text-sm hover:shadow-md transition-all">
                  <MessageCircle size={16} className="text-[var(--primary)]" /> Chat with us
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:shadow-md transition-all">
                  <PhoneCall size={16} /> Call Support
                </button>
              </div>
            </div>
          </div>

          {/* FAQ ACCORDION LIST */}
          <div className="md:col-span-8 lg:col-span-9">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              {searchQuery ? "Search Results" : activeCategory}
            </h2>

            {currentItems.length === 0 ? (
              <div className="text-center py-20 bg-[var(--card)] rounded-[2rem] border border-[var(--border)]">
                <Search size={40} className="mx-auto opacity-20 mb-4" />
                <h3 className="text-xl font-bold">No results found</h3>
                <p className="opacity-60 mt-2">Try searching with different keywords.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentItems.map((item, i) => {
                  const isOpen = openIndex === i;
                  return (
                    <div 
                      key={i}
                      className={`overflow-hidden transition-all duration-300 border rounded-2xl ${
                        isOpen 
                          ? "bg-[var(--card)] border-[var(--primary)] shadow-lg" 
                          : "bg-[var(--card)]/50 border-[var(--border)] hover:border-[var(--primary)]/50"
                      }`}
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-5 text-left"
                      >
                        <span className="font-bold text-lg pr-8 leading-snug">{item.q}</span>
                        <div className={`p-1.5 rounded-full transition-colors ${isOpen ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--border)]"}`}>
                          <ChevronDown 
                            size={16} 
                            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                          />
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="px-5 pb-6 pt-2">
                              <div className="h-px w-full bg-[var(--border)] mb-4" />
                              <p className="opacity-80 leading-relaxed font-medium">
                                {item.a}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default FAQ;