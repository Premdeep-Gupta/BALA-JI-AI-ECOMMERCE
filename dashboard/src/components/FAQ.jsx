import React, { useState, useMemo } from "react";
import Header from "./Header";
import { 
  HelpCircle, Search, ChevronDown, ChevronUp, FileText, 
  Package, Lock, RotateCcw, ShieldCheck, Mail 
} from "lucide-react";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const categories = [
    { id: "all", label: "All Categories", icon: <HelpCircle size={13} /> },
    { id: "orders", label: "Orders & Invoices", icon: <FileText size={13} /> },
    { id: "inventory", label: "Inventory & Catalog", icon: <Package size={13} /> },
    { id: "security", label: "Security & Access", icon: <Lock size={13} /> },
    { id: "refunds", label: "Refunds & Ledgers", icon: <RotateCcw size={13} /> }
  ];

  const faqs = [
    {
      id: 1,
      category: "orders",
      question: "How do I print or generate PDFs for customer orders?",
      answer: "Navigate to the 'Invoices' tab under the 'Sales product manager' section. Select any order from the left column directory, then use the print or download buttons at the bottom of the invoice details panel. This triggers native PDF rendering automatically."
    },
    {
      id: 2,
      category: "orders",
      question: "What tax rate is applied to the invoice subtotal calculations?",
      answer: "By default, the invoicing engine applies an 18% tax rate (CGST + SGST) for item evaluations. You can customize this rate globally under the Settings page in the 'Global Store Config' tab, which updates calculations in real-time."
    },
    {
      id: 3,
      category: "inventory",
      question: "Why are limited stock products not updating on the user store front page?",
      answer: "If you add a new product under the 'Sports' category or other categories, ensure that the active backend API connection is open (Port 4000). The React customer storefront updates via Redux selectors, but may fail if the database collection does not update. Check MongoDB connection status in your terminal."
    },
    {
      id: 4,
      category: "inventory",
      question: "Where can I set the low stock alert threshold level?",
      answer: "Go to 'Settings' > 'Global Store Config' tab, then set the 'Catalog Low Inventory Warning Alert Limit' input field. Any products whose remaining counts fall below this number will flash yellow indicators inside the Catalog tables."
    },
    {
      id: 5,
      category: "security",
      question: "How does the Password Reset Link generator function?",
      answer: "In the 'Authentication' page under 'All Pages', select the email address of any active administrator or buyer, then click 'Generate Reset URL'. This generates a custom bypass token signature linking directly to the password recovery form: '/password/reset/{token}'."
    },
    {
      id: 6,
      category: "security",
      question: "Can I enforce multi-factor authentication (MFA) on all administrators?",
      answer: "Yes, you can toggle the MFA policy in 'Authentication' > 'Authentication Policies'. Disengaging or enabling this policy forces verification prompts on logins."
    },
    {
      id: 7,
      category: "refunds",
      question: "How do I process a refund on customer cancellations?",
      answer: "Locate the refund ticket identifier under the 'Todo App' task list. Check the refund pipeline check on the postgres/mongodb database schema, execute the refund transaction, and mark the order state to 'Cancelled' inside the Orders list."
    },
    {
      id: 8,
      category: "refunds",
      question: "Can I view active session IP locations to audit unauthorized access?",
      answer: "Yes, the authentication page contains a live 'Active Session Directory' auditing the IP addresses, locations (e.g. IN-WEST, IN-NORTH), browser types, and idle flags of all connected administrators."
    }
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-[#090d16] font-sans text-slate-200 pb-20 transition-all duration-500 w-full antialiased p-[10px] pl-[10px] md:pl-[17rem] box-border relative overflow-x-hidden">
      
      {/* BACKGROUND VECTOR */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="flex-1 md:p-6 space-y-8 relative z-10 w-full box-border">
        <Header />

        {/* 🌌 HERO HEADER */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden group w-full box-border">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
          
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-xl shadow-inner w-max">
              <HelpCircle size={11} className="text-indigo-400 animate-pulse" /> Knowledge Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              FAQ & Documentation Suite<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Resolve administrative operational queries, audit invoicing systems, and configure authentication security settings.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-4 py-2.5 rounded-2xl">
            <ShieldCheck size={13} className="text-indigo-400" /> Mode: Interactive
          </div>
        </div>

        {/* 🛠️ CONTROLS BAR: SEARCH & CATEGORY CHIPS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* SEARCH BAR (5 columns) */}
          <div className="lg:col-span-5 relative flex items-center group w-full">
            <Search className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
            <input 
              type="text" 
              placeholder="Search active FAQ index..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800/60 focus:border-indigo-650 rounded-xl font-bold text-xs outline-none transition placeholder:text-slate-500 text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* CATEGORY SELECTORS (7 columns) */}
          <div className="lg:col-span-7 flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setExpandedId(null); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap outline-none ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                    : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-250"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 📚 FAQ ACCORDION WORKSPACE */}
        <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-4">
          {filteredFaqs.length > 0 ? (
            <div className="space-y-4 max-w-4xl">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-350 overflow-hidden ${
                      isExpanded
                        ? "bg-slate-950/60 border-indigo-500/40"
                        : "bg-slate-950/20 border-slate-850 hover:border-slate-800"
                    }`}
                  >
                    {/* Header Question Bar */}
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full p-5 flex items-center justify-between text-left outline-none group"
                    >
                      <span className={`text-xs font-black transition-colors ${
                        isExpanded ? "text-indigo-400" : "text-white group-hover:text-indigo-300"
                      }`}>
                        {faq.question}
                      </span>
                      <span className={`p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 group-hover:text-white transition duration-300 ${
                        isExpanded ? "rotate-180 text-indigo-400 border-indigo-500/20" : ""
                      }`}>
                        <ChevronDown size={13} />
                      </span>
                    </button>

                    {/* Collapsible Answer Body */}
                    <div className={`transition-all duration-350 overflow-hidden ${
                      isExpanded ? "max-h-48 border-t border-slate-900/40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}>
                      <p className="p-5 text-slate-400 text-xs font-medium leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <HelpCircle className="text-slate-700 animate-bounce" size={32} />
              <p className="text-xs text-slate-500 font-black uppercase tracking-wider">No FAQs found matching query</p>
            </div>
          )}
        </div>

        {/* ✉️ SUBMIT TICKET PANEL */}
        <div className="bg-slate-900/30 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl">
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Still seeking diagnostics help?</h4>
            <p className="text-[10px] text-slate-450 font-medium">Draft a customer support email ticket directly to our operational staff.</p>
          </div>
          <button 
            onClick={() => toast.success("Redirecting to active Email composer...")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white font-bold text-xs transition"
          >
            <Mail size={13}/> Compose Support Ticket
          </button>
        </div>

      </div>
    </main>
  );
};

export default FAQ;
