const User = require("../models/User");
const Address = require("../models/Address");
const Order = require("../models/Order");
const LoginHistory = require("../models/LoginHistory");
const DashboardStats = require("../models/DashboardStats");

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.userSession.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalOrders = await Order.countDocuments({ userId });
    const wishlistCount = user.wishlist.length;
    const savedAddressesCount = await Address.countDocuments({ userId });
    const recentActivity = await Order.find({ userId }).sort({ createdAt: -1 }).limit(3);
    const lastLogin = await LoginHistory.findOne({ userId }).sort({ loginTime: -1 });

    // Calculate profile completion
    let completedFields = 0;
    const totalFields = 6;
    if (user.name) completedFields++;
    if (user.email) completedFields++;
    if (user.phone) completedFields++;
    if (user.profileImage) completedFields++;
    if (user.bio) completedFields++;
    if (user.dob) completedFields++;
    const profileCompletion = Math.round((completedFields / totalFields) * 100);

    res.json({
      welcomeMessage: `Welcome back, ${user.name || "User"}!`,
      stats: {
        totalOrders,
        wishlistCount,
        savedAddressesCount,
        profileCompletion
      },
      recentActivity,
      lastLogin: lastLogin ? lastLogin.loginTime : user.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAccountDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userSession.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      username: user.name,
      email: user.email,
      phone: user.phone || "Not provided",
      memberSince: user.createdAt,
      accountStatus: user.memberStatus || "Active",
      accountId: user._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
