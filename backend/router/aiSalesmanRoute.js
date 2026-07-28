import express from "express";
import { chatWithSalesman, voiceSearch } from "../Controllers/aiSalesmanController.js";

const router = express.Router();

// AI Salesman chat (both authenticated and anonymous)
router.post("/chat", chatWithSalesman);

// Voice Commerce AI — parse transcript, return matched products
router.post("/voice-search", voiceSearch);

export default router;
