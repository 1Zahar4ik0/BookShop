const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");
const { JSDOM } = require("jsdom");

const root = join(__dirname, "..", "dist");
const html = readFileSync(join(root, "index.html"), "utf8");
const bundleName = readdirSync(join(root, "assets")).find((name) => name.endsWith(".js"));
const bundle = readFileSync(join(root, "assets", bundleName), "utf8");

function makeBook(category, index) {
  return {
    id: `${category}-${index}`,
    volumeInfo: {
      title: `${category} book ${index}`,
      authors: ["Author One", "Author Two"],
      ...(index === 0 ? { averageRating: 4.2, ratingsCount: 12 } : {}),
      description: "A description of this book for the catalog.",
    },
    saleInfo: index === 0 ? { retailPrice: { amount: 12.5, currencyCode: "USD" } } : {},
  };
}

async function createApp(savedCart) {
  const dom = new JSDOM(html, {
    url: "http://localhost:3000/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  const requests = [];
  const intervals = [];
  if (savedCart) window.localStorage.setItem("bookshop-cart-v1", savedCart);
  window.setInterval = (callback, delay) => {
    intervals.push({ callback, delay });
    return intervals.length;
  };
  window.clearInterval = () => {};
  window.fetch = async (input) => {
    const url = new URL(input);
    const category = url.searchParams.get("q").replace("subject:", "");
    const start = Number(url.searchParams.get("startIndex"));
    const size = Number(url.searchParams.get("maxResults"));
    requests.push({ category, start, size });
    const books = Array.from({ length: category === "Business" ? 6 : 14 }, (_, i) =>
      makeBook(category, i),
    );
    return { ok: true, json: async () => ({ items: books.slice(start, start + size), totalItems: books.length }) };
  };
  window.eval(bundle);
  await new Promise(setImmediate);
  return { dom, window, requests, intervals };
}

test("catalog pagination, category switch, slider, and persistent cart", async () => {
  const { dom, window, requests, intervals } = await createApp();
  const { document, localStorage } = window;

  assert.deepEqual(requests[0], { category: "Architecture", start: 0, size: 6 });
  assert.equal(document.querySelectorAll(".book-card").length, 6);
  assert.equal(document.querySelector(".book-card .book-authors").textContent, "Author One, Author Two");
  assert.equal(document.querySelector(".book-card .book-price").textContent, "$12.50");
  assert.equal(document.querySelectorAll(".book-card .book-rating").length, 1);
  assert.ok(document.querySelector(".book-card .cover-placeholder"));

  document.getElementById("load-more").click();
  await new Promise(setImmediate);
  assert.deepEqual(requests[1], { category: "Architecture", start: 6, size: 6 });
  assert.equal(document.querySelectorAll(".book-card").length, 12);
  document.getElementById("load-more").click();
  await new Promise(setImmediate);
  assert.deepEqual(requests[2], { category: "Architecture", start: 12, size: 6 });
  assert.equal(document.querySelectorAll(".book-card").length, 14);
  assert.equal(document.getElementById("load-more").hidden, true);

  const buy = document.querySelector(".book-card .buy-button");
  buy.click();
  assert.equal(document.getElementById("cart-count").textContent, "1");
  assert.equal(buy.getAttribute("aria-pressed"), "true");
  const savedCart = localStorage.getItem("bookshop-cart-v1");
  assert.deepEqual(JSON.parse(savedCart)[0], {
    id: "Architecture-0",
    title: "Architecture book 0",
    authors: ["Author One", "Author Two"],
    thumbnail: null,
    price: { amount: 12.5, currencyCode: "USD" },
  });

  const reloaded = await createApp(savedCart);
  assert.equal(reloaded.window.document.getElementById("cart-count").textContent, "1");
  assert.equal(reloaded.window.document.querySelector(".book-card .buy-button").textContent, "In the cart");
  reloaded.dom.window.close();

  buy.click();
  assert.equal(document.getElementById("cart-count").hidden, true);
  assert.equal(JSON.parse(localStorage.getItem("bookshop-cart-v1")).length, 0);

  document.querySelector('[data-category="Business"]').click();
  await new Promise(setImmediate);
  assert.deepEqual(requests[3], { category: "Business", start: 0, size: 6 });
  assert.equal(document.querySelectorAll(".book-card").length, 6);
  assert.equal(document.querySelector('[data-category="Business"]').getAttribute("aria-pressed"), "true");

  document.querySelectorAll(".slider-dot")[2].click();
  assert.equal(document.querySelectorAll(".slide.is-active").length, 1);
  assert.equal(document.querySelectorAll(".slider-dot")[2].getAttribute("aria-current"), "true");
  assert.equal(intervals.at(-1).delay, 5000);
  intervals.at(-1).callback();
  assert.equal(document.querySelectorAll(".slider-dot")[0].getAttribute("aria-current"), "true");

  dom.window.close();
});
