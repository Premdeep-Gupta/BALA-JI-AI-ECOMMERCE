import express from "express";
import {
  fetchSingleOrder,
  placeNewOrder,
  fetchMyOrders,
  fetchAllOrders,
  updateOrderStatus,
  deleteOrder,
  createReturnRequest,
  fetchAllReturnRequests,
  updateReturnStatus,
} from "../Controllers/orderController.js";
import {
  isAuthenticated,
  isAdminAuthenticated, // 🔥 THE FIX: Naya admin middleware yahan import kiya
  authorizedRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// 👤 User Portals Routes (Localhost:5173 - Safely using user_token)
router.post("/new", isAuthenticated, placeNewOrder);
router.get("/:orderId", isAuthenticated, fetchSingleOrder);
router.get("/orders/me", isAuthenticated, fetchMyOrders);
router.put("/return/:orderId", isAuthenticated, createReturnRequest);

// 🛡️ Admin Dashboard Routes (Localhost:5174 - Isolated strictly using admin_token)
// In teeno routes par humne 'isAuthenticated' ko badal kar 'isAdminAuthenticated' kar diya hai
router.get(
  "/admin/getall",
  isAdminAuthenticated, // 👈 Super Fix for 403 Forbidden on orderSlice.js
  authorizedRoles("Admin"),
  fetchAllOrders
);
router.put(
  "/admin/update/:orderId",
  isAdminAuthenticated, // 👈 Connected safe admin gateway
  authorizedRoles("Admin"),
  updateOrderStatus
);
router.delete(
  "/admin/delete/:orderId",
  isAdminAuthenticated, // 👈 Connected safe admin gateway
  authorizedRoles("Admin"),
  deleteOrder
);

// Admin Return portal endpoints
router.get(
  "/admin/returns/all",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  fetchAllReturnRequests
);
router.put(
  "/admin/return/update/:returnId",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  updateReturnStatus
);

export default router;