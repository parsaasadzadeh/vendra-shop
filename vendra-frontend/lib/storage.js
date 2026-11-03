const ORDERS_KEY = "vendra_orders_v1";
const CUSTOMER_KEY = "vendra_customer_v1";

const read = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* حالت خصوصی/پر بودن حافظه */
  }
};

export const getSavedOrders = () => (typeof window === "undefined" ? [] : read(ORDERS_KEY, []));
export const saveOrder = ({ orderNumber, token, totalPrice }) => {
  const list = getSavedOrders().filter((o) => o.token !== token);
  list.unshift({ orderNumber, token, totalPrice, createdAt: new Date().toISOString() });
  write(ORDERS_KEY, list.slice(0, 15));
};
export const removeSavedOrder = (token) => write(ORDERS_KEY, getSavedOrders().filter((o) => o.token !== token));

export const getSavedCustomer = () => (typeof window === "undefined" ? null : read(CUSTOMER_KEY, null));
export const saveCustomer = (data) => write(CUSTOMER_KEY, data);
