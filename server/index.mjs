import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {handleApi} from "../db/service.mjs";
import {connectDatabase} from "./runtime-database.mjs";
let db;
try { db=await connectDatabase(); }
catch(error) {
 console.error("Database startup failed. Check DATABASE_URL and Neon connectivity. No SQLite fallback was used.");
 if(typeof error.code==="string"&&/^[A-Z0-9_]{1,40}$/.test(error.code))console.error(`Database error code: ${error.code}`);
 process.exit(1);
}
const root=resolve("node-dist"),port=Number(process.env.PORT||3000),host=process.env.HOST||"127.0.0.1";
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon"};
const server=createServer(async(req,res)=>{
 try{
   const url=new URL(req.url||"/",`http://localhost:${port}`);
   if(url.pathname.startsWith("/api/")){
     const chunks=[];let size=0;
     for await(const chunk of req){size+=chunk.length;if(size>100_000){res.writeHead(413);res.end("Request too large");return;}chunks.push(chunk);}
     const request=new Request(url,{method:req.method,headers:req.headers,body:chunks.length?Buffer.concat(chunks):undefined});
     const response=await handleApi(request,db,process.env.PRICE_INGEST_TOKEN);
     res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
   }
   if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405,{Allow:"GET, HEAD"});res.end();return;}
   const filename=resolve(root,"."+decodeURIComponent(url.pathname));
   if(filename!==root&&!filename.startsWith(root+sep)){res.writeHead(403);res.end("Forbidden");return;}
   let target=filename;
   try{if((await stat(target)).isDirectory())target=resolve(target,"index.html");if(!(await stat(target)).isFile())throw new Error("Not a file");}catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Page not found. Visit / for DealScout.");return;}
   const body=await readFile(target);
   res.writeHead(200,{"Content-Type":types[extname(target)]||"application/octet-stream","X-Content-Type-Options":"nosniff","Cache-Control":target.includes(sep+"assets"+sep)?"public, max-age=31536000, immutable":"no-cache"});res.end(req.method==="HEAD"?undefined:body);
 }catch{res.writeHead(500,{"Content-Type":"text/plain"});res.end("Unable to serve this request. Run npm run build:node before starting.");}
});
server.listen(port,host,()=>console.log(`DealScout React + Node.js: http://${host}:${port} (database: ${db.kind})`));
for(const signal of ["SIGTERM","SIGINT"])process.on(signal,()=>server.close(async()=>{await db.close();process.exit(0);}));
