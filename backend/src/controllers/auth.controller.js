import { signAccessToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Listing from "../models/listing.model.js";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Activity from "../models/activity.model.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { sendVerificationEmail, sendEmailChangeVerification, generateVerificationToken, sendPasswordResetEmail } from "../lib/emailService.js";


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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: "Email is required" } });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: "Invalid email format" } });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Always return success message for security reasons (don't reveal if emailexists)
    const responseMessage = "If an account with that email exists, we've sent password reset instructions to your email.";
    
    if (user) {
      // Generate password reset token
      const resetToken = generateVerificationToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to user
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, user.fullName, resetToken);
        console.log(`Password reset email sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails, just log it
      }
    } else {
      // Log attempted reset for non-existent email (for security monitoring)
      console.log(`Password reset attempt for non-existent email: ${email}`);
    }

    return res.status(200).json({
      message: responseMessage,
      success: true
    });
  } catch (error) {
    console.error("Error in forgotPassword controller: ", error.message);
    return res.status(500).json({ 
      error: { code: "SERVER_ERROR", message: "Internal server error" } 
    });
  }
};

export const logout = async (req, res) => {
  try {
    // If a driver or agronomist logs out, mark them UNAVAILABLE
    if (req.user && (String(req.user.role).toUpperCase() === 'DRIVER' || String(req.user.role).toUpperCase() === 'AGRONOMIST')) {
      try {
        await User.findByIdAndUpdate(req.user._id, { availability: 'UNAVAILABLE' });
      } catch (_) {}
    }
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
      if (String(me.role).toUpperCase() === 'DRIVER' || String(me.role).toUpperCase() === 'AGRONOMIST') {
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
    const { _id, email, role, fullName, profilePic, createdAt, phone, address, bio, lastLogin, isEmailVerified, availability, service_area, pendingEmail, emailChangeExpires } = req.user;
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
      isEmailVerified,
      availability,
      service_area,
      pendingEmail,
      emailChangeExpires
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
    const [totalUsers, farmers, buyers, drivers, agronomists, listingsTotal, listingsAvailable] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'FARMER' }),
      User.countDocuments({ role: 'BUYER' }),
      User.countDocuments({ role: 'DRIVER' }),
      User.countDocuments({ role: 'AGRONOMIST' }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'AVAILABLE' }),
    ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
        farmers,
        buyers,
        drivers,
        agronomists,
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
    const allowed = ['role', 'status', 'availability', 'service_area', 'expertise'];
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
    // Availability rules by role
    if (updates.availability) {
      const target = await User.findById(id).select('role');
      if (!target) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      const role = String(target.role).toUpperCase();
      if (role !== 'DRIVER' && role !== 'AGRONOMIST') delete updates.availability;
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
    const { email, password, role = 'DRIVER', fullName, availability, service_area, expertise, status = 'ACTIVE' } = req.body || {};

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
    const allowedRoles = ['ADMIN', 'DRIVER', 'FARMER', 'BUYER', 'AGRONOMIST'];
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

    // Generate email verification token for admin-created accounts
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      fullName: typeof fullName === 'string' ? fullName.trim() : '',
      profilePic: defaultAvatar,
      status: String(status || 'ACTIVE').toUpperCase(),
      availability: normalizedRole === 'DRIVER'
        ? (String(availability || 'UNAVAILABLE').toUpperCase())
        : (normalizedRole === 'AGRONOMIST' ? (String(availability || 'AVAILABLE').toUpperCase()) : undefined),
      service_area: normalizedRole === 'DRIVER' ? (typeof service_area === 'string' ? service_area : '') : undefined,
      expertise: typeof expertise === 'string' ? expertise.trim() : '',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await newUser.save();

    // Send verification email for admin-created accounts
    const emailResult = await sendVerificationEmail(
      newUser.email,
      newUser.fullName,
      verificationToken
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email for admin-created user:', emailResult.error);
      // Don't fail the user creation, just log the error
    }

    return res.status(201).json({ 
      id: newUser._id, 
      email: newUser.email, 
      role: newUser.role, 
      fullName: newUser.fullName,
      isEmailVerified: newUser.isEmailVerified,
      message: 'Account created successfully. Verification email sent to user.'
    });
  } catch (error) {
    console.error('Error in adminCreateUser: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// Public endpoint to fetch agronomists (for harvest reports)
export const getAgronomists = async (req, res) => {
  try {
    const agronomists = await User.find({ 
      role: 'AGRONOMIST',
      isEmailVerified: true,
      status: { $ne: 'SUSPENDED' }
    })
    .select('_id fullName expertise availability profilePic')
    .sort({ fullName: 1 });

    return res.status(200).json({ data: agronomists });
  } catch (error) {
    console.error('Error in getAgronomists: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// Security endpoints
export const changeEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const userId = req.user._id;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ 
        error: { code: 'VALIDATION_ERROR', message: 'New email and current password are required' } 
      });
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ 
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } 
      });
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({ email: newEmail.toLowerCase().trim() });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(409).json({ 
        error: { code: 'EMAIL_IN_USE', message: 'Email already in use by another account' } 
      });
    }

    // Verify current password
    const user = await User.findById(userId);
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' } 
      });
    }

    // Generate email change token
    const emailChangeToken = generateVerificationToken();
    const emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('Generated email change token:', emailChangeToken);
    console.log('Token expires at:', emailChangeExpires);

    // Store pending email change (DO NOT update actual email yet)
    user.pendingEmail = newEmail.toLowerCase().trim();
    user.emailChangeToken = emailChangeToken;
    user.emailChangeExpires = emailChangeExpires;
    await user.save();

    console.log('User updated with pending email change:', {
      userId: user._id,
      currentEmail: user.email,
      pendingEmail: user.pendingEmail,
      token: user.emailChangeToken,
      expires: user.emailChangeExpires
    });

    // Send email change verification email to NEW address
    const emailResult = await sendEmailChangeVerification(
      newEmail.toLowerCase().trim(),
      user.fullName,
      emailChangeToken
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return res.status(500).json({ 
        error: { code: 'EMAIL_SEND_FAILED', message: 'Failed to send verification email' } 
      });
    }

    return res.json({ 
      message: 'Email change initiated. Please check your new email for verification instructions. Your current email remains active until verification is complete.',
      currentEmail: user.email,
      pendingEmail: user.pendingEmail
    });
  } catch (error) {
    console.error('Error in changeEmail:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to change email' } 
    });
  }
};

// Verify email change
export const verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('Email change verification attempt with token:', token);
    console.log('Token length:', token?.length);
    console.log('Token type:', typeof token);
    console.log('Token characters:', token?.split('').map(c => c.charCodeAt(0)));
    console.log('Token encoded:', encodeURIComponent(token));

    if (!token) {
      return res.status(400).json({ 
        error: { code: 'VALIDATION_ERROR', message: 'Verification token is required' } 
      });
    }

    // Debug: Check all users with pending email changes
    const allPendingUsers = await User.find({ 
      emailChangeToken: { $exists: true, $ne: null }
    }).select('_id email pendingEmail emailChangeToken emailChangeExpires');
    console.log('All users with pending email changes:', allPendingUsers);
    
    // Debug: Check if token matches any stored token
    const tokenMatches = allPendingUsers.filter(user => user.emailChangeToken === token);
    console.log('Token matches found:', tokenMatches.length);
    if (tokenMatches.length > 0) {
      console.log('Matching user details:', tokenMatches[0]);
    }

    // Find user with matching email change token
    const user = await User.findOne({ 
      emailChangeToken: token,
      emailChangeExpires: { $gt: new Date() }
    });

    console.log('User found for token:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User details:', {
        id: user._id,
        email: user.email,
        pendingEmail: user.pendingEmail,
        tokenExpires: user.emailChangeExpires,
        currentTime: new Date()
      });
    }

    if (!user) {
      // Check if token exists but is expired
      const expiredUser = await User.findOne({ emailChangeToken: token });
      if (expiredUser) {
        console.log('Token found but expired. Expires:', expiredUser.emailChangeExpires, 'Current:', new Date());
        return res.status(400).json({ 
          error: { code: 'EXPIRED_TOKEN', message: 'Verification token has expired. Please request a new email change.' } 
        });
      }
      
      return res.status(400).json({ 
        error: { code: 'INVALID_TOKEN', message: 'Invalid verification token' } 
      });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ 
        error: { code: 'NO_PENDING_EMAIL', message: 'No pending email change found' } 
      });
    }

    // Check if the new email is already in use by another user
    const existingUser = await User.findOne({ 
      email: user.pendingEmail,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: { code: 'EMAIL_IN_USE', message: 'Email is already in use by another account' } 
      });
    }

    // Update email and clear pending change
    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.isEmailVerified = true;
    user.pendingEmail = null;
    user.emailChangeToken = null;
    user.emailChangeExpires = null;
    await user.save();

    console.log('Email change completed successfully:', {
      userId: user._id,
      oldEmail: oldEmail,
      newEmail: user.email
    });

    return res.json({ 
      message: 'Email successfully changed and verified',
      oldEmail: oldEmail,
      newEmail: user.email
    });
  } catch (error) {
    console.error('Error in verifyEmailChange:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to verify email change' } 
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: { code: 'VALIDATION_ERROR', message: 'Current password and new password are required' } 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters' } 
      });
    }

    // Verify current password
    const user = await User.findById(userId);
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' } 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    user.passwordHash = newPasswordHash;
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to change password' } 
    });
  }
};


export const deleteAccount = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!currentPassword) {
      return res.status(400).json({ 
        error: { code: 'VALIDATION_ERROR', message: 'Current password is required' } 
      });
    }

    // Find user and related data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: { code: 'USER_NOT_FOUND', message: 'User not found' } 
      });
    }

    // Debug: Log user data to see what's available
    console.log('User found for deletion:', {
      id: user._id,
      email: user.email,
      hasPassword: !!user.passwordHash,
      passwordLength: user.passwordHash ? user.passwordHash.length : 0
    });

    // Check if user has a password (for users who might have signed up with OAuth)
    if (!user.passwordHash) {
      return res.status(400).json({ 
        error: { code: 'NO_PASSWORD', message: 'This account does not have a password set. Please contact support.' } 
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } 
      });
    }

    // Delete user's listings
    await Listing.deleteMany({ farmer: userId });

    // Delete user's orders (as customer)
    await Order.deleteMany({ customer: userId });

    // Delete user's cart
    await Cart.deleteOne({ user: userId });

    // Delete user's activities
    await Activity.deleteMany({ farmer: userId });

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to delete account' } 
    });
  }
};