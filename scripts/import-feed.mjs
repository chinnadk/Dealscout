// Import a normalized export from an authorized product feed. No scraping.
import {readFile} from "node:fs/promises";
const [filename]=process.argv.slice(2);
if(!filename||!process.env.PRICE_INGEST_TOKEN)throw new Error("Usage: set PRICE_INGEST_TOKEN and run node scripts/import-feed.mjs feed.json. Set DEALSCOUT_URL for a non-local server.");
const base=process.env.DEALSCOUT_URL||"http://127.0.0.1:3000";
const feed=JSON.parse(await readFile(filename,"utf8"));
for(const [key,path] of [["products","products"],["observations","prices"]]){
 const items=feed[key];if(!items?.length)continue;
 for(let i=0;i<items.length;i+=100){
  const r=await fetch(new URL(`/api/${path}`,base),{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.PRICE_INGEST_TOKEN}`},body:JSON.stringify({[key]:items.slice(i,i+100)})});
  const result=await r.json();if(!r.ok)throw new Error(`Import failed (${r.status}): ${result.error}`);
  console.log(`${path}: processed ${result.processed}`);
 }
}
