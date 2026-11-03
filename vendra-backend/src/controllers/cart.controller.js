const asyncHandler = require("../utils/asyncHandler");
const { resolveCart } = require("../services/cart.service");

// سبد خرید سمت مرورگر نگه‌داری می‌شود؛ این endpoint قیمت و موجودی واقعی را به فرانت می‌دهد
const quote = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req.body && req.body.items);
  res.json({ success: true, ...cart });
});

module.exports = { quote };
