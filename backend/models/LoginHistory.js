const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    ipAddress: String,
    userAgent: String,
    device: String,
    browser: String,
    os: String,
    location: String,
    loginTime: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
