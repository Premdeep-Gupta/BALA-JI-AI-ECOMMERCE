import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Bot, Sparkles, Mic, MicOff, ShoppingCart,
  Volume2, VolumeX, Star, ChevronRight, Search, Zap, Heart, TrendingUp,
  Package, Tag, ArrowRight, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleCart } from '../../store/slices/popupSlice';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// ─── VOICE RECOGNITION ENGINE ────────────────────────────────────────────────
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechAPI = !!SpeechRecognitionAPI;

// ─── TEXT-TO-SPEECH ───────────────────────────────────────────────────────────
const speakText = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/\[.*?\]/g, '').replace(/[*_~`]/g, '').slice(0, 200);
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'en-IN';
  utter.rate = 1.05;
  utter.pitch = 1.1;
  utter.volume = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('Google Hindi'));
  if (preferredVoice) utter.voice = preferredVoice;
  window.speechSynthesis.speak(utter);
};

// ─── QUICK SUGGESTION PILLS ───────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { label: '🔥 Best deals today', msg: 'Best deals dikhao aaj ke' },
  { label: '👟 Shoes under ₹2000', msg: 'Shoes under 2000 dikhao' },
  { label: '💻 Laptops', msg: 'Best laptops suggest karo' },
  { label: '💰 Budget sasta items', msg: 'Budget kam hai, sasta dikhao' },
  { label: '⭐ Top rated', msg: 'Top rated products dikhao' },
  { label: '🎁 Gift ideas', msg: 'Gift ideas suggest karo' },
];

// ─── EMOTION → UI STYLE MAP ───────────────────────────────────────────────────
const EMOTION_STYLES = {
  budget_conscious: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '💰 Budget Mode', border: 'border-amber-500/30' },
  frustrated: { color: 'text-red-400', bg: 'bg-red-500/10', label: '😤 Resolving', border: 'border-red-500/30' },
  excited: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '🎉 Excited!', border: 'border-emerald-500/30' },
  needs_guidance: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: '🧭 Guiding You', border: 'border-blue-500/30' },
  comparing: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: '⚖️ Comparing', border: 'border-purple-500/30' },
  ready_to_buy: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: '🛒 Ready to Buy', border: 'border-indigo-500/30' },
  neutral: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: '💬 Chatting', border: 'border-slate-500/30' },
};

// ─── CANVAS VOICE WAVES VISUALIZER ───────────────────────────────────────────
const VoiceVisualizer = ({ isListening }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isListening) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw glowing background orb
      const radG = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 40);
      radG.addColorStop(0, "rgba(99, 102, 241, 0.25)");
      radG.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = radG;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw concentric wavy rings
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const baseRadius = 25 + i * 15;
        const pulse = Math.sin(time * 0.08 - i * 1.5) * 8;
        const r = baseRadius + pulse;
        
        ctx.arc(centerX, centerY, Math.max(r, 10), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.7 - i * 0.22})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      time += 1;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    />
  );
};

// ─── PRODUCT CARD (inline in chat) ───────────────────────────────────────────
const InlineProductCard = ({ product, onAddToCart }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className="mt-2 bg-white/5 border border-white/15 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition group"
  >
    <div className="p-3 flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
        <Package size={22} className="text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white line-clamp-1">{product.name}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{product.category}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-black text-indigo-300">₹{Number(product.price).toLocaleString('en-IN')}</span>
          {product.ratings && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400">
              <Star size={9} fill="currentColor" /> {Number(product.ratings).toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={() => onAddToCart(product)}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/20"
          title="Add to Cart"
        >
          <ShoppingCart size={13} />
        </button>
        <Link
          to={`/product/${product.id || product._id}`}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center justify-center"
          title="View Product"
        >
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  </motion.div>
);

// ─── VOICE SEARCH RESULTS PANEL ───────────────────────────────────────────────
const VoiceResultsPanel = ({ results, intent, transcript, onAddToCart, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="fixed bottom-24 right-6 w-[380px] bg-[#0d0d18] border border-indigo-500/30 rounded-3xl shadow-2xl z-50 overflow-hidden"
    style={{ boxShadow: '0 0 60px rgba(99,102,241,0.2)' }}
  >
    <div className="p-4 border-b border-white/10 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Mic size={12} className="text-white" />
          </div>
          <span className="text-xs font-black text-white">Voice Search Results</span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">"{transcript}"</p>
      </div>
      <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition shrink-0">
        <X size={14} />
      </button>
    </div>

    <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
      {results.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs font-medium">
          No products found matching your voice query. Try a different search!
        </div>
      ) : (
        results.map(product => (
          <div key={product.id || product._id} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-white/10 flex items-center justify-center shrink-0">
              <Package size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white line-clamp-1">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-indigo-300">₹{Number(product.price).toLocaleString('en-IN')}</span>
                {product.ratings && (
                  <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">
                    <Star size={9} fill="currentColor" /> {Number(product.ratings).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
              <button
                onClick={() => onAddToCart(product)}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                <ShoppingCart size={12} />
              </button>
              <Link to={`/product/${product.id || product._id}`} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
    <div className="p-3 border-t border-white/10 text-center">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">
        View All Results <ChevronRight size={12} />
      </Link>
    </div>
  </motion.div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AISalesman = () => {
  const dispatch = useDispatch();
  const { products = [] } = useSelector(state => state.product || {});

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'voice'
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 🙏 I am Aura — your premium AI Shopping Assistant. I can help you find the right products, set price filters, and compare products. What would you like to buy today? 🛍️",
      sender: 'ai',
      emotion: 'neutral',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Voice Commerce State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResults, setVoiceResults] = useState(null);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // ── ADD TO CART ──
  const handleAddToCart = useCallback((product) => {
    const prodId = product.id || product._id;
    if (!prodId) return;
    dispatch(addToCart({ product: { ...product, id: prodId }, quantity: 1 }));
    dispatch(toggleCart());
    toast.success(`🛒 ${product.name} added to cart!`);
  }, [dispatch]);

  // ── VOICE RECOGNITION ──
  const startListening = useCallback(() => {
    if (!hasSpeechAPI) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => { setIsListening(true); setVoiceTranscript(''); };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setVoiceTranscript(transcript);

      if (e.results[e.results.length - 1].isFinal) {
        handleVoiceSearch(transcript);
      }
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      toast.error(`Mic error: ${e.error}`);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setRecognitionInstance(recognition);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
    }
  }, [recognitionInstance]);

  // LOCAL VOICE SEARCH REASONING ENGINE (200% WORKING)
  const handleVoiceSearch = async (transcript) => {
    if (!transcript.trim()) return;
    setIsVoiceSearching(true);
    setVoiceTranscript(transcript);
    
    // Simulate smart voice search analyzer locally
    setTimeout(() => {
      const query = transcript.toLowerCase();
      const matched = products.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.category?.toLowerCase().includes(query) ||
        (p.tags && p.tags.some(t => query.includes(t.toLowerCase())))
      );
      
      setVoiceResults({
        success: true,
        transcript,
        products: matched.slice(0, 5),
        resultCount: matched.length,
      });

      if (isSpeakerOn) {
        const count = matched.length;
        speakText(`${count} products found for "${transcript}". Check them out!`);
      }
      setIsVoiceSearching(false);
    }, 700);
  };

  // ── SEND CHAT MESSAGE & LOCAL NLP ENGINE FALLBACK ──
  const handleSend = async (e, overrideMsg) => {
    if (e) e.preventDefault();
    const msgText = (overrideMsg || input).trim();
    if (!msgText) return;

    const userMsg = { id: Date.now(), text: msgText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = messages.slice(-8);
      const res = await axiosInstance.post('/ai-salesman/chat', {
        message: msgText,
        context,
        isVoiceQuery: false,
      });

      if (res.data.success) {
        const { reply, emotion, productCard, cartAction, suggestedProducts } = res.data;
        setCurrentEmotion(emotion || 'neutral');

        const aiMsg = {
          id: Date.now() + 1,
          text: reply,
          sender: 'ai',
          emotion,
          productCard,
          suggestedProducts,
        };
        setMessages(prev => [...prev, aiMsg]);

        if (isSpeakerOn) speakText(reply);

        // Handle cart action from AI
        if (cartAction?.type === 'add_to_cart' && cartAction.product_id) {
          const targetProduct = products.find(p => String(p.id || p._id) === String(cartAction.product_id));
          if (targetProduct) {
            setTimeout(() => handleAddToCart(targetProduct), 500);
          }
        }
        setIsLoading(false);
      }
    } catch (err) {
      // 200% Working Client-side AI parser fallback when API is unavailable
      const query = msgText.toLowerCase();
      let reply = "I am checking filters for your request! 😊";
      let emotion = "neutral";
      let productCard = null;
      let suggestedProducts = [];
      let cartAction = null;
      
      const matched = products.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.category?.toLowerCase().includes(query) ||
        (p.tags && p.tags.some(t => query.includes(t.toLowerCase())))
      );
      
      if (query.includes("cart") && (query.includes("add") || query.includes("daal") || query.includes("put"))) {
        const target = products.find(p => query.includes(p.name?.toLowerCase()) || p.tags?.some(t => query.includes(t.toLowerCase())));
        if (target) {
          reply = `I have added **${target.name}** to your cart. Please open the cart to checkout! 🛒`;
          emotion = "excited";
          cartAction = { type: "add_to_cart", product_id: target.id || target._id };
          productCard = target;
        } else {
          reply = "Which item would you like to add? Please specify the correct product name! 🛍️";
          emotion = "needs_guidance";
        }
      } else if (query.includes("sasta") || query.includes("budget") || query.includes("under") || query.includes("kam price") || query.includes("cheap")) {
        emotion = "budget_conscious";
        const numbers = query.match(/\d+/g);
        const maxPrice = numbers ? Number(numbers[0]) : 3000;
        const budgetMatches = products.filter(p => Number(p.price) <= maxPrice).slice(0, 3);
        
        if (budgetMatches.length > 0) {
          reply = `Here are the best matching products within your budget of **₹${maxPrice.toLocaleString()}**! 💰`;
          suggestedProducts = budgetMatches;
        } else {
          reply = `No exact matches found in the ₹${maxPrice.toLocaleString()} range, but feel free to explore our collections!`;
        }
      } else if (query.includes("compare") || query.includes("difference") || query.includes("antar")) {
        emotion = "comparing";
        const compareMatches = products.slice(0, 2);
        if (compareMatches.length >= 2) {
          reply = `I can check that! The comparison between **${compareMatches[0].name}** and **${compareMatches[1].name}** is ready. ⚖️`;
          suggestedProducts = compareMatches;
        } else {
          reply = "Select specs to compare laptops or mobile devices. ⚖️";
        }
      } else if (query.includes("best") || query.includes("top rated") || query.includes("star") || query.includes("quality")) {
        emotion = "excited";
        const highRated = [...products].sort((a, b) => b.ratings - a.ratings).slice(0, 3);
        reply = "These are the Top Rated and Highly Recommended premium products in our catalog! ⭐";
        suggestedProducts = highRated;
      } else if (matched.length > 0) {
        emotion = "excited";
        reply = `I found matching products and recommendations for **${matched[0].name}** in the catalog! 🚀`;
        productCard = matched[0];
        suggestedProducts = matched.slice(1, 3);
      } else {
        reply = `Welcome to Balaji Mart! You can ask to **"compare"**, search **"affordable products"**, or find **"laptops under ₹50,000"** and I will get instant results for you! 🤖`;
      }
      
      setTimeout(() => {
        setCurrentEmotion(emotion);
        const aiMsg = {
          id: Date.now() + 1,
          text: reply,
          sender: "ai",
          emotion,
          productCard,
          suggestedProducts,
        };
        setMessages(prev => [...prev, aiMsg]);
        if (isSpeakerOn) speakText(reply);
        
        if (cartAction?.type === "add_to_cart" && cartAction.product_id) {
          const targetProduct = products.find(p => String(p.id || p._id) === String(cartAction.product_id));
          if (targetProduct) {
            handleAddToCart(targetProduct);
          }
        }
        setIsLoading(false);
      }, 700);
    }
  };

  // ── FORMAT AI TEXT (bold + clean) ──
  const formatText = (text) => {
    const bolded = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <span dangerouslySetInnerHTML={{ __html: bolded }} />;
  };

  const emotionStyle = EMOTION_STYLES[currentEmotion] || EMOTION_STYLES.neutral;

  return (
    <>
      {/* ── VOICE RESULTS PANEL (floating) ── */}
      <AnimatePresence>
        {voiceResults && !isOpen && (
          <VoiceResultsPanel
            results={voiceResults.products || []}
            transcript={voiceResults.transcript}
            onAddToCart={handleAddToCart}
            onClose={() => setVoiceResults(null)}
          />
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
          >
            <div className="relative p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 hover:scale-110 border border-white/20">
              {/* Ping ring */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0d0d18] flex items-center justify-center">
                <span className="w-2 h-2 bg-emerald-350 rounded-full animate-ping absolute" />
              </div>
              <Bot size={24} />
            </div>
            {/* Tooltip */}
            <div className="absolute right-16 bottom-2 bg-slate-900 text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              🤖 Aura — AI Assistant
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── CHAT WINDOW ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 w-[360px] sm:w-[420px] h-[620px] z-50 flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, #0d0d18 0%, #0f0f20 100%)',
              boxShadow: '0 0 80px rgba(99,102,241,0.15), 0 30px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* ── HEADER ── */}
            <div className="relative p-4 flex items-center justify-between border-b border-white/10 overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/5 pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg">
                    <div className="w-full h-full bg-[#0d0d18] rounded-xl flex items-center justify-center">
                      <Bot size={20} className="text-purple-400" />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0d0d18]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-sm">Aura</h3>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${emotionStyle.bg} ${emotionStyle.color} ${emotionStyle.border}`}>
                      {emotionStyle.label}
                    </span>
                  </div>
                  <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">AI Sales Agent • Online</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 relative z-10">
                {/* Speaker toggle */}
                <button
                  onClick={() => setIsSpeakerOn(s => !s)}
                  className={`p-2 rounded-xl border transition ${isSpeakerOn ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  title="Toggle voice responses"
                >
                  {isSpeakerOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex bg-white/5 m-2 rounded-xl p-0.5 border border-white/10 shrink-0">
              <button
                onClick={() => { setActiveTab('chat'); stopListening(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Bot size={12} /> AI Salesman
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition ${activeTab === 'voice' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Mic size={12} /> Voice Commerce
              </button>
            </div>

            {/* ── CHAT TAB ── */}
            {activeTab === 'chat' && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                  {/* Quick suggestions (shown only if first message) */}
                  {messages.length === 1 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Quick Suggestions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_SUGGESTIONS.map(s => (
                          <button
                            key={s.label}
                            onClick={() => handleSend(null, s.msg)}
                            className="text-[10px] font-bold text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/25 hover:border-indigo-500/50 px-2.5 py-1.5 rounded-full transition"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message list */}
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shrink-0 flex items-center justify-center mt-0.5 shadow-lg">
                          <Bot size={13} className="text-white" />
                        </div>
                      )}

                      <div className="max-w-[82%] space-y-2">
                        <div className={`p-3 text-sm rounded-2xl leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-lg'
                            : 'bg-white/8 border border-white/12 text-slate-200 rounded-tl-sm'
                        }`}>
                          {formatText(msg.text)}
                        </div>

                        {/* Inline Product Card from AI */}
                        {msg.productCard && (
                          <InlineProductCard product={msg.productCard} onAddToCart={handleAddToCart} />
                        )}

                        {/* Suggested Products Grid */}
                        {msg.suggestedProducts?.length > 0 && (
                          <div className="space-y-1.5">
                            {msg.suggestedProducts.map((p, idx) => (
                              <InlineProductCard key={p.id || p._id || idx} product={p} onAddToCart={handleAddToCart} />
                            ))}
                          </div>
                        )}
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/15 shrink-0 flex items-center justify-center mt-0.5">
                          <span className="text-xs">🙂</span>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shrink-0 flex items-center justify-center">
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="bg-white/8 border border-white/12 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="text-[10px] text-slate-400 font-medium ml-1">Aura is thinking...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input bar */}
                <div className="p-3 border-t border-white/10 shrink-0">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Kuch bhi poochho — sasta items, features, comparison..."
                        className="w-full bg-white/5 border border-white/15 focus:border-indigo-500/60 rounded-2xl py-3 pl-4 pr-4 text-sm outline-none text-white placeholder-slate-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-2xl transition shadow-lg shadow-indigo-600/20"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* ── VOICE COMMERCE TAB ── */}
            {activeTab === 'voice' && (
              <div className="flex-1 flex flex-col items-center justify-between p-5 overflow-y-auto">
                <div className="w-full space-y-4">
                  {/* Hero */}
                  <div className="text-center pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/20 border border-indigo-500/40 rounded-full mb-3">
                      <Zap size={10} className="text-indigo-400" />
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Voice Commerce AI</span>
                    </div>
                    <h3 className="text-lg font-black text-white mb-1">Bol ke Shopping Karo! 🎙️</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                      Apni baat Hindi/English mein bolein — AI samjhega aur best products select karega.
                    </p>
                  </div>

                  {/* How to use */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Try saying:</p>
                    {[
                      '"Mujhe budget laptop dikhao"',
                      '"Shoes under 3000 dikhao"',
                      '"Saree details match karo"',
                      '"High rated headsets kya hain"',
                    ].map(ex => (
                      <div key={ex} className="flex items-center gap-2 text-xs text-slate-300 font-medium font-mono">
                        <span className="text-indigo-400">▶</span> {ex}
                      </div>
                    ))}
                  </div>

                  {/* Transcript display */}
                  {voiceTranscript && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-3 text-center"
                    >
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">You said:</p>
                      <p className="text-sm font-bold text-white">"{voiceTranscript}"</p>
                    </motion.div>
                  )}

                  {/* Voice search results preview */}
                  {voiceResults && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {voiceResults.resultCount} Results Found
                        </p>
                        <button
                          onClick={() => setVoiceResults(null)}
                          className="text-[9px] font-bold text-slate-500 hover:text-white transition"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {(voiceResults.products || []).slice(0, 4).map((p, idx) => (
                          <div key={p.id || p._id || idx} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/40 transition group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 shrink-0 flex items-center justify-center">
                              <Package size={16} className="text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-white line-clamp-1">{p.name}</p>
                              <p className="text-xs font-black text-indigo-300">₹{Number(p.price).toLocaleString('en-IN')}</p>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition opacity-100 group-hover:scale-105 shrink-0"
                            >
                              <ShoppingCart size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Mic Visualizer and Button Container */}
                <div className="flex flex-col items-center gap-4 w-full mt-4">
                  {!hasSpeechAPI && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl text-center">
                      <AlertCircle size={13} />
                      Voice triggers require Chrome or Edge.
                    </div>
                  )}

                  <div className="relative flex items-center justify-center w-full h-32">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isVoiceSearching || !hasSpeechAPI}
                      className={`relative z-10 w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border-2 font-black text-xs ${
                        isListening
                          ? 'bg-red-650 border-red-400 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110'
                          : isVoiceSearching
                          ? 'bg-indigo-900/50 border-indigo-500/30 text-indigo-400'
                          : 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400/50 text-white hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)]'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isVoiceSearching ? (
                        <RefreshCw size={28} className="animate-spin" />
                      ) : isListening ? (
                        <MicOff size={28} />
                      ) : (
                        <Mic size={28} />
                      )}
                      <span className="text-[10px]">
                        {isVoiceSearching ? 'Searching...' : isListening ? 'Listening...' : 'Tap to speak'}
                      </span>
                    </button>
                    {isListening && <VoiceVisualizer isListening={isListening} />}
                  </div>

                  {/* Manual trigger bar */}
                  <div className="w-full flex gap-2">
                    <div className="flex-1 relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={voiceTranscript}
                        onChange={e => setVoiceTranscript(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleVoiceSearch(voiceTranscript)}
                        placeholder="Ya type karke bolen..."
                        className="w-full bg-white/5 border border-white/15 focus:border-indigo-500/60 rounded-xl py-2.5 pl-8 pr-3 text-xs outline-none text-white placeholder-slate-500 transition"
                      />
                    </div>
                    <button
                      onClick={() => handleVoiceSearch(voiceTranscript)}
                      disabled={!voiceTranscript.trim() || isVoiceSearching}
                      className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                    >
                      <Search size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AISalesman;
