const jwt = require("jsonwebtoken");
const settings = require("../config/settings");
const { generateTrackingToken, generateOrderNumber } = require("./tokens.pure");

const signAdminToken = (admin) =>
  jwt.sign({ tv: admin.tokenVersion }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: settings.admin.jwtExpiresIn,
    issuer: settings.admin.jwtIssuer,
    audience: settings.admin.jwtAudience,
    subject: String(admin._id),
  });

const verifyAdminToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: settings.admin.jwtIssuer,
    audience: settings.admin.jwtAudience,
  });

module.exports = { signAdminToken, verifyAdminToken, generateTrackingToken, generateOrderNumber };
