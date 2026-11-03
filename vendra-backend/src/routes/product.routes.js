const express = require("express");
const ctrl = require("../controllers/product.controller");
const publicCache = require("../middlewares/publicCache.middleware");

const router = express.Router();

router.use(publicCache(30));

router.get("/", ctrl.list);
router.get("/categories", ctrl.categories);
router.get("/slugs", ctrl.slugs); // برای sitemap
router.get("/:idOrSlug", ctrl.getOne); // slug یا id

module.exports = router;
