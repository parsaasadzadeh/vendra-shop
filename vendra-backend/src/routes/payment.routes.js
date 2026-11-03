const express = require("express");
const ctrl = require("../controllers/payment.controller");
const { paymentIpLimiter } = require("../middlewares/dbRateLimit.middleware");

const router = express.Router();

router.post("/zibal/request", paymentIpLimiter, ctrl.request);
router.get("/zibal/callback", ctrl.zibalCallback);

module.exports = router;
