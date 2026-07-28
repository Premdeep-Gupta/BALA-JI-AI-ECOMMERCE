import express from "express";
import {
  getUserChats,
  postUserChat,
  getAdminChats,
  postAdminChat,
  getUserEmails,
  postUserEmail,
  getAdminEmails,
  postAdminEmail,
  starEmail,
  trashEmail,
  updateTicketStatus,
  updateTicketPriority,
  getActiveChatUsers
} from "../Controllers/supportController.js";
import { isAuthenticated, isAdminAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 💬 Chat Endpoints
router.get("/chats/user", isAuthenticated, getUserChats);
router.post("/chats/user", isAuthenticated, postUserChat);
router.get("/chats/admin/:userId", isAdminAuthenticated, getAdminChats);
router.post("/chats/admin", isAdminAuthenticated, postAdminChat);
router.get("/chats/active-users", isAdminAuthenticated, getActiveChatUsers);

// ✉️ Email Endpoints
router.get("/emails/user", isAuthenticated, getUserEmails);
router.post("/emails/user", isAuthenticated, postUserEmail);
router.get("/emails/admin", isAdminAuthenticated, getAdminEmails);
router.post("/emails/admin", isAdminAuthenticated, postAdminEmail);
router.put("/emails/star/:id", isAuthenticated, starEmail);
router.put("/emails/trash/:id", isAuthenticated, trashEmail);
router.put("/emails/status/:id", isAdminAuthenticated, updateTicketStatus);
router.put("/emails/priority/:id", isAdminAuthenticated, updateTicketPriority);

export default router;
