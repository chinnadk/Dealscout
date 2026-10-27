import { env } from "cloudflare:workers";
import { handleApi } from "@/db/service.mjs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return handleApi(request,env.DB,env.PRICE_INGEST_TOKEN); }
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")||0)>100_000) return Response.json({error:"Request too large"},{status:413});
  return handleApi(request,env.DB,env.PRICE_INGEST_TOKEN);
}
