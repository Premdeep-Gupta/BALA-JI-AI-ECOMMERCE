import express from "express";

import {
  createProduct,
  fetchAllProducts,
  fetchSingleProduct,
  updateProduct,
  deleteProduct,
  postProductReview,
  deleteReview,
  fetchAIFilteredProducts,
  fetchSimilarProducts,
  fetchVisualRecommendations,
} from "../Controllers/productController.js";

import { handleCameraSearch } from "../Controllers/cameraSearchController.js";
import { trackVisualSearchClick } from "../Controllers/analyticsController.js";

import {
  isAuthenticated,
  isAdminAuthenticated,
  authorizedRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ================= PUBLIC ROUTES =================

// Get All Products
router.get("/", fetchAllProducts);

// Get Single Product
router.get("/:productId", fetchSingleProduct);

// AI Product Search
router.post("/ai/search", fetchAIFilteredProducts);

// Camera/Visual Search
router.post("/camera-search", handleCameraSearch);

// Similar Products Visual Search
router.get("/similar/:productId", fetchSimilarProducts);

// Personalized Visual Recommendations
router.post("/recommendations", fetchVisualRecommendations);

// Analytics Tracking for visual search
router.post("/analytics/track-search-click", trackVisualSearchClick);

// ================= USER ROUTES =================

// Add Review
router.post(
  "/review/:productId",
  isAuthenticated,
  postProductReview
);

// Delete Review
router.delete(
  "/review/:productId",
  isAuthenticated,
  deleteReview
);

// ================= ADMIN ROUTES =================

// Create Product
router.post(
  "/admin/create",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  createProduct
);

// Update Product
router.put(
  "/admin/update/:productId",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  updateProduct
);

// Delete Product
router.delete(
  "/admin/delete/:productId",
  isAdminAuthenticated,
  authorizedRoles("Admin"),
  deleteProduct
);

export default router;