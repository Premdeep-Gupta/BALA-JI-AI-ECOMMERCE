import express from "express";
import {
  registerDeliveryAgent,
  loginDeliveryAgent,
  logoutDeliveryAgent,
  getDeliveryAgentProfile,
  getAssignedOrders,
  deliverOrder,
  getMyWorkLogs,
  getAllDeliveryAgents,
  updateAgentStatus,
  updateAgentLocation,
  updateDeliveryAgentProfile,
  pickupReturnOrder,
  logOfflineEvent,
  autoBlockPartner,
  submitUnblockRequest,
  checkShiftAutoUnblock,
  bookShift,
  cancelShift,
  getMyShiftBookings,
  getMyFineHistory
} from "../Controllers/deliveryController.js";
import { 
  isDeliveryAgentAuthenticated, 
  isAdminAuthenticated, 
  authorizedRoles,
  isNotBlocked
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerDeliveryAgent);
router.post("/login", loginDeliveryAgent);
router.get("/logout", logoutDeliveryAgent);
router.get("/profile", isDeliveryAgentAuthenticated, getDeliveryAgentProfile);

// ── Protected transactional routes (blocked agents cannot use these) ──
router.get("/assigned-orders", isDeliveryAgentAuthenticated, isNotBlocked, getAssignedOrders);
router.get("/my-work-logs", isDeliveryAgentAuthenticated, isNotBlocked, getMyWorkLogs);
router.put("/deliver/:orderId", isDeliveryAgentAuthenticated, isNotBlocked, deliverOrder);
router.put("/update-status", isDeliveryAgentAuthenticated, isNotBlocked, updateAgentStatus);
router.put("/update-location", isDeliveryAgentAuthenticated, isNotBlocked, updateAgentLocation);
router.put("/profile/update", isDeliveryAgentAuthenticated, isNotBlocked, updateDeliveryAgentProfile);
router.put("/pickup/:orderId", isDeliveryAgentAuthenticated, isNotBlocked, pickupReturnOrder);

// ── Block & Unblock workflow (no isNotBlocked — accessible when blocked) ──
router.post("/auto-block", isDeliveryAgentAuthenticated, autoBlockPartner);
router.post("/submit-unblock", isDeliveryAgentAuthenticated, submitUnblockRequest);
router.post("/offline-event", isDeliveryAgentAuthenticated, logOfflineEvent);
router.post("/check-shift-unblock", isDeliveryAgentAuthenticated, checkShiftAutoUnblock);

// ── Shift Booking system ──
router.post("/book-shift", isDeliveryAgentAuthenticated, bookShift);
router.delete("/cancel-shift/:bookingId", isDeliveryAgentAuthenticated, cancelShift);
router.get("/my-bookings", isDeliveryAgentAuthenticated, getMyShiftBookings);

// ── Fine & compliance history ──
router.get("/my-fines", isDeliveryAgentAuthenticated, getMyFineHistory);

// ── Admin dropdown ──
router.get("/admin/agents", isAdminAuthenticated, authorizedRoles("Admin"), getAllDeliveryAgents);

export default router;
