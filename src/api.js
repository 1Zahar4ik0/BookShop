const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
export const PAGE_SIZE = 6;

export async function fetchBooks(category, startIndex, signal) {
  const url = new URL(BASE_URL);
  url.searchParams.set("q", `subject:${category}`);
  url.searchParams.set("printType", "books");
  url.searchParams.set("startIndex", String(startIndex));
  url.searchParams.set("maxResults", String(PAGE_SIZE));
  url.searchParams.set("langRestrict", "en");
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Google Books returned ${response.status}`);
  const data = await response.json();
  return { items: data.items || [], totalItems: data.totalItems || 0 };
}
