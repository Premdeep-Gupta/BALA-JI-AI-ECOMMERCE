import express from "express";
import {
  detectSpecialDays,
  getActiveCampaign,
  getAllCampaigns,
  createCampaign,
  updateCampaignStatus,
  deleteCampaign,
  trackCampaignAction,
  getCampaignAnalytics,
  logBrowseHistory,
  getAIProductRecommendations,
  generateImage,
  uploadCampaignMedia,
  updateCampaignDetails
} from "../Controllers/campaignController.js";
import {
  isAuthenticated,
  isAdminAuthenticated,
  authorizedRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ================= PUBLIC USER PORTAL ENDPOINTS =================
router.get("/active", getActiveCampaign);
router.post("/track/:id", trackCampaignAction);
router.post("/browse", logBrowseHistory);
router.get("/recommendations", getAIProductRecommendations);

// ================= PROTECTED ADMIN ENDPOINTS =================
router.post(
  "/admin/detect",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  detectSpecialDays
);

router.get(
  "/admin/all",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getAllCampaigns
);

router.post(
  "/admin/create",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  createCampaign
);

router.post(
  "/admin/generate-image",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  generateImage
);

router.post(
  "/admin/upload-media",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  uploadCampaignMedia
);

router.put(
  "/admin/update/:id",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  updateCampaignStatus
);

router.put(
  "/admin/update-details/:id",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  updateCampaignDetails
);

router.delete(
  "/admin/delete/:id",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  deleteCampaign
);

router.get(
  "/admin/analytics",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  getCampaignAnalytics
);

export default router;
