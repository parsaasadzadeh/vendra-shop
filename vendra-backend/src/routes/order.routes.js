const express = require("express");
const ctrl = require("../controllers/order.controller");
const {
  checkoutIpLimiter,
  checkoutPhoneLimiter,
  lookupIpLimiter,
  lookupPhoneLimiter,
} = require("../middlewares/dbRateLimit.middleware");

const router = express.Router();

// خرید مهمان (بدون ورود)
router.post("/", checkoutIpLimiter, checkoutPhoneLimiter, ctrl.create);
// پیگیری با شماره سفارش + موبایل
router.post("/lookup", lookupIpLimiter, lookupPhoneLimiter, ctrl.lookup);
// دسترسی با کد غیرقابل حدس سفارش
router.get("/track/:token", ctrl.track);
router.post("/track/:token/cancel", ctrl.cancel);

module.exports = router;
