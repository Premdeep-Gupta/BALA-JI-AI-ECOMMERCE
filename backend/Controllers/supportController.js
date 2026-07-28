import database from "../database/db.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { v2 as cloudinary } from "cloudinary";

// ======================= CHAT SERVICES =======================

// 💬 Get user chats (User end)
export const getUserChats = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const result = await database.query(
    `SELECT id, user_id, sender, message, attachment_url, created_at
     FROM support_chats
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );

  res.status(200).json({
    success: true,
    chats: result.rows,
  });
});

// 💬 Send chat message (User end)
export const postUserChat = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { message } = req.body || {};

  let attachmentUrl = null;
  if (req.files && req.files.file) {
    const file = req.files.file;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "Support_Attachments",
      resource_type: "auto"
    });
    attachmentUrl = result.secure_url;
  }

  if ((!message || !message.trim()) && !attachmentUrl) {
    return next(new ErrorHandler("Message or file attachment is required", 400));
  }

  const result = await database.query(
    `INSERT INTO support_chats (user_id, sender, message, attachment_url)
     VALUES ($1, 'user', $2, $3)
     RETURNING *`,
    [userId, message ? message.trim() : "", attachmentUrl]
  );

  res.status(201).json({
    success: true,
    chat: result.rows[0],
  });
});

// 💬 Get user chats by User ID (Admin end)
export const getAdminChats = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  const result = await database.query(
    `SELECT id, user_id, sender, message, attachment_url, created_at
     FROM support_chats
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );

  res.status(200).json({
    success: true,
    chats: result.rows,
  });
});

// 💬 Send chat message (Admin end)
export const postAdminChat = catchAsyncErrors(async (req, res, next) => {
  const { userId, message } = req.body || {};

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  let attachmentUrl = null;
  if (req.files && req.files.file) {
    const file = req.files.file;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "Support_Attachments",
      resource_type: "auto"
    });
    attachmentUrl = result.secure_url;
  }

  if ((!message || !message.trim()) && !attachmentUrl) {
    return next(new ErrorHandler("Message or file attachment is required", 400));
  }

  const result = await database.query(
    `INSERT INTO support_chats (user_id, sender, message, attachment_url)
     VALUES ($1, 'admin', $2, $3)
     RETURNING *`,
    [userId, message ? message.trim() : "", attachmentUrl]
  );

  res.status(201).json({
    success: true,
    chat: result.rows[0],
  });
});

// 💬 Get active chat users (Admin end)
export const getActiveChatUsers = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `SELECT 
       u.id, 
       u.name, 
       u.email, 
       (SELECT message FROM support_chats WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message,
       (SELECT created_at FROM support_chats WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
     FROM users u
     WHERE EXISTS (
       SELECT 1 FROM support_chats WHERE user_id = u.id
     )
     ORDER BY last_message_at DESC`
  );

  res.status(200).json({
    success: true,
    users: result.rows,
  });
});


// ======================= EMAIL SERVICES =======================

// ✉️ Get support emails (User end)
export const getUserEmails = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { folder = "inbox" } = req.query;

  const result = await database.query(
    `SELECT id, user_id, folder, sender_name, sender_email, recipient_email, subject, body, read, starred, status, priority, ticket_id, created_at
     FROM support_emails
     WHERE user_id = $1 AND folder = $2
     ORDER BY created_at DESC`,
    [userId, folder]
  );

  res.status(200).json({
    success: true,
    emails: result.rows,
  });
});

// ✉️ Send support email ticket to Admin (User end)
export const postUserEmail = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { subject, body, priority = "medium" } = req.body;

  if (!subject || !body) {
    return next(new ErrorHandler("Subject and body are required", 400));
  }

  // Generate unique Ticket ID
  const ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);

  // 1. Create a 'sent' record for the user
  const userSentResult = await database.query(
    `INSERT INTO support_emails (user_id, folder, sender_name, sender_email, recipient_email, subject, body, read, status, priority, ticket_id)
     VALUES ($1, 'sent', $2, $3, 'support@balajimart.com', $4, $5, true, 'open', $6, $7)
     RETURNING *`,
    [userId, req.user.name, req.user.email, subject, body, priority, ticketId]
  );

  // 2. An 'inbox' record representing the incoming message for the admin to see
  await database.query(
    `INSERT INTO support_emails (user_id, folder, sender_name, sender_email, recipient_email, subject, body, read, status, priority, ticket_id)
     VALUES ($1, 'inbox', $2, $3, 'support@balajimart.com', $4, $5, false, 'open', $6, $7)`,
    [userId, req.user.name, req.user.email, subject, body, priority, ticketId]
  );

  // 3. Auto-Response Confirmation email in the customer's inbox
  const autoResponseBody = `Dear ${req.user.name},

Your support ticket regarding '${subject}' has been successfully registered in the Balaji Mart Support Hub.

- **Ticket ID**: #${ticketId}
- **Status**: Open
- **Priority**: ${priority.toUpperCase()}

A dedicated support executive will inspect your request details shortly and reply back.

Regards,
Balaji Mart Support Console`;

  await database.query(
    `INSERT INTO support_emails (user_id, folder, sender_name, sender_email, recipient_email, subject, body, read, status, priority, ticket_id)
     VALUES ($1, 'inbox', 'Admin Support', 'support@balajimart.com', $2, $3, $4, false, 'open', $5, $6)`,
    [userId, req.user.email, `[Auto-Response] Ticket #${ticketId} Registered`, autoResponseBody, priority, ticketId]
  );

  res.status(201).json({
    success: true,
    email: userSentResult.rows[0],
  });
});

// ✉️ Get support emails (Admin end)
export const getAdminEmails = catchAsyncErrors(async (req, res, next) => {
  const { folder = "inbox" } = req.query;

  const result = await database.query(
    `SELECT id, user_id, folder, sender_name, sender_email, recipient_email, subject, body, read, starred, status, priority, ticket_id, created_at
     FROM support_emails
     WHERE folder = $1
     ORDER BY created_at DESC`,
    [folder]
  );

  res.status(200).json({
    success: true,
    emails: result.rows,
  });
});

// ✉️ Dispatch/reply support email from Admin (Admin end)
export const postAdminEmail = catchAsyncErrors(async (req, res, next) => {
  const { recipientEmail, subject, body, ticketId, status = "pending", priority = "medium" } = req.body;

  if (!recipientEmail || !subject || !body) {
    return next(new ErrorHandler("Recipient email, subject, and body are required", 400));
  }

  // Find target user by email
  const userRes = await database.query(
    `SELECT id, name, email FROM users WHERE email = $1 LIMIT 1`,
    [recipientEmail]
  );

  if (userRes.rows.length === 0) {
    return next(new ErrorHandler("Recipient user not found in Balaji Mart system", 404));
  }

  const targetUser = userRes.rows[0];

  // Update status in the thread if ticketId is provided
  if (ticketId) {
    await database.query(
      `UPDATE support_emails SET status = $1, priority = $2 WHERE ticket_id = $3 AND user_id = $4`,
      [status, priority, ticketId, targetUser.id]
    );
  }

  const activeTicketId = ticketId || ("TKT-" + Math.floor(100000 + Math.random() * 900000));

  // 1. Create a 'sent' record in DB (admin's sent list is modeled as folder = 'sent')
  const adminSentResult = await database.query(
    `INSERT INTO support_emails (user_id, folder, sender_name, sender_email, recipient_email, subject, body, read, status, priority, ticket_id)
     VALUES ($1, 'sent', 'Admin Support', 'support@balajimart.com', $2, $3, $4, true, $5, $6, $7)
     RETURNING *`,
    [targetUser.id, recipientEmail, subject, body, status, priority, activeTicketId]
  );

  // 2. Create an 'inbox' record for the customer to see in their mailbox
  await database.query(
    `INSERT INTO support_emails (user_id, folder, sender_name, sender_email, recipient_email, subject, body, read, status, priority, ticket_id)
     VALUES ($1, 'inbox', 'Admin Support', 'support@balajimart.com', $2, $3, $4, false, $5, $6, $7)`,
    [targetUser.id, recipientEmail, subject, body, status, priority, activeTicketId]
  );

  res.status(201).json({
    success: true,
    email: adminSentResult.rows[0],
  });
});

// ✉️ Star an email (Toggle star)
export const starEmail = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const checkRes = await database.query(
    `SELECT starred FROM support_emails WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (checkRes.rows.length === 0) {
    return next(new ErrorHandler("Email not found", 404));
  }

  const newStarred = !checkRes.rows[0].starred;

  const result = await database.query(
    `UPDATE support_emails SET starred = $1 WHERE id = $2 RETURNING *`,
    [newStarred, id]
  );

  res.status(200).json({
    success: true,
    email: result.rows[0],
  });
});

// ✉️ Move email to trash
export const trashEmail = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const checkRes = await database.query(
    `SELECT id FROM support_emails WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (checkRes.rows.length === 0) {
    return next(new ErrorHandler("Email not found", 404));
  }

  const result = await database.query(
    `UPDATE support_emails SET folder = 'trash' WHERE id = $1 RETURNING *`,
    [id]
  );

  res.status(200).json({
    success: true,
    email: result.rows[0],
  });
});

// ✉️ Update ticket status (Admin end)
export const updateTicketStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new ErrorHandler("Status is required", 400));
  }

  const emailRes = await database.query(
    `SELECT ticket_id, user_id FROM support_emails WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (emailRes.rows.length === 0) {
    return next(new ErrorHandler("Email ticket not found", 404));
  }

  const { ticket_id, user_id } = emailRes.rows[0];

  let result;
  if (ticket_id) {
    result = await database.query(
      `UPDATE support_emails SET status = $1 WHERE ticket_id = $2 AND user_id = $3 RETURNING *`,
      [status, ticket_id, user_id]
    );
  } else {
    result = await database.query(
      `UPDATE support_emails SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
  }

  res.status(200).json({
    success: true,
    message: `Ticket status updated to ${status}`,
    email: result.rows[0],
  });
});

// ✉️ Update ticket priority (Admin end)
export const updateTicketPriority = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!priority) {
    return next(new ErrorHandler("Priority is required", 400));
  }

  const emailRes = await database.query(
    `SELECT ticket_id, user_id FROM support_emails WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (emailRes.rows.length === 0) {
    return next(new ErrorHandler("Email ticket not found", 404));
  }

  const { ticket_id, user_id } = emailRes.rows[0];

  let result;
  if (ticket_id) {
    result = await database.query(
      `UPDATE support_emails SET priority = $1 WHERE ticket_id = $2 AND user_id = $3 RETURNING *`,
      [priority, ticket_id, user_id]
    );
  } else {
    result = await database.query(
      `UPDATE support_emails SET priority = $1 WHERE id = $2 RETURNING *`,
      [priority, id]
    );
  }

  res.status(200).json({
    success: true,
    message: `Ticket priority updated to ${priority}`,
    email: result.rows[0],
  });
});
