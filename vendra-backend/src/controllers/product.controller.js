const asyncHandler = require("../utils/asyncHandler");
const productService = require("../services/product.service");
const view = require("../views/product.view");

const list = asyncHandler(async (req, res) => {
  const result = await productService.listPublic(req.query);
  res.json({
    success: true,
    count: result.products.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    products: result.products.map(view.toPublicListItem),
  });
});

const getOne = asyncHandler(async (req, res) => {
  const { product, redirected } = await productService.getPublic(req.params.idOrSlug);
  // redirected=true یعنی با slug قدیمی آمده‌اند؛ فرانت باید به /products/{product.slug} ریدایرکت کند
  res.json({ success: true, redirected, product: view.toPublic(product) });
});

const categories = asyncHandler(async (req, res) => {
  res.json({ success: true, categories: await productService.listCategories() });
});

const slugs = asyncHandler(async (req, res) => {
  const items = await productService.listSlugs();
  res.json({ success: true, slugs: items.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })) });
});

module.exports = { list, getOne, categories, slugs };
