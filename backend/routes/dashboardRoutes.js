const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const profileController = require("../controllers/profileController");
const addressController = require("../controllers/addressController");
const settingsController = require("../controllers/settingsController");

module.exports = (requireUser) => {
  // Dashboard Home
  router.get("/summary", requireUser, dashboardController.getDashboardSummary);
  router.get("/account", requireUser, dashboardController.getAccountDetails);

  // Profile
  router.get("/profile", requireUser, profileController.getProfile);
  router.put("/profile", requireUser, profileController.updateProfile);

  // Addresses
  router.get("/address", requireUser, addressController.getAddresses);
  router.post("/address", requireUser, addressController.addAddress);
  router.put("/address/:id", requireUser, addressController.updateAddress);
  router.delete("/address/:id", requireUser, addressController.deleteAddress);
  router.patch("/address/:id/default", requireUser, addressController.setDefaultAddress);

  // Settings
  router.get("/settings", requireUser, settingsController.getSettings);
  router.put("/settings", requireUser, settingsController.updateSettings);
  router.delete("/delete-account", requireUser, settingsController.deleteAccount);
  router.post("/clear-wishlist", requireUser, settingsController.clearWishlist);
  router.post("/clear-cart", requireUser, settingsController.clearCart);
  router.post("/logout-all-devices", requireUser, settingsController.logoutAllDevices);
  router.get("/export-data", requireUser, settingsController.exportData);

  return router;
};
