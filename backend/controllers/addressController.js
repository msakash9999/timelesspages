const Address = require("../models/Address");

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.userSession.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { fullName, phone, houseNumber, street, landmark, city, state, pincode, country, addressType, isDefault } = req.body;

    if (!fullName || !phone || !houseNumber || !street || !city || !state || !pincode) {
      return res.status(400).json({ message: "All required address fields must be provided" });
    }
    
    if (isDefault) {
      await Address.updateMany({ userId: req.userSession.userId }, { isDefault: false });
    }

    const address = new Address({
      userId: req.userSession.userId,
      fullName,
      phone,
      houseNumber,
      street,
      landmark,
      city,
      state,
      pincode,
      country: country || "India",
      addressType,
      isDefault: isDefault || false
    });

    await address.save();
    res.status(201).json({ message: "Address added successfully", address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault, ...otherFields } = req.body;
    const updatePayload = {
      ...otherFields,
      country: otherFields.country || "India"
    };

    if (isDefault) {
      await Address.updateMany({ userId: req.userSession.userId }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: id, userId: req.userSession.userId },
      { ...updatePayload, isDefault: Boolean(isDefault) },
      { new: true }
    );

    if (!address) return res.status(404).json({ message: "Address not found" });

    res.json({ message: "Address updated successfully", address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({ _id: id, userId: req.userSession.userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const remaining = await Address.find({ userId: req.userSession.userId }).sort({ createdAt: -1 });
    if (address.isDefault && remaining.length > 0) {
      await Address.updateOne({ _id: remaining[0]._id }, { isDefault: true });
    }

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await Address.updateMany({ userId: req.userSession.userId }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: id, userId: req.userSession.userId },
      { isDefault: true },
      { new: true }
    );
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.json({ message: "Default address set successfully", address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
