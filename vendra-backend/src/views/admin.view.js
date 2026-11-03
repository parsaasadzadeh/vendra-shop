const toAdminProfile = (a) => ({
  id: String(a._id),
  username: a.username,
  lastLoginAt: a.lastLoginAt || null,
});

module.exports = { toAdminProfile };
