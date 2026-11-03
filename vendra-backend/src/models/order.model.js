const mongoose = require("mongoose");
const { ORDER_STATUSES, PAYMENT_STATUSES } = require("../constants/order.constants");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, required: true }, // _id زیرمجموعه‌ی variants محصول
    title: { type: String, required: true },
    image: { type: String, default: "" },
    size: { type: String, default: "" },
    colorName: { type: String, default: "" },
    colorCode: { type: String, default: "" },
    sku: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    province: { type: String, required: true },
    city: { type: String, required: true },
    fullAddress: { type: String, required: true },
    plaque: { type: String, required: true },
    unit: { type: String, default: "" },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // شماره‌ی خوانا برای مشتری و ادمین
    orderNumber: { type: String, required: true, unique: true },
    // کد غیرقابل حدس؛ تنها «کلید» دسترسی مشتری مهمان به سفارش خودش است
    trackingToken: { type: String, required: true, unique: true },

    customer: { type: customerSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    note: { type: String, default: "" },

    items: { type: [orderItemSchema], required: true, default: [] },
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    paymentGateway: {
      name: { type: String, default: "" },
      trackId: { type: String, default: "" }, // آخرین تراکنش
      trackIds: { type: [String], default: [] }, // همه‌ی تراکنش‌های شروع‌شده برای این سفارش
      paidTrackId: { type: String, default: "" }, // تراکنشی که واقعاً پرداخت شده
      refNumber: { type: String, default: "" },
    },
    // true یعنی پول گرفته شده ولی سفارش فعال نیست؛ ادمین باید برگشت وجه بدهد
    refundRequired: { type: Boolean, default: false },

    orderStatus: { type: String, enum: ORDER_STATUSES, default: "pending" },
    trackingCode: { type: String, default: "" }, // کد رهگیری پست
    // true یعنی موجودی این سفارش از انبار کم (رزرو) شده است
    stockDeducted: { type: Boolean, default: false },
    cancelReason: { type: String, default: "" }, // customer | admin | expired
    paidAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ "customer.phone": 1, createdAt: -1 });
orderSchema.index({ "paymentGateway.trackIds": 1 });
orderSchema.index({ refundRequired: 1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
