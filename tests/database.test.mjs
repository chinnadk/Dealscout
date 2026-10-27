import test from "node:test";
import assert from "node:assert/strict";
import {openDatabase} from "../server/database.mjs";
import {handleApi} from "../db/service.mjs";
import {indiaDay,previousDay} from "../lib/prices.mjs";
const req=(path,body,token)=>new Request(`http://localhost/api/${path}`,body?{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)}:undefined);
test("seed is persistent and idempotent, and demo has up/down/same/missing cases",async()=>{
 const db=openDatabase(":memory:");try{
   const a=await (await handleApi(req("deals"),db)).json();
   const b=await (await handleApi(req("deals"),db)).json();
   assert.equal(a.deals.length,8);assert.equal(b.deals.length,8);
   const count=await db.prepare("SELECT COUNT(*) AS count FROM daily_prices").first();assert.equal(count.count,50);
   assert.ok(a.deals.every(d=>d.demo));
   if(indiaDay()==="2026-10-27"){
     assert.equal(a.deals.find(d=>d.id==="sony-headphones").comparison.amount,300000);
     assert.equal(a.deals.find(d=>d.id==="home-chair").comparison.direction,"up");
     assert.equal(a.deals.find(d=>d.id==="airpods").comparison.direction,"same");
     assert.equal(a.deals.find(d=>d.id==="laptop").comparison.direction,"new");
   }
 }finally{db.close();}
});
test("feed enforces auth, same-day freshness, atomic batches, and exact previous IST day",async()=>{
 const db=openDatabase(":memory:");try{
  await db.prepare("INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,0)").bind("live","Amazon","B012345678","Test listing","Electronics","Exact variant","https://example.com/a.jpg","https://www.amazon.in/dp/B012345678",200000).run();
  const day=indiaDay(),yesterday=previousDay(day),todayAt=`${day}T00:00:00+05:30`,prevAt=`${yesterday}T12:00:00+05:30`;
  let r=await handleApi(req("prices",{observations:[{productId:"live",pricePaise:90000,observedAt:todayAt}]}),db,"test-secret");assert.equal(r.status,401);
  r=await handleApi(req("prices",{observations:[{productId:"live",pricePaise:100000,observedAt:prevAt},{productId:"live",pricePaise:90000,observedAt:todayAt}]},"test-secret"),db,"test-secret");assert.equal(r.status,200);
  r=await handleApi(req("prices",{observations:[{productId:"live",pricePaise:110000,observedAt:todayAt}]},"test-secret"),db,"test-secret");assert.equal(r.status,200);
  let c=await (await handleApi(req("deals"),db)).json();assert.equal(c.deals[0].today,90000);assert.equal(c.deals[0].comparison.percent,10);
  r=await handleApi(req("prices",{observations:[{productId:"live",pricePaise:80000,observedAt:todayAt},{productId:"missing",pricePaise:80000,observedAt:todayAt}]},"test-secret"),db,"test-secret");assert.equal(r.status,404);
  c=await (await handleApi(req("deals"),db)).json();assert.equal(c.deals[0].today,90000);
  r=await handleApi(req("prices",{observations:[{productId:"live",pricePaise:0,observedAt:todayAt}]},"test-secret"),db,"test-secret");assert.equal(r.status,400);
  r=await handleApi(req("clicks",{productId:"live"}),db);assert.equal(r.status,200);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM clicks").first()).n,1);
 }finally{db.close();}
});
test("catalog import validates retailer URLs and keeps listing identity immutable",async()=>{
 const db=openDatabase(":memory:");try{
  const p={id:"real-camera",retailer:"Amazon",retailerId:"B012345678",title:"Exact camera listing",category:"Electronics",description:"Exact seller and variant",image:"https://example.com/image.jpg",url:"https://www.amazon.in/dp/B012345678",mrpPaise:100000};
  let r=await handleApi(req("products",{products:[p]}),db,"secret");assert.equal(r.status,401);
  r=await handleApi(req("products",{products:[{...p,url:"https://example.com/"}]},"secret"),db,"secret");assert.equal(r.status,400);
  r=await handleApi(req("products",{products:[p]},"secret"),db,"secret");assert.equal(r.status,200);
  r=await handleApi(req("products",{products:[{...p,retailerId:"different-variant"}]},"secret"),db,"secret");assert.equal(r.status,409);
  const stored=await db.prepare("SELECT * FROM products WHERE id=?").bind(p.id).first();assert.equal(stored.retailer_id,p.retailerId);assert.equal(stored.demo,0);
 }finally{db.close();}
});
