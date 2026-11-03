const express = require("express");
const ctrl = require("../controllers/cron.controller");
const cronAuth = require("../middlewares/cronAuth.middleware");

const router = express.Router();

router.get("/release-expired", cronAuth, ctrl.releaseExpired);

module.exports = router;
