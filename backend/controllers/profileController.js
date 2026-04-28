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
    const { name, gender, bio, phone, dob, socialLinks } = req.body;
    const user = await User.findById(req.userSession.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (bio) user.bio = bio;
    if (phone) user.phone = phone;
    if (dob) user.dob = dob;
    if (socialLinks) user.socialLinks = socialLinks;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
