export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">About ak.shop</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink">
        <p>
          ak.shop is an online clothing store bringing quality men&apos;s, women&apos;s, and kids&apos; fashion to
          customers across Pakistan, with the convenience of Cash on Delivery — no advance payment required, just
          inspect your order and pay when it arrives at your door.
        </p>
        <p>
          Browse each product for its available colors, current price and listed fabric details. If you need
          measurements or clarification before ordering, contact us with the product name or SKU.
        </p>
        <p>
          Have a question about an order, a product, or anything else? Visit our{" "}
          <a href="/contact" className="text-brand underline">
            Contact page
          </a>{" "}
          or message us directly on WhatsApp using the button in the corner of your screen.
        </p>
      </div>
    </div>
  );
}
