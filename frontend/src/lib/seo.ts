export const SITE_URL = "https://akclothings.shop";
export const BRAND = "ak.shop";
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
export function plainText(value: string) {
  return value.normalize("NFKC").replace(/[*_~`]+/g, "").replace(/\p{Extended_Pictographic}/gu, "").replace(/[ \t]+/g, " ").trim();
}
export function pageNumber(value?: string) {
  if (value === undefined) return 1;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value)>1000000) return null;
  return Number(value);
}
export function listingUrl(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const key of ["category", "size", "color", "q", "minPrice", "maxPrice", "sort"]) if (params[key]) query.set(key, params[key]!);
  if (page > 1) query.set("page", String(page));
  return `/shop${query.size ? `?${query}` : ""}`;
}
