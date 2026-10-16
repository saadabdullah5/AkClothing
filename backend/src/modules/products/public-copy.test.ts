import test from "node:test";
import assert from "node:assert/strict";
import { cleanCopy, publicCopy } from "./public-copy";
test("public formatting retains source records and meaningful language",()=>{
 const product={name:"NEW ARRIVALS WINTER COLLECTION 2027",description:"*کپڑا*\nShirt 2.5 metres\n100% GUARANTEED\nPRICE PKR 3999",category:{name:"Dhanak"},variants:[{sku:"AK-1"}]};
 const view=publicCopy(product);assert.equal(view.name,"Dhanak — AK-1");assert.ok(view.description.includes("کپڑا"));assert.ok(view.description.includes("2.5 metres"));assert.ok(!view.description.includes("3999"));assert.ok(product.description.includes("3999"));
 assert.equal(cleanCopy("*Plain trouser*"),"Plain trouser");
});
