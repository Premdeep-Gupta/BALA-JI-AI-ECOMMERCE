import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, ShieldAlert } from "lucide-react";
import { loginUser, registerUser } from "../store/slices/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { authUser, isLoggingIn, isSigningUp, error: authError, success } = useSelector(
    (state) => state.auth
  );

  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const isLoading = isLoggingIn || isSigningUp;

  // Redirect if already authenticated
  useEffect(() => {
    if (authUser) {
      navigate("/checkout");
    }
  }, [authUser, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "login") {
      if (!form.email || !form.password) {
        return setError("Please fill in all fields.");
      }
      dispatch(loginUser(form));
    }

    if (mode === "signup") {
      if (!form.name || !form.email || !form.password) {
        return setError("Please fill in all fields.");
      }
      dispatch(registerUser(form));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-900/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Informative Security Alert Box */}
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-200">
          <ShieldAlert className="w-6 h-6 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-amber-300">Authentication Required</h4>
            <p className="opacity-90 leading-relaxed mt-1">
              Please sign in or create an account to securely check out and process your order items.
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">
            {mode === "login" ? "Welcome Back" : "Get Started"}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {mode === "login" 
              ? "Access your dashboard, manage orders and checkout secure payments." 
              : "Register a secure buyer profile for tracking and fast dispatches."}
          </p>
        </div>

        {/* Action errors */}
        {(error || authError) && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-350 text-sm rounded-xl font-medium">
            {error || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
              <User size={18} className="text-slate-500" />
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-slate-100 placeholder-slate-500 text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
            <Mail size={18} className="text-slate-500" />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-transparent outline-none text-slate-100 placeholder-slate-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all relative">
            <Lock size={18} className="text-slate-500" />
            <input
              name="password"
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-transparent outline-none text-slate-100 placeholder-slate-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-6 shadow-lg shadow-blue-600/10"
          >
            {isLoading 
              ? "Authenticating..." 
              : mode === "login" 
              ? "Sign In Securely" 
              : "Register Account"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-400 font-medium">
          {mode === "login" ? (
            <p>
              New user?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-blue-500 hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-blue-500 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
