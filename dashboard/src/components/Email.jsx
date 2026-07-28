import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import { 
  Mail, Inbox, Send, Trash2, FileText, Plus, Search, 
  Trash, Reply, CornerUpLeft, ArrowUpRight, Star, ShieldCheck
} from "lucide-react";
import { fetchAllUsers } from "../store/slices/adminSlice";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const Email = () => {
  const dispatch = useDispatch();
  const { users = [] } = useSelector((state) => state.admin || {});
  
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMailId, setSelectedMailId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);

  // Compose fields
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [replyingTicketId, setReplyingTicketId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllUsers(1));
  }, [dispatch]);

  // Initial emails data
  const [mails, setMails] = useState([]);

  // Real-time Support Emails Polling
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const { data } = await axiosInstance.get(`/support/emails/admin?folder=${activeFolder}`);
        if (data.success) {
          const mapped = data.emails.map(m => ({
            id: m.id,
            folder: m.folder,
            senderName: m.sender_name,
            senderEmail: m.sender_email,
            recipientEmail: m.recipient_email,
            subject: m.subject,
            body: m.body,
            timestamp: new Date(m.created_at).toLocaleString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            read: m.read,
            starred: m.starred,
            status: m.status || 'open',
            priority: m.priority || 'medium',
            ticketId: m.ticket_id
          }));
          setMails(mapped);
        }
      } catch (error) {
        console.error("Error fetching admin support emails:", error);
      }
    };

    fetchEmails();
    const interval = setInterval(fetchEmails, 3000);
    return () => clearInterval(interval);
  }, [activeFolder]);

  // Default select first mail in folder
  useEffect(() => {
    const currentFolderMails = mails.filter(m => m.folder === activeFolder);
    if (currentFolderMails.length > 0 && !selectedMailId) {
      setSelectedMailId(currentFolderMails[0].id);
    }
  }, [activeFolder, mails, selectedMailId]);

  const filteredMails = useMemo(() => {
    return mails.filter(m => m.folder === activeFolder)
                .filter(m => m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             m.body.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [mails, activeFolder, searchTerm]);

  const activeMail = useMemo(() => {
    return mails.find(m => m.id === selectedMailId) || null;
  }, [mails, selectedMailId]);

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error("Please fill all compose fields.");
      return;
    }

    try {
      const { data } = await axiosInstance.post("/support/emails/admin", {
        recipientEmail: composeTo,
        subject: composeSubject,
        body: composeBody,
        ticketId: replyingTicketId
      });
      
      if (data.success) {
        toast.success("Email dispatched successfully!");
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        setReplyingTicketId(null);
        setIsComposing(false);
        setActiveFolder("sent");
        setSelectedMailId(data.email.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to dispatch email");
    }
  };

  const handleStatusChange = async (mailId, newStatus) => {
    try {
      const { data } = await axiosInstance.put(`/support/emails/status/${mailId}`, {
        status: newStatus
      });
      if (data.success) {
        setMails(prev => prev.map(m => m.id === mailId ? { ...m, status: newStatus } : m));
        toast.success(`Ticket status updated to ${newStatus}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handlePriorityChange = async (mailId, newPriority) => {
    try {
      const { data } = await axiosInstance.put(`/support/emails/priority/${mailId}`, {
        priority: newPriority
      });
      if (data.success) {
        setMails(prev => prev.map(m => m.id === mailId ? { ...m, priority: newPriority } : m));
        toast.success(`Ticket priority updated to ${newPriority}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update priority");
    }
  };

  const handleMoveToTrash = async (mailId) => {
    try {
      const { data } = await axiosInstance.put(`/support/emails/trash/${mailId}`);
      if (data.success) {
        setMails(prev => prev.filter(m => m.id !== mailId));
        toast.success("Email moved to trash.");
        setSelectedMailId(null);
      }
    } catch (error) {
      toast.error("Failed to delete email");
    }
  };

  const toggleStar = async (mailId) => {
    try {
      const { data } = await axiosInstance.put(`/support/emails/star/${mailId}`);
      if (data.success) {
        setMails(prev => prev.map(m => m.id === mailId ? { ...m, starred: data.email.starred } : m));
      }
    } catch (error) {
      toast.error("Failed to update star status");
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
              <Mail size={11} className="text-indigo-400 animate-pulse" /> Communications Exchange
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Mails Dispatch Hub<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Compose client letters, review customer support inboxes, and inspect ledger alerts.
            </p>
          </div>

          <button 
            onClick={() => { setIsComposing(true); setSelectedMailId(null); setReplyingTicketId(null); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-5 py-4 rounded-2xl shadow-lg border border-indigo-500/30 active:scale-95 transition"
          >
            <Plus size={14}/> Compose Message
          </button>
        </div>

        {/* 🛠️ EMAIL FRAME WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full box-border h-[650px]">
          
          {/* FOLDERS DIRECTORY PANEL (2 Columns) */}
          <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-3 h-full overflow-hidden">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Mailbox</h3>
            
            <div className="space-y-1 flex-1">
              {[
                { key: "inbox", label: "Inbox", icon: <Inbox size={15}/> },
                { key: "sent", label: "Sent", icon: <Send size={15}/> },
                { key: "trash", label: "Trash", icon: <Trash2 size={15}/> }
              ].map(folder => (
                <button
                  key={folder.key}
                  onClick={() => { setActiveFolder(folder.key); setIsComposing(false); setSelectedMailId(null); setReplyingTicketId(null); }}
                  className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                    activeFolder === folder.key && !isComposing
                      ? "bg-slate-900 text-white shadow-sm font-black"
                      : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                  }`}
                >
                  <span className={activeFolder === folder.key && !isComposing ? "text-indigo-400" : "text-slate-500"}>
                    {folder.icon}
                  </span>
                  <span>{folder.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MIDDLE: MAILS DIRECTORY (4 Columns) */}
          <div className="lg:col-span-4 bg-slate-900/30 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-4 h-full overflow-hidden">
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Mail size={15} className="text-indigo-400"/> Messages
              </h3>
              
              {/* SEARCH INPUT */}
              <div className="relative flex items-center group w-full">
                <Search className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
                <input 
                  type="text" 
                  placeholder="Search subject or body..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/60 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all placeholder:text-slate-500 text-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* EMAILS LIST SCROLL */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {filteredMails.length > 0 ? (
                filteredMails.map((mail) => {
                  const isSelected = mail.id === selectedMailId;
                  const isSent = mail.folder === "sent";

                  return (
                    <div
                      key={mail.id}
                      onClick={() => { setSelectedMailId(mail.id); setIsComposing(false); }}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-2 relative overflow-hidden group/card ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500/80 shadow-md"
                          : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80"
                      }`}
                    >
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-white text-xs font-black truncate max-w-[150px]">
                          {isSent ? `To: ${mail.recipientEmail}` : mail.senderName}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                          {mail.timestamp.split(',')[1] || mail.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <p className={`text-xs truncate ${!mail.read ? "text-indigo-400 font-black" : "text-slate-200 font-bold"}`}>
                          {mail.subject}
                        </p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleStar(mail.id); }}
                          className="shrink-0 text-slate-600 hover:text-amber-400 transition"
                        >
                          <Star size={12} className={mail.starred ? "fill-amber-400 text-amber-400" : ""} />
                        </button>
                      </div>

                      {/* Ticket Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {mail.ticketId && (
                          <span className="font-mono text-[9px] font-bold text-indigo-400 bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded">
                            #{mail.ticketId}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          mail.status === "open" ? "bg-red-500/10 border border-red-500/20 text-red-400" :
                          mail.status === "pending" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                          mail.status === "resolved" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
                          "bg-slate-500/10 border border-slate-500/20 text-slate-400"
                        }`}>
                          {mail.status || "open"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          mail.priority === "high" ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" :
                          mail.priority === "medium" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                          "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                        }`}>
                          {mail.priority || "medium"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Inbox className="text-slate-700" size={32} />
                  <p className="text-xs text-slate-500 font-black uppercase tracking-wider">Empty folder</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: VIEW / COMPOSE PANE (6 Columns) */}
          <div className="lg:col-span-6 bg-slate-900/30 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col h-full overflow-hidden">
            {isComposing ? (
              /* ✍️ COMPOSE FORM */
              <form onSubmit={handleComposeSubmit} className="flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-slate-800/60 bg-slate-950/40">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">New Correspondence</h3>
                </div>

                <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipient</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter recipient email..."
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                        required
                        className="flex-grow px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition placeholder:text-slate-650"
                      />
                      {users.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) setComposeTo(e.target.value);
                          }}
                          className="px-3 bg-slate-900 border border-slate-800 text-xs rounded-xl outline-none text-slate-400 font-bold max-w-[150px] cursor-pointer"
                        >
                          <option value="">Quick Select...</option>
                          {users.filter(u => u.email).map(u => (
                            <option key={u.id || u._id} value={u.email}>{u.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Line</label>
                    <input
                      type="text"
                      placeholder="Enter subject heading..."
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition placeholder:text-slate-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 h-64">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Body Text</label>
                    <textarea
                      placeholder="Write message details..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      required
                      className="flex-1 p-4 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition resize-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-5 py-3 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs transition"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-xl shadow-lg border border-indigo-500/20 active:scale-95 transition"
                  >
                    <ArrowUpRight size={13}/> Send Mail
                  </button>
                </div>
              </form>
            ) : activeMail ? (
              /* 📄 VIEW MAIL */
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-black tracking-tight">{activeMail.subject}</h4>
                    <span className="text-[9px] text-slate-500 mt-1 block font-mono">{activeMail.timestamp}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleMoveToTrash(activeMail.id)}
                      className="p-2.5 bg-slate-900 hover:bg-rose-950/30 hover:border-rose-800/50 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 transition"
                      title="Move to Trash"
                    >
                      <Trash size={14}/>
                    </button>
                  </div>
                </div>

                {/* 🎫 TICKET CONFIGURATOR BAR */}
                <div className="bg-slate-950/60 p-4 border-b border-slate-850 flex flex-wrap gap-4 items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticket ID:</span>
                    <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded shadow-inner">
                      {activeMail.ticketId ? `#${activeMail.ticketId}` : "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Status Selector */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                      <select
                        value={activeMail.status || "open"}
                        onChange={(e) => handleStatusChange(activeMail.id, e.target.value)}
                        className="bg-transparent border-none text-xs font-black outline-none cursor-pointer text-slate-200 focus:text-indigo-400"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Priority Selector */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
                      <select
                        value={activeMail.priority || "medium"}
                        onChange={(e) => handlePriorityChange(activeMail.id, e.target.value)}
                        className="bg-transparent border-none text-xs font-black outline-none cursor-pointer text-slate-200 focus:text-indigo-400"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
                  {/* SENDER BLOCK */}
                  <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm uppercase">
                      {activeMail.senderName.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white text-xs font-black">{activeMail.senderName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">&lt;{activeMail.senderEmail}&gt;</p>
                    </div>
                  </div>

                  {/* BODY VIEW */}
                  <div className="text-xs leading-relaxed text-slate-300 font-semibold whitespace-pre-line px-2 font-sans select-text">
                    {activeMail.body}
                  </div>
                </div>

                {/* REPLY ACTIONS FOOTER */}
                <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <ShieldCheck size={13} className="text-emerald-400"/> Mail integrity certified
                  </span>
                  
                  <button 
                    onClick={() => {
                      setComposeTo(activeMail.senderEmail);
                      setComposeSubject(`Re: ${activeMail.subject}`);
                      setComposeBody(`\n\n\n----- Original Message -----\nFrom: ${activeMail.senderEmail}\n${activeMail.body}`);
                      setReplyingTicketId(activeMail.ticketId);
                      setIsComposing(true);
                    }}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-800 transition"
                  >
                    <Reply size={13}/> Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 gap-4">
                <div className="w-16 h-16 bg-slate-950/60 rounded-[1.5rem] flex items-center justify-center text-slate-500 shadow-inner">
                  <Mail size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-300">Select Correspondence</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Select a mail ledger row item from the directory to review contents</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Email;
