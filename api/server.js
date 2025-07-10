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


// --- CORE MIDDLEWARE ---
// Enable CORS for frontend requests, allowing cookies to be sent.
app.use(cors({
  origin: "http://localhost:3000", // The URL of your React frontend
  credentials: true,
}));

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