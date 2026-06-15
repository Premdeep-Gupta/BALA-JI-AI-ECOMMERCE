import express from "express";
import { 
  fetchAllReels, 
  generateAIReel, 
  trackReelView, 
  deleteReel,
  generateAdScript,
  scrapeProductUrl
} from "../Controllers/reelsController.js";
import { isAdminAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public route to fetch all reels campaigns
router.get("/all", fetchAllReels);

// Public route to track analytics view click
router.post("/track-view/:id", trackReelView);

// Admin routes to create & delete visual campaigns
router.post("/generate", isAdminAuthenticated, authorizedRoles("Admin"), generateAIReel);
router.post("/generate-script", isAdminAuthenticated, authorizedRoles("Admin"), generateAdScript);
router.post("/scrape-url", isAdminAuthenticated, authorizedRoles("Admin"), scrapeProductUrl);
router.delete("/:id", isAdminAuthenticated, authorizedRoles("Admin"), deleteReel);

export default router;
