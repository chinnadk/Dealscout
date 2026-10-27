import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {openPostgres,postgresOptions} from "../server/postgres.mjs";
import {connectDatabase} from "../server/runtime-database.mjs";
import {handleApi} from "../db/service.mjs";
import {seedDemo} from "../db/seed.mjs";
import {indiaDay,previousDay} from "../lib/prices.mjs";

test("PostgreSQL configuration verifies remote TLS and never accepts another URL scheme",()=>{
 const config=postgresOptions("postgresql://example:placeholder@ep-example-pooler.neon.tech/neondb?sslmode=require&channel_binding=require");
 assert.equal(new URL(config.connectionString).searchParams.get("sslmode"),"verify-full");
 assert.equal(new URL(config.connectionString).searchParams.get("channel_binding"),"require");
 assert.equal(config.enableChannelBinding,true);
 assert.equal(config.max,5);
 assert.throws(()=>postgresOptions("https://example.com/database"),/PostgreSQL/);
 assert.throws(()=>postgresOptions("postgresql://example:placeholder@ep-example.neon.tech/neondb?sslmode=disable"),/TLS/);
});

test("a missing or invalid configured DATABASE_URL cannot silently select SQLite",async()=>{
 await assert.rejects(connectDatabase({databaseUrl:""}),/empty/);
 await assert.rejects(connectDatabase({databaseUrl:"not a connection string"}),/PostgreSQL/);
});

const testUrl=process.env.TEST_DATABASE_URL;
test("real PostgreSQL: API imports, atomic rollback, daily prices, and persistence across reconnect",{skip:!testUrl},async()=>{
 const base=new URL(testUrl);
 assert.ok(["127.0.0.1","localhost","[::1]"].includes(base.hostname),"Integration tests use a dedicated local PostgreSQL instance only.");
 const admin=new pg.Pool(postgresOptions(testUrl));
 const name=`dealscout_test_${process.pid}_${Date.now()}`;
 await admin.query(`CREATE DATABASE "${name}"`);
 const url=new URL(testUrl);url.pathname=`/${name}`;
 let db;
 const req=(path,body,token)=>new Request(`http://localhost/api/${path}`,body?{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)}:undefined);
 try {
  db=await openPostgres(url.href);
  assert.deepEqual(await (await handleApi(req("health"),db)).json(),{status:"ok",database:"postgresql"});
  const demo=await (await handleApi(req("deals"),db)).json();
  assert.equal(demo.deals.length,8);
  assert.ok(demo.deals.every(d=>typeof d.price==="number"&&typeof d.mrp==="number"));
  await seedDemo(db);
  assert.equal((await db.prepare("SELECT COUNT(*)::integer AS n FROM daily_prices").first()).n,50);

  const product={id:"pg-live",retailer:"Amazon",retailerId:"B012345678",title:"Camera ? 'quoted' $$",category:"Electronics",description:"Exact listing",image:"https://example.com/photo.jpg",url:"https://www.amazon.in/dp/B012345678",mrpPaise:3000000000};
  let response=await handleApi(req("products",{products:[product]}),db,"local-test");assert.equal(response.status,401);
  response=await handleApi(req("products",{products:[product]},"local-test"),db,"local-test");assert.equal(response.status,200);
  response=await handleApi(req("products",{products:[{...product,retailerId:"different"}]},"local-test"),db,"local-test");assert.equal(response.status,409);
  const day=indiaDay(), yesterday=previousDay(day);
  const at=`${day}T00:00:00+05:30`, prior=`${yesterday}T12:00:00+05:30`;
  response=await handleApi(req("prices",{observations:[{productId:product.id,pricePaise:2499000,observedAt:prior},{productId:product.id,pricePaise:2199000,observedAt:at}]},"local-test"),db,"local-test");assert.equal(response.status,200);
  response=await handleApi(req("prices",{observations:[{productId:product.id,pricePaise:9999000,observedAt:at}]},"local-test"),db,"local-test");assert.equal(response.status,200);
  let catalog=await (await handleApi(req("deals"),db)).json();
  const live=catalog.deals.find(d=>d.id===product.id);
  assert.equal(live.today,2199000);assert.equal(live.yesterday,2499000);assert.equal(live.comparison.amount,300000);assert.equal(live.comparison.percent,12);
  assert.equal(live.mrp,3000000000);assert.equal(live.title,product.title);

  // The second insert fails a real FK constraint: the first must roll back.
  await assert.rejects(db.batch([
    db.prepare("INSERT INTO clicks (product_id,clicked_at) VALUES (?,?)").bind(product.id,new Date().toISOString()),
    db.prepare("INSERT INTO clicks (product_id,clicked_at) VALUES (?,?)").bind("nonexistent",new Date().toISOString()),
  ]));
  assert.equal((await db.prepare("SELECT COUNT(*)::integer AS n FROM clicks").first()).n,0);
  assert.equal((await handleApi(req("clicks",{productId:product.id}),db)).status,200);

  await db.close();db=await openPostgres(url.href);
  catalog=await (await handleApi(req("deals"),db)).json();
  assert.equal(catalog.deals.length,9);
  assert.equal(catalog.deals.find(d=>d.id===product.id).today,2199000);
  assert.equal((await db.prepare("SELECT COUNT(*)::integer AS n FROM clicks").first()).n,1);
  assert.equal((await db.prepare("SELECT COUNT(*)::integer AS n FROM _dealscout_pg_migrations").first()).n,1);
 } finally {
  if(db)await db.close();
  await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  await admin.end();
 }
});
