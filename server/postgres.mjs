import pg from "pg";
import {createHash} from "node:crypto";
import {readFile,readdir} from "node:fs/promises";

// Neon connections use TLS with certificate verification. Never log this URL.
export function postgresOptions(connectionString) {
  let url;
  try { url=new URL(connectionString); } catch { throw new Error("DATABASE_URL must be a PostgreSQL connection string."); }
  if(!["postgres:","postgresql:"].includes(url.protocol)||!url.hostname||url.pathname.length<2) {
    throw new Error("DATABASE_URL must include a PostgreSQL host and database name.");
  }
  const local=["localhost","127.0.0.1","[::1]"].includes(url.hostname);
  if(!local) {
    if(url.searchParams.get("sslmode")==="disable") throw new Error("Remote PostgreSQL connections require TLS.");
    // pg parses SSL options in the URL, so set the verified mode there instead
    // of passing a second ssl object that the URL could silently override.
    url.searchParams.set("sslmode","verify-full");
  }
  return {connectionString:url.href,max:5,idleTimeoutMillis:30_000,connectionTimeoutMillis:15_000,
    statement_timeout:15_000,query_timeout:20_000,enableChannelBinding:true,application_name:"dealscout"};
}

function numberedSql(sql) {
  // This adapter accepts only the fixed SQL authored by this application.
  // Product values always go separately to pg; they are never interpolated.
  let position=0;
  return sql.replace(/\?/g,()=>`$${++position}`);
}

function normalizeRow(row) {
  // pg returns BIGINT as text. Keep integer paise numeric across all adapters.
  const result={...row};
  for(const key of ["price","mrp"]) {
    if(typeof result[key]==="string") {
      const value=Number(result[key]);
      if(!Number.isSafeInteger(value))throw new Error("Stored price exceeds the supported integer range.");
      result[key]=value;
    }
  }
  return result;
}

async function migrate(pool) {
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    // The transaction-scoped lock works with Neon's pooled connection URL and
    // serializes startup migrations across overlapping service restarts.
    await client.query("SELECT pg_advisory_xact_lock($1)",[642107271]);
    await client.query("CREATE TABLE IF NOT EXISTS _dealscout_pg_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)");
    const folder=new URL("./migrations/postgres/",import.meta.url);
    for(const name of (await readdir(folder)).filter(name=>name.endsWith(".sql")).sort()) {
      const sql=(await readFile(new URL(name,folder),"utf8")).replace(/\r\n/g,"\n");
      const checksum=createHash("sha256").update(sql).digest("hex");
      const applied=await client.query("SELECT checksum FROM _dealscout_pg_migrations WHERE name=$1",[name]);
      if(applied.rows.length) {
        if(applied.rows[0].checksum!==checksum)throw new Error("An applied PostgreSQL migration was changed. Restore it and append a new migration.");
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO _dealscout_pg_migrations (name,checksum) VALUES ($1,$2)",[name,checksum]);
    }
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>{});
    throw error;
  } finally { client.release(); }
}

export async function openPostgres(connectionString) {
  const pool=new pg.Pool(postgresOptions(connectionString));
  pool.on("error",()=>console.error("PostgreSQL idle connection closed; the pool will reconnect."));
  try { await migrate(pool); } catch(error) { await pool.end(); throw error; }
  function statement(sql,values=[]) {
    const query=()=>pool.query(numberedSql(sql),values);
    return {
      bind(...bound) { return statement(sql,bound); },
      async all() { return {results:(await query()).rows.map(normalizeRow)}; },
      async first() { const result=await query();return result.rows.length?normalizeRow(result.rows[0]):null; },
      async run() { const result=await query();return {changes:result.rowCount}; },
      _sql:sql,_values:values,
    };
  }
  return {
    kind:"postgresql",
    prepare:sql=>statement(sql),
    async batch(statements) {
      const client=await pool.connect();
      try {
        await client.query("BEGIN");
        const results=[];
        for(const statement of statements)results.push(await client.query(numberedSql(statement._sql),statement._values));
        await client.query("COMMIT");return results;
      } catch(error) { await client.query("ROLLBACK").catch(()=>{});throw error; }
      finally { client.release(); }
    },
    close:()=>pool.end(),
  };
}
