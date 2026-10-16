export const dynamic = "force-dynamic";
export function GET() {
 const key=process.env.INDEXNOW_KEY;
 if(!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) return new Response("Not configured",{status:404});
 return new Response(key,{headers:{"Content-Type":"text/plain","X-Robots-Tag":"noindex"}});
}
