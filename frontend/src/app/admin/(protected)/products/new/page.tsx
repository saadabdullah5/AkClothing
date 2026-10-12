"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Category } from "@/lib/types";

interface VariantRow {
  size: string;
  color: string;
  sku: string;
  stockQty: number;
  priceOverride: string;
  images: string[];
}

// Flattens the department/sub-category tree into a single list, e.g. "Men (General)",
// "Men — Shirts", "Kids — Boys" — every category visible at once in one dropdown.
function buildCategoryOptions(categories: Category[]) {
  const departments = categories.filter((c) => !c.parentId);
  const options: { id: string; label: string }[] = [];
  for (const dept of departments) {
    options.push({ id: dept.id, label: `${dept.name} (General)` });
    for (const child of categories.filter((c) => c.parentId === dept.id)) {
      options.push({ id: child.id, label: `${dept.name} — ${child.name}` });
    }
  }
  return options;
}

export default function NewProductPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">("ACTIVE");
  const [featured, setFeatured] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([{ size: "M", color: "Black", sku: "", stockQty: 10, priceOverride: "", images: [] }]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = buildCategoryOptions(categories);

  useEffect(() => {
    apiFetch<Category[]>("/categories").then((cats) => {
      setCategories(cats);
      const options = buildCategoryOptions(cats);
      if (options[0]) setCategoryId(options[0].id);
    });
  }, []);

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, { size: "", color: "", sku: "", stockQty: 0, priceOverride: "", images: [] }]);
  }

  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>, variantIndex?: number) {
    if (!token || !e.target.files?.length) return;
    const input = e.target;
    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(Array.from(e.target.files).map((file) => uploadImage(file, token)));
      if (variantIndex === undefined) setImages((prev) => [...prev, ...urls]);
      else setVariants((prev) => prev.map((v, i) => i === variantIndex ? { ...v, images: [...v.images, ...urls] } : v));
    } catch {
      setError("Image upload failed — check your Cloudinary settings.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || uploading || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/products", {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          description,
          basePrice: Number(basePrice),
          categoryId,
          status,
          featured,
          variants: variants.map((v) => ({ ...v, images: v.images.map((url) => ({ url })), priceOverride: v.priceOverride === "" ? undefined : Number(v.priceOverride), stockQty: Number(v.stockQty) })),
          images: images.map((url) => ({ url })),
        }),
      });
      router.push("/admin/products");
      // Not resetting `submitting` here — see frontend/src/app/admin/login/page.tsx for why.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create product");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold">Add product</h1><button type="button" onClick={() => router.push("/admin/products")} className="text-sm underline">Back to products</button></div>
      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]"><div className="min-w-0 space-y-5 rounded-xl border border-ink/15 bg-surface p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Product Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="rang-input"
          />
        </div>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Base Price (Rs.)</label>
            <input
              required
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="rang-input"
            />
          </div>

        </div>



        <div>
          <label className="mb-2 block text-sm font-medium">Sizes, Colors &amp; Stock</label>
          <p className="mb-3 text-sm text-ink-soft">Add one row per size and color, with its own price, stock and photos. Photos are shared across sizes of the same color. Leave price blank to use the base price.</p>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <fieldset key={i} disabled={uploading || submitting} className="flex flex-wrap gap-2 rounded-lg border border-ink/15 p-3">
                <legend className="px-1 text-sm font-medium">Variant {i + 1}{v.color ? `: ${v.color}` : ""}</legend>
                <input
                  placeholder="Size (e.g. M)"
                  value={v.size}
                  onChange={(e) => updateVariant(i, { size: e.target.value })}
                  className="rang-input w-24 py-1.5"
                />
                <input
                  placeholder="Color"
                  value={v.color}
                  onChange={(e) => updateVariant(i, { color: e.target.value })}
                  className="rang-input w-28 py-1.5"
                />
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  className="rang-input flex-1 py-1.5"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stockQty}
                  onChange={(e) => updateVariant(i, { stockQty: Number(e.target.value) })}
                  className="rang-input w-20 py-1.5"
                />
                <input type="number" min="0.01" step="0.01" aria-label={`Price for variant ${i + 1}`} placeholder="Price (Rs.)" value={v.priceOverride} onChange={(e) => updateVariant(i, { priceOverride: e.target.value })} className="rang-input w-32 py-1.5" />
                <button
                  type="button"
                  disabled={variants.length === 1}
                  onClick={() => removeVariantRow(i)}
                  className="rounded-full px-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Remove
                </button>
                <div className="w-full">
                  <label className="block text-sm font-medium">Variant photos
                    <input type="file" accept="image/*" multiple onChange={(e) => handleImageSelect(e, i)} className="mt-2 block w-full text-sm" />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.images.map((url, photoIndex) => <div key={`${url}-${photoIndex}`} className="relative">
                      <img src={url} alt={`${v.color || "Variant"} photo ${photoIndex + 1}`} className="h-24 w-24 rounded border border-ink/15 object-cover" />
                      <button type="button" aria-label={`Remove variant ${i + 1} photo ${photoIndex + 1}`} onClick={() => updateVariant(i, { images: v.images.filter((_, index) => index !== photoIndex) })} className="absolute right-0 top-0 rounded bg-white px-2 text-red-600">×</button>
                    </div>)}
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
          <button type="button" disabled={uploading || submitting} onClick={addVariantRow} className="mt-2 text-sm font-medium text-brand underline">
            + Add size/color
          </button>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">General product images (optional)</label>
          <p className="mb-2 text-sm text-ink-soft">Used only for colors without their own photos.</p>
          <input type="file" accept="image/*" multiple disabled={uploading || submitting} onChange={(e) => handleImageSelect(e)} className="text-sm" />
          {uploading && <p className="mt-1 text-sm text-ink-soft">Uploading...</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="h-36 w-36 rounded-lg border border-ink/15 object-contain" />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={submitting || uploading} className="rang-btn-primary">
          {submitting ? "Saving..." : "Save Product"}
        </button>
</div><aside className="space-y-5 lg:col-start-2 lg:row-start-1"><section className="rounded-xl border border-ink/15 bg-surface p-5 shadow-sm space-y-4">        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DRAFT")}
            className="rang-input"
          >
            <option value="ACTIVE">Active (visible on the store)</option>
            <option value="DRAFT">Draft (hidden)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-brand" />
          Feature on homepage
        </label></section><section className="rounded-xl border border-ink/15 bg-surface p-5 shadow-sm"><h2 className="mb-4 font-semibold">Product organization</h2>          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rang-input">
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div></section><section className="rounded-xl border border-ink/15 bg-surface p-5 shadow-sm"><h2 className="mb-3 font-semibold">Publishing</h2><p className="text-sm text-ink-soft">{status === "ACTIVE" ? "Visible on your online store." : "Draft — hidden from your online store."}</p></section></aside>
      </form>
    </div>
  );
}
