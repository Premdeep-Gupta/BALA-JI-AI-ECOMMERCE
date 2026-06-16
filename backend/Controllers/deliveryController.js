import database from "../database/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { v2 as cloudinary } from "cloudinary";

// Helper to resolve shift times
const resolveShiftTimes = (preference) => {
  if (preference?.includes("Afternoon")) {
    return { start: "13:00", end: "19:00" };
  } else if (preference?.includes("Evening") || preference?.includes("Night")) {
    return { start: "19:00", end: "01:00" };
  }
  return { start: "07:00", end: "13:00" }; // Morning default
};

// 1. REGISTER DELIVERY AGENT
export const registerDeliveryAgent = catchAsyncErrors(async (req, res, next) => {
  const { 
    name, phone, vehicle_number, agency, password, latitude, longitude, shift_preference, address, documents, face_descriptor,
    email, dob, gender, emergency_contact, bank_account_holder, bank_account_number, bank_ifsc
  } = req.body;

  if (!name || !phone || !password) {
    return next(new ErrorHandler("Please provide all required fields (Name, Phone, Password).", 400));
  }

  const alreadyRegistered = await database.query("SELECT * FROM delivery_agents WHERE phone = $1", [phone]);
  const existingAgent = alreadyRegistered.rows[0];
  if (existingAgent && existingAgent.verification_status !== "Rejected") {
    return next(new ErrorHandler("Delivery agent with this phone is already registered.", 400));
  }

  let avatar_url = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  let aadhaar_url = null;
  let pan_url = null;
  const documentsObj = {
    email: email || null,
    dob: dob || null,
    gender: gender || null,
    emergency_contact: emergency_contact || null,
    bank_account_holder: bank_account_holder || null,
    bank_account_number: bank_account_number || null,
    bank_ifsc: bank_ifsc || null
  };

  const uploadDoc = async (base64Data, folder = "delivery_docs") => {
    if (!base64Data) return null;
    try {
      const uploadResult = await cloudinary.uploader.upload(base64Data, {
        folder: folder
      });
      return uploadResult.secure_url;
    } catch (err) {
      console.error(`Cloudinary upload error:`, err.message);
      return base64Data; // fallback to base64 if Cloudinary fails
    }
  };

  // Since documents is sent as base64 strings in req.body
  try {
    if (documents?.selfie) {
      avatar_url = await uploadDoc(documents.selfie, "delivery_avatars");
      documentsObj.selfie = avatar_url;
    }
    if (documents?.aadhaarFront) {
      aadhaar_url = await uploadDoc(documents.aadhaarFront, "delivery_docs");
      documentsObj.aadhaarFront = aadhaar_url;
    }
    if (documents?.panCard) {
      pan_url = await uploadDoc(documents.panCard, "delivery_docs");
      documentsObj.panCard = pan_url;
    }
    if (documents?.aadhaarBack) {
      documentsObj.aadhaarBack = await uploadDoc(documents.aadhaarBack, "delivery_docs");
    }
    if (documents?.addressProofFile) {
      documentsObj.addressProofFile = await uploadDoc(documents.addressProofFile, "delivery_docs");
    }
    if (documents?.rcFile) {
      documentsObj.rcFile = await uploadDoc(documents.rcFile, "delivery_docs");
    }
    if (documents?.vehiclePhoto) {
      documentsObj.vehiclePhoto = await uploadDoc(documents.vehiclePhoto, "delivery_docs");
    }
    if (documents?.drivingLicense) {
      documentsObj.drivingLicense = await uploadDoc(documents.drivingLicense, "delivery_docs");
    }
    if (documents?.insuranceCopy) {
      documentsObj.insuranceCopy = await uploadDoc(documents.insuranceCopy, "delivery_docs");
    }
    if (documents?.pollutionCertificate) {
      documentsObj.pollutionCertificate = await uploadDoc(documents.pollutionCertificate, "delivery_docs");
    }
    if (documents?.chequeFile) {
      documentsObj.chequeFile = await uploadDoc(documents.chequeFile, "delivery_docs");
    }
  } catch (err) {
    console.error("Cloudinary doc upload error:", err.message);
  }

  // Also check req.files fallback just in case
  if (req.files && req.files.avatar) {
    try {
      const uploadResult = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
        folder: "delivery_avatars",
        width: 150,
        crop: "scale"
      });
      avatar_url = uploadResult.secure_url;
      documentsObj.selfie = avatar_url;
    } catch (err) {
      console.error("Cloudinary avatar upload error:", err.message);
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const shiftTimes = resolveShiftTimes(shift_preference);

  let result;
  if (existingAgent) {
    result = await database.query(
      `UPDATE delivery_agents 
       SET name = $1, 
           vehicle_number = $2, 
           avatar_url = $3, 
           agency = $4, 
           password = $5, 
           latitude = $6, 
           longitude = $7, 
           shift_preference = $8, 
           shift_start = $9, 
           shift_end = $10, 
           address = $11, 
           aadhaar_url = COALESCE($12, aadhaar_url), 
           pan_url = COALESCE($13, pan_url), 
           face_descriptor = COALESCE($14, face_descriptor), 
           is_verified = false, 
           verification_status = 'Pending', 
           rejection_reason = null,
           documents = $16
       WHERE id = $15
       RETURNING id, name, phone, vehicle_number, avatar_url, agency, status, latitude, longitude, shift_preference, shift_start, shift_end, address, aadhaar_url, pan_url, face_descriptor, is_verified, verification_status, documents`,
      [
        name,
        vehicle_number || null,
        avatar_url,
        agency || null,
        hashedPassword,
        latitude ? Number(latitude) : 22.5726,
        longitude ? Number(longitude) : 88.3639,
        shift_preference || "Morning (07:00 AM - 01:00 PM)",
        shiftTimes.start,
        shiftTimes.end,
        address || null,
        aadhaar_url,
        pan_url,
        face_descriptor || null,
        existingAgent.id,
        JSON.stringify(documentsObj)
      ]
    );
  } else {
    result = await database.query(
      `INSERT INTO delivery_agents 
       (name, phone, vehicle_number, avatar_url, agency, password, latitude, longitude, shift_preference, shift_start, shift_end, address, aadhaar_url, pan_url, face_descriptor, is_verified, verification_status, documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, 'Pending', $16) 
       RETURNING id, name, phone, vehicle_number, avatar_url, agency, status, latitude, longitude, shift_preference, shift_start, shift_end, address, aadhaar_url, pan_url, face_descriptor, is_verified, verification_status, documents`,
      [
        name, 
        phone, 
        vehicle_number || null, 
        avatar_url, 
        agency || null, 
        hashedPassword,
        latitude ? Number(latitude) : 22.5726,
        longitude ? Number(longitude) : 88.3639,
        shift_preference || "Morning (07:00 AM - 01:00 PM)",
        shiftTimes.start,
        shiftTimes.end,
        address || null,
        aadhaar_url,
        pan_url,
        face_descriptor || null,
        JSON.stringify(documentsObj)
      ]
    );
  }

  res.status(201).json({
    success: true,
    message: "Delivery agent registered successfully.",
    deliveryAgent: result.rows[0],
  });
});

// 2. LOGIN DELIVERY AGENT
export const loginDeliveryAgent = catchAsyncErrors(async (req, res, next) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return next(new ErrorHandler("Please provide phone and password.", 400));
  }

  const result = await database.query("SELECT * FROM delivery_agents WHERE phone = $1", [phone]);
  if (result.rows.length === 0) {
    return next(new ErrorHandler("Invalid phone or password.", 401));
  }

  const agent = result.rows[0];
  const isMatch = await bcrypt.compare(password, agent.password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid phone or password.", 401));
  }

  // ✅ FIX: Reset offline_count to 0 on every login so each new shift starts completely fresh
  await database.query(
    `UPDATE delivery_agents SET offline_count = 0 WHERE id = $1`,
    [agent.id]
  );

  const token = jwt.sign({ id: agent.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const isProduction = process.env.NODE_ENV === "production";
  res
    .status(200)
    .cookie("delivery_token", token, {
      expires: new Date(Date.now() + (process.env.COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax"
    })
    .json({
      success: true,
      message: `Welcome back, ${agent.name}`,
      token,
      deliveryAgent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        vehicle_number: agent.vehicle_number,
        avatar_url: agent.avatar_url,
        agency: agent.agency,
        status: agent.status,
        latitude: agent.latitude,
        longitude: agent.longitude,
        address: agent.address,
        is_online: agent.is_online,
        shift_preference: agent.shift_preference,
        shift_start: agent.shift_start,
        shift_end: agent.shift_end,
        is_verified: agent.is_verified,
        verification_status: agent.verification_status,
        rejection_reason: agent.rejection_reason,
        documents: agent.documents
      }
    });
});

// 3. LOGOUT DELIVERY AGENT
export const logoutDeliveryAgent = catchAsyncErrors(async (req, res, next) => {
  // Turn agent offline on logout
  if (req.deliveryAgent) {
    await database.query("UPDATE delivery_agents SET is_online = FALSE WHERE id = $1", [req.deliveryAgent.id]);
    await database.query(
      `UPDATE delivery_agent_work_logs 
       SET shift_end_time = CURRENT_TIMESTAMP,
           hours_worked = ROUND((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - shift_start_time)) / 3600.0)::numeric, 2)
       WHERE delivery_agent_id = $1 AND shift_end_time IS NULL`,
      [req.deliveryAgent.id]
    );
  }

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("delivery_token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully from Delivery Agent portal."
  });
});

// 4. GET MY PROFILE
export const getDeliveryAgentProfile = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `SELECT 
       id, name, phone, vehicle_number, avatar_url, agency, status,
       latitude, longitude, address, is_online,
       shift_preference, shift_start, shift_end,
       is_verified, verification_status, rejection_reason,
       delivery_partner_status, fine_amount, offline_count,
       block_reason, blocked_at, blocked_shift_slot,
       unblock_window_expires_at, unblock_request_status, unblock_request_reason,
       documents
     FROM delivery_agents WHERE id = $1`,
    [req.deliveryAgent.id]
  );
  
  res.status(200).json({
    success: true,
    deliveryAgent: result.rows[0]
  });
});

// 5. UPDATE AGENT ONLINE STATUS & SHIFT PREFERENCE
export const updateAgentStatus = catchAsyncErrors(async (req, res, next) => {
  const { is_online, shift_preference } = req.body;
  const agentId = req.deliveryAgent.id;

  const shiftTimes = resolveShiftTimes(shift_preference);

  const result = await database.query(
    `UPDATE delivery_agents 
     SET is_online = $1, 
         shift_preference = $2, 
         shift_start = $3, 
         shift_end = $4 
     WHERE id = $5 
     RETURNING id, name, phone, is_online, shift_preference, shift_start, shift_end`,
    [is_online, shift_preference, shiftTimes.start, shiftTimes.end, agentId]
  );

  if (is_online) {
    // Insert new work log
    await database.query(
      `INSERT INTO delivery_agent_work_logs (delivery_agent_id, work_date, shift_type, shift_start_time)
       VALUES ($1, CURRENT_DATE, $2, CURRENT_TIMESTAMP)`,
      [agentId, shift_preference || "Morning (07:00 AM - 01:00 PM)"]
    );
  } else {
    // Going offline, update shift end time and calculate hours worked
    await database.query(
      `UPDATE delivery_agent_work_logs 
       SET shift_end_time = CURRENT_TIMESTAMP,
           hours_worked = ROUND((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - shift_start_time)) / 3600.0)::numeric, 2)
       WHERE delivery_agent_id = $1 AND shift_end_time IS NULL`,
      [agentId]
    );
  }

  res.status(200).json({
    success: true,
    message: "Status and shift updated successfully.",
    deliveryAgent: result.rows[0]
  });
});

// 6. UPDATE AGENT GPS LOCATION
export const updateAgentLocation = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude } = req.body;
  const agentId = req.deliveryAgent.id;

  if (!latitude || !longitude) {
    return next(new ErrorHandler("Latitude and Longitude coordinates are required.", 400));
  }

  await database.query(
    "UPDATE delivery_agents SET latitude = $1, longitude = $2 WHERE id = $3",
    [Number(latitude), Number(longitude), agentId]
  );

  // Log GPS coordinates history
  try {
    await database.query(
      "INSERT INTO delivery_agent_gps_logs (partner_id, latitude, longitude) VALUES ($1, $2, $3)",
      [agentId, Number(latitude), Number(longitude)]
    );
  } catch (err) {
    console.error("Failed to write GPS log:", err.message);
  }

  res.status(200).json({
    success: true,
    message: "Location coordinates updated successfully."
  });
});

// 7. GET ASSIGNED ORDERS
export const getAssignedOrders = catchAsyncErrors(async (req, res, next) => {
  const agentPhone = req.deliveryAgent.phone;
  const result = await database.query(
    `SELECT o.*, 
            row_to_json(s) AS shipping_info,
            json_agg(json_build_object(
              'title', oi.title,
              'quantity', oi.quantity,
              'price', oi.price,
              'image', oi.image,
              'product_images', (
                SELECT p.images 
                FROM products p 
                WHERE p.id = oi.product_id 
                LIMIT 1
              )
            )) AS order_items,
            (
              SELECT row_to_json(r)
              FROM order_returns r
              WHERE r.order_id = o.id
              LIMIT 1
            ) AS return_info
     FROM orders o
     LEFT JOIN shipping_info s ON o.id = s.order_id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.delivery_boy_phone = $1 AND o.order_status IN ('Out for Delivery', 'Exchange Out for Delivery', 'Delivered', 'Exchange Completed')
     GROUP BY o.id, s.id
     ORDER BY o.created_at DESC`,
    [agentPhone]
  );

  res.status(200).json({
    success: true,
    orders: result.rows
  });
});

// 8. DELIVER ORDER (Verifying OTP)
export const deliverOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const { otp } = req.body;
  const agentPhone = req.deliveryAgent.phone;

  const orderCheck = await database.query("SELECT * FROM orders WHERE id = $1 AND delivery_boy_phone = $2", [orderId, agentPhone]);
  if (orderCheck.rows.length === 0) {
    return next(new ErrorHandler("Order not found or not assigned to you.", 404));
  }

  const order = orderCheck.rows[0];

  if (order.order_status === "Delivered" || order.order_status === "Exchange Completed") {
    return next(new ErrorHandler("Order is already delivered.", 400));
  }

  if (!order.payment_mode?.includes("COD") && order.delivery_otp) {
    if (!otp || otp !== order.delivery_otp) {
      return next(new ErrorHandler("Invalid 6-digit verification OTP. Ask customer for the correct OTP.", 400));
    }
  }

  const nextStatus = order.order_status === "Exchange Out for Delivery" ? "Exchange Completed" : "Delivered";

  await database.query(
    `UPDATE orders SET order_status = $1, delivered_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [nextStatus, orderId]
  );

  // ── Incentive tier calculator (daily milestone bonuses) ──────────────────
  const calcDailyIncentive = (totalOrdersToday) => {
    // Each tier is awarded ONLY when crossing the threshold (not cumulative add)
    // 25 orders → ₹300 total incentive
    // 50 orders → ₹600 total incentive  
    // 75 orders → ₹900 total incentive
    // 100 orders → ₹1200 total incentive
    const tiers = [
      { threshold: 100, bonus: 1200 },
      { threshold: 75, bonus: 900 },
      { threshold: 50, bonus: 600 },
      { threshold: 25, bonus: 300 },
    ];
    for (const t of tiers) {
      if (totalOrdersToday >= t.threshold) return t.bonus;
    }
    return 0;
  };

  // Update work log: base pay ₹50/delivery + recalculate incentives
  try {
    const activeLog = await database.query(
      `SELECT id, orders_delivered, base_pay, incentives 
       FROM delivery_agent_work_logs 
       WHERE delivery_agent_id = $1 AND work_date = CURRENT_DATE 
       ORDER BY created_at DESC LIMIT 1`,
      [req.deliveryAgent.id]
    );

    if (activeLog.rows.length > 0) {
      const log = activeLog.rows[0];
      const newOrderCount = parseInt(log.orders_delivered || 0) + 1;
      const newBasePay = parseFloat(log.base_pay || 0) + 50.00;
      const newIncentive = calcDailyIncentive(newOrderCount);
      const newEarnings = newBasePay + newIncentive;

      await database.query(
        `UPDATE delivery_agent_work_logs 
         SET orders_delivered = $1,
             base_pay = $2,
             incentives = $3,
             earnings = $4
         WHERE id = $5`,
        [newOrderCount, newBasePay, newIncentive, newEarnings, activeLog.rows[0].id]
      );
    } else {
      // No active log today — create one with base entry
      const newBasePay = 50.00;
      const newIncentive = calcDailyIncentive(1);
      const newEarnings = newBasePay + newIncentive;
      await database.query(
        `INSERT INTO delivery_agent_work_logs 
         (delivery_agent_id, work_date, orders_delivered, base_pay, incentives, earnings, shift_end_time, hours_worked)
         VALUES ($1, CURRENT_DATE, 1, $2, $3, $4, CURRENT_TIMESTAMP, 0.00)`,
        [req.deliveryAgent.id, newBasePay, newIncentive, newEarnings]
      );
    }
  } catch (err) {
    console.error("Failed to update shift work log for delivery:", err);
  }

  res.status(200).json({
    success: true,
    message: `Order successfully ${nextStatus === "Delivered" ? "Delivered" : "Exchanged & Completed"}!`,
  });
});

// Helper function to sync work logs with database orders & returns
export const syncWorkLogsForAgent = async (agentId, agentPhone) => {
  if (!agentPhone) {
    const res = await database.query("SELECT phone FROM delivery_agents WHERE id = $1", [agentId]);
    agentPhone = res.rows[0]?.phone;
  }
  if (!agentPhone) return;

  // 1. Find all unique dates on which this agent completed a delivery or return pickup/exchange, or has a work log
  const datesRes = await database.query(
    `SELECT DISTINCT date_val FROM (
       SELECT DATE(delivered_at) AS date_val FROM orders 
       WHERE delivery_boy_phone = $1 AND order_status IN ('Delivered', 'Exchange Completed') AND delivered_at IS NOT NULL
       UNION
       SELECT DATE(return_completed_at) AS date_val FROM orders 
       WHERE delivery_boy_phone = $1 AND order_status IN ('Returned', 'Exchange Completed') AND return_completed_at IS NOT NULL
       UNION
       SELECT work_date AS date_val FROM delivery_agent_work_logs
       WHERE delivery_agent_id = $2
     ) AS combined_dates 
     WHERE date_val IS NOT NULL
     ORDER BY date_val DESC`,
    [agentPhone, agentId]
  );

  const dates = datesRes.rows.map(r => {
    const d = new Date(r.date_val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const tiers = [
    { threshold: 100, bonus: 1200 },
    { threshold: 75, bonus: 900 },
    { threshold: 50, bonus: 600 },
    { threshold: 25, bonus: 300 },
  ];

  const calcDailyIncentive = (totalOrdersToday) => {
    for (const t of tiers) {
      if (totalOrdersToday >= t.threshold) return t.bonus;
    }
    return 0;
  };

  for (const dateStr of dates) {
    // 2. Count actual completed actions (deliveries + return pickups/exchanges) on this date
    const jobsRes = await database.query(
      `SELECT COUNT(DISTINCT id) AS jobs_count FROM orders
       WHERE delivery_boy_phone = $1
         AND (
           (order_status IN ('Delivered', 'Exchange Completed') AND DATE(delivered_at) = $2)
           OR
           (order_status IN ('Returned', 'Exchange Completed') AND DATE(return_completed_at) = $2)
         )`,
      [agentPhone, dateStr]
    );

    const totalJobs = parseInt(jobsRes.rows[0]?.jobs_count || 0);
    const basePay = totalJobs * 50.00;
    const incentives = calcDailyIncentive(totalJobs);
    const earnings = basePay + incentives;

    // 3. Update or Insert the work log
    const logCheck = await database.query(
      "SELECT id FROM delivery_agent_work_logs WHERE delivery_agent_id = $1 AND work_date = $2 LIMIT 1",
      [agentId, dateStr]
    );

    if (logCheck.rows.length > 0) {
      await database.query(
        `UPDATE delivery_agent_work_logs
         SET orders_delivered = $1,
             base_pay = $2,
             incentives = $3,
             earnings = $4
         WHERE id = $5`,
        [totalJobs, basePay, incentives, earnings, logCheck.rows[0].id]
      );
    } else {
      await database.query(
        `INSERT INTO delivery_agent_work_logs
         (delivery_agent_id, work_date, orders_delivered, base_pay, incentives, earnings, shift_type, shift_start_time, shift_end_time, hours_worked)
         VALUES ($1, $2, $3, $4, $5, $6, 'Morning (07:00 AM - 01:00 PM)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00)`,
        [agentId, dateStr, totalJobs, basePay, incentives, earnings]
      );
    }
  }
};

// 9b. GET MY OWN WORK LOGS (Delivery Agent — for their History tab)
export const getMyWorkLogs = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;
  const agentPhone = req.deliveryAgent.phone;

  // Sync logs first
  await syncWorkLogsForAgent(agentId, agentPhone);

  const tiers = [
    { threshold: 100, bonus: 1200 },
    { threshold: 75, bonus: 900 },
    { threshold: 50, bonus: 600 },
    { threshold: 25, bonus: 300 },
  ];

  // 1. Raw daily work logs
  const logsResult = await database.query(
    `SELECT
       id,
       work_date,
       shift_type,
       shift_start_time,
       shift_end_time,
       COALESCE(hours_worked, 0)     AS hours_worked,
       COALESCE(orders_delivered, 0) AS orders_delivered,
       COALESCE(base_pay, 0)         AS base_pay,
       COALESCE(incentives, 0)       AS incentives,
       COALESCE(earnings, 0)         AS earnings
     FROM delivery_agent_work_logs
     WHERE delivery_agent_id = $1
     ORDER BY work_date DESC, shift_start_time DESC`,
    [agentId]
  );

  // 2. Monthly aggregates
  const monthlyResult = await database.query(
    `SELECT
       TO_CHAR(work_date, 'YYYY-MM')            AS month_key,
       TO_CHAR(work_date, 'Month YYYY')         AS month_label,
       COUNT(*)                                  AS total_shifts,
       COUNT(DISTINCT work_date)                 AS working_days,
       ROUND(SUM(COALESCE(hours_worked,0))::numeric, 2)      AS total_hours,
       SUM(COALESCE(orders_delivered,0))         AS total_orders,
       ROUND(SUM(COALESCE(base_pay,0))::numeric, 2)          AS total_base_pay,
       ROUND(SUM(COALESCE(incentives,0))::numeric, 2)        AS total_incentives,
       ROUND(SUM(COALESCE(earnings,0))::numeric, 2)          AS total_earnings,
       ROUND(AVG(COALESCE(hours_worked,0))::numeric, 2)      AS avg_hours_per_day,
       ROUND(AVG(COALESCE(orders_delivered,0))::numeric, 2)  AS avg_orders_per_day,
       ROUND(AVG(COALESCE(earnings,0))::numeric, 2)          AS avg_earnings_per_day,
       MAX(COALESCE(earnings,0))                 AS best_day_earnings,
       MAX(COALESCE(orders_delivered,0))         AS best_day_orders
     FROM delivery_agent_work_logs
     WHERE delivery_agent_id = $1
     GROUP BY month_key, month_label
     ORDER BY month_key DESC`,
    [agentId]
  );

  // 3. Grand totals (all-time)
  const grandResult = await database.query(
    `SELECT
       COUNT(*)                                      AS total_shifts,
       COUNT(DISTINCT work_date)                     AS total_working_days,
       ROUND(SUM(COALESCE(hours_worked,0))::numeric, 2)          AS total_hours,
       SUM(COALESCE(orders_delivered,0))             AS total_orders_delivered,
       ROUND(SUM(COALESCE(base_pay,0))::numeric, 2)              AS total_base_pay,
       ROUND(SUM(COALESCE(incentives,0))::numeric, 2)            AS total_incentives,
       ROUND(SUM(COALESCE(earnings,0))::numeric, 2)              AS total_earnings,
       ROUND(AVG(COALESCE(hours_worked,0))::numeric, 2)          AS avg_hours_per_shift,
       ROUND(AVG(COALESCE(earnings,0))::numeric, 2)              AS avg_earnings_per_shift,
       MIN(work_date)                                AS first_shift_date,
       MAX(work_date)                                AS last_shift_date
     FROM delivery_agent_work_logs
     WHERE delivery_agent_id = $1`,
    [agentId]
  );

  // 4. Current month stats (for quick summary card)
  const currentMonthResult = await database.query(
    `SELECT
       ROUND(SUM(COALESCE(hours_worked,0))::numeric, 2)     AS hours,
       SUM(COALESCE(orders_delivered,0))                    AS orders,
       ROUND(SUM(COALESCE(earnings,0))::numeric, 2)         AS earnings,
       COUNT(DISTINCT work_date)                            AS working_days,
       COUNT(*)                                             AS shifts
     FROM delivery_agent_work_logs
     WHERE delivery_agent_id = $1
       AND DATE_TRUNC('month', work_date) = DATE_TRUNC('month', CURRENT_DATE)`,
    [agentId]
  );

  // 5. Orders history
  let ordersHistory = [];
  if (agentPhone) {
    const ordersResult = await database.query(
      `SELECT
         o.id, o.total_price, o.order_status, o.payment_mode,
         o.created_at AS order_date,
         o.delivery_boy_name
       FROM orders o
       WHERE o.delivery_boy_phone = $1
         AND o.order_status IN ('Delivered','Exchange Completed','Returned')
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [agentPhone]
    );
    ordersHistory = ordersResult.rows;
  }

  // 6. Today's live stats (specifically for nextMilestone display)
  const todayResult = await database.query(
    `SELECT
       COALESCE(SUM(orders_delivered), 0) AS orders_today,
       COALESCE(SUM(base_pay), 0)         AS base_pay_today,
       COALESCE(SUM(incentives), 0)       AS incentives_today,
       COALESCE(SUM(earnings), 0)         AS earnings_today,
       COALESCE(SUM(hours_worked), 0)     AS hours_today
     FROM delivery_agent_work_logs
     WHERE delivery_agent_id = $1 AND work_date = CURRENT_DATE`,
    [agentId]
  );

  const ordersToday = parseInt(todayResult.rows[0]?.orders_today || 0);
  const pendingTiers = tiers.filter(t => ordersToday < t.threshold).reverse();
  const nextMilestone = pendingTiers[0]
    ? { needed: pendingTiers[0].threshold - ordersToday, milestone: pendingTiers[0].threshold, bonus: pendingTiers[0].bonus }
    : null;

  res.status(200).json({
    success: true,
    workLogs:       logsResult.rows,
    monthlyStats:   monthlyResult.rows,
    grandTotals:    grandResult.rows[0] || {},
    currentMonth:   currentMonthResult.rows[0] || {},
    ordersHistory,
    today:          todayResult.rows[0] || {},
    nextMilestone,
  });
});

// 9. GET ALL DELIVERY AGENTS (For Admin Dropdown)
export const getAllDeliveryAgents = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `SELECT id, name, phone, vehicle_number, avatar_url, agency, status, 
            latitude, longitude, is_online, shift_preference, shift_start, shift_end,
            aadhaar_url, pan_url, is_verified, verification_status, rejection_reason, 
            delivery_partner_status, created_at 
     FROM delivery_agents 
     ORDER BY created_at DESC`
  );
  res.status(200).json({
    success: true,
    deliveryAgents: result.rows
  });
});

// 10. UPDATE DELIVERY AGENT PROFILE
export const updateDeliveryAgentProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, vehicle_number, agency, avatar_url, password, address, latitude, longitude } = req.body;
  const agentId = req.deliveryAgent.id;

  let hostedAvatarUrl = avatar_url;
  if (avatar_url && avatar_url.startsWith("data:image")) {
    const uploadResult = await cloudinary.uploader.upload(avatar_url, {
      folder: "delivery_avatars"
    });
    hostedAvatarUrl = uploadResult.secure_url;
  }

  let updateQuery = "UPDATE delivery_agents SET name = $1, vehicle_number = $2, agency = $3";
  let params = [name, vehicle_number, agency];

  if (hostedAvatarUrl) {
    updateQuery += ", avatar_url = $" + (params.length + 1);
    params.push(hostedAvatarUrl);
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateQuery += ", password = $" + (params.length + 1);
    params.push(hashedPassword);
  }

  if (address !== undefined) {
    updateQuery += ", address = $" + (params.length + 1);
    params.push(address);
  }

  if (latitude !== undefined) {
    updateQuery += ", latitude = $" + (params.length + 1);
    params.push(latitude ? Number(latitude) : null);
  }

  if (longitude !== undefined) {
    updateQuery += ", longitude = $" + (params.length + 1);
    params.push(longitude ? Number(longitude) : null);
  }

  updateQuery += " WHERE id = $" + (params.length + 1) + " RETURNING id, name, phone, vehicle_number, agency, avatar_url, address, latitude, longitude, is_online, shift_preference, shift_start, shift_end";
  params.push(agentId);

  const result = await database.query(updateQuery, params);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    deliveryAgent: result.rows[0]
  });
});

// 11. PICKUP RETURN / EXCHANGE ORDER
export const pickupReturnOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const { pickupImage, qcNotes, action } = req.body; // action: "approve" or "reject"
  const agentPhone = req.deliveryAgent.phone;

  const orderCheck = await database.query("SELECT * FROM orders WHERE id = $1 AND delivery_boy_phone = $2", [orderId, agentPhone]);
  if (orderCheck.rows.length === 0) {
    return next(new ErrorHandler("Order not found or not assigned to you.", 404));
  }

  const order = orderCheck.rows[0];

  let pickupImageUrl = "";
  if (pickupImage && pickupImage.startsWith("data:image")) {
    const uploadResult = await cloudinary.uploader.upload(pickupImage, {
      folder: "return_pickups",
    });
    pickupImageUrl = uploadResult.secure_url;
  }

  const qcReport = {
    agent_notes: qcNotes || "No notes entered",
    pickup_image: pickupImageUrl,
    picked_up_at: new Date().toISOString(),
    ai_status: action === "reject" ? "Rejected" : "Approved"
  };

  let nextOrderStatus;
  let nextReturnStatus;
  if (action === "reject") {
    nextOrderStatus = "Delivered"; // Return to normal delivered status because exchange was rejected
    nextReturnStatus = "Rejected";
  } else {
    nextOrderStatus = order.order_status === "Exchange Out for Delivery" ? "Exchange Completed" : "Returned";
    nextReturnStatus = "Picked Up";
  }

  await database.query("BEGIN");

  await database.query(
    `UPDATE order_returns 
     SET status = $1, 
         qc_report = $2::jsonb 
     WHERE order_id = $3`,
    [nextReturnStatus, JSON.stringify(qcReport), orderId]
  );

  await database.query(
    "UPDATE orders SET order_status = $1, return_completed_at = CURRENT_TIMESTAMP WHERE id = $2",
    [nextOrderStatus, orderId]
  );

  await database.query("COMMIT");

  res.status(200).json({
    success: true,
    message: action === "reject"
      ? "Exchange pickup rejected due to quality check fail."
      : `Return item successfully picked up. Order is now ${nextOrderStatus === "Exchange Completed" ? "Exchange Completed" : "Returned"}.`
  });
});

// 12. LOG OFFLINE EVENT
export const logOfflineEvent = catchAsyncErrors(async (req, res, next) => {
  const { event_type, details } = req.body;
  const agentId = req.deliveryAgent.id;

  if (!event_type) {
    return next(new ErrorHandler("Event type is required.", 400));
  }

  // Increment offline_count on the agent record and get new value
  const updated = await database.query(
    `UPDATE delivery_agents
     SET offline_count = COALESCE(offline_count, 0) + 1
     WHERE id = $1
     RETURNING offline_count`,
    [agentId]
  );

  const newCount = updated.rows[0]?.offline_count || 0;

  // Log the offline event
  await database.query(
    `INSERT INTO delivery_agent_offline_logs (partner_id, event_type, offline_count, details)
     VALUES ($1, $2, $3, $4)`,
    [agentId, event_type, newCount, details || null]
  );

  res.status(200).json({
    success: true,
    message: "Offline event logged.",
    offline_count: newCount
  });
});

// Reassign active orders of blocked agent helper
const reassignBlockedAgentOrders = async (agentId, agentPhone) => {
  console.log(`🚚 Starting reassignment for agent ${agentId} (${agentPhone})...`);
  
  // 1. Get all active orders assigned to the blocked agent
  const activeOrdersRes = await database.query(
    `SELECT o.id, s.city, s.address, s.state, s.pincode
     FROM orders o
     LEFT JOIN shipping_info s ON o.id = s.order_id
     WHERE o.delivery_boy_phone = $1 AND o.order_status IN ('Processing', 'Order Packed', 'Shipped', 'Out for Delivery', 'Exchange Out for Delivery')`,
    [agentPhone]
  );
  
  if (activeOrdersRes.rows.length === 0) {
    console.log("No active orders found to reassign.");
    return;
  }
  
  // 2. Get all online, verified, active, non-blocked delivery agents
  const eligibleAgentsRes = await database.query(
    `SELECT id, name, phone, vehicle_number, avatar_url, latitude, longitude
     FROM delivery_agents
     WHERE is_online = TRUE AND is_verified = TRUE AND verification_status = 'Approved' AND (delivery_partner_status = 'ACTIVE' OR delivery_partner_status IS NULL)`
  );
  
  const eligibleAgents = eligibleAgentsRes.rows;
  console.log(`Found ${eligibleAgents.length} eligible online agents.`);
  
  const getCoordsForOrder = (city, address, state, pincode) => {
    const fullText = `${address} ${city} ${state} ${pincode}`.toLowerCase();
    let lat = 22.5850; // default Kolkata
    let lng = 88.4200;
    if (fullText.includes("nawada") || fullText.includes("bihar") || fullText.includes("805124")) {
      lat = 24.8856;
      lng = 85.5412;
    } else if (city.toLowerCase().includes("bangalore") || city.toLowerCase().includes("bengaluru")) {
      lat = 12.9716;
      lng = 77.5946;
    } else if (city.toLowerCase().includes("mumbai") || city.toLowerCase().includes("bombay")) {
      lat = 19.0760;
      lng = 72.8777;
    } else if (city.toLowerCase().includes("delhi") || city.toLowerCase().includes("noida")) {
      lat = 28.7041;
      lng = 77.1025;
    }
    return { latitude: lat, longitude: lng };
  };
  
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const dLat = Number(lat2) - Number(lat1);
    const dLon = Number(lon2) - Number(lon1);
    return Math.sqrt(dLat * dLat + dLon * dLon);
  };
  
  for (const order of activeOrdersRes.rows) {
    let bestAgent = null;
    let minDistance = Infinity;
    
    const orderCoords = getCoordsForOrder(order.city, order.address, order.state, order.pincode);
    
    for (const agent of eligibleAgents) {
      if (agent.latitude && agent.longitude) {
        const dist = getDistance(agent.latitude, agent.longitude, orderCoords.latitude, orderCoords.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          bestAgent = agent;
        }
      }
    }
    
    if (bestAgent) {
      console.log(`Reassigning Order ${order.id} to agent ${bestAgent.name} (distance: ${minDistance.toFixed(4)})`);
      await database.query(
        `UPDATE orders 
         SET delivery_boy_phone = $1,
             delivery_boy_name = $2,
             delivery_boy_vehicle = $3,
             delivery_boy_photo = $4
         WHERE id = $5`,
        [bestAgent.phone, bestAgent.name, bestAgent.vehicle_number, bestAgent.avatar_url, order.id]
      );
    } else {
      console.log(`No active agents online. Unassigning Order ${order.id}.`);
      await database.query(
        `UPDATE orders 
         SET delivery_boy_phone = NULL,
             delivery_boy_name = NULL,
             delivery_boy_vehicle = NULL,
             delivery_boy_photo = NULL
         WHERE id = $1`,
        [order.id]
      );
    }
  }
};

// 13. AUTO BLOCK PARTNER & REASSIGN ORDERS
export const autoBlockPartner = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;
  const agentPhone = req.deliveryAgent.phone;
  const { reason, offlineCount } = req.body;

  const blockReason = reason || "Offline During Active Shift";

  await database.query("BEGIN");

  try {
    const { reason, offlineCount, blockedShiftSlot } = req.body;
    const blockReason = reason || "Offline During Active Shift";
    // 1. Block agent — save blocked shift, 30-min unblock window, reset counter
    await database.query(
      `UPDATE delivery_agents 
       SET delivery_partner_status = 'BLOCKED',
           fine_amount = fine_amount + 300,
           block_reason = $1,
           blocked_at = CURRENT_TIMESTAMP,
           is_online = FALSE,
           offline_count = 0,
           blocked_shift_slot = $3,
           unblock_window_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
           unblock_request_status = NULL,
           unblock_request_reason = NULL,
           unblock_requested_at = NULL
       WHERE id = $2`,
      [blockReason, agentId, blockedShiftSlot || null]
    );

    // 2. Insert record in fines table
    await database.query(
      `INSERT INTO fines (partner_id, amount, reason, status)
       VALUES ($1, 300, $2, 'Pending')`,
      [agentId, blockReason]
    );

    // 3. Log block event
    await database.query(
      `INSERT INTO delivery_agent_offline_logs (partner_id, event_type, offline_count, details)
       VALUES ($1, 'Auto Blocked', $2, $3)`,
      [agentId, offlineCount || null, `Blocked due to: ${blockReason}`]
    );

    // 4. Update work logs shift end time if shift is active and online
    await database.query(
      `UPDATE delivery_agent_work_logs 
       SET shift_end_time = CURRENT_TIMESTAMP,
           hours_worked = ROUND((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - shift_start_time)) / 3600.0)::numeric, 2)
       WHERE delivery_agent_id = $1 AND shift_end_time IS NULL`,
      [agentId]
    );

    await database.query("COMMIT");
  } catch (err) {
    await database.query("ROLLBACK");
    return next(new ErrorHandler(`Auto block failed: ${err.message}`, 500));
  }

  // 5. Reassign active orders of this agent
  try {
    await reassignBlockedAgentOrders(agentId, agentPhone);
  } catch (err) {
    console.error("Auto reassignment failed:", err.message);
  }

  res.status(200).json({
    success: true,
    message: "Partner account auto-blocked successfully. Orders have been reassigned."
  });
});

// 14. SUBMIT UNBLOCK REQUEST (APPEAL)
export const submitUnblockRequest = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;
  const { reason } = req.body;

  if (!reason) {
    return next(new ErrorHandler("Unblock appeal reason is required.", 400));
  }

  await database.query(
    `UPDATE delivery_agents 
     SET unblock_request_status = 'Pending',
         unblock_request_reason = $1,
         unblock_requested_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [reason, agentId]
  );

  await database.query(
    `INSERT INTO delivery_agent_offline_logs (partner_id, event_type, details)
     VALUES ($1, 'Appeal Submitted', $2)`,
    [agentId, `Appeal reason: ${reason}`]
  );

  res.status(200).json({
    success: true,
    message: "Appeal request submitted. Admin will review shortly."
  });
});

// 15. CHECK SHIFT AUTO-UNBLOCK (Called on portal load when agent is BLOCKED)
export const checkShiftAutoUnblock = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;

  const agentRes = await database.query(
    `SELECT delivery_partner_status, blocked_at, blocked_shift_slot, unblock_window_expires_at, fine_amount
     FROM delivery_agents WHERE id = $1`,
    [agentId]
  );
  const agent = agentRes.rows[0];

  if (!agent || agent.delivery_partner_status !== 'BLOCKED') {
    return res.status(200).json({ success: true, stillBlocked: false, message: 'Agent is not blocked.' });
  }

  // ✅ FIX: Determine if a new shift has started since the block.
  // We build actual Date objects for each shift start on both today AND tomorrow
  // so midnight crossovers are handled correctly.
  const SHIFTS = [
    { slot: 'S1', startH: 9,  startM: 0  },
    { slot: 'S2', startH: 13, startM: 0  },
    { slot: 'S3', startH: 17, startM: 0  },
    { slot: 'S4', startH: 21, startM: 0  },
  ];
  const blockedAt = new Date(agent.blocked_at);
  const now = new Date();
  const blockedSlot = agent.blocked_shift_slot;

  // Build candidate shift start Date objects (today + tomorrow) and check
  const newShiftStarted = SHIFTS.some(s => {
    // Try the shift on today's calendar date first, then tomorrow
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + dayOffset - (dayOffset === 0 ? 0 : 0));
      candidate.setHours(s.startH, s.startM, 0, 0);
      // Reset to today's date but offset for tomorrow candidate
      const base = new Date(now);
      base.setDate(base.getDate() + dayOffset);
      base.setHours(s.startH, s.startM, 0, 0);
      // Shift must have started AFTER the block AND at or before now
      if (base > blockedAt && base <= now && s.slot !== blockedSlot) {
        return true;
      }
    }
    return false;
  });

  if (newShiftStarted) {
    // Auto-unblock: new shift has started
    await database.query(
      `UPDATE delivery_agents
       SET delivery_partner_status = 'ACTIVE',
           offline_count = 0,
           unblock_request_status = 'Auto Unblocked',
           block_reason = NULL,
           blocked_at = NULL,
           blocked_shift_slot = NULL,
           unblock_window_expires_at = NULL
       WHERE id = $1`,
      [agentId]
    );
    await database.query(
      `INSERT INTO delivery_agent_offline_logs (partner_id, event_type, details)
       VALUES ($1, 'Auto Unblocked', 'Automatically unblocked at new shift start')`,
      [agentId]
    );
    return res.status(200).json({ success: true, stillBlocked: false, autoUnblocked: true, message: 'Auto-unblocked for new shift.' });
  }

  // Check 30-min window expiry for order reassignment
  const windowExpired = agent.unblock_window_expires_at && new Date(agent.unblock_window_expires_at) < now;
  const minutesLeft = agent.unblock_window_expires_at
    ? Math.max(0, Math.ceil((new Date(agent.unblock_window_expires_at) - now) / 60000))
    : 0;

  if (windowExpired) {
    // 30 min passed, reassign orders
    try {
      const agentRow = await database.query(`SELECT phone FROM delivery_agents WHERE id = $1`, [agentId]);
      await reassignBlockedAgentOrders(agentId, agentRow.rows[0]?.phone);
    } catch(e) { console.error('Window expiry reassign failed:', e.message); }
  }

  return res.status(200).json({
    success: true,
    stillBlocked: true,
    windowExpired,
    minutesLeft,
    fine_amount: agent.fine_amount,
    unblock_window_expires_at: agent.unblock_window_expires_at
  });
});

// 16. BOOK A SHIFT
export const bookShift = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;
  const { shift_date, shift_slot, shift_label, shift_start, shift_end } = req.body;

  if (!shift_date || !shift_slot) {
    return next(new ErrorHandler('shift_date and shift_slot are required.', 400));
  }

  // Validate: max 3 days in advance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookDate = new Date(shift_date);
  bookDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((bookDate - today) / 86400000);
  if (diffDays < 0) return next(new ErrorHandler('Cannot book shifts in the past.', 400));
  if (diffDays > 3) return next(new ErrorHandler('Can only book shifts up to 3 days in advance.', 400));

  // Upsert booking
  const result = await database.query(
    `INSERT INTO delivery_shift_bookings
       (agent_id, shift_date, shift_slot, shift_label, shift_start, shift_end, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'booked')
     ON CONFLICT (agent_id, shift_date, shift_slot) DO UPDATE
       SET status = 'booked', cancelled_at = NULL, cancellation_reason = NULL, booked_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [agentId, shift_date, shift_slot, shift_label, shift_start, shift_end]
  );

  res.status(201).json({ success: true, message: 'Shift booked successfully!', booking: result.rows[0] });
});

// 17. CANCEL A SHIFT BOOKING
export const cancelShift = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;
  const { bookingId } = req.params;
  const { reason } = req.body;

  const bookingRes = await database.query(
    `SELECT * FROM delivery_shift_bookings WHERE id = $1 AND agent_id = $2`,
    [bookingId, agentId]
  );
  if (bookingRes.rows.length === 0) return next(new ErrorHandler('Booking not found.', 404));
  const booking = bookingRes.rows[0];

  if (booking.status === 'cancelled') return next(new ErrorHandler('Booking already cancelled.', 400));

  // 12-hour rule: shift_date + shift_start must be > 12hrs from now
  const shiftDateTime = new Date(`${booking.shift_date.toISOString().slice(0,10)}T${booking.shift_start}`);
  const hoursUntilShift = (shiftDateTime - new Date()) / 3600000;
  if (hoursUntilShift < 12) {
    return next(new ErrorHandler('Cannot cancel: shift starts in less than 12 hours.', 400));
  }

  await database.query(
    `UPDATE delivery_shift_bookings
     SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = $1
     WHERE id = $2`,
    [reason || 'Cancelled by agent', bookingId]
  );

  res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
});

// 18. GET MY SHIFT BOOKINGS
export const getMyShiftBookings = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;

  const result = await database.query(
    `SELECT * FROM delivery_shift_bookings
     WHERE agent_id = $1
     ORDER BY shift_date ASC, shift_start ASC`,
    [agentId]
  );

  res.status(200).json({ success: true, bookings: result.rows });
});

// 19. GET MY FINE HISTORY
export const getMyFineHistory = catchAsyncErrors(async (req, res, next) => {
  const agentId = req.deliveryAgent.id;

  const fines = await database.query(
    `SELECT * FROM fines WHERE partner_id = $1 ORDER BY created_at DESC`,
    [agentId]
  );

  const offlineLogs = await database.query(
    `SELECT * FROM delivery_agent_offline_logs WHERE partner_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [agentId]
  );

  res.status(200).json({
    success: true,
    fines: fines.rows,
    offline_logs: offlineLogs.rows
  });
});
