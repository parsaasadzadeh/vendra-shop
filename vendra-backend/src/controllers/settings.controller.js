const asyncHandler = require("../utils/asyncHandler");
const { getShipping } = require("../services/shopSettings.service");

// برای نمایش «هزینه‌ی ارسال» و «تا ارسال رایگان X تومان مانده» در فرانت
const publicSettings = asyncHandler(async (req, res) => {
  const { shippingPrice, freeShippingThreshold } = await getShipping();
  res.json({ success: true, shipping: { price: shippingPrice, freeThreshold: freeShippingThreshold } });
});

module.exports = { publicSettings };
