import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import { 
  Settings, User, Lock, Store, ToggleLeft, ToggleRight, Save, 
  HelpCircle, ShieldCheck, Mail, Database, Bell, RefreshCw 
} from "lucide-react";
import { updateAdminProfile, updateAdminPassword } from "../store/slices/authSlice";
import { toast } from "react-hot-toast";

const Setting = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  // Tab controller state
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form States
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Store Configuration States (persisted in localStorage)
  const [storeCurrency, setStoreCurrency] = useState("INR");
  const [shippingFee, setShippingFee] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [lowStockLimit, setLowStockLimit] = useState(5);

  // Toggle Switches States
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enableWebhooks, setEnableWebhooks] = useState(true);
  const [autoSyncInterval, setAutoSyncInterval] = useState(30);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Populate user inputs on mount
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setAvatarUrl(user.avatar?.url || "");
    }
  }, [user]);

  // Load store configurations on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("store_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.currency) setStoreCurrency(parsed.currency);
        if (parsed.shippingFee !== undefined) setShippingFee(Number(parsed.shippingFee));
        if (parsed.taxRate !== undefined) setTaxRate(Number(parsed.taxRate));
        if (parsed.lowStockLimit !== undefined) setLowStockLimit(Number(parsed.lowStockLimit));
      } catch (e) {
        // Fallback to default state
      }
    }
  }, []);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Spec name cannot be empty.");
      return;
    }
    const updatePayload = {
      name: profileName.trim(),
      email: profileEmail.trim(),
    };
    if (avatarUrl.trim()) {
      updatePayload.avatar = avatarUrl.trim(); // Simulating custom avatar url string
    }
    dispatch(updateAdminProfile(updatePayload));
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all credential fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Confirm password mismatch.");
      return;
    }
    dispatch(updateAdminPassword({ oldPassword: currentPassword, newPassword }));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveStoreConfig = (e) => {
    e.preventDefault();
    const config = {
      currency: storeCurrency,
      shippingFee: Number(shippingFee),
      taxRate: Number(taxRate),
      lowStockLimit: Number(lowStockLimit)
    };
    localStorage.setItem("store_config", JSON.stringify(config));
    toast.success("Store configurations synchronized locally!");
  };

  const handleToggleOption = (key) => {
    if (key === "maintenance") {
      setMaintenanceMode(!maintenanceMode);
      toast.success(maintenanceMode ? "Maintenance mode disengaged!" : "Maintenance mode bypass active!");
    } else if (key === "webhooks") {
      setEnableWebhooks(!enableWebhooks);
      toast.success(enableWebhooks ? "Webhook dispatchers paused." : "Webhook dispatchers activated.");
    } else if (key === "email") {
      setEmailAlerts(!emailAlerts);
      toast.success(emailAlerts ? "Email alert notifications disabled." : "Email alert notifications enabled.");
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
              <Settings size={11} className="text-indigo-400 animate-pulse" /> Configuration Command
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Settings & Control Center<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Modify currency metrics, sync tax parameters, control administrative profiles, and manage system switchboards.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-4 py-2.5 rounded-2xl">
            <ShieldCheck size={13} className="text-indigo-400 animate-pulse" /> Engine Mode: Production
          </div>
        </div>

        {/* 🛠️ TAB NAVIGATION */}
        <div className="flex items-center gap-2 bg-slate-900/30 p-2 rounded-2xl border border-slate-800/60 w-max max-w-full overflow-x-auto no-scrollbar">
          {[
            { id: "profile", label: "Profile Specification", icon: <User size={13} /> },
            { id: "security", label: "Security & Credentials", icon: <Lock size={13} /> },
            { id: "store", label: "Global Store Config", icon: <Store size={13} /> },
            { id: "system", label: "System Switchboard", icon: <Database size={13} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                activeTab === tab.id
                  ? "bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200 bg-transparent border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 💡 WORKSPACE */}
        <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl w-full box-border">
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-xl">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <User size={15} className="text-indigo-400"/> Profile Specification
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">Change your identity specs visible inside the Control Hub sidebar</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Username</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Node Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avatar Image URL Source</label>
                  <input
                    type="text"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-lg border border-indigo-500/20 transition disabled:opacity-50"
                >
                  <Save size={13}/> {loading ? "Saving Specs..." : "Sync Profile Settings"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 max-w-xl">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Lock size={15} className="text-indigo-400"/> Change Security Access Credentials
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">Change your password bypass keys to enforce strict account privacy</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Access Code</label>
                  <input
                    type="password"
                    placeholder="Enter current password..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Security Access Code</label>
                  <input
                    type="password"
                    placeholder="Enter new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm New Access Code</label>
                  <input
                    type="password"
                    placeholder="Re-enter new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-lg border border-indigo-500/20 transition disabled:opacity-50"
                >
                  <Lock size={13}/> {loading ? "Updating..." : "Commit Access Code Update"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "store" && (
            <div className="space-y-6 max-w-xl">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Store size={15} className="text-indigo-400"/> Global Store Configuration
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">Sync parameters like currency systems and global tax algorithms</p>
              </div>

              <form onSubmit={handleSaveStoreConfig} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Store Currency Mode</label>
                  <select
                    value={storeCurrency}
                    onChange={(e) => setStoreCurrency(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  >
                    <option value="INR">Indian Rupee (INR ₹)</option>
                    <option value="USD">United States Dollar (USD $)</option>
                    <option value="EUR">Euro (EUR €)</option>
                    <option value="GBP">British Pound (GBP £)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Delivery/Shipping Charge</label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global CGST/SGST Tax Percentage (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catalog Low Inventory Warning Alert Limit</label>
                  <input
                    type="number"
                    value={lowStockLimit}
                    onChange={(e) => setLowStockLimit(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-lg border border-indigo-500/20 transition"
                >
                  <Save size={13}/> Sync Store Parameters
                </button>
              </form>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6 max-w-xl">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Database size={15} className="text-indigo-400"/> System Switchboard
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">Control system triggers and automatic caching daemons</p>
              </div>

              <div className="space-y-4">
                
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
                  <div>
                    <h4 className="text-white text-xs font-black">Maintenance Mode Bypass</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Temporarily block customer client transactions</p>
                  </div>
                  <button onClick={() => handleToggleOption("maintenance")} className="text-indigo-500 transition">
                    {maintenanceMode ? <ToggleRight size={38} className="text-indigo-500" /> : <ToggleLeft size={38} className="text-slate-600" />}
                  </button>
                </div>

                {/* Webhook Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
                  <div>
                    <h4 className="text-white text-xs font-black">Webhook Notification Dispatchers</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Send immediate JSON order payloads to slack channels</p>
                  </div>
                  <button onClick={() => handleToggleOption("webhooks")} className="text-indigo-500 transition">
                    {enableWebhooks ? <ToggleRight size={38} className="text-indigo-500" /> : <ToggleLeft size={38} className="text-slate-600" />}
                  </button>
                </div>

                {/* Email System Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
                  <div>
                    <h4 className="text-white text-xs font-black">Email Alert Dispatches</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Send admin emails on new user registrations</p>
                  </div>
                  <button onClick={() => handleToggleOption("email")} className="text-indigo-500 transition">
                    {emailAlerts ? <ToggleRight size={38} className="text-indigo-500" /> : <ToggleLeft size={38} className="text-slate-600" />}
                  </button>
                </div>

                {/* Auto Refresh Scheduler */}
                <div className="flex flex-col gap-2 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-xs">
                  <h4 className="text-white text-xs font-black">Real-time Stats Polling Cycle</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Duration frequency (in seconds) for dashboard re-validation</p>
                  <div className="flex items-center gap-3 mt-1">
                    {[10, 30, 60].map(s => (
                      <button
                        key={s}
                        onClick={() => { setAutoSyncInterval(s); toast.success(`Polling frequency set to ${s}s`); }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition ${
                          autoSyncInterval === s 
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        {s} Seconds
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Setting;
