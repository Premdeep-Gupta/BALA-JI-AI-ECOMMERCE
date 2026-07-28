import express from "express";

import {
  getAllUsers,
  deleteUser,
  dashboardStats,
  getBuyers,
  updateUserRole,
  verifyDeliveryAgent,
  deleteDeliveryAgent,
  getDeliveryAgentWorkLogs,
  getDeliveryPartners,
  getDeliveryPartnerDetails,
  unblockDeliveryPartner,
  rejectUnblockRequest,
  getMarketingLiveData,
} from "../Controllers/adminController.js";

import {
  authorizedRoles,
  isAdminAuthenticated,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// 👥 Get All Users
router.get(
  "/getallusers",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getAllUsers
);

// 🛒 Get All Buyers (नया रूट यहाँ जुड़ गया है)
router.get(
  "/buyers",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getBuyers
);

// 👥 Update User Role
router.put(
  "/user/update/:id",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  updateUserRole
);

// 🗑 Delete User
router.delete(
  "/delete/:id",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  deleteUser
);

// 📊 Dashboard Stats
router.get(
  "/fetch/dashboard-stats",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  dashboardStats
);

// 📊 Real-Time Marketing stream live data
router.get(
  "/fetch/marketing-stream",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getMarketingLiveData
);

// 🚚 Verify Delivery Agent
router.put(
  "/delivery-agent/:id/verify",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  verifyDeliveryAgent
);

// 🗑 Delete Delivery Agent
router.delete(
  "/delivery-agent/:id",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  deleteDeliveryAgent
);

// 🚚 Get Delivery Agent Work/Payment Logs
router.get(
  "/delivery-agent/:id/work-logs",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getDeliveryAgentWorkLogs
);

// 🚚 Get All Delivery Partners
router.get(
  "/delivery-partners",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getDeliveryPartners
);

// 🚚 Get Delivery Partner Details (Fines, GPS Logs, Offline History)
router.get(
  "/delivery-partner/:id/details",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getDeliveryPartnerDetails
);

// 🚚 Unblock Delivery Partner
router.post(
  "/delivery-partner/:id/unblock",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  unblockDeliveryPartner
);

// 🚚 Reject Unblock Request Appeal
router.post(
  "/delivery-partner/:id/reject-unblock",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  rejectUnblockRequest
);

export default router;