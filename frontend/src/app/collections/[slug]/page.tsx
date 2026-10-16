import Link from "next/link";
import { absoluteUrl, pageNumber } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { CollectionDetail } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

async function getCollection(slug: string): Promise<CollectionDetail | null> {
  try {
    return await apiFetch<CollectionDetail>(`/collections/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams: { page?: string } }): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return { title: "Collection not found" };
  const page = pageNumber(searchParams.page);
  if (page === null || (page > 1 && (page-1)*24 >= collection.products.length)) notFound();
  return {
    alternates: { canonical: absoluteUrl(`/collections/${collection.slug}${page>1 ? `?page=${page}` : ""}`) },
    robots: collection.products.length ? undefined : { index: false, follow: true },
    title: `${collection.name}${page>1 ? ` - Page ${page}` : ""}`,
    description: collection.description ?? undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: { params: { slug: string }; searchParams: { page?: string } }) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();
  const page = pageNumber(searchParams.page);
  if (page === null || (page > 1 && (page-1)*24 >= collection.products.length)) notFound();

  return (
    <div className="font-rang mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{name:"Home",href:"/"},{name:"Collections",href:"/collections"},{name:collection.name,href:`/collections/${collection.slug}`}]} />
      <p className="rang-section-tag">Collection</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">{collection.name}</h1>
      {collection.description && <p className="mt-2 max-w-2xl text-ink-soft">{collection.description}</p>}

      {collection.products.length === 0 ? (
        <p className="mt-8 text-ink-soft">No products in this collection yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {collection.products.slice((page-1)*24,page*24).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      <nav aria-label="Collection pagination" className="mt-8 flex justify-between">{page>1 && <Link rel="prev" href={`/collections/${collection.slug}${page>2 ? `?page=${page-1}` : ""}`}>Previous</Link>}{page*24<collection.products.length && <Link rel="next" href={`/collections/${collection.slug}?page=${page+1}`}>Next</Link>}</nav>
    </div>
  );
}
