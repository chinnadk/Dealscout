declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PRICE_INGEST_TOKEN?: string;
  }
}
