const settings = require("../config/settings");

const itemView = (i) => ({
  productId: String(i.product),
  variantId: String(i.variant),
  title: i.title,
  image: i.image,
  size: i.size,
  colorName: i.colorName,
  colorCode: i.colorCode,
  quantity: i.quantity,
  price: i.price,
  totalPrice: i.totalPrice,
});

const expiresAtOf = (o) =>
  new Date(new Date(o.createdAt).getTime() + settings.orderExpireMinutes * 60 * 1000);

const isPayable = (o) => o.orderStatus === "pending" && o.paymentStatus !== "paid" && o.paymentStatus !== "refunded";

// نمای مشتری مهمان. trackingToken فقط هنگام ثبت سفارش برگردانده می‌شود (includeToken)
const toPublic = (o, { includeToken = false } = {}) => ({
  orderNumber: o.orderNumber,
  ...(includeToken ? { trackingToken: o.trackingToken } : {}),
  orderStatus: o.orderStatus,
  paymentStatus: o.paymentStatus,
  trackingCode: o.trackingCode,
  customer: { fullName: o.customer.fullName, phone: o.customer.phone },
  shippingAddress: o.shippingAddress.toObject ? o.shippingAddress.toObject() : o.shippingAddress,
  note: o.note,
  items: o.items.map(itemView),
  itemsPrice: o.itemsPrice,
  shippingPrice: o.shippingPrice,
  totalPrice: o.totalPrice,
  canPay: isPayable(o),
  canCancel: o.orderStatus === "pending" && o.paymentStatus !== "paid",
  expiresAt: isPayable(o) ? expiresAtOf(o) : null,
  createdAt: o.createdAt,
  paidAt: o.paidAt || null,
  deliveredAt: o.deliveredAt || null,
});

const toAdmin = (o) => ({
  id: String(o._id),
  orderNumber: o.orderNumber,
  orderStatus: o.orderStatus,
  paymentStatus: o.paymentStatus,
  refundRequired: o.refundRequired,
  cancelReason: o.cancelReason,
  stockDeducted: o.stockDeducted,
  trackingCode: o.trackingCode,
  customer: { fullName: o.customer.fullName, phone: o.customer.phone },
  shippingAddress: o.shippingAddress.toObject ? o.shippingAddress.toObject() : o.shippingAddress,
  note: o.note,
  items: o.items.map(itemView),
  itemsPrice: o.itemsPrice,
  shippingPrice: o.shippingPrice,
  totalPrice: o.totalPrice,
  paymentGateway: {
    name: o.paymentGateway?.name || "",
    trackIds: o.paymentGateway?.trackIds || [],
    paidTrackId: o.paymentGateway?.paidTrackId || "",
    refNumber: o.paymentGateway?.refNumber || "",
  },
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
  paidAt: o.paidAt || null,
  deliveredAt: o.deliveredAt || null,
});

module.exports = { toPublic, toAdmin };
