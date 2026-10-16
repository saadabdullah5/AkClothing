"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { captureAcquisition } from "@/lib/commerce-analytics";
export default function AnalyticsConsent() {
 const [choice,setChoice]=useState<string|null>("pending");
 const id=process.env.NEXT_PUBLIC_GA_ID;
 useEffect(()=>{try{setChoice(localStorage.getItem("ak-analytics-consent"));captureAcquisition()}catch{setChoice("no")}},[]);
 if(!id || !/^G-[A-Z0-9]+$/.test(id))return null;
 function choose(value:string){localStorage.setItem("ak-analytics-consent",value);setChoice(value);if(value==="yes")captureAcquisition();else sessionStorage.removeItem("ak-acquisition")}
 return <>{choice===null&&<aside aria-label="Optional analytics" className="fixed bottom-3 left-3 z-50 max-w-sm rounded-lg border bg-paper p-4 text-sm shadow-lg"><p>Allow optional analytics to help us understand shopping visits? Your choice does not affect checkout.</p><button onClick={()=>choose("yes")} className="mr-4 mt-3 underline">Allow</button><button onClick={()=>choose("no")} className="underline">Decline</button></aside>}{choice==="yes"&&<><Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/><Script id="analytics-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}',{send_page_view:false});`}</Script></>}</>;
}
