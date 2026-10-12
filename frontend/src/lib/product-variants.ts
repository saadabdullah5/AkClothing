import type { Product, ProductVariant } from "./types";

export function isAvailable(variant: ProductVariant) {
  return !variant.isOutOfStock && variant.stockQty > 0;
}

export function selectColorVariant(variants: ProductVariant[], color: string, size?: string) {
  const matches = variants.filter((variant) => variant.color === color);
  return matches.find((variant) => variant.size === size && isAvailable(variant))
    ?? matches.find(isAvailable)
    ?? matches.find((variant) => variant.size === size)
    ?? matches[0];
}

export function variantImages(product: Product, variant?: ProductVariant) {
  if (!variant) return product.images.filter((image) => !image.variantId);
  const colorIds = new Set(product.variants.filter((item) => item.color === variant.color).map((item) => item.id));
  const photos = product.images.filter((image) => image.variantId && colorIds.has(image.variantId));
  return photos.length ? photos : product.images.filter((image) => !image.variantId);
}
