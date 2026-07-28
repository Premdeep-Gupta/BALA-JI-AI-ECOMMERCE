import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import {
  loginUser,
  registerUser,
  forgotPassword,
  resetPasswordWithOtp,
} from "../../store/slices/authSlice";

import { toggleAuthPopup } from "../../store/slices/popupSlice";

const LoginModal = () => {
  const dispatch = useDispatch();

  const {
    isLoggingIn,
    isSigningUp,
    isForgotPassword,
    error: authError,
    success,
  } = useSelector((state) => state.auth);

  const isOpen = useSelector((state) => state.popup.isAuthPopupOpen);

  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // OTP Reset states
  const [forgotStep, setForgotStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");

  const primaryColor = "#3b82f6"; // A nice blue shade for premium look

  const isLoading = isLoggingIn || isSigningUp || isForgotPassword;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "login") {
      if (!form.email || !form.password)
        return setError("All fields required");
      dispatch(loginUser(form));
    }

    if (mode === "signup") {
      if (!form.name || !form.email || !form.password)
        return setError("All fields required");
      dispatch(registerUser(form));
    }

    if (mode === "forgot") {
      if (forgotStep === 1) {
        if (!emailOrPhone) return setError("Email or Phone required");
        const actionResult = await dispatch(forgotPassword(emailOrPhone));
        if (forgotPassword.fulfilled.match(actionResult)) {
          if (actionResult.payload?.simulatedOtp) {
            setSimulatedOtp(actionResult.payload.simulatedOtp);
          } else {
            setSimulatedOtp("");
          }
          setForgotStep(2);
        }
      } else if (forgotStep === 2) {
        if (!otp || !newPassword || !confirmNewPassword) {
          return setError("All fields required");
        }
        if (newPassword !== confirmNewPassword) {
          return setError("Passwords do not match");
        }
        if (newPassword.length < 8) {
          return setError("Password must be at least 8 characters");
        }
        const actionResult = await dispatch(
          resetPasswordWithOtp({
            emailOrPhone,
            otp,
            password: newPassword,
            confirmPassword: confirmNewPassword,
          })
        );
        if (resetPasswordWithOtp.fulfilled.match(actionResult)) {
          setForgotStep(1);
          setEmailOrPhone("");
          setOtp("");
          setNewPassword("");
          setConfirmNewPassword("");
          setSimulatedOtp("");
          setMode("login");
        }
      }
    }
  };

  // ✅ close modal on success
  useEffect(() => {
    if (success) {
      dispatch(toggleAuthPopup());
      setForm({ name: "", email: "", password: "" });
      setMode("login");
    }
  }, [success, dispatch]);

  // reset error when mode changes
  useEffect(() => {
    setError("");
    setForgotStep(1);
    setEmailOrPhone("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSimulatedOtp("");
  }, [mode]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dispatch(toggleAuthPopup())}
      >
        <motion.div
          className="w-96 p-6 rounded-2xl text-slate-800 relative shadow-2xl border bg-white"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* CLOSE */}
          <X
            className="absolute top-4 right-4 cursor-pointer text-slate-400 hover:text-slate-800 transition-colors"
            onClick={() => dispatch(toggleAuthPopup())}
          />

          {/* TITLE */}
          <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && (forgotStep === 1 ? "Reset Password" : "Enter OTP")}
          </h2>

          {/* BACK */}
          {mode === "forgot" && (
            <button
              onClick={() => {
                if (forgotStep === 2) {
                  setForgotStep(1);
                  setOtp("");
                  setSimulatedOtp("");
                } else {
                  setMode("login");
                }
              }}
              className="flex items-center gap-1 text-blue-600 font-medium text-sm mb-4 hover:underline"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          {/* ERROR */}
          {(error || authError) && (
            <p className="text-red-400 text-sm mb-2">
              {error || authError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* NAME */}
            {mode === "signup" && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <User size={18} className="text-slate-400" />
                <input
                  name="name"
                  placeholder="Full Name"
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
                />
              </div>
            )}

            {/* EMAIL */}
            {mode !== "forgot" && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Mail size={18} className="text-slate-400" />
                <input
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
                />
              </div>
            )}

            {/* FORGOT STEP 1 */}
            {mode === "forgot" && forgotStep === 1 && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Mail size={18} className="text-slate-400" />
                <input
                  value={emailOrPhone}
                  placeholder="Email or Phone Number"
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
                />
              </div>
            )}

            {/* FORGOT STEP 2 */}
            {mode === "forgot" && forgotStep === 2 && (
              <>
                {simulatedOtp && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 text-center font-medium mb-3">
                    🔒 Dev Mode OTP code: <span className="underline select-all font-bold">{simulatedOtp}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Lock size={18} className="text-slate-400" />
                  <input
                    value={otp}
                    placeholder="Enter 6-Digit OTP"
                    maxLength={6}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    className="w-full bg-transparent outline-none text-slate-800 font-mono tracking-widest text-center text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all relative">
                  <Lock size={18} className="text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    placeholder="New Password"
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
                  />
                  {showPass ? (
                    <EyeOff size={18} onClick={() => setShowPass(false)} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors" />
                  ) : (
                    <Eye size={18} onClick={() => setShowPass(true)} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors" />
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Lock size={18} className="text-slate-400" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    placeholder="Confirm Password"
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
                  />
                </div>
              </>
            )}

            {/* PASSWORD */}
            {mode !== "forgot" && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all relative">
                <Lock size={18} className="text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
                />

                {showPass ? (
                  <EyeOff size={18} onClick={() => setShowPass(false)} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors" />
                ) : (
                  <Eye size={18} onClick={() => setShowPass(true)} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors" />
                )}
              </div>
            )}

            {/* BUTTON */}
            <button
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 mt-4"
              style={{ background: primaryColor }}
            >
              {isLoading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : mode === "signup"
                ? "Create Account"
                : mode === "forgot" && forgotStep === 1
                ? "Send OTP"
                : "Reset Password"}
            </button>
          </form>

          {/* SWITCH */}
          <div className="text-sm text-center mt-6 text-slate-500 space-y-3 font-medium">

            {mode === "login" && (
              <>
                <p>
                  New user?{" "}
                  <span onClick={() => setMode("signup")} className="cursor-pointer text-blue-600 hover:underline">
                    Create account
                  </span>
                </p>
                <p onClick={() => setMode("forgot")} className="cursor-pointer text-slate-500 hover:text-slate-800 hover:underline">
                  Forgot Password?
                </p>
              </>
            )}

            {mode === "signup" && (
              <p>
                Already have account?{" "}
                <span onClick={() => setMode("login")} className="cursor-pointer text-blue-600 hover:underline">
                  Sign in
                </span>
              </p>
            )}

            {mode === "forgot" && (
              <p onClick={() => setMode("login")} className="cursor-pointer text-slate-500 hover:text-slate-800 hover:underline">
                Back to login
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginModal;