import express from "express";
import Appointment from "../models/Appointment.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Total appointments, completed appointments, cancelled appointments aur missed appointments count nikalo.
router.get(
  "/admin/appointments/stats",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await Appointment.aggregate([
        {
          $group: {
            _id: null,

            totalAppointments: {
              $sum: 1,
            },

            completedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
              },
            },

            cancelledAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
              },
            },

            missedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Missed"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalAppointments: 1,
            completedAppointments: 1,
            cancelledAppointments: 1,
            missedAppointments: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Appointment stats fetched successfully",
        data: stats[0] || {
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          missedAppointments: 0,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointment stats",
        error: error.message,
      });
    }
  },
);

// Monthly total appointments trend nikalo.
router.get(
  "/admin/appointments/monthly-trend",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const trend = await Appointment.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalAppointments: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            monthName: {
              $arrayElemAt: [
                [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
                "$_id.month",
              ],
            },
            totalAppointments: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Monthly appointments trend fetched successfully",
        data: trend,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch monthly appointments trend",
        error: error.message,
      });
    }
  },
);

// Monthly revenue trend nikalo based on successful paid appointments.
router.get(
  "/admin/revenue/monthly-trend",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const revenueTrend = await Appointment.aggregate([
        {
          $match: {
            status: "Completed",
            paymentStatus: "Paid",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalRevenue: { $sum: "$totalAmount" },
            totalPaidAppointments: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            monthName: {
              $arrayElemAt: [
                [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
                "$_id.month",
              ],
            },
            label: {
              $concat: [
                {
                  $arrayElemAt: [
                    [
                      "",
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ],
                    "$_id.month",
                  ],
                },
                " ",
                { $toString: "$_id.year" },
              ],
            },
            totalRevenue: 1,
            totalPaidAppointments: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Monthly revenue trend fetched successfully",
        data: revenueTrend,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch monthly revenue trend",
        error: error.message,
      });
    }
  },
);

//Doctor-wise total revenue nikalo.

router.get(
  "/admin/revenue/doctor-wise",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const doctorRevenue = await Appointment.aggregate([
        {
          $match: {
            status: "Completed",
            paymentStatus: "Paid",
          },
        },

        {
          $group: {
            _id: "$doctorId",

            totalRevenue: {
              $sum: "$totalAmount",
            },

            totalAppointments: {
              $sum: 1,
            },
          },
        },

        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },

        {
          $unwind: "$doctor",
        },

        {
          $project: {
            _id: 0,

            doctorId: "$doctor._id",
            doctorName: "$doctor.name",
            specialization: "$doctor.specialization",
            experience: "$doctor.experience",

            totalRevenue: 1,
            totalAppointments: 1,
          },
        },

        {
          $sort: {
            totalRevenue: -1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Doctor revenue fetched successfully",
        data: doctorRevenue,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch doctor revenue",
        error: error.message,
      });
    }
  },
);

//Doctor-wise completed appointment count nikalo.

router.get(
  "/admin/doctors/completed-appointments",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const doctorCompletedAppointments = await Appointment.aggregate([
        {
          $match: {
            status: "Completed",
          },
        },

        {
          $group: {
            _id: "$doctorId",

            completedAppointments: {
              $sum: 1,
            },
          },
        },

        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },

        {
          $unwind: "$doctor",
        },

        {
          $project: {
            _id: 0,

            doctorId: "$doctor._id",
            doctorName: "$doctor.name",
            specialization: "$doctor.specialization",
            experience: "$doctor.experience",

            completedAppointments: 1,
          },
        },

        {
          $sort: {
            completedAppointments: -1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Doctor-wise completed appointments fetched successfully",
        data: doctorCompletedAppointments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch doctor completed appointments",
        error: error.message,
      });
    }
  },
);

//Top 10 doctors by revenue nikalo.

router.get(
  "/admin/doctors/top-revenue",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const topDoctors = await Appointment.aggregate([
        {
          $match: {
            status: "Completed",
            paymentStatus: "Paid",
          },
        },

        {
          $group: {
            _id: "$doctorId",

            totalRevenue: {
              $sum: "$totalAmount",
            },

            totalAppointments: {
              $sum: 1,
            },
          },
        },

        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },

        {
          $unwind: "$doctor",
        },

        {
          $project: {
            _id: 0,

            doctorId: "$doctor._id",
            doctorName: "$doctor.name",
            specialization: "$doctor.specialization",
            experience: "$doctor.experience",
            doctorImage: "$doctor.profileImage",

            totalRevenue: 1,
            totalAppointments: 1,
          },
        },

        {
          $sort: {
            totalRevenue: -1,
          },
        },

        {
          $limit: 10,
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Top doctors fetched successfully",
        data: topDoctors,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch top doctors",
        error: error.message,
      });
    }
  },
);

//Top 10 doctors by appointment count nikalo.

router.get(
  "/admin/doctors/top-appointments",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const topDoctors = await Appointment.aggregate([
        {
          $group: {
            _id: "$doctorId",

            totalAppointments: {
              $sum: 1,
            },

            completedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
              },
            },

            cancelledAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
              },
            },
          },
        },

        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            as: "doctor",
          },
        },

        {
          $unwind: "$doctor",
        },

        {
          $project: {
            _id: 0,

            doctorId: "$doctor._id",
            doctorName: "$doctor.name",
            specialization: "$doctor.specialization",
            experience: "$doctor.experience",
            doctorImage: "$doctor.profileImage",

            totalAppointments: 1,
            completedAppointments: 1,
            cancelledAppointments: 1,
          },
        },

        {
          $sort: {
            totalAppointments: -1,
          },
        },

        {
          $limit: 10,
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Top doctors by appointment count fetched successfully",
        data: topDoctors,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch top doctors by appointments",
        error: error.message,
      });
    }
  },
);

//Specialization-wise total appointments nikalo.

router.get(
  "/admin/analytics/specialization-wise-appointments",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const specializationStats = await Appointment.aggregate([
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },

        {
          $unwind: "$doctor",
        },

        {
          $group: {
            _id: "$doctor.specialization",

            totalAppointments: {
              $sum: 1,
            },

            completedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
              },
            },

            cancelledAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
              },
            },

            totalRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: ["$paymentStatus", "Paid"],
                      },
                      {
                        $eq: ["$status", "Completed"],
                      },
                    ],
                  },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            specialization: "$_id",

            totalAppointments: 1,
            completedAppointments: 1,
            cancelledAppointments: 1,
            totalRevenue: 1,
          },
        },

        {
          $sort: {
            totalAppointments: -1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Specialization-wise analytics fetched successfully",
        data: specializationStats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch specialization analytics",
        error: error.message,
      });
    }
  },
);

//City-wise patient appointment distribution nikalo.

router.get(
  "/admin/analytics/city-wise-patient-appointments",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const cityWiseAppointments = await Appointment.aggregate([
        {
          $lookup: {
            from: "patients",
            localField: "patientId",
            foreignField: "_id",
            as: "patient",
          },
        },
        {
          $unwind: "$patient",
        },
        {
          $group: {
            _id: "$patient.city",

            totalAppointments: { $sum: 1 },

            completedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
              },
            },

            cancelledAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
              },
            },

            missedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Missed"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            city: { $ifNull: ["$_id", "Unknown"] },
            totalAppointments: 1,
            completedAppointments: 1,
            cancelledAppointments: 1,
            missedAppointments: 1,
          },
        },
        {
          $sort: {
            totalAppointments: -1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message:
          "City-wise patient appointment distribution fetched successfully",
        data: cityWiseAppointments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch city-wise patient appointment distribution",
        error: error.message,
      });
    }
  },
);

//City-wise doctor revenue distribution nikalo.
router.get(
  "/admin/analytics/city-wise-doctor-revenue",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const cityWiseDoctorRevenue = await Appointment.aggregate([
        {
          $match: {
            status: "Completed",
            paymentStatus: "Paid",
          },
        },
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },
        {
          $unwind: "$doctor",
        },
        {
          $group: {
            _id: "$doctor.city",

            totalRevenue: {
              $sum: "$totalAmount",
            },

            totalPaidAppointments: {
              $sum: 1,
            },

            uniqueDoctors: {
              $addToSet: "$doctor._id",
            },
          },
        },
        {
          $project: {
            _id: 0,

            city: {
              $cond: [
                { $or: [{ $eq: ["$_id", null] }, { $eq: ["$_id", ""] }] },
                "Unknown",
                "$_id",
              ],
            },

            totalRevenue: 1,
            totalPaidAppointments: 1,

            totalDoctors: {
              $size: "$uniqueDoctors",
            },
          },
        },
        {
          $sort: {
            totalRevenue: -1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "City-wise doctor revenue distribution fetched successfully",
        data: cityWiseDoctorRevenue,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch city-wise doctor revenue distribution",
        error: error.message,
      });
    }
  },
);

router.get(
  "/admin/analytics/daily-appointments-current-month",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const now = new Date();

      // current month start
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // next month start
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );

      const dailyAppointments = await Appointment.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lt: startOfNextMonth,
            },
          },
        },

        // group by day
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
            },

            totalAppointments: {
              $sum: 1,
            },

            completedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
              },
            },

            cancelledAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
              },
            },

            missedAppointments: {
              $sum: {
                $cond: [{ $eq: ["$status", "Missed"] }, 1, 0],
              },
            },
          },
        },

        // sort by day
        {
          $sort: {
            "_id.day": 1,
          },
        },

        // final response
        {
          $project: {
            _id: 0,

            day: "$_id.day",

            label: {
              $concat: ["Day ", { $toString: "$_id.day" }],
            },

            totalAppointments: 1,
            completedAppointments: 1,
            cancelledAppointments: 1,
            missedAppointments: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Daily appointment count fetched successfully",
        data: dailyAppointments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch daily appointment count",
        error: error.message,
      });
    }
  },
);

//Daily revenue for current month nikalo.
router.get(
  "/admin/analytics/daily-revenue-current-month",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const now = new Date();

      // current month start
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // next month start
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );

      const dailyRevenue = await Appointment.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lt: startOfNextMonth,
            },

            status: "Completed",
            paymentStatus: "Paid",
          },
        },

        // group by day
        {
          $group: {
            _id: {
              day: {
                $dayOfMonth: "$createdAt",
              },
            },

            totalRevenue: {
              $sum: "$totalAmount",
            },

            totalAppointments: {
              $sum: 1,
            },
          },
        },

        // sort by day
        {
          $sort: {
            "_id.day": 1,
          },
        },

        // final response
        {
          $project: {
            _id: 0,

            day: "$_id.day",

            label: {
              $concat: ["Day ", { $toString: "$_id.day" }],
            },

            totalRevenue: 1,
            totalAppointments: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Daily revenue fetched successfully",
        data: dailyRevenue,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch daily revenue",
        error: error.message,
      });
    }
  },
);
