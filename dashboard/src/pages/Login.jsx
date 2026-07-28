import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { login, clearErrors } from "../store/slices/authSlice";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, ShieldCheck, Mail, Lock } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  if (isAuthenticated && user?.role === "Admin") return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      {/* Background Decorative Circles */}
      <div className="fixed top-[-10%] left-[-5%] w-72 h-72 bg-blue-400 rounded-full blur-[120px] opacity-20"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-400 rounded-full blur-[120px] opacity-20"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-10 z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-200 mb-4 transform hover:rotate-12 transition-transform">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Admin Portal</h2>
          <p className="text-gray-500 font-medium mt-2">Elite Dashboard Secure Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Identity Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                placeholder="admin@elite.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Master Key</label>
              <Link to="/password/forgot" className="text-xs font-bold text-blue-600 hover:underline">Forgot Key?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:bg-gray-400"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "Unlock Dashboard"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500 font-medium">
            Unauthorized? <Link to="/register" className="text-blue-600 font-black hover:underline">Register Admin</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;