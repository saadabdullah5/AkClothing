import ProductListTracking from "@/components/ProductListTracking";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { apiFetch } from "@/lib/api";
import { Product } from "@/lib/types";
import { getPublicCategories } from "@/lib/catalog";
import { absoluteUrl, listingUrl, pageNumber } from "@/lib/seo";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
type Params = Record<string, string | undefined>;
const getProducts = cache((query: string) => apiFetch<{ items: Product[]; total: number }>(`/products?${query}`));
async function listing(params: Params) {
  const page = pageNumber(params.page);
  if (page === null) notFound();
  const categories = await getPublicCategories();
  const category = params.category ? (await apiFetch<{slug:string;name:string}[]>("/categories")).find(c => c.slug === params.category) : undefined;
  if (params.category && !category) notFound();
  if (params.sort && !["newest", "price_asc", "price_desc"].includes(params.sort)) notFound();
  for (const key of ["minPrice", "maxPrice"]) if (params[key] && (!Number.isFinite(Number(params[key])) || Number(params[key]) < 0)) notFound();
  const query = new URLSearchParams(listingUrl(params, page).split("?")[1]);
  query.set("pageSize", "24");
  const data = await getProducts(query.toString());
  if (page > 1 && (page - 1) * 24 >= data.total) notFound();
  return { ...data, page, categories, category };
}
export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const data = await listing(searchParams);
  const title = searchParams.q ? `Search: ${searchParams.q}` : data.category?.name ?? "Clothing & fabrics in Pakistan";
  const filtered = ["q", "size", "color", "minPrice", "maxPrice", "sort"].some(key => !!searchParams[key]);
  const canonical = absoluteUrl(listingUrl({ category: searchParams.category }, data.page));
  return { title: `${title}${data.page > 1 ? ` - Page ${data.page}` : ""}`, description: `Browse ${data.category?.name ?? "clothing and fabrics"} with current PKR prices, available colors and sizes. Order online from ak.shop in Pakistan.`, alternates: { canonical }, robots: filtered || data.total === 0 ? { index: false, follow: true } : undefined, openGraph: { url: canonical } };
}
export default async function ShopPage({ searchParams }: { searchParams: Params }) {
  const { items, total, page, categories, category } = await listing(searchParams);
  return <div><ProductListTracking ids={items.map(p=>p.variants[0]?.id??p.id)} /><Breadcrumbs items={[{name:"Home",href:"/"},{name:"Collections",href:"/collections"},{name:category?.name ?? "Shop",href:listingUrl({category:searchParams.category},1)}]} />
    <div className="grid gap-8 md:grid-cols-4"><aside className="rang-card self-start p-4"><h2 className="mb-3 font-semibold">Categories</h2><ul className="space-y-2"><li><Link href="/shop">All products</Link></li>{categories.map(c=><li key={c.id}><Link href={listingUrl({category:c.slug},1)} className={category?.slug===c.slug?"font-semibold text-brand":""}>{c.name}</Link></li>)}</ul></aside>
    <section className="md:col-span-3"><h1 className="mb-3 text-2xl font-bold">{searchParams.q ? `Search results for ?${searchParams.q}?` : category?.name ?? "Clothing & fabrics"}</h1><p className="mb-4 text-sm text-ink-soft">{total} products | Prices in PKR</p><ShopFilters key={JSON.stringify(searchParams)} />
    {items.length ? <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">{items.map((p,i)=><ProductCard key={p.id} product={p} priority={i===0} />)}</div> : <p className="mt-6">No products match these filters. <Link href="/shop" className="underline">Browse all products</Link></p>}
    <nav aria-label="Product pagination" className="mt-8 flex items-center justify-between gap-4">{page > 1 ? <Link rel="prev" href={listingUrl(searchParams,page-1)}>Previous</Link> : <span />}<span>Page {page} of {Math.max(1,Math.ceil(total/24))}</span>{page*24 < total ? <Link rel="next" href={listingUrl(searchParams,page+1)}>Next</Link> : <span />}</nav></section></div></div>;
}
