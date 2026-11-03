const express = require("express");
const ctrl = require("../controllers/settings.controller");

const router = express.Router();

router.get("/", ctrl.publicSettings);

module.exports = router;
