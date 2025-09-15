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
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["FARMER", "BUYER", "ADMIN", "DRIVER"],
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
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;