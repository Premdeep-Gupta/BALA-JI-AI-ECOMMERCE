import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useParams } from "react-router-dom";
import { resetPassword } from "../store/slices/authSlice";

const ResetPassword = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const dispatch = useDispatch();
  const handleSubmit = (e) => {
    e.preventDefault();
    // Dispatching fixed
    dispatch(resetPassword({ token, formData }));
  };

  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (isAuthenticated && user?.role === "Admin") {
    return <Navigate to="/" />;
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200 px-4">
        <div className="bg-white shadow-lg rounded-2xl max-w-md w-full p-8 sm:p-10">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Reset Password
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="p-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter Your New Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
            <div className="p-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Enter Your Confirm Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
            <div className="px-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition flex justify-center items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;