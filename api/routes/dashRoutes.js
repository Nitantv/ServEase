console.log(`\n\n\n\n\n🔥🔥🔥 LATEST dashRoutes.js FILE LOADED AT: ${new Date().toLocaleTimeString()} 🔥🔥🔥\n\n\n\n\n`);

console.log("\n\n\n✅✅✅ THE CORRECT dashRoutes.js FILE HAS BEEN LOADED ✅✅✅\n\n\n");
console.log("\n\n\n✅✅✅ THE CORRECT dashRoutes.js FILE HAS BEEN LOADED ✅✅✅\n\n\n");
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User.js");
const { verifyToken } = require("../utils.js");
const Booking = require('../models/Booking.js');
const router = express.Router();
router.get("/test-route", verifyToken, (req, res) => {
  // If this route is reached, it will print to the console and send a success message.
  console.log("\n\n🔥🔥🔥 SUCCESS! The /test-route was reached! 🔥🔥🔥\n\n");
  res.status(200).send("Test route reached successfully!");
});
// ======================================================
//  USER & ADDRESS ROUTES
// ======================================================
router.get("/user/addresses", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const addresses = [user.address, user.address2, user.address3].filter(Boolean);
    res.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/user/email", verifyToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    // --- Validation ---
    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    // Check if the new email is already taken by another user.
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(409).json({ message: "This email is already in use by another account." });
    }

    // --- Update Logic ---
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    user.email = newEmail;
    await user.save();
    
    // Send back the updated user object (without the password) so the frontend can update localStorage.
    const { password, ...userInfo } = user.toObject();

    res.status(200).json({ 
      message: "Email updated successfully!",
      user: userInfo 
    });

  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ message: "Server error while updating email." });
  }
});
router.post("/user/add-address", verifyToken, async (req, res) => {
  const { newAddress } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.address2) {
      user.address2 = newAddress;
    } else if (!user.address3) {
      user.address3 = newAddress;
    } else {
      return res.status(400).json({ message: "Maximum of 3 addresses allowed" });
    }
    await user.save();
    res.status(200).json({ message: "Address added successfully" });
  } catch (err) {
    console.error("Error adding address:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/user/address", verifyToken, async (req, res) => {
  const { oldAddress, newAddress } = req.body;
  if (!oldAddress || !newAddress) {
    return res.status(400).json({ message: "Both oldAddress and newAddress are required." });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    let addressUpdated = false;
    if (user.address === oldAddress) {
      user.address = newAddress;
      addressUpdated = true;
    } else if (user.address2 === oldAddress) {
      user.address2 = newAddress;
      addressUpdated = true;
    } else if (user.address3 === oldAddress) {
      user.address3 = newAddress;
      addressUpdated = true;
    }
    if (addressUpdated) {
      await user.save();
      return res.status(200).json({ message: "Address updated successfully." });
    } else {
      return res.status(404).json({ message: "Original address not found for this user." });
    }
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error while updating address." });
  }
});

// ======================================================
//  WORKER PROFILE & SEARCH ROUTES
// ======================================================
router.put("/worker/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { cost, serviceSlots } = req.body;

    // --- Lock check for updates ---
    if (user.slotsEffectiveDate && new Date() < user.slotsEffectiveDate) {
      return res.status(403).json({ 
        message: `You can only update your details after ${user.slotsEffectiveDate.toDateString()}.` 
      });
    }

    const isInitialSetup =
      (!user.serviceSlots || user.serviceSlots.length === 0) &&
      (!user.pendingServiceSlots || user.pendingServiceSlots.length === 0);

    let successMessage = "";

    if (isInitialSetup) {
      console.log(`Initial setup: saving immediately for worker ${user.id}`);
      user.cost = cost;
      user.serviceSlots = serviceSlots;
      user.markModified('serviceSlots');
      successMessage = "Profile details saved successfully!";
    } else {
      console.log(`Update detected: scheduling for later for worker ${user.id}`);
      user.pendingServiceSlots = serviceSlots;
      user.pendingCost = cost;
      user.markModified('pendingServiceSlots');

      const effectiveDate = new Date();
      effectiveDate.setDate(effectiveDate.getDate() + 3);
      effectiveDate.setUTCHours(0, 0, 0, 0);
      user.slotsEffectiveDate = effectiveDate;

      successMessage = "Profile changes saved! They will become effective in 3 days.";
    }

    await user.save();
    res.status(200).json({ message: successMessage });

  } catch (error) {
    console.error("ERROR SAVING WORKER PROFILE:", error);
    res.status(500).json({ message: "Server error while updating profile." });
  }
});

router.get("/worker/my-profile", verifyToken, async (req, res) => {
  try {
    let worker = await User.findById(req.user.id);
    if (!worker) { 
      return res.status(404).json({ message: "Worker profile not found." }); 
    }

    if (worker.slotsEffectiveDate && new Date() >= worker.slotsEffectiveDate) {
      console.log(`[MY-PROFILE] Applying pending changes for worker ${worker._id}`);
      worker.serviceSlots = worker.pendingServiceSlots;
      if (worker.pendingCost !== null) {
        worker.cost = worker.pendingCost;
      }
      worker.pendingServiceSlots = [];
      worker.pendingCost = null;
      worker.slotsEffectiveDate = null;
      await worker.save();
    }

    const profileToSend = {
      username: worker.username,
      cost: worker.cost,
      serviceSlots: worker.serviceSlots,
      pendingCost: worker.pendingCost,
      pendingServiceSlots: worker.pendingServiceSlots,
      slotsEffectiveDate: worker.slotsEffectiveDate,
    };
    
    res.json(profileToSend);
  } catch (error) { 
    console.error("Error in /my-profile:", error);
    res.status(500).json({ message: "Server error while fetching your profile." }); 
  }
});



router.get("/workers", verifyToken, async (req, res) => {
  // FIX: Changed req.body to req.query to correctly read URL parameters.
  const { role, address } = req.query; 
  if (!role || !address) {
    return res.status(400).json({ message: "Role and address parameters are required." });
  }
  try {
    const workers = await User.find({
      role: { $regex: new RegExp(`^${role}$`, 'i') },
      $or: [
        { address: { $regex: new RegExp(`^${address}$`, 'i') } },
        { address2: { $regex: new RegExp(`^${address}$`, 'i') } },
        { address3: { $regex: new RegExp(`^${address}$`, 'i') } }
      ]
    }).select('username _id');
    res.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ message: "Server error while fetching workers" });
  }
});

// ======================================================
//  BOOKING & AVAILABILITY ROUTES
// ======================================================
router.post("/book-slot", verifyToken, async (req, res) => {
  try {
    const { workerId, bookingDate, startTimeMinutes, endTimeMinutes, cost, address } = req.body;
    const newBooking = new Booking({ workerId, customerId: req.user.id, bookingDate, startTimeMinutes, endTimeMinutes, cost, address });
    await newBooking.save();
    res.status(201).json({ message: "Slot booked successfully!", booking: newBooking });
  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ 
      message: "Server error during booking.",
      error: error.message 
    });
  }
});

router.delete("/booking/:bookingId", verifyToken, async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (booking.customerId.toString() !== userId && booking.workerId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot cancel this booking." });
    }
    await Booking.findByIdAndDelete(bookingId);
    res.status(200).json({ message: "Booking cancelled successfully." });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Server error during cancellation." });
  }
});

router.get("/bookings/:workerId", verifyToken, async (req, res) => {
  const { workerId } = req.params;
  const { date } = req.query; 
  if (!date) {
    return res.status(400).json({ message: "A date query parameter is required." });
  }
  try {
    const bookings = await Booking.find({ workerId: workerId, bookingDate: date, }).select('startTimeMinutes endTimeMinutes'); 
    res.json(bookings);
  } catch (error) {
    console.error(`Error fetching bookings for worker ${workerId} on date ${date}:`, error);
    res.status(500).json({ message: "Server error while fetching bookings." });
  }
});


// ✅✅✅ --- UPDATED BOOKING FETCH LOGIC FOR WORKERS --- ✅✅✅
// In backend/routes/dashRoutes.js

router.get("/worker/my-bookings", verifyToken, async (req, res) => {
  try {
    // Defensive check
    if (!req.user || !req.user.id) {
      console.error("[ERROR] /worker/my-bookings: req.user.id is missing after token verification.");
      return res.status(400).json({ message: "Bad Request: User ID could not be determined from token." });
    }

    const workerId = req.user.id;
    console.log(`--- [WORKER] Searching for all bookings for workerId: ${workerId}`);

    // Fetch all bookings for this worker from the database.
    const bookings = await Booking.find({ workerId: workerId })
      .populate('customerId', 'username')
      .sort({ bookingDate: 1, startTimeMinutes: 1 });
      
    console.log(`--- [WORKER] Simple query found ${bookings.length} total booking(s).`);

    // Manually filter by time in JavaScript to find upcoming ones.
    const now = new Date();
    // Important: Get today's date at midnight UTC for accurate comparison.
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().split('T')[0];
    const currentTimeInMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    const upcomingBookings = bookings.filter(booking => {
      const isFutureDate = booking.bookingDate > today;
      const isTodayButLater = (booking.bookingDate === today && booking.endTimeMinutes >= currentTimeInMinutes);
      return isFutureDate || isTodayButLater;
    });
    
    console.log(`--- [WORKER] After filtering, there are ${upcomingBookings.length} upcoming booking(s).`);

    // ✅✅✅ THIS IS THE FIX ✅✅✅
    // We send only ONE response, containing the final filtered list.
    res.json(upcomingBookings);

  } catch (error) {
    // This catch block will handle any errors from the database query or other logic.
    console.error("--- [WORKER] ❌ An error occurred inside the route handler:", error);
    // Important: Check if headers have already been sent before sending another response.
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error while fetching bookings." });
    }
  }
});

// ✅✅✅ --- UPDATED BOOKING FETCH LOGIC FOR CUSTOMERS --- ✅✅✅
router.get("/customer/my-bookings", verifyToken, async (req, res) => {
  console.log("in customer/my-booking");
  try {
    const customerId = req.user.id;
    const now = new Date();

    // --- ROBUST TIME CALCULATION (THE FIX) ---
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    // --- END OF FIX ---

    const bookings = await Booking.find({
      customerId: customerId,
      $or: [
        { bookingDate: { $gt: today } },
        { 
          $and: [
            { bookingDate: { $eq: today } },
            { endTimeMinutes: { $gte: currentTimeInMinutes } }
          ]
        }
      ]
    })
    .populate('workerId', 'username')
    .sort({ bookingDate: 1, startTimeMinutes: 1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching customer's bookings:", error);
    res.status(500).json({ message: "Server error while fetching bookings." });
  }
});
router.get("/worker/:workerId", verifyToken, async (req, res) => {
  try {
    const { workerId } = req.params;
    let worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found." });
    }

    if (worker.slotsEffectiveDate && new Date() >= worker.slotsEffectiveDate) {
      console.log(`Applying pending changes for worker ${workerId}`);
      worker.serviceSlots = worker.pendingServiceSlots;
      if (worker.pendingCost !== null) {
        worker.cost = worker.pendingCost;
      }
      worker.pendingServiceSlots = [];
      worker.pendingCost = null;
      worker.slotsEffectiveDate = null;
      await worker.save();
    }
    
    const profileToSend = {
      username: worker.username,
      cost: worker.cost,
      serviceSlots: worker.serviceSlots,
      pendingCost: worker.pendingCost,
      pendingServiceSlots: worker.pendingServiceSlots,
      slotsEffectiveDate: worker.slotsEffectiveDate,
    };
    res.json(profileToSend);
  } catch (error) {
    console.error("Error fetching worker profile:", error);
    res.status(500).json({ message: "Server error while fetching worker profile." });
  }
});

module.exports = router;