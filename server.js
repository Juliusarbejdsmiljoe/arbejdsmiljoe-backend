// backend/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

dotenv.config();

const app = express();

// ---- ENV ----
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI mangler i .env / miljøvariabler");
  process.exit(1);
}

// ---- CORS ----
// Tillad localhost i udvikling + præcis whitelist fra CORS_ORIGIN (kommasepareret)
const allowList = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/Postman/no-origin
      const isLocal =
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
      if (isLocal || allowList.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Gør CORS-fejl pænere
app.use((err, _req, res, next) => {
  if (err && String(err.message || "").startsWith("CORS blocked: ")) {
    return res.status(403).json({ message: err.message });
  }
  return next(err);
});

// ---- COMMON MIDDLEWARE ----
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// (Valgfrit) Maintenance-mode: lås alt undtagen /auth + /healthz
if (process.env.MAINTENANCE === "true") {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/auth") || req.path === "/healthz") return next();
    return res.status(503).json({ message: "Service midlertidigt utilgængelig" });
  });
}

// ---- ROUTES ----
import authRoutes from "./routes/auth.js";
import apvRoutes from "./routes/apv.js";
import uploadRoutes from "./routes/upload.js";

app.use("/api/auth", authRoutes);
app.use("/api/apv", apvRoutes);
app.use("/api/upload", uploadRoutes);

// ---- HEALTH/PING ----
app.get("/", (_req, res) => res.send("🚀 Arbejdsmiljø API kører"));
app.get("/healthz", (_req, res) =>
  res.json({ ok: true, mongo: mongoose.connection.readyState })
);

// ---- START ----
let mongoHost = "(ukendt host)";
try {
  mongoHost = new URL(MONGO_URI).host;
} catch {}

console.log("ℹ️  Starter backend…");
console.log("ℹ️  Forbinder til MongoDB (host):", mongoHost);

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 20000,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server kører på port ${PORT}`);
      console.log(`🔗 Healthcheck:  http://localhost:${PORT}/healthz`);
      console.log(`🔗 Base route:   http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ---- SAFETY ----
process.on("unhandledRejection", (err) =>
  console.error("❌ Unhandled Rejection:", err)
);
process.on("uncaughtException", (err) =>
  console.error("❌ Uncaught Exception:", err)
);
