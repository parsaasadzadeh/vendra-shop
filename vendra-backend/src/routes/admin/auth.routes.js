const express = require("express");
const ctrl = require("../../controllers/admin/auth.controller");
const adminAuth = require("../../middlewares/adminAuth.middleware");
const { adminLoginIpLimiter, adminLoginUserLimiter } = require("../../middlewares/dbRateLimit.middleware");

const router = express.Router();

router.post("/login", adminLoginIpLimiter, adminLoginUserLimiter, ctrl.login);

router.get("/me", adminAuth, ctrl.me);
router.post("/logout", adminAuth, ctrl.logout);
router.patch("/password", adminAuth, ctrl.changePassword);

module.exports = router;
