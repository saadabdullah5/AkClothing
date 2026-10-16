export function analyticsAllowed() {
  try { return localStorage.getItem("ak-analytics-consent") === "yes"; } catch { return false; }
}
export function commerceEvent(event: string, ecommerce: Record<string, unknown>) {
  if(typeof window === "undefined" || !analyticsAllowed()) return;
  const target=window as Window & { dataLayer?: unknown[] };
  target.dataLayer ??= [];
  if(ecommerce.transaction_id) {
    try { const key=`ak-event:${event}:${ecommerce.transaction_id}`; if(sessionStorage.getItem(key))return; sessionStorage.setItem(key,"1"); } catch { /* Keep shopping functional. */ }
  }
  target.dataLayer.push({ecommerce:null});
  target.dataLayer.push({event,ecommerce:{currency:"PKR",...ecommerce}});
  const gtag=(window as Window & {gtag?:(...args:unknown[])=>void}).gtag;
  if(gtag)gtag("event",event,{currency:"PKR",...ecommerce});
}
export function acquisition() {
  if(typeof window === "undefined" || !analyticsAllowed()) return undefined;
  try { return JSON.parse(sessionStorage.getItem("ak-acquisition") || "null") ?? undefined; } catch { return undefined; }
}
export function captureAcquisition() {
  if(!analyticsAllowed())return;
  try {
    if(sessionStorage.getItem("ak-acquisition"))return;
    const host=document.referrer?new URL(document.referrer).hostname:"";
    const medium=new URLSearchParams(location.search).get("utm_medium");
    const channel=/chatgpt|perplexity|copilot|claude/.test(host)?"AI":/google\.|bing\.|duckduckgo\./.test(host)?"ORGANIC":/facebook|instagram|tiktok/.test(host)?"SOCIAL":medium==="email"?"EMAIL":medium==="cpc"?"PAID":host&&host!==location.hostname?"REFERRAL":"DIRECT";
    const landing=/^\/(product\/[^/]+|shop|collections(?:\/[^/]+)?)?$/.test(location.pathname)?location.pathname:"/";
    sessionStorage.setItem("ak-acquisition",JSON.stringify({channel,landing}));
  } catch { /* Tracking must not interrupt shopping. */ }
}
