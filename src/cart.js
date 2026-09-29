const STORAGE_KEY = "bookshop-cart-v1";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return new Map();
    return new Map(
      saved
        .map((item) => (typeof item === "string" ? { id: item } : item))
        .filter((item) => item && typeof item.id === "string")
        .map((item) => [item.id, item]),
    );
  } catch {
    return new Map();
  }
}

const cart = readCart();

export function hasBook(id) {
  return cart.has(id);
}

export function getCartCount() {
  return cart.size;
}

export function toggleBook(book) {
  if (cart.has(book.id)) cart.delete(book.id);
  else {
    cart.set(book.id, {
      id: book.id,
      title: book.volumeInfo?.title || "Untitled",
      authors: book.volumeInfo?.authors || [],
      thumbnail:
        book.volumeInfo?.imageLinks?.thumbnail ||
        book.volumeInfo?.imageLinks?.smallThumbnail ||
        null,
      price: book.saleInfo?.retailPrice || book.saleInfo?.listPrice || null,
    });
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cart.values()]));
  } catch {
    // The cart still works for this session when storage is unavailable.
  }
  return cart.has(book.id);
}
