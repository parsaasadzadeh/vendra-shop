const express = require("express");
const ctrl = require("../../controllers/admin/order.controller");

const router = express.Router();

router.get("/", ctrl.list);
router.post("/release-expired", ctrl.releaseExpired);
router.get("/:id", ctrl.getOne);
router.patch("/:id/status", ctrl.updateStatus);
router.patch("/:id/payment", ctrl.updatePayment);
router.post("/:id/recheck-payment", ctrl.recheckPayment);

module.exports = router;
