import express from "express";
import {
  forgotPassword,
  getUser,
  login,
  logout,
  register,
  resetPassword,
  resetPasswordWithOtp,
  updatePassword,
  updateProfile,
  sendOtp,
  getAddresses,
  addAddress,
  deleteAddress,
} from "../Controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Auth Routes
router.post("/register", register);
router.post("/login", login);
router.get("/me", isAuthenticated, getUser);
router.get("/logout", isAuthenticated, logout);
router.post("/send-otp", sendOtp);

// Password Routes
router.post("/password/forgot", forgotPassword);
router.post("/password/reset-with-otp", resetPasswordWithOtp);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticated, updatePassword);

// Profile Route
router.put("/profile/update", isAuthenticated, updateProfile);

// Address Routes
router.get("/addresses", isAuthenticated, getAddresses);
router.post("/addresses", isAuthenticated, addAddress);
router.delete("/addresses/:id", isAuthenticated, deleteAddress);

export default router;