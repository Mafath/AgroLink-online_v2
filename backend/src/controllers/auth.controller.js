import { signAccessToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Listing from "../models/listing.model.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { sendVerificationEmail, generateVerificationToken } from "../lib/emailService.js";

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

    const displayName = (typeof fullName === 'string' && fullName.trim()) ? fullName.trim() : email.split('@')[0]
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&rounded=true&size=128`;

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      fullName: typeof fullName === 'string' ? fullName.trim() : "",
      profilePic: defaultAvatar,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await newUser.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(
      newUser.email,
      newUser.fullName,
      verificationToken
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail the signup, just log the error
    }

    return res.status(201).json({ 
      id: newUser._id, 
      email: newUser.email, 
      role: newUser.role, 
      fullName: newUser.fullName,
      isEmailVerified: newUser.isEmailVerified,
      message: 'Account created successfully. Please check your email to verify your account.'
    });
  } catch (error) {
    console.error("Error in signup controller: ", error.message);
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

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: { code: "ACCOUNT_SUSPENDED", message: "Your account is suspended. Please contact support." } });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: { 
          code: "EMAIL_NOT_VERIFIED", 
          message: "Please verify your email before logging in. Check your email for a verification link." 
        },
        requiresEmailVerification: true,
        email: user.email
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } });
    }

    // Update last login timestamp
    try { await User.findByIdAndUpdate(user._id, { lastLogin: new Date() }); } catch (_) {}

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });

    return res.status(200).json({
      accessToken,
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified
      },
    });
  } catch (error) {
    console.error("Error in signin controller: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

// Backward-compat alias
export const login = signin;

export const logout = (req, res) => {
  try {
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error("Error in logout controller: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, phone, address, bio, availability } = req.body;
    const userId = req.user._id;

    const updateFields = {};
    if (typeof fullName === 'string') {
      updateFields.fullName = fullName.trim();
    }
    if (typeof availability === 'string') {
      const me = await User.findById(userId).select('role');
      if (String(me.role).toUpperCase() === 'DRIVER') {
        const normalized = availability.toUpperCase();
        if (['AVAILABLE','UNAVAILABLE'].includes(normalized)) {
          updateFields.availability = normalized;
        }
      }
    }
    if (typeof phone === 'string') {
      updateFields.phone = phone.trim();
    }
    if (typeof address === 'string') {
      updateFields.address = address.trim();
    }
    if (typeof bio === 'string') {
      updateFields.bio = bio.trim();
    }
    if (profilePic) {
      const haveCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      if (haveCloudinary) {
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        updateFields.profilePic = uploadResponse.secure_url;
      } else {
        // Fallback: store provided data URL directly
        updateFields.profilePic = profilePic;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Nothing to update" } });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true },
    ).select("-passwordHash");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in update profile: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const getCurrentUser = (req, res) => {
  try {
    const { _id, email, role, fullName, profilePic, createdAt, phone, address, bio, lastLogin, isEmailVerified } = req.user;
    return res.status(200).json({ 
      id: _id, 
      email, 
      role, 
      fullName, 
      profilePic, 
      createdAt, 
      phone, 
      address, 
      bio, 
      lastLogin,
      isEmailVerified
    });
  } catch (error) {
    console.error("Error in getCurrentUser controller: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

// Backward-compat alias for existing route
export const checkAuth = getCurrentUser;

// Admin: simple stats for dashboard
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, farmers, buyers, drivers, listingsTotal, listingsAvailable] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'FARMER' }),
      User.countDocuments({ role: 'BUYER' }),
      User.countDocuments({ role: 'DRIVER' }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'AVAILABLE' }),
    ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
        farmers,
        buyers,
        drivers,
      },
      listings: {
        total: listingsTotal,
        available: listingsAvailable,
      },
    });
  } catch (error) {
    console.error('Error in getAdminStats: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// Admin: list users with pagination and filters
export const adminListUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = String(req.query.role).toUpperCase();
    if (req.query.status) filter.status = String(req.query.status).toUpperCase();
    if (req.query.availability) {
      filter.role = 'DRIVER';
      const avail = String(req.query.availability).toUpperCase();
      if (avail === 'UNAVAILABLE') {
        filter.$or = [
          { availability: 'UNAVAILABLE' },
          { availability: { $exists: false } },
          { availability: '' },
          { availability: null },
        ];
      } else {
        filter.availability = avail;
      }
    }
    if (req.query.service_area) {
      filter.role = 'DRIVER';
      const val = String(req.query.service_area || '').trim();
      if (val) {
        const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.service_area = { $regex: new RegExp(`^${escaped}$`, 'i') };
      }
    }
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select('-passwordHash');

    return res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error in adminListUsers: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// Admin: update user (role, status, verification)
export const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ['role', 'status', 'availability', 'service_area'];
    for (const key of allowed) {
      if (req.body[key] != null) {
        const val = req.body[key];
        if (typeof val === 'string') {
          if (key === 'role' || key === 'status' || key === 'availability') {
            updates[key] = val.toUpperCase();
          } else if (key === 'service_area') {
            updates[key] = val.trim();
          }
        } else {
          updates[key] = val;
        }
      }
    }
    // Only drivers can have availability; if role switched to DRIVER and availability omitted, default to UNAVAILABLE
    if (updates.availability) {
      const target = await User.findById(id).select('role');
      if (!target) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      if (String(target.role).toUpperCase() !== 'DRIVER') delete updates.availability;
    }
    if (updates.role && updates.role.toUpperCase && updates.role.toUpperCase() === 'DRIVER' && updates.availability == null) {
      updates.availability = 'UNAVAILABLE';
    }
    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error in adminUpdateUser: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// Admin: delete user
export const adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in adminDeleteUser: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// Admin: create user (ADMIN/DRIVER/others) with password
export const adminCreateUser = async (req, res) => {
  try {
    const { email, password, role = 'DRIVER', fullName, availability, service_area } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } });
    }

    const normalizedRole = String(role || 'DRIVER').toUpperCase();
    const allowedRoles = ['ADMIN', 'DRIVER', 'FARMER', 'BUYER'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ error: { code: 'ROLE_INVALID', message: 'Invalid role' } });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ error: { code: 'EMAIL_IN_USE', message: 'Email already registered' } });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const displayName = (typeof fullName === 'string' && fullName.trim()) ? fullName.trim() : email.split('@')[0];
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&rounded=true&size=128`;

    const newUser = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      fullName: typeof fullName === 'string' ? fullName.trim() : '',
      profilePic: defaultAvatar,
      availability: normalizedRole === 'DRIVER' ? (String(availability || 'UNAVAILABLE').toUpperCase()) : undefined,
      service_area: normalizedRole === 'DRIVER' ? (typeof service_area === 'string' ? service_area : '') : undefined,
    });

    await newUser.save();

    return res.status(201).json({ id: newUser._id, email: newUser.email, role: newUser.role, fullName: newUser.fullName });
  } catch (error) {
    console.error('Error in adminCreateUser: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};