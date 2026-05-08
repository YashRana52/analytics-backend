import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password: String,

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    city: {
      type: String,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
