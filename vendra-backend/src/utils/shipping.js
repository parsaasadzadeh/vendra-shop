/*
  هزینه‌ی ارسال (تومان):
   - سبد خالی → ۰
   - freeShippingThreshold > 0 و جمع کالاها به آن رسیده → ارسال رایگان
   - freeShippingThreshold = 0 یعنی «ارسال رایگان نداریم»
   - shippingPrice = 0 یعنی همه‌ی سفارش‌ها رایگان ارسال می‌شوند
*/
const calcShipping = (itemsPrice, { shippingPrice, freeShippingThreshold }) => {
  if (!(itemsPrice > 0)) return 0;
  if (freeShippingThreshold > 0 && itemsPrice >= freeShippingThreshold) return 0;
  return shippingPrice;
};

module.exports = { calcShipping };
