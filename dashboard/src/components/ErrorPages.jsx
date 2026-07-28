import React, { useState, useEffect } from "react";
import Header from "./Header";
import { 
  AlertTriangle, Eye, ShieldAlert, Database, ServerCrash, 
  Terminal, Play, ArrowLeft, RefreshCw, Copy, Check 
} from "lucide-react";
import { toast } from "react-hot-toast";

const ErrorPages = () => {
  const [selectedError, setSelectedError] = useState("404");
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);

  // Mock initial logs based on selected error
  useEffect(() => {
    generateInitialLogs(selectedError);
  }, [selectedError]);

  const errorSpecs = {
    "404": {
      title: "Page Not Found",
      subtitle: "The requested document node has drifted out of scope.",
      description: "The gateway router was unable to resolve the URI matching this request. The resource may have been deleted, renamed, or is temporarily offline.",
      severity: "Low",
      codeGlow: "from-blue-500 to-indigo-600",
      bgGlow: "rgba(99, 102, 241, 0.08)",
      icon: <AlertTriangle size={48} className="text-indigo-400 animate-pulse" />,
      suggestedFix: "Check react-router-dom path registration or verify if the component filename is spelled correctly in App.jsx."
    },
    "403": {
      title: "Forbidden Access",
      subtitle: "Insufficent clearance credentials for target node.",
      description: "Your authentication token is valid, but your security role does not grant read or write privileges to this microservice endpoint. Required: Role('SuperAdmin').",
      severity: "High",
      codeGlow: "from-amber-500 to-rose-600",
      bgGlow: "rgba(244, 63, 94, 0.08)",
      icon: <ShieldAlert size={48} className="text-rose-400 animate-pulse" />,
      suggestedFix: "Verify JWT role payload variables or audit the authSlice.js dispatch states."
    },
    "500": {
      title: "Internal Server Error",
      subtitle: "The backend server cluster encountered an unhandled exception.",
      description: "The API middleware crashed during database serialization. An unexpected null pointer was detected in the order collection repository query.",
      severity: "Critical",
      codeGlow: "from-rose-500 via-purple-600 to-pink-600",
      bgGlow: "rgba(225, 29, 72, 0.09)",
      icon: <Database size={48} className="text-pink-400 animate-bounce" />,
      suggestedFix: "Inspect Express route handlers at backend/routes/ or run mongodb status checks."
    },
    "503": {
      title: "Service Unavailable",
      subtitle: "Gateway timeout or rate-limiting congestion detected.",
      description: "The reverse proxy was unable to establish a socket stream to the backend microservice cluster. The container daemon might be rebooting or under excessive workload.",
      severity: "Critical",
      codeGlow: "from-orange-500 to-amber-600",
      bgGlow: "rgba(245, 158, 11, 0.08)",
      icon: <ServerCrash size={48} className="text-amber-400 animate-pulse" />,
      suggestedFix: "Verify server host binds (e.g. 0.0.0.0 vs localhost) and ensure API port 4000 is open."
    }
  };

  const generateInitialLogs = (errCode) => {
    const timestamp = () => new Date().toISOString().replace("T", " ").substring(0, 19);
    let mockLines = [];
    if (errCode === "404") {
      mockLines = [
        `[${timestamp()}] [ROUTER] WARN: Client requested route: "/api/v1/unknown-endpoint"`,
        `[${timestamp()}] [ROUTER] INFO: Running matching lookup inside RouteRegistry...`,
        `[${timestamp()}] [ROUTER] ERROR: 0 matches found. Redirecting client to fallback component.`,
        `[${timestamp()}] [RENDER] DEBUG: Rendered fallback fallback_view.jsx with status 404.`
      ];
    } else if (errCode === "403") {
      mockLines = [
        `[${timestamp()}] [AUTH] WARN: User "prem.admin@gmail.com" requested "/api/v1/admin/delete-database"`,
        `[${timestamp()}] [GUARD] CHECK: Evaluating policy "Database_Destruction_Access"...`,
        `[${timestamp()}] [GUARD] ERROR: Clearance verification failed. Required: SuperAdmin. User: Admin.`,
        `[${timestamp()}] [SERVER] ACCESS_DENIED: 403 Forbidden sent to IP 192.168.1.42.`
      ];
    } else if (errCode === "500") {
      mockLines = [
        `[${timestamp()}] [EXPRESS] ERROR: Uncaught TypeError: Cannot read properties of undefined (reading 'orders')`,
        `[${timestamp()}] [EXPRESS] TRACE: at fetchAllOrders (/api/controllers/orderController.js:142:32)`,
        `[${timestamp()}] [MONGOOSE] DEBUG: Active connections on cluster0: 1`,
        `[${timestamp()}] [SERVER] FATAL: Express stack trace generated. Status 500 returned.`
      ];
    } else if (errCode === "503") {
      mockLines = [
        `[${timestamp()}] [PROXY] WARN: Nginx backend socket connection failed (111: Connection refused)`,
        `[${timestamp()}] [PROXY] INFO: Retrying connection target "http://127.0.0.1:4000"...`,
        `[${timestamp()}] [PROXY] ERROR: Attempt 3/3 failed. Gateway timeout threshold reached.`,
        `[${timestamp()}] [PROXY] SERVICE_UNAVAILABLE: Returning 503 to active client nodes.`
      ];
    }
    setLogs(mockLines);
  };

  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    toast.loading("Running diagnostics pipeline...", { id: "diag" });

    let count = 0;
    const interval = setInterval(() => {
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
      let logLine = "";
      
      if (selectedError === "404") {
        const routes = ["/api/v1/orders", "/api/v1/products", "/api/v1/admin/stats"];
        logLine = `[${timestamp}] [ROUTER] RETRY: Re-matching against fallback table. Matching route route: "${routes[count % 3]}" found (Status 200).`;
      } else if (selectedError === "403") {
        logLine = `[${timestamp}] [AUTH] AUDIT: Credentials refreshed. Token hash validated. Client clearance upgraded temporary.`;
      } else if (selectedError === "500") {
        logLine = `[${timestamp}] [EXPRESS] AUTO-HEAL: Catch block activated. Re-initializing cursor variables. Database pool reset.`;
      } else {
        logLine = `[${timestamp}] [PROXY] POLLING: Service heartbeat detected. Ping success. Network socket restablished.`;
      }

      setLogs(prev => [...prev, logLine]);
      count++;

      if (count >= 3) {
        clearInterval(interval);
        setIsSimulating(false);
        toast.dismiss("diag");
        toast.success("Simulation finished! Diagnostics reports safe.");
      }
    }, 1200);
  };

  const copyLogsToClipboard = () => {
    const text = logs.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    toast.success("Logs copied to clipboard!");
    setTimeout(() => setCopiedLog(false), 2000);
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
              <AlertTriangle size={11} className="text-indigo-400 animate-pulse" /> Diagnostics Console
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Error Preview Suite<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Inspect user-facing HTTP boundary views, audit response code layouts, and trigger real-time log simulator outputs.
            </p>
          </div>

          {/* SIMULATOR STATUS CONTROL */}
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-4 py-2.5 rounded-2xl">
            <Play size={13} className="text-indigo-400 animate-spin" /> Engine Mode: Interactive
          </div>
        </div>

        {/* 🛠️ TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full box-border">
          
          {/* LEFT: ERROR CODE ACCORDION/SELECTORS (4 Columns) */}
          <div className="lg:col-span-4 bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Eye size={15} className="text-indigo-400"/> Choose HTTP Boundary
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">Select an error template below to preview its styling</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.keys(errorSpecs).map((errCode) => {
                  const spec = errorSpecs[errCode];
                  const isSelected = selectedError === errCode;
                  return (
                    <button
                      key={errCode}
                      onClick={() => setSelectedError(errCode)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all duration-350 relative overflow-hidden group outline-none ${
                        isSelected 
                          ? "bg-slate-900 border-indigo-500/60 text-white shadow-lg" 
                          : "bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-black tracking-tight ${isSelected ? "text-indigo-400" : "text-slate-500"}`}>
                            {errCode}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black truncate">{spec.title}</h4>
                            <span className="text-[9px] font-bold text-slate-500">{spec.severity} Severity</span>
                          </div>
                        </div>
                        <span className="transition-transform group-hover:translate-x-1 duration-300">
                          {spec.icon}
                        </span>
                      </div>
                      {/* Active Background Glow */}
                      {isSelected && (
                        <div 
                          className="absolute inset-0 opacity-100 pointer-events-none transition-opacity duration-300"
                          style={{ backgroundColor: spec.bgGlow }}
                        ></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUICK RESOLUTION ADVICE */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block">Operator Guidance</span>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                {errorSpecs[selectedError].suggestedFix}
              </p>
            </div>
          </div>

          {/* RIGHT: RENDER LIVE PREVIEW CARD & STACK CONSOLE (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* LIVE UI PREVIEW CARD */}
            <div className="bg-slate-900/30 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[360px]">
              
              {/* Dynamic Glow Circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="space-y-4 max-w-lg relative z-10 flex flex-col items-center">
                
                {/* Glowing Giant Status Code */}
                <h2 className={`text-7xl sm:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r tracking-tighter ${errorSpecs[selectedError].codeGlow} animate-pulse drop-shadow-lg`}>
                  {selectedError}
                </h2>

                <div className="flex items-center gap-2 justify-center">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping"></span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                    {errorSpecs[selectedError].title}
                  </span>
                </div>

                <p className="text-slate-350 text-xs sm:text-sm font-black italic max-w-sm mt-1">
                  "{errorSpecs[selectedError].subtitle}"
                </p>

                <p className="text-slate-400 text-xs font-medium leading-relaxed mt-2 max-w-md">
                  {errorSpecs[selectedError].description}
                </p>

                {/* Simulated navigation triggers */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button 
                    onClick={() => toast.error(`Boundary intercept error: ${selectedError}`)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-900/60 text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition"
                  >
                    <ArrowLeft size={12}/> Return to dashboard
                  </button>
                  <button 
                    onClick={startSimulation}
                    disabled={isSimulating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 transition"
                  >
                    <RefreshCw size={12} className={isSimulating ? "animate-spin" : ""} />
                    {isSimulating ? "Resolving..." : "Simulate Resolve"}
                  </button>
                </div>
              </div>
            </div>

            {/* REAL-TIME TERMINAL/LOGS OUTPUT */}
            <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} className="text-indigo-400"/> Diagnostic Stack Logs Console
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyLogsToClipboard}
                    className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-850 transition"
                  >
                    {copiedLog ? <Check size={13} className="text-emerald-400" /> : <Copy size={13}/>}
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-1 rounded-lg">
                    Real-time
                  </span>
                </div>
              </div>

              {/* Log Board */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl h-44 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-2 custom-scrollbar">
                {logs.map((log, index) => {
                  let color = "text-slate-400";
                  if (log.includes("ERROR") || log.includes("FATAL") || log.includes("ACCESS_DENIED")) {
                    color = "text-rose-400 font-bold";
                  } else if (log.includes("WARN")) {
                    color = "text-amber-400 font-bold";
                  } else if (log.includes("AUTO-HEAL") || log.includes("heartbeat") || log.includes("success")) {
                    color = "text-emerald-400 font-bold font-mono";
                  } else if (log.includes("DEBUG") || log.includes("INFO")) {
                    color = "text-indigo-400";
                  }
                  return (
                    <div key={index} className={`leading-relaxed break-all ${color}`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
};

export default ErrorPages;
