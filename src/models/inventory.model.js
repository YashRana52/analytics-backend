import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    stock: {
      type: Number,
      required: true,
      index: true,
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Inventory", inventorySchema);
