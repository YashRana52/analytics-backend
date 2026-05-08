import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";

import {
  getDashboardAnalytics,
  getRevenueStats,
  getRevenueChart,
  getTopProducts,
  getTopCustomers,
  getCategorySales,
  getCityOrders,
  getFailedPayments,
  getRefundStats,
  getLowStockProducts,
} from "../controllers/analytics.controller.js";

const router = express.Router();

// Saari analytics APIs admin protected hongi
router.use(protect);
router.use(adminOnly);

// Main dashboard API
router.get("/dashboard", getDashboardAnalytics);

// Separate APIs
router.get("/revenue", getRevenueStats);
router.get("/revenue-chart", getRevenueChart);
router.get("/top-products", getTopProducts);
router.get("/top-customers", getTopCustomers);
router.get("/category-sales", getCategorySales);
router.get("/city-orders", getCityOrders);
router.get("/failed-payments", getFailedPayments);
router.get("/refund-rate", getRefundStats);
router.get("/low-stock", getLowStockProducts);

export default router;
