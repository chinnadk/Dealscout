import test from "node:test";
import assert from "node:assert/strict";
import {indiaDay,previousDay,comparePrices} from "../lib/prices.mjs";
test("IST calendar rollover, year and leap boundaries",()=>{
  assert.equal(indiaDay(new Date("2026-10-26T18:29:59Z")),"2026-10-26");
  assert.equal(indiaDay(new Date("2026-10-26T18:30:00Z")),"2026-10-27");
  assert.equal(indiaDay(new Date("2026-12-31T18:30:00Z")),"2027-01-01");
  assert.equal(previousDay("2026-03-01"),"2026-02-28");
  assert.equal(previousDay("2028-03-01"),"2028-02-29");
});
test("daily change uses yesterday's selling price, in paise",()=>{
  assert.deepEqual(comparePrices(2199000,2499000),{direction:"down",amount:300000,percent:12});
  assert.deepEqual(comparePrices(849900,799900),{direction:"up",amount:50000,percent:6.3});
  assert.deepEqual(comparePrices(1890000,1890000),{direction:"same",amount:0,percent:0});
});
test("missing or zero prices cannot fabricate drops or divide by zero",()=>{
  assert.equal(comparePrices(null,10000).direction,"missing");
  assert.equal(comparePrices(10000,null).direction,"new");
  assert.equal(comparePrices(10000,0).percent,null);
  assert.equal(comparePrices(0,10000).direction,"missing");
});
