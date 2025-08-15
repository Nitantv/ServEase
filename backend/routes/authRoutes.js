const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
//const {isLoggedIn} = require("../utils.js")
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { username, password, email, role, address } = req.body;

  if (!username || !password || !email || !role || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅✅✅ --- THIS IS THE FIX --- ✅✅✅
    // Normalize the role: capitalize the first letter, lowercase the rest.
    // This ensures what we save always matches the schema enum.
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Use the normalizedRole when creating the new user.
    const newUser = new User({ username, password: hashedPassword, email, role: normalizedRole, address });
    await newUser.save();
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ message: 'Error signing up', error: error.message });
  }
});


// Login Route
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role.toLowerCase() !== role.toLowerCase()) return res.status(400).json({ message: "Role mismatch" });

    // The user's role is correctly included in the token payload
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // ✅ THIS IS THE FIX: Set the cookie's value directly to the token string
    res.cookie("jwtToken", token, {
      httpOnly: true, // Makes the cookie inaccessible to client-side JavaScript
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "none",
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.status(200).json({ message: "Login successful"}); // No need to send the token in the body anymore

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error logging in', error });
  }
});

const nodemailer = require("nodemailer");

// ✅ Function to Send Reset Email
const sendResetEmail = async (email, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // 🔹 Your email
      pass: process.env.EMAIL_PASS, // 🔹 Your email app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    text: `Click the link below to reset your password:\n\n${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Updated Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { username, role } = req.body;

  try {
    console.log("🔍 Searching for user with:", { username, role });

    const user = await User.findOne({ 
      username: username, 
      role: { $regex: new RegExp("^" + role + "$", "i") } // ✅ Case-insensitive match
    });

    if (!user) {
      console.log("❌ User not found in database!");
      return res.status(400).json({ message: "User not found!" });
    }

    console.log("✅ User found:", user);

    // ✅ Generate Reset Token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    console.log("📩 Reset Token Generated:", resetToken);

    // ✅ Call the sendResetEmail function
    await sendResetEmail(user.email, resetToken);
    console.log("done");
    return res.status(200).json({ message: "Reset link sent to your email!" });

  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  // It now correctly uses "router" instead of "rrouter"
  // and clears the correct cookie name "jwtToken"
  res.clearCookie("jwtToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  }).status(200).json({ message: "Logout successful" });
});
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Step 1: Find the user by the ID from the token.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // ✅✅✅ --- THIS IS THE FIX --- ✅✅✅
    // Before saving, we normalize the role to ensure it matches the schema's enum.
    // This "heals" any bad data that might exist in the database.
    if (user.role) {
      const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
      user.role = normalizedRole; // Update the user object in memory.
    }

    // Step 2: Hash the new password and update the user object.
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    // Step 3: Save the user. The validation will now pass because the role is corrected.
    await user.save();

    res.json({ message: "Password reset successful!" });

  } catch (error) {
    // We can keep the detailed logs for now to be safe.
    console.error("❌ Reset Password Error:", error);
    console.error("❌ JWT Error Name:", error.name);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});
/*router.get("/verify", (req, res) => {
  console.log(req.cookies);
  const token = req.cookies.jwtToken.token; // ✅ Get JWT from cookies
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    res.json({ message: "Authenticated", user: decoded });
  });
});*/
// Fetch addresses of the logged-in user

module.exports = router;
