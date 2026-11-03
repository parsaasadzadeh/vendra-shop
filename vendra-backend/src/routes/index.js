const express = require("express");

const router = express.Router();

router.use("/products", require("./product.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/cart", require("./cart.routes"));
router.use("/orders", require("./order.routes"));
router.use("/payments", require("./payment.routes"));
router.use("/cron", require("./cron.routes"));
router.use("/admin", require("./admin"));

module.exports = router;
