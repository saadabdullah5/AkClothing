"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import StarRating from "./StarRating";
import ReviewsSection from "./ReviewsSection";
import { isAvailable, selectColorVariant, variantImages } from "@/lib/product-variants";

const LOW_STOCK_THRESHOLD = 5;

export default function ProductDetail({ product }: { product: Product }) {
  const colors = useMemo(() => Array.from(new Set(product.variants.map((v) => v.color))), [product]);

  const [selectedId, setSelectedId] = useState(() => (product.variants.find(isAvailable) ?? product.variants[0])?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const router = useRouter();
  const { addLine } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [activeImage, setActiveImage] = useState(0);

  const variant = product.variants.find((v) => v.id === selectedId) ?? product.variants.find(isAvailable) ?? product.variants[0];
  const size = variant?.size ?? "";
  const color = variant?.color ?? "";
  const sizes = Array.from(new Set(product.variants.filter((v) => v.color === color).map((v) => v.size)));
  const images = variantImages(product, variant);
  const price = variant?.priceOverride ?? product.basePrice;
  const outOfStock = !variant || variant.isOutOfStock || variant.stockQty <= 0;
  const lowStock = !outOfStock && (variant?.stockQty ?? 0) <= LOW_STOCK_THRESHOLD;
  const image = images[activeImage]?.url ?? images[0]?.url;
  const wishlisted = isWishlisted(product.slug);

  function selectVariant(next: ProductVariant | undefined) {
    if (!next) return;
    setSelectedId(next.id);
    setActiveImage(0);
    setQty(1);
    setAdded(false);
  }

  const [whatsappNumber, setWhatsappNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");
  useEffect(() => {
    apiFetch<{ whatsappNumber: string | null }>("/settings")
      .then((s) => {
        if (s.whatsappNumber) setWhatsappNumber(s.whatsappNumber);
      })
      .catch(() => {
        // fall back silently to the env default if the API is unreachable
      });
  }, []);
  const whatsappText = encodeURIComponent(
    `Hi! I'd like to order ${product.name} (Size: ${size}, Color: ${color}).`
  );

  function handleAddToCart() {
    if (!variant || outOfStock) return;
    addLine({
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      size,
      color,
      unitPrice: Number(price),
      qty: Math.min(qty, variant.stockQty),
      image,
    });
    setAdded(true);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    handleAddToCart();
    router.push("/cart");
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-12">
      <div className="relative grid grid-cols-2 gap-2 self-start">
        {images.length > 0 ? images.map((img, i) => (
          <button key={img.id} type="button" aria-label={`Select photo ${i + 1}`} aria-pressed={i === activeImage} onClick={() => setActiveImage(i)} className={`rang-card relative aspect-[3/4] overflow-hidden text-left ${i === activeImage ? "ring-2 ring-brand ring-offset-2" : ""}`}>
            <Image src={img.url} alt={img.altText ?? product.name} fill className="object-cover transition-transform duration-500 hover:scale-105" />
          </button>
        )) : (
          <div className="rang-card col-span-2 flex aspect-[3/4] items-center justify-center text-ink-soft">No image</div>
        )}
        <button
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => toggle(product.slug)}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110 hover:bg-white"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 ${wishlisted ? "fill-rose-600 stroke-rose-600" : "fill-none stroke-ink-soft"}`}
              strokeWidth="2"
            >
              <path d="M12 21s-6.7-4.35-9.3-8.3C1 10 1.6 6.5 4.6 5.1 7 4 9.5 4.8 12 7.5c2.5-2.7 5-3.5 7.4-2.4 3 1.4 3.6 4.9 1.9 7.6C18.7 16.65 12 21 12 21z" />
            </svg>
        </button>
      </div>

      <div className="self-start lg:sticky lg:top-24">
        <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
        {product.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <StarRating value={product.avgRating ?? 0} />
            <span className="text-sm text-ink-soft">
              {product.avgRating?.toFixed(1)} ({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})
            </span>
          </div>
        )}
        <p className="mt-2 text-xl font-semibold text-brand">Rs. {price}</p>
        {variant?.sku && <p className="mt-1 text-xs uppercase tracking-wider text-ink-soft">SKU: {variant.sku}</p>}
        {lowStock && <p className="mt-1 text-sm font-medium text-orange-600">Only {variant?.stockQty} left in stock</p>}
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">{product.description}</p>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === size}
                onClick={() => selectVariant(product.variants.find((v) => v.size === s && v.color === color))}
                className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition ${
                  s === size
                    ? "border-brand bg-brand text-white shadow-soft"
                    : "border-ink/25 hover:border-brand hover:text-brand"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={c === color}
                onClick={() => selectVariant(selectColorVariant(product.variants, c, size))}
                className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition ${
                  c === color
                    ? "border-brand bg-brand text-white shadow-soft"
                    : "border-ink/25 hover:border-brand hover:text-brand"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {outOfStock ? (
          <p className="mt-6 font-semibold text-red-600 dark:text-red-400">Out of Stock</p>
        ) : (
          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={variant?.stockQty}
              value={qty}
              aria-label="Quantity"
              onChange={(e) => setQty(Math.min(variant?.stockQty ?? 1, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
              className="rang-input w-16 py-2.5"
            />
            <button onClick={handleAddToCart} className="rang-btn-primary">
              {added ? "Added ✓" : "Add to Cart"}
            </button>
            <button onClick={handleBuyNow} className="rang-btn-outline">
              Buy Now
            </button>
          </div>
        )}

        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline dark:text-green-400"
          >
            Or order this on WhatsApp →
          </a>
        )}
      </div>
      <div className="lg:col-span-2">
        <ReviewsSection productId={product.id} />
      </div>
    </div>
  );
}
