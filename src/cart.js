const STORAGE_KEY = "bookshop-cart-v1";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Set(
      Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [],
    );
  } catch {
    return new Set();
  }
}

const cart = readCart();

export function hasBook(id) {
  return cart.has(id);
}

export function getCartCount() {
  return cart.size;
}

export function toggleBook(id) {
  if (cart.has(id)) cart.delete(id);
  else cart.add(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cart]));
  } catch {
    // The cart still works for this session when storage is unavailable.
  }
  return cart.has(id);
}
