import assert from "node:assert/strict";
import test from "node:test";
import { isAvailable, selectColorVariant, variantImages } from "../src/lib/product-variants";
import type { Product, ProductVariant } from "../src/lib/types";

const variants: ProductVariant[] = [
  { id: "red-m", size: "M", color: "Red", sku: "RM", priceOverride: "1200", stockQty: 3, isOutOfStock: false },
  { id: "blue-l", size: "L", color: "Blue", sku: "BL", priceOverride: "1500", stockQty: 5, isOutOfStock: false },
  { id: "blue-m", size: "M", color: "Blue", sku: "BM", priceOverride: null, stockQty: 0, isOutOfStock: true },
];

test("switching colors picks a real available variant when the old size is unavailable", () => {
  const selected = selectColorVariant(variants, "Blue", "M");
  assert.equal(selected?.id, "blue-l");
  assert.equal(selected?.priceOverride, "1500");
  assert.equal(selected?.stockQty, 5);
  assert.equal(selectColorVariant(variants, "Red", "L")?.id, "red-m");
});

test("matching available sizes are preserved; sold out colors remain selectable", () => {
  assert.equal(selectColorVariant(variants, "Red", "M")?.id, "red-m");
  const soldOut = variants.map((v) => ({ ...v, stockQty: 0 }));
  const selected = selectColorVariant(soldOut, "Blue", "M");
  assert.equal(selected?.id, "blue-m");
  assert.equal(isAvailable(selected!), false);
  assert.equal(selectColorVariant(variants, "Green"), undefined);
});

test("photos follow the color across sizes and never fall back to a different color", () => {
  const product = {
    variants,
    images: [
      { id: "general", url: "/general.jpg", altText: null, variantId: null },
      { id: "blue", url: "/blue.jpg", altText: null, variantId: "blue-l" },
    ],
  } as Product;
  assert.deepEqual(variantImages(product, variants[2]).map((i) => i.id), ["blue"]);
  assert.deepEqual(variantImages(product, variants[0]).map((i) => i.id), ["general"]);
  assert.deepEqual(variantImages({ ...product, images: product.images.slice(1) }, variants[0]), []);
});
