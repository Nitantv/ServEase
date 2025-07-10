const mongoose = require('mongoose');

// This sub-schema defines the structure for a worker's availability slots.
const ServiceSlotSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  serviceStartTime: {
    type: String,
    required: true,
  },
  serviceEndTime: {
    type: String,
    required: true,
  }
});

// This is the main schema for all users in the application.
const UserSchema = new mongoose.Schema({
  // --- Standard User Fields ---
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true, 
    enum: ['Customer', 'Maid', 'Carpenter', 'Laundry Worker'] 
  },
  
  // --- User Addresses ---
  address: { type: String },
  address2: { type: String },
  address3: { type: String },
  
  // --- ACTIVE Worker Profile Fields ---
  // This is the currently active cost and schedule.
  cost: {
    type: Number,
    default: 0
  },
  serviceSlots: {
    type: [ServiceSlotSchema],
    default: []
  },

  // ✅✅✅ --- THESE ARE THE CORRECT FIELDS THAT WERE MISSING --- ✅✅✅
  // --- PENDING Worker Profile Fields ---
  // This section stores upcoming changes that are not yet active.
  
  pendingServiceSlots: {
    type: [ServiceSlotSchema],
    default: []
  },
  
  pendingCost: {
    type: Number,
    default: null // Use null to signify that there is no pending cost change.
  },
  
  // This is the single, shared effective date for ALL pending changes.
  slotsEffectiveDate: {
    type: Date,
    default: null
  }

}, { 
  // Options for the schema
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  strict: "throw"   // Throws an error if a field not in the schema is provided
});

// Create and export the User model based on the schema
module.exports = mongoose.model("User", UserSchema);