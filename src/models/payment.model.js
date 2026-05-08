import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    gateway: {
      type: String,
      enum: ["razorpay", "stripe", "cod"],
      default: "razorpay",
    },

    status: {
      type: String,
      enum: ["created", "pending", "success", "failed", "refunded"],
      default: "created",
      index: true,
    },

    failureReason: String,
  },
  { timestamps: true },
);

paymentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
