import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { apiFetch } from "@/lib/api";
import type { Collection } from "@/lib/types";
import Breadcrumbs from "@/components/Breadcrumbs";
import CollectionProductBrowser from "@/components/CollectionProductBrowser";
export const metadata = { title: "Clothing & fabric collections in Pakistan", description: "Browse available clothing and fabric collections, compare current PKR prices and choose your size and color.", alternates: { canonical: "https://akclothings.shop/collections" } };
export default async function CollectionsPage() {
 const [products, curated] = await Promise.all([getCatalog(), apiFetch<Collection[]>("/collections")]);
 return <div>
  <Breadcrumbs items={[{name:"Home",href:"/"},{name:"Collections",href:"/collections"}]} />
  <h1 className="text-3xl font-bold">Clothing & fabric collections</h1>
  <p className="mt-3 text-ink-soft">Browse our current catalog by category. Check each product for its available colors, sizes and price.</p>
  <CollectionProductBrowser products={products} collectionName="Clothing and fabric" initialPage={1} />
  {curated.length > 0 && <section className="mt-16"><h2 className="mb-6 text-2xl font-semibold">Curated collections</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{curated.map(c=><Link key={c.id} href={`/collections/${c.slug}`} className="rang-card p-5"><h3 className="font-semibold">{c.name}</h3>{c.description&&<p className="mt-2 text-sm text-ink-soft">{c.description}</p>}</Link>)}</div></section>}
  <Link href="/shop" className="mt-8 inline-block underline">Browse all {products.length} products</Link>
 </div>;
}
