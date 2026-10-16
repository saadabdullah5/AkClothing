"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAcquisition, commerceEvent } from "@/lib/commerce-analytics";
import { trackPageview } from "@/lib/tracking";

// Tracks real storefront pageviews for the admin dashboard's visitor/traffic-source
// numbers. Deliberately excludes /admin/* so admin panel usage never inflates them.
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (/^\/(account|checkout|track|order-confirmation|reset-password|forgot-password)(\/|$)/.test(pathname)) return;
    captureAcquisition();
    trackPageview(pathname);
    commerceEvent("page_view", { page_location: location.origin + pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
