GET /api/analytics/dashboard

GET /api/analytics/revenue
GET /api/analytics/revenue-chart?type=daily
GET /api/analytics/revenue-chart?type=monthly

GET /api/analytics/top-products
GET /api/analytics/top-customers
GET /api/analytics/category-sales
GET /api/analytics/city-orders
GET /api/analytics/failed-payments
GET /api/analytics/refund-rate
GET /api/analytics/low-stock

{
"success": true,
"data": {
"totalRevenue": 250000,
"averageOrderValue": 1250,
"totalOrders": 200,
"totalUsers": 1200,
"revenueChart": [
{
"date": "2026-01-01",
"revenue": 15000,
"orders": 12
}
],
"topProducts": [],
"topCustomers": [],
"categoryWiseSales": [],
"cityWiseOrders": [],
"failedPayments": [],
"refundRate": {
"totalOrders": 200,
"returnedOrders": 8,
"successfulRefunds": 6,
"refundRate": 4,
"totalRefundAmount": 7000
},
"lowStockProducts": []
}
}
