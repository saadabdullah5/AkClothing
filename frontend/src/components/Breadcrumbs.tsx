import Link from "next/link";
import { absoluteUrl, jsonLd } from "@/lib/seo";
export default function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return <><nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-sm text-ink-soft">{items.map((item, i) => <span key={item.href}>{i > 0 && <span aria-hidden="true" className="mr-2">/</span>}<Link href={item.href} aria-current={i === items.length - 1 ? "page" : undefined}>{item.name}</Link></span>)}</nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.href) })) }) }} /></>;
}
