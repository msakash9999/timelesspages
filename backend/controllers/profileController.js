const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userSession.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, gender, bio, phone, dob, socialLinks, profileImage } = req.body;
    const user = await User.findById(req.userSession.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof name === "string" && name.trim()) user.name = name.trim();
    if (typeof gender === "string" && gender.trim()) user.gender = gender.trim();
    if (typeof bio === "string") user.bio = bio.trim();
    if (typeof phone === "string") user.phone = phone.trim();
    if (dob) user.dob = dob;
    if (socialLinks && typeof socialLinks === "object") {
      user.socialLinks = {
        ...(user.socialLinks || {}),
        ...socialLinks
      };
    }
    if (typeof profileImage === "string" && profileImage.trim()) {
      user.profileImage = profileImage.trim();
    }

    await user.save();
    const safeUser = await User.findById(req.userSession.userId).select("-password");
    res.json({ message: "Profile updated successfully", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
