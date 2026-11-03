const asyncHandler = require("../../utils/asyncHandler");
const productService = require("../../services/product.service");
const view = require("../../views/product.view");

const list = asyncHandler(async (req, res) => {
  const result = await productService.listAdmin(req.query);
  res.json({
    success: true,
    count: result.products.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    products: result.products.map(view.toAdmin),
  });
});

const getOne = asyncHandler(async (req, res) => {
  res.json({ success: true, product: view.toAdmin(await productService.getAdmin(req.params.id)) });
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files || []);
  res.status(201).json({ success: true, message: "محصول ایجاد شد", product: view.toAdmin(product) });
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.files || []);
  res.json({ success: true, message: "محصول بروزرسانی شد", product: view.toAdmin(product) });
});

const remove = asyncHandler(async (req, res) => {
  const { archived } = await productService.deleteProduct(req.params.id);
  res.json({
    success: true,
    archived,
    message: archived ? "این محصول در سفارش‌ها استفاده شده بود؛ حذف نشد و فقط پنهان (آرشیو) شد" : "محصول حذف شد",
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const product = await productService.deleteImage(req.params.id, req.body && req.body.imageUrl);
  res.json({ success: true, message: "عکس حذف شد", product: view.toAdmin(product) });
});

const addVariant = asyncHandler(async (req, res) => {
  const product = await productService.addVariant(req.params.id, req.body);
  res.status(201).json({ success: true, message: "سایز/رنگ اضافه شد", product: view.toAdmin(product) });
});

const updateVariant = asyncHandler(async (req, res) => {
  const product = await productService.updateVariant(req.params.id, req.params.variantId, req.body);
  res.json({ success: true, message: "سایز/رنگ بروزرسانی شد", product: view.toAdmin(product) });
});

const removeVariant = asyncHandler(async (req, res) => {
  const product = await productService.removeVariant(req.params.id, req.params.variantId);
  res.json({ success: true, message: "سایز/رنگ حذف شد", product: view.toAdmin(product) });
});

module.exports = { list, getOne, create, update, remove, deleteImage, addVariant, updateVariant, removeVariant };
