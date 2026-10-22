"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 24;

export default function CollectionProductBrowser({ products, collectionName, initialPage }: { products: Product[]; collectionName: string; initialPage: number }) {
  const categories = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; image?: string | null }>();
    for (const product of products) {
      if (!unique.has(product.category.id)) {
        unique.set(product.category.id, {
          id: product.category.id,
          name: product.category.name,
          image: product.category.imageUrl ?? product.images[0]?.url,
        });
      }
    }
    return [...unique.values()];
  }, [products]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const filtered = selectedCategory ? products.filter((product) => product.category.id === selectedCategory) : products;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleProducts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function chooseCategory(categoryId: string) {
    setSelectedCategory((current) => current === categoryId ? null : categoryId);
    setPage(1);
  }

  return (
    <>
      <section aria-label={`${collectionName} categories`} className="collection-category-picker">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={selectedCategory === category.id}
            onClick={() => chooseCategory(category.id)}
            className="collection-category-tile"
          >
            <span className="relative block aspect-square overflow-hidden rounded-full bg-surface">
              {category.image ? <Image src={category.image} alt="" fill sizes="120px" className="object-cover" /> : <span className="flex h-full items-center justify-center px-3 text-center text-xs">{category.name}</span>}
            </span>
            <span>{category.name}</span>
          </button>
        ))}
      </section>

      {visibleProducts.length === 0 ? (
        <p className="mt-8 text-ink-soft">No products in this category yet.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Collection pagination" className="mt-8 flex items-center justify-center gap-4">
          <button className="rang-btn-outline disabled:opacity-40" type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span className="text-sm text-ink-soft">Page {safePage} of {pageCount}</span>
          <button className="rang-btn-outline disabled:opacity-40" type="button" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
        </nav>
      )}
    </>
  );
}
