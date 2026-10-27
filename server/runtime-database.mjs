export async function connectDatabase({databaseUrl=process.env.DATABASE_URL,filename=process.env.DATABASE_PATH||"./data/dealscout.sqlite"}={}) {
  if(databaseUrl!==undefined) {
    if(typeof databaseUrl!=="string"||!databaseUrl.trim())throw new Error("DATABASE_URL is set but empty. Copy the full PostgreSQL connection string into Render.");
    const {openPostgres}=await import("./postgres.mjs");
    // A configured PostgreSQL failure must never fall back to an ephemeral file.
    return openPostgres(databaseUrl.trim());
  }
  const {openDatabase}=await import("./database.mjs");
  return openDatabase(filename);
}
