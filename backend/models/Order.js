const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    products: [
      {
        title: String,
        price: Number,
        qty: { type: Number, default: 1 },
        image: String,
        imageUrl: String
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD"
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending"
    },
    orderStatus: {
      type: String,
      enum: ["Confirmed", "In Progress", "Packed", "Shipped", "In Transit", "Out For Delivery", "Delivered", "CANCELLED"],
      default: "Confirmed"
    },
    address: {
      fullName: String,
      addressLine: String,
      city: String,
      state: String,
      pincode: String,
      phone: String
    },
    trackingTimeline: [
      {
        stage: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    cancelReason: String,
    returnReason: String,
    returnStatus: {
      type: String,
      enum: ["Return Requested", "Return Approved", "Return Rejected", "Refunded"]
    },
    cancelledAt: Date,
    returnedAt: Date
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
