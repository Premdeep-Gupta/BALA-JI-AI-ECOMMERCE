import { useEffect, useState } from "react";
import {
  X, LogOut, Upload, Loader2, Sparkles, Brain, Cpu, TrendingUp,
  User, Mail, KeyRound, Eye, EyeOff, ShieldCheck, ChevronRight,
  BarChart3, Tag, Star
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { toggleProfilePanel } from "../../store/slices/popupSlice";
import {
  updateProfile,
  updatePassword,
  logoutUser,
} from "../../store/slices/authSlice";

import { getAIRecommendationDetails, saveShoppingProfile } from "../../utils/shoppingBrain";

/* ─── tiny section-title component ─────────────────────────── */
const SectionTitle = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="p-1.5 rounded-lg"
      style={{ background: "var(--primary)", opacity: 0.85 }}>
      <Icon size={12} className="text-white" />
    </span>
    <p className="text-[10px] font-black uppercase tracking-widest"
      style={{ color: "var(--text)", opacity: 0.6 }}>
      {label}
    </p>
  </div>
);

/* ─── field wrapper ─────────────────────────────────────────── */
const Field = ({ icon: Icon, children }) => (
  <div className="relative">
    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
      style={{ color: "var(--primary)", opacity: 0.7 }}>
      <Icon size={14} />
    </span>
    {children}
  </div>
);

const ProfilePanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { authUser, isUpdatingProfile, isUpdatingPassword } = useSelector(
    (state) => state.auth
  );
  const { isProfilePanelOpen } = useSelector((state) => state.popup);

  const [activeTab, setActiveTab] = useState("profile"); // profile | security | ai
  const [form, setForm] = useState({ name: "", email: "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [aiDetails, setAiDetails] = useState({
    persona: "Savvy Explorer",
    topCategory: "All",
    pricePreference: "Premium",
    profile: { categories: {}, tags: {}, priceTier: "Premium" }
  });

  useEffect(() => {
    if (!isProfilePanelOpen) return;
    if (authUser) {
      setForm({ name: authUser?.name || "", email: authUser?.email || "" });
      setPreview(
        authUser?.avatar?.url ||
        authUser?.avatar ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      );
    }
    setAiDetails(getAIRecommendationDetails());
  }, [authUser, isProfilePanelOpen]);

  const handleClose = () => {
    setAvatar(null);
    setIsZoomed(false);
    dispatch(toggleProfilePanel());
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleProfileUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      if (avatar) formData.append("avatar", avatar);
      await dispatch(updateProfile(formData)).unwrap();
      toast.success("Profile updated");
      setAvatar(null);
    } catch (err) {
      toast.error(err || "Update failed");
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error("All fields required");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    const payload = {
      currentPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmNewPassword: passwordForm.confirmPassword,
    };
    await dispatch(updatePassword(payload));
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleUpdatePricePreference = (tier) => {
    const updated = { ...aiDetails.profile };
    updated.priceTier = tier;
    if (tier === "Budget") { updated.budgetScore = 15; updated.premiumScore = 0; }
    else if (tier === "Premium") { updated.premiumScore = 15; updated.budgetScore = 0; }
    else { updated.budgetScore = 5; updated.premiumScore = 5; }
    saveShoppingProfile(updated);
    setAiDetails(getAIRecommendationDetails());
    toast.success(`AI Price preference set to ${tier}!`);
  };

  const handleCategoryBoost = (cat) => {
    const updated = { ...aiDetails.profile };
    updated.categories = updated.categories || {};
    updated.categories[cat] = (updated.categories[cat] || 0) + 3;
    saveShoppingProfile(updated);
    setAiDetails(getAIRecommendationDetails());
    toast.info(`Boosted ${cat} category relevance in AI Brain!`);
  };

  const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "ai", label: "AI Brain", icon: Brain },
  ];

  const inputCls = `
    w-full pl-9 pr-10 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all
    border focus:ring-2 focus:ring-[var(--primary)]/30
  `;
  const inputStyle = {
    background: "color-mix(in srgb, var(--primary) 6%, transparent)",
    borderColor: "var(--border)",
    color: "var(--text)",
  };

  return (
    <AnimatePresence>
      {isProfilePanelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* PANEL */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="relative flex flex-col w-[480px] h-[520px] shadow-2xl rounded-[2.5rem] overflow-hidden border"
            style={{
              background: "color-mix(in srgb, var(--card) 98%, transparent)",
              borderColor: "var(--border)",
              color: "var(--text)",
              backdropFilter: "blur(24px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── TOP HERO CARD ────────────────────────────────── */}
            <div
              className="relative overflow-hidden shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 60%, var(--bg)) 100%)",
                paddingBottom: 0,
              }}
            >
              {/* decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute top-4 -right-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

              {/* close btn */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center justify-center pointer-events-auto"
              >
                <X size={16} className="text-white" />
              </button>

              <div className="px-6 pt-5 pb-4 flex items-end gap-4 relative z-10">
                {/* avatar */}
                <div className="relative">
                  <img
                    src={preview}
                    alt="avatar"
                    onClick={() => setIsZoomed(true)}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white/30 shadow-xl cursor-zoom-in hover:scale-105 transition"
                  />
                  <label
                    className="absolute -bottom-1 -right-1 p-1 rounded-md cursor-pointer shadow-lg transition hover:scale-105"
                    style={{ background: "var(--bg)", border: "1.5px solid var(--border)" }}
                    title="Change avatar"
                  >
                    <Upload size={10} style={{ color: "var(--primary)" }} />
                    <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                  </label>
                </div>

                {/* user info */}
                <div className="pb-0.5 flex-1 min-w-0">
                  <p className="font-black text-white text-sm leading-tight truncate">{form.name || "—"}</p>
                  <p className="text-white/70 text-[11px] mt-0.5 truncate">{form.email || "—"}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">Active Account</span>
                  </div>
                </div>
              </div>

              {/* TAB BAR */}
              <div className="flex px-6 gap-1 bg-black/10">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 ${
                      activeTab === id
                        ? "border-white text-white"
                        : "border-transparent text-white/50 hover:text-white/80"
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── BODY ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: "thin" }}>

              {/* ── TAB: PROFILE ─────────────────────── */}
              {activeTab === "profile" && (
                <div className="space-y-4">

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Orders", value: "—", color: "var(--primary)" },
                      { label: "Wishlist", value: "—", color: "#10b981" },
                      { label: "Reviews", value: "—", color: "#f59e0b" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl p-3 text-center"
                        style={{
                          background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text)", opacity: 0.55 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Edit Profile */}
                  <div
                    className="rounded-2xl p-4 space-y-3"
                    style={{ background: "color-mix(in srgb, var(--card) 60%, transparent)", border: "1px solid var(--border)" }}
                  >
                    <SectionTitle icon={User} label="Edit Profile Info" />

                    <Field icon={User}>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputCls}
                        style={inputStyle}
                        placeholder="Full Name"
                      />
                    </Field>

                    <Field icon={Mail}>
                      <input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputCls}
                        style={inputStyle}
                        placeholder="Email Address"
                        type="email"
                      />
                    </Field>

                    <button
                      onClick={handleProfileUpdate}
                      disabled={isUpdatingProfile}
                      className="w-full py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                      style={{ background: "var(--primary)" }}
                    >
                      {isUpdatingProfile ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <><ShieldCheck size={13} /> Save Changes</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB: SECURITY ────────────────────── */}
              {activeTab === "security" && (
                <div className="space-y-4">
                  <div
                    className="rounded-2xl p-4 space-y-3"
                    style={{ background: "color-mix(in srgb, var(--card) 60%, transparent)", border: "1px solid var(--border)" }}
                  >
                    <SectionTitle icon={KeyRound} label="Change Password" />

                    <Field icon={KeyRound}>
                      <input
                        type={showOldPass ? "text" : "password"}
                        placeholder="Current Password"
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        className={inputCls}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                      >
                        {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </Field>

                    <Field icon={KeyRound}>
                      <input
                        type={showNewPass ? "text" : "password"}
                        placeholder="New Password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className={inputCls}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                      >
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </Field>

                    <Field icon={KeyRound}>
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className={inputCls}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                      >
                        {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </Field>

                    <button
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}
                      className="w-full py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                      style={{ background: "var(--primary)" }}
                    >
                      {isUpdatingPassword ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <><ShieldCheck size={13} /> Update Password</>
                      )}
                    </button>
                  </div>

                  {/* Security tip */}
                  <div
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ background: "rgba(251, 113, 133, 0.08)", border: "1px solid rgba(251, 113, 133, 0.2)" }}
                  >
                    <ShieldCheck size={14} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] leading-relaxed" style={{ color: "var(--text)", opacity: 0.65 }}>
                      Use a strong password with at least 8 characters, including uppercase, numbers, and symbols.
                    </p>
                  </div>
                </div>
              )}

              {/* ── TAB: AI BRAIN ────────────────────── */}
              {activeTab === "ai" && (
                <div className="space-y-4">

                  {/* Persona card */}
                  <div
                    className="rounded-2xl p-4 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(168,85,247,0.08) 100%)",
                      border: "1px solid rgba(99,102,241,0.25)",
                    }}
                  >
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl" />

                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                        <Brain size={13} className="text-indigo-400" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text)" }}>
                        AI Shopping Persona <Sparkles size={10} className="text-indigo-400 animate-pulse" />
                      </h3>
                    </div>

                    {/* Persona name */}
                    <div
                      className="rounded-xl p-3 mb-3 text-center"
                      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text)", opacity: 0.4 }}>Your Personality</p>
                      <p className="text-sm font-black bg-gradient-to-r from-indigo-300 to-pink-400 bg-clip-text text-transparent">
                        {aiDetails.persona}
                      </p>
                      <p className="text-[9px] mt-1 font-semibold" style={{ color: "var(--text)", opacity: 0.55 }}>
                        Top Interest: <span className="text-indigo-400 font-bold">{aiDetails.topCategory}</span>
                      </p>
                    </div>

                    {/* Price tier */}
                    <div className="mb-3">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: "var(--text)", opacity: 0.5 }}>
                        <TrendingUp size={9} /> Preferred Price Tier
                      </p>
                      <div
                        className="grid grid-cols-3 gap-1 p-0.5 rounded-lg"
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        {["Budget", "MidRange", "Premium"].map((tier) => (
                          <button
                            key={tier}
                            onClick={() => handleUpdatePricePreference(tier)}
                            className={`py-1.5 rounded-md text-[9px] font-black uppercase tracking-wide transition active:scale-95 ${
                              aiDetails.pricePreference === tier
                                ? "bg-indigo-600 text-white shadow"
                                : "text-indigo-300 hover:text-white"
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category boosts */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: "var(--text)", opacity: 0.5 }}>
                        <Cpu size={9} /> Boost Category Weight
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Electronics", "Fashion", "Mobiles", "Home", "Shoes"].map((cat) => {
                          const count = aiDetails.profile.categories[cat] || 0;
                          return (
                            <button
                              key={cat}
                              onClick={() => handleCategoryBoost(cat)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold text-white transition active:scale-95 hover:bg-indigo-500/30"
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                            >
                              <Tag size={8} className="text-indigo-400" />
                              {cat}
                              <span className="font-mono text-indigo-400 font-black ml-0.5">+{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* AI stats */}
                  <div
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: "color-mix(in srgb, var(--card) 60%, transparent)", border: "1px solid var(--border)" }}
                  >
                    <BarChart3 size={20} className="text-indigo-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>AI Recommendation Engine</p>
                      <p className="text-[9px] mt-0.5" style={{ color: "var(--text)", opacity: 0.5 }}>
                        Tracks your browsing, clicks & purchases to personalise results.
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--primary)", opacity: 0.7 }} />
                  </div>
                </div>
              )}
            </div>

            {/* ── FOOTER LOGOUT ────────────────────────────────── */}
            <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => { dispatch(logoutUser()); handleClose(); navigate("/"); }}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition hover:opacity-90 active:scale-95 shadow-lg"
                style={{ background: "linear-gradient(135deg, #be123c, #9f1239)", color: "white" }}
              >
                <LogOut size={14} />
                Logout Account
              </button>
            </div>

            {/* ── ZOOM OVERLAY ─────────────────────────────────── */}
            <AnimatePresence>
              {isZoomed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsZoomed(false)}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-md cursor-zoom-out"
                >
                  <motion.img
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    src={preview}
                    alt="avatar zoom"
                    className="w-56 h-56 rounded-3xl object-cover shadow-2xl border-4 border-white/20"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePanel;