const User = require("../models/User");
const Address = require("../models/Address");
const Order = require("../models/Order");
const LoginHistory = require("../models/LoginHistory");
const bcrypt = require("bcryptjs");

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userSession.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const loginHistory = await LoginHistory.find({ userId: req.userSession.userId }).sort({ loginTime: -1 }).limit(10);
    const addressesCount = await Address.countDocuments({ userId: req.userSession.userId });
    const ordersCount = await Order.countDocuments({ userId: req.userSession.userId });
    
    res.json({
      user,
      loginHistory,
      preferences: user.preferences || {},
      stats: {
        ordersCount,
        addressesCount,
        wishlistCount: (user.wishlist || []).length
      },
      twoFactorEnabled: false,
      emailVerified: user.isVerified
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      email,
      phone,
      currentPassword,
      newPassword,
      themePreference,
      notificationsEnabled,
      privacy
    } = req.body;
    const user = await User.findById(req.userSession.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof email === "string" && email.trim() && email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) return res.status(400).json({ message: "Email already in use" });
      user.email = normalizedEmail;
    }

    if (typeof phone === "string") user.phone = phone.trim();

    user.preferences = user.preferences || {};
    if (themePreference === "light" || themePreference === "dark") {
      user.preferences.theme = themePreference;
    }
    if (notificationsEnabled !== undefined) {
      user.preferences.notificationsEnabled = notificationsEnabled === true || notificationsEnabled === "true";
    }
    if (privacy && typeof privacy === "object") {
      user.preferences.privacy = {
        ...(user.preferences.privacy || {}),
        ...privacy
      };
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password required to change password" });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ message: "Incorrect current password" });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({
      message: "Settings updated successfully",
      user: await User.findById(req.userSession.userId).select("-password")
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userSession.userId;
    // Remove all associated data
    await Address.deleteMany({ userId });
    await LoginHistory.deleteMany({ userId });
    // Note: We might want to keep orders for record-keeping, but user asked to remove all data.
    // However, usually orders are kept for tax/legal. I'll clear them if user insists.
    await Order.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account and all associated data deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userSession.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.wishlist = [];
    await user.save();
    res.json({ message: "Wishlist cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.userSession.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.cart = [];
    await user.save();
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportData = async (req, res) => {
  try {
    const userId = req.userSession.userId;
    const user = await User.findById(userId).select("-password");
    const addresses = await Address.find({ userId });
    const orders = await Order.find({ userId });
    const loginHistory = await LoginHistory.find({ userId });

    const data = {
      profile: user,
      addresses,
      orders,
      loginHistory
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=user_data_${userId}.json`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.userSession.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
    await LoginHistory.deleteMany({ userId: req.userSession.userId });
    res.json({ message: "Logged out from all other devices successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
