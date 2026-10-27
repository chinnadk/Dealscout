// Fixed demo observations, never regenerated or relabeled as live retailer data.
export const DEMO_DAY = "2026-10-27";
const photo = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=85`;
export const demoProducts = [
  {id:"sony-headphones",retailer:"Amazon",retailerId:"demo-sony-wh",title:"Sony WH-1000XM5",category:"Electronics",description:"Wireless noise-cancelling headphones · Black",image:photo("photo-1546435770-a3e426bf472b"),mrp:3499000,prices:[2899000,2799000,2799000,2699000,2699000,2499000,2199000],query:"Sony WH-1000XM5"},
  {id:"apple-watch",retailer:"Flipkart",retailerId:"demo-watch",title:"Apple Watch SE",category:"Wearables",description:"GPS · 40 mm · Midnight aluminium",image:photo("photo-1544117519-31a4b719223d"),mrp:2990000,prices:[2690000,2590000,2590000,2490000,2490000,2490000,2190000],query:"Apple Watch SE 40mm"},
  {id:"nike-air",retailer:"Flipkart",retailerId:"demo-air",title:"Nike Air Max 270",category:"Fashion",description:"Everyday comfort · Men's sneakers",image:photo("photo-1542291026-7eec264c27ff"),mrp:1399500,prices:[1199500,1149500,1099500,1099500,999500,999500,799500],query:"Nike Air Max 270"},
  {id:"canon-camera",retailer:"Amazon",retailerId:"demo-camera",title:"Canon EOS R50",category:"Electronics",description:"Mirrorless camera · RF-S 18–45 mm kit",image:photo("photo-1516035069371-29a1b244cc32"),mrp:7599500,prices:[7199500,7199500,6999500,6999500,6799500,6799500,6299500],query:"Canon EOS R50 kit"},
  {id:"airpods",retailer:"Amazon",retailerId:"demo-airpods",title:"Apple AirPods Pro",category:"Electronics",description:"2nd generation · USB-C charging case",image:photo("photo-1606220945770-b5b6c2c55bf1"),mrp:2490000,prices:[2290000,2290000,2190000,2190000,2090000,1890000,1890000],query:"AirPods Pro 2 USB C"},
  {id:"home-chair",retailer:"Flipkart",retailerId:"demo-chair",title:"The Everyday Lounge Chair",category:"Home & Living",description:"Modern accent chair · Soft-touch upholstery",image:photo("photo-1598300042247-d088f8ab3a91"),mrp:1299900,prices:[1099900,999900,999900,899900,899900,799900,849900],query:"lounge accent chair"},
  {id:"skincare",retailer:"Amazon",retailerId:"demo-skincare",title:"Daily Hydration Essentials",category:"Beauty",description:"Cleanser & moisturiser · Everyday skin care",image:photo("photo-1556229010-6c3f2c9ca5f8"),mrp:249900,prices:[219900,219900,199900,199900,179900,179900,149900],query:"hydrating skincare set"},
  {id:"laptop",retailer:"Flipkart",retailerId:"demo-laptop",title:"ASUS Vivobook 15",category:"Laptops",description:"Intel Core i5 · 16 GB RAM · 512 GB SSD",image:photo("photo-1496181133206-80ce9b88a853"),mrp:6599000,prices:[null,null,null,null,null,null,4699000],query:"ASUS Vivobook 15 i5 16GB"},
];
export async function seedDemo(db) {
  const statements = [];
  for (const p of demoProducts) {
    const url = p.retailer === "Amazon" ? `https://www.amazon.in/s?k=${encodeURIComponent(p.query)}` : `https://www.flipkart.com/search?q=${encodeURIComponent(p.query)}`;
    statements.push(db.prepare("INSERT OR IGNORE INTO products (id,retailer,retailer_id,title,category,description,image,url,mrp,demo) VALUES (?,?,?,?,?,?,?,?,?,1)").bind(p.id,p.retailer,p.retailerId,p.title,p.category,p.description,p.image,url,p.mrp));
    p.prices.forEach((price,i) => {
      if (price === null) return;
      const day = `2026-10-${21+i}`;
      statements.push(db.prepare("INSERT OR IGNORE INTO daily_prices (product_id,day,price,observed_at,source) VALUES (?,?,?,?,'demo')").bind(p.id,day,price,`${day}T07:00:00.000Z`));
    });
  }
  await db.batch(statements);
}
