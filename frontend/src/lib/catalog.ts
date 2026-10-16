import { cache } from "react";
import { apiFetch } from "./api";
import type { Category, Product } from "./types";
export const getCatalog = cache(async () => {
  const products: Product[] = [];
  for (let page = 1; ; page++) {
    const data = await apiFetch<{ items: Product[]; total: number }>(`/products?pageSize=100&page=${page}`);
    products.push(...data.items);
    if (products.length >= data.total || !data.items.length) return products;
  }
});
export const getPublicCategories = cache(() => apiFetch<Category[]>("/categories?public=1"));
