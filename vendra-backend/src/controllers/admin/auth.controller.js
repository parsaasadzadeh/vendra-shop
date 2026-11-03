const asyncHandler = require("../../utils/asyncHandler");
const authService = require("../../services/adminAuth.service");
const view = require("../../views/admin.view");

const login = asyncHandler(async (req, res) => {
  const { admin, token } = await authService.login(req.body || {});
  res.json({ success: true, token, admin: view.toAdminProfile(admin) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: view.toAdminProfile(req.admin) });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.admin._id);
  res.json({ success: true, message: "از همه‌ی دستگاه‌ها خارج شدید" });
});

const changePassword = asyncHandler(async (req, res) => {
  const { admin, token } = await authService.changePassword(req.admin._id, req.body || {});
  res.json({ success: true, message: "رمز عبور تغییر کرد", token, admin: view.toAdminProfile(admin) });
});

module.exports = { login, me, logout, changePassword };
