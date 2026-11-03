const asyncHandler = require("../utils/asyncHandler");
const { releaseExpiredOrders } = require("../services/order.service");

const releaseExpired = asyncHandler(async (req, res) => {
  const released = await releaseExpiredOrders();
  res.json({ success: true, released });
});

module.exports = { releaseExpired };
