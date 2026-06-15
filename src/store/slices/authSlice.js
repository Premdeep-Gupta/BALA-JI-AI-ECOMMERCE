import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAuthPopup } from "./popupSlice";

// ================= REGISTER =================
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/auth/register", data);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      toast.success(res.data.message);
      thunkAPI.dispatch(toggleAuthPopup());
      return res.data.user;
    } catch (error) {
      toast.error(error.response?.data?.message);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Register Failed"
      );
    }
  }
);

// ================= LOGIN =================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      toast.success(res.data.message);
      thunkAPI.dispatch(toggleAuthPopup());
      return res.data.user;
    } catch (error) {
      toast.error(error.response?.data?.message);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Login Failed"
      );
    }
  }
);

// ================= GET USER =================
export const getUser = createAsyncThunk(
  "auth/getUser",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/auth/me");
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      return res.data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(null);
    }
  }
);

// ================= LOGOUT =================
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await axiosInstance.get("/auth/logout");
      localStorage.removeItem("token");
      toast.success("Logged out");
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message);
      return thunkAPI.rejectWithValue("Logout failed");
    }
  }
);

// ================= FORGOT PASSWORD =================
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (emailOrPhone, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/auth/password/forgot", { emailOrPhone });
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Forgot Password Failed");
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Forgot Password Failed"
      );
    }
  }
);

// ================= RESET PASSWORD WITH OTP =================
export const resetPasswordWithOtp = createAsyncThunk(
  "auth/resetPasswordWithOtp",
  async (resetData, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/auth/password/reset-with-otp", resetData);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      toast.success(res.data.message);
      thunkAPI.dispatch(toggleAuthPopup());
      return res.data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset Password Failed");
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Reset Password Failed"
      );
    }
  }
);

// ================= RESET PASSWORD =================
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password, confirmPassword }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/auth/password/reset/${token}`, {
        password,
        confirmPassword,
      });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      toast.success(res.data.message);
      return res.data.user;
    } catch (error) {
      toast.error(error.response?.data?.message);
      return thunkAPI.rejectWithValue("Reset Password Failed");
    }
  }
);


// ================= UPDATE PASSWORD (UPDATED FOR BACKEND MATCH) =================
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (passwordData, thunkAPI) => {
    // passwordData should contain { currentPassword, newPassword, confirmNewPassword }
    try {
      const res = await axiosInstance.put("/auth/password/update", passwordData);
      toast.success(res.data.message);
      return res.data.message;
    } catch (error) {
      toast.error(error.response?.data?.message);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Update Password Failed"
      );
    }
  }
);

// ================= UPDATE PROFILE =================
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, thunkAPI) => {
    try {
      const res = await axiosInstance.put("/auth/profile/update", formData);
      toast.success(res.data.message);
      return res.data.user;
    } catch (error) {
      toast.error(error.response?.data?.message);
      return thunkAPI.rejectWithValue("Update Profile Failed");
    }
  }
);

// ================= SLICE =================
const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,

    isSigningUp: false,
    isLoggingIn: false,
    isCheckingAuth: true,

    isForgotPassword: false,
    isResetPassword: false,
    isUpdatingPassword: false,
    isUpdatingProfile: false,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.isSigningUp = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isSigningUp = false;
        state.authUser = action.payload;
      })
      .addCase(registerUser.rejected, (state) => {
        state.isSigningUp = false;
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.isLoggingIn = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.authUser = action.payload;
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoggingIn = false;
      })

      // GET USER
      .addCase(getUser.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.authUser = action.payload;
      })
      .addCase(getUser.rejected, (state) => {
        state.isCheckingAuth = false;
        state.authUser = null;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.authUser = null;
      })

      // FORGOT PASSWORD
      .addCase(forgotPassword.pending, (state) => {
        state.isForgotPassword = true;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isForgotPassword = false;
      })
      .addCase(forgotPassword.rejected, (state) => {
        state.isForgotPassword = false;
      })

      // RESET PASSWORD WITH OTP
      .addCase(resetPasswordWithOtp.pending, (state) => {
        state.isResetPassword = true;
      })
      .addCase(resetPasswordWithOtp.fulfilled, (state, action) => {
        state.isResetPassword = false;
        state.authUser = action.payload;
      })
      .addCase(resetPasswordWithOtp.rejected, (state) => {
        state.isResetPassword = false;
      })

      // RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.isResetPassword = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isResetPassword = false;
      })
      .addCase(resetPassword.rejected, (state) => {
        state.isResetPassword = false;
      })

      // UPDATE PASSWORD
      .addCase(updatePassword.pending, (state) => {
        state.isUpdatingPassword = true;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.isUpdatingPassword = false;
      })
      .addCase(updatePassword.rejected, (state) => {
        state.isUpdatingPassword = false;
      })

      // UPDATE PROFILE
      .addCase(updateProfile.pending, (state) => {
        state.isUpdatingProfile = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.authUser = action.payload;
      })
      .addCase(updateProfile.rejected, (state) => {
        state.isUpdatingProfile = false;
      });
  },
});

export default authSlice.reducer;
