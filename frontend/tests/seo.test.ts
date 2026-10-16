import test from "node:test";
import assert from "node:assert/strict";
import { listingUrl, pageNumber, jsonLd, plainText } from "../src/lib/seo";
test("pagination rejects invalid input and preserves relevant filters",()=>{
  for(const input of ["0","-1","1.5","abc","1e2","999999999999999999999"])assert.equal(pageNumber(input),null);
  assert.equal(pageNumber(undefined),1);assert.equal(pageNumber("2"),2);
  assert.equal(listingUrl({category:"dhanak-fabric",color:"Red",q:"shirt",sort:"price_asc",utm_source:"test"},2),"/shop?category=dhanak-fabric&color=Red&q=shirt&sort=price_asc&page=2");
  assert.equal(listingUrl({},1),"/shop");
});
test("structured data cannot close its script and normalization preserves Urdu",()=>{
  assert.ok(!jsonLd({name:"</script><script>alert(1)</script>"}).includes("<"));
  assert.equal(JSON.parse(jsonLd({name:"</script>"})).name,"</script>");
  assert.equal(plainText("*کپڑا*"),"کپڑا");
});
