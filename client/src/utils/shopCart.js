const SHOP_CART_KEY = "opwShopCart";
const SHOP_CART_EVENT = "opw-shop-cart-updated";

const emitCartUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SHOP_CART_EVENT));
  }
};

export const getShopCart = () => {
  try {
    const rawValue = localStorage.getItem(SHOP_CART_KEY);
    const items = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(items) ? items : [];
  } catch (_) {
    localStorage.removeItem(SHOP_CART_KEY);
    return [];
  }
};

export const saveShopCart = (items) => {
  localStorage.setItem(SHOP_CART_KEY, JSON.stringify(Array.isArray(items) ? items : []));
  emitCartUpdate();
};

export const clearShopCart = () => {
  localStorage.removeItem(SHOP_CART_KEY);
  emitCartUpdate();
};

export const addToShopCart = (product, quantity = 1) => {
  const currentItems = getShopCart();
  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const existingItem = currentItems.find((item) => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += normalizedQuantity;
    saveShopCart(currentItems);
    return currentItems;
  }

  const nextItems = [
    ...currentItems,
    {
      productId: product.id,
      name: product.name || "",
      price: Number(product.price || 0),
      imageUrl: product.imageUrl || "",
      quantity: normalizedQuantity,
    },
  ];

  saveShopCart(nextItems);
  return nextItems;
};

export const updateShopCartQuantity = (productId, quantity) => {
  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const nextItems = getShopCart().map((item) =>
    item.productId === productId ? { ...item, quantity: normalizedQuantity } : item
  );
  saveShopCart(nextItems);
  return nextItems;
};

export const removeFromShopCart = (productId) => {
  const nextItems = getShopCart().filter((item) => item.productId !== productId);
  saveShopCart(nextItems);
  return nextItems;
};

export const getShopCartItemCount = () =>
  getShopCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);

export const getShopCartEventName = () => SHOP_CART_EVENT;
