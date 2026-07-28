import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import { 
  KeyRound, ShieldCheck, RefreshCw, Copy, Users, Lock, 
  Terminal, ShieldAlert, Cpu, ToggleLeft, ToggleRight, Check
} from "lucide-react";
import { fetchAllUsers } from "../store/slices/adminSlice";
import { toast } from "react-hot-toast";

const Authentication = () => {
  const dispatch = useDispatch();
  const { users = [], loading } = useSelector((state) => state.admin || {});
  
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Security Toggles
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [passPolicy, setPassPolicy] = useState("Strict");
  const [sessionLimit, setSessionLimit] = useState(3);

  useEffect(() => {
    dispatch(fetchAllUsers(1));
  }, [dispatch]);

  const resetTargetUser = useMemo(() => {
    return users.find(u => u.email === selectedUserEmail) || null;
  }, [users, selectedUserEmail]);

  const handleGenerateResetLink = () => {
    if (!selectedUserEmail) {
      toast.error("Please select a target user.");
      return;
    }

    const mockToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const origin = window.location.origin;
    const resetUrl = `${origin}/password/reset/${mockToken}`;
    
    setGeneratedLink(resetUrl);
    setCopied(false);
    toast.success("Security token hash generated!");
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
  };

  // Mock sessions list
  const activeSessions = [
    { ip: "192.168.1.42", browser: "Chrome / macOS", location: "IN-WEST (Mumbai)", status: "Active", time: "Logged in: 3 hours ago" },
    { ip: "103.88.94.201", browser: "Firefox / Android", location: "IN-NORTH (Delhi)", status: "Idle", time: "Logged in: 2 days ago" },
    { ip: "45.22.109.11", browser: "Safari / iOS", location: "IN-WEST (Pune)", status: "Active", time: "Logged in: 45 minutes ago" }
  ];

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
              <Lock size={11} className="text-indigo-400 animate-pulse" /> Security Protocol Console
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Auth Control Room<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Inspect user session tokens, manage MFA policies, and generate direct reset credentials.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-4 py-2.5 rounded-2xl">
            <ShieldCheck size={13} className="text-emerald-400 animate-pulse" /> Shield Status: Active
          </div>
        </div>

        {/* 🛠️ AUTH & SECURITY CONTROL PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full box-border">
          
          {/* LEFT: RESET TOKEN GENERATOR (5 Columns) */}
          <div className="lg:col-span-5 bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <KeyRound size={15} className="text-indigo-400"/> Password Reset Generator
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">Generate direct bypass URL hashes for database users</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select DB User</label>
                <select
                  value={selectedUserEmail}
                  onChange={(e) => { setSelectedUserEmail(e.target.value); setGeneratedLink(""); }}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                >
                  <option value="">Choose User Contact...</option>
                  {users.map(u => (
                    <option key={u.id || u._id} value={u.email}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {resetTargetUser && (
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Name Spec:</span>
                    <span className="text-white">{resetTargetUser.name}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>User Role:</span>
                    <span className="text-indigo-400 uppercase tracking-wider text-[10px]">{resetTargetUser.role}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Email Node:</span>
                    <span className="text-white font-mono">{resetTargetUser.email}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateResetLink}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-lg border border-indigo-500/20 active:scale-95 transition"
              >
                <RefreshCw size={13}/> Generate Reset URL Node
              </button>

              {generatedLink && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Hash Token Bypass Link</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 w-full max-w-full overflow-hidden">
                    <span className="text-[10px] font-mono text-slate-400 truncate flex-1 leading-relaxed select-all">
                      {generatedLink}
                    </span>
                    <button 
                      onClick={handleCopyLink}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition"
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13}/>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: POLICY SETTINGS & SESSIONS (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* POLICY SETTINGS */}
            <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-5">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={15} className="text-indigo-400"/> Authentication Policies
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MFA POLICY */}
                <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
                  <div>
                    <h4 className="text-white text-xs font-black">2-Factor Authentication (MFA)</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Force verification tokens on logins</p>
                  </div>
                  <button onClick={() => setMfaEnabled(!mfaEnabled)} className="text-indigo-500 hover:text-indigo-400 transition">
                    {mfaEnabled ? <ToggleRight size={38} className="text-indigo-500" /> : <ToggleLeft size={38} className="text-slate-600" />}
                  </button>
                </div>

                {/* PASSWORD STRENGTH */}
                <div className="flex flex-col gap-2 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-xs">
                  <h4 className="text-white text-xs font-black">Password Policy Strength</h4>
                  <div className="flex gap-2 mt-1">
                    {["Standard", "Strict", "Custom"].map(p => (
                      <button
                        key={p}
                        onClick={() => setPassPolicy(p)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition ${
                          passPolicy === p 
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SESSIONS MANAGER */}
            <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu size={15} className="text-indigo-400"/> Active Session Directory
              </h3>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[9px] uppercase tracking-widest text-slate-500 font-black">
                      <th className="px-4 py-3">IP Address</th>
                      <th className="px-4 py-3">Browser / Platform</th>
                      <th className="px-4 py-3">Location Region</th>
                      <th className="px-4 py-3 text-center">Status Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium text-xs">
                    {activeSessions.map((session, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/30 transition duration-200">
                        <td className="px-4 py-3.5 font-mono text-indigo-400 font-bold">{session.ip}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-extrabold text-white text-xs">{session.browser}</p>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{session.time}</span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-400">{session.location}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-lg border font-black text-[8px] uppercase tracking-wider ${
                            session.status === "Active"
                              ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-400"
                              : "bg-amber-950/60 border-amber-800/50 text-amber-400"
                          }`}>
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default Authentication;
