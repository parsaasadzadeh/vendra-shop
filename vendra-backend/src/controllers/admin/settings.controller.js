const asyncHandler = require("../../utils/asyncHandler");
const service = require("../../services/shopSettings.service");

const get = asyncHandler(async (req, res) => {
  res.json({ success: true, settings: await service.getAdminSettings() });
});

const update = asyncHandler(async (req, res) => {
  const settings = await service.updateShipping(req.body);
  res.json({ success: true, message: "تنظیمات ذخیره شد", settings });
});

module.exports = { get, update };
