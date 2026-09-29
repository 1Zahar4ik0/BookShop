import { fetchBooks, PAGE_SIZE } from "./api";
import { getCartCount, hasBook, toggleBook } from "./cart";

const CATEGORIES = [
  ["Architecture", "Architecture"],
  ["Art & Fashion", "Art"],
  ["Biography", "Biography"],
  ["Business", "Business"],
  ["Crafts & Hobbies", "Crafts"],
  ["Drama", "Drama"],
  ["Fiction", "Fiction"],
  ["Food & Drink", "Cooking"],
  ["Health & Wellbeing", "Health"],
  ["History & Politics", "History"],
  ["Humor", "Humor"],
  ["Poetry", "Poetry"],
  ["Psychology", "Psychology"],
  ["Science", "Science"],
  ["Technology", "Technology"],
  ["Travel & Maps", "Travel"],
];

const categoryList = document.getElementById("category-list");
const grid = document.getElementById("book-grid");
const status = document.getElementById("books-status");
const loadMore = document.getElementById("load-more");
const cartCount = document.getElementById("cart-count");

let category = CATEGORIES[0][1];
let startIndex = 0;
let totalItems = 0;
let pending = false;
let controller;
let requestVersion = 0;

function updateCartCount() {
  const count = getCartCount();
  cartCount.textContent = String(count);
  cartCount.hidden = count === 0;
  cartCount.parentElement.setAttribute("aria-label", `Cart, ${count} books`);
}

function placeholder(title) {
  const cover = document.createElement("div");
  cover.className = "cover-placeholder";
  cover.innerHTML =
    "<span>BOOKSHOP</span><strong></strong><small>Discover a new story</small>";
  cover.querySelector("strong").textContent = title || "Untitled";
  return cover;
}

function formatPrice(saleInfo) {
  const price = saleInfo?.retailPrice || saleInfo?.listPrice;
  if (!price || typeof price.amount !== "number") return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currencyCode || "USD",
    }).format(price.amount);
  } catch {
    return `${price.amount} ${price.currencyCode || ""}`.trim();
  }
}

function createBookCard(book) {
  const info = book.volumeInfo || {};
  const card = document.createElement("article");
  card.className = "book-card";

  const coverWrap = document.createElement("div");
  coverWrap.className = "book-cover-wrap";
  const thumbnail =
    info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
  if (thumbnail) {
    const image = document.createElement("img");
    image.src = thumbnail
      .replace(/^http:/, "https:")
      .replace(/zoom=1/, "zoom=2");
    image.alt = `Cover of ${info.title || "book"}`;
    image.loading = "lazy";
    image.addEventListener(
      "error",
      () => image.replaceWith(placeholder(info.title)),
      { once: true },
    );
    coverWrap.append(image);
  } else coverWrap.append(placeholder(info.title));

  const details = document.createElement("div");
  details.className = "book-details";
  const authors = document.createElement("p");
  authors.className = "book-authors";
  authors.textContent = info.authors?.join(", ") || "Unknown author";
  const title = document.createElement("h3");
  title.className = "book-title";
  title.textContent = info.title || "Untitled";
  details.append(authors, title);

  if (typeof info.averageRating === "number") {
    const rating = document.createElement("p");
    rating.className = "book-rating";
    const stars = document.createElement("span");
    stars.className = "stars";
    stars.textContent = `${"★".repeat(Math.round(info.averageRating))}${"☆".repeat(5 - Math.round(info.averageRating))}`;
    stars.setAttribute("aria-label", `${info.averageRating} out of 5 stars`);
    rating.append(stars);
    if (typeof info.ratingsCount === "number") {
      const count = document.createElement("span");
      count.textContent = `${info.ratingsCount} reviews`;
      rating.append(count);
    }
    details.append(rating);
  }

  const description = document.createElement("p");
  description.className = "book-description";
  description.textContent =
    info.description
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Open this book to discover more.";
  details.append(description);

  const price = formatPrice(book.saleInfo);
  if (price) {
    const priceLine = document.createElement("p");
    priceLine.className = "book-price";
    priceLine.textContent = price;
    details.append(priceLine);
  }

  const buy = document.createElement("button");
  buy.className = "buy-button";
  buy.type = "button";
  function updateBuy() {
    const selected = hasBook(book.id);
    buy.classList.toggle("in-cart", selected);
    buy.textContent = selected ? "In the cart" : "Buy now";
    buy.setAttribute("aria-pressed", String(selected));
  }
  buy.addEventListener("click", () => {
    toggleBook(book);
    updateBuy();
    updateCartCount();
  });
  updateBuy();
  details.append(buy);
  card.append(coverWrap, details);
  return card;
}

function renderCategories() {
  const fragment = document.createDocumentFragment();
  CATEGORIES.forEach(([label, value]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";
    button.textContent = label;
    button.dataset.category = value;
    button.addEventListener("click", () => selectCategory(value));
    fragment.append(button);
  });
  categoryList.append(fragment);
  updateActiveCategory();
}

function updateActiveCategory() {
  categoryList.querySelectorAll("button").forEach((button) => {
    const active = button.dataset.category === category;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

async function loadBooks() {
  if (pending) return;
  pending = true;
  const version = requestVersion;
  const requestedIndex = startIndex;
  controller = new AbortController();
  loadMore.hidden = true;
  status.textContent =
    requestedIndex === 0 ? "Loading books…" : "Loading more books…";
  try {
    const result = await fetchBooks(
      category,
      requestedIndex,
      controller.signal,
    );
    if (version !== requestVersion) return;
    const fragment = document.createDocumentFragment();
    result.items.forEach((book) => fragment.append(createBookCard(book)));
    grid.append(fragment);
    startIndex += result.items.length;
    totalItems = result.totalItems;
    status.textContent =
      result.items.length === 0 && requestedIndex === 0
        ? "No books found in this category."
        : "";
    loadMore.innerHTML = 'Load more <span aria-hidden="true">→</span>';
    loadMore.hidden =
      result.items.length < PAGE_SIZE || startIndex >= totalItems;
  } catch (error) {
    if (error.name === "AbortError" || version !== requestVersion) return;
    status.textContent = error.message.includes("429")
      ? "The book service is busy right now. Please try again later."
      : "Could not load books. Please try again.";
    loadMore.textContent = "Try again";
    loadMore.hidden = false;
  } finally {
    if (version === requestVersion) pending = false;
  }
}

function selectCategory(nextCategory) {
  if (nextCategory === category) return;
  controller?.abort();
  requestVersion += 1;
  pending = false;
  category = nextCategory;
  startIndex = 0;
  totalItems = 0;
  grid.replaceChildren();
  loadMore.textContent = "Load more →";
  updateActiveCategory();
  loadBooks();
}

export function initCatalog() {
  renderCategories();
  updateCartCount();
  loadMore.addEventListener("click", loadBooks);
  loadBooks();
}
