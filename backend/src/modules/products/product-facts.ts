import { z } from "zod";
const text = z.string().trim().max(2000).optional();
export const productFactsSchema = z.object({
  manufacturer: text, articleCode: text, fabric: text,
  construction: z.enum(["", "Stitched", "Unstitched", "Fabric"]).optional(),
  components: text, measurements: text, pattern: text, embroidery: text, care: text,
  gender: z.enum(["", "male", "female", "unisex"]).optional(),
  ageGroup: z.enum(["", "newborn", "infant", "toddler", "kids", "adult"]).optional(),
  condition: z.enum(["", "new", "used", "refurbished"]).optional(),
  variantGrouping: z.enum(["", "verified"]).optional(),
  gtin: z.string().regex(/^(?:\d{8}|\d{12}|\d{13}|\d{14})?$/).optional(), mpn: text,
});
