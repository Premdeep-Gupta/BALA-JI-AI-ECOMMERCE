import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-hot-toast";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    user: null,
    isAuthenticated: false,
    message: null,
    error: null,
  },
  reducers: {
    authRequest(state) {
      state.loading = true;
      state.error = null;
    },
    authSuccess(state, action) {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    authFailed(state, action) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logoutSuccess(state) {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
    },
    messageResponse(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    clearErrors(state) {
      state.error = null;
      state.message = null;
      state.loading = false;
    }
  },
});

export const { clearErrors } = authSlice.actions;

// 1. REGISTER
export const register = (data) => async (dispatch) => {
  dispatch(authSlice.actions.authRequest());
  try {
    const res = await axiosInstance.post("/auth/register", data);
    if (res.data.token) localStorage.setItem("token", res.data.token);
    dispatch(authSlice.actions.authSuccess(res.data.user));
    toast.success("Identity Created! Note: Set role to 'Admin' in DB.");
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Registration Failed";
    dispatch(authSlice.actions.authFailed(errorMsg));
    toast.error(errorMsg);
  }
};

// 2. LOGIN (SMART ROLE CHECK ADDED)
export const login = (data) => async (dispatch) => {
  dispatch(authSlice.actions.authRequest());
  try {
    const res = await axiosInstance.post("/auth/login", data);
    
    // ⭐ FLEXIBLE CHECK: Taaki 'Admin' aur 'admin' dono accept ho jayein
    const userRole = res.data.user.role ? res.data.user.role.toLowerCase() : "";

    if (userRole !== "admin") {
      toast.error("Access Denied: Admin Privileges Required");
      dispatch(authSlice.actions.authFailed("Unauthorized Access"));
      return;
    }

    if (res.data.token) localStorage.setItem("token", res.data.token);
    dispatch(authSlice.actions.authSuccess(res.data.user));
    toast.success(`Welcome back, ${res.data.user.name}`);
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Login Failed";
    dispatch(authSlice.actions.authFailed(errorMsg));
    toast.error(errorMsg);
  }
};

// 3. GET USER
export const getUser = () => async (dispatch) => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await axiosInstance.get("/auth/me");
    dispatch(authSlice.actions.authSuccess(res.data.user));
  } catch (error) {
    localStorage.removeItem("token");
    dispatch(authSlice.actions.authFailed());
  }
};

// 4. LOGOUT
export const logout = () => async (dispatch) => {
  try {
    await axiosInstance.get("/auth/logout");
    localStorage.removeItem("token");
    dispatch(authSlice.actions.logoutSuccess());
    toast.success("Logged out successfully");
  } catch (error) {
    toast.error("Logout failed");
  }
};

// 5. FORGOT PASSWORD 
export const forgotPassword = (email) => async (dispatch) => {
  dispatch(authSlice.actions.authRequest());
  try {
    const res = await axiosInstance.post(`/auth/password/forgot?frontendUrl=${window.location.origin}`, { email });
    dispatch(authSlice.actions.messageResponse(res.data.message));
    toast.success(res.data.message || "Reset link sent!");
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Failed to send email";
    dispatch(authSlice.actions.authFailed(errorMsg));
    toast.error(errorMsg);
  }
};

// 6. RESET PASSWORD
export const resetPassword = (data, token) => async (dispatch) => {
  dispatch(authSlice.actions.authRequest());
  try {
    const res = await axiosInstance.put(`/auth/password/reset/${token}`, data);
    dispatch(authSlice.actions.authSuccess(res.data.user));
    toast.success("Password reset successfully!");
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Reset failed";
    dispatch(authSlice.actions.authFailed(errorMsg));
    toast.error(errorMsg);
  }
};

// 7. UPDATE PROFILE
export const updateAdminProfile = (data) => async (dispatch) => {
  dispatch(authSlice.actions.authRequest());
  try {
    const res = await axiosInstance.put("/auth/profile/update", data);
    dispatch(authSlice.actions.authSuccess(res.data.user));
    toast.success("Profile Updated!");
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Update Failed";
    dispatch(authSlice.actions.authFailed(errorMsg));
    toast.error(errorMsg);
  }
};

// 8. UPDATE PASSWORD
export const updateAdminPassword = (data) => async (dispatch) => {
  dispatch(authSlice.actions.authRequest());
  try {
    await axiosInstance.put("/auth/password/update", data);
    dispatch(authSlice.actions.clearErrors());
    toast.success("Password Updated!");
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Update Failed";
    dispatch(authSlice.actions.authFailed(errorMsg));
    toast.error(errorMsg);
  }
};

export default authSlice.reducer;