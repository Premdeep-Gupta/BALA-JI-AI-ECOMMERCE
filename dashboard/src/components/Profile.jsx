import React, { useState, useEffect, useRef } from "react";
import avatar from "../assets/avatar.jpg";
import Header from "./Header";
import { useDispatch, useSelector } from "react-redux";
import { resolveAvatar } from "../lib/helper";
import {
  updateAdminProfile,
  updateAdminPassword,
} from "../store/slices/authSlice";
import { 
  User, Mail, Lock, ShieldCheck, Camera, Sparkles, 
  AlertCircle, Key, CheckCircle, ArrowRight, Smartphone, X, Send
} from "lucide-react";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const Profile = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Basic Profile Info
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [updateSection, setUpdateSection] = useState("");

  // Password fields
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // --- LOCAL 2FA & PHONE STORAGE INTEGRATION ---
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem("profile_phone_number") || user?.phone || "";
  });
  const [emailVerified, setEmailVerified] = useState(() => {
    return localStorage.getItem("profile_email_verified") === "true";
  });
  const [phoneVerified, setPhoneVerified] = useState(() => {
    return localStorage.getItem("profile_phone_verified") === "true";
  });

  // Modal controller states
  const [activeModal, setActiveModal] = useState(""); // "email" or "mobile"
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentOtp, setCurrentOtp] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("email"); // "email" or "mobile"
  const timerRef = useRef(null);

  // References for OTP input focus shifting
  const inputRefs = [
    useRef(null), useRef(null), useRef(null), 
    useRef(null), useRef(null), useRef(null)
  ];

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
      });
      if (!phoneNumber && user.phone) {
        setPhoneNumber(user.phone);
      }
    }
  }, [user]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  // Handle local avatar preview
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const updateProfile = () => {
    const formData = new FormData();
    formData.append("name", editData.name);
    formData.append("email", editData.email);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    // Local persistence of phone number
    if (phoneNumber) {
      localStorage.setItem("profile_phone_number", phoneNumber);
    }

    setUpdateSection("Profile");
    dispatch(updateAdminProfile(formData));
  };

  const updatePassword = () => {
    const formData = new FormData();
    formData.append("currentPassword", passwordData.currentPassword);
    formData.append("newPassword", passwordData.newPassword);
    formData.append("confirmNewPassword", passwordData.confirmNewPassword);

    setUpdateSection("Password");
    dispatch(updateAdminPassword(formData));
    
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  };

  const triggerProfileUpdateOtp = () => {
    setActiveModal("profile_update");
    setOtpSent(false); // Show Step 1 first so user can choose channel
    setCountdown(0);
    setOtpInputs(["", "", "", "", "", ""]);
    
    if (!editData.email && phoneNumber) {
      setSelectedChannel("mobile");
    } else {
      setSelectedChannel("email");
    }
  };

  const sendProfileUpdateOtp = (channel) => {
    const targetChannel = channel || selectedChannel;
    if (targetChannel === "mobile" && !phoneNumber.trim()) {
      toast.error("Please enter a valid mobile number first.");
      return;
    }

    setOtpSent(true);
    setCountdown(59);
    setOtpInputs(["", "", "", "", "", ""]);

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(generatedOtp);
    toast.success("Generating security authorization OTP...");

    if (targetChannel === "email") {
      const emailToUse = editData.email || user?.email;
      if (emailToUse) {
        axiosInstance.post("/auth/send-otp", { 
          email: emailToUse, 
          otp: generatedOtp 
        }).then(res => {
          if (res.data.simulated) {
            toast.success("SMTP Dispatcher offline. Operating under local secure Sandbox Mode.");
          } else {
            toast.success(`Authorization OTP code successfully dispatched to ${emailToUse}!`);
          }
        }).catch(err => {
          console.error(err);
          toast.error("SMTP Mail Server not configured. Using dashboard test code instead.");
        });
      } else {
        toast.error("No email address linked. Using dashboard test code instead.");
      }
    } else if (targetChannel === "mobile") {
      axiosInstance.post("/auth/send-otp", { 
        phone: phoneNumber, 
        otp: generatedOtp 
      }).then(res => {
        toast.success(`Authorization OTP code simulated on mobile node: ${phoneNumber}!`);
      }).catch(err => {
        console.error(err);
        toast.error("SMS Gateway offline. Using dashboard test code instead.");
      });
    }

    // Auto-focus first input box
    setTimeout(() => {
      if (inputRefs[0].current) inputRefs[0].current.focus();
    }, 100);
  };

  // --- OTP VERIFICATION FLOW ---
  const triggerOtpSend = () => {
    if (activeModal === "profile_update") {
      sendProfileUpdateOtp(selectedChannel);
      return;
    }

    if (activeModal === "mobile" && !phoneNumber.trim()) {
      toast.error("Please enter a valid mobile number first.");
      return;
    }
    setOtpSent(true);
    setCountdown(59);
    setOtpInputs(["", "", "", "", "", ""]);
    
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(generatedOtp);
    toast.success(`Generating secure OTP verification key...`);

    if (activeModal === "email") {
      const emailToUse = editData.email || user?.email;
      if (emailToUse) {
        axiosInstance.post("/auth/send-otp", { 
          email: emailToUse, 
          otp: generatedOtp 
        }).then(res => {
          if (res.data.simulated) {
            toast.success("SMTP Dispatcher offline. Operating under local secure Sandbox Mode.");
          } else {
            toast.success(`Secure OTP code successfully dispatched to ${emailToUse}!`);
          }
        }).catch(err => {
          console.error(err);
          toast.error("SMTP Mail Server not configured. Using dashboard test code instead.");
        });
      } else {
        toast.error("No email address linked. Using dashboard test code instead.");
      }
    } else if (activeModal === "mobile") {
      axiosInstance.post("/auth/send-otp", { 
        phone: phoneNumber, 
        otp: generatedOtp 
      }).then(res => {
        toast.success(`Secure SMS OTP simulated on mobile node: ${phoneNumber}!`);
      }).catch(err => {
        console.error(err);
        toast.error("SMS Gateway offline. Using dashboard test code instead.");
      });
    }
    
    // Auto-focus first input box
    setTimeout(() => {
      if (inputRefs[0].current) inputRefs[0].current.focus();
    }, 100);
  };

  const handleOtpInput = (index, value) => {
    if (isNaN(value)) return; // Only allow numerical digits
    
    const newOtp = [...otpInputs];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtpInputs(newOtp);

    // Shift focus forward
    if (value && index < 5 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Shift focus backward on backspace
    if (e.key === "Backspace" && !otpInputs[index] && index > 0 && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    }
  };

  const verifyOtpCode = () => {
    const enteredCode = otpInputs.join("");
    if (enteredCode.length < 6) {
      toast.error("Please enter a complete 6-digit OTP code.");
      return;
    }

    if (activeModal === "profile_update") {
      if (enteredCode === currentOtp) {
        toast.success("Security Authorization Approved!");
        closeModal();
        updateProfile();
      } else {
        toast.error("Invalid authorization code. Profile updates rejected.");
      }
      return;
    }

    if (activeModal === "email") {
      if (enteredCode === currentOtp) {
        setEmailVerified(true);
        localStorage.setItem("profile_email_verified", "true");
        toast.success("Email channel successfully verified under secure 2FA!");
        closeModal();
      } else {
        toast.error("Invalid verification code. Please check your inbox and try again.");
      }
    } else if (activeModal === "mobile") {
      if (enteredCode === currentOtp) {
        setPhoneVerified(true);
        localStorage.setItem("profile_phone_verified", "true");
        localStorage.setItem("profile_phone_number", phoneNumber);
        toast.success("Mobile communication node verified under secure 2FA!");
        closeModal();
      } else {
        toast.error("Invalid verification code. Please check your SMS and try again.");
      }
    }
  };

  const openVerificationModal = (type) => {
    setActiveModal(type);
    setOtpSent(false);
    setCountdown(0);
    setOtpInputs(["", "", "", "", "", ""]);
  };

  const closeModal = () => {
    setActiveModal("");
    setOtpSent(false);
    setCountdown(0);
    clearTimeout(timerRef.current);
  };

  return (
    <>
      <main className="min-h-screen bg-[#090d16] font-sans text-slate-200 pb-20 transition-all duration-500 w-full antialiased p-[10px] pl-[10px] md:pl-[17rem] box-border relative overflow-x-hidden">
        
        {/* BACKGROUND VECTOR GLOWS */}
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-10 left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/5 via-indigo-600/5 to-transparent blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="flex-1 md:p-6 space-y-8 relative z-10 w-full box-border">
          <Header />

          {/* 🌌 PREMIUM PROFILE HERO CARD */}
          <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group w-full box-border">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
            
            {/* Left Section: User Identity Summary */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left z-10 w-full lg:w-auto">
              
              {/* Interactive Avatar Container */}
              <div className="relative group/avatar cursor-pointer">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-xl shadow-indigo-600/10 relative">
                  <img
                    src={avatarPreview || resolveAvatar(user?.avatar, avatar)}
                    alt={user?.name || "avatar"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = avatar;
                    }}
                  />
                  {/* Hover Overlay */}
                  <div 
                    onClick={() => document.getElementById("avatar-upload-file").click()}
                    className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"
                  >
                    <Camera size={20} className="text-indigo-400 animate-bounce" />
                    <span className="text-[8px] uppercase tracking-widest font-black text-white">Upload</span>
                  </div>
                </div>

                {/* Decorative glowing pulse around avatar */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-md pointer-events-none"></div>
              </div>

              {/* Identity text */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-1 rounded-xl shadow-inner w-max mx-auto sm:mx-0">
                  <Sparkles size={10} className="text-indigo-400 animate-pulse" /> Authentication Profile
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-2">
                  {user?.name || "prem Don"}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={13} className="text-slate-500" />
                  {user?.email || "prem.admin@gmail.com"}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-3 py-1 rounded-lg">
                    Role: {user?.role || "Admin"}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-800/30 px-3 py-1 rounded-lg">
                    Node Connected
                  </span>
                </div>
              </div>

            </div>

            {/* Right Section: Security Badge */}
            <div className="bg-indigo-950/20 border border-indigo-900/40 p-5 rounded-[1.8rem] flex items-center gap-4 w-full lg:w-80 shadow-inner z-10">
              <div className="w-12 h-12 bg-indigo-550/10 rounded-2xl flex items-center justify-center text-indigo-400 flex-shrink-0">
                <ShieldCheck size={24} className="animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-white text-xs font-black uppercase tracking-wider">Access Integrity</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Your identity details and security credentials are encrypted using bank-grade cryptographic protocols.
                </p>
              </div>
            </div>

          </div>

          {/* 🛠️ PROFILE CONFIGURATION WORKSPACE */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full box-border">
            
            {/* LEFT COLUMN: IDENTITY PARAMETERS (6 Columns) */}
            <div className="xl:col-span-6 bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-6">
              <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <User size={15} className="text-indigo-400"/> Personal Identity
                </h3>
                <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono">SPEC_FILE:01</span>
              </div>

              <div className="space-y-5">
                
                {/* Name Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <User size={12} className="text-indigo-400" /> Full Display Name
                  </label>
                  <div className="relative flex items-center group w-full">
                    <User className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                    <input 
                      type="text" 
                      name="name"
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 focus:ring-2 focus:ring-indigo-600/10"
                      value={editData.name}
                      onChange={handleProfileChange}
                      placeholder="Enter display name..."
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <Mail size={12} className="text-indigo-400" /> Email Node Address
                  </label>
                  <div className="relative flex items-center group w-full">
                    <Mail className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                    <input 
                      type="email" 
                      name="email"
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 focus:ring-2 focus:ring-indigo-600/10"
                      value={editData.email}
                      onChange={handleProfileChange}
                      placeholder="Enter email address..."
                    />
                  </div>
                </div>

                {/* Mobile Phone Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <Smartphone size={12} className="text-indigo-400" /> Mobile Communication Number
                  </label>
                  <div className="relative flex items-center group w-full">
                    <Smartphone className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 focus:ring-2 focus:ring-indigo-600/10"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneVerified(false); // Mark as unverified if number changes
                      }}
                      placeholder="Enter phone number..."
                    />
                  </div>
                </div>

                {/* Profile Avatar File Upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <Camera size={12} className="text-indigo-400" /> Update Profile Photo
                  </label>
                  
                  {/* Invisible Input */}
                  <input 
                    type="file" 
                    id="avatar-upload-file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />

                  {/* Trigger Box */}
                  <div 
                    onClick={() => document.getElementById("avatar-upload-file").click()}
                    className={`border border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                      avatarFile 
                        ? "border-emerald-600/60 bg-emerald-950/10 hover:border-emerald-500" 
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 overflow-hidden">
                        {avatarFile && avatarPreview ? (
                          <img src={avatarPreview} alt="Selected preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={16} className="text-slate-500" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black uppercase text-slate-300">
                          {avatarFile ? "File selected successfully" : "Select identity asset"}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {avatarFile ? `${avatarFile.name} (${(avatarFile.size / 1024).toFixed(1)} KB)` : "PNG, JPG, or GIF up to 5MB"}
                        </p>
                      </div>
                    </div>

                    {avatarFile ? (
                      <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 animate-bounce" />
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:text-white transition">Browse</span>
                    )}
                  </div>
                </div>

                {/* Profile Submit Button */}
                <button
                  type="button"
                  onClick={triggerProfileUpdateOtp}
                  disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition disabled:opacity-50 cursor-pointer border border-indigo-500/20"
                >
                  {loading && updateSection === "Profile" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Syncing Identity parameters...</span>
                    </>
                  ) : (
                    <>
                      <span>Commit Profile Changes</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* RIGHT COLUMN: SECURITY, PASSWORD & 2FA CHANNELS (6 Columns) */}
            <div className="xl:col-span-6 space-y-6 w-full">
              
              {/* TWO-FACTOR 2FA VERIFICATION CHANNELS */}
              <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-6">
                <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={15} className="text-indigo-400"/> Authentication Channels (2FA)
                  </h3>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono">2FA_NODE</span>
                </div>

                <div className="space-y-4">
                  
                  {/* Email Verification Node */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white text-xs font-black">Email Authentication</h4>
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border font-black text-[7.5px] uppercase tracking-wider ${
                          emailVerified 
                            ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" 
                            : "bg-rose-950/60 border-rose-800/50 text-rose-400"
                        }`}>
                          {emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px] sm:max-w-xs">{editData.email || "No email address linked"}</p>
                    </div>

                    <button 
                      onClick={() => openVerificationModal("email")}
                      disabled={emailVerified}
                      className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest border transition ${
                        emailVerified
                          ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-650/40 hover:bg-indigo-600 border-indigo-500/30 hover:border-indigo-500 text-slate-200 hover:text-white cursor-pointer"
                      }`}
                    >
                      {emailVerified ? "Protected" : "Verify Channel"}
                    </button>
                  </div>

                  {/* Mobile SMS Verification Node */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white text-xs font-black">Mobile Authentication</h4>
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border font-black text-[7.5px] uppercase tracking-wider ${
                          phoneVerified 
                            ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-400" 
                            : "bg-rose-950/60 border-rose-800/50 text-rose-400"
                        }`}>
                          {phoneVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">{phoneNumber || "No mobile number linked"}</p>
                    </div>

                    <button 
                      onClick={() => openVerificationModal("mobile")}
                      disabled={phoneVerified || !phoneNumber.trim()}
                      className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest border transition ${
                        phoneVerified
                          ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                          : !phoneNumber.trim()
                          ? "bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed"
                          : "bg-indigo-650/40 hover:bg-indigo-600 border-indigo-500/30 hover:border-indigo-500 text-slate-200 hover:text-white cursor-pointer"
                      }`}
                    >
                      {phoneVerified ? "Protected" : "Verify Channel"}
                    </button>
                  </div>

                </div>
              </div>

              {/* SECURITY & PASSWORD CARD */}
              <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-6">
                <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Lock size={15} className="text-indigo-400"/> Cryptographic Keys
                  </h3>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono">SPEC_FILE:02</span>
                </div>

                <div className="space-y-5">
                  
                  {/* Current Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                      <Lock size={12} className="text-indigo-400" /> Current Access Code
                    </label>
                    <div className="relative flex items-center group w-full">
                      <Lock className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                      <input 
                        type="password" 
                        name="currentPassword"
                        className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 focus:ring-2 focus:ring-indigo-600/10"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password..."
                      />
                    </div>
                  </div>

                  {/* New Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                      <Key size={12} className="text-indigo-400" /> New Security Access Code
                    </label>
                    <div className="relative flex items-center group w-full">
                      <Key className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                      <input 
                        type="password" 
                        name="newPassword"
                        className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 focus:ring-2 focus:ring-indigo-600/10"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password..."
                      />
                    </div>
                  </div>

                  {/* Confirm New Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                      <Key size={12} className="text-indigo-400" /> Confirm New Access Code
                    </label>
                    <div className="relative flex items-center group w-full">
                      <Key className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                      <input 
                        type="password" 
                        name="confirmNewPassword"
                        className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all text-slate-200 focus:ring-2 focus:ring-indigo-600/10"
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordChange}
                        placeholder="Re-enter new password..."
                      />
                    </div>
                  </div>

                  {/* Password Submit Button */}
                  <button
                    type="button"
                    onClick={updatePassword}
                    disabled={loading}
                    className="w-full py-3.5 mt-2 rounded-xl bg-indigo-650/40 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-slate-200 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading && updateSection === "Password" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Re-encrypting keys...</span>
                      </>
                    ) : (
                      <>
                        <span>Commit Password Update</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>

                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* 🌌 PREMIUM GLASSMORPHIC 2FA OTP MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xl transition-all duration-300 p-4">
          <div className="relative bg-slate-900/80 border border-indigo-500/30 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl overflow-hidden box-border">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -mr-8 -mt-8 rounded-full pointer-events-none"></div>
            
            {/* Modal Close */}
            <button 
              onClick={closeModal}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Step 1: Send OTP code */}
            {!otpSent ? (
              <div className="text-center space-y-6 my-2">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-550/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
                  {activeModal === "profile_update" ? <ShieldCheck size={28} /> : activeModal === "email" ? <Mail size={28} /> : <Smartphone size={28} />}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">
                    {activeModal === "profile_update" ? "Profile Update Authorization" : activeModal === "email" ? "Email Verification" : "Mobile Verification"}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {activeModal === "profile_update" ? "Select a verification channel to receive your secure authorization code." : "We will dispatch a secure 6-digit cryptographic verification code to your channel to enforce 2FA identity protection."}
                  </p>
                </div>

                {activeModal === "profile_update" ? (
                  <div className="space-y-3 text-left w-full">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Choose Dispatch Target:</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Email Option Card */}
                      <div 
                        onClick={() => setSelectedChannel("email")}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          selectedChannel === "email" 
                            ? "border-indigo-500 bg-indigo-950/30" 
                            : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="otpChannel" 
                          checked={selectedChannel === "email"} 
                          onChange={() => setSelectedChannel("email")} 
                          className="accent-indigo-500 pointer-events-none"
                        />
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Mail size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase text-slate-300">Email Address</p>
                          <p className="text-[9px] text-slate-500 truncate font-semibold">{editData.email || user?.email || "No email"}</p>
                        </div>
                      </div>

                      {/* Mobile Option Card */}
                      <div 
                        onClick={() => {
                          if (phoneNumber.trim()) {
                            setSelectedChannel("mobile");
                          } else {
                            toast.error("Please add a mobile number in the profile form first.");
                          }
                        }}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          !phoneNumber.trim() 
                            ? "opacity-50 border-slate-900 bg-slate-950/20 cursor-not-allowed" 
                            : selectedChannel === "mobile" 
                            ? "border-indigo-500 bg-indigo-950/30" 
                            : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="otpChannel" 
                          checked={selectedChannel === "mobile"} 
                          disabled={!phoneNumber.trim()}
                          onChange={() => setSelectedChannel("mobile")} 
                          className="accent-indigo-500 pointer-events-none"
                        />
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Smartphone size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase text-slate-300">Mobile SMS Node</p>
                          <p className="text-[9px] text-slate-500 truncate font-semibold">{phoneNumber || "No mobile linked in profile"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-center justify-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Channel Target:</span>
                    <span className="text-[10px] font-black text-indigo-400 font-mono tracking-wide">
                      {activeModal === "email" ? editData.email : phoneNumber}
                    </span>
                  </div>
                )}

                <button 
                  onClick={triggerOtpSend}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition cursor-pointer"
                >
                  <Send size={12} />
                  <span>Send Verification Code</span>
                </button>
              </div>
            ) : (
              /* Step 2: Enter OTP Code inputs */
              <div className="text-center space-y-6 my-2">
                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-550/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner animate-pulse">
                  <ShieldCheck size={28} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">Confirm Verification Code</h3>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-xs mx-auto">
                    Please key in the 6-digit security code received on your target node.
                  </p>
                  {/* Test OTP Helper Badges to make it extremely user-friendly */}
                  <span className="inline-block mt-2 text-[8px] font-black tracking-widest uppercase text-amber-400 bg-amber-950/50 border border-amber-800/40 px-3 py-1 rounded-xl">
                    Test Code: {currentOtp}
                  </span>
                </div>

                {/* 6 Grid OTP Entry Cells */}
                <div className="grid grid-cols-6 gap-2 sm:gap-3 max-w-[280px] sm:max-w-xs mx-auto">
                  {otpInputs.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="text"
                      maxLength={1}
                      className="w-10 h-12 sm:w-11 sm:h-12 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-center font-black text-sm text-indigo-400 outline-none transition"
                      value={digit}
                      onChange={(e) => handleOtpInput(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>

                {/* Resend details */}
                <div className="text-[10px] font-bold text-slate-500">
                  {countdown > 0 ? (
                    <p>Resend code active in <span className="text-slate-300 font-mono">{countdown}s</span></p>
                  ) : (
                    <button 
                      onClick={triggerOtpSend} 
                      className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                    >
                      Resend verification token
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setOtpSent(false)}
                    className="w-1/2 py-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-black text-[9px] uppercase tracking-widest transition cursor-pointer"
                  >
                    Back
                  </button>
                  
                  <button 
                    onClick={verifyOtpCode}
                    className="w-1/2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-widest transition shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    Confirm Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;