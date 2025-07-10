const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Load environment variables from .env file
dotenv.config();

// --- ROUTE IMPORTS ---
// We require our route files here. This is the only place they should be imported.
const authRoutes = require("./routes/authRoutes");
const dashRoutes = require("./routes/dashRoutes");


// --- APP INITIALIZATION ---
const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
// --- CORE MIDDLEWARE ---
// Enable CORS for frontend requests, allowing cookies to be sent.

// Enable the express.json middleware to parse JSON request bodies.
app.use(express.json());

// Enable the cookie-parser middleware to read cookies from requests.
app.use(cookieParser());

// Simple logging middleware to see all incoming requests in the console.
app.use((req, res, next) => {
  console.log(`--> Received request: ${req.method} ${req.originalUrl}`);
  next();
});


// --- ROUTE USAGE ---
// We tell Express to use our imported route files for specific URL paths.
app.use("/auth", authRoutes);
app.use("/dash", dashRoutes);
/*app.get("/env-check", (req, res) => {
  res.json({
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL,
    vercelUrl: process.env.VERCEL_URL,
  });
});*/


// --- DATABASE CONNECTION ---
// Check if essential .env variables are loaded before trying to connect.
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ FATAL ERROR: Missing .env variables (MONGO_URI or JWT_SECRET)");
  process.exit(1); // Stop the server if environment variables are missing
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Stop the server if DB connection fails
  });


// --- SERVER STARTUP ---
/*const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));*/
export default app;