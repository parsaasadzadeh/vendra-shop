const express = require("express");
const ctrl = require("../../controllers/admin/settings.controller");

const router = express.Router();

router.get("/", ctrl.get);
router.patch("/", ctrl.update);

module.exports = router;
