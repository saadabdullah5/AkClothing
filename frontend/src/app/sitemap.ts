import { guides } from "@/content/guides";
import type { MetadataRoute } from "next";
import { getCatalog, getPublicCategories } from "@/lib/catalog";
import { apiFetch } from "@/lib/api";
import type { Collection } from "@/lib/types";
import { absoluteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const [products,categories,collections] = await Promise.all([getCatalog(),getPublicCategories(),apiFetch<Collection[]>("/collections")]);
 const routes=[...guides.map(g=>`/guides/${g.slug}`),"/","/shop","/collections","/about","/contact","/faq","/shipping-returns","/privacy-policy","/terms",...categories.map(c=>`/shop?category=${encodeURIComponent(c.slug)}`),...collections.map(c=>`/collections/${c.slug}`),...products.map(p=>`/product/${p.slug}`)];
 return [...new Set(routes)].map(path=>({url:absoluteUrl(path)}));
}
