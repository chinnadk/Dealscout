import {DatabaseSync} from "node:sqlite";
import {readdirSync,readFileSync,mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
export function openDatabase(filename=process.env.DATABASE_PATH||"./data/dealscout.sqlite") {
 if(filename!==":memory:")mkdirSync(dirname(resolve(filename)),{recursive:true});
 const sqlite=new DatabaseSync(filename);
 sqlite.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
 sqlite.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)");
 const folder=fileURLToPath(new URL("../drizzle/",import.meta.url));
 for(const file of readdirSync(folder).filter(f=>f.endsWith(".sql")).sort()) {
   if(sqlite.prepare("SELECT name FROM _migrations WHERE name=?").get(file))continue;
   sqlite.exec("BEGIN");
   try{sqlite.exec(readFileSync(resolve(folder,file),"utf8"));sqlite.prepare("INSERT INTO _migrations(name) VALUES (?)").run(file);sqlite.exec("COMMIT");}catch(e){sqlite.exec("ROLLBACK");throw e;}
 }
 function statement(sql,values=[]){return {bind(...v){return statement(sql,v);},async all(){return {results:sqlite.prepare(sql).all(...values)};},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){return sqlite.prepare(sql).run(...values);},_sql:sql,_values:values};}
 return {prepare:sql=>statement(sql),async batch(statements){sqlite.exec("BEGIN IMMEDIATE");try{const results=statements.map(s=>sqlite.prepare(s._sql).run(...s._values));sqlite.exec("COMMIT");return results;}catch(e){sqlite.exec("ROLLBACK");throw e;}},close:()=>sqlite.close()};
}
