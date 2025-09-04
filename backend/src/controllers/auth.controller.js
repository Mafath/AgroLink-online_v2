import { signAccessToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  try {
    const { email, password, role, fullName } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required" } });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: "Invalid email format" } });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" } });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ error: { code: "EMAIL_IN_USE", message: "Email already registered" } });
    }

    // Only FARMER or BUYER can self-register; ADMIN/DRIVER are admin-created
    const allowedPublicRoles = ["FARMER", "BUYER"];
    const normalizedRole = (role || "BUYER").toUpperCase();
    if (!allowedPublicRoles.includes(normalizedRole)) {
      return res
        .status(403)
        .json({ error: { code: "ROLE_NOT_ALLOWED", message: "Only FARMER or BUYER can self-register" } });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      fullName: typeof fullName === 'string' ? fullName.trim() : "",
    });

    await newUser.save();

    return res.status(201).json({ id: newUser._id, email: newUser.email, role: newUser.role, fullName: newUser.fullName });
  } catch (error) {
    console.log("Error in signup controller: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required" } });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } });
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });

    return res.status(200).json({
      accessToken,
      user: { id: user._id, email: user.email, role: user.role, fullName: user.fullName },
    });
  } catch (error) {
    console.log("Error in signin controller: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

// Backward-compat alias
export const login = signin;

export const logout = (req, res) => {
  try {
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.log("Error in logout controller: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: "Profile pic is required" } });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true },
    ).select("-passwordHash");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile: ", error);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const getCurrentUser = (req, res) => {
  try {
    const { _id, email, role, fullName } = req.user;
    return res.status(200).json({ id: _id, email, role, fullName });
  } catch (error) {
    console.log("Error in getCurrentUser controller: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

// Backward-compat alias for existing route
export const checkAuth = getCurrentUser;