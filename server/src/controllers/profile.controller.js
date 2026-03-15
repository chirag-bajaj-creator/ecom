const User = require("../models/User");
const Address = require("../models/Address");

// GET /api/v1/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email phone profilePicture isVerified"
    );
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_PHONE", message: "Phone must be exactly 10 digits" },
        });
      }
      updates.phone = phone;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("name email phone profilePicture isVerified");

    res.json({ success: true, message: "Profile updated", data: { user } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/profile/picture
const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "No image file provided" },
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: `/uploads/${req.file.filename}` },
      { new: true }
    ).select("name email phone profilePicture isVerified");

    res.json({ success: true, message: "Profile picture updated", data: { user } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/profile/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_FIELDS", message: "All password fields are required" },
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { code: "MISMATCH", message: "New password and confirm password do not match" },
      });
    }

    // Password rules: min 8, 1 uppercase, 1 special, 1 number
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "Password must be min 8 chars with 1 uppercase, 1 number, 1 special character",
        },
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { code: "WRONG_PASSWORD", message: "Current password is incorrect" },
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

// ========== ADDRESS CRUD ==========

// GET /api/v1/profile/addresses
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: { addresses } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/profile/addresses
const addAddress = async (req, res, next) => {
  try {
    const { name, phone, addressLine1, addressLine2, city, state, pincode } = req.body;

    // If first address, make it default
    const count = await Address.countDocuments({ userId: req.user._id });
    const isDefault = count === 0;

    const address = await Address.create({
      userId: req.user._id,
      name,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      pincode,
      isDefault,
    });

    res.status(201).json({ success: true, message: "Address added", data: { address } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/profile/addresses/:addressId
const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.addressId,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Address not found" },
      });
    }

    const allowed = ["name", "phone", "addressLine1", "addressLine2", "city", "state", "pincode"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        address[key] = req.body[key];
      }
    }
    await address.save();

    res.json({ success: true, message: "Address updated", data: { address } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/profile/addresses/:addressId
const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.addressId,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Address not found" },
      });
    }

    // If deleted was default, set another as default
    if (address.isDefault) {
      const next = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/profile/addresses/:addressId/default
const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.addressId,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Address not found" },
      });
    }

    // Unmark previous default
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    res.json({ success: true, message: "Default address updated", data: { address } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
