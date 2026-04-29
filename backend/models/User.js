const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    age: Number,
    cart: [
      {
        bookId: String,
        title: String,
        price: Number,
        image: String,
        qty: { type: Number, default: 1 }
      }
    ],
    wishlist: [
      {
        bookId: String,
        title: String,
        price: Number,
        image: String
      }
    ],
    otp: String,
    otpExpires: Date,
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    isPaid: {
      type: Boolean,
      default: false
    },
    addresses: [
      {
        fullName: String,
        addressLine: String,
        city: String,
        state: String,
        pincode: String,
        phone: String,
        isDefault: { type: Boolean, default: false }
      }
    ],
    blocked: {
      type: Boolean,
      default: false
    },
    profileImage: {
      type: String
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"]
    },
    dob: Date,
    bio: String,
    socialLinks: {
      twitter: String,
      facebook: String,
      instagram: String,
      linkedin: String
    },
    memberStatus: {
      type: String,
      default: "Active"
    },
    sessionVersion: {
      type: Number,
      default: 0
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light"
      },
      notificationsEnabled: {
        type: Boolean,
        default: true
      },
      privacy: {
        profileVisible: {
          type: Boolean,
          default: true
        },
        showEmail: {
          type: Boolean,
          default: false
        },
        showPhone: {
          type: Boolean,
          default: false
        }
      }
    },
    cancelCount: {
      type: Number,
      default: 0
    },
    returnCount: {
      type: Number,
      default: 0
    },
    advancePaymentRequired: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
