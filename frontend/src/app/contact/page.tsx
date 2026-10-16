import ContactForm from "@/components/ContactForm";
import { apiFetch } from "@/lib/api";
export default async function Page() {
 const settings=await apiFetch<{storeContactEmail:string|null;storeContactPhone:string|null;whatsappNumber:string|null}>("/settings");
 const whatsapp=settings.whatsappNumber?.replace(/[^0-9]/g,"");
 return <><section aria-label="Store contact details" className="mx-auto mb-6 max-w-lg space-y-2 text-sm">{settings.storeContactEmail&&<p>Email: <a href={`mailto:${settings.storeContactEmail}`} className="underline">{settings.storeContactEmail}</a></p>}{settings.storeContactPhone&&<p>Phone: <a href={`tel:${settings.storeContactPhone}`} className="underline">{settings.storeContactPhone}</a></p>}{whatsapp&&<p><a className="underline" href={`https://wa.me/${whatsapp}`}>Contact us on WhatsApp</a></p>}<p>For product questions, quote the product name or SKU. For order support, include your order number. Do not send passwords or payment credentials.</p></section><ContactForm /></>;
}
