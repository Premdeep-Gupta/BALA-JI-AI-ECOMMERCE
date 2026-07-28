import express from "express";
import { getAboutSettings, getFaqSettings } from "../Controllers/siteSettingsController.js";

const router = express.Router();

router.get("/about", getAboutSettings);
router.get("/faq", getFaqSettings);

export default router;
