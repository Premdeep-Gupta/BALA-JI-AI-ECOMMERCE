import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import avatar from "../assets/avatar.jpg";
import { 
  MessageSquare, Search, Send, ShieldAlert, Sparkles, Smile, Paperclip, CheckCheck, Circle, Globe, Trash
} from "lucide-react";
import { fetchAllUsers } from "../store/slices/adminSlice";
import { axiosInstance } from "../lib/axios";

const Chats = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [activeLang, setActiveLang] = useState("EN");
  const chatContainerRef = useRef(null);

  const [activeChatUsers, setActiveChatUsers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Real-time Active Chat Users Polling
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const { data } = await axiosInstance.get("/support/chats/active-users");
        if (data.success) {
          setActiveChatUsers(data.users);
        }
      } catch (error) {
        console.error("Error fetching active chat users:", error);
      }
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeChatList = useMemo(() => {
    return activeChatUsers.filter(u => u.name && u.email)
                          .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeChatUsers, searchTerm]);

  // Set default chat
  useEffect(() => {
    if (activeChatList.length > 0 && !selectedUserId) {
      setSelectedUserId(activeChatList[0].id || activeChatList[0]._id);
    }
  }, [activeChatList, selectedUserId]);

  // Real-time Support Chats Polling
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchChats = async () => {
      try {
        const { data } = await axiosInstance.get(`/support/chats/admin/${selectedUserId}`);
        if (data.success) {
          const mapped = data.chats.map(c => ({
            id: c.id,
            sender: c.sender,
            text: c.message,
            attachmentUrl: c.attachment_url,
            timestamp: new Date(c.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })
          }));
          setConversations(prev => ({
            ...prev,
            [selectedUserId]: mapped
          }));
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  // Auto Scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversations, selectedUserId]);

  const activeMessages = useMemo(() => {
    return conversations[selectedUserId] || [];
  }, [conversations, selectedUserId]);

  const activeUserDetail = useMemo(() => {
    return activeChatUsers.find(u => (u.id || u._id) === selectedUserId) || null;
  }, [activeChatUsers, selectedUserId]);

  // Multilingual mock translator support
  const getTranslatedText = (text, lang) => {
    if (lang === "HI") {
      if (text.toLowerCase().includes("order")) return "नमस्ते, मेरा ऑर्डर कहाँ है? क्या यह अभी तक शिप हुआ है?";
      if (text.toLowerCase().includes("id")) return "हाँ, यह ऑर्डर आईडी #TX-8231 है। कृपया इसकी जांच करें।";
      return "धन्यवाद! मैं आपके उत्तर की प्रतीक्षा कर रहा हूँ।";
    }
    if (lang === "AR") {
      if (text.toLowerCase().includes("order")) return "مرحبًا المسؤول، أردت التحقق من حالة طلبي. هل تم شحنها بعد؟";
      if (text.toLowerCase().includes("id")) return "نعم، هذا هو معرف الطلب #TX-8231. يرجى تفتيشها.";
      return "شكرًا لك! أنا في انتظار ردكم.";
    }
    return text;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !selectedUserId) return;

    const messageText = inputText.trim();
    setInputText("");
    const fileToSend = selectedFile;
    setSelectedFile(null);

    const formData = new FormData();
    formData.append("userId", selectedUserId);
    if (messageText) formData.append("message", messageText);
    if (fileToSend) formData.append("file", fileToSend);

    try {
      const { data } = await axiosInstance.post("/support/chats/admin", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (data.success) {
        const newMsg = {
          id: data.chat.id,
          sender: "admin",
          text: data.chat.message,
          attachmentUrl: data.chat.attachment_url,
          timestamp: new Date(data.chat.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })
        };
        
        setConversations(prev => ({
          ...prev,
          [selectedUserId]: [...(prev[selectedUserId] || []), newMsg]
        }));
      }
    } catch (error) {
      console.error("Failed to send admin reply message:", error);
    }
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
              <MessageSquare size={11} className="text-indigo-400 animate-pulse" /> Unified Messaging Socket
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Chats Core Console<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Live customer support channels with interactive response triggers and multi-language translation.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-400 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl">
            <Globe size={13} className="text-indigo-400" /> Language: 
            <select 
              value={activeLang} 
              onChange={(e) => setActiveLang(e.target.value)}
              className="bg-transparent border-none text-indigo-400 font-black outline-none cursor-pointer ml-1"
            >
              <option value="EN">English</option>
              <option value="HI">Hindi (हिंदी)</option>
              <option value="AR">Arabic (العربية)</option>
            </select>
          </div>
        </div>

        {/* 🛠️ CHAT GRID WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full box-border h-[650px]">
          
          {/* LEFT: USERS / BUYERS THREADS (4 Columns) */}
          <div className="lg:col-span-4 bg-slate-900/30 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-4 h-full overflow-hidden">
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={15} className="text-indigo-400"/> Conversations
              </h3>
              
              {/* SEARCH INPUT */}
              <div className="relative flex items-center group w-full">
                <Search className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
                <input 
                  type="text" 
                  placeholder="Search buyer contacts..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/60 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all placeholder:text-slate-500 text-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* CONTACTS LIST */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {activeChatList.length > 0 ? (
                activeChatList.map((contact) => {
                  const cId = contact.id || contact._id;
                  const isSelected = cId === selectedUserId;
                  const messages = conversations[cId] || [];
                  const lastMsg = contact.last_message || messages[messages.length - 1]?.text || "Click to start conversation...";
                  const lastMsgTime = contact.last_message_at
                    ? new Date(contact.last_message_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })
                    : "10:04 PM";

                  return (
                    <div
                      key={cId}
                      onClick={() => setSelectedUserId(cId)}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-3.5 relative overflow-hidden group/card ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500/80 shadow-md"
                          : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center font-black text-xs text-indigo-400">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                        <Circle size={10} className="absolute bottom-0 right-0 fill-emerald-400 text-emerald-400 bg-[#090d16] rounded-full p-0.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="text-white text-xs font-black truncate group-hover/card:text-indigo-400 transition-colors">
                            {contact.name}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono">{lastMsgTime}</span>
                        </div>
                        <p className="text-slate-400 text-[10px] truncate mt-1">
                          {getTranslatedText(lastMsg, activeLang)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <ShieldAlert className="text-slate-700" size={32} />
                  <p className="text-xs text-slate-500 font-black uppercase tracking-wider">No active threads</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CHAT WORKSPACE (8 Columns) */}
          <div className="lg:col-span-8 bg-slate-900/30 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col h-full overflow-hidden">
            {activeUserDetail ? (
              <>
                {/* CHAT HEADER */}
                <div className="p-5 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm uppercase">
                      {activeUserDetail.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-black tracking-tight">{activeUserDetail.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <Circle size={8} className="fill-emerald-400 text-emerald-400" /> Active Session Node (Client)
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={10}/> Support Socket Active
                  </span>
                </div>

                {/* MESSAGES VIEWPORT */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-950/20">
                  {activeMessages.map((msg) => {
                    const isAdmin = msg.sender === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[70%] ${
                          isAdmin ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                            isAdmin
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : "bg-slate-900/80 text-slate-200 border border-slate-800/60 rounded-tl-none"
                          }`}
                        >
                          {msg.attachmentUrl && (
                            <div className="mb-2">
                              {msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                <img 
                                  src={msg.attachmentUrl} 
                                  alt="Attachment" 
                                  className="max-w-[200px] max-h-[200px] rounded-xl cursor-pointer object-cover border border-white/10 hover:opacity-90 transition shadow-sm"
                                  onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                />
                              ) : (
                                <a 
                                  href={msg.attachmentUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 underline text-sky-400 font-black hover:text-sky-350 transition break-all"
                                >
                                  <Paperclip size={12} /> View File Attachment
                                </a>
                              )}
                            </div>
                          )}
                          {getTranslatedText(msg.text, activeLang)}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1 font-mono">
                          {msg.timestamp} {isAdmin && <CheckCheck size={11} className="text-indigo-400" />}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* INPUT BAR */}
                <form 
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex flex-col gap-3"
                >
                  {selectedFile && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-350 min-w-0">
                        <Paperclip size={12} className="text-indigo-400 shrink-0" />
                        <span className="truncate">{selectedFile.name}</span>
                        <span className="opacity-50 text-[10px] shrink-0">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)} 
                        className="p-1.5 bg-slate-900 hover:bg-red-950/30 hover:border-red-800/50 text-slate-400 hover:text-red-400 rounded-lg transition"
                      >
                        <Trash size={11} className="text-red-400" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 w-full">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition flex items-center justify-center shrink-0"
                      title="Attach File/Image"
                    >
                      <Paperclip size={14} />
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
                      placeholder="Type your message..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800/80 focus:border-indigo-600 rounded-xl outline-none font-bold text-xs text-slate-200 transition placeholder:text-slate-500"
                    />

                    <button 
                      type="button" 
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition hidden sm:block"
                    >
                      <Smile size={14} />
                    </button>

                    <button 
                      type="submit" 
                      disabled={(!inputText.trim() && !selectedFile)}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-lg border border-indigo-500/20 active:scale-95 transition"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 gap-4">
                <div className="w-16 h-16 bg-slate-950/60 rounded-[1.5rem] flex items-center justify-center text-slate-500 shadow-inner">
                  <MessageSquare size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-300">Select Chat Connection</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Select a buyer or user node from the left contacts directory to establish socket sync</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Chats;
