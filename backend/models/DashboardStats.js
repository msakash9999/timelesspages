const mongoose = require("mongoose");

const dashboardStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    totalOrders: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    savedAddressesCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    profileCompletion: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DashboardStats", dashboardStatsSchema);
