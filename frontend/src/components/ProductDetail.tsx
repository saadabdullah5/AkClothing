"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { commerceEvent } from "@/lib/commerce-analytics";
import { apiFetch } from "@/lib/api";
import { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import StarRating from "./StarRating";
import ReviewsSection from "./ReviewsSection";
import ProductPhotoPreview from "./ProductPhotoPreview";
import { isAvailable, selectColorVariant, variantImages } from "@/lib/product-variants";

const money = (value: number | string) => `PKR ${Number(value).toLocaleString("en-PK")}`;

export default function ProductDetail({ product }: { product: Product }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addLine, lines } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const colors = useMemo(() => Array.from(new Set(product.variants.map(v => v.color))), [product]);
  const [selectedId, setSelectedId] = useState(() => (product.variants.find(v => v.id === searchParams.get("variant")) ?? product.variants.find(isAvailable) ?? product.variants[0])?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");
  const variant = product.variants.find(v => v.id === selectedId) ?? product.variants[0];
  const color = variant?.color ?? "";
  const size = variant?.size ?? "";
  const sizes = Array.from(new Set(product.variants.filter(v => v.color === color).map(v => v.size)));
  const images = variantImages(product, variant);
  const photo = images[activeImage] ?? images[0];
  const price = variant?.priceOverride ?? product.basePrice;
  const outOfStock = !variant || !isAvailable(variant);
  const inCart = lines.find(line => line.variantId === variant?.id)?.qty ?? 0;
  const remaining = Math.max(0, (variant?.stockQty ?? 0) - inCart);
  const canAdd = !outOfStock && remaining > 0;
  const facts = Object.entries(product.facts ?? {}).filter(([key, value]) => value && key !== "variantGrouping");
  const wishlisted = isWishlisted(product.slug);
  const construction = sizes.length > 0 && sizes.every(s => /unstitched/i.test(s));

  useEffect(() => { if (variant) commerceEvent("view_item", { value: Number(price), items: [{ item_id: variant.id, item_name: product.name, price: Number(price) }] }); }, [variant?.id, price, product.name]);
  useEffect(() => { apiFetch<{ whatsappNumber: string | null }>("/settings").then(s => { if (s.whatsappNumber) setWhatsappNumber(s.whatsappNumber); }).catch(() => {}); }, []);

  function selectVariant(next?: ProductVariant) {
    if (!next) return;
    setSelectedId(next.id); setActiveImage(0); setPreviewOpen(false); setQty(1); setAdded(false);
  }
  function addToCart() {
    if (!variant || !canAdd) return false;
    const quantity = Math.min(qty, remaining);
    addLine({ variantId: variant.id, productSlug: product.slug, productName: product.name, size, color, unitPrice: Number(price), qty: quantity, image: images[0]?.url });
    commerceEvent("add_to_cart", { value: Number(price) * quantity, items: [{ item_id: variant.id, item_name: product.name, price: Number(price), quantity }] });
    setAdded(true); return true;
  }
  const whatsappText = encodeURIComponent(`Hi! I have a question about ${product.name}. Color: ${color}; ${construction ? "Construction" : "Size"}: ${size}. ${typeof window !== "undefined" ? window.location.origin : "https://akclothings.shop"}/product/${product.slug}?variant=${variant?.id ?? ""}`);
  const buttonLabel = outOfStock ? "Out of stock" : !remaining ? "All available stock in cart" : added ? "Add another" : "Add to Cart";

  return <div className="product-experience">
    {previewOpen && images.length > 0 && <ProductPhotoPreview images={images} index={activeImage} title={`${product.name} — ${color}`} onSelect={setActiveImage} onClose={() => setPreviewOpen(false)} />}
    <div className="product-layout">
      <section aria-label="Product photos" className="min-w-0">
        <div className="product-main-photo">
          {photo ? <button type="button" className="absolute inset-0 cursor-zoom-in" aria-label={`Enlarge photo ${activeImage + 1}`} aria-haspopup="dialog" onClick={() => setPreviewOpen(true)}>
            <Image src={photo.url} alt={photo.altText || `${product.name} — ${color}`} fill priority sizes="(max-width: 767px) 100vw, (max-width: 1200px) 56vw, 650px" className="object-contain" />
            <span className="product-expand" aria-hidden="true">↗</span>
          </button> : <span>No photo available</span>}
          <button type="button" aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wishlisted} onClick={() => toggle(product.slug)} className="product-save">{wishlisted ? "♥" : "♡"}</button>
        </div>
        {images.length > 1 && <div className="product-thumbnails" aria-label="Choose a photo">{images.map((img, index) => <button key={img.id} type="button" aria-label={`Show photo ${index + 1}`} aria-pressed={index === activeImage} onClick={() => setActiveImage(index)}><Image src={img.url} alt="" fill sizes="90px" className="object-cover" /></button>)}</div>}
        {images.length > 0 && <p className="mt-3 text-center text-xs text-ink-soft">Click the image for a closer look{images.length > 1 ? ` · ${activeImage + 1} / ${images.length}` : ""}</p>}
      </section>
      <section className="product-purchase" aria-label="Product options">
        <Link href={`/shop?category=${encodeURIComponent(product.category.slug)}`} className="product-eyebrow">{product.category.name}</Link>
        <h1>{product.name}</h1>
        {product.reviewCount > 0 && <a href="#product-reviews" className="mt-3 flex items-center gap-2 text-sm"><StarRating value={product.avgRating ?? 0} /><span>{product.reviewCount} customer review{product.reviewCount === 1 ? "" : "s"}</span></a>}
        <p className="product-price" aria-live="polite">{money(price)}</p>
        <p className="text-xs text-ink-soft">Delivery charges calculated at checkout.</p>
        <div className="product-options">
          <fieldset><legend className="mb-3 text-sm">Color: <strong>{color || "Not specified"}</strong></legend><div className="flex flex-wrap gap-3">{colors.map(c => {
            const option = selectColorVariant(product.variants, c, size);
            const image = variantImages(product, option)[0];
            const available = product.variants.some(v => v.color === c && isAvailable(v));
            return <button type="button" key={c} className="product-color" aria-label={`Color: ${c}${available ? "" : " (out of stock)"}`} aria-pressed={color === c} onClick={() => selectVariant(option)}>
              {image && <span className="relative block aspect-square w-14 overflow-hidden"><Image src={image.url} alt="" fill sizes="56px" className="object-cover" /></span>}
              <span>{c}</span>{!available && <span className="text-[10px]">Sold out</span>}
            </button>;
          })}</div></fieldset>
          {sizes.length > 0 && <fieldset className="mt-5"><legend className="mb-3 text-sm font-semibold">{construction ? "Construction" : "Size"}</legend><div className="flex flex-wrap gap-2">{sizes.map(s => {
            const option = product.variants.find(v => v.color === color && v.size === s);
            return <button type="button" className="product-size" key={s} aria-pressed={s === size} onClick={() => selectVariant(option)}>{s}{option && !isAvailable(option) ? " · Sold out" : ""}</button>;
          })}</div></fieldset>}
        </div>
        <p className="mb-4 text-sm" aria-live="polite">{outOfStock ? "This option is currently unavailable. Choose another color or size." : remaining === 0 ? "You have all available units in your cart." : "In stock · Ready to order"}</p>
        <div className="product-actions">
          <div className="product-quantity"><button type="button" aria-label="Decrease quantity" disabled={qty <= 1 || !canAdd} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button><input type="number" aria-label="Quantity" min={1} max={Math.max(1, remaining)} value={Math.min(qty, Math.max(1, remaining))} disabled={!canAdd} onChange={e => setQty(Math.min(Math.max(1, remaining), Math.max(1, Math.floor(Number(e.target.value)) || 1)))} /><button type="button" aria-label="Increase quantity" disabled={!canAdd || qty >= remaining} onClick={() => setQty(q => Math.min(remaining, q + 1))}>+</button></div>
          <button type="button" className="product-cta" disabled={!canAdd} onClick={addToCart}>{buttonLabel}</button>
        </div>
        <div role="status" className="mt-3 text-sm">{added && <p>Added to your cart. <Link className="font-semibold underline" href="/cart">View cart</Link></p>}</div>
        <button type="button" className="product-checkout" disabled={outOfStock || (!canAdd && !inCart)} onClick={() => { if (inCart > 0 || addToCart()) router.push("/checkout"); }}>{inCart > 0 ? "Continue to checkout" : "Buy now"}</button>
        {whatsappNumber && <a className="my-5 block text-center text-sm underline underline-offset-4" href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" onClick={() => commerceEvent("whatsapp_lead", { items: variant ? [{ item_id: variant.id }] : [] })}>Need help choosing? Ask on WhatsApp ↗</a>}
        <div className="product-reassurance"><span>Cash on delivery</span><span>Delivery in 3–5 days</span></div>
        <div className="product-accordions">
          <details open><summary>Product details</summary><div className="product-detail-copy"><p className="whitespace-pre-line">{product.description}</p>{facts.length > 0 && <dl className="mt-4 space-y-3">{facts.map(([key, value]) => <div key={key}><dt className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}</dt><dd>{value}</dd></div>)}</dl>}{variant?.sku && <p className="mt-4 text-xs text-ink-soft">SKU: {variant.sku}</p>}</div></details>
          <details><summary>Delivery & returns</summary><div className="product-detail-copy"><p>Inspect your order before payment. Delivery usually takes 3–5 days. Free returns for defective items within 3 days.</p><p className="mt-3">Delivery charges are shown before you place your order.</p><Link href="/shipping-returns" className="mt-3 inline-block underline">Read the full shipping & returns policy</Link></div></details>
        </div>
      </section>
    </div>
    <section id="product-reviews" className="mt-14 scroll-mt-24"><ReviewsSection productId={product.id} /></section>
    {!previewOpen && <div className="product-mobile-bar"><div className="min-w-0"><p className="font-semibold">{money(price)}</p><p className="truncate text-xs text-ink-soft">{color} · {size}</p></div>{added || (!remaining && inCart > 0) ? <Link href="/cart" className="product-cta">View cart →</Link> : <button type="button" className="product-cta" disabled={!canAdd} onClick={addToCart}>{outOfStock ? "Out of stock" : "Add to Cart"}</button>}</div>}
  </div>;
}
