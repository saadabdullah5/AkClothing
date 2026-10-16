"use client";
import { useEffect } from "react";
import { commerceEvent } from "@/lib/commerce-analytics";
export default function ProductListTracking({ids}:{ids:string[]}) {
 const key=ids.join(",");
 useEffect(()=>{commerceEvent("view_item_list",{items:ids.map(item_id=>({item_id}))})},[key]);
 return null;
}
