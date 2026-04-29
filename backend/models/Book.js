const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      default: null
    },
    stockQuantity: {
      type: Number,
      default: function() {
        return Math.floor(Math.random() * (15 - 10 + 1) + 10);
      }
    },
    soldCount: {
      type: Number,
      default: 0
    },
    lowStockAlert: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Book", bookSchema);
