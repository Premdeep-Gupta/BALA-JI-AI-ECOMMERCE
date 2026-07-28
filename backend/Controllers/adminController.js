import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";

// ✅ FIXED: Removed 'User' role filter to show all registered users
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const totalUsersResult = await database.query("SELECT COUNT(*) FROM users");
  const totalUsers = parseInt(totalUsersResult.rows[0].count);

  const users = await database.query(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );

  res.status(200).json({
    success: true,
    totalUsers,
    currentPage: page,
    users: users.rows,
  });
});

export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const deleteUser = await database.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [id]
  );

  if (deleteUser.rows.length === 0) {
    return next(new ErrorHandler("User not found", 404));
  }

  const avatar = deleteUser.rows[0].avatar;
  if (avatar?.public_id) {
    await cloudinary.uploader.destroy(avatar.public_id);
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

export const dashboardStats = catchAsyncErrors(async (req, res, next) => {
  const today = new Date();
  const todayDate = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split("T")[0];

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const totalRevenueAllTimeQuery = await database.query(`SELECT SUM(total_price) FROM orders WHERE paid_at IS NOT NULL`);
  const totalRevenueAllTime = parseFloat(totalRevenueAllTimeQuery.rows[0].sum) || 0;

  // ✅ FIXED: Total Users count (All roles)
  const totalUsersCountQuery = await database.query(`SELECT COUNT(*) FROM users`);
  const totalUsersCount = parseInt(totalUsersCountQuery.rows[0].count) || 0;

  const orderStatusCountsQuery = await database.query(`SELECT order_status, COUNT(*) FROM orders WHERE paid_at IS NOT NULL GROUP BY order_status`);
  const orderStatusCounts = { Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
  orderStatusCountsQuery.rows.forEach((row) => { orderStatusCounts[row.order_status] = parseInt(row.count); });

  const todayRevenueQuery = await database.query(`SELECT SUM(total_price) FROM orders WHERE created_at::date = $1 AND paid_at IS NOT NULL`, [todayDate]);
  const todayRevenue = parseFloat(todayRevenueQuery.rows[0].sum) || 0;

  const yesterdayRevenueQuery = await database.query(`SELECT SUM(total_price) FROM orders WHERE created_at::date = $1 AND paid_at IS NOT NULL`, [yesterdayDate]);
  const yesterdayRevenue = parseFloat(yesterdayRevenueQuery.rows[0].sum) || 0;

  const monthlySalesQuery = await database.query(`SELECT TO_CHAR(created_at, 'Mon YYYY') AS month, DATE_TRUNC('month', created_at) as date, SUM(total_price) as totalsales FROM orders WHERE paid_at IS NOT NULL GROUP BY month, date ORDER BY date ASC`);
  const monthlySales = monthlySalesQuery.rows.map((row) => ({ month: row.month, totalsales: parseFloat(row.totalsales) || 0 }));

  const topSellingProductsQuery = await database.query(`
    SELECT p.id, p.name, p.images->0->>'url' AS image, p.category, p.ratings, p.stock, p.price, SUM(oi.quantity) AS total_sold 
    FROM order_items oi 
    JOIN products p ON p.id = oi.product_id 
    JOIN orders o ON o.id = oi.order_id 
    WHERE o.paid_at IS NOT NULL 
    GROUP BY p.id, p.name, p.images, p.category, p.ratings, p.stock, p.price 
    ORDER BY total_sold DESC LIMIT 5
  `);
  const topSellingProducts = topSellingProductsQuery.rows;

  const currentMonthSalesQuery = await database.query(`SELECT SUM(total_price) AS total FROM orders WHERE paid_at IS NOT NULL AND created_at BETWEEN $1 AND $2`, [currentMonthStart, currentMonthEnd]);
  const currentMonthSales = parseFloat(currentMonthSalesQuery.rows[0].total) || 0;

  const lowStockProductsQuery = await database.query(`SELECT name, stock FROM products WHERE stock <= 5`);
  const lowStockProducts = lowStockProductsQuery.rows;

  const lastMonthRevenueQuery = await database.query(`SELECT SUM(total_price) AS total FROM orders WHERE paid_at IS NOT NULL AND created_at BETWEEN $1 AND $2`, [previousMonthStart, previousMonthEnd]);
  const lastMonthRevenue = parseFloat(lastMonthRevenueQuery.rows[0].total) || 0;

  let revenueGrowth = "0%";
  if (lastMonthRevenue > 0) {
    const growthRate = ((currentMonthSales - lastMonthRevenue) / lastMonthRevenue) * 100;
    revenueGrowth = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(2)}%`;
  }

  // ✅ FIXED: New Users This Month (All roles)
  const newUsersThisMonthQuery = await database.query(`SELECT COUNT(*) FROM users WHERE created_at >= $1`, [currentMonthStart]);
  const newUsersThisMonth = parseInt(newUsersThisMonthQuery.rows[0].count) || 0;

  res.status(200).json({
    success: true,
    message: "Dashboard Stats Fetched Successfully",
    totalRevenueAllTime, todayRevenue, yesterdayRevenue, totalUsersCount,
    orderStatusCounts, monthlySales, currentMonthSales, topSellingProducts,
    lowStockProducts, revenueGrowth, newUsersThisMonth,
  });
});

// ✅ FIXED: Removed 'User' role filter to show all buyers
export const getBuyers = catchAsyncErrors(async (req, res, next) => {
  const buyersQuery = await database.query(`SELECT id, name, email, phone, role FROM users`);

  const buyers = await Promise.all(buyersQuery.rows.map(async (buyer) => {
    const ordersQuery = await database.query(`
      SELECT o.id as order_id, o.order_status, oi.title, oi.quantity, oi.price
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.buyer_id = $1
    `, [buyer.id]);

    return {
      ...buyer,
      total_orders: ordersQuery.rows.length,
      total_spent: ordersQuery.rows.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0),
      order_history: ordersQuery.rows
    };
  }));

  res.status(200).json({ success: true, buyers });
});

export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return next(new ErrorHandler("Please specify a user role", 400));
  }

  const updatedUser = await database.query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING *",
    [role, id]
  );

  if (updatedUser.rows.length === 0) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user: updatedUser.rows[0],
  });
});

export const verifyDeliveryAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return next(new ErrorHandler("Invalid status. Must be 'Approved' or 'Rejected'", 400));
  }

  const isVerified = status === 'Approved';

  const updatedAgent = await database.query(
    "UPDATE delivery_agents SET verification_status = $1, is_verified = $2, rejection_reason = $3 WHERE id = $4 RETURNING *",
    [status, isVerified, rejection_reason ? JSON.stringify(rejection_reason) : null, id]
  );

  if (updatedAgent.rows.length === 0) {
    return next(new ErrorHandler("Delivery agent not found", 404));
  }

  res.status(200).json({
    success: true,
    message: `Delivery agent ${status} successfully`,
    deliveryAgent: updatedAgent.rows[0],
  });
});

export const deleteDeliveryAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const result = await database.query(
    "DELETE FROM delivery_agents WHERE id = $1 RETURNING *",
    [id]
  );

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Delivery agent not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Delivery agent deleted successfully"
  });
});

export const getDeliveryAgentWorkLogs = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Sync logs first
  try {
    const agentResult = await database.query("SELECT phone FROM delivery_agents WHERE id = $1", [id]);
    const agentPhone = agentResult.rows[0]?.phone;
    if (agentPhone) {
      const { syncWorkLogsForAgent } = await import("./deliveryController.js");
      await syncWorkLogsForAgent(id, agentPhone);
    }
  } catch (err) {
    console.error("Failed to sync work logs for agent in admin route:", err.message);
  }

  // ── 1. Raw daily work logs ─────────────────────────────────────────────────
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
    [id]
  );

  // ── 2. Monthly aggregates ──────────────────────────────────────────────────
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
    [id]
  );

  // ── 3. Grand totals (all-time) ─────────────────────────────────────────────
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
    [id]
  );

  // ── 4. Current month stats (for quick summary card) ───────────────────────
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
    [id]
  );

  // ── 5. Orders cross-referenced for this agent (delivered by phone) ─────────
  const agentPhoneResult = await database.query(
    `SELECT phone FROM delivery_agents WHERE id = $1`, [id]
  );
  const agentPhone = agentPhoneResult.rows[0]?.phone;

  let ordersHistory = [];
  if (agentPhone) {
    const ordersResult = await database.query(
      `SELECT
         o.id, o.total_price, o.order_status, o.payment_mode,
         o.created_at AS order_date,
         o.delivery_boy_name
       FROM orders o
       WHERE o.delivery_boy_phone = $1
         AND o.order_status IN ('Delivered','Exchange Completed')
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [agentPhone]
    );
    ordersHistory = ordersResult.rows;
  }

  res.status(200).json({
    success: true,
    workLogs:       logsResult.rows,
    monthlyStats:   monthlyResult.rows,
    grandTotals:    grandResult.rows[0] || {},
    currentMonth:   currentMonthResult.rows[0] || {},
    ordersHistory
  });
});

// 🚚 GET ALL DELIVERY PARTNERS (For Admin Dashboard)
export const getDeliveryPartners = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `SELECT id, name, phone, vehicle_number, avatar_url, agency, status, 
            latitude, longitude, is_online, shift_preference, shift_start, shift_end,
            aadhaar_url, pan_url, is_verified, verification_status, rejection_reason, 
            delivery_partner_status, fine_amount, block_reason, blocked_at, 
            unblock_request_status, unblock_request_reason, created_at, documents 
     FROM delivery_agents 
     ORDER BY created_at DESC`
  );
  
  res.status(200).json({
    success: true,
    data: result.rows
  });
});

// 🚚 GET SPECIFIC DELIVERY PARTNER DETAILS (Fines, GPS Logs, Offline History)
export const getDeliveryPartnerDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const agentRes = await database.query(
    `SELECT id, name, phone, vehicle_number, avatar_url, agency, status, 
            latitude, longitude, is_online, shift_preference, shift_start, shift_end,
            aadhaar_url, pan_url, is_verified, verification_status, 
            delivery_partner_status, fine_amount, block_reason, blocked_at, 
            unblock_request_status, unblock_request_reason, created_at, documents 
     FROM delivery_agents 
     WHERE id = $1`,
    [id]
  );

  if (agentRes.rows.length === 0) {
    return next(new ErrorHandler("Delivery partner not found.", 404));
  }

  const agent = agentRes.rows[0];

  const offlineLogsRes = await database.query(
    `SELECT id, event_type, offline_count, details, created_at
     FROM delivery_agent_offline_logs
     WHERE partner_id = $1
     ORDER BY created_at DESC`,
    [id]
  );

  const gpsLogsRes = await database.query(
    `SELECT id, latitude, longitude, created_at
     FROM delivery_agent_gps_logs
     WHERE partner_id = $1
     ORDER BY created_at DESC
     LIMIT 150`,
    [id]
  );

  const finesRes = await database.query(
    `SELECT id, amount, reason, status, created_at
     FROM fines
     WHERE partner_id = $1
     ORDER BY created_at DESC`,
    [id]
  );

  const previousViolationsRes = await database.query(
    `SELECT COUNT(*) AS count
     FROM delivery_agent_offline_logs
     WHERE partner_id = $1 AND event_type = 'Auto Blocked'`,
    [id]
  );
  
  const violationsCount = parseInt(previousViolationsRes.rows[0]?.count || 0);

  res.status(200).json({
    success: true,
    data: {
      agent,
      offlineLogs: offlineLogsRes.rows,
      gpsLogs: gpsLogsRes.rows,
      fines: finesRes.rows,
      violationsCount
    }
  });
});

// 🚚 UNBLOCK DELIVERY PARTNER (Optional Waive Fine)
export const unblockDeliveryPartner = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { waiveFine } = req.body;

  await database.query("BEGIN");

  try {
    const agentCheck = await database.query(
      `SELECT id, phone, fine_amount FROM delivery_agents WHERE id = $1`,
      [id]
    );

    if (agentCheck.rows.length === 0) {
      await database.query("ROLLBACK");
      return next(new ErrorHandler("Delivery partner not found.", 404));
    }

    let updateQuery = `
      UPDATE delivery_agents 
      SET delivery_partner_status = 'ACTIVE',
          block_reason = NULL,
          blocked_at = NULL,
          unblock_request_status = 'Approved',
          offline_count = 0
    `;
    let updateParams = [id];

    if (waiveFine === true) {
      updateQuery += `, fine_amount = 0 WHERE id = $1`;
      
      await database.query(
        `UPDATE fines SET status = 'Waived' WHERE partner_id = $1 AND status = 'Pending'`,
        [id]
      );
    } else {
      updateQuery += ` WHERE id = $1`;
    }

    await database.query(updateQuery, updateParams);

    await database.query(
      `INSERT INTO delivery_agent_offline_logs (partner_id, event_type, details)
       VALUES ($1, 'Unblocked', $2)`,
      [id, waiveFine === true ? "Unblocked by admin. Fines waived." : "Unblocked by admin. Fines kept."]
    );

    await database.query("COMMIT");
  } catch (err) {
    await database.query("ROLLBACK");
    return next(new ErrorHandler(`Failed to unblock agent: ${err.message}`, 500));
  }

  res.status(200).json({
    success: true,
    message: "Delivery partner unblocked successfully."
  });
});

// 🚚 REJECT UNBLOCK REQUEST APPEAL
export const rejectUnblockRequest = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const agentCheck = await database.query(
    `SELECT id FROM delivery_agents WHERE id = $1`,
    [id]
  );

  if (agentCheck.rows.length === 0) {
    return next(new ErrorHandler("Delivery partner not found.", 404));
  }

  await database.query(
    `UPDATE delivery_agents 
     SET unblock_request_status = 'Rejected'
     WHERE id = $1`,
    [id]
  );

  await database.query(
    `INSERT INTO delivery_agent_offline_logs (partner_id, event_type, details)
     VALUES ($1, 'Appeal Rejected', 'Admin rejected the unblock appeal request.')`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: "Unblock appeal request rejected successfully."
  });
});

// 📊 REAL-TIME MARKETING STREAM DATA FLOW
export const getMarketingLiveData = catchAsyncErrors(async (req, res, next) => {
  try {
    let events = [];

    // 1. Fetch real recent orders
    try {
      const ordersQuery = await database.query(`
        SELECT o.id, o.created_at, u.name as buyer_name, s.city, oi.title, oi.price
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN shipping_info s ON o.id = s.order_id
        ORDER BY o.created_at DESC LIMIT 10
      `);
      ordersQuery.rows.forEach(o => {
        if (!o.title) return;
        events.push({
          id: `order-${o.id}-${o.title.slice(0, 10)}`,
          time: o.created_at,
          type: 'conversion',
          message: `User ${o.buyer_name || 'Buyer'} from ${o.city || 'India'} purchased "${o.title}" for ₹${Number(o.price).toLocaleString('en-IN')}`
        });
      });
    } catch (e) {
      console.warn("Failed to fetch orders for marketing stream:", e.message);
    }

    // 2. Fetch real recent browsing events
    try {
      const browsingQuery = await database.query(`
        SELECT bh.viewed_at as created_at, u.name as user_name, p.name as product_name, p.price
        FROM browsing_history bh
        LEFT JOIN users u ON bh.user_id = u.id
        LEFT JOIN products p ON bh.product_id = p.id
        ORDER BY bh.viewed_at DESC LIMIT 10
      `);
      browsingQuery.rows.forEach(b => {
        if (!b.product_name) return;
        events.push({
          id: `browse-${Date.parse(b.created_at)}-${b.product_name.slice(0, 10)}`,
          time: b.created_at,
          type: 'click',
          message: `User ${b.user_name || 'Visitor'} viewed "${b.product_name}" details`
        });
      });
    } catch (e) {
      console.warn("Failed to fetch browsing history for marketing stream:", e.message);
    }

    // 3. Fetch real recent reviews
    try {
      const reviewsQuery = await database.query(`
        SELECT r.created_at, u.name as user_name, p.name as product_name, r.rating, r.comment
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN products p ON r.product_id = p.id
        ORDER BY r.created_at DESC LIMIT 10
      `);
      reviewsQuery.rows.forEach(r => {
        if (!r.product_name) return;
        events.push({
          id: `review-${Date.parse(r.created_at)}-${r.product_name.slice(0, 10)}`,
          time: r.created_at,
          type: 'like',
          message: `User ${r.user_name || 'Buyer'} reviewed "${r.product_name}" (${r.rating}⭐)`
        });
      });
    } catch (e) {
      console.warn("Failed to fetch reviews for marketing stream:", e.message);
    }

    // Sort events by date descending
    events.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Fallbacks if events are empty
    if (events.length === 0) {
      events.push(
        { id: 1, time: new Date().toISOString(), type: 'click', message: 'User from Mumbai clicked "Traditional Silk Saree" ad campaign' },
        { id: 2, time: new Date(Date.now() - 60000).toISOString(), type: 'conversion', message: 'User from Delhi purchased "Alienware Gaming Laptop"' },
        { id: 3, time: new Date(Date.now() - 120000).toISOString(), type: 'cart', message: 'User from Pune added "Emerald Velvet Sofa" to cart' },
        { id: 4, time: new Date(Date.now() - 180000).toISOString(), type: 'like', message: 'User from Bangalore liked "Chronograph Gold Watch" social campaign' }
      );
    }

    // Active viewers count: Total users count (simulation based on real count)
    const usersCountQuery = await database.query(`SELECT COUNT(*) FROM users`);
    const totalUsers = parseInt(usersCountQuery.rows[0].count) || 45;
    const activeViewers = Math.max(12, Math.round(totalUsers * 0.4) + Math.floor(Math.random() * 10));

    res.status(200).json({
      success: true,
      events: events.slice(0, 15),
      activeViewers
    });
  } catch (err) {
    console.error("Failed to fetch marketing stream data:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});