"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
type Row={id:string;name:string;stock:number;category:string;issues:string[]};
export default function Page(){const {token}=useAdminAuth();const [rows,setRows]=useState<Row[]>([]);const [error,setError]=useState("");useEffect(()=>{if(token)apiFetch<Row[]>("/admin/catalog-quality",{token}).then(setRows).catch(e=>setError(e.message))},[token]);return <div><h1 className="text-2xl font-bold">Catalog completion queue</h1><p className="my-4">Prioritized by available stock. Start with the first 20, then complete the remaining catalog. Verify supplier details before publishing; matching descriptions alone do not justify merging products.</p>{error&&<p role="alert">{error}</p>}<ol className="space-y-4">{rows.map((row,i)=><li key={row.id} className="rang-card p-4"><Link href={`/admin/products/${row.id}/edit`} className="font-semibold underline">{i+1}. {row.name}</Link><p>{row.category} · {row.stock} available</p><ul className="list-inside list-disc text-sm">{row.issues.map(issue=><li key={issue}>{issue}</li>)}</ul></li>)}</ol></div>}
