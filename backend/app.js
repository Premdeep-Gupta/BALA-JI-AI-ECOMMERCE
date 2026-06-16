import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import Stripe from "stripe";
import morgan from "morgan";
import helmet from "helmet";

// ================= INTERNAL IMPORTS =================
import { createTables } from "./utils/createTables.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

import authRouter from "./router/authRoutes.js";
import productRouter from "./router/productRoutes.js";
import adminRouter from "./router/adminRoutes.js";
import orderRouter from "./router/orderRoutes.js";
import paymentRouter from "./router/paymentRoutes.js";
import supportRouter from "./router/supportRoutes.js";
import campaignRouter from "./router/campaignRoutes.js";
import aiSalesmanRouter from "./router/aiSalesmanRoute.js";
import deliveryRouter from "./router/deliveryRoutes.js";
import reelsRouter from "./router/reelsRoutes.js";
import siteSettingsRouter from "./router/siteSettingsRoutes.js";

import database from "./database/db.js";

console.log("✅ App.js Loaded Successfully");

// ================= APP =================
const app = express();

// ================= SECURITY & LOGGING =================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// ================= CORS =================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        process.env.FRONTEND_URL,
        process.env.DASHBOARD_URL,
      ].filter(Boolean);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        origin.includes("vercel.app") ||
                        origin.includes("localhost") ||
                        origin.startsWith("http://localhost:");
                        
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ================= PARSERS =================
app.use(cookieParser());

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

// ================= FILE UPLOAD =================
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  })
);

// ================= STRIPE =================
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

if (stripe) {
  console.log("💳 Stripe Initialized");
} else {
  console.log("⚠️ Stripe Key Missing");
}

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("🚀 Backend Running Successfully");
});

// ================= STRIPE WEBHOOK =================
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).send("Stripe not initialized");
      }

      const sig = req.headers["stripe-signature"];

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "payment_intent.succeeded") {
        console.log("✅ Payment Successful");
      }

      res.json({
        success: true,
      });
    } catch (error) {
      console.log("❌ Stripe Webhook Error");
      console.log(error.message);

      res.status(500).json({
        success: false,
      });
    }
  }
);

// ================= ROUTES =================
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/auth`, authRouter);

app.use(`${API_PREFIX}/product`, productRouter);

app.use(`${API_PREFIX}/admin`, adminRouter);

app.use(`${API_PREFIX}/order`, orderRouter);

app.use(`${API_PREFIX}/payment`, paymentRouter);

app.use(`${API_PREFIX}/support`, supportRouter);

app.use(`${API_PREFIX}/campaigns`, campaignRouter);
app.use(`${API_PREFIX}/ai-salesman`, aiSalesmanRouter);
app.use(`${API_PREFIX}/delivery`, deliveryRouter);
app.use(`${API_PREFIX}/reels`, reelsRouter);
app.use(`${API_PREFIX}/site`, siteSettingsRouter);


// ================= DATABASE INIT =================
const initializeDatabase = async () => {
  try {
    console.log("📦 STEP 1 -> Starting Database");

    await database.query("SELECT NOW()");

    console.log("✅ STEP 2 -> PostgreSQL Connected");

    await createTables();

    console.log("✅ STEP 3 -> Tables Ready");
  } catch (error) {
    console.log("❌ DATABASE ERROR");
    console.log(error);
  }
};

initializeDatabase();

// ================= GLOBAL ERROR HANDLER =================
app.use(errorMiddleware);

export default app;