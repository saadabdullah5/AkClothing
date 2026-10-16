# Catalog and search implementation - 16 October 2026

## Completed implementation
- Crawlable shop/collection pagination, stocked-category navigation and breadcrumbs.
- Canonical URLs, preferred-host redirects, private/search noindex and complete catalog sitemap.
- Product metadata, price/stock structured data and responsive images.
- Verified product-fact editor, admin completion queue and 73-product CSV review snapshot.
- Variant XML feed, IndexNow setup, reviewed-guide template and consent-based measurement infrastructure.
- Existing inspection before payment, 3-5-day delivery and defective returns within 3 days retained with owner confirmation.

## Validation before deployment
Frontend production build and backend build/type checks passed. Six focused tests passed. Local integration verified 25-product pagination, variant price/feed matching, COD order attribution, stock decrement and cancellation restock; temporary fixtures were removed. Mobile browser checks passed for photo enlargement, cart persistence, checkout rendering and layout without submitting an order.

Baseline: 73 active products, 18 products unreachable from homepage HTML links, 30 public categories with only 7 stocked categories. See `catalog/baseline-evidence.json` and `catalog/merchant-completion-queue.csv`.

## Live deployment verified
Release `a4e967d` was pushed to main and verified on https://akclothings.shop on 16 October 2026.

| Check | Before | After |
| --- | ---: | ---: |
| Active products | 73 | 73 |
| Products unreachable through homepage HTML links | 18 | 0 |
| Public navigation categories | 30 | 7 stocked |
| Sitemap URLs | 75 | 89 |
| Private-page noindex probes | 0/5 | 5/5 |
| Invalid page 0 / out-of-range page | 200 | 404 |

Page 1 and page 2 each contain 24 distinct products with no overlap and correct canonical/previous/next links. All 73 live Product schemas matched current API variant prices, PKR currency and availability. HTTPS www redirects 308 to non-www preserving path/query. Live mobile preview, cart persistence, checkout rendering and layout checks passed without submitting an order. Evidence: `catalog/release-evidence.json`.

The feed endpoint is live but contains zero eligible items until merchant facts are completed. This is an explicit remaining dependency, not a completed Merchant Center launch.

## Remaining external dependencies
Product material/manufacturer/identifier facts require merchant verification. Incomplete products are excluded from the feed. Guide publication requires real authors, photos and reviewed facts. Search Console access currently exposes no akclothings.shop property; no unrelated property was analyzed. Merchant Center, GA4, Bing, IndexNow key and Hostinger bot-log access require account configuration. No rankings, merchant approval, field Core Web Vitals or collected revenue improvements are claimed.

See `SEO-OPERATIONS.md` for indexing rules, setup steps, editorial briefs and the 30/60/90-day plan. No product IDs/slugs, category assignments, orders or accounts are rewritten. Existing display name remains ak.shop.


## Mobile laboratory measurements
Single Lighthouse mobile runs from the same workstation; results vary with network/server/cache state and are not field p75 or INP measurements.

| Page | Score before/after | LCP before/after | Transfer before/after |
| --- | --- | --- | --- |
| Home | 97 / 97 | 2.14s / 2.49s | 4.06MB / 1.53MB |
| Dhanak category | 73 / 87 | 8.41s / 3.68s | 2.42MB / 1.67MB |
| Product | 90 / 87 | 3.41s / 3.77s | 2.57MB / 1.64MB |

CLS stayed below 0.001 on all three routes. Transfer size decreased, but category/product LCP remains above the 2.5s target and the product score regressed in this sample. Next performance work should profile image response and server rendering with authorized hosting telemetry and collect field data. Raw values: `catalog/baseline-evidence.json`, `catalog/mobile-lab-after.json`.
