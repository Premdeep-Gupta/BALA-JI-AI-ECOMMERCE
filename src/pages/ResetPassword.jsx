import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

import { resetPassword } from "../store/slices/authSlice";

const ResetPassword = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    const res = await dispatch(
      resetPassword({ token, password, confirmPassword })
    );

    if (res?.payload?.success) {
      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] relative overflow-hidden px-4">

      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] bg-[var(--primary)]/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-[var(--accent)]/10 blur-[130px] rounded-full pointer-events-none" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] shadow-2xl backdrop-blur-xl"
      >
        {/* Success UI */}
        {success ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <CheckCircle size={50} className="text-green-500" />
            <h2 className="text-xl font-bold text-white">Password Updated</h2>
            <p className="text-sm opacity-60">
              Redirecting to home...
            </p>
          </div>
        ) : (
          <>
            {/* Title */}
            <h2 className="text-2xl font-black text-center mb-6 uppercase tracking-wider text-white">
              Reset Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Password */}
              <div className="flex items-center gap-3 border border-[var(--border)] focus-within:border-[var(--primary)] p-3.5 rounded-xl relative transition-all bg-[var(--primary)]/[0.03]">
                <Lock size={16} className="opacity-50" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-[var(--text)] placeholder:text-slate-500 text-sm"
                />

                {showPass ? (
                  <EyeOff
                    size={16}
                    className="cursor-pointer opacity-50 hover:opacity-100 transition"
                    onClick={() => setShowPass(false)}
                  />
                ) : (
                  <Eye
                    size={16}
                    className="cursor-pointer opacity-50 hover:opacity-100 transition"
                    onClick={() => setShowPass(true)}
                  />
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex items-center gap-3 border border-[var(--border)] focus-within:border-[var(--primary)] p-3.5 rounded-xl transition-all bg-[var(--primary)]/[0.03]">
                <Lock size={16} className="opacity-50" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-[var(--text)] placeholder:text-slate-500 text-sm"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-lg shadow-[var(--primary)]/10"
              >
                Update Password
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs mt-6 opacity-40 uppercase tracking-widest font-semibold">
              🔒 Secure password reset
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;