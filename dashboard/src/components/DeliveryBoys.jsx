import React, { useState, useEffect } from "react";
import Header from "./Header";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Users, Truck, CheckCircle, XCircle, Search, ShieldCheck, Trash2 } from "lucide-react";
import DeliveryAgentVerificationModal from "./DeliveryAgentVerificationModal";

const DeliveryBoys = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    try {
      // Replace with your actual admin API endpoint when ready
      const response = await axiosInstance.get("/delivery/admin/agents");
      if (response.data.success) {
        setDeliveryBoys(response.data.deliveryAgents || []);
      }
    } catch (error) {
      console.error("Error fetching delivery boys:", error);
      // For demonstration, use some mock data if API fails
      setDeliveryBoys([
        {
          _id: "1",
          name: "Ramesh Kumar",
          email: "ramesh@example.com",
          mobile: "9876543210",
          status: "active",
          isVerified: true,
          verification_status: "Approved",
          delivery_partner_status: "ACTIVE",
          vehicleType: "bike",
          joinedAt: new Date().toISOString()
        },
        {
          _id: "2",
          name: "Suresh Singh",
          email: "suresh@example.com",
          mobile: "9876543211",
          status: "inactive",
          isVerified: false,
          verification_status: "Pending",
          delivery_partner_status: "ACTIVE",
          vehicleType: "scooter",
          joinedAt: new Date().toISOString()
        }
      ]);
      toast.error("Using mock data. Admin API endpoint may not be ready.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBoys = deliveryBoys.filter(boy => {
    const s = searchTerm.toLowerCase();
    const idMatch = (boy.id || boy._id || "").toLowerCase().includes(s);
    const nameMatch = (boy.name || "").toLowerCase().includes(s);
    const phoneMatch = (boy.phone || boy.mobile || "").includes(searchTerm);
    return idMatch || nameMatch || phoneMatch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this delivery partner? This will permanently delete them from the database and remove all associated logs.")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/admin/delivery-agent/${id}`);
      if (response.data.success) {
        toast.success("Delivery partner deleted successfully!");
        fetchDeliveryBoys();
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error(error.response?.data?.message || "Failed to delete delivery partner");
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
              <Truck size={11} className="text-indigo-400 animate-pulse" /> Fleet Management
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Delivery Partners<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Manage your delivery fleet, check verification status, and monitor active partners.
            </p>
          </div>

          {/* QUICK COUNTERS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-indigo-950/40 border border-indigo-800/30 px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/20 rounded-lg">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Total Partners</p>
                <h4 className="text-white text-sm font-black mt-0.5">{deliveryBoys.length} Registered</h4>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Users size={15} className="text-indigo-400" /> Partners Directory
            </h3>

            {/* SEARCH INPUT */}
            <div className="relative flex items-center group w-full sm:w-auto min-w-[250px]">
              <Search className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
              <input
                type="text"
                placeholder="Search by name or mobile..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/60 focus:border-indigo-600 rounded-xl font-bold text-xs outline-none transition-all placeholder:text-slate-500 text-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-900/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Partner Details</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Vehicle</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Verification</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredBoys.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Truck className="w-8 h-8 text-slate-600" />
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">No partners found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBoys.map((boy) => (
                    <tr key={boy.id || boy._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-200 text-sm">{boy.name}</div>
                        <div className="text-[10px] font-mono text-indigo-400 mt-1">ID: {(boy.id || boy._id || "").substring(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-300">{boy.phone || boy.mobile || '—'}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{boy.email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-black tracking-wider">
                          {boy.vehicle_number || boy.vehicle_type || boy.vehicleType || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {boy.delivery_partner_status === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider bg-rose-950/40 text-rose-400 border-rose-800/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#fb7185]"></span>
                            Blocked
                          </span>
                        ) : (boy.verification_status === 'Verified' || boy.verification_status === 'Approved') ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider bg-emerald-950/40 text-emerald-400 border-emerald-800/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border-slate-700/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          (boy.verification_status === 'Verified' || boy.verification_status === 'Approved') ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30' :
                          boy.verification_status === 'Rejected' ? 'bg-rose-950/40 text-rose-400 border-rose-900/30' :
                          'bg-amber-950/40 text-amber-400 border-amber-800/30'
                        }`}>
                          {boy.verification_status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAgent(boy)}
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-white bg-indigo-950/40 hover:bg-indigo-600 transition px-2.5 py-1.5 rounded-lg border border-indigo-800/30 text-xs font-bold"
                        >
                          Details & Verify
                        </button>
                        <button
                          onClick={() => handleDelete(boy.id || boy._id)}
                          className="p-1.5 text-rose-400 hover:text-white bg-rose-955/30 hover:bg-rose-600 transition rounded-lg border border-rose-900/30"
                          title="Delete Delivery Partner"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedAgent && (
        <DeliveryAgentVerificationModal 
          agent={selectedAgent} 
          onClose={() => setSelectedAgent(null)} 
          onRefresh={fetchDeliveryBoys}
        />
      )}
    </main>
  );
};

export default DeliveryBoys;
