const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    blocked: {
      type: Boolean,
      default: false
    },
    otp: String,
    otpExpires: Date,
    sellerRevenue: {
      type: Number,
      default: 0
    },
    sellerInventory: {
      type: Number,
      default: 0
    },
    sellerAlerts: [
      {
        message: String,
        type: { type: String, enum: ['Low Stock', 'Fast Selling', 'High Demand', 'Returned', 'Cancelled'] },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Seller", sellerSchema);
