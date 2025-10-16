import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    passwordHash: {
      type: String,
      required: function() {
        return !this.firebaseUid; // Only required if not using Firebase auth
      },
      minlength: 8,
    },
    // Firebase authentication fields
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "firebase"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["FARMER", "BUYER", "ADMIN", "DRIVER", "AGRONOMIST"],
      default: "BUYER",
      index: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    expertise: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    availability: {
      type: String,
      enum: ["AVAILABLE", "UNAVAILABLE"],
      index: true,
    },
    // Driver and Agronomist field (populated when role === 'DRIVER' or 'AGRONOMIST')
    service_area: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
      index: true,
    },
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0,
    },
    // Email change fields
    pendingEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    emailChangeToken: {
      type: String,
      default: null,
    },
    emailChangeExpires: {
      type: Date,
      default: null,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;