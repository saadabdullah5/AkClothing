import { absoluteUrl, pageNumber } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { CollectionDetail } from "@/lib/types";
import CollectionProductBrowser from "@/components/CollectionProductBrowser";

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
      <h1 className="sr-only">{collection.name}</h1>
      {collection.description && <p className="mx-auto mt-2 max-w-2xl text-center text-ink-soft">{collection.description}</p>}

      {collection.products.length === 0 ? (
        <p className="mt-8 text-ink-soft">No products in this collection yet.</p>
      ) : (
        <CollectionProductBrowser products={collection.products} collectionName={collection.name} initialPage={page} />
      )}
    </div>
  );
}
