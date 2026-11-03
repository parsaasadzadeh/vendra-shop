const express = require("express");
const ctrl = require("../controllers/cart.controller");

const router = express.Router();

router.post("/quote", ctrl.quote);

module.exports = router;
