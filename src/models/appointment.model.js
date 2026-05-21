import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    slotStartIso: {
      type: String,
      required: true,
    },

    slotEndIso: {
      type: String,
      required: true,
    },

    consultationType: {
      type: String,
      enum: ["Video Consultation", "Voice Call"],
      required: true,
    },

    symptoms: {
      type: String,
      required: true,
    },

    consultationFees: {
      type: Number,
      required: true,
    },

    platformFees: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Cancelled", "Missed"],
      default: "Scheduled",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    cancellationReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Appointment", appointmentSchema);
