const express = require("express");
const ctrl = require("../../controllers/admin/product.controller");
const upload = require("../../middlewares/upload.middleware");
const settings = require("../../config/settings");

const router = express.Router();
const images = upload.array("images", settings.maxImagesPerProduct);

router.get("/", ctrl.list);
router.post("/", images, ctrl.create);
router.get("/:id", ctrl.getOne);
router.patch("/:id", images, ctrl.update);
router.delete("/:id", ctrl.remove);
router.patch("/:id/delete-image", ctrl.deleteImage);

// سایز/رنگ و موجودی
router.post("/:id/variants", ctrl.addVariant);
router.patch("/:id/variants/:variantId", ctrl.updateVariant);
router.delete("/:id/variants/:variantId", ctrl.removeVariant);

module.exports = router;
