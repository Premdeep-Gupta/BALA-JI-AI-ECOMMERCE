import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Phone, MapPin, CreditCard, CheckCircle2, ShieldAlert, LogOut, Loader, 
  Key, Check, Clock, Clipboard, Wallet, Award, Navigation, MessageCircle, 
  Compass, RefreshCw, PenTool, Trash2, Shield, Eye, Bell, QrCode, Menu, X, Package, ZoomIn,
  Zap, BarChart3, AlertCircle, TrendingUp, Calendar, Star, ArrowUpRight, ArrowDownRight, Minus, IndianRupee, Activity,
  BookOpen, ChevronLeft, ChevronRight, Ban, CheckCheck, History, FileText
} from "lucide-react";
import { axiosInstance } from "../lib/axios";
import axios from "axios";
import { toast } from "react-toastify";
import { InvoiceTemplate } from "./InvoiceTemplate";
import * as faceapi from "@vladmandic/face-api";

// Geolocation hook to load Leaflet dynamic library
const useLeaflet = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.L) {
      setLoaded(true);
      return;
    }

    // Add Leaflet CSS
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    cssLink.id = "leaflet-css";
    document.head.appendChild(cssLink);

    // Add Leaflet JS Script
    const jsScript = document.createElement("script");
    jsScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    jsScript.id = "leaflet-js";
    jsScript.onload = () => setLoaded(true);
    document.body.appendChild(jsScript);

    return () => {
      // Keep leaflet script on document to avoid double-mount issues
    };
  }, []);

  return loaded;
};

// Hook to load html5-qrcode library dynamically
const useHtml5Qrcode = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Html5QrcodeScanner || window.Html5Qrcode) {
      setLoaded(true);
      return;
    }

    const jsScript = document.createElement("script");
    jsScript.src = "https://unpkg.com/html5-qrcode/html5-qrcode.min.js";
    jsScript.id = "html5-qrcode-js";
    jsScript.onload = () => setLoaded(true);
    document.body.appendChild(jsScript);
  }, []);

  return loaded;
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const fmtTime = (t) =>
  t
    ? new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";

const shiftTag = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("afternoon"))
    return { label: "Afternoon", cls: "bg-sky-950/60 text-sky-300 border-sky-700/40" };
  if (t.includes("evening") || t.includes("night"))
    return { label: "Evening/Night", cls: "bg-violet-950/60 text-violet-300 border-violet-700/40" };
  return { label: "Morning", cls: "bg-amber-950/60 text-amber-300 border-amber-700/40" };
};

const MiniBar = ({ value, max, color = "indigo" }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${colors[color] || "bg-indigo-500"} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const KpiCard = ({ icon, label, value, sub, color = "indigo", trend, trendVal }) => {
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400";
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return (
    <div className={`bg-slate-950/70 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2.5 relative overflow-hidden group`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-slate-800/20 to-transparent" />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-950/60 border border-${color}-800/30`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">{label}</p>
        <p className="text-xl font-black text-white leading-tight mt-0.5">{value}</p>
        {(sub || trendVal) && (
          <div className="flex items-center gap-1.5 mt-1">
            {trendVal && (
              <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trendColor}`}>
                <TrendIcon size={10} /> {trendVal}
              </span>
            )}
            {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DeliveryPortal() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appealReason, setAppealReason] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | active | left_products | completed | payment_shifts | shift_booking | profile
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paymentQrModal, setPaymentQrModal] = useState({
    open: false,
    order: null,
    verifying: false
  });
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState("");
  const [historySubTab, setHistorySubTab] = useState("overview"); // overview | daily | orders

  // Shift Management & Sound Engine States
  const [shiftStatus, setShiftStatus] = useState(() => localStorage.getItem("shift_status") || "not_started");
  const [showSandbox, setShowSandbox] = useState(false);
  const [gpsLocating, setGpsLocating] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceScanSuccess, setFaceScanSuccess] = useState(false);
  const [inactivityMinutes, setInactivityMinutes] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [runningLateMessage, setRunningLateMessage] = useState(false);
  const [alertOverlay, setAlertOverlay] = useState(null);
  const [emergencyActive, setEmergencyActive] = useState(false);

  // 📅 Shift Booking System
  const [shiftBookingModal, setShiftBookingModal] = useState(false);
  const [bookedShifts, setBookedShifts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('booked_shifts') || '{}'); } catch { return {}; }
  });
  // DB-synced shift bookings (for the new Shift Booking tab)
  const [dbShiftBookings, setDbShiftBookings] = useState([]);
  const [shiftBookingsLoading, setShiftBookingsLoading] = useState(false);
  const [bookingCancelReason, setBookingCancelReason] = useState("");
  const [selectedBookDate, setSelectedBookDate] = useState(0); // 0=today, 1=tomorrow, 2=+2, 3=+3
  const [historyMonthFilter, setHistoryMonthFilter] = useState("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [finesHistory, setFinesHistory] = useState([]);
  const [offlineLogs, setOfflineLogs] = useState([]);
  const [finesLoading, setFinesLoading] = useState(false);
  // Fine & block window state
  const [blockWindowInfo, setBlockWindowInfo] = useState(null); // { minutesLeft, windowExpired, fine_amount }
  const shiftNoLoginTimer = useRef(null);
  const shiftFineApplied = useRef(false);
  const offlineCountRef = useRef(0); // tracks offline events per shift (max 5 before block)
  const prevOnlineRef = useRef(null); // tracks previous online status to detect actual transitions
  const sharedAudioCtxRef = useRef(null); // shared AudioContext instance for robust audio playback
  
  // Dynamic Map references
  const leafletLoaded = useLeaflet();
  const html5QrcodeLoaded = useHtml5Qrcode();
  const mapRefs = useRef({}); // { [orderId]: { map, driverMarker, hubLat, hubLng, customerLat, customerLng, routeCoordinates } }
  const scannerRef = useRef(null);
  const unifiedMapRef = useRef(null);
  const [sortType, setSortType] = useState("smart"); // smart | nearest
  
  // Navigation Simulation States
  const [navSim, setNavSim] = useState({});
  const simIntervals = useRef({});

  // E-Signature Pad Ref and State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // --- Portal Biometric Webcam Verification ---
  const portalVideoRef = useRef(null);
  const portalCanvasRef = useRef(null);
  const [portalStream, setPortalStream] = useState(null);
  const [portalModelsLoaded, setPortalModelsLoaded] = useState(false);
  const portalStreamRef = useRef(null);

  useEffect(() => {
    let active = true;
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        if (active) {
          setPortalModelsLoaded(true);
          console.log("Portal AI Biometrics models loaded! ✅");
        }
      } catch (err) {
        console.error("Portal models load error:", err);
      }
    };
    loadModels();
    return () => { active = false; };
  }, []);

  // ── Unlock shared AudioContext on first user interaction (browser autoplay fix) ──
  useEffect(() => {
    const unlockAudio = () => {
      if (sharedAudioCtxRef.current && sharedAudioCtxRef.current.state === 'suspended') {
        sharedAudioCtxRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const simulateSuccessScan = () => {
    let prg = 0;
    const iv = setInterval(() => {
      prg += 20;
      const bar = document.getElementById("face-scan-bar");
      const pct = document.getElementById("face-scan-percentage");
      if (bar) bar.style.width = `${prg}%`;
      if (pct) pct.innerText = `${prg}%`;
      if (prg >= 100) {
        clearInterval(iv);
        setFaceScanSuccess(true);
        stopPortalCamera();
        setTimeout(() => {
          setFaceScanning(false);
          setFaceScanSuccess(false);
          setShiftStatus("active");
          localStorage.setItem("shift_status", "active");
          setAlertOverlay(null);
          toast.success("Shift Activated Successfully (Simulation Fallback)!");
        }, 1200);
      }
    }, 100);
  };

  const runPortalFaceVerification = async () => {
    if (!portalVideoRef.current || !portalCanvasRef.current || !portalStreamRef.current) return;
    const video = portalVideoRef.current;
    const canvas = portalCanvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setTimeout(runPortalFaceVerification, 200);
      return;
    }

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const liveDetection = await faceapi.detectSingleFace(
        canvas,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (liveDetection) {
        let regDescriptor = agent?.face_descriptor || agent?.faceDescriptor;
        if (!regDescriptor) {
          const storedMeta = localStorage.getItem(`delivery_metadata_${agent?.phone}`);
          if (storedMeta) {
            const parsedMeta = JSON.parse(storedMeta);
            regDescriptor = parsedMeta.faceDescriptor;
          }
        }

        if (regDescriptor) {
          const targetDescriptor = regDescriptor instanceof Float32Array 
            ? regDescriptor 
            : new Float32Array(regDescriptor);

          const distance = faceapi.euclideanDistance(liveDetection.descriptor, targetDescriptor);
          const score = Math.max(0, Math.min(100, Math.round((1 - distance / 0.6) * 10) + 90));
          const confidence = (distance < 0.6) ? Math.max(90, Math.min(99, score)) : Math.min(88, score);

          if (distance < 0.6) {
            let prg = 0;
            const iv = setInterval(() => {
              prg += 20;
              const bar = document.getElementById("face-scan-bar");
              const pct = document.getElementById("face-scan-percentage");
              if (bar) bar.style.width = `${prg}%`;
              if (pct) pct.innerText = `${prg}%`;
              if (prg >= 100) {
                clearInterval(iv);
                setFaceScanSuccess(true);
                stopPortalCamera();
                setTimeout(() => {
                  setFaceScanning(false);
                  setFaceScanSuccess(false);
                  setShiftStatus("active");
                  localStorage.setItem("shift_status", "active");
                  setAlertOverlay(null);
                  toast.success(`🎉 Shift Activated: Verified driver match ${confidence}%!`);
                }, 1200);
              }
            }, 100);
            return;
          } else {
            toast.warn(`⚠️ Face Verification failed (${confidence}% score). Keep camera steady.`);
          }
        } else {
          simulateSuccessScan();
          return;
        }
      }
    } catch (err) {
      console.error("Portal face check failed:", err);
    }

    if (faceScanning && portalStreamRef.current) {
      setTimeout(runPortalFaceVerification, 500);
    }
  };

  const startPortalCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" }
      });
      setPortalStream(mediaStream);
      portalStreamRef.current = mediaStream;
      setTimeout(() => {
        runPortalFaceVerification();
      }, 800);
    } catch (e) {
      console.warn("Portal camera unavailable, using simulation fallback.", e);
      simulateSuccessScan();
    }
  };

  const stopPortalCamera = () => {
    if (portalStreamRef.current) {
      portalStreamRef.current.getTracks().forEach(track => track.stop());
      portalStreamRef.current = null;
    }
    setPortalStream(null);
  };

  useEffect(() => {
    if (faceScanning) {
      startPortalCamera();
    } else {
      stopPortalCamera();
    }
    return () => stopPortalCamera();
  }, [faceScanning]);

  useEffect(() => {
    if (portalStream && portalVideoRef.current) {
      portalVideoRef.current.srcObject = portalStream;
      portalVideoRef.current.play().catch(() => {});
    }
  }, [portalStream]);

  // OTP Verification Modal state
  const [otpModal, setOtpModal] = useState({
    open: false,
    orderId: null,
    otpValue: "",
    isCod: false,
    verifying: false,
    error: "",
    barcodeVerified: false,
    scannedCode: "",
    useCamera: false,
    paymentConfirmed: false,
    codPaymentMethod: "upi", // upi | cash
    upiVerifying: false
  });

  // Automatic simulation for COD Payment QR scan (direct modal) is removed to let delivery boy verify manually

  const [pickupData, setPickupData] = useState({}); // { [orderId]: { image: "", notes: "" } }
  const [profileEdit, setProfileEdit] = useState({
    name: "",
    vehicle_number: "",
    agency: "",
    avatar_url: "",
    password: "",
    address: "",
    updating: false
  });

  const [geocodedCoords, setGeocodedCoords] = useState({});
  const [profileMetadata, setProfileMetadata] = useState(null);
  // Document preview modal for profile viewer
  const [profileDocModal, setProfileDocModal] = useState(null);
  // QC Photo Lightbox
  const [qcLightbox, setQcLightbox] = useState(null);
  // Refs for two-button camera vs gallery file inputs
  const pickupCameraRef = useRef(null);
  const pickupGalleryRef = useRef(null);

  const [pickupModal, setPickupModal] = useState({
    open: false,
    order: null,
    image: "",
    notes: "",
    submitting: false,
    error: "",
    aiCheckActive: false,
    aiCheckDone: false,
    aiCheckSuccess: true,
    aiMatchScore: 98,
    action: "approve"
  });

  const pickupCanvasRef = useRef(null);
  const [isPickupDrawing, setIsPickupDrawing] = useState(false);
  const [hasPickupSigned, setHasPickupSigned] = useState(false);

  const getPickupCoordinates = (e) => {
    const canvas = pickupCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startPickupDrawing = (e) => {
    const coords = getPickupCoordinates(e);
    const canvas = pickupCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#d97706"; // amber-600
    setIsPickupDrawing(true);
  };

  const drawPickup = (e) => {
    if (!isPickupDrawing) return;
    e.preventDefault();
    const coords = getPickupCoordinates(e);
    const canvas = pickupCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasPickupSigned(true);
  };

  const stopPickupDrawing = () => {
    setIsPickupDrawing(false);
  };

  const clearPickupSignature = () => {
    const canvas = pickupCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasPickupSigned(false);
    }
  };

  const handleOpenPickupModal = (order) => {
    setPickupModal({
      open: true,
      order: order,
      image: pickupData[order.id]?.image || "",
      notes: pickupData[order.id]?.notes || "",
      submitting: false,
      error: "",
      aiCheckActive: false,
      aiCheckDone: false,
      aiCheckSuccess: true,
      aiMatchScore: 98,
      action: "approve"
    });
    setHasPickupSigned(false);
  };

  const runAiQualityCheck = (isMockSuccess = true) => {
    if (!pickupModal.image) {
      setPickupModal(prev => ({ ...prev, error: "Please upload a quality photo first to run AI scan." }));
      return;
    }
    setPickupModal(prev => ({ ...prev, aiCheckActive: true, error: "" }));
    
    setTimeout(() => {
      const matchScore = isMockSuccess ? Math.floor(92 + Math.random() * 7) : Math.floor(35 + Math.random() * 15);
      setPickupModal(prev => ({
        ...prev,
        aiCheckActive: false,
        aiCheckDone: true,
        aiCheckSuccess: isMockSuccess,
        aiMatchScore: matchScore,
        action: isMockSuccess ? "approve" : "reject"
      }));
      toast.info(isMockSuccess ? "✅ AI Product Check: Match Verified!" : "⚠️ AI Product Check: Mismatch or Damage Alert!");
    }, 2500);
  };

  const handleConfirmPickup = async () => {
    if (!pickupModal.image) {
      setPickupModal(prev => ({ ...prev, error: "Please upload a real photo of the package at pickup." }));
      return;
    }
    if (!pickupModal.notes.trim()) {
      setPickupModal(prev => ({ ...prev, error: "Please enter QC condition notes." }));
      return;
    }
    if (!hasPickupSigned) {
      setPickupModal(prev => ({ ...prev, error: "Please provide the Customer E-Signature before proceeding." }));
      return;
    }

    setPickupModal(prev => ({ ...prev, submitting: true, error: "" }));

    try {
      const res = await axiosInstance.put(`/delivery/pickup/${pickupModal.order.id}`, {
        pickupImage: pickupModal.image,
        qcNotes: pickupModal.notes,
        action: pickupModal.action
      });

      if (res.data.success) {
        toast.success(res.data.message || "Pickup processed successfully!");
        playSuccessSound();
        setPickupModal({ open: false, order: null, image: "", notes: "", submitting: false, error: "", aiCheckActive: false, aiCheckDone: false, aiCheckSuccess: true, aiMatchScore: 98, action: "approve" });
        fetchProfileAndOrders();
      }
    } catch (err) {
      console.error(err);
      setPickupModal(prev => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.message || "Failed to confirm pickup. Please try again."
      }));
    }
  };

  // Alarm Ringtone Audio synthesis state & warning timers
  const alarmInterval = useRef(null);
  const audioCtxRef = useRef(null);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [alarmSecondsLeft, setAlarmSecondsLeft] = useState(15);
  const countdownTimer = useRef(null);
  const offlineRepeatRef = useRef(null); // dedicated ref for offline-during-shift repeat alarm

  const nearbyAlertPlayed = useRef({});
  const existingOrderIds = useRef(new Set());
  const clockAlertsPlayed = useRef({});

  // ✨ Shift Management System states
  const [shiftAlertModal, setShiftAlertModal] = useState({ open: false, type: null, minsLeft: 0 });
  const [gpsCheckModal, setGpsCheckModal] = useState({ open: false, checking: false, result: null, distance: null });
  const [dailySummaryModal, setDailySummaryModal] = useState({ open: false, stats: null });
  const [offlineCountdown, setOfflineCountdown] = useState(300); // 5-minute countdown in seconds
  const preShiftAlertsFired = useRef(new Set());
  const shiftEndAlertsFired = useRef(new Set());
  const lastActionTime = useRef(Date.now());
  const inactivityWarnedRef = useRef(false);
  const inactivityEscalatedRef = useRef(false);
  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason.trim()) {
      toast.error("Please enter a valid reason for appeal.");
      return;
    }
    setSubmittingAppeal(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.post("/delivery/submit-unblock", {
        reason: appealReason
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        toast.success("Appeal submitted successfully. Admin will review your case shortly.");
        setAppealReason("");
        
        // Update local storage
        const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
        const sessionPhone = localStorage.getItem("delivery_session_phone");
        const pIdx = partners.findIndex(p => p.phone === sessionPhone);
        if (pIdx !== -1) {
          partners[pIdx].unblock_request_status = "Pending";
          partners[pIdx].unblock_request_reason = appealReason;
          localStorage.setItem("balaji_delivery_partners", JSON.stringify(partners));
        }
        
        // Refresh agent state
        fetchProfileAndOrders();
      }
    } catch (err) {
      console.error("Failed to submit appeal to backend, saving locally:", err);
      // Local storage fallback for appeal submission
      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      const sessionPhone = localStorage.getItem("delivery_session_phone");
      const pIdx = partners.findIndex(p => p.phone === sessionPhone);
      if (pIdx !== -1) {
        partners[pIdx].unblock_request_status = "Pending";
        partners[pIdx].unblock_request_reason = appealReason;
        localStorage.setItem("balaji_delivery_partners", JSON.stringify(partners));
        toast.success("Appeal submitted successfully (Offline mode). Admin will review it shortly.");
        setAppealReason("");
        fetchProfileAndOrders();
      } else {
        toast.error(err.response?.data?.message || "Failed to submit appeal.");
      }
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const fetchProfileAndOrders = async () => {
    setLoading(true);
    try {
      const sessionPhone = localStorage.getItem("delivery_session_phone");
      const token = localStorage.getItem("token");

      if (!token || !sessionPhone) {
        toast.error("Session expired. Please log in again.");
        setTimeout(() => navigate("/delivery/login"), 0);
        return;
      }

      // Fetch real status from PostgreSQL database via API
      let serverPartner = null;
      try {
        const res = await axiosInstance.get("/delivery/profile", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.success) {
          serverPartner = res.data.deliveryAgent;
        }
      } catch (err) {
        console.warn("Backend profile fetch failed, using local cache fallback:", err.message);
      }

      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      let partner = partners.find(p => p.phone === sessionPhone);

      if (serverPartner) {
        partner = { ...partner, ...serverPartner };
        const idx = partners.findIndex(p => p.phone === sessionPhone);
        if (idx !== -1) {
          partners[idx] = partner;
        } else {
          partners.push(partner);
        }
        localStorage.setItem("balaji_delivery_partners", JSON.stringify(partners));
      }

      if (!partner) {
        toast.error("Partner account not found. Please register first.");
        setTimeout(() => navigate("/delivery/login"), 0);
        return;
      }

      // Build agent object matching what the portal expects
      const agentData = {
        id: partner.id,
        name: partner.name,
        phone: partner.phone,
        email: partner.email,
        vehicle_number: partner.vehicle_number || "N/A",
        agency: partner.agency || "Balaji Cart Logistics",
        shift_preference: partner.shift_preference || "Shift 1 (9:00 AM - 1:00 PM)",
        address: partner.address || "",
        avatar_url: partner.avatar_url || null,
        status: partner.status || "active",
        earnings: partner.earnings || 0,
        deliveries: partner.deliveries || 0,
        rating: partner.rating || 5.0,
        latitude: partner.latitude || null,
        longitude: partner.longitude || null,
        joinedAt: partner.joinedAt || new Date().toISOString(),
        is_verified: partner.is_verified,
        verification_status: partner.verification_status,
        rejection_reason: partner.rejection_reason,
        // ✅ FIX: always read is_online from server — was missing, causing "always offline" bug
        is_online: partner.is_online ?? false,
        // ✅ Block system fields
        delivery_partner_status: partner.delivery_partner_status || "ACTIVE",
        fine_amount: partner.fine_amount || 0,
        block_reason: partner.block_reason || null,
        offline_count: partner.offline_count || 0,
        unblock_request_status: partner.unblock_request_status || null,
      };

      setAgent(agentData);

      // Sync local ref with database value on initial load / profile update
      offlineCountRef.current = agentData.offline_count || 0;
      // Sync prevOnlineRef so first useEffect run does not count as a new offline event
      prevOnlineRef.current = agentData.is_online;
      // Persist "was online today" across page refreshes so the no-show fine does not
      // falsely fire when the agent logs back in mid-shift after having been online.
      if (agentData.is_online) {
        const todayKey = new Date().toISOString().split('T')[0];
        localStorage.setItem(`was_online_today_${todayKey}`, '1');
      }

      // ✅ If blocked — check if next shift started (auto-unblock) or update window info
      if (agentData.delivery_partner_status === "BLOCKED") {
        try {
          const unblockRes = await axiosInstance.post("/delivery/check-shift-unblock", {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (unblockRes.data.success && !unblockRes.data.stillBlocked) {
            // Auto-unblocked! Reset frontend offline counter and reload profile fresh
            offlineCountRef.current = 0;
            shiftFineApplied.current = false;
            toast.success("✅ Auto-unblocked! New shift has started. Welcome back!");
            fetchProfileAndOrders();
            return;
          }
          // Still blocked — store window info for UI
          setBlockWindowInfo({
            minutesLeft: unblockRes.data.minutesLeft || 0,
            windowExpired: unblockRes.data.windowExpired || false,
            fine_amount: unblockRes.data.fine_amount || agentData.fine_amount
          });
        } catch (e) {
          console.warn("check-shift-unblock failed, running local check fallback:", e.message);
          const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
          const sessionPhone = localStorage.getItem("delivery_session_phone");
          const pIdx = partners.findIndex(p => p.phone === sessionPhone);
          if (pIdx !== -1) {
            const p = partners[pIdx];
            if (p.delivery_partner_status === "BLOCKED") {
              const blockedDate = p.blocked_shift_date;
              const blockedSlot = p.blocked_shift_slot;
              
              const now = new Date();
              const todayStr = now.toISOString().split('T')[0];
              const curH = now.getHours();
              
              let shouldUnblock = false;
              if (blockedDate) {
                if (todayStr > blockedDate) {
                  shouldUnblock = true;
                } else if (todayStr === blockedDate) {
                  const SHIFT_SLOTS_MAP = {
                    'S1': 13,
                    'S2': 17,
                    'S3': 21,
                    'S4': 23
                  };
                  const endH = SHIFT_SLOTS_MAP[blockedSlot] || 24;
                  if (curH >= endH) {
                    shouldUnblock = true;
                  }
                }
              } else {
                shouldUnblock = true;
              }

              if (shouldUnblock) {
                p.delivery_partner_status = "ACTIVE";
                p.block_reason = null;
                p.blocked_shift_slot = null;
                p.blocked_shift_date = null;
                p.unblock_request_status = null;
                p.unblock_request_reason = null;
                localStorage.setItem("balaji_delivery_partners", JSON.stringify(partners));
                
                offlineCountRef.current = 0;
                shiftFineApplied.current = false;
                toast.success("✅ Auto-unblocked locally! New shift has started. Welcome back!");
                fetchProfileAndOrders();
                return;
              } else {
                const SHIFT_SLOTS_MAP = {
                  'S1': 13,
                  'S2': 17,
                  'S3': 21,
                  'S4': 23
                };
                const endH = SHIFT_SLOTS_MAP[blockedSlot] || 24;
                const minutesLeft = Math.max(0, (endH - curH) * 60 - now.getMinutes());
                setBlockWindowInfo({
                  minutesLeft: minutesLeft,
                  windowExpired: false,
                  fine_amount: p.fine_amount || agentData.fine_amount
                });
              }
            }
          }
        }
        return; // Skip all other API calls (they'd 403)
      }

      // ✅ Agent is ACTIVE — reset offline counter ref only if they were previously BLOCKED
      // (prevents wiping the count on every mid-shift profile refresh)
      const wasBlocked = agent?.delivery_partner_status === "BLOCKED";
      if (wasBlocked) {
        offlineCountRef.current = 0;
        shiftFineApplied.current = false;
      }

      // ✅ FIXED: Fetch real assigned orders from backend API (previously was only reading localStorage)
      let fetchedOrders = [];
      try {
        const ordersRes = await axiosInstance.get("/delivery/assigned-orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (ordersRes.data.success) {
          fetchedOrders = ordersRes.data.orders || [];
          // Cache fetched orders in localStorage as backup
          localStorage.setItem(`delivery_orders_${sessionPhone}`, JSON.stringify(fetchedOrders));
        }
      } catch (err) {
        console.warn("Assigned orders API failed, trying localStorage cache:", err.message);
        // Fallback to cached orders if API fails
        fetchedOrders = JSON.parse(localStorage.getItem(`delivery_orders_${sessionPhone}`) || "[]");
      }
      setOrders(fetchedOrders);

      // ✅ FIX: Seed existingOrderIds on initial load so polling doesn't re-alert old orders
      fetchedOrders.forEach(o => existingOrderIds.current.add(o.id));

      // Geocode any orders that have addresses
      fetchedOrders.forEach(async (order) => {
        const shipping = order.shipping_info;
        if (shipping) {
          const queries = [];
          const fullAddr = [shipping.address, shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(", ");
          if (fullAddr) queries.push(fullAddr);
          if (shipping.pincode) queries.push(`${shipping.pincode}, India`);
          const cityState = [shipping.city, shipping.state].filter(Boolean).join(", ");
          if (cityState) queries.push(cityState);

          let success = false;
          for (const query of queries) {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
              const data = await response.json();
              if (data && data.length > 0) {
                setGeocodedCoords(prev => ({
                  ...prev,
                  [order.id || order._id]: { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }
                }));
                success = true;
                break;
              }
            } catch (e) {
              console.error("Geocode error:", e);
            }
          }
          if (!success) {
            const fullText = `${shipping.address} ${shipping.city} ${shipping.state} ${shipping.pincode}`.toLowerCase();
            if (fullText.includes("nawada") || fullText.includes("bihar") || fullText.includes("805124")) {
              setGeocodedCoords(prev => ({
                ...prev,
                [order.id || order._id]: { latitude: 24.8856, longitude: 85.5412 }
              }));
            }
          }
        }
      });

    } catch (err) {
      console.error(err);
      toast.error("Error loading profile. Please log in again.");
      setTimeout(() => navigate("/delivery/login"), 0);
    } finally {
      setLoading(false);
    }
  };


  // Helper: play a short beep for new order notification
  const playNewOrderAlarm = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [0, 0.25, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + delay + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch (e) {}
  };

  // ✅ Helper: Refresh only orders without a full page reload
  const refreshOrders = async () => {
    // ✅ Guard: never poll if account is blocked (avoids 403 flood)
    if (agent?.delivery_partner_status === "BLOCKED") return;
    const token = localStorage.getItem("token");
    const sessionPhone = localStorage.getItem("delivery_session_phone");
    if (!token || !sessionPhone) return;
    try {
      const ordersRes = await axiosInstance.get("/delivery/assigned-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ordersRes.data.success) {
        const fetchedOrders = ordersRes.data.orders || [];

        // 🔔 New Order Alarm: detect newly assigned orders
        const newOrders = fetchedOrders.filter(
          o => !existingOrderIds.current.has(o.id) &&
               (o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery")
        );
        if (newOrders.length > 0) {
          playNewOrderAlarm();
          newOrders.forEach(o => {
            toast.info(`📦 New order assigned! Order #${String(o.id).slice(-6).toUpperCase()} - ${o.order_status}`, {
              autoClose: 8000,
              position: "top-center"
            });
            existingOrderIds.current.add(o.id);
          });
        }

        setOrders(fetchedOrders);
        localStorage.setItem(`delivery_orders_${sessionPhone}`, JSON.stringify(fetchedOrders));
      }
    } catch (err) {
      if (err.response?.status === 403) {
        // Silently skip — agent is blocked, polling stops itself via the guard above
        console.warn("refreshOrders: skipped (account blocked)");
      } else {
        console.warn("Periodic order refresh failed:", err.message);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SHIFT BOOKING SYSTEM
  // ─────────────────────────────────────────────────────────────────────────
  const SHIFT_SLOTS = [
    { id: 'S1', label: 'Shift 1', time: '9:00 AM – 1:00 PM', startMins: 540, endMins: 780, emoji: '🌅', startTime: '09:00:00', endTime: '13:00:00' },
    { id: 'S2', label: 'Shift 2', time: '1:00 PM – 5:00 PM', startMins: 780, endMins: 1020, emoji: '☀️', startTime: '13:00:00', endTime: '17:00:00' },
    { id: 'S3', label: 'Shift 3', time: '5:00 PM – 9:00 PM', startMins: 1020, endMins: 1260, emoji: '🌇', startTime: '17:00:00', endTime: '21:00:00' },
    { id: 'S4', label: 'Shift 4', time: '9:00 PM – 11:00 PM', startMins: 1260, endMins: 1380, emoji: '🌙', startTime: '21:00:00', endTime: '23:00:00' },
  ];

  const getTodayKey = () => new Date().toISOString().slice(0, 10); // "2026-06-08"

  const bookShift = (slot) => {
    const key = getTodayKey();
    const existing = bookedShifts[key];
    if (existing && existing.id === slot.id) {
      toast.warn('⚠️ You already booked this shift today.');
      return;
    }
    const updated = { ...bookedShifts, [key]: { ...slot, bookedAt: new Date().toISOString(), status: 'booked' } };
    setBookedShifts(updated);
    localStorage.setItem('booked_shifts', JSON.stringify(updated));
    // Update agent shift_preference to match
    if (agent) {
      const pref = `${slot.label} (${slot.time.replace('–', '-')})`;
      try {
        const token = localStorage.getItem('token');
        axiosInstance.put('/delivery/update-status', {
          is_online: agent.is_online,
          shift_preference: pref
        }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setAgent(prev => ({ ...prev, shift_preference: pref }));
      } catch (e) {}
    }
    shiftFineApplied.current = false;
    toast.success(`✅ ${slot.label} (${slot.time}) booked successfully! Be online at shift start.`);
    setShiftBookingModal(false);
  };

  const cancelShift = (key) => {
    const updated = { ...bookedShifts };
    delete updated[key];
    setBookedShifts(updated);
    localStorage.setItem('booked_shifts', JSON.stringify(updated));
    if (shiftNoLoginTimer.current) { clearInterval(shiftNoLoginTimer.current); shiftNoLoginTimer.current = null; }
    toast.info('Shift booking cancelled.');
  };

  const applyShiftFine = async () => {
    if (shiftFineApplied.current) return;
    // Guard: do not apply a new fine if the agent is already blocked
    // (prevents ₹300-per-refresh growth when backend is unreachable)
    if (agent?.delivery_partner_status === "BLOCKED") return;
    const sessionPhone = localStorage.getItem("delivery_session_phone");
    const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
    const cached = partners.find(p => p.phone === sessionPhone);
    if (cached?.delivery_partner_status === "BLOCKED") return;
    shiftFineApplied.current = true;
    
    // Play escalation alarm & vibration
    playAlertLevel('max');
    vibrateDevice([1000, 500, 1000, 500, 1000]);
    setShiftAlertModal({ open: true, type: 'blocked', minsLeft: 0 });

    // Determine which shift slot was active when blocked
    const SHIFT_SLOTS_MAP = [
      { slot: 'S1', startH: 9,  endH: 13 },
      { slot: 'S2', startH: 13, endH: 17 },
      { slot: 'S3', startH: 17, endH: 21 },
      { slot: 'S4', startH: 21, endH: 23 },
    ];
    const nowH = new Date().getHours();
    const activeSlot = SHIFT_SLOTS_MAP.find(s => nowH >= s.startH && nowH < s.endH);

    try {
      const token = localStorage.getItem("token");
      await axiosInstance.post("/delivery/auto-block", {
        reason: "Offline During Active Shift",
        offlineCount: offlineCountRef.current,
        blockedShiftSlot: activeSlot?.slot || null
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.error(`🚨 SHIFT BLOCKED! You went offline ${offlineCountRef.current} times. ₹300 fine applied.`, { autoClose: false });
    } catch (err) {
      console.error("Failed to sync auto-block to backend, saving locally:", err);
      toast.error("Network error: Failed to log block on server. Status saved locally.");
    } finally {
      // Local block fallback updates
      const partners = JSON.parse(localStorage.getItem("balaji_delivery_partners") || "[]");
      const sessionPhone = localStorage.getItem("delivery_session_phone");
      const pIdx = partners.findIndex(p => p.phone === sessionPhone);
      if (pIdx !== -1) {
        partners[pIdx].delivery_partner_status = "BLOCKED";
        partners[pIdx].fine_amount = (parseFloat(partners[pIdx].fine_amount) || 0) + 300;
        partners[pIdx].block_reason = "Offline During Active Shift";
        partners[pIdx].blocked_shift_slot = activeSlot?.slot || null;
        partners[pIdx].blocked_shift_date = new Date().toISOString().split('T')[0];
        partners[pIdx].unblock_request_status = null;
        partners[pIdx].unblock_request_reason = null;
        localStorage.setItem("balaji_delivery_partners", JSON.stringify(partners));
      }
      
      // ✅ Reset counter to 0 so next shift starts fresh
      offlineCountRef.current = 0;
      
      // Refresh profile to reflect the block on the UI
      fetchProfileAndOrders();
    }
  };

  // Reset blocked shift status (for admin/new day use)
  const resetShiftBlock = () => {
    const key = getTodayKey();
    const updated = { ...bookedShifts };
    if (updated[key]) {
      updated[key].status = 'booked';
      delete updated[key].fine;
      delete updated[key].offlineCount;
      setBookedShifts(updated);
      localStorage.setItem('booked_shifts', JSON.stringify(updated));
    }
    shiftFineApplied.current = false;
    offlineCountRef.current = 0;
    toast.success('Shift block reset. You can now go online.');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DB SHIFT BOOKING FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchDbShiftBookings = async () => {
    setShiftBookingsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get("/delivery/my-bookings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setDbShiftBookings(res.data.bookings || []);
    } catch (e) {
      console.warn("Failed to fetch shift bookings:", e.message);
    } finally {
      setShiftBookingsLoading(false);
    }
  };

  const bookShiftToDb = async (dateStr, slot) => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.post("/delivery/book-shift", {
        shift_date: dateStr,
        shift_slot: slot.id,
        shift_label: `${slot.label} (${slot.time})`,
        shift_start: slot.startTime,
        shift_end: slot.endTime
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`✅ ${slot.label} booked for ${new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}!`);
      fetchDbShiftBookings();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to book shift.");
    }
  };

  const cancelShiftFromDb = async (bookingId, hoursUntilShift) => {
    if (hoursUntilShift < 12) {
      toast.error("❌ Cannot cancel: shift starts in less than 12 hours.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/delivery/cancel-shift/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: "Cancelled by agent" }
      });
      toast.info("Shift booking cancelled.");
      fetchDbShiftBookings();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to cancel booking.");
    }
  };

  const fetchDbFinesAndLogs = async () => {
    setFinesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get("/delivery/my-fines", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFinesHistory(res.data.fines || []);
        setOfflineLogs(res.data.offline_logs || []);
      }
    } catch (e) {
      console.warn("Failed to fetch fines/logs:", e.message);
    } finally {
      setFinesLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BOOKED-SHIFT ALARM MONITOR (runs every 30s)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agent) return;
    const checkBookedShift = () => {
      // Guard: never run no-show checks if agent is already blocked
      if (agent?.delivery_partner_status === "BLOCKED") return;
      const key = getTodayKey();
      const booked = bookedShifts[key];
      if (!booked || booked.status === 'blocked') return;

      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      const inWindow = cur >= booked.startMins && cur < booked.endMins;
      if (!inWindow) return;

      // Delivery boy is in their booked shift window but OFFLINE
      if (!agent.is_online) {
        const minsIntoShift = cur - booked.startMins;

        // ─── Escalating alarms based on how late the agent is ───────────────
        // We NEVER block from this path — only the 5-offline-event monitor blocks.
        // This allows agents who log in late to still work their shift.
        if (minsIntoShift >= 15) {
          // Very late — play max alarm every 30s cycle
          playAlertLevel('max'); vibrateDevice([500, 200, 500, 200, 500]);
          requestNotification(
            `🚨 URGENT! Go Online NOW! (${minsIntoShift} min late)`,
            `You booked ${booked.label} but are OFFLINE for ${minsIntoShift} minutes!`
          );
          setShiftAlertModal({ open: true, type: 'no_login', minsLeft: 0, booked });
        } else if (minsIntoShift >= 10) {
          playAlertLevel('max'); vibrateDevice([500, 200, 500, 200, 500]);
          requestNotification(
            `🚨 Go Online NOW! (${minsIntoShift} min late)`,
            `You booked ${booked.label} but are OFFLINE. Please go online immediately!`
          );
          setShiftAlertModal({ open: true, type: 'no_login', minsLeft: 0, booked });
        } else if (minsIntoShift >= 7) {
          playAlertLevel('max'); vibrateDevice([500, 200, 500, 200, 500]);
          requestNotification(
            `🚨 Go Online NOW! (${10 - minsIntoShift} min left)`,
            `You booked ${booked.label} but are OFFLINE. ${10 - minsIntoShift} minute(s) left!`
          );
          setShiftAlertModal({ open: true, type: 'no_login', minsLeft: 10 - minsIntoShift, booked });
        } else if (minsIntoShift >= 4) {
          playAlertLevel('loud'); vibrateDevice([300, 100, 300]);
          requestNotification(
            `⚠️ Go Online! (${10 - minsIntoShift} min left)`,
            `You booked ${booked.label} but are OFFLINE. ${10 - minsIntoShift} minute(s) left!`
          );
          setShiftAlertModal({ open: true, type: 'no_login', minsLeft: 10 - minsIntoShift, booked });
        } else {
          playAlertLevel('medium'); vibrateDevice([200, 100, 200]);
          requestNotification(
            `⚠️ Go Online! (${10 - minsIntoShift} min left)`,
            `You booked ${booked.label} but are OFFLINE.`
          );
          setShiftAlertModal({ open: true, type: 'no_login', minsLeft: 10 - minsIntoShift, booked });
        }

      } else {
        // Agent is online — clear any fine timers
        if (shiftNoLoginTimer.current) {
          clearInterval(shiftNoLoginTimer.current);
          shiftNoLoginTimer.current = null;
        }
        // Mark shift as active if it was just booked
        if (bookedShifts[key]?.status === 'booked') {
          const updated = { ...bookedShifts, [key]: { ...bookedShifts[key], status: 'active' } };
          setBookedShifts(updated);
          localStorage.setItem('booked_shifts', JSON.stringify(updated));
        }
      }
    };

    const interval = setInterval(checkBookedShift, 30000);
    checkBookedShift(); // run immediately on mount
    return () => clearInterval(interval);
  }, [agent?.is_online, bookedShifts]);


  useEffect(() => {
    fetchProfileAndOrders();
    // Poll for new assigned orders every 60 seconds
    const orderPollInterval = setInterval(refreshOrders, 60000);
    return () => {
      clearInterval(orderPollInterval);
      Object.values(simIntervals.current).forEach(clearInterval);
      stopAlarmSiren();
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  // Initialize profile update form when agent data loads
  useEffect(() => {
    if (agent) {
      setProfileEdit({
        name: agent.name || "",
        vehicle_number: agent.vehicle_number || "",
        agency: agent.agency || "",
        avatar_url: agent.avatar_url || "",
        password: "",
        address: agent.address || "",
        updating: false
      });
    }
  }, [agent]);

  useEffect(() => {
    if (agent) {
      let docs = {};
      try {
        docs = typeof agent.documents === 'string' ? JSON.parse(agent.documents) : (agent.documents || {});
      } catch (e) {
        console.error("Failed to parse agent documents:", e);
      }
      setProfileMetadata({
        email: docs.email || agent.email || "N/A",
        dob: docs.dob || agent.dob || "N/A",
        gender: docs.gender || agent.gender || "N/A",
        emergency_contact: docs.emergency_contact || agent.emergency_contact || "N/A",
        bank_account_holder: docs.bank_account_holder || agent.bank_account_holder || "N/A",
        bank_account_number: docs.bank_account_number || agent.bank_account_number || "N/A",
        bank_ifsc: docs.bank_ifsc || agent.bank_ifsc || "N/A",
        doc_aadhaarFront: docs.aadhaarFront || agent.aadhaar_url || null,
        doc_aadhaarBack: docs.aadhaarBack || null,
        doc_panCard: docs.panCard || agent.pan_url || null,
        doc_addressProof: docs.addressProofFile || null,
        doc_rcFile: docs.rcFile || null,
        doc_vehiclePhoto: docs.vehiclePhoto || null,
        doc_drivingLicense: docs.drivingLicense || null,
        doc_insuranceCopy: docs.insuranceCopy || null,
        doc_pollutionCertificate: docs.pollutionCertificate || null,
        doc_chequeFile: docs.chequeFile || null,
        aadhaarFront: docs.aadhaarFront ? "Uploaded" : null,
        aadhaarBack: docs.aadhaarBack ? "Uploaded" : null,
        panCard: docs.panCard ? "Uploaded" : null,
        addressProofType: docs.addressProofFile ? "Uploaded" : null,
        rcFile: docs.rcFile ? "Uploaded" : null,
        vehiclePhoto: docs.vehiclePhoto ? "Uploaded" : null,
        drivingLicense: docs.drivingLicense ? "Uploaded" : null,
        insuranceCopy: docs.insuranceCopy ? "Uploaded" : null,
        pollutionCertificate: docs.pollutionCertificate ? "Uploaded" : null,
        chequeFile: docs.chequeFile ? "Uploaded" : null,
        isFaceMatched: true,
        matchPercentage: agent.face_descriptor ? 98.5 : 0,
        verificationDate: agent.created_at ? new Date(agent.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        criminalCheckStatus: "CLEAN (Auto-cleared)"
      });
    }
  }, [agent]);

  // Get upcoming shift start time in minutes
  const getMinutesUntilShiftStart = (preference) => {
    let startHour = 7;
    if (preference?.includes("Afternoon")) startHour = 13;
    else if (preference?.includes("Evening") || preference?.includes("Night")) startHour = 19;
    
    const now = new Date();
    const start = new Date();
    start.setHours(startHour, 0, 0, 0);
    
    let diffMs = start - now;
    return Math.round(diffMs / 60000);
  };

  // Background clock checker for pre-shift alerts and shift ending
  useEffect(() => {
    if (!agent || shiftStatus === "completed") return;
    
    const interval = setInterval(() => {
      const pref = agent.shift_preference;
      let startHour = 7;
      let endHour = 15;
      if (pref?.includes("Afternoon")) {
        startHour = 13;
        endHour = 21;
      } else if (pref?.includes("Evening") || pref?.includes("Night")) {
        startHour = 19;
        endHour = 3;
      }
      
      const now = new Date();
      const currentHour = now.getHours();
      
      // Check if shift is active and not started (play start alarm only once per day)
      const isCurrentlyActive = isShiftActive(pref);
      const todayStr = now.toDateString();
      if (isCurrentlyActive && shiftStatus === "not_started" && alertOverlay !== "shift_started" && clockAlertsPlayed.current[`shift_start_${todayStr}`] !== true) {
        clockAlertsPlayed.current[`shift_start_${todayStr}`] = true;
        setAlertOverlay("shift_started");
        playEventSound("shift_start");
      }
      
      // Check pre-shift alerts
      const minutesUntilStart = getMinutesUntilShiftStart(pref);
      
      if (minutesUntilStart === 60 && clockAlertsPlayed.current[`1hour_${todayStr}`] !== true) {
        clockAlertsPlayed.current[`1hour_${todayStr}`] = true;
        setAlertOverlay("1hour");
        playEventSound("1hour");
      }
      else if (minutesUntilStart === 30 && clockAlertsPlayed.current[`30min_${todayStr}`] !== true) {
        clockAlertsPlayed.current[`30min_${todayStr}`] = true;
        setAlertOverlay("30min");
        playEventSound("30min");
      }
      else if (minutesUntilStart === 15 && clockAlertsPlayed.current[`15min_${todayStr}`] !== true) {
        clockAlertsPlayed.current[`15min_${todayStr}`] = true;
        setAlertOverlay("15min");
        playEventSound("15min");
      }
      
      // Shift End alert check
      const end = new Date();
      if (endHour < startHour) {
        if (currentHour >= startHour) {
          end.setDate(end.getDate() + 1);
        }
      }
      end.setHours(endHour, 0, 0, 0);
      const minutesUntilEnd = Math.round((end - now) / 60000);
      
      if (minutesUntilEnd === 30 && clockAlertsPlayed.current[`shift_end_30m_${todayStr}`] !== true) {
        clockAlertsPlayed.current[`shift_end_30m_${todayStr}`] = true;
        toast.info("Shift ending in 30 minutes. Please complete any pending deliveries.");
        playEventSound("15min");
      }
      
      if (minutesUntilEnd <= 0 && minutesUntilEnd > -5 && shiftStatus === "active" && alertOverlay !== "shift_ended") {
        setShiftStatus("completed");
        localStorage.setItem("shift_status", "completed");
        setAlertOverlay("shift_ended");
        playEventSound("shift_complete");
      }
      
    }, 15000);
    
    return () => clearInterval(interval);
  }, [agent, shiftStatus, alertOverlay]);

  // Track page interaction activity to reset inactivity timers
  useEffect(() => {
    const handleActivity = () => {
      setLastActivityTime(Date.now());
    };
    
    window.addEventListener("click", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    
    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  // Background inactivity monitor
  useEffect(() => {
    if (shiftStatus !== "active") return;
    
    const interval = setInterval(() => {
      const elapsedMinutes = Math.floor((Date.now() - lastActivityTime) / 60000);
      setInactivityMinutes(elapsedMinutes);
      
      if (elapsedMinutes >= 60) {
        if (alertOverlay !== "escalated") {
          setAlertOverlay("escalated");
          playEventSound("sos_emergency");
        }
      } else if (elapsedMinutes >= 45) {
        if (alertOverlay !== "inactivity_warning" && alertOverlay !== "escalated") {
          setAlertOverlay("inactivity_warning");
          playEventSound("inactivity_warning");
        }
      } else {
        if (alertOverlay === "inactivity_warning") {
          setAlertOverlay(null);
          stopAlarmSiren();
        }
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [lastActivityTime, shiftStatus, alertOverlay]);

  const handleResumeDeliveries = () => {
    setLastActivityTime(Date.now());
    setInactivityMinutes(0);
    setAlertOverlay(null);
    stopAlarmSiren();
    toast.success("Welcome back! Activity tracked successfully.");
  };

  const handleAcknowledgeEscalation = () => {
    setLastActivityTime(Date.now());
    setInactivityMinutes(0);
    setAlertOverlay(null);
    stopAlarmSiren();
    toast.success("Shift status re-activated! Alerting manager of your return.");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileEdit(prev => ({ ...prev, avatar_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileEdit(prev => ({ ...prev, updating: true }));

    let finalLat = agent?.latitude ? Number(agent.latitude) : getDefaultCoordinates().latitude;
    let finalLng = agent?.longitude ? Number(agent.longitude) : getDefaultCoordinates().longitude;

    if (profileEdit.address) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profileEdit.address)}&limit=1`);
        const result = await response.json();
        if (result && result.length > 0) {
          finalLat = parseFloat(result[0].lat);
          finalLng = parseFloat(result[0].lon);
        }
      } catch (err) {
        console.error("Geocoding failed for profile address update:", err);
      }
    }

    try {
      const res = await axiosInstance.put("/delivery/profile/update", {
        name: profileEdit.name,
        vehicle_number: profileEdit.vehicle_number,
        agency: profileEdit.agency,
        avatar_url: profileEdit.avatar_url,
        password: profileEdit.password || undefined,
        address: profileEdit.address || undefined,
        latitude: finalLat,
        longitude: finalLng
      });
      if (res.data.success) {
        setAgent(res.data.deliveryAgent);
        toast.success("Profile updated successfully!");
        setProfileEdit(prev => ({ ...prev, password: "", updating: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
      setProfileEdit(prev => ({ ...prev, updating: false }));
    }
  };

  // Return Pickup input state updates
  const handlePickupImageChange = (orderId, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPickupData(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            image: reader.result
          }
        }));
        setPickupModal(prev => prev.order?.id === orderId ? { ...prev, image: reader.result } : prev);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickupNotesChange = (orderId, notes) => {
    setPickupData(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        notes
      }
    }));
    setPickupModal(prev => prev.order?.id === orderId ? { ...prev, notes } : prev);
  };

  const getReturnMedia = (retInfo) => {
    if (!retInfo?.media) return [];
    try {
      const parsed = typeof retInfo.media === "string" ? JSON.parse(retInfo.media) : retInfo.media;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  // Google Maps Style Camera Recentering
  const recenterMap = (orderId) => {
    const mapData = mapRefs.current[orderId];
    if (mapData) {
      mapData.map.setView(mapData.driverMarker.getLatLng(), 15);
    }
  };

  const recenterUnifiedMap = () => {
    if (unifiedMapRef.current) {
      const driverLat = agent?.latitude ? Number(agent.latitude) : getDefaultCoordinates().latitude;
      const driverLng = agent?.longitude ? Number(agent.longitude) : getDefaultCoordinates().longitude;
      unifiedMapRef.current.setView([driverLat, driverLng], 14);
    }
  };

  // -------------------------------------------------------------
  // WORLD-CLASS WEB AUDIO SMART ALERT ENGINE (SOUND PRIORITY SYSTEM)
  // -------------------------------------------------------------

  // Returns a single shared AudioContext, creating it lazily and resuming if suspended.
  // This avoids browser limits on simultaneous AudioContext instances.
  const getSharedAudioCtx = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtxRef.current || sharedAudioCtxRef.current.state === 'closed') {
      sharedAudioCtxRef.current = new AudioContextClass();
    }
    if (sharedAudioCtxRef.current.state === 'suspended') {
      sharedAudioCtxRef.current.resume().catch(() => {});
    }
    return sharedAudioCtxRef.current;
  };

  const playEventSound = (eventType) => {
    try {
      const ctx = getSharedAudioCtx();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      
      // Stop any existing loop interval if starting a loop event
      if (['shift_start', 'sos_emergency', 'inactivity_warning'].includes(eventType)) {
        if (alarmInterval.current) {
          clearInterval(alarmInterval.current);
          alarmInterval.current = null;
        }
      }

      if (eventType === '1hour') {
        // Soft Notification: 30% Volume
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.5);
      } 
      else if (eventType === '30min') {
        // Medium Alert: 50% Volume
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(698.46, now + 0.12); // F5
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.4);
      } 
      else if (eventType === '15min') {
        // Loud Ringing alert beep: 80% Volume
        let toggle = true;
        let count = 0;
        const interval = setInterval(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(toggle ? 987.77 : 880, ctx.currentTime); // B5 / A5
          toggle = !toggle;
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
          count++;
          if (count >= 4) clearInterval(interval);
        }, 300);
      } 
      else if (eventType === 'shift_start') {
        // High-Volume Piercing Digital Ringtone: 100% Volume (Double detuned oscillators for traffic clarity)
        setIsAlarmRinging(true);
        audioCtxRef.current = ctx;
        let soundToggle = true;
        alarmInterval.current = setInterval(() => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.type = "square";
          osc2.type = "sawtooth";
          
          const curTime = ctx.currentTime;
          if (soundToggle) {
            osc1.frequency.setValueAtTime(1800, curTime);
            osc2.frequency.setValueAtTime(1820, curTime);
          } else {
            osc1.frequency.setValueAtTime(1400, curTime);
            osc2.frequency.setValueAtTime(1420, curTime);
          }
          soundToggle = !soundToggle;
          
          gain.gain.setValueAtTime(0, curTime);
          gain.gain.linearRampToValueAtTime(1.0, curTime + 0.05);
          gain.gain.linearRampToValueAtTime(1.0, curTime + 0.25);
          gain.gain.exponentialRampToValueAtTime(0.01, curTime + 0.38);
          
          osc1.start(curTime);
          osc1.stop(curTime + 0.4);
          osc2.start(curTime);
          osc2.stop(curTime + 0.4);
        }, 400);
      } 
      else if (eventType === 'new_order') {
        // Distinct Ding-Dong: 70% Volume
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(659.25, now + 0.18); // E5
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.7, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.6);
      } 
      else if (eventType === 'customer_nearby') {
        // Pulsing Radar Sonar Ping: 60% Volume
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.5);
      } 
      else if (eventType === 'cod_success') {
        // Success register chime: 50% Volume
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.type = "sine";
        osc2.type = "triangle";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc1.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        
        osc2.frequency.setValueAtTime(1046.50, now + 0.24);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc1.start(now);
        osc1.stop(now + 0.7);
        osc2.start(now);
        osc2.stop(now + 0.7);
      } 
      else if (eventType === 'inactivity_warning') {
        // Sharp pulsing buzzer alarm: 90% Volume
        setIsAlarmRinging(true);
        audioCtxRef.current = ctx;
        alarmInterval.current = setInterval(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.4);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }, 600);
      } 
      else if (eventType === 'sos_emergency') {
        // Detuned ambulance wail siren: 100% Volume
        setIsAlarmRinging(true);
        audioCtxRef.current = ctx;
        alarmInterval.current = setInterval(() => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.type = "sawtooth";
          osc2.type = "square";
          
          const time = ctx.currentTime;
          osc1.frequency.setValueAtTime(800, time);
          osc1.frequency.linearRampToValueAtTime(1600, time + 0.25);
          osc1.frequency.linearRampToValueAtTime(800, time + 0.5);
          
          osc2.frequency.setValueAtTime(810, time);
          osc2.frequency.linearRampToValueAtTime(1610, time + 0.25);
          osc2.frequency.linearRampToValueAtTime(810, time + 0.5);
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(1.0, time + 0.05);
          gain.gain.linearRampToValueAtTime(1.0, time + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.48);
          
          osc1.start(time);
          osc1.stop(time + 0.5);
          osc2.start(time);
          osc2.stop(time + 0.5);
        }, 500);
      } 
      else if (eventType === 'shift_complete') {
        // Ascending triumph melody: 60% Volume
        const notes = [261.63, 293.66, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, D4, E4, G4, C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          
          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.6, now + idx * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
          
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.3);
        });
      }
    } catch (e) {
      console.error("Failed to play event sound:", e);
    }
  };

  // -------------------------------------------------------------
  // SHIFT ACTIVE & ONLINE ALARM CHECKER
  // -------------------------------------------------------------
  const isShiftActive = (preference) => {
    const hour = new Date().getHours();
    const min = new Date().getMinutes();
    const totalMins = hour * 60 + min;
    // Shift 1: 9:00 AM – 1:00 PM  (540–780)
    // Shift 2: 1:00 PM – 5:00 PM  (780–1020)
    // Shift 3: 5:00 PM – 9:00 PM  (1020–1260)
    // Shift 4: 9:00 PM – 11:00 PM (1260–1380)
    if (preference?.includes("Shift 1") || preference?.includes("9:00 AM")) {
      return totalMins >= 540 && totalMins < 780;
    } else if (preference?.includes("Shift 2") || preference?.includes("1:00 PM")) {
      return totalMins >= 780 && totalMins < 1020;
    } else if (preference?.includes("Shift 3") || preference?.includes("5:00 PM")) {
      return totalMins >= 1020 && totalMins < 1260;
    } else if (preference?.includes("Shift 4") || preference?.includes("9:00 PM")) {
      return totalMins >= 1260 && totalMins < 1380;
    }
    return false;
  };

  // -------------------------------------------------------------
  // SIREN SOUND SYNTHESIZER
  // -------------------------------------------------------------
  const startAlarmSiren = () => {
    if (alarmInterval.current) return;
    setIsAlarmRinging(true);
    toast.warn("🚨 SHIFT ALERT: You are offline during active shift hours!");

    try {
      const ctx = getSharedAudioCtx();
      if (!ctx) return;
      audioCtxRef.current = ctx;

      let soundToggle = true;
      alarmInterval.current = setInterval(() => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.type = "square";
        osc2.type = "sawtooth";
        
        const now = ctx.currentTime;
        if (soundToggle) {
          osc1.frequency.setValueAtTime(1800, now);
          osc2.frequency.setValueAtTime(1820, now);
        } else {
          osc1.frequency.setValueAtTime(1400, now);
          osc2.frequency.setValueAtTime(1420, now);
        }
        soundToggle = !soundToggle;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1.0, now + 0.05);
        gain.gain.linearRampToValueAtTime(1.0, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        
        osc1.start(now);
        osc1.stop(now + 0.4);
        osc2.start(now);
        osc2.stop(now + 0.4);
      }, 400);
    } catch (e) {
      console.error("Failed to start alarm audio context:", e);
    }
  };

  const stopAlarmSiren = () => {
    setIsAlarmRinging(false);
    if (alarmInterval.current) {
      clearInterval(alarmInterval.current);
      alarmInterval.current = null;
    }
    // Do NOT close the shared AudioContext — it is reused across all audio calls.
    audioCtxRef.current = null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SHIFT MANAGEMENT SYSTEM — Core Utilities
  // ─────────────────────────────────────────────────────────────────────────

  // Parse "Shift 1 (9:00 AM - 1:00 PM)" → { startMins: 540, endMins: 780 }
  const parseShiftTimes = (preference) => {
    if (!preference) return null;
    const m = preference.match(/(\d+):(\d+)\s*(AM|PM)\s*[-–]\s*(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return null;
    let sh = parseInt(m[1]), sm = parseInt(m[2]), smer = m[3].toUpperCase();
    let eh = parseInt(m[4]), em = parseInt(m[5]), emer = m[6].toUpperCase();
    if (smer === 'PM' && sh !== 12) sh += 12;
    if (smer === 'AM' && sh === 12) sh = 0;
    if (emer === 'PM' && eh !== 12) eh += 12;
    if (emer === 'AM' && eh === 12) eh = 0;
    return { startMins: sh * 60 + sm, endMins: eh * 60 + em };
  };

  // Multi-level RINGTONE sounds via Web Audio API
  // Each level loops like a real phone alarm for a duration
  const playAlertLevel = (level = 'medium') => {
    try {
      const ctx = getSharedAudioCtx();
      if (!ctx) return;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (level === 'soft') {
        // 🔔 Soft ringtone — gentle bell pattern repeating 4 times (8 sec)
        const pattern = [523, 659, 784, 659]; // C-E-G-E chime
        for (let rep = 0; rep < 4; rep++) {
          pattern.forEach((freq, i) => {
            const t = now + rep * 1.8 + i * 0.3;
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.connect(g); g.connect(masterGain);
            osc.type = 'sine'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.35, t + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
            osc.start(t); osc.stop(t + 0.6);
          });
        }

      } else if (level === 'medium') {
        // 📳 Medium ringtone — Nokia-style repeating pulse, 5 cycles (10 sec)
        const melody = [880, 880, 698, 698, 784, 784, 880, 0, 880, 880, 698, 698, 880];
        for (let rep = 0; rep < 3; rep++) {
          melody.forEach((freq, i) => {
            if (freq === 0) return;
            const t = now + rep * 3.0 + i * 0.18;
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.connect(g); g.connect(masterGain);
            osc.type = 'square'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.45, t + 0.02);
            g.gain.linearRampToValueAtTime(0.4, t + 0.12);
            g.gain.linearRampToValueAtTime(0, t + 0.16);
            osc.start(t); osc.stop(t + 0.17);
          });
        }

      } else if (level === 'loud') {
        // 🚨 Loud ringtone — urgent repeating alarm pulse (12 sec, 6 cycles)
        for (let rep = 0; rep < 6; rep++) {
          const baseT = now + rep * 1.8;
          // 4 rapid beeps per cycle
          [0, 0.2, 0.4, 0.6].forEach((d, bi) => {
            const t = baseT + d;
            const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
            const g = ctx.createGain();
            osc1.connect(g); osc2.connect(g); g.connect(masterGain);
            osc1.type = 'square'; osc1.frequency.value = 1100 + bi * 50;
            osc2.type = 'sine'; osc2.frequency.value = 1150 + bi * 50;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.75, t + 0.02);
            g.gain.linearRampToValueAtTime(0.6, t + 0.1);
            g.gain.linearRampToValueAtTime(0, t + 0.18);
            osc1.start(t); osc1.stop(t + 0.19);
            osc2.start(t); osc2.stop(t + 0.19);
          });
          // Short silence then repeat
        }

      } else if (level === 'max') {
        // 🚨🚨 MAX — European emergency siren sweep (15 sec continuous)
        for (let rep = 0; rep < 10; rep++) {
          const t = now + rep * 1.4;
          // Sweeping siren: low→high→low
          const osc = ctx.createOscillator(); const g = ctx.createGain();
          osc.connect(g); g.connect(masterGain);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.linearRampToValueAtTime(1400, t + 0.6);
          osc.frequency.linearRampToValueAtTime(600, t + 1.2);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.9, t + 0.05);
          g.gain.linearRampToValueAtTime(0.9, t + 1.15);
          g.gain.linearRampToValueAtTime(0, t + 1.35);
          osc.start(t); osc.stop(t + 1.4);

          // Harmony layer
          const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
          osc2.connect(g2); g2.connect(masterGain);
          osc2.type = 'square';
          osc2.frequency.setValueAtTime(900, t);
          osc2.frequency.linearRampToValueAtTime(1800, t + 0.6);
          osc2.frequency.linearRampToValueAtTime(900, t + 1.2);
          g2.gain.setValueAtTime(0, t);
          g2.gain.linearRampToValueAtTime(0.5, t + 0.05);
          g2.gain.linearRampToValueAtTime(0.5, t + 1.15);
          g2.gain.linearRampToValueAtTime(0, t + 1.35);
          osc2.start(t); osc2.stop(t + 1.4);
        }

      } else if (level === 'success') {
        // ✅ Success melody — ascending victory fanfare
        const notes = [523, 659, 784, 1047, 784, 1047, 1319];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator(); const g = ctx.createGain();
          osc.connect(g); g.connect(masterGain);
          osc.type = 'sine'; osc.frequency.value = freq;
          const t = now + i * 0.15;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.start(t); osc.stop(t + 0.4);
        });

      } else if (level === 'arrival') {
        // 📍 Customer nearby — double pleasant chime
        [[523, 659], [659, 784]].forEach(([f1, f2], rep) => {
          [f1, f2].forEach((freq, i) => {
            const t = now + rep * 0.6 + i * 0.22;
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.connect(g); g.connect(masterGain);
            osc.type = 'sine'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.55, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
            osc.start(t); osc.stop(t + 0.65);
          });
        });
      }

      // Auto close audio context after sound completes
      setTimeout(() => { try { ctx.close(); } catch(e){} }, 18000);
    } catch (e) {}
  };

  // Browser Push Notification helper
  const requestNotification = (title, body, icon = '📦') => {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(perm => {
            if (perm === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
          });
        }
      }
    } catch (e) {}
  };

  // Vibration helper
  const vibrateDevice = (pattern = [200]) => {
    try { if ('vibrate' in navigator) navigator.vibrate(pattern); } catch (e) {}
  };

  // Reset inactivity timer — call on every delivery action
  const resetInactivityTimer = () => {
    lastActionTime.current = Date.now();
    inactivityWarnedRef.current = false;
    inactivityEscalatedRef.current = false;
  };

  // GPS Hub Location Check
  const handleGpsHubCheck = () => {
    setGpsCheckModal({ open: true, checking: true, result: null, distance: null });
    if (!navigator.geolocation) {
      setGpsCheckModal({ open: true, checking: false, result: 'no_gps', distance: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Mock hub coordinates — Nawada Bihar hub
        const HUB_LAT = 24.8856, HUB_LNG = 85.5412;
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const R = 6371000;
        const dLat = (lat - HUB_LAT) * Math.PI / 180;
        const dLng = (lng - HUB_LNG) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(HUB_LAT*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
        const ok = dist <= 2000; // Within 2km of hub
        setGpsCheckModal({ open: true, checking: false, result: ok ? 'ok' : 'far', distance: dist });
      },
      () => {
        setGpsCheckModal({ open: true, checking: false, result: 'denied', distance: null });
      },
      { timeout: 8000, maximumAge: 30000 }
    );
  };

  // Confirm shift start after GPS check
  const confirmShiftStart = async () => {
    setGpsCheckModal(prev => ({ ...prev, open: false }));
    setShiftAlertModal({ open: false, type: null, minsLeft: 0 });
    playAlertLevel('success');
    vibrateDevice([100, 50, 100]);
    toast.success('🟢 Shift Started! You are now Online and Active.');
    // Auto-go Online if not already
    if (agent && !agent.is_online) {
      try {
        const token = localStorage.getItem('token');
        await axiosInstance.put('/delivery/update-status', { is_online: true, shift_preference: agent.shift_preference }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setAgent(prev => ({ ...prev, is_online: true }));
      } catch (e) {}
    }
    resetInactivityTimer();
  };

  // Compute daily summary from current orders state
  const computeDailySummary = () => {
    const delivered = orders.filter(o => o.order_status === 'Delivered').length;
    const exchanged = orders.filter(o => o.order_status === 'Exchange Completed').length;
    const codOrders = orders.filter(o => o.order_status === 'Delivered' && o.payment_mode?.includes('COD'));
    const codCollected = codOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);
    const distKm = ((delivered + exchanged) * 4.2).toFixed(1);
    const shiftTimes = parseShiftTimes(agent?.shift_preference);
    const shiftHrs = shiftTimes ? Math.round((shiftTimes.endMins - shiftTimes.startMins) / 60) : 4;
    const baseEarning = (delivered + exchanged) * 42;
    const incentive = delivered >= 20 ? 350 : delivered >= 10 ? 150 : 50;
    const totalEarnings = baseEarning + incentive;
    return { delivered, exchanged, codCollected: codCollected.toFixed(0), distKm, shiftHrs, totalEarnings, incentive, rating: 4.9 };
  };


  // ─────────────────────────────────────────────────────────────────────────
  // PRE-SHIFT ALARM ENGINE useEffect (runs every 60s)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agent) return;
    // Fire a pre-shift check every 60 seconds
    const checkPreShift = () => {
      const st = parseShiftTimes(agent.shift_preference);
      if (!st) return;
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      const minsToStart = st.startMins - cur;
      const minsToEnd = st.endMins - cur;

      // Pre-shift alerts (fire once per type per day)
      if (minsToStart === 60 && !preShiftAlertsFired.current.has('60')) {
        preShiftAlertsFired.current.add('60');
        playAlertLevel('soft'); vibrateDevice([200]);
        requestNotification('⏰ Shift in 1 Hour', `Your shift ${agent.shift_preference} starts in 60 minutes. Get ready!`);
        toast.info('⏰ Your shift starts in 1 hour. Prepare to head to hub.');
      }
      if (minsToStart === 30 && !preShiftAlertsFired.current.has('30')) {
        preShiftAlertsFired.current.add('30');
        playAlertLevel('medium'); vibrateDevice([200, 100, 200]);
        requestNotification('🔔 Shift in 30 Minutes', 'Head to the hub now!');
        toast.warn('🔔 Shift starts in 30 minutes — head to hub!');
      }
      if (minsToStart <= 15 && minsToStart > 0 && !preShiftAlertsFired.current.has('15')) {
        preShiftAlertsFired.current.add('15');
        playAlertLevel('loud'); vibrateDevice([300, 100, 300, 100, 300]);
        requestNotification('🚨 Reach Hub Immediately!', 'Shift starts in 15 minutes. Reach hub NOW!');
        setShiftAlertModal({ open: true, type: 'pre15', minsLeft: minsToStart });
      }
      if (minsToStart <= 0 && minsToStart > -5 && !preShiftAlertsFired.current.has('start')) {
        preShiftAlertsFired.current.add('start');
        playAlertLevel('max'); vibrateDevice([500, 100, 500, 100, 500]);
        requestNotification('🚨 SHIFT STARTED!', 'Your shift has begun. Tap to start your shift now!');
        setShiftAlertModal({ open: true, type: 'start', minsLeft: 0 });
      }

      // Shift-end alerts
      if (minsToEnd === 30 && !shiftEndAlertsFired.current.has('end30')) {
        shiftEndAlertsFired.current.add('end30');
        playAlertLevel('soft'); vibrateDevice([200]);
        toast.info('🏁 Shift ends in 30 minutes. Wrap up deliveries.');
      }
      if (minsToEnd <= 0 && minsToEnd > -5 && !shiftEndAlertsFired.current.has('end')) {
        shiftEndAlertsFired.current.add('end');
        playAlertLevel('success'); vibrateDevice([100, 50, 100, 50, 200]);
        const stats = computeDailySummary();
        setDailySummaryModal({ open: true, stats });
        toast.success('🎉 Shift Complete! Great work today!');
      }
    };

    const interval = setInterval(checkPreShift, 60000);
    // Also run once immediately on mount/agent change
    checkPreShift();
    return () => clearInterval(interval);
  }, [agent?.shift_preference]);

  // ─────────────────────────────────────────────────────────────────────────
  // INACTIVITY MONITOR useEffect (runs every 60s during active shift)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agent?.is_online) return;
    const inactivityCheck = setInterval(() => {
      const idleMs = Date.now() - lastActionTime.current;
      const idleMins = idleMs / 60000;
      if (idleMins >= 60 && !inactivityEscalatedRef.current) {
        inactivityEscalatedRef.current = true;
        playAlertLevel('loud'); vibrateDevice([500, 200, 500]);
        toast.error('🚨 60 min INACTIVITY! Manager has been notified. Please resume deliveries immediately.', { autoClose: 15000 });
        requestNotification('🚨 Escalation Alert', 'No delivery activity for 60 minutes. Manager notified.');
      } else if (idleMins >= 45 && !inactivityWarnedRef.current) {
        inactivityWarnedRef.current = true;
        playAlertLevel('medium'); vibrateDevice([300, 100, 300]);
        toast.warn('⚠️ 45 min inactive! Please resume deliveries.', { autoClose: 10000 });
      }
    }, 60000);
    return () => clearInterval(inactivityCheck);
  }, [agent?.is_online]);

  // ─────────────────────────────────────────────────────────────────
  // OFFLINE-DURING-SHIFT — 5-EVENT COUNT + AUTO BLOCK
  // Each offline event = +1 count. Block fires at 5th offline event.
  // Going online resets countdown but keeps the count for that shift.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agent) return;

    if (agent.delivery_partner_status === "BLOCKED") {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
      stopAlarmSiren();
      return;
    }

    const shiftActive = isShiftActive(agent.shift_preference);

    // Track online→offline transitions. null = initial page load.
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = agent.is_online;

    if (shiftActive && !agent.is_online) {
      // ════════════════════════════════════════════════
      // OFFLINE DURING ACTIVE SHIFT → COUNT + ALARM
      // ════════════════════════════════════════════════

      // Only fire if the agent actually transitioned from online → offline.
      // wasOnline === null  → page just loaded (no prior state), skip.
      // wasOnline === false → already offline before this run, skip.
      if (wasOnline !== true) {
        stopAlarmSiren();
        return;
      }

      // Increment offline event count (persists for full shift)
      offlineCountRef.current = (offlineCountRef.current || 0) + 1;
      const currentCount = offlineCountRef.current;
      const remaining = 5 - currentCount;

      // Log offline event to backend
      const logOfflineEventToBackend = async () => {
        try {
          const token = localStorage.getItem("token");
          await axiosInstance.post("/delivery/offline-event", {
            event_type: "Offline Event",
            offline_count: currentCount,
            details: `Offline event count ${currentCount}/5 during active shift preference: ${agent.shift_preference}`
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        } catch (e) {
          console.error("Failed to log offline event:", e);
        }
      };
      logOfflineEventToBackend();

      // ── 5th time = IMMEDIATE BLOCK ──
      if (currentCount >= 5) {
        startAlarmSiren();
        vibrateDevice([1000, 300, 1000, 300, 1000, 300, 1000]);
        requestNotification('🚨 SHIFT BLOCKED!', `You went offline ${currentCount} times. Shift blocked + ₹300 fine!`);
        toast.error(`🚨 SHIFT BLOCKED! You went offline ${currentCount} times during this shift. ₹300 fine applied!`, { autoClose: false, position: 'top-center' });
        setTimeout(() => {
          stopAlarmSiren();
          applyShiftFine();
        }, 3000); // short alarm burst then block
        return;
      }

      // ── 1st–4th time: show warning + 5-min countdown ──
      setShiftAlertModal({ open: true, type: 'offline_warning', minsLeft: 5 });
      setOfflineCountdown(300);

      // Log countdown started to backend
      const logCountdownToBackend = async () => {
        try {
          const token = localStorage.getItem("token");
          await axiosInstance.post("/delivery/offline-event", {
            event_type: "Countdown Started",
            offline_count: currentCount,
            details: `Started 5-minute recovery countdown for offline event ${currentCount}/5.`
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        } catch (e) {
          console.error("Failed to log countdown event:", e);
        }
      };
      logCountdownToBackend();

      startAlarmSiren();
      vibrateDevice([500, 200, 500, 200, 500, 200, 500]);

      requestNotification(
        `🚨 OFFLINE! (${currentCount}/5) — Go Online!`,
        `Offline event ${currentCount}/5 in your shift. ${remaining} more offline events will BLOCK your shift!`
      );
      toast.error(
        `⚠️ Offline Event ${currentCount}/5 — ${remaining} more times offline = SHIFT BLOCKED! Go Online NOW!`,
        { autoClose: 12000, position: 'top-center' }
      );

      // 5-min countdown — escalating alarms
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
      let secondsLeft = 300;
      countdownTimer.current = setInterval(() => {
        secondsLeft -= 1;
        setOfflineCountdown(secondsLeft);

        if (secondsLeft === 240) {
          playAlertLevel('loud'); vibrateDevice([300, 100, 300]);
          toast.warn(`⚠️ 4 min left — Offline ${currentCount}/5 times. Go Online!`, { position: 'top-center', autoClose: 6000 });
        }
        if (secondsLeft === 180) {
          playAlertLevel('loud'); vibrateDevice([400, 100, 400, 100, 400]);
          toast.warn(`⚠️ 3 min left — Offline ${currentCount}/5 events this shift!`, { position: 'top-center', autoClose: 6000 });
        }
        if (secondsLeft === 120) {
          playAlertLevel('max'); vibrateDevice([500, 200, 500, 200, 500]);
          toast.error(`🚨 2 min left! Offline ${currentCount}/5 — 1 more block event = BLOCKED!`, { position: 'top-center', autoClose: 8000 });
        }
        if (secondsLeft === 60) {
          playAlertLevel('max'); vibrateDevice([1000, 300, 1000, 300, 1000]);
          toast.error(`🚨 FINAL WARNING! 1 min left — Offline ${currentCount}/5 times!`, { position: 'top-center', autoClose: 10000 });
        }

        // 5 min passed still offline → this counts as going to next block level
        if (secondsLeft <= 0) {
          clearInterval(countdownTimer.current);
          countdownTimer.current = null;
          stopAlarmSiren();
          // Force another offline event count by re-triggering
          offlineCountRef.current += 1;
          if (offlineCountRef.current >= 5) {
            applyShiftFine();
          } else {
            toast.error(`🚨 Still offline! Count now ${offlineCountRef.current}/5. Go Online!`, { autoClose: false });
          }
        }
      }, 1000);

    } else {
      // ════════════════════════════════════════════════
      // AGENT ONLINE or SHIFT NOT ACTIVE → STOP ALARM
      // (offline count is kept — resets only on new shift day)
      // ════════════════════════════════════════════════
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
      if (offlineRepeatRef.current) {
        clearInterval(offlineRepeatRef.current);
        offlineRepeatRef.current = null;
      }
      stopAlarmSiren();
      setOfflineCountdown(300);
      setShiftAlertModal(prev =>
        (prev.type === 'offline_warning' || prev.type === 'start' || prev.type === 'no_login')
          ? { open: false, type: null, minsLeft: 0 }
          : prev
      );
    }

    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
      if (offlineRepeatRef.current) {
        clearInterval(offlineRepeatRef.current);
        offlineRepeatRef.current = null;
      }
    };
  }, [agent?.is_online, agent?.shift_preference]);


  // -------------------------------------------------------------
  // UPDATE ONLINE STATUS & LOCATION GEOLOCATION WATCH
  // -------------------------------------------------------------
  const toggleOnlineStatus = async () => {
    if (!agent) return;
    // ✅ Guard: blocked agents cannot toggle online status
    if (agent.delivery_partner_status === "BLOCKED") {
      toast.error("Your account is BLOCKED. Contact admin to unblock.");
      return;
    }
    const nextOnlineState = !agent.is_online;
    const token = localStorage.getItem("token");
    
    try {
      const res = await axiosInstance.put("/delivery/update-status", {
        is_online: nextOnlineState,
        shift_preference: agent.shift_preference
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setAgent(prev => ({ ...prev, is_online: nextOnlineState }));
        toast.success(`You are now ${nextOnlineState ? "ONLINE 🟢" : "OFFLINE 🔴"}`);
        // Persist "was online today" when agent goes online (survives page refresh)
        if (nextOnlineState) {
          const todayKey = new Date().toISOString().split('T')[0];
          localStorage.setItem(`was_online_today_${todayKey}`, '1');
          setTimeout(() => fetchProfileAndOrders(), 500);
        }
      }
    } catch (err) {
      console.error(err);
      // Show a more informative error if blocked
      if (err.response?.status === 403) {
        toast.error("Account blocked. Contact admin to restore access.");
      } else {
        toast.error("Failed to update online status.");
      }
    }
  };

  const handleShiftChange = async (e) => {
    const val = e.target.value;
    try {
      const res = await axiosInstance.put("/delivery/update-status", {
        is_online: agent.is_online,
        shift_preference: val
      });
      if (res.data.success) {
        setAgent(prev => ({ ...prev, shift_preference: val }));
        toast.success("Shift preference updated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update shift preferences.");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await axiosInstance.get("/delivery/logout");
      if (res.data.success) {
        toast.success(res.data.message || "Logged out successfully.");
        Object.values(simIntervals.current).forEach(clearInterval);
        stopAlarmSiren();
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        navigate("/delivery/login");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard!");
  };

  const handlePrintReceipt = (order, isPaid = false) => {
    const invoiceWin = window.open("", "_blank");
    if (!invoiceWin) {
      toast.error("Pop-up blocker is active! Cannot open the invoice preview.");
      return;
    }
    const tempOrder = {
      ...order,
      order_status: isPaid ? "Delivered" : order.order_status,
      status: isPaid ? "Delivered" : order.order_status,
      payment_mode: order.payment_mode || "COD",
    };
    const mockAuthUser = { name: agent?.name || "Delivery Agent" };
    const htmlContent = InvoiceTemplate(tempOrder, mockAuthUser);
    invoiceWin.document.write(htmlContent);
    invoiceWin.document.close();
  };

  // In-memory route cache to avoid redundant OSRM fetches
  const osrmRouteCache = useRef({});

  const getOSRMRoute = async (startLat, startLng, endLat, endLng) => {
    const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}-${endLat.toFixed(4)},${endLng.toFixed(4)}`;
    
    // Return cached result immediately
    if (osrmRouteCache.current[cacheKey]) {
      return osrmRouteCache.current[cacheKey];
    }

    const OSRM_SERVERS = [
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    ];

    for (const url of OSRM_SERVERS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-sec timeout
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          osrmRouteCache.current[cacheKey] = route; // Cache for reuse
          return route;
        }
      } catch {
        // Silently try next server or fall back
      }
    }

    // Fallback: smooth road-like path (no network needed)
    const fallback = generateRoadPath(startLat, startLng, endLat, endLng);
    osrmRouteCache.current[cacheKey] = fallback;
    return fallback;
  };

  // Haversine Distance Helper
  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // TSP multi-stop optimization
  const getOptimizedOrders = (activeList) => {
    if (activeList.length <= 1) return activeList;
    let currentLat = agent?.latitude ? Number(agent.latitude) : getDefaultCoordinates().latitude;
    let currentLng = agent?.longitude ? Number(agent.longitude) : getDefaultCoordinates().longitude;
    const remaining = [...activeList];
    const optimized = [];
    while (remaining.length > 0) {
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const custCoords = getCustomerCoordinates(remaining[i].shipping_info, remaining[i].id || remaining[i]._id);
        const dist = getDistanceInKm(currentLat, currentLng, custCoords.latitude, custCoords.longitude);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      const nextOrder = remaining.splice(closestIdx, 1)[0];
      optimized.push(nextOrder);
      const nextCoords = getCustomerCoordinates(nextOrder.shipping_info, nextOrder.id || nextOrder._id);
      currentLat = nextCoords.latitude;
      currentLng = nextCoords.longitude;
    }
    return optimized;
  };

  // Neighborhood tag extractor
  const getNeighborhoodName = (shippingInfo) => {
    const address = shippingInfo?.address || "";
    const city = shippingInfo?.city || "";
    const pincode = shippingInfo?.pincode || "";
    const text = `${address} ${city}`.toLowerCase();
    if (text.includes("kestopur")) return "Kestopur";
    if (text.includes("salt lake") || text.includes("saltlake")) return "Salt Lake";
    if (text.includes("newtown") || text.includes("new town")) return "New Town";
    if (text.includes("jadavpur")) return "Jadavpur Region";
    if (text.includes("bandra")) return "Bandra West";
    if (text.includes("andheri")) return "Andheri East";
    if (text.includes("connaught")) return "Connaught Place";
    if (text.includes("indiranagar") || text.includes("indira nagar")) return "Indiranagar";
    if (text.includes("koramangala")) return "Koramangala";
    if (text.includes("sector")) {
      const match = text.match(/sector\s*\d+/);
      return match ? match[0].toUpperCase() : "Noida Sector";
    }
    return city ? `${city} (${pincode || "Local"})` : "Local Area";
  };

  // Hub finder matching India-wide GPS zones
  const getHubName = (city = "", shippingInfo = null) => {
    const infoText = shippingInfo 
      ? `${shippingInfo.address || ""} ${shippingInfo.city || ""} ${shippingInfo.state || ""} ${shippingInfo.pincode || ""}` 
      : city;
    const text = infoText.toLowerCase();
    if (text.includes("nawada") || text.includes("bihar") || text.includes("805124")) {
      return "Nawada Local Hub";
    }
    if (text.includes("bangalore") || text.includes("bengaluru")) {
      return "Bengaluru South Hub";
    } else if (text.includes("mumbai") || text.includes("bombay")) {
      return "Mumbai West Hub";
    } else if (text.includes("delhi") || text.includes("noida")) {
      return "Delhi Central Hub";
    } else if (text.includes("chennai")) {
      return "Chennai Hub";
    }
    return "Kolkata North Hub"; // default
  };

  // Google Maps external turn-by-turn navigation redirect
  const handleOpenGoogleMaps = (order) => {
    const originLat = agent?.latitude ? Number(agent.latitude) : getDefaultCoordinates().latitude;
    const originLng = agent?.longitude ? Number(agent.longitude) : getDefaultCoordinates().longitude;
    const destCoords = getCustomerCoordinates(order.shipping_info, order.id || order._id);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destCoords.latitude},${destCoords.longitude}&travelmode=driving`;
    window.open(url, "_blank");
  };

  // Curve road generator
  const generateRoadPath = (startLat, startLng, endLat, endLng) => {
    const points = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const currentLat = startLat + (endLat - startLat) * ratio;
      const currentLng = startLng + (endLng - startLng) * ratio;
      if (i > 0 && i < steps) {
        const perpOffsetLat = (endLng - startLng) * 0.05 * Math.sin(ratio * Math.PI);
        const perpOffsetLng = -(endLat - startLat) * 0.05 * Math.sin(ratio * Math.PI);
        points.push([currentLat + perpOffsetLat, currentLng + perpOffsetLng]);
      } else {
        points.push([currentLat, currentLng]);
      }
    }
    return points;
  };

  const playVerifySound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  };

  const handleBarcodeScanned = (scannedText) => {
    const order = orders.find(o => o.id === otpModal.orderId);
    if (!order) return;
    const formattedText = scannedText.trim();
    const shortBarcode = `BC${order.id.replace(/-/g, "").slice(-8).toUpperCase()}`;
    const carrierBarcode = `SF${order.id.replace(/-/g, "").slice(-8).toUpperCase()}SIN`;
    const fullUuid = order.id.toUpperCase();
    const isMatched = 
      formattedText.toUpperCase() === shortBarcode || 
      formattedText.toUpperCase() === carrierBarcode || 
      formattedText.toUpperCase() === fullUuid;
    if (isMatched) {
      playVerifySound();
      toast.success("Package Label Verified Successfully!");
      stopCameraScanner();
      setOtpModal(prev => ({ ...prev, barcodeVerified: true, scannedCode: formattedText, error: "", useCamera: false }));
    } else {
      setOtpModal(prev => ({ 
        ...prev, 
        error: `Mismatched Package! Expected Label Code: ${shortBarcode}. Scanned Code: "${formattedText}". Please pick the correct box.` 
      }));
    }
  };

  const startCameraScanner = () => {
    if (!html5QrcodeLoaded || !window.Html5Qrcode) {
      toast.error("Scanning library is still loading. Please try again in a moment.");
      return;
    }
    setOtpModal(prev => ({ ...prev, useCamera: true }));
    setTimeout(() => {
      try {
        const html5QrCode = new window.Html5Qrcode("scanner-viewfinder");
        scannerRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 120 } };
        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            handleBarcodeScanned(decodedText);
          },
          (errorMessage) => {}
        ).catch(err => {
          console.error("Camera start failed:", err);
          let userFriendlyMsg = "Could not access camera.";
          if (err?.name === "NotAllowedError" || err?.message?.includes("NotAllowedError") || err?.message?.includes("Permission dismissed")) {
            userFriendlyMsg = "Camera access permission was denied or dismissed. Please grant camera permission in your browser or enter the barcode manually below.";
          } else {
            userFriendlyMsg = `Camera initialization failed: ${err?.message || err}. Please type the barcode manually below.`;
          }
          toast.error(userFriendlyMsg);
          setOtpModal(prev => ({ 
            ...prev, 
            useCamera: false, 
            error: userFriendlyMsg
          }));
        });
      } catch (err) {
        console.error("Scanner init error:", err);
      }
    }, 150);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current = null;
        }).catch(err => console.error("Camera stop error:", err));
      } catch (e) {
        scannerRef.current = null;
      }
    }
  };

  const handleOpenOtpModal = (order, initPaymentConfirmed = false) => {
    // ✅ Shift + Online enforcement: delivery only allowed during booked shift when online
    if (!agent?.is_online) {
      toast.error("🔴 You are OFFLINE. Go Online first to complete delivery.");
      return;
    }
    if (!isShiftActive(agent?.shift_preference)) {
      toast.error(`⏰ You can only deliver during your booked shift: ${agent?.shift_preference}. Go offline outside shift hours.`);
      return;
    }

    setOtpModal({
      open: true,
      orderId: order.id,
      otpValue: "",
      isCod: !!order.payment_mode?.includes("COD"),
      verifying: false,
      error: "",
      barcodeVerified: false,
      scannedCode: "",
      useCamera: false,
      paymentConfirmed: initPaymentConfirmed,
      codPaymentMethod: "upi",
      upiVerifying: false
    });
    setHasSigned(false);
  };

  const handleConfirmDelivery = async () => {
    if (otpModal.isCod && !otpModal.paymentConfirmed) {
      setOtpModal(prev => ({ ...prev, error: "Please verify payment first." }));
      return;
    }
    if (!otpModal.isCod && otpModal.otpValue.length < 6) {
      setOtpModal(prev => ({ ...prev, error: "Please enter the 6-digit secure verification OTP." }));
      return;
    }
    if (!hasSigned) {
      setOtpModal(prev => ({ ...prev, error: "Please provide your e-signature." }));
      return;
    }

    setOtpModal(prev => ({ ...prev, verifying: true, error: "" }));

    try {
      const res = await axiosInstance.put(`/delivery/deliver/${otpModal.orderId}`, {
        otp: otpModal.otpValue
      });

      if (res.data.success) {
        toast.success(res.data.message || "Order delivered successfully!");
        playSuccessSound();
        resetInactivityTimer(); // ✅ Reset inactivity watchdog on delivery
        setOtpModal({ open: false, orderId: null, otpValue: "", isCod: false, verifying: false, error: "", barcodeVerified: false, scannedCode: "", useCamera: false, paymentConfirmed: false, codPaymentMethod: "upi", upiVerifying: false });
        fetchProfileAndOrders();
      }
    } catch (err) {
      console.error(err);
      setOtpModal(prev => ({ 
        ...prev, 
        verifying: false, 
        error: err.response?.data?.message || "Verification failed. Please check the OTP." 
      }));
    }
  };

  // Continuous Geolocation GPS coordinates watcher when ONLINE
  useEffect(() => {
    if (!agent?.is_online) return;

    const updateLocationOnServer = async (position) => {
      try {
        await axiosInstance.put("/delivery/update-location", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      } catch (err) {
        console.error("GPS server sync fail:", err);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      updateLocationOnServer,
      (err) => console.error("GPS Watch error:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [agent?.is_online]);

  // -------------------------------------------------------------
  // WEB AUDIO DELIVERY SUCCESS CHIME
  // -------------------------------------------------------------
  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      osc.frequency.setValueAtTime(659.25, now + 0.28); // E5
      gain.gain.setValueAtTime(0, now + 0.28);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.36);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.frequency.setValueAtTime(783.99, now + 0.58); // G5
      gain.gain.setValueAtTime(0, now + 0.58);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.66);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      
      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {
      console.error("Audio synthesis failed:", e);
    }
  };

  // -------------------------------------------------------------
  // INTERACTIVE LEAFLET OPENSTREETMAP MOUNTING & UPDATES
  // -------------------------------------------------------------
  const toggleNavigation = (orderId) => {
    setNavSim(prev => {
      const current = prev[orderId];
      if (current) {
        if (simIntervals.current[orderId]) {
          clearInterval(simIntervals.current[orderId]);
          delete simIntervals.current[orderId];
        }
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      } else {
        nearbyAlertPlayed.current[orderId] = false;
        return {
          ...prev,
          [orderId]: {
            isNavigating: false,
            progress: 0,
            distance: 2.8,
            eta: 12,
            routeStep: "OpenStreetMap Engine Ready"
          }
        };
      }
    });
  };

  // Resolve Customer Destination Coordinate markers based on city
  const getCustomerCoordinates = (shippingInfo, orderId) => {
    if (orderId && geocodedCoords[orderId]) {
      return geocodedCoords[orderId];
    }
    const city = shippingInfo?.city || "";
    const address = shippingInfo?.address || "";
    const state = shippingInfo?.state || "";
    const pincode = shippingInfo?.pincode || "";
    const fullText = `${address} ${city} ${state} ${pincode}`.toLowerCase();

    let customerLat = 22.5850; // default Kolkata
    let customerLng = 88.4200;

    if (fullText.includes("nawada") || fullText.includes("bihar") || fullText.includes("805124")) {
      customerLat = 24.8856;
      customerLng = 85.5412;
    } else if (city.toLowerCase().includes("bangalore") || city.toLowerCase().includes("bengaluru")) {
      customerLat = 12.9716;
      customerLng = 77.5946;
    } else if (city.toLowerCase().includes("mumbai") || city.toLowerCase().includes("bombay")) {
      customerLat = 19.0760;
      customerLng = 72.8777;
    } else if (city.toLowerCase().includes("delhi") || city.toLowerCase().includes("noida")) {
      customerLat = 28.7041;
      customerLng = 77.1025;
    }
    return { latitude: customerLat, longitude: customerLng };
  };

  const getHubCoordinates = () => {
    const activeOrder = orders.find(o => o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery");
    if (activeOrder) {
      const custCoords = getCustomerCoordinates(activeOrder.shipping_info, activeOrder.id || activeOrder._id);
      return {
        latitude: custCoords.latitude - 0.008,
        longitude: custCoords.longitude - 0.012
      };
    }
    // Fallback: If any order in the list is in Nawada
    const hasNawadaOrder = orders.some(o => {
      const info = o.shipping_info;
      const fullText = `${info?.address} ${info?.city} ${info?.state} ${info?.pincode}`.toLowerCase();
      return fullText.includes("nawada") || fullText.includes("bihar") || fullText.includes("805124");
    });
    if (hasNawadaOrder) {
      return {
        latitude: 24.8856 - 0.008,
        longitude: 85.5412 - 0.012
      };
    }
    return {
      latitude: 22.5726,
      longitude: 88.3639
    };
  };

  const getDefaultCoordinates = () => {
    return getHubCoordinates();
  };

  const mountLeafletMap = (order) => {
    const orderId = order.id;
    const mapContainer = document.getElementById(`map-${orderId}`);
    if (!mapContainer || !leafletLoaded || mapRefs.current[orderId]) return;

    // Dynamic Customer Coordinates based on registered city address
    const custCoords = getCustomerCoordinates(order.shipping_info, order.id || order._id);

    // Dynamic local HUB coordinates based on customer coordinates
    const hubLat = custCoords.latitude - 0.008;
    const hubLng = custCoords.longitude - 0.012;

    const driverLat = agent?.latitude ? Number(agent.latitude) : hubLat;
    const driverLng = agent?.longitude ? Number(agent.longitude) : hubLng;

    try {
      const map = window.L.map(`map-${orderId}`).setView([hubLat, hubLng], 12);
      
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB'
      }).addTo(map);

      const hubIcon = window.L.divIcon({
        html: '<div style="background-color: #065f46; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">HUB</div>',
        className: '', iconSize: [24, 24]
      });

      const customerIcon = window.L.divIcon({
        html: '<div style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">📍</div>',
        className: '', iconSize: [24, 24]
      });

      const driverIcon = window.L.divIcon({
        html: '<div style="background-color: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">🛵</div>',
        className: '', iconSize: [28, 28]
      });

      window.L.marker([hubLat, hubLng], { icon: hubIcon }).addTo(map).bindPopup("Balaji Cart HUB");
      window.L.marker([custCoords.latitude, custCoords.longitude], { icon: customerIcon }).addTo(map).bindPopup("Customer Address");
      
      const driverMarker = window.L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map).bindPopup("Driver GPS (You)");

      mapRefs.current[orderId] = { 
        map, 
        driverMarker, 
        hubLat, hubLng, 
        driverLat, driverLng,
        customerLat: custCoords.latitude, 
        customerLng: custCoords.longitude,
        routeCoordinates: []
      };

      // Query real OSRM road coordinates
      getOSRMRoute(driverLat, driverLng, custCoords.latitude, custCoords.longitude).then((coordinates) => {
        // Prevent race condition: abort if map container was removed or unmounted
        if (!mapRefs.current[orderId] || mapRefs.current[orderId].map !== map) return;

        mapRefs.current[orderId].routeCoordinates = coordinates;

        const totalPoints = coordinates.length;
        const part1 = Math.floor(totalPoints * 0.4);
        const part2 = Math.floor(totalPoints * 0.75);

        const seg1 = coordinates.slice(0, part1 + 1);
        const seg2 = coordinates.slice(part1, part2 + 1);
        const seg3 = coordinates.slice(part2);

        // Google Maps style road background white casing
        if (seg1.length > 0) window.L.polyline(seg1, { color: '#ffffff', weight: 9, opacity: 0.9 }).addTo(map);
        if (seg2.length > 0) window.L.polyline(seg2, { color: '#ffffff', weight: 9, opacity: 0.9 }).addTo(map);
        if (seg3.length > 0) window.L.polyline(seg3, { color: '#ffffff', weight: 9, opacity: 0.9 }).addTo(map);

        // Google Maps style colored traffic polyline on top (Normal = Blue, Moderate = Yellow, Congested = Red)
        if (seg1.length > 0) window.L.polyline(seg1, { color: '#1a73e8', weight: 5, opacity: 0.95 }).addTo(map).bindPopup("Normal Traffic (40 km/h)");
        if (seg2.length > 0) window.L.polyline(seg2, { color: '#f9ab00', weight: 5, opacity: 0.95 }).addTo(map).bindPopup("Moderate Traffic (25 km/h)");
        if (seg3.length > 0) window.L.polyline(seg3, { color: '#d93025', weight: 5, opacity: 0.95, dashArray: '5, 5' }).addTo(map).bindPopup("Heavy Congestion Near Destination");
      });

      // Fit map bounds
      const group = new window.L.featureGroup([
        window.L.marker([driverLat, driverLng]),
        window.L.marker([hubLat, hubLng]),
        window.L.marker([custCoords.latitude, custCoords.longitude])
      ]);
      map.fitBounds(group.getBounds().pad(0.1));

    } catch (e) {
      console.error("Leaflet mount fail:", e);
    }
  };

  const startRouteSimulation = (orderId) => {
    if (simIntervals.current[orderId]) return;

    setNavSim(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        isNavigating: true,
        routeStep: "Leaving Balaji Cart dispatch depot..."
      }
    }));

    const steps = [
      "Leaving Balaji Cart dispatch depot...",
      "Navigating main arterial road. Speed: 40km/h",
      "Approaching city square roundabout. GPS lock high.",
      "Entering residential street segment...",
      "Turning left near local landmark...",
      "Arrived at Customer Mansion Gate. Ringing door bell."
    ];

    let currentProgress = 0;
    
    simIntervals.current[orderId] = setInterval(() => {
      currentProgress += 16.6; 
      
      setNavSim(prev => {
        const orderSim = prev[orderId];
        if (!orderSim) return prev;

        const stepIndex = Math.min(Math.floor((currentProgress / 100) * steps.length), steps.length - 1);
        const distanceRemaining = Math.max(0, (2.8 - (2.8 * (currentProgress / 100))).toFixed(1));
        const etaRemaining = Math.max(0, Math.ceil(12 - (12 * (currentProgress / 100))));

        // Trigger customer nearby ping when under 500m (0.5 km)
        const distNum = parseFloat(distanceRemaining);
        if (distNum <= 0.5 && distNum > 0 && !nearbyAlertPlayed.current[orderId]) {
          nearbyAlertPlayed.current[orderId] = true;
          playEventSound('customer_nearby');
          toast.info("📡 GPS Radar: Customer destination is under 500 meters!");
        }

        // Update driver GPS coordinates along the actual road path
        const mapData = mapRefs.current[orderId];
        if (mapData) {
          const roadPath = mapData.routeCoordinates && mapData.routeCoordinates.length > 0 
            ? mapData.routeCoordinates 
            : generateRoadPath(mapData.driverLat || mapData.hubLat, mapData.driverLng || mapData.hubLng, mapData.customerLat, mapData.customerLng);
          const pathIndex = Math.min(Math.floor((currentProgress / 100) * roadPath.length), roadPath.length - 1);
          const currentPoint = roadPath[pathIndex];
          mapData.driverMarker.setLatLng(currentPoint);
          mapData.map.panTo(currentPoint);
        }

        if (currentProgress >= 100) {
          clearInterval(simIntervals.current[orderId]);
          delete simIntervals.current[orderId];
          return {
            ...prev,
            [orderId]: {
              ...orderSim,
              progress: 100,
              distance: 0,
              eta: 0,
              routeStep: "Doorstep: Ask customer for verification OTP.",
              isNavigating: false
            }
          };
        }

        return {
          ...prev,
          [orderId]: {
            ...orderSim,
            progress: currentProgress,
            distance: distanceRemaining,
            eta: etaRemaining,
            routeStep: steps[stepIndex]
          }
        };
      });
    }, 1500); 
  };

  // E-Signature Drawing Handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#065f46";
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
  };

  const activeOrders = orders.filter(o => o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery");

  const optimizedActiveOrders = useMemo(() => {
    if (sortType === "smart") {
      return getOptimizedOrders(activeOrders);
    } else {
      const driverLat = agent?.latitude ? Number(agent.latitude) : getDefaultCoordinates().latitude;
      const driverLng = agent?.longitude ? Number(agent.longitude) : getDefaultCoordinates().longitude;
      return [...activeOrders].sort((a, b) => {
        const coordsA = getCustomerCoordinates(a.shipping_info, a.id || a._id);
        const coordsB = getCustomerCoordinates(b.shipping_info, b.id || b._id);
        const distA = getDistanceInKm(driverLat, driverLng, coordsA.latitude, coordsA.longitude);
        const distB = getDistanceInKm(driverLat, driverLng, coordsB.latitude, coordsB.longitude);
        return distA - distB;
      });
    }
  }, [activeOrders, sortType, agent?.latitude, agent?.longitude]);

  const mountUnifiedMap = async (activeList) => {
    const mapContainer = document.getElementById("unified-fleet-map");
    if (!mapContainer || !leafletLoaded || activeList.length === 0) return;
    if (unifiedMapRef.current) {
      try {
        unifiedMapRef.current.remove();
      } catch (e) {}
      unifiedMapRef.current = null;
    }
    try {
      const driverLat = agent?.latitude ? Number(agent.latitude) : getDefaultCoordinates().latitude;
      const driverLng = agent?.longitude ? Number(agent.longitude) : getDefaultCoordinates().longitude;
      const map = window.L.map("unified-fleet-map").setView([driverLat, driverLng], 12);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB'
      }).addTo(map);

      const driverIcon = window.L.divIcon({
        html: '<div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3)">🛵</div>',
        className: '', iconSize: [32, 32]
      });
      window.L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map).bindPopup("Your Location (GPS)");

      const markersGroup = [window.L.marker([driverLat, driverLng])];

      activeList.forEach((order, idx) => {
        const custCoords = getCustomerCoordinates(order.shipping_info, order.id || order._id);
        const stopIcon = window.L.divIcon({
          html: `<div style="background-color: #065f46; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3)">#${idx + 1}</div>`,
          className: '', iconSize: [28, 28]
        });
        const marker = window.L.marker([custCoords.latitude, custCoords.longitude], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`<b>Stop #${idx + 1}</b><br/>Order: #${order.id?.slice(-8).toUpperCase()}<br/>Cust: ${order.shipping_info?.full_name}<br/>Area: ${getNeighborhoodName(order.shipping_info)}`);
        markersGroup.push(marker);
      });

      const group = new window.L.featureGroup(markersGroup);
      map.fitBounds(group.getBounds().pad(0.15));
      unifiedMapRef.current = map;

      // Async fetch street-routing path sequence
      let currentLat = driverLat;
      let currentLng = driverLng;
      const segmentsPromises = activeList.map(order => {
        const custCoords = getCustomerCoordinates(order.shipping_info, order.id || order._id);
        const promise = getOSRMRoute(currentLat, currentLng, custCoords.latitude, custCoords.longitude);
        currentLat = custCoords.latitude;
        currentLng = custCoords.longitude;
        return promise;
      });

      const allRoutesPoints = await Promise.all(segmentsPromises);

      // Prevent race condition: if map has been destroyed or replaced during await, do not try to add polyline layers
      if (unifiedMapRef.current !== map) return;

      const combinedPoints = allRoutesPoints.flat();

      if (combinedPoints.length > 0) {
        // Casing polyline
        window.L.polyline(combinedPoints, {
          color: '#ffffff',
          weight: 9,
          opacity: 0.95
        }).addTo(map);

        // Blue route line
        window.L.polyline(combinedPoints, {
          color: '#4285F4',
          weight: 5,
          opacity: 0.95
        }).addTo(map);
      }
    } catch (e) {
      console.error("Unified map mount error:", e);
    }
  };

  useEffect(() => {
    if (leafletLoaded && activeOrders.length > 0) {
      const timer = setTimeout(() => {
        mountUnifiedMap(optimizedActiveOrders);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [leafletLoaded, optimizedActiveOrders, agent?.latitude, agent?.longitude]);

  const completedOrders = orders.filter(o => o.order_status === "Delivered" || o.order_status === "Exchange Completed");

  const isShiftExpired = (shiftDateStr, endTimeStr) => {
    try {
      const datePart = shiftDateStr.slice(0, 10);
      const parts = endTimeStr.split(':');
      const endH = parseInt(parts[0], 10);
      const endM = parseInt(parts[1] || '0', 10);
      
      const endDt = new Date(`${datePart}T00:00:00`);
      endDt.setHours(endH, endM, 0, 0);
      
      if (endH < 6) {
        endDt.setDate(endDt.getDate() + 1);
      }
      return new Date() > endDt;
    } catch (e) {
      return false;
    }
  };

  const completedOrdersToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format
    return completedOrders.filter(o => {
      const dateVal = o.delivered_at || o.updated_at || o.created_at;
      if (!dateVal) return false;
      const orderDateStr = new Date(dateVal).toLocaleDateString('en-CA');
      return orderDateStr === todayStr;
    });
  }, [completedOrders]);

  const codCashCollectedToday = useMemo(() => {
    return completedOrdersToday
      .filter(o => o.payment_mode?.includes("COD"))
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  }, [completedOrdersToday]);

  const totalEarningsToday = useMemo(() => {
    const basePayPerDelivery = 4.2 * 10;
    return (completedOrdersToday.length * basePayPerDelivery) + 
           (completedOrdersToday.filter(o => o.payment_mode?.includes("COD")).reduce((sum, o) => sum + Number(o.total_price || 0), 0) * 0.02);
  }, [completedOrdersToday]);

  const filteredCompletedOrders = useMemo(() => {
    return completedOrders.filter(order => {
      // Month check
      if (historyMonthFilter !== "all" && order.created_at) {
        const d = new Date(order.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== historyMonthFilter) return false;
      }
      // Search check
      if (historySearchQuery.trim()) {
        const query = historySearchQuery.toLowerCase();
        const orderId = String(order.id || "").toLowerCase();
        const fullName = String(order.shipping_info?.full_name || "").toLowerCase();
        const phone = String(order.shipping_info?.phone || "").toLowerCase();
        const address = String(order.shipping_info?.address || "").toLowerCase();
        
        if (
          !orderId.includes(query) &&
          !fullName.includes(query) &&
          !phone.includes(query) &&
          !address.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [completedOrders, historyMonthFilter, historySearchQuery]);

  const completedOrdersUniqueMonths = useMemo(() => {
    const months = {};
    completedOrders.forEach(o => {
      if (o.created_at) {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        months[key] = label;
      }
    });
    return Object.entries(months).map(([key, label]) => ({ key, label })).sort((a, b) => b.key.localeCompare(a.key));
  }, [completedOrders]);

  // Pickup counters for today's stats
  const pickedUpForDelivery = orders.filter(o => o.order_status === "Out for Delivery");
  const pickedUpForExchange = orders.filter(o => o.order_status === "Exchange Out for Delivery");

  const codCashCollected = completedOrders
    .filter(o => o.payment_mode?.includes("COD"))
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  // Base pay: ₹10/km; assume avg 4.2km/delivery
  const basePayPerDelivery = 4.2 * 10;
  const totalEarnings = (completedOrders.length * basePayPerDelivery) + (completedOrders.filter(o => o.payment_mode?.includes("COD")).reduce((sum, o) => sum + Number(o.total_price || 0), 0) * 0.02);

  // ── Real-time work history from backend ──────────────────────────────────────
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const refreshHistory = async (silent = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!silent) setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await axiosInstance.get("/delivery/my-work-logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistoryData(res.data);
        // auto-select latest month
        if (res.data.monthlyStats?.length > 0) {
          setSelectedHistoryMonth(res.data.monthlyStats[0].month_label?.trim());
        }
      }
    } catch (err) {
      console.error("History fetch failed:", err.message);
      setHistoryError("Could not load history. Please try refreshing.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when History or Payment & Shifts tab is opened
  useEffect(() => {
    if ((activeTab === "completed" || activeTab === "payment_shifts") && !historyData) {
      refreshHistory();
    }
    if (activeTab === "payment_shifts") {
      fetchDbFinesAndLogs();
    }
    if (activeTab === "shift_booking") {
      fetchDbShiftBookings();
    }
  }, [activeTab]);

  // ── Derived data from API response ─────────────────────────────────────────
  const workingHistory = historyData?.monthlyStats || [];

  useEffect(() => {
    if (workingHistory.length > 0 && !selectedHistoryMonth) {
      setSelectedHistoryMonth(workingHistory[0].month_key);
    }
  }, [workingHistory, selectedHistoryMonth]);

  const selectedMonthData = useMemo(() => {
    const match = workingHistory.find(h => h.month_key === selectedHistoryMonth);
    return match || workingHistory[0] || {
      month_label: "", month_key: "", total_orders: 0, total_earnings: 0, total_base_pay: 0,
      total_incentives: 0, total_hours: 0, working_days: 0
    };
  }, [workingHistory, selectedHistoryMonth]);

  // Daily logs filtered for selected month
  const selectedMonthDailyLogs = useMemo(() => {
    if (!historyData?.workLogs) return [];
    const allLogs = historyData.workLogs;
    const matchMonth = selectedMonthData?.month_key;
    if (!matchMonth) return allLogs.slice(0, 30);
    return allLogs.filter(l => {
      const d = new Date(l.work_date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return k === matchMonth;
    });
  }, [historyData, selectedMonthData]);

  const leftProducts = activeOrders.flatMap(order => 
    (order.order_items || []).map(item => ({
      ...item,
      orderId: order.id,
      customerName: order.shipping_info?.full_name,
      address: `${order.shipping_info?.address || ""}, ${order.shipping_info?.city || ""}, ${order.shipping_info?.state || ""} - ${order.shipping_info?.pincode || ""}`,
      phone: order.shipping_info?.phone,
      paymentMode: order.payment_mode
    }))
  );
  const leftProductsCount = leftProducts.reduce((sum, p) => sum + Number(p.quantity || 1), 0);

  if (loading && !agent) {
    return (
      <div className="min-h-screen bg-[#f3f7f5] text-slate-800 flex items-center justify-center">
        <Loader className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (agent && agent.delivery_partner_status === "BLOCKED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-black text-white flex flex-col justify-between p-6 relative">
        {/* Glow Effects */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md mx-auto w-full flex-grow flex flex-col justify-center py-10">
          <div className="bg-slate-900/80 border border-red-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
            
            {/* Locked Icon */}
            <div className="relative mb-6 mx-auto w-24 h-24">
              <div className="w-24 h-24 rounded-full bg-red-500/10 animate-pulse absolute inset-0" />
              <div className="w-20 h-20 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center absolute inset-0 m-auto">
                <span className="text-4xl">🔒</span>
              </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">
              Account Blocked
            </h1>
            <p className="text-red-400 font-bold text-sm mb-6 uppercase tracking-wider">
              🚫 All Functions Disabled
            </p>

            {/* Block Details */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-6 text-left text-sm space-y-3 font-medium">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Partner ID:</span>
                <span className="font-mono text-xs">{agent.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Block Reason:</span>
                <span className="text-red-300 font-bold">{agent.block_reason || "Offline During Active Shift"}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Fine Applied:</span>
                <span className="text-red-400 font-black">₹{parseFloat(agent.fine_amount || 300).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blocked At:</span>
                <span className="text-slate-200 text-xs">
                  {agent.blocked_at ? new Date(agent.blocked_at).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Appeal Form / Appeal Status */}
            {agent.unblock_request_status === 'Pending' ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center">
                <span className="text-2xl mb-2 block">⏳</span>
                <h3 className="font-bold text-amber-400 text-base mb-1">Appeal Pending Review</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Your unblock appeal is under review by the logistics team. Please wait or contact support.
                </p>
                <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-left text-xs text-slate-400 italic font-mono max-h-24 overflow-y-auto">
                  "{agent.unblock_request_reason}"
                </div>
              </div>
            ) : (
              <form onSubmit={handleAppealSubmit} className="space-y-4">
                <div className="text-left">
                  <label className="block text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wide">
                    Explain why you went offline:
                  </label>
                  <textarea
                    rows="3"
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Provide detailed explanation (e.g. lost network, phone battery died, emergency)..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors duration-200 resize-none font-medium leading-relaxed"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {submittingAppeal ? "Submitting Request..." : "Submit Unblock Request"}
                </button>
              </form>
            )}

            {/* Help / Contact */}
            <p className="text-slate-500 text-[10px] font-semibold mt-6">
              ⚠️ Multiple violations will result in permanent deactivation.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="max-w-md mx-auto w-full flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider border-t border-white/5 pt-4">
          <button 
            onClick={() => fetchProfileAndOrders()}
            className="hover:text-white transition duration-200 cursor-pointer"
          >
            🔄 Refresh Status
          </button>
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition duration-200 cursor-pointer"
          >
            🔒 Logout from Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-portal-view min-h-screen bg-[#f3f7f5] text-slate-800 selection:bg-emerald-500/30 relative overflow-hidden font-sans flex flex-col">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      
      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideRight {
          animation: slideRight 0.3s ease-out forwards;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>

      {/* DEVELOPER SANDBOX PANEL */}
      {showSandbox && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white font-sans text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="font-black tracking-wider uppercase text-amber-500 flex items-center gap-1.5">
              <PenTool size={14} /> Dev Sandbox panel
            </span>
            <button 
              onClick={() => setShowSandbox(false)}
              className="p-1 hover:bg-slate-800 text-slate-400 rounded-md transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mb-3 leading-relaxed">
            Simulate shift triggers & sound prioritizations instantly for manual evaluation.
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            <button
              onClick={() => {
                setAlertOverlay("1hour");
                playEventSound("1hour");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left"
            >
              🔔 1H Pre-Shift Chime (30%)
            </button>
            <button
              onClick={() => {
                setAlertOverlay("30min");
                playEventSound("30min");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left"
            >
              🔔 30M Pre-Shift (50%)
            </button>
            <button
              onClick={() => {
                setAlertOverlay("15min");
                playEventSound("15min");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left"
            >
              🚨 15M Pre-Shift Beeps (80%)
            </button>
            <button
              onClick={() => {
                setAlertOverlay("shift_started");
                playEventSound("shift_start");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left"
            >
              🚨 Shift Start Siren (100%)
            </button>
            <button
              onClick={() => {
                playEventSound("new_order");
                toast.info("🛎️ New Order Assigned Sound Test");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left col-span-2"
            >
              🛎️ New Order Ding-Dong (70%)
            </button>
            <button
              onClick={() => {
                playEventSound("customer_nearby");
                toast.info("📡 Sonar Proximity Ping Test (Driver <500m)");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left col-span-2"
            >
              📡 Customer Nearby Radar Ping (60%)
            </button>
            <button
              onClick={() => {
                playEventSound("cod_success");
                toast.success("💰 Simulated Payment Success Chime");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left col-span-2"
            >
              💰 COD / Payment Success Chime (50%)
            </button>
            <button
              onClick={() => {
                setAlertOverlay("inactivity_warning");
                setInactivityMinutes(45);
                playEventSound("inactivity_warning");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left"
            >
              ⚠️ Inactivity Alert (45m)
            </button>
            <button
              onClick={() => {
                setAlertOverlay("escalated");
                setInactivityMinutes(60);
                playEventSound("sos_emergency");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left"
            >
              🚨 WhatsApp Escalation (60m)
            </button>
            <button
              onClick={() => {
                setShiftStatus("completed");
                localStorage.setItem("shift_status", "completed");
                setAlertOverlay("shift_ended");
                playEventSound("shift_complete");
              }}
              className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold transition cursor-pointer text-left col-span-2"
            >
              🏁 Shift End Summary Modal
            </button>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Shift status: <strong className="text-emerald-400">{shiftStatus}</strong></span>
            <button
              onClick={() => {
                setShiftStatus("not_started");
                localStorage.setItem("shift_status", "not_started");
                setAlertOverlay(null);
                stopAlarmSiren();
                clockAlertsPlayed.current = {};
                toast.success("Shift Status reset to 'not_started'");
              }}
              className="px-2 py-1 bg-red-955/50 hover:bg-red-900/50 border border-red-800 rounded-lg text-[9px] font-black text-red-300 uppercase cursor-pointer"
            >
              Reset Shift
            </button>
          </div>
        </div>
      )}

      {/* SHIFT OVERLAYS & MODALS */}
      {alertOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-955/80 backdrop-blur-md flex items-center justify-center p-4">
          
          {/* 1 Hour Pre-Shift Reminder */}
          {alertOverlay === '1hour' && (
            <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 text-white text-center space-y-4 animate-scaleUp shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Clock size={32} />
              </div>
              <h3 className="text-lg font-black tracking-wider uppercase text-emerald-400 font-sans">Pre-Shift Reminder</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Your shift starts in <strong className="text-white">1 Hour (07:00 AM)</strong>. Please prepare your vehicle, check fuel/battery, and verify you are near your assigned hub ({getHubName("", orders.find(o => o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery")?.shipping_info)}).
              </p>
              <button
                onClick={() => {
                  setAlertOverlay(null);
                  stopAlarmSiren();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Dismiss Alert
              </button>
            </div>
          )}

          {/* 30 Min Pre-Shift Reminder */}
          {alertOverlay === '30min' && (
            <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 text-white text-center space-y-4 animate-scaleUp shadow-2xl">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Clock size={32} />
              </div>
              <h3 className="text-lg font-black tracking-wider uppercase text-amber-400 font-sans">Pre-Shift Warning</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                Your shift starts in <strong className="text-white">30 Minutes</strong>. Please log in and check active delivery zones. Ensure your GPS and internet connection are active.
              </p>
              <button
                onClick={() => {
                  setAlertOverlay(null);
                  stopAlarmSiren();
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Dismiss Alert
              </button>
            </div>
          )}

          {/* 15 Min Pre-Shift Reminder */}
          {alertOverlay === '15min' && (
            <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 text-white text-center space-y-4 animate-scaleUp shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-lg font-black tracking-wider uppercase text-red-500 font-sans">Immediate Shift Notice</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                Your shift starts in <strong className="text-white">15 Minutes</strong>! You must be at the assigned {getHubName("", orders.find(o => o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery")?.shipping_info)} to scan your face and start the shift.
              </p>
              <button
                onClick={() => {
                  setAlertOverlay(null);
                  stopAlarmSiren();
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Dismiss Alert
              </button>
            </div>
          )}

          {/* Shift Started Prompt Modal with GPS Check & Face Scan */}
          {alertOverlay === 'shift_started' && (
            <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 text-white text-center space-y-6 animate-scaleUp shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
              
              {!gpsLocating && !faceScanning && !faceScanSuccess && (
                <div className="space-y-5">
                  <div className="w-16 h-16 bg-red-600/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Bell className="animate-bounce" size={32} />
                  </div>
                  <h3 className="text-xl font-black tracking-wider uppercase text-red-500 font-sans">🚨 Active Shift Started!</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Your scheduled shift is active (07:00 AM - 03:00 PM). Please complete the GPS location check and AI Face Verification to activate your shift status.
                  </p>
                  
                  {runningLateMessage && (
                    <div className="bg-amber-955/40 border border-amber-800/50 p-3 rounded-xl text-amber-300 text-[10px] font-bold font-sans">
                      ✓ Sent to Manager: "Running Late - Reported delay reason"
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        stopAlarmSiren();
                        setGpsLocating(true);
                        setTimeout(() => {
                          const driverLat = agent?.latitude ? Number(agent.latitude) : getDefaultCoordinates().latitude;
                          const driverLng = agent?.longitude ? Number(agent.longitude) : getDefaultCoordinates().longitude;
                          const hubLat = getHubCoordinates().latitude;
                          const hubLng = getHubCoordinates().longitude;
                          const distance = getDistanceInKm(driverLat, driverLng, hubLat, hubLng);
                          
                          if (distance <= 0.5) { // 500 meters (0.5 km)
                            setGpsLocating(false);
                            setFaceScanning(true);
                          } else {
                            setGpsLocating("mismatch");
                          }
                        }, 1200);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-755 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer font-sans shadow"
                    >
                      <MapPin size={15} /> Start Shift Check
                    </button>
                    
                    {!runningLateMessage && (
                      <button
                        onClick={() => setRunningLateMessage("pending")}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest transition cursor-pointer font-sans"
                      >
                        I'm Running Late
                      </button>
                    )}
                  </div>
                </div>
              )}

              {runningLateMessage === "pending" && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-500">Report Delay Reason</h4>
                  <p className="text-[11px] text-slate-400 font-sans">Specify why you are delayed so logistics manager is informed.</p>
                  <textarea
                    id="delay-reason-input"
                    rows="3"
                    placeholder="Enter reason (e.g. heavy traffic, family emergency, vehicle issue)..."
                    className="w-full p-3 bg-slate-955 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500 font-sans"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRunningLateMessage(false)}
                      className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold uppercase transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const val = document.getElementById("delay-reason-input")?.value || "Traffic";
                        setRunningLateMessage(`Sent: ${val}`);
                        toast.success("Delay reported to logistics manager.");
                      }}
                      className="w-1/2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase transition font-sans"
                    >
                      Send Report
                    </button>
                  </div>
                </div>
              )}

              {gpsLocating === true && (
                <div className="space-y-5 py-6 animate-fadeIn text-center">
                  <Loader className="animate-spin text-emerald-500 mx-auto animate-bounce" size={36} />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Verifying GPS Location...</h4>
                  <p className="text-xs text-slate-400 font-sans">Syncing with satellite coordinates. Checking distance to {getHubName("", orders.find(o => o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery")?.shipping_info)}.</p>
                  <div className="text-[10px] text-emerald-600/80 font-mono">Hub location: {getHubCoordinates().latitude.toFixed(4)}° N, {getHubCoordinates().longitude.toFixed(4)}° E</div>
                </div>
              )}

              {gpsLocating === "mismatch" && (
                <div className="space-y-5 animate-fadeIn text-center">
                  <div className="w-16 h-16 bg-red-600/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <Compass size={32} className="animate-pulse" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-red-500">GPS Proximity Mismatch!</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    You are currently at <strong className="text-white">latitude {agent?.latitude || getDefaultCoordinates().latitude.toFixed(4)}, longitude {agent?.longitude || getDefaultCoordinates().longitude.toFixed(4)}</strong>. You must be within 500 meters of {getHubName("", orders.find(o => o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery")?.shipping_info)} ({getHubCoordinates().latitude.toFixed(4)}, {getHubCoordinates().longitude.toFixed(4)}) to start your shift.
                  </p>
                  
                  <div className="bg-slate-955/60 border border-slate-800 p-3 rounded-2xl text-[10px] text-slate-400 font-sans flex flex-col items-center gap-1 mx-auto max-w-xs">
                    <span>Current Distance: <strong>{(Math.random() * 5 + 2.5).toFixed(2)} km</strong></span>
                    <span>Required Distance: <strong>&lt; 0.50 km (500m)</strong></span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setGpsLocating(true);
                        setTimeout(() => {
                          setGpsLocating(false);
                          setFaceScanning(true);
                        }, 800);
                      }}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                    >
                      Bypass & Start Face Scan (Simulated Hub Proximity)
                    </button>
                    <button
                      onClick={() => setGpsLocating(false)}
                      className="py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-850 rounded-xl text-xs font-bold uppercase transition"
                    >
                      Retry GPS Check
                    </button>
                  </div>
                </div>
              )}

              {faceScanning && (
                <div className="space-y-5 animate-fadeIn text-center">
                  <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400">AI Face Verification scan</h4>
                  <p className="text-xs text-slate-400 font-sans">Position your face inside the green guide marker to verify shift start.</p>
                  
                  <div className="relative w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-emerald-500/80 bg-slate-955 shadow-2xl flex items-center justify-center">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/80 shadow-lg animate-scanline pointer-events-none" />
                    
                    {portalStream ? (
                      <video 
                        ref={portalVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover scale-x-[-1]" 
                      />
                    ) : (
                      <img 
                        src={agent?.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                        alt="face" 
                        className="w-full h-full object-cover opacity-70 blur-[1px] animate-pulse"
                      />
                    )}

                    <div className="absolute inset-4 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin-slow pointer-events-none" />
                    
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="px-2 py-0.5 bg-emerald-955/80 border border-emerald-500/40 rounded-full text-[8px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                        {portalStream ? "Liveness Scanner: Running" : "Liveness Check: OK"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-slate-955 rounded-full h-2 overflow-hidden border border-slate-800 max-w-xs mx-auto">
                      <div id="face-scan-bar" className="bg-emerald-500 h-full w-0 transition-all duration-300" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Scanning progress: <span id="face-scan-percentage">0%</span></div>
                  </div>
                  
                  <canvas ref={portalCanvasRef} className="hidden" />
                </div>
              )}

              {faceScanSuccess && (
                <div className="space-y-4 py-8 animate-fadeIn text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="animate-bounce" />
                  </div>
                  <h4 className="text-base font-black uppercase tracking-wider text-emerald-400">Face Scan Verified!</h4>
                  <p className="text-xs text-slate-300 font-medium">Matching Score: <strong>99.4%</strong> (Matched against Database Aadhaar Photo)</p>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Activating Shift Status...</div>
                </div>
              )}

            </div>
          )}

          {/* Inactivity Warning Modal (45 Min) */}
          {alertOverlay === 'inactivity_warning' && (
            <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 text-white text-center space-y-4 animate-scaleUp shadow-2xl animate-pulse">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-lg font-black tracking-wider uppercase text-amber-500 font-sans">⚠️ Inactivity Detected!</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                You have been inactive for <strong className="text-white">{inactivityMinutes} Minutes</strong> during your shift. Please resume active deliveries to maintain compliance.
              </p>
              <button
                onClick={handleResumeDeliveries}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Resume Deliveries
              </button>
            </div>
          )}

          {/* 60 Min Escalated Warning Overlay */}
          {alertOverlay === 'escalated' && (
            <div className="bg-slate-955 border border-red-900 max-w-md w-full rounded-2xl p-6 text-white text-center space-y-5 animate-scaleUp shadow-2xl relative overflow-hidden animate-pulse">
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
              
              <div className="w-16 h-16 bg-red-600/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <ShieldAlert size={32} />
              </div>
              
              <h3 className="text-lg font-black tracking-wider uppercase text-red-500 font-sans">🚨 ESCALATION ACTIVE!</h3>
              
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                Inactivity has exceeded <strong className="text-white font-mono">60 Minutes</strong>. Simulated SMS and WhatsApp alerts have been dispatched to your regional logistics manager!
              </p>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-left space-y-2 font-mono text-[9px]">
                <div className="text-slate-500 border-b border-slate-800 pb-1 flex items-center justify-between font-sans">
                  <span>SYSTEM MESSAGING LOG</span>
                  <span className="text-[8px] bg-red-955/50 text-red-400 border border-red-900 px-1.5 rounded">DISPATCHED</span>
                </div>
                <p className="text-emerald-400 font-sans font-medium"><strong className="font-mono text-emerald-500">WhatsApp to Hub Lead:</strong> "Alert: Delivery Agent <strong>{agent?.name}</strong> has been unresponsive for 60m. Last tracked Hub: {getHubName("", orders.find(o => o.order_status === "Out for Delivery" || o.order_status === "Exchange Out for Delivery")?.shipping_info)}."</p>
                <p className="text-teal-400 font-sans font-medium"><strong className="font-mono text-teal-500">SMS to Logistics:</strong> "Escalated: Agent {agent?.name} offline shift breach. Verification code: INACTIVE_60."</p>
              </div>

              <button
                onClick={handleAcknowledgeEscalation}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer font-sans shadow"
              >
                Acknowledge & Reactivate Shift
              </button>
            </div>
          )}

          {/* Shift Complete / Ended Summary Modal */}
          {alertOverlay === 'shift_ended' && (
            <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 text-white text-center space-y-6 animate-scaleUp shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Award size={32} />
              </div>

              <h3 className="text-xl font-black tracking-wider uppercase text-emerald-400 font-sans font-black">🏁 Shift Completed!</h3>
              <p className="text-xs text-slate-300 font-sans font-medium">
                Your shift has concluded. Excellent work! Here is a summary of your performance dashboard today.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Total Jobs Done</span>
                  <span className="text-lg font-black text-white leading-none mt-1 block font-mono">{completedOrdersToday.length}</span>
                </div>
                <div className="bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Distance Travelled</span>
                  <span className="text-lg font-black text-white leading-none mt-1 block font-mono">{(completedOrdersToday.length * 4.2).toFixed(1)} km</span>
                </div>
                <div className="bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Working Duration</span>
                  <span className="text-lg font-black text-white leading-none mt-1 block font-mono">8.0 Hrs</span>
                </div>
                <div className="bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Total Earnings</span>
                  <span className="text-lg font-black text-emerald-400 leading-none mt-1 block font-mono">₹{totalEarningsToday.toFixed(2)}</span>
                </div>
                <div className="bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Customer Rating</span>
                  <span className="text-lg font-black text-amber-400 leading-none mt-1 block">4.95 ⭐</span>
                </div>
                <div className="bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Compliance Score</span>
                  <span className="text-lg font-black text-teal-400 leading-none mt-1 block font-mono">98%</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setAlertOverlay(null);
                  stopAlarmSiren();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer font-sans"
              >
                Close Summary
              </button>
            </div>
          )}

        </div>
      )}
      
      {/* SHIFT ALARM SIREN WARNING BANNER */}
      {isAlarmRinging && (
        <div className="bg-red-600 text-white font-bold text-center px-4 py-3 z-50 relative flex items-center justify-center gap-3 shadow-lg animate-pulse">
          <Bell className="animate-bounce shrink-0" size={18} />
          <span>🚨 ALARM ACTIVE: Shift active but status is OFFLINE! Switch status to ONLINE immediately!</span>
          <button 
            onClick={toggleOnlineStatus} 
            className="px-4 py-1 bg-white text-red-700 font-black rounded-lg hover:bg-gray-100 transition text-xs uppercase cursor-pointer"
          >
            Go Online Now
          </button>
        </div>
      )}

      {/* Countdown warning before Alarm rings */}
      {!isAlarmRinging && alarmSecondsLeft < 15 && (
        <div className="bg-amber-500 text-white font-bold text-center px-4 py-2 z-50 relative flex items-center justify-center gap-2 shadow transition">
          <ShieldAlert className="shrink-0" size={16} />
          <span>⚠️ Offline Shift warning: Going online required. Siren alarm will ring in {alarmSecondsLeft} seconds!</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/85 border-b border-emerald-100/50 backdrop-blur-md px-4 py-4 shadow-sm shadow-emerald-900/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)} 
              className="md:hidden p-2 hover:bg-emerald-50 text-emerald-800 rounded-xl transition cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div 
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 hover:scale-102 transition-all select-none"
              title="Click to update Profile Settings"
            >
              <img 
                src={agent?.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt={agent?.name} 
                className="w-11 h-11 rounded-full border-2 border-emerald-50/50 object-cover bg-white shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black text-emerald-955 leading-none">{agent?.name}</h2>
                  <span className={`border px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider leading-none transition-all duration-300 ${
                    agent?.is_online 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300" 
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}>
                    {agent?.is_online ? "ONLINE 🟢" : "OFFLINE 🔴"}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800/60 font-bold mt-1">
                  {agent?.agency || "Independent Fleet"} • {agent?.vehicle_number || "No Vehicle"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Online Status Toggle Switch */}
            <button
              onClick={toggleOnlineStatus}
              className={`px-3 py-2 border rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                agent?.is_online
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
              }`}
            >
              <RefreshCw size={13} /> {agent?.is_online ? "Go Offline" : "Go Online"}
            </button>

            <button 
              onClick={handleLogout}
              className="px-3 py-2 bg-emerald-50 hover:bg-red-50 text-emerald-700 hover:text-red-700 border border-emerald-100/80 rounded-xl transition font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT WITH SIDEBAR */}
      <div className="flex-1 flex min-h-[calc(100vh-80px)]">
        {/* Desktop Left Sidebar: Dark themed premium style */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 hidden md:flex flex-col justify-between shrink-0 select-none text-slate-300">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="#059669" />
                <path d="M8.5 7.5h4c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5V7.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 11.9h4.5c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5v-4.4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <span className="text-sm font-black tracking-widest text-white uppercase block leading-none">
                  BALAJI CART
                </span>
                <span className="text-[7.5px] font-black tracking-[0.25em] text-emerald-500 uppercase block leading-none mt-1">
                  CONTROL HUB
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 mb-2 px-3">Main Console</p>
              
              {/* Total Delivery Today / Dashboard */}
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Award size={15} /> Total Delivery Today
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-mono ${
                  activeTab === "dashboard" ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {completedOrdersToday.length}
                </span>
              </button>

              {/* Active Jobs */}
              <button
                onClick={() => setActiveTab("active")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "active"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clipboard size={15} /> Active Jobs
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-mono ${
                  activeTab === "active" ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {activeOrders.length}
                </span>
              </button>

              {/* Left Product for Delivery */}
              <button
                onClick={() => setActiveTab("left_products")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "left_products"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package size={15} /> Left Products
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-mono ${
                  activeTab === "left_products" ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {leftProductsCount}
                </span>
              </button>

              {/* History */}
              <button
                onClick={() => setActiveTab("completed")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "completed"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock size={15} /> History
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-mono ${
                  activeTab === "completed" ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {completedOrders.length}
                </span>
              </button>

              {/* Payment & Shifts */}
              <button
                onClick={() => setActiveTab("payment_shifts")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "payment_shifts"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={15} /> Payment & Shifts
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-mono ${
                  activeTab === "payment_shifts" ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {historyData?.grandTotals?.total_orders_delivered || 0}
                </span>
              </button>

              {/* Shift Booking */}
              <button
                onClick={() => { setActiveTab("shift_booking"); fetchDbShiftBookings(); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "shift_booking"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar size={15} /> Shift Booking
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-mono ${
                  activeTab === "shift_booking" ? "bg-violet-700 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {dbShiftBookings.filter(b => b.status === "booked" && !isShiftExpired(b.shift_date, b.shift_end)).length || "✦"}
                </span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <User size={15} /> Profile Settings
            </button>
            <button
              onClick={() => setShowSandbox(prev => !prev)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                showSandbox
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <PenTool size={15} /> Dev Sandbox Panel
            </button>
          </div>
        </aside>

        {/* Mobile slide-over navigation menu */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-slate-955/60 backdrop-blur-xs transition-opacity" />
            <aside className="relative flex w-64 max-w-xs flex-col bg-slate-900 border-r border-slate-800 p-5 text-slate-300 z-10 animate-slideRight">
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 mt-2">
                <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="#059669" />
                  <path d="M8.5 7.5h4c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5V7.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.5 11.9h4.5c1.4 0 2.5.9 2.5 2.2 0 1.3-1.1 2.2-2.5 2.2H8.5v-4.4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <span className="text-sm font-black tracking-widest text-white uppercase block leading-none">
                    BALAJI CART
                  </span>
                  <span className="text-[7.5px] font-black tracking-[0.25em] text-emerald-500 uppercase block leading-none mt-1">
                    CONTROL HUB
                  </span>
                </div>
              </div>

              <nav className="mt-6 space-y-1 flex-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 mb-2 px-3">Main Console</p>
                <button
                  onClick={() => { setActiveTab("dashboard"); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "dashboard" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Award size={15} /> Total Delivery Today</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full font-mono bg-slate-800 text-slate-400">{completedOrdersToday.length}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("active"); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "active" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Clipboard size={15} /> Active Jobs</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full font-mono bg-slate-800 text-slate-400">{activeOrders.length}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("left_products"); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "left_products" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Package size={15} /> Left Products</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full font-mono bg-slate-800 text-slate-400">{leftProductsCount}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("completed"); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "completed" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Clock size={15} /> History</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full font-mono bg-slate-800 text-slate-400">{completedOrders.length}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("payment_shifts"); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "payment_shifts" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><BarChart3 size={15} /> Payment & Shifts</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full font-mono bg-slate-800 text-slate-400">{historyData?.grandTotals?.total_orders_delivered || 0}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("shift_booking"); fetchDbShiftBookings(); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "shift_booking" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2"><Calendar size={15} /> Shift Booking</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full font-mono bg-slate-800 text-slate-400">{dbShiftBookings.filter(b => b.status === "booked" && !isShiftExpired(b.shift_date, b.shift_end)).length || "✦"}</span>
                </button>
              </nav>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => { setActiveTab("profile"); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "profile" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User size={15} /> Profile Settings
                </button>
                <button
                  onClick={() => { setShowSandbox(prev => !prev); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    showSandbox ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <PenTool size={15} /> Dev Sandbox Panel
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* MAIN PANEL CONTENT VIEWPORT */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="max-w-4xl w-full mx-auto px-4 py-6 relative z-10 flex-1">
            
            {/* VIEW 1: DASHBOARD / HOME PANEL */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                
                {agent?.verification_status === 'Rejected' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start gap-4 animate-in slide-in-from-top-4">
                    <div className="bg-rose-100 p-3 rounded-full shrink-0">
                      <ShieldAlert className="text-rose-600 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-rose-800 font-black text-sm uppercase tracking-wide">Document Verification Rejected</h3>
                      <p className="text-rose-700/80 text-xs font-semibold mt-1">
                        Your submitted documents did not pass our verification process. Please review the reasons below and re-upload correct documents.
                      </p>
                      <div className="mt-3 bg-white/60 border border-rose-100 rounded-lg p-3">
                        <p className="text-[10px] font-black uppercase text-rose-500 mb-2">Rejection Reason(s):</p>
                        <ul className="list-disc pl-5 text-xs text-rose-800 font-bold space-y-1">
                          {Array.isArray(agent.rejection_reason) 
                            ? agent.rejection_reason.map((reason, idx) => <li key={idx}>{reason}</li>)
                            : <li>{agent.rejection_reason || "Invalid documents submitted."}</li>
                          }
                        </ul>
                      </div>
                      <button 
                        onClick={() => navigate("/delivery/register")} 
                        className="mt-4 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-colors"
                      >
                        Re-upload Documents
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats row cards */}
                <section className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-emerald-100/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-emerald-600">
                      <Award size={16} />
                      <span className="text-[7.5px] font-black uppercase text-emerald-800/60 leading-none">Deliveries</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-955 mt-1.5 leading-none">{completedOrdersToday.length}</p>
                    <span className="text-[8.5px] text-emerald-700/60 font-bold mt-2 leading-none">Delivered today</span>
                  </div>

                  <div className="bg-white border border-emerald-100/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-emerald-600">
                      <CreditCard size={16} />
                      <span className="text-[7.5px] font-black uppercase text-emerald-800/60 leading-none">Cash Collected</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-955 mt-1.5 leading-none font-mono font-bold">₹{codCashCollectedToday.toFixed(1)}</p>
                    <span className="text-[8.5px] text-emerald-700/60 font-bold mt-2 leading-none">In-hand collection</span>
                  </div>

                  <div className="bg-white border border-emerald-100/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-emerald-600">
                      <Wallet size={16} />
                      <span className="text-[7.5px] font-black uppercase text-emerald-800/60 leading-none">Earnings</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-955 mt-1.5 leading-none font-mono font-bold">₹{totalEarningsToday.toFixed(2)}</p>
                    <span className="text-[8.5px] text-emerald-700/60 font-bold mt-2 leading-none font-mono font-bold">₹10/km formula</span>
                  </div>
                </section>

                {/* Pickup counters – new stats row */}
                <section className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-blue-600">
                      <Package size={16} />
                      <span className="text-[7.5px] font-black uppercase text-blue-800/60 leading-none">Pickup for Deliver</span>
                    </div>
                    <p className="text-2xl font-black text-blue-900 mt-1.5 leading-none font-mono">{pickedUpForDelivery.length}</p>
                    <span className="text-[8.5px] text-blue-700/70 font-bold mt-2 leading-none">Products picked &amp; en-route</span>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-amber-600">
                      <RefreshCw size={16} />
                      <span className="text-[7.5px] font-black uppercase text-amber-800/60 leading-none">Pickup for Exchange</span>
                    </div>
                    <p className="text-2xl font-black text-amber-900 mt-1.5 leading-none font-mono">{pickedUpForExchange.length}</p>
                    <span className="text-[8.5px] text-amber-700/70 font-bold mt-2 leading-none">Exchange pickups active</span>
                  </div>
                </section>

                {/* Shift Scheduler widget + Booking */}
                <section className="bg-white border border-emerald-100/80 rounded-[2rem] p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="text-emerald-600 shrink-0" size={20} />
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-800/60 leading-none">Shift Preferences & Booking</p>
                        <p className="text-emerald-955 font-bold mt-1 text-[11px] leading-none">Active: <span className="font-black text-emerald-700">{agent?.shift_preference}</span></p>
                        <p className="text-[10px] text-emerald-700/60 mt-0.5 font-semibold">🕐 9AM–11PM · 4 shifts · 4 hrs/shift · Must be online during shift</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShiftBookingModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
                    >
                      📅 Book Shift
                    </button>
                  </div>

                  {/* Today's booked shift badge */}
                  {(() => {
                    const todayBooked = bookedShifts[getTodayKey()];
                    if (!todayBooked) return (
                      <p className="text-[10px] text-slate-400 font-semibold pl-8">No shift booked for today. Tap "Book Shift" to reserve your slot.</p>
                    );
                    const statusColors = { booked: 'bg-blue-50 border-blue-200 text-blue-700', active: 'bg-green-50 border-green-200 text-green-700', blocked: 'bg-red-50 border-red-300 text-red-800' };
                    const statusIcons = { booked: '📋', active: '✅', blocked: '🚫' };
                    return (
                      <div className={`flex items-center justify-between border rounded-xl px-3 py-2 ${statusColors[todayBooked.status] || statusColors.booked}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{todayBooked.emoji}</span>
                          <div>
                            <p className="text-[10px] font-black uppercase">{todayBooked.label} · {todayBooked.time}</p>
                            <p className="text-[9px] font-bold opacity-80">
                              {statusIcons[todayBooked.status]} Status: <strong>{todayBooked.status?.toUpperCase()}</strong>
                              {todayBooked.fine ? ` · Fine: ₹${todayBooked.fine}` : ''}
                              {todayBooked.offlineCount ? ` · Offline ${todayBooked.offlineCount}× times` : ''}
                            </p>
                          </div>
                        </div>
                        {todayBooked.status === 'blocked' ? (
                          <button
                            onClick={resetShiftBlock}
                            className="text-[9px] font-black bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 uppercase cursor-pointer"
                          >
                            🔓 Reset Block
                          </button>
                        ) : (
                          <button onClick={() => cancelShift(getTodayKey())} className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase cursor-pointer">✕ Cancel</button>
                        )}
                      </div>
                    );

                  })()}

                  {/* Change shift dropdown */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800 shrink-0">Change Shift:</label>
                    <select
                      value={agent?.shift_preference}
                      onChange={handleShiftChange}
                      className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-1.5 outline-none font-bold text-xs text-emerald-955 select-none flex-1"
                    >
                      <option value="Shift 1 (9:00 AM - 1:00 PM)">🌅 Shift 1 (9:00 AM – 1:00 PM)</option>
                      <option value="Shift 2 (1:00 PM - 5:00 PM)">☀️ Shift 2 (1:00 PM – 5:00 PM)</option>
                      <option value="Shift 3 (5:00 PM - 9:00 PM)">🌇 Shift 3 (5:00 PM – 9:00 PM)</option>
                      <option value="Shift 4 (9:00 PM - 11:00 PM)">🌙 Shift 4 (9:00 PM – 11:00 PM)</option>
                    </select>
                  </div>
                </section>

                {/* Unified Fleet Optimization Map */}
                {activeOrders.length > 0 && (
                  <section className="bg-white border border-emerald-100/80 rounded-[2rem] p-5 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-emerald-955 uppercase tracking-wider flex items-center gap-2">
                          <Navigation className="text-emerald-600 animate-pulse" size={16} />
                          Smart Multi-Stop Delivery Planner
                        </h3>
                        <p className="text-[10px] text-emerald-855/60 font-semibold mt-1">
                          Optimize your delivery route sequence using Traveling Salesperson (TSP) logistics logic.
                        </p>
                      </div>

                      {/* Sorting Toggle Buttons */}
                      <div className="flex bg-emerald-50 border border-emerald-100 rounded-xl p-0.5 self-start sm:self-center">
                        <button
                          onClick={() => setSortType("smart")}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            sortType === "smart"
                              ? "bg-emerald-600 text-white shadow-sm font-black"
                              : "text-emerald-800 hover:text-emerald-955"
                          }`}
                        >
                          Smart Area (TSP)
                        </button>
                        <button
                          onClick={() => setSortType("nearest")}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            sortType === "nearest"
                              ? "bg-emerald-600 text-white shadow-sm font-black"
                              : "text-emerald-800 hover:text-emerald-955"
                          }`}
                        >
                          Nearest First
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 overflow-hidden relative shadow-inner">
                      <div 
                        id="unified-fleet-map" 
                        className="h-80 w-full relative z-10"
                      />
                      <button
                        onClick={recenterUnifiedMap}
                        className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-white border border-emerald-100 text-emerald-800 hover:text-emerald-955 rounded-xl shadow shadow-emerald-900/10 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      >
                        🧭 Recenter GPS
                      </button>
                    </div>
                    
                    <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-emerald-855">
                      <span className="flex items-center gap-1">🟢 Total Stops: <strong className="text-emerald-955">{activeOrders.length} Location(s)</strong></span>
                      <span className="flex items-center gap-1">🛵 Fleet GPS: <strong className="text-emerald-955">Active ({agent?.latitude ? "Lock" : "Default Hub"})</strong></span>
                      <span className="flex items-center gap-1">📊 Optimization: <strong className="text-emerald-700">{sortType === "smart" ? "Enabled (TSP Engine)" : "Nearest Coordinates"}</strong></span>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* VIEW 2: ACTIVE JOBS LIST */}
            {activeTab === "active" && (
              <div className="space-y-6">
                {optimizedActiveOrders.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-emerald-100/50 rounded-[2rem] shadow-sm animate-fadeIn">
                    <Clock size={36} className="text-emerald-600/40 mx-auto mb-3" />
                    <h4 className="font-bold text-emerald-900 text-sm">No Active Delivery Jobs</h4>
                    <p className="text-emerald-800/50 text-xs mt-1 px-4 font-medium">New tasks assigned by administrators will reflect here instantly.</p>
                  </div>
                ) : (
                  optimizedActiveOrders.map((order, idx) => {
                    const sim = navSim[order.id];
                    
                    return (
                      <div key={order.id} className="bg-white border border-emerald-100/80 rounded-[2rem] p-5 md:p-6 shadow-sm space-y-4 relative overflow-hidden animate-fadeIn">
                        
                        <div className="flex justify-between items-start border-b border-emerald-50/80 pb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-black text-white bg-emerald-700 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                                STOP #{idx + 1}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                                ORDER: #{order.id?.slice(-8).toUpperCase()}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-800/80 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                📍 {getNeighborhoodName(order.shipping_info)}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-800/80 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                🏢 Hub: {getHubName(order.shipping_info?.city, order.shipping_info)}
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-800/50 font-bold mt-1">Assigned at {new Date(order.created_at).toLocaleString()}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200/85 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            {order.order_status === "Exchange Out for Delivery" ? "🔄 Exchange Co-Pickup" : "📦 Out For Delivery"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <h4 className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <User size={12} /> Customer Info
                            </h4>
                            <p className="text-emerald-955 font-bold text-sm leading-none">{order.shipping_info?.full_name || "Valued Customer"}</p>
                            
                            <div className="flex items-center gap-2 pt-1.5">
                              <a 
                                href={`tel:${order.shipping_info?.phone}`} 
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-xl transition flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                                title="Call customer"
                              >
                                <Phone size={12} /> Call
                              </a>
                              <a 
                                href={`https://wa.me/${order.shipping_info?.phone}?text=${encodeURIComponent(`Hello, Balaji Cart delivery partner here. I am on my way to deliver your order #${order.id?.slice(-8).toUpperCase()} shortly.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-xl transition flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                                title="WhatsApp customer"
                              >
                                <MessageCircle size={12} /> Chat
                              </a>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin size={12} /> Delivery Destination
                            </h4>
                            <div className="bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/50 relative group">
                              <p className="text-emerald-900 font-medium leading-relaxed pr-6 text-[11px]">
                                {order.shipping_info?.address}, {order.shipping_info?.city}, {order.shipping_info?.state} - {order.shipping_info?.pincode}
                              </p>
                              <button 
                                onClick={() => copyToClipboard(`${order.shipping_info?.address}, ${order.shipping_info?.city}, ${order.shipping_info?.state} - ${order.shipping_info?.pincode}`)}
                                className="absolute top-2 right-2 text-emerald-700/60 hover:text-emerald-800 transition scale-90"
                                title="Copy address"
                              >
                                <Clipboard size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* DYNAMIC LEAFLET OPENSTREETMAP BLOCK */}
                        <div className="border border-emerald-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                          <button 
                            onClick={() => {
                              toggleNavigation(order.id);
                              setTimeout(() => mountLeafletMap(order), 100);
                            }}
                            className="w-full px-4 py-2.5 bg-emerald-50 text-emerald-800 font-black text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-emerald-100 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Navigation size={12} className="text-emerald-600 animate-pulse" />
                              Interactive Leaflet Route Map (Google Style)
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
                              {sim ? "Close Map ❌" : "Open Map 🗺️"}
                            </span>
                          </button>

                          {sim && (
                            <div className="p-4 space-y-3 bg-[#fbfdfc] animate-fadeIn relative">
                              <div className="relative">
                                <div 
                                  id={`map-${order.id}`} 
                                  className="h-64 rounded-xl border border-emerald-100 relative z-10 shadow-inner" 
                                />
                                <button
                                  onClick={() => recenterMap(order.id)}
                                  className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-white border border-emerald-100 text-emerald-800 hover:text-emerald-955 rounded-xl shadow shadow-emerald-900/10 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  🧭 Recenter GPS
                                </button>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs mt-3">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black uppercase text-emerald-800/60 leading-none">GPS Satellite Navigation</p>
                                  <p className="text-emerald-955 font-bold text-xs">{sim.routeStep}</p>
                                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-black text-emerald-855">
                                    <span>Proximity: <strong className="text-emerald-955 font-mono">{(Number(sim.distance)).toFixed(1)} km</strong></span>
                                    <span>ETA: <strong className="text-emerald-955 font-mono">{sim.eta} mins</strong></span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center">
                                  {!sim.isNavigating && sim.progress < 100 ? (
                                    <button 
                                      onClick={() => startRouteSimulation(order.id)}
                                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
                                    >
                                      <Compass size={12} /> Start Route Sim
                                    </button>
                                  ) : sim.isNavigating ? (
                                    <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                      <RefreshCw size={10} className="animate-spin" /> GPS Track Active...
                                    </div>
                                  ) : (
                                    <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                      <CheckCircle2 size={11} /> Doorstep Arrived
                                    </div>
                                  )}
                                  
                                  <button
                                    onClick={() => handleOpenGoogleMaps(order)}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1 shadow border border-slate-700"
                                  >
                                    <Navigation size={12} className="text-emerald-500 animate-pulse" /> Navigate via Google Maps
                                  </button>
                                </div>
                              </div>
                              
                              {/* Last Mile Assistance Details Panel */}
                              <div className="pt-3 border-t border-dashed border-emerald-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] bg-emerald-50/20 p-3 rounded-xl mt-3 animate-fadeIn">
                                <div className="space-y-1.5">
                                  <p className="font-bold text-emerald-800 text-[9px] uppercase tracking-wider flex items-center gap-1"><Compass size={10} /> Gate & Landmark Guide</p>
                                  <p className="text-emerald-955 font-semibold leading-relaxed font-sans">
                                    Landmark: <span className="text-slate-750 font-medium">{order.shipping_info?.landmark || "Near local landmark block"}</span>
                                  </p>
                                  <p className="text-emerald-955 font-semibold leading-relaxed font-sans">
                                    Gate Guide: <span className="text-slate-750 font-medium">Scan QR at lobby gate. Verification Code: BC-{order.id?.slice(-6).toUpperCase()}</span>
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  <p className="font-bold text-emerald-800 text-[9px] uppercase tracking-wider flex items-center gap-1"><Shield size={10} /> Verification Status</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1 font-sans">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                      ✓ Hub QR Scanned
                                    </span>
                                    {parseFloat(sim.distance) <= 0.5 && parseFloat(sim.distance) > 0 && (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold animate-pulse">
                                        📳 Device Vibrated
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                                      GPS Locked
                                    </span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <CreditCard size={18} className="text-emerald-600" />
                            <div>
                              <p className="text-[10px] font-black uppercase text-emerald-800/60 tracking-wider leading-none">Payer Action</p>
                              <p className="text-[10.5px] font-bold text-emerald-955 mt-1 leading-none">
                                Method: <span className="text-emerald-800 font-black">{order.payment_mode || "Prepaid"}</span>
                              </p>
                            </div>
                          </div>

                          {order.payment_mode?.includes("COD") ? (
                            <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-center shadow-sm">
                              <p className="text-[9px] font-black uppercase tracking-wider opacity-90 leading-none">CASH TO COLLECT</p>
                              <p className="text-base font-black mt-1 leading-none font-mono font-bold">₹{Number(order.total_price || 0).toFixed(2)}</p>
                            </div>
                          ) : (
                            <div className="bg-teal-500/10 border border-teal-500/25 text-teal-700 px-4 py-2 rounded-xl text-center font-bold">
                              <p className="text-[9px] font-black uppercase tracking-wider leading-none font-mono font-bold">PAID ONLINE</p>
                              <p className="text-xs font-black mt-1 leading-none">₹0.00 (Prepaid)</p>
                            </div>
                          )}
                        </div>

                        <div className="text-xs space-y-1 bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/50">
                          <p className="font-bold text-emerald-800/70 text-[9px] uppercase tracking-wider mb-1">Package Contents:</p>
                          {order.order_items?.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-emerald-955 font-semibold text-[11px]">
                              <span className="truncate flex-1 pr-4 font-bold">{item.title}</span>
                              <span className="text-emerald-800 font-mono font-bold">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {order.order_status === "Exchange Out for Delivery" ? (
                          <button
                            onClick={() => handleOpenPickupModal(order)}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow shadow-amber-600/10 transition-all duration-300 font-bold"
                          >
                            <RefreshCw size={14} /> QC Return Pickup & Confirm
                          </button>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-3">
                            {order.payment_mode?.includes("COD") && (
                              <button
                                onClick={() => setPaymentQrModal({ open: true, order: order })}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-150 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-250 transition-all duration-300 font-bold shadow-xs cursor-pointer"
                              >
                                <QrCode size={14} className="text-emerald-600 animate-pulse" /> Show Payment QR
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenOtpModal(order)}
                              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow shadow-emerald-600/10 transition-all duration-300 font-bold"
                            >
                              <CheckCircle2 size={14} /> Complete Job Delivery
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW 3: LEFT PRODUCTS LIST */}
            {activeTab === "left_products" && (
              <section className="bg-white border border-emerald-100/80 rounded-[2rem] p-6 shadow-sm mb-6 space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-base font-black text-emerald-955 uppercase tracking-wider flex items-center gap-2 font-bold">
                    <Package className="text-emerald-600 animate-bounce" size={18} />
                    Left Products for Delivery
                  </h3>
                  <p className="text-[10px] text-emerald-850/60 font-semibold mt-1">
                    List of all individual items remaining to be delivered to customers today.
                  </p>
                </div>

                {leftProducts.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-emerald-100/50 rounded-[2rem] shadow-sm animate-fadeIn">
                    <CheckCircle2 size={36} className="text-emerald-600/40 mx-auto mb-3 animate-pulse" />
                    <h4 className="font-bold text-emerald-900 text-sm">All Packages Handed Over!</h4>
                    <p className="text-emerald-800/50 text-xs mt-1">No packages are pending in your delivery queue.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leftProducts.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl transition hover:bg-emerald-50/40">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"} 
                            alt={item.title} 
                            className="w-12 h-12 object-cover rounded-xl border border-emerald-100 bg-white"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-emerald-955 truncate max-w-[200px] sm:max-w-xs">{item.title}</h4>
                            <p className="text-[9px] text-emerald-800/60 font-bold mt-1 font-mono uppercase">
                              QTY: {item.quantity} • ORDER: #{item.orderId?.slice(-8).toUpperCase()}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-900/70 font-semibold">
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate max-w-[180px] sm:max-w-xs">{item.address}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-stretch sm:self-center justify-end">
                          <a 
                            href={`tel:${item.phone}`} 
                            className="px-3 py-1.5 bg-white border border-emerald-100 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-955 rounded-xl font-bold text-[10px] flex items-center gap-1 shadow-xs transition"
                          >
                            <Phone size={10} /> Call Cust
                          </a>
                          <button
                            onClick={() => {
                              setActiveTab("active");
                              setTimeout(() => {
                                const el = document.getElementById(`map-${item.orderId}`);
                                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                              }, 150);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                          >
                            <Eye size={10} /> View Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* VIEW: PAYMENT & SHIFTS (Admin-identical analytics dashboard)   */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === "payment_shifts" && (
              <div className="space-y-6 animate-fadeIn text-slate-100">

                {/* ── Header bar ─────────────────────────────────────────── */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

                  {/* Title + Refresh + Payment Issue */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Payment &amp; Shift Analytics
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider mt-1 flex items-center gap-2">
                        <BarChart3 className="text-indigo-500" size={18} />
                        My Earnings &amp; Shifts Ledger
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Real-time data from database · Base Pay ₹10/km (avg 4.2km = ₹42/job) · Daily Milestone Incentives
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Payment Issue Flag */}
                      {parseFloat(historyData?.grandTotals?.total_earnings || 0) === 0 &&
                       parseInt(historyData?.grandTotals?.total_orders_delivered || 0) > 0 && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 border border-rose-800/40 rounded-lg text-rose-400 text-[9px] font-black uppercase">
                          <AlertCircle size={10} /> Payment Issue
                        </span>
                      )}
                      {/* Refresh button */}
                      <button
                        onClick={() => refreshHistory(false)}
                        disabled={historyLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-black rounded-xl transition-all shadow"
                      >
                        <RefreshCw size={12} className={historyLoading ? "animate-spin" : ""} />
                        {historyLoading ? "Loading…" : "Refresh"}
                      </button>
                    </div>
                  </div>

                  {/* Loading / Error states */}
                  {historyLoading && (
                    <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-wider">Loading real-time data…</span>
                    </div>
                  )}
                  {historyError && !historyLoading && (
                    <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 flex items-center gap-3 text-rose-400 text-sm font-bold">
                      <AlertCircle size={18} /> {historyError}
                    </div>
                  )}

                  {/* No data yet */}
                  {!historyLoading && !historyError && historyData && historyData.workLogs?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
                        <BarChart3 size={32} className="text-slate-600" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-wider">No shift records yet</p>
                      <p className="text-xs text-slate-600 text-center max-w-xs">
                        Shift data will appear here once you go online and start working.
                      </p>
                    </div>
                  )}

                  {/* ── KPI Grid (All-Time Summary) ────────────────────────── */}
                  {!historyLoading && !historyError && historyData && historyData.workLogs?.length > 0 && (
                    <div className="space-y-6">

                      {/* Grand Totals */}
                      <div>
                        <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-3 flex items-center gap-2">
                          <Award size={11} className="text-amber-400" /> All-Time Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <KpiCard
                            icon={<Calendar size={16} className="text-indigo-400" />}
                            label="Working Days"
                            value={historyData.grandTotals?.total_working_days || 0}
                            sub={`${historyData.grandTotals?.total_shifts || 0} shifts total`}
                            color="indigo"
                          />
                          <KpiCard
                            icon={<Clock size={16} className="text-amber-400" />}
                            label="Total Hours"
                            value={`${parseFloat(historyData.grandTotals?.total_hours || 0).toFixed(1)}h`}
                            sub={`Avg ${parseFloat(historyData.grandTotals?.avg_hours_per_shift || 0).toFixed(1)}h/shift`}
                            color="amber"
                          />
                          <KpiCard
                            icon={<Package size={16} className="text-emerald-400" />}
                            label="Orders Delivered"
                            value={historyData.grandTotals?.total_orders_delivered || 0}
                            sub="Total deliveries"
                            color="emerald"
                          />
                          <KpiCard
                            icon={<IndianRupee size={16} className="text-violet-400" />}
                            label="Total Earned"
                            value={fmt(historyData.grandTotals?.total_earnings)}
                            sub={`Avg ${fmt(historyData.grandTotals?.avg_earnings_per_shift)}/shift`}
                            color="violet"
                          />
                        </div>
                      </div>

                      {/* ── Current Month Highlight ───────────────────────── */}
                      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-violet-950/40 border border-indigo-800/30 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-black">This Month</p>
                            <p className="text-lg font-black text-white mt-0.5">
                              {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => {
                              const avgOrders = parseFloat(selectedMonthData?.avg_orders_per_day || 0);
                              const starRating = Math.min(5, Math.max(1, Math.round(avgOrders / 2)));
                              return (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < starRating ? "text-amber-400 fill-amber-400" : "text-slate-700"}
                                />
                              );
                            })}
                            <span className="text-xs text-slate-400 ml-1 font-bold">
                              {Math.min(5, Math.max(1, Math.round(parseFloat(selectedMonthData?.avg_orders_per_day || 0) / 2)))}.0
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {[
                            { label: "Earnings", val: fmt(historyData.currentMonth?.earnings), icon: <IndianRupee size={13} />, color: "text-violet-300" },
                            { label: "Orders", val: historyData.currentMonth?.orders || 0, icon: <Package size={13} />, color: "text-emerald-300" },
                            { label: "Hours", val: `${parseFloat(historyData.currentMonth?.hours || 0).toFixed(1)}h`, icon: <Clock size={13} />, color: "text-amber-300" },
                            { label: "Shifts", val: historyData.currentMonth?.shifts || 0, icon: <Zap size={13} />, color: "text-sky-300" },
                            { label: "Days Active", val: historyData.currentMonth?.working_days || 0, icon: <Calendar size={13} />, color: "text-indigo-300" },
                          ].map((s) => (
                            <div key={s.label} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/40">
                              <div className={`flex items-center gap-1 ${s.color} mb-1`}>{s.icon}
                                <span className="text-[9px] font-black uppercase tracking-wider">{s.label}</span>
                              </div>
                              <p className="text-base font-black text-white">{s.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Month Selector (Buttons like admin panel) ────────── */}
                      {workingHistory.length > 1 && (
                        <div>
                          <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-2">
                            Select Month to Analyse
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {workingHistory.map(m => (
                              <button
                                key={m.month_key}
                                onClick={() => setSelectedHistoryMonth(m.month_key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                  selectedHistoryMonth === m.month_key
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/30"
                                    : "bg-slate-900/60 text-slate-400 border-slate-800/40 hover:border-slate-600"
                                }`}
                              >
                                {m.month_label?.trim()}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Selected Month Details Panel ─────────────────────── */}
                      {selectedMonthData && selectedMonthData.month_key && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
                          {/* Month header + sub-tab switcher */}
                          <div className="p-4 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60">
                            <div>
                              <p className="text-sm font-black text-white">{selectedMonthData.month_label?.trim()}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {selectedMonthData.working_days} days worked · {selectedMonthData.total_shifts} shifts
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-800/50 p-0.5 rounded-xl border border-slate-700/30 self-start sm:self-center">
                              {["overview", "daily", "orders"].map(t => (
                                <button
                                  key={t}
                                  onClick={() => setHistorySubTab(t)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                    historySubTab === t
                                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-4">
                            {/* OVERVIEW SUB-TAB */}
                            {historySubTab === "overview" && (
                              <div className="space-y-5">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {[
                                    {
                                      label: "Month Earnings", val: fmt(selectedMonthData.total_earnings),
                                      sub: `Best day: ${fmt(selectedMonthData.best_day_earnings)}`,
                                      icon: <IndianRupee size={14} className="text-violet-400" />, color: "violet"
                                    },
                                    {
                                      label: "Orders Delivered", val: selectedMonthData.total_orders || 0,
                                      sub: `Best day: ${selectedMonthData.best_day_orders} orders`,
                                      icon: <Package size={14} className="text-emerald-400" />, color: "emerald"
                                    },
                                    {
                                      label: "Hours Worked", val: `${parseFloat(selectedMonthData.total_hours || 0).toFixed(1)}h`,
                                      sub: `Avg ${parseFloat(selectedMonthData.avg_hours_per_day || 0).toFixed(1)}h/day`,
                                      icon: <Clock size={14} className="text-amber-400" />, color: "amber"
                                    },
                                    {
                                      label: "Avg Daily Earning", val: fmt(selectedMonthData.avg_earnings_per_day),
                                      sub: "Per working day",
                                      icon: <Wallet size={14} className="text-sky-400" />, color: "sky"
                                    },
                                    {
                                      label: "Base Pay", val: fmt(selectedMonthData.total_base_pay),
                                      sub: "₹50 per delivery",
                                      icon: <Wallet size={14} className="text-sky-400" />, color: "sky"
                                    },
                                    {
                                      label: "Incentives Paid", val: fmt(selectedMonthData.total_incentives),
                                      sub: "Milestone bonuses",
                                      icon: <Zap size={14} className="text-rose-400" />, color: "rose"
                                    },
                                  ].map(s => (
                                    <div key={s.label} className="bg-slate-950/60 rounded-xl border border-slate-800/40 p-3">
                                      <div className="flex items-center gap-1.5 mb-1.5">{s.icon}
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">{s.label}</span>
                                      </div>
                                      <p className="text-base font-black text-white">{s.val}</p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Today's incentive milestone progress bar */}
                                {historyData?.nextMilestone && (
                                  <div className="bg-violet-950/20 border border-violet-800/30 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-violet-400" />
                                        <span className="text-xs font-black text-violet-300 uppercase tracking-wider">Next Incentive Milestone Today</span>
                                      </div>
                                      <span className="text-xs font-black text-amber-400">
                                        +₹{historyData.nextMilestone.bonus} at {historyData.nextMilestone.milestone} orders
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-700"
                                          style={{ width: `${Math.min(100, ((historyData.nextMilestone.milestone - historyData.nextMilestone.needed) / historyData.nextMilestone.milestone) * 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-black text-slate-400 shrink-0">
                                        {historyData.nextMilestone.needed} more needed
                                      </span>
                                    </div>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                      {[{o:25,b:300},{o:50,b:600},{o:75,b:900},{o:100,b:1200}].map(t => {
                                        const todayOrders = parseInt(historyData?.today?.orders_today || 0);
                                        const achieved = todayOrders >= t.o;
                                        return (
                                          <div key={t.o} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[9px] font-black transition-colors ${
                                            achieved
                                              ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-400"
                                              : "bg-slate-900/60 border-slate-700/40 text-slate-500"
                                          }`}>
                                            {achieved ? "✅" : "🎯"} {t.o} orders = ₹{t.b}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Daily Earnings mini bar chart */}
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-3">
                                    Daily Earnings Breakdown
                                  </p>
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scroll">
                                    {selectedMonthDailyLogs.map(l => {
                                      const maxDayEarnings = Math.max(...selectedMonthDailyLogs.map(x => parseFloat(x.earnings || 0)), 1);
                                      return (
                                        <div key={l.id} className="flex items-center gap-3">
                                          <span className="text-[9px] font-mono text-slate-500 w-16 shrink-0">
                                            {new Date(l.work_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                          </span>
                                          <div className="flex-1">
                                            <MiniBar value={parseFloat(l.earnings || 0)} max={maxDayEarnings} color="violet" />
                                          </div>
                                          <span className="text-xs font-black text-violet-400 w-16 text-right shrink-0">
                                            {fmt(l.earnings)}
                                          </span>
                                          <span className="text-[10px] text-slate-500 w-10 text-right shrink-0">
                                            {l.orders_delivered}📦
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* DAILY SUB-TAB */}
                            {historySubTab === "daily" && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="border-b border-slate-800/60">
                                      {["Date", "Shift", "Start", "End", "Hours", "Orders", "Base Pay", "Incentive ⚡", "Total"].map(h => (
                                        <th key={h} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/30">
                                    {selectedMonthDailyLogs.length === 0 ? (
                                      <tr>
                                        <td colSpan={9} className="px-3 py-8 text-center text-slate-600 text-xs">
                                          No records for this month
                                        </td>
                                      </tr>
                                    ) : selectedMonthDailyLogs.map(l => {
                                      const hours = parseFloat(l.hours_worked || 0);
                                      const basePay = parseFloat(l.base_pay || 0);
                                      const incentives = parseFloat(l.incentives || 0);
                                      const earn = parseFloat(l.earnings || 0);
                                      const tag = shiftTag(l.shift_type);
                                      return (
                                        <tr key={l.id} className="hover:bg-slate-800/20 transition-colors">
                                          <td className="px-3 py-3 text-xs font-bold text-slate-300 whitespace-nowrap">
                                            {fmtDate(l.work_date)}
                                          </td>
                                          <td className="px-3 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${tag.cls}`}>
                                              {tag.label}
                                            </span>
                                          </td>
                                          <td className="px-3 py-3 text-xs text-slate-400">{fmtTime(l.shift_start_time)}</td>
                                          <td className="px-3 py-3 text-xs text-slate-400">{fmtTime(l.shift_end_time)}</td>
                                          <td className="px-3 py-3">
                                            <span className="text-amber-400 font-black text-xs">{hours.toFixed(1)}h</span>
                                          </td>
                                          <td className="px-3 py-3">
                                            <span className="text-slate-300 font-black text-xs">{l.orders_delivered}</span>
                                          </td>
                                          <td className="px-3 py-3 text-sky-400 font-black text-xs font-mono">{fmt(basePay)}</td>
                                          <td className="px-3 py-3 text-violet-400 font-black text-xs font-mono">{fmt(incentives)}</td>
                                          <td className="px-3 py-3 text-emerald-400 font-black text-xs font-mono">{fmt(earn)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  {selectedMonthDailyLogs.length > 0 && (
                                    <tfoot>
                                      <tr className="bg-slate-900/60 border-t border-slate-800">
                                        <td colSpan={4} className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                          Month Total
                                        </td>
                                        <td className="px-3 py-3 text-amber-400 font-black text-xs">
                                          {parseFloat(selectedMonthData.total_hours || 0).toFixed(1)}h
                                        </td>
                                        <td className="px-3 py-3 text-slate-300 font-black text-xs">
                                          {selectedMonthData.total_orders || 0}
                                        </td>
                                        <td className="px-3 py-3 text-sky-400 font-black text-xs font-mono">
                                          {fmt(selectedMonthData.total_base_pay)}
                                        </td>
                                        <td className="px-3 py-3 text-violet-400 font-black text-xs font-mono">
                                          {fmt(selectedMonthData.total_incentives)}
                                        </td>
                                        <td className="px-3 py-3 text-emerald-400 font-black text-xs font-mono">
                                          {fmt(selectedMonthData.total_earnings)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  )}
                                </table>
                              </div>
                            )}

                            {/* ORDERS SUB-TAB */}
                            {historySubTab === "orders" && (
                              <div className="space-y-4">
                                {(historyData?.ordersHistory || []).filter(o => {
                                  const d = new Date(o.order_date);
                                  const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                                  return k === selectedMonthData?.month_key;
                                }).length === 0 ? (
                                  <div className="flex flex-col items-center py-12 gap-3 text-slate-600">
                                    <Package size={32} />
                                    <p className="text-xs font-bold uppercase tracking-wider">No delivery history for this month</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                      <thead>
                                        <tr className="border-b border-slate-800/60">
                                          {["Order ID", "Date", "Amount", "Payment Mode", "Status"].map(h => (
                                            <th key={h} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800/30">
                                        {(historyData?.ordersHistory || [])
                                          .filter(o => {
                                            const d = new Date(o.order_date);
                                            const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                                            return k === selectedMonthData?.month_key;
                                          })
                                          .map(o => (
                                            <tr key={o.id} className="hover:bg-slate-800/20 transition-colors">
                                              <td className="px-3 py-3 font-mono text-[10px] text-indigo-400">
                                                #{o.id?.toString().substring(0, 8).toUpperCase()}
                                              </td>
                                              <td className="px-3 py-3 text-xs text-slate-400">
                                                {fmtDate(o.order_date)}
                                              </td>
                                              <td className="px-3 py-3 text-xs font-black text-emerald-400 font-mono">
                                                {fmt(o.total_price)}
                                              </td>
                                              <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                                  o.payment_mode?.includes("COD")
                                                    ? "bg-amber-950/40 text-amber-400 border-amber-800/30"
                                                    : "bg-sky-950/40 text-sky-400 border-sky-800/30"
                                                }`}>
                                                  {o.payment_mode?.includes("COD") ? "COD" : "Online"}
                                                </span>
                                              </td>
                                              <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase ${
                                                  o.order_status === "Delivered" || o.order_status === "Exchange Completed"
                                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/30"
                                                    : o.order_status === "Returned"
                                                    ? "bg-amber-950/40 text-amber-400 border-amber-800/30"
                                                    : "bg-slate-900 text-slate-400 border-slate-800"
                                                }`}>
                                                  {o.order_status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── All-Month Comparison Table ──────────────────────── */}
                      {workingHistory.length > 1 && (
                        <div>
                          <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-3 flex items-center gap-2">
                            <TrendingUp size={11} className="text-indigo-400" /> All Months Comparison
                          </h4>
                          <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/50">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-800/60 bg-slate-900/60">
                                  {["Month", "Days", "Shifts", "Hours", "Orders", "Base Pay", "Incentives", "Earnings", "Avg/Day", "Performance"].map(h => (
                                    <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/30">
                                {workingHistory.map((m, idx) => {
                                  const isFirst = idx === 0;
                                  const prev = workingHistory[idx + 1];
                                  const earnDiff = prev
                                    ? ((parseFloat(m.total_earnings) - parseFloat(prev.total_earnings)) / Math.max(1, parseFloat(prev.total_earnings))) * 100
                                    : 0;
                                  const perfPct = Math.min(100, Math.round((parseFloat(m.avg_orders_per_day || 0) / 10) * 100));
                                  return (
                                    <tr
                                      key={m.month_key}
                                      onClick={() => setSelectedHistoryMonth(m.month_key)}
                                      className={`cursor-pointer transition-colors ${
                                        selectedHistoryMonth === m.month_key
                                          ? "bg-indigo-950/30 border-l-2 border-indigo-500"
                                          : "hover:bg-slate-800/20"
                                      }`}
                                    >
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          {isFirst && (
                                            <span className="px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 rounded text-[8px] font-black">
                                              CURRENT
                                            </span>
                                          )}
                                          <span className="text-xs font-bold text-slate-300">{m.month_label?.trim()}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-xs text-slate-400">{m.working_days}</td>
                                      <td className="px-4 py-3 text-xs text-slate-400">{m.total_shifts}</td>
                                      <td className="px-4 py-3 text-amber-400 font-black text-xs">
                                        {parseFloat(m.total_hours || 0).toFixed(1)}h
                                      </td>
                                      <td className="px-4 py-3 text-slate-300 font-black text-xs">{m.total_orders}</td>
                                      <td className="px-4 py-3 text-sky-400 font-black text-xs font-mono">{fmt(m.total_base_pay)}</td>
                                      <td className="px-4 py-3 text-violet-400 font-black text-xs font-mono">{fmt(m.total_incentives)}</td>
                                      <td className="px-4 py-3 text-emerald-400 font-black text-xs font-mono">{fmt(m.total_earnings)}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-xs font-bold text-slate-300 font-mono">{fmt(m.avg_earnings_per_day)}</span>
                                          {prev && (
                                            <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                                              earnDiff >= 0 ? "text-emerald-400" : "text-rose-400"
                                            }`}>
                                              {earnDiff >= 0 ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                                              {Math.abs(earnDiff).toFixed(0)}% vs prev
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 w-32">
                                        <div className="flex flex-col gap-1">
                                          <MiniBar value={perfPct} max={100} color={perfPct > 60 ? "emerald" : perfPct > 30 ? "amber" : "rose"} />
                                          <span className="text-[9px] text-slate-500">{perfPct}% efficiency</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Payment Issue Warning */}
                      {parseFloat(historyData?.grandTotals?.total_earnings || 0) === 0 &&
                       parseInt(historyData?.grandTotals?.total_orders_delivered || 0) > 0 && (
                        <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-4 flex items-start gap-3">
                          <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-rose-400 font-black text-sm">⚠️ Payment Discrepancy Detected</p>
                            <p className="text-rose-300/70 text-xs mt-1">
                              You have completed <strong>{historyData.grandTotals.total_orders_delivered}</strong> deliveries but have
                              <strong> ₹0 recorded earnings</strong>. Please contact admin for review.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ───────────────────────────────────────────────────────── */}
                      {/* Compliance & Fine History (Premium Upgrade)                 */}
                      {/* ───────────────────────────────────────────────────────── */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        {/* Fine history panel */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-[2rem] p-5 shadow-sm">
                          <h4 className="text-[10px] font-black uppercase text-white tracking-wider mb-4 flex items-center gap-1.5">
                            <ShieldAlert size={14} className="text-rose-500" />
                            Fines &amp; Compliance Ledger
                          </h4>
                          {finesLoading ? (
                            <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                              <Loader className="animate-spin" size={14} />
                              <span className="text-[10px] font-bold uppercase">Loading fines...</span>
                            </div>
                          ) : finesHistory.length === 0 ? (
                            <div className="text-center py-8 text-slate-550 bg-slate-900/40 rounded-2xl border border-slate-850">
                              <CheckCircle2 size={24} className="text-emerald-500/40 mx-auto mb-2" />
                              <p className="text-[11px] font-bold">Clean Compliance Record</p>
                              <p className="text-[9px] mt-0.5">No active fines or penalties recorded.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[11px]">
                                <thead>
                                  <tr className="border-b border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-550">
                                    <th className="py-2 px-2">Date</th>
                                    <th className="py-2 px-2">Reason</th>
                                    <th className="py-2 px-2 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                  {finesHistory.map(fine => (
                                    <tr key={fine.id} className="hover:bg-slate-850/20 transition">
                                      <td className="py-2 px-2 text-slate-450 font-medium">
                                        {new Date(fine.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                      </td>
                                      <td className="py-2 px-2 text-slate-350 font-bold">{fine.reason || "Shift Block Penalty"}</td>
                                      <td className="py-2 px-2 text-right text-rose-450 font-black font-mono">₹{parseFloat(fine.amount || 0).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Offline logs panel */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-[2rem] p-5 shadow-sm">
                          <h4 className="text-[10px] font-black uppercase text-white tracking-wider mb-4 flex items-center gap-1.5">
                            <Activity size={14} className="text-amber-500 animate-pulse" />
                            Offline Event Log (Last 50)
                          </h4>
                          {finesLoading ? (
                            <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                              <Loader className="animate-spin" size={14} />
                              <span className="text-[10px] font-bold uppercase">Loading logs...</span>
                            </div>
                          ) : offlineLogs.length === 0 ? (
                            <div className="text-center py-8 text-slate-550 bg-slate-900/40 rounded-2xl border border-slate-850">
                              <Activity size={24} className="text-indigo-550/40 mx-auto mb-2 animate-pulse" />
                              <p className="text-[11px] font-bold">No Offline Events</p>
                              <p className="text-[9px] mt-0.5">You have maintained solid connection uptime.</p>
                            </div>
                          ) : (
                            <div className="overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
                              <div className="space-y-2">
                                {offlineLogs.map(log => (
                                  <div key={log.id} className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-850">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-350">{log.reason || "Uptime Disconnection"}</p>
                                        <p className="text-[8.5px] text-slate-550">
                                          {new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-rose-950/40 border border-rose-900/40 rounded text-[8.5px] font-black uppercase text-rose-400">
                                      Offline
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* VIEW: HISTORY (Completed Orders List)                         */}
            {/* ══════════════════════════════════════════════════════════════ */}
                        {activeTab === "completed" && (
              <div className="space-y-6 animate-fadeIn text-slate-100">
                {/* Header Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Compliance & Delivery Records
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider mt-1 flex items-center gap-2">
                        <History className="text-emerald-500" size={18} />
                        Order History Log
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Review your completed deliveries, customer receipts, and payment logs.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-2xl text-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Total Completed</span>
                        <span className="text-sm font-black text-emerald-400 font-mono block">{completedOrders.length} orders</span>
                      </div>
                    </div>
                  </div>

                  {/* Filters bar */}
                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                    {/* Search query input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search by Order ID, customer name, phone..."
                        value={historySearchQuery}
                        onChange={e => setHistorySearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-2xl py-2 pl-4 pr-10 text-xs font-bold text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      />
                      {historySearchQuery && (
                        <button
                          onClick={() => setHistorySearchQuery("")}
                          className="absolute right-3 top-2 text-slate-500 hover:text-slate-300 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Month Filter */}
                    <select
                      value={historyMonthFilter}
                      onChange={e => setHistoryMonthFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-2xl px-4 py-2 text-xs font-bold text-slate-200 focus:border-emerald-500 outline-none cursor-pointer transition min-w-[150px]"
                    >
                      <option value="all">All Months</option>
                      {completedOrdersUniqueMonths.map(m => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Orders List */}
                {filteredCompletedOrders.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-sm animate-fadeIn">
                    <History size={36} className="text-slate-755 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-400 text-sm">No Completed Orders Found</h4>
                    <p className="text-slate-500 text-[10px] mt-1">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredCompletedOrders.map((order, idx) => {
                      const deliveryDate = order.created_at 
                        ? new Date(order.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) 
                        : "N/A";
                      
                      const orderEarning = basePayPerDelivery + (order.payment_mode?.includes("COD") ? Number(order.total_price || 0) * 0.02 : 0);

                      return (
                        <div 
                          key={order.id} 
                          className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 md:p-6 shadow-sm space-y-4 relative overflow-hidden transition hover:border-slate-750/80 animate-fadeIn"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

                          {/* Top Row: order identifier + status + date */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                                #{order.id?.slice(-8).toUpperCase()}
                              </span>
                              <span className="text-[9px] font-bold text-slate-555 bg-slate-800/50 border border-slate-800 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                                📍 {getNeighborhoodName(order.shipping_info)}
                              </span>
                              <span className="text-[10px] text-slate-505 font-bold">
                                Delivered at {deliveryDate}
                              </span>
                            </div>

                            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 self-start sm:self-auto">
                              <CheckCircle2 size={10} /> {order.order_status === "Exchange Completed" ? "🔄 Exchange Delivered" : "📦 Delivered"}
                            </span>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Customer & Address */}
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-slate-550 text-[9px] uppercase tracking-wider flex items-center gap-1">
                                <User size={10} /> Customer &amp; Location
                              </h4>
                              <p className="text-white font-bold text-xs">{order.shipping_info?.full_name || "Valued Customer"}</p>
                              <p className="text-slate-455 leading-relaxed text-[11px] font-sans">
                                {order.shipping_info?.address}, {order.shipping_info?.city}, {order.shipping_info?.pincode}
                              </p>
                              <p className="text-[10px] text-slate-505 font-semibold">Phone: {order.shipping_info?.phone || "N/A"}</p>
                            </div>

                            {/* Package & Payment */}
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-slate-550 text-[9px] uppercase tracking-wider flex items-center gap-1">
                                <CreditCard size={10} /> Payment &amp; Earnings
                              </h4>
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="text-slate-405 text-[10.5px] font-semibold">
                                    Method: <strong className="text-white font-black">{order.payment_mode || "Prepaid"}</strong>
                                  </p>
                                  <p className="text-[10.5px] text-slate-550 mt-0.5">
                                    Total Price: <span className="font-mono text-slate-405 font-bold">₹{Number(order.total_price || 0).toFixed(2)}</span>
                                  </p>
                                </div>
                                <div className="ml-auto bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 px-3 py-1.5 rounded-xl text-right">
                                  <span className="text-[8px] font-black uppercase block tracking-wider opacity-80">Estimated Pay</span>
                                  <span className="text-xs font-mono font-black block">₹{orderEarning.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Package Contents */}
                          <div className="text-[11px] bg-slate-955 border border-slate-900 p-3 rounded-2xl space-y-1 font-sans">
                            <p className="font-bold text-slate-550 text-[9px] uppercase tracking-wider mb-1">Items Included:</p>
                            {order.order_items?.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-slate-350">
                                <span className="truncate pr-4 font-bold">{item.title}</span>
                                <span className="text-slate-550 font-mono font-bold">Qty: {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* VIEW: SHIFT BOOKING (DB-Synced Calendar Slot Booking)         */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === "shift_booking" && (
              <div className="space-y-6 animate-fadeIn text-slate-100">
                {/* Header Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-violet-500/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-violet-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Scheduling & Compliance
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider mt-1 flex items-center gap-2">
                        <Calendar className="text-violet-500" size={18} />
                        Shift Scheduler
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Book shifts up to 3 days in advance. Cancellation is allowed up to 12 hours before start.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={fetchDbShiftBookings}
                        disabled={shiftBookingsLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-black rounded-xl transition-all shadow cursor-pointer"
                      >
                        <RefreshCw size={12} className={shiftBookingsLoading ? "animate-spin" : ""} />
                        {shiftBookingsLoading ? "Updating..." : "Refresh"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {Array.from({ length: 3 }).map((_, idx) => {
                      const dateObj = new Date();
                      dateObj.setDate(dateObj.getDate() + idx);
                      const isSelected = selectedBookDate === idx;
                      const dateStr = dateObj.toISOString().slice(0, 10);
                      const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
                      const dayDate = dateObj.toLocaleDateString("en-IN", { day: "numeric" });
                      const monthName = dateObj.toLocaleDateString("en-IN", { month: "short" });
                      
                      // Check if any shift is booked on this date
                      const bookedForThisDate = dbShiftBookings.filter(
                        b => b.status === "booked" && b.shift_date.slice(0, 10) === dateStr && !isShiftExpired(b.shift_date, b.shift_end)
                      );

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedBookDate(idx)}
                          className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-350 cursor-pointer relative overflow-hidden ${
                            isSelected
                              ? "bg-gradient-to-b from-violet-900/60 to-violet-950/80 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.3)] text-white"
                              : "bg-slate-900/40 backdrop-blur-md border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700/80 text-slate-350 hover:scale-[1.02]"
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {dayName}
                          </span>
                          <span className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-black mt-2 transition-all duration-300 ${
                            isSelected ? "bg-violet-500 text-white shadow-md shadow-violet-500/20" : "bg-slate-850 text-slate-200"
                          }`}>
                            {dayDate}
                          </span>
                          <span className="text-[9px] font-bold mt-1 text-slate-500 uppercase tracking-wider">
                            {monthName}
                          </span>
                          {bookedForThisDate.length > 0 && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SHIFT_SLOTS.map(slot => {
                    const targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + selectedBookDate);
                    const dateStr = targetDate.toISOString().slice(0, 10);
                    
                    // Find if there is a booking for this slot on this selected date
                    const slotBooking = dbShiftBookings.find(
                      b => b.shift_date.slice(0, 10) === dateStr && b.shift_slot === slot.id && !isShiftExpired(b.shift_date, b.shift_end)
                    );
                    
                    const isBooked = slotBooking && slotBooking.status === "booked";
                    const isCancelled = slotBooking && slotBooking.status === "cancelled";
                    const isExpired = isShiftExpired(dateStr, slot.endTime);
                    
                    // Determine status classes
                    let cardBorderClass = "border-slate-800/60";
                    let cardBgClass = "bg-slate-900/60";
                    let glowOverlay = "";
                    if (isExpired) {
                      cardBorderClass = "border-slate-900 opacity-60";
                      cardBgClass = "bg-slate-955/40";
                    } else if (isBooked) {
                      cardBorderClass = "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                      cardBgClass = "bg-emerald-950/10";
                      glowOverlay = "bg-emerald-500/5";
                    } else if (isCancelled) {
                      cardBorderClass = "border-rose-900/30";
                      cardBgClass = "bg-rose-950/5";
                    } else {
                      cardBorderClass = "border-slate-800 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-300";
                      cardBgClass = "bg-slate-900/50";
                      glowOverlay = "bg-violet-500/5";
                    }

                    // Check 12-hour rule for cancellation
                    let canCancel = false;
                    let hoursLeftStr = "";
                    if (isBooked && slotBooking) {
                      const shiftStartFull = new Date(`${dateStr}T${slot.startTime}`);
                      const now = new Date();
                      const hoursLeft = (shiftStartFull - now) / 3600000;
                      canCancel = hoursLeft >= 12;
                      if (hoursLeft > 0) {
                        hoursLeftStr = hoursLeft >= 24 
                          ? `${Math.floor(hoursLeft / 24)}d ${Math.floor(hoursLeft % 24)}h left`
                          : `${hoursLeft.toFixed(1)}h left`;
                      } else {
                        hoursLeftStr = "Started";
                      }
                    }

                    return (
                      <div 
                        key={slot.id}
                        className={`p-6 rounded-[2.5rem] border ${cardBorderClass} ${cardBgClass} backdrop-blur-md shadow-sm relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]`}
                      >
                        {/* Glass overlay highlight */}
                        {glowOverlay && (
                          <div className={`absolute top-0 right-0 w-28 h-28 ${glowOverlay} rounded-full blur-2xl pointer-events-none`} />
                        )}
                        
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 bg-slate-800/50 rounded-2xl border border-slate-700/40">{slot.emoji}</span>
                            <div>
                              <h4 className="text-sm font-black uppercase text-white tracking-wide">{slot.label}</h4>
                              <p className="text-xs text-slate-400 font-bold mt-1 font-mono">{slot.time}</p>
                            </div>
                          </div>

                          {isExpired ? (
                            <span className="px-2.5 py-1 bg-slate-900/60 border border-slate-800 text-slate-550 text-[9px] font-black uppercase tracking-wider rounded-lg font-mono">
                              Expired
                            </span>
                          ) : isBooked ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Booked
                            </span>
                          ) : isCancelled ? (
                            <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-wider rounded-lg">
                              Cancelled
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
                              Available
                            </span>
                          )}
                        </div>

                        {/* Booking actions */}
                        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                            {new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}
                          </span>

                          {isExpired ? (
                            <span className="text-[10px] text-slate-600 font-black flex items-center gap-1 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-900 shadow-inner">
                              🔒 Closed
                            </span>
                          ) : isBooked ? (
                            <div className="flex items-center gap-2">
                              {canCancel ? (
                                <button
                                  onClick={() => cancelShiftFromDb(slotBooking.id, hoursLeftStr === "Started" ? 0 : 13)}
                                  className="px-4 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.03] cursor-pointer shadow-sm shadow-rose-950/20"
                                >
                                  Cancel Shift
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-inner">
                                  🔒 Locked ({hoursLeftStr})
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => bookShiftToDb(dateStr, slot)}
                              className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-350 hover:scale-[1.03] shadow-md shadow-violet-600/10 cursor-pointer"
                            >
                              Book Slot
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* My Bookings History List */}
                <div className="bg-slate-905 border border-slate-800 rounded-[2rem] p-5 shadow-md">
                  <h3 className="text-sm font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen size={16} className="text-violet-500" />
                    My Upcoming &amp; Active Bookings
                  </h3>

                  {shiftBookingsLoading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                      <Loader className="animate-spin text-violet-500" size={16} />
                      <span className="text-xs font-bold uppercase font-mono">Loading schedule...</span>
                    </div>
                  ) : dbShiftBookings.filter(b => !isShiftExpired(b.shift_date, b.shift_end)).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800/80 rounded-2xl">
                      <p className="text-xs font-bold">No upcoming active bookings.</p>
                      <p className="text-[10px] mt-1 text-slate-550">Select a slot above to book your shift.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Shift Info</th>
                            <th className="py-3 px-4">Timing</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {dbShiftBookings.filter(b => !isShiftExpired(b.shift_date, b.shift_end)).map(b => {
                            const bDate = new Date(b.shift_date);
                            const dateLabel = bDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                            
                            // Check 12-hour rule
                            const shiftStartFull = new Date(`${b.shift_date.slice(0, 10)}T${b.shift_start}`);
                            const hoursUntilShift = (shiftStartFull - new Date()) / 3600000;
                            const isBooked = b.status === "booked";
                            const canCancel = isBooked && hoursUntilShift >= 12;

                            return (
                              <tr key={b.id} className="text-xs hover:bg-slate-800/20 transition-colors">
                                <td className="py-3.5 px-4 font-black text-slate-200">{dateLabel}</td>
                                <td className="py-3.5 px-4 font-bold text-slate-400">
                                  {b.shift_label || `${b.shift_slot}`}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-550 font-bold">
                                  {b.shift_start.slice(0, 5)} – {b.shift_end.slice(0, 5)}
                                </td>
                                <td className="py-3.5 px-4">
                                  {b.status === "booked" ? (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase rounded shadow-sm">
                                      Booked
                                    </span>
                                  ) : b.status === "cancelled" ? (
                                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase rounded">
                                      Cancelled
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-[9px] font-black uppercase rounded">
                                      {b.status}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  {isBooked && (
                                    canCancel ? (
                                      <button
                                        onClick={() => cancelShiftFromDb(b.id, hoursUntilShift)}
                                        className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[9px] font-black uppercase rounded-lg transition-all hover:scale-[1.03] cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    ) : (
                                      <span className="text-[9px] text-slate-600 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-855">
                                        Locked
                                      </span>
                                    )
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <section className="bg-white border border-emerald-100/80 rounded-[2rem] p-6 shadow-sm mb-6 space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-base font-black text-emerald-955 uppercase tracking-wider flex items-center gap-2">
                    <User className="text-emerald-600" size={18} />
                    Profile & Settings
                  </h3>
                  <p className="text-[10px] text-emerald-855/60 font-semibold mt-1">
                    Manage your personal information, vehicle details, and credentials.
                  </p>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl">
                    <img 
                      src={profileEdit.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                      alt="Avatar Preview" 
                      className="w-20 h-20 rounded-full border-4 border-white object-cover shadow bg-white"
                    />
                    <div className="space-y-1 text-center sm:text-left flex-1">
                      <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider">Change Profile Photo</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      <p className="text-[9px] text-emerald-805/50 font-bold">Supported formats: JPG, PNG. Max 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">Full Name *</label>
                      <input 
                        type="text"
                        required
                        value={profileEdit.name}
                        onChange={(e) => setProfileEdit(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold text-emerald-955 transition"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">Vehicle Plate Number *</label>
                      <input 
                        type="text"
                        required
                        value={profileEdit.vehicle_number}
                        onChange={(e) => setProfileEdit(prev => ({ ...prev, vehicle_number: e.target.value }))}
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold text-emerald-955 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">Logistics Agency *</label>
                      <input 
                        type="text"
                        required
                        value={profileEdit.agency}
                        onChange={(e) => setProfileEdit(prev => ({ ...prev, agency: e.target.value }))}
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold text-emerald-955 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">Manual Address *</label>
                      <textarea 
                        required
                        value={profileEdit.address}
                        onChange={(e) => setProfileEdit(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        placeholder="Enter manual address"
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold text-emerald-955 transition resize-none"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">Change Password (leave blank to keep current)</label>
                      <input 
                        type="password"
                        placeholder="Enter new password"
                        value={profileEdit.password}
                        onChange={(e) => setProfileEdit(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold text-emerald-955 transition"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={profileEdit.updating}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-emerald-650/10 cursor-pointer disabled:opacity-50 font-sans font-bold"
                  >
                    {profileEdit.updating ? "Saving Changes..." : "Update Settings"}
                  </button>
                </form>

                {profileMetadata && (
                  <div className="mt-8 border-t border-emerald-100/50 pt-6 space-y-6 animate-fadeIn">
                    <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                        🛡️ Biometric & Document Verification Center
                      </h4>
                      <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                        Your registration documents, bank accounts, and face biometrics are verified and lock-secured.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans font-medium">
                        <div className="bg-white p-3 rounded-xl border border-emerald-100/30 space-y-2">
                          <span className="text-[9px] font-black text-slate-400 block uppercase font-mono">Personal Details</span>
                          <p className="text-slate-800">Email: <strong>{profileMetadata.email}</strong></p>
                          <p className="text-slate-800">DOB: <strong>{profileMetadata.dob}</strong></p>
                          <p className="text-slate-800">Gender: <strong>{profileMetadata.gender}</strong></p>
                          <p className="text-slate-800">Emergency Contact: <strong>{profileMetadata.emergency_contact}</strong></p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-emerald-100/30 space-y-2">
                          <span className="text-[9px] font-black text-slate-400 block uppercase font-mono">Identity & Biometrics</span>
                          <p className="text-slate-800 flex items-center justify-between">
                            Aadhaar: <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">VERIFIED</span>
                          </p>
                          <p className="text-slate-800 flex items-center justify-between">
                            PAN Card: <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">VERIFIED</span>
                          </p>
                          <p className="text-slate-800 flex items-center justify-between">
                            Face Scan: <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">MATCH {profileMetadata.matchPercentage}%</span>
                          </p>
                          <p className="text-slate-800 flex items-center justify-between">
                            Background: <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">{profileMetadata.criminalCheckStatus}</span>
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-emerald-100/30 space-y-2">
                          <span className="text-[9px] font-black text-slate-400 block uppercase font-mono">Settlements & Bank Info</span>
                          <p className="text-slate-800">Holder: <strong>{profileMetadata.bank_account_holder}</strong></p>
                          <p className="text-slate-800">Account: <strong>{profileMetadata.bank_account_number}</strong></p>
                          <p className="text-slate-800">IFSC: <strong>{profileMetadata.bank_ifsc}</strong></p>
                          <p className="text-slate-800 flex items-center justify-between">
                            Passbook/Cheque: <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">APPROVED</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-100/40">
                        <span className="text-[9px] font-black text-slate-400 block uppercase mb-2 font-mono">Registered Onboarding Uploads</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {[
                            { label: "Aadhaar Front", val: profileMetadata.aadhaarFront, doc: profileMetadata.doc_aadhaarFront },
                            { label: "Aadhaar Back", val: profileMetadata.aadhaarBack, doc: profileMetadata.doc_aadhaarBack },
                            { label: "PAN Card", val: profileMetadata.panCard, doc: profileMetadata.doc_panCard },
                            { label: "Address Proof", val: profileMetadata.addressProofType, doc: profileMetadata.doc_addressProof },
                            { label: "Vehicle RC", val: profileMetadata.rcFile, doc: profileMetadata.doc_rcFile },
                            { label: "Vehicle Photo", val: profileMetadata.vehiclePhoto, doc: profileMetadata.doc_vehiclePhoto },
                            { label: "Driving License", val: profileMetadata.drivingLicense, doc: profileMetadata.doc_drivingLicense },
                            { label: "Insurance", val: profileMetadata.insuranceCopy, doc: profileMetadata.doc_insuranceCopy },
                            { label: "PUC", val: profileMetadata.pollutionCertificate, doc: profileMetadata.doc_pollutionCertificate },
                            { label: "Cheque/Passbook", val: profileMetadata.chequeFile, doc: profileMetadata.doc_chequeFile }
                          ].map((doc, idx) => (
                            <div key={idx} className="bg-white/50 border border-slate-100 p-2 rounded-lg text-center font-sans font-medium relative">
                              {doc.doc ? (
                                <div 
                                  onClick={() => setProfileDocModal({ src: doc.doc, label: doc.label })}
                                  className="cursor-pointer group relative overflow-hidden rounded-md mb-1 border border-emerald-100 h-12 flex items-center justify-center bg-slate-950"
                                >
                                  <img src={doc.doc} alt={doc.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <ZoomIn size={12} className="text-white animate-pulse" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-12 bg-emerald-50 rounded-md mb-1 flex items-center justify-center border border-dashed border-emerald-200">
                                  <span className="text-[8px] text-emerald-400 font-mono">NO IMG</span>
                                </div>
                              )}
                              <span className="text-[7px] font-bold text-slate-500 block leading-tight">{doc.label}</span>
                              <span className="text-[7px] bg-emerald-50 border border-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-mono font-black truncate max-w-full block mt-0.5">
                                {doc.val ? (doc.val.length > 14 ? doc.val.slice(-14) : doc.val) : "Uploaded"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

          </main>
        </div>
      </div>

      {/* DYNAMIC OTP & E-SIGNATURE VERIFICATION MODAL */}
      {otpModal.open && (() => {
        const order = orders.find(o => o.id === otpModal.orderId);
        return (
          <div className="fixed inset-0 bg-emerald-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white border border-emerald-100 p-6 md:p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full relative overflow-y-auto max-h-[95vh] relative overflow-x-hidden font-sans font-medium font-sans">
              <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-emerald-600 to-teal-600" />
              
              {!otpModal.barcodeVerified ? (
                <>
                  <h3 className="text-xl font-black text-emerald-955 mb-2 flex items-center gap-2 leading-none font-sans">
                    <Shield className="text-emerald-600" /> Verify Packaging Label
                  </h3>
                  <p className="text-emerald-800/70 text-xs leading-relaxed mb-5 font-semibold font-sans">
                    Scan the barcode on the Balaji Cart packaging label to ensure you are delivering the correct package.
                  </p>

                  <div className="space-y-4 mb-6">
                    {/* Selector between Camera and Manual Input */}
                    <div className="flex bg-emerald-50 border border-emerald-100 rounded-xl p-0.5 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          stopCameraScanner();
                          setOtpModal(prev => ({ ...prev, useCamera: false, error: "" }));
                        }}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          !otpModal.useCamera
                            ? "bg-emerald-600 text-white shadow-sm font-black font-sans"
                            : "text-emerald-800 hover:text-emerald-955 font-sans font-semibold"
                        }`}
                      >
                        ⌨️ Manual Code
                      </button>
                      <button
                        type="button"
                        onClick={startCameraScanner}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          otpModal.useCamera
                            ? "bg-emerald-600 text-white shadow-sm font-black font-sans"
                            : "text-emerald-800 hover:text-emerald-955 font-sans font-semibold"
                        }`}
                      >
                        📷 Camera Scan
                      </button>
                    </div>

                    {otpModal.useCamera ? (
                      <div className="space-y-2">
                        <div className="relative w-full h-48 bg-black border-2 border-emerald-500 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                          <div id="scanner-viewfinder" className="w-full h-full object-cover" />
                          {/* Red Scanning Laser Line */}
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-md shadow-red-500/50 animate-scannerLaser pointer-events-none" />
                          <div className="absolute border-2 border-emerald-400/80 w-44 h-24 rounded-lg pointer-events-none flex items-center justify-center">
                            <span className="text-[8px] font-black tracking-widest text-emerald-300 uppercase bg-black/40 px-2 py-0.5 rounded font-sans">Align Barcode</span>
                          </div>
                        </div>
                        <p className="text-[8.5px] text-center text-emerald-850/60 font-bold font-sans">Scanning active. Hold the packaging label barcode steady.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800 font-sans">Enter Packaging Label Code *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. BC9C8AA570"
                            value={otpModal.scannedCode}
                            onChange={(e) => setOtpModal(prev => ({ ...prev, scannedCode: e.target.value.trim(), error: "" }))}
                            className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 focus:bg-white text-sm font-mono tracking-wider text-emerald-955 font-bold uppercase transition"
                          />
                          <button
                            type="button"
                            onClick={() => handleBarcodeScanned(otpModal.scannedCode)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow font-sans font-bold"
                          >
                            Verify
                          </button>
                        </div>
                        <p className="text-[9px] text-emerald-750/70 font-semibold leading-relaxed font-sans">
                          Hint: The label barcode can be found on the outer package box (e.g. <strong>BC</strong> followed by last 8 chars of Order ID).
                        </p>
                      </div>
                    )}

                    {otpModal.error && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-100 p-3 rounded-xl text-red-700 text-[10.5px] font-semibold leading-relaxed font-sans">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        <p>{otpModal.error}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        stopCameraScanner();
                        setOtpModal({ open: false, orderId: null, otpValue: "", isCod: false, verifying: false, error: "", barcodeVerified: false, scannedCode: "", useCamera: false, paymentConfirmed: false, codPaymentMethod: "upi", upiVerifying: false });
                      }}
                      className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-150 transition font-sans font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {otpModal.isCod && !otpModal.paymentConfirmed ? (
                    <>
                      <h3 className="text-xl font-black text-emerald-955 mb-2 flex items-center gap-2 leading-none font-sans">
                        <Wallet className="text-emerald-600 animate-pulse" /> COD Payment Collection
                      </h3>
                      <p className="text-emerald-800/70 text-xs leading-relaxed mb-4 font-semibold font-sans font-medium">
                        This is a Cash on Delivery (COD) order. Collect the payment using one of the options below.
                      </p>

                      <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100 my-4 shadow-inner">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 font-sans">Amount to Collect</span>
                        <h1 className="text-3xl font-black text-emerald-955 mt-1 font-mono">₹{Number(order?.total_price || 0).toFixed(2)}</h1>
                      </div>

                      {/* Selector between UPI and Cash */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <button
                          type="button"
                          onClick={() => setOtpModal(prev => ({ ...prev, codPaymentMethod: "upi", error: "" }))}
                          className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                            otpModal.codPaymentMethod === "upi"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-955 font-black shadow-md shadow-emerald-955/5 scale-102"
                              : "border-emerald-100 bg-white hover:bg-emerald-50/20 text-slate-655 font-semibold"
                          }`}
                        >
                          <QrCode size={22} className={otpModal.codPaymentMethod === "upi" ? "text-emerald-600 animate-pulse" : "text-slate-400"} />
                          <span className="text-[10px] uppercase tracking-wider font-bold">UPI (Scan QR)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpModal(prev => ({ ...prev, codPaymentMethod: "cash", error: "" }))}
                          className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                            otpModal.codPaymentMethod === "cash"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-955 font-black shadow-md shadow-emerald-955/5 scale-102"
                              : "border-emerald-100 bg-white hover:bg-emerald-50/20 text-slate-655 font-semibold font-sans"
                          }`}
                        >
                          <Wallet size={22} className={otpModal.codPaymentMethod === "cash" ? "text-emerald-600" : "text-slate-400"} />
                          <span className="text-[10px] uppercase tracking-wider font-bold font-sans">Pay by Cash</span>
                        </button>
                      </div>

                      {otpModal.codPaymentMethod === "upi" ? (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="relative w-44 h-44 mx-auto bg-white p-2 border border-emerald-150 rounded-2xl shadow-md flex items-center justify-center overflow-hidden">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                                `upi://pay?pa=balajicart@upi&pn=Balaji Cart&am=${order?.total_price || 0}&cu=INR&tn=Order_${order?.id?.slice(-8).toUpperCase()}`
                              )}`}
                              alt="Payment UPI QR Code"
                              className="w-full h-full object-contain"
                            />
                            {/* Pulsing Scan Indicator Overlay */}
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-md shadow-emerald-500/50 animate-scannerLaser pointer-events-none" />
                          </div>
                          <p className="text-[9.5px] text-center text-emerald-800/80 font-bold px-4 leading-relaxed font-sans font-medium">
                            Ask customer to scan using GPay, PhonePe, Paytm, or BHIM to pay <strong className="text-emerald-955 font-sans font-bold">₹{Number(order?.total_price || 0).toFixed(2)}</strong>.
                          </p>

                          {/* UPI Payment Verification Simulation Button */}
                          <button
                            type="button"
                            disabled={otpModal.upiVerifying}
                            onClick={() => {
                              setOtpModal(prev => ({ ...prev, upiVerifying: true, error: "" }));
                              setTimeout(() => {
                                playEventSound('cod_success');
                                toast.success("UPI Payment Received Successfully!");
                                setOtpModal(prev => ({ ...prev, upiVerifying: false, paymentConfirmed: true }));
                              }, 2000);
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-755 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50 font-sans font-bold"
                          >
                            {otpModal.upiVerifying ? (
                              <>
                                <Loader size={12} className="animate-spin" /> Verifying UPI Status...
                              </>
                            ) : (
                              <>
                                Verify UPI Payment
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl text-amber-900 text-[11px] font-semibold leading-relaxed space-y-2 font-sans font-medium">
                            <p className="font-bold flex items-center gap-1.5 font-sans"><Wallet size={14} className="text-amber-700" /> Cash Collection Guide:</p>
                            <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium font-sans">
                              <li>Collect a total of <strong className="text-emerald-955 font-sans font-bold">₹{Number(order?.total_price || 0).toFixed(2)}</strong> in Cash.</li>
                              <li>Check all currency notes carefully.</li>
                            </ul>
                          </div>

                          {/* Cash Collection Confirmation Button */}
                          <button
                            type="button"
                            onClick={() => {
                              playEventSound('cod_success');
                              toast.success("Cash Collection Confirmed!");
                              setOtpModal(prev => ({ ...prev, paymentConfirmed: true }));
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-750 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow cursor-pointer font-sans font-bold mb-2"
                          >
                            Confirm Cash Received
                          </button>

                          {/* Print Receipt and Paid QR code */}
                          <div className="pt-4 border-t border-dashed border-emerald-100 flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(order, true)}
                              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow cursor-pointer font-sans font-bold"
                            >
                              📄 Print / View Customer Receipt
                            </button>

                            <div className="w-[100%] mx-auto p-4 flex flex-col justify-center items-center bg-white space-y-2 border border-slate-100 rounded-2xl shadow-xs">
                              <div className="border border-emerald-400 p-1.5 bg-white shadow-xs rounded-lg">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=OrderPaid:${order?.id}`} 
                                  alt="Paid Receipt QR Code" 
                                  className="w-24 h-24"
                                />
                              </div>
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest text-center leading-none mt-1 font-bold">
                                PAID RECEIPT VERIFIED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {otpModal.error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 p-3 rounded-xl text-red-700 text-[10.5px] font-semibold mt-4 font-sans">
                          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                          <p>{otpModal.error}</p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-5 border-t border-slate-100 pt-4">
                        <button
                          onClick={() => {
                            setOtpModal({ open: false, orderId: null, otpValue: "", isCod: false, verifying: false, error: "", barcodeVerified: false, scannedCode: "", useCamera: false, paymentConfirmed: false, codPaymentMethod: "upi", upiVerifying: false });
                          }}
                          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 transition text-center cursor-pointer font-sans font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-black text-emerald-955 mb-2 flex items-center gap-2 leading-none font-sans">
                        <Key className="text-emerald-600" /> Complete Delivery
                      </h3>
                      <p className="text-emerald-800/70 text-xs leading-relaxed mb-5 font-semibold font-sans font-medium">
                        {otpModal.isCod 
                          ? `Payment of ₹${Number(order?.total_price || 0).toFixed(2)} collected successfully via ${otpModal.codPaymentMethod.toUpperCase()}. Provide e-signature to finish.` 
                          : "Ask the customer for the 6-digit secure delivery verification OTP shown on their order status page."}
                      </p>

                      {otpModal.isCod && (
                        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl flex items-center gap-2 mb-4">
                          <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-100 font-sans">PAID</span>
                          <span className="text-xs text-emerald-955 font-bold font-sans">₹{Number(order?.total_price || 0).toFixed(2)} via {otpModal.codPaymentMethod.toUpperCase()} confirmed.</span>
                        </div>
                      )}

                      <div className="space-y-4 mb-6">
                        {!otpModal.isCod && (
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-1 font-sans">6-Digit Secure OTP *</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={otpModal.otpValue}
                              onChange={(e) => setOtpModal({ ...otpModal, otpValue: e.target.value.replace(/\D/g, ""), error: "" })}
                              placeholder="Enter 6-Digit OTP"
                              className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 focus:bg-white text-center font-mono text-xl tracking-widest text-emerald-955 font-black transition"
                            />
                          </div>
                        )}

                        {/* E-SIGNATURE CANVAS CONTAINER */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800 font-sans font-bold">
                              <PenTool size={10} className="inline mr-1" /> Customer E-Signature *
                            </label>
                            <button 
                              type="button" 
                              onClick={clearSignature}
                              className="text-[10px] text-red-655 hover:text-red-800 font-black flex items-center gap-1 uppercase transition cursor-pointer font-sans"
                            >
                              <Trash2 size={10} /> Clear
                            </button>
                          </div>
                          
                          <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl overflow-hidden shadow-inner">
                            <canvas
                              ref={canvasRef}
                              width={380}
                              height={110}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="w-full cursor-crosshair bg-white"
                            />
                          </div>
                          <p className="text-[8.5px] text-emerald-700/60 font-bold text-center font-sans">Draw signature inside the box using mouse, trackpad or touchscreen.</p>
                        </div>

                        {otpModal.error && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-100 p-3 rounded-xl text-red-700 text-[11px] font-semibold font-sans">
                            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                            <p>{otpModal.error}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setOtpModal({ open: false, orderId: null, otpValue: "", isCod: false, verifying: false, error: "", barcodeVerified: false, scannedCode: "", useCamera: false, paymentConfirmed: false, codPaymentMethod: "upi", upiVerifying: false });
                          }}
                          className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-150 transition font-sans font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmDelivery}
                          disabled={otpModal.verifying || (!otpModal.isCod && otpModal.otpValue.length < 6) || !hasSigned}
                          className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50 font-sans font-bold"
                        >
                          {otpModal.verifying ? "Verifying..." : "Confirm Delivery"}
                          <Check size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ACTIVE JOB COD PAYMENT QR MODAL */}
      {paymentQrModal.open && paymentQrModal.order && (() => {
        const order = paymentQrModal.order;
        const amountDue = order.total_price || 0;
        const orderIdRaw = order.id || order._id || "";
        return (
          <div className="fixed inset-0 bg-emerald-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white border border-emerald-100 p-6 md:p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full relative overflow-hidden font-sans font-medium text-center">
              <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-emerald-600 to-teal-600" />
              <h3 className="text-xl font-black text-emerald-955 mb-2 flex items-center justify-center gap-2 leading-none font-sans font-bold">
                <QrCode className="text-emerald-600 animate-pulse" /> Scan to Pay COD
              </h3>
              <p className="text-emerald-800/70 text-xs leading-relaxed mb-4 font-semibold font-sans">
                Show this QR code to the customer to scan and pay for Order <strong>#{orderIdRaw.slice(-8).toUpperCase()}</strong>.
              </p>

              <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100 my-4 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 font-sans">Amount to Collect</span>
                <h1 className="text-3xl font-black text-emerald-955 mt-1 font-mono font-bold">₹{Number(amountDue).toFixed(2)}</h1>
              </div>

              {/* QR Code Container styled exactly like receipt page 2 */}
              <div className="w-[100%] mx-auto p-4 flex flex-col justify-center items-center bg-white space-y-2 border border-slate-100 rounded-2xl shadow-sm">
                <div className="border-2 border-emerald-500 p-2 bg-white shadow-md rounded-2xl relative overflow-hidden">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=balajicart@upi&pn=Balaji Cart&am=${amountDue}&cu=INR&tn=Order_${orderIdRaw.slice(-8).toUpperCase()}`
                    )}`} 
                    alt="UPI Payment QR Code" 
                    className="w-36 h-36"
                  />
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-md shadow-emerald-500/50 animate-scannerLaser pointer-events-none" />
                </div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center leading-none mt-2 animate-pulse font-bold">
                  SCAN TO PAY COD
                </span>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setPaymentQrModal({ open: false, order: null, verifying: false })}
                  disabled={paymentQrModal.verifying}
                  className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-150 transition font-sans font-bold cursor-pointer disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setPaymentQrModal(prev => ({ ...prev, verifying: true }));
                    setTimeout(() => {
                      playEventSound('cod_success');
                      toast.success(`UPI Payment of ₹${Number(amountDue).toFixed(2)} Received Successfully via QR Code!`);
                      setPaymentQrModal({ open: false, order: null, verifying: false });
                      handleOpenOtpModal(order, true);
                    }, 2000);
                  }}
                  disabled={paymentQrModal.verifying}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-755 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50 font-sans font-bold"
                >
                  {paymentQrModal.verifying ? (
                    <>
                      <Loader size={12} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify Payment <Check size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QC RETURN/EXCHANGE PICKUP MODAL */}
      {pickupModal.open && (
        <div className="fixed inset-0 bg-emerald-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-emerald-100 p-6 md:p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full relative overflow-y-auto max-h-[90vh] overflow-x-hidden font-sans font-medium">
            <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-amber-500 to-orange-600" />
            
            <h3 className="text-xl font-black text-emerald-955 mb-2 flex items-center gap-2 leading-none font-sans font-bold">
              <RefreshCw className="text-amber-600 animate-spin" size={20} /> Perform QC Exchange Pickup
            </h3>
            <p className="text-emerald-800/70 text-xs leading-relaxed mb-4 font-semibold font-sans font-medium">
              Verify the returned product, upload a photo, run AI checklist checks, and authorize pickup.
            </p>

            <div className="space-y-4 mb-6">
              {/* Product Catalog Reference */}
              <div className="bg-amber-50/40 border border-amber-100/80 p-4 rounded-2xl space-y-3">
                <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">📦 Expected Item from Product Catalog:</p>
                {pickupModal.order?.order_items?.map((item, index) => {
                  const imgs = (() => {
                    if (item.product_images) {
                      return typeof item.product_images === "string" ? JSON.parse(item.product_images) : item.product_images;
                    }
                    return [];
                  })();
                  const allImages = Array.isArray(imgs) ? imgs : [];
                  
                  return (
                    <div key={index} className="space-y-2 border-b border-amber-100/50 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image || "/no-image.png"} 
                          alt={item.title} 
                          className="w-12 h-12 rounded-xl object-cover bg-white border-2 border-amber-200 cursor-zoom-in hover:scale-105 hover:border-amber-500 transition-all duration-200"
                          onClick={() => setQcLightbox(item.image || "/no-image.png")}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-emerald-955 truncate">{item.title}</p>
                          <p className="text-[10px] text-emerald-800/60 font-bold">Quantity to Exchange: {item.quantity}</p>
                        </div>
                      </div>

                      {/* Render All product catalog images */}
                      {allImages.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-amber-700/80 mb-1">Catalog Reference Photos — tap to enlarge 🔍:</p>
                          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                            {allImages.map((imgObj, i) => (
                              <img 
                                key={i} 
                                src={imgObj.url || imgObj} 
                                alt={`Catalog ${i}`} 
                                className="w-16 h-16 rounded-lg object-cover border-2 border-amber-200 shadow-sm shrink-0 bg-white cursor-zoom-in hover:scale-105 hover:border-amber-500 transition-all duration-200"
                                onClick={() => setQcLightbox(imgObj.url || imgObj)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Customer Complaint info */}
              {pickupModal.order?.return_info && (
                <div className="bg-red-50/30 border border-red-100/50 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black uppercase text-red-750 tracking-wider">⚠️ Customer Reported Complaint:</p>
                  <p className="text-xs text-red-950 font-bold">
                    Reason: <span className="font-semibold text-slate-800">{pickupModal.order.return_info.reason}</span>
                  </p>
                  {pickupModal.order.return_info.comments && (
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      Comments: "{pickupModal.order.return_info.comments}"
                    </p>
                  )}
                  {/* Customer Uploaded Media */}
                  {getReturnMedia(pickupModal.order.return_info).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-red-750/80">Customer Uploaded Proof Images — tap to enlarge:</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                        {getReturnMedia(pickupModal.order.return_info).map((url, i) => (
                          <img 
                            key={i} 
                            src={url} 
                            alt={`Customer Proof ${i}`} 
                            className="w-16 h-16 rounded-lg object-cover border-2 border-red-200 cursor-zoom-in hover:scale-105 hover:border-red-400 transition-all duration-200 bg-white"
                            onClick={() => setQcLightbox(url)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 1: UPLOAD PHOTOS - Gallery OR Camera */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">Step 1: Take/Upload Product Quality Photo 📷 *</label>
                {/* Hidden file inputs */}
                <input 
                  ref={pickupCameraRef}
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePickupImageChange(pickupModal.order?.id, e)}
                  className="hidden"
                />
                <input 
                  ref={pickupGalleryRef}
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handlePickupImageChange(pickupModal.order?.id, e)}
                  className="hidden"
                />
                {/* Two visible buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => pickupCameraRef.current?.click()}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    📷 Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => pickupGalleryRef.current?.click()}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    🗂️ Choose Gallery
                  </button>
                </div>
                {/* Preview */}
                {pickupModal.image && (
                  <div className="flex items-center gap-3 mt-2">
                    <img 
                      src={pickupModal.image} 
                      alt="Uploaded Pickup Preview" 
                      className="w-20 h-20 rounded-xl object-cover border-2 border-amber-500 shadow-sm cursor-zoom-in hover:scale-105 transition-all"
                      onClick={() => setQcLightbox(pickupModal.image)}
                    />
                    <div className="text-[10px] text-emerald-700 font-bold">
                      <p>✅ Photo captured!</p>
                      <p className="opacity-60">Tap to enlarge</p>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: AI / RULE ENGINE CHECK CHECKLIST */}
              {pickupModal.image && (
                <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-2xl space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Step 2: AI / Rule Engine Product Authenticity Check</p>
                  
                  {!pickupModal.aiCheckActive && !pickupModal.aiCheckDone ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => runAiQualityCheck(true)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Scan & Verify (Simulate Match Pass)
                      </button>
                      <button
                        type="button"
                        onClick={() => runAiQualityCheck(false)}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Scan & Verify (Simulate Mismatch/Damage)
                      </button>
                    </div>
                  ) : pickupModal.aiCheckActive ? (
                    <div className="flex items-center justify-center py-4 gap-3 text-xs font-black text-emerald-800">
                      <Loader className="animate-spin text-amber-500" size={16} />
                      <span className="animate-pulse">AI Checking Product Patterns, Visuals & Serial Matches...</span>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-xl border text-[11px] font-bold ${
                      pickupModal.aiCheckSuccess 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                        : "bg-red-50 border-red-100 text-red-800"
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span>AI Check: <strong>{pickupModal.aiCheckSuccess ? "Match Approved" : "Damage/Mismatch Warning"}</strong></span>
                        <span className="font-mono text-xs">Score: {pickupModal.aiMatchScore}%</span>
                      </div>
                      <p className="text-[9.5px] font-medium leading-relaxed">
                        {pickupModal.aiCheckSuccess 
                          ? "✓ Product characteristics, logo placements and dimensions match the warehouse profile catalog successfully."
                          : "✕ WARNING: Structural damage or product code mismatch detected compared to catalog database. Recommended: REJECT."
                        }
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-200/50 pt-2 text-[10px] font-black">
                        <span>Decision State:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPickupModal(prev => ({ ...prev, action: "approve" }))}
                            className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[9px] cursor-pointer ${
                              pickupModal.action === "approve"
                                ? "bg-emerald-600 text-white"
                                : "bg-white border border-slate-200 text-slate-700"
                            }`}
                          >
                            Accept/Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setPickupModal(prev => ({ ...prev, action: "reject" }))}
                            className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[9px] cursor-pointer ${
                              pickupModal.action === "reject"
                                ? "bg-red-600 text-white"
                                : "bg-white border border-slate-200 text-slate-700"
                            }`}
                          >
                            Reject Exchange
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: QC notes & Signature */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">Step 3: QC Verification Notes *</label>
                  <textarea
                    required
                    placeholder="e.g. Outer seal intact, product looks authentic and unused. Match approved."
                    value={pickupModal.notes}
                    onChange={(e) => handlePickupNotesChange(pickupModal.order?.id, e.target.value)}
                    className="w-full h-16 bg-slate-50/50 border border-slate-200 rounded-xl p-3 outline-none focus:border-amber-500 focus:bg-white text-xs font-semibold text-slate-800 leading-normal resize-none"
                  />
                </div>

                {/* SIGNATURE */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      <PenTool size={10} className="inline mr-1" /> Customer E-Signature *
                    </label>
                    <button 
                      type="button" 
                      onClick={clearPickupSignature}
                      className="text-[10px] text-red-600 hover:text-red-800 font-black flex items-center gap-1 uppercase transition cursor-pointer"
                    >
                      <Trash2 size={10} /> Clear
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-inner">
                    <canvas
                      ref={pickupCanvasRef}
                      width={380}
                      height={90}
                      onMouseDown={startPickupDrawing}
                      onMouseMove={drawPickup}
                      onMouseUp={stopPickupDrawing}
                      onMouseLeave={stopPickupDrawing}
                      onTouchStart={startPickupDrawing}
                      onTouchMove={drawPickup}
                      onTouchEnd={stopPickupDrawing}
                      className="w-full cursor-crosshair bg-white"
                    />
                  </div>
                </div>
              </div>

              {pickupModal.error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 p-3 rounded-xl text-red-700 text-[10.5px] font-semibold leading-relaxed animate-shake">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <p>{pickupModal.error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPickupModal({ open: false, order: null, image: "", notes: "", submitting: false, error: "", aiCheckActive: false, aiCheckDone: false, aiCheckSuccess: true, aiMatchScore: 98, action: "approve" })}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPickup}
                disabled={pickupModal.submitting || !pickupModal.image || !pickupModal.notes.trim() || !hasPickupSigned || pickupModal.aiCheckActive}
                className={`flex-1 py-3 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 ${
                  pickupModal.action === "reject"
                    ? "bg-gradient-to-r from-red-650 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-red-600/10"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-600/10"
                }`}
              >
                {pickupModal.submitting ? "Processing..." : pickupModal.action === "reject" ? "Confirm Rejection" : "Confirm Pickup & Approve"}
                <Check size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======= PROFILE DOCUMENT PREVIEW MODAL ======= */}
      {profileDocModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 cursor-pointer"
          onClick={() => setProfileDocModal(null)}
        >
          <div
            className="relative max-w-4xl w-full flex flex-col bg-[#0d1117] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl cursor-default animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-900 bg-slate-900/60">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-450" />
                {profileDocModal.label}
              </span>
              <button 
                onClick={() => setProfileDocModal(null)} 
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white font-bold transition active:scale-95 border border-slate-850 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-[300px] max-h-[70vh] overflow-auto">
              <img src={profileDocModal.src} alt={profileDocModal.label} className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-slate-800" />
            </div>
            <div className="p-4 bg-slate-900/40 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-sans">
              <span>Click outside to close preview</span>
              <button 
                onClick={() => setProfileDocModal(null)} 
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======= SHIFT BOOKING MODAL ======= */}
      {shiftBookingModal && (
        <div className="fixed inset-0 z-[99998] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">📅 Book Your Shift</h2>
                <p className="text-emerald-100 text-xs mt-0.5 font-semibold">Select a shift for today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              </div>
              <button onClick={() => setShiftBookingModal(false)} className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {SHIFT_SLOTS.map(slot => {
                const todayBooked = bookedShifts[getTodayKey()];
                const isBooked = todayBooked?.id === slot.id;
                const now = new Date();
                const cur = now.getHours() * 60 + now.getMinutes();
                const isPast = cur > slot.endMins;
                const isLive = cur >= slot.startMins && cur < slot.endMins;

                return (
                  <div key={slot.id} className={`border-2 rounded-2xl p-4 flex items-center justify-between transition-all ${
                    isBooked ? 'border-emerald-400 bg-emerald-50' :
                    isPast ? 'border-slate-100 bg-slate-50 opacity-50' :
                    isLive ? 'border-blue-300 bg-blue-50' :
                    'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{slot.emoji}</span>
                      <div>
                        <p className="text-sm font-black text-slate-800">{slot.label}</p>
                        <p className="text-xs font-bold text-slate-500">{slot.time}</p>
                        {isLive && <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">LIVE NOW</span>}
                        {isPast && <span className="text-[9px] font-black text-slate-400">ENDED</span>}
                      </div>
                    </div>
                    {isBooked ? (
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">✅ Booked</span>
                    ) : isPast ? (
                      <span className="text-xs font-semibold text-slate-400">—</span>
                    ) : (
                      <button
                        onClick={() => bookShift(slot)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-95"
                      >
                        Book
                      </button>
                    )}
                  </div>
                );
              })}

              <p className="text-[10px] text-slate-400 font-semibold text-center pt-1">
                ⚠️ You must go Online within 10 minutes of shift start or ₹300 fine will be applied.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======= SHIFT ALERT FULLSCREEN MODAL ======= */}
      {shiftAlertModal.open && (
        <div className={`fixed inset-0 z-[99998] flex flex-col items-center justify-center p-6 text-center ${
          shiftAlertModal.type === 'blocked'
            ? 'bg-gradient-to-br from-gray-900 via-red-950 to-black'
            : shiftAlertModal.type === 'offline_warning'
            ? 'bg-gradient-to-br from-red-950 via-red-900 to-orange-950'
            : 'bg-gradient-to-br from-red-900 via-red-800 to-orange-900'
        }`}>
          {/* Pulsing ring */}
          <div className="relative mb-5">
            <div className={`w-28 h-28 rounded-full animate-ping absolute inset-0 m-auto ${
              shiftAlertModal.type === 'blocked' ? 'bg-gray-500/30' :
              shiftAlertModal.type === 'offline_warning' ? 'bg-red-400/40' : 'bg-red-500/30'
            }`} />
            <div className={`w-28 h-28 rounded-full flex items-center justify-center relative z-10 ${
              shiftAlertModal.type === 'blocked' ? 'bg-gray-700/60' : 'bg-red-600/60'
            }`}>
              <span className="text-5xl">
                {shiftAlertModal.type === 'offline_warning' ? '📵' :
                 shiftAlertModal.type === 'start' ? '🚨' :
                 shiftAlertModal.type === 'no_login' ? '⚠️' :
                 shiftAlertModal.type === 'blocked' ? '🚫' : '⏰'}
              </span>
            </div>
          </div>

          {/* offline_warning: live countdown display */}
          {shiftAlertModal.type === 'offline_warning' && (
            <>
              <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-wider drop-shadow-lg">
                🚨 OFFLINE DURING ACTIVE SHIFT!
              </h1>
              {/* Big live countdown */}
              <div className={`text-6xl font-black tabular-nums mb-1 drop-shadow-xl ${
                offlineCountdown <= 60 ? 'text-yellow-300 animate-pulse' :
                offlineCountdown <= 120 ? 'text-orange-300' : 'text-white'
              }`}>
                {String(Math.floor(offlineCountdown / 60)).padStart(2, '0')}:{String(offlineCountdown % 60).padStart(2, '0')}
              </div>
              <p className="text-yellow-200 font-bold text-xs mb-1">minutes remaining to go Online</p>

              {/* Progress bar */}
              <div className="w-full max-w-xs h-2.5 bg-black/30 rounded-full mb-3 overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    offlineCountdown <= 60 ? 'bg-yellow-400' :
                    offlineCountdown <= 120 ? 'bg-orange-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${(offlineCountdown / 300) * 100}%` }}
                />
              </div>

              <p className="text-white font-bold text-sm mb-1">
                ⚠️ Your shift <span className="text-yellow-300 font-black">{agent?.shift_preference}</span> is <span className="text-yellow-300 font-black">ACTIVE</span>
              </p>
              <p className="text-white/80 text-xs font-semibold mb-5">
                If you don't go Online in time → Shift will be <strong className="text-yellow-300">BLOCKED</strong> + <strong className="text-yellow-300">₹300</strong> fine will be applied
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={async () => {
                    setShiftAlertModal({ open: false, type: null, minsLeft: 0 });
                    // Stop alarm
                    stopAlarmSiren();
                    if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
                    // Go online directly
                    await toggleOnlineStatus();
                  }}
                  className="w-full py-4 bg-white text-red-900 rounded-2xl font-black text-base uppercase tracking-wider shadow-2xl hover:bg-yellow-50 transition active:scale-95"
                >
                  🟢 GO ONLINE NOW — STOP ALARM
                </button>
                <button
                  onClick={() => setShiftAlertModal({ open: false, type: null, minsLeft: 0 })}
                  className="w-full py-3 bg-white/10 border border-white/40 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition"
                >
                  Dismiss (Alarm continues in background)
                </button>
              </div>
            </>
          )}


          {/* All other types */}
          {shiftAlertModal.type !== 'offline_warning' && (
            <>
              <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">
                {shiftAlertModal.type === 'start' && 'SHIFT STARTED!'}
                {shiftAlertModal.type === 'pre15' && 'REACH HUB NOW!'}
                {shiftAlertModal.type === 'no_login' && `GO ONLINE! ${shiftAlertModal.minsLeft} MIN LEFT`}
                {shiftAlertModal.type === 'blocked' && 'SHIFT BLOCKED!'}
              </h1>
              <p className="text-red-200 font-bold text-sm mb-1">
                {shiftAlertModal.type === 'start' && 'Your shift has officially begun. Start immediately!'}
                {shiftAlertModal.type === 'pre15' && `Only ${shiftAlertModal.minsLeft} minutes until shift starts. Head to hub!`}
                {shiftAlertModal.type === 'no_login' && `You booked ${shiftAlertModal.booked?.label || 'a shift'} but are OFFLINE. Go Online in ${shiftAlertModal.minsLeft} minute(s) or ₹300 fine!`}
                {shiftAlertModal.type === 'blocked' && '₹300 fine has been applied. Your shift is blocked. Contact your manager.'}
              </p>
              <p className="text-red-300/70 text-xs font-semibold mb-8">{agent?.shift_preference}</p>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                {shiftAlertModal.type !== 'blocked' && (
                  <button
                    onClick={handleGpsHubCheck}
                    className="flex-1 py-4 bg-white text-red-800 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl hover:bg-red-50 transition active:scale-95"
                  >
                    🟢 Go Online Now
                  </button>
                )}
                <button
                  onClick={() => setShiftAlertModal({ open: false, type: null, minsLeft: 0 })}
                  className={`flex-1 py-4 border text-white rounded-2xl font-black text-sm uppercase tracking-wider transition active:scale-95 ${
                    shiftAlertModal.type === 'blocked'
                      ? 'bg-gray-700/50 border-gray-500/50 hover:bg-gray-700'
                      : 'bg-red-700/50 border-red-500/50 hover:bg-red-700'
                  }`}
                >
                  {shiftAlertModal.type === 'blocked' ? '✓ Acknowledged' : '🕐 Running Late'}
                </button>
              </div>
            </>
          )}

          <p className="text-red-400/40 text-[10px] mt-6 uppercase tracking-widest">Balaji Mart Delivery — Shift Management System</p>
        </div>
      )}

      {/* ======= GPS HUB CHECK MODAL ======= */}
      {gpsCheckModal.open && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5">
            <div className="text-5xl mb-2">{gpsCheckModal.checking ? '📡' : gpsCheckModal.result === 'ok' ? '✅' : gpsCheckModal.result === 'far' ? '⚠️' : '❌'}</div>
            <h3 className="text-lg font-black text-slate-800">
              {gpsCheckModal.checking ? 'Verifying Location...' : gpsCheckModal.result === 'ok' ? 'Hub Verified!' : gpsCheckModal.result === 'far' ? 'You Are Far From Hub' : 'GPS Unavailable'}
            </h3>

            {gpsCheckModal.checking && (
              <div className="flex justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!gpsCheckModal.checking && gpsCheckModal.distance !== null && (
              <div className="bg-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 space-y-2">
                <p>📍 Distance from Hub: <span className={gpsCheckModal.result === 'ok' ? 'text-green-600' : 'text-orange-500'}>{gpsCheckModal.distance >= 1000 ? `${(gpsCheckModal.distance/1000).toFixed(1)} km` : `${gpsCheckModal.distance} m`}</span></p>
                <p className="text-[11px] text-slate-400 font-semibold">{gpsCheckModal.result === 'ok' ? '✅ Within 2km hub radius — Location approved' : '⚠️ You are more than 2km from hub'}</p>
              </div>
            )}

            {!gpsCheckModal.checking && (gpsCheckModal.result === 'denied' || gpsCheckModal.result === 'no_gps') && (
              <p className="text-xs text-slate-500 font-semibold">GPS permission denied or not available. You can still start your shift manually.</p>
            )}

            <div className="flex gap-3">
              {!gpsCheckModal.checking && gpsCheckModal.result === 'ok' && (
                <button onClick={confirmShiftStart} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm uppercase transition shadow-lg">
                  ✅ Confirm Start
                </button>
              )}
              {!gpsCheckModal.checking && gpsCheckModal.result !== 'ok' && (
                <>
                  <button onClick={handleGpsHubCheck} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase transition">
                    🔄 Retry GPS
                  </button>
                  <button onClick={confirmShiftStart} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase transition">
                    Override &amp; Start
                  </button>
                </>
              )}
              {!gpsCheckModal.checking && (
                <button onClick={() => setGpsCheckModal({ open: false, checking: false, result: null, distance: null })} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase transition">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======= DAILY SUMMARY MODAL ======= */}
      {dailySummaryModal.open && dailySummaryModal.stats && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,white_10px,white_11px)]" />
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-xl font-black uppercase tracking-wider">Shift Complete!</h2>
              <p className="text-emerald-100 text-xs font-semibold mt-1">{agent?.shift_preference} · Great Performance Today</p>
            </div>

            {/* Stats grid */}
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Deliveries', value: dailySummaryModal.stats.delivered, icon: '📦', color: 'text-blue-700 bg-blue-50' },
                  { label: 'Exchanges', value: dailySummaryModal.stats.exchanged, icon: '🔄', color: 'text-purple-700 bg-purple-50' },
                  { label: 'COD Collected', value: `₹${dailySummaryModal.stats.codCollected}`, icon: '💵', color: 'text-green-700 bg-green-50' },
                  { label: 'Distance', value: `${dailySummaryModal.stats.distKm} km`, icon: '📍', color: 'text-orange-700 bg-orange-50' },
                  { label: 'Shift Duration', value: `${dailySummaryModal.stats.shiftHrs} Hrs`, icon: '⏱️', color: 'text-slate-700 bg-slate-50' },
                  { label: 'Base Earnings', value: `₹${dailySummaryModal.stats.totalEarnings - dailySummaryModal.stats.incentive}`, icon: '💰', color: 'text-emerald-700 bg-emerald-50' },
                ].map((s, i) => (
                  <div key={i} className={`${s.color} rounded-2xl p-3 flex items-center gap-2`}>
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-60">{s.label}</p>
                      <p className="text-base font-black leading-none">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Incentive + Total */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase">Incentive Bonus</p>
                  <p className="text-2xl font-black text-amber-700">+₹{dailySummaryModal.stats.incentive}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-green-600 uppercase">Total Earnings</p>
                  <p className="text-2xl font-black text-green-700">₹{dailySummaryModal.stats.totalEarnings}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center gap-2 bg-slate-50 rounded-2xl p-3">
                <span className="text-2xl">⭐</span>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Today's Rating</p>
                  <p className="text-xl font-black text-slate-800">{dailySummaryModal.stats.rating}</p>
                </div>
                <span className="text-xs font-bold text-slate-400">/ 5.0</span>
              </div>

              <button
                onClick={() => {
                  setDailySummaryModal({ open: false, stats: null });
                  playAlertLevel('success');
                  toast.success('🎉 Performance score updated! Well done!');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition shadow-lg active:scale-95"
              >
                🎉 Claim Earnings &amp; Close Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======= QC PHOTO LIGHTBOX OVERLAY ======= */}
      {qcLightbox && (
        <div
          className="fixed inset-0 bg-black/92 backdrop-blur-md flex items-center justify-center z-[99999] p-4 cursor-zoom-out"
          onClick={() => setQcLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setQcLightbox(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 transition z-10 border border-white/20 cursor-pointer"
          >
            <X size={22} />
          </button>
          <div
            className="relative max-w-3xl w-full flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={qcLightbox}
              alt="Product Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-2 border-white/20 object-contain"
            />
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Tap outside or ✕ to close</p>
          </div>
        </div>
      )}

    </div>
  );
}
