const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    firstTimeOnly: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true
    },
    oneTimeUse: {
      type: Boolean,
      default: true
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
