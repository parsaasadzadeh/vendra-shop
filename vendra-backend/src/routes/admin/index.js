const express = require("express");
const noStore = require("../../middlewares/noStore.middleware");
const adminIpAllowlist = require("../../middlewares/adminIpAllowlist.middleware");
const adminAuth = require("../../middlewares/adminAuth.middleware");

const router = express.Router();

// همه‌ی مسیرهای ادمین: بدون کش، (اختیاری) فقط IPهای مجاز
router.use(noStore, adminIpAllowlist);

// ورود/خروج (login عمومی است؛ بقیه‌ی مسیرهای auth خودشان adminAuth دارند)
router.use("/auth", require("./auth.routes"));

// از اینجا به بعد فقط ادمین واردشده
router.use(adminAuth);
router.use("/products", require("./product.routes"));
router.use("/orders", require("./order.routes"));
router.use("/settings", require("./settings.routes"));

module.exports = router;
