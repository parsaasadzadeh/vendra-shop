const AppError = require("../utils/appError");

const notFound = (req, res, next) => next(new AppError("مسیر پیدا نشد", 404));

module.exports = notFound;
