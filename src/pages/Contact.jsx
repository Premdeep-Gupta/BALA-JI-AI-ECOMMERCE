import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Mail, Phone, Send, MessageSquare, ArrowRight, ShieldCheck, Sparkles, 
  CheckCircle2, Inbox, Plus, Trash, AlertCircle, Bot, User as UserIcon, Volume2, HelpCircle,
  CheckCheck, Paperclip
} from "lucide-react";
import { toggleAuthPopup } from "../store/slices/popupSlice";
import { fetchMyOrders } from "../store/slices/orderSlice";
import { toast } from "react-toastify";
import { axiosInstance } from "../lib/axios";

const Contact = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { myOrders = [] } = useSelector((state) => state.order || {});

  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'email', 'call'
  const [chatMode, setChatMode] = useState("ai"); // 'ai', 'human'
  
  // Ref for scroll prevention
  const chatContainerRef = useRef(null);
  const aiChatContainerRef = useRef(null);

  // Sound Notification trigger
  const lastMessageCountRef = useRef(0);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
      console.warn("Web Audio chime blocked by browser autoplay constraints", e);
    }
  };

  // Chat States (Human)
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // AI Assistant States
  const [aiMessages, setAiMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      message: "Hello! I am your Balaji Mart AI Support Assistant. How can I help you today?",
      created_at: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Email States
  const [emailTab, setEmailTab] = useState("inbox"); // 'inbox', 'sent', 'compose'
  const [inboxEmails, setInboxEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailPriority, setEmailPriority] = useState("medium"); // 'low', 'medium', 'high'
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Load orders for tracking lookup
  useEffect(() => {
    if (authUser) {
      dispatch(fetchMyOrders());
    }
  }, [authUser, dispatch]);

  // Auto Scroll Chat internally to prevent window downscrolling
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatMode]);

  useEffect(() => {
    if (aiChatContainerRef.current) {
      aiChatContainerRef.current.scrollTop = aiChatContainerRef.current.scrollHeight;
    }
  }, [aiMessages, chatMode]);

  // Real-time Chat Polling with Sound Notification
  useEffect(() => {
    if (!authUser || activeTab !== "chat" || chatMode !== "human") return;

    const fetchChats = async () => {
      try {
        const { data } = await axiosInstance.get("/support/chats/user");
        if (data.success) {
          // Play sound notification if new support message arrives
          if (data.chats.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
            const lastMsg = data.chats[data.chats.length - 1];
            if (lastMsg.sender === "admin") {
              playChime();
              toast.info("New message from support executive!");
            }
          }
          setChatMessages(data.chats);
          lastMessageCountRef.current = data.chats.length;
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats(); // initial fetch
    const interval = setInterval(fetchChats, 3000); // 3s polling
    return () => clearInterval(interval);
  }, [authUser, activeTab, chatMode]);

  // Real-time Emails Polling
  useEffect(() => {
    if (!authUser || activeTab !== "email") return;

    const fetchEmails = async () => {
      try {
        const inboxRes = await axiosInstance.get("/support/emails/user?folder=inbox");
        const sentRes = await axiosInstance.get("/support/emails/user?folder=sent");
        
        if (inboxRes.data.success) setInboxEmails(inboxRes.data.emails);
        if (sentRes.data.success) setSentEmails(sentRes.data.emails);
      } catch (error) {
        console.error("Error fetching emails:", error);
      }
    };

    fetchEmails(); // initial fetch
    const interval = setInterval(fetchEmails, 3000); // 3s polling
    return () => clearInterval(interval);
  }, [authUser, activeTab]);

  // Send Human Chat message
  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if ((!chatInput.trim() && !selectedFile) || isSendingChat) return;

    setIsSendingChat(true);
    const textToSend = chatInput.trim();
    setChatInput("");
    const fileToSend = selectedFile;
    setSelectedFile(null);

    const formData = new FormData();
    if (textToSend) formData.append("message", textToSend);
    if (fileToSend) formData.append("file", fileToSend);

    try {
      const { data } = await axiosInstance.post("/support/chats/user", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (data.success) {
        setChatMessages((prev) => [...prev, data.chat]);
        lastMessageCountRef.current += 1;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setIsSendingChat(false);
    }
  };

  // Submit support ticket / Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim() || isSendingEmail) return;

    setIsSendingEmail(true);
    try {
      const { data } = await axiosInstance.post("/support/emails/user", {
        subject: emailSubject.trim(),
        body: emailBody.trim(),
        priority: emailPriority
      });
      if (data.success) {
        setSentEmails((prev) => [data.email, ...prev]);
        setEmailSubject("");
        setEmailBody("");
        setEmailPriority("medium");
        setEmailTab("inbox");
        toast.success("Support ticket registered successfully!");
      }
    } catch (error) {
      toast.error("Failed to register support ticket");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Delete support email
  const handleDeleteEmail = async (emailId) => {
    try {
      const { data } = await axiosInstance.put(`/support/emails/trash/${emailId}`);
      if (data.success) {
        setInboxEmails((prev) => prev.filter((m) => m.id !== emailId));
        setSentEmails((prev) => prev.filter((m) => m.id !== emailId));
        setSelectedEmail(null);
        toast.success("Email moved to trash");
      }
    } catch (error) {
      toast.error("Failed to delete email");
    }
  };

  // AI Assistant Chat Processing
  const handleSendAiChat = async (e) => {
    if (e) e.preventDefault();
    if (!aiInput.trim() || isAiTyping) return;

    const userQuery = aiInput.trim();
    setAiInput("");

    // Append User Message to AI chat list
    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      message: userQuery,
      created_at: new Date()
    };
    setAiMessages(prev => [...prev, userMsg]);

    // Simulate AI response trigger
    setIsAiTyping(true);
    setTimeout(() => {
      let aiResponse = "";
      const queryLower = userQuery.toLowerCase();

      // Contextual FAQ and Order status engine
      if (queryLower.includes("track") || queryLower.includes("status") || queryLower.includes("order")) {
        if (myOrders.length === 0) {
          aiResponse = "🔍 **Order Status Lookup**:\nI couldn't find any recent orders registered under your account. Please confirm if you have finalized any transaction checks!";
        } else {
          const latestOrder = myOrders[0];
          const orderId = latestOrder.id?.slice(-8).toUpperCase() || "N/A";
          const orderDate = new Date(latestOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
          const itemsSummary = latestOrder.order_items?.map(it => `${it.title} (Qty: ${it.quantity})`).join(", ") || "Item";

          aiResponse = `🔍 **Order Status Lookup**:\nI found your recent order **#${orderId}** placed on **${orderDate}**!\n\n- **Status**: ${latestOrder.order_status}\n- **Total Bill**: ₹${latestOrder.total_price.toLocaleString()}\n- **Package Contents**: ${itemsSummary}\n- **Assigned Partner**: ${latestOrder.delivery_boy_name || "Assigned Partner"}\n- **OTP Code**: ${latestOrder.order_status === "Delivered" ? "Used" : latestOrder.delivery_otp || "Pending"}`;
        }
      } else if (queryLower.includes("return") || queryLower.includes("exchange")) {
        aiResponse = "📦 **Return & Exchange Policy**:\nBalaji Mart offers a premium **7-day free return/exchange window** on all items!\n\n1. Navigate to the **My Orders** screen.\n2. Click the **Return / Exchange** action button next to your delivered product.\n3. Complete the request form. Pickup is completed within 2 business days.";
      } else if (queryLower.includes("refund")) {
        aiResponse = "💸 **Refund Timeline**:\nRefunds are processed automatically to your original payment node once returned items are inspected at our warehouse.\n\n- **UPI/Card Transfers**: 2-3 business days.\n- **COD Wallet refunds**: 1-2 business days.";
      } else if (queryLower.includes("hotline") || queryLower.includes("call") || queryLower.includes("phone")) {
        aiResponse = "📞 **Support Helpline**:\nYou can reach our Direct Call Hotline Support anytime at **+1 (555) 123-4567**. Assistance is available 24/7.";
      } else if (queryLower.includes("speak") || queryLower.includes("human") || queryLower.includes("agent") || queryLower.includes("executive")) {
        aiResponse = "👤 **Transferring Connection**:\nTransferring your session to a Live Support Executive. Please wait a moment...";
        // Switch to Human Support Executive after brief delay
        setTimeout(() => {
          setChatMode("human");
          toast.success("Connected to live executive console");
        }, 1500);
      } else {
        // Fallback generic FAQ
        aiResponse = `👋 Thank you for contacting Balaji Mart!\n\nI can assist you instantly with the following queries:\n- Type **"Track order"** to inspect your recent transaction.\n- Type **"Return item"** to learn about pick-ups.\n- Type **"Speak to Human"** to transfer to a customer agent.`;
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        message: aiResponse,
        created_at: new Date()
      };

      setAiMessages(prev => [...prev, aiMsg]);
      setIsAiTyping(false);
      playChime();
    }, 1200);
  };

  // Submit dynamic suggested replies
  const handleSuggestedReply = (replyText) => {
    setAiInput(replyText);
    setTimeout(() => {
      // Simulate input setting and dispatching
      const inputElement = document.getElementById("ai-chat-input-form");
      if (inputElement) {
        inputElement.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }, 50);
  };

  // Helper colors for ticket priorities & status
  const getStatusBadge = (status) => {
    switch (status) {
      case "open": return "bg-red-500/10 border-red-500/20 text-red-500";
      case "pending": return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      case "resolved": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
      case "closed": return "bg-slate-500/10 border-slate-500/20 text-slate-400";
      default: return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high": return "bg-rose-500/15 border-rose-500/20 text-rose-500";
      case "medium": return "bg-amber-500/15 border-amber-500/20 text-amber-500";
      case "low": return "bg-indigo-500/15 border-indigo-500/20 text-indigo-400";
      default: return "bg-slate-500/15 border-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-16 selection:bg-red-500/30 relative">
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] bg-[var(--primary)]/15 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[350px] h-[350px] bg-[var(--accent)]/10 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Title */}
        <div className="text-center mb-8">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] rounded-full text-[9px] font-black uppercase tracking-widest w-fit mx-auto mb-3 animate-pulse">
            <Sparkles size={10} /> Support Hub
          </span>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase">
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-700">Balaji Mart</span>
          </h1>
          <p className="opacity-70 text-[11px] max-w-md mx-auto">
            Choose your preferred support channel to connect with our dedicated executive assistance team.
          </p>
        </div>

        {/* 3 Selector cards - Ultra Premium & Compact Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-4xl mx-auto">
          {[
            { id: "chat", label: "Live Support Chat", desc: "AI Chat & Live Executive Desk", icon: MessageSquare, color: "text-red-500 bg-red-500/10 border-red-500/20" },
            { id: "email", label: "Email Support Desk", desc: "Tickets & Correspondence Archive", icon: Mail, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
            { id: "call", label: "Phone Hotline Support", desc: "24/7 Direct Call Helpline", icon: Phone, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
          ].map((card) => {
            const Icon = card.icon;
            const isSelected = activeTab === card.id;

            return (
              <button
                key={card.id}
                onClick={() => {
                  setActiveTab(card.id);
                  setSelectedEmail(null);
                }}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all duration-300 w-full hover:scale-[1.01] ${
                  isSelected 
                    ? "bg-slate-900/90 border-[var(--primary)] shadow-[0_0_15px_rgba(239,68,68,0.1)] text-white" 
                    : "bg-slate-950/20 border-white/5 hover:border-white/10 hover:bg-slate-950/40"
                }`}
              >
                <div className={`p-2 rounded-xl ${card.color} border shrink-0`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="font-black text-xs text-white tracking-tight truncate">{card.label}</h4>
                  <p className="opacity-50 text-[9px] font-semibold truncate mt-0.5">{card.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive workspace pane */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 sm:p-8 min-h-[500px] shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-[50px] rounded-full pointer-events-none" />

          {/* User authentication guard */}
          {!authUser && activeTab !== "call" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-5 max-w-sm mx-auto">
              <div className="p-4 bg-[var(--primary)]/10 rounded-[2rem] border border-[var(--border)] text-[var(--primary)]">
                <ShieldCheck size={36} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-md text-white uppercase">Authentication Required</h4>
                <p className="opacity-60 text-xs mt-2 leading-relaxed">
                  Please log in to your Balaji Mart account to establish secure chat and email ticket streams with support executives.
                </p>
              </div>
              <button
                onClick={() => dispatch(toggleAuthPopup())}
                className="px-6 py-3.5 bg-[var(--primary)] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition active:scale-95 shadow-md flex items-center gap-2"
              >
                Access Account <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              {/* =================== CHAT PANE =================== */}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col h-[520px]">
                  {/* Chat Mode Toggler */}
                  <div className="pb-4 border-b border-[var(--border)] flex flex-wrap gap-4 items-center justify-between mb-4">
                    <div className="flex gap-1.5 p-1 bg-black/25 border border-[var(--border)] rounded-2xl w-full sm:w-fit">
                      <button
                        onClick={() => setChatMode("ai")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                          chatMode === "ai"
                            ? "bg-[var(--primary)] text-white font-black"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Bot size={14} /> AI Assistant
                      </button>
                      <button
                        onClick={() => {
                          setChatMode("human");
                          lastMessageCountRef.current = chatMessages.length;
                        }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                          chatMode === "human"
                            ? "bg-[var(--primary)] text-white font-black"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <UserIcon size={14} /> Live Executive
                      </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono opacity-50 uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                      {chatMode === "ai" ? (
                        <>🤖 Balaji AI Active</>
                      ) : (
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Support Socket</span>
                      )}
                    </div>
                  </div>

                  {/* ======================= CHAT VIEW: AI MODE ======================= */}
                  {chatMode === "ai" && (
                    <div className="flex-grow flex flex-col justify-between h-[380px]">
                      {/* AI Messages Viewport */}
                      <div ref={aiChatContainerRef} className="flex-grow overflow-y-auto pr-1 space-y-4 mb-4 custom-scrollbar max-h-[260px]">
                        {aiMessages.map((msg) => {
                          const isAI = msg.sender === "ai";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[80%] ${isAI ? "mr-auto items-start" : "ml-auto items-end"}`}
                            >
                              <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed border whitespace-pre-line ${
                                isAI
                                  ? "bg-white/5 text-slate-200 border-white/10 rounded-tl-none"
                                  : "bg-[var(--primary)] text-white border-[var(--primary)]/20 rounded-tr-none shadow-md"
                              }`}>
                                {msg.message}
                              </div>
                              <span className="text-[8px] opacity-40 font-mono mt-1 pl-1">
                                {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}

                        {/* Typing Animation */}
                        {isAiTyping && (
                          <div className="flex flex-col items-start gap-1 max-w-[80%] mr-auto">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[8px] opacity-40 font-mono ml-1">Balaji AI is typing...</span>
                          </div>
                        )}
                      </div>

                      {/* Suggested Quick Replies */}
                      <div className="flex flex-wrap gap-2 mb-4 pt-1 border-t border-white/5">
                        {[
                          { text: "Track my recent order", label: "🔍 Track Order" },
                          { text: "Return or Exchange a product", label: "📦 Returns Policy" },
                          { text: "Refund timeline", label: "💸 Refund Status" },
                          { text: "Connect to a Human Agent", label: "👤 Speak to Human" },
                        ].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestedReply(suggestion.text)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-[var(--primary)]/10 border border-white/5 hover:border-[var(--primary)]/30 text-[10px] font-bold text-white transition active:scale-95"
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      </div>

                      {/* AI Input form */}
                      <form 
                        id="ai-chat-input-form"
                        onSubmit={handleSendAiChat} 
                        className="flex gap-3 items-center border-t border-[var(--border)] pt-4"
                      >
                        <input
                          type="text"
                          placeholder="Ask AI Assistant anything..."
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          disabled={isAiTyping}
                          className="flex-grow px-4 py-3.5 bg-black/35 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl outline-none text-xs font-bold placeholder:text-slate-500 transition-all text-white"
                        />
                        <button
                          type="submit"
                          disabled={!aiInput.trim() || isAiTyping}
                          className="p-3.5 bg-[var(--primary)] disabled:opacity-40 text-white rounded-xl active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center border border-[var(--primary)]/20"
                        >
                          <Send size={15} />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ======================= CHAT VIEW: HUMAN MODE ======================= */}
                  {chatMode === "human" && (
                    <div className="flex-grow flex flex-col justify-between h-[380px]">
                      {/* Messages viewport */}
                      <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-1 space-y-4 mb-4 custom-scrollbar max-h-[300px]">
                        {chatMessages.length === 0 ? (
                          <div className="py-16 text-center opacity-65 flex flex-col items-center justify-center gap-3">
                            <MessageSquare size={36} className="text-slate-600 animate-pulse" />
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Start Live Support Chat</p>
                            <p className="text-[10px] text-slate-500 max-w-[240px]">Ask your questions directly! Balaji Mart support executives will reply in real-time.</p>
                          </div>
                        ) : (
                          chatMessages.map((msg) => {
                            const isAdmin = msg.sender === "admin";
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col max-w-[80%] ${isAdmin ? "mr-auto items-start" : "ml-auto items-end"}`}
                              >
                                <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed border ${
                                  isAdmin
                                    ? "bg-white/5 text-slate-200 border-white/10 rounded-tl-none"
                                    : "bg-[var(--primary)] text-white border-[var(--primary)]/20 rounded-tr-none shadow-md"
                                }`}>
                                  {msg.attachment_url && (
                                    <div className="mb-2">
                                      {msg.attachment_url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                        <img 
                                          src={msg.attachment_url} 
                                          alt="Attachment" 
                                          className="max-w-[200px] max-h-[200px] rounded-xl cursor-pointer object-cover border border-white/10 hover:opacity-90 transition shadow-sm"
                                          onClick={() => window.open(msg.attachment_url, '_blank')}
                                        />
                                      ) : (
                                        <a 
                                          href={msg.attachment_url} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="flex items-center gap-1.5 underline text-sky-450 font-black hover:text-sky-350 transition break-all"
                                        >
                                          <Paperclip size={12} /> View File Attachment
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {msg.message}
                                </div>
                                <span className="text-[8px] opacity-40 font-mono mt-1 flex items-center gap-1 pl-1">
                                  {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                                  {!isAdmin && <CheckCheck size={10} className="text-[var(--primary)]" />}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Input form */}
                      <form onSubmit={handleSendChat} className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                        {selectedFile && (
                          <div className="flex items-center justify-between gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <div className="flex items-center gap-2 text-xs font-bold text-white min-w-0">
                              <Paperclip size={12} className="text-[var(--primary)] shrink-0" />
                              <span className="truncate">{selectedFile.name}</span>
                              <span className="opacity-50 text-[10px] shrink-0">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setSelectedFile(null)} 
                              className="p-1.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
                            >
                              <Trash size={11} />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-3 items-center">
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition flex items-center justify-center shrink-0"
                            title="Attach File/Image"
                          >
                            <Paperclip size={15} />
                          </button>
                          <input 
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedFile(e.target.files[0]);
                              }
                            }}
                          />

                          <input
                            type="text"
                            placeholder="Type your message to Live Executive..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            disabled={isSendingChat}
                            className="flex-grow px-4 py-3.5 bg-black/35 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl outline-none text-xs font-bold placeholder:text-slate-500 transition-all text-white"
                          />
                          <button
                            type="submit"
                            disabled={(!chatInput.trim() && !selectedFile) || isSendingChat}
                            className="p-3.5 bg-[var(--primary)] disabled:opacity-40 text-white rounded-xl active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center border border-[var(--primary)]/20"
                          >
                            <Send size={15} />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* =================== EMAIL PANE =================== */}
              {activeTab === "email" && (
                <div className="flex-grow flex flex-col h-[520px]">
                  {/* Email Actions Selector */}
                  <div className="pb-4 border-b border-[var(--border)] flex flex-wrap gap-2 items-center justify-between mb-4">
                    <div className="flex gap-1.5 p-1 bg-black/25 border border-[var(--border)] rounded-xl">
                      {[
                        { key: "inbox", label: "Inbox", icon: Inbox },
                        { key: "sent", label: "Sent", icon: Send },
                        { key: "compose", label: "Compose ticket", icon: Plus },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setEmailTab(item.key);
                            setSelectedEmail(null);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            emailTab === item.key
                              ? "bg-[var(--primary)] text-white font-black"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <item.icon size={11} /> {item.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">Mail Core</span>
                  </div>

                  <div className="flex-grow overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                    {/* 📝 COMPOSE SCREEN */}
                    {emailTab === "compose" && (
                      <form onSubmit={handleSendEmail} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Ticket Subject</label>
                            <input
                              type="text"
                              placeholder="Enter ticket heading..."
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              required
                              className="w-full px-4 py-3 bg-black/25 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl outline-none font-bold text-xs text-white placeholder:text-slate-500 transition"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Priority Level</label>
                            <div className="flex gap-2 p-1 bg-black/25 border border-[var(--border)] rounded-xl h-[46px] items-center px-2">
                              {["low", "medium", "high"].map((prio) => (
                                <button
                                  key={prio}
                                  type="button"
                                  onClick={() => setEmailPriority(prio)}
                                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                                    emailPriority === prio
                                      ? prio === "high" ? "bg-rose-600 text-white font-black" : prio === "medium" ? "bg-amber-600 text-white font-black" : "bg-indigo-650 text-white font-black"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  {prio}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Message Description</label>
                          <textarea
                            placeholder="Detail your inquiry..."
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={5}
                            required
                            className="w-full p-4 bg-black/25 border border-[var(--border)] focus:border-[var(--primary)] rounded-xl outline-none font-bold text-xs text-white placeholder:text-slate-500 transition resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSendingEmail}
                          className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl shadow-lg border border-[var(--primary)]/20 hover:opacity-95 transition"
                        >
                          <Send size={12} /> Dispatch Support Ticket
                        </button>
                      </form>
                    )}

                    {/* 📄 LIST VIEWS (Inbox or Sent) */}
                    {(emailTab === "inbox" || emailTab === "sent") && !selectedEmail && (
                      <div className="space-y-2">
                        {(emailTab === "inbox" ? inboxEmails : sentEmails).length === 0 ? (
                          <div className="py-16 text-center opacity-65 flex flex-col items-center justify-center gap-3">
                            <Inbox size={36} className="text-slate-600 animate-pulse" />
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Mailbox empty</p>
                            <p className="text-[10px] text-slate-500 max-w-[240px]">All cleared. There are no support logs in this folder.</p>
                          </div>
                        ) : (
                          (emailTab === "inbox" ? inboxEmails : sentEmails).map((mail) => (
                            <div
                              key={mail.id}
                              onClick={() => setSelectedEmail(mail)}
                              className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[var(--primary)]/30 transition duration-300 cursor-pointer flex justify-between items-center gap-4 group"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[10px] font-bold ${!mail.read ? "text-[var(--primary)]" : "opacity-65"}`}>
                                    {emailTab === "inbox" ? mail.sender_name : `To: ${mail.recipient_email}`}
                                  </span>
                                  {mail.ticket_id && (
                                    <span className="font-mono text-[9px] font-bold opacity-50">#{mail.ticket_id}</span>
                                  )}
                                  <span className={`px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider ${getStatusBadge(mail.status)}`}>
                                    {mail.status || "open"}
                                  </span>
                                  <span className={`px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider ${getPriorityBadge(mail.priority)}`}>
                                    {mail.priority || "medium"}
                                  </span>
                                </div>
                                <h4 className="text-xs font-black text-white truncate mt-1 group-hover:text-[var(--primary)] transition-colors">{mail.subject}</h4>
                                <p className="opacity-50 text-[10px] truncate mt-1">{mail.body}</p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[8px] font-mono opacity-40 block">{new Date(mail.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEmail(mail.id);
                                  }}
                                  className="p-1 text-slate-500 hover:text-red-500 rounded-lg hover:bg-white/5 transition mt-2.5 opacity-0 group-hover:opacity-100"
                                  title="Move to trash"
                                >
                                  <Trash size={11} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* 📄 DETAIL VIEW */}
                    {selectedEmail && (
                      <div className="space-y-5">
                        <button
                          onClick={() => setSelectedEmail(null)}
                          className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 w-fit border border-white/5"
                        >
                          ← Back to list
                        </button>

                        <div className="bg-black/10 p-5 border border-white/5 rounded-2xl space-y-4">
                          <div className="flex justify-between items-start gap-4 flex-wrap border-b border-white/5 pb-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                                <h4 className="text-white text-sm font-black tracking-tight">{selectedEmail.subject}</h4>
                                {selectedEmail.ticket_id && (
                                  <span className="font-mono text-xs font-bold opacity-60">#{selectedEmail.ticket_id}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {emailTab === "inbox" ? `From: ${selectedEmail.sender_name} <${selectedEmail.sender_email}>` : `To: ${selectedEmail.recipient_email}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(selectedEmail.status)}`}>
                                Status: {selectedEmail.status || "open"}
                              </span>
                              <span className={`px-2.5 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityBadge(selectedEmail.priority)}`}>
                                Priority: {selectedEmail.priority || "medium"}
                              </span>
                              <span className="text-[8px] font-mono opacity-50 block pl-2">{new Date(selectedEmail.created_at).toLocaleString("en-IN")}</span>
                            </div>
                          </div>

                          <div className="text-xs leading-relaxed text-slate-350 bg-black/10 border border-white/5 p-4 rounded-xl whitespace-pre-line">
                            {selectedEmail.body}
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-white/5 pt-4">
                            <button
                              onClick={() => handleDeleteEmail(selectedEmail.id)}
                              className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-red-900/30 flex items-center gap-1"
                            >
                              <Trash size={11} /> Delete Ticket
                            </button>
                            {emailTab === "inbox" && !selectedEmail.subject.startsWith("[Auto-Response]") && (
                              <button
                                onClick={() => {
                                  setEmailSubject(`Re: ${selectedEmail.subject}`);
                                  setEmailBody(`\n\n\n----- Original Ticket -----\n${selectedEmail.body}`);
                                  setEmailPriority(selectedEmail.priority);
                                  setEmailTab("compose");
                                  setSelectedEmail(null);
                                }}
                                className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-[var(--primary)]/20 shadow-md"
                              >
                                Reply Ticket
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* =================== CALL PANE =================== */}
          {activeTab === "call" && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 gap-6 max-w-sm mx-auto">
              <div className="p-4 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 text-emerald-500">
                <Phone size={36} className="animate-bounce" />
              </div>
              <div>
                <h4 className="font-black text-md text-white uppercase">Direct Helpline Phone Hotline</h4>
                <p className="opacity-60 text-xs mt-2 leading-relaxed">
                  Call our premium customer support desk directly. Our customer representatives are available 24/7.
                </p>
                <p className="text-2xl font-black text-[var(--primary)] font-mono tracking-wider mt-4">
                  +1 (555) 123-4567
                </p>
              </div>
              <a
                href="tel:+15551234567"
                className="px-6 py-3.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition active:scale-95 shadow-md flex items-center gap-2"
              >
                Dial Hotline Call <Phone size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
