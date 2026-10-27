import {indiaDay,previousDay,comparePrices} from "../lib/prices.mjs";
import {seedDemo,DEMO_DAY} from "./seed.mjs";
const json = (data,status=200) => Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const unavailable = () => json({error:"The database is temporarily unavailable. Please retry."},503);
export async function handleApi(request,db,token) {
  if (!db) return unavailable();
  try {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path === "/api/deals") {
      const found = await db.prepare("SELECT id FROM products LIMIT 1").first();
      if (!found) await seedDemo(db);
      const day=indiaDay(), yesterday=previousDay(day);
      const {results:products} = await db.prepare("SELECT * FROM products ORDER BY id").all();
      const {results:history} = await db.prepare("SELECT * FROM daily_prices ORDER BY day,observed_at").all();
      const deals=products.map(p=>{
        const source=p.demo?"demo":"feed";
        const rows=history.filter(h=>h.product_id===p.id && h.source===source && h.day<=day);
        const today=rows.find(h=>h.day===day), prev=rows.find(h=>h.day===yesterday), latest=rows.at(-1);
        const price=today?.price??latest?.price??null;
        return {...p,demo:Boolean(p.demo),price,today:today?.price??null,yesterday:prev?.price??null,comparison:comparePrices(today?.price,prev?.price),discount:price && p.mrp>price?Math.round((p.mrp-price)/p.mrp*100):0,observedAt:latest?.observed_at??null,history:rows.slice(-30),lowest:rows.length?Math.min(...rows.map(h=>h.price)):null};
      });
      return json({deals,day,yesterday,timezone:"Asia/Kolkata",demoDate:DEMO_DAY});
    }
    if (request.method === "POST" && path === "/api/clicks") {
      const body=await request.json().catch(()=>null);
      if (!body || typeof body.productId!=="string" || body.productId.length>100) return json({error:"Valid productId required"},400);
      const p=await db.prepare("SELECT id FROM products WHERE id=?").bind(body.productId).first();
      if (!p) return json({error:"Product not found"},404);
      await db.prepare("INSERT INTO clicks (product_id,clicked_at) VALUES (?,?)").bind(body.productId,new Date().toISOString()).run();
      return json({ok:true});
    }
    if (request.method === "POST" && path === "/api/products") {
      if (!token) return json({error:"Catalog import is not configured. Set PRICE_INGEST_TOKEN on the server."},503);
      if (request.headers.get("authorization")!==`Bearer ${token}`) return json({error:"Unauthorized"},401);
      const body=await request.json().catch(()=>null);
      if (!Array.isArray(body?.products)||body.products.length<1||body.products.length>100) return json({error:"Provide 1–100 products"},400);
      const prepared=[], seen=new Set();
      for (const p of body.products) {
        if (![p.id,p.retailerId,p.title,p.category,p.description,p.image,p.url].every(v=>typeof v==="string"&&v.length>0&&v.length<=2000)||!/[a-z0-9]/i.test(p.id)||p.id.length>100||!["Amazon","Flipkart"].includes(p.retailer)||!Number.isSafeInteger(p.mrpPaise)||p.mrpPaise<=0||seen.has(p.id)) return json({error:"Invalid or duplicate product. Required: id, retailer, retailerId, title, category, description, image, url, mrpPaise."},400);
        seen.add(p.id);
        let url,image;try{url=new URL(p.url);image=new URL(p.image);}catch{return json({error:"Product URL and image must be valid HTTPS URLs"},400);}
        const hosts=p.retailer==="Amazon"?["amazon.in","www.amazon.in"]:["flipkart.com","www.flipkart.com"];
        if(url.protocol!=="https:"||image.protocol!=="https:"||!hosts.includes(url.hostname)||url.username||url.password)return json({error:"Product URL must point to the selected retailer over HTTPS"},400);
        const existing=await db.prepare("SELECT retailer,retailer_id,demo FROM products WHERE id=?").bind(p.id).first();
        if(existing&&(existing.demo||existing.retailer!==p.retailer||existing.retailer_id!==p.retailerId))return json({error:"Existing listing identity is immutable. Use a new ID for a different retailer or variant."},409);
        prepared.push(db.prepare("INSERT INTO products (id,retailer,retailer_id,title,category,description,image,url,mrp,demo) VALUES (?,?,?,?,?,?,?,?,?,0) ON CONFLICT(id) DO UPDATE SET title=excluded.title,category=excluded.category,description=excluded.description,image=excluded.image,url=excluded.url,mrp=excluded.mrp").bind(p.id,p.retailer,p.retailerId,p.title,p.category,p.description,p.image,p.url,p.mrpPaise));
      }
      await db.batch(prepared);return json({ok:true,processed:prepared.length});
    }
    if (request.method === "POST" && path === "/api/prices") {
      if (!token) return json({error:"Price ingestion is not configured. Set PRICE_INGEST_TOKEN on the server."},503);
      if (request.headers.get("authorization")!==`Bearer ${token}`) return json({error:"Unauthorized"},401);
      const body=await request.json().catch(()=>null);
      if (!Array.isArray(body?.observations) || body.observations.length<1 || body.observations.length>100) return json({error:"Provide 1–100 observations"},400);
      const prepared=[];
      for (const o of body.observations) {
        if (typeof o.productId!=="string" || !Number.isSafeInteger(o.pricePaise) || o.pricePaise<=0 || o.pricePaise>1_000_000_000 || typeof o.observedAt!=="string") return json({error:"Each observation needs productId, positive integer pricePaise, and observedAt with timezone"},400);
        const at=new Date(o.observedAt);
        if (!/(Z|[+-]\d\d:\d\d)$/.test(o.observedAt) || Number.isNaN(at.getTime()) || at.getTime()>Date.now()+60_000) return json({error:"Invalid or future observedAt"},400);
        const p=await db.prepare("SELECT id,demo FROM products WHERE id=?").bind(o.productId).first();
        if (!p) return json({error:`Unknown product: ${o.productId}`},404);
        if (p.demo) return json({error:"Demo listings cannot receive live prices. Add a real retailer listing with demo=0 first."},400);
        prepared.push(db.prepare("INSERT INTO daily_prices (product_id,day,price,observed_at,source) VALUES (?,?,?,?,'feed') ON CONFLICT(product_id,day,source) DO UPDATE SET price=excluded.price,observed_at=excluded.observed_at WHERE excluded.observed_at>daily_prices.observed_at").bind(o.productId,indiaDay(at),o.pricePaise,at.toISOString()));
      }
      await db.batch(prepared);
      return json({ok:true,processed:prepared.length});
    }
    return json({error:"Not found"},404);
  } catch (error) {
    console.error("DealScout API:",error instanceof Error?error.message:"Database error");
    return unavailable();
  }
}
