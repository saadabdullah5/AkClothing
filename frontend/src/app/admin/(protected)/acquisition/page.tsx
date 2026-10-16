"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
type Report={rows:{channel:string;status:string;orders:number;orderValue:number}[];note:string};
export default function Page(){const {token}=useAdminAuth();const [data,setData]=useState<Report>();const [error,setError]=useState("");useEffect(()=>{if(token)apiFetch<Report>("/admin/acquisition-outcomes?days=90",{token}).then(setData).catch(e=>setError(e.message))},[token]);return <div><h1 className="text-2xl font-bold">Acquisition & COD outcomes — 90 days</h1><p className="my-4">Consented acquisition is linked when an order is placed. Historical and non-consented orders remain unattributed. WhatsApp leads are not sales.</p>{error&&<p role="alert">{error}</p>}<table className="w-full text-left"><thead><tr><th>Channel</th><th>Status</th><th>Orders</th><th>Order value (PKR)</th></tr></thead><tbody>{data?.rows.map(r=><tr key={r.channel+r.status}><td>{r.channel}</td><td>{r.status}</td><td>{r.orders}</td><td>{r.orderValue.toFixed(2)}</td></tr>)}</tbody></table><p className="mt-4 text-sm">{data?.note}</p></div>}
