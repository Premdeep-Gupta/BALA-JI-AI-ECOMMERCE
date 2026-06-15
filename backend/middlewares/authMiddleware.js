import jwt from "jsonwebtoken";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import database from "../database/db.js";

// ================= USER AUTH =================
export const isAuthenticated = catchAsyncErrors(
  async (req, res, next) => {
    const appType = req.headers["x-app-type"];
    
    let token;
    if (appType === "Admin") {
      token = req.cookies.admin_token;
    } else {
      token = req.cookies.user_token || req.cookies.token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ErrorHandler(
          "Please login to access this resource.",
          401
        )
      );
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY || process.env.JWT_SECRET
      );

      const user = await database.query(
        `SELECT id, name, email, role, avatar
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [decoded.id]
      );

      if (user.rows.length === 0) {
        return next(
          new ErrorHandler(
            "User not found.",
            404
          )
        );
      }

      req.user = user.rows[0];

      next();
    } catch (error) {
      return next(
        new ErrorHandler(
          "Invalid or expired token.",
          401
        )
      );
    }
  }
);

// ================= ADMIN AUTH =================
export const isAdminAuthenticated = catchAsyncErrors(
  async (req, res, next) => {
    let token = req.cookies.admin_token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ErrorHandler(
          "Admin login required.",
          401
        )
      );
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY || process.env.JWT_SECRET
      );

      const user = await database.query(
        `SELECT id, name, email, role, avatar
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [decoded.id]
      );

      if (
        user.rows.length === 0 ||
        user.rows[0].role !== "Admin"
      ) {
        return next(
          new ErrorHandler(
            "Admin access denied.",
            403
          )
        );
      }

      req.user = user.rows[0];

      next();
    } catch (error) {
      return next(
        new ErrorHandler(
          "Invalid or expired admin token.",
          401
        )
      );
    }
  }
);

// ================= ROLE AUTH =================
export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role (${req.user?.role || "Guest"}) is not allowed.`,
          403
        )
      );
    }

    next();
  };
};

// ================= DELIVERY AGENT AUTH =================
export const isDeliveryAgentAuthenticated = catchAsyncErrors(
  async (req, res, next) => {
    let token = req.cookies.delivery_token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new ErrorHandler("Delivery agent login required.", 401));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY || process.env.JWT_SECRET
      );

      const agent = await database.query(
        `SELECT id, name, phone, vehicle_number, avatar_url, agency, status, address, latitude, longitude,
                delivery_partner_status, fine_amount, offline_count, block_reason, blocked_at, unblock_request_status, unblock_request_reason
         FROM delivery_agents
         WHERE id = $1
         LIMIT 1`,
        [decoded.id]
      );

      if (agent.rows.length === 0) {
        return next(new ErrorHandler("Delivery agent not found.", 404));
      }

      req.deliveryAgent = agent.rows[0];
      next();
    } catch (error) {
      return next(new ErrorHandler("Invalid or expired delivery token.", 401));
    }
  }
);

// ================= IS NOT BLOCKED MIDDLEWARE =================
export const isNotBlocked = catchAsyncErrors(
  async (req, res, next) => {
    if (req.deliveryAgent && req.deliveryAgent.delivery_partner_status === "BLOCKED") {
      return next(
        new ErrorHandler(
          "Your account is BLOCKED. All delivery transactions are disabled. Contact Admin.",
          403
        )
      );
    }
    next();
  }
);