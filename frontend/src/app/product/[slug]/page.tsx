import { cache } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { variantImages } from "@/lib/product-variants";
import { absoluteUrl, jsonLd as serializeJsonLd, plainText, SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Product } from "@/lib/types";
import ProductDetail from "@/components/ProductDetail";
import RelatedProducts from "@/components/RelatedProducts";

const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    return await apiFetch<Product>(`/products/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

// Same-category products first; if the category has no other items yet (common for a
// small/young catalog), falls back to other recent active products so the section isn't
// silently empty rather than genuinely having nothing relevant to show.
async function getRelatedProducts(categorySlug: string, excludeId: string): Promise<Product[]> {
  try {
    const { items } = await apiFetch<{ items: Product[] }>(`/products?category=${categorySlug}&pageSize=5`);
    const sameCategory = items.filter((p) => p.id !== excludeId).slice(0, 4);
    if (sameCategory.length > 0) return sameCategory;

    const { items: fallback } = await apiFetch<{ items: Product[] }>(`/products?pageSize=5`);
    return fallback.filter((p) => p.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };

  return {
    alternates: { canonical: absoluteUrl(`/product/${product.slug}`) },
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? `${product.name}. ${plainText(product.description).slice(0, 115)}`,
    openGraph: {
      url: absoluteUrl(`/product/${product.slug}`),
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? `${product.name}. ${plainText(product.description).slice(0, 115)}`,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category.slug, product.id);
  const facts = product.facts ?? {};
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", "@id": absoluteUrl(`/product/${product.slug}#product`),
    name: product.name, description: product.description, url: absoluteUrl(`/product/${product.slug}`),
    image: product.images.map(i => i.url),
    ...(product.variants.length === 1 ? { sku: product.variants[0].sku } : {}),
    ...(facts.manufacturer ? { brand: { "@type": "Brand", name: facts.manufacturer } } : {}),
    ...(facts.gtin ? { gtin: facts.gtin } : {}), ...(facts.mpn ? { mpn: facts.mpn } : {}),
    additionalProperty: Object.entries(facts).filter(([k,v])=>v && !["manufacturer","gtin","mpn","variantGrouping"].includes(k)).map(([name,value])=>({"@type":"PropertyValue",name,value})),
    offers: product.variants.map(v => ({ "@type": "Offer", sku: v.sku, priceCurrency: "PKR", price: v.priceOverride ?? product.basePrice,
      url: absoluteUrl(`/product/${product.slug}?variant=${v.id}`), availability: !v.isOutOfStock && v.stockQty>0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE_URL}/#store` }, ...(facts.condition ? { itemCondition: `https://schema.org/${{new:"NewCondition",used:"UsedCondition",refurbished:"RefurbishedCondition"}[facts.condition]}` } : {}) })),
  };

  const grouped = facts.variantGrouping === "verified" && product.variants.length > 1 && product.variants.every(v=>v.color.trim() && !/all\s*cl/i.test(v.color));
  const structuredData = grouped ? {
    "@context": "https://schema.org", "@type": "ProductGroup", "@id": absoluteUrl(`/product/${product.slug}#group`),
    name: product.name, description: product.description, url: absoluteUrl(`/product/${product.slug}`), productGroupID: product.id,
    variesBy: [...(new Set(product.variants.map(v=>v.color)).size>1 ? ["https://schema.org/color"] : []), ...(new Set(product.variants.map(v=>v.size)).size>1 && facts.construction === "Stitched" ? ["https://schema.org/size"] : [])],
    hasVariant: product.variants.map((v,i)=>({ "@type":"Product", "@id":absoluteUrl(`/product/${product.slug}#${v.id}`), name:`${product.name} — ${v.color} ${v.size}`, sku:v.sku, color:v.color, ...(facts.construction === "Stitched" ? {size:v.size} : {}), image:variantImages(product,v).map(img=>img.url), offers:jsonLd.offers[i], isVariantOf:{"@id":absoluteUrl(`/product/${product.slug}#group`)} })),
  } : jsonLd;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <Breadcrumbs items={[{name:"Home",href:"/"},{name:product.category.name,href:`/shop?category=${encodeURIComponent(product.category.slug)}`},{name:product.name,href:`/product/${product.slug}`}]} />
      <ProductDetail key={product.id} product={product} />
      <section className="mt-8"><h2 className="text-xl font-semibold">Product details</h2><dl className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(facts).filter(([k,v])=>v && k !== "variantGrouping").map(([key,value])=><div key={key}><dt className="font-medium capitalize">{key.replace(/([A-Z])/g," $1")}</dt><dd className="whitespace-pre-line text-sm">{value}</dd></div>)}</dl><p className="mt-4 text-sm">Delivery charges are shown at checkout. <Link href="/shipping-returns" className="underline">Shipping and returns</Link> ? <Link href="/contact" className="underline">Ask about this product</Link></p></section>
      <RelatedProducts products={related} />
    </div>
  );
}
