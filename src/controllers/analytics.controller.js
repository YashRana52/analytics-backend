import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import OrderItem from "../models/orderItem.model.js";
import Payment from "../models/payment.model.js";
import Refund from "../models/refund.model.js";
import Inventory from "../models/inventory.model.js";
import { getDateFilter } from "../utils/dateFilter.js";

// 1. Full Dashboard Summary API
export async function getDashboardAnalytics(req, res) {
  try {
    const dateFilter = getDateFilter(req.query);

    const [
      revenueStats,
      totalOrders,
      totalUsers,
      revenueChart,
      topProducts,
      topCustomers,
      categorySales,
      cityOrders,
      failedPayments,
      refundStats,
      lowStockProducts,
    ] = await Promise.all([
      getRevenueStatsData(dateFilter),
      Order.countDocuments(dateFilter),
      User.countDocuments(),
      getRevenueChartData(req.query),
      getTopProductsData(dateFilter),
      getTopCustomersData(dateFilter),
      getCategorySalesData(dateFilter),
      getCityOrdersData(dateFilter),
      getFailedPaymentsData(dateFilter),
      getRefundStatsData(dateFilter),
      getLowStockProductsData(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard analytics fetched successfully",

      data: {
        totalRevenue: revenueStats.totalRevenue,
        averageOrderValue: revenueStats.averageOrderValue,
        totalOrders,
        totalUsers,
        revenueChart,
        topProducts,
        topCustomers,
        categoryWiseSales: categorySales,
        cityWiseOrders: cityOrders,
        failedPayments,
        refundRate: refundStats,
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
}

// Revenue + AOV Helper
async function getRevenueStatsData(dateFilter) {
  const result = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
        paymentStatus: "success",
        status: { $in: ["confirmed", "delivered"] },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalOrders: 1,
        averageOrderValue: {
          $cond: [
            {
              $eq: ["$totalOrders", 0],
            },
            0,
            {
              $divide: ["$totalRevenue", "$totalOrders"],
            },
          ],
        },
      },
    },
  ]);
  return (
    result[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
    }
  );
}

// Daily / Monthly Revenue Chart
async function getRevenueChartData(query) {
  const { type = "daily" } = query;
  const dateFilter = getDateFilter(query);
  let groupFormat;

  if (type === "monthly") {
    groupFormat = "%Y-%m";
  } else {
    groupFormat = "%Y-%m-%d";
  }

  const result = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
        paymentStatus: "success",
        status: { $in: ["confirmed", "delivered"] },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            formate: groupFormat,
            date: "$createdAt",
          },
        },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },

    {
      $project: {
        _id: 0,
        date: "$_id",
        revenue: 1,
        orders: 1,
      },
    },
  ]);
  return result;
}

// Top Products
async function getTopProductsData(dateFilter) {
  const result = await OrderItem.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },

    {
      $unwind: "$order",
    },

    {
      $match: {
        "order.paymentStatus": "success",
        "order.status": { $in: ["confirmed", "delivered"] },
        ...(dateFilter.createdAt && {
          "order.createdAt": dateFilter.createdAt,
        }),
      },
    },

    {
      $group: {
        _id: "$productId",
        totalQuantitySold: { $sum: "$quantity" },
        totalRevenue: { $sum: "$total" },
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

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: "$product.name",
        category: "$product.category",
        totalQuantitySold: 1,
        totalRevenue: 1,
      },
    },
  ]);

  return result;
}

// Top Customers
async function getTopCustomersData(dateFilter) {
  const result = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
        paymentStatus: "success",
        status: { $in: ["confirmed", "delivered"] },
      },
    },

    {
      $group: {
        _id: "$userId",
        totalSpent: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
      },
    },

    {
      $sort: {
        totalSpent: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },

    {
      $unwind: "$user",
    },

    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: "$user.name",
        email: "$user.email",
        city: "$user.city",
        totalSpent: 1,
        totalOrders: 1,
      },
    },
  ]);

  return result;
}

// Category-wise Sales

async function getCategorySalesData(dateFilter) {
  const result = await OrderItem.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    {
      $unwind: "$order",
    },
    {
      $match: {
        "order.paymentStatus": "success",
        "order.status": { $in: ["confirmed", "delivered"] },
        ...(dateFilter.createdAt && {
          "order.createdAt": dateFilter.createdAt,
        }),
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },
    {
      $group: {
        _id: "$product.category",
        totalRevenue: { $sum: "$total" },
        totalQuantitySold: { $sum: "$quantity" },
      },
    },

    {
      $sort: {
        totalRevenue: -1,
      },
    },

    {
      $project: {
        _id: 0,
        category: "$_id",
        totalRevenue: 1,
        totalQuantitySold: 1,
      },
    },
  ]);

  return result;
}

// City-wise Orders

async function getCityOrdersData(dateFilter) {
  const result = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
      },
    },

    {
      $group: {
        _id: "$city",
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "success"] }, "$totalAmount", 0],
          },
        },
      },
    },

    {
      $sort: {
        totalOrders: -1,
      },
    },

    {
      $project: {
        _id: 0,
        city: "$_id",
        totalOrders: 1,
        totalRevenue: 1,
      },
    },
  ]);

  return result;
}

// Failed Payments

async function getFailedPaymentsData(dateFilter) {
  const result = await Payment.aggregate([
    {
      $match: {
        ...dateFilter,
        status: "failed",
      },
    },

    {
      $group: {
        _id: "$failureReason",
        failedCount: { $sum: 1 },
        failedAmount: { $sum: "$amount" },
      },
    },

    {
      $sort: {
        failedCount: -1,
      },
    },

    {
      $project: {
        _id: 0,
        reason: {
          $ifNull: ["$_id", "Unknown reason"],
        },
        failedCount: 1,
        failedAmount: 1,
      },
    },
  ]);

  return result;
}

// Return / Refund Rate

async function getRefundStatsData(dateFilter) {
  const totalOrders = await Order.countDocuments(dateFilter);
  const returnedOrders = await Order.countDocuments({
    ...dateFilter,
    status: "returned",
  });

  const successfulRefunds = await Refund.countDocuments({
    ...dateFilter,
    status: "success",
  });

  const refundAmountResult = await Refund.aggregate([
    {
      $match: {
        ...dateFilter,
        status: "success",
      },
    },
    {
      $group: {
        _id: null,
        totalRefundAmount: { $sum: "$amount" },
      },
    },
  ]);
  const refundRate =
    totalOrders === 0 ? 0 : (returnedOrders / totalOrders) * 100;

  return {
    totalOrders,
    returnedOrders,
    successfulRefunds,
    refundRate: Number(refundRate.toFixed(2)),
    totalRefundAmount: refundAmountResult[0]?.totalRefundAmount || 0,
  };
}

// Low Stock Products
async function getLowStockProductsData() {
  const result = await Inventory.aggregate([
    {
      $match: {
        $expr: {
          $lte: ["$stock", "$lowStockThreshold"],
        },
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $project: {
        _id: 0,
        productId: "$productId",
        name: "$product.name",
        category: "$product.category",
        stock: 1,
        lowStockThreshold: 1,
      },
    },

    {
      $sort: {
        stock: 1,
      },
    },
  ]);

  return result;
}

export async function getRevenueStats(req, res) {
  const dateFilter = getDateFilter(req.query);
  const data = await getRevenueStatsData(dateFilter);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getRevenueChart(req, res) {
  const data = await getRevenueChartData(req.query);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getTopProducts(req, res) {
  const dateFilter = getDateFilter(req.query);
  const data = await getTopProductsData(dateFilter);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getTopCustomers(req, res) {
  const dateFilter = getDateFilter(req.query);
  const data = await getTopCustomersData(dateFilter);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getCategorySales(req, res) {
  const dateFilter = getDateFilter(req.query);
  const data = await getCategorySalesData(dateFilter);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getCityOrders(req, res) {
  const dateFilter = getDateFilter(req.query);
  const data = await getCityOrdersData(dateFilter);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getFailedPayments(req, res) {
  const dateFilter = getDateFilter(req.query);
  const data = await getFailedPaymentsData(dateFilter);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getRefundStats(req, res) {
  const dateFilter = getDateFilter(req.query);
  const data = await getRefundStatsData(dateFilter);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getLowStockProducts(req, res) {
  const data = await getLowStockProductsData();

  res.status(200).json({
    success: true,
    data,
  });
}
