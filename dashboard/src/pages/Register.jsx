import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register, clearErrors } from "../store/slices/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ShieldPlus, Smartphone } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
       // Error handled by toast in slice, just clear it here
       dispatch(clearErrors());
    }
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate, error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register(formData));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-[3rem] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

        <div className="mb-10">
          <h2 className="text-4xl font-black text-gray-900 leading-tight">Create Admin Identity</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-[0.2em]">Step into the control room</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Full Official Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-600" size={20} />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Company Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-600" size={20} />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                placeholder="admin@corp.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Mobile Phone Number</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-600" size={20} />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Secure Keypad</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-gray-300 group-focus-within:text-blue-600" size={20} />
              <input
                type="password"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                placeholder="8 - 16 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-blue-400"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : (
              <><ShieldPlus size={22} /> Initialize Admin Account</>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50 text-center">
           <p className="font-bold text-gray-400">
             Already authorized? <Link to="/login" className="text-gray-900 border-b-2 border-blue-600 pb-1">Sign In</Link>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Register;