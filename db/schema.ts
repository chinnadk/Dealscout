import { sqliteTable, text, integer, primaryKey, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// One row per exact retailer listing/variant; never compare unrelated sellers.
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  retailer: text("retailer", { enum: ["Amazon", "Flipkart"] }).notNull(),
  retailerId: text("retailer_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  url: text("url").notNull(),
  mrp: integer("mrp").notNull(),
  demo: integer("demo", { mode: "boolean" }).notNull().default(true),
}, t => [check("mrp_positive", sql`${t.mrp} > 0`)]);

// Integer paise; keep the last observation for each IST calendar day and source.
export const dailyPrices = sqliteTable("daily_prices", {
  productId: text("product_id").notNull().references(() => products.id),
  day: text("day").notNull(),
  price: integer("price").notNull(),
  observedAt: text("observed_at").notNull(),
  source: text("source", { enum: ["demo", "feed"] }).notNull(),
}, t => [primaryKey({ columns: [t.productId, t.day, t.source] }), index("prices_day_idx").on(t.day), check("price_positive", sql`${t.price} > 0`)]);

export const clicks = sqliteTable("clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: text("product_id").notNull().references(() => products.id),
  clickedAt: text("clicked_at").notNull(),
});
