import express from "express";
import { 
  processPayment, 
  confirmPaymentStatus 
} from "../Controllers/paymentController.js";

// ✅ SAHI NAAM: isAuthenticated (Jo aapki authMiddleware file mein hai)
// ✅ SAHI PATH: authMiddleware.js (Jo aapke screenshot mein hai)
import { isAuthenticated } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Step 1: Stripe Intent Generate karna
router.route("/process").post(isAuthenticated, processPayment);

// Step 2: Payment Confirm hone ke baad DB update aur Cart clear karna
router.route("/confirm").post(isAuthenticated, confirmPaymentStatus);

export default router;